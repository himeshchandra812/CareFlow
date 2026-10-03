import { Hospital, Department, Doctor, HospitalLocation, Appointment, QueueState, Patient } from '../types/index.js';

export const SEED_HOSPITAL: Hospital = {
  _id: 'hosp_careflow_01',
  name: 'CareFlow Multispeciality Hospital',
  address: '100 Healthcare Boulevard, Tech City, Jubilee Hills, Hyderabad',
  phone: '+91 40 4567 8900',
  blocks: ['Block A (Emergency & OPD)', 'Block B (Speciality Clinics)', 'Block C (Diagnostics & Labs)', 'Block D (Inpatient Ward)'],
  floors: ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor'],
  mapNodes: [
    { id: 'node_entrance', label: 'Main Entrance & Reception', floor: 'Ground Floor', block: 'Block A', x: 10, y: 80 },
    { id: 'node_reg', label: 'Patient Registration Desk', floor: 'Ground Floor', block: 'Block A', x: 25, y: 70 },
    { id: 'node_lift_a', label: 'Elevator Bank A', floor: 'Ground Floor', block: 'Block A', x: 40, y: 50 },
    { id: 'node_lift_b', label: 'Elevator Bank B', floor: '2nd Floor', block: 'Block B', x: 40, y: 30 },
    { id: 'node_cardio', label: 'Cardiology Clinic (Room 204)', floor: '2nd Floor', block: 'Block B', x: 75, y: 25 },
    { id: 'node_ortho', label: 'Orthopedics Clinic (Room 108)', floor: '1st Floor', block: 'Block A', x: 70, y: 60 },
    { id: 'node_neuro', label: 'Neurology Department (Room 302)', floor: '3rd Floor', block: 'Block B', x: 80, y: 40 },
    { id: 'node_genmed', label: 'General Medicine OPD (Room 101)', floor: '1st Floor', block: 'Block A', x: 50, y: 75 },
    { id: 'node_peds', label: 'Pediatric Care Center (Room 201)', floor: '2nd Floor', block: 'Block A', x: 30, y: 35 },
    { id: 'node_derm', label: 'Dermatology & Skin Clinic (Room 112)', floor: '1st Floor', block: 'Block B', x: 60, y: 80 },
    { id: 'node_ophth', label: 'Ophthalmology Clinic (Room 210)', floor: '2nd Floor', block: 'Block B', x: 85, y: 70 },
    { id: 'node_ent', label: 'ENT & Head-Neck Clinic (Room 105)', floor: '1st Floor', block: 'Block B', x: 45, y: 65 }
  ]
};

