import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHOWCASE_CASES,
  computeCardStackLayout,
  computeShowcaseZIndex,
  reduceShowcaseState,
  getNextShowcaseId,
  getPrevShowcaseId,
  resolveCardIndexFromTap,
  type ShowcaseState,
} from './showcaseLogic';

import fs from 'node:fs';
import path from 'node:path';
import { EMBEDDED_PRODUCTION_ASSETS } from '../generated/embeddedAssets';

test('SHOWCASE_CASES contains exact 5 unverified demonstration cases in order and verified production assets', () => {
  assert.equal(SHOWCASE_CASES.length, 5);
  assert.deepEqual(
    SHOWCASE_CASES.map((c) => `${c.label} — ${c.treatment}`),
    [
      'Client 01 — Smile Makeover',
      'Client 02 — Teeth Alignment',
      'Client 03 — Dental Implants',
      'Client 04 — Full Mouth Rehabilitation',
      'Client 05 — Cosmetic Dentistry',
    ],
  );
  for (const item of SHOWCASE_CASES) {
    assert.equal(item.verified, false);
    assert.match(item.image, /^\/assets\/patients\/client-0[1-5]\.webp$/);
    assert.ok(EMBEDDED_PRODUCTION_ASSETS[item.image], `Missing embedded asset for ${item.image}`);
    const diskPath = path.join(process.cwd(), 'public', item.image.replace(/^\/+/, ''));
    assert.ok(fs.existsSync(diskPath) && fs.statSync(diskPath).size > 1000, `Missing disk asset ${diskPath}`);
  }
  assert.ok(EMBEDDED_PRODUCTION_ASSETS['/assets/hero/tooth-sprite.webp']);
  assert.ok(EMBEDDED_PRODUCTION_ASSETS['/assets/dentist/dentist-card.webp']);
  assert.ok(EMBEDDED_PRODUCTION_ASSETS['/assets/location/clinic-location.webp']);
  assert.ok(EMBEDDED_PRODUCTION_ASSETS['/assets/location/clinic-location-pin.webp'], 'Missing clinic-location-pin.webp');
});

test('computeCardStackLayout prevents horizontal overflow across desktop, tablet, and mobile', () => {
  // Desktop 1440px, stage width 840px
  const d0 = computeCardStackLayout(1440, 840, 0);
  const d4 = computeCardStackLayout(1440, 840, 4);
  assert.equal(d0.isMobileCarousel, false);
  assert.equal(d0.x, 0);
  assert.equal(d0.y, 0);
  assert.equal(d0.scale, 1);
  assert.ok(d4.x + d4.cardWidth <= 840, 'Desktop 5th card must not overflow container');
  assert.equal(d4.scale, 0.84);

  // Tablet 820px, stage width 720px
  const t4 = computeCardStackLayout(820, 720, 4);
  assert.equal(t4.isMobileCarousel, false);
  assert.ok(t4.x + t4.cardWidth <= 720, 'Tablet 5th card must not overflow container');

  // Mobile 390px
  const m0 = computeCardStackLayout(390, 390, 0);
  assert.equal(m0.isMobileCarousel, true);
  assert.equal(m0.x, 0);
  assert.ok(m0.cardWidth <= 360);
});

test('computeShowcaseZIndex assigns 20 to hovered, 15 to active, and descending stack order otherwise', () => {
  assert.equal(computeShowcaseZIndex(0, 5, 'case-01', null, 'case-01'), 15);
  assert.equal(computeShowcaseZIndex(2, 5, 'case-03', 'case-03', 'case-01'), 20);
  assert.equal(computeShowcaseZIndex(1, 5, 'case-02', 'case-03', 'case-01'), 4);
  assert.equal(computeShowcaseZIndex(4, 5, 'case-05', null, 'case-01'), 1);
});

test('reduceShowcaseState manages hover, active selection, and case detail modal cleanly', () => {
  let state: ShowcaseState = { hoveredId: null, activeId: 'case-01', modalCaseId: null };
  state = reduceShowcaseState(state, { type: 'HOVER_ENTER', id: 'case-03' });
  assert.equal(state.hoveredId, 'case-03');
  assert.equal(state.activeId, 'case-01');

  state = reduceShowcaseState(state, { type: 'SELECT_CARD', id: 'case-03' });
  assert.equal(state.activeId, 'case-03');

  state = reduceShowcaseState(state, { type: 'HOVER_LEAVE', id: 'case-03' });
  assert.equal(state.hoveredId, null);
  assert.equal(state.activeId, 'case-03');

  state = reduceShowcaseState(state, { type: 'OPEN_MODAL', id: 'case-04' });
  assert.equal(state.activeId, 'case-04');
  assert.equal(state.modalCaseId, 'case-04');

  state = reduceShowcaseState(state, { type: 'CLOSE_MODAL' });
  assert.equal(state.modalCaseId, null);
  assert.equal(state.activeId, 'case-04');
});

test('getNextShowcaseId and getPrevShowcaseId navigate cyclically across all 5 cases', () => {
  assert.equal(getNextShowcaseId('case-01'), 'case-02');
  assert.equal(getNextShowcaseId('case-05'), 'case-01');
  assert.equal(getPrevShowcaseId('case-01'), 'case-05');
  assert.equal(getPrevShowcaseId('case-03'), 'case-02');
});

test('resolveCardIndexFromTap assigns index proportionally across touch coordinates', () => {
  assert.equal(resolveCardIndexFromTap(10, 750, 5), 0);
  assert.equal(resolveCardIndexFromTap(160, 750, 5), 1);
  assert.equal(resolveCardIndexFromTap(320, 750, 5), 2);
  assert.equal(resolveCardIndexFromTap(480, 750, 5), 3);
  assert.equal(resolveCardIndexFromTap(740, 750, 5), 4);
});

test('Vercel deployment config and package.json esbuild peer dependency are compatible with vite@^8', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  assert.notEqual(pkgJson.devDependencies?.esbuild, '^0.25.0');
  assert.match(pkgJson.devDependencies?.esbuild || '', /^\^0\.2[78]\./);

  const npmrc = fs.readFileSync(path.join(process.cwd(), '.npmrc'), 'utf8');
  assert.match(npmrc, /legacy-peer-deps=true/);

  const vercelJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'));
  assert.equal(vercelJson.framework, 'vite');
  assert.equal(vercelJson.outputDirectory, 'dist');
});


