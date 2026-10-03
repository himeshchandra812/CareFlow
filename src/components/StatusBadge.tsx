import React from 'react';
import { AppointmentStatus, DoctorStatusType } from '../types/index.js';

interface StatusBadgeProps {
  status: AppointmentStatus | DoctorStatusType | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = ''
}) => {
  const s = status.toLowerCase();

  let text = '';
  let glyph = '';
  let badgeStyle = '';

  if (s === 'confirmed') {
    glyph = '✓';
    text = 'Confirmed';
    badgeStyle = 'bg-teal-100 text-teal-800 border-teal-200';
  } else if (s === 'arrived') {
    glyph = '✓';
    text = 'Arrived';
    badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (s === 'waiting') {
    glyph = '●';
    text = 'Waiting';
    badgeStyle = 'bg-amber-100 text-amber-900 border-amber-200';
  } else if (s === 'in_progress' || s === 'consulting') {
    glyph = '●';
    text = s === 'consulting' ? 'Consulting' : 'In Progress';
    badgeStyle = 'bg-teal-100 text-teal-900 border-teal-300 font-bold';
  } else if (s === 'completed') {
    glyph = '✓';
    text = 'Completed';
    badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (s === 'cancelled') {
    glyph = '✕';
    text = 'Cancelled';
    badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200';
  } else if (s === 'delayed') {
    glyph = '!';
    text = 'Delayed';
    badgeStyle = 'bg-orange-100 text-orange-900 border-orange-300 font-bold';
  } else if (s === 'on break') {
    glyph = '⏸';
    text = 'On Break';
    badgeStyle = 'bg-amber-100 text-amber-900 border-amber-200';
  } else if (s === 'available') {
    glyph = '✓';
    text = 'Available';
    badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (s === 'rescheduled') {
    glyph = '⟳';
    text = 'Rescheduled';
    badgeStyle = 'bg-sky-100 text-sky-800 border-sky-200';
  } else {
    glyph = '•';
    text = status;
    badgeStyle = 'bg-slate-100 text-slate-800 border-slate-200';
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5'
      : size === 'lg'
      ? 'text-sm px-3.5 py-1.5 font-bold'
      : 'text-xs px-2.5 py-1 font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${sizeClasses} ${badgeStyle} ${className}`}
      role="status"
    >
      <span aria-hidden="true" className="font-extrabold">{glyph}</span>
      <span>{text}</span>
    </span>
  );
};
