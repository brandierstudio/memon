import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLeapYear,
  getDaysInMonth,
  buildCalendarMonth,
  validateInternationalPhone,
  validateBookingInput,
  buildPrefilledAppointmentMessage,
} from './bookingLogic';

test('isLeapYear and getDaysInMonth handle standard and leap years accurately', () => {
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2026), false);
  assert.equal(isLeapYear(2028), true);
  assert.equal(isLeapYear(2100), false);
  assert.equal(isLeapYear(2000), true);

  assert.equal(getDaysInMonth(2024, 1), 29); // Feb 2024
  assert.equal(getDaysInMonth(2026, 1), 28); // Feb 2026
  assert.equal(getDaysInMonth(2026, 10), 30); // Nov 2026
  assert.equal(getDaysInMonth(2026, 0), 31); // Jan 2026
});

test('buildCalendarMonth aligns weekdays (Mon-Sun), disables past dates, and marks today & selected date', () => {
  // Nov 2026: Nov 1, 2026 is a Sunday (6 leading previous-month cells in Mon-Sun grid)
  const cal = buildCalendarMonth(2026, 10, '2026-11-11', '2026-11-14');
  assert.equal(cal.monthLabel, 'November 2026');
  assert.equal(cal.canGoPrev, false);

  const currentMonthCells = cal.cells.filter((c) => c.isCurrentMonth);
  assert.equal(currentMonthCells.length, 30);

  // Leading offset for Sunday Nov 1, 2026 in Mon-Sun grid is 6
  const firstCurrentIdx = cal.cells.findIndex((c) => c.isCurrentMonth && c.dayNumber === 1);
  assert.equal(firstCurrentIdx, 6);

  // Nov 10 (past) disabled, Nov 11 (today) enabled & marked today, Nov 14 selected
  const nov10 = currentMonthCells.find((c) => c.dayNumber === 10)!;
  const nov11 = currentMonthCells.find((c) => c.dayNumber === 11)!;
  const nov14 = currentMonthCells.find((c) => c.dayNumber === 14)!;

  assert.equal(nov10.isPast, true);
  assert.equal(nov10.disabled, true);
  assert.equal(nov11.isToday, true);
  assert.equal(nov11.disabled, false);
  assert.equal(nov14.isSelected, true);
});

test('validateInternationalPhone and validateBookingInput enforce required fields and valid formats', () => {
  assert.equal(validateInternationalPhone('+92 300 1234567'), true);
  assert.equal(validateInternationalPhone('0300-1234567'), true);
  assert.equal(validateInternationalPhone('123'), false);
  assert.equal(validateInternationalPhone('abc-def-ghij'), false);

  const invalid = validateBookingInput(
    {
      fullName: '',
      phone: '12',
      email: 'not-an-email',
      treatment: 'General Consultation',
      selectedDateIso: '2026-11-01', // in the past relative to 2026-11-11
      preferredTime: '',
    },
    '2026-11-11',
  );
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.fullName);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.date);
  assert.ok(invalid.errors.time);

  const valid = validateBookingInput(
    {
      fullName: 'Ayesha Khan',
      phone: '+92 300 9876543',
      email: '',
      treatment: 'General Consultation',
      selectedDateIso: '2026-11-14',
      preferredTime: '3:00 PM',
    },
    '2026-11-11',
  );
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('buildPrefilledAppointmentMessage formats unconfirmed preferred appointment request accurately', () => {
  const msg = buildPrefilledAppointmentMessage({
    fullName: 'Ayesha Khan',
    phone: '+92 300 9876543',
    email: 'ayesha@example.com',
    treatment: 'General Consultation',
    selectedDateIso: '2026-11-14',
    preferredTime: '3:00 PM',
  });
  assert.match(msg, /Patient Name: Ayesha Khan/);
  assert.match(msg, /Contact Number: \+92 300 9876543/);
  assert.match(msg, /Treatment Requested: General Consultation/);
  assert.match(msg, /Preferred Date: November 14, 2026/);
  assert.match(msg, /Preferred Time: 3:00 PM \(Pending clinic confirmation\)/);
});
