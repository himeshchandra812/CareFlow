import React, { useState, useEffect } from 'react';
import { FileCheck, CheckCircle2, AlertCircle, ArrowLeft, Clock, MapPin, FileText, ShieldCheck } from 'lucide-react';
import { Department, AppointmentPreparationInfo, Appointment } from '../types/index.js';
import { api } from '../services/api.js';

interface PreparationCardProps {
  department?: Department | null;
  appointment?: Appointment | null;
  appointmentId?: string | null;
  onBack?: () => void;
}

export const PreparationCard: React.FC<PreparationCardProps> = ({
  department,
  appointment,
  appointmentId,
  onBack
}) => {
  const [prepInfo, setPrepInfo] = useState<AppointmentPreparationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeAppId = appointmentId || appointment?._id;

  useEffect(() => {
    let isMounted = true;
    if (activeAppId) {
      setIsLoading(true);
      api.getAppointmentPreparation(activeAppId)
        .then((data) => {
          if (isMounted) {
            setPrepInfo(data);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [activeAppId]);

  const visitType = prepInfo?.visitType || appointment?.visitType || appointment?.appointmentType || 'new_visit';
  const visitLabel = visitType === 'follow_up' ? 'Follow-up Visit' : visitType === 'new_visit' ? 'New Visit' : 'Visit type unavailable';
  const deptName = prepInfo?.departmentName || department?.name || appointment?.departmentName || 'General';
  const instructions = prepInfo?.instructions || department?.preparationInstructions || [];
  const docs = prepInfo?.documentsToBring || [
    'Valid Government Photo ID or Hospital Registration Card',
    'Previous medical history & records if available',
    'Current prescription medication list'
  ];
  const arrivalMinutes = prepInfo?.recommendedArrivalTimeMinutes || (visitType === 'follow_up' ? 10 : 15);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0 border border-teal-200 shadow-xs">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-outfit">
                Before Your Appointment
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                CareFlow Guidelines • {deptName} Department
              </p>
            </div>
          </div>

          <span className={`self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full ${
            visitType === 'follow_up'
              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
              : 'bg-teal-100 text-teal-800 border border-teal-200'
          }`}>
            {visitLabel}
          </span>
        </div>

        {/* Doctor & Appointment Quick Details if available */}
        {prepInfo && (
          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div>
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Specialist</span>
              <span className="font-extrabold text-slate-900 text-base">{prepInfo.doctorName}</span>
              <span className="text-slate-600 block">{prepInfo.departmentName} Department</span>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Schedule</span>
              <span className="font-extrabold text-slate-900">{prepInfo.appointmentDate}</span>
              <span className="text-teal-700 font-bold block">{prepInfo.appointmentTime}</span>
            </div>
          </div>
        )}

        {/* Location & Recommended Arrival Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600" />
              Department Location
            </span>
            <p className="text-slate-600 font-medium">
              {prepInfo?.locationNote || (department ? `${department.block}, ${department.floor} (${department.location})` : 'Block B • 2nd Floor')}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Recommended Arrival Time
            </span>
            <p className="text-slate-600 font-medium">
              Arrive {arrivalMinutes} minutes early for registration & vitals
            </p>
          </div>
        </div>

        {/* Required Documents Checklist Differentiated by Visit Type */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-outfit">
            Essential Documents & Preparation for {visitLabel}
          </h3>

          <div className="space-y-2">
            {docs.map((docItem, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">{docItem}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department-Specific Preparation Instructions Stored in MongoDB */}
        {instructions.length > 0 ? (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider font-outfit">
              {deptName} Department Specific Instructions
            </h3>

            <div className="space-y-2">
              {instructions.map((instruction, idx) => (
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

        {/* Healthcare Helpline Disclosure */}
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
