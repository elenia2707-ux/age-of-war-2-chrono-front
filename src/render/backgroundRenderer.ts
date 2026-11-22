import { getEra } from '../data/eras';
import { GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from '../game/constants';
import { INK, drawCelEllipse, drawCelPoly, drawCelRoundRect, setInkStyle } from './cartoonPrimitives';

// ============================================================================
// OFFSCREEN PARALLAX LAYER & GROUND TILE CACHE (iPhone Safari/PWA 60fps)
// ============================================================================
interface EraBgCacheEntry {
  eraIndex: number;
  viewportBucket: number;
  skyCanvas: HTMLCanvasElement;
  skyW: number;
  farCanvas: HTMLCanvasElement;
  farW: number;
  midFarCanvas: HTMLCanvasElement;
  midFarW: number;
  midCanvas: HTMLCanvasElement;
  midW: number;
  groundTile: HTMLCanvasElement;
  groundTileW: number;
  groundYOffset: number;
}

const eraBgCache = new Map<string, EraBgCacheEntry>();
const MAX_CACHED_ERAS = 2;
const BG_CACHE_SCALE = 1.25;

export function clearBackgroundCache(): void {
  eraBgCache.clear();
}

export function getBackgroundCacheSize(): number {
  return eraBgCache.size;
}

function createLayerCanvas(
  worldW: number,
  worldH: number,
  scale = BG_CACHE_SCALE,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(worldW * scale));
  canvas.height = Math.max(1, Math.ceil(worldH * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  return { canvas, ctx };
}

function getOrBuildEraBgCache(eraIndex: number, viewportW: number): EraBgCacheEntry | null {
  if (typeof document === 'undefined') return null;
  // Quantize viewport width to 64px buckets so minor resizes don't thrash cache
  const viewportBucket = Math.max(832, Math.ceil(viewportW / 64) * 64);
  const key = `${eraIndex}:${viewportBucket}`;
  const existing = eraBgCache.get(key);
  if (existing) {
    eraBgCache.delete(key);
    eraBgCache.set(key, existing);
    return existing;
  }

  const era = getEra(eraIndex);
  const p = era.palette;
  const maxScroll = Math.max(0, WORLD_WIDTH - viewportBucket) + 120;
  const skyH = GROUND_Y + 8;

  // 1. Sky + Horizon Bloom + Sun + God-Rays + Nebula (0.045x parallax)
  const skyW = Math.ceil(viewportBucket + maxScroll * 0.045 + 32);
  const skyLayer = createLayerCanvas(skyW, skyH);
  if (!skyLayer) return null;
  drawStaticSkyAndAtmosphere(skyLayer.ctx, eraIndex, skyW, viewportBucket, p);

  // 2. Far Horizon Landmarks + First Atmospheric Depth Haze (0.14x parallax)
  const farW = Math.ceil(viewportBucket + maxScroll * 0.14 + 48);
  const farLayer = createLayerCanvas(farW, skyH);
  if (!farLayer) return null;
  drawFarLayer(farLayer.ctx, eraIndex, 0, farW, 1.8, p.farHill, p.sunColor, p.accent);
  drawDepthHaze(farLayer.ctx, eraIndex, farW, 130, 0.72);

  // 3. Mid-Far Architectural Skyline + Second Soft Haze Veil (0.27x parallax)
  const midFarW = Math.ceil(viewportBucket + maxScroll * 0.27 + 64);
  const midFarLayer = createLayerCanvas(midFarW, skyH);
  if (!midFarLayer) return null;
  drawMidFarLayer(midFarLayer.ctx, eraIndex, 0, midFarW, 1.8, p.farHill, p.midHill, p.sunColor, p.accent);
  drawDepthHaze(midFarLayer.ctx, eraIndex, midFarW, 92, 0.56);

  // 4. Mid Rolling Hills & Era Props (0.44x parallax)
  const midW = Math.ceil(viewportBucket + maxScroll * 0.44 + 80);
  const midLayer = createLayerCanvas(midW, skyH);
  if (!midLayer) return null;
  drawMidLayer(midLayer.ctx, eraIndex, 0, midW, 1.8, p.midHill, p.nearProp, p.accent);

  // 5. Repeating Ground Road Tile Strip (256px = 4x 64px seamless road tiles, 1.0x)
  const groundTileW = 256;
  const groundYOffset = GROUND_Y - 5;
  const groundTileH = WORLD_HEIGHT - groundYOffset + 40;
  const groundLayer = createLayerCanvas(groundTileW, groundTileH, 1.5);
  if (!groundLayer) return null;
  groundLayer.ctx.translate(0, -groundYOffset);
  drawCartoonGround(
    groundLayer.ctx,
    eraIndex,
    0,
    groundTileW,
    p.groundTop,
    p.groundMid,
    p.groundDark,
    p.accent,
  );

  const entry: EraBgCacheEntry = {
    eraIndex,
    viewportBucket,
    skyCanvas: skyLayer.canvas,
    skyW,
    farCanvas: farLayer.canvas,
    farW,
    midFarCanvas: midFarLayer.canvas,
    midFarW,
    midCanvas: midLayer.canvas,
    midW,
    groundTile: groundLayer.canvas,
    groundTileW,
    groundYOffset,
  };

  if (eraBgCache.size >= MAX_CACHED_ERAS) {
    const oldestKey = eraBgCache.keys().next().value;
    if (oldestKey !== undefined) eraBgCache.delete(oldestKey);
  }
  eraBgCache.set(key, entry);
  return entry;
}

function drawStaticSkyAndAtmosphere(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  skyW: number,
  viewportW: number,
  p: ReturnType<typeof getEra>['palette'],
): void {
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y + 6);
  skyGrad.addColorStop(0, p.skyTop);
  skyGrad.addColorStop(0.5, p.skyMid);
  skyGrad.addColorStop(0.86, p.skyBottom);
  skyGrad.addColorStop(1, p.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, skyW + 4, GROUND_Y + 6);

  const horGlow = ctx.createLinearGradient(0, GROUND_Y - 145, 0, GROUND_Y);
  horGlow.addColorStop(0, 'rgba(255,255,255,0)');
  horGlow.addColorStop(
    1,
    eraIndex === 11
      ? 'rgba(94, 234, 212, 0.22)'
      : eraIndex === 10
        ? 'rgba(192, 132, 252, 0.22)'
        : eraIndex === 9
          ? 'rgba(56, 189, 248, 0.20)'
          : eraIndex === 7
            ? 'rgba(249, 115, 22, 0.22)'
            : eraIndex === 3
              ? 'rgba(251, 207, 232, 0.24)'
              : 'rgba(254, 240, 138, 0.16)',
  );
  ctx.fillStyle = horGlow;
  ctx.fillRect(0, GROUND_Y - 145, skyW + 4, 145);

  drawSkyAtmosphere(ctx, eraIndex, 0, viewportW, 1.8, p.sunColor, p.accent);
}

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  transition?: { active: boolean; fromEra: number; toEra: number; progress: number },
  lowDetail = false,
): void {
  ctx.save();

  if (transition && transition.active) {
    const p = easeInOut(transition.progress);
    renderSingleEraBackground(ctx, transition.fromEra, cameraX, viewportW, time, lowDetail);
    ctx.save();
    ctx.globalAlpha = p;
    renderSingleEraBackground(ctx, transition.toEra, cameraX, viewportW, time, lowDetail);
    ctx.restore();

    // Sweeping vertical Chrono-Wave light curtain & golden prism edge across screen during evolution!
    const sweepX = -60 + p * (viewportW + 120);
    const waveAlpha = Math.sin(transition.progress * Math.PI);
    if (waveAlpha > 0.01) {
      const toAccent = getEra(transition.toEra).palette.accent;
      ctx.fillStyle = `rgba(255, 236, 165, ${(waveAlpha * 0.22).toFixed(3)})`;
      ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT);

      ctx.fillStyle = `rgba(254, 240, 138, ${(waveAlpha * 0.42).toFixed(3)})`;
      ctx.fillRect(sweepX - 36, 0, 72, WORLD_HEIGHT);
      ctx.fillStyle = toAccent;
      ctx.globalAlpha = waveAlpha * 0.55;
      ctx.fillRect(sweepX - 10, 0, 20, WORLD_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = waveAlpha * 0.85;
      ctx.fillRect(sweepX - 3, 0, 6, WORLD_HEIGHT);
    }
    ctx.restore();
    return;
  }

  renderSingleEraBackground(ctx, eraIndex, cameraX, viewportW, time, lowDetail);
  ctx.restore();
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function wrapScroll(raw: number, span: number, pad: number): number {
  return (((raw % span) + span) % span) - pad;
}

function renderSingleEraBackground(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  lowDetail = false,
): void {
  const era = getEra(eraIndex);
  const p = era.palette;

  // Fast Path (Browser / iPhone Safari / PWA): blit pre-baked multi-layer offscreen parallax strips!
  const cached = getOrBuildEraBgCache(eraIndex, viewportW);
  if (cached) {
    const skyH = GROUND_Y + 8;
    const clampedCam = Math.max(0, cameraX);

    // 1. Sky + Sun + God-Rays + Nebula (0.045x)
    const skyShift = Math.min(cached.skyW - viewportW, clampedCam * 0.045);
    ctx.drawImage(cached.skyCanvas, -skyShift, 0, cached.skyW, skyH);

    // 2. Live subtle twinkling star highlights for night/sci-fi/cosmic/chrono eras (zero gradients!)
    if (eraIndex >= 8 && !lowDetail) {
      const starCount = eraIndex === 8 ? 10 : 18;
      ctx.fillStyle = eraIndex === 11 ? '#fef08a' : '#e0f2fe';
      for (let i = 0; i < starCount; i++) {
        const sx = wrapScroll(i * 197 + 41 - clampedCam * 0.03, viewportW + 40, 20);
        const sy = 16 + ((i * 83) % (eraIndex === 8 ? 112 : 185));
        ctx.globalAlpha = 0.25 + 0.72 * Math.abs(Math.sin(time * 2.3 + i * 1.4));
        ctx.fillRect(sx - 1.2, sy - 1.2, 2.4, 2.4);
      }
      ctx.globalAlpha = 1;
    }

    // 3. Far Parallax Strip + Haze 1 (0.14x)
    const farShift = Math.min(cached.farW - viewportW, clampedCam * 0.14);
    ctx.drawImage(cached.farCanvas, -farShift, 0, cached.farW, skyH);

    // 4. Mid-Far Architectural Parallax Strip + Haze 2 (0.27x)
    const midFarShift = Math.min(cached.midFarW - viewportW, clampedCam * 0.27);
    ctx.drawImage(cached.midFarCanvas, -midFarShift, 0, cached.midFarW, skyH);

    // 5. Mid Rolling Hills & Props Parallax Strip (0.44x)
    const midShift = Math.min(cached.midW - viewportW, clampedCam * 0.44);
    ctx.drawImage(cached.midCanvas, -midShift, 0, cached.midW, skyH);

    // 6. Ambient Drifting Era Motes
    if (!lowDetail) {
      drawAmbientMotes(ctx, eraIndex, clampedCam, viewportW, time, p.accent);
    }

    // 7. Repeating Seamless Battlefield Road Tile Strip (1.0x)
    const tileW = cached.groundTileW;
    const tileH = WORLD_HEIGHT - cached.groundYOffset + 40;
    const offsetX = -(((clampedCam % tileW) + tileW) % tileW);
    for (let x = offsetX; x < viewportW + tileW; x += tileW) {
      ctx.drawImage(cached.groundTile, x, cached.groundYOffset, tileW, tileH);
    }
    return;
  }

  // Direct Vector Fallback (Node/Vitest headless verification)
  // 1. Rich Multi-Stop Painterly Sky Gradient + Horizon Atmospheric Glow
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y + 6);
  skyGrad.addColorStop(0, p.skyTop);
  skyGrad.addColorStop(0.5, p.skyMid);
  skyGrad.addColorStop(0.86, p.skyBottom);
  skyGrad.addColorStop(1, p.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewportW + 4, GROUND_Y + 6);

  // Subtle luminous horizon bloom so far silhouettes read crisply
  const horGlow = ctx.createLinearGradient(0, GROUND_Y - 145, 0, GROUND_Y);
  horGlow.addColorStop(0, 'rgba(255,255,255,0)');
  horGlow.addColorStop(
    1,
    eraIndex === 11
      ? 'rgba(94, 234, 212, 0.22)'
      : eraIndex === 10
        ? 'rgba(192, 132, 252, 0.22)'
        : eraIndex === 9
          ? 'rgba(56, 189, 248, 0.20)'
          : eraIndex === 7
            ? 'rgba(249, 115, 22, 0.22)'
            : eraIndex === 3
              ? 'rgba(251, 207, 232, 0.24)'
              : 'rgba(254, 240, 138, 0.16)',
  );
  ctx.fillStyle = horGlow;
  ctx.fillRect(0, GROUND_Y - 145, viewportW + 4, 145);

  // 2. Celestial Atmosphere + Volumetric God-Rays + Cel-Shaded Clouds + Living Sky Craft
  drawSkyAtmosphere(ctx, eraIndex, cameraX, viewportW, time, p.sunColor, p.accent);

  // 3. Far Parallax Horizon & Monumental Landmarks (0.14x)
  drawFarLayer(ctx, eraIndex, cameraX, viewportW, time, p.farHill, p.sunColor, p.accent);

  // 4. First Atmospheric Depth Haze Veil (separates Far & Mid-Far planes!)
  drawDepthHaze(ctx, eraIndex, viewportW, 130, 0.72);

  // 5. Mid-Far Architectural / Scenic Living Parallax Layer (0.27x)
  drawMidFarLayer(ctx, eraIndex, cameraX, viewportW, time, p.farHill, p.midHill, p.sunColor, p.accent);

  // 6. Second Soft Haze Veil (keeps front-line units razor-sharp against background!)
  drawDepthHaze(ctx, eraIndex, viewportW, 92, 0.56);

  // 7. Mid Parallax Rolling Hills & Hand-Crafted Era Props (0.44x)
  drawMidLayer(ctx, eraIndex, cameraX, viewportW, time, p.midHill, p.nearProp, p.accent);

  // 8. Ambient Drifting Era Motes (Embers / Glints / Sakura / Cyber Sparks / Chrono Stardust)
  drawAmbientMotes(ctx, eraIndex, cameraX, viewportW, time, p.accent);

  // 9. Multi-Layer Hand-Crafted Battlefield Road & Subterranean Strata (1.0x)
  drawCartoonGround(ctx, eraIndex, cameraX, viewportW, p.groundTop, p.groundMid, p.groundDark, p.accent);
}

