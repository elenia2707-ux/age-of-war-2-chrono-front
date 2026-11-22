import type { Team } from '../data/types';

export const INK = '#141824';
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
  dark: '#1d3a8a',
  trim: '#facc15',
  glow: '#38bdf8',
  glowSoft: 'rgba(56, 189, 248, 0.45)',
  cape: '#1d4ed8',
  capeDark: '#1e3a8a',
};

const ENEMY_PALETTE: TeamPalette = {
  main: '#dc2626',
  light: '#f87171',
  dark: '#7f1d1d',
  trim: '#fbbf24',
  glow: '#fb7185',
  glowSoft: 'rgba(251, 113, 133, 0.45)',
  cape: '#b91c1c',
  capeDark: '#7f1d1d',
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

/** Draw a cel-shaded rounded rectangle with bottom shadow band, top specular sheen, and dark ink outline */
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
  ctx.fillStyle = fill;
  ctx.fill();

  if (opts?.shadow || opts?.highlight) {
    ctx.save();
    ctx.clip();
    if (opts.shadow) {
      ctx.fillStyle = opts.shadow;
      ctx.fillRect(x, y + h * 0.64, w, h * 0.4);
    }
    if (opts.highlight) {
      ctx.fillStyle = opts.highlight;
      ctx.fillRect(x + 1.5, y + 1.2, w - 3, Math.max(2, h * 0.24));
    }
    ctx.restore();
  }

  setInkStyle(ctx, opts?.lineWidth ?? 2.1, opts?.ink ?? INK);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rad);
  ctx.stroke();
  ctx.restore();
}

/** Draw a cel-shaded ellipse with specular highlight dot and bold ink outline */
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
  ctx.save();
  ctx.translate(cx, cy);
  if (opts?.rotation) ctx.rotate(opts.rotation);

  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();

  if (opts?.shadow || opts?.highlight) {
    ctx.save();
    ctx.clip();
    if (opts.shadow) {
      ctx.fillStyle = opts.shadow;
      ctx.beginPath();
      ctx.ellipse(rx * 0.14, ry * 0.34, rx * 0.96, ry * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (opts.highlight) {
      ctx.fillStyle = opts.highlight;
      ctx.beginPath();
      ctx.ellipse(-rx * 0.28, -ry * 0.36, rx * 0.44, ry * 0.26, -0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  setInkStyle(ctx, opts?.lineWidth ?? 2.1, opts?.ink ?? INK);
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Draw an inked cel-shaded polygon with optional top gloss */
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
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  if (opts?.shadow || opts?.highlight) {
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
    ctx.clip();
    if (opts.shadow) {
      ctx.fillStyle = opts.shadow;
      ctx.fillRect(minX - 2, minY + (maxY - minY) * 0.62, maxX - minX + 4, (maxY - minY) * 0.45);
    }
    if (opts.highlight) {
      ctx.fillStyle = opts.highlight;
      ctx.fillRect(minX - 2, minY, maxX - minX + 4, Math.max(2, (maxY - minY) * 0.25));
    }
    ctx.restore();
  }

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

/** Draw a chunky bold-inked cartoon limb capsule between two points */
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
  ctx.restore();
}

/** Draw a fluttering Bezier cartoon cape anchored behind shoulders */
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
  const wave1 = Math.sin(phase * 1.4) * 4.5;
  const wave2 = Math.cos(phase * 1.9 + 0.7) * 5.5;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.quadraticCurveTo(anchorX - width * 0.65, anchorY + length * 0.45 + wave1, anchorX - width + wave2 * 0.4, anchorY + length);
  ctx.lineTo(anchorX - width * 0.22 + wave1 * 0.5, anchorY + length * 0.94);
  ctx.quadraticCurveTo(anchorX - width * 0.1, anchorY + length * 0.45, anchorX + 2, anchorY + 4);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = darkFill;
  ctx.fillRect(anchorX - width - 6, anchorY + length * 0.55, width + 14, length * 0.55);
  ctx.restore();

  setInkStyle(ctx, 2.0);
  ctx.stroke();
  ctx.restore();
}

/** Draw a rotating spoked wooden/bronze/iron cartoon wheel */
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

  // Outer tire / rim
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#2e1d10';
  ctx.fill();
  setInkStyle(ctx, 2.2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
  ctx.fillStyle = rimColor;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Inner cutout backdrop
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.64, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 20, 30, 0.42)';
  ctx.fill();

  // Spokes
  setInkStyle(ctx, 2.2, '#4a2c12');
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * radius * 0.72, Math.sin(a) * radius * 0.72);
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
          [radius * 1.28, -1],
          [radius * 0.85, 3],
        ],
        '#cbd5e1',
        { highlight: '#ffffff', lineWidth: 1.4 },
      );
      ctx.restore();
    }
  }

  // Central hub
  drawCelEllipse(ctx, 0, 0, radius * 0.28, radius * 0.28, hubColor, {
    highlight: '#fef08a',
    lineWidth: 1.8,
  });
  ctx.restore();
}

