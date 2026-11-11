import { EMBEDDED_PRODUCTION_ASSETS } from './generated/embeddedAssets';

export interface AssetCheckResult {
  url: string;
  ok: boolean;
  status: number;
  contentType: string;
  isHtmlFallback: boolean;
  error?: string;
}

/**
 * Reusable diagnostic utility (Phase 4) to verify that an asset URL returns
 * a valid HTTP 200/206 response AND a real media Content-Type (not an HTML SPA fallback).
 */
export async function checkAsset(url: string): Promise<AssetCheckResult> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });

    const type = (response.headers.get('content-type') || '').toLowerCase();
    const isHtmlFallback = type.includes('text/html');
    const validOk = response.ok && !isHtmlFallback;

    if (import.meta.env?.DEV) {
      console.log({
        url,
        status: response.status,
        ok: validOk,
        contentType: type,
      });
    }

    return {
      url,
      ok: validOk,
      status: response.status,
      contentType: type,
      isHtmlFallback,
    };
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.error('Asset request failed:', url, error);
    }
    return {
      url,
      ok: false,
      status: 0,
      contentType: '',
      isHtmlFallback: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function getEmbeddedDataUri(assetPath: string): string | null {
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const entry = EMBEDDED_PRODUCTION_ASSETS[normalized];
  if (!entry) return null;
  return `data:${entry.mime};base64,${entry.b64}`;
}

declare global {
  interface Window {
    __MEMON_EMBEDDED_ASSETS?: typeof EMBEDDED_PRODUCTION_ASSETS;
    __getMemonFallbackAsset?: (assetPath: string) => string | null;
    __checkMemonAsset?: typeof checkAsset;
  }
}

if (typeof window !== 'undefined') {
  window.__MEMON_EMBEDDED_ASSETS = EMBEDDED_PRODUCTION_ASSETS;
  window.__getMemonFallbackAsset = getEmbeddedDataUri;
  window.__checkMemonAsset = checkAsset;

  // Attach automatic resilience for any <img> element whose network request fails
  const applyImageFallback = (img: HTMLImageElement) => {
    const rawSrc = img.getAttribute('src') || img.dataset.fallbackSrc || '';
    if (!rawSrc || rawSrc.startsWith('data:')) return;
    const dataUri = getEmbeddedDataUri(rawSrc);
    if (dataUri && img.src !== dataUri) {
      img.src = dataUri;
      img.classList.remove('is-broken-image');
    }
  };

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        applyImageFallback(target);
      }
    },
    true
  );

  const verifyDomImages = () => {
    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
      if (img.complete && img.naturalWidth === 0) {
        applyImageFallback(img);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifyDomImages, { once: true });
  } else {
    verifyDomImages();
  }
}
