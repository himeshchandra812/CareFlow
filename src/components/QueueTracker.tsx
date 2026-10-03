import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Stethoscope,
  ArrowRight,
  Loader2,
  MapPin,
  Calendar,
  Volume2,
  Building,
  BellRing
} from 'lucide-react';
import { QueueState, SupportedLanguage, Appointment } from '../types/index.js';
import { StatusBadge } from './StatusBadge.js';
import { api } from '../services/api.js';

interface QueueTrackerProps {
  activeAppointment: Appointment | null;
  currentLang: SupportedLanguage;
  seniorMode?: boolean;
  onNavigateMap: (deptId?: string) => void;
  onAppointmentUpdate?: () => void;
}

export type PatientQueueStatus =
  | 'Not arrived'
  | 'Waiting'
  | 'Called'
  | 'In consultation'
  | 'Completed';

export const QueueTracker: React.FC<QueueTrackerProps> = ({
  activeAppointment,
  currentLang,
  seniorMode = false,
  onNavigateMap,
  onAppointmentUpdate
}) => {
  const [queue, setQueue] = useState<QueueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingArrival, setMarkingArrival] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Track acknowledged notification state to avoid repeating identical alerts
  const lastAlertStateRef = useRef<string | null>(null);
  const [activeAlertMessage, setActiveAlertMessage] = useState<string | null>(null);

  const fetchQueueData = useCallback(async (isInitial = false) => {
    if (!activeAppointment) {
      setLoading(false);
      return;
    }

    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      const q = await api.getQueueByAppointmentId(activeAppointment._id);
      setQueue(q);
      setError(null);
      setLastUpdatedTime(new Date());
      setSecondsAgo(0);

      // Evaluate important notification states
      if (q) {
        const patientsAhead = q.patientsAhead ?? 0;
        const curNum = q.currentToken.trim().toUpperCase();
        const patNum = (q.patientToken || activeAppointment.tokenNumber).trim().toUpperCase();
        const isCalled = curNum === patNum || patientsAhead === 0;

        let alertKey: string | null = null;
        let alertText: string | null = null;

        if (isCalled) {
          alertKey = 'called';
          alertText = 'Your token has been called. Please proceed to the consultation area.';
        } else if (patientsAhead === 1) {
          alertKey = '1_ahead';
          alertText = "You're next. Please be ready.";
        } else if (patientsAhead === 3) {
          alertKey = '3_ahead';
          alertText = "You're getting close. Please be ready.";
        }

        if (alertKey && alertKey !== lastAlertStateRef.current) {
          lastAlertStateRef.current = alertKey;
          setActiveAlertMessage(alertText);
        } else if (!alertKey) {
          lastAlertStateRef.current = null;
          setActiveAlertMessage(null);
        }
      }
    } catch (err: any) {
      console.warn('Queue data load warning:', err);
      // If we don't already have queue data, mark error as unavailable
      if (!queue) {
        setError('Queue information is temporarily unavailable.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeAppointment, queue]);

  // Initial fetch and 20-second automatic polling
  useEffect(() => {
    fetchQueueData(true);

    const pollInterval = setInterval(() => {
      fetchQueueData(false);
    }, 20000); // 20s lightweight polling

    const timerInterval = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [activeAppointment?._id]);

  const [arrivalError, setArrivalError] = useState<string | null>(null);

  const handleArrival = async () => {
    if (!activeAppointment) return;
    setMarkingArrival(true);
    setArrivalError(null);
    try {
      const res = await api.markPatientArrived(activeAppointment._id);
      setQueue(res.queue);
      setLastUpdatedTime(new Date());
      setSecondsAgo(0);
      onAppointmentUpdate?.();
    } catch (e: any) {
      console.error('Failed to mark patient arrival:', e);
      setArrivalError('Unable to update your arrival status. Please try again.');
    } finally {
      setMarkingArrival(false);
    }
  };

  // If no active appointment exists
  if (!activeAppointment) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
        <Clock className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900 font-outfit">No Active Queue Session</h3>
        <p className="text-sm text-slate-600">
          Book an appointment first to receive your live queue token and real-time wait estimation.
        </p>
      </div>
    );
  }

  // If queue information is completely unavailable and cannot be loaded
  if (loading && !queue) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 font-outfit">Loading live queue status...</h3>
        <p className="text-xs text-slate-500">Connecting to CareFlow hospital dispensary system</p>
      </div>
    );
  }

  if (error && !queue) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-900 font-outfit">
          Queue information is temporarily unavailable.
        </h3>
        <p className="text-xs text-slate-600">
          We could not load real-time queue details for Appointment #{activeAppointment._id.slice(-8)}.
        </p>
        <button
          onClick={() => fetchQueueData(true)}
          className="uiverse-btn-primary px-6 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm min-h-[44px]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const isArrived =
    activeAppointment.status === 'arrived' ||
    activeAppointment.status === 'waiting' ||
    queue?.isPatientArrived;

  // Derive Patient Queue Status
  let patientQueueStatus: PatientQueueStatus = 'Not arrived';
  if (activeAppointment.status === 'completed') {
    patientQueueStatus = 'Completed';
  } else if (activeAppointment.status === 'in_progress') {
    patientQueueStatus = 'In consultation';
  } else if (!isArrived) {
    patientQueueStatus = 'Not arrived';
  } else if (
    (queue?.patientsAhead ?? 8) <= 0 ||
    queue?.currentToken === (queue?.patientToken || activeAppointment.tokenNumber)
  ) {
    patientQueueStatus = 'Called';
  } else {
    patientQueueStatus = 'Waiting';
  }

  // Doctor status
  const doctorStatus = queue?.doctorStatus || 'Consulting';
  const doctorStatusColor =
    doctorStatus === 'Available'
      ? 'bg-emerald-500'
      : doctorStatus === 'On Break'
      ? 'bg-amber-500'
      : doctorStatus === 'Delayed'
      ? 'bg-orange-500'
      : 'bg-teal-600';

  // Waiting time calculation
  const patientsAhead = queue?.patientsAhead ?? 0;
  const avgMins = queue?.averageConsultationMinutes || 3;
  const estimatedWait = queue?.estimatedWaitTime ?? patientsAhead * avgMins;

  // Visual queue progress
  const curNum = parseInt((queue?.currentToken || '119').replace(/[^0-9]/g, '')) || 119;
  const patNum =
    parseInt((queue?.patientToken || activeAppointment.tokenNumber || '127').replace(/[^0-9]/g, '')) || 127;
  const diff = Math.max(0, patNum - curNum);
  const totalInQueue = diff + 10;
  const progressPercent = Math.min(100, Math.max(10, ((totalInQueue - diff) / totalInQueue) * 100));

  return (
    <div className={`max-w-4xl mx-auto space-y-6 py-2 ${seniorMode ? 'senior-queue' : ''}`}>
      
      {/* Header & Live Polling Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit">
            Live Queue Tracker
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            CareFlow Hospital • {activeAppointment.departmentName} Department
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            {secondsAgo < 5
              ? 'Last updated just now'
              : lastUpdatedTime
              ? `Last updated ${lastUpdatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : `${secondsAgo}s ago`}
          </span>

          <button
            onClick={() => fetchQueueData(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl transition-colors cursor-pointer min-h-[44px] shadow-2xs"
            aria-label="Refresh queue information"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          {isArrived && (
            <button
              onClick={async () => {
                setRefreshing(true);
                try {
                  const updatedQueue = await api.advanceQueue(activeAppointment._id);
                  setQueue(updatedQueue);
                  setLastUpdatedTime(new Date());
                  setSecondsAgo(0);
                  onAppointmentUpdate?.();
                } catch (err) {
                  console.warn('Simulation error:', err);
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl transition-colors cursor-pointer min-h-[44px] shadow-2xs"
              title="Simulate the doctor calling the next patient token"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Simulate Call Next</span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Queue Notification Banner */}
      {activeAlertMessage && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-300 ${
            patientQueueStatus === 'Called'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-amber-500 text-white border-amber-300'
          }`}
          role="alert"
        >
          <BellRing className="w-6 h-6 shrink-0 animate-bounce" />
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider block opacity-90">
              Queue Status Alert
            </span>
            <span className="text-sm sm:text-base font-extrabold font-outfit">
              {activeAlertMessage}
            </span>
          </div>
        </div>
      )}

      {/* Patient Arrival Action Banner */}
      {!isArrived ? (
        <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-base font-extrabold font-outfit">
              Have you arrived at CareFlow Hospital?
            </div>
            <p className="text-xs text-amber-100">
              Check in now to alert hospital staff and activate your live waiting token.
            </p>
            {arrivalError && (
              <p className="text-xs text-rose-100 font-bold pt-1">
                {arrivalError}
              </p>
            )}
          </div>
          <button
            onClick={handleArrival}
            disabled={markingArrival}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
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
        <div className="p-4 bg-emerald-50 text-emerald-950 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-sm font-bold text-emerald-950 font-outfit block">
                ✓ Arrived at Hospital
              </span>
              <span className="text-xs text-emerald-800">
                You have checked in for your appointment.
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full w-fit">
            Token {activeAppointment.tokenNumber} Active in Queue
          </span>
        </div>
      )}

      {/* Main Queue Card Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        
        {/* Prominent Patient Queue State Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Patient Queue State
            </span>
            <div className="flex items-center gap-2 pt-1">
              <span
                className={`w-3 h-3 rounded-full ${
                  patientQueueStatus === 'Called' || patientQueueStatus === 'In consultation'
                    ? 'bg-emerald-500 animate-ping'
                    : patientQueueStatus === 'Waiting'
                    ? 'bg-teal-500'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-outfit">
                {patientQueueStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Doctor:</span>
            <StatusBadge status={doctorStatus} size="md" />
          </div>
        </div>

        {/* 5 Core Metrics Dashboard: Mobile Vertical Stack / Desktop Balanced Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-center">
          
          {/* 1. YOUR TOKEN */}
          <div className="p-4 bg-teal-50 rounded-2xl border-2 border-teal-600/60 shadow-xs flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs font-bold text-teal-800 uppercase tracking-wider block">
              YOUR TOKEN
            </span>
            <span
              className={`font-extrabold text-teal-950 font-outfit block py-1 ${
                seniorMode ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {queue?.patientToken || activeAppointment.tokenNumber}
            </span>
            <span className="text-[10px] text-teal-700 font-medium">Assigned to you</span>
          </div>

          {/* 2. CURRENT TOKEN */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xs flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
              CURRENT TOKEN
            </span>
            <span
              className={`font-extrabold text-teal-400 font-outfit block py-1 ${
                seniorMode ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {queue?.currentToken || 'A-119'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Now serving in room</span>
          </div>

          {/* 3. PATIENTS AHEAD */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs font-bold text-amber-900 uppercase tracking-wider block">
              PATIENTS AHEAD
            </span>
            <span
              className={`font-extrabold text-amber-950 font-outfit block py-1 ${
                seniorMode ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
              }`}
            >
              {patientsAhead}
            </span>
            <span className="text-[10px] text-amber-800 font-medium">Before your turn</span>
          </div>

          {/* 4. ESTIMATED WAIT */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-center">
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider block">
              ESTIMATED WAIT
            </span>
            <span
              className={`font-extrabold text-slate-900 font-outfit block py-1 ${
                seniorMode ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
              }`}
            >
              ~{estimatedWait} min
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              ~{avgMins} min per patient
            </span>
          </div>
        </div>

        {/* Visual Queue Line */}
        <div className="space-y-2.5 pt-2">
          <div className="flex justify-between items-center text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping" />
              <span>Current: Token {queue?.currentToken || 'A-119'}</span>
            </span>
            <span>Your Turn: Token {queue?.patientToken || activeAppointment.tokenNumber}</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 border border-slate-200 overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 text-center italic">
            Estimated wait time is calculated from current clinic consultation flow and is not guaranteed.
          </p>
        </div>

        {/* Doctor Status Banner */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full ${doctorStatusColor} animate-pulse shrink-0`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Doctor Status:
                </span>
                <StatusBadge status={doctorStatus} size="sm" />
              </div>
              <div className="text-sm font-bold text-slate-900 pt-0.5">
                {queue?.doctorStatusMessage || `${activeAppointment.doctorName} is consulting`}
              </div>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Avg ~{avgMins} mins/patient
          </span>
        </div>

        {/* Supporting Appointment & Hospital Navigation Card on Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs text-slate-700">
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block text-sm">
              {activeAppointment.doctorName}
            </span>
            <p className="text-teal-800 font-semibold">
              {activeAppointment.departmentName} Department
            </p>
            <p className="text-slate-500">
              CareFlow Multispeciality Hospital
            </p>
          </div>

          <div className="flex flex-col sm:items-end justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>
                {activeAppointment.locationDetails.block} • {activeAppointment.locationDetails.floor} ({activeAppointment.locationDetails.room})
              </span>
            </div>

            <button
              onClick={() => onNavigateMap(activeAppointment.departmentId)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
            >
              <span>Get Indoor Directions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
