import React from 'react';
import {
  X,
  Star,
  MapPin,
  Calendar,
  Clock,
  Globe,
  Building,
  CheckCircle2,
  Award,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';
import { Doctor, SupportedLanguage } from '../types/index.js';
import { t } from '../services/i18n.js';

interface DoctorProfileModalProps {
  doctor: Doctor | null;
  currentLang: SupportedLanguage;
  seniorMode?: boolean;
  onClose: () => void;
  onBook: (doctor: Doctor) => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  doctor,
  currentLang,
  seniorMode = false,
  onClose,
  onBook
}) => {
  if (!doctor) return null;

  // Real availability dates (from doctor.availability.days)
  const availableDays = doctor.availability?.days || [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  // 5 upcoming practice dates
  const upcomingPracticeDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const isPracticeDay = availableDays.some(
      (day) => day.toLowerCase() === dayName.toLowerCase()
    );
    return {
      iso: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isPracticeDay
    };
  }).filter((d) => d.isPracticeDay).slice(0, 4);

  // Real available time slots from backend
  const availableSlots =
    doctor.availability?.slots && doctor.availability.slots.length > 0
      ? doctor.availability.slots
      : ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '03:30 PM'];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-profile-title"
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-outfit">
              Doctor Profile & Clinical Availability
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            aria-label="Close doctor profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-left">
          
          {/* Main Info Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
            <img
              src={doctor.profileImage}
              alt={doctor.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-slate-100 border-2 border-slate-200 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1.5 min-w-0 flex-1">
              <h2
                id="doctor-profile-title"
                className={`font-extrabold text-slate-900 font-outfit ${
                  seniorMode ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                }`}
              >
                {doctor.name}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-teal-800">
                {doctor.specialization} • {doctor.departmentName} Department
              </p>
              <p className="text-xs text-slate-500 font-medium">{doctor.qualification}</p>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-600 pt-1">
                <span className="flex items-center font-bold text-amber-600 gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {doctor.rating} Rating
                </span>
                <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                  {doctor.experience} Years Experience
                </span>
                <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded-md border border-teal-200">
                  ₹{doctor.consultationFee} Consultation Fee
                </span>
              </div>
            </div>
          </div>

          {/* About Bio Section */}
          <div className="space-y-1.5 border-t border-slate-100 pt-3.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit">
              Clinical Background & Specialization
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {doctor.about}
            </p>
          </div>

          {/* Grid: Languages & Hospital Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-teal-600" /> Languages Spoken
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {doctor.languages.join(' • ')}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Building className="w-4 h-4 text-teal-600" /> Hospital Affiliation
              </span>
              <p className="font-bold text-slate-900 text-sm">
                CareFlow Multispeciality Hospital
              </p>
            </div>
          </div>

          {/* Real Upcoming Available Appointment Dates */}
          <div className="space-y-2.5 border-t border-slate-100 pt-3.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-700" /> Upcoming Available Dates
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {upcomingPracticeDates.map((d) => (
                <div
                  key={d.iso}
                  className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-200 text-center"
                >
                  <span className="text-[11px] font-semibold text-teal-800 block">{d.dayName}</span>
                  <span className="text-xs font-bold text-slate-900">{d.dateFormatted}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real Available Time Slots */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-700" /> Standard Consultation Slots
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => (
                <span
                  key={slot}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
                >
                  {slot}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">Consultation Fee</span>
            <span className="text-xl font-extrabold text-slate-900 font-outfit">
              ₹{doctor.consultationFee}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onBook(doctor);
            }}
            className={`uiverse-btn-primary px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
              seniorMode ? 'text-base px-8' : ''
            }`}
          >
            <span>Book Appointment</span>
          </button>
        </div>

      </div>
    </div>
  );
};
