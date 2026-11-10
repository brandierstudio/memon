export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function clamp(v: number, a = 0, b = 1): number {
  return Math.min(b, Math.max(a, v));
}

export function smoothstep(q: number): number {
  return q * q * (3 - 2 * q);
}

export const DENTAL_SCENE_ANCHORS = {
  intrinsicWidth: 1376,
  intrinsicHeight: 768,
  pedestal: { nx: 0.504, ny: 0.575 },
  lampCenter: { nx: 0.217, ny: 0.330 },
  lampBulbs: [
    { nx: 0.2108, ny: 0.3242 },
    { nx: 0.2064, ny: 0.3320 },
    { nx: 0.2297, ny: 0.3281 },
    { nx: 0.2209, ny: 0.3359 },
  ],
  faucetNozzle: { nx: 0.7929, ny: 0.5221 },
  sinkBasin: { nx: 0.7929, ny: 0.5859 },
  windowGlass: {
    left: 0.918,
    right: 0.980,
    topLeftY: 0.018,
    topRightY: 0.004,
    bottomY: 0.748,
    plantCutout: { maxX: 0.952, minY: 0.635 },
  },
};

export interface ServiceFolderSpec {
  index: number;
  code: string;
  id: string;
  label: string;
  title: string;
  description: string;
  color: string;
  hoverColor: string;
  textColor: 'light' | 'dark';
  tabCenter: number;
  tabWidth: number;
  baseTop: number;
  image: string;
  treatmentValue: string;
}

export const SERVICE_FOLDERS: ServiceFolderSpec[] = [
  {
    index: 0,
    code: '01',
    id: 'dental-implants',
    label: 'DENTAL IMPLANTS',
    title: 'Dental Implants',
    description:
      'Precision-crafted tooth replacement options designed to restore natural function, stability, and long-term comfort.',
    color: '#242333',
    hoverColor: '#2d2c40',
    textColor: 'light',
    tabCenter: 0.745,
    tabWidth: 0.31,
    baseTop: 0,
    image: '/service-implants.jpg',
    treatmentValue: 'Restorative Care',
  },
  {
    index: 1,
    code: '02',
    id: 'orthodontics',
    label: 'ORTHODONTICS',
    title: 'Orthodontics',
    description:
      'Explore options designed to support healthier alignment and confident smiles.',
    color: '#303A87',
    hoverColor: '#38449c',
    textColor: 'light',
    tabCenter: 0.355,
    tabWidth: 0.30,
    baseTop: 82,
    image: '/service-orthodontics.jpg',
    treatmentValue: 'Clear Aligners',
  },
  {
    index: 2,
    code: '03',
    id: 'cosmetic-dentistry',
    label: 'COSMETIC DENTISTRY',
    title: 'Cosmetic Dentistry',
    description:
      'Thoughtful aesthetic treatments tailored to brighten, refine, and harmonize your natural smile.',
    color: '#596BA9',
    hoverColor: '#6477b8',
    textColor: 'light',
    tabCenter: 0.548,
    tabWidth: 0.325,
    baseTop: 218,
    image: '/service-cosmetic.jpg',
    treatmentValue: 'Cosmetic Care',
  },
  {
    index: 3,
    code: '04',
    id: 'general-dentistry',
    label: 'GENERAL DENTISTRY',
    title: 'General Dentistry',
    description:
      'Comprehensive exams, gentle preventive hygiene, and restorative care focused on everyday oral wellness.',
    color: '#E5DDC6',
    hoverColor: '#ece5d0',
    textColor: 'dark',
    tabCenter: 0.302,
    tabWidth: 0.305,
    baseTop: 356,
    image: '/service-general.jpg',
    treatmentValue: 'General Dentistry',
  },
];

