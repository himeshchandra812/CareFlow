import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  connectToDatabase,
  getDoctors,
  getDoctorById,
  getDepartments,
  getDepartmentById,
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  getQueueByAppointmentId,
  advanceQueue,
  markPatientArrived,
  getHospitalInfo,
  getHospitalNavigation
} from './src/db/mongo.js';
import { processSarvamNLU } from './src/services/sarvam/intentEngine.js';
import { processSarvamSTT } from './src/services/sarvam/voiceEngine.js';

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
app.get('/api/appointments', async (req, res) => {
  try {
    const apps = await getAppointments();
    res.json(apps);
  } catch (e: any) {
    res.status(500).json({ error: "We couldn't load your appointments right now. Please try again." });
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
    const { patientName, patientPhone, doctorId, appointmentDate, appointmentTime, appointmentType } = req.body;
    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: 'Missing required booking fields: doctorId, appointmentDate, appointmentTime' });
    }
    const result = await createAppointment({
      patientName,
      patientPhone,
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType: appointmentType || 'new_visit'
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
    const { action, status, cancelReason, newDate, newTime } = req.body;

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
    res.status(500).json({ error: "We couldn't update the appointment right now. Please try again." });
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
