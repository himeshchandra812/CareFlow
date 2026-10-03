import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Appointment, Doctor } from '../types/index.js';
import { api } from '../services/api.js';

interface RescheduleModalProps {
  appointment: Appointment | null;
  doctors?: Doctor[];
  seniorMode?: boolean;
  onClose: () => void;
  onRescheduled: (updated: Appointment) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  appointment,
  doctors = [],
  seniorMode = false,
  onClose,
  onRescheduled
}) => {
  if (!appointment) return null;

  // Step 1: 'select_slot' (Select New Date & Time)
  // Step 2: 'review_confirm' (Review Current vs New & Confirm Reschedule)
  const [step, setStep] = useState<'select_slot' | 'review_confirm'>('select_slot');

  const [doctor, setDoctor] = useState<Doctor | null>(
    doctors.find((d) => d._id === appointment.doctorId) || null
  );

  useEffect(() => {
    if (!doctor && appointment.doctorId) {
      api
        .getDoctorById(appointment.doctorId)
        .then((doc) => setDoctor(doc))
        .catch((err) => console.warn('Could not fetch doctor details:', err));
    }
  }, [appointment.doctorId, doctor]);

  // Generate 7 upcoming selectable dates
  const availableDays = doctor?.availability?.days || [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1); // Future dates starting tomorrow
    const fullDayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const isPracticeDay = availableDays.some(
      (day) => day.toLowerCase() === fullDayName.toLowerCase()
    );

    return {
      iso: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDayName,
      dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isPracticeDay
    };
  });

  // Default to first practice day
  const defaultDateObj = dates.find((d) => d.isPracticeDay) || dates[0];
  const [newDate, setNewDate] = useState<string>(defaultDateObj.iso);

  // Doctor's real available time slots from backend database
  const availableSlots =
    doctor?.availability?.slots && doctor.availability.slots.length > 0
      ? doctor.availability.slots
      : ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:30 PM', '04:00 PM'];

  const [newTime, setNewTime] = useState<string>(availableSlots[0] || '10:30 AM');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // When selected date or slot changes, clear errors
  const handleSelectDate = (iso: string) => {
    setNewDate(iso);
    setConflictError(null);
    setErrorMessage(null);
  };

  const handleSelectSlot = (slot: string) => {
    setNewTime(slot);
    setConflictError(null);
    setErrorMessage(null);
  };

  // Proceed to Step 2: Review changes
  const handleProceedToReview = () => {
    // Conflict check if user selected exact same date & time
    if (newDate === appointment.appointmentDate && newTime === appointment.appointmentTime) {
      setConflictError('This time slot is identical to your current appointment. Please select another time or date.');
      return;
    }
    setConflictError(null);
    setErrorMessage(null);
    setStep('review_confirm');
  };

  // Step 2: Confirm Reschedule with backend
  const handleConfirmReschedule = async () => {
    setLoading(true);
    setErrorMessage(null);
    setConflictError(null);

    try {
      const updated = await api.rescheduleAppointment(appointment._id, newDate, newTime);
      setLoading(false);
      onRescheduled(updated);
    } catch (e: any) {
      console.error('Reschedule error:', e);
      setLoading(false);
      const msg = e.message || '';
      if (msg.toLowerCase().includes('conflict') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('slot')) {
        setConflictError('This time slot is no longer available. Please select another time.');
        setStep('select_slot');
      } else {
        setErrorMessage('Unable to reschedule the appointment. Please try again.');
      }
    }
  };

  const selectedDateObj = dates.find((d) => d.iso === newDate);
  const formattedSelectedDate = selectedDateObj
    ? `${selectedDateObj.dayName}, ${selectedDateObj.dateFormatted} (${selectedDateObj.iso})`
    : newDate;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="reschedule-modal-title"
                className={`font-extrabold text-slate-900 font-outfit ${
                  seniorMode ? 'text-2xl' : 'text-xl'
                }`}
              >
                {step === 'select_slot' ? 'Reschedule Appointment' : 'Review & Confirm Reschedule'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {appointment.doctorName} • {appointment.departmentName} Department
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer disabled:opacity-40"
            aria-label="Close reschedule dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banners */}
        {conflictError && (
          <div className="p-3.5 bg-amber-50 text-amber-900 text-xs sm:text-sm rounded-xl border border-amber-300 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{conflictError}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 text-rose-800 text-xs sm:text-sm rounded-xl border border-rose-200 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Date & Time Slot Selection */}
        {step === 'select_slot' && (
          <div className="space-y-5">
            {/* Current Appointment Reference */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 font-medium block">Current Appointment:</span>
                <span className="font-bold text-slate-900">
                  {appointment.appointmentDate} at {appointment.appointmentTime}
                </span>
              </div>
              <span className="text-[11px] bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                Token {appointment.tokenNumber}
              </span>
            </div>

            {/* Select New Date */}
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Select New Date
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dates.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => handleSelectDate(d.iso)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer min-h-[56px] flex flex-col items-center justify-center ${
                      newDate === d.iso
                        ? 'bg-teal-700 text-white border-teal-800 shadow-sm font-bold ring-2 ring-teal-500'
                        : d.isPracticeDay
                        ? 'bg-white text-slate-800 border-slate-200 hover:border-teal-300 font-semibold'
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}
                  >
                    <span className="text-xs">{d.dayName}</span>
                    <span className="text-xs font-bold">{d.dateFormatted}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Available Time Slot */}
            <div className="space-y-2 text-left">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Select Available Time Slot
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                      newTime === slot
                        ? 'bg-teal-700 text-white border-teal-800 shadow-sm font-bold ring-2 ring-teal-500'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-teal-300 font-semibold'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">{slot}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleProceedToReview}
                className="w-full sm:w-auto uiverse-btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <span>Review Changes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Review Changes & Confirm Reschedule */}
        {step === 'review_confirm' && (
          <div className="space-y-5 text-left">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Please review the details below before confirming your rescheduled consultation:
            </p>

            {/* Current vs New Appointment Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              
              {/* Current Appointment Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 opacity-80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Current Appointment
                </span>
                <div className="font-bold text-slate-900">{appointment.doctorName}</div>
                <div className="text-slate-600">{appointment.departmentName}</div>
                <div className="text-slate-700 font-medium pt-1">
                  📅 {appointment.appointmentDate}
                </div>
                <div className="text-slate-700 font-medium">
                  ⏰ {appointment.appointmentTime}
                </div>
              </div>

              {/* New Appointment Box */}
              <div className="p-4 bg-teal-50 rounded-2xl border-2 border-teal-600 space-y-2 shadow-xs">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                  New Appointment
                </span>
                <div className="font-bold text-teal-950">{appointment.doctorName}</div>
                <div className="text-teal-800 font-medium">{appointment.departmentName}</div>
                <div className="text-teal-900 font-bold pt-1">
                  📅 {formattedSelectedDate}
                </div>
                <div className="text-teal-900 font-bold">
                  ⏰ {newTime}
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              * Your live queue position and token will be automatically updated for the new date and time.
            </div>

            {/* Step 2 Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('select_slot')}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Date/Time</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={loading}
                className="w-full sm:w-auto uiverse-btn-primary px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rescheduling...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Reschedule</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
