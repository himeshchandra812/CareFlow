import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, HelpCircle, HeartPulse, Clock, Accessibility, Check } from 'lucide-react';

interface HelpSupportProps {
  seniorMode?: boolean;
  onToggleSeniorMode?: () => void;
}

export const HelpSupport: React.FC<HelpSupportProps> = ({
  seniorMode = false,
  onToggleSeniorMode
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
          Help & Settings
        </h2>
        <p className="text-sm text-slate-600">
          24/7 CareFlow Hospital assistance, emergency helplines, and accessibility preferences
        </p>
      </div>

      {/* Senior Mode & Accessibility Settings Card */}
      <div className="uiverse-card rounded-3xl p-6 border-2 border-amber-300 bg-amber-50/50 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
              <Accessibility className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-outfit">
                Senior Citizen & High-Contrast Mode
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                Increases text size, enlarges touch targets (≥52px), simplifies navigation, and optimizes visual contrast for easier reading.
              </p>
            </div>
          </div>

          {onToggleSeniorMode && (
            <button
              onClick={onToggleSeniorMode}
              className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm ${
                seniorMode
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white text-slate-800 border-2 border-slate-300 hover:bg-slate-100'
              }`}
              role="switch"
              aria-checked={seniorMode}
              aria-label="Toggle Senior Citizen Mode"
            >
              <Accessibility className="w-5 h-5" />
              <span>{seniorMode ? '✓ Senior Mode ON' : 'Enable Senior Mode'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Emergency & Hospital Hotline */}
        <div className="uiverse-card rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-outfit">Emergency & OPD Hotline</h3>
            <p className="text-xs text-slate-500">Available 24 hours a day, 7 days a week</p>
          </div>
          <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-2">
            <div className="text-2xl font-extrabold text-rose-900 font-outfit">+91 40 4567 8900</div>
            <p className="text-xs text-rose-800 font-medium">
              Call immediately for emergency ambulance dispatch or urgent triage assistance.
            </p>
          </div>
        </div>

        {/* Senior & Accessibility Desk */}
        <div className="uiverse-card rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-outfit">Senior Patient Care Desk</h3>
            <p className="text-xs text-slate-500">Dedicated wheelchair and elderly support</p>
          </div>
          <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 space-y-2">
            <div className="text-lg font-bold text-teal-900 font-outfit">Block A • Ground Floor Helpdesk</div>
            <p className="text-xs text-teal-800 font-medium">
              Staff companions are available at the main entrance to assist senior citizens with registration, wheelchairs, and token tracking.
            </p>
          </div>
        </div>

      </div>

      {/* Hospital Location Card */}
      <div className="uiverse-card rounded-3xl p-6 border border-slate-200 space-y-3">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900 text-base">CareFlow Multispeciality Hospital</h4>
            <p className="text-xs text-slate-600">
              100 Healthcare Boulevard, Tech City, Jubilee Hills, Hyderabad - 500081
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
