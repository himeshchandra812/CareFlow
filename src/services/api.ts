import {
  Doctor,
  Department,
  Appointment,
  QueueState,
  Hospital,
  HospitalLocation,
  SarvamIntentResponse,
  SupportedLanguage,
  VisitTypeDetectionResult,
  AppointmentPreparationInfo,
  VisitType,
  VisitTypeSource,
  Prescription
} from '../types/index.js';
import { authService } from './auth.js';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const user = authService.getCurrentUser();
  const defaultHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) {
    defaultHeaders['x-user-id'] = user._id;
    defaultHeaders['x-user-role'] = user.role;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || err.details || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getDoctors: (params?: { departmentId?: string; search?: string; language?: string }): Promise<Doctor[]> => {
    const q = new URLSearchParams();
    if (params?.departmentId) q.append('departmentId', params.departmentId);
    if (params?.search) q.append('search', params.search);
    if (params?.language) q.append('language', params.language);
    return fetchJson(`${API_BASE}/doctors?${q.toString()}`);
  },

  getDoctorById: (id: string): Promise<Doctor> => fetchJson(`${API_BASE}/doctors/${id}`),

  getDepartments: (): Promise<Department[]> => fetchJson(`${API_BASE}/departments`),

  getDepartmentById: (id: string): Promise<Department> => fetchJson(`${API_BASE}/departments/${id}`),

  getAppointments: (): Promise<Appointment[]> => fetchJson(`${API_BASE}/appointments`),

  getAppointmentById: (id: string): Promise<Appointment> => fetchJson(`${API_BASE}/appointments/${id}`),

  detectVisitType: (params: {
    doctorId: string;
    departmentId?: string;
    patientId?: string;
  }): Promise<VisitTypeDetectionResult> => {
    const q = new URLSearchParams();
    if (params.doctorId) q.append('doctorId', params.doctorId);
    if (params.departmentId) q.append('departmentId', params.departmentId);
    if (params.patientId) q.append('patientId', params.patientId);
    return fetchJson(`${API_BASE}/appointments/detect-visit-type?${q.toString()}`);
  },

  getAppointmentPreparation: (id: string): Promise<AppointmentPreparationInfo> =>
    fetchJson(`${API_BASE}/appointments/${id}/preparation`),

  createAppointment: (data: {
    patientName: string;
    patientPhone: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType?: VisitType;
    visitType?: VisitType;
    visitTypeSource?: VisitTypeSource;
    previousAppointmentId?: string | null;
  }): Promise<{ appointment: Appointment; queue: QueueState }> =>
    fetchJson(`${API_BASE}/appointments`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  markPatientArrived: (id: string): Promise<{ appointment: Appointment; queue: QueueState }> =>
    fetchJson(`${API_BASE}/appointments/${id}/arrive`, {
      method: 'POST'
    }),

  updateAppointmentStatus: (
    id: string,
    status: Appointment['status'],
    cancelReason?: string
  ): Promise<Appointment> =>
    fetchJson(`${API_BASE}/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancelReason })
    }),

  rescheduleAppointment: (id: string, newDate: string, newTime: string): Promise<Appointment> =>
    fetchJson(`${API_BASE}/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'reschedule', newDate, newTime })
    }),

  getQueueByAppointmentId: (appointmentId: string): Promise<QueueState> =>
    fetchJson(`${API_BASE}/queue/${appointmentId}`),

  advanceQueue: (appointmentId: string): Promise<QueueState> =>
    fetchJson(`${API_BASE}/queue/${appointmentId}`, { method: 'PATCH' }),

  getHospitalInfo: (): Promise<Hospital> => fetchJson(`${API_BASE}/hospitals/hosp_careflow_01`),

  getHospitalNavigation: (departmentId?: string): Promise<HospitalLocation[]> =>
    fetchJson(`${API_BASE}/hospitals/hosp_careflow_01/navigation?${departmentId ? `departmentId=${departmentId}` : ''}`),

  sendSarvamIntent: (
    text: string,
    language: SupportedLanguage = 'en',
    context?: Record<string, any>
  ): Promise<SarvamIntentResponse> =>
    fetchJson(`${API_BASE}/ai/intent`, {
      method: 'POST',
      body: JSON.stringify({ text, message: text, language, context })
    }),

  sendSarvamVoice: (
    audioBase64: string,
    language: SupportedLanguage = 'en',
    context?: Record<string, any>
  ): Promise<SarvamIntentResponse & { transcript: string }> =>
    fetchJson(`${API_BASE}/ai/voice`, {
      method: 'POST',
      body: JSON.stringify({ audioBase64, language, context })
    }),

  // Prescriptions
  getPrescriptions: (): Promise<Prescription[]> => fetchJson(`${API_BASE}/prescriptions`),
  createPrescription: (data: {
    patientId: string;
    title: string;
    prescriptionDate: string;
    notes: string;
    appointmentId?: string;
  }): Promise<Prescription> =>
    fetchJson(`${API_BASE}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePrescription: (id: string, data: Partial<Prescription>): Promise<Prescription> =>
    fetchJson(`${API_BASE}/prescriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  deletePrescription: (id: string): Promise<{ message: string }> =>
    fetchJson(`${API_BASE}/prescriptions/${id}`, {
      method: 'DELETE'
    }),

  // Payments
  createCheckoutSession: (appointmentId: string, amount: number): Promise<{ sessionId: string; url: string }> =>
    fetchJson(`${API_BASE}/payments/create-checkout-session`, {
      method: 'POST',
      body: JSON.stringify({ appointmentId, amount })
    }),
  verifyPaymentSession: (sessionId: string, appointmentId: string): Promise<{ status: string; verified: boolean }> =>
    fetchJson(`${API_BASE}/payments/verify-session`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, appointmentId })
    })
};
