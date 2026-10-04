import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import {
  connectToDatabase,
  getDoctors,
  getDoctorById,
  getDepartments,
  getDepartmentById,
  getAppointments,
  getAppointmentById,
  detectVisitType,
  getAppointmentPreparation,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  getQueueByAppointmentId,
  advanceQueue,
  markPatientArrived,
  getHospitalInfo,
  getHospitalNavigation,
  normalizePhoneNumber,
  getPatientByPhone,
  getPatientById,
  createPatient,
  updatePatient,
  getUserByEmail,
  getUserById,
  createUser,
  verifyUserPassword,
  getPrescriptionsForPatient,
  getPrescriptionsForDoctor,
  getPrescriptionsForAuthorizedDoctor,
  createPrescription,
  updatePrescription,
  deletePrescription,
  getPaymentByAppointmentId,
  createPayment,
  updatePaymentStatus
} from './src/db/mongo.js';
import { processSarvamNLU } from './src/services/sarvam/intentEngine.js';
import { processSarvamSTT } from './src/services/sarvam/voiceEngine.js';
import Stripe from 'stripe';
import crypto from 'crypto';
import type { Prescription, Payment } from './src/types/index.js';

const prescriptions: Prescription[] = [];
const payments: Payment[] = [];
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const requirePatient = (req: express.Request, res: express.Response) => {
  const userId = req.headers['x-user-id'] as string;
  const role = req.headers['x-user-role'] as string;
  if (!userId || role !== 'patient') { res.status(403).json({ error: 'Patient access required' }); return null; }
  return userId;
};

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to Database
connectToDatabase().catch(err => {
  console.error('[CareFlow Server] Failed database connection setup:', err);
});

/* API ROUTES */

app.get('/api/prescriptions', (req, res) => {
  const userId = requirePatient(req, res); if (!userId) return;
  res.json(prescriptions.filter(item => item.patientId === userId));
});
app.post('/api/prescriptions', (req, res) => {
  const userId = requirePatient(req, res); if (!userId) return;
  const { title, prescriptionDate, doctorName = '', hospitalName = '', notes = '' } = req.body || {};
  if (!title?.trim() || !/^\\d{4}-\\d{2}-\\d{2}$/.test(prescriptionDate || '')) return res.status(400).json({ error: 'A valid title and prescription date are required' });
  const now = new Date().toISOString();
  const item = { _id: `prescription_${crypto.randomUUID()}`, patientId: userId, title: title.trim(), prescriptionDate, doctorName: String(doctorName).trim(), hospitalName: String(hospitalName).trim(), notes: String(notes).trim(), createdAt: now, updatedAt: now };
  prescriptions.push(item); res.status(201).json(item);
});
app.delete('/api/prescriptions/:id', (req, res) => {
  const userId = requirePatient(req, res); if (!userId) return;
  const index = prescriptions.findIndex(item => item._id === req.params.id && item.patientId === userId);
  if (index < 0) return res.status(404).json({ error: 'Prescription not found' });
  prescriptions.splice(index, 1); res.json({ success: true });
});
app.post('/api/payments/checkout', async (req, res) => {
  const userId = requirePatient(req, res); if (!userId) return;
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY for payment testing.' });
  const { appointmentId } = req.body || {};
  if (!appointmentId) return res.status(400).json({ error: 'Appointment is required' });
  const existing = payments.find(p => p.userId === userId && p.appointmentId === appointmentId && p.status === 'paid');
  if (existing) return res.status(409).json({ error: 'This appointment is already paid' });
  const payment: Payment = { _id: `payment_${crypto.randomUUID()}`, userId, appointmentId, amount: 0, currency: 'inr', status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const session = await stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ price_data: { currency: 'inr', product_data: { name: 'CareFlow appointment' }, unit_amount: 100 }, quantity: 1 }], success_url: `${req.protocol}://${req.get('host')}/?payment=success`, cancel_url: `${req.protocol}://${req.get('host')}/?payment=cancelled`, metadata: { userId, appointmentId, paymentId: payment._id }, integration_identifier: `careflow_${crypto.randomBytes(4).toString('hex')}` });
  payment.stripeCheckoutSessionId = session.id; payment.amount = 100; payments.push(payment); res.json({ url: session.url });
});
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => { res.json({ received: true }); });

// Health Check Endpoint
app.get('/api/health', async (_req, res) => {
  try {
    const db = await connectToDatabase();
    res.json({
      status: 'ok',
      database: db ? 'connected' : 'in-memory-fallback',
      service: 'CareFlow Hospital API',
      timestamp: new Date().toISOString()
    });
  } catch (e: any) {
    res.status(500).json({ status: 'error', error: 'Health check failed' });
  }
});

