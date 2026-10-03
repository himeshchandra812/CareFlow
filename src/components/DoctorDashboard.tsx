import React, { useState, useEffect } from 'react';
import { User, Appointment, Doctor } from '../types/index.js';
import { api } from '../services/api.js';
import { Stethoscope, Calendar, Clock, CheckCircle2, RefreshCw, Phone } from 'lucide-react';

interface DoctorDashboardProps {
  currentUser: User;
  appointments: Appointment[];
  doctors: Doctor[];
  loading: boolean;
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  activeTab?: 'appointments' | 'queue' | 'profile';
  onTabChange?: (tab: 'appointments' | 'queue' | 'profile') => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ 
  currentUser, 
  appointments, 
  doctors,
  loading,
  onRefresh,
  showToast,
  activeTab: externalActiveTab,
  onTabChange: onExternalTabChange
}) => {
  const [doctorInfo, setDoctorInfo] = useState<Doctor | null>(null);
  const [internalActiveTab, setInternalActiveTab] = useState<'appointments' | 'queue' | 'profile'>('appointments');

  const activeTab = externalActiveTab || internalActiveTab;
  const setActiveTab = onExternalTabChange || setInternalActiveTab;

  useEffect(() => {
    const matched = doctors.find(d => 
      d.name.toLowerCase() === currentUser.name.toLowerCase() || 
      d._id === currentUser._id || 
      d.departmentId === currentUser.departmentId
    ) || doctors[0];
    setDoctorInfo(matched || null);
  }, [currentUser, doctors]);

  const handleUpdateStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      showToast(`Appointment status updated to ${newStatus.replace('_', ' ')}`);
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
        <div className="space-y-2 z-10">
          <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
            Doctor Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit">Welcome back, {currentUser.name}</h1>
          <p className="text-sm text-slate-300 font-medium">
            {doctorInfo?.specialization || currentUser.specialization || 'Specialist'} • {doctorInfo?.departmentName || currentUser.departmentName || 'Department'}
          </p>
          <p className="text-xs text-teal-400 font-bold pt-1 uppercase tracking-tight">You have {appointments.length} consultations scheduled today</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-300 shrink-0">
          <Stethoscope className="w-8 h-8" />
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300 max-w-md">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'appointments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Schedule ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'queue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Live Queue
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Profile
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Synchronizing Data...</p>
        </div>
      ) : activeTab === 'appointments' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-outfit text-slate-900">Today's Patient Schedule</h2>
            <button
              onClick={onRefresh}
              className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-xs">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-lg font-bold text-slate-800">No appointments scheduled today</div>
              <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
                All consultations are currently cleared or pending patient bookings in your department.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {appointments.map((appt) => (
                <div
                  key={appt._id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-sm"
                >
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-lg font-outfit">{appt.patientName}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 font-mono">
                        Token {appt.tokenNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        appt.status === 'confirmed' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        appt.status === 'arrived' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        appt.status === 'in_progress' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                        appt.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-4 flex-wrap font-bold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-600" />
                        {appt.appointmentDate} • {appt.appointmentTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        {appt.patientPhone}
                      </span>
                      <span className="text-slate-500 font-medium italic">Type: {appt.appointmentType || 'General Consultation'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                    {appt.status !== 'arrived' && appt.status !== 'in_progress' && appt.status !== 'completed' && appt.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(appt._id, 'arrived')}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        Mark Arrived
                      </button>
                    )}
                    {appt.status !== 'in_progress' && appt.status !== 'completed' && appt.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(appt._id, 'in_progress')}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md"
                      >
                        Start Consult
                      </button>
                    )}
                    {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(appt._id, 'completed')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                      </button>
                    )}
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateStatus(appt._id, 'cancelled')}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        No Show
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'queue' ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs text-left">
          <h2 className="text-xl font-extrabold font-outfit text-slate-900">Live Department Queue Monitor</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Real-time synchronization of consulting tokens for your department.
          </p>
          <div className="space-y-3 pt-2">
            {appointments.filter(a => a.status === 'arrived' || a.status === 'in_progress' || a.status === 'confirmed').map((appt, idx) => (
              <div key={appt._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 text-teal-700 font-mono font-bold rounded-xl flex items-center justify-center border border-teal-200 shadow-xs">
                    {idx + 1}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-base font-outfit">{appt.patientName}</div>
                    <div className="text-xs text-teal-700 font-bold">Token {appt.tokenNumber} • {appt.appointmentTime}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
                  {appt.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {appointments.filter(a => a.status === 'arrived' || a.status === 'in_progress' || a.status === 'confirmed').length === 0 && (
              <div className="py-10 text-center text-slate-400 italic text-sm font-bold">
                Queue is currently empty.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xs max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <img
              src={doctorInfo?.profileImage || currentUser.profileImage || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop'}
              alt={currentUser.name}
              className="w-24 h-24 rounded-3xl object-cover border-4 border-teal-500/10 shadow-md"
            />
            <div className="text-left">
              <h2 className="text-2xl font-extrabold font-outfit text-slate-900">{currentUser.name}</h2>
              <p className="text-base text-teal-700 font-bold">{doctorInfo?.specialization || currentUser.specialization || 'Consultant'}</p>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">{doctorInfo?.departmentName || currentUser.departmentName || 'Hospital Specialist'}</p>
            </div>
          </div>

          <div className="space-y-1 pt-2 text-xs">
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Email Address</span>
              <span className="text-slate-900 font-bold">{currentUser.email}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Phone Number</span>
              <span className="text-slate-900 font-bold">{currentUser.phone}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-slate-100">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Hospital Branch</span>
              <span className="text-slate-900 font-bold">CareFlow Multispeciality Hospital</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-slate-500 font-bold uppercase tracking-wider">Authorization Role</span>
              <span className="text-teal-700 font-extrabold uppercase">DOCTOR PORTAL ACCESS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
