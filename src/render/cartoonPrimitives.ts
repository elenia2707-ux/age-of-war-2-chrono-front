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

export function setInkStyle(ctx: CanvasRenderingContext2D, lineWidth = 2.2, color = INK): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

/** Draw a richly cel-shaded rounded rectangle with directional gradient, glossy top rim, bottom AO shadow, and crisp ink outline */
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
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rad);

  if (opts?.highlight || opts?.shadow) {
    const grad = ctx.createLinearGradient(x, y, x + w * 0.25, y + h);
    grad.addColorStop(0, opts.highlight ?? fill);
    grad.addColorStop(0.32, fill);
    grad.addColorStop(0.76, fill);
    grad.addColorStop(1, opts.shadow ?? fill);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = fill;
  }
  ctx.fill();

  // Crisp cel-shaded specular sheen + curved bottom shadow band inside clip
  ctx.save();
  ctx.clip();
  ctx.fillStyle = opts?.shadow ?? 'rgba(10, 14, 24, 0.2)';
  ctx.fillRect(x, y + h * 0.72, w, h * 0.34);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(x + 1.5, y + 1.2, Math.max(0, w - 3), Math.max(1.8, Math.min(4.5, h * 0.2)));
  ctx.restore();

  setInkStyle(ctx, opts?.lineWidth ?? 2.1, opts?.ink ?? INK);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rad);
  ctx.stroke();
  ctx.restore();
}

/** Draw a painterly cel-shaded ellipse with radial highlight, crescent shadow, specular dot, and bold ink outline */
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
  ctx.save();
  ctx.translate(cx, cy);
  if (opts?.rotation) ctx.rotate(opts.rotation);

  ctx.beginPath();
  ctx.ellipse(0, 0, safeRx, safeRy, 0, 0, Math.PI * 2);

  if (opts?.highlight || opts?.shadow) {
    const grad = ctx.createLinearGradient(-safeRx * 0.6, -safeRy, safeRx * 0.4, safeRy);
    grad.addColorStop(0, opts.highlight ?? fill);
    grad.addColorStop(0.42, fill);
    grad.addColorStop(1, opts.shadow ?? fill);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = fill;
  }
  ctx.fill();

  ctx.save();
  ctx.clip();
  // Soft crescent cel-shadow along lower-right curve
  ctx.fillStyle = opts?.shadow ?? 'rgba(10, 14, 24, 0.18)';
  ctx.globalAlpha = opts?.shadow ? 0.52 : 0.22;
  ctx.beginPath();
  ctx.ellipse(safeRx * 0.22, safeRy * 0.42, safeRx * 0.96, safeRy * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  // Crisp glossy cartoon specular dot top-left
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = opts?.highlight ?? '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-safeRx * 0.28, -safeRy * 0.36, safeRx * 0.38, safeRy * 0.22, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  setInkStyle(ctx, opts?.lineWidth ?? 2.1, opts?.ink ?? INK);
  ctx.beginPath();
  ctx.ellipse(0, 0, safeRx, safeRy, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Draw an inked cel-shaded polygon with directional top-to-bottom lighting gradient & crisp rim gloss */
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
  if (pts.length < 3) return;
  let minY = pts[0][1];
  let maxY = pts[0][1];
  let minX = pts[0][0];
  let maxX = pts[0][0];
  for (const [px, py] of pts) {
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();

  if (opts?.highlight || opts?.shadow) {
    const grad = ctx.createLinearGradient(minX, minY, minX + (maxX - minX) * 0.3, maxY);
    grad.addColorStop(0, opts.highlight ?? fill);
    grad.addColorStop(0.38, fill);
    grad.addColorStop(1, opts.shadow ?? fill);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = fill;
  }
  ctx.fill();

  const spanH = Math.max(1, maxY - minY);
  ctx.save();
  ctx.clip();
  if (opts?.shadow) {
    ctx.fillStyle = opts.shadow;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(minX - 2, minY + spanH * 0.68, maxX - minX + 4, spanH * 0.38);
  }
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = opts?.highlight ?? '#ffffff';
  ctx.fillRect(minX - 2, minY, maxX - minX + 4, Math.max(1.8, Math.min(5, spanH * 0.2)));
  ctx.restore();

  setInkStyle(ctx, opts?.lineWidth ?? 2.1, opts?.ink ?? INK);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
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
  ctx.save();
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
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Subtle rim sheen along top edge of limb
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = Math.max(1.1, thickness * 0.28);
  ctx.beginPath();
  ctx.moveTo(x1 - 0.5, y1 - 0.6);
  ctx.lineTo(x2 - 0.5, y2 - 0.6);
  ctx.stroke();
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
  ctx.scale(scale, scale);

  // Warm radial torch light halo
  const glow = ctx.createRadialGradient(0, -10, 2, 0, -10, 22 + flicker);
  glow.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
  glow.addColorStop(0.5, 'rgba(249, 115, 22, 0.22)');
  glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -10, 24, 0, Math.PI * 2);
  ctx.fill();

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
  const grad = ctx.createLinearGradient(-radius, -radius, radius, radius);
  grad.addColorStop(0, highlight);
  grad.addColorStop(0.45, fill);
  grad.addColorStop(1, shadow);
  ctx.fillStyle = grad;
  ctx.fill();
  setInkStyle(ctx, 2.1);
  ctx.stroke();

  // Inner cutout ring & metallic axle hub
  drawCelEllipse(ctx, 0, 0, radius * 0.44, radius * 0.44, '#1e293b', { highlight: '#475569', lineWidth: 1.9 });
  drawCelEllipse(ctx, 0, 0, radius * 0.18, radius * 0.18, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.5 });
  ctx.restore();
}