export const SEED_DEPARTMENTS: Department[] = [
  {
    _id: 'dept_cardiology',
    name: 'Cardiology',
    description: 'Comprehensive heart care, ECG, echocardiography, interventional cardiology, and preventative cardiac wellness.',
    floor: '2nd Floor',
    block: 'Block B',
    location: 'Block B • 2nd Floor • Wing East',
    iconName: 'Heart',
    services: ['Echocardiogram (ECHO)', 'ECG & Holter Monitoring', 'Cardiac Stress Testing', 'TMT & Coronary Consultation'],
    preparationInstructions: [
      'Bring all previous ECG reports and cardiac test documents.',
      'Carry your current daily prescription medication list.',
      'Wear loose-fitting clothing suitable for chest examination or stress test.',
      'Avoid heavy caffeine consumption 2 hours before your appointment.'
    ]
  },
  {
    _id: 'dept_orthopedics',
    name: 'Orthopedics',
    description: 'Joint replacement, bone fractures, spine management, sports injuries, and arthritis treatment.',
    floor: '1st Floor',
    block: 'Block A',
    location: 'Block A • 1st Floor • Wing West',
    iconName: 'Bone',
    services: ['Joint Replacement Consultation', 'X-Ray & MRI Review', 'Arthroscopy & Fracture Care', 'Spine & Physiotherapy Plan'],
    preparationInstructions: [
      'Bring previous X-rays, MRI scans, or CT scan films.',
      'Wear comfortable clothing that allows easy access to the affected joint/limb.',
      'List any past bone injuries or surgeries for the doctor to review.'
    ]
  },
  {
    _id: 'dept_neurology',
    name: 'Neurology',
    description: 'Diagnosis and care for stroke, epilepsy, migraines, neuropathies, Parkinson\'s disease, and memory disorders.',
    floor: '3rd Floor',
    block: 'Block B',
    location: 'Block B • 3rd Floor • Suite 302',
    iconName: 'Brain',
    services: ['EEG & Nerve Conduction Studies', 'Migraine & Headache Management', 'Stroke Risk Assessment', 'Memory & Dementia Care'],
    preparationInstructions: [
      'Bring all brain MRI/CT scans, EEG reports, and previous discharge summaries.',
      'Keep a log of recent headache/seizure episodes if applicable.',
      'A family member or caregiver is encouraged to accompany elderly patients.'
    ]
  },
  {
    _id: 'dept_general_medicine',
    name: 'General Medicine',
    description: 'Primary care, fever evaluation, diabetes, hypertension management, health checkups, and chronic conditions.',
    floor: '1st Floor',
    block: 'Block A',
    location: 'Block A • 1st Floor • Central Hall',
    iconName: 'Stethoscope',
    services: ['General Health Evaluation', 'Diabetes & Thyroid Monitoring', 'Fever & Infection Screening', 'Hypertension Management'],
    preparationInstructions: [
      'Fast for 8 hours prior if blood sugar or lipid profile tests were requested.',
      'Bring a record of recent home blood pressure or blood sugar readings.',
      'Arrive 15 minutes before your time slot for preliminary vitals check.'
    ]
  },
  {
    _id: 'dept_pediatrics',
    name: 'Pediatrics',
    description: 'Child health, neonatal care, growth monitoring, childhood vaccinations, and pediatric emergency support.',
    floor: '2nd Floor',
    block: 'Block A',
    location: 'Block A • 2nd Floor • Child Wing',
    iconName: 'Baby',
    services: ['Vaccination & Immunization', 'Growth & Milestone Assessment', 'Pediatric Infection Care', 'Childhood Nutrition'],
    preparationInstructions: [
      'Bring your child\'s official immunization record card.',
      'Carry favorite comfort toys or snacks to keep the child calm.',
      'Note down exact symptoms, fever temperatures, or feeding changes.'
    ]
  },
  {
    _id: 'dept_dermatology',
    name: 'Dermatology',
    description: 'Skin care, eczema, psoriasis, acne, hair loss treatments, allergic skin testing, and laser therapies.',
    floor: '1st Floor',
    block: 'Block B',
    location: 'Block B • 1st Floor • Suite 112',
    iconName: 'Sparkles',
    services: ['Skin Allergy Testing', 'Acne & Eczema Therapy', 'Hair Loss & Scalp Care', 'Dermatosurgery & Biopsy'],
    preparationInstructions: [
      'Avoid applying heavy makeup, lotions, or ointments to the affected area on appointment day.',
      'List any known drug, food, or chemical allergies.',
      'Bring photos of flare-ups if the skin condition comes and goes.'
    ]
  },
  {
    _id: 'dept_ophthalmology',
    name: 'Ophthalmology',
    description: 'Comprehensive eye examinations, cataract screening, glaucoma treatment, diabetic retinopathy, and vision testing.',
    floor: '2nd Floor',
    block: 'Block B',
    location: 'Block B • 2nd Floor • Eye Clinic',
    iconName: 'Eye',
    services: ['Vision & Refraction Test', 'Cataract Evaluation', 'Glaucoma Pressure Check', 'Diabetic Eye Screening'],
    preparationInstructions: [
      'Bring your current eyeglasses or contact lens prescription.',
      'Pupil dilation drops may be used; arrange for someone to drive you home.',
      'Bring sunglasses for post-examination light sensitivity.'
    ]
  },
  {
    _id: 'dept_ent',
    name: 'ENT (Ear, Nose & Throat)',
    description: 'Hearing tests, sinus care, throat infections, tonsillitis, vertigo, and voice disorders.',
    floor: '1st Floor',
    block: 'Block B',
    location: 'Block B • 1st Floor • Room 105',
    iconName: 'Ear',
    services: ['Audiometry & Hearing Test', 'Nasal Endoscopy', 'Vertigo & Balance Evaluation', 'Throat & Tonsil Check'],
    preparationInstructions: [
      'Do not use ear drops on the morning of the visit unless instructed.',
      'Bring previous audiograms or hearing test results if available.',
      'List any specific triggers for nasal allergies or dizziness.'
    ]
  }
];

