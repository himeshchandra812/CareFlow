import {
  getDoctors,
  getDepartmentById,
  getDepartments,
  getQueueByAppointmentId,
  getAppointments,
  getHospitalNavigation,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment
} from '../../db/mongo.js';
import {
  SarvamIntentResponse,
  SupportedLanguage,
  Doctor,
  Appointment,
  QueueState,
  HospitalLocation
} from '../../types/index.js';

export interface ConversationalContext {
  lastIntent?: string;
  lastDepartment?: string;
  lastDoctorId?: string;
  lastDoctorName?: string;
  pendingAction?: 'book' | 'cancel' | 'reschedule';
  appointmentId?: string;
}

export type ValidIntent =
  | 'find_doctor'
  | 'find_department'
  | 'book_appointment'
  | 'view_appointment'
  | 'check_queue'
  | 'navigate_hospital'
  | 'appointment_preparation'
  | 'cancel_appointment'
  | 'reschedule_appointment'
  | 'help'
  | 'unknown';

export async function processSarvamNLU(
  message: string,
  language: SupportedLanguage = 'en',
  context: ConversationalContext = {}
): Promise<SarvamIntentResponse> {
  const text = message.trim().toLowerCase();
  const apiKey = process.env.SARVAM_API_KEY;

  console.log(`[Sarvam NLU Engine] Message: "${text}", Lang: ${language}, Context:`, context);

  let rawIntentObj: any = null;

  if (apiKey) {
    try {
      const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          model: 'sarvam-2b',
          messages: [
            {
              role: 'system',
              content: `You are Sarvam AI for CareFlow Hospital. Extract intent into JSON format:
{
  "intent": "find_doctor" | "find_department" | "book_appointment" | "view_appointment" | "check_queue" | "navigate_hospital" | "appointment_preparation" | "cancel_appointment" | "reschedule_appointment" | "help",
  "department": "Cardiology" | "Orthopedics" | "Neurology" | "General Medicine" | "Pediatrics" | "Dermatology" | "Ophthalmology" | "ENT",
  "date": "today" | "tomorrow" | "YYYY-MM-DD",
  "timePreference": "morning" | "afternoon" | "evening",
  "doctorName": string,
  "timeSlot": string
}`
            },
            { role: 'user', content: message }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          try {
            rawIntentObj = JSON.parse(content);
          } catch {}
        }
      }
    } catch (err) {
      console.warn('[Sarvam NLU Engine] Sarvam API unavailable, using resilient fallback parser:', err);
    }
  }

  // Fallback to resilient multilingual NLU parser if API is absent or fails
  if (!rawIntentObj || !rawIntentObj.intent) {
    rawIntentObj = parseMultilingualRuleEngine(text, language, context);
  }

  // Strictly validate intent against allowed schema & execute backend action with MongoDB
  return await validateAndExecuteIntent(rawIntentObj, language, context);
}