function drawDepthHaze(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  viewportW: number,
  height: number,
  strength: number,
): void {
  const hazeGrad = ctx.createLinearGradient(0, GROUND_Y - height, 0, GROUND_Y);
  hazeGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  const alpha = (a: number) => (a * strength).toFixed(3);
  hazeGrad.addColorStop(
    1,
    eraIndex === 11
      ? `rgba(45, 212, 191, ${alpha(0.24)})`
      : eraIndex >= 9
        ? `rgba(139, 92, 246, ${alpha(0.20)})`
        : eraIndex === 3
          ? `rgba(251, 207, 232, ${alpha(0.24)})`
          : eraIndex === 1 || eraIndex === 0 || eraIndex === 6
            ? `rgba(251, 146, 60, ${alpha(0.22)})`
            : eraIndex === 7
              ? `rgba(148, 163, 184, ${alpha(0.22)})`
              : `rgba(226, 232, 240, ${alpha(0.18)})`,
  );
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, GROUND_Y - height, viewportW + 4, height);
}

function drawSkyAtmosphere(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  sunColor: string,
  accent: string,
): void {
  const sunX = viewportW * 0.64 - cameraX * 0.045;
  const sunY = eraIndex >= 9 ? 90 : 100;

  ctx.save();

  // Twinkling starfield + sweeping cosmic aurora/nebula for Modern Night (8) & Sci-Fi/Cosmic/Chrono (9, 10, 11)
  if (eraIndex >= 8) {
    if (eraIndex === 10 || eraIndex === 11) {
      const isChrono = eraIndex === 11;
      ctx.save();
      const neb = ctx.createLinearGradient(0, 32, viewportW, 195);
      if (isChrono) {
        neb.addColorStop(0, 'rgba(45, 212, 191, 0.22)');
        neb.addColorStop(0.5, 'rgba(250, 204, 21, 0.26)');
        neb.addColorStop(1, 'rgba(56, 189, 248, 0.22)');
      } else {
        neb.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
        neb.addColorStop(0.5, 'rgba(236, 72, 153, 0.26)');
        neb.addColorStop(1, 'rgba(56, 189, 248, 0.18)');
      }
      ctx.fillStyle = neb;
      ctx.beginPath();
      ctx.moveTo(0, 104 + Math.sin(time * 0.45) * 14);
      ctx.bezierCurveTo(viewportW * 0.28, 38, viewportW * 0.68, 174, viewportW, 82);
      ctx.lineTo(viewportW, 158);
      ctx.bezierCurveTo(viewportW * 0.65, 215, viewportW * 0.32, 104, 0, 172);
      ctx.closePath();
      ctx.fill();

      // Secondary upper translucent aurora silk ribbon
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(0, 62 + Math.cos(time * 0.35) * 10);
      ctx.bezierCurveTo(viewportW * 0.36, 18, viewportW * 0.62, 118, viewportW, 44);
      ctx.lineTo(viewportW, 74);
      ctx.bezierCurveTo(viewportW * 0.62, 140, viewportW * 0.34, 48, 0, 92);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const starCount = eraIndex === 8 ? 24 : 58;
    for (let i = 0; i < starCount; i++) {
      const sx = wrapScroll(i * 197 + 41 - cameraX * 0.03, viewportW + 40, 20);
      const sy = 14 + ((i * 83) % (eraIndex === 8 ? 120 : 196));
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(time * 1.9 + i * 1.3));
      ctx.fillStyle =
        eraIndex === 11
          ? i % 3 === 0
            ? '#fef08a'
            : '#5eead4'
          : i % 5 === 0
            ? '#fef08a'
            : i % 7 === 0
              ? '#f0abfc'
              : '#e0f2fe';
      ctx.globalAlpha = tw * (eraIndex === 8 ? 0.52 : 0.9);
      const r = i % 9 === 0 ? 2.4 : 1.3;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      // 4-point diamond star glint on brightest stars
      if (i % 9 === 0 && eraIndex >= 10) {
        ctx.fillRect(sx - 5.5, sy - 0.6, 11, 1.2);
        ctx.fillRect(sx - 0.6, sy - 5.5, 1.2, 11);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Volumetric Diagonal God-Rays fanning gently from the sun/moon/Chrono star!
  ctx.save();
  ctx.translate(sunX, sunY);
  for (let r = 0; r < 6; r++) {
    const baseAngle = 0.38 + r * 0.41 + Math.sin(time * 0.32 + r) * 0.04;
    ctx.save();
    ctx.rotate(baseAngle);
    const rayGrad = ctx.createLinearGradient(0, 0, 310, 0);
    rayGrad.addColorStop(
      0,
      eraIndex === 11
        ? 'rgba(45, 212, 191, 0.20)'
        : eraIndex >= 9
          ? 'rgba(192, 132, 252, 0.15)'
          : eraIndex === 3
            ? 'rgba(251, 207, 232, 0.16)'
            : 'rgba(254, 240, 138, 0.15)',
    );
    rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(14, -5);
    ctx.lineTo(310, -30);
    ctx.lineTo(310, 30);
    ctx.lineTo(14, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Luminous atmospheric sun / cosmic orb / Chrono star
  const haloR = eraIndex === 1 || eraIndex >= 10 ? 132 : 98;
  const halo = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, haloR);
  halo.addColorStop(0, 'rgba(255,255,255,0.96)');
  halo.addColorStop(0.24, sunColor);
  halo.addColorStop(
    0.58,
    eraIndex === 11
      ? 'rgba(45, 212, 191, 0.34)'
      : eraIndex === 10
        ? 'rgba(168, 85, 247, 0.30)'
        : 'rgba(255, 232, 160, 0.20)',
  );
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, haloR, 0, Math.PI * 2);
  ctx.fill();

  const orbR = eraIndex === 1 || eraIndex >= 10 ? 32 : 24;
  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, orbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.beginPath();
  ctx.arc(sunX - orbR * 0.25, sunY - orbR * 0.25, orbR * 0.36, 0, Math.PI * 2);
  ctx.fill();

  // Era XI (10): Interstellar dual-ringed Saturnian gas giant + orbiting crescent moon + star-cruiser armada!
  if (eraIndex === 10) {
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(-0.26);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.88)';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 68, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240, 171, 252, 0.58)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 80, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Secondary glowing purple-silver crescent moon
    const moonX = sunX - 165;
    const moonY = 64;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#180d36';
    ctx.beginPath();
    ctx.arc(moonX + 5.5, moonY - 2, 12.5, 0, Math.PI * 2);
    ctx.fill();

    // Distant interstellar star-cruiser silhouettes cruising across the cosmos!
    for (let i = 0; i < 3; i++) {
      const span = viewportW + 260;
      const sx = wrapScroll(i * 340 + time * (16 + i * 5) - cameraX * 0.08, span, 130);
      const sy = 56 + i * 38;
      ctx.fillStyle = 'rgba(30, 27, 75, 0.78)';
      ctx.beginPath();
      ctx.moveTo(sx - 26, sy);
      ctx.lineTo(sx - 12, sy - 6);
      ctx.lineTo(sx + 28, sy - 1);
      ctx.lineTo(sx + 16, sy + 5);
      ctx.lineTo(sx - 20, sy + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(sx - 25, sy + 1.5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Era XII (11): Colossal Golden Dyson Chrono-Ring + Slowly Rotating Celestial Astrolabe Gearwork!
  if (eraIndex === 11) {
    ctx.save();
    ctx.translate(sunX, sunY);
    // Faint giant celestial astrolabe ring & clockwork spokes behind the star
    ctx.save();
    ctx.rotate(time * 0.06);
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.24)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 108, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 94, 0, Math.PI * 2);
    ctx.stroke();
    for (let t = 0; t < 12; t++) {
      const a = (t / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 94, Math.sin(a) * 94);
      ctx.lineTo(Math.cos(a) * 112, Math.sin(a) * 112);
      ctx.stroke();
    }
    ctx.restore();

    ctx.rotate(-0.14);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.90)';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 84, 23, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.76)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 64, 60, time * 0.12, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = time * 0.25 + (i / 12) * Math.PI * 2;
      const nx = Math.cos(a) * 84;
      const ny = Math.sin(a) * 23;
      ctx.fillStyle = i % 3 === 0 ? '#fef08a' : '#5eead4';
      ctx.beginPath();
      ctx.arc(nx, ny, i % 3 === 0 ? 3.8 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Sculpted 3-Tone Sunlit Cartoon Cloud Banks + High Cirrus Wisps (Eras 0–8)
  if (eraIndex <= 8) {
    const cloudRim =
      eraIndex === 7
        ? 'rgba(203, 213, 225, 0.28)'
        : eraIndex === 8
          ? 'rgba(148, 163, 184, 0.22)'
          : eraIndex === 3
            ? 'rgba(255, 241, 242, 0.56)'
            : eraIndex === 0 || eraIndex === 1 || eraIndex === 6
              ? 'rgba(254, 240, 199, 0.50)'
              : 'rgba(255, 255, 255, 0.55)';
    const cloudMid =
      eraIndex === 7
        ? 'rgba(100, 116, 139, 0.30)'
        : eraIndex === 8
          ? 'rgba(71, 85, 105, 0.24)'
          : eraIndex === 3
            ? 'rgba(253, 164, 175, 0.34)'
            : eraIndex === 0 || eraIndex === 6
              ? 'rgba(251, 146, 60, 0.24)'
              : 'rgba(226, 232, 240, 0.34)';
    const cloudShadow =
      eraIndex === 7 || eraIndex === 8 ? 'rgba(30, 41, 59, 0.28)' : 'rgba(100, 116, 139, 0.18)';

    // Subtle high-altitude wispy cirrus streaks
    ctx.strokeStyle = cloudRim;
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.6;
    ctx.globalAlpha = 0.45;
    for (let w = 0; w < 4; w++) {
      const wx = wrapScroll(w * 290 + time * 4.5 - cameraX * 0.05, viewportW + 260, 130);
      const wy = 28 + (w % 2) * 20;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.quadraticCurveTo(wx + 42, wy - 6, wx + 88, wy + 1);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Layered sculpted cartoon cumulus clouds with flat bottom shadow & sunlit crest
    for (let i = 0; i < 6; i++) {
      const span = viewportW + 320;
      const cx = wrapScroll(i * 255 + time * (5.5 + i * 1.1) - cameraX * 0.08, span, 160);
      const cy = 50 + (i % 3) * 32;
      const sc = 0.78 + (i % 3) * 0.2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);

      // Flat shaded cloud underside
      ctx.fillStyle = cloudShadow;
      ctx.beginPath();
      ctx.roundRect(-22, 4, 92, 13, 7);
      ctx.fill();

      // Main puffy silhouette
      ctx.fillStyle = cloudMid;
      ctx.beginPath();
      ctx.arc(-4, 2, 18, 0, Math.PI * 2);
      ctx.arc(18, -9, 25, 0, Math.PI * 2);
      ctx.arc(44, -2, 20, 0, Math.PI * 2);
      ctx.arc(62, 4, 14, 0, Math.PI * 2);
      ctx.fill();

      // Bright sunlit upper rim puffs
      ctx.fillStyle = cloudRim;
      ctx.beginPath();
      ctx.arc(-2, -1, 14, 0, Math.PI * 2);
      ctx.arc(19, -12, 21, 0, Math.PI * 2);
      ctx.arc(43, -5, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Era I (0): Detailed prehistoric pterosaurs with head crest & flapping wings!
  if (eraIndex === 0) {
    for (let i = 0; i < 4; i++) {
      const bx = wrapScroll(i * 270 + time * 26 - cameraX * 0.1, viewportW + 220, 90);
      const by = 56 + i * 24 + Math.sin(time * 2.1 + i) * 6;
      const flap = Math.sin(time * 5.2 + i * 2) * 6;
      ctx.fillStyle = 'rgba(69, 26, 3, 0.62)';
      ctx.beginPath();
      ctx.moveTo(bx + 11, by - 1); // sharp beak
      ctx.lineTo(bx + 3, by - 4); // crest
      ctx.lineTo(bx - 6, by + 1);
      ctx.lineTo(bx + 4, by + 2.5);
      ctx.closePath();
      ctx.fill();
      setInkStyle(ctx, 2.2, 'rgba(69, 26, 3, 0.65)');
      ctx.beginPath();
      ctx.moveTo(bx - 15, by + flap);
      ctx.quadraticCurveTo(bx - 5, by - 6, bx, by);
      ctx.quadraticCurveTo(bx + 5, by - 6, bx + 14, by + flap);
      ctx.stroke();
    }
  }

  // Era IV (3): Graceful white Eastern cranes + decorative sunset cloud-scrolls
  if (eraIndex === 3) {
    setInkStyle(ctx, 2.0, 'rgba(255, 241, 242, 0.72)');
    for (let i = 0; i < 5; i++) {
      const bx = wrapScroll(i * 235 + time * 20 - cameraX * 0.09, viewportW + 220, 90);
      const by = 64 + (i % 4) * 20 + Math.sin(time * 1.9 + i) * 5;
      const flap = Math.sin(time * 4.5 + i * 1.7) * 4.8;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by + flap);
      ctx.quadraticCurveTo(bx - 4, by - 5.5, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 5.5, bx + 12, by + flap);
      ctx.stroke();
    }
  }

  // Era VII (6): Drifting Victorian Steampunk Dirigible Airships in the warm sunset sky!
  if (eraIndex === 6) {
    for (let i = 0; i < 2; i++) {
      const ax = wrapScroll(i * 490 + time * (13 + i * 4) - cameraX * 0.09, viewportW + 280, 140);
      const ay = 64 + i * 34 + Math.sin(time * 1.2 + i * 2) * 5;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.scale(0.85 + i * 0.2, 0.85 + i * 0.2);
      // Hull
      ctx.fillStyle = 'rgba(120, 53, 15, 0.72)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(253, 224, 71, 0.28)';
      ctx.beginPath();
      ctx.ellipse(-3, -4, 24, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Tail fins
      ctx.fillStyle = 'rgba(92, 40, 14, 0.75)';
      ctx.beginPath();
      ctx.moveTo(-26, -3);
      ctx.lineTo(-38, -11);
      ctx.lineTo(-34, 0);
      ctx.lineTo(-38, 10);
      ctx.lineTo(-26, 3);
      ctx.closePath();
      ctx.fill();
      // Gondola
      ctx.fillStyle = 'rgba(41, 25, 16, 0.8)';
      ctx.fillRect(-10, 13, 18, 5);
      ctx.strokeStyle = 'rgba(69, 26, 3, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-8, 10);
      ctx.lineTo(-7, 13);
      ctx.moveTo(6, 10);
      ctx.lineTo(5, 13);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Era VIII (7): Sweeping wartime anti-air searchlights + barrage balloons + distant bomber formation!
  if (eraIndex === 7) {
    for (let i = 0; i < 3; i++) {
      const bx = viewportW * (0.18 + i * 0.32) - ((cameraX * 0.1) % 140);
      const ang = -Math.PI / 2 + Math.sin(time * 0.9 + i * 2.1) * 0.42;
      ctx.save();
      ctx.translate(bx, GROUND_Y);
      ctx.rotate(ang);
      const beam = ctx.createLinearGradient(0, 0, 360, 0);
      beam.addColorStop(0, 'rgba(254, 240, 138, 0.26)');
      beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(360, -54);
      ctx.lineTo(360, 54);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Tethered wartime barrage balloons bobbing gently
    for (let b = 0; b < 3; b++) {
      const bx = wrapScroll(b * 340 + 120 - cameraX * 0.11, viewportW + 240, 120);
      const by = 82 + (b % 2) * 28 + Math.sin(time * 1.1 + b * 2) * 4;
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(bx, by + 7);
      ctx.lineTo(bx - 12, GROUND_Y - 30);
      ctx.stroke();
      ctx.fillStyle = 'rgba(51, 65, 85, 0.72)';
      ctx.beginPath();
      ctx.ellipse(bx, by, 17, 8, -0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(bx - 21, by - 5, 6, 10);
    }

    // High-altitude V-formation bomber silhouettes
    const fx = wrapScroll(time * 24 - cameraX * 0.08, viewportW + 300, 150);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.58)';
    for (const [ox, oy] of [
      [0, 56],
      [-24, 48],
      [-24, 64],
      [-48, 41],
      [-48, 71],
    ]) {
      ctx.fillRect(fx + ox - 8, oy - 1, 16, 2.2);
      ctx.fillRect(fx + ox - 2, oy - 6, 3.5, 12);
    }
  }

  // Era IX (8): High-altitude jetliner with glowing contrail & blinking strobe!
  if (eraIndex === 8) {
    const jx = wrapScroll(time * 34 - cameraX * 0.07, viewportW + 360, 180);
    const jy = 52;
    const trail = ctx.createLinearGradient(jx - 110, jy, jx, jy);
    trail.addColorStop(0, 'rgba(226, 232, 240, 0)');
    trail.addColorStop(1, 'rgba(226, 232, 240, 0.28)');
    ctx.strokeStyle = trail;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(jx - 110, jy);
    ctx.lineTo(jx - 4, jy);
    ctx.stroke();
    ctx.fillStyle = 'rgba(241, 245, 249, 0.78)';
    ctx.fillRect(jx - 6, jy - 1, 12, 2.4);
    if (Math.sin(time * 7) > 0.3) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(jx, jy, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Era X (9): Orbital space-elevator energy beam + multi-altitude cyberpunk flying traffic streams!
  if (eraIndex === 9) {
    // Distant orbital elevator light column piercing into space
    const elevX = wrapScroll(viewportW * 0.24 - cameraX * 0.07, viewportW + 320, 120);
    const eGrad = ctx.createLinearGradient(elevX - 18, 0, elevX + 18, 0);
    eGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    eGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.22)');
    eGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = eGrad;
    ctx.fillRect(elevX - 18, 0, 36, GROUND_Y);
    ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.fillRect(elevX - 1.5, 0, 3, GROUND_Y);

    // Flying cyberpunk spinner traffic streaks with trails
    for (let i = 0; i < 10; i++) {
      const span = viewportW + 200;
      const dir = i % 2 === 0 ? 1 : -1;
      const tx = wrapScroll(i * 155 + time * (82 + (i % 3) * 26) * dir - cameraX * 0.12, span, 100);
      const ty = 92 + (i % 4) * 26;
      const c = i % 2 === 0 ? accent : '#f43f5e';
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.roundRect(tx, ty, 22, 2.8, 1.4);
      ctx.fill();
      ctx.globalAlpha = 0.26;
      ctx.fillRect(dir > 0 ? tx - 26 : tx + 22, ty + 0.6, 26, 1.6);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawFarLayer(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  farColor: string,
  sunColor: string,
  accent: string,
): void {
  const offset = -(cameraX * 0.14);
  ctx.save();

  if (eraIndex === 0) {
    // Era I: Stratified Twin Prehistoric Volcanoes with glowing lava rivers & ash plumes
    const spacing = 270;
    const start = Math.floor((-offset - 180) / spacing);
    const end = Math.ceil((viewportW - offset + 180) / spacing);
    for (let i = start; i <= end; i++) {
      const mx = i * spacing + offset;
      const isVolcano = Math.abs(i) % 2 === 1;
      const h = isVolcano ? 162 : 124 + (Math.abs(i * 37) % 38);

      const mGrad = ctx.createLinearGradient(mx, GROUND_Y - h, mx, GROUND_Y);
      mGrad.addColorStop(0, isVolcano ? '#853c20' : farColor);
      mGrad.addColorStop(1, '#3b1e16');
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.moveTo(mx - 150, GROUND_Y);
      if (isVolcano) {
        ctx.lineTo(mx - 82, GROUND_Y - h * 0.52);
        ctx.lineTo(mx - 28, GROUND_Y - h);
        ctx.lineTo(mx + 28, GROUND_Y - h);
        ctx.lineTo(mx + 88, GROUND_Y - h * 0.56);
      } else {
        ctx.quadraticCurveTo(mx - 40, GROUND_Y - h * 0.92, mx, GROUND_Y - h);
        ctx.quadraticCurveTo(mx + 44, GROUND_Y - h * 0.9, mx + 150, GROUND_Y);
      }
      ctx.lineTo(mx + 150, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Sunlit warm ridge highlight on left slope
      ctx.fillStyle = 'rgba(254, 215, 170, 0.14)';
      ctx.beginPath();
      ctx.moveTo(mx - 130, GROUND_Y);
      ctx.lineTo(mx - (isVolcano ? 28 : 4), GROUND_Y - h);
      ctx.lineTo(mx - 12, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      if (isVolcano) {
        const calderaY = GROUND_Y - h;
        const glow = ctx.createRadialGradient(mx, calderaY, 4, mx, calderaY - 8, 60);
        glow.addColorStop(0, 'rgba(251, 146, 60, 0.62)');
        glow.addColorStop(0.5, 'rgba(234, 88, 12, 0.24)');
        glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mx, calderaY - 4, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(mx, calderaY + 2, 26, 5.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(mx, calderaY + 1, 16, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Twin branching lava veins down the volcano face
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.82)';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(mx - 8, calderaY + 3);
        ctx.quadraticCurveTo(mx - 18, calderaY + 28, mx - 30, calderaY + 54);
        ctx.moveTo(mx + 6, calderaY + 4);
        ctx.quadraticCurveTo(mx + 14, calderaY + 20, mx + 22, calderaY + 38);
        ctx.stroke();

        const sOff = (time * 14) % 34;
        ctx.fillStyle = 'rgba(255, 237, 213, 0.22)';
        ctx.beginPath();
        ctx.arc(mx + 4 + sOff * 0.6, calderaY - 14 - sOff * 0.55, 17, 0, Math.PI * 2);
        ctx.arc(mx + 24 + sOff * 0.9, calderaY - 30 - sOff * 0.45, 23, 0, Math.PI * 2);
        ctx.arc(mx + 48 + sOff * 1.1, calderaY - 42 - sOff * 0.35, 28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (eraIndex === 1) {
    // Era II: Grand Giza Pyramid Triad with limestone masonry tiers, gold capstones & Great Sphinx!
    const spacing = 300;
    const start = Math.floor((-offset - 190) / spacing);
    const end = Math.ceil((viewportW - offset + 190) / spacing);
    for (let i = start; i <= end; i++) {
      const px = i * spacing + offset;
      const h = 144 + (Math.abs(i) % 2) * 44;
      const hw = h * 0.94;
      // Shadowed base pyramid
      ctx.fillStyle = farColor;
      ctx.beginPath();
      ctx.moveTo(px - hw, GROUND_Y);
      ctx.lineTo(px, GROUND_Y - h);
      ctx.lineTo(px + hw, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Sunlit golden left face
      ctx.fillStyle = 'rgba(254, 240, 138, 0.32)';
      ctx.beginPath();
      ctx.moveTo(px - hw, GROUND_Y);
      ctx.lineTo(px, GROUND_Y - h);
      ctx.lineTo(px - hw * 0.12, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Subtle stepped limestone masonry courses
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.22)';
      ctx.lineWidth = 1.1;
      for (let tier = 1; tier <= 6; tier++) {
        const frac = tier / 7;
        const ty = GROUND_Y - h * (1 - frac);
        const tw = hw * frac;
        ctx.beginPath();
        ctx.moveTo(px - tw, ty);
        ctx.lineTo(px + tw, ty);
        ctx.stroke();
      }

      // Gleaming gilded pyramidion capstone
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(px - hw * 0.14, GROUND_Y - h * 0.86);
      ctx.lineTo(px, GROUND_Y - h);
      ctx.lineTo(px + hw * 0.14, GROUND_Y - h * 0.86);
      ctx.closePath();
      ctx.fill();

      // Great Sphinx monumental silhouette between pyramids!
      if (Math.abs(i) % 2 === 0) {
        const sx = px + 148;
        ctx.fillStyle = '#854d0e';
        ctx.beginPath();
        ctx.moveTo(sx - 44, GROUND_Y);
        ctx.lineTo(sx - 38, GROUND_Y - 26);
        ctx.lineTo(sx + 6, GROUND_Y - 28);
        ctx.lineTo(sx + 10, GROUND_Y - 48); // nemes headdress
        ctx.lineTo(sx + 24, GROUND_Y - 50);
        ctx.lineTo(sx + 30, GROUND_Y - 36);
        ctx.lineTo(sx + 26, GROUND_Y - 22);
        ctx.lineTo(sx + 48, GROUND_Y - 12); // outstretched stone paws
        ctx.lineTo(sx + 50, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
        ctx.fillRect(sx + 14, GROUND_Y - 47, 10, 4);
      }
    }
  } else if (eraIndex === 3) {
    // Era IV: Misty Guilin Jade Karst Spires + Ornate Illuminated 5-Tier Imperial Pagoda!
    const spacing = 215;
    const start = Math.floor((-offset - 160) / spacing);
    const end = Math.ceil((viewportW - offset + 160) / spacing);
    for (let i = start; i <= end; i++) {
      const mx = i * spacing + offset;
      const h = 132 + (Math.abs(i * 47) % 62);
      const hw = 70 + (Math.abs(i * 23) % 30);
      const mGrad = ctx.createLinearGradient(mx, GROUND_Y - h, mx, GROUND_Y);
      mGrad.addColorStop(0, farColor);
      mGrad.addColorStop(1, '#12242a');
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.moveTo(mx - hw, GROUND_Y);
      ctx.quadraticCurveTo(mx - hw * 0.45, GROUND_Y - h * 0.96, mx, GROUND_Y - h);
      ctx.quadraticCurveTo(mx + hw * 0.45, GROUND_Y - h * 0.92, mx + hw, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Sunlit rosy mist rim on left ridge
      ctx.fillStyle = 'rgba(254, 215, 170, 0.18)';
      ctx.beginPath();
      ctx.moveTo(mx - hw * 0.65, GROUND_Y);
      ctx.quadraticCurveTo(mx - hw * 0.35, GROUND_Y - h * 0.9, mx, GROUND_Y - h);
      ctx.lineTo(mx - hw * 0.08, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Illuminated 4-tier Imperial Pagoda perched atop alternating karst peaks!
      if (Math.abs(i) % 2 === 1) {
        const py = GROUND_Y - h + 6;
        ctx.fillStyle = '#1b313a';
        ctx.fillRect(mx - 15, py - 34, 30, 38);
        for (let t = 0; t < 4; t++) {
          const ty = py - 8 - t * 12;
          const tw = 26 - t * 4.2;
          ctx.beginPath();
          ctx.moveTo(mx - tw - 5, ty + 2);
          ctx.quadraticCurveTo(mx - tw + 2, ty - 2, mx - tw + 5, ty - 7);
          ctx.lineTo(mx + tw - 5, ty - 7);
          ctx.quadraticCurveTo(mx + tw - 2, ty - 2, mx + tw + 5, ty + 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillRect(mx - 1.5, py - 62, 3, 14);
        ctx.fillStyle = 'rgba(254, 240, 138, 0.78)';
        ctx.fillRect(mx - 3.5, py - 18, 7, 4);
        ctx.fillRect(mx - 3, py - 30, 6, 3.8);
        ctx.fillRect(mx - 2.5, py - 42, 5, 3.2);
      }
    }
  } else if (eraIndex === 5) {
    // Era VI (Gunpowder / Age of Sail): Storm-lit Coastal Cliffs + Shimmering Sea + Billowing Tall Galleons!
    const mGrad = ctx.createLinearGradient(0, GROUND_Y - 150, 0, GROUND_Y);
    mGrad.addColorStop(0, farColor);
    mGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.moveTo(-20, GROUND_Y);
    const step = 140;
    const start = Math.floor((-offset - 160) / step);
    const end = Math.ceil((viewportW - offset + 160) / step);
    for (let i = start; i <= end; i++) {
      const x = i * step + offset;
      const isBay = Math.abs(i) % 3 === 1;
      const peakY = isBay ? GROUND_Y - 38 : GROUND_Y - 118 - (Math.abs(i * 29) % 36);
      ctx.lineTo(x, peakY);
    }
    ctx.lineTo(viewportW + 40, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Distant ocean band with shimmering water glints
    const seaY = GROUND_Y - 52;
    const seaGrad = ctx.createLinearGradient(0, seaY, 0, GROUND_Y);
    seaGrad.addColorStop(0, 'rgba(30, 58, 95, 0.72)');
    seaGrad.addColorStop(1, 'rgba(15, 23, 42, 0.88)');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, seaY, viewportW + 4, 52);

    // Shimmering sunlight reflection streaks on the sea
    ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
    for (let s = 0; s < 14; s++) {
      const sx = wrapScroll(s * 92 + Math.sin(time + s) * 8 - cameraX * 0.14, viewportW + 120, 60);
      const sy = seaY + 5 + (s % 4) * 7;
      ctx.fillRect(sx, sy, 22 - (s % 3) * 5, 1.8);
    }

    // Age-of-Sail Tall Galleon Ships gliding gently on the horizon!
    for (let g = 0; g < 3; g++) {
      const gx = wrapScroll(g * 360 + time * (7 + g * 2) - cameraX * 0.15, viewportW + 300, 150);
      const gy = seaY + 6 + Math.sin(time * 1.8 + g * 2) * 1.6;
      ctx.save();
      ctx.translate(gx, gy);
      // Hull
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-26, -2);
      ctx.lineTo(28, -4);
      ctx.lineTo(22, 6);
      ctx.lineTo(-22, 6);
      ctx.closePath();
      ctx.fill();
      // Masts & billowing sunlit white sails
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-12, -2);
      ctx.lineTo(-12, -32);
      ctx.moveTo(4, -3);
      ctx.lineTo(4, -38);
      ctx.moveTo(18, -3);
      ctx.lineTo(18, -26);
      ctx.stroke();
      ctx.fillStyle = 'rgba(241, 245, 249, 0.68)';
      for (const [mx, my, w, h] of [
        [-12, -28, 12, 16],
        [4, -34, 15, 21],
        [18, -22, 9, 13],
      ]) {
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.quadraticCurveTo(mx + w, my + h * 0.45, mx + 1, my + h);
        ctx.lineTo(mx - 2, my + h);
        ctx.quadraticCurveTo(mx + w * 0.55, my + h * 0.45, mx - 2, my);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  } else if (eraIndex === 6 || eraIndex === 8 || eraIndex === 9) {
    // Steampunk Industrial (6) / Modern Night Metropolis + Suspension Bridge (8) / Cyberpunk Skyline (9)!
    if (eraIndex === 6) {
      // Giant animated slowly turning brass clockwork gears behind the Victorian skyline!
      const gearSpacing = 360;
      const gStart = Math.floor((-offset - 160) / gearSpacing);
      const gEnd = Math.ceil((viewportW - offset + 160) / gearSpacing);
      for (let g = gStart; g <= gEnd; g++) {
        const gx = g * gearSpacing + offset + 120;
        const gy = GROUND_Y - 125 - (Math.abs(g) % 2) * 28;
        drawSilhouetteGear(ctx, gx, gy, 48, 12, time * (g % 2 === 0 ? 0.22 : -0.18), 'rgba(180, 83, 9, 0.34)');
        drawSilhouetteGear(ctx, gx + 54, gy + 24, 28, 9, time * (g % 2 === 0 ? -0.35 : 0.3), 'rgba(217, 119, 6, 0.28)');
      }
    }

    if (eraIndex === 8) {
      // Iconic Illuminated Suspension Bridge spanning behind the Modern skyline!
      const brSpan = 620;
      const bStart = Math.floor((-offset - 240) / brSpan);
      const bEnd = Math.ceil((viewportW - offset + 240) / brSpan);
      for (let b = bStart; b <= bEnd; b++) {
        const bx = b * brSpan + offset + 180;
        const t1 = bx - 130;
        const t2 = bx + 130;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.34)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(t1, GROUND_Y);
        ctx.lineTo(t1, GROUND_Y - 158);
        ctx.moveTo(t2, GROUND_Y);
        ctx.lineTo(t2, GROUND_Y - 158);
        ctx.stroke();
        // Main parabolic suspension cable
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.36)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(t1 - 120, GROUND_Y - 76);
        ctx.quadraticCurveTo(t1 - 40, GROUND_Y - 82, t1, GROUND_Y - 154);
        ctx.quadraticCurveTo(bx, GROUND_Y - 72, t2, GROUND_Y - 154);
        ctx.quadraticCurveTo(t2 + 40, GROUND_Y - 82, t2 + 120, GROUND_Y - 76);
        ctx.stroke();
      }
    }

    const spacing = 72;
    const start = Math.floor((-offset - 90) / spacing);
    const end = Math.ceil((viewportW - offset + 90) / spacing);
    for (let i = start; i <= end; i++) {
      const bx = i * spacing + offset;
      const seed = Math.abs(i * 73 + 19);
      const bw = 42 + (seed % 28);
      const bh = 96 + (seed % 116);

      const bGrad = ctx.createLinearGradient(bx, GROUND_Y - bh, bx + bw, GROUND_Y);
      bGrad.addColorStop(0, farColor);
      bGrad.addColorStop(1, '#0b1120');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.roundRect(bx, GROUND_Y - bh, bw, bh, eraIndex === 9 ? [10, 10, 0, 0] : 2);
      ctx.fill();

      if (eraIndex === 6) {
        // Victorian glass domes & billowing smokestacks
        if (seed % 4 === 0) {
          ctx.fillStyle = 'rgba(251, 146, 60, 0.28)';
          ctx.beginPath();
          ctx.arc(bx + bw * 0.5, GROUND_Y - bh, bw * 0.42, Math.PI, 0);
          ctx.fill();
        } else if (seed % 3 === 0) {
          ctx.fillStyle = farColor;
          ctx.fillRect(bx + bw * 0.35, GROUND_Y - bh - 30, 10, 30);
          const puff = (time * 12 + i * 9) % 24;
          ctx.fillStyle = 'rgba(254, 215, 170, 0.22)';
          ctx.beginPath();
          ctx.arc(bx + bw * 0.4 + 10 + puff * 0.6, GROUND_Y - bh - 36 - puff * 0.5, 14, 0, Math.PI * 2);
          ctx.arc(bx + bw * 0.4 + 24 + puff * 0.8, GROUND_Y - bh - 46 - puff * 0.4, 18, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(251, 146, 60, 0.44)';
        for (let wy = GROUND_Y - bh + 22; wy < GROUND_Y - 26; wy += 24) {
          ctx.fillRect(bx + 8, wy, bw - 16, 8);
        }
      } else {
        // Rooftop spire + blinking beacon
        if (bh > 152) {
          ctx.fillStyle = farColor;
          ctx.fillRect(bx + bw / 2 - 1.5, GROUND_Y - bh - 24, 3, 24);
          const blink = Math.sin(time * 4 + i) > 0;
          if (blink) {
            ctx.fillStyle = eraIndex === 9 ? accent : '#ef4444';
            ctx.beginPath();
            ctx.arc(bx + bw / 2, GROUND_Y - bh - 24, 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // Cyberpunk holographic rooftop billboards!
        if (eraIndex === 9 && seed % 3 === 0) {
          const holoCol = seed % 2 === 0 ? '#38bdf8' : '#f472b6';
          ctx.fillStyle = holoCol;
          ctx.globalAlpha = 0.26 + Math.sin(time * 3 + i) * 0.08;
          ctx.fillRect(bx + 5, GROUND_Y - bh - 22, bw - 10, 16);
          ctx.strokeStyle = holoCol;
          ctx.globalAlpha = 0.72;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(bx + 5, GROUND_Y - bh - 22, bw - 10, 16);
          ctx.globalAlpha = 1;
        }

        // Lit office / neon window grid
        ctx.fillStyle = eraIndex === 9 ? accent : 'rgba(254, 240, 138, 0.52)';
        ctx.globalAlpha = eraIndex === 9 ? 0.56 : 0.72;
        for (let wy = GROUND_Y - bh + 12; wy < GROUND_Y - 28; wy += 16) {
          for (let wx = bx + 7; wx < bx + bw - 10; wx += 11) {
            if ((wx + wy + seed) % 3 !== 0) {
              ctx.fillRect(wx, wy, 5, 8);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
    }
  } else if (eraIndex === 10 || eraIndex === 11) {
    // Era XI (10) Cosmic Warp-Gate + Floating Monoliths & Era XII (11) Floating Marble-Gold Celestial Islands!
    const isChrono = eraIndex === 11;
    const spacing = 225;
    const start = Math.floor((-offset - 140) / spacing);
    const end = Math.ceil((viewportW - offset + 140) / spacing);
    for (let i = start; i <= end; i++) {
      const mx = i * spacing + offset;
      const bob = Math.sin(time * 1.1 + i * 1.7) * 7.5;
      const mh = 114 + (Math.abs(i * 41) % 62);
      const my = GROUND_Y - 128 + bob;

      if (isChrono) {
        // Floating Celestial Sanctuary Island with cascading teal-gold light waterfall!
        const wGrad = ctx.createLinearGradient(mx, my + 8, mx, GROUND_Y);
        wGrad.addColorStop(0, 'rgba(94, 234, 212, 0.42)');
        wGrad.addColorStop(1, 'rgba(94, 234, 212, 0)');
        ctx.fillStyle = wGrad;
        ctx.fillRect(mx - 6, my + 8, 12, GROUND_Y - (my + 8));

        // Island underside crystal keel
        ctx.fillStyle = '#115e59';
        ctx.beginPath();
        ctx.moveTo(mx - 42, my);
        ctx.lineTo(mx + 42, my);
        ctx.lineTo(mx + 14, my + 24);
        ctx.lineTo(mx, my + 42);
        ctx.lineTo(mx - 14, my + 24);
        ctx.closePath();
        ctx.fill();

        // Pearl-gold temple spire rising from the floating island!
        ctx.fillStyle = '#134e4a';
        ctx.beginPath();
        ctx.moveTo(mx - 22, my);
        ctx.lineTo(mx - 8, my - mh * 0.56);
        ctx.lineTo(mx, my - mh * 0.72);
        ctx.lineTo(mx + 8, my - mh * 0.56);
        ctx.lineTo(mx + 22, my);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(254, 240, 138, 0.82)';
        ctx.fillRect(mx - 2.2, my - mh * 0.52, 4.4, mh * 0.5);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.62)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(mx, my - 12, 44, 10, -0.15, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Era XI: Floating obsidian monoliths + giant distant warp-gate ring!
        ctx.fillStyle = farColor;
        ctx.beginPath();
        ctx.moveTo(mx, my - mh * 0.58);
        ctx.lineTo(mx + 28, my);
        ctx.lineTo(mx, my + mh * 0.46);
        ctx.lineTo(mx - 28, my);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.68)';
        ctx.fillRect(mx - 2, my - mh * 0.36, 4, mh * 0.68);
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(mx, my, 38, 8.5, -0.15, 0, Math.PI * 2);
        ctx.stroke();

        // Distant glowing warp-gate ring between monoliths
        if (Math.abs(i) % 2 === 1) {
          const wx = mx + 112;
          const wy = GROUND_Y - 126;
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.48)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(wx, wy, 24, 46, 0.08, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
          ctx.beginPath();
          ctx.ellipse(wx, wy, 19, 39, 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else {
    // Classical (2), Medieval (4), World War (7): Sweeping Sunlit Mountains + Snowcaps + Iconic Distant Silhouettes!
    const mGrad = ctx.createLinearGradient(0, GROUND_Y - 170, 0, GROUND_Y);
    mGrad.addColorStop(0, farColor);
    mGrad.addColorStop(1, '#141a26');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.moveTo(-20, GROUND_Y);
    const step = 120;
    const start = Math.floor((-offset - 140) / step);
    const end = Math.ceil((viewportW - offset + 140) / step);
    for (let i = start; i <= end; i++) {
      const x = i * step + offset;
      const peakY = GROUND_Y - 100 - Math.sin(i * 1.35) * 34 - Math.cos(i * 0.72) * 24;
      const nextX = (i + 1) * step + offset;
      const midX = (x + nextX) * 0.5;
      ctx.quadraticCurveTo(x, peakY, midX, GROUND_Y - 68);
    }
    ctx.lineTo(viewportW + 40, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Medieval alpine snowcaps on high mountain peaks!
    if (eraIndex === 4) {
      ctx.fillStyle = 'rgba(241, 245, 249, 0.36)';
      for (let i = start; i <= end; i++) {
        const x = i * step + offset;
        const peakY = GROUND_Y - 100 - Math.sin(i * 1.35) * 34 - Math.cos(i * 0.72) * 24;
        if (peakY < GROUND_Y - 120) {
          ctx.beginPath();
          ctx.moveTo(x - 22, peakY + 24);
          ctx.quadraticCurveTo(x, peakY + 2, x + 22, peakY + 24);
          ctx.lineTo(x + 8, peakY + 18);
          ctx.lineTo(x, peakY + 25);
          ctx.lineTo(x - 9, peakY + 18);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    ctx.strokeStyle = sunColor;
    ctx.globalAlpha = 0.24;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Grounded Distant Classical Parthenon (2), Medieval Fairy-Tale Citadel (4), or Wartime Ruined Cathedral (7)!
    const lx = wrapScroll(420 + offset, viewportW + 320, 110);
    ctx.fillStyle = farColor;
    if (eraIndex === 2) {
      // Detailed Acropolis Parthenon with fluted columns & glowing marble highlights!
      ctx.beginPath();
      ctx.moveTo(lx - 82, GROUND_Y);
      ctx.lineTo(lx - 52, GROUND_Y - 100);
      ctx.lineTo(lx + 52, GROUND_Y - 100);
      ctx.lineTo(lx + 82, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      // Stylobate steps
      ctx.fillStyle = '#d6d3d1';
      ctx.globalAlpha = 0.65;
      ctx.fillRect(lx - 48, GROUND_Y - 106, 96, 8);
      // 7 Fluted columns
      for (let c = -3; c <= 3; c++) {
        ctx.fillRect(lx + c * 13 - 2.5, GROUND_Y - 134, 5, 28);
      }
      // Architrave & triangular pediment
      ctx.fillRect(lx - 49, GROUND_Y - 139, 98, 5);
      ctx.beginPath();
      ctx.moveTo(lx - 54, GROUND_Y - 139);
      ctx.lineTo(lx, GROUND_Y - 159);
      ctx.lineTo(lx + 54, GROUND_Y - 139);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (eraIndex === 4) {
      // Multi-spired Medieval Citadel with waving royal pennants!
      ctx.beginPath();
      ctx.moveTo(lx - 90, GROUND_Y);
      ctx.lineTo(lx - 50, GROUND_Y - 96);
      ctx.lineTo(lx + 50, GROUND_Y - 96);
      ctx.lineTo(lx + 90, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(lx - 34, GROUND_Y - 144, 68, 52);
      ctx.fillRect(lx - 44, GROUND_Y - 168, 18, 76);
      ctx.fillRect(lx + 26, GROUND_Y - 168, 18, 76);
      ctx.fillRect(lx - 9, GROUND_Y - 182, 18, 50);
      ctx.beginPath();
      ctx.moveTo(lx - 47, GROUND_Y - 168);
      ctx.lineTo(lx - 35, GROUND_Y - 194);
      ctx.lineTo(lx - 23, GROUND_Y - 168);
      ctx.moveTo(lx + 23, GROUND_Y - 168);
      ctx.lineTo(lx + 35, GROUND_Y - 194);
      ctx.lineTo(lx + 47, GROUND_Y - 168);
      ctx.moveTo(lx - 12, GROUND_Y - 182);
      ctx.lineTo(lx, GROUND_Y - 210);
      ctx.lineTo(lx + 12, GROUND_Y - 182);
      ctx.fill();
      // Fluttering crimson royal pennant atop central spire
      const wave = Math.sin(time * 5) * 3;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.72)';
      ctx.beginPath();
      ctx.moveTo(lx, GROUND_Y - 210);
      ctx.lineTo(lx + 15, GROUND_Y - 207 + wave);
      ctx.lineTo(lx, GROUND_Y - 203);
      ctx.closePath();
      ctx.fill();
    } else if (eraIndex === 7) {
      // Wartime shattered cathedral & factory silhouettes + distant smoke plumes
      ctx.fillStyle = '#253041';
      ctx.fillRect(lx - 48, GROUND_Y - 108, 22, 108);
      ctx.fillRect(lx - 26, GROUND_Y - 76, 56, 76);
      ctx.fillRect(lx + 30, GROUND_Y - 122, 18, 122);
      // Rising smoke plume
      const sm = (time * 10) % 24;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.36)';
      ctx.beginPath();
      ctx.arc(lx + 40 + sm * 0.8, GROUND_Y - 130 - sm * 0.5, 16, 0, Math.PI * 2);
      ctx.arc(lx + 58 + sm, GROUND_Y - 144 - sm * 0.4, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * BRAND-NEW Intermediate Parallax Layer (0.27x):
 * Living era-specific architecture & scenic storytelling between far peaks and near hills!
 */
function drawMidFarLayer(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  farColor: string,
  midColor: string,
  sunColor: string,
  accent: string,
): void {
  const offset = -(cameraX * 0.27);
  ctx.save();

  if (eraIndex === 0) {
    // Era I: Prehistoric basalt cliff arches, shimmering jungle waterfall & grazing Brontosaurus silhouettes!
    const spacing = 420;
    const start = Math.floor((-offset - 200) / spacing);
    const end = Math.ceil((viewportW - offset + 200) / spacing);
    for (let i = start; i <= end; i++) {
      const x = i * spacing + offset;
      // Stepped jungle mesa with cascading luminous waterfall!
      ctx.fillStyle = '#4c2c22';
      ctx.beginPath();
      ctx.moveTo(x - 74, GROUND_Y);
      ctx.lineTo(x - 56, GROUND_Y - 96);
      ctx.lineTo(x + 28, GROUND_Y - 96);
      ctx.lineTo(x + 48, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      // Animated waterfall stream + base mist
      const wfGrad = ctx.createLinearGradient(x - 16, GROUND_Y - 94, x - 16, GROUND_Y - 10);
      wfGrad.addColorStop(0, 'rgba(186, 230, 253, 0.58)');
      wfGrad.addColorStop(1, 'rgba(125, 211, 252, 0.14)');
      ctx.fillStyle = wfGrad;
      ctx.fillRect(x - 20, GROUND_Y - 94, 11, 82);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      const dropY = (time * 48) % 24;
      for (let d = 0; d < 3; d++) {
        ctx.fillRect(x - 18 + (d % 2) * 4, GROUND_Y - 90 + d * 24 + dropY * 0.7, 2.5, 9);
      }

      // Grazing Brontosaurus silhouette in the misty valley!
      const dx = x + 150;
      const neckBob = Math.sin(time * 1.4 + i) * 3;
      ctx.fillStyle = '#3f221b';
      ctx.beginPath();
      ctx.ellipse(dx, GROUND_Y - 26, 22, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(dx - 15, GROUND_Y - 22, 6, 22);
      ctx.fillRect(dx + 8, GROUND_Y - 22, 6, 22);
      ctx.strokeStyle = '#3f221b';
      ctx.lineWidth = 6.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dx + 14, GROUND_Y - 29);
      ctx.quadraticCurveTo(dx + 28, GROUND_Y - 52, dx + 38, GROUND_Y - 62 + neckBob);
      ctx.moveTo(dx - 18, GROUND_Y - 26);
      ctx.quadraticCurveTo(dx - 38, GROUND_Y - 20, dx - 52, GROUND_Y - 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(dx + 41, GROUND_Y - 62 + neckBob, 6.5, 3.6, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (eraIndex === 1) {
    // Era II: Shimmering Nile River Oasis Ribbon + Drifting Felucca Sailboats + Distant Karnak Colonnade!
    const nileY = GROUND_Y - 38;
    const nGrad = ctx.createLinearGradient(0, nileY, 0, GROUND_Y - 12);
    nGrad.addColorStop(0, 'rgba(56, 189, 248, 0.34)');
    nGrad.addColorStop(1, 'rgba(14, 116, 144, 0.18)');
    ctx.fillStyle = nGrad;
    ctx.fillRect(0, nileY, viewportW + 4, 24);

    // Distant Karnak temple colonnade silhouettes
    const kSpacing = 440;
    const kStart = Math.floor((-offset - 160) / kSpacing);
    const kEnd = Math.ceil((viewportW - offset + 160) / kSpacing);
    for (let i = kStart; i <= kEnd; i++) {
      const kx = i * kSpacing + offset + 60;
      ctx.fillStyle = 'rgba(146, 64, 14, 0.56)';
      ctx.fillRect(kx - 44, nileY - 34, 88, 6);
      for (let c = 0; c < 6; c++) {
        ctx.fillRect(kx - 40 + c * 15, nileY - 28, 6, 30);
      }
    }

    // Gliding Nile Felucca lateen-sailboats!
    for (let f = 0; f < 3; f++) {
      const fx = wrapScroll(f * 310 + time * 11 - cameraX * 0.27, viewportW + 240, 120);
      const fy = nileY + 8;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(fx - 13, fy);
      ctx.lineTo(fx + 14, fy);
      ctx.lineTo(fx + 9, fy + 4);
      ctx.lineTo(fx - 9, fy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(254, 249, 195, 0.72)';
      ctx.beginPath();
      ctx.moveTo(fx - 2, fy);
      ctx.lineTo(fx + 10, fy - 24);
      ctx.lineTo(fx + 12, fy - 2);
      ctx.closePath();
      ctx.fill();
    }
  } else if (eraIndex === 2) {
    // Era III: Iconic Multi-Arch Roman Stone Aqueduct spanning the Mediterranean valley!
    const archW = 58;
    const aqTop = GROUND_Y - 96;
    const start = Math.floor((-offset - 80) / archW);
    const end = Math.ceil((viewportW - offset + 80) / archW);
    ctx.fillStyle = 'rgba(100, 116, 139, 0.58)';
    ctx.fillRect(0, aqTop, viewportW + 4, 12);
    ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
    ctx.fillRect(0, aqTop, viewportW + 4, 3);
    for (let i = start; i <= end; i++) {
      const ax = i * archW + offset;
      ctx.fillStyle = 'rgba(100, 116, 139, 0.58)';
      ctx.fillRect(ax - 7, aqTop + 10, 14, GROUND_Y - aqTop);
      // Arch spandrels
      ctx.beginPath();
      ctx.moveTo(ax + 7, aqTop + 10);
      ctx.lineTo(ax + archW - 7, aqTop + 10);
      ctx.lineTo(ax + archW - 7, aqTop + 34);
      ctx.arc(ax + archW * 0.5, aqTop + 34, archW * 0.5 - 7, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
    }
  } else if (eraIndex === 3) {
    // Era IV: Great Imperial Wall winding across the misty hills with crenellated watchtowers!
    const step = 110;
    const start = Math.floor((-offset - 120) / step);
    const end = Math.ceil((viewportW - offset + 120) / step);
    ctx.fillStyle = 'rgba(30, 58, 68, 0.78)';
    ctx.beginPath();
    ctx.moveTo(-20, GROUND_Y);
    for (let i = start; i <= end; i++) {
      const x = i * step + offset;
      const wy = GROUND_Y - 58 - Math.sin(i * 0.85) * 18;
      ctx.lineTo(x, wy);
    }
    ctx.lineTo(viewportW + 40, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    // Watchtowers perched along the Great Wall
    for (let i = start; i <= end; i++) {
      if (Math.abs(i) % 2 !== 0) continue;
      const x = i * step + offset;
      const wy = GROUND_Y - 58 - Math.sin(i * 0.85) * 18;
      ctx.fillStyle = '#1f3b44';
      ctx.fillRect(x - 13, wy - 22, 26, 26);
      ctx.beginPath();
      ctx.moveTo(x - 19, wy - 20);
      ctx.lineTo(x - 12, wy - 28);
      ctx.lineTo(x + 12, wy - 28);
      ctx.lineTo(x + 19, wy - 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
      ctx.fillRect(x - 2.5, wy - 15, 5, 5);
    }
  } else if (eraIndex === 4) {
    // Era V: Rolling Medieval Valley with Animated Rotating Timber Windmills & Village Spires!
    const spacing = 310;
    const start = Math.floor((-offset - 160) / spacing);
    const end = Math.ceil((viewportW - offset + 160) / spacing);
    for (let i = start; i <= end; i++) {
      const x = i * spacing + offset + 60;
      const baseY = GROUND_Y - 38;
      if (Math.abs(i) % 2 === 0) {
        // Animated rotating Medieval Windmill!
        ctx.fillStyle = '#2d4739';
        ctx.beginPath();
        ctx.moveTo(x - 14, GROUND_Y);
        ctx.lineTo(x - 8, baseY - 46);
        ctx.lineTo(x + 8, baseY - 46);
        ctx.lineTo(x + 14, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, baseY - 46, 9, Math.PI, 0);
        ctx.fill();
        // Warm glowing cottage window
        ctx.fillStyle = 'rgba(254, 240, 138, 0.72)';
        ctx.fillRect(x - 2.5, baseY - 22, 5, 7);
        // Rotating 4-blade canvas windmill sails!
        ctx.save();
        ctx.translate(x, baseY - 44);
        ctx.rotate(time * 0.65 + i);
        ctx.strokeStyle = '#1e3529';
        ctx.lineWidth = 2.4;
        for (let b = 0; b < 4; b++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -32);
          ctx.stroke();
          ctx.fillStyle = 'rgba(241, 245, 249, 0.56)';
          ctx.fillRect(1, -30, 7, 21);
        }
        ctx.restore();
      } else {
        // Distant medieval hamlet cottages + church bell-tower
        ctx.fillStyle = '#263f33';
        ctx.fillRect(x - 24, baseY - 12, 20, 48);
        ctx.fillRect(x + 4, baseY - 18, 24, 54);
        ctx.fillRect(x - 6, baseY - 42, 12, 78);
        ctx.beginPath();
        ctx.moveTo(x - 8, baseY - 42);
        ctx.lineTo(x, baseY - 62);
        ctx.lineTo(x + 8, baseY - 42);
        ctx.fill();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.58)';
        ctx.fillRect(x - 18, baseY - 5, 4, 4);
        ctx.fillRect(x + 12, baseY - 9, 4, 4);
      }
    }
  } else if (eraIndex === 5) {
    // Era VI: Harbor Star-Fortress Ramparts + Sweeping Coastal Lighthouse Beacon!
    const spacing = 460;
    const start = Math.floor((-offset - 180) / spacing);
    const end = Math.ceil((viewportW - offset + 180) / spacing);
    for (let i = start; i <= end; i++) {
      const lx = i * spacing + offset + 160;
      const topY = GROUND_Y - 102;
      // Sweeping lighthouse light cone
      const beamSweep = Math.sin(time * 1.1 + i) * 0.55;
      ctx.save();
      ctx.translate(lx, topY);
      ctx.rotate(beamSweep > 0 ? 0.12 : Math.PI - 0.12);
      const bGrad = ctx.createLinearGradient(0, 0, 180, 0);
      bGrad.addColorStop(0, `rgba(254, 240, 138, ${(0.32 * Math.abs(Math.cos(time * 1.1 + i))).toFixed(2)})`);
      bGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(180, -28);
      ctx.lineTo(180, 28);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Striped lighthouse tower
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(lx - 11, GROUND_Y);
      ctx.lineTo(lx - 6, topY + 6);
      ctx.lineTo(lx + 6, topY + 6);
      ctx.lineTo(lx + 11, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.fillRect(lx - 4.5, topY - 4, 9, 9);
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(lx - 7, topY - 4);
      ctx.lineTo(lx, topY - 12);
      ctx.lineTo(lx + 7, topY - 4);
      ctx.closePath();
      ctx.fill();
    }
  } else if (eraIndex === 6) {
    // Era VII: Riveted Iron Arched Viaduct + Animated Chugging Steam Locomotive Puffing White Smoke!
    const deckY = GROUND_Y - 72;
    const archW = 76;
    const start = Math.floor((-offset - 90) / archW);
    const end = Math.ceil((viewportW - offset + 90) / archW);
    ctx.fillStyle = 'rgba(41, 25, 18, 0.82)';
    ctx.fillRect(0, deckY, viewportW + 4, 9);
    for (let i = start; i <= end; i++) {
      const ax = i * archW + offset;
      ctx.fillRect(ax - 5, deckY + 8, 10, GROUND_Y - deckY);
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ax + archW * 0.5, deckY + 34, archW * 0.5 - 5, Math.PI, 0);
      ctx.stroke();
    }

    // Animated Steampunk Locomotive + 3 carriages cruising along the viaduct!
    const tx = wrapScroll(time * 54 - cameraX * 0.27, viewportW + 380, 190);
    ctx.fillStyle = '#1c120d';
    // Engine boiler + cab
    ctx.fillRect(tx, deckY - 13, 30, 12);
    ctx.fillRect(tx - 10, deckY - 17, 12, 16);
    ctx.fillRect(tx + 21, deckY - 22, 5, 10); // funnel
    // Carriages with glowing amber windows
    for (let c = 1; c <= 3; c++) {
      const cx = tx - 14 - c * 34;
      ctx.fillStyle = '#1c120d';
      ctx.fillRect(cx, deckY - 13, 30, 12);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.72)';
      ctx.fillRect(cx + 4, deckY - 10, 5, 4);
      ctx.fillRect(cx + 12, deckY - 10, 5, 4);
      ctx.fillRect(cx + 20, deckY - 10, 5, 4);
    }
    // Headlight beam & billowing steam puffs
    ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.beginPath();
    ctx.moveTo(tx + 30, deckY - 8);
    ctx.lineTo(tx + 62, deckY - 15);
    ctx.lineTo(tx + 62, deckY - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 247, 237, 0.34)';
    for (let s = 0; s < 4; s++) {
      const sp = (time * 18 + s * 8) % 30;
      ctx.beginPath();
      ctx.arc(tx + 22 - sp * 1.4, deckY - 24 - sp * 0.65, 5 + sp * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (eraIndex === 7) {
    // Era VIII: Wartime Steel Radar Masts (rotating dishes) & Distant Factory/Ruins Ridge!
    const spacing = 290;
    const start = Math.floor((-offset - 120) / spacing);
    const end = Math.ceil((viewportW - offset + 120) / spacing);
    for (let i = start; i <= end; i++) {
      const rx = i * spacing + offset + 70;
      ctx.strokeStyle = 'rgba(71, 85, 105, 0.68)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx - 10, GROUND_Y);
      ctx.lineTo(rx, GROUND_Y - 88);
      ctx.lineTo(rx + 10, GROUND_Y);
      ctx.moveTo(rx - 7, GROUND_Y - 30);
      ctx.lineTo(rx + 7, GROUND_Y - 30);
      ctx.moveTo(rx - 4, GROUND_Y - 58);
      ctx.lineTo(rx + 4, GROUND_Y - 58);
      ctx.stroke();
      // Sweeping radar dish
      const w = 13 * Math.abs(Math.cos(time * 1.5 + i));
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.72)';
      ctx.beginPath();
      ctx.ellipse(rx, GROUND_Y - 92, Math.max(2, w), 8, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (eraIndex === 8) {
    // Era IX: Elevated Metropolitan Overpass with Moving White Headlights & Red Taillights!
    const deckY = GROUND_Y - 54;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.76)';
    ctx.fillRect(0, deckY, viewportW + 4, 8);
    const pStep = 140;
    const start = Math.floor((-offset - 80) / pStep);
    const end = Math.ceil((viewportW - offset + 80) / pStep);
    for (let i = start; i <= end; i++) {
      ctx.fillRect(i * pStep + offset - 5, deckY + 7, 10, GROUND_Y - deckY);
    }
    // Moving city traffic streaks
    for (let c = 0; c < 10; c++) {
      const dir = c % 2 === 0 ? 1 : -1;
      const cx = wrapScroll(c * 145 + time * (52 + (c % 3) * 14) * dir - cameraX * 0.27, viewportW + 180, 90);
      ctx.fillStyle = dir > 0 ? 'rgba(254, 240, 138, 0.78)' : 'rgba(248, 113, 113, 0.75)';
      ctx.fillRect(cx, deckY - 3.5, 9, 2.6);
    }
  } else if (eraIndex === 9) {
    // Era X: Cyberpunk Maglev Monorail + Zooming Neon Bullet-Train!
    const trackY = GROUND_Y - 68;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, trackY, viewportW + 4, 7);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.fillRect(0, trackY + 2, viewportW + 4, 2);
    const pStep = 160;
    const start = Math.floor((-offset - 90) / pStep);
    const end = Math.ceil((viewportW - offset + 90) / pStep);
    for (let i = start; i <= end; i++) {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
      ctx.fillRect(i * pStep + offset - 6, trackY + 6, 12, GROUND_Y - trackY);
    }
    // Zooming neon maglev train
    const tx = wrapScroll(time * 185 - cameraX * 0.27, viewportW + 520, 260);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(tx, trackY - 10, 128, 10, [4, 10, 2, 2]);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(tx + 8, trackY - 6, 112, 3);
    // Glowing speed trail
    const tGrad = ctx.createLinearGradient(tx - 65, trackY - 5, tx, trackY - 5);
    tGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    tGrad.addColorStop(1, 'rgba(56, 189, 248, 0.55)');
    ctx.fillStyle = tGrad;
    ctx.fillRect(tx - 65, trackY - 7, 65, 4);
  } else if (eraIndex === 10) {
    // Era XI: Interstellar Crystal Spires linked by Shimmering Violet Energy Bridges!
    const spacing = 260;
    const start = Math.floor((-offset - 120) / spacing);
    const end = Math.ceil((viewportW - offset + 120) / spacing);
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.34)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = start; i <= end; i++) {
      const x = i * spacing + offset;
      const y = GROUND_Y - 72 - (Math.abs(i) % 2) * 20;
      if (i === start) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = start; i <= end; i++) {
      const x = i * spacing + offset;
      const y = GROUND_Y - 72 - (Math.abs(i) % 2) * 20;
      ctx.fillStyle = 'rgba(59, 7, 100, 0.72)';
      ctx.beginPath();
      ctx.moveTo(x - 16, GROUND_Y);
      ctx.lineTo(x, y - 14);
      ctx.lineTo(x + 16, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(x, y - 12, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (eraIndex === 11) {
    // Era XII: Grand Marble-Gold Celestial Chrono-Arches & Shimmering Light Curtains!
    const archW = 130;
    const topY = GROUND_Y - 88;
    const start = Math.floor((-offset - 140) / archW);
    const end = Math.ceil((viewportW - offset + 140) / archW);
    for (let i = start; i <= end; i++) {
      const ax = i * archW + offset;
      // Shimmering vertical teal light curtain inside each celestial arch
      const curtain = ctx.createLinearGradient(ax + archW * 0.5, topY + 12, ax + archW * 0.5, GROUND_Y);
      curtain.addColorStop(0, 'rgba(94, 234, 212, 0.22)');
      curtain.addColorStop(1, 'rgba(94, 234, 212, 0)');
      ctx.fillStyle = curtain;
      ctx.fillRect(ax + 18, topY + 24, archW - 36, GROUND_Y - topY);

      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(ax + 12, GROUND_Y);
      ctx.lineTo(ax + 12, topY + 34);
      ctx.arc(ax + archW * 0.5, topY + 34, archW * 0.5 - 12, Math.PI, 0);
      ctx.lineTo(ax + archW - 12, GROUND_Y);
      ctx.stroke();

      // Golden diamond apex rune
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(ax + archW * 0.5, topY + 4, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  void farColor;
  void midColor;
  void sunColor;
  ctx.restore();
}

function drawSilhouetteGear(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  teeth: number,
  angle: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius - 7;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = 'rgba(254, 215, 170, 0.24)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  for (let s = 0; s < 4; s++) {
    const a = (s / 4) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (radius * 0.22), Math.sin(a) * (radius * 0.22));
    ctx.lineTo(Math.cos(a) * (radius * 0.55), Math.sin(a) * (radius * 0.55));
    ctx.stroke();
  }
  ctx.restore();
}

function drawMidLayer(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  midColor: string,
  propColor: string,
  accent: string,
): void {
  const offset = -(cameraX * 0.44);
  ctx.save();

  // Rolling smooth shaded cartoon hills with crisp sunlit rim!
  const hillGrad = ctx.createLinearGradient(0, GROUND_Y - 78, 0, GROUND_Y);
  hillGrad.addColorStop(0, midColor);
  hillGrad.addColorStop(1, '#101622');
  ctx.fillStyle = hillGrad;
  ctx.beginPath();
  ctx.moveTo(-20, GROUND_Y);
  const step = 160;
  const start = Math.floor((-offset - 180) / step);
  const end = Math.ceil((viewportW - offset + 180) / step);
  for (let i = start; i <= end; i++) {
    const x = i * step + offset;
    const h = 40 + Math.sin(i * 1.15 + eraIndex) * 18 + Math.cos(i * 0.65) * 12;
    ctx.quadraticCurveTo(x, GROUND_Y - h - 16, x + step * 0.5, GROUND_Y - h * 0.55);
  }
  ctx.lineTo(viewportW + 40, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hand-Crafted Multi-Detail Era Props along Midground Ridge!
  const propStep = 195;
  const pStart = Math.floor((-offset - 120) / propStep);
  const pEnd = Math.ceil((viewportW - offset + 120) / propStep);
  for (let i = pStart; i <= pEnd; i++) {
    const px = i * propStep + offset + ((i * 59) & 31);
    const py = GROUND_Y - 4;
    const variant = Math.abs(i) % 3;

    if (eraIndex === 0) {
      // Era I: Prehistoric lush ferns/palms, giant dinosaur ribcage fossil arch, mossy monolith boulder!
      if (variant === 1) {
        // Giant ivory dinosaur ribcage fossil arch!
        ctx.strokeStyle = 'rgba(231, 229, 228, 0.68)';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        for (let r = -2; r <= 2; r++) {
          ctx.beginPath();
          ctx.arc(px + r * 8, py, 16 + (2 - Math.abs(r)) * 3.5, Math.PI * 1.08, Math.PI * 1.92);
          ctx.stroke();
        }
      } else {
        // Layered prehistoric jungle palm & fern thicket
        ctx.fillStyle = '#3b2412';
        ctx.fillRect(px - 4.5, py - 36, 9, 36);
        ctx.fillStyle = propColor;
        ctx.beginPath();
        ctx.arc(px, py - 44, 19, 0, Math.PI * 2);
        ctx.arc(px - 14, py - 34, 14, 0, Math.PI * 2);
        ctx.arc(px + 14, py - 34, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.16)';
        ctx.beginPath();
        ctx.arc(px - 5, py - 49, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (eraIndex === 1) {
      // Era II: Hieroglyphic gilded obelisks & curving multi-frond oasis palms!
      if (variant === 0) {
        ctx.fillStyle = propColor;
        ctx.beginPath();
        ctx.moveTo(px - 8.5, py);
        ctx.lineTo(px - 5.5, py - 50);
        ctx.lineTo(px, py - 63);
        ctx.lineTo(px + 5.5, py - 50);
        ctx.lineTo(px + 8.5, py);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.76)';
        ctx.beginPath();
        ctx.moveTo(px - 5.5, py - 50);
        ctx.lineTo(px, py - 63);
        ctx.lineTo(px + 5.5, py - 50);
        ctx.closePath();
        ctx.fill();
        // Carved hieroglyph dashes
        ctx.fillStyle = 'rgba(120, 53, 15, 0.48)';
        for (let hy = py - 42; hy < py - 12; hy += 8) {
          ctx.fillRect(px - 2.5, hy, 5, 2.5);
        }
      } else {
        // Curving desert date palm with swaying fronds & coconuts
        const sway = Math.sin(time * 2 + i) * 2.5;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px - 6, py - 24, px + 4 + sway, py - 44);
        ctx.stroke();
        const topX = px + 4 + sway;
        const topY = py - 44;
        ctx.fillStyle = '#3f6212';
        for (let f = -2; f <= 2; f++) {
          ctx.beginPath();
          ctx.ellipse(topX + f * 9, topY + Math.abs(f) * 3.5, 14, 4.4, f * 0.36, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#713f12';
        ctx.beginPath();
        ctx.arc(topX - 2.5, topY + 3, 2.4, 0, Math.PI * 2);
        ctx.arc(topX + 2.5, topY + 3.5, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (eraIndex === 2) {
      // Era III: Mediterranean cypress groves & fluted marble ruin columns with bronze braziers!
      if (variant === 1) {
        // Fluted marble temple column with capital & flickering bronze brazier!
        ctx.fillStyle = 'rgba(226, 232, 240, 0.68)';
        ctx.fillRect(px - 6, py - 42, 12, 42);
        ctx.fillRect(px - 10, py - 46, 20, 5);
        ctx.fillRect(px - 9, py - 5, 18, 5);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.fillRect(px - 2, py - 41, 2, 36);
        ctx.fillRect(px + 2, py - 41, 2, 36);
        // Warm flickering flame atop column
        const fl = Math.sin(time * 8 + i) * 2;
        ctx.fillStyle = 'rgba(251, 146, 60, 0.85)';
        ctx.beginPath();
        ctx.arc(px, py - 50 + fl * 0.3, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = propColor;
        ctx.beginPath();
        ctx.ellipse(px, py - 31, 9.5, 31, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.13)';
        ctx.beginPath();
        ctx.ellipse(px - 2.5, py - 35, 4, 21, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (eraIndex === 3) {
      // Era IV: Blossoming Sakura Trees & Crimson Shrine Gates with Swaying Glowing Lanterns!
      if (variant !== 1) {
        ctx.fillStyle = '#3b2412';
        ctx.fillRect(px - 4, py - 34, 8, 34);
        ctx.fillStyle = '#be185d';
        ctx.beginPath();
        ctx.arc(px, py - 43, 20, 0, Math.PI * 2);
        ctx.arc(px - 15, py - 34, 14, 0, Math.PI * 2);
        ctx.arc(px + 15, py - 34, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbcfe8';
        ctx.globalAlpha = 0.72;
        ctx.beginPath();
        ctx.arc(px - 5, py - 48, 11.5, 0, Math.PI * 2);
        ctx.arc(px + 10, py - 39, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        // Ornate crimson Torii/Hongsalmun gate + hanging glowing golden paper lanterns!
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(px - 16, py - 44, 5, 44);
        ctx.fillRect(px + 11, py - 44, 5, 44);
        ctx.beginPath();
        ctx.moveTo(px - 25, py - 44);
        ctx.quadraticCurveTo(px, py - 41, px + 25, py - 44);
        ctx.lineTo(px + 22, py - 50);
        ctx.quadraticCurveTo(px, py - 47, px - 22, py - 50);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px - 19, py - 37, 38, 4);
        const lSway = Math.sin(time * 2.8 + i) * 2;
        for (const lx of [px - 9, px + 9]) {
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.ellipse(lx + lSway, py - 29, 3.6, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (eraIndex === 4 || eraIndex === 5) {
      // Era V & VI: Multi-canopy oaks/pines + heraldic banner posts or stacked cannonballs!
      if (variant === 1 && eraIndex === 4) {
        // Heraldic stone milestone pillar with fluttering banner
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px - 5, py - 34, 10, 34);
        ctx.fillRect(px - 7, py - 38, 14, 5);
        const fl = Math.sin(time * 4.5 + i) * 3;
        ctx.fillStyle = i % 2 === 0 ? '#2563eb' : '#dc2626';
        ctx.beginPath();
        ctx.moveTo(px + 4, py - 34);
        ctx.lineTo(px + 20, py - 31 + fl);
        ctx.lineTo(px + 17, py - 22 + fl);
        ctx.lineTo(px + 4, py - 23);
        ctx.closePath();
        ctx.fill();
      } else if (variant === 1 && eraIndex === 5) {
        // Coastal timber watch-post + stacked cannonball pyramid
        ctx.fillStyle = '#475569';
        ctx.fillRect(px - 4, py - 38, 6, 38);
        ctx.fillStyle = '#1e293b';
        for (const [cx, cy] of [
          [px + 10, py - 4],
          [px + 18, py - 4],
          [px + 26, py - 4],
          [px + 14, py - 10],
          [px + 22, py - 10],
          [px + 18, py - 16],
        ]) {
          ctx.beginPath();
          ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#3b2412';
        ctx.fillRect(px - 4.5, py - 34, 9, 34);
        ctx.fillStyle = propColor;
        ctx.beginPath();
        ctx.arc(px, py - 43, 19, 0, Math.PI * 2);
        ctx.arc(px - 13, py - 33, 13.5, 0, Math.PI * 2);
        ctx.arc(px + 13, py - 33, 13.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.beginPath();
        ctx.arc(px - 4, py - 48, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (eraIndex === 6) {
      // Era VII: Copper steam boilers, animated turning brass gears & warm Victorian gas streetlamps!
      if (variant === 1) {
        // Victorian iron gaslight lamp with warm amber glow halo!
        ctx.fillStyle = '#292524';
        ctx.fillRect(px - 2.5, py - 48, 5, 48);
        ctx.fillRect(px - 7, py - 48, 14, 3);
        const lGlow = ctx.createRadialGradient(px, py - 52, 2, px, py - 52, 22);
        lGlow.addColorStop(0, 'rgba(254, 240, 138, 0.82)');
        lGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = lGlow;
        ctx.beginPath();
        ctx.arc(px, py - 52, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px - 3, py - 56, 6, 7);
      } else {
        ctx.fillStyle = propColor;
        ctx.fillRect(px - 8, py - 48, 16, 48);
        drawSilhouetteGear(ctx, px + 18, py - 24, 16, 8, time * 0.8 + i, '#92400e');
      }
    } else if (eraIndex === 7) {
      // Era VIII: Sandbagged trench parapets & Czech hedgehog anti-tank traps!
      if (variant === 1) {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(px - 14, py);
        ctx.lineTo(px + 12, py - 24);
        ctx.moveTo(px + 14, py);
        ctx.lineTo(px - 12, py - 24);
        ctx.moveTo(px, py - 2);
        ctx.lineTo(px, py - 26);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#64748b';
        for (let r = 0; r < 2; r++) {
          for (let b = 0; b < 3 - r; b++) {
            ctx.beginPath();
            ctx.roundRect(px - 18 + b * 13 + r * 6, py - 9 - r * 8, 12, 8, 4);
            ctx.fill();
          }
        }
      }
    } else if (eraIndex === 8) {
      // Era IX: Sleek highway streetlamps casting soft downward light cones + radar dishes!
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 2, py - 52, 4, 52);
      ctx.fillRect(px - 2, py - 52, 16, 3);
      const cone = ctx.createLinearGradient(px + 12, py - 49, px + 12, py);
      cone.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
      cone.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(px + 8, py - 49);
      ctx.lineTo(px + 16, py - 49);
      ctx.lineTo(px + 34, py);
      ctx.lineTo(px - 10, py);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px + 8, py - 50, 7, 2.5);
    } else if (eraIndex >= 9) {
      // Eras X, XI, XII: Glowing Cyber/Cosmic/Chrono Energy Obelisk Pylons & Holo-Signs!
      ctx.fillStyle = propColor;
      ctx.beginPath();
      ctx.moveTo(px - 10, py);
      ctx.lineTo(px - 4.5, py - 56);
      ctx.lineTo(px + 4.5, py - 56);
      ctx.lineTo(px + 10, py);
      ctx.closePath();
      ctx.fill();
      const pulse = 0.6 + Math.sin(time * 3.2 + i) * 0.35;
      ctx.fillStyle = eraIndex === 11 ? '#facc15' : accent;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(px, py - 58, 5.8, 0, Math.PI * 2);
      ctx.fill();
      if (eraIndex === 11) {
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(px, py - 58, 12, 3.8, time * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (eraIndex === 9 && variant === 1) {
        // Floating neon holo-chevron panel
        ctx.strokeStyle = '#f472b6';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(px - 13, py - 48, 26, 12);
      }
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
}

/** Subtle ambient drifting embers / desert glints / sakura petals / cyber data motes / cosmic stardust */
function drawAmbientMotes(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  accent: string,
): void {
  ctx.save();
  const count = eraIndex === 3 || eraIndex === 11 ? 22 : 16;
  const col =
    eraIndex === 0 || eraIndex === 6 || eraIndex === 7
      ? '#fb923c'
      : eraIndex === 1
        ? '#fde047'
        : eraIndex === 3
          ? '#fbcfe8'
          : eraIndex === 11
            ? '#fef08a'
            : eraIndex >= 9
              ? accent
              : '#fef9c3';

  for (let i = 0; i < count; i++) {
    const span = viewportW + 80;
    const speedX = eraIndex === 1 ? -28 : eraIndex === 3 ? -18 - (i % 3) * 4 : 12 + (i % 4) * 5;
    const mx = wrapScroll(i * 97 + time * speedX - cameraX * 0.55, span, 40);
    const rise = eraIndex === 0 || eraIndex === 6 || eraIndex >= 9;
    const rawY = rise
      ? GROUND_Y - 12 - ((time * (18 + (i % 3) * 7) + i * 31) % 185)
      : 70 + ((i * 43 + time * (eraIndex === 3 ? 22 : 14)) % 210);
    const alpha = 0.28 + 0.48 * Math.abs(Math.sin(time * 2.5 + i * 1.7));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = eraIndex === 11 && i % 2 === 0 ? '#2dd4bf' : col;
    ctx.beginPath();
    if (eraIndex === 3) {
      ctx.ellipse(mx, rawY, 3.4, 1.9, time * 1.5 + i, 0, Math.PI * 2);
    } else {
      ctx.arc(mx, rawY, i % 4 === 0 ? 2.4 : 1.5, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.restore();
}

function drawCartoonGround(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  topCol: string,
  midCol: string,
  darkCol: string,
  accent: string,
): void {
  const groundH = WORLD_HEIGHT - GROUND_Y;

  const gGrad = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_HEIGHT + 36);
  gGrad.addColorStop(0, midCol);
  gGrad.addColorStop(0.42, darkCol);
  gGrad.addColorStop(0.85, '#121824');
  gGrad.addColorStop(1, '#0c111b');
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, GROUND_Y, viewportW + 4, groundH + 40);

  // Subterranean cross-section earth strata bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.fillRect(0, GROUND_Y + 24, viewportW + 4, 12);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  ctx.fillRect(0, GROUND_Y + 50, viewportW + 4, 18);

  const roadGrad = ctx.createLinearGradient(0, GROUND_Y - 3, 0, GROUND_Y + 15);
  roadGrad.addColorStop(0, topCol);
  roadGrad.addColorStop(1, midCol);
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, GROUND_Y - 3, viewportW + 4, 18);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(0, GROUND_Y - 2, viewportW + 4, 3);

  const tileW = 64;
  const start = Math.floor((cameraX - 64) / tileW);
  const end = Math.ceil((cameraX + viewportW + 64) / tileW);

  ctx.save();
  for (let i = start; i <= end; i++) {
    const sx = i * tileW - cameraX;
    if (eraIndex === 2 || eraIndex === 3 || eraIndex === 4 || eraIndex === 5) {
      // Handcrafted beveled cartoon cobblestones / imperial jade-trimmed slabs
      ctx.fillStyle = 'rgba(12, 16, 26, 0.22)';
      ctx.beginPath();
      ctx.roundRect(sx + 4, GROUND_Y + 2, 24, 9, 3);
      ctx.roundRect(sx + 34, GROUND_Y + 3, 24, 8, 3);
      ctx.fill();
      ctx.fillStyle = eraIndex === 3 ? 'rgba(94, 234, 212, 0.22)' : 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(sx + 6, GROUND_Y + 3, 20, 2);
      ctx.fillRect(sx + 36, GROUND_Y + 4, 20, 2);
    } else if (eraIndex === 6) {
      // Steampunk riveted iron girder deck + warm ember grates below!
      ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
      ctx.fillRect(sx + 2, GROUND_Y + 1, 60, 12);
      ctx.fillStyle = 'rgba(251, 146, 60, 0.36)';
      ctx.fillRect(sx + 10, GROUND_Y + 24, 44, 6);
      ctx.fillStyle = 'rgba(254, 215, 170, 0.35)';
      ctx.beginPath();
      ctx.arc(sx + 8, GROUND_Y + 7, 1.8, 0, Math.PI * 2);
      ctx.arc(sx + 56, GROUND_Y + 7, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (eraIndex === 8) {
      // Modern highway dashed yellow lane markers + reflective studs
      ctx.fillStyle = 'rgba(250, 204, 21, 0.72)';
      ctx.beginPath();
      ctx.roundRect(sx + 12, GROUND_Y + 5, 30, 3.5, 1.5);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.26)';
      ctx.fillRect(sx + 52, GROUND_Y + 5.5, 4, 2.5);
    } else if (eraIndex >= 9) {
      // Glowing neon sci-fi / cosmic / Chrono-Gold energy deck plates + subterranean conduits!
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(sx + 2, GROUND_Y + 1, 58, 12);
      ctx.fillStyle = eraIndex === 11 && i % 2 === 0 ? '#facc15' : accent;
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.roundRect(sx + 8, GROUND_Y + 5, 44, 2.8, 1.4);
      ctx.fill();
      ctx.globalAlpha = 0.22;
      ctx.fillRect(sx + 16, GROUND_Y + 26, 32, 3);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(12, 16, 26, 0.22)';
      ctx.beginPath();
      ctx.ellipse(sx + 16, GROUND_Y + 7, 7.5, 2.8, 0, 0, Math.PI * 2);
      ctx.ellipse(sx + 48, GROUND_Y + 6, 5.2, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.ellipse(sx + 14.5, GROUND_Y + 6, 3.5, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle embedded prehistoric spiral fossil / sandstone block detail in subterranean stratum!
      if (eraIndex === 0 && Math.abs(i) % 4 === 1) {
        ctx.strokeStyle = 'rgba(231, 229, 228, 0.16)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(sx + 30, GROUND_Y + 32, 6, 0, Math.PI * 1.7);
        ctx.stroke();
      } else if (eraIndex === 1 && Math.abs(i) % 3 === 0) {
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.14)';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(sx + 12, GROUND_Y + 24, 34, 12);
      }
    }
  }

  setInkStyle(ctx, 2.6, INK);
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 3);
  ctx.lineTo(viewportW + 4, GROUND_Y - 3);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.36)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 15);
  ctx.lineTo(viewportW + 4, GROUND_Y + 15);
  ctx.stroke();
  ctx.restore();
}

export function renderForegroundParallax(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  lowDetail = false,
): void {
  const offset = -(cameraX * 1.18);
  const spacing = lowDetail ? 340 : 220;
  const startIdx = Math.floor((-offset - 120) / spacing);
  const endIdx = Math.ceil((viewportW - offset + 120) / spacing);
  const era = getEra(eraIndex);

  ctx.save();
  for (let i = startIdx; i <= endIdx; i++) {
    const px = i * spacing + offset + (((i * 53) & 31) - 16);
    const py = GROUND_Y + 34;
    const sway = Math.sin(time * 2.1 + i) * 2.5;

    if (eraIndex === 0 || eraIndex === 4) {
      drawCelPoly(
        ctx,
        [
          [px - 14, py],
          [px - 18 + sway, py - 14],
          [px - 6, py - 7],
          [px + sway, py - 19],
          [px + 6, py - 7],
          [px + 18 + sway, py - 13],
          [px + 14, py],
        ],
        era.palette.groundTop,
        { highlight: '#a3e635', shadow: '#365314', lineWidth: 1.8 },
      );
    } else if (eraIndex === 3) {
      // Foreground bamboo shoots & crimson stone lantern accents for Eastern Dynasty!
      drawCelPoly(
        ctx,
        [
          [px - 12, py],
          [px - 15 + sway, py - 16],
          [px - 5, py - 8],
          [px + sway, py - 21],
          [px + 6, py - 8],
          [px + 15 + sway, py - 15],
          [px + 11, py],
        ],
        '#047857',
        { highlight: '#34d399', shadow: '#064e3b', lineWidth: 1.7 },
      );
    } else if (eraIndex === 1 || eraIndex === 2) {
      drawCelEllipse(ctx, px, py - 6, 15, 8, era.palette.nearProp, {
        highlight: 'rgba(255,255,255,0.28)',
        shadow: 'rgba(0,0,0,0.3)',
        lineWidth: 1.8,
      });
    } else if (eraIndex >= 9) {
      drawCelPoly(
        ctx,
        [
          [px - 10, py],
          [px - 5, py - 18],
          [px + 2, py - 11],
          [px + 8, py - 21],
          [px + 13, py],
        ],
        eraIndex === 11 ? '#facc15' : era.palette.accent,
        { highlight: '#ffffff', shadow: eraIndex === 11 ? '#0f766e' : '#4c1d95', lineWidth: 1.7 },
      );
    } else {
      drawCelRoundRect(ctx, px - 12, py - 12, 24, 12, 3, era.palette.nearProp, {
        highlight: 'rgba(255,255,255,0.2)',
        shadow: 'rgba(0,0,0,0.35)',
        lineWidth: 1.8,
      });
    }
  }

  // Dynamic Era Weather Overlay (desert wind, wartime rain, cyberpunk neon rain, cosmic meteors!)
  if (lowDetail) {
    ctx.restore();
    return;
  }
  if (eraIndex === 1) {
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.16)';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const sx = wrapScroll(i * 155 + time * 160 - cameraX * 0.5, viewportW + 220, 110);
      const sy = 95 + (i % 5) * 44 + Math.sin(time * 2 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + 38, sy - 6, sx + 78, sy + 2);
      ctx.stroke();
    }
  } else if (eraIndex === 5 || eraIndex === 7 || eraIndex === 9) {
    const isNeon = eraIndex === 9;
    ctx.lineWidth = isNeon ? 1.6 : 1.3;
    ctx.lineCap = 'round';
    const drops = isNeon ? 24 : 20;
    for (let i = 0; i < drops; i++) {
      const rx = wrapScroll(i * 97 - time * 130 - cameraX * 0.45, viewportW + 80, 40);
      const ry = wrapScroll(i * 67 + time * 360, GROUND_Y + 20, 0);
      ctx.strokeStyle = isNeon
        ? i % 3 === 0
          ? 'rgba(244, 114, 182, 0.28)'
          : 'rgba(56, 189, 248, 0.28)'
        : 'rgba(203, 213, 225, 0.22)';
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 7, ry + 18);
      ctx.stroke();
    }
  } else if (eraIndex === 10 || eraIndex === 11) {
    // Sweeping cosmic shooting stars / Chrono golden light-streaks!
    for (let i = 0; i < 3; i++) {
      const phase = (time * 0.32 + i * 0.37) % 1;
      if (phase < 0.35) {
        const t = phase / 0.35;
        const sx = viewportW * (0.25 + i * 0.28) + t * 180;
        const sy = 42 + i * 32 + t * 55;
        const alpha = Math.sin(t * Math.PI) * 0.72;
        ctx.strokeStyle =
          eraIndex === 11
            ? `rgba(94, 234, 212, ${alpha.toFixed(2)})`
            : `rgba(254, 240, 138, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(sx - 34, sy - 11);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
