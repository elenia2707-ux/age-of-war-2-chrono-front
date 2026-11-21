import { SPRITE_ATLAS_VERSION } from '../data/spriteManifest';

/**
 * Pixel-art Sprite Sheet & JSON Atlas loader and crisp nearest-neighbor blitter.
 * Loads public/sprites/sprites_atlas.json + public/sprites/sprites_sheet.png.
 */

export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
}

export interface SpriteAtlasData {
  meta: {
    image: string;
    width: number;
    height: number;
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

let atlasData: SpriteAtlasData | null = null;
let sheetImage: HTMLImageElement | null = null;
let ready = false;
let loadPromise: Promise<void> | null = null;
const readyListeners: Array<() => void> = [];

export function isSpriteAtlasReady(): boolean {
  return ready && atlasData !== null && sheetImage !== null;
}

export function getSpriteFrame(key: string): SpriteFrame | null {
  if (!atlasData) return null;
  return atlasData.frames[key] ?? null;
}

export function getSpriteSheet(): HTMLImageElement | null {
  return ready ? sheetImage : null;
}

export function getSpriteAtlas(): SpriteAtlasData | null {
  return atlasData;
}

export function onSpriteAtlasReady(cb: () => void): void {
  if (isSpriteAtlasReady()) {
    cb();
  } else {
    readyListeners.push(cb);
  }
}

export function loadSpriteAtlas(basePath = './sprites/'): Promise<void> {
  if (loadPromise) return loadPromise;
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  const bust = `?v=${encodeURIComponent(SPRITE_ATLAS_VERSION)}`;

  loadPromise = (async () => {
    const res = await fetch(`${basePath}sprites_atlas.json${bust}`, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`Failed to load sprites_atlas.json (${res.status})`);
    }
    const parsed = (await res.json()) as SpriteAtlasData;
    atlasData = parsed;

    const imgBust = parsed.meta.hash ? `?v=${encodeURIComponent(parsed.meta.hash)}` : bust;
    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (err) => reject(err);
      img.src = `${basePath}${parsed.meta.image}${imgBust}`;
    });

    sheetImage = img;
    ready = true;

    for (const cb of readyListeners.splice(0, readyListeners.length)) {
      cb();
    }
  })().catch((err) => {
    console.error('[SpriteAtlas] Load error:', err);
  });

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
  if (!ready || !sheetImage || !atlasData) return false;
  const frame = atlasData.frames[key];
  if (!frame) return false;

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
  if (typeof document === 'undefined' || !ready || !sheetImage || !atlasData) return null;
  const frame = atlasData.frames[key];
  if (!frame) return null;

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
