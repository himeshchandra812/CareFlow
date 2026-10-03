import React, { useState, useEffect } from 'react';
import { User, Appointment, Doctor, QueueState } from '../types/index.js';
import { api } from '../services/api.js';
import { Stethoscope, Calendar, Clock, CheckCircle2, UserCheck, AlertCircle, LogOut, RefreshCw, Sparkles, MapPin, Phone, ShieldCheck } from 'lucide-react';

interface DoctorDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchRole: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ currentUser, onLogout, onSwitchRole, showToast }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'queue' | 'profile'>('appointments');

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const docs = await getDoctorsForUser();
      const matched = docs.find(d => d.name.toLowerCase() === currentUser.name.toLowerCase() || d._id === currentUser._id || d.departmentId === currentUser.departmentId) || docs[0];
      setDoctorInfo(matched || null);

      const appts = await api.getAppointments();
      // Filter appointments assigned to this doctor
      const docAppts = appts.filter(a => matched ? a.doctorId === matched._id : true);
      setAppointments(docAppts);
    } catch (e: any) {
      showToast('Failed to load doctor dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDoctorsForUser = async () => {
    try {
      return await api.getDoctors();
    } catch {
      return [];
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [currentUser]);

  const handleUpdateStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      showToast(`Appointment status updated to ${newStatus}`);
      fetchDoctorData();
    } catch (e: any) {
      showToast(e.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-teal-500/20 sticky top-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600/20 border border-teal-500/40 rounded-xl flex items-center justify-center text-teal-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-base sm:text-lg font-outfit">CareFlow Doctor Portal</div>
            <p className="text-xs text-teal-400 font-medium">Welcome, {currentUser.name} ({doctorInfo?.specialization || currentUser.specialization || 'Specialist'})</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchRole}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Switch Role</span>
          </button>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 max-w-md">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'appointments' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Today's Schedule ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'queue' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Patient Queue
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'profile' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Doctor Profile
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading doctor consultations...</p>
          </div>
        ) : activeTab === 'appointments' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold font-outfit text-white">Assigned Patient Appointments</h2>
              <button
                onClick={fetchDoctorData}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 text-center space-y-3">
                <Calendar className="w-12 h-12 text-slate-500 mx-auto" />
                <div className="text-base font-bold text-slate-300">No appointments scheduled today</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All consultations are currently cleared or pending patient bookings in your department.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {appointments.map((appt) => (
                  <div
                    key={appt._id}
                    className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-white text-base">{appt.patientName}</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                          Token {appt.tokenNumber}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          appt.status === 'confirmed' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          appt.status === 'arrived' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          appt.status === 'in_progress' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                          appt.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {appt.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-400" />
                          {appt.appointmentDate} • {appt.appointmentTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-teal-400" />
                          {appt.patientPhone}
                        </span>
                        <span className="text-slate-400 font-medium">Type: {appt.appointmentType || 'New Visit'}</span>
                      </div>
                    </div>

                    {/* Doctor Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                      {appt.status !== 'arrived' && appt.status !== 'in_progress' && appt.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(appt._id, 'arrived')}
                          className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Mark Arrived
                        </button>
                      )}
                      {appt.status !== 'in_progress' && appt.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(appt._id, 'in_progress')}
                          className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Start Consult
                        </button>
                      )}
                      {appt.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(appt._id, 'completed')}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(appt._id, 'cancelled')}
                        className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        No Show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'queue' ? (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-bold font-outfit text-white">Live Department Queue Monitor</h2>
            <p className="text-xs text-slate-400">
              Real-time synchronization of consulting tokens for {doctorInfo?.name || currentUser.name}.
            </p>
            <div className="space-y-3 pt-2">
              {appointments.filter(a => a.status === 'arrived' || a.status === 'in_progress' || a.status === 'confirmed').map((appt, idx) => (
                <div key={appt._id} className="p-4 bg-slate-900/80 rounded-2xl border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-600/20 text-teal-400 font-mono font-bold rounded-xl flex items-center justify-center border border-teal-500/30">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{appt.patientName}</div>
                      <div className="text-xs text-teal-400">Token {appt.tokenNumber} • {appt.appointmentTime}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-950 text-teal-300 border border-teal-700">
                    {appt.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 space-y-6 max-w-2xl">
            <div className="flex items-center gap-4">
              <img
                src={doctorInfo?.profileImage || currentUser.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'}
                alt={currentUser.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-500"
              />
              <div>
                <h2 className="text-xl font-bold font-outfit text-white">{currentUser.name}</h2>
                <p className="text-sm text-teal-400 font-medium">{doctorInfo?.specialization || currentUser.specialization || 'Cardiologist'}</p>
                <p className="text-xs text-slate-400">{doctorInfo?.departmentName || currentUser.departmentName || 'Cardiology Department'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-700 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-700/60">
                <span className="text-slate-400">Email Address</span>
                <span className="text-white font-medium">{currentUser.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/60">
                <span className="text-slate-400">Phone Number</span>
                <span className="text-white font-medium">{currentUser.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/60">
                <span className="text-slate-400">Hospital Branch</span>
                <span className="text-white font-medium">CareFlow Multispeciality Hospital</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Authorization Role</span>
                <span className="text-teal-400 font-bold uppercase">DOCTOR</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
