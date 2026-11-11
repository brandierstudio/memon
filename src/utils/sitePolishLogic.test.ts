import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveActiveNavSection,
  composeFolderTransform,
  getKarachiClinicStatus,
} from './sitePolishLogic.ts';

test('resolveActiveNavSection selects the section containing viewportFocusY or closest section', () => {
  const sections = [
    { id: 'hero', top: 0, bottom: 900 },
    { id: 'kitchen', top: 900, bottom: 1800 },
    { id: 'services', top: 1800, bottom: 2600 },
    { id: 'doctors', top: 2600, bottom: 3400 },
    { id: 'patient-showcase', top: 3400, bottom: 4300 },
    { id: 'appointment-booking', top: 4300, bottom: 5200 },
    { id: 'location', top: 5200, bottom: 6000 },
  ];

  assert.equal(resolveActiveNavSection(sections, 250), 'hero');
  assert.equal(resolveActiveNavSection(sections, 1950), 'services');
  assert.equal(resolveActiveNavSection(sections, 2800), 'doctors');
  assert.equal(resolveActiveNavSection(sections, 4500), 'appointment-booking');
  assert.equal(resolveActiveNavSection(sections, 5400), 'location');
});

test('composeFolderTransform preserves base offset and composes hover lift without overwriting', () => {
  assert.equal(composeFolderTransform(0, false, false), 'translate3d(0, 0px, 0)');
  assert.equal(composeFolderTransform(142, true, false), 'translate3d(0, 132px, 0)');
  assert.equal(composeFolderTransform(-86, true, true), 'translate3d(0, -86px, 0)');
});

test('getKarachiClinicStatus computes open/closed status accurately in PKT (UTC+5)', () => {
  // Wednesday 2026-11-11 10:00 UTC -> 15:00 PKT (3:00 PM PKT, Open)
  const wedAfternoonUtc = Date.UTC(2026, 10, 11, 10, 0, 0);
  const openStatus = getKarachiClinicStatus(wedAfternoonUtc);
  assert.equal(openStatus.isOpen, true);
  assert.equal(openStatus.pktDayName, 'Wednesday');
  assert.equal(openStatus.pktTimeFormatted, '3:00 PM PKT');

  // Wednesday 2026-11-11 04:30 UTC -> 09:30 PKT (9:30 AM PKT, Before opening)
  const wedMorningUtc = Date.UTC(2026, 10, 11, 4, 30, 0);
  const morningStatus = getKarachiClinicStatus(wedMorningUtc);
  assert.equal(morningStatus.isOpen, false);
  assert.match(morningStatus.statusLabel, /Opens Today at 11:00 AM/);

  // Sunday 2026-11-15 09:00 UTC -> 14:00 PKT (Sunday, By Prior Appointment)
  const sunUtc = Date.UTC(2026, 10, 15, 9, 0, 0);
  const sunStatus = getKarachiClinicStatus(sunUtc);
  assert.equal(sunStatus.isOpen, false);
  assert.match(sunStatus.statusLabel, /Sunday/);
});
