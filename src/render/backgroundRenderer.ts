import { getEra } from '../data/eras';
import { GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from '../game/constants';
import { PIXEL_WORLD_SCALE, drawSprite, getSpriteFrame } from './spriteAtlas';

const PX = PIXEL_WORLD_SCALE; // 2 logical world units per pixel block
const snap = (v: number): number => Math.floor(v / PX) * PX;

/** Parse #rrggbb to [r, g, b] */
function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

/** Draw a classic 16-bit checkerboard pixel dither band across the viewport */
function drawDitherStrip(
  ctx: CanvasRenderingContext2D,
  y: number,
  viewportW: number,
  colA: string,
  colB: string,
): void {
  const sy = snap(y);
  ctx.fillStyle = colA;
  ctx.fillRect(0, sy, viewportW + PX, PX * 2);
  ctx.fillStyle = colB;
  const step = PX * 2;
  for (let x = 0; x < viewportW + step; x += step) {
    ctx.fillRect(x, sy, PX, PX);
    ctx.fillRect(x + PX, sy + PX, PX, PX);
  }
}

/** Draw a stepped pixel disc (no smooth anti-aliased arc edges) */
function drawPixelDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
): void {
  const scx = snap(cx);
  const scy = snap(cy);
  const r = snap(radius);
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy += PX) {
    const half = snap(Math.sqrt(Math.max(0, r * r - dy * dy)));
    if (half > 0) {
      ctx.fillRect(scx - half, scy + dy, half * 2, PX);
    }
  }
}

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  transition?: { active: boolean; fromEra: number; toEra: number; progress: number },
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (transition && transition.active) {
    renderSingleEraBackground(ctx, transition.fromEra, cameraX, viewportW, time);
    ctx.save();
    ctx.globalAlpha = easeInOut(transition.progress);
    renderSingleEraBackground(ctx, transition.toEra, cameraX, viewportW, time);
    ctx.restore();

    const glowAlpha = Math.sin(transition.progress * Math.PI) * 0.28;
    if (glowAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 224, 130, ${glowAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT);
    }
    ctx.restore();
    return;
  }

  renderSingleEraBackground(ctx, eraIndex, cameraX, viewportW, time);
  ctx.restore();
}

/**
 * Foreground parallax pixel-art props (ferns, sandstone ruins, grass tufts,
 * shrubs, sandbags, concrete barriers, sci-fi pylons) along the bottom ground lip.
 */
