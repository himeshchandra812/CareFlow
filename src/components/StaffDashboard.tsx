import React from 'react';
import { User, Appointment } from '../types/index.js';
import { api } from '../services/api.js';
import { Ambulance, Clock, Phone, RefreshCw, CheckCircle2 } from 'lucide-react';

interface StaffDashboardProps {
  currentUser: User;
  appointments: Appointment[];
  loading: boolean;
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ 
  currentUser, 
  appointments,
  loading,
  onRefresh,
  showToast 
}) => {

  const handleMarkArrived = async (apptId: string) => {
    try {
      await api.markPatientArrived(apptId);
      showToast('Patient arrival successfully registered in triage system');
      onRefresh();
    } catch (e: any) {
      showToast(e.message || 'Failed to update arrival status', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full text-left">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-amber-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left z-10">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
            EMT & Staff Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit">Active Triage & Patient Arrivals</h1>
          <p className="text-sm text-slate-300 font-medium">Operator: {currentUser.name}</p>
          <p className="text-xs text-amber-400 font-bold pt-1 uppercase tracking-tight">Managing hospital-wide patient flow</p>
        </div>
        <Ambulance className="w-16 h-16 text-amber-400 shrink-0" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-outfit text-slate-900">Incoming Patient Queue & Check-In</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Manage patient check-ins, emergency priority routing, and floor assistance.</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Synchronizing Operations...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {appointments.map((appt) => (
            <div key={appt._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-sm">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-lg font-outfit">{appt.patientName}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                    Token {appt.tokenNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                    {appt.departmentName} ({appt.doctorName})
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-4 flex-wrap font-bold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {appt.appointmentDate} • {appt.appointmentTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-600" />
                    {appt.patientPhone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                {appt.status !== 'arrived' && appt.status !== 'in_progress' && appt.status !== 'completed' && appt.status !== 'cancelled' ? (
                  <button
                    onClick={() => handleMarkArrived(appt._id)}
                    className="w-full md:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Check In Patient</span>
                  </button>
                ) : (
                  <span className="w-full md:w-auto px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold rounded-xl text-center">
                    {appt.status === 'arrived' ? 'Patient Arrived' : appt.status.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-xs">
              <Ambulance className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-lg font-bold text-slate-800">No active cases registered</div>
              <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
                The triage queue is currently clear.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
