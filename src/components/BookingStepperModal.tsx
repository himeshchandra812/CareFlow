import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Globe,
  Check,
  AlertCircle,
  Mail,
  Phone
} from 'lucide-react';
import { Doctor, SupportedLanguage, Appointment, QueueState } from '../types/index.js';
import { api } from '../services/api.js';
import { DoctorAvatar } from './DoctorAvatar.js';

interface BookingStepperModalProps {
  doctor: Doctor | null;
  doctors?: Doctor[];
  currentLang: SupportedLanguage;
  onClose: () => void;
  onBookingSuccess: (result: { appointment: Appointment; queue: QueueState }) => void;
}

export const BookingStepperModal: React.FC<BookingStepperModalProps> = ({
  doctor,
  doctors = [],
  currentLang,
  onClose,
  onBookingSuccess
}) => {
  // If no doctor is selected or modal is closed, do not render
  if (!doctor) return null;

  // Active doctor (defaults to passed doctor)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor>(doctor);

  // Sync if doctor prop changes
  useEffect(() => {
    if (doctor) {
      setSelectedDoctor(doctor);
    }
  }, [doctor]);

  // Step 1: DOCTOR, Step 2: DATE & TIME, Step 3: PATIENT, Step 4: CONFIRM
  const [step, setStep] = useState<number>(2);

  // Date & Time selection states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>(
    doctor.availability.slots[0] || '10:30 AM'
  );

  // Patient details states
  const [patientName, setPatientName] = useState('Rajesh Kumar');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');
  const [patientEmail, setPatientEmail] = useState('rajesh.kumar@careflow.org');
  const [visitType, setVisitType] = useState<'new_visit' | 'follow_up'>('new_visit');

  // Confirmation acknowledgment
  const [hasConfirmedSummary, setHasConfirmedSummary] = useState(false);

  // Loading & Error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Escape key to close modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    },
    [isSubmitting, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 5 upcoming selectable dates
  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const isPracticeDay = selectedDoctor.availability.days.some(
      (day) => day.toLowerCase() === dayName.toLowerCase()
    );

    return {
      iso: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDayName: dayName,
      dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isPracticeDay
    };
  });

  // Handle final appointment submission via existing backend API
  const handleSubmitBooking = async () => {
    if (!selectedDoctor) return;
    if (!hasConfirmedSummary) {
      setErrorMessage('Please confirm your appointment details before proceeding.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Send create appointment request to backend
      const result = await api.createAppointment({
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot,
        appointmentType: visitType
      });

      // 2. Only after successful backend response, trigger booking success
      setIsSubmitting(false);

      // Reset form fields
      setHasConfirmedSummary(false);
      setErrorMessage('');

      // 3. Close booking menu automatically & show confirmation
      onBookingSuccess(result);
    } catch (err: any) {
      // If booking fails, keep the booking menu open with details intact so the user can retry
      setIsSubmitting(false);
      const msg = err.message || '';
      if (
        msg.toLowerCase().includes('slot') ||
        msg.toLowerCase().includes('unavailable') ||
        msg.toLowerCase().includes('conflict')
      ) {
        setErrorMessage('This time slot is no longer available. Please select another time.');
        setStep(2); // Return user to date/time selection step
      } else {
        setErrorMessage("We couldn't book this appointment. Please try again.");
      }
    }
  };

  const stepsList = [
    { num: 1, label: 'DOCTOR' },
    { num: 2, label: 'DATE & TIME' },
    { num: 3, label: 'PATIENT' },
    { num: 4, label: 'CONFIRM' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        // Close when clicking outside modal content if not submitting
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl lg:max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            <h2 id="booking-modal-title" className="font-extrabold text-slate-900 text-lg sm:text-xl font-outfit">
              Book Appointment
            </h2>
            <p className="text-xs text-slate-500">
              CareFlow Multispeciality Hospital • Step {step} of 4: {stepsList[step - 1].label}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
            aria-label="Close booking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Progress Indicator Header */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 shrink-0">
          <div className="grid grid-cols-4 gap-2 text-center">
            {stepsList.map((s) => {
              const isActive = step === s.num;
              const isPassed = step > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num < step && !isSubmitting) setStep(s.num);
                  }}
                  disabled={s.num > step || isSubmitting}
                  className={`flex flex-col items-center gap-1 py-1 transition-all ${
                    s.num < step ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center w-full">
                    <div
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        isPassed || isActive ? 'bg-teal-600' : 'bg-slate-200'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span
                      className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center ${
                        isPassed
                          ? 'bg-teal-600 text-white'
                          : isActive
                          ? 'bg-teal-700 text-white ring-2 ring-teal-300'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3 h-3" /> : s.num}
                    </span>
                    <span
                      className={`text-[10px] sm:text-xs font-bold tracking-wider hidden xs:inline ${
                        isActive
                          ? 'text-teal-800 font-extrabold'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stepper Body Container */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* STEP 1: DOCTOR */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-outfit">
                  Select Specialist Doctor
                </h3>
                <p className="text-xs text-slate-500">
                  Review specialist details and choose your preferred doctor to continue
                </p>
              </div>

              {selectedDoctor && (
                <div className="p-4 sm:p-5 bg-teal-50/70 rounded-2xl border-2 border-teal-600 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <DoctorAvatar
                        doctor={selectedDoctor}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-base sm:text-lg font-outfit">
                            {selectedDoctor.name}
                          </h4>
                          <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-teal-800">
                          {selectedDoctor.specialization} ({selectedDoctor.qualification})
                        </p>
                        <p className="text-xs text-slate-600">
                          {selectedDoctor.departmentName} Department • CareFlow Multispeciality Hospital
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-[11px] text-slate-500 block uppercase">Consultation Fee</span>
                      <span className="text-xl font-extrabold text-slate-900 font-outfit">
                        ₹{selectedDoctor.consultationFee}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-2 border-t border-teal-200/80">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-700" />
                      <span>Languages: <strong>{selectedDoctor.languages.join(', ')}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      <span>Practice Days: <strong>{selectedDoctor.availability.days.join(', ')}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Doctors Selection List if available */}
              {doctors.length > 1 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Or choose another doctor:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {doctors
                      .filter((d) => d._id !== selectedDoctor?._id)
                      .map((d) => (
                        <button
                          key={d._id}
                          type="button"
                          onClick={() => {
                            setSelectedDoctor(d);
                            setSelectedSlot(d.availability.slots[0] || '10:30 AM');
                          }}
                          className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer min-h-[44px]"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {d.name}
                            </div>
                            <div className="text-[11px] text-teal-700 truncate">{d.specialization}</div>
                            <div className="text-[10px] text-slate-500">₹{d.consultationFee}</div>
                          </div>
                          <span className="text-xs text-teal-700 font-bold shrink-0">Select</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DATE & TIME */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Doctor Quick Badge */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <DoctorAvatar
                    doctor={selectedDoctor}
                    size="sm"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{selectedDoctor.name}</h4>
                    <p className="text-xs text-teal-700">{selectedDoctor.specialization}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-teal-700 hover:underline min-h-[44px] flex items-center cursor-pointer"
                >
                  Change Doctor
                </button>
              </div>

              {/* 1. Select Date */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-700" />
                    <span>Select Appointment Date</span>
                  </label>
                  <span className="text-xs text-slate-500">Next 5 Available Days</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {dates.map((d) => {
                    const isSelected = selectedDate === d.iso;
                    const isUnavailable = !d.isPracticeDay;

                    return (
                      <button
                        key={d.iso}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => setSelectedDate(d.iso)}
                        className={`p-3 rounded-2xl border text-center transition-all min-h-[64px] flex flex-col items-center justify-center cursor-pointer ${
                          isUnavailable
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                            : isSelected
                            ? 'bg-teal-700 text-white border-teal-800 shadow-md ring-2 ring-teal-400/40'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px] font-bold uppercase block opacity-90">
                          {d.dayName}
                        </span>
                        <span className="text-sm sm:text-base font-extrabold font-outfit block">
                          {d.dateFormatted}
                        </span>
                        {isUnavailable && (
                          <span className="text-[9px] text-slate-400 block pt-0.5">Off Duty</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Select Time Slot */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-700" />
                    <span>Select Time Slot</span>
                  </label>
                  <span className="text-xs text-slate-500">Real MongoDB Schedule</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {selectedDoctor.availability.slots.map((slot) => {
                    const isSelected = selectedSlot === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold text-center border transition-all min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-2 ring-teal-400/40'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{slot}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-700" /> Selected
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" /> Available
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PATIENT */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-outfit">
                  Patient Information
                </h3>
                <p className="text-xs text-slate-500">
                  Verify patient contact details to receive booking alerts and queue notifications
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="patient-full-name" className="block text-xs font-bold text-slate-800 mb-1.5">
                    Patient Full Name <span className="text-rose-600" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="patient-full-name"
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className={`w-full pl-10 pr-3.5 py-3 bg-white border rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 min-h-[44px] ${
                        !patientName.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {!patientName.trim() ? (
                    <p className="text-[11px] text-rose-600 font-semibold pt-1">
                      ⚠️ Patient name is required.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 pt-0.5">
                      Name as printed on official healthcare records.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="patient-phone-num" className="block text-xs font-bold text-slate-800 mb-1.5">
                    Mobile Phone Number <span className="text-rose-600" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="patient-phone-num"
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className={`w-full pl-10 pr-3.5 py-3 bg-white border rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 min-h-[44px] ${
                        !patientPhone.trim() ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {!patientPhone.trim() ? (
                    <p className="text-[11px] text-rose-600 font-semibold pt-1">
                      ⚠️ Mobile phone is required for token alerts.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 pt-0.5">
                      Queue status updates will be sent via SMS.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="patient-email-addr" className="block text-xs font-bold text-slate-800 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="patient-email-addr"
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="e.g. rajesh.kumar@careflow.org"
                      className="w-full pl-10 pr-3.5 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 pt-0.5">
                    Appointment summary and directions sent via email.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Consultation Type</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setVisitType('new_visit')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
                        visitType === 'new_visit'
                          ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      New Visit (First Consultation)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitType('follow_up')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer min-h-[44px] ${
                        visitType === 'follow_up'
                          ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Follow-up Visit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-outfit">
                  Review & Confirm Appointment
                </h3>
                <p className="text-xs text-slate-500">
                  Please review all consultation details before confirming your booking
                </p>
              </div>

              {/* Responsive 2-column on desktop / stacked on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Card: Doctor & Schedule Summary */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs sm:text-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Specialist & Schedule
                  </span>

                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-slate-600">Doctor:</span>
                      <span className="font-extrabold text-slate-900">{selectedDoctor.name}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-slate-600">Department:</span>
                      <span className="font-bold text-teal-800">{selectedDoctor.departmentName}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-slate-600">Hospital:</span>
                      <span className="font-medium text-slate-800">CareFlow Multispeciality Hospital</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-slate-600">Date:</span>
                      <span className="font-extrabold text-slate-900">{selectedDate}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-600">Time:</span>
                      <span className="font-extrabold text-teal-700">{selectedSlot}</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Patient & Fee Summary */}
                <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 space-y-3 text-xs sm:text-sm">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                    Patient & Payment
                  </span>

                  <div className="space-y-2">
                    <div className="flex justify-between border-b border-teal-200/80 pb-2">
                      <span className="text-slate-600">Patient:</span>
                      <span className="font-extrabold text-slate-900">{patientName}</span>
                    </div>

                    <div className="flex justify-between border-b border-teal-200/80 pb-2">
                      <span className="text-slate-600">Phone:</span>
                      <span className="font-medium text-slate-800">{patientPhone}</span>
                    </div>

                    <div className="flex justify-between border-b border-teal-200/80 pb-2">
                      <span className="text-slate-600">Email:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">
                        {patientEmail || 'Not provided'}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-teal-200/80 pb-2">
                      <span className="text-slate-600">Type:</span>
                      <span className="font-bold text-slate-900">
                        {visitType === 'new_visit' ? 'New Visit' : 'Follow-up'}
                      </span>
                    </div>

                    <div className="flex justify-between pt-1">
                      <span className="font-bold text-slate-900">Consultation Fee:</span>
                      <span className="text-lg font-extrabold text-teal-900 font-outfit">
                        ₹{selectedDoctor.consultationFee}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explicit Confirmation Checkbox */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasConfirmedSummary}
                    onChange={(e) => setHasConfirmedSummary(e.target.checked)}
                    className="w-5 h-5 rounded-md accent-teal-700 mt-0.5 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-amber-950 font-semibold leading-relaxed">
                    I have verified the doctor, date, time, and patient details above, and confirm this appointment booking at CareFlow Multispeciality Hospital.
                  </span>
                </label>
              </div>

              {/* Error Alert Display */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stepper Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px] disabled:opacity-50"
            >
              Cancel
            </button>

            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setStep((s) => s - 1);
                }}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px] disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                setErrorMessage('');
                if (step === 1 && !selectedDoctor) {
                  setErrorMessage('Please select a doctor to continue.');
                  return;
                }
                if (step === 3 && (!patientName.trim() || !patientPhone.trim())) {
                  setErrorMessage('Please provide the patient name and phone number.');
                  return;
                }
                setStep((s) => s + 1);
              }}
              className="uiverse-btn-primary px-6 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer min-h-[44px]"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitBooking}
              disabled={isSubmitting || !hasConfirmedSummary}
              className="uiverse-btn-primary px-7 py-3 text-xs sm:text-sm font-extrabold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Booking your appointment...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Appointment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