/** Draw an armored tank tread assembly with rolling cleats & bogie road wheels */
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
    shadow: '#0f172a',
    lineWidth: 2.4,
  });

  // Inner track bed
  drawCelRoundRect(ctx, x + 4, y + 3, w - 8, h - 6, Math.max(2, r - 3), trackFill, {
    lineWidth: 1.5,
  });

  // Road wheels spinning inside tread
  const spacing = (w - h) / Math.max(1, wheelCount - 1);
  const wheelR = h * 0.31;
  for (let i = 0; i < wheelCount; i++) {
    const wx = x + r + i * spacing;
    const wy = y + h * 0.52;
    drawCelEllipse(ctx, wx, wy, wheelR, wheelR, wheelFill, {
      highlight: '#cbd5e1',
      shadow: '#334155',
      lineWidth: 1.6,
    });
    // Spinning lug
    const lugX = wx + Math.cos(rollPhase * 2.2 + i) * (wheelR * 0.45);
    const lugY = wy + Math.sin(rollPhase * 2.2 + i) * (wheelR * 0.45);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(lugX, lugY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rolling tread cleats along bottom & top
  ctx.fillStyle = '#0f172a';
  const step = 7;
  const shift = ((rollPhase * 12) % step + step) % step;
  for (let cx = x + r * 0.6 + shift; cx < x + w - r * 0.6; cx += step) {
    ctx.fillRect(cx - 1.5, y + h - 2.5, 3.2, 3.2);
    ctx.fillRect(x + w - (cx - x) - 1.5, y - 1, 3.2, 2.6);
  }
}

/** Draw expressive Kingdom-Rush / Age-of-War cartoon face inside head at (cx, cy) */
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
    ctx.arc(cx + 3.2, cy - 1.5, 1.6, 0, Math.PI * 2);
    ctx.arc(cx + 6.8, cy - 1.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dcfce7';
    ctx.fillRect(cx + 2.6, cy - 2.3, 1.1, 1.1);
    ctx.fillRect(cx + 6.2, cy - 2.3, 1.1, 1.1);
    return;
  }

  if (mask === 'goggles') {
    drawCelEllipse(ctx, cx + 3.2, cy - 1.4, 2.7, 2.5, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.5 });
    drawCelEllipse(ctx, cx + 7.2, cy - 1.4, 2.4, 2.3, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.5 });
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx + 3.4, cy - 1.4, 1.3, 0, Math.PI * 2);
    ctx.arc(cx + 7.2, cy - 1.4, 1.2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (mask === 'gasmask') {
    drawCelEllipse(ctx, cx + 2.8, cy - 1.6, 2.3, 2.2, '#94a3b8', { highlight: '#ffffff', lineWidth: 1.5 });
    drawCelEllipse(ctx, cx + 6.6, cy - 1.6, 2.0, 2.0, '#94a3b8', { highlight: '#ffffff', lineWidth: 1.5 });
    drawCelRoundRect(ctx, cx + 2.8, cy + 0.8, 6.2, 4.4, 2, '#475569', { shadow: '#1e293b', lineWidth: 1.6 });
    return;
  }

  // Expressive eyes
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
    // Crisp white eye sclera + dark pupil + determined eyebrow
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx + 3.6, cy - 1.2, 2.3, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = opts.eyeColor ?? INK;
    ctx.beginPath();
    ctx.arc(cx + 4.4, cy - 1.1, 1.25, 0, Math.PI * 2);
    ctx.fill();

    // Determined / angry angled brow
    setInkStyle(ctx, 1.8);
    ctx.beginPath();
    ctx.moveTo(cx + 0.8, cy - (mood === 'attack' ? 4.4 : 3.8));
    ctx.lineTo(cx + 6.4, cy - (mood === 'attack' ? 2.5 : 3.2));
    ctx.stroke();

    // Shout mouth on attack
    if (mood === 'attack') {
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.ellipse(cx + 3.8, cy + 3.1, 2.2, 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (opts.beard) {
    drawCelPoly(
      ctx,
      [
        [cx - 1.5, cy + 2],
        [cx + 6.5, cy + 2.2],
        [cx + 5, cy + 7.2],
        [cx - 0.5, cy + 6.2],
      ],
      opts.beard,
      { lineWidth: 1.6 },
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
  const pts: [number, number][] = [];
  const spikes = 7;
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const isOuter = i % 2 === 0;
    const forwardStretch = Math.cos(a) > 0 ? 1.45 : 0.72;
    const r = (isOuter ? size : size * 0.42) * forwardStretch;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  drawCelPoly(ctx, pts, outerColor, { lineWidth: 1.6, ink: '#7c2d12' });

  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.ellipse(size * 0.18, 0, size * 0.45, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size * 0.15, 0, size * 0.18, 0, Math.PI * 2);
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
  const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 1.9);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.45, outerColor);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = outerColor;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  setInkStyle(ctx, 1.5);
  ctx.stroke();

  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.arc(x - r * 0.22, y - r * 0.22, r * 0.46, 0, Math.PI * 2);
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
 * Reusable high-craft Age-of-War-2 / Kingdom-Rush articulated humanoid rig.
 * Renders at feet origin (0, 0) facing RIGHT (+X). Team flipping is handled by caller.
 */
export function drawCartoonHumanoid(ctx: CanvasRenderingContext2D, cfg: HumanoidRigConfig): void {
  const s = cfg.scale ?? 1;
  const torsoW = cfg.torsoW ?? 16;
  const torsoH = cfg.torsoH ?? 19;
  const headR = cfg.headR ?? 8.2;
  const legLen = cfg.legLen ?? 14;
  const dp = cfg.deathProgress;

  const stride = cfg.isWalking ? Math.sin(cfg.walkPhase) : 0;
  const liftA = cfg.isWalking ? Math.max(0, -Math.cos(cfg.walkPhase)) * 3.5 : 0;
  const liftB = cfg.isWalking ? Math.max(0, Math.cos(cfg.walkPhase)) * 3.5 : 0;
  const bob = cfg.isWalking ? Math.abs(Math.sin(cfg.walkPhase)) * 2.4 : Math.sin(cfg.walkPhase * 0.5) * 0.6;

  // Smooth cartoon attack curve: windup (1 -> 0.72), snap strike (0.72 -> 0.35), follow-through (0.35 -> 0)
  const atk = cfg.attackAnim;
  const firing = atk > 0.45 && atk < 0.82;
  let weaponAngle = 0;
  let weaponPushX = 0;
  let weaponPushY = 0;
  let torsoLean = cfg.isWalking ? 0.08 : 0.02;

  const style = cfg.swingStyle ?? 'overhead';
  if (atk > 0.01) {
    if (style === 'overhead') {
      if (atk > 0.72) {
        const t = (1 - atk) / 0.28;
        weaponAngle = -1.45 * t;
        torsoLean = -0.14 * t;
      } else if (atk > 0.32) {
        const t = (0.72 - atk) / 0.4;
        weaponAngle = -1.45 + 2.45 * Math.sin(t * Math.PI * 0.5);
        torsoLean = -0.14 + 0.34 * t;
        weaponPushX = 4 * t;
      } else {
        const t = atk / 0.32;
        weaponAngle = 1.0 * t;
        torsoLean = 0.2 * t;
        weaponPushX = 4 * t;
      }
    } else if (style === 'thrust') {
      if (atk > 0.68) {
        const t = (1 - atk) / 0.32;
        weaponPushX = -5 * t;
        torsoLean = -0.1 * t;
      } else if (atk > 0.28) {
        const t = (0.68 - atk) / 0.4;
        weaponPushX = -5 + 16 * Math.sin(t * Math.PI * 0.5);
        torsoLean = 0.18 * t;
      } else {
        const t = atk / 0.28;
        weaponPushX = 11 * t;
        torsoLean = 0.15 * t;
      }
    } else if (style === 'aim') {
      const recoil = atk > 0.42 ? Math.sin(((atk - 0.42) / 0.58) * Math.PI) : 0;
      weaponPushX = -4.5 * recoil;
      weaponAngle = -0.16 * recoil;
      torsoLean = -0.09 * recoil;
    } else if (style === 'throw') {
      if (atk > 0.62) {
        const t = (1 - atk) / 0.38;
        weaponAngle = -1.7 * t;
        torsoLean = -0.18 * t;
      } else {
        const t = (0.62 - atk) / 0.62;
        weaponAngle = -1.7 + 2.3 * t;
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
      weaponAngle = -1.2 + slash * 2.2;
      weaponPushX = 6 * slash;
      torsoLean = 0.22 * slash;
    }
  }

  const mood: 'normal' | 'attack' | 'hurt' | 'dead' =
    dp > 0.2 ? 'dead' : cfg.hitFlash > 0.32 ? 'hurt' : atk > 0.25 ? 'attack' : 'normal';

  ctx.save();
  ctx.scale(s, s);

  // Dramatic cartoon topple on death
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

  // 1. Back fluttering cape (if any)
  if (cfg.capeColor) {
    drawCartoonCape(
      ctx,
      -torsoW * 0.36,
      shoulderY - 1,
      torsoH + legLen * 0.52,
      torsoW * 0.95,
      cfg.capeColor,
      cfg.capeDark ?? INK_SOFT,
      cfg.walkPhase + atk * 4,
    );
  }

  // 2. Back leg
  const backFootX = -2 - stride * 7.5;
  const backFootY = -2 - liftB;
  const backKneeX = (-2 + backFootX) * 0.5 + 2.5;
  const backKneeY = (hipY + backFootY) * 0.5;
  drawInkLimb(ctx, -2, hipY + 1, backKneeX, backKneeY, 4.4, cfg.pantsColor);
  drawInkLimb(ctx, backKneeX, backKneeY, backFootX, backFootY, 4.1, cfg.bootColor);
  drawCelEllipse(ctx, backFootX + 2.2, backFootY, 4.4, 2.7, cfg.bootColor, { lineWidth: 1.8 });

  // 3. Back arm & offhand (shield / bow hand / second blade)
  const backArmX = torsoW * 0.34 + Math.max(0, stride * 2.5);
  const backArmY = shoulderY + 6 + (atk > 0.2 ? -2 : 0);
  drawInkLimb(ctx, 2, shoulderY + 1, backArmX, backArmY, 4.2, cfg.armColor ?? cfg.skin);
  if (cfg.drawOffhand && style !== 'dual') {
    // Draw offhand behind torso for bows/back accessories, or front after torso for shields
  }

  // 4. Front leg
  const frontFootX = 2.5 + stride * 7.5;
  const frontFootY = -2 - liftA;
  const frontKneeX = (2.5 + frontFootX) * 0.5 + 3;
  const frontKneeY = (hipY + frontFootY) * 0.5;
  drawInkLimb(ctx, 2.5, hipY + 1, frontKneeX, frontKneeY, 4.6, cfg.pantsColor);
  drawInkLimb(ctx, frontKneeX, frontKneeY, frontFootX, frontFootY, 4.2, cfg.bootColor);
  drawCelEllipse(ctx, frontFootX + 2.4, frontFootY, 4.6, 2.8, cfg.bootColor, {
    highlight: 'rgba(255,255,255,0.22)',
    lineWidth: 1.8,
  });

  // 5. Upper body (leans smoothly during walk/attack)
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(torsoLean);
  ctx.translate(0, -hipY);

  // Back accessory (quiver, jetpack, steam boiler, tesla coil, fuel tanks)
  if (cfg.drawBackAccessory) {
    cfg.drawBackAccessory(ctx, torsoTopY);
  }

  // Chunky heroic torso
  drawCelRoundRect(ctx, -torsoW / 2, torsoTopY, torsoW, torsoH + 2, 5.5, cfg.torsoFill, {
    highlight: cfg.torsoHighlight ?? 'rgba(255,255,255,0.22)',
    shadow: cfg.torsoShadow ?? 'rgba(0,0,0,0.22)',
    lineWidth: 2.2,
  });

  if (cfg.drawTorsoDetail) {
    cfg.drawTorsoDetail(ctx, -torsoW / 2, torsoTopY, torsoW, torsoH + 2);
  }

  // Waist belt + buckle
  if (cfg.beltColor) {
    drawCelRoundRect(ctx, -torsoW / 2 - 0.8, hipY - 3.6, torsoW + 1.6, 4.2, 1.6, cfg.beltColor, {
      lineWidth: 1.6,
    });
    drawCelRoundRect(ctx, 0.5, hipY - 3.8, 4.2, 4.4, 1, '#facc15', {
      highlight: '#fef08a',
      lineWidth: 1.3,
    });
  }

  // Head + expressive face
  const headX = 1.2;
  const headY = torsoTopY - headR * 0.78;
  drawCelEllipse(ctx, headX, headY, headR * 1.04, headR, cfg.skin, {
    highlight: 'rgba(255,255,255,0.25)',
    shadow: cfg.skinShadow ?? 'rgba(120,53,15,0.16)',
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

  // Front arm & main weapon (rotates cleanly around shoulder!)
  const shoulderX = -1.5;
  ctx.save();
  ctx.translate(shoulderX + weaponPushX * 0.45, shoulderY + weaponPushY * 0.45);
  ctx.rotate(weaponAngle);

  // Upper arm + gauntlet hand
  const handX = 8.5 + weaponPushX * 0.55;
  const handY = 4.5 + weaponPushY * 0.55;
  drawInkLimb(ctx, 0, 0, handX, handY, 4.5, cfg.armColor ?? cfg.skin);
  drawCelEllipse(ctx, handX, handY, 3.1, 2.9, cfg.skin, { lineWidth: 1.7 });

  // Weapon rendered anchored at hand!
  ctx.save();
  ctx.translate(handX, handY);
  cfg.drawWeapon(ctx, firing, atk);
  ctx.restore();

  // Pauldron over shoulder joint
  if (cfg.pauldronColor) {
    drawCelEllipse(ctx, 0, -1, 5.4, 4.6, cfg.pauldronColor, {
      highlight: 'rgba(255,255,255,0.34)',
      shadow: 'rgba(0,0,0,0.24)',
      lineWidth: 1.9,
    });
    if (cfg.pauldronTrim) {
      ctx.strokeStyle = cfg.pauldronTrim;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -1, 3.6, 0.2, Math.PI * 0.85);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Front offhand (shields, riot shields, etc.) rendered cleanly in front of torso
  if (cfg.drawOffhand) {
    const shieldX = torsoW * 0.46 + (atk > 0.25 ? 2.5 : 0);
    const shieldY = shoulderY + 6.5;
    cfg.drawOffhand(ctx, shieldX, shieldY);
  }

  ctx.restore(); // end upper body lean
  ctx.restore(); // end scale/death
}
