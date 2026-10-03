import { Doctor } from '../types/index.js';

/**
 * Stable, unique image mapping per Doctor ID
 * Ensuring NO TWO DOCTORS USE THE SAME IMAGE.
 */
export const STABLE_DOCTOR_IMAGES: Record<string, string> = {
  doc_anil_sharma: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
  doc_priya_venkat: 'https://images.unsplash.com/photo-1594824813566-78a5e8a714e6?w=400&auto=format&fit=crop&q=80',
  doc_rajesh_reddy: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
  doc_sunita_rao: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
  doc_vikram_singh: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80',
  doc_meera_nair: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80',
  doc_kavita_deshmukh: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&auto=format&fit=crop&q=80',
  doc_sanjay_banerjee: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80',
  doc_arun_kumar: 'https://images.unsplash.com/photo-1637059824899-a441006a6875?w=400&auto=format&fit=crop&q=80'
};

const AVATAR_BG_PALETTE = [
  'bg-teal-700 text-white',
  'bg-sky-700 text-white',
  'bg-indigo-700 text-white',
  'bg-emerald-700 text-white',
  'bg-blue-800 text-white',
  'bg-cyan-800 text-white',
  'bg-teal-800 text-white',
  'bg-slate-700 text-white'
];

/**
 * Returns deterministic initials for a doctor name (e.g., "Dr. Priya Venkat" -> "PV")
 */
export function getDoctorInitials(name: string): string {
  if (!name) return 'DR';
  const clean = name.replace(/^Dr\.?\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns a stable color style for initials avatar based on doctor ID
 */
export function getDoctorAvatarColorClass(doctorId: string): string {
  let hash = 0;
  for (let i = 0; i < doctorId.length; i++) {
    hash = (hash << 5) - hash + doctorId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_BG_PALETTE.length;
  return AVATAR_BG_PALETTE[index];
}

/**
 * Get unique, professional image URL for any doctor
 */
export function getDoctorImageUrl(doctor?: Partial<Doctor> | null): string {
  if (!doctor) return '';
  if (doctor.profileImage && doctor.profileImage.trim() !== '') {
    return doctor.profileImage;
  }
  if (doctor._id && STABLE_DOCTOR_IMAGES[doctor._id]) {
    return STABLE_DOCTOR_IMAGES[doctor._id];
  }
  return '';
}

/**
 * Development & runtime validation to ensure no two doctors share the same photo URL
 */
export function validateDoctorImageUniqueness(doctors: Doctor[]): void {
  const seenUrls = new Map<string, string>(); // url -> doctorId
  for (const doc of doctors) {
    const url = doc.profileImage || STABLE_DOCTOR_IMAGES[doc._id];
    if (url) {
      if (seenUrls.has(url)) {
        const prevDocId = seenUrls.get(url);
        console.warn(
          `[CareFlow Image Audit] Duplicate doctor image detected between "${prevDocId}" and "${doc._id}" (${doc.name}). Every doctor must have a distinct portrait.`
        );
      } else {
        seenUrls.set(url, doc._id);
      }
    }
  }
}
