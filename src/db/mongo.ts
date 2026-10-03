import { MongoClient, Db } from 'mongodb';
import {
  SEED_DEPARTMENTS,
  SEED_DOCTORS,
  SEED_HOSPITAL,
  SEED_HOSPITAL_LOCATIONS,
  SEED_PATIENTS,
  SEED_APPOINTMENTS,
  SEED_QUEUES
} from './seedData.js';
import {
  Doctor,
  Department,
  Hospital,
  HospitalLocation,
  Appointment,
  QueueState,
  Patient,
  VisitType,
  VisitTypeSource,
  VisitTypeDetectionResult,
  AppointmentPreparationInfo
} from '../types/index.js';

declare global {
  var _careflowMongoClient: MongoClient | undefined;
  var _careflowMongoDb: Db | undefined;
}

let mongoClient: MongoClient | null = globalThis._careflowMongoClient || null;
let dbInstance: Db | null = globalThis._careflowMongoDb || null;
let isConnecting = false;
let lastConnectionAttempt = 0;
const CONNECTION_COOLDOWN_MS = 5000;

// Resilient in-memory fallback store if MongoDB Atlas is temporarily unreachable
const inMemoryStore = {
  hospitals: [SEED_HOSPITAL] as Hospital[],
  departments: [...SEED_DEPARTMENTS] as Department[],
  doctors: [...SEED_DOCTORS] as Doctor[],
  patients: [...SEED_PATIENTS] as Patient[],
  appointments: [...SEED_APPOINTMENTS] as Appointment[],
  queues: [...SEED_QUEUES] as QueueState[],
  hospitalLocations: [...SEED_HOSPITAL_LOCATIONS] as HospitalLocation[]
};

/**
 * Connect to MongoDB Atlas with connection pooling and singleton reuse
 */
export async function connectToDatabase(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  // Avoid spamming unreachable connections in tight loops
  const now = Date.now();
  if (now - lastConnectionAttempt < CONNECTION_COOLDOWN_MS) {
    return null;
  }

  if (isConnecting) {
    // Wait for connection in progress
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (dbInstance) return dbInstance;
  }

  isConnecting = true;
  lastConnectionAttempt = now;

  try {
    mongoClient = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 3000
    });

    await mongoClient.connect();
    // Use target database: 'careflow'
    dbInstance = mongoClient.db('careflow');
    globalThis._careflowMongoClient = mongoClient;
    globalThis._careflowMongoDb = dbInstance;
    console.log('[CareFlow DB] Successfully connected to MongoDB Atlas database: careflow');

    // Ensure initial collections & documents are populated if empty
    await initializeCollections(dbInstance);
    isConnecting = false;
    return dbInstance;
  } catch (err: any) {
    isConnecting = false;
    return null;
  }
}

/**
 * Initialize default collections if database is newly provisioned
 */
async function initializeCollections(db: Db) {
  try {
    const doctorsCol = db.collection('doctors');
    const docCount = await doctorsCol.countDocuments();
    if (docCount === 0) {
      console.log('[CareFlow DB] Initializing seed data into MongoDB Atlas collections...');
      await db.collection<any>('hospitals').insertOne(SEED_HOSPITAL);
      await db.collection<any>('departments').insertMany(SEED_DEPARTMENTS);
      await db.collection<any>('doctors').insertMany(SEED_DOCTORS);
      await db.collection<any>('patients').insertMany(SEED_PATIENTS);
      await db.collection<any>('appointments').insertMany(SEED_APPOINTMENTS);
      await db.collection<any>('queues').insertMany(SEED_QUEUES);
      await db.collection<any>('hospital_locations').insertMany(SEED_HOSPITAL_LOCATIONS);
      console.log('[CareFlow DB] MongoDB Atlas collections initialized successfully.');
    } else {
      // Ensure unique profile images are synchronized
      for (const doc of SEED_DOCTORS) {
        await doctorsCol.updateOne(
          { _id: doc._id as any },
          { $set: { profileImage: doc.profileImage } }
        );
      }
    }
  } catch (e: any) {
    console.error('[CareFlow DB] Non-fatal error checking collection counts:', e.message);
  }
}

