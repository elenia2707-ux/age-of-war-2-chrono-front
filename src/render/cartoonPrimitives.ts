import type { Team } from '../data/types';

export const INK = '#121622';
export const INK_SOFT = '#23293a';

export interface TeamPalette {
  main: string;
  light: string;
  dark: string;
  trim: string;
  glow: string;
  glowSoft: string;
  cape: string;
  capeDark: string;
}

const PLAYER_PALETTE: TeamPalette = {
  main: '#2563eb',
  light: '#60a5fa',
  dark: '#1e3a8a',
  trim: '#facc15',
  glow: '#38bdf8',
  glowSoft: 'rgba(56, 189, 248, 0.45)',
  cape: '#1d4ed8',
  capeDark: '#172554',
};

const ENEMY_PALETTE: TeamPalette = {
  main: '#dc2626',
  light: '#f87171',
  dark: '#7f1d1d',
  trim: '#fbbf24',
  glow: '#fb7185',
  glowSoft: 'rgba(251, 113, 133, 0.45)',
  cape: '#b91c1c',
  capeDark: '#450a0a',
};

export function getTeamPalette(team: Team): TeamPalette {
  return team === 'player' ? PLAYER_PALETTE : ENEMY_PALETTE;
}

// Cached 48x48 radial glow sprites keyed by color (eliminates hundreds of createRadialGradient calls/frame!)
const glowSpriteCache = new Map<string, HTMLCanvasElement>();

function getGlowSprite(outerColor: string, innerColor = '#ffffff'): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const key = `${outerColor}|${innerColor}`;
  const existing = glowSpriteCache.get(key);
  if (existing) return existing;
  if (glowSpriteCache.size > 96) {
    const firstKey = glowSpriteCache.keys().next().value;
    if (firstKey !== undefined) glowSpriteCache.delete(firstKey);
  }
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 48;
  const gctx = c.getContext('2d');
  if (!gctx) return null;
  const grad = gctx.createRadialGradient(24, 24, 2, 24, 24, 24);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.38, outerColor);
  grad.addColorStop(0.72, outerColor + '38');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  // If outerColor is already rgba(...), fall back cleanly to valid stops
  if (!outerColor.startsWith('#') || outerColor.length !== 7) {
    const g2 = gctx.createRadialGradient(24, 24, 2, 24, 24, 24);
    g2.addColorStop(0, innerColor);
    g2.addColorStop(0.42, outerColor);
    g2.addColorStop(1, 'rgba(255,255,255,0)');
    gctx.fillStyle = g2;
  } else {
    gctx.fillStyle = grad;
  }
  gctx.beginPath();
  gctx.arc(24, 24, 24, 0, Math.PI * 2);
  gctx.fill();
  glowSpriteCache.set(key, c);
  return c;
}

export function clearPrimitiveCaches(): void {
  glowSpriteCache.clear();
}

export function setInkStyle(ctx: CanvasRenderingContext2D, lineWidth = 2.2, color = INK): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

/**
 * Draw a crisp Flash-cartoon cel-shaded rounded rectangle with zero ctx.clip() and zero per-call gradient
 * allocations (60fps iPhone WebKit optimized) while preserving glossy top rim, bottom AO shadow & bold ink outline.
 */
export function drawCelRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  opts?: {
    highlight?: string;
    shadow?: string;
    lineWidth?: number;
    ink?: string;
  },
): void {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rad);
  ctx.fillStyle = fill;
  ctx.fill();

  const absW = Math.abs(w);
  const absH = Math.abs(h);
  if (absW > 4 && absH > 4) {
    const inset = Math.min(1.6, absW * 0.12, absH * 0.12);
    const bandW = absW - inset * 2;
    const prevAlpha = ctx.globalAlpha;

    // Crisp bottom cel-shadow band tucked cleanly inside outline (zero ctx.clip!)
    const shH = Math.max(1.5, Math.min(absH * 0.28, absH - inset * 2));
    ctx.fillStyle = opts?.shadow ?? 'rgba(10, 14, 24, 0.24)';
    ctx.globalAlpha = prevAlpha * (opts?.shadow ? 0.42 : 1);
    ctx.beginPath();
    ctx.roundRect(x + inset, y + absH - shH - inset * 0.4, bandW, shH, Math.max(0.5, rad * 0.55));
    ctx.fill();

    // Glossy top specular sheen strip
    const hiH = Math.max(1.3, Math.min(4.0, absH * 0.22));
    ctx.fillStyle = opts?.highlight ?? 'rgba(255, 255, 255, 0.26)';
    ctx.globalAlpha = prevAlpha * (opts?.highlight ? 0.55 : 1);
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset * 0.5, bandW, hiH, Math.max(0.5, rad * 0.5));
    ctx.fill();
    ctx.globalAlpha = prevAlpha;
  }

  setInkStyle(ctx, opts?.lineWidth ?? 2.1, opts?.ink ?? INK);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rad);
  ctx.stroke();
}

/**
 * Draw a painterly cel-shaded ellipse with zero ctx.clip() & zero per-call gradients:
 * base fill, interior lower-right shadow crescent, glossy top-left specular dot, and bold ink outline.
 */
