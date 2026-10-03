import React, { useState, useEffect } from 'react';
import { User, Doctor, Department, Appointment } from '../types/index.js';
import { api } from '../services/api.js';
import { ShieldCheck, Users, Stethoscope, Building2, Calendar, TrendingUp, LogOut, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchRole: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout, onSwitchRole, showToast }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
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
    } catch {
      showToast('Failed to load hospital administrative analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-teal-500/20 sticky top-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600/20 border border-teal-500/40 rounded-xl flex items-center justify-center text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-base sm:text-lg font-outfit">CareFlow Hospital Administration</div>
            <p className="text-xs text-teal-400 font-medium">Director: {currentUser.name}</p>
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
            <h2 className="text-lg font-bold font-outfit text-white">Hospital Performance & Overview</h2>
            <p className="text-xs text-slate-400">Monitor active departments, registered specialists, and patient flow analytics.</p>
          </div>
          <button
            onClick={fetchAdminData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading administrative metrics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Doctors</span>
                  <Stethoscope className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-outfit">{doctors.length}</div>
                <p className="text-[11px] text-teal-400 font-medium">Across {departments.length} departments</p>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Departments</span>
                  <Building2 className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-outfit">{departments.length}</div>
                <p className="text-[11px] text-teal-400 font-medium">Fully operational</p>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Appointments</span>
                  <Calendar className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-outfit">{appointments.length}</div>
                <p className="text-[11px] text-teal-400 font-medium">Hospital-wide records</p>
              </div>

              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Hospital Load</span>
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-outfit">Optimal</div>
                <p className="text-[11px] text-emerald-400 font-medium">94% queue efficiency</p>
              </div>
            </div>

            {/* Departments Grid */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white font-outfit">Managed Departments & Specialists</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => {
                  const deptDocs = doctors.filter(d => d.departmentId === dept._id);
                  return (
                    <div key={dept._id} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-sm">{dept.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-700">
                          {deptDocs.length} Specialists
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{dept.description}</p>
                      <div className="pt-2 text-[11px] font-semibold text-teal-400">
                        Location: {dept.block} • {dept.floor}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