function parseMultilingualRuleEngine(
  text: string,
  lang: SupportedLanguage,
  context: ConversationalContext
): any {
  // Multi-turn context resolution: e.g. Patient previously asked "Find me a cardiologist", now says "Tomorrow morning"
  if (
    context.lastIntent === 'find_doctor' &&
    (text.includes('tomorrow') ||
      text.includes('morning') ||
      text.includes('kal') ||
      text.includes('subah') ||
      text.includes('రేపు') ||
      text.includes('ఉదయం') ||
      text.includes('நாளை'))
  ) {
    return {
      intent: 'find_doctor',
      department: context.lastDepartment || 'Cardiology',
      date: 'tomorrow',
      timePreference: 'morning'
    };
  }

  const isHeart = /heart|cardio|dil|hdayam|hdaya|hrudayam|కార్డియాలజిస్ట్|గుండె|दिल|कार्डियोलॉजिस्ट|हृदय|இதயம்|கார்டியா/i.test(text);
  const isOrtho = /bone|joint|ortho|haddi|hadlu|elumbu|ఎముక|ఆర్థోపెడిక్|हड्डी|ऑर्थोपेडिक/i.test(text);
  const isNeuro = /brain|neuro|dimaag|headache|migraine|నరాల|న్యూరో|दिमाग|न्यूरो/i.test(text);
  const isGenMed = /fever|cough|cold|physician|bukhar|dawa|జ్వరం|बुखार|चिकित्सक/i.test(text);
  const isPeds = /child|baby|peds|pediatric|baccha|pilla|పిల్లల|बच्चा|बाल रोग/i.test(text);
  const isDerm = /skin|dermatologist|pimple|rash|twacha|చర్మ|त्वचा/i.test(text);
  const isEye = /eye|vision|eyes|ophthalmologist|aankh|kallu|కంటి|आंख|नेत्र/i.test(text);
  const isENT = /ear|nose|throat|ent|kaan|naak|gala|చవి|ముక్కు|గొంతు|कान|नाक|गला/i.test(text);

  let dept: string | undefined;
  if (isHeart) dept = 'Cardiology';
  else if (isOrtho) dept = 'Orthopedics';
  else if (isNeuro) dept = 'Neurology';
  else if (isPeds) dept = 'Pediatrics';
  else if (isDerm) dept = 'Dermatology';
  else if (isEye) dept = 'Ophthalmology';
  else if (isENT) dept = 'ENT';
  else if (isGenMed) dept = 'General Medicine';

  const isFollowUp = /follow-up|followup|follow up|dubaara|dobara|phir se|phir|mallee|malli|రుడు/i.test(text);
  const isNewVisit = /new visit|first time|pehli baar|naya|kotha|కొత్త/i.test(text);
  const detectedVisitType = isFollowUp ? 'follow_up' : isNewVisit ? 'new_visit' : undefined;

  // 1. Queue check intent
  if (/queue|token|wait|ahead|position|kitni der|kitna time|లైన్|టోకెన్|ఎంత సమయం|वेटिंग|कतार/i.test(text)) {
    return { intent: 'check_queue' };
  }

  // 2. Navigation / Map check intent
  if (/where is|direction|route|map|where do i go|kahan hai|kidhar|rashta|ఎక్కడ|దోవ|మార్గం|कहां है|रास्ता/i.test(text)) {
    return { intent: 'navigate_hospital', department: dept || context.lastDepartment };
  }

  // 3. Preparation check intent
  if (/bring|prepare|preparation|what should i bring|what do i need to bring|documents|reports|kya lana hai|తెేవాలి|क्या लाना/i.test(text)) {
    return { intent: 'appointment_preparation', department: dept || context.lastDepartment };
  }

  // 4. Cancellation check intent
  if (/cancel|radd|cancle|रद्द|రద్దు/i.test(text)) {
    return { intent: 'cancel_appointment' };
  }

  // 5. Reschedule check intent
  if (/reschedule|move|postpone|badlo|change date|మార్చు|बदलो/i.test(text)) {
    return { intent: 'reschedule_appointment' };
  }

  // 6. View appointment intent
  if (/my appointment|show my appointment|when is|details|kab hai|ఎప్పుడు|कब है|அப்பாயின்ட்மென்ட்/i.test(text)) {
    return { intent: 'view_appointment' };
  }

  // 7. Booking intent
  if (/book|schedule|take appointment|appointment book|బుక్|बुकिंग|பதிவு/i.test(text)) {
    return { intent: 'book_appointment', department: dept, date: 'tomorrow', visitType: detectedVisitType };
  }

  // 8. Department Discovery intent
  if (/department|departments|specialties|विभाग|విభాగాలు/i.test(text)) {
    return { intent: 'find_department', department: dept };
  }

  // 9. Doctor discovery intent
  if (dept || /find|search|doctor|specialist|chahiye|kaavali|డాక్టర్|डॉक्टर/i.test(text)) {
    const isTomorrow = /tomorrow|kal|subah|kal subah|రేపు|రేపు ఉదయం|कल|कल सुबह/i.test(text);
    return {
      intent: 'find_doctor',
      department: dept || 'Cardiology',
      date: isTomorrow ? 'tomorrow' : 'today',
      timePreference: 'morning',
      visitType: detectedVisitType
    };
  }

  return { intent: 'help' };
}

