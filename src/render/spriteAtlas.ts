import { SPRITE_ATLAS_JSON, SPRITE_SHEET_URLS } from '../data/spriteManifest';

/**
 * Multi-page Pixel-Art Sprite Sheet Atlas loader and crisp nearest-neighbor blitter.
 *
 * Uses inline-bundled JSON atlas metadata + Vite content-hashed compact PNG pages
 * (each <= 1536x1400, < 2.2 MP) so iOS Safari and SFSafariViewController decode
 * reliably with zero stale-cache mismatches or oversized-texture rejections.
 */

export interface SpriteFrame {
  page?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
}

export interface SpritePageMeta {
  image: string;
  width: number;
  height: number;
}

export interface SpriteAtlasData {
  meta: {
    image: string;
    width: number;
    height: number;
    pageCount?: number;
    pages?: SpritePageMeta[];
    pixelScale: number;
    unitScale?: number;
    frameCount: number;
    version: number;
    hash?: string;
  };
  frames: Record<string, SpriteFrame>;
}

/** 1 sprite pixel = 2 logical world units for bases, turrets, projectiles, and ground tiles */
export const PIXEL_WORLD_SCALE = 2;

/** HD 1:1 pixel density for all 40 detailed character & heavy war-machine sprites */
export const UNIT_WORLD_SCALE = 1;

const atlasData: SpriteAtlasData = SPRITE_ATLAS_JSON as SpriteAtlasData;
const sheetImages: Array<HTMLImageElement | null> = SPRITE_SHEET_URLS.map(() => null);
let loadedCount = 0;
let loadPromise: Promise<void> | null = null;
const readyListeners: Array<() => void> = [];

function notifyListeners(): void {
  for (const cb of readyListeners) {
    try {
      cb();
    } catch {
      // ignore listener error
    }
  }
}

export function isSpriteAtlasReady(): boolean {
  return loadedCount > 0;
}

export function isAllSpriteSheetsLoaded(): boolean {
  return loadedCount >= SPRITE_SHEET_URLS.length;
}

export function getSpriteFrame(key: string): SpriteFrame | null {
  return atlasData.frames[key] ?? null;
}

export function getSpriteSheet(page = 0): HTMLImageElement | null {
  return sheetImages[page] ?? null;
}

export function getSpriteAtlas(): SpriteAtlasData {
  return atlasData;
}

export function onSpriteAtlasReady(cb: () => void): void {
  readyListeners.push(cb);
  if (loadedCount > 0) {
    cb();
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error(`Decoded image had zero size: ${src}`));
      }
    };
    img.onerror = () => reject(new Error(`Image load error: ${src}`));
    img.src = src;
  });
}

