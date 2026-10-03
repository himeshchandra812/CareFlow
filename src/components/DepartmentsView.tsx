import React from 'react';
import { Department, Doctor, SupportedLanguage } from '../types/index.js';
import { ArrowRight, MapPin, Users, Stethoscope, FileText, CheckCircle2, Building } from 'lucide-react';
import { t } from '../services/i18n.js';

interface DepartmentsViewProps {
  departments: Department[];
  doctors: Doctor[];
  currentLang: SupportedLanguage;
  seniorMode?: boolean;
  onSelectDepartment: (deptId: string) => void;
  onViewPrep: (dept: Department) => void;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  departments,
  doctors,
  currentLang,
  seniorMode = false,
  onSelectDepartment,
  onViewPrep
}) => {
  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${seniorMode ? 'senior-mode-discovery' : ''}`}>
      <div>
        <h2
          className={`font-extrabold text-slate-900 font-outfit ${
            seniorMode ? 'text-3xl' : 'text-2xl sm:text-3xl'
          }`}
        >
          Hospital Departments
        </h2>
        <p className={`text-slate-600 ${seniorMode ? 'text-base font-semibold' : 'text-xs sm:text-sm'}`}>
          CareFlow Multispeciality Hospital • Explore specialized clinical departments, facilities, and consultants
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => {
          const deptDoctors = doctors.filter((d) => d.departmentId === dept._id);
          const hasPrep = dept.preparationInstructions && dept.preparationInstructions.length > 0;

          return (
            <div
              key={dept._id}
              className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 ${
                seniorMode ? 'border-2 border-slate-300' : ''
              }`}
            >
              <div className="space-y-4">
                
                {/* Department Name & Doctor Count */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3
                      className={`font-extrabold text-slate-900 font-outfit ${
                        seniorMode ? 'text-2xl' : 'text-xl'
                      }`}
                    >
                      {dept.name}
                    </h3>
                    <p className="text-xs font-bold text-teal-800 flex items-center gap-1.5 pt-1">
                      <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{dept.block} • {dept.floor} ({dept.location})</span>
                    </p>
                  </div>

                  <span className="bg-teal-50 text-teal-900 text-xs font-extrabold px-3 py-1.5 rounded-xl border border-teal-200 shrink-0">
                    {deptDoctors.length} {deptDoctors.length === 1 ? 'Doctor' : 'Doctors'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {dept.description}
                </p>

                {/* Available Doctors List Summary */}
                {deptDoctors.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Consultant Specialists:
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {deptDoctors.map((d) => (
                        <span
                          key={d._id}
                          className="bg-slate-50 text-slate-800 font-bold px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1"
                        >
                          <Stethoscope className="w-3 h-3 text-teal-600" />
                          <span>{d.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Clinical Services */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Clinical Services:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-xs text-slate-700 font-medium">
                    {dept.services.map((svc, i) => (
                      <span key={i} className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preparation Guide Indicator */}
                {hasPrep && (
                  <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-200/80 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-teal-900 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>{dept.preparationInstructions.length} Preparation Guidelines Stored</span>
                    </div>
                    <button
                      onClick={() => onViewPrep(dept)}
                      className="text-xs font-bold text-teal-800 hover:underline cursor-pointer shrink-0"
                    >
                      View Prep
                    </button>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onViewPrep(dept)}
                  className="px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Preparation</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDepartment(dept._id)}
                  className="uiverse-btn-primary px-3 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-center flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] shadow-xs"
                >
                  <span>View Doctors</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
