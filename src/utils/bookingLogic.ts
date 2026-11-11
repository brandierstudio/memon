export interface CalendarDayCell {
  dateIso: string; // YYYY-MM-DD
  dayNumber: number;
  monthOffset: -1 | 0 | 1; // -1 prev month, 0 current month, 1 next month
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  isBlocked: boolean;
  disabled: boolean;
  ariaLabel: string;
}

export interface CalendarMonthModel {
  year: number;
  month: number; // 0-indexed (0 = January .. 11 = December)
  monthLabel: string; // e.g. "November 2026"
  canGoPrev: boolean;
  cells: CalendarDayCell[];
}

export interface BookingFormInput {
  fullName: string;
  phone: string;
  email: string;
  treatment: string;
  selectedDateIso: string;
  preferredTime: string;
}

export interface BookingValidationResult {
  valid: boolean;
  errors: {
    fullName?: string;
    phone?: string;
    email?: string;
    treatment?: string;
    date?: string;
    time?: string;
  };
}

export const PREFERRED_TIME_SLOTS: readonly string[] = [
  '9:00 AM',
  '11:30 AM',
  '2:00 PM',
  '3:00 PM',
  '4:30 PM',
  '6:00 PM',
];

export const VERIFIED_TREATMENT_OPTIONS: readonly string[] = [
  'General Consultation',
  'Dental Implants',
  'Orthodontics',
  'Cosmetic Dentistry',
  'General Dentistry',
  'Smile Makeover',
  'Teeth Alignment',
  'Full Mouth Rehabilitation',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  const m = ((monthZeroIndexed % 12) + 12) % 12;
  if (m === 1) {
    return isLeapYear(year) ? 29 : 28;
  }
  if (m === 3 || m === 5 || m === 8 || m === 10) {
    return 30;
  }
  return 31;
}

export function formatIsoDate(year: number, monthZeroIndexed: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11) return null;
  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) return null;
  return { year, month, day };
}

/**
 * Builds a Monday-first calendar grid for the given year & month (0-indexed).
 * Handles leap years, past date disabling, today highlighting, and blocked dates.
 */
export function buildCalendarMonth(
  year: number,
  month: number,
  todayIso: string,
  selectedDateIso: string,
  blockedDates: ReadonlySet<string> = new Set(),
): CalendarMonthModel {
  const todayParsed = parseIsoDate(todayIso) || { year, month, day: 1 };
  const daysInCurrent = getDaysInMonth(year, month);

  // JS getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Convert to Monday-first index: 0 = Mon, 1 = Tue, ..., 6 = Sun
  const firstDayJs = new Date(year, month, 1).getDay();
  const leadingEmptyCount = (firstDayJs + 6) % 7;

  const cells: CalendarDayCell[] = [];

  for (let day = 1; day <= daysInCurrent; day++) {
    const dateIso = formatIsoDate(year, month, day);
    const jsDay = new Date(year, month, day).getDay();
    const weekdayName = WEEKDAY_NAMES[jsDay];
    const isToday = dateIso === todayIso;
    const isPast = dateIso < todayIso;
    const isBlocked = blockedDates.has(dateIso);
    const isSelected = dateIso === selectedDateIso;
    const disabled = isPast || isBlocked;

    let ariaLabel = `${weekdayName}, ${MONTH_NAMES[month]} ${day}, ${year}`;
    if (isToday) ariaLabel += ' (Today)';
    if (isPast) ariaLabel += ' — Unavailable (past date)';
    else if (isBlocked) ariaLabel += ' — Unavailable';

    cells.push({
      dateIso,
      dayNumber: day,
      monthOffset: 0,
      isCurrentMonth: true,
      isToday,
      isPast,
      isSelected,
      isBlocked,
      disabled,
      ariaLabel,
    });
  }

  // Pad leading slots with placeholders so Day 1 aligns under its exact Monday-Sun column
  const paddedCells: CalendarDayCell[] = [];
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrev = getDaysInMonth(prevYear, prevMonth);

  for (let i = leadingEmptyCount - 1; i >= 0; i--) {
    const dayNum = daysInPrev - i;
    const dateIso = formatIsoDate(prevYear, prevMonth, dayNum);
    paddedCells.push({
      dateIso,
      dayNumber: dayNum,
      monthOffset: -1,
      isCurrentMonth: false,
      isToday: false,
      isPast: true,
      isSelected: false,
      isBlocked: false,
      disabled: true,
      ariaLabel: `${MONTH_NAMES[prevMonth]} ${dayNum}, ${prevYear}`,
    });
  }

  paddedCells.push(...cells);

  const canGoPrev =
    year > todayParsed.year ||
    (year === todayParsed.year && month > todayParsed.month);

  return {
    year,
    month,
    monthLabel: `${MONTH_NAMES[month]} ${year}`,
    canGoPrev,
    cells: paddedCells,
  };
}

export function validateInternationalPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  // Allow optional +, spaces, dashes, parentheses; require 7 to 15 digits total
  if (!/^\+?[\d\s\-().]{7,22}$/.test(trimmed)) return false;
  const digitsOnly = trimmed.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

export function validateEmailAddress(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return true; // Email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function validateBookingInput(
  input: BookingFormInput,
  todayIso: string,
): BookingValidationResult {
  const errors: BookingValidationResult['errors'] = {};

  const nameClean = input.fullName.trim();
  if (!nameClean || nameClean.length < 2) {
    errors.fullName = 'Please enter your full name.';
  }

  if (!validateInternationalPhone(input.phone)) {
    errors.phone = 'Please enter a valid phone number (7–15 digits, e.g. +92 300 1234567).';
  }

  if (!validateEmailAddress(input.email)) {
    errors.email = 'Please enter a valid email address or leave this field blank.';
  }

  const parsedDate = parseIsoDate(input.selectedDateIso);
  if (!parsedDate || input.selectedDateIso < todayIso) {
    errors.date = 'Please select a valid date from today onward.';
  }

  if (!input.preferredTime || !input.preferredTime.trim()) {
    errors.time = 'Please select a preferred appointment time.';
  }

  if (!input.treatment || !input.treatment.trim()) {
    errors.treatment = 'Please select a consultation or treatment category.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildPrefilledAppointmentMessage(input: BookingFormInput): string {
  const parsed = parseIsoDate(input.selectedDateIso);
  const dateDisplay = parsed
    ? `${MONTH_NAMES[parsed.month]} ${parsed.day}, ${parsed.year}`
    : input.selectedDateIso;

  const lines = [
    'Appointment Request — Memon Dental Clinic',
    `Patient Name: ${input.fullName.trim()}`,
    `Contact Number: ${input.phone.trim()}`,
  ];
  if (input.email.trim()) {
    lines.push(`Email: ${input.email.trim()}`);
  }
  lines.push(
    `Treatment Requested: ${input.treatment.trim() || 'General Consultation'}`,
    `Preferred Date: ${dateDisplay}`,
    `Preferred Time: ${input.preferredTime.trim()} (Pending clinic confirmation)`,
  );
  return lines.join('\n');
}
