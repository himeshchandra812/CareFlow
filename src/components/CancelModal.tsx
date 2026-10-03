import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, Calendar, Clock, MapPin, User, CheckCircle2 } from 'lucide-react';
import { Appointment } from '../types/index.js';
import { api } from '../services/api.js';

interface CancelModalProps {
  appointment: Appointment | null;
  seniorMode?: boolean;
  onClose: () => void;
  onCancelled: (updated: Appointment) => void;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  appointment,
  seniorMode = false,
  onClose,
  onCancelled
}) => {
  if (!appointment) return null;

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reason, setReason] = useState('Patient requested cancellation');

  const reasons = [
    'Schedule conflict / Timing issue',
    'Unable to travel to hospital',
    'Symptoms resolved / Feeling better',
    'Consulting another physician',
    'Other'
  ];

  const handleConfirmCancel = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const updated = await api.updateAppointmentStatus(appointment._id, 'cancelled', reason);
      setLoading(false);
      onCancelled(updated);
    } catch (e: any) {
      console.error('Cancellation error:', e);
      setErrorMessage('Unable to cancel the appointment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="cancel-modal-title"
                className={`font-extrabold text-slate-900 font-outfit ${
                  seniorMode ? 'text-2xl' : 'text-xl'
                }`}
              >
                Cancel this appointment?
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to cancel your scheduled consultation?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer disabled:opacity-40"
            aria-label="Close cancel dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 text-rose-800 text-xs sm:text-sm rounded-xl border border-rose-200 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Appointment Details To Be Cancelled */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Appointment Information
          </span>

          <div className="space-y-2 text-xs sm:text-sm text-slate-800">
            <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200/80 pb-2">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-teal-700" />
                <span>{appointment.doctorName}</span>
              </span>
              <span className="text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {appointment.departmentName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-semibold">{appointment.appointmentDate}</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-700">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">{appointment.appointmentTime}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {appointment.locationDetails.block}, {appointment.locationDetails.floor} ({appointment.locationDetails.room})
              </span>
            </div>
          </div>
        </div>

        {/* Optional Cancellation Reason */}
        <div className="space-y-2 text-left">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Reason for Cancellation (Optional)
          </label>
          <div className="space-y-1.5">
            {reasons.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  reason === r
                    ? 'bg-rose-50/80 border-rose-300 text-rose-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="cancel_reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="accent-rose-600"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center disabled:opacity-50 ${
              seniorMode ? 'text-base py-3.5' : ''
            }`}
          >
            Keep Appointment
          </button>

          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={loading}
            className={`w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] ${
              seniorMode ? 'text-base py-3.5' : ''
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Cancel Appointment</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