export function buildFolderSvgPaths(
  tabCenterNorm: number,
  tabWidthNorm: number,
  viewWidth = 1440,
  viewHeight = 680,
  tabHeight = 56,
  shoulderWidth = 44
): { d: string; edgeD: string; leftPx: number; rightPx: number } {
  const topY = 2;
  const shoulderY = topY + tabHeight;
  const halfW = (tabWidthNorm * viewWidth) / 2;
  const cx = tabCenterNorm * viewWidth;
  const L = Math.max(shoulderWidth + 12, cx - halfW);
  const R = Math.min(viewWidth - shoulderWidth - 12, cx + halfW);
  const S = shoulderWidth;

  const x0 = +(L - S).toFixed(1);
  const c1x = +(L - S * 0.32).toFixed(1);
  const c2x = +(L - S * 0.42).toFixed(1);
  const x1 = +(L + S * 0.36).toFixed(1);

  const x2 = +(R - S * 0.36).toFixed(1);
  const c3x = +(R + S * 0.42).toFixed(1);
  const c4x = +(R + S * 0.32).toFixed(1);
  const x3 = +(R + S).toFixed(1);

  const edgeD = `M 0,${shoulderY} L ${x0},${shoulderY} C ${c1x},${shoulderY} ${c2x},${topY} ${x1},${topY} L ${x2},${topY} C ${c3x},${topY} ${c4x},${shoulderY} ${x3},${shoulderY} L ${viewWidth},${shoulderY}`;
  const d = `${edgeD} L ${viewWidth},${viewHeight} L 0,${viewHeight} Z`;

  return { d, edgeD, leftPx: L, rightPx: R };
}

export function computeFolderStackOffsets(activeIndex: number | null): [number, number, number, number] {
  if (activeIndex === null || activeIndex < 0 || activeIndex > 3) {
    return [0, 0, 0, 0];
  }
  switch (activeIndex) {
    case 0:
      return [-24, 196, 142, 86];
    case 1:
      return [-12, -20, 146, 90];
    case 2:
      return [-16, -24, -86, 82];
    case 3:
      return [-16, -24, -86, -148];
    default:
      return [0, 0, 0, 0];
  }
}

export interface FolderInteractionState {
  hovered: number | null;
  locked: number | null;
  active: number | null;
}

export function resolveFolderInteractionState(
  state: FolderInteractionState,
  action: { type: 'hover' | 'leave' | 'click' | 'escape'; index?: number }
): FolderInteractionState {
  let hovered = state.hovered;
  let locked = state.locked;

  if (action.type === 'hover' && typeof action.index === 'number') {
    hovered = action.index;
  } else if (action.type === 'leave') {
    hovered = null;
  } else if (action.type === 'click' && typeof action.index === 'number') {
    if (locked === action.index) {
      locked = null;
      hovered = null;
    } else {
      locked = action.index;
      hovered = action.index;
    }
  } else if (action.type === 'escape') {
    locked = null;
    hovered = null;
  }

  const active = hovered !== null ? hovered : locked;
  return { hovered, locked, active };
}

export function computeLampIntensity(tSeconds: number): number {
  const cycle = 9.0;
  const phase = ((tSeconds % cycle) + cycle) % cycle;
  if (phase < 1.8) {
    return smoothstep(phase / 1.8);
  }
  if (phase < 5.2) {
    return 0.97 + 0.03 * Math.sin(((phase - 1.8) / 3.4) * Math.PI);
  }
  if (phase < 7.0) {
    return 1 - smoothstep((phase - 5.2) / 1.8);
  }
  return 0;
}