export const SEED_DOCTORS: Doctor[] = [
  {
    _id: 'doc_anil_sharma',
    name: 'Dr. Anil Sharma',
    specialization: 'Senior Cardiologist',
    departmentId: 'dept_cardiology',
    departmentName: 'Cardiology',
    experience: 18,
    languages: ['English', 'Hindi', 'Telugu'],
    consultationFee: 800,
    profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    hospitalId: 'hosp_careflow_01',
    qualification: 'MD, DM (Cardiology), FACC',
    rating: 4.9,
    about: 'Dr. Anil Sharma has over 18 years of experience in interventional cardiology, heart failure management, and preventative health.',
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      slots: ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '04:00 PM', '04:30 PM', '05:00 PM']
    },
    isAvailableToday: true,
    nextAvailableSlot: 'Today • 10:30 AM',
    doctorStatus: 'Consulting'
  },
  {
    _id: 'doc_priya_venkat',
    name: 'Dr. Priya Venkat',
    specialization: 'Consultant Cardiologist',
    departmentId: 'dept_cardiology',
    departmentName: 'Cardiology',
    experience: 12,
    languages: ['English', 'Tamil', 'Telugu', 'Hindi'],
    consultationFee: 750,
    profileImage: 'https://images.unsplash.com/photo-1594824813566-78a5e8a714e6?w=400&auto=format&fit=crop&q=80',
    hospitalId: 'hosp_careflow_01',
    qualification: 'MBBS, MD, DNB (Cardiology)',
    rating: 4.8,
    about: 'Specialist in preventative cardiology, hypertension control, and non-invasive cardiac imaging.',
    availability: {
      days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      slots: ['09:00 AM', '09:30 AM', '11:00 AM', '02:00 PM', '03:00 PM']
    },
    isAvailableToday: true,
    nextAvailableSlot: 'Today • 02:00 PM',
    doctorStatus: 'Available'
  },
  {
    _id: 'doc_rajesh_reddy',
    name: 'Dr. Rajesh Reddy',
    specialization: 'Senior Orthopedic Surgeon',
    departmentId: 'dept_orthopedics',
    departmentName: 'Orthopedics',
    experience: 16,
    languages: ['English', 'Telugu', 'Hindi'],
    consultationFee: 850,
    profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    hospitalId: 'hosp_careflow_01',
    qualification: 'MS (Ortho), MCh (Joint Replacement), FRCS',
    rating: 4.9,
    about: 'Renowned joint replacement surgeon specialising in robotic knee surgeries and trauma care.',
    availability: {
      days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
      slots: ['10:00 AM', '10:30 AM', '11:30 AM', '03:30 PM', '04:30 PM']
    },
    isAvailableToday: true,
    nextAvailableSlot: 'Today • 11:30 AM',
    doctorStatus: 'Consulting'
  },
  {
    _id: 'doc_sunita_rao',
    name: 'Dr. Sunita Rao',
    specialization: 'Consultant Neurologist',
    departmentId: 'dept_neurology',
    departmentName: 'Neurology',
    experience: 14,
    languages: ['English', 'Kannada', 'Hindi', 'Telugu'],
    consultationFee: 900,
    profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    hospitalId: 'hosp_careflow_01',
    qualification: 'MD (Gen Med), DM (Neurology)',
    rating: 4.8,
    about: 'Expert in stroke rehabilitation, Parkinson\'s treatment, chronic migraine, and nerve conduction evaluation.',
    availability: {
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
      slots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM']
    },
    isAvailableToday: true,
    nextAvailableSlot: 'Today • 02:30 PM',
    doctorStatus: 'On Break'
  },
  {
    _id: 'doc_vikram_singh',
    name: 'Dr. Vikram Singh',
    specialization: 'General Physician & Diabetologist',
    departmentId: 'dept_general_medicine',
    departmentName: 'General Medicine',
    experience: 15,
    languages: ['English', 'Hindi', 'Bengali', 'Marathi'],
    consultationFee: 600,
    profileImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
    hospitalId: 'hosp_careflow_01',
    qualification: 'MD (Internal Medicine), C.Diab',
    rating: 4.7,
    about: 'Compassionate general physician with focus on adult diabetes management, fever diagnostics, and geriatric primary care.',
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '05:00 PM']
    },
    isAvailableToday: true,
    nextAvailableSlot: 'Today • 09:30 AM',
    doctorStatus: 'Consulting'
  },
  {
    _id: 'doc_meera_nair',
    name: 'Dr. Meera Nair',
    specialization: 'Pediatrician & Neonatologist',
    departmentId: 'dept_pediatrics',
    departmentName: 'Pediatrics',
    experience: 11,
    languages: ['English', 'Malayalam', 'Tamil', 'Hindi'],
    consultationFee: 650,
    profileImage: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80',
    hospitalId: 'hosp_careflow_01',
    qualification: 'MD (Pediatrics), DNB, Fellowship in Neonatology',
    rating: 4.9,
    about: 'Gentle and experienced child specialist focusing on newborn care, milestone growth, and vaccinations.',
    availability: {
      days: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
      slots: ['10:00 AM', '10:30 AM', '11:00 AM', '03:00 PM', '04:00 PM']
    },
    isAvailableToday: true,
    nextAvailableSlot: 'Today • 10:30 AM',
    doctorStatus: 'Consulting'
  },
  {
    _id: 'doc_kavita_deshmukh',
    name: 'Dr. Kavita Deshmukh',
    specialization: 'Dermatologist & Cosmetologist',
    departmentId: 'dept_dermatology',
    departmentName: 'Dermatology',
    experience: 10,
    languages: ['English', 'Marathi', 'Hindi'],
    consultationFee: 700,
    profileImage: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&auto=format&fit=crop&q=80',
    hospitalId: 'hosp_careflow_01',
    qualification: 'MD (Dermatology, Venereology & Leprosy)',
    rating: 4.8,
    about: 'Specializes in eczema, psoriasis, skin allergy diagnosis, acne management, and cosmetic skin procedures.',
    availability: {
      days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      slots: ['11:00 AM', '11:30 AM', '02:00 PM', '03:30 PM']
    },
    isAvailableToday: true,
    nextAvailableSlot: 'Today • 11:30 AM',
    doctorStatus: 'Available'
  },
  {
    _id: 'doc_sanjay_banerjee',
    name: 'Dr. Sanjay Banerjee',
    specialization: 'Ophthalmologist & Retina Specialist',
    departmentId: 'dept_ophthalmology',
    departmentName: 'Ophthalmology',
    experience: 17,
    languages: ['English', 'Bengali', 'Hindi'],
    consultationFee: 800,
    profileImage: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80',
    hospitalId: 'hosp_careflow_01',
    qualification: 'MS (Ophthalmology), FICO (UK), FRCS',
    rating: 4.9,
    about: 'Senior eye surgeon known for micro-incision cataract surgeries and diabetic eye disease care.',
    availability: {
      days: ['Tuesday', 'Thursday', 'Friday', 'Saturday'],
      slots: ['09:30 AM', '10:30 AM', '12:00 PM', '03:00 PM']
    },
    isAvailableToday: true,
    nextAvailableSlot: 'Today • 10:30 AM',
    doctorStatus: 'Consulting'
  },
  {
    _id: 'doc_arun_kumar',
    name: 'Dr. Arun Kumar',
    specialization: 'ENT Surgeon',
    departmentId: 'dept_ent',
    departmentName: 'ENT',
    experience: 13,
    languages: ['English', 'Telugu', 'Tamil', 'Hindi'],
    consultationFee: 650,
    profileImage: 'https://images.unsplash.com/photo-1637059824899-a441006a6875?w=400&auto=format&fit=crop&q=80',
    hospitalId: 'hosp_careflow_01',
    qualification: 'MS (ENT), DNB',
    rating: 4.8,
    about: 'Specialist in sinus endoscopic surgeries, hearing restoration, snoring disorders, and throat care.',
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
      slots: ['10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
    },
    isAvailableToday: true,
    nextAvailableSlot: 'Today • 11:00 AM',
    doctorStatus: 'Available'
  }
];

