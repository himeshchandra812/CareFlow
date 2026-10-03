import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  Clock,
  Globe,
  ArrowRight,
  Stethoscope,
  Building,
  RotateCcw,
  Sparkles,
  Calendar,
  DollarSign,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { Doctor, Department, SupportedLanguage } from '../types/index.js';
import { ResponsiveGrid } from './layout/ResponsiveGrid.js';
import { t } from '../services/i18n.js';
import { DoctorAvatar } from './DoctorAvatar.js';
import { validateDoctorImageUniqueness } from '../utils/doctorImages.js';

interface FindDoctorProps {
  doctors: Doctor[];
  departments: Department[];
  currentLang: SupportedLanguage;
  seniorMode?: boolean;
  initialSearch?: string;
  initialDepartmentId?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSelectDoctor: (doctor: Doctor) => void;
  onBookDoctor: (doctor: Doctor) => void;
}

// Synonyms map to empower natural search (e.g. "heart" -> Cardiology)
const SPECIALTY_SYNONYMS: Record<string, string[]> = {
  cardiology: ['heart', 'cardio', 'cardiac', 'cardiologist', 'chest pain', 'bp', 'blood pressure', 'hypertension', 'ecg'],
  orthopedics: ['bone', 'joint', 'fracture', 'knee', 'spine', 'orthopedic', 'ortho', 'back pain', 'arthritis'],
  neurology: ['brain', 'nerve', 'neuro', 'neurologist', 'migraine', 'headache', 'seizure', 'stroke', 'epilepsy', 'memory'],
  'general medicine': ['general', 'physician', 'medicine', 'fever', 'cold', 'cough', 'flu', 'diabetes', 'infection', 'sugar'],
  pediatrics: ['child', 'children', 'baby', 'pediatric', 'pediatrician', 'kid', 'infant', 'vaccination', 'growth'],
  dermatology: ['skin', 'derma', 'dermatologist', 'hair', 'acne', 'rash', 'allergy', 'eczema', 'laser', 'cosmetic'],
  ophthalmology: ['eye', 'vision', 'ophthalmologist', 'cataract', 'glasses', 'glaucoma', 'retina', 'spectacles'],
  ent: ['ear', 'nose', 'throat', 'ent', 'sinus', 'hearing', 'vertigo', 'tonsil', 'voice']
};