// Authentication Endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await verifyUserPassword(email, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, token: `token_${user._id}_${Date.now()}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, accessibilityMode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    const newUser = await createUser({
      name,
      email,
      phone: phone || '+919876543210',
      password,
      role: role || 'patient',
      accessibilityMode
    });
    const { passwordHash, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, token: `token_${newUser._id}_${Date.now()}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Registration failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to authenticate session' });
  }
});

// Doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const { departmentId, search, language } = req.query;
    const doctors = await getDoctors({
      departmentId: departmentId as string,
      search: search as string,
      language: language as string
    });
    res.json(doctors);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't load doctor information right now. Please try again." });
  }
});

app.get('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await getDoctorById(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't load doctor details right now. Please try again." });
  }
});

// Departments
app.get('/api/departments', async (req, res) => {
  try {
    const depts = await getDepartments();
    res.json(depts);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't load departments right now. Please try again." });
  }
});

app.get('/api/departments/:id', async (req, res) => {
  try {
    const dept = await getDepartmentById(req.params.id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json(dept);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't load department details right now. Please try again." });
  }
});

// Appointments
app.get('/api/appointments/detect-visit-type', async (req, res) => {
  try {
    const { patientId, doctorId, departmentId } = req.query;
    const result = await detectVisitType({
      patientId: patientId as string,
      doctorId: doctorId as string,
      departmentId: departmentId as string
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't detect visit type right now. Please try again." });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!userId || !role) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let filterParams: { patientId?: string; doctorId?: string; role?: string } = {};

    if (role === 'patient') {
      filterParams.role = 'patient';
      filterParams.patientId = await resolvePatientId(userId, role);
    } else if (role === 'doctor') {
      filterParams.role = 'doctor';
      const doctors = await getDoctors();
      const matchedDoc = doctors.find(d => 
        d._id === userId || 
        d.name.toLowerCase() === (userId === 'user_doctor_1' ? 'dr. anil sharma' : '').toLowerCase()
      );
      filterParams.doctorId = matchedDoc?._id || 'doc_anil_sharma';
    } else {
      filterParams.role = role;
    }

    const apps = await getAppointments(filterParams as any);
    res.json(apps);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't load your appointments right now. Please try again." });
  }
});

app.get('/api/appointments/:id/preparation', async (req, res) => {
  try {
    const prep = await getAppointmentPreparation(req.params.id);
    if (!prep) return res.status(404).json({ error: 'Preparation information not found' });
    res.json(prep);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't load preparation information right now. Please try again." });
  }
});

app.get('/api/appointments/:id', async (req, res) => {
  try {
    const appt = await getAppointmentById(req.params.id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appt);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't load appointment details right now. Please try again." });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;
    const patientId = await resolvePatientId(userId, role);
    const patientName = req.body.patientName || 'Rajesh Kumar';
    const patientPhone = req.body.patientPhone || '+91 98765 43210';

    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      visitType,
      visitTypeSource,
      previousAppointmentId
    } = req.body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'Missing required booking fields: doctorId, appointmentDate, appointmentTime' });
    }

    const result = await createAppointment({
      patientId,
      patientName,
      patientPhone,
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType: visitType || appointmentType,
      visitType: visitType || appointmentType,
      visitTypeSource,
      previousAppointmentId
    });
    res.status(201).json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "We couldn't create your appointment right now. Please try again." });
  }
});

// Patient Arrival Endpoint
app.post('/api/appointments/:id/arrive', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await markPatientArrived(id);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't record your arrival right now. Please try again." });
  }
});

app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, status, arrivalStatus, cancelReason, newDate, newTime } = req.body;

    if (action === 'arrive' || arrivalStatus === 'arrived' || status === 'arrived') {
      const result = await markPatientArrived(id);
      return res.json(result);
    }

    if (action === 'reschedule' || (newDate && newTime)) {
      const updated = await rescheduleAppointment(id, newDate, newTime);
      if (!updated) return res.status(404).json({ error: 'Appointment not found' });
      return res.json(updated);
    }

    if (status) {
      const updated = await updateAppointmentStatus(id, status, cancelReason);
      if (!updated) return res.status(404).json({ error: 'Appointment not found' });
      return res.json(updated);
    }

    res.status(400).json({ error: 'Invalid update payload' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "We couldn't update the appointment right now. Please try again." });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body || {};
    const updated = await updateAppointmentStatus(id, 'cancelled', cancelReason || 'Patient requested cancellation');
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment cancelled successfully', appointment: updated });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to cancel appointment', details: e.message });
  }
});

// Queue REST & Real-time SSE endpoints
app.get('/api/queue/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const queue = await getQueueByAppointmentId(appointmentId);
    if (!queue) return res.status(404).json({ error: 'Queue information unavailable for this appointment' });
    res.json(queue);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch queue', details: e.message });
  }
});

// Server-Sent Events Stream for Real-Time Queue Updates
app.get('/api/queue/stream/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendQueueUpdate = async () => {
    try {
      const q = await getQueueByAppointmentId(appointmentId);
      if (q) {
        res.write(`data: ${JSON.stringify(q)}\n\n`);
      }
    } catch {}
  };

  sendQueueUpdate();
  const interval = setInterval(sendQueueUpdate, 10000); // 10s SSE update

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.patch('/api/queue/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const updated = await advanceQueue(appointmentId);
    if (!updated) return res.status(404).json({ error: 'Queue record not found' });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to update queue', details: e.message });
  }
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key', {
  apiVersion: '2025-02-24.acacia' as any
});

async function resolvePatientId(userId?: string, role?: string): Promise<string> {
  if (!userId) return 'pat_rajesh_kumar';
  if (userId === 'user_patient_1') return 'pat_rajesh_kumar';
  const user = await getUserById(userId);
  if (user && user.role === 'patient') {
    return `pat_${user._id}`;
  }
  return `pat_${userId}`;
}

// PRESCRIPTIONS ENDPOINTS
app.get('/api/prescriptions', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (role === 'patient') {
      const patientId = await resolvePatientId(userId, role);
      const prescriptions = await getPrescriptionsForPatient(patientId);
      return res.json(prescriptions);
    } else if (role === 'doctor') {
      // Find doctor record
      const doctors = await getDoctors();
      const matchedDoc = doctors.find(d => d._id === userId || d.name.toLowerCase() === (userId === 'user_doctor_1' ? 'dr. anil sharma' : '').toLowerCase());
      const doctorId = matchedDoc?._id || userId;
      
      const prescriptions = await getPrescriptionsForAuthorizedDoctor(doctorId);
      return res.json(prescriptions);
    } else {
      return res.status(403).json({ error: 'Access denied. Prescriptions are only available for patients and doctors.' });
    }
  } catch (e: any) {
    console.error('[API] Error fetching prescriptions:', {
      error: e.message,
      stack: e.stack,
      role: req.headers['x-user-role'],
      userId: req.headers['x-user-id']
    });
    res.status(500).json({ error: 'Failed to fetch prescriptions', details: e.message });
  }
});

app.post('/api/prescriptions', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Only authorized doctors can create prescriptions.' });
    }

    const { patientId, title, prescriptionDate, notes, appointmentId } = req.body;
    if (!patientId || !title) {
      return res.status(400).json({ error: 'Patient ID and prescription title are required' });
    }

    // Resolve doctor info
    const doctors = await getDoctors();
    const matchedDoc = doctors.find(d => d._id === userId || d.name.toLowerCase() === (userId === 'user_doctor_1' ? 'dr. anil sharma' : '').toLowerCase());
    const doctorId = matchedDoc?._id || userId;
    const doctorName = matchedDoc?.name || 'Dr. Specialist';
    const hospitalId = matchedDoc?.hospitalId || 'hosp_careflow_01';

    const newPrescription = await createPrescription({
      patientId,
      doctorId,
      doctorName,
      hospitalId,
      hospitalName: 'CareFlow Multispeciality Hospital',
      title,
      prescriptionDate,
      notes,
      appointmentId
    });
    res.status(201).json(newPrescription);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to create prescription', details: e.message });
  }
});

app.patch('/api/prescriptions/:id', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Only doctors can edit prescriptions.' });
    }

    // Resolve doctorId
    const doctors = await getDoctors();
    const matchedDoc = doctors.find(d => d._id === userId || d.name.toLowerCase() === (userId === 'user_doctor_1' ? 'dr. anil sharma' : '').toLowerCase());
    const doctorId = matchedDoc?._id || userId;

    const updated = await updatePrescription(req.params.id, doctorId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Prescription not found or unauthorized' });
    }
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to update prescription', details: e.message });
  }
});

app.delete('/api/prescriptions/:id', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;
    
    if (role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied. Patients cannot delete prescriptions.' });
    }

    // Resolve doctorId
    const doctors = await getDoctors();
    const matchedDoc = doctors.find(d => d._id === userId || d.name.toLowerCase() === (userId === 'user_doctor_1' ? 'dr. anil sharma' : '').toLowerCase());
    const doctorId = matchedDoc?._id || userId;

    const success = await deletePrescription(req.params.id, doctorId, role);
    if (!success) {
      return res.status(404).json({ error: 'Prescription not found or unauthorized' });
    }
    res.json({ message: 'Prescription deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to delete prescription', details: e.message });
  }
});

// STRIPE PAYMENT ENDPOINTS
app.post('/api/payments/create-checkout-session', async (req, res) => {
  try {
    const role = req.headers['x-user-role'] as string;
    const userId = req.headers['x-user-id'] as string;
    if (role !== 'patient') {
      return res.status(403).json({ error: 'Access denied. Only patients can make appointment payments.' });
    }

    const { appointmentId, amount } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ error: 'appointmentId is required' });
    }

    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const patientId = await resolvePatientId(userId, role);
    if (appointment.patientId !== patientId && userId !== 'user_patient_1') {
      return res.status(403).json({ error: 'Unauthorized access to appointment payment' });
    }

    const chargeAmount = Math.round(Number(amount) || 750) * 100;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || req.get('host');
    const successUrl = `${protocol}://${host}/?payment=success&appointment_id=${appointmentId}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${protocol}://${host}/?payment=cancelled&appointment_id=${appointmentId}`;

    let session: Stripe.Checkout.Session;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey || stripeKey.startsWith('sk_test_placeholder') || stripeKey.includes('placeholder')) {
      const mockSessionId = `cs_test_mock_${Date.now()}`;
      session = {
        id: mockSessionId,
        url: `${protocol}://${host}/?payment=success&appointment_id=${appointmentId}&session_id=${mockSessionId}`
      } as any;
    } else {
      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `Consultation with ${appointment.doctorName}`,
                description: `${appointment.departmentName} Department - CareFlow Hospital`
              },
              unit_amount: chargeAmount
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          appointmentId,
          patientId
        }
      });
    }

    await createPayment({
      patientId,
      appointmentId,
      amount: Number(amount) || 750,
      currency: 'inr',
      stripeCheckoutSessionId: session.id,
      status: 'pending'
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (e: any) {
    console.error('[Stripe Error]', e);
    res.status(500).json({ error: e.message || 'Failed to create Stripe payment session' });
  }
});

