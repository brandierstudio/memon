import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  smoothstep,
  computeMeasure,
  stepSmoothing,
  computeFrameState,
  applyChromaKey,
  computeLampIntensity,
  DENTAL_SCENE_ANCHORS,
  SERVICE_FOLDERS,
  buildFolderSvgPaths,
  computeFolderStackOffsets,
  resolveFolderInteractionState,
  type FolderInteractionState,
} from './choreography.ts';

test('clamp and smoothstep behave accurately', () => {
  assert.equal(clamp(-0.5, 0, 1), 0);
  assert.equal(clamp(1.5, 0, 1), 1);
  assert.equal(clamp(0.4, 0, 1), 0.4);
  assert.equal(smoothstep(0), 0);
  assert.equal(smoothstep(0.5), 0.5);
  assert.equal(smoothstep(1), 1);
});

test('stepSmoothing approaches target and snaps within 0.0005', () => {
  const mid = stepSmoothing(0, 1);
  assert.ok(Math.abs(mid - 0.18) < 1e-6);
  const snapped = stepSmoothing(0.9997, 1);
  assert.equal(snapped, 1);
});

test('computeMeasure calculates exact start, dental pedestal end, and balloon anchor', () => {
  const S = { x: 12, y: 74, w: 1000, h: 800 };
  const K = { x: 12, y: 886, w: 1416, h: 800 };
  const geom = computeMeasure(S, K, 72);

  assert.equal(geom.x0, 12 + 790);
  assert.equal(geom.y0, 74 + 420);
  assert.equal(geom.c0, 336);
  assert.ok(geom.x1 > K.x + K.w * 0.45 && geom.x1 < K.x + K.w * 0.55);
  assert.ok(geom.y1 > K.y + K.h * 0.35 && geom.y1 < K.y + K.h * 0.65);
  assert.equal(geom.end, 814);
});

test('computeLampIntensity smoothly cycles on, holds, and turns off', () => {
  assert.equal(computeLampIntensity(0), 0);
  const rising = computeLampIntensity(0.9);
  assert.ok(rising > 0.4 && rising < 0.6);
  const peak = computeLampIntensity(3.5);
  assert.ok(peak >= 0.97 && peak <= 1.0);
  const falling = computeLampIntensity(6.1);
  assert.ok(falling > 0.4 && falling < 0.6);
  assert.equal(computeLampIntensity(7.8), 0);
});

test('environmental anchors are accurately positioned within normalized bounds', () => {
  assert.equal(DENTAL_SCENE_ANCHORS.lampBulbs.length, 4);
  assert.ok(DENTAL_SCENE_ANCHORS.faucetNozzle.ny < DENTAL_SCENE_ANCHORS.sinkBasin.ny);
  assert.equal(DENTAL_SCENE_ANCHORS.faucetNozzle.nx, DENTAL_SCENE_ANCHORS.sinkBasin.nx);
  assert.ok(DENTAL_SCENE_ANCHORS.windowGlass.left < DENTAL_SCENE_ANCHORS.windowGlass.right);
});

test('computeFrameState handles idle, mid-fall, contact shadow, and landed states', () => {
  const S = { x: 12, y: 74, w: 1000, h: 800 };
  const K = { x: 12, y: 886, w: 1416, h: 800 };
  const geom = computeMeasure(S, K, 72);

  const topState = computeFrameState(0, 0, geom, S, K, 48, true);
  assert.equal(topState.p, 0);
  assert.equal(topState.f, 0);
  assert.equal(topState.landed, false);
  assert.equal(topState.shadowOpacity, 0);

  const midState = computeFrameState(0.5, 1.2, geom, S, K, 48, true);
  assert.equal(midState.idle, 0);
  assert.ok(midState.f > 0 && midState.f < 47);
  assert.equal(midState.landed, false);

  const bottomState = computeFrameState(1, 2.0, geom, S, K, 48, true);
  assert.equal(bottomState.f, 47);
  assert.equal(bottomState.landed, true);
  assert.ok(Math.abs(bottomState.x - geom.x1) < 1e-6);
  assert.ok(Math.abs(bottomState.y - geom.y1) < 1e-6);
  assert.ok(bottomState.shadowOpacity > 0.4);
});

