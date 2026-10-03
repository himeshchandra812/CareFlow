import React from 'react';
import { FileCheck, CheckCircle2, AlertCircle, ArrowLeft, Clock, MapPin, FileText, ShieldCheck } from 'lucide-react';
import { Department } from '../types/index.js';

interface PreparationCardProps {
  department: Department;
  onBack?: () => void;
}

export const PreparationCard: React.FC<PreparationCardProps> = ({
  department,
  onBack
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 animate-in fade-in duration-200">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Header Banner */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0 border border-teal-200 shadow-xs">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-outfit">
              Before Your Appointment
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              CareFlow Guidelines • {department.name} Department
            </p>
          </div>
        </div>

        {/* Location & Recommended Arrival Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600" />
              Department Location
            </span>
            <p className="text-slate-600 font-medium">
              {department.block}, {department.floor} ({department.location})
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Recommended Arrival Time
            </span>
            <p className="text-slate-600 font-medium">
              Arrive 15 minutes early for registration & vitals
            </p>
          </div>
        </div>

        {/* General Required Items Checklist */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-outfit">
            Essential Documents & Records
          </h3>

          <div className="space-y-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Bring your previous medical reports</span>
                <span className="text-slate-600 text-xs">
                  Include previous diagnostic test results, recent lab reports, scans, and past discharge summaries.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Bring your current medication list</span>
                <span className="text-slate-600 text-xs">
                  Carry physical prescription slips or a written list of all active medications, dosages, and supplements.
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Carry valid ID or registration documents</span>
                <span className="text-slate-600 text-xs">
                  Government photo identification card (Aadhaar / Voter ID / Passport) or CareFlow Hospital ID card.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Department-Specific Preparation Instructions Stored in Database */}
        {department.preparationInstructions && department.preparationInstructions.length > 0 ? (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider font-outfit">
              {department.name} Department Specific Instructions
            </h3>

            <div className="space-y-2">
              {department.preparationInstructions.map((instruction, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 flex items-start gap-3 text-xs sm:text-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                  <span className="font-semibold text-slate-900 leading-snug">{instruction}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 italic">
              No specific preparation instructions are available for this appointment.
            </p>
          </div>
        )}

        {/* Mandatory Healthcare Helpline Disclosure */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3 font-medium">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Follow the preparation instructions provided by your healthcare provider. If you have specific medical conditions or questions, please contact the CareFlow hospital helpline at +91 40 4567 8900.
          </span>
        </div>
      </div>
    </div>
  );
};