async function validateAndExecuteIntent(
  raw: any,
  lang: SupportedLanguage,
  context: ConversationalContext
): Promise<SarvamIntentResponse> {
  const allowedIntents: ValidIntent[] = [
    'find_doctor',
    'find_department',
    'book_appointment',
    'view_appointment',
    'check_queue',
    'navigate_hospital',
    'appointment_preparation',
    'cancel_appointment',
    'reschedule_appointment',
    'help'
  ];

  const intent: ValidIntent = allowedIntents.includes(raw.intent) ? raw.intent : 'help';
  const deptName = raw.department || context.lastDepartment || 'Cardiology';

  // 1. Doctor Discovery Intent
  if (intent === 'find_doctor') {
    const docs = await getDoctors({ search: deptName });
    const matched = docs.length > 0 ? docs : await getDoctors();

    let textResp = '';
    if (lang === 'hi') {
      textResp = `मुझे ${deptName} विभाग में ${matched.length} डॉक्टर मिले हैं। Dr. ${matched[0]?.name} ${raw.date === 'tomorrow' ? 'कल सुबह' : 'आज'} उपलब्ध हैं।`;
    } else if (lang === 'te') {
      textResp = `నాకు ${deptName} విభాగంలో ${matched.length} డాక్టర్లు లభించారు. Dr. ${matched[0]?.name} ${raw.date === 'tomorrow' ? 'రేపు ఉదయం' : 'ఈ రోజు'} అందుబాటులో ఉన్నారు.`;
    } else {
      textResp = `I found ${matched.length} doctor(s) in ${deptName}. ${matched[0]?.name} is available ${raw.date === 'tomorrow' ? 'tomorrow morning' : 'today'} at ${matched[0]?.nextAvailableSlot}.`;
    }

    return {
      intent: 'find_doctor',
      department: deptName,
      date: raw.date || 'tomorrow',
      timePreference: raw.timePreference || 'morning',
      language: lang,
      responseText: textResp,
      matchedDoctors: matched,
      extractedParams: { context: { lastIntent: 'find_doctor', lastDepartment: deptName } }
    };
  }

  // 2. Department Discovery Intent
  if (intent === 'find_department') {
    const depts = await getDepartments();
    const target = depts.find((d) => d.name.toLowerCase() === deptName.toLowerCase()) || depts[0];

    return {
      intent: 'find_department',
      department: target.name,
      language: lang,
      responseText: `CareFlow ${target.name} Department is located at ${target.block}, ${target.floor} (${target.location}).`,
      extractedParams: { department: target }
    };
  }

  // 3. View Appointment Intent
  if (intent === 'view_appointment') {
    const appts = await getAppointments();
    const activeApp =
      appts.find((a) => a.status === 'confirmed' || a.status === 'arrived' || a.status === 'waiting' || a.status === 'in_progress') ||
      appts[0];

    if (activeApp) {
      return {
        intent: 'view_appointment',
        language: lang,
        responseText: `Your appointment is with ${activeApp.doctorName} (${activeApp.departmentName}) on ${activeApp.appointmentDate} at ${activeApp.appointmentTime}. Token: ${activeApp.tokenNumber}.`,
        extractedParams: { appointment: activeApp }
      };
    }

    return {
      intent: 'view_appointment',
      language: lang,
      responseText: 'You currently have no scheduled appointments. Would you like to find a doctor and book one?'
    };
  }

  // 4. Queue Check Intent
  if (intent === 'check_queue') {
    const appts = await getAppointments();
    const activeApp =
      appts.find((a) => a.status === 'arrived' || a.status === 'waiting' || a.status === 'in_progress' || a.status === 'confirmed') ||
      appts[0];

    if (activeApp) {
      const q = await getQueueByAppointmentId(activeApp._id);
      let textResp = '';
      if (lang === 'hi') {
        textResp = `आपका टोकन नंबर ${q?.patientToken || activeApp.tokenNumber} है। वर्तमान में टोकन ${q?.currentToken || 'A-116'} चल रहा है। आगे ${q?.patientsAhead || 5} मरीज हैं। अनुमानित प्रतीक्षा समय लगभग ${q?.estimatedWaitTime || 15} मिनट है।`;
      } else if (lang === 'te') {
        textResp = `మీ టోకెన్ నంబర్ ${q?.patientToken || activeApp.tokenNumber}. ప్రస్తుతం ${q?.currentToken || 'A-116'} నడుస్తోంది. మీ ముందు ${q?.patientsAhead || 5} మంది రోగులు ఉన్నారు. సుమారు ${q?.estimatedWaitTime || 15} నిమిషాల సమయం పడుతుంది.`;
      } else {
        textResp = `Your token is ${q?.patientToken || activeApp.tokenNumber}. Current token consulting is ${q?.currentToken || 'A-116'}. There are ${q?.patientsAhead || 5} patients ahead of you. Estimated wait is ~${q?.estimatedWaitTime || 15} minutes.`;
      }

      return {
        intent: 'check_queue',
        language: lang,
        responseText: textResp,
        extractedParams: { queueState: q, appointment: activeApp }
      };
    }

    return {
      intent: 'check_queue',
      language: lang,
      responseText: 'You have no active waiting appointments in the queue right now.'
    };
  }

  // 5. Hospital Navigation Intent
  if (intent === 'navigate_hospital') {
    const navs = await getHospitalNavigation(deptName);
    const loc = navs[0];

    return {
      intent: 'navigate_hospital',
      department: deptName,
      language: lang,
      responseText: `${deptName} Department is located at ${loc ? `${loc.block}, ${loc.floor}, ${loc.roomNumber}` : 'Block B, 2nd Floor (Wing East)'}. Follow the digital hospital wayfinding map.`,
      extractedParams: { location: loc, departmentName: deptName }
    };
  }

  // 6. Appointment Preparation Intent
  if (intent === 'appointment_preparation') {
    const depts = await getDepartments();
    const target = depts.find((d) => d.name.toLowerCase() === deptName.toLowerCase()) || depts[0];

    return {
      intent: 'appointment_preparation',
      department: target.name,
      language: lang,
      responseText: `Before your ${target.name} appointment: Please bring previous medical reports, daily prescriptions, and photo ID. ${target.preparationInstructions.join(' ')}`,
      extractedParams: { instructions: target.preparationInstructions, department: target }
    };
  }

  // 7. Booking with Confirmation
  if (intent === 'book_appointment') {
    const docs = await getDoctors({ search: deptName });
    const targetDoc = docs[0] || (await getDoctors())[0];

    return {
      intent: 'book_appointment',
      doctorName: targetDoc.name,
      department: targetDoc.departmentName,
      language: lang,
      responseText: `I found an appointment with ${targetDoc.name} (${targetDoc.departmentName}) tomorrow at ${targetDoc.nextAvailableSlot}. Would you like me to book it?`,
      extractedParams: { doctor: targetDoc, requiresConfirmation: true }
    };
  }

  // 8. Cancellation with Confirmation
  if (intent === 'cancel_appointment') {
    const appts = await getAppointments();
    const activeApp = appts.find((a) => a.status === 'confirmed' || a.status === 'waiting' || a.status === 'arrived');

    return {
      intent: 'cancel_appointment',
      language: lang,
      responseText: activeApp
        ? `Are you sure you want to cancel your appointment with ${activeApp.doctorName} at ${activeApp.appointmentTime} on ${activeApp.appointmentDate}?`
        : `I couldn't find an active upcoming appointment to cancel.`,
      extractedParams: { appointment: activeApp, requiresConfirmation: !!activeApp }
    };
  }

  // 9. Reschedule with Confirmation
  if (intent === 'reschedule_appointment') {
    const appts = await getAppointments();
    const activeApp = appts.find((a) => a.status === 'confirmed' || a.status === 'waiting' || a.status === 'arrived');

    return {
      intent: 'reschedule_appointment',
      language: lang,
      responseText: activeApp
        ? `I found your appointment with ${activeApp.doctorName} on ${activeApp.appointmentDate} at ${activeApp.appointmentTime}. Would you like to select a new slot?`
        : `I couldn't find an active appointment to reschedule.`,
      extractedParams: { appointment: activeApp, requiresConfirmation: !!activeApp }
    };
  }

  // 10. Help Intent
  return {
    intent: 'help',
    language: lang,
    responseText:
      lang === 'hi'
        ? 'मैं केयरफ्लो वॉयस असिस्टेंट हूं। आप डॉक्टर खोज सकते हैं, अपना टोकन चेक कर सकते हैं, अस्पताल का रास्ता पूछ सकते हैं या अपॉइंटमेंट बदल सकते हैं।'
        : lang === 'te'
        ? 'నేను కేర్‌ఫ్లో వాయిస్ అసిస్టెంట్‌ని. మీరు డాక్టర్ల శోధన, క్యూ వివరాలు, హాస్పిటల్ మ్యాప్ లేదా అపాయింట్‌మెంట్ రద్దు కోసం అడగవచ్చు.'
        : 'Hello! I am CareFlow Voice Assistant. You can ask me to find a doctor, check your queue, navigate the hospital, view preparation guidelines, or manage your appointment.'
  };
}