export function renderForegroundParallax(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
): void {
  const offset = -(cameraX * 1.18);
  const spacing = 190;
  const startIdx = Math.floor((-offset - 100) / spacing);
  const endIdx = Math.ceil((viewportW - offset + 100) / spacing);
  const key = `prop/fore_${Math.max(0, Math.min(6, eraIndex))}`;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  for (let i = startIdx; i <= endIdx; i++) {
    const px = snap(i * spacing + offset + (((i * 53) & 31) - 16));
    const sway = eraIndex === 0 || eraIndex === 2 ? Math.round(Math.sin(time * 2.2 + i)) * 2 : 0;
    const py = GROUND_Y + 34;

    const drawn = drawSprite(ctx, key, px + sway, py, {
      scale: PIXEL_WORLD_SCALE,
      flipX: (i & 1) === 1,
    });
    if (!drawn) {
      ctx.fillStyle = '#182026';
      ctx.fillRect(px - 18, py - 12, 36, 12);
    }
  }

  ctx.restore();
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function renderSingleEraBackground(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
): void {
  const era = getEra(eraIndex);
  const p = era.palette;

  // 1. Stepped 16-Bit Pixel Sky with Dithered Horizon Bands
  drawPixelSky(ctx, p.skyTop, p.skyMid, p.skyBottom, viewportW);

  // 2. Pixel Celestial Body, Dithered Halo, Pixel Clouds & Sky Details
  drawSkyAtmosphere(ctx, eraIndex, cameraX, viewportW, time, p.sunColor);

  // 3. Pixel-Stepped Far Horizon Landmarks (parallax 0.16)
  drawFarLayer(ctx, eraIndex, cameraX, viewportW, time, p.farHill, p.skyBottom);

  // 4. Stepped Midground Hills + Pixel-Art Era Landmarks (parallax 0.38)
  drawMidLayer(ctx, eraIndex, cameraX, viewportW, time, p.midHill);

  // 5. Seamless 64x64px Pixel-Art Ground Tiles & Road (parallax 1.0)
  drawPixelGround(ctx, eraIndex, cameraX, viewportW, p.groundTop, p.groundMid, p.groundDark, p.accent);
}

function drawPixelSky(
  ctx: CanvasRenderingContext2D,
  skyTop: string,
  skyMid: string,
  skyBottom: string,
  viewportW: number,
): void {
  // 8 crisp stepped sky color bands with 16-bit checkerboard dithering seams
  const stops = [
    skyTop,
    mixHex(skyTop, skyMid, 0.35),
    mixHex(skyTop, skyMid, 0.72),
    skyMid,
    mixHex(skyMid, skyBottom, 0.35),
    mixHex(skyMid, skyBottom, 0.68),
    skyBottom,
  ];
  const bandH = snap(Math.ceil((GROUND_Y + 6) / stops.length));

  for (let i = 0; i < stops.length; i++) {
    const y0 = i * bandH;
    const h = i === stops.length - 1 ? GROUND_Y + 6 - y0 : bandH;
    ctx.fillStyle = stops[i];
    ctx.fillRect(0, y0, viewportW + 4, h);
    if (i > 0) {
      drawDitherStrip(ctx, y0 - PX, viewportW, stops[i - 1], stops[i]);
    }
  }
}

function drawSkyAtmosphere(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  sunColor: string,
): void {
  const sunX = snap(viewportW * 0.62 - cameraX * 0.05);
  const sunY = eraIndex === 6 ? 94 : 106;

  ctx.save();
  // Stepped pixel sun halo rings
  ctx.globalAlpha = 0.14;
  drawPixelDisc(ctx, sunX, sunY, 72, sunColor);
  ctx.globalAlpha = 0.24;
  drawPixelDisc(ctx, sunX, sunY, 44, sunColor);
  ctx.globalAlpha = 1;
  drawPixelDisc(ctx, sunX, sunY, eraIndex === 6 ? 26 : 22, sunColor);
  // Crisp highlight crescent inside pixel sun
  drawPixelDisc(ctx, sunX - 6, sunY - 6, 8, '#ffffff');

  if (eraIndex === 0) {
    // Gliding pixel pterodactyl silhouettes
    ctx.fillStyle = 'rgba(42, 20, 14, 0.72)';
    for (let i = 0; i < 4; i++) {
      const bx = snap(
        ((i * 290 + time * 24 - cameraX * 0.12) % (viewportW + 180) + (viewportW + 180)) %
          (viewportW + 180) -
          90,
      );
      const by = snap(66 + (i % 3) * 26 + Math.sin(time * 2.4 + i) * 6);
      const flap = Math.sin(time * 5.2 + i * 2) > 0 ? -4 : 4;
      ctx.fillRect(bx - 12, by + flap, 8, 4);
      ctx.fillRect(bx - 6, by, 12, 4);
      ctx.fillRect(bx + 4, by + flap, 8, 4);
      ctx.fillRect(bx + 2, by - 4, 4, 4);
    }
  } else if (eraIndex === 4) {
    // Stepped wartime anti-aircraft searchlights + pixel zeppelin
    ctx.fillStyle = 'rgba(245, 236, 198, 0.08)';
    for (let i = 0; i < 4; i++) {
      const lx = snap(
        ((i * 290 - cameraX * 0.18) % (viewportW + 300) + (viewportW + 300)) % (viewportW + 300) -
          100,
      );
      const sway = Math.sin(time * 0.75 + i * 2.1) * 78;
      for (let sy = 0; sy < GROUND_Y - 20; sy += 12) {
        const t = 1 - sy / (GROUND_Y - 20);
        const cx = snap(lx + sway * t);
        const hw = snap(6 + t * 24);
        ctx.fillRect(cx - hw, sy, hw * 2, 12);
      }
    }
    const zx = snap(
      ((time * 9 + 240 - cameraX * 0.09) % (viewportW + 260) + (viewportW + 260)) %
        (viewportW + 260) -
        130,
    );
    ctx.fillStyle = 'rgba(28, 30, 34, 0.72)';
    ctx.fillRect(zx - 30, 68, 60, 14);
    ctx.fillRect(zx - 22, 64, 44, 22);
    ctx.fillRect(zx - 10, 86, 20, 6);
    ctx.fillRect(zx - 34, 64, 8, 22);
  } else if (eraIndex === 5) {
    // Stepped jet contrails across modern dusk sky
    ctx.fillStyle = 'rgba(226, 241, 255, 0.24)';
    for (let x = 0; x < viewportW; x += 16) {
      const y1 = snap(96 - (x / viewportW) * 40);
      const y2 = snap(128 - (x / viewportW) * 44);
      ctx.fillRect(x, y1, 16, 2);
      ctx.fillRect(x, y2, 16, 2);
    }
  } else if (eraIndex === 6) {
    // Crisp 2px pixel starfield & pixel orbital ring around sci-fi planet
    ctx.fillStyle = '#baf5ff';
    for (let i = 0; i < 52; i++) {
      const sx = snap(((i * 97.3 - cameraX * 0.04) % viewportW + viewportW) % viewportW);
      const sy = snap((i * 37.7) % (GROUND_Y * 0.58));
      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * 2.1 + i));
      ctx.globalAlpha = twinkle * 0.85;
      const sz = i % 5 === 0 ? 4 : 2;
      ctx.fillRect(sx, sy, sz, sz);
    }
    // Stepped pixel orbital planet ring
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = '#38bdf8';
    for (let deg = 0; deg < 360; deg += 9) {
      const rad = (deg * Math.PI) / 180;
      const rx = Math.cos(rad) * 66;
      const ry = Math.sin(rad) * 14;
      const rotX = rx * 0.97 - ry * -0.22;
      const rotY = rx * -0.22 + ry * 0.97;
      ctx.fillRect(snap(sunX + rotX), snap(sunY + rotY), 4, 2);
    }
    ctx.globalAlpha = 1;
  }

  // Classic 16-bit blocky pixel clouds for eras 1..5
  if (eraIndex >= 1 && eraIndex <= 5) {
    const cloudMain = eraIndex === 4 ? 'rgba(66, 62, 56, 0.45)' : 'rgba(255, 250, 240, 0.24)';
    const cloudHi = eraIndex === 4 ? 'rgba(98, 92, 82, 0.35)' : 'rgba(255, 255, 255, 0.22)';
    for (let i = 0; i < 5; i++) {
      const cx = snap(
        ((i * 270 + time * (6 + i * 1.2) - cameraX * 0.08) % (viewportW + 240) + (viewportW + 240)) %
          (viewportW + 240) -
          120,
      );
      const cy = snap(58 + (i % 3) * 32);
      ctx.fillStyle = cloudMain;
      ctx.fillRect(cx - 44, cy, 88, 12);
      ctx.fillRect(cx - 32, cy - 8, 64, 10);
      ctx.fillRect(cx - 12, cy - 14, 34, 8);
      ctx.fillStyle = cloudHi;
      ctx.fillRect(cx - 28, cy - 8, 52, 4);
      ctx.fillRect(cx - 10, cy - 14, 26, 4);
    }
  }

  ctx.restore();
}

