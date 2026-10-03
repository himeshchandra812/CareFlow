import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Home, Calendar, Clock, MapPin, HelpCircle, Stethoscope, Ambulance, ShieldCheck, Search, Building2 } from 'lucide-react';
import { AppShell } from './components/AppShell.js';
import { HomeDashboard } from './components/HomeDashboard.js';
import { SeniorModeHome } from './components/SeniorModeHome.js';
import { FindDoctor } from './components/FindDoctor.js';
import { DepartmentsView } from './components/DepartmentsView.js';
import { DoctorProfileModal } from './components/DoctorProfileModal.js';
import { BookingStepperModal } from './components/BookingStepperModal.js';
import { AppointmentConfirmation } from './components/AppointmentConfirmation.js';
import { AppointmentsList } from './components/AppointmentsList.js';
import { QueueTracker } from './components/QueueTracker.js';
import { HospitalMap } from './components/HospitalMap.js';
import { PreparationCard } from './components/PreparationCard.js';
import { RescheduleModal } from './components/RescheduleModal.js';
import { CancelModal } from './components/CancelModal.js';
import { VoiceAssistantModal } from './components/VoiceAssistantModal.js';
import { HelpSupport } from './components/HelpSupport.js';

import {
  Doctor,
  Department,
  Appointment,
  QueueState,
  SupportedLanguage,
  SarvamIntentResponse,
  User
} from './types/index.js';
import { api } from './services/api.js';
import { authService } from './services/auth.js';
import { AuthScreen } from './components/AuthScreen.js';
import { DoctorDashboard } from './components/DoctorDashboard.js';
import { StaffDashboard } from './components/StaffDashboard.js';
import { AdminDashboard } from './components/AdminDashboard.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [seniorMode, setSeniorMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('careflow_senior_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    try {
      return (localStorage.getItem('careflow_lang') as SupportedLanguage) || 'en';
    } catch {
      return 'en';
    }
  });

  const handleToggleSeniorMode = () => {
    setSeniorMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('careflow_senior_mode', String(next));
      } catch {}
      return next;
    });
  };

  const handleLangChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem('careflow_lang', lang);
    } catch {}
  };

  // Application Data States (backed by MongoDB)
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Selection States
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedDoctorForProfile, setSelectedDoctorForProfile] = useState<Doctor | null>(null);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<Doctor | null>(null);
  const [lastBookedResult, setLastBookedResult] = useState<{ appointment: Appointment; queue: QueueState } | null>(null);
  
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [preparationDept, setPreparationDept] = useState<Department | null>(null);

  const [searchFilter, setSearchFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [mapTargetDeptId, setMapTargetDeptId] = useState<string | undefined>(undefined);

  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);

  // Initial Data Fetching from MongoDB APIs
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [docsData, deptsData, apptsData] = await Promise.all([
        api.getDoctors(),
        api.getDepartments(),
        api.getAppointments()
      ]);
      setDoctors(docsData);
      setDepartments(deptsData);
      setAppointments(apptsData);
    } catch (err) {
      console.error('[CareFlow] Error loading initial hospital data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, message });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const activeAppointment =
    appointments.find((a) => a._id === selectedAppointmentId) ||
    appointments.find(
      (a) => a.status === 'arrived' || a.status === 'waiting' || a.status === 'in_progress'
    ) ||
    appointments.find((a) => a.status === 'confirmed') ||
    null;

  // Toggle Senior Mode class on <body>
  useEffect(() => {
    if (seniorMode) {
      document.body.classList.add('senior-mode');
    } else {
      document.body.classList.remove('senior-mode');
    }
  }, [seniorMode]);

  // Handle Sarvam Voice / AI Intent Execution across all 10 intents
  const handleSarvamIntent = async (result: SarvamIntentResponse, confirmAction: boolean = false) => {
    // 1. find_doctor
    if (result.intent === 'find_doctor') {
      if (result.department) {
        const found = departments.find(
          (d) => d.name.toLowerCase() === result.department?.toLowerCase()
        );
        if (found) setDeptFilter(found._id);
      }
      setCurrentTab('doctors');
    }
    // 2. find_department
    else if (result.intent === 'find_department') {
      setCurrentTab('departments');
    }
    // 3. view_appointment
    else if (result.intent === 'view_appointment') {
      if (result.extractedParams?.appointment) {
        setSelectedAppointmentId(result.extractedParams.appointment._id || result.extractedParams.appointment.id);
      }
      setCurrentTab('appointments');
    }
    // 4. check_queue
    else if (result.intent === 'check_queue') {
      if (result.extractedParams?.appointment) {
        setSelectedAppointmentId(result.extractedParams.appointment._id || result.extractedParams.appointment.id);
      }
      setCurrentTab('queue');
    }
    // 5. navigate_hospital
    else if (result.intent === 'navigate_hospital') {
      if (result.extractedParams?.appointment) {
        setSelectedAppointmentId(result.extractedParams.appointment._id || result.extractedParams.appointment.id);
      }
      if (result.department) {
        const found = departments.find(
          (d) => d.name.toLowerCase() === result.department?.toLowerCase()
        );
        if (found) setMapTargetDeptId(found._id);
      }
      setCurrentTab('map');
    }
    // 6. appointment_preparation
    else if (result.intent === 'appointment_preparation') {
      let resolvedAppt = activeAppointment;
      if (result.extractedParams?.appointment) {
        const apptId = result.extractedParams.appointment._id || result.extractedParams.appointment.id;
        setSelectedAppointmentId(apptId);
        resolvedAppt = appointments.find(a => a._id === apptId) || activeAppointment;
      }
      if (result.department) {
        const found = departments.find(
          (d) => d.name.toLowerCase() === result.department?.toLowerCase()
        );
        if (found) setPreparationDept(found);
      } else if (resolvedAppt) {
        const found = departments.find((d) => d._id === resolvedAppt.departmentId);
        if (found) setPreparationDept(found);
      }
    }
    // 7. book_appointment
    else if (result.intent === 'book_appointment') {
      if (result.extractedParams?.doctor) {
        setSelectedDoctorForBooking(result.extractedParams.doctor);
      } else if (doctors.length > 0) {
        setSelectedDoctorForBooking(doctors[0]);
      }
    }
    // 8. cancel_appointment
    else if (result.intent === 'cancel_appointment') {
      const resolvedApptId = result.extractedParams?.appointment?._id || result.extractedParams?.appointment?.id || result.extractedParams?.appointment?.id;
      const targetAppt = resolvedApptId
        ? (appointments.find(a => a._id === resolvedApptId) || activeAppointment)
        : activeAppointment;

      if (targetAppt) {
        if (confirmAction) {
          try {
            await api.updateAppointmentStatus(
              targetAppt._id,
              'cancelled',
              'Cancelled via Voice Assistant'
            );
            showToast('Appointment cancelled successfully.');
            fetchAllData();
            setCurrentTab('appointments');
          } catch {
            showToast('Unable to cancel the appointment. Please try again.', 'error');
          }
        } else {
          setCancelTarget(targetAppt);
        }
      } else {
        setCurrentTab('appointments');
      }
    }
    // 9. reschedule_appointment
    else if (result.intent === 'reschedule_appointment') {
      const resolvedApptId = result.extractedParams?.appointment?._id || result.extractedParams?.appointment?.id;
      const targetAppt = resolvedApptId
        ? (appointments.find(a => a._id === resolvedApptId) || activeAppointment)
        : activeAppointment;

      if (targetAppt) {
        setRescheduleTarget(targetAppt);
      } else {
        setCurrentTab('appointments');
      }
    }
    // 10. help
    else if (result.intent === 'help') {
      setCurrentTab('help');
    }
  };

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  let navItems = undefined;
  if (currentUser.role === 'doctor') {
    navItems = [
      { id: 'home', label: 'Dashboard', icon: Home },
      { id: 'doctor_schedule', label: 'Schedule', icon: Calendar },
      { id: 'doctor_queue', label: 'Live Queue', icon: Clock },
      { id: 'map', label: 'Navigate', icon: MapPin },
      { id: 'help', label: 'Help', icon: HelpCircle }
    ];
  } else if (currentUser.role === 'staff') {
    navItems = [
      { id: 'home', label: 'Operations', icon: Home },
      { id: 'staff_cases', label: 'Triage Cases', icon: Calendar },
      { id: 'map', label: 'Navigate', icon: MapPin },
      { id: 'help', label: 'Help', icon: HelpCircle }
    ];
  } else if (currentUser.role === 'hospital_admin') {
    navItems = [
      { id: 'home', label: 'Overview', icon: Home },
      { id: 'admin_analytics', label: 'Analytics', icon: Clock },
      { id: 'map', label: 'Navigate', icon: MapPin },
      { id: 'help', label: 'Help', icon: HelpCircle }
    ];
  }

  return (
    <AppShell
      currentTab={currentTab}
      onTabChange={(tab) => {
        setPreparationDept(null);
        setCurrentTab(tab);
      }}
      seniorMode={seniorMode}
      onToggleSeniorMode={handleToggleSeniorMode}
      currentLang={currentLang}
      onLangChange={handleLangChange}
      onOpenVoice={() => setIsVoiceOpen(true)}
      currentUser={currentUser}
      onLogout={() => {
        authService.clearSession();
        setCurrentUser(null);
      }}
      onSwitchRole={() => {
        authService.clearSession();
        setCurrentUser(null);
      }}
      navItems={navItems}
    >
      {currentUser.role === 'doctor' ? (
        currentTab === 'doctor_queue' ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            <h2 className="text-xl font-extrabold text-slate-900 font-outfit">Live Patient Queue Monitor</h2>
            <p className="text-xs text-slate-600">Real-time synchronization of consulting tokens.</p>
            <div className="space-y-3">
              {appointments.map((appt, idx) => (
                <div key={appt._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 text-teal-700 font-mono font-bold rounded-xl flex items-center justify-center border border-teal-200">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{appt.patientName}</div>
                      <div className="text-xs text-teal-700">Token {appt.tokenNumber} • {appt.appointmentTime}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                    {appt.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : currentTab === 'map' ? (
          <HospitalMap
            initialDepartmentId={mapTargetDeptId}
            departments={departments}
            seniorMode={seniorMode}
            currentLang={currentLang}
            onAppointmentUpdate={fetchAllData}
            onNavigateQueue={() => setCurrentTab('queue')}
          />
        ) : currentTab === 'help' ? (
          <HelpSupport seniorMode={seniorMode} onToggleSeniorMode={handleToggleSeniorMode} />
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-left z-10">
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
                  Doctor Portal
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit">Welcome back, {currentUser.name}</h1>
                <p className="text-sm text-slate-300">You have {appointments.length} patient consultations scheduled today.</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-300 shrink-0">
                <Stethoscope className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold font-outfit text-slate-900">Today's Patient Schedule</h2>
              <div className="grid grid-cols-1 gap-4">
                {appointments.map((appt) => (
                  <div key={appt._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-base">{appt.patientName}</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-mono">
                          Token {appt.tokenNumber}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                          {appt.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-4 flex-wrap">
                        <span>{appt.appointmentDate} • {appt.appointmentTime}</span>
                        <span>{appt.patientPhone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={async () => {
                          await api.updateAppointmentStatus(appt._id, 'arrived');
                          showToast('Patient marked as arrived');
                          fetchAllData();
                        }}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors cursor-pointer"
                      >
                        Mark Arrived
                      </button>
                      <button
                        onClick={async () => {
                          await api.updateAppointmentStatus(appt._id, 'in_progress');
                          showToast('Consultation started');
                          fetchAllData();
                        }}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Start Consult
                      </button>
                      <button
                        onClick={async () => {
                          await api.updateAppointmentStatus(appt._id, 'completed');
                          showToast('Consultation completed');
                          fetchAllData();
                        }}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : currentUser.role === 'staff' ? (
        currentTab === 'map' ? (
          <HospitalMap
            initialDepartmentId={mapTargetDeptId}
            departments={departments}
            seniorMode={seniorMode}
            currentLang={currentLang}
            onAppointmentUpdate={fetchAllData}
            onNavigateQueue={() => setCurrentTab('queue')}
          />
        ) : currentTab === 'help' ? (
          <HelpSupport seniorMode={seniorMode} onToggleSeniorMode={handleToggleSeniorMode} />
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-amber-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex items-center justify-between">
              <div className="space-y-2 text-left">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
                  EMT & Staff Operations
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit">Active Triage & Patient Arrivals</h1>
                <p className="text-sm text-slate-300">Operator: {currentUser.name}</p>
              </div>
              <Ambulance className="w-12 h-12 text-amber-400 shrink-0" />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold font-outfit text-slate-900">Incoming Patient Queue & Check-In</h2>
              <div className="grid grid-cols-1 gap-4">
                {appointments.map((appt) => (
                  <div key={appt._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
                    <div className="space-y-1 text-left">
                      <div className="font-bold text-slate-900 text-base">{appt.patientName} (Token {appt.tokenNumber})</div>
                      <div className="text-xs text-slate-600">{appt.departmentName} • {appt.appointmentTime}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await api.markPatientArrived(appt._id);
                        showToast('Patient arrival registered successfully');
                        fetchAllData();
                      }}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Check In Patient
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : currentUser.role === 'hospital_admin' ? (
        currentTab === 'map' ? (
          <HospitalMap
            initialDepartmentId={mapTargetDeptId}
            departments={departments}
            seniorMode={seniorMode}
            currentLang={currentLang}
            onAppointmentUpdate={fetchAllData}
            onNavigateQueue={() => setCurrentTab('queue')}
          />
        ) : currentTab === 'help' ? (
          <HelpSupport seniorMode={seniorMode} onToggleSeniorMode={handleToggleSeniorMode} />
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex items-center justify-between">
              <div className="space-y-2 text-left">
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
                  Hospital Administration
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit">Director Overview & Analytics</h1>
                <p className="text-sm text-slate-300">Welcome, {currentUser.name}</p>
              </div>
              <ShieldCheck className="w-12 h-12 text-teal-400 shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Departments</div>
                <div className="text-2xl font-extrabold text-slate-900 font-outfit mt-1">{departments.length}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Doctors</div>
                <div className="text-2xl font-extrabold text-slate-900 font-outfit mt-1">{doctors.length}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Appointments</div>
                <div className="text-2xl font-extrabold text-slate-900 font-outfit mt-1">{appointments.length}</div>
              </div>
            </div>
          </div>
        )
      ) : preparationDept ? (
        <PreparationCard
          department={preparationDept}
          appointment={activeAppointment}
          onBack={() => setPreparationDept(null)}
        />
      ) : lastBookedResult ? (
        /* Appointment Confirmation View */
        <AppointmentConfirmation
          appointment={lastBookedResult.appointment}
          queue={lastBookedResult.queue}
          departments={departments}
          currentLang={currentLang}
          onTrackQueue={() => {
            setLastBookedResult(null);
            setCurrentTab('queue');
          }}
          onGetDirections={() => {
            setMapTargetDeptId(lastBookedResult.appointment.departmentId);
            setLastBookedResult(null);
            setCurrentTab('map');
          }}
          onViewPreparation={() => {
            const dept = departments.find(d => d._id === lastBookedResult.appointment.departmentId);
            if (dept) setPreparationDept(dept);
            setLastBookedResult(null);
          }}
          onReschedule={() => {
            setRescheduleTarget(lastBookedResult.appointment);
          }}
          onCancel={() => {
            setCancelTarget(lastBookedResult.appointment);
          }}
          onDone={() => {
            setLastBookedResult(null);
            fetchAllData();
            setCurrentTab('home');
          }}
          onAppointmentUpdate={(res) => {
            if (res) {
              setLastBookedResult(res);
            }
            fetchAllData();
          }}
        />
      ) : (
        /* Tab Routing */
        <>
          {currentTab === 'home' && (
            seniorMode ? (
              <SeniorModeHome
                currentLang={currentLang}
                activeAppointment={activeAppointment}
                appointments={appointments}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenVoice={() => setIsVoiceOpen(true)}
                onAppointmentUpdate={fetchAllData}
                onSelectAppointmentId={setSelectedAppointmentId}
              />
            ) : (
              <HomeDashboard
                currentLang={currentLang}
                activeAppointment={activeAppointment}
                appointments={appointments}
                departments={departments}
                onNavigate={(tab, extra) => {
                  if (tab === 'preparation') {
                    if (extra?.appointmentId) {
                      setSelectedAppointmentId(extra.appointmentId);
                    }
                    if (extra?.departmentId) {
                      const dept = departments.find(d => d._id === extra.departmentId);
                      if (dept) setPreparationDept(dept);
                    } else if (activeAppointment) {
                      const dept = departments.find(d => d._id === activeAppointment.departmentId);
                      if (dept) setPreparationDept(dept);
                    }
                  } else {
                    if (extra?.search) setSearchFilter(extra.search);
                    if (extra?.departmentId) setMapTargetDeptId(extra.departmentId);
                    if (extra?.appointmentId) setSelectedAppointmentId(extra.appointmentId);
                    setCurrentTab(tab);
                  }
                }}
                onOpenVoice={() => setIsVoiceOpen(true)}
                onSelectDepartment={(deptId) => {
                  setDeptFilter(deptId);
                  setCurrentTab('doctors');
                }}
                onAppointmentUpdate={fetchAllData}
                onSelectAppointmentId={setSelectedAppointmentId}
              />
            )
          )}

          {currentTab === 'doctors' && (
            <FindDoctor
              doctors={doctors}
              departments={departments}
              currentLang={currentLang}
              seniorMode={seniorMode}
              initialSearch={searchFilter}
              initialDepartmentId={deptFilter}
              onSelectDoctor={(doc) => setSelectedDoctorForProfile(doc)}
              onBookDoctor={(doc) => setSelectedDoctorForBooking(doc)}
            />
          )}

          {currentTab === 'departments' && (
            <DepartmentsView
              departments={departments}
              doctors={doctors}
              currentLang={currentLang}
              seniorMode={seniorMode}
              onSelectDepartment={(deptId) => {
                setDeptFilter(deptId);
                setCurrentTab('doctors');
              }}
              onViewPrep={(dept) => setPreparationDept(dept)}
            />
          )}

          {currentTab === 'appointments' && (
            <AppointmentsList
              appointments={appointments}
              currentLang={currentLang}
              onTrackQueue={(appt) => {
                setSelectedAppointmentId(appt._id);
                setCurrentTab('queue');
              }}
              onGetDirections={(deptId, apptId) => {
                if (apptId) setSelectedAppointmentId(apptId);
                setMapTargetDeptId(deptId);
                setCurrentTab('map');
              }}
              onViewPreparation={(deptId, apptId) => {
                if (apptId) setSelectedAppointmentId(apptId);
                const dept = departments.find(d => d._id === deptId);
                if (dept) setPreparationDept(dept);
              }}
              onReschedule={(appt) => setRescheduleTarget(appt)}
              onCancel={(appt) => setCancelTarget(appt)}
              onBookNew={() => setCurrentTab('doctors')}
              onAppointmentUpdate={fetchAllData}
            />
          )}

          {currentTab === 'queue' && (
            <QueueTracker
              activeAppointment={activeAppointment}
              currentLang={currentLang}
              seniorMode={seniorMode}
              onNavigateMap={(deptId) => {
                if (deptId) setMapTargetDeptId(deptId);
                setCurrentTab('map');
              }}
              onAppointmentUpdate={fetchAllData}
            />
          )}

          {currentTab === 'map' && (
            <HospitalMap
              initialDepartmentId={mapTargetDeptId}
              departments={departments}
              activeAppointment={activeAppointment}
              seniorMode={seniorMode}
              currentLang={currentLang}
              onAppointmentUpdate={fetchAllData}
              onNavigateQueue={() => setCurrentTab('queue')}
            />
          )}

          {currentTab === 'help' && (
            <HelpSupport seniorMode={seniorMode} onToggleSeniorMode={handleToggleSeniorMode} />
          )}
        </>
      )}

      {/* Doctor Profile Modal */}
      <DoctorProfileModal
        doctor={selectedDoctorForProfile}
        currentLang={currentLang}
        seniorMode={seniorMode}
        onClose={() => setSelectedDoctorForProfile(null)}
        onBook={(doc) => {
          setSelectedDoctorForProfile(null);
          setSelectedDoctorForBooking(doc);
        }}
      />

      {/* Multi-step Appointment Booking Stepper Modal */}
      {selectedDoctorForBooking && (
        <BookingStepperModal
          doctor={selectedDoctorForBooking}
          doctors={doctors}
          currentLang={currentLang}
          onClose={() => setSelectedDoctorForBooking(null)}
          onBookingSuccess={(result) => {
            setSelectedDoctorForBooking(null);
            setLastBookedResult(result);
            fetchAllData(); // Sync with MongoDB
          }}
        />
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        appointment={rescheduleTarget}
        doctors={doctors}
        seniorMode={seniorMode}
        onClose={() => setRescheduleTarget(null)}
        onRescheduled={() => {
          setRescheduleTarget(null);
          showToast('Appointment rescheduled successfully.');
          fetchAllData();
        }}
      />

      {/* Cancel Modal */}
      <CancelModal
        appointment={cancelTarget}
        seniorMode={seniorMode}
        onClose={() => setCancelTarget(null)}
        onCancelled={() => {
          setCancelTarget(null);
          showToast('Appointment cancelled successfully.');
          fetchAllData();
        }}
      />

      {/* Sarvam AI Persistent Voice Assistant Modal */}
      {isVoiceOpen && (
        <VoiceAssistantModal
          currentLang={currentLang}
          seniorMode={seniorMode}
          onClose={() => setIsVoiceOpen(false)}
          onIntentExecute={(result, confirmAction) => {
            handleSarvamIntent(result, confirmAction);
          }}
        />
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-bold ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-teal-500/50 shadow-teal-900/20'
                : 'bg-rose-900 text-white border-rose-500/50 shadow-rose-900/20'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.message}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
