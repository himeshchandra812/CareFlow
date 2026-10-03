import React, { useState } from 'react';
import { Clock, MapPin, CheckCircle2, UserCheck, Stethoscope, ArrowRight, Loader2 } from 'lucide-react';
import { Appointment, QueueState, SupportedLanguage } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { api } from '../services/api.js';

interface QueueCardProps {
  appointment: Appointment;
  queueState: QueueState | null;
  currentLang: SupportedLanguage;
  onTrackQueue: () => void;
  onArrivalSuccess?: (result: { appointment: Appointment; queue: QueueState }) => void;
}

export const QueueCard: React.FC<QueueCardProps> = ({
  appointment,
  queueState,
  currentLang,
  onTrackQueue,
  onArrivalSuccess
}) => {
  const [markingArrival, setMarkingArrival] = useState(false);
  const [arrivalError, setArrivalError] = useState<string | null>(null);
  const isArrived = appointment.status === 'arrived' || appointment.status === 'waiting' || queueState?.isPatientArrived;

  const handleArrival = async () => {
    setMarkingArrival(true);
    setArrivalError(null);
    try {
      const res = await api.markPatientArrived(appointment._id);
      setMarkingArrival(false);
      onArrivalSuccess?.(res);
    } catch (e: any) {
      console.error('Arrival error:', e);
      setArrivalError('Unable to update your arrival status. Please try again.');
      setMarkingArrival(false);
    }
  };

  const doctorStatusColor =
    queueState?.doctorStatus === 'Available'
      ? 'bg-emerald-500'
      : queueState?.doctorStatus === 'On Break'
      ? 'bg-amber-500'
      : queueState?.doctorStatus === 'Delayed'
      ? 'bg-orange-500'
      : 'bg-teal-600';

  return (
    <div className="uiverse-card rounded-2xl p-5 border border-slate-200/90 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-xs font-bold text-teal-700 uppercase tracking-wider font-outfit">
            {appointment.departmentName} Department
          </span>
          <h4 className="font-bold text-slate-900 text-base">{appointment.doctorName}</h4>
        </div>

        <div className="bg-slate-900 text-white text-center px-3 py-1.5 rounded-xl shrink-0">
          <span className="text-[10px] text-slate-400 block font-mono uppercase">Token</span>
          <span className="text-lg font-extrabold text-teal-400 font-outfit">
            {appointment.tokenNumber}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] text-slate-500 block uppercase font-mono">Serving</span>
          <span className="font-extrabold text-slate-900 text-sm">{queueState?.currentToken || 'A-119'}</span>
        </div>

        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
          <span className="text-[10px] text-amber-800 block uppercase font-mono">Ahead</span>
          <span className="font-extrabold text-amber-900 text-sm">{queueState?.patientsAhead ?? 8}</span>
        </div>

        <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100">
          <span className="text-[10px] text-teal-800 block uppercase font-mono">Est. Wait</span>
          <span className="font-extrabold text-teal-900 text-sm">~{queueState?.estimatedWaitTime ?? 24} min</span>
        </div>
      </div>

      {/* Doctor Status Badge */}
      <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${doctorStatusColor} animate-pulse shrink-0`} />
          <span className="font-semibold text-slate-800">
            {queueState?.doctorStatusMessage || `${appointment.doctorName} is consulting`}
          </span>
        </div>
        <StatusBadge status={queueState?.doctorStatus || 'Consulting'} size="sm" />
      </div>

      {/* Arrival Status & Actions */}
      <div className="space-y-2 pt-1">
        {arrivalError && (
          <p className="text-xs text-rose-600 font-bold text-center">
            {arrivalError}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {isArrived ? (
            <div className="px-3 py-2 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-200 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ Arrived at Hospital</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-normal">You have checked in for your appointment.</span>
            </div>
          ) : (
            <button
              onClick={handleArrival}
              disabled={markingArrival}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              {markingArrival ? (
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

          <button
            onClick={onTrackQueue}
            className="uiverse-btn-primary px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Track Queue</span>
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center italic">
        Estimated based on current queue activity.
      </p>
    </div>
  );
};