function drawFarLayer(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  color: string,
  skyBottom: string,
): void {
  const offset = -(cameraX * 0.16);
  const colStep = 8; // crisp 4-pixel-block horizon stepping
  ctx.save();
  ctx.fillStyle = color;

  if (eraIndex === 0) {
    // Pixel-stepped volcanic ridges
    for (let wx = -colStep; wx <= viewportW + colStep; wx += colStep) {
      const ws = wx - offset;
      const ridge = snap(Math.sin(ws * 0.0055) * 42 + Math.cos(ws * 0.013) * 22 + 76);
      ctx.fillRect(wx, GROUND_Y - ridge, colStep, ridge);
    }

    // Twin pixel-stepped smoking volcanoes with glowing lava fissures
    for (const vxBase of [340, 1040]) {
      const vx = snap(vxBase + offset);
      for (let row = 0; row < 156; row += 6) {
        const half = snap(20 + row * 0.66);
        const y = GROUND_Y - 172 + row;
        ctx.fillStyle = color;
        ctx.fillRect(vx - half, y, half * 2, 6);
        // Sunlit right volcanic slope facet
        ctx.fillStyle = 'rgba(255, 168, 92, 0.18)';
        ctx.fillRect(vx + 4, y, Math.max(4, half - 4), 6);
      }
      // Glowing pixel lava crater & fissure
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(vx - 18, GROUND_Y - 174, 36, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(vx - 10, GROUND_Y - 174, 20, 4);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(vx - 8, GROUND_Y - 168, 4, 14);
      ctx.fillRect(vx - 12, GROUND_Y - 154, 4, 16);
      ctx.fillRect(vx - 18, GROUND_Y - 138, 4, 14);

      // Rising pixel ash puffs
      ctx.fillStyle = 'rgba(68, 46, 40, 0.5)';
      for (let s = 0; s < 5; s++) {
        const sy = snap(GROUND_Y - 188 - s * 18 - ((time * 12 + s * 10) % 24));
        const sx = snap(vx + Math.sin(time + s) * 10 + s * 8);
        const sz = snap(14 + s * 6);
        ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
    }
  } else if (eraIndex === 1) {
    // Pixel-stepped desert dunes + monumental stepped pixel pyramids
    for (let x = -colStep; x <= viewportW + colStep; x += colStep) {
      const ws = x - offset;
      const h = snap(48 + Math.sin(ws * 0.006) * 20);
      ctx.fillRect(x, GROUND_Y - h, colStep, h);
    }

    for (const [pxBase, ph] of [
      [250, 132],
      [420, 96],
      [980, 120],
    ]) {
      const px = snap(pxBase + offset);
      for (let row = 0; row < ph; row += 6) {
        const half = snap(row + 4);
        const y = GROUND_Y - 30 - ph + row;
        ctx.fillStyle = color;
        ctx.fillRect(px - half, y, half * 2, 6);
        // Shaded right face of pyramid
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(px + Math.round(half * 0.14), y, Math.max(4, Math.round(half * 0.86)), 6);
      }
    }
  } else if (eraIndex === 2) {
    // Jagged pixel-stepped alpine peaks + distant gothic hill fortress
    for (let x = -colStep; x <= viewportW + colStep; x += colStep) {
      const ws = x - offset;
      const h = snap(74 + Math.abs(Math.sin(ws * 0.0045)) * 84 + Math.cos(ws * 0.011) * 16);
      ctx.fillStyle = color;
      ctx.fillRect(x, GROUND_Y - h, colStep, h);
      if (h > 134) {
        // Crisp snowcap pixel rim
        ctx.fillStyle = 'rgba(241, 245, 249, 0.32)';
        ctx.fillRect(x, GROUND_Y - h, colStep, 10);
      }
    }
    const cx = snap(620 + offset);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(cx - 28, GROUND_Y - 148, 56, 52);
    ctx.fillRect(cx - 34, GROUND_Y - 168, 16, 72);
    ctx.fillRect(cx + 18, GROUND_Y - 164, 16, 68);
    ctx.fillRect(cx - 30, GROUND_Y - 178, 8, 10);
    ctx.fillRect(cx - 28, GROUND_Y - 186, 4, 8);
  } else if (eraIndex === 3) {
    // Pixel shimmering ocean horizon + pixel sailing frigates
    ctx.fillStyle = 'rgba(38, 62, 84, 0.78)';
    ctx.fillRect(0, GROUND_Y - 82, viewportW, 82);
    // Shimmering pixel water highlights
    ctx.fillStyle = 'rgba(255, 232, 185, 0.25)';
    for (let wy = GROUND_Y - 76; wy < GROUND_Y - 14; wy += 12) {
      for (let wx = 0; wx < viewportW; wx += 48) {
        const shift = snap(((wx + wy * 3 + Math.floor(time * 8) * 4) % 24));
        ctx.fillRect(wx + shift, wy, 14, 2);
      }
    }
    for (const sxBase of [280, 690, 1120]) {
      const sx = snap(sxBase + offset);
      const bob = Math.round(Math.sin(time * 1.4 + sxBase)) * 2;
      ctx.fillStyle = color;
      ctx.fillRect(sx - 34, GROUND_Y - 78 + bob, 68, 10);
      ctx.fillRect(sx - 24, GROUND_Y - 68 + bob, 48, 8);
      ctx.fillRect(sx - 12, GROUND_Y - 130 + bob, 4, 52);
      ctx.fillRect(sx + 8, GROUND_Y - 120 + bob, 4, 42);
      ctx.fillStyle = 'rgba(242, 232, 208, 0.62)';
      ctx.fillRect(sx - 8, GROUND_Y - 124 + bob, 14, 34);
      ctx.fillRect(sx + 12, GROUND_Y - 114 + bob, 10, 26);
    }
  } else if (eraIndex === 4) {
    // Pixel-stepped shell-blasted hills & ruined WW factories with smokestacks
    for (let x = -colStep; x <= viewportW + colStep; x += colStep) {
      const ws = x - offset;
      const h = snap(56 + Math.sin(ws * 0.008) * 24);
      ctx.fillRect(x, GROUND_Y - h, colStep, h);
    }
    for (const fxBase of [240, 620, 960]) {
      const fx = snap(fxBase + offset);
      ctx.fillRect(fx, GROUND_Y - 128, 52, 74);
      ctx.fillRect(fx + 8, GROUND_Y - 170, 10, 46);
      ctx.fillRect(fx + 28, GROUND_Y - 156, 8, 36);
      // Warm glowing factory furnace window pixels
      ctx.fillStyle = 'rgba(251, 146, 60, 0.42)';
      ctx.fillRect(fx + 10, GROUND_Y - 110, 8, 8);
      ctx.fillRect(fx + 26, GROUND_Y - 110, 8, 8);
      ctx.fillStyle = color;
    }
  } else if (eraIndex === 5) {
    // Crisp pixel metropolitan skyline with lit office pixel grids & red tower beacons
    for (let i = 0; i < 24; i++) {
      const bx = snap(i * 68 + offset);
      const bw = snap(38 + ((i * 19) % 26));
      const bh = snap(82 + ((i * 47) % 112));
      ctx.fillStyle = color;
      ctx.fillRect(bx, GROUND_Y - bh, bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(bx, GROUND_Y - bh, 6, bh);
      ctx.fillStyle = 'rgba(255, 232, 165, 0.44)';
      for (let wy = GROUND_Y - bh + 10; wy < GROUND_Y - 40; wy += 12) {
        for (let wx = bx + 6; wx < bx + bw - 8; wx += 8) {
          if (((wx + wy + i) & 3) !== 0) {
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
      if (bh > 152) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx + snap(bw * 0.5) - 2, GROUND_Y - bh - 6, 4, 4);
      }
    }
  } else {
    // Era 7: Crisp cyberpunk megastructure pixel arcologies + cyan neon conduits
    for (let i = 0; i < 18; i++) {
      const bx = snap(i * 96 + offset);
      const bw = snap(48 + ((i * 23) % 34));
      const bh = snap(102 + ((i * 53) % 130));
      ctx.fillStyle = color;
      ctx.fillRect(bx, GROUND_Y - bh, bw, bh);
      ctx.fillRect(bx + 8, GROUND_Y - bh - 12, Math.max(12, bw - 16), 12);

      // Lit bevel strip & vertical neon cyan energy spine
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.fillRect(bx + 4, GROUND_Y - bh + 4, 6, bh - 24);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
      ctx.fillRect(bx + snap(bw * 0.5) - 2, GROUND_Y - bh, 4, bh - 34);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.32)';
      for (let fy = GROUND_Y - bh + 20; fy < GROUND_Y - 48; fy += 22) {
        ctx.fillRect(bx + 10, fy, bw - 20, 2);
      }
    }
  }

  // Subtle stepped pixel atmospheric horizon mist strip
  ctx.fillStyle = skyBottom;
  ctx.globalAlpha = 0.16;
  ctx.fillRect(0, GROUND_Y - 64, viewportW, 64);
  ctx.globalAlpha = 0.22;
  ctx.fillRect(0, GROUND_Y - 28, viewportW, 28);
  ctx.restore();
}

function drawMidLayer(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  midColor: string,
): void {
  const offset = -(cameraX * 0.38);
  const colStep = 8;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Rolling pixel-stepped midground hill ridge
  ctx.fillStyle = midColor;
  for (let x = -colStep; x <= viewportW + colStep; x += colStep) {
    const ws = x - offset;
    const h = snap(36 + Math.sin(ws * 0.0085) * 18 + Math.cos(ws * 0.019) * 8);
    ctx.fillRect(x, GROUND_Y - h, colStep, h);
  }

  // Blit crisp pixel-art era midground landmarks from sprites_sheet.png!
  const spacing = 190;
  const startIdx = Math.floor((-offset - 120) / spacing);
  const endIdx = Math.ceil((viewportW - offset + 120) / spacing);
  const propKey = `prop/mid_${Math.max(0, Math.min(6, eraIndex))}`;

  for (let i = startIdx; i <= endIdx; i++) {
    const px = snap(i * spacing + offset);
    const py = GROUND_Y - 12;
    const sway = eraIndex === 0 || eraIndex === 2 ? Math.round(Math.sin(time * 2.0 + i)) * 2 : 0;

    drawSprite(ctx, propKey, px + sway, py, {
      scale: PIXEL_WORLD_SCALE,
      flipX: (i & 1) === 1,
    });
  }

  ctx.restore();
}

function drawPixelGround(
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
  const tileKey = `tile/ground_era_${Math.max(0, Math.min(6, eraIndex))}`;
  const frame = getSpriteFrame(tileKey);
  const tileWorldSize = frame ? frame.w * PIXEL_WORLD_SCALE : 128;

  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Base fallback pixel strata (ensures 100% coverage even before sprite sheet finishes loading)
  ctx.fillStyle = topCol;
  ctx.fillRect(0, GROUND_Y, viewportW + 4, 16);
  ctx.fillStyle = midCol;
  ctx.fillRect(0, GROUND_Y + 16, viewportW + 4, 42);
  ctx.fillStyle = darkCol;
  ctx.fillRect(0, GROUND_Y + 58, viewportW + 4, Math.max(0, groundH - 58));

  // Seamless repeating 64x64px pixel ground tiles blitted at 2x (128x128 world units)
  const firstTile = Math.floor(cameraX / tileWorldSize) - 1;
  const lastTile = Math.ceil((cameraX + viewportW) / tileWorldSize) + 1;
  for (let i = firstTile; i <= lastTile; i++) {
    const sx = Math.round(i * tileWorldSize - cameraX);
    drawSprite(ctx, tileKey, sx, GROUND_Y, {
      scale: PIXEL_WORLD_SCALE,
    });
  }

  // Crisp 2px dark road border top highlight
  ctx.fillStyle = eraIndex === 6 ? 'rgba(56, 232, 255, 0.78)' : 'rgba(17, 19, 29, 0.65)';
  ctx.fillRect(0, GROUND_Y - 2, viewportW + 4, 2);

  // Distinct Pixel Midfield Marker at WORLD_WIDTH / 2
  const midX = snap(WORLD_WIDTH * 0.5 - cameraX);
  if (midX > -40 && midX < viewportW + 40) {
    ctx.fillStyle = '#11131d';
    ctx.fillRect(midX - 4, GROUND_Y, 8, 26);
    ctx.fillStyle = accent;
    ctx.fillRect(midX - 2, GROUND_Y + 2, 4, 22);
  }

  ctx.restore();
}
