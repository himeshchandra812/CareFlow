import React, { useState, useEffect } from 'react';
import { User, Appointment } from '../types/index.js';
import { api } from '../services/api.js';
import { Ambulance, Clock, MapPin, Phone, RefreshCw, CheckCircle2, AlertTriangle, LogOut, Sparkles } from 'lucide-react';

interface StaffDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchRole: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ currentUser, onLogout, onSwitchRole, showToast }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const appts = await api.getAppointments();
      setAppointments(appts);
    } catch {
      showToast('Failed to load operational cases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [currentUser]);

  const handleMarkArrived = async (apptId: string) => {
    try {
      await api.markPatientArrived(apptId);
      showToast('Patient arrival successfully registered in triage system');
      fetchStaffData();
    } catch (e: any) {
      showToast(e.message || 'Failed to update arrival status', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-teal-500/20 sticky top-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600/20 border border-amber-500/40 rounded-xl flex items-center justify-center text-amber-400">
            <Ambulance className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-base sm:text-lg font-outfit">CareFlow EMT & Staff Operations</div>
            <p className="text-xs text-amber-400 font-medium">Operator: {currentUser.name}</p>
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-outfit text-white">Active Patient Arrivals & Triage Queue</h2>
            <p className="text-xs text-slate-400">Manage patient check-ins, emergency priority routing, and floor assistance.</p>
          </div>
          <button
            onClick={fetchStaffData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading operational cases...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {appointments.map((appt) => (
              <div key={appt._id} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-white text-base">{appt.patientName}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      Token {appt.tokenNumber}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-700 text-slate-300">
                      {appt.departmentName} ({appt.doctorName})
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {appt.appointmentDate} • {appt.appointmentTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      {appt.patientPhone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {appt.status !== 'arrived' && appt.status !== 'in_progress' && appt.status !== 'completed' ? (
                    <button
                      onClick={() => handleMarkArrived(appt._id)}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Check In Patient</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-bold rounded-xl">
                      Checked In & Arrived
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