/** Draw a fluttering 2-tone Bezier cartoon cape with golden trim anchored behind shoulders */
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
  const wave1 = Math.sin(phase * 1.45) * 4.8;
  const wave2 = Math.cos(phase * 1.95 + 0.7) * 5.8;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.quadraticCurveTo(
    anchorX - width * 0.68,
    anchorY + length * 0.45 + wave1,
    anchorX - width + wave2 * 0.42,
    anchorY + length,
  );
  ctx.lineTo(anchorX - width * 0.2 + wave1 * 0.5, anchorY + length * 0.94);
  ctx.quadraticCurveTo(anchorX - width * 0.08, anchorY + length * 0.45, anchorX + 2, anchorY + 4);
  ctx.closePath();

  const grad = ctx.createLinearGradient(anchorX - width, anchorY, anchorX, anchorY + length);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, darkFill);
  ctx.fillStyle = grad;
  ctx.fill();

  // Golden hem highlight line
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.72)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(anchorX - width - 2, anchorY + length - 2);
  ctx.lineTo(anchorX + 2, anchorY + length - 4);
  ctx.stroke();
  ctx.restore();

  setInkStyle(ctx, 2.0);
  ctx.stroke();
  ctx.restore();
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

/** Draw expressive Kingdom-Rush / Age-of-War cartoon face with glossy pupil glint inside head at (cx, cy) */
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
    drawCelRoundRect(ctx, cx + 0.5, cy - 3.2, 8.2, 4.4, 2, opts.visorColor ?? '#38bdf8', {
      highlight: '#ffffff',
      lineWidth: 1.5,
    });
    return;
  }

  if (mask === 'nvg') {
    drawCelRoundRect(ctx, cx + 0.5, cy - 3.6, 8.4, 4.2, 1.8, '#1e293b', { lineWidth: 1.5 });
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(cx + 3.2, cy - 1.5, 1.7, 0, Math.PI * 2);
    ctx.arc(cx + 6.8, cy - 1.5, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 2.5, cy - 2.4, 1.1, 1.1);
    ctx.fillRect(cx + 6.1, cy - 2.4, 1.1, 1.1);
    return;
  }

  if (mask === 'goggles') {
    drawCelEllipse(ctx, cx + 3.2, cy - 1.4, 2.7, 2.5, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.5 });
    drawCelEllipse(ctx, cx + 7.2, cy - 1.4, 2.4, 2.3, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.5 });
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx + 3.4, cy - 1.4, 1.35, 0, Math.PI * 2);
    ctx.arc(cx + 7.2, cy - 1.4, 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx + 2.7, cy - 2.2, 1.0, 1.0);
    ctx.fillRect(cx + 6.6, cy - 2.2, 1.0, 1.0);
    return;
  }

  if (mask === 'gasmask') {
    drawCelEllipse(ctx, cx + 2.8, cy - 1.6, 2.3, 2.2, '#94a3b8', { highlight: '#ffffff', lineWidth: 1.5 });
    drawCelEllipse(ctx, cx + 6.6, cy - 1.6, 2.0, 2.0, '#94a3b8', { highlight: '#ffffff', lineWidth: 1.5 });
    drawCelRoundRect(ctx, cx + 2.8, cy + 0.8, 6.2, 4.4, 2, '#475569', { shadow: '#1e293b', lineWidth: 1.6 });
    return;
  }

  ctx.save();
  setInkStyle(ctx, 1.5);
  if (mood === 'dead') {
    ctx.beginPath();
    ctx.moveTo(cx + 1.5, cy - 2.8);
    ctx.lineTo(cx + 5.2, cy + 0.6);
    ctx.moveTo(cx + 5.2, cy - 2.8);
    ctx.lineTo(cx + 1.5, cy + 0.6);
    ctx.stroke();
  } else if (mood === 'hurt') {
    ctx.beginPath();
    ctx.moveTo(cx + 1.5, cy - 2.6);
    ctx.lineTo(cx + 5.2, cy - 1);
    ctx.lineTo(cx + 1.5, cy + 0.6);
    ctx.stroke();
  } else {
    // Subtle warm cheek blush on organic faces
    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.beginPath();
    ctx.ellipse(cx + 2.2, cy + 1.5, 2.0, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crisp expressive eye with gleaming white specular sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx + 3.6, cy - 1.2, 2.35, 2.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = opts.eyeColor ?? INK;
    ctx.beginPath();
    ctx.arc(cx + 4.4, cy - 1.1, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 3.9, cy - 1.7, 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Expressive angled brow
    setInkStyle(ctx, 1.85);
    ctx.beginPath();
    ctx.moveTo(cx + 0.8, cy - (mood === 'attack' ? 4.5 : 3.8));
    ctx.lineTo(cx + 6.5, cy - (mood === 'attack' ? 2.4 : 3.2));
    ctx.stroke();

    // Fierce battle-cry mouth with gleaming teeth on attack!
    if (mood === 'attack') {
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.ellipse(cx + 3.9, cy + 3.1, 2.3, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 2.5, cy + 1.9, 2.8, 1.1);
    }
  }

  if (opts.beard) {
    drawCelPoly(
      ctx,
      [
        [cx - 1.5, cy + 2],
        [cx + 6.5, cy + 2.2],
        [cx + 5, cy + 7.4],
        [cx - 0.5, cy + 6.4],
      ],
      opts.beard,
      { shadow: INK_SOFT, lineWidth: 1.6 },
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
  // Subtle fiery bloom halo
  const halo = ctx.createRadialGradient(size * 0.2, 0, 2, size * 0.2, 0, size * 1.45);
  halo.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
  halo.addColorStop(0.55, 'rgba(249, 115, 22, 0.22)');
  halo.addColorStop(1, 'rgba(249, 115, 22, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(size * 0.2, 0, size * 1.45, 0, Math.PI * 2);
  ctx.fill();

  const pts: [number, number][] = [];
  const spikes = 7;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const isOuter = i % 2 === 0;
    const forwardStretch = Math.cos(a) > 0 ? 1.48 : 0.72;
    const r = (isOuter ? size : size * 0.42) * forwardStretch;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  drawCelPoly(ctx, pts, outerColor, { highlight: coreColor, lineWidth: 1.6, ink: '#7c2d12' });

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

/** Draw a glowing cel energy orb (plasma, solar, antimatter, mystic totem) */
export function drawEnergyOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  outerColor: string,
  innerColor = '#ffffff',
): void {
  ctx.save();
  const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2.1);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.42, outerColor);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 2.1, 0, Math.PI * 2);
  ctx.fill();

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
  ctx.restore();
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
  armColor?: string;
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
 * Deluxe Age-of-War-2 / Kingdom-Rush articulated humanoid rig with smooth breathing,
 * cel-shaded gradients, weapon swing motion-blur smears, and expressive faces.
 */
export function drawCartoonHumanoid(ctx: CanvasRenderingContext2D, cfg: HumanoidRigConfig): void {
  const s = cfg.scale ?? 1;
  const torsoW = cfg.torsoW ?? 16;
  const torsoH = cfg.torsoH ?? 19;
  const headR = cfg.headR ?? 8.2;
  const legLen = cfg.legLen ?? 14;
  const dp = cfg.deathProgress;

  const stride = cfg.isWalking ? Math.sin(cfg.walkPhase) : 0;
  const liftA = cfg.isWalking ? Math.max(0, -Math.cos(cfg.walkPhase)) * 3.8 : 0;
  const liftB = cfg.isWalking ? Math.max(0, Math.cos(cfg.walkPhase)) * 3.8 : 0;
  const bob = cfg.isWalking ? Math.abs(Math.sin(cfg.walkPhase)) * 2.5 : Math.sin(cfg.walkPhase * 0.9) * 0.7;

  const atk = cfg.attackAnim;
  const firing = atk > 0.45 && atk < 0.82;
  let weaponAngle = 0;
  let weaponPushX = 0;
  let weaponPushY = 0;
  let torsoLean = cfg.isWalking ? 0.09 : 0.02;

  const style = cfg.swingStyle ?? 'overhead';
  if (atk > 0.01) {
    if (style === 'overhead') {
      if (atk > 0.72) {
        const t = (1 - atk) / 0.28;
        weaponAngle = -1.48 * t;
        torsoLean = -0.15 * t;
      } else if (atk > 0.32) {
        const t = (0.72 - atk) / 0.4;
        weaponAngle = -1.48 + 2.52 * Math.sin(t * Math.PI * 0.5);
        torsoLean = -0.15 + 0.36 * t;
        weaponPushX = 4.5 * t;
      } else {
        const t = atk / 0.32;
        weaponAngle = 1.04 * t;
        torsoLean = 0.21 * t;
        weaponPushX = 4.5 * t;
      }
    } else if (style === 'thrust') {
      if (atk > 0.68) {
        const t = (1 - atk) / 0.32;
        weaponPushX = -5.5 * t;
        torsoLean = -0.1 * t;
      } else if (atk > 0.28) {
        const t = (0.68 - atk) / 0.4;
        weaponPushX = -5.5 + 17 * Math.sin(t * Math.PI * 0.5);
        torsoLean = 0.2 * t;
      } else {
        const t = atk / 0.28;
        weaponPushX = 11.5 * t;
        torsoLean = 0.16 * t;
      }
    } else if (style === 'aim') {
      const recoil = atk > 0.42 ? Math.sin(((atk - 0.42) / 0.58) * Math.PI) : 0;
      weaponPushX = -4.5 * recoil;
      weaponAngle = -0.16 * recoil;
      torsoLean = -0.09 * recoil;
    } else if (style === 'throw') {
      if (atk > 0.62) {
        const t = (1 - atk) / 0.38;
        weaponAngle = -1.72 * t;
        torsoLean = -0.18 * t;
      } else {
        const t = (0.62 - atk) / 0.62;
        weaponAngle = -1.72 + 2.35 * t;
        torsoLean = -0.18 + 0.38 * t;
        weaponPushX = 5 * t;
      }
    } else if (style === 'staff') {
      const surge = Math.sin(atk * Math.PI);
      weaponPushY = -5.5 * surge;
      weaponAngle = -0.32 * surge;
      torsoLean = 0.12 * surge;
    } else if (style === 'dual') {
      const slash = Math.sin(atk * Math.PI);
      weaponAngle = -1.2 + slash * 2.25;
      weaponPushX = 6.5 * slash;
      torsoLean = 0.22 * slash;
    }
  }

  const mood: 'normal' | 'attack' | 'hurt' | 'dead' =
    dp > 0.2 ? 'dead' : cfg.hitFlash > 0.32 ? 'hurt' : atk > 0.25 ? 'attack' : 'normal';

  ctx.save();
  ctx.scale(s, s);

  if (dp > 0) {
    const fall = Math.min(1, dp * 1.45);
    ctx.translate(-fall * 8, -fall * 4);
    ctx.rotate(-fall * 1.48);
  } else if (cfg.hitFlash > 0.35) {
    const k = (cfg.hitFlash - 0.35) / 0.65;
    ctx.rotate(-0.16 * k);
  }

  const hipY = -legLen - bob;
  const torsoTopY = hipY - torsoH;
  const shoulderY = torsoTopY + 5;

  // 1. Back fluttering 2-tone cape
  if (cfg.capeColor) {
    drawCartoonCape(
      ctx,
      -torsoW * 0.36,
      shoulderY - 1,
      torsoH + legLen * 0.54,
      torsoW * 0.98,
      cfg.capeColor,
      cfg.capeDark ?? INK_SOFT,
      cfg.walkPhase + atk * 4,
    );
  }

  // 2. Back leg + boot
  const backFootX = -2 - stride * 7.8;
  const backFootY = -2 - liftB;
  const backKneeX = (-2 + backFootX) * 0.5 + 2.5;
  const backKneeY = (hipY + backFootY) * 0.5;
  drawInkLimb(ctx, -2, hipY + 1, backKneeX, backKneeY, 4.5, cfg.pantsColor);
  drawInkLimb(ctx, backKneeX, backKneeY, backFootX, backFootY, 4.2, cfg.bootColor);
  drawCelEllipse(ctx, backFootX + 2.2, backFootY, 4.5, 2.7, cfg.bootColor, {
    shadow: '#0f172a',
    lineWidth: 1.8,
  });

  // 3. Back arm
  const backArmX = torsoW * 0.34 + Math.max(0, stride * 2.5);
  const backArmY = shoulderY + 6 + (atk > 0.2 ? -2 : 0);
  drawInkLimb(ctx, 2, shoulderY + 1, backArmX, backArmY, 4.2, cfg.armColor ?? cfg.skin);

  // 4. Front leg + highlighted boot
  const frontFootX = 2.5 + stride * 7.8;
  const frontFootY = -2 - liftA;
  const frontKneeX = (2.5 + frontFootX) * 0.5 + 3.2;
  const frontKneeY = (hipY + frontFootY) * 0.5;
  drawInkLimb(ctx, 2.5, hipY + 1, frontKneeX, frontKneeY, 4.7, cfg.pantsColor);
  drawInkLimb(ctx, frontKneeX, frontKneeY, frontFootX, frontFootY, 4.3, cfg.bootColor);
  drawCelEllipse(ctx, frontFootX + 2.4, frontFootY, 4.7, 2.8, cfg.bootColor, {
    highlight: 'rgba(255,255,255,0.28)',
    shadow: '#0f172a',
    lineWidth: 1.8,
  });

  // 5. Upper body (leans smoothly during walk/attack)
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(torsoLean);
  ctx.translate(0, -hipY);

  if (cfg.drawBackAccessory) {
    cfg.drawBackAccessory(ctx, torsoTopY);
  }

  // Heroic shaded torso
  drawCelRoundRect(ctx, -torsoW / 2, torsoTopY, torsoW, torsoH + 2, 5.5, cfg.torsoFill, {
    highlight: cfg.torsoHighlight ?? 'rgba(255,255,255,0.25)',
    shadow: cfg.torsoShadow ?? 'rgba(0,0,0,0.28)',
    lineWidth: 2.2,
  });

  if (cfg.drawTorsoDetail) {
    cfg.drawTorsoDetail(ctx, -torsoW / 2, torsoTopY, torsoW, torsoH + 2);
  }

  // Waist belt + gleaming golden buckle
  if (cfg.beltColor) {
    drawCelRoundRect(ctx, -torsoW / 2 - 0.8, hipY - 3.6, torsoW + 1.6, 4.2, 1.6, cfg.beltColor, {
      shadow: '#0f172a',
      lineWidth: 1.6,
    });
    drawCelRoundRect(ctx, 0.5, hipY - 3.8, 4.4, 4.5, 1, '#facc15', {
      highlight: '#fef08a',
      shadow: '#b45309',
      lineWidth: 1.3,
    });
  }

  // Head + expressive face
  const headX = 1.2;
  const headY = torsoTopY - headR * 0.78;
  drawCelEllipse(ctx, headX, headY, headR * 1.04, headR, cfg.skin, {
    highlight: 'rgba(255,255,255,0.32)',
    shadow: cfg.skinShadow ?? 'rgba(120,53,15,0.22)',
    lineWidth: 2.1,
  });

  drawCartoonFace(ctx, headX, headY + 0.5, {
    mood,
    eyeColor: cfg.eyeColor,
    skin: cfg.skin,
    beard: cfg.beardColor,
    mask: cfg.mask,
    visorColor: cfg.visorColor,
  });

  if (cfg.drawHelmet) {
    cfg.drawHelmet(ctx, headX, headY, headR);
  }

  // Front arm & main weapon + anime motion-blur smear during melee swing peak!
  const shoulderX = -1.5;
  ctx.save();
  ctx.translate(shoulderX + weaponPushX * 0.45, shoulderY + weaponPushY * 0.45);

  if ((style === 'overhead' || style === 'dual') && atk > 0.34 && atk < 0.74) {
    const smearAlpha = Math.sin(((atk - 0.34) / 0.4) * Math.PI) * 0.48;
    ctx.save();
    ctx.globalAlpha = smearAlpha;
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(2, 0, 26, -1.65, weaponAngle - 0.12);
    ctx.stroke();
    ctx.restore();
  }

  ctx.rotate(weaponAngle);

  const handX = 8.5 + weaponPushX * 0.55;
  const handY = 4.5 + weaponPushY * 0.55;
  drawInkLimb(ctx, 0, 0, handX, handY, 4.6, cfg.armColor ?? cfg.skin);
  drawCelEllipse(ctx, handX, handY, 3.2, 2.9, cfg.skin, { highlight: '#ffffff', lineWidth: 1.7 });

  ctx.save();
  ctx.translate(handX, handY);
  cfg.drawWeapon(ctx, firing, atk);
  ctx.restore();

  if (cfg.pauldronColor) {
    drawCelEllipse(ctx, 0, -1, 5.6, 4.8, cfg.pauldronColor, {
      highlight: 'rgba(255,255,255,0.42)',
      shadow: 'rgba(0,0,0,0.28)',
      lineWidth: 1.9,
    });
    if (cfg.pauldronTrim) {
      ctx.strokeStyle = cfg.pauldronTrim;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -1, 3.6, 0.2, Math.PI * 0.85);
      ctx.stroke();
    }
  }
  ctx.restore();

  if (cfg.drawOffhand) {
    const shieldX = torsoW * 0.46 + (atk > 0.25 ? 2.5 : 0);
    const shieldY = shoulderY + 6.5;
    cfg.drawOffhand(ctx, shieldX, shieldY);
  }

  ctx.restore();
  ctx.restore();
}
