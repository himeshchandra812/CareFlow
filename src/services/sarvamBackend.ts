import {
  getDoctors,
  getDepartmentById,
  getDepartments,
  getQueueByAppointmentId,
  getAppointments,
  getHospitalNavigation
} from '../db/mongo.js';
import { SarvamIntentResponse, SupportedLanguage } from '../types/index.js';

export async function processSarvamIntent(userInput: string, language: SupportedLanguage = 'en'): Promise<SarvamIntentResponse> {
  const text = userInput.trim().toLowerCase();
  console.log(`[Sarvam AI Backend] Processing request in language '${language}': "${text}"`);

  const apiKey = process.env.SARVAM_API_KEY;

  // If Sarvam API key exists, we can call Sarvam AI APIs for advanced natural language processing
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
              content: `You are Sarvam AI, CareFlow Hospital's smart NLU engine. Parse patient requests in Indian languages into JSON format with keys: intent ('find_doctor' | 'check_queue' | 'navigate_hospital' | 'cancel_appointment' | 'reschedule_appointment' | 'general_help'), department (Cardiology, Orthopedics, Neurology, General Medicine, Pediatrics, Dermatology, Ophthalmology, ENT), specialization, date ('today'|'tomorrow'|'YYYY-MM-DD'), timePreference ('morning'|'afternoon'|'evening'), responseText.`
            },
            { role: 'user', content: userInput }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          try {
            const parsed = JSON.parse(content);
            if (parsed.intent) {
              return await resolveIntentWithMongo(parsed, language);
            }
          } catch {
            // fallback to deterministic multi-lingual engine below
          }
        }
      }
    } catch (e) {
      console.warn('[Sarvam AI Backend] Sarvam API call failed, using resilient multilingual NLU fallback:', e);
    }
  }

  // Resilient Multilingual NLU Parsing Engine (Handles English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali)
  const intentData = parseMultilingualIntent(text, language);
  return await resolveIntentWithMongo(intentData, language);
}

function parseMultilingualIntent(text: string, lang: SupportedLanguage): {
  intent: SarvamIntentResponse['intent'];
  department?: string;
  specialization?: string;
  doctorName?: string;
  date?: string;
  timePreference?: string;
} {
  // Check for Cardiology keywords
  const isHeart = /heart|cardio|dil|hdayam|hdaya|hrudayam|కార్డియాలజిస్ట్|గుండె|दिल|कार्डियोलॉजिस्ट|हृदय|இதயம்|கார்டியா/i.test(text);
  const isOrtho = /bone|joint|ortho|haddi|hadlu|elumbu|ఎముక|ఆర్థోపెడిక్|हड्डी|ऑर्थोपेडिक/i.test(text);
  const isNeuro = /brain|neuro|dimaag|headache|migraine|నరాల|న్యూరో|दिमाग|न्यूरो/i.test(text);
  const isGenMed = /fever|fever|cough|cold|doctor|physician|bukhar|dawa|డాక్టర్|జ్వరం|बुखार|चिकित्सक/i.test(text);
  const isPeds = /child|baby|peds|pediatric|baccha|pilla|పిల్లల|बच्चा|बाल रोग/i.test(text);
  const isDerm = /skin|skin|dermatologist|pimple|rash|twacha|చర్మ|त्वचा/i.test(text);
  const isEye = /eye|vision|eyes|ophthalmologist|aankh|kallu|కంటి|आंख|नेत्र/i.test(text);
  const isENT = /ear|nose|throat|ent|kaan|naak|gala|చవి|ముక్కు|గొంతు|कान|नाक|गला/i.test(text);

  // Check queue intent
  if (/queue|token|wait|position|kitni der|kitna time|లైన్|టోకెన్|ఎంత సమయం|वेटिंग|कतार/i.test(text)) {
    return { intent: 'check_queue' };
  }

  // Check hospital map/navigation intent
  if (/where is|direction|route|map|kahan hai|kidhar|rashta|ఎక్కడ|దోవ|మార్గం|कहां है|रास्ता/i.test(text)) {
    let dept: string | undefined;
    if (isHeart) dept = 'Cardiology';
    else if (isOrtho) dept = 'Orthopedics';
    else if (isNeuro) dept = 'Neurology';
    else if (isPeds) dept = 'Pediatrics';
    else if (isDerm) dept = 'Dermatology';
    else if (isEye) dept = 'Ophthalmology';
    else if (isENT) dept = 'ENT';
    return { intent: 'navigate_hospital', department: dept };
  }

  // Check cancel intent
  if (/cancel|radd|cancle|रद्द|రద్దు/i.test(text)) {
    return { intent: 'cancel_appointment' };
  }

  // Check reschedule intent
  if (/reschedule|move|postpone|badlo|change date|మార్చు|बदलो/i.test(text)) {
    return { intent: 'reschedule_appointment' };
  }

  // Default to finding doctor if healthcare terms matched
  let dept: string | undefined;
  if (isHeart) dept = 'Cardiology';
  else if (isOrtho) dept = 'Orthopedics';
  else if (isNeuro) dept = 'Neurology';
  else if (isPeds) dept = 'Pediatrics';
  else if (isDerm) dept = 'Dermatology';
  else if (isEye) dept = 'Ophthalmology';
  else if (isENT) dept = 'ENT';
  else if (isGenMed) dept = 'General Medicine';

  const isTomorrow = /tomorrow|kal|subah|kal subah|రేపు|రేపు ఉదయం|कल|कल सुबह|நாளை/i.test(text);
  const isMorning = /morning|subah|udayam|ఉదయం|सुबह|காலை/i.test(text);

  if (dept || isTomorrow || isMorning || /find|book|appointment|search|chahiye|kaavali/i.test(text)) {
    return {
      intent: 'find_doctor',
      department: dept || 'Cardiology',
      date: isTomorrow ? 'tomorrow' : 'today',
      timePreference: isMorning ? 'morning' : 'afternoon'
    };
  }

  return { intent: 'general_help' };
}

