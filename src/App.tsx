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
import { PrescriptionsView } from './components/PrescriptionsView.js';

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
    checkPaymentParams();
  }, []);

  const checkPaymentParams = async () => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    const appointmentId = params.get('appointment_id');

    if (paymentStatus === 'success' && sessionId && appointmentId) {
      try {
        await api.verifyPaymentSession(sessionId, appointmentId);
        showToast('Payment successful! Your appointment is confirmed.');
        fetchAllData();
        // Clear query params
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        showToast('There was an issue verifying your payment.', 'error');
      }
    } else if (paymentStatus === 'cancelled') {
      showToast('Payment was cancelled.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

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
  if (currentUser.role === 'doctor' || currentUser.role === 'staff' || currentUser.role === 'hospital_admin') {
    navItems = [
      { id: 'home', label: 'Dashboard', icon: Home }
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
      {/* Role-Based View Logic */}
      {currentUser.role === 'doctor' && currentTab === 'home' ? (
        <DoctorDashboard 
          currentUser={currentUser}
          appointments={appointments}
          doctors={doctors}
          loading={loading}
          onRefresh={fetchAllData}
          showToast={showToast}
        />
      ) : currentUser.role === 'staff' && currentTab === 'home' ? (
        <StaffDashboard 
          currentUser={currentUser}
          appointments={appointments}
          loading={loading}
          onRefresh={fetchAllData}
          showToast={showToast}
        />
      ) : currentUser.role === 'hospital_admin' && currentTab === 'home' ? (
        <AdminDashboard 
          currentUser={currentUser}
          doctors={doctors}
          departments={departments}
          appointments={appointments}
          loading={loading}
          onRefresh={fetchAllData}
          showToast={showToast}
        />
      ) : currentTab === 'map' ? (
        <HospitalMap
          initialDepartmentId={mapTargetDeptId}
          departments={departments}
          activeAppointment={activeAppointment}
          seniorMode={seniorMode}
          currentLang={currentLang}
          onAppointmentUpdate={fetchAllData}
          onNavigateQueue={() => setCurrentTab(currentUser.role === 'patient' ? 'queue' : (currentUser.role === 'doctor' ? 'doctor_queue' : 'home'))}
        />
      ) : currentTab === 'help' ? (
        <HelpSupport seniorMode={seniorMode} onToggleSeniorMode={handleToggleSeniorMode} />
      ) : currentUser.role === 'patient' ? (
        /* Patient View Logic (Existing) */
        preparationDept ? (
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
                  currentUser={currentUser}
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
                  currentUser={currentUser}
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

            {currentTab === 'prescriptions' && currentUser.role === 'patient' && (
              <PrescriptionsView currentUser={currentUser} currentLang={currentLang} seniorMode={seniorMode} />
            )}

            {currentTab === 'prescriptions' && currentUser.role !== 'patient' && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <AlertCircle className="w-12 h-12 mb-4 opacity-20 text-rose-500" />
                <p className="font-bold text-rose-800">Access Denied: Patients Only</p>
                <button onClick={() => setCurrentTab('home')} className="mt-4 text-teal-600 font-bold hover:underline">
                  Back to Dashboard
                </button>
              </div>
            )}
          </>
        )
      ) : (
        /* Fallback if no specific tab match for role */
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
           <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
           <p className="font-bold">This section is coming soon for your role.</p>
           <button onClick={() => setCurrentTab('home')} className="mt-4 text-teal-600 font-bold hover:underline">
             Back to Home
           </button>
        </div>
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