// ----------------------------------------------------
// DOCTORS COLLECTION
// ----------------------------------------------------

export async function getDoctors(filter?: {
  departmentId?: string;
  search?: string;
  language?: string;
}): Promise<Doctor[]> {
  const db = await connectToDatabase();
  let list: Doctor[];

  if (db) {
    const query: any = {};
    if (filter?.departmentId && filter.departmentId !== 'all') {
      query.departmentId = filter.departmentId;
    }
    if (filter?.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { specialization: { $regex: filter.search, $options: 'i' } },
        { departmentName: { $regex: filter.search, $options: 'i' } }
      ];
    }
    list = await db.collection<Doctor>('doctors').find(query).toArray();
  } else {
    list = [...inMemoryStore.doctors];
    if (filter?.departmentId && filter.departmentId !== 'all') {
      list = list.filter((d) => d.departmentId === filter.departmentId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.departmentName.toLowerCase().includes(q) ||
          d.languages.some((l) => l.toLowerCase().includes(q))
      );
    }
  }

  if (filter?.language && filter.language !== 'all') {
    const lang = filter.language.toLowerCase();
    list = list.filter((d) => d.languages.some((l) => l.toLowerCase() === lang));
  }

  return list;
}

export async function getDoctorById(id: string): Promise<Doctor | null> {
  const db = await connectToDatabase();
  if (db) {
    return await db.collection<Doctor>('doctors').findOne({ _id: id });
  }
  return inMemoryStore.doctors.find((d) => d._id === id) || null;
}

// ----------------------------------------------------
// DEPARTMENTS COLLECTION
// ----------------------------------------------------

export async function getDepartments(): Promise<Department[]> {
  const db = await connectToDatabase();
  if (db) {
    return await db.collection<Department>('departments').find().toArray();
  }
  return inMemoryStore.departments;
}

export async function getDepartmentById(id: string): Promise<Department | null> {
  const db = await connectToDatabase();
  if (db) {
    const dept = await db.collection<Department>('departments').findOne({ _id: id });
    if (dept) return dept;
    return await db.collection<Department>('departments').findOne({
      name: { $regex: `^${id}$`, $options: 'i' }
    });
  }
  return (
    inMemoryStore.departments.find(
      (d) => d._id === id || d.name.toLowerCase() === id.toLowerCase()
    ) || null
  );
}

// ----------------------------------------------------
// PATIENTS COLLECTION & PHONE NORMALIZATION
// ----------------------------------------------------

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = `+${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = `+91${cleaned.slice(1)}`;
    } else {
      cleaned = `+91${cleaned}`;
    }
  }
  return cleaned;
}

export async function getPatientByPhone(phone: string): Promise<Patient | null> {
  const normalized = normalizePhoneNumber(phone);
  const rawDigits = normalized.replace(/[^0-9]/g, ''); // e.g. 919876543210
  const national10 = rawDigits.slice(-10); // e.g. 9876543210

  const db = await connectToDatabase();
  if (db) {
    // Search by normalized, raw, or national 10 digits
    const existing = await db.collection<Patient>('patients').findOne({
      $or: [
        { phone: normalized },
        { phone: rawDigits },
        { phone: { $regex: national10 } }
      ]
    });
    if (existing) return existing;
  }

  // Fallback to in-memory store
  const found = inMemoryStore.patients.find((p) => {
    const pNorm = normalizePhoneNumber(p.phone);
    return pNorm === normalized || p.phone.replace(/[^0-9]/g, '').slice(-10) === national10;
  });
  return found || null;
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const db = await connectToDatabase();
  if (db) {
    const existing = await db.collection<Patient>('patients').findOne({ _id: id as any });
    if (existing) return existing;
  }
  return inMemoryStore.patients.find((p) => p._id === id) || null;
}

export async function createPatient(data: Partial<Patient>): Promise<Patient> {
  const db = await connectToDatabase();
  const normalizedPhone = normalizePhoneNumber(data.phone || '');
  
  const newPatient: Patient = {
    _id: `pat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: data.name?.trim() || 'Patient',
    age: data.age || 35,
    phone: normalizedPhone,
    email: data.email || `${normalizedPhone.replace(/[^0-9]/g, '')}@careflow.org`,
    preferredLanguage: data.preferredLanguage || 'en',
    accessibilityMode: !!data.accessibilityMode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (db) {
    await db.collection<Patient>('patients').insertOne(newPatient);
  } else {
    inMemoryStore.patients.unshift(newPatient);
  }

  return newPatient;
}