export function computeMeasure(S: Rect, K: Rect, navOffsetPx = 72) {
  const x0 = S.x + 0.79 * S.w;
  const y0 = S.y + 0.525 * S.h;
  const c0 = 0.42 * S.h;

  const bw = 0.29 * S.w;
  const bh = (bw * 2048) / 1360;
  const balloonLeft = 0.79 * S.w - bw * 0.494;
  const balloonTop = 0.525 * S.h - c0 / 2 + c0 * 0.075 - bh * 0.946;

  const KI_W = DENTAL_SCENE_ANCHORS.intrinsicWidth;
  const KI_H = DENTAL_SCENE_ANCHORS.intrinsicHeight;
  const sc = Math.max(K.w / KI_W, K.h / KI_H);
  const ox = (K.w - KI_W * sc) / 2;
  const oy = (K.h - KI_H * sc) / 2;
  const H = KI_H * sc;

  const gx = K.x + ox + DENTAL_SCENE_ANCHORS.pedestal.nx * KI_W * sc;
  const gy = K.y + oy + DENTAL_SCENE_ANCHORS.pedestal.ny * KI_H * sc;

  const c1 = (H * 0.19) / 0.835;
  const x1 = gx;
  const y1 = gy - c1 * 0.91 + c1 / 2;

  const ktextLeft = ox + 0.545 * KI_W * sc;
  const ktextTop = oy + 0.215 * KI_H * sc;
  const kh = (H * 0.036).toFixed(1) + 'px';
  const kp = (H * 0.021).toFixed(1) + 'px';

  const end = Math.max(200, K.y - navOffsetPx);
  const m = Math.ceil(Math.max(c0, c1) * 1.05);

  return {
    x0,
    y0,
    c0,
    bw,
    bh,
    balloonLeft,
    balloonTop,
    ox,
    oy,
    sc,
    gx,
    gy,
    x1,
    y1,
    c1,
    ktextLeft,
    ktextTop,
    kh,
    kp,
    end,
    m,
  };
}

export function stepSmoothing(sp: number, target: number): number {
  let next = sp + (target - sp) * 0.18;
  if (Math.abs(target - next) < 0.0005) {
    next = target;
  }
  return next;
}

export function computeFrameState(
  sp: number,
  tSeconds: number,
  geom: ReturnType<typeof computeMeasure>,
  S: Rect,
  K: Rect,
  cachedFrames: number,
  ready: boolean
) {
  const p = clamp(sp, 0, 1);
  const q = clamp((p - 0.02) / 0.9);
  const fall = Math.pow(q, 1.75);
  const sq = smoothstep(q);

  const idle = 1 - clamp(p * 12);
  const bob = idle * Math.sin(1.9 * tSeconds) * 6;
  const sway = idle * Math.sin(1.3 * tSeconds) * 1.4;

  const x = geom.x0 + (geom.x1 - geom.x0) * sq;
  const y = geom.y0 + (geom.y1 - geom.y0) * fall + bob;
  const size = geom.c0 + (geom.c1 - geom.c0) * sq;
  const tilt = Math.sin(q * Math.PI) * -9 + sway;

  const rawF = Math.round(clamp((q - 0.12) / 0.72) * 47);
  const f = ready && cachedFrames > 0 ? clamp(rawF, 0, cachedFrames - 1) : 0;

  const scl = size / geom.m;
  const gSTransform = `translate(${x - S.x - geom.m / 2}px, ${y - S.y - geom.m / 2}px) rotate(${tilt}deg) scale(${scl})`;
  const gKTransform = `translate(${x - K.x - geom.m / 2}px, ${y - K.y - geom.m / 2}px) rotate(${tilt}deg) scale(${scl})`;

  const r = clamp(p * 1.25);
  const balloonTransform = `translate(${r * -0.06 * S.w}px, ${bob - r * 1.25 * S.h}px) rotate(${sway * 1.6 - r * 6}deg)`;

  const shadowProgress = clamp((q - 0.55) / 0.45);
  const shadowOpacity = shadowProgress * 0.42;
  const shadowScale = 0.4 + 0.6 * shadowProgress;

  const landed = p > 0.9;

  return {
    p,
    q,
    fall,
    sq,
    idle,
    bob,
    sway,
    x,
    y,
    size,
    tilt,
    f,
    scl,
    gSTransform,
    gKTransform,
    r,
    balloonTransform,
    shadowOpacity,
    shadowScale,
    landed,
  };
}

export function applyChromaKey(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const m = r > b ? r : b;
    const k = g - m;
    if (k > 18) {
      const alpha = Math.max(0, 1 - (k - 18) / 52);
      data[i + 3] = (alpha * 255) | 0;
      const maxG = m + 6;
      if (g > maxG) data[i + 1] = maxG;
    }
  }
}