test('applyChromaKey keys green background and despills fringes', () => {
  const pixels = new Uint8ClampedArray([
    20, 230, 30, 255,
    245, 242, 235, 255,
  ]);
  applyChromaKey(pixels);
  assert.equal(pixels[3], 0);
  assert.equal(pixels[7], 255);
});

test('SERVICE_FOLDERS and buildFolderSvgPaths produce staggered, seamless folder geometry', () => {
  assert.equal(SERVICE_FOLDERS.length, 4);
  assert.deepEqual(
    SERVICE_FOLDERS.map((f) => f.label),
    ['DENTAL IMPLANTS', 'ORTHODONTICS', 'COSMETIC DENTISTRY', 'GENERAL DENTISTRY']
  );
  // Check alternating horizontal tab positions: upper-right, left, center-right, lower-left
  assert.ok(SERVICE_FOLDERS[0].tabCenter > 0.65);
  assert.ok(SERVICE_FOLDERS[1].tabCenter < 0.42);
  assert.ok(SERVICE_FOLDERS[2].tabCenter > 0.48 && SERVICE_FOLDERS[2].tabCenter < 0.62);
  assert.ok(SERVICE_FOLDERS[3].tabCenter < 0.36);

  for (const folder of SERVICE_FOLDERS) {
    const { d, edgeD, leftPx, rightPx } = buildFolderSvgPaths(folder.tabCenter, folder.tabWidth);
    assert.ok(d.startsWith('M 0,58'));
    assert.ok(d.endsWith('Z'));
    assert.ok(edgeD.includes('C '));
    assert.ok(rightPx > leftPx + 200);
  }
});

test('computeFolderStackOffsets keeps all 4 folder tabs ordered and opens space for active folder', () => {
  assert.deepEqual(computeFolderStackOffsets(null), [0, 0, 0, 0]);
  const baseTops = SERVICE_FOLDERS.map((f) => f.baseTop);

  for (let activeIdx = 0; activeIdx < 4; activeIdx++) {
    const offsets = computeFolderStackOffsets(activeIdx);
    // Selected folder always lifts upward (negative translateY)
    assert.ok(offsets[activeIdx] < 0);
    // Transformed tab tops remain strictly increasing so all 4 tabs stay accessible
    const transformedTops = baseTops.map((t, i) => t + offsets[i]);
    for (let i = 1; i < 4; i++) {
      assert.ok(
        transformedTops[i] - transformedTops[i - 1] >= 70,
        `Expected tab ${i} to remain below tab ${i - 1} when folder ${activeIdx} is active`
      );
    }
    // Active folder has >= 240px of exposed vertical room before the next folder's tab
    if (activeIdx < 3) {
      const gapToNextTab = transformedTops[activeIdx + 1] - (transformedTops[activeIdx] + 56);
      assert.ok(gapToNextTab >= 240, `Expected >= 240px gap for folder ${activeIdx}, got ${gapToNextTab}`);
    }
  }
});

test('resolveFolderInteractionState handles hover preview, click lock/unlock, and Escape', () => {
  let state: FolderInteractionState = { hovered: null, locked: null, active: null };

  // Hover folder 1 previews it
  state = resolveFolderInteractionState(state, { type: 'hover', index: 1 });
  assert.equal(state.active, 1);
  assert.equal(state.locked, null);

  // Leaving when unlocked closes back to default state
  state = resolveFolderInteractionState(state, { type: 'leave' });
  assert.equal(state.active, null);

  // Clicking folder 2 locks it open
  state = resolveFolderInteractionState(state, { type: 'click', index: 2 });
  assert.equal(state.locked, 2);
  assert.equal(state.active, 2);

  // Leaving while locked keeps folder 2 open
  state = resolveFolderInteractionState(state, { type: 'leave' });
  assert.equal(state.active, 2);

  // Clicking folder 2 again unlocks and closes it
  state = resolveFolderInteractionState(state, { type: 'click', index: 2 });
  assert.equal(state.locked, null);
  assert.equal(state.active, null);

  // Locking folder 0 then pressing Escape closes it
  state = resolveFolderInteractionState(state, { type: 'click', index: 0 });
  assert.equal(state.active, 0);
  state = resolveFolderInteractionState(state, { type: 'escape' });
  assert.equal(state.active, null);
});