export function drawCelEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  opts?: {
    highlight?: string;
    shadow?: string;
    lineWidth?: number;
    rotation?: number;
    ink?: string;
  },
): void {
  const safeRx = Math.max(0.5, rx);
  const safeRy = Math.max(0.5, ry);
  const hasRot = Boolean(opts?.rotation);
  if (hasRot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(opts!.rotation!);
    cx = 0;
    cy = 0;
  }

  ctx.beginPath();
  ctx.ellipse(cx, cy, safeRx, safeRy, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();

  if (safeRx > 2.4 && safeRy > 2.4) {
    const prevAlpha = ctx.globalAlpha;
    // Soft lower-right interior cel-shadow (fits strictly inside ellipse, no clip required!)
    ctx.fillStyle = opts?.shadow ?? 'rgba(10, 14, 24, 0.22)';
    ctx.globalAlpha = prevAlpha * (opts?.shadow ? 0.36 : 0.72);
    ctx.beginPath();
    ctx.ellipse(cx + safeRx * 0.14, cy + safeRy * 0.26, safeRx * 0.72, safeRy * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crisp glossy cartoon specular highlight top-left
    ctx.fillStyle = opts?.highlight ?? '#ffffff';
    ctx.globalAlpha = prevAlpha * 0.42;
    ctx.beginPath();
    ctx.ellipse(cx - safeRx * 0.28, cy - safeRy * 0.34, safeRx * 0.36, safeRy * 0.22, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = prevAlpha;
  }

  setInkStyle(ctx, opts?.lineWidth ?? 2.1, opts?.ink ?? INK);
  ctx.beginPath();
  ctx.ellipse(cx, cy, safeRx, safeRy, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (hasRot) {
    ctx.restore();
  }
}

/**
 * Draw an inked cel-shaded polygon with single-pass path reuse (zero ctx.clip(), zero per-call gradients)
 * plus directional upper-edge rim gloss for unmistakable Flash-cartoon pop.
 */
export function drawCelPoly(
  ctx: CanvasRenderingContext2D,
  pts: ReadonlyArray<readonly [number, number]>,
  fill: string,
  opts?: {
    highlight?: string;
    shadow?: string;
    lineWidth?: number;
    ink?: string;
  },
): void {
  const len = pts.length;
  if (len < 3) return;

  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  let minY = pts[0][1];
  let maxY = pts[0][1];
  let minIdx = 0;
  for (let i = 1; i < len; i++) {
    const px = pts[i][0];
    const py = pts[i][1];
    ctx.lineTo(px, py);
    if (py < minY) {
      minY = py;
      minIdx = i;
    }
    if (py > maxY) maxY = py;
  }
  ctx.closePath();

  ctx.fillStyle = fill;
  ctx.fill();

  // Fast interior shadow & specular rim accents strictly using polygon geometry (zero clip!)
  const spanH = maxY - minY;
  if (spanH > 8 && (opts?.highlight || opts?.shadow)) {
    const prevAlpha = ctx.globalAlpha;
    if (opts.highlight) {
      const prevPt = pts[(minIdx - 1 + len) % len];
      const topPt = pts[minIdx];
      const nextPt = pts[(minIdx + 1) % len];
      ctx.globalAlpha = prevAlpha * 0.42;
      setInkStyle(ctx, Math.min(2.6, (opts.lineWidth ?? 2.0) * 0.95), opts.highlight);
      ctx.beginPath();
      ctx.moveTo((prevPt[0] + topPt[0]) * 0.5, (prevPt[1] + topPt[1]) * 0.5 + 1.2);
      ctx.lineTo(topPt[0], topPt[1] + 1.4);
      ctx.lineTo((nextPt[0] + topPt[0]) * 0.5, (nextPt[1] + topPt[1]) * 0.5 + 1.2);
      ctx.stroke();
    }
    ctx.globalAlpha = prevAlpha;

    // Re-trace only when highlight changed current path
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < len; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
  }

  setInkStyle(ctx, opts?.lineWidth ?? 2.1, opts?.ink ?? INK);
  ctx.stroke();
}

/** Draw a chunky bold-inked cartoon limb capsule with subtle specular highlight stripe */
export function drawInkLimb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  fill: string,
  outlineExtra = 3.8,
): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = thickness + outlineExtra;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = fill;
  ctx.lineWidth = thickness;
  ctx.stroke();

  // Subtle rim sheen along top edge of limb
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = Math.max(1.1, thickness * 0.28);
  ctx.beginPath();
  ctx.moveTo(x1 - 0.5, y1 - 0.6);
  ctx.lineTo(x2 - 0.5, y2 - 0.6);
  ctx.stroke();
}

/**
 * Draw an anatomically tapered Flash-cartoon limb segment (wider bicep/thigh tapering cleanly
 * toward wrist/ankle) with zero-clip cel shading, optional cuff band, hydraulic piston & crisp ink outline.
 */
export function drawSculptedLimb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  startWidth: number,
  endWidth: number,
  fill: string,
  opts?: {
    highlight?: string;
    shadow?: string;
    lineWidth?: number;
    cuffColor?: string;
    piston?: boolean;
  },
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;

  const angle = Math.atan2(dy, dx);
  const r1 = Math.max(1.2, startWidth * 0.5);
  const r2 = Math.max(1.0, endWidth * 0.5);

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);

  // Optional chrome hydraulic piston strut running along rear of armored mech leg!
  if (opts?.piston) {
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(len * 0.08, r1 * 0.55, len * 0.82, Math.max(2.2, r2 * 0.52), 1.2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(len * 0.16, r1 * 0.62, len * 0.64, 1.1);
  }

  // Build smooth tapered capsule path along local +X axis (0 -> len)
  ctx.beginPath();
  ctx.arc(0, 0, r1, Math.PI * 0.5, Math.PI * 1.5);
  ctx.lineTo(len, -r2);
  ctx.arc(len, 0, r2, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.closePath();

  ctx.fillStyle = fill;
  ctx.fill();

  const prevAlpha = ctx.globalAlpha;
  // Fast zero-clip cel-shadow lower strip & upper specular line tucked inside tapered capsule
  const rMin = Math.min(r1, r2);
  ctx.fillStyle = opts?.shadow ?? 'rgba(10, 14, 24, 0.26)';
  ctx.globalAlpha = prevAlpha * (opts?.shadow ? 0.38 : 0.8);
  ctx.fillRect(0, rMin * 0.15, len, rMin * 0.72);

  ctx.globalAlpha = prevAlpha * 0.34;
  ctx.fillStyle = opts?.highlight ?? '#ffffff';
  ctx.fillRect(0.6, -rMin * 0.74, Math.max(0.5, len - 1.2), Math.max(1.1, rMin * 0.34));
  ctx.globalAlpha = prevAlpha;

  if (opts?.cuffColor) {
    const cuffX = len * 0.65;
    const cuffW = len * 0.23;
    const rAtCuff = r1 + (r2 - r1) * 0.76;
    ctx.fillStyle = opts.cuffColor;
    ctx.fillRect(cuffX, -rAtCuff + 0.3, cuffW, (rAtCuff - 0.3) * 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(cuffX, -rAtCuff);
    ctx.lineTo(cuffX, rAtCuff);
    ctx.moveTo(cuffX + cuffW, -rAtCuff);
    ctx.lineTo(cuffX + cuffW, rAtCuff);
    ctx.stroke();
  }

  setInkStyle(ctx, opts?.lineWidth ?? 1.85);
  ctx.beginPath();
  ctx.arc(0, 0, r1, Math.PI * 0.5, Math.PI * 1.5);
  ctx.lineTo(len, -r2);
  ctx.arc(len, 0, r2, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a grounded, heroic Flash-cartoon boot with flat treaded sole, rounded toe cap,
 * specular toe glint, and optional ankle cuff lip (zero clip & zero gradient allocations).
 */
export function drawSculptedBoot(
  ctx: CanvasRenderingContext2D,
  ankleX: number,
  groundY: number,
  fill: string,
  opts?: {
    highlight?: string;
    cuffColor?: string;
    soleColor?: string;
    scale?: number;
  },
): void {
  const sc = opts?.scale ?? 1;
  ctx.save();
  ctx.translate(ankleX, groundY);
  if (sc !== 1) ctx.scale(sc, sc);

  // Boot upper profile (heel -> ankle -> arched vamp -> rounded toe -> flat sole)
  ctx.beginPath();
  ctx.moveTo(-3.4, -4.4);
  ctx.lineTo(2.0, -4.4);
  ctx.quadraticCurveTo(4.2, -3.2, 6.8, -2.1);
  ctx.quadraticCurveTo(8.2, -1.2, 7.6, 0.8);
  ctx.lineTo(-3.6, 0.8);
  ctx.quadraticCurveTo(-4.4, -1.5, -3.4, -4.4);
  ctx.closePath();

  ctx.fillStyle = fill;
  ctx.fill();

  // Sole strip & bright glossy toe cap highlight tucked inside boot contour (no clip!)
  ctx.fillStyle = opts?.soleColor ?? '#0f172a';
  ctx.fillRect(-3.4, -0.5, 10.6, 1.3);
  ctx.fillStyle = opts?.highlight ?? 'rgba(255, 255, 255, 0.34)';
  ctx.beginPath();
  ctx.ellipse(4.1, -2.0, 2.0, 0.85, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Re-stroke boot silhouette
  ctx.beginPath();
  ctx.moveTo(-3.4, -4.4);
  ctx.lineTo(2.0, -4.4);
  ctx.quadraticCurveTo(4.2, -3.2, 6.8, -2.1);
  ctx.quadraticCurveTo(8.2, -1.2, 7.6, 0.8);
  ctx.lineTo(-3.6, 0.8);
  ctx.quadraticCurveTo(-4.4, -1.5, -3.4, -4.4);
  ctx.closePath();
  setInkStyle(ctx, 1.75);
  ctx.stroke();

  // Optional folded boot cuff lip at top of ankle
  if (opts?.cuffColor) {
    drawCelRoundRect(ctx, -3.8, -5.8, 6.4, 2.4, 1, opts.cuffColor, {
      highlight: 'rgba(255,255,255,0.35)',
      lineWidth: 1.2,
    });
  }
  ctx.restore();
}

/** Draw a metallic bolt/rivet row along armor, tanks, cannons, or steampunk hull plates */
export function drawRivetStrip(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  count: number,
  radius = 1.6,
): void {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const rx = x1 + (x2 - x1) * t;
    const ry = y1 + (y2 - y1) * t;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(rx, ry, radius + 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(rx - 0.3, ry - 0.3, radius * 0.72, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Draw staggered hand-drawn cartoon stone brick courses inside an area */
export function drawStoneMasonry(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rows: number,
  cols: number,
  shadeDark = 'rgba(15, 23, 42, 0.22)',
  shadeLight = 'rgba(255, 255, 255, 0.14)',
): void {
  const rowH = h / Math.max(1, rows);
  const colW = w / Math.max(1, cols);
  ctx.save();
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW * 0.45);
    const by = y + r * rowH;
    for (let c = 0; c < cols; c++) {
      const bx = x + c * colW + offset;
      if (bx + colW * 0.75 > x + w) continue;
      const bw = Math.min(colW - 4, x + w - bx - 3);
      if (bw < 6) continue;
      if ((r * 5 + c * 3) % 3 === 0) {
        ctx.fillStyle = shadeDark;
        ctx.beginPath();
        ctx.roundRect(bx + 1, by + 2, bw, Math.max(4, rowH - 4), 2);
        ctx.fill();
      } else if ((r * 7 + c * 2) % 4 === 1) {
        ctx.fillStyle = shadeLight;
        ctx.beginPath();
        ctx.roundRect(bx + 1, by + 2, bw, Math.max(3, rowH * 0.45), 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/** Draw a flickering glowing cartoon wall torch / brazier for fortresses */
export function drawWallTorch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  scale = 1,
): void {
  const flicker = Math.sin(time * 13 + x) * 1.4;
  ctx.save();
  ctx.translate(x, y);
  if (scale !== 1) ctx.scale(scale, scale);

  // Warm radial torch light halo via cached glow sprite (zero createRadialGradient per frame!)
  const haloR = 23 + flicker;
  const sprite = getGlowSprite('#f97316', '#fef08a');
  if (sprite) {
    ctx.globalAlpha = 0.6;
    ctx.drawImage(sprite, -haloR, -10 - haloR, haloR * 2, haloR * 2);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = 'rgba(249, 115, 22, 0.24)';
    ctx.beginPath();
    ctx.arc(0, -10, haloR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Iron sconce & wooden torch shaft
  drawCelRoundRect(ctx, -2.5, -5, 5, 13, 1.5, '#78350f', { highlight: '#b45309', lineWidth: 1.5 });
  drawCelRoundRect(ctx, -4.5, -7, 9, 4, 1.5, '#334155', { highlight: '#94a3b8', lineWidth: 1.4 });

  // Animated tear-drop cartoon flame
  ctx.beginPath();
  ctx.moveTo(-4.5, -7);
  ctx.quadraticCurveTo(-5, -14, flicker * 0.5, -18 - flicker * 0.5);
  ctx.quadraticCurveTo(5, -14, 4.5, -7);
  ctx.closePath();
  ctx.fillStyle = '#f97316';
  ctx.fill();
  setInkStyle(ctx, 1.4, '#7c2d12');
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(0, -10.5, 2.3, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draw a true toothed rotating steampunk clockwork gear with beveled hub */
export function drawGearWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  teeth = 10,
  fill = '#f59e0b',
  highlight = '#fef08a',
  shadow = '#b45309',
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const outerR = radius * 1.18;
  const innerR = radius * 0.92;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.25) / teeth) * Math.PI * 2;
    const a2 = ((i + 0.55) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.8) / teeth) * Math.PI * 2;
    if (i === 0) ctx.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    else ctx.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    ctx.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
    ctx.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    ctx.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  setInkStyle(ctx, 2.1);
  ctx.stroke();

  // Inner beveled specular ring
  ctx.strokeStyle = highlight;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, -Math.PI * 0.85, Math.PI * 0.1);
  ctx.stroke();
  ctx.strokeStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, Math.PI * 0.15, Math.PI * 1.05);
  ctx.stroke();

  // Inner cutout ring & metallic axle hub
  drawCelEllipse(ctx, 0, 0, radius * 0.44, radius * 0.44, '#1e293b', { highlight: '#475569', lineWidth: 1.9 });
  drawCelEllipse(ctx, 0, 0, radius * 0.18, radius * 0.18, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.5 });
  ctx.restore();
}

/** Draw a fluttering 2-tone Bezier cartoon cape with golden trim anchored behind shoulders (zero clip) */
export function drawCartoonCape(
  ctx: CanvasRenderingContext2D,
  anchorX: number,
  anchorY: number,
  length: number,
  width: number,
  fill: string,
  darkFill: string,
  phase: number,
): void {
  const wave1 = Math.sin(phase * 1.45) * 4.2;
  const wave2 = Math.cos(phase * 1.95 + 0.7) * 5.0;
  const tipLeftX = anchorX - width + wave2 * 0.42;
  const tipLeftY = anchorY + length;
  const tipRightX = anchorX - width * 0.2 + wave1 * 0.5;
  const tipRightY = anchorY + length * 0.94;

  // Inner darker lining fold along rear edge
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.quadraticCurveTo(anchorX - width * 0.68, anchorY + length * 0.45 + wave1, tipLeftX, tipLeftY);
  ctx.lineTo(tipRightX, tipRightY);
  ctx.quadraticCurveTo(anchorX - width * 0.08, anchorY + length * 0.45, anchorX + 2, anchorY + 4);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  // Subtle vertical darker pleat fold without clip()
  ctx.strokeStyle = darkFill;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(anchorX - width * 0.24, anchorY + length * 0.24);
  ctx.quadraticCurveTo(
    anchorX - width * 0.42,
    anchorY + length * 0.58 + wave1 * 0.5,
    (tipLeftX + tipRightX) * 0.5,
    (tipLeftY + tipRightY) * 0.5 - 2,
  );
  ctx.stroke();

  // Golden hem trim directly along exact bottom edge from tipLeft -> tipRight!
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(tipLeftX + 1.2, tipLeftY - 1.6);
  ctx.lineTo(tipRightX - 1.0, tipRightY - 1.4);
  ctx.stroke();

  // Crisp outer ink silhouette
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.quadraticCurveTo(anchorX - width * 0.68, anchorY + length * 0.45 + wave1, tipLeftX, tipLeftY);
  ctx.lineTo(tipRightX, tipRightY);
  ctx.quadraticCurveTo(anchorX - width * 0.08, anchorY + length * 0.45, anchorX + 2, anchorY + 4);
  ctx.closePath();
  setInkStyle(ctx, 1.95);
  ctx.stroke();
}

/** Draw a rotating spoked wooden/bronze/iron cartoon wheel with iron tire rim & specular bevel */
export function drawCartoonWheel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  angle: number,
  rimColor = '#7c4a22',
  hubColor = '#d97706',
  spokes = 6,
  bladed = false,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Outer iron tire band
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#334155';
  ctx.fill();
  setInkStyle(ctx, 2.2);
  ctx.stroke();

  // Wooden/bronze rim
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
  ctx.fillStyle = rimColor;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Inner cutout shadow
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(12, 16, 26, 0.45)';
  ctx.fill();

  // Spokes with subtle sheen
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    setInkStyle(ctx, 2.6, '#3f230e');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius * 0.7, Math.sin(a) * radius * 0.7);
    ctx.stroke();
    setInkStyle(ctx, 1.2, '#b45309');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius * 0.65, Math.sin(a) * radius * 0.65);
    ctx.stroke();
  }

  // Optional scythe blades on chariot wheels
  if (bladed) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      drawCelPoly(
        ctx,
        [
          [radius * 0.5, -2.5],
          [radius * 1.32, -1],
          [radius * 0.88, 3.2],
        ],
        '#e2e8f0',
        { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.5 },
      );
      ctx.restore();
    }
  }

  // Central gleaming hubcap
  drawCelEllipse(ctx, 0, 0, radius * 0.3, radius * 0.3, hubColor, {
    highlight: '#fef08a',
    shadow: '#78350f',
    lineWidth: 1.8,
  });
  ctx.restore();
}

/** Draw an armored tank tread assembly with rolling cleats, metallic bogie wheels, and steel mudguard lip */
export function drawTankTreads(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rollPhase: number,
  wheelCount: number,
  trackFill = '#334155',
  wheelFill = '#64748b',
): void {
  const r = h * 0.48;
  drawCelRoundRect(ctx, x, y, w, h, r, '#1e293b', {
    highlight: '#475569',
    shadow: '#090d16',
    lineWidth: 2.5,
  });

  // Inner recessed track bed
  drawCelRoundRect(ctx, x + 4, y + 3, w - 8, h - 6, Math.max(2, r - 3), trackFill, {
    shadow: '#0f172a',
    lineWidth: 1.5,
  });

  // Spinning road wheels with metallic hubcap bolts
  const spacing = (w - h) / Math.max(1, wheelCount - 1);
  const wheelR = h * 0.31;
  for (let i = 0; i < wheelCount; i++) {
    const wx = x + r + i * spacing;
    const wy = y + h * 0.52;
    drawCelEllipse(ctx, wx, wy, wheelR, wheelR, wheelFill, {
      highlight: '#e2e8f0',
      shadow: '#1e293b',
      lineWidth: 1.6,
    });
    drawCelEllipse(ctx, wx, wy, wheelR * 0.36, wheelR * 0.36, '#94a3b8', { lineWidth: 1.1 });
    const lugX = wx + Math.cos(rollPhase * 2.2 + i) * (wheelR * 0.52);
    const lugY = wy + Math.sin(rollPhase * 2.2 + i) * (wheelR * 0.52);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(lugX, lugY, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rolling rubber tread cleats along bottom & top
  ctx.fillStyle = '#0f172a';
  const step = 7;
  const shift = ((rollPhase * 12) % step + step) % step;
  for (let cx = x + r * 0.6 + shift; cx < x + w - r * 0.6; cx += step) {
    ctx.fillRect(cx - 1.6, y + h - 2.6, 3.4, 3.2);
    ctx.fillRect(x + w - (cx - x) - 1.6, y - 1.1, 3.4, 2.6);
  }
}

/** Draw expressive Kingdom-Rush / Age-of-War cartoon face with glossy iris glint & crisp visor streaks */
export function drawCartoonFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  opts: {
    mood: 'normal' | 'attack' | 'hurt' | 'dead';
    eyeColor?: string;
    skin?: string;
    beard?: string;
    mask?: 'none' | 'visor' | 'goggles' | 'gasmask' | 'nvg' | 'skull' | 'jackal';
    visorColor?: string;
  },
): void {
  const { mood, mask = 'none' } = opts;

  if (mask === 'visor') {
    drawCelRoundRect(ctx, cx + 0.4, cy - 3.3, 8.6, 4.6, 2.0, opts.visorColor ?? '#38bdf8', {
      highlight: '#ffffff',
      lineWidth: 1.45,
    });
    // Crisp diagonal lens reflection slash
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + 2.2, cy - 2.6);
    ctx.lineTo(cx + 4.4, cy + 0.5);
    ctx.moveTo(cx + 5.2, cy - 2.5);
    ctx.lineTo(cx + 6.4, cy - 0.8);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (mask === 'nvg') {
    drawCelRoundRect(ctx, cx + 0.4, cy - 3.8, 8.8, 4.5, 1.8, '#1e293b', {
      highlight: '#64748b',
      lineWidth: 1.45,
    });
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(cx + 3.1, cy - 1.5, 1.85, 0, Math.PI * 2);
    ctx.arc(cx + 6.9, cy - 1.5, 1.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.arc(cx + 3.1, cy - 1.5, 1.05, 0, Math.PI * 2);
    ctx.arc(cx + 6.9, cy - 1.5, 1.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 2.4, cy - 2.5, 1.0, 1.0);
    ctx.fillRect(cx + 6.2, cy - 2.5, 1.0, 1.0);
    return;
  }

  if (mask === 'goggles') {
    // Leather goggle strap wrapping around head
    ctx.fillStyle = '#451a03';
    ctx.fillRect(cx - 7.8, cy - 2.4, 10.5, 2.2);
    drawCelEllipse(ctx, cx + 3.1, cy - 1.4, 2.8, 2.6, '#d97706', { highlight: '#fef08a', lineWidth: 1.45 });
    drawCelEllipse(ctx, cx + 7.2, cy - 1.4, 2.45, 2.35, '#d97706', { highlight: '#fef08a', lineWidth: 1.45 });
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.arc(cx + 3.3, cy - 1.4, 1.55, 0, Math.PI * 2);
    ctx.arc(cx + 7.2, cy - 1.4, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(cx + 2.8, cy - 2.0, 0.72, 0, Math.PI * 2);
    ctx.arc(cx + 6.7, cy - 2.0, 0.68, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (mask === 'gasmask') {
    drawCelEllipse(ctx, cx + 2.6, cy - 1.6, 2.45, 2.35, '#94a3b8', { highlight: '#ffffff', lineWidth: 1.45 });
    drawCelEllipse(ctx, cx + 6.6, cy - 1.6, 2.1, 2.1, '#94a3b8', { highlight: '#ffffff', lineWidth: 1.45 });
    // Dark smoked lenses with reflection glint
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx + 2.7, cy - 1.6, 1.35, 0, Math.PI * 2);
    ctx.arc(cx + 6.6, cy - 1.6, 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(cx + 2.1, cy - 2.3, 0.9, 0.9);
    ctx.fillRect(cx + 6.1, cy - 2.3, 0.8, 0.8);
    // Snout filter canister + vent grille
    drawCelRoundRect(ctx, cx + 2.6, cy + 0.6, 6.6, 4.6, 2.0, '#475569', {
      highlight: '#94a3b8',
      shadow: '#0f172a',
      lineWidth: 1.55,
    });
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx + 6.8, cy + 1.8, 1.6, 2.2);
    return;
  }

  ctx.save();
  // Subtle rounded ear contour on back of face
  if (opts.skin) {
    drawCelEllipse(ctx, cx - 5.8, cy + 0.2, 1.7, 2.2, opts.skin, {
      shadow: 'rgba(120,53,15,0.28)',
      lineWidth: 1.3,
    });
  }

  setInkStyle(ctx, 1.35);
  if (mood === 'dead') {
    ctx.beginPath();
    ctx.moveTo(cx + 1.5, cy - 2.8);
    ctx.lineTo(cx + 5.2, cy + 0.6);
    ctx.moveTo(cx + 5.2, cy - 2.8);
    ctx.lineTo(cx + 1.5, cy + 0.6);
    ctx.stroke();
  } else if (mood === 'hurt') {
    ctx.beginPath();
    ctx.moveTo(cx + 1.4, cy - 2.6);
    ctx.lineTo(cx + 5.2, cy - 1);
    ctx.lineTo(cx + 1.4, cy + 0.6);
    ctx.stroke();
  } else {
    // Subtle warm cheek blush & crisp nose bridge tick
    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.beginPath();
    ctx.ellipse(cx + 2.0, cy + 1.7, 2.1, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crisp expressive eye with upper lash accent + iris ring + double white specular catchlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx + 3.7, cy - 1.2, 2.45, 2.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Colored iris + crisp dark pupil
    ctx.fillStyle = opts.eyeColor ?? '#1e293b';
    ctx.beginPath();
    ctx.arc(cx + 4.45, cy - 1.05, 1.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(cx + 4.55, cy - 1.05, 0.78, 0, Math.PI * 2);
    ctx.fill();
    // Primary + secondary glossy catchlight dots
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 3.9, cy - 1.75, 0.62, 0, Math.PI * 2);
    ctx.arc(cx + 4.9, cy - 0.35, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Expressive angled heroic brow
    setInkStyle(ctx, 1.85);
    ctx.beginPath();
    ctx.moveTo(cx + 0.6, cy - (mood === 'attack' ? 4.7 : 3.9));
    ctx.lineTo(cx + 6.7, cy - (mood === 'attack' ? 2.4 : 3.25));
    ctx.stroke();

    // Mouth: determined smirk normally, fierce battle-cry with gleaming teeth on attack!
    if (mood === 'attack') {
      setInkStyle(ctx, 1.3);
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.ellipse(cx + 4.0, cy + 3.2, 2.4, 1.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 2.4, cy + 1.9, 3.1, 1.15);
    } else if (!opts.beard) {
      setInkStyle(ctx, 1.25, '#5c3412');
      ctx.beginPath();
      ctx.moveTo(cx + 2.8, cy + 3.1);
      ctx.quadraticCurveTo(cx + 4.5, cy + 3.4, cx + 5.7, cy + 2.7);
      ctx.stroke();
    }
  }

  if (opts.beard) {
    drawCelPoly(
      ctx,
      [
        [cx - 1.6, cy + 1.9],
        [cx + 6.8, cy + 2.1],
        [cx + 5.4, cy + 7.6],
        [cx + 1.6, cy + 6.8],
        [cx - 0.6, cy + 7.2],
      ],
      opts.beard,
      { shadow: INK_SOFT, lineWidth: 1.5 },
    );
  }
  ctx.restore();
}

/** Draw a comic starburst muzzle flash or impact sparkle at (x, y) pointing right */
export function drawCartoonMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  outerColor = '#f97316',
  coreColor = '#fef08a',
): void {
  ctx.save();
  ctx.translate(x, y);
  // Subtle fiery bloom halo via cached glow sprite
  const haloR = size * 1.45;
  const sprite = getGlowSprite(outerColor, coreColor);
  if (sprite) {
    ctx.globalAlpha = 0.6;
    ctx.drawImage(sprite, size * 0.2 - haloR, -haloR, haloR * 2, haloR * 2);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
    ctx.beginPath();
    ctx.arc(size * 0.2, 0, haloR, 0, Math.PI * 2);
    ctx.fill();
  }

  const spikes = 7;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const isOuter = i % 2 === 0;
    const forwardStretch = Math.cos(a) > 0 ? 1.48 : 0.72;
    const r = (isOuter ? size : size * 0.42) * forwardStretch;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = outerColor;
  ctx.fill();
  setInkStyle(ctx, 1.6, '#7c2d12');
  ctx.stroke();

  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.ellipse(size * 0.18, 0, size * 0.46, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size * 0.15, 0, size * 0.19, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draw a glowing cel energy orb (plasma, solar, antimatter, mystic totem) using cached glow sprite */
export function drawEnergyOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  outerColor: string,
  innerColor = '#ffffff',
): void {
  const haloR = r * 2.15;
  const sprite = getGlowSprite(outerColor, innerColor);
  if (sprite) {
    ctx.drawImage(sprite, x - haloR, y - haloR, haloR * 2, haloR * 2);
  } else {
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = prevAlpha * 0.3;
    ctx.fillStyle = outerColor;
    ctx.beginPath();
    ctx.arc(x, y, haloR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = prevAlpha;
  }

  ctx.fillStyle = outerColor;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  setInkStyle(ctx, 1.5);
  ctx.stroke();

  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.arc(x - r * 0.24, y - r * 0.24, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
}

export interface HumanoidRigConfig {
  walkPhase: number;
  isWalking: boolean;
  attackAnim: number; // 1 at strike start -> 0
  hitFlash: number;
  deathProgress: number;
  scale?: number;
  torsoW?: number;
  torsoH?: number;
  headR?: number;
  legLen?: number;
  skin: string;
  skinShadow?: string;
  torsoFill: string;
  torsoHighlight?: string;
  torsoShadow?: string;
  beltColor?: string;
  pantsColor: string;
  bootColor: string;
  bootCuffColor?: string;
  armColor?: string;
  sleeveCuffColor?: string;
  gloveColor?: string;
  skirtColor?: string;
  skirtTrim?: string;
  skirtStyle?: 'tunic' | 'kilt' | 'tassets' | 'coat' | 'none';
  trimHighlight?: string;
  capeColor?: string;
  capeDark?: string;
  pauldronColor?: string;
  pauldronTrim?: string;
  mask?: 'none' | 'visor' | 'goggles' | 'gasmask' | 'nvg' | 'skull' | 'jackal';
  visorColor?: string;
  beardColor?: string;
  eyeColor?: string;
  swingStyle?: 'overhead' | 'thrust' | 'aim' | 'throw' | 'dual' | 'staff';
  drawBackAccessory?: (ctx: CanvasRenderingContext2D, torsoTopY: number) => void;
  drawTorsoDetail?: (ctx: CanvasRenderingContext2D, torsoX: number, torsoY: number, torsoW: number, torsoH: number) => void;
  drawHelmet?: (ctx: CanvasRenderingContext2D, headX: number, headY: number, headR: number) => void;
  drawOffhand?: (ctx: CanvasRenderingContext2D, handX: number, handY: number) => void;
  drawWeapon: (ctx: CanvasRenderingContext2D, firing: boolean, strikePower: number) => void;
}

/**
 * Studio-grade Age-of-War-2 / Kingdom-Rush articulated humanoid rig with tapered sculpted limbs,
 * bent-elbow 2-segment arms, grounded cuffed boots, hip skirts/tassets/coats, crisp ink weight
 * hierarchy, 12-principles anticipation/follow-through, and anime weapon smears.
 */
export function drawCartoonHumanoid(ctx: CanvasRenderingContext2D, cfg: HumanoidRigConfig): void {
  const s = (cfg.scale ?? 1) * 1.04;
  const torsoW = cfg.torsoW ?? 16.8;
  const torsoH = cfg.torsoH ?? 19.2;
  const headR = cfg.headR ?? 8.4;
  const legLen = cfg.legLen ?? 16.0;
  const dp = cfg.deathProgress;

  const idleBreath = Math.sin(cfg.walkPhase * 1.15);
  const stride = cfg.isWalking ? Math.sin(cfg.walkPhase) : 0;
  const liftA = cfg.isWalking ? Math.max(0, -Math.cos(cfg.walkPhase)) * 4.8 : 0;
  const liftB = cfg.isWalking ? Math.max(0, Math.cos(cfg.walkPhase)) * 4.8 : 0;
  const bob = cfg.isWalking ? Math.abs(Math.sin(cfg.walkPhase)) * 3.0 : idleBreath * 1.1;

  const atk = cfg.attackAnim;
  const firing = atk > 0.42 && atk < 0.84;
  let weaponAngle = cfg.isWalking ? Math.sin(cfg.walkPhase) * 0.08 : idleBreath * 0.055;
  let weaponPushX = 0;
  let weaponPushY = cfg.isWalking ? Math.cos(cfg.walkPhase * 2) * 0.7 : idleBreath * 0.65;
  let torsoLean = cfg.isWalking ? 0.12 + Math.sin(cfg.walkPhase * 2) * 0.025 : 0.03 + idleBreath * 0.02;
  let headLag = cfg.isWalking ? -0.055 * Math.cos(cfg.walkPhase) : -idleBreath * 0.028;
  let attackStanceShift = 0;

  const style = cfg.swingStyle ?? 'overhead';
  if (atk > 0.01) {
    if (style === 'overhead') {
      if (atk > 0.72) {
        const t = (1 - atk) / 0.28;
        const ease = Math.sin(t * Math.PI * 0.5);
        weaponAngle = -1.88 * ease;
        torsoLean = -0.24 * ease;
        weaponPushX = -3.5 * ease;
        headLag = -0.1 * ease;
        attackStanceShift = -2.2 * ease;
      } else if (atk > 0.30) {
        const t = (0.72 - atk) / 0.42;
        const snap = Math.sin(t * Math.PI * 0.5);
        weaponAngle = -1.88 + 3.16 * snap;
        torsoLean = -0.24 + 0.52 * snap;
        weaponPushX = -3.5 + 10.5 * snap;
        headLag = 0.12 * snap;
        attackStanceShift = 4.2 * snap;
      } else {
        const t = atk / 0.30;
        weaponAngle = 1.28 * t;
        torsoLean = 0.28 * t;
        weaponPushX = 7.0 * t;
        attackStanceShift = 4.2 * t;
      }
    } else if (style === 'thrust') {
      if (atk > 0.68) {
        const t = (1 - atk) / 0.32;
        weaponPushX = -8.5 * t;
        torsoLean = -0.16 * t;
        attackStanceShift = -2.5 * t;
      } else if (atk > 0.26) {
        const t = (0.68 - atk) / 0.42;
        const snap = Math.sin(t * Math.PI * 0.5);
        weaponPushX = -8.5 + 29 * snap;
        torsoLean = -0.16 + 0.42 * snap;
        attackStanceShift = 5.0 * snap;
      } else {
        const t = atk / 0.26;
        weaponPushX = 20.5 * t;
        torsoLean = 0.26 * t;
        attackStanceShift = 5.0 * t;
      }
    } else if (style === 'aim') {
      const recoil = atk > 0.40 ? Math.sin(((atk - 0.40) / 0.60) * Math.PI) : 0;
      weaponPushX = -6.2 * recoil;
      weaponAngle = -0.24 * recoil;
      torsoLean = -0.14 * recoil;
      headLag = -0.08 * recoil;
      attackStanceShift = -2.2 * recoil;
    } else if (style === 'throw') {
      if (atk > 0.62) {
        const t = (1 - atk) / 0.38;
        weaponAngle = -2.0 * t;
        torsoLean = -0.24 * t;
        attackStanceShift = -2.5 * t;
      } else {
        const t = (0.62 - atk) / 0.62;
        weaponAngle = -2.0 + 2.8 * t;
        torsoLean = -0.24 + 0.52 * t;
        weaponPushX = 7.5 * t;
        attackStanceShift = 4.0 * t;
      }
    } else if (style === 'staff') {
      const surge = Math.sin(atk * Math.PI);
      weaponPushY = -7.5 * surge;
      weaponAngle = -0.42 * surge;
      torsoLean = 0.16 * surge;
      headLag = -0.08 * surge;
    } else if (style === 'dual') {
      const slash = Math.sin(atk * Math.PI);
      weaponAngle = -1.55 + slash * 2.85;
      weaponPushX = 9.0 * slash;
      torsoLean = 0.28 * slash;
      attackStanceShift = 4.5 * slash;
    }
  }

  const mood: 'normal' | 'attack' | 'hurt' | 'dead' =
    dp > 0.2 ? 'dead' : cfg.hitFlash > 0.32 ? 'hurt' : atk > 0.22 ? 'attack' : 'normal';

  const armBase = cfg.armColor ?? cfg.skin;
  const handFill = cfg.gloveColor ?? cfg.skin;
  const cuffAccent = cfg.sleeveCuffColor ?? cfg.beltColor ?? '#475569';
  const bootCuff = cfg.bootCuffColor ?? cfg.pauldronTrim;

  ctx.save();
  ctx.scale(s, s);

  // Subtle glowing arcane cast circle beneath boots for Staff casters!
  if (dp === 0 && style === 'staff' && atk > 0.18) {
    const surge = Math.sin(atk * Math.PI);
    ctx.save();
    ctx.strokeStyle = `rgba(250, 204, 21, ${(surge * 0.85).toFixed(2)})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(2, -1, 14 + surge * 5, 4.2 + surge * 1.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (dp > 0) {
    const fall = Math.min(1, dp * 1.45);
    ctx.translate(-fall * 9, -fall * 4);
    ctx.rotate(-fall * 1.52);
  } else if (cfg.hitFlash > 0.35) {
    const k = (cfg.hitFlash - 0.35) / 0.65;
    ctx.rotate(-0.22 * k);
  }

  const hipY = -legLen - bob;
  const torsoTopY = hipY - torsoH;
  const shoulderY = torsoTopY + 5.2;

  // 1. Back fluttering 2-tone cape with bold dynamic wave during attack!
  if (cfg.capeColor) {
    drawCartoonCape(
      ctx,
      -torsoW * 0.38,
      shoulderY - 1,
      torsoH + legLen * 0.56,
      torsoW * 1.05 + (atk > 0.2 ? 3.5 : 0),
      cfg.capeColor,
      cfg.capeDark ?? INK_SOFT,
      cfg.walkPhase + atk * 5.2,
    );
  }

  // 2. Sculpted tapered Back Leg + knee plate + grounded hero boot
  const backFootX = -2.8 - stride * 8.4 - Math.max(0, attackStanceShift * 0.35);
  const backFootY = -1.2 - liftB;
  const backKneeX = (-2.8 + backFootX) * 0.5 + 3.0;
  const backKneeY = (hipY + backFootY) * 0.5;
  drawSculptedLimb(ctx, -2.8, hipY + 0.5, backKneeX, backKneeY, 6.0, 4.5, cfg.pantsColor, {
    shadow: 'rgba(0,0,0,0.36)',
    lineWidth: 1.75,
  });
  drawSculptedLimb(ctx, backKneeX, backKneeY, backFootX, backFootY - 2.2, 4.7, 3.7, cfg.bootColor, {
    shadow: '#090d16',
    lineWidth: 1.7,
    cuffColor: bootCuff,
  });
  drawSculptedBoot(ctx, backFootX, backFootY, cfg.bootColor, {
    cuffColor: bootCuff,
    scale: 0.96,
  });

  // 3. Articulated 2-segment Back Arm (shoulder -> bent elbow -> bracer -> hand)
  const backArmSwing = cfg.isWalking ? -stride * 4.4 : Math.sin(cfg.walkPhase * 1.1) * 0.8;
  const dualCounterX = style === 'dual' && atk > 0.1 ? Math.sin(atk * Math.PI) * 9.5 : 0;
  const backHandX = torsoW * 0.38 + backArmSwing + dualCounterX;
  const backHandY = shoulderY + 6.5 + (atk > 0.2 ? -2.8 : 0);
  const backElbowX = (2.4 + backHandX) * 0.5 - 1.4;
  const backElbowY = (shoulderY + 1 + backHandY) * 0.5 + 1.8;
  drawSculptedLimb(ctx, 2.4, shoulderY + 1, backElbowX, backElbowY, 5.1, 4.1, armBase, {
    shadow: 'rgba(0,0,0,0.32)',
    lineWidth: 1.65,
  });
  drawSculptedLimb(ctx, backElbowX, backElbowY, backHandX, backHandY, 4.1, 3.3, armBase, {
    shadow: 'rgba(0,0,0,0.28)',
    cuffColor: cuffAccent,
    lineWidth: 1.6,
  });
  drawCelEllipse(ctx, backHandX, backHandY, 2.7, 2.5, handFill, { lineWidth: 1.45 });

  // 4. Sculpted tapered Front Leg + armored knee guard + grounded hero boot
  const frontFootX = 3.0 + stride * 8.4 + Math.max(0, attackStanceShift * 0.65);
  const frontFootY = -1.2 - liftA;
  const frontKneeX = (3.0 + frontFootX) * 0.5 + 3.6;
  const frontKneeY = (hipY + frontFootY) * 0.5;
  drawSculptedLimb(ctx, 3.0, hipY + 0.5, frontKneeX, frontKneeY, 6.4, 4.8, cfg.pantsColor, {
    highlight: 'rgba(255,255,255,0.26)',
    shadow: 'rgba(0,0,0,0.26)',
    lineWidth: 1.85,
  });
  drawSculptedLimb(ctx, frontKneeX, frontKneeY, frontFootX, frontFootY - 2.2, 5.0, 3.9, cfg.bootColor, {
    highlight: 'rgba(255,255,255,0.28)',
    shadow: '#090d16',
    lineWidth: 1.8,
    cuffColor: bootCuff,
  });
  // Sculpted knee guard plate
  drawCelEllipse(ctx, frontKneeX + 0.9, frontKneeY, 2.8, 2.4, cfg.pauldronColor ?? cfg.bootColor, {
    highlight: 'rgba(255,255,255,0.42)',
    lineWidth: 1.35,
  });
  drawSculptedBoot(ctx, frontFootX, frontFootY, cfg.bootColor, {
    highlight: 'rgba(255,255,255,0.34)',
    cuffColor: bootCuff,
    scale: 1.0,
  });

  // 5. Upper body (heroic V-tapered torso leaning dynamically during walk/attack)
  ctx.save();
  ctx.translate(attackStanceShift * 0.35, hipY);
  ctx.rotate(torsoLean);
  ctx.translate(0, -hipY);

  if (cfg.drawBackAccessory) {
    cfg.drawBackAccessory(ctx, torsoTopY);
  }

  const topHalfW = torsoW * 0.58;
  const botHalfW = torsoW * 0.44;

  // Tailored heroic hip skirt / kilt / tassets / coat-tail cleanly framing upper thighs!
  const skirtStyle = cfg.skirtStyle ?? (cfg.skirtColor ? 'tunic' : 'none');
  if (skirtStyle !== 'none') {
    const skColor = cfg.skirtColor ?? cfg.torsoFill;
    const skTrim = cfg.skirtTrim ?? cfg.pauldronTrim;
    const sway = stride * 1.4;
    if (skirtStyle === 'kilt') {
      drawCelPoly(
        ctx,
        [
          [-botHalfW - 0.5, hipY - 0.8],
          [botHalfW + 0.5, hipY - 0.8],
          [botHalfW + 2.0 + sway * 0.35, hipY + 5.2],
          [-botHalfW - 1.8 - sway * 0.35, hipY + 5.2],
        ],
        skColor,
        { highlight: 'rgba(255,255,255,0.22)', shadow: 'rgba(0,0,0,0.32)', lineWidth: 1.55 },
      );
      setInkStyle(ctx, 1.1, INK_SOFT);
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(k * (botHalfW * 0.55), hipY - 0.5);
        ctx.lineTo(k * (botHalfW * 0.65) + sway * 0.2, hipY + 4.8);
        ctx.stroke();
      }
      if (skTrim) {
        setInkStyle(ctx, 1.4, skTrim);
        ctx.beginPath();
        ctx.moveTo(-botHalfW - 1.2, hipY + 4.2);
        ctx.lineTo(botHalfW + 1.4, hipY + 4.2);
        ctx.stroke();
      }
    } else if (skirtStyle === 'tassets') {
      drawCelPoly(
        ctx,
        [
          [-botHalfW - 1.0, hipY - 0.8],
          [-0.4, hipY - 0.8],
          [-1.0, hipY + 5.4],
          [-botHalfW - 2.0, hipY + 4.2],
        ],
        skColor,
        { highlight: 'rgba(255,255,255,0.38)', shadow: 'rgba(0,0,0,0.34)', lineWidth: 1.5 },
      );
      drawCelPoly(
        ctx,
        [
          [0.4, hipY - 0.8],
          [botHalfW + 1.0, hipY - 0.8],
          [botHalfW + 2.0, hipY + 4.2],
          [1.0, hipY + 5.4],
        ],
        skColor,
        { highlight: 'rgba(255,255,255,0.38)', shadow: 'rgba(0,0,0,0.34)', lineWidth: 1.5 },
      );
      if (skTrim) {
        drawCelPoly(
          ctx,
          [
            [-2.0, hipY - 0.8],
            [2.2, hipY - 0.8],
            [1.4, hipY + 5.8],
            [-1.4, hipY + 5.8],
          ],
          skTrim,
          { lineWidth: 1.25 },
        );
      }
    } else if (skirtStyle === 'coat') {
      drawCelPoly(
        ctx,
        [
          [-botHalfW - 0.5, hipY - 1.2],
          [botHalfW + 0.5, hipY - 1.2],
          [botHalfW + 1.2, hipY + 4.8],
          [-botHalfW - 4.4 - sway * 0.5, hipY + 6.8],
        ],
        skColor,
        { highlight: 'rgba(255,255,255,0.2)', shadow: 'rgba(0,0,0,0.36)', lineWidth: 1.6 },
      );
      if (skTrim) {
        setInkStyle(ctx, 1.4, skTrim);
        ctx.beginPath();
        ctx.moveTo(-botHalfW - 3.6, hipY + 5.6);
        ctx.lineTo(botHalfW + 0.6, hipY + 4.0);
        ctx.stroke();
      }
    } else {
      drawCelPoly(
        ctx,
        [
          [-botHalfW - 0.4, hipY - 0.8],
          [botHalfW + 0.4, hipY - 0.8],
          [botHalfW + 1.2, hipY + 5.0],
          [0.2, hipY + 6.4],
          [-botHalfW - 1.4, hipY + 4.8],
        ],
        skColor,
        { highlight: 'rgba(255,255,255,0.24)', shadow: 'rgba(0,0,0,0.3)', lineWidth: 1.55 },
      );
      if (skTrim) {
        setInkStyle(ctx, 1.4, skTrim);
        ctx.beginPath();
        ctx.moveTo(-botHalfW - 0.6, hipY + 4.1);
        ctx.lineTo(0.2, hipY + 5.4);
        ctx.lineTo(botHalfW + 0.6, hipY + 4.1);
        ctx.stroke();
      }
    }
  }

  // Heroic V-tapered athletic silhouette torso (wider armored shoulders tapering to waist!)
  drawCelPoly(
    ctx,
    [
      [-topHalfW, torsoTopY + 2.2],
      [-topHalfW + 3.2, torsoTopY - 0.6],
      [topHalfW - 2.6, torsoTopY - 0.6],
      [topHalfW + 1.0, torsoTopY + 3.0],
      [botHalfW + 0.5, hipY + 1.5],
      [-botHalfW - 0.5, hipY + 1.5],
    ],
    cfg.torsoFill,
    {
      highlight: cfg.torsoHighlight ?? 'rgba(255,255,255,0.30)',
      shadow: cfg.torsoShadow ?? 'rgba(0,0,0,0.32)',
      lineWidth: 2.15,
    },
  );

  // Subtle top-shoulder rim gleam so dark-armored characters read clearly against dark skies!
  if (cfg.trimHighlight) {
    setInkStyle(ctx, 1.45, cfg.trimHighlight);
    ctx.beginPath();
    ctx.moveTo(-topHalfW + 2.5, torsoTopY + 0.5);
    ctx.lineTo(topHalfW - 2.2, torsoTopY + 0.5);
    ctx.stroke();
  }

  if (cfg.drawTorsoDetail) {
    cfg.drawTorsoDetail(ctx, -torsoW / 2, torsoTopY, torsoW, torsoH + 2);
  }

  // Waist belt + gleaming golden buckle + side stud accents
  if (cfg.beltColor) {
    drawCelRoundRect(ctx, -botHalfW - 1.5, hipY - 3.9, botHalfW * 2 + 3.0, 4.4, 1.5, cfg.beltColor, {
      highlight: 'rgba(255,255,255,0.2)',
      shadow: '#0f172a',
      lineWidth: 1.55,
    });
    drawCelRoundRect(ctx, 0.5, hipY - 4.1, 4.7, 4.8, 1.1, '#facc15', {
      highlight: '#fef08a',
      shadow: '#b45309',
      lineWidth: 1.3,
    });
    ctx.fillStyle = '#78350f';
    ctx.fillRect(2.2, hipY - 2.3, 1.4, 1.4);
  }

  // Head + expressive face with slight secondary spring tilt!
  const headX = 1.4;
  const headY = torsoTopY - headR * 0.78;
  ctx.save();
  ctx.translate(headX, headY + headR * 0.45);
  ctx.rotate(headLag);
  ctx.translate(-headX, -(headY + headR * 0.45));

  // Subtle grounded neck cylinder + collar shadow
  drawCelRoundRect(ctx, headX - 3.2, torsoTopY - 2.4, 6.4, 4.0, 1.5, cfg.skin, {
    shadow: cfg.skinShadow ?? 'rgba(120,53,15,0.4)',
    lineWidth: 1.35,
  });

  drawCelEllipse(ctx, headX, headY, headR * 1.06, headR, cfg.skin, {
    highlight: 'rgba(255,255,255,0.36)',
    shadow: cfg.skinShadow ?? 'rgba(120,53,15,0.24)',
    lineWidth: 2.0,
  });

  const maskOverHelmet = cfg.mask === 'goggles' || cfg.mask === 'nvg' || cfg.mask === 'gasmask';
  if (!maskOverHelmet) {
    drawCartoonFace(ctx, headX, headY + 0.5, {
      mood,
      eyeColor: cfg.eyeColor,
      skin: cfg.skin,
      beard: cfg.beardColor,
      mask: cfg.mask,
      visorColor: cfg.visorColor,
    });
  }

  if (cfg.drawHelmet) {
    cfg.drawHelmet(ctx, headX, headY, headR);
  }

  // Render goggles, NVGs, and gasmask respirators cleanly OVER the helmet brim!
  if (maskOverHelmet) {
    drawCartoonFace(ctx, headX, headY + 0.5, {
      mood,
      eyeColor: cfg.eyeColor,
      skin: cfg.skin,
      beard: cfg.beardColor,
      mask: cfg.mask,
      visorColor: cfg.visorColor,
    });
  }
  ctx.restore();

  // Front arm & main weapon + multi-layer anime motion-blur smears across ALL attack styles!
  const shoulderX = -1.6;
  ctx.save();
  ctx.translate(shoulderX + weaponPushX * 0.42, shoulderY + weaponPushY * 0.42);

  if ((style === 'overhead' || style === 'dual') && atk > 0.28 && atk < 0.74) {
    const smearAlpha = Math.sin(((atk - 0.28) / 0.46) * Math.PI);
    const smearStart = -1.92;
    const smearEnd = Math.max(smearStart + 0.35, weaponAngle + 0.16);
    ctx.save();
    ctx.globalAlpha = smearAlpha * 0.48;
    ctx.strokeStyle = style === 'dual' ? '#67e8f9' : '#fbbf24';
    ctx.lineWidth = 11.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(3, 0, 27, smearStart, smearEnd);
    ctx.stroke();

    ctx.globalAlpha = smearAlpha * 0.85;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.arc(3, 0, 30, smearStart + 0.25, smearEnd);
    ctx.stroke();

    if (style === 'dual') {
      ctx.globalAlpha = smearAlpha * 0.62;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.arc(5, 2, 22, -smearEnd * 0.6, smearEnd * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  } else if (style === 'thrust' && atk > 0.26 && atk < 0.68) {
    const thrustAlpha = Math.sin(((atk - 0.26) / 0.42) * Math.PI);
    ctx.save();
    ctx.globalAlpha = thrustAlpha * 0.78;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, -5);
    ctx.lineTo(36, -2);
    ctx.moveTo(10, 6);
    ctx.lineTo(38, 3);
    ctx.stroke();
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(24, 1, 3.5, 9.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (style === 'throw' && atk > 0.25 && atk < 0.62) {
    const whooshAlpha = Math.sin(((atk - 0.25) / 0.37) * Math.PI) * 0.65;
    ctx.save();
    ctx.globalAlpha = whooshAlpha;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(2, -2, 22, -1.9, -0.2);
    ctx.stroke();
    ctx.restore();
  } else if (style === 'aim' && atk > 0.46 && atk < 0.86) {
    const t = (0.86 - atk) / 0.40;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t) * 0.9;
    ctx.fillStyle = '#fde047';
    ctx.translate(10 - t * 9, -6 - Math.sin(t * Math.PI) * 11);
    ctx.rotate(t * 9);
    ctx.fillRect(-2.2, -1.0, 4.4, 2.0);
    ctx.restore();
  }

  ctx.rotate(weaponAngle);

  // Articulated 2-segment bent-elbow front arm!
  const handX = 9.0 + weaponPushX * 0.58;
  const handY = 4.4 + weaponPushY * 0.58;
  const elbowX = handX * 0.44 - 1.6;
  const elbowY = handY * 0.58 + 2.4;
  drawSculptedLimb(ctx, 0, 0, elbowX, elbowY, 5.7, 4.6, armBase, {
    highlight: 'rgba(255,255,255,0.28)',
    shadow: 'rgba(0,0,0,0.24)',
    lineWidth: 1.75,
  });
  drawSculptedLimb(ctx, elbowX, elbowY, handX, handY, 4.7, 3.8, armBase, {
    highlight: 'rgba(255,255,255,0.28)',
    shadow: 'rgba(0,0,0,0.22)',
    cuffColor: cuffAccent,
    lineWidth: 1.7,
  });

  // Draw weapon tucked cleanly in hand grip, then thumb/knuckles gripping over hilt!
  ctx.save();
  ctx.translate(handX, handY);
  cfg.drawWeapon(ctx, firing, atk);
  ctx.restore();

  drawCelEllipse(ctx, handX, handY, 3.3, 2.9, handFill, {
    highlight: '#ffffff',
    shadow: 'rgba(0,0,0,0.22)',
    lineWidth: 1.55,
  });

  if (cfg.pauldronColor) {
    drawCelEllipse(ctx, 0, -1.3, 6.2, 5.2, cfg.pauldronColor, {
      highlight: 'rgba(255,255,255,0.50)',
      shadow: 'rgba(0,0,0,0.32)',
      lineWidth: 1.85,
    });
    if (cfg.pauldronTrim) {
      ctx.strokeStyle = cfg.pauldronTrim;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -1.3, 3.9, 0.15, Math.PI * 0.9);
      ctx.stroke();
    }
    // Crisp metallic pauldron boss rivet
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(-1.8, -2.8, 1.0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  if (cfg.drawOffhand) {
    const shieldX = torsoW * 0.48 + (atk > 0.25 ? 3.2 : 0);
    const shieldY = shoulderY + 6.5;
    cfg.drawOffhand(ctx, shieldX, shieldY);
  }

  ctx.restore();
  ctx.restore();
}
