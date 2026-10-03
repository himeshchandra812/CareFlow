import React, { useState } from 'react';
import { Search, Calendar, MapPin, HelpCircle, Mic, HeartPulse, Clock, UserCheck, Loader2 } from 'lucide-react';
import { SupportedLanguage, Appointment } from '../types/index.js';
import { api } from '../services/api.js';
import { t } from '../services/i18n.js';

interface SeniorModeHomeProps {
  currentLang: SupportedLanguage;
  activeAppointment: Appointment | null;
  onNavigate: (tab: string) => void;
  onOpenVoice: () => void;
  onAppointmentUpdate?: () => void;
}

export const SeniorModeHome: React.FC<SeniorModeHomeProps> = ({
  currentLang,
  activeAppointment,
  onNavigate,
  onOpenVoice,
  onAppointmentUpdate
}) => {
  const [markingArrival, setMarkingArrival] = useState(false);
  const [arrivalError, setArrivalError] = useState<string | null>(null);

  const isArrived =
    activeAppointment?.status === 'arrived' ||
    activeAppointment?.status === 'waiting' ||
    activeAppointment?.status === 'in_progress';

  const handleArrival = async () => {
    if (!activeAppointment) return;
    setMarkingArrival(true);
    setArrivalError(null);
    try {
      await api.markPatientArrived(activeAppointment._id);
      setMarkingArrival(false);
      onAppointmentUpdate?.();
    } catch (e: any) {
      console.error('Arrival check-in error:', e);
      setArrivalError('Unable to update your arrival status. Please try again.');
      setMarkingArrival(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Friendly Large Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-slate-300 shadow-md text-center space-y-3">
        <div className="inline-flex p-3 bg-teal-100 text-teal-800 rounded-full mb-1">
          <HeartPulse className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-outfit">
          {t('greeting', currentLang)}, Rajesh
        </h1>
        <p className="text-xl text-slate-700 font-medium">
          {t('howCanWeHelp', currentLang)}
        </p>
      </div>

      {/* Active Appointment Highlight for Senior */}
      {activeAppointment && (
        <div className="bg-amber-50 border-3 border-amber-400 p-6 rounded-2xl shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 pb-3 flex-wrap gap-2">
            <span className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-700" />
              {t('upcomingAppointment', currentLang)}
            </span>
            <div className="flex items-center gap-2">
              <span className="bg-amber-200 text-amber-900 font-extrabold text-sm sm:text-base px-3 py-1 rounded-lg">
                {(activeAppointment.visitType || activeAppointment.appointmentType) === 'follow_up' ? 'FOLLOW-UP VISIT' : 'NEW VISIT'}
              </span>
              <span className="bg-amber-200 text-amber-900 font-extrabold text-lg px-3 py-1 rounded-lg">
                Token {activeAppointment.tokenNumber}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-slate-900">
            <div className="text-2xl font-bold">{activeAppointment.doctorName}</div>
            <div className="text-lg font-semibold text-slate-700">{activeAppointment.departmentName} Department</div>
            <div className="text-lg font-medium text-slate-800">
              {activeAppointment.appointmentDate} • {activeAppointment.appointmentTime}
            </div>
            <div className="text-base text-slate-600 bg-amber-100/80 p-2.5 rounded-lg border border-amber-200 font-medium">
              📍 {activeAppointment.locationDetails.block}, {activeAppointment.locationDetails.floor} ({activeAppointment.locationDetails.room})
            </div>
          </div>

          {/* Arrival Status / Check-in CTA for Seniors */}
          <div className="pt-1">
            {arrivalError && (
              <p className="text-sm text-rose-700 font-bold pb-2">
                {arrivalError}
              </p>
            )}

            {isArrived ? (
              <div className="p-4 bg-emerald-100/90 text-emerald-950 rounded-xl border-2 border-emerald-400 flex items-center gap-3">
                <UserCheck className="w-7 h-7 text-emerald-700 shrink-0" />
                <div>
                  <div className="text-xl font-extrabold font-outfit">✓ Arrived at Hospital</div>
                  <div className="text-sm font-medium text-emerald-800">You have checked in for your appointment.</div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleArrival}
                disabled={markingArrival}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xl py-4 rounded-xl shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 min-h-[52px]"
              >
                {markingArrival ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-6 h-6" />
                    <span>I have arrived at hospital</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onNavigate('queue')}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xl py-4 rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Clock className="w-6 h-6" />
              {t('trackQueue', currentLang)}
            </button>
            <button
              onClick={() => onNavigate('map')}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xl py-4 rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <MapPin className="w-6 h-6" />
              {t('getDirections', currentLang)}
            </button>
          </div>
        </div>
      )}

      {/* Giant Accessibility Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* FIND A DOCTOR */}
        <button
          onClick={() => onNavigate('doctors')}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white p-6 rounded-2xl shadow-lg border-2 border-teal-700 flex items-center gap-4 text-left transition-transform active:scale-98 cursor-pointer"
        >
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
            <Search className="w-10 h-10" />
          </div>
          <div>
            <div className="text-2xl font-bold font-outfit">FIND A DOCTOR</div>
            <div className="text-sm font-medium text-teal-100">Search specialists & departments</div>
          </div>
        </button>

        {/* FIND DEPARTMENT */}
        <button
          onClick={() => onNavigate('departments')}
          className="w-full bg-indigo-700 hover:bg-indigo-800 text-white p-6 rounded-2xl shadow-lg border-2 border-indigo-800 flex items-center gap-4 text-left transition-transform active:scale-98 cursor-pointer"
        >
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
            <MapPin className="w-10 h-10" />
          </div>
          <div>
            <div className="text-2xl font-bold font-outfit">FIND DEPARTMENT</div>
            <div className="text-sm font-medium text-indigo-100">Hospital wings & specialties</div>
          </div>
        </button>

        {/* MY APPOINTMENT */}
        <button
          onClick={() => onNavigate('appointments')}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white p-6 rounded-2xl shadow-lg border-2 border-slate-900 flex items-center gap-4 text-left transition-transform active:scale-98 cursor-pointer"
        >
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
            <Calendar className="w-10 h-10" />
          </div>
          <div>
            <div className="text-2xl font-bold font-outfit">MY APPOINTMENT</div>
            <div className="text-sm font-medium text-slate-300">View token & schedule details</div>
          </div>
        </button>

        {/* GET DIRECTIONS */}
        <button
          onClick={() => onNavigate('map')}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white p-6 rounded-2xl shadow-lg border-2 border-emerald-800 flex items-center gap-4 text-left transition-transform active:scale-98 cursor-pointer"
        >
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
            <MapPin className="w-10 h-10" />
          </div>
          <div>
            <div className="text-2xl font-bold font-outfit">GET DIRECTIONS</div>
            <div className="text-sm font-medium text-emerald-100">Step-by-step indoor navigation</div>
          </div>
        </button>
      </div>

      {/* GIANT SPEAK BUTTON */}
      <button
        onClick={onOpenVoice}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-8 rounded-3xl shadow-xl border-4 border-amber-300 flex items-center justify-center gap-5 text-center transition-transform active:scale-98"
      >
        <Mic className="w-12 h-12 animate-bounce" />
        <div className="text-3xl font-extrabold tracking-wide font-outfit">
          🎙 {t('speak', currentLang).toUpperCase()} IN YOUR LANGUAGE
        </div>
      </button>
    </div>
  );
};
