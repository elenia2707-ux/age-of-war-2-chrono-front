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
    frameCount: number;
    version: number;
  };
  frames: Record<string, SpriteFrame>;
}

/** 1 sprite pixel = 2 logical world units across units, bases, turrets, projectiles, and ground tiles */
export const PIXEL_WORLD_SCALE = 2;

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

  loadPromise = (async () => {
    const res = await fetch(`${basePath}sprites_atlas.json`);
    if (!res.ok) {
      throw new Error(`Failed to load sprites_atlas.json (${res.status})`);
    }
    const parsed = (await res.json()) as SpriteAtlasData;
    atlasData = parsed;

    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (err) => reject(err);
      img.src = `${basePath}${parsed.meta.image}`;
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

  const scale = opts.scale ?? PIXEL_WORLD_SCALE;
  const flipX = opts.flipX ? -1 : 1;
  const flipY = opts.flipY ? -1 : 1;
  const rot = opts.rotation ?? 0;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (opts.alpha !== undefined && opts.alpha < 1) {
    ctx.globalAlpha *= Math.max(0, opts.alpha);
  }

  if (rot === 0) {
    // Snap unrotated sprites to whole world coordinates to eliminate pixel shimmer
    const sx = Math.round(worldX);
    const sy = Math.round(worldY);
    ctx.translate(sx, sy);
    if (flipX !== 1 || flipY !== 1) {
      ctx.scale(flipX, flipY);
    }
  } else {
    ctx.translate(worldX, worldY);
    ctx.rotate(rot);
    if (flipX !== 1 || flipY !== 1) {
      ctx.scale(flipX, flipY);
    }
  }

  ctx.drawImage(
    sheetImage,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    Math.round(-frame.anchorX * scale),
    Math.round(-frame.anchorY * scale),
    Math.round(frame.w * scale),
    Math.round(frame.h * scale),
  );

  ctx.restore();
  return true;
}

/**
 * Render a sprite frame crisply centered into a PNG data URL (for HUD action cards & queue slots).
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

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;

  // Prefer crisp integer scaling when possible so HUD icons look ultra-sharp
  const maxW = Math.max(1, canvasW - padding * 2);
  const maxH = Math.max(1, canvasH - padding * 2);
  const rawScale = Math.min(maxW / frame.w, maxH / frame.h);
  const scale = rawScale >= 1 ? Math.max(1, Math.floor(rawScale * 2) / 2) : rawScale;

  const drawW = Math.round(frame.w * scale);
  const drawH = Math.round(frame.h * scale);
  const dx = Math.round((canvasW - drawW) / 2);
  const dy = Math.round((canvasH - drawH) / 2);

  ctx.drawImage(sheetImage, frame.x, frame.y, frame.w, frame.h, dx, dy, drawW, drawH);
  return canvas.toDataURL('image/png');
}
