export interface SectionBounds {
  id: string;
  top: number;
  bottom: number;
}

export interface ClinicHoursStatus {
  isOpen: boolean;
  statusLabel: string;
  detailLabel: string;
  pktDayName: string;
  pktTimeFormatted: string;
}

const PKT_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Determines which navigation section ID should be marked active (`aria-current="page"`)
 * given current viewport scroll offset and section bounding boxes.
 */
export function resolveActiveNavSection(
  sections: SectionBounds[],
  viewportFocusY: number
): string {
  if (!sections.length) return 'hero';

  for (const sec of sections) {
    if (viewportFocusY >= sec.top && viewportFocusY < sec.bottom) {
      return sec.id;
    }
  }

  let closest = sections[0];
  let minDistance = Math.abs(viewportFocusY - sections[0].top);
  for (let i = 1; i < sections.length; i++) {
    const d = Math.abs(viewportFocusY - sections[i].top);
    if (d < minDistance) {
      minDistance = d;
      closest = sections[i];
    }
  }
  return closest.id;
}

/**
 * Computes the folder transform string combining the base stack offset and optional hover lift.
 */
export function composeFolderTransform(
  baseOffsetY: number,
  isHovered: boolean,
  isLockedOrActive: boolean,
  hoverLiftPx = -10
): string {
  const extraLift = isHovered && !isLockedOrActive ? hoverLiftPx : 0;
  const totalY = baseOffsetY + extraLift;
  return `translate3d(0, ${totalY}px, 0)`;
}

/**
 * Computes Karachi (PKT, UTC+5) clinic open/closed status for Memon Dental Clinic.
 * Regular hours: Monday–Saturday 11:00 AM – 9:00 PM PKT (11:00 to 21:00).
 * Sunday: By Prior Appointment.
 */
export function getKarachiClinicStatus(nowUtcMs = Date.now()): ClinicHoursStatus {
  // PKT is UTC + 5 hours
  const pktOffsetMs = 5 * 60 * 60 * 1000;
  const pktDate = new Date(nowUtcMs + pktOffsetMs);

  const dayIndex = pktDate.getUTCDay(); // 0 = Sun .. 6 = Sat
  const hours = pktDate.getUTCHours();
  const minutes = pktDate.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  const pktDayName = PKT_DAYS[dayIndex] || 'Monday';
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minStr = String(minutes).padStart(2, '0');
  const pktTimeFormatted = `${hour12}:${minStr} ${period} PKT`;

  if (dayIndex === 0) {
    return {
      isOpen: false,
      statusLabel: 'Sunday · By Prior Appointment',
      detailLabel: 'Reopens Monday at 11:00 AM PKT',
      pktDayName,
      pktTimeFormatted,
    };
  }

  const openMinutes = 11 * 60; // 11:00 AM
  const closeMinutes = 21 * 60; // 9:00 PM

  if (totalMinutes >= openMinutes && totalMinutes < closeMinutes) {
    return {
      isOpen: true,
      statusLabel: 'Open Now in Karachi',
      detailLabel: 'Today’s Hours: 11:00 AM – 9:00 PM PKT',
      pktDayName,
      pktTimeFormatted,
    };
  }

  if (totalMinutes < openMinutes) {
    return {
      isOpen: false,
      statusLabel: 'Opens Today at 11:00 AM',
      detailLabel: 'Standard Hours: 11:00 AM – 9:00 PM PKT',
      pktDayName,
      pktTimeFormatted,
    };
  }

  return {
    isOpen: false,
    statusLabel: 'Closed for Evening · Request Visit Online',
    detailLabel: dayIndex === 6 ? 'Sunday by appointment · Mon 11:00 AM' : 'Reopens Tomorrow at 11:00 AM PKT',
    pktDayName,
    pktTimeFormatted,
  };
}