export const SEED_PATIENTS: Patient[] = [
  {
    _id: 'pat_rajesh_kumar',
    name: 'Rajesh Kumar',
    age: 62,
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@careflow.org',
    preferredLanguage: 'en',
    accessibilityMode: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SEED_APPOINTMENTS: Appointment[] = [
  {
    _id: 'app_1001',
    patientId: 'pat_rajesh_kumar',
    patientName: 'Rajesh Kumar',
    patientPhone: '+91 98765 43210',
    doctorId: 'doc_anil_sharma',
    doctorName: 'Dr. Anil Sharma',
    doctorSpecialization: 'Senior Cardiologist',
    hospitalId: 'hosp_careflow_01',
    departmentId: 'dept_cardiology',
    departmentName: 'Cardiology',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:30 AM',
    appointmentType: 'new_visit',
    tokenNumber: 'A-127',
    status: 'confirmed',
    estimatedWaitTime: 24,
    locationDetails: {
      block: 'Block B',
      floor: '2nd Floor',
      room: 'Room 204 (Cardiology Clinic)'
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const SEED_QUEUES: QueueState[] = [
  {
    _id: 'queue_1001',
    appointmentId: 'app_1001',
    doctorId: 'doc_anil_sharma',
    doctorName: 'Dr. Anil Sharma',
    departmentId: 'dept_cardiology',
    departmentName: 'Cardiology',
    currentToken: 'A-119',
    patientToken: 'A-127',
    patientsAhead: 8,
    estimatedWaitTime: 24,
    doctorStatus: 'Consulting',
    doctorStatusMessage: 'Dr. Anil Sharma is currently consulting Token A-119.',
    averageConsultationMinutes: 3,
    recentConsultationDurations: [3, 4, 2, 5, 3],
    isPatientArrived: false,
    lastUpdated: new Date().toISOString()
  }
];

export const SEED_HOSPITAL_LOCATIONS: HospitalLocation[] = [
  {
    _id: 'loc_cardio_204',
    hospitalId: 'hosp_careflow_01',
    building: 'Main Hospital Complex',
    block: 'Block B',
    floor: '2nd Floor',
    department: 'Cardiology',
    roomNumber: 'Room 204',
    coordinates: { x: 75, y: 25 },
    directions: [
      'Enter through the Main Entrance at Block A Ground Floor.',
      'Walk straight past the Central Registration Desk.',
      'Take Elevator Bank B to the 2nd Floor.',
      'Turn Right upon exiting the elevator into Wing East.',
      'Cardiology Reception & Room 204 will be 20 meters ahead on your left.'
    ],
    landmarks: ['Near Diagnostic Lab Counter', 'Opposite Cardiac Diagnostic Suite'],
    walkingTimeMinutes: 4
  },
  {
    _id: 'loc_ortho_108',
    hospitalId: 'hosp_careflow_01',
    building: 'Main Hospital Complex',
    block: 'Block A',
    floor: '1st Floor',
    department: 'Orthopedics',
    roomNumber: 'Room 108',
    coordinates: { x: 70, y: 60 },
    directions: [
      'Enter through the Main Entrance at Block A Ground Floor.',
      'Take Elevator Bank A or Escalator to the 1st Floor.',
      'Follow signs for Orthopedics & Trauma Care.',
      'Room 108 is located on the right side next to X-Ray Bay 2.'
    ],
    landmarks: ['Adjacent to X-Ray & Imaging Wing'],
    walkingTimeMinutes: 3
  }
];
