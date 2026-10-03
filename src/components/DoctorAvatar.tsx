import React, { useState } from 'react';
import { Doctor } from '../types/index.js';
import {
  getDoctorImageUrl,
  getDoctorInitials,
  getDoctorAvatarColorClass
} from '../utils/doctorImages.js';

interface DoctorAvatarProps {
  doctor: Pick<Doctor, '_id' | 'name' | 'specialization' | 'profileImage'>;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
}

export const DoctorAvatar: React.FC<DoctorAvatarProps> = ({
  doctor,
  className = '',
  size = 'md'
}) => {
  const [hasError, setHasError] = useState(false);

  const imageUrl = getDoctorImageUrl(doctor);
  const initials = getDoctorInitials(doctor.name);
  const colorClass = getDoctorAvatarColorClass(doctor._id);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs rounded-xl',
    md: 'w-16 h-16 sm:w-18 sm:h-18 text-base sm:text-lg rounded-2xl',
    lg: 'w-20 h-20 sm:w-24 sm:h-24 text-xl sm:text-2xl rounded-2xl',
    xl: 'w-24 h-24 sm:w-28 sm:h-28 text-2xl sm:text-3xl rounded-3xl',
    custom: ''
  };

  const altText = `${doctor.name}, ${doctor.specialization || 'Doctor'}`;

  if (!imageUrl || hasError) {
    return (
      <div
        className={`flex items-center justify-center font-bold tracking-wider select-none shrink-0 border-2 border-slate-200 shadow-xs ${
          size !== 'custom' ? sizeClasses[size] : ''
        } ${colorClass} ${className}`}
        aria-label={altText}
        role="img"
      >
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={altText}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover bg-slate-100 border-2 border-slate-200 shrink-0 ${
        size !== 'custom' ? sizeClasses[size] : ''
      } ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
