import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  RefreshCw,
  XCircle,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Loader2
} from 'lucide-react';
import { Appointment, SupportedLanguage } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { api } from '../services/api.js';
import { t } from '../services/i18n.js';

interface AppointmentsListProps {
  appointments: Appointment[];
  currentLang: SupportedLanguage;
  onTrackQueue: (appt: Appointment) => void;
  onGetDirections: (deptId: string) => void;
  onViewPreparation: (deptId: string) => void;
  onReschedule: (appt: Appointment) => void;
  onCancel: (appt: Appointment) => void;
  onBookNew: () => void;
  onAppointmentUpdate?: () => void;
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  appointments,
  currentLang,
  onTrackQueue,
  onGetDirections,
  onViewPreparation,
  onReschedule,
  onCancel,
  onBookNew,
  onAppointmentUpdate
}) => {
  const [activeSegment, setActiveSegment] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [arrivalError, setArrivalError] = useState<{ id: string; msg: string } | null>(null);

  const upcomingList = appointments.filter(
    (a) =>
      a.status === 'confirmed' ||
      a.status === 'arrived' ||
      a.status === 'waiting' ||
      a.status === 'in_progress'
  );
  const pastList = appointments.filter((a) => a.status === 'completed');
  const cancelledList = appointments.filter((a) => a.status === 'cancelled');

  let currentDisplayList = upcomingList;
  if (activeSegment === 'past') currentDisplayList = pastList;
  if (activeSegment === 'cancelled') currentDisplayList = cancelledList;

  const handleArrival = async (apptId: string) => {
    setUpdatingId(apptId);
    setArrivalError(null);
    try {
      await api.markPatientArrived(apptId);
      setUpdatingId(null);
      onAppointmentUpdate?.();
    } catch (e: any) {
      console.error('Arrival check-in error:', e);
      setArrivalError({
        id: apptId,
        msg: 'Unable to update your arrival status. Please try again.'
      });
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
            My Appointments
          </h2>
          <p className="text-sm text-slate-600">
            Manage your consultation schedule, track active queues, reschedule, or review guidelines
          </p>
        </div>

        <button
          onClick={onBookNew}
          className="uiverse-btn-primary px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer"
        >
          + Book New Appointment
        </button>
      </div>

      {/* Segmented Filter Control Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl max-w-md">
        <button
          onClick={() => setActiveSegment('upcoming')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeSegment === 'upcoming'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Upcoming ({upcomingList.length})
        </button>
        <button
          onClick={() => setActiveSegment('past')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeSegment === 'past'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Past ({pastList.length})
        </button>
        <button
          onClick={() => setActiveSegment('cancelled')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeSegment === 'cancelled'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cancelled ({cancelledList.length})
        </button>
      </div>

      {currentDisplayList.length > 0 ? (
        <div className="space-y-4">
          {currentDisplayList.map((appt) => {
            const isCancelled = appt.status === 'cancelled';
            const isCompleted = appt.status === 'completed';

            return (
              <div
                key={appt._id}
                className={`uiverse-card rounded-2xl p-5 border ${
                  isCancelled
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : isCompleted
                    ? 'bg-slate-50 border-slate-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-lg font-outfit">
                        {appt.doctorName}
                      </span>
                      <StatusBadge status={appt.status} size="sm" />
                    </div>
                    <p className="text-xs font-semibold text-teal-700">
                      {appt.departmentName} Department
                    </p>
                    <p className="text-xs text-slate-500">
                      📍 {appt.locationDetails.block} • {appt.locationDetails.floor} ({appt.locationDetails.room})
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-slate-900 text-white px-4 py-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Token</span>
                    <span className="text-xl font-extrabold text-teal-400 font-outfit">
                      {appt.tokenNumber}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      {appt.appointmentDate}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {appt.appointmentTime}
                    </span>
                  </div>

                  {!isCancelled && !isCompleted && (
                    <div className="flex flex-wrap items-center gap-2">
                      {appt.status === 'arrived' ? (
                        <span className="px-2.5 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✓ Arrived at Hospital</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleArrival(appt._id)}
                          disabled={updatingId === appt._id}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {updatingId === appt._id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>I have arrived at hospital</span>
                            </>
                          )}
                        </button>
                      )}

                      {arrivalError?.id === appt._id && (
                        <span className="text-[11px] text-rose-600 font-semibold">
                          {arrivalError.msg}
                        </span>
                      )}

                      <button
                        onClick={() => onTrackQueue(appt)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
                      >
                        Track Queue
                      </button>
                      <button
                        onClick={() => onGetDirections(appt.departmentId)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Directions
                      </button>
                      <button
                        onClick={() => onViewPreparation(appt.departmentId)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Prep Info
                      </button>
                      <button
                        onClick={() => onReschedule(appt)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => onCancel(appt)}
                        className="px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {isCancelled && appt.cancelReason && (
                    <div className="text-xs text-rose-700 italic">
                      Reason: {appt.cancelReason}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">
            No {activeSegment} appointments
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Book an appointment with top specialists at CareFlow Multispeciality Hospital.
          </p>
          <button
            onClick={onBookNew}
            className="uiverse-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl inline-block cursor-pointer"
          >
            Find Doctor & Book
          </button>
        </div>
      )}
    </div>
  );
};
