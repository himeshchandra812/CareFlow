import React from 'react';
import { User, Doctor, Department, Appointment } from '../types/index.js';
import { ShieldCheck, Stethoscope, Building2, Calendar, TrendingUp, RefreshCw, Plus, Edit2, Trash2 } from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  doctors: Doctor[];
  departments: Department[];
  appointments: Appointment[];
  loading: boolean;
  onRefresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  currentUser, 
  doctors,
  departments,
  appointments,
  loading,
  onRefresh,
  showToast 
}) => {

  const handleAction = (action: string) => {
    showToast(`${action} feature is restricted in this demo version. Contact system administrator.`, 'error');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full text-left">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left z-10">
          <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
            Hospital Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-outfit">Director Overview & Analytics</h1>
          <p className="text-sm text-slate-300 font-medium">Welcome, {currentUser.name}</p>
          <p className="text-xs text-teal-400 font-bold pt-1 uppercase tracking-tight">Monitoring hospital-wide operational performance</p>
        </div>
        <ShieldCheck className="w-16 h-16 text-teal-400 shrink-0" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-outfit text-slate-900">Hospital Performance & Overview</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Real-time metrics and department resource management.</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Analytics
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Loading Hospital Metrics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Doctors</span>
                <Stethoscope className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-outfit">{doctors.length}</div>
              <p className="text-[10px] text-teal-700 font-bold">Across {departments.length} departments</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Departments</span>
                <Building2 className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-outfit">{departments.length}</div>
              <p className="text-[10px] text-teal-700 font-bold">Fully operational</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Appointments</span>
                <Calendar className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-outfit">{appointments.length}</div>
              <p className="text-[10px] text-teal-700 font-bold">Hospital-wide records</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-bold uppercase tracking-wider">Hospital Load</span>
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-outfit">Optimal</div>
              <p className="text-[10px] text-emerald-700 font-bold">94% queue efficiency</p>
            </div>
          </div>

          {/* Quick Management Actions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-outfit">Management Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button onClick={() => handleAction('Add Doctor')} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs">
                <Plus className="w-3.5 h-3.5 text-teal-600" /> Add Doctor
              </button>
              <button onClick={() => handleAction('Add Department')} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs">
                <Plus className="w-3.5 h-3.5 text-teal-600" /> Add Dept
              </button>
              <button onClick={() => handleAction('System Settings')} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs">
                <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Settings
              </button>
              <button onClick={() => handleAction('Data Export')} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Export Data
              </button>
            </div>
          </div>

          {/* Departments Grid */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 font-outfit">Managed Departments & Specialists</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => {
                const deptDocs = doctors.filter(d => d.departmentId === dept._id);
                return (
                  <div key={dept._id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs transition-all hover:shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-base font-outfit">{dept.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                          {deptDocs.length} Specialists
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2">{dept.description}</p>
                      <div className="text-[10px] font-bold text-teal-700 uppercase tracking-tight">
                        Location: {dept.block} • {dept.floor}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => handleAction(`Edit ${dept.name}`)} className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer">
                        Edit
                      </button>
                      <button onClick={() => handleAction(`Delete ${dept.name}`)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition-all cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
