import React, { useState } from 'react';
import {
  Search,
  Mic,
  Calendar,
  Clock,
  MapPin,
  Heart,
  ChevronRight,
  ShieldCheck,
  Building,
  UserCheck,
  Sparkles,
  ArrowRight,
  PhoneCall,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { SupportedLanguage, Appointment, Department, QueueState } from '../types/index.js';
import { QueueCard } from './QueueCard.js';
import { t } from '../services/i18n.js';
import { useViewport } from '../hooks/useViewport.js';

interface HomeDashboardProps {
  currentLang: SupportedLanguage;
  activeAppointment: Appointment | null;
  appointments: Appointment[];
  departments: Department[];
  onNavigate: (tab: string, extra?: any) => void;
  onOpenVoice: () => void;
  onSelectDepartment: (deptId: string) => void;
  onAppointmentUpdate?: () => void;
  onSelectAppointmentId?: (apptId: string) => void;
  queueState?: QueueState | null;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentLang,
  activeAppointment,
  appointments,
  departments,
  onNavigate,
  onOpenVoice,
  onSelectDepartment,
  onAppointmentUpdate,
  onSelectAppointmentId,
  queueState
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { isMobile, isTablet, isDesktop, isUltrawide, isShortViewport } = useViewport();

  const upcomingAppointments = appointments.filter(
    (a) =>
      a.status === 'confirmed' ||
      a.status === 'arrived' ||
      a.status === 'waiting' ||
      a.status === 'in_progress'
  ).sort((a, b) => {
    const dateA = new Date(`${a.appointmentDate} ${a.appointmentTime.split(' - ')[0] || a.appointmentTime}`);
    const dateB = new Date(`${b.appointmentDate} ${b.appointmentTime.split(' - ')[0] || b.appointmentTime}`);
    return dateA.getTime() - dateB.getTime();
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('doctors', { search: searchQuery.trim() });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      {/* Hero Header Section */}
      <div className={`bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden ${isShortViewport ? 'p-5 sm:p-6' : 'p-6 sm:p-10'}`}>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CareFlow Patient Portal • CareFlow Multispeciality Hospital</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-fluid-h1 font-extrabold tracking-tight font-outfit">
              {t('greeting', currentLang)}, Rajesh 👋
            </h1>
            <p className="text-slate-300 text-fluid-body-lg font-normal">
              {t('howCanWeHelp', currentLang)}
            </p>
          </div>

          {/* Natural Language Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder', currentLang)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-slate-400 rounded-2xl border border-white/15 focus:outline-hidden focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-xs sm:text-base transition-all"
              />
            </div>

            <button
              type="button"
              onClick={onOpenVoice}
              className="uiverse-btn-primary px-4 sm:px-5 py-3 rounded-2xl font-medium text-xs sm:text-base flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Mic className="w-5 h-5" />
              <span className="hidden sm:inline">{t('speak', currentLang)}</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-300">
            <span className="text-slate-400">Try saying:</span>
            <button
              onClick={() => onNavigate('doctors', { search: 'Cardiologist tomorrow morning' })}
              className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/10 text-slate-200 transition-colors cursor-pointer"
            >
              "I need a heart doctor tomorrow morning"
            </button>
            <button
              onClick={() => onNavigate('doctors', { search: 'Cardiologist' })}
              className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/10 text-slate-200 transition-colors cursor-pointer"
            >
              "Mujhe kal subah cardiologist chahiye"
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Section - Adapts from 1-column on mobile, to 2-column on desktop, to 3-column on Ultrawide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Queue Card & Quick Actions */}
        <div className={`${isUltrawide ? 'lg:col-span-7' : 'lg:col-span-7'} space-y-6`}>
          
          {/* Active / Upcoming Appointment Queue Card */}
          {activeAppointment ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-outfit">
                  Upcoming Appointment Queue
                </span>
                <button
                  onClick={() => onNavigate('appointments')}
                  className="text-xs text-teal-700 hover:underline font-semibold"
                >
                  Manage
                </button>
              </div>

              <QueueCard
                appointment={activeAppointment}
                queueState={queueState || {
                  _id: `queue_${activeAppointment._id}`,
                  appointmentId: activeAppointment._id,
                  doctorId: activeAppointment.doctorId,
                  doctorName: activeAppointment.doctorName,
                  departmentId: activeAppointment.departmentId,
                  departmentName: activeAppointment.departmentName,
                  currentToken: 'A-119',
                  patientToken: activeAppointment.tokenNumber,
                  patientsAhead: 8,
                  estimatedWaitTime: activeAppointment.estimatedWaitTime || 24,
                  doctorStatus: 'Consulting',
                  doctorStatusMessage: `${activeAppointment.doctorName} is currently consulting Token A-119.`,
                  averageConsultationMinutes: 3,
                  recentConsultationDurations: [3, 4, 3],
                  isPatientArrived: activeAppointment.status === 'arrived',
                  lastUpdated: new Date().toISOString()
                }}
                currentLang={currentLang}
                onTrackQueue={() => onNavigate('queue')}
                onArrivalSuccess={() => onAppointmentUpdate?.()}
              />

              {/* Dashboard Preparation Card for Active Appointment */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-teal-700" />
                    <h3 className="font-extrabold text-slate-900 text-base font-outfit">
                      Before Your Appointment
                    </h3>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    (activeAppointment.visitType || activeAppointment.appointmentType) === 'follow_up'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-teal-100 text-teal-800 border border-teal-200'
                  }`}>
                    {(activeAppointment.visitType || activeAppointment.appointmentType) === 'follow_up' ? 'Follow-up Visit' : 'New Visit'}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {activeAppointment.doctorName} • {activeAppointment.departmentName}
                  </div>
                  <div className="text-slate-500 font-medium">
                    {activeAppointment.appointmentDate} • {activeAppointment.appointmentTime}
                  </div>
                </div>

                {/* Contextual Preparation Checkmarks */}
                <div className="space-y-2 pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-slate-800 font-medium leading-tight">
                      {(activeAppointment.visitType || activeAppointment.appointmentType) === 'follow_up'
                        ? 'Bring reports & prescriptions from your previous consultation'
                        : 'Bring valid Photo ID or CareFlow Hospital Card'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-slate-800 font-medium leading-tight">
                      {(activeAppointment.visitType || activeAppointment.appointmentType) === 'follow_up'
                        ? 'Bring any newly completed lab, ECG, or imaging test results'
                        : 'Bring previous medical history & current prescription list'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span className="text-slate-800 font-medium leading-tight">
                      Arrive {(activeAppointment.visitType || activeAppointment.appointmentType) === 'follow_up' ? '10' : '15'} minutes early for registration & vitals
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => onNavigate('preparation', { appointmentId: activeAppointment._id, departmentId: activeAppointment.departmentId })}
                    className="w-full py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View Full Preparation Guidelines</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Other Upcoming Appointments chronologically listed */}
              {upcomingAppointments.length > 1 && (
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm font-outfit uppercase tracking-wider text-teal-800">
                    Other Scheduled Visits ({upcomingAppointments.length - 1})
                  </h4>
                  <div className="space-y-3.5">
                    {upcomingAppointments.slice(1).map((appt) => (
                      <div key={appt._id} className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{appt.doctorName}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                              Token {appt.tokenNumber}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500">
                            {appt.departmentName} Department
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{appt.appointmentDate} • {appt.appointmentTime}</span>
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectAppointmentId?.(appt._id);
                              onNavigate('queue');
                            }}
                            className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Track Queue
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectAppointmentId?.(appt._id);
                              onNavigate('preparation', { appointmentId: appt._id, departmentId: appt.departmentId });
                            }}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Preparation
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-100 rounded-2xl p-6 border border-dashed border-slate-300 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-slate-700 font-semibold text-base">No active appointments scheduled</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Discover specialized doctors and book your next consultation in a few simple steps.
              </p>
              <button
                onClick={() => onNavigate('doctors')}
                className="uiverse-btn-primary px-4 py-2 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t('findDoctor', currentLang)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-outfit">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigate('doctors')}
                className="uiverse-card p-4 rounded-2xl text-left space-y-2 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{t('findDoctor', currentLang)}</div>
                  <div className="text-[11px] text-slate-500">Specialists directory</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('departments')}
                className="uiverse-card p-4 rounded-2xl text-left space-y-2 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Find Department</div>
                  <div className="text-[11px] text-slate-500">Specialties & wings</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('appointments')}
                className="uiverse-card p-4 rounded-2xl text-left space-y-2 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">My Appointment</div>
                  <div className="text-[11px] text-slate-500">Manage bookings</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('queue')}
                className="uiverse-card p-4 rounded-2xl text-left space-y-2 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{t('trackQueue', currentLang)}</div>
                  <div className="text-[11px] text-slate-500">Live token updates</div>
                </div>
              </button>

              <button
                onClick={() => onNavigate('map')}
                className="uiverse-card p-4 rounded-2xl text-left space-y-2 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Get Directions</div>
                  <div className="text-[11px] text-slate-500">Indoor navigation</div>
                </div>
              </button>

              <button
                onClick={onOpenVoice}
                className="uiverse-card p-4 rounded-2xl text-left space-y-2 group cursor-pointer border-teal-200 bg-teal-50/50"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center group-hover:bg-teal-700 transition-colors shadow-xs">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{t('speak', currentLang)}</div>
                  <div className="text-[11px] text-teal-800 font-medium">Multilingual voice</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Hospital Departments Directory */}
        <div className={`${isUltrawide ? 'lg:col-span-5' : 'lg:col-span-5'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-outfit">
              Hospital Departments
            </h3>
            <button
              onClick={() => onNavigate('departments')}
              className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {departments.slice(0, 6).map((dept) => (
              <button
                key={dept._id}
                onClick={() => onSelectDepartment(dept._id)}
                className="w-full uiverse-card p-3.5 rounded-xl text-left flex items-center justify-between gap-3 group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm group-hover:bg-teal-50 group-hover:text-teal-700 transition-colors shrink-0">
                    {dept.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{dept.name}</div>
                    <div className="text-xs text-slate-500">{dept.location}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
              </button>
            ))}
          </div>

          {/* Contextual Card for Wide Screens */}
          <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 space-y-2 text-xs">
            <div className="font-bold text-teal-900 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-teal-700" /> Need Immediate Assistance?
            </div>
            <p className="text-teal-800">
              Hospital Helpdesk: <strong>+91 40 4567 8900</strong>. Available 24/7 for emergency triage and wheelchair assistance.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
