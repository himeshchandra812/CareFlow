export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn';

export interface Patient {
  _id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  preferredLanguage: SupportedLanguage;
  accessibilityMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAvailability {
  days: string[];
  slots: string[];
}

export type DoctorStatusType = 'Available' | 'Consulting' | 'On Break' | 'Delayed' | 'Completed';

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  departmentId: string;
  departmentName: string;
  experience: number;
  languages: string[];
  consultationFee: number;
  profileImage: string;
  hospitalId: string;
  qualification: string;
  rating: number;
  about: string;
  availability: DoctorAvailability;
  isAvailableToday: boolean;
  nextAvailableSlot: string;
  doctorStatus: DoctorStatusType;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  _id: string;
  name: string;
  description: string;
  floor: string;
  block: string;
  location: string;
  services: string[];
  preparationInstructions: string[];
  iconName: string;
}

export interface HospitalMapNode {
  id: string;
  label: string;
  floor: string;
  block: string;
  x: number;
  y: number;
}

export interface Hospital {
  _id: string;
  name: string;
  address: string;
  phone: string;
  blocks: string[];
  floors: string[];
  mapNodes: HospitalMapNode[];
}

export type AppointmentStatus =
  | 'confirmed'
  | 'arrived'
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export interface Appointment {
  _id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  hospitalId: string;
  departmentId: string;
  departmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'new_visit' | 'follow_up';
  tokenNumber: string;
  status: AppointmentStatus;
  arrivedAt?: string;
  cancelReason?: string;
  estimatedWaitTime: number;
  locationDetails: {
    block: string;
    floor: string;
    room: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QueueState {
  _id: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  currentToken: string;
  patientToken: string;
  patientsAhead: number;
  estimatedWaitTime: number;
  doctorStatus: DoctorStatusType;
  doctorStatusMessage: string;
  averageConsultationMinutes: number;
  recentConsultationDurations: number[];
  startedAt?: string;
  isPatientArrived: boolean;
  lastUpdated: string;
}

export interface HospitalLocation {
  _id: string;
  hospitalId: string;
  building: string;
  block: string;
  floor: string;
  department: string;
  roomNumber: string;
  coordinates: { x: number; y: number };
  directions: string[];
  landmarks: string[];
  walkingTimeMinutes: number;
}

export type SarvamIntentType =
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
  | 'general_help'
  | 'unknown';

export interface SarvamIntentResponse {
  intent: SarvamIntentType;
  department?: string;
  specialization?: string;
  doctorName?: string;
  date?: string;
  timePreference?: string;
  language?: SupportedLanguage;
  responseText: string;
  extractedParams?: Record<string, any>;
  matchedDoctors?: Doctor[];
}