app.post('/api/payments/verify-session', async (req, res) => {
  try {
    const { sessionId, appointmentId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    if (sessionId.startsWith('cs_test_mock_')) {
      if (appointmentId) {
        await updateAppointmentStatus(appointmentId, 'confirmed');
      }
      await updatePaymentStatus(sessionId, 'paid', `pi_mock_${Date.now()}`);
      return res.json({ status: 'paid', verified: true, appointmentId });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const apptId = session.metadata?.appointmentId || appointmentId;
      if (apptId) {
        await updateAppointmentStatus(apptId, 'confirmed');
      }
      await updatePaymentStatus(sessionId, 'paid', session.payment_intent as string);
      return res.json({ status: 'paid', verified: true, appointmentId: apptId });
    } else {
      await updatePaymentStatus(sessionId, 'failed');
      return res.status(400).json({ status: session.payment_status, verified: false });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to verify payment session' });
  }
});

// Hospitals & Navigation
app.get('/api/hospitals/:id', async (req, res) => {
  try {
    const hosp = await getHospitalInfo();
    res.json(hosp);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch hospital info', details: e.message });
  }
});

app.get('/api/hospitals/:id/navigation', async (req, res) => {
  try {
    const { departmentId } = req.query;
    const nav = await getHospitalNavigation(departmentId as string);
    res.json(nav);
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to fetch navigation routes', details: e.message });
  }
});

// Sarvam AI Voice & Intent API Endpoints
app.post('/api/ai/intent', async (req, res) => {
  try {
    const { text, message, language, context } = req.body;
    const inputMessage = message || text;
    if (!inputMessage) return res.status(400).json({ error: 'Message or text input is required' });

    const result = await processSarvamNLU(inputMessage, language || 'en', context || {});
    res.json(result);
  } catch (e: any) {
    res.status(500).json({
      error: 'Sarvam AI processing failed',
      details: e.message,
      fallbackMessage: 'Voice assistance is temporarily unavailable. You can continue using the application manually.'
    });
  }
});

app.post('/api/ai/voice', async (req, res) => {
  try {
    const { text, audioBase64, language, context } = req.body;
    const transcript = await processSarvamSTT({ audioBase64, transcript: text, language: language || 'en' });
    if (!transcript) return res.status(400).json({ error: 'Could not transcribe speech or transcript is empty' });

    const result = await processSarvamNLU(transcript, language || 'en', context || {});
    res.json({
      transcript,
      ...result,
      audioSupported: true
    });
  } catch (e: any) {
    res.status(500).json({
      error: 'Sarvam AI voice error',
      details: e.message,
      fallbackMessage: 'Voice assistance is temporarily unavailable. You can continue manually.'
    });
  }
});

/* VITE INTEGRATION */
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom'
  });
  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = await vite.transformIndexHtml(url, `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CareFlow - Smart Patient Appointment & Queue Management</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[CareFlow Server] Hospital backend platform active on port ${PORT}`);
  });
}

export default app;
