import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  FileText,
  RefreshCw,
  XCircle,
  Share2,
  Sparkles,
  UserCheck,
  Loader2,
  FileCheck,
  AlertCircle,
  ClipboardList
} from 'lucide-react';
import { Appointment, QueueState, SupportedLanguage, Department } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { api } from '../services/api.js';
import { t } from '../services/i18n.js';

interface AppointmentConfirmationProps {
  appointment: Appointment;
  queue?: QueueState | null;
  departments?: Department[];
  currentLang: SupportedLanguage;
  onTrackQueue: () => void;
  onGetDirections: () => void;
  onViewPreparation: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onDone: () => void;
  onAppointmentUpdate?: (result?: { appointment: Appointment; queue: QueueState }) => void;
}

export const AppointmentConfirmation: React.FC<AppointmentConfirmationProps> = ({
  appointment,
  queue,
  departments,
  currentLang,
  onTrackQueue,
  onGetDirections,
  onViewPreparation,
  onReschedule,
  onCancel,
  onDone,
  onAppointmentUpdate
}) => {
  const [currentAppt, setCurrentAppt] = useState<Appointment>(appointment);
  const [currentQueue, setCurrentQueue] = useState<QueueState | null>(queue || null);
  const [department, setDepartment] = useState<Department | null>(
    departments?.find((d) => d._id === appointment.departmentId) || null
  );
  const [markingArrival, setMarkingArrival] = useState(false);
  const [arrivalError, setArrivalError] = useState<string | null>(null);

  useEffect(() => {
    if (!department && currentAppt.departmentId) {
      api
        .getDepartmentById(currentAppt.departmentId)
        .then((dept) => setDepartment(dept))
        .catch((err) => console.warn('Could not load department for prep info:', err));
    }
  }, [currentAppt.departmentId, department]);

  const isArrived =
    currentAppt.status === 'arrived' ||
    currentAppt.status === 'waiting' ||
    currentQueue?.isPatientArrived;

  const handleArrival = async () => {
    setMarkingArrival(true);
    setArrivalError(null);
    try {
      const res = await api.markPatientArrived(currentAppt._id);
      // Wait for backend response before updating final state
      setCurrentAppt(res.appointment);
      setCurrentQueue(res.queue);
      setMarkingArrival(false);
      onAppointmentUpdate?.(res);
    } catch (e: any) {
      console.error('Arrival check-in error:', e);
      setArrivalError('Unable to update your arrival status. Please try again.');
      setMarkingArrival(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Confirmation Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6 relative overflow-hidden">
        
        {/* Top Teal Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600" />

        {/* Success Icon Badge */}
        <div className="inline-flex p-4 bg-teal-50 text-teal-600 rounded-full border-2 border-teal-200 shadow-sm mt-2">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-teal-700 tracking-wider uppercase font-outfit">
            Confirmation Status
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 font-outfit">
            ✓ Appointment Confirmed
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Booking ID: #{appointment._id.slice(-8)}
          </p>
        </div>

        {/* Doctor & Dept Card Block */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-outfit">
                {appointment.doctorName}
              </h3>
              <p className="text-sm font-semibold text-teal-700">
                {appointment.departmentName} Department
              </p>
              <p className="text-xs text-slate-500 font-medium">
                CareFlow Multispeciality Hospital
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-md">
                {appointment.appointmentType === 'new_visit' ? 'New Visit' : 'Follow-up'}
              </span>
              <StatusBadge status={appointment.status} size="sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200 text-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span className="font-semibold">{appointment.appointmentDate} • {appointment.appointmentTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span className="font-semibold">{appointment.locationDetails.block} • {appointment.locationDetails.floor}</span>
            </div>
          </div>
        </div>

        {/* Queue Token & Estimated Wait Highlight */}
        <div className="grid grid-cols-2 gap-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md">
          <div className="text-center border-r border-slate-700 pr-2">
            <span className="text-xs text-slate-400 font-mono block uppercase">Token Number</span>
            <span className="text-3xl font-extrabold text-teal-400 font-outfit">
              {appointment.tokenNumber}
            </span>
          </div>
          <div className="text-center pl-2">
            <span className="text-xs text-slate-400 font-mono block uppercase">Estimated Wait</span>
            <span className="text-2xl font-bold text-amber-400 font-outfit">
              ~{queue?.estimatedWaitTime || appointment.estimatedWaitTime} min
            </span>
            <span className="text-[10px] text-slate-400 block pt-0.5">Estimated based on current queue activity</span>
          </div>
        </div>

        {/* Arrival CTA Banner */}
        {!isArrived ? (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div>
              <div className="text-xs font-bold text-amber-900">Are you at the hospital building?</div>
              <div className="text-[11px] text-amber-800">
                Check in to update your live arrival status for {currentAppt.doctorName}'s staff.
              </div>
              {arrivalError && (
                <p className="text-xs text-rose-600 font-bold pt-1">
                  {arrivalError}
                </p>
              )}
            </div>
            <button
              onClick={handleArrival}
              disabled={markingArrival}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {markingArrival ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>I have arrived at hospital</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-left">
                <span className="text-sm font-bold text-emerald-950 font-outfit block">
                  ✓ Arrived at Hospital
                </span>
                <span className="text-xs text-emerald-800 font-normal">
                  You have checked in for your appointment.
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Checked In
            </span>
          </div>
        )}

        {/* Before Your Appointment Section */}
        <div className="bg-slate-50/90 rounded-2xl p-5 sm:p-6 border border-slate-200 text-left space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 font-outfit">
                Before Your Appointment
              </h3>
              <p className="text-xs text-slate-500">
                Essential preparation guidelines for your visit to {currentAppt.departmentName} Department
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Previous Medical Reports:</strong> Bring your previous medical reports, diagnostic files, and past lab test results.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Current Medication List:</strong> Bring your current prescription list and daily medications.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>ID & Registration Documents:</strong> Carry a valid Government Photo ID or CareFlow Hospital ID card.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Recommended Arrival Time:</strong> Please arrive 15 minutes before {currentAppt.appointmentTime} for preliminary vitals and check-in.
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Department Location:</strong> {currentAppt.locationDetails.block}, {currentAppt.locationDetails.floor} ({currentAppt.locationDetails.room}).
              </span>
            </div>

            {/* Department-Specific Preparation Instructions Stored in Database */}
            {department?.preparationInstructions && department.preparationInstructions.length > 0 ? (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider block">
                  {department.name} Department Specific Guidelines:
                </span>
                {department.preparationInstructions.map((instruction, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{instruction}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-xs text-slate-500 italic">
                  No specific preparation instructions are available for this appointment.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Follow instructions provided by your healthcare provider. For questions, call the CareFlow helpline at +91 40 4567 8900.
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={onTrackQueue}
            className="uiverse-btn-primary py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Track Queue</span>
          </button>

          <button
            onClick={onGetDirections}
            className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-slate-600" />
            <span>Get Directions</span>
          </button>

          <button
            onClick={onViewPreparation}
            className="py-3 px-4 rounded-xl font-bold text-xs bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Preparation</span>
          </button>
        </div>

        {/* Secondary Management Links */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs font-semibold">
          <button
            onClick={onReschedule}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reschedule Appointment</span>
          </button>

          <button
            onClick={onCancel}
            className="text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Cancel Appointment</span>
          </button>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onDone}
          className="text-xs font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