export const FindDoctor: React.FC<FindDoctorProps> = ({
  doctors,
  departments,
  currentLang,
  seniorMode = false,
  initialSearch = '',
  initialDepartmentId = 'all',
  isLoading = false,
  isError = false,
  onRetry,
  onSelectDoctor,
  onBookDoctor
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedDept, setSelectedDept] = useState(initialDepartmentId);
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'today'>('all');
  const [feeFilter, setFeeFilter] = useState<'all' | 'under_700' | '700_800' | 'above_800'>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept('all');
    setSelectedLang('all');
    setSelectedHospital('all');
    setAvailabilityFilter('all');
    setFeeFilter('all');
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedDept !== 'all' ||
    selectedLang !== 'all' ||
    selectedHospital !== 'all' ||
    availabilityFilter !== 'all' ||
    feeFilter !== 'all';

  // Validation of doctor image uniqueness
  React.useEffect(() => {
    if (doctors && doctors.length > 0) {
      validateDoctorImageUniqueness(doctors);
    }
  }, [doctors]);

  // Smart Search & Multi-criteria Filtering
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // 1. Department Filter
      if (selectedDept !== 'all' && doc.departmentId !== selectedDept) {
        return false;
      }

      // 2. Language Filter
      if (
        selectedLang !== 'all' &&
        !doc.languages.some((l) => l.toLowerCase() === selectedLang.toLowerCase())
      ) {
        return false;
      }

      // 3. Hospital Filter
      if (
        selectedHospital !== 'all' &&
        doc.hospitalId !== selectedHospital &&
        !selectedHospital.includes(doc.hospitalId)
      ) {
        return false;
      }

      // 4. Availability Filter
      if (availabilityFilter === 'today' && !doc.isAvailableToday) {
        return false;
      }

      // 5. Fee Filter
      if (feeFilter === 'under_700' && doc.consultationFee >= 700) {
        return false;
      }
      if (
        feeFilter === '700_800' &&
        (doc.consultationFee < 700 || doc.consultationFee > 800)
      ) {
        return false;
      }
      if (feeFilter === 'above_800' && doc.consultationFee <= 800) {
        return false;
      }

      // 6. Smart Natural Search Term Matching
      if (searchTerm.trim()) {
        const rawQ = searchTerm.toLowerCase().trim();
        // Remove common prefixes like "dr.", "dr ", "doctor "
        const cleanedQ = rawQ.replace(/^(dr\.?|doctor)\s+/i, '');

        // Direct field matches
        const matchName = doc.name.toLowerCase().includes(rawQ) || doc.name.toLowerCase().includes(cleanedQ);
        const matchSpec = doc.specialization.toLowerCase().includes(rawQ) || doc.specialization.toLowerCase().includes(cleanedQ);
        const matchDept = doc.departmentName.toLowerCase().includes(rawQ);
        const matchHospital = 'careflow multispeciality hospital'.includes(rawQ) || 'careflow'.includes(rawQ);
        const matchLang = doc.languages.some((l) =>
          rawQ.includes(l.toLowerCase()) || l.toLowerCase().includes(rawQ)
        );

        // Medical synonyms check (e.g. "heart" -> Cardiology)
        const matchSynonyms = Object.entries(SPECIALTY_SYNONYMS).some(([deptKey, keywords]) => {
          const deptMatch = doc.departmentName.toLowerCase().includes(deptKey);
          if (!deptMatch) return false;
          return keywords.some((kw) => rawQ.includes(kw));
        });

        if (!matchName && !matchSpec && !matchDept && !matchHospital && !matchLang && !matchSynonyms) {
          return false;
        }
      }

      return true;
    });
  }, [
    doctors,
    selectedDept,
    selectedLang,
    selectedHospital,
    availabilityFilter,
    feeFilter,
    searchTerm
  ]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-full border-4 border-teal-600 border-t-transparent animate-spin mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 font-outfit">Finding doctors...</h3>
        <p className="text-xs text-slate-500">Searching active specialists and consultation slots at CareFlow...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Stethoscope className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 font-outfit">We couldn't load doctors right now. Please try again.</h3>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 w-full ${seniorMode ? 'senior-mode-discovery' : ''}`}>
      
      {/* Title & Smart Search Header */}
      <div className="space-y-4">
        <div>
          <h2
            className={`font-extrabold text-slate-900 font-outfit ${
              seniorMode ? 'text-3xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {t('findDoctor', currentLang)}
          </h2>
          <p className={`text-slate-600 ${seniorMode ? 'text-base font-semibold' : 'text-xs sm:text-sm'}`}>
            CareFlow Multispeciality Hospital • Search by doctor, specialty, department, or language
          </p>
        </div>

        {/* Smart Search Bar with Clear Icon */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by doctor, specialty (e.g. Heart, Skin), language, or department..."
              className={`w-full pl-11 pr-10 bg-white text-slate-900 border border-slate-300 rounded-2xl focus:outline-hidden focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 shadow-xs ${
                seniorMode ? 'py-4 text-base font-bold' : 'py-3 text-xs sm:text-sm'
              }`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 shadow-xs cursor-pointer"
          >
            <Filter className="w-4 h-4 text-teal-700" />
            <span>Filters {hasActiveFilters && '• Active'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Desktop Grid / Mobile Drawer */}
      <div
        className={`${
          showMobileFilters ? 'block' : 'hidden sm:block'
        } bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-outfit">
              Filter Doctors
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Language
            </label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Telugu">Telugu</option>
              <option value="Tamil">Tamil</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Marathi">Marathi</option>
              <option value="Bengali">Bengali</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Availability
            </label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">All Schedules</option>
              <option value="today">Available Today</option>
            </select>
          </div>

          {/* Consultation Fee Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Consultation Fee
            </label>
            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">Any Fee</option>
              <option value="under_700">Under ₹700</option>
              <option value="700_800">₹700 – ₹800</option>
              <option value="above_800">Above ₹800</option>
            </select>
          </div>

        </div>
      </div>

      {/* Horizontally Scrollable Department Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedDept('all')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
            selectedDept === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          All ({doctors.length})
        </button>
        {departments.map((dept) => {
          const count = doctors.filter((d) => d.departmentId === dept._id).length;
          return (
            <button
              key={dept._id}
              onClick={() => setSelectedDept(dept._id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedDept === dept._id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {dept.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>
          Showing <strong>{filteredDoctors.length}</strong> of <strong>{doctors.length}</strong> doctors
        </span>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-teal-700 hover:underline font-bold cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Adaptive Responsive Doctor Grid */}
      {filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc._id}
              className={`bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                seniorMode ? 'border-2 border-slate-300' : ''
              }`}
            >
              <div className="space-y-3.5">
                
                {/* Doctor Avatar & Titles */}
                <div className="flex items-start gap-4">
                  <DoctorAvatar
                    doctor={doc}
                    size="md"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3
                      className={`font-extrabold text-slate-900 font-outfit truncate ${
                        seniorMode ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                      }`}
                    >
                      {doc.name}
                    </h3>
                    <p className="text-xs font-bold text-teal-800 truncate">
                      {doc.specialization}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {doc.departmentName} • {doc.qualification}
                    </p>
                  </div>
                </div>

                {/* Hospital Badge & Rating */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-600 font-medium flex items-center gap-1 truncate max-w-[170px]">
                    <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">CareFlow Hospital</span>
                  </span>

                  <span className="flex items-center text-amber-600 font-bold gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{doc.rating}</span>
                    <span className="text-slate-400 font-normal">({doc.experience}y exp)</span>
                  </span>
                </div>

                {/* Languages List */}
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-medium">{doc.languages.join(' • ')}</span>
                </div>

                {/* Fee & Next Slot Availability */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-slate-500 font-medium">Consultation Fee:</span>
                    <span className="font-extrabold text-slate-900 text-sm font-outfit">
                      ₹{doc.consultationFee}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 bg-teal-50/80 p-2.5 rounded-xl border border-teal-100">
                    <span className="text-teal-900 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-700" /> Next available:
                    </span>
                    <span className="font-extrabold text-teal-950">{doc.nextAvailableSlot}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectDoctor(doc)}
                  className={`px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer min-h-[44px] flex items-center justify-center ${
                    seniorMode ? 'text-sm' : ''
                  }`}
                >
                  View Doctor
                </button>

                <button
                  type="button"
                  onClick={() => onBookDoctor(doc)}
                  className={`uiverse-btn-primary px-3 py-2.5 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1 cursor-pointer min-h-[44px] shadow-xs ${
                    seniorMode ? 'text-sm' : ''
                  }`}
                >
                  <span>Book Appointment</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 max-w-md mx-auto my-6 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 font-outfit">No doctors found.</h3>
            <p className="text-xs text-slate-500">
              No medical specialists matched your current search filters. Try adjusting your query or resetting filters.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      )}

    </div>
  );
};