export async function updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
  const db = await connectToDatabase();
  const updateDoc = {
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (db) {
    await db.collection<any>('patients').updateOne({ _id: id as any }, { $set: updateDoc });
  } else {
    const p = inMemoryStore.patients.find((pt) => pt._id === id);
    if (p) {
      Object.assign(p, updateDoc);
    }
  }
  return getPatientById(id);
}

export async function getAppointments(patientId?: string): Promise<Appointment[]> {
  const db = await connectToDatabase();
  let apps: Appointment[] = [];
  if (db) {
    const query = patientId ? { patientId } : {};
    apps = await db
      .collection<Appointment>('appointments')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  } else {
    apps = [...inMemoryStore.appointments];
    if (patientId) {
      apps = apps.filter((a) => a.patientId === patientId);
    }
  }

  return apps.map((a) => ({
    ...a,
    arrivalStatus: a.arrivalStatus || (a.status === 'arrived' || a.status === 'waiting' || a.status === 'in_progress' ? 'arrived' : 'not_arrived')
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const db = await connectToDatabase();
  let app: Appointment | null = null;
  if (db) {
    app = await db.collection<Appointment>('appointments').findOne({ _id: id as any });
  } else {
    app = inMemoryStore.appointments.find((a) => a._id === id) || null;
  }
  if (!app) return null;
  return {
    ...app,
    arrivalStatus: app.arrivalStatus || (app.status === 'arrived' || app.status === 'waiting' || app.status === 'in_progress' ? 'arrived' : 'not_arrived')
  };
}

export async function detectVisitType(params: {
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
}): Promise<VisitTypeDetectionResult> {
  const patientId = params.patientId || 'pat_rajesh_kumar';
  const db = await connectToDatabase();

  let patientAppointments: Appointment[] = [];
  if (db) {
    patientAppointments = await db
      .collection<Appointment>('appointments')
      .find({ patientId, status: { $ne: 'cancelled' } })
      .sort({ createdAt: -1 })
      .toArray();
  } else {
    patientAppointments = inMemoryStore.appointments.filter(
      (a) => a.patientId === patientId && a.status !== 'cancelled'
    );
  }

  // 1. Same Doctor match (highest priority)
  if (params.doctorId) {
    const docMatch = patientAppointments.find(
      (a) =>
        a.doctorId === params.doctorId &&
        (a.status === 'completed' || a._id === 'app_1000' || new Date(a.appointmentDate) <= new Date())
    );
    if (docMatch) {
      return {
        visitType: 'follow_up',
        visitTypeSource: 'detected',
        previousAppointmentId: docMatch._id,
        matchedDoctorName: docMatch.doctorName,
        matchedDate: docMatch.appointmentDate,
        reason: `Based on your previous appointment with ${docMatch.doctorName} on ${docMatch.appointmentDate}.`
      };
    }
  }

  // 2. Same Department match (second priority)
  if (params.departmentId) {
    const deptMatch = patientAppointments.find(
      (a) =>
        a.departmentId === params.departmentId &&
        (a.status === 'completed' || a._id === 'app_1000' || new Date(a.appointmentDate) <= new Date())
    );
    if (deptMatch) {
      return {
        visitType: 'follow_up',
        visitTypeSource: 'detected',
        previousAppointmentId: deptMatch._id,
        matchedDepartmentName: deptMatch.departmentName,
        matchedDate: deptMatch.appointmentDate,
        reason: `Based on your previous appointment in ${deptMatch.departmentName} on ${deptMatch.appointmentDate}.`
      };
    }
  }

  // 3. No previous relevant consultation found
  return {
    visitType: 'new_visit',
    visitTypeSource: 'detected',
    previousAppointmentId: null,
    reason: 'No previous relevant consultation was found.'
  };
}

export async function getAppointmentPreparation(
  appointmentId: string
): Promise<AppointmentPreparationInfo | null> {
  const appointment = await getAppointmentById(appointmentId);
  if (!appointment) return null;

  const dept = await getDepartmentById(appointment.departmentId);
  const visitType: VisitType =
    appointment.visitType || appointment.appointmentType || 'new_visit';

  const documentsToBring =
    visitType === 'follow_up'
      ? [
          'Reports & prescriptions from your previous consultation',
          'Any newly completed lab, ECG, or imaging test results',
          'Your current daily prescription medication list',
          'Government Photo ID or Hospital Registration Card'
        ]
      : [
          'Valid Government Photo ID or Hospital Registration Card',
          'Previous medical history records or test reports if available',
          'List of all current medications & known drug allergies'
        ];

  const instructions =
    dept?.preparationInstructions && dept.preparationInstructions.length > 0
      ? dept.preparationInstructions
      : [
          'Arrive on time to ensure prompt consultation.',
          'Bring all relevant health documents.',
          'Wear loose-fitting, comfortable clothing.'
        ];

  return {
    appointmentId: appointment._id,
    visitType,
    visitTypeLabel: visitType === 'follow_up' ? 'Follow-up Visit' : 'New Visit',
    doctorName: appointment.doctorName,
    departmentName: appointment.departmentName,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    instructions,
    documentsToBring,
    recommendedArrivalTimeMinutes: visitType === 'follow_up' ? 10 : 15,
    medicationNote:
      'Please carry all daily prescriptions and current ongoing medications in their original packaging.',
    locationNote: `${appointment.locationDetails.block} • ${appointment.locationDetails.floor} • ${appointment.locationDetails.room}`
  };
}

export async function createAppointment(bookingData: {
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType?: VisitType;
  visitType?: VisitType;
  visitTypeSource?: VisitTypeSource;
  previousAppointmentId?: string | null;
}): Promise<{ appointment: Appointment; queue: QueueState }> {
  const db = await connectToDatabase();
  
  // 1. Validate request
  if (!bookingData.doctorId || !bookingData.appointmentDate || !bookingData.appointmentTime) {
    throw new Error('Doctor, appointment date, and time slot are required');
  }

  // 2. Check that doctor exists
  const doctor = await getDoctorById(bookingData.doctorId);
  if (!doctor) {
    throw new Error('Selected doctor does not exist');
  }

  const dept = await getDepartmentById(doctor.departmentId);

  const effectivePatientId = bookingData.patientId || 'pat_rajesh_kumar';
  const effectivePatient = await getPatientById(effectivePatientId);

  // 3. Perform Server-side Visit Type Detection
  const detection = await detectVisitType({
    patientId: effectivePatientId,
    doctorId: doctor._id,
    departmentId: doctor.departmentId
  });

  // Determine final visitType based on detection & explicit patient input
  const finalVisitType: VisitType =
    bookingData.visitType || bookingData.appointmentType || detection.visitType;
  const finalVisitTypeSource: VisitTypeSource =
    bookingData.visitTypeSource || (bookingData.visitType ? 'patient_confirmed' : detection.visitTypeSource);
  const finalPrevId: string | null =
    bookingData.previousAppointmentId !== undefined
      ? bookingData.previousAppointmentId
      : detection.previousAppointmentId;

  // 4. Check existing count for unique token calculation
  const existingCount = db
    ? await db.collection('appointments').countDocuments({
        doctorId: doctor._id,
        appointmentDate: bookingData.appointmentDate
      })
    : inMemoryStore.appointments.filter(
        (a) => a.doctorId === doctor._id && a.appointmentDate === bookingData.appointmentDate
      ).length;

  const num = 120 + existingCount + 1;
  const tokenNumber = `A-${num}`;

  // 5. Create appointment document
  const newApp: Appointment = {
    _id: `app_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    patientId: effectivePatientId,
    patientName: bookingData.patientName || effectivePatient?.name || 'Rajesh Kumar',
    patientPhone: bookingData.patientPhone || effectivePatient?.phone || '+91 98765 43210',
    doctorId: doctor._id,
    doctorName: doctor.name,
    doctorSpecialization: doctor.specialization,
    hospitalId: doctor.hospitalId,
    departmentId: doctor.departmentId,
    departmentName: doctor.departmentName,
    appointmentDate: bookingData.appointmentDate,
    appointmentTime: bookingData.appointmentTime,
    appointmentType: finalVisitType,
    visitType: finalVisitType,
    visitTypeSource: finalVisitTypeSource,
    previousAppointmentId: finalPrevId,
    previousAppointmentReason: detection.reason,
    tokenNumber,
    status: 'confirmed',
    estimatedWaitTime: Math.max(12, existingCount * 3),
    locationDetails: {
      block: dept?.block || 'Block B',
      floor: dept?.floor || '2nd Floor',
      room: dept?.location || 'Room 204'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const currentTokenNum = Math.max(115, num - (existingCount > 0 ? existingCount : 5));
  const patientsAhead = Math.max(1, num - currentTokenNum);
  const estWait = patientsAhead * 3;

  const newQueue: QueueState = {
    _id: `queue_${newApp._id}`,
    appointmentId: newApp._id,
    doctorId: doctor._id,
    doctorName: doctor.name,
    departmentId: doctor.departmentId,
    departmentName: doctor.departmentName,
    currentToken: `A-${currentTokenNum}`,
    patientToken: tokenNumber,
    patientsAhead,
    estimatedWaitTime: estWait,
    doctorStatus: doctor.doctorStatus || 'Consulting',
    doctorStatusMessage: `${doctor.name} is currently consulting Token A-${currentTokenNum}.`,
    averageConsultationMinutes: 3,
    recentConsultationDurations: [3, 4, 3, 2, 4],
    isPatientArrived: false,
    lastUpdated: new Date().toISOString()
  };

  // 5. Save to MongoDB Atlas
  if (db) {
    await db.collection<any>('appointments').insertOne(newApp);
    await db.collection<any>('queues').insertOne(newQueue);
  } else {
    inMemoryStore.appointments.unshift(newApp);
    inMemoryStore.queues.unshift(newQueue);
  }

  return { appointment: newApp, queue: newQueue };
}

export async function markPatientArrived(
  appointmentId: string
): Promise<{ appointment: Appointment; queue: QueueState }> {
  const db = await connectToDatabase();
  const arrivalTime = new Date().toISOString();

  if (db) {
    const existing = await db.collection<Appointment>('appointments').findOne({ _id: appointmentId as any });
    if (!existing) {
      throw new Error('Appointment not found');
    }
    if (existing.status === 'cancelled') {
      throw new Error('Cannot check in for a cancelled appointment');
    }

    await db.collection<any>('appointments').updateOne(
      { _id: appointmentId as any },
      { $set: { status: 'arrived', arrivalStatus: 'arrived', arrivedAt: arrivalTime, updatedAt: arrivalTime } }
    );
    await db.collection<any>('queues').updateOne(
      { appointmentId },
      { $set: { isPatientArrived: true, lastUpdated: arrivalTime } }
    );
  } else {
    const app = inMemoryStore.appointments.find((a) => a._id === appointmentId);
    if (!app) throw new Error('Appointment not found');
    if (app.status === 'cancelled') throw new Error('Cannot check in for a cancelled appointment');

    app.status = 'arrived';
    app.arrivalStatus = 'arrived';
    app.arrivedAt = arrivalTime;
    app.updatedAt = arrivalTime;

    const q = inMemoryStore.queues.find((q) => q.appointmentId === appointmentId);
    if (q) {
      q.isPatientArrived = true;
      q.lastUpdated = arrivalTime;
    }
  }

  const updatedApp = await getAppointmentById(appointmentId);
  const updatedQueue = await getQueueByAppointmentId(appointmentId);

  if (!updatedApp || !updatedQueue) throw new Error('Appointment verification failed after update');
  return { appointment: updatedApp, queue: updatedQueue };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment['status'],
  cancelReason?: string
): Promise<Appointment | null> {
  const db = await connectToDatabase();
  const updateDoc = {
    status,
    ...(cancelReason ? { cancelReason } : {}),
    updatedAt: new Date().toISOString()
  };

  if (db) {
    await db
      .collection<any>('appointments')
      .updateOne({ _id: appointmentId as any }, { $set: updateDoc });
    return await db.collection<any>('appointments').findOne({ _id: appointmentId as any });
  }

  const app = inMemoryStore.appointments.find((a) => a._id === appointmentId);
  if (app) {
    app.status = status;
    if (cancelReason) app.cancelReason = cancelReason;
    app.updatedAt = new Date().toISOString();

    if (status === 'cancelled') {
      const q = inMemoryStore.queues.find((q) => q.appointmentId === appointmentId);
      if (q) {
        q.patientsAhead = Math.max(0, q.patientsAhead - 1);
        q.estimatedWaitTime = q.patientsAhead * q.averageConsultationMinutes;
      }
    }
  }
  return app || null;
}

export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string
): Promise<Appointment | null> {
  const db = await connectToDatabase();
  const updateDoc = {
    appointmentDate: newDate,
    appointmentTime: newTime,
    status: 'confirmed' as const,
    updatedAt: new Date().toISOString()
  };

  if (db) {
    await db
      .collection<any>('appointments')
      .updateOne({ _id: appointmentId as any }, { $set: updateDoc });
    return await db.collection<any>('appointments').findOne({ _id: appointmentId as any });
  }

  const app = inMemoryStore.appointments.find((a) => a._id === appointmentId);
  if (app) {
    app.appointmentDate = newDate;
    app.appointmentTime = newTime;
    app.status = 'confirmed';
    app.updatedAt = new Date().toISOString();
  }
  return app || null;
}

export async function getQueueByAppointmentId(appointmentId: string): Promise<QueueState | null> {
  const db = await connectToDatabase();
  if (db) {
    const existing = await db.collection<QueueState>('queues').findOne({ appointmentId });
    if (existing) return existing;

    const app = await db.collection<Appointment>('appointments').findOne({ _id: appointmentId as any });
    if (app) {
      const curNum = parseInt(app.tokenNumber.split('-')[1] || '120') - 6;
      const initialQueue: QueueState = {
        _id: `queue_${app._id}`,
        appointmentId: app._id,
        doctorId: app.doctorId,
        doctorName: app.doctorName,
        departmentId: app.departmentId,
        departmentName: app.departmentName,
        currentToken: `A-${Math.max(100, curNum)}`,
        patientToken: app.tokenNumber,
        patientsAhead: 6,
        estimatedWaitTime: 18,
        doctorStatus: 'Consulting',
        doctorStatusMessage: `${app.doctorName} is currently consulting Token A-${Math.max(100, curNum)}.`,
        averageConsultationMinutes: 3,
        recentConsultationDurations: [3, 4, 3, 2, 4],
        isPatientArrived: app.status === 'arrived',
        lastUpdated: new Date().toISOString()
      };
      await db.collection<any>('queues').insertOne(initialQueue);
      return initialQueue;
    }
    return null;
  }

  const q = inMemoryStore.queues.find((q) => q.appointmentId === appointmentId);
  if (q) return q;

  const app = inMemoryStore.appointments.find((a) => a._id === appointmentId);
  if (app) {
    const curNum = parseInt(app.tokenNumber.split('-')[1] || '120') - 6;
    const initialQueue: QueueState = {
      _id: `queue_${app._id}`,
      appointmentId: app._id,
      doctorId: app.doctorId,
      doctorName: app.doctorName,
      departmentId: app.departmentId,
      departmentName: app.departmentName,
      currentToken: `A-${Math.max(100, curNum)}`,
      patientToken: app.tokenNumber,
      patientsAhead: 6,
      estimatedWaitTime: 18,
      doctorStatus: 'Consulting',
      doctorStatusMessage: `${app.doctorName} is currently consulting Token A-${Math.max(100, curNum)}.`,
      averageConsultationMinutes: 3,
      recentConsultationDurations: [3, 4, 3, 2, 4],
      isPatientArrived: app.status === 'arrived',
      lastUpdated: new Date().toISOString()
    };
    inMemoryStore.queues.push(initialQueue);
    return initialQueue;
  }
  return null;
}

export async function advanceQueue(appointmentId: string): Promise<QueueState | null> {
  const q = await getQueueByAppointmentId(appointmentId);
  if (!q) return null;

  const currentNum = parseInt(q.currentToken.replace(/[^0-9]/g, '')) || 119;
  const nextNum = currentNum + 1;
  const patientNum = parseInt(q.patientToken.replace(/[^0-9]/g, '')) || 127;

  const lastDuration = Math.floor(Math.random() * 3) + 2;
  const recent = [...(q.recentConsultationDurations || [3, 4, 3]), lastDuration].slice(-5);
  const avgDuration = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);

  const patientsAhead = Math.max(0, patientNum - nextNum);
  const estWait = patientsAhead * avgDuration;

  q.currentToken = `A-${nextNum}`;
  q.patientsAhead = patientsAhead;
  q.recentConsultationDurations = recent;
  q.averageConsultationMinutes = avgDuration;
  q.estimatedWaitTime = estWait;
  q.doctorStatusMessage = `${q.doctorName} is currently consulting Token A-${nextNum}.`;
  q.lastUpdated = new Date().toISOString();

  const db = await connectToDatabase();
  if (db) {
    await db.collection<any>('queues').updateOne({ appointmentId }, { $set: q });
  }
  return q;
}

// ----------------------------------------------------
// HOSPITALS & HOSPITAL LOCATIONS COLLECTIONS
// ----------------------------------------------------

export async function getHospitalInfo(): Promise<Hospital> {
  const db = await connectToDatabase();
  if (db) {
    const hosp = await db.collection<Hospital>('hospitals').findOne({ _id: 'hosp_careflow_01' });
    if (hosp) return hosp;
  }
  return inMemoryStore.hospitals[0];
}

export async function getHospitalNavigation(departmentId?: string): Promise<HospitalLocation[]> {
  const db = await connectToDatabase();
  let list: HospitalLocation[];
  if (db) {
    const query = departmentId ? { department: { $regex: departmentId, $options: 'i' } } : {};
    list = await db.collection<HospitalLocation>('hospital_locations').find(query).toArray();
  } else {
    list = [...inMemoryStore.hospitalLocations];
  }

  if (departmentId) {
    const dept = inMemoryStore.departments.find(
      (d) => d._id === departmentId || d.name.toLowerCase() === departmentId.toLowerCase()
    );
    if (dept) {
      list = list.filter(
        (l) =>
          l.department.toLowerCase() === dept.name.toLowerCase() ||
          l.department.toLowerCase() === dept._id.toLowerCase()
      );
    }
  }

  if (list.length === 0) {
    return inMemoryStore.hospitalLocations;
  }
  return list;
}
