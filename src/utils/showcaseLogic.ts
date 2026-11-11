export interface ShowcaseCase {
  id: string;
  label: string;
  treatment: string;
  shortTreatment: string;
  image: string;
  verified: boolean;
  footerTheme: 'lavender' | 'blue' | 'sand' | 'slate' | 'mauve';
  summary: string;
}

export const SHOWCASE_CASES: ShowcaseCase[] = [
  {
    id: 'case-01',
    label: 'Client 01',
    treatment: 'Smile Makeover',
    shortTreatment: 'Smile Makeover',
    image: '/assets/cases/client-01.webp',
    verified: false,
    footerTheme: 'lavender',
    summary:
      'Demonstration placeholder for Comprehensive Smile Makeover planning (porcelain veneers, enamel contouring, and shade harmonization). Confirmed patient case photography will appear here once clinical consent is finalized.',
  },
  {
    id: 'case-02',
    label: 'Client 02',
    treatment: 'Teeth Alignment',
    shortTreatment: 'Teeth Alignment',
    image: '/assets/cases/client-02.webp',
    verified: false,
    footerTheme: 'blue',
    summary:
      'Demonstration placeholder for Orthodontic Teeth Alignment (digital clear aligners and arch balance). Confirmed patient case photography will appear here once clinical consent is finalized.',
  },
  {
    id: 'case-03',
    label: 'Client 03',
    treatment: 'Dental Implants',
    shortTreatment: 'Dental Implants',
    image: '/assets/cases/client-03.webp',
    verified: false,
    footerTheme: 'sand',
    summary:
      'Demonstration placeholder for Guided Dental Implant Restoration (biocompatible titanium fixtures and custom ceramic crowns). Confirmed patient case photography will appear here once clinical consent is finalized.',
  },
  {
    id: 'case-04',
    label: 'Client 04',
    treatment: 'Full Mouth Rehabilitation',
    shortTreatment: 'Full Mouth Rehab',
    image: '/assets/cases/client-04.webp',
    verified: false,
    footerTheme: 'slate',
    summary:
      'Demonstration placeholder for Full Mouth Rehabilitation (occlusal bite restoration, prosthodontic crowns, and functional comfort). Confirmed patient case photography will appear here once clinical consent is finalized.',
  },
  {
    id: 'case-05',
    label: 'Client 05',
    treatment: 'Cosmetic Dentistry',
    shortTreatment: 'Cosmetic Dentistry',
    image: '/assets/cases/client-05.webp',
    verified: false,
    footerTheme: 'mauve',
    summary:
      'Demonstration placeholder for Aesthetic & Cosmetic Dentistry (conservative composite bonding and professional whitening). Confirmed patient case photography will appear here once clinical consent is finalized.',
  },
];

export interface CardTransformSpec {
  x: number;
  y: number;
  scale: number;
  cardWidth: number;
  cardHeight: number;
  stageHeight: number;
  isMobileCarousel: boolean;
}

const BASE_OFFSETS = [
  { x: 0, y: 0, scale: 1.0 },
  { x: 105, y: 68, scale: 0.96 },
  { x: 205, y: 128, scale: 0.92 },
  { x: 305, y: 188, scale: 0.88 },
  { x: 405, y: 248, scale: 0.84 },
];

export function computeCardStackLayout(
  viewportWidth: number,
  containerWidth: number,
  index: number,
): CardTransformSpec {
  const clampedIdx = Math.max(0, Math.min(BASE_OFFSETS.length - 1, index));
  const base = BASE_OFFSETS[clampedIdx];

  if (viewportWidth < 768) {
    const cardWidth = Math.min(Math.round(viewportWidth * 0.82), 360);
    const cardHeight = Math.round(cardWidth / 0.68);
    return {
      x: 0,
      y: 0,
      scale: 1,
      cardWidth,
      cardHeight,
      stageHeight: cardHeight + 64,
      isMobileCarousel: true,
    };
  }

  const isTablet = viewportWidth < 1024;
  const cardWidth = isTablet
    ? Math.max(270, Math.min(330, Math.round(containerWidth * 0.44)))
    : Math.max(330, Math.min(390, Math.round(containerWidth * 0.46)));
  const cardHeight = Math.round(cardWidth / 0.675);

  // Ensure cardWidth + max offset fits comfortably within containerWidth without horizontal overflow
  const availableSpread = Math.max(180, containerWidth - cardWidth - 16);
  const spreadRatio = Math.min(1, availableSpread / 405);
  const yRatio = isTablet ? 0.82 : 1;

  const x = Math.round(base.x * spreadRatio);
  const y = Math.round(base.y * yRatio);
  const maxY = Math.round(BASE_OFFSETS[BASE_OFFSETS.length - 1].y * yRatio);
  const stageHeight = cardHeight + maxY + 36;

  return {
    x,
    y,
    scale: base.scale,
    cardWidth,
    cardHeight,
    stageHeight,
    isMobileCarousel: false,
  };
}

export function computeShowcaseZIndex(
  index: number,
  totalCards: number,
  id: string,
  hoveredId: string | null,
  activeId: string,
): number {
  if (hoveredId === id) return 20;
  if (activeId === id) return 15;
  return totalCards - index;
}

export interface ShowcaseState {
  hoveredId: string | null;
  activeId: string;
  modalCaseId: string | null;
}

export type ShowcaseAction =
  | { type: 'HOVER_ENTER'; id: string }
  | { type: 'HOVER_LEAVE'; id: string }
  | { type: 'SELECT_CARD'; id: string }
  | { type: 'OPEN_MODAL'; id: string }
  | { type: 'CLOSE_MODAL' };

export function reduceShowcaseState(
  state: ShowcaseState,
  action: ShowcaseAction,
): ShowcaseState {
  switch (action.type) {
    case 'HOVER_ENTER':
      return { ...state, hoveredId: action.id };
    case 'HOVER_LEAVE':
      return {
        ...state,
        hoveredId: state.hoveredId === action.id ? null : state.hoveredId,
      };
    case 'SELECT_CARD':
      return { ...state, activeId: action.id };
    case 'OPEN_MODAL':
      return { ...state, activeId: action.id, modalCaseId: action.id };
    case 'CLOSE_MODAL':
      return { ...state, modalCaseId: null };
    default:
      return state;
  }
}