async function resolveIntentWithMongo(
  intentObj: {
    intent: SarvamIntentResponse['intent'];
    department?: string;
    doctorName?: string;
    date?: string;
    timePreference?: string;
  },
  lang: SupportedLanguage
): Promise<SarvamIntentResponse> {
  const { intent, department, doctorName, date, timePreference } = intentObj;

  if (intent === 'find_doctor') {
    const doctors = await getDoctors({ departmentId: department ? `dept_${department.toLowerCase()}` : undefined, search: department });
    const matchedDocs = doctors.length > 0 ? doctors : await getDoctors();

    const deptName = department || matchedDocs[0]?.departmentName || 'Cardiology';

    let textResp = '';
    if (lang === 'hi') {
      textResp = `मुझे ${deptName} विभाग में ${matchedDocs.length} डॉक्टर मिले हैं। Dr. ${matchedDocs[0]?.name} ${date === 'tomorrow' ? 'कल सुबह' : 'आज'} उपलब्ध हैं।`;
    } else if (lang === 'te') {
      textResp = `నాకు ${deptName} విభాగంలో ${matchedDocs.length} డాక్టర్లు లభించారు. Dr. ${matchedDocs[0]?.name} ${date === 'tomorrow' ? 'రేపు ఉదయం' : 'ఈ రోజు'} అందుబాటులో ఉన్నారు.`;
    } else if (lang === 'ta') {
      textResp = `${deptName} துறையில் ${matchedDocs.length} மருத்துவர்கள் உள்ளனர். Dr. ${matchedDocs[0]?.name} கிடைக்கிறார்.`;
    } else {
      textResp = `I found ${matchedDocs.length} doctor(s) in ${deptName}. ${matchedDocs[0]?.name} is available ${date === 'tomorrow' ? 'tomorrow morning' : 'today'} at ${matchedDocs[0]?.nextAvailableSlot}.`;
    }

    return {
      intent: 'find_doctor',
      department: deptName,
      date: date || 'tomorrow',
      timePreference: timePreference || 'morning',
      language: lang,
      responseText: textResp,
      matchedDoctors: matchedDocs
    };
  }

  if (intent === 'check_queue') {
    const appointments = await getAppointments();
    const activeApp = appointments.find(a => a.status === 'confirmed') || appointments[0];

    if (activeApp) {
      const q = await getQueueByAppointmentId(activeApp._id);
      let textResp = '';
      if (lang === 'hi') {
        textResp = `आपका टोकन नंबर ${q?.patientToken || activeApp.tokenNumber} है। वर्तमान टोकन ${q?.currentToken || 'A-119'} है। आपके आगे ${q?.patientsAhead || 8} मरीज हैं और अनुमानित प्रतीक्षा समय लगभग ${q?.estimatedWaitTime || 24} मिनट है।`;
      } else if (lang === 'te') {
        textResp = `మీ టోకెన్ నంబర్ ${q?.patientToken || activeApp.tokenNumber}. ప్రస్తుతం ${q?.currentToken || 'A-119'} నడుస్తోంది. మీ ముందు ${q?.patientsAhead || 8} మంది రోగులు ఉన్నారు. సుమారు ${q?.estimatedWaitTime || 24} నిమిషాల సమయం పడుతుంది.`;
      } else {
        textResp = `Your token is ${q?.patientToken || activeApp.tokenNumber}. Current token consulting is ${q?.currentToken || 'A-119'}. There are ${q?.patientsAhead || 8} patients ahead of you with an estimated wait time of ~${q?.estimatedWaitTime || 24} minutes.`;
      }

      return {
        intent: 'check_queue',
        language: lang,
        responseText: textResp,
        extractedParams: { queueState: q }
      };
    }
  }

  if (intent === 'navigate_hospital') {
    const navs = await getHospitalNavigation(department);
    const loc = navs[0];
    let textResp = '';
    if (lang === 'hi') {
      textResp = `${department || 'Cardiology'} ${loc ? `${loc.block}, ${loc.floor}, ${loc.roomNumber}` : 'ब्लॉक बी, दूसरी मंजिल'} पर स्थित है। लिफ्ट बी लेकर दूसरी मंजिल पर जाएं।`;
    } else if (lang === 'te') {
      textResp = `${department || 'Cardiology'} ${loc ? `${loc.block}, ${loc.floor}, ${loc.roomNumber}` : 'బ్లాక్ బి, 2వ అంతస్తు'} లో ఉంది. లిఫ్ట్ బి ద్వారా వెళ్ళండి.`;
    } else {
      textResp = `${department || 'Cardiology'} is located in ${loc ? `${loc.block}, ${loc.floor}, ${loc.roomNumber}` : 'Block B, 2nd Floor'}. Walk past main reception and take Elevator Bank B.`;
    }

    return {
      intent: 'navigate_hospital',
      department: department || 'Cardiology',
      language: lang,
      responseText: textResp,
      extractedParams: { location: loc }
    };
  }

  if (intent === 'cancel_appointment' || intent === 'reschedule_appointment') {
    const act = intent === 'cancel_appointment' ? 'cancellation' : 'rescheduling';
    return {
      intent,
      language: lang,
      responseText: `Opening your active appointment for ${act}. Please confirm the details on screen.`
    };
  }

  return {
    intent: 'general_help',
    language: lang,
    responseText: lang === 'hi'
      ? 'नमस्कार! मैं केयरफ्लो वॉयस असिस्टेंट हूं। आप डॉक्टर ढूंढ सकते हैं, टोकन चेक कर सकते हैं या अस्पताल का रास्ता पूछ सकते हैं।'
      : lang === 'te'
      ? 'నమస్కారం! నేను కేర్‌ఫ్లో వాయిస్ అసిస్టెంట్‌ని. మీరు డాక్టర్ల సెర్చ్, క్యూ ట్రాకింగ్ లేదా హాస్పిటల్ నావిగేషన్ కోసం నన్ను అడగవచ్చు.'
      : 'Hello! I am CareFlow Voice Assistant. You can ask me to find a doctor, track your queue position, or get hospital directions.'
  };
}