async function loadImageViaBlob(url: string): Promise<HTMLImageElement> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} loading ${url}`);
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  try {
    return await loadImageElement(objUrl);
  } finally {
    // Keep object URL briefly? Once loaded into HTMLImageElement on WebKit, revoking on next tick is safe
    window.setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
  }
}

async function loadSheetWithRetry(url: string): Promise<HTMLImageElement> {
  // Attempt 1: direct native Image load (fastest, uses HTTP cache for immutable hashed Vite PNG)
  try {
    return await loadImageElement(url);
  } catch {
    // Attempt 2: fetch -> Blob -> ObjectURL fallback (bypasses Safari Image pipeline edge cases)
    try {
      return await loadImageViaBlob(url);
    } catch {
      // Attempt 3: cache-busted retry after brief backoff
      await new Promise((r) => window.setTimeout(r, 250));
      const sep = url.includes('?') ? '&' : '?';
      return await loadImageElement(`${url}${sep}retry=1`);
    }
  }
}

export function loadSpriteAtlas(_basePath?: string): Promise<void> {
  if (loadPromise) return loadPromise;
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  loadPromise = Promise.all(
    SPRITE_SHEET_URLS.map(async (url, idx) => {
      try {
        const img = await loadSheetWithRetry(url);
        sheetImages[idx] = img;
        loadedCount += 1;
        // Fire listeners progressively as each compact sheet decodes so HUD icons appear immediately!
        notifyListeners();
      } catch (err) {
        console.error(`[SpriteAtlas] Failed loading sheet page ${idx} (${url}):`, err);
      }
    }),
  ).then(() => undefined);

  return loadPromise;
}

export interface DrawSpriteOptions {
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  flipX?: boolean;
  flipY?: boolean;
  rotation?: number;
  alpha?: number;
}

/**
 * Draw a crisp, non-smoothed pixel-art sprite from the atlas anchored at (worldX, worldY).
 * Always enforces ctx.imageSmoothingEnabled = false.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  key: string,
  worldX: number,
  worldY: number,
  opts: DrawSpriteOptions = {},
): boolean {
  const frame = atlasData.frames[key];
  if (!frame) return false;
  const sheetImage = sheetImages[frame.page ?? 0];
  if (!sheetImage) return false;

  const baseScale = opts.scale ?? PIXEL_WORLD_SCALE;
  const sxMult = (opts.scaleX ?? 1) * (opts.flipX ? -1 : 1);
  const syMult = (opts.scaleY ?? 1) * (opts.flipY ? -1 : 1);
  const rot = opts.rotation ?? 0;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (opts.alpha !== undefined && opts.alpha < 1) {
    ctx.globalAlpha *= Math.max(0, opts.alpha);
  }

  if (rot === 0) {
    const sx = Math.round(worldX);
    const sy = Math.round(worldY);
    ctx.translate(sx, sy);
    if (sxMult !== 1 || syMult !== 1) {
      ctx.scale(sxMult, syMult);
    }
  } else {
    ctx.translate(worldX, worldY);
    ctx.rotate(rot);
    if (sxMult !== 1 || syMult !== 1) {
      ctx.scale(sxMult, syMult);
    }
  }

  ctx.drawImage(
    sheetImage,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    Math.round(-frame.anchorX * baseScale),
    Math.round(-frame.anchorY * baseScale),
    Math.round(frame.w * baseScale),
    Math.round(frame.h * baseScale),
  );

  ctx.restore();
  return true;
}

/**
 * Render a tight-cropped sprite frame crisply centered into a PNG data URL (for HUD cards & queue slots).
 */
export function renderSpriteToDataUrl(
  key: string,
  canvasW: number,
  canvasH: number,
  padding = 6,
): string | null {
  if (typeof document === 'undefined') return null;
  const frame = atlasData.frames[key];
  if (!frame) return null;
  const sheetImage = sheetImages[frame.page ?? 0];
  if (!sheetImage) return null;

  // Measure tight non-transparent bounding box so HD sprites fill HUD action cards boldly
  const probe = document.createElement('canvas');
  probe.width = frame.w;
  probe.height = frame.h;
  const pCtx = probe.getContext('2d');
  if (!pCtx) return null;
  pCtx.imageSmoothingEnabled = false;
  pCtx.drawImage(sheetImage, frame.x, frame.y, frame.w, frame.h, 0, 0, frame.w, frame.h);

  let minX = 0;
  let minY = 0;
  let maxX = frame.w - 1;
  let maxY = frame.h - 1;
  try {
    const imgData = pCtx.getImageData(0, 0, frame.w, frame.h).data;
    let found = false;
    let bx0 = frame.w;
    let by0 = frame.h;
    let bx1 = 0;
    let by1 = 0;
    for (let y = 0; y < frame.h; y++) {
      const row = y * frame.w;
      for (let x = 0; x < frame.w; x++) {
        if (imgData[(row + x) * 4 + 3] > 20) {
          found = true;
          if (x < bx0) bx0 = x;
          if (x > bx1) bx1 = x;
          if (y < by0) by0 = y;
          if (y > by1) by1 = y;
        }
      }
    }
    if (found) {
      minX = bx0;
      minY = by0;
      maxX = bx1;
      maxY = by1;
    }
  } catch {
    // Fallback to full frame
  }

  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;

  const maxW = Math.max(1, canvasW - padding * 2);
  const maxH = Math.max(1, canvasH - padding * 2);
  const rawScale = Math.min(maxW / cropW, maxH / cropH);
  const scale = rawScale >= 1 ? Math.max(1, Math.floor(rawScale * 2) / 2) : rawScale;

  const drawW = Math.round(cropW * scale);
  const drawH = Math.round(cropH * scale);
  const dx = Math.round((canvasW - drawW) / 2);
  const dy = Math.round((canvasH - drawH) / 2);

  ctx.drawImage(sheetImage, frame.x + minX, frame.y + minY, cropW, cropH, dx, dy, drawW, drawH);
  return canvas.toDataURL('image/png');
}
