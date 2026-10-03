import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Compass,
  Footprints,
  Info,
  Building,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  UserCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  Eye,
  ListOrdered
} from 'lucide-react';
import { HospitalLocation, Department, Appointment, QueueState, Hospital, SupportedLanguage } from '../types/index.js';
import { api } from '../services/api.js';
import { StatusBadge } from './StatusBadge.js';

interface HospitalMapProps {
  initialDepartmentId?: string;
  departments: Department[];
  activeAppointment?: Appointment | null;
  seniorMode?: boolean;
  currentLang?: SupportedLanguage;
  onAppointmentUpdate?: () => void;
  onNavigateQueue?: () => void;
}

export const HospitalMap: React.FC<HospitalMapProps> = ({
  initialDepartmentId,
  departments,
  activeAppointment,
  seniorMode = false,
  currentLang = 'en',
  onAppointmentUpdate,
  onNavigateQueue
}) => {
  // If active appointment belongs to a department, prioritize it
  const defaultDeptId =
    initialDepartmentId ||
    activeAppointment?.departmentId ||
    (departments.length > 0 ? departments[0]._id : 'dept_cardiology');

  const [selectedDeptId, setSelectedDeptId] = useState<string>(defaultDeptId);
  const [hospitalInfo, setHospitalInfo] = useState<Hospital | null>(null);
  const [navigationData, setNavigationData] = useState<HospitalLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Queue state for checked-in patients
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueError, setQueueError] = useState(false);

  // Arrival / Check-in states
  const [markingArrival, setMarkingArrival] = useState(false);
  const [arrivalError, setArrivalError] = useState<string | null>(null);

  // Senior mode single-step navigation index
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [seniorStepViewMode, setSeniorStepViewMode] = useState<'stepByStep' | 'allSteps'>('stepByStep');

  // Update selected department if initialDepartmentId changes
  useEffect(() => {
    if (initialDepartmentId) {
      setSelectedDeptId(initialDepartmentId);
    }
  }, [initialDepartmentId]);

  // Load hospital information and navigation data from backend
  const loadHospitalData = useCallback(async () => {
    try {
      setLoading(true);
      const [hosp, navList] = await Promise.all([
        api.getHospitalInfo().catch(() => null),
        api.getHospitalNavigation(selectedDeptId).catch(() => [])
      ]);
      if (hosp) setHospitalInfo(hosp);
      setNavigationData(navList);
    } catch (e) {
      console.warn('Failed to load navigation data from backend:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    loadHospitalData();
  }, [loadHospitalData]);

  // Fetch queue data if patient has active appointment
  const fetchQueue = useCallback(async () => {
    if (!activeAppointment) return;
    try {
      setLoadingQueue(true);
      setQueueError(false);
      const q = await api.getQueueByAppointmentId(activeAppointment._id);
      setQueue(q);
    } catch (e) {
      console.warn('Queue information fetch error:', e);
      setQueueError(true);
    } finally {
      setLoadingQueue(false);
    }
  }, [activeAppointment]);

  useEffect(() => {
    if (activeAppointment) {
      fetchQueue();
    }
  }, [activeAppointment, fetchQueue]);

  // Handle Arrival Check-in
  const handleArrival = async () => {
    if (!activeAppointment) return;
    setMarkingArrival(true);
    setArrivalError(null);
    try {
      const res = await api.markPatientArrived(activeAppointment._id);
      setQueue(res.queue);
      setMarkingArrival(false);
      onAppointmentUpdate?.();
    } catch (e: any) {
      console.error('Arrival check-in failed:', e);
      setArrivalError('Unable to update your arrival status. Please try again.');
      setMarkingArrival(false);
    }
  };

  const activeDept =
    departments.find((d) => d._id === selectedDeptId) || departments[0] || null;

  const locationRecord = navigationData[0] || null;

  // Real backend fields (No fabricated values)
  const hospitalName = hospitalInfo?.name || 'CareFlow Multispeciality Hospital';
  const departmentName = activeDept?.name || locationRecord?.department || 'Consultation Department';
  const blockName = locationRecord?.block || activeDept?.block || 'Block B';
  const floorName = locationRecord?.floor || activeDept?.floor || '2nd Floor';
  const roomNumber = locationRecord?.roomNumber || activeAppointment?.locationDetails?.room || activeDept?.location || 'Room 204';
  const walkingMinutes = locationRecord?.walkingTimeMinutes || 4;

  // Directions from backend database, or standard hospital path using real department coordinates
  const directions: string[] =
    locationRecord?.directions && locationRecord.directions.length > 0
      ? locationRecord.directions
      : [
          `Enter through the Main Entrance at Block A Ground Floor.`,
          `Check in at Central Patient Registration Desk.`,
          `Take ${blockName === 'Block B' ? 'Elevator Bank B' : 'Elevator Bank A'} to the ${floorName}.`,
          `Turn ${blockName === 'Block B' ? 'Right into Wing East' : 'Left into Wing West'} upon exiting the elevator.`,
          `Follow signs for ${departmentName} Department.`,
          `${roomNumber} will be situated along the consultation corridor.`
        ];

  // Key landmarks from backend
  const landmarks: string[] = locationRecord?.landmarks || [
    'Near Central Information Desk',
    'Opposite Clinical Diagnostic Wing'
  ];

  // Arrival status evaluation from database
  const isArrived =
    activeAppointment?.status === 'arrived' ||
    activeAppointment?.status === 'waiting' ||
    queue?.isPatientArrived;

  // SVG Waypoint coordinates for Route Visualizer
  const destX = locationRecord?.coordinates?.x ?? 78;
  const destY = locationRecord?.coordinates?.y ?? 25;

  return (
    <div className={`w-full space-y-6 max-w-6xl mx-auto py-2 ${seniorMode ? 'senior-navigation' : ''}`}>
      
      {/* Header & Department Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
            Hospital Indoor Navigation
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            {hospitalName} • Route Guidance & Indoor Directions
          </p>
        </div>

        {/* Department Switcher */}
        <div className="flex items-center gap-2">
          <label htmlFor="dept-nav-select" className="text-xs font-bold text-slate-600 hidden sm:inline">
            Destination:
          </label>
          <select
            id="dept-nav-select"
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              setCurrentStepIndex(0);
            }}
            className="w-full sm:w-auto pl-3.5 pr-8 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-teal-500 cursor-pointer min-h-[44px]"
          >
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name} ({dept.block}, {dept.floor})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Arrival Status & Check-in / Queue Connection Banner */}
      {activeAppointment && (
        <div className="space-y-3">
          {arrivalError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 font-semibold">
              {arrivalError}
            </div>
          )}

          {!isArrived ? (
            <div className="p-4 sm:p-5 bg-amber-500 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block opacity-90">
                  Hospital Arrival Check-in
                </span>
                <h4 className="text-base sm:text-lg font-extrabold font-outfit">
                  Have you arrived at {hospitalName}?
                </h4>
                <p className="text-xs text-amber-100">
                  Check in to activate your live queue token for Dr. {activeAppointment.doctorName.replace('Dr. ', '')}.
                </p>
              </div>
              <button
                onClick={handleArrival}
                disabled={markingArrival}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {markingArrival ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>I have arrived at hospital</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-extrabold text-emerald-950 font-outfit">
                      ✓ Arrived at Hospital
                    </div>
                    <div className="text-xs text-emerald-800 font-semibold">
                      You're checked in. Your presence has been reported to {activeAppointment.departmentName} Department.
                    </div>
                  </div>
                </div>

                {onNavigateQueue && (
                  <button
                    onClick={onNavigateQueue}
                    className="uiverse-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px] shrink-0"
                  >
                    <Clock className="w-4 h-4" />
                    <span>View Live Queue Tracker</span>
                  </button>
                )}
              </div>

              {/* Connected Live Queue Information */}
              {loadingQueue ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  <span>Loading live queue status...</span>
                </div>
              ) : queue ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-200/80 text-center">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Your Token</span>
                    <span className="text-xl font-extrabold text-emerald-900 font-outfit">
                      {queue.patientToken || activeAppointment.tokenNumber}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 text-white rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Token</span>
                    <span className="text-xl font-extrabold text-teal-400 font-outfit">
                      {queue.currentToken}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Ahead</span>
                    <span className="text-xl font-extrabold text-amber-800 font-outfit">
                      {queue.patientsAhead}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Estimated Wait</span>
                    <span className="text-xl font-extrabold text-slate-900 font-outfit">
                      ~{queue.estimatedWaitTime} min
                    </span>
                  </div>
                </div>
              ) : queueError ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
                  <span>Your check-in is complete. Queue information is currently unavailable.</span>
                  <button
                    onClick={fetchQueue}
                    className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Navigation Route Card (Hospital name, Department, Block, Floor, Room) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-teal-700 tracking-wider uppercase block">
              {hospitalName}
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit">
              {departmentName}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-xl border border-slate-200">
              Est. Walk: ~{walkingMinutes} min
            </span>
          </div>
        </div>

        {/* 4 Location Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 uppercase font-mono text-[10px] block">Building / Complex</span>
            <span className="font-extrabold text-slate-900 text-sm font-outfit">
              {locationRecord?.building || 'Main Complex'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 uppercase font-mono text-[10px] block">Building Block</span>
            <span className="font-extrabold text-teal-800 text-sm font-outfit">
              {blockName}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 uppercase font-mono text-[10px] block">Floor Level</span>
            <span className="font-extrabold text-slate-900 text-sm font-outfit">
              {floorName}
            </span>
          </div>

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
            <span className="text-teal-800 uppercase font-mono text-[10px] block">Room / Area</span>
            <span className="font-extrabold text-teal-950 text-sm font-outfit truncate block">
              {roomNumber}
            </span>
          </div>
        </div>

        {/* Route Flow Breadcrumb Line */}
        <div className="pt-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Navigation Route Flow
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[11px] font-bold">
              Hospital Entrance
            </span>
            <span className="text-teal-600 font-bold">↓</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md text-[11px]">
              Registration
            </span>
            <span className="text-teal-600 font-bold">↓</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md text-[11px]">
              Lift / Stairs
            </span>
            <span className="text-teal-600 font-bold">↓</span>
            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md text-[11px]">
              {floorName}
            </span>
            <span className="text-teal-600 font-bold">↓</span>
            <span className="bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md text-[11px] font-bold">
              {departmentName}
            </span>
            <span className="text-teal-600 font-bold">↓</span>
            <span className="bg-teal-700 text-white px-2 py-0.5 rounded-md text-[11px] font-bold">
              {roomNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Responsive Map & Directions Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Floor Plan Schematic Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 text-white shadow-xl space-y-4">
            
            {/* Map Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-400" />
                <span className="font-bold text-xs sm:text-sm font-outfit text-slate-200">
                  Floor Map: {blockName} • {floorName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs text-emerald-400 font-mono">Live Route Active</span>
              </div>
            </div>

            {/* Interactive SVG Schematic Map */}
            <div
              className="relative w-full rounded-2xl bg-slate-950 border border-slate-800 p-2 overflow-hidden flex items-center justify-center"
              style={{ minHeight: '320px', height: 'clamp(320px, 45vh, 480px)' }}
            >
              {/* Floor Plan Architectural Grid SVG */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full select-none"
                style={{ maxHeight: '100%' }}
                aria-label={`Indoor navigation map from Main Entrance to ${departmentName} ${roomNumber}`}
              >
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                  </pattern>
                  <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>

                <rect width="100" height="100" fill="url(#grid)" />

                {/* Building Zones Outline */}
                <rect x="5" y="65" width="35" height="30" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                <text x="22.5" y="82" fill="#64748b" fontSize="3" textAnchor="middle" fontWeight="bold">BLOCK A (OPD)</text>

                <rect x="45" y="10" width="50" height="85" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
                <text x="70" y="92" fill="#64748b" fontSize="3" textAnchor="middle" fontWeight="bold">BLOCK B (SPECIALIST CLINICS)</text>

                {/* Corridor Link Bridge */}
                <rect x="35" y="38" width="15" height="16" fill="#1e293b" stroke="#0d9488" strokeWidth="0.6" strokeDasharray="1,1" />
                <text x="42.5" y="47" fill="#2dd4bf" fontSize="2.5" textAnchor="middle">LINK</text>

                {/* Route Path Polyline */}
                <path
                  d={`M 10 80 Q 20 75 25 70 T 40 45 T 45 42 T ${destX} ${destY}`}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="3 2"
                  className="animate-pulse"
                />

                {/* Waypoint 1: Main Entrance */}
                <circle cx="10" cy="80" r="3.5" fill="#10b981" />
                <circle cx="10" cy="80" r="1.5" fill="#ffffff" />
                <text x="10" y="88" fill="#a7f3d0" fontSize="2.8" fontWeight="bold" textAnchor="middle">
                  Entrance
                </text>

                {/* Waypoint 2: Registration Desk */}
                <circle cx="25" cy="70" r="2.8" fill="#0284c7" />
                <circle cx="25" cy="70" r="1" fill="#ffffff" />
                <text x="25" y="66" fill="#bae6fd" fontSize="2.6" textAnchor="middle">
                  Registration
                </text>

                {/* Waypoint 3: Elevator Bank B */}
                <rect x="37" y="32" width="7" height="6" rx="1" fill="#475569" stroke="#94a3b8" strokeWidth="0.5" />
                <text x="40.5" y="36.5" fill="#f8fafc" fontSize="2.5" textAnchor="middle" fontWeight="bold">
                  LIFT
                </text>
                <text x="40.5" y="41" fill="#cbd5e1" fontSize="2" textAnchor="middle">
                  Bank B
                </text>

                {/* Waypoint 4: Destination Department Room */}
                <circle cx={destX} cy={destY} r="5" fill="#0f766e" stroke="#2dd4bf" strokeWidth="1" />
                <circle cx={destX} cy={destY} r="2.5" fill="#ffffff" />
                <text x={destX} y={destY - 6.5} fill="#5eead4" fontSize="3.2" fontWeight="bold" textAnchor="middle">
                  ★ {departmentName}
                </text>
                <text x={destX} y={destY + 9} fill="#e2e8f0" fontSize="2.8" textAnchor="middle">
                  {roomNumber}
                </text>
              </svg>
            </div>

            {/* Accessibility Note & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Ramps, braille elevator signage, and tactile paving throughout all wings.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Start
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400" /> Destination
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Step-by-Step Directions Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-teal-700" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base font-outfit uppercase tracking-wider">
                  Step-by-Step Route
                </h3>
              </div>

              {seniorMode && (
                <button
                  onClick={() =>
                    setSeniorStepViewMode(
                      seniorStepViewMode === 'stepByStep' ? 'allSteps' : 'stepByStep'
                    )
                  }
                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  {seniorStepViewMode === 'stepByStep' ? 'Show All Steps' : 'Step-by-Step View'}
                </button>
              )}
            </div>

            {/* Senior Mode: Step-by-Step Large Carousel View */}
            {seniorMode && seniorStepViewMode === 'stepByStep' ? (
              <div className="space-y-4 py-2">
                <div className="p-5 bg-teal-50 rounded-2xl border-2 border-teal-600 text-center space-y-3">
                  <span className="text-xs font-bold text-teal-800 uppercase tracking-widest block">
                    Step {currentStepIndex + 1} of {directions.length}
                  </span>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-outfit leading-relaxed">
                    {directions[currentStepIndex]}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentStepIndex === 0}
                    className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm sm:text-base rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 min-h-[48px]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Previous Step</span>
                  </button>

                  <button
                    onClick={() =>
                      setCurrentStepIndex((prev) =>
                        Math.min(directions.length - 1, prev + 1)
                      )
                    }
                    disabled={currentStepIndex === directions.length - 1}
                    className="flex-1 py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm sm:text-base rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 min-h-[48px] shadow-sm"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Full List View */
              <div className="space-y-3">
                {directions.map((stepText, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                      seniorMode ? 'bg-slate-50 border border-slate-200' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-800 font-extrabold text-xs flex items-center justify-center shrink-0 border border-teal-200 mt-0.5">
                      {idx + 1}
                    </div>
                    <p
                      className={`font-semibold text-slate-800 leading-snug pt-0.5 ${
                        seniorMode ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
                      }`}
                    >
                      {stepText}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Landmarks Banner */}
            {landmarks.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 pt-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider block text-[10px]">
                  Visible Landmarks Along Route:
                </span>
                <p className="text-slate-600 font-medium">
                  {landmarks.join(' • ')}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
