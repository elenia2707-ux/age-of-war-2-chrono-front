import type {
  ActiveUltimate,
  BeamEffect,
  DamagePopup,
  ParticleEntity,
  ProjectileEntity,
  ScorchMark,
  SlashEffect,
  SupplyCrateEntity,
} from '../data/types';
import { GROUND_Y, WORLD_HEIGHT } from '../game/constants';
import {
  INK,
  drawCelEllipse,
  drawCelPoly,
  drawCelRoundRect,
  drawEnergyOrb,
  getTeamPalette,
  setInkStyle,
} from './cartoonPrimitives';

export function renderUltimateAtmosphere(
  ctx: CanvasRenderingContext2D,
  ultimates: ActiveUltimate[],
  viewportW: number,
): void {
  if (ultimates.length === 0) return;

  for (const ult of ultimates) {
    const fade =
      Math.min(1, ult.elapsed * 3) *
      Math.min(1, Math.max(0, (ult.duration + 0.6 - ult.elapsed) * 1.6));
    let tint = 'rgba(20, 12, 8, 0.22)';
    if (ult.def.kind === 'lightning') tint = 'rgba(10, 22, 46, 0.42)';
    else if (ult.def.kind === 'solar_wrath') tint = 'rgba(84, 52, 8, 0.30)';
    else if (ult.def.kind === 'dragon_barrage') tint = 'rgba(68, 12, 16, 0.30)';
    else if (ult.def.kind === 'orbital_laser') tint = 'rgba(6, 22, 36, 0.36)';
    else if (ult.def.kind === 'black_hole') tint = 'rgba(32, 8, 56, 0.48)';
    else if (ult.def.kind === 'chrono_nova') tint = 'rgba(6, 48, 54, 0.44)';
    else if (ult.def.kind === 'meteor') tint = 'rgba(58, 18, 6, 0.30)';
    else if (ult.def.kind === 'fire_arrows') tint = 'rgba(46, 14, 8, 0.24)';

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT);
    ctx.restore();
  }
}

/** Smooth cartoon oval crater scorch marks + cooling ember glow on road */
export function renderScorchMarks(ctx: CanvasRenderingContext2D, scorches: ScorchMark[]): void {
  for (const s of scorches) {
    const lifeFrac = Math.max(0, s.life / s.maxLife);
    const alpha = Math.min(1, lifeFrac * 2.4);
    const rx = Math.max(14, s.radius * 0.98);
    const ry = Math.max(4.5, s.radius * 0.16);

    ctx.save();
    ctx.globalAlpha = alpha * 0.56;
    ctx.fillStyle = '#0c0e14';
    ctx.beginPath();
    ctx.ellipse(s.x, GROUND_Y + 3, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.72;
    ctx.fillStyle = '#1f1916';
    ctx.beginPath();
    ctx.ellipse(s.x, GROUND_Y + 3, rx * 0.64, ry * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    const heat = Math.max(0, (lifeFrac - 0.52) / 0.48);
    if (heat > 0.02) {
      ctx.globalAlpha = heat * 0.8;
      ctx.fillStyle = s.glowColor;
      ctx.beginPath();
      ctx.ellipse(s.x, GROUND_Y + 3, rx * 0.36, ry * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Smooth anime/cartoon glossy crescent blade slashes & spear sonic thrust cones */
export function renderSlashes(ctx: CanvasRenderingContext2D, slashes: SlashEffect[]): void {
  for (const sl of slashes) {
    const frac = Math.max(0, sl.life / sl.maxLife);
    const prog = 1 - frac;

    ctx.save();
    ctx.translate(sl.x, sl.y);
    ctx.scale(sl.dir, 1);
    ctx.globalAlpha = Math.min(1, frac * 1.8);

    if (sl.style === 'thrust') {
      const len = sl.radius * (0.9 + prog * 0.7);
      const h = Math.max(2.5, 9 * frac);
      ctx.beginPath();
      ctx.moveTo(-4, -h);
      ctx.lineTo(len + 8, 0);
      ctx.lineTo(-4, h);
      ctx.closePath();
      ctx.fillStyle = sl.color;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -h * 0.45);
      ctx.lineTo(len + 6, 0);
      ctx.lineTo(0, h * 0.45);
      ctx.closePath();
      ctx.fillStyle = sl.coreColor;
      ctx.fill();

      // Expanding crisp sonic shock ellipse around spear shaft
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2 * frac + 0.8;
      ctx.beginPath();
      ctx.ellipse(len * 0.42, 0, 4 + prog * 4, 10 + prog * 13, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Razor-tapered anime/Flash crescent blade with glowing outer aura & trailing sparks!
      const rOuter = sl.radius * (0.94 + prog * 0.32);
      const maxThick = (sl.style === 'heavy' ? 16 : sl.style === 'plasma' ? 14 : 11) * (0.52 + frac * 0.56);
      const startA = -1.52 + prog * 0.46 + sl.angleOffset;
      const endA = 1.36 + sl.angleOffset;
      const segs = 12;

      const buildTaperedCrescent = (rOut: number, thick: number, a0: number, a1: number) => {
        ctx.beginPath();
        for (let i = 0; i <= segs; i++) {
          const t = i / segs;
          const a = a0 + (a1 - a0) * t;
          const x = Math.cos(a) * rOut;
          const y = Math.sin(a) * rOut;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = segs; i >= 0; i--) {
          const t = i / segs;
          const a = a0 + (a1 - a0) * t;
          // Pinches smoothly to needle-sharp tips at both ends (t=0 and t=1), thickest near leading edge!
          const taper = Math.sin(t * Math.PI) * (0.65 + t * 0.5);
          const rIn = Math.max(3, rOut - thick * taper);
          ctx.lineTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
        }
        ctx.closePath();
      };

      // Soft wide glowing outer energy aura
      ctx.save();
      ctx.globalAlpha *= 0.42;
      buildTaperedCrescent(rOuter + 3.5, maxThick * 1.45, startA - 0.08, endA + 0.06);
      ctx.fillStyle = sl.color;
      ctx.fill();
      ctx.restore();

      // Main vibrant cel-colored crescent
      buildTaperedCrescent(rOuter, maxThick, startA, endA);
      ctx.fillStyle = sl.color;
      ctx.fill();

      // Razor-bright white-hot cutting edge core
      buildTaperedCrescent(rOuter - 0.8, maxThick * 0.5, startA + 0.14, endA - 0.02);
      ctx.fillStyle = sl.coreColor;
      ctx.fill();

      // Trailing spark flecks spinning off outer arc
      for (let k = 0; k < 3; k++) {
        const ka = startA + (endA - startA) * (0.28 + k * 0.25);
        const kr = rOuter + 4 + k * 2.5 + prog * 7;
        ctx.fillStyle = k === 2 ? '#ffffff' : sl.coreColor;
        ctx.beginPath();
        ctx.arc(Math.cos(ka) * kr, Math.sin(ka) * kr, Math.max(1.2, 2.6 * frac), 0, Math.PI * 2);
        ctx.fill();
      }

      // Crisp 4-point star glint at leading blade tip
      if (frac > 0.28) {
        const tx = Math.cos(endA - 0.06) * (rOuter - 1.5);
        const ty = Math.sin(endA - 0.06) * (rOuter - 1.5);
        const g = 11.5 * frac;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(tx - g, ty);
        ctx.lineTo(tx, ty - g * 0.26);
        ctx.lineTo(tx + g, ty);
        ctx.lineTo(tx, ty + g * 0.26);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx, ty - g);
        ctx.lineTo(tx + g * 0.26, ty);
        ctx.lineTo(tx, ty + g);
        ctx.lineTo(tx - g * 0.26, ty);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

/** Bold-ink cel-shaded cartoon projectiles with sleek motion trails */
export function renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: ProjectileEntity[]): void {
  for (const p of projectiles) {
    const angle = Math.atan2(p.vy, p.vx);
    const pal = getTeamPalette(p.team);

    ctx.save();
    // Smooth tapered motion trail
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > 40) {
      const tailLen = Math.min(34, speed * 0.048);
      const tx = p.x - (p.vx / speed) * tailLen;
      const ty = p.y - (p.vy / speed) * tailLen;
      const trailCol =
        p.style === 'quantum_orb'
          ? 'rgba(45, 212, 191, 0.65)'
          : p.style === 'plasma'
            ? pal.glowSoft
            : p.style === 'antimatter'
              ? 'rgba(192, 132, 252, 0.58)'
              : p.style === 'dragon_rocket'
                ? 'rgba(239, 68, 68, 0.65)'
                : p.style === 'solar_orb' || p.style === 'totem_fire' || p.style === 'fire_arrow'
                  ? 'rgba(249, 115, 22, 0.58)'
                  : p.style === 'bullet'
                    ? 'rgba(254, 240, 138, 0.65)'
                    : 'rgba(226, 232, 240, 0.34)';
      ctx.strokeStyle = trailCol;
      ctx.lineWidth = p.style === 'boulder' || p.style === 'cannonball' ? 6 : 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    ctx.translate(p.x, p.y);
    const spin = p.life * 8 * (p.vx >= 0 ? 1 : -1);

    switch (p.style) {
      case 'stone':
        ctx.rotate(spin);
        drawCelEllipse(ctx, 0, 0, 5.2, 4.4, '#94a3b8', { highlight: '#e2e8f0', shadow: '#475569', lineWidth: 1.7 });
        break;
      case 'boulder':
        ctx.rotate(spin);
        drawCelEllipse(ctx, 0, 0, 9.5, 8.2, '#78716c', { highlight: '#d6d3d1', shadow: '#44403c', lineWidth: 2.1 });
        break;
      case 'totem_fire':
        drawEnergyOrb(ctx, 0, 0, 6.2, '#f97316', '#fef08a');
        break;
      case 'solar_orb':
        drawEnergyOrb(ctx, 0, 0, 7.2, '#f59e0b', '#ffffff');
        break;
      case 'arrow':
      case 'fire_arrow':
      case 'bolt': {
        ctx.rotate(angle);
        setInkStyle(ctx, 2.2, '#78350f');
        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();
        drawCelPoly(
          ctx,
          [
            [-12, -3.5],
            [-6, 0],
            [-12, 3.5],
          ],
          pal.light,
          { lineWidth: 1.2 },
        );
        drawCelPoly(
          ctx,
          [
            [6, -3.2],
            [13, 0],
            [6, 3.2],
          ],
          '#e2e8f0',
          { lineWidth: 1.3 },
        );
        if (p.style === 'fire_arrow') {
          drawEnergyOrb(ctx, 10, 0, 4.6, '#f97316', '#fef08a');
        }
        break;
      }
      case 'dragon_rocket': {
        ctx.rotate(angle);
        drawEnergyOrb(ctx, -12, 0, 5.2, '#f97316', '#fef08a');
        setInkStyle(ctx, 2.4, '#78350f');
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        drawCelRoundRect(ctx, -3, -3.2, 10, 6.4, 1.8, '#dc2626', { highlight: '#fca5a5', lineWidth: 1.5 });
        drawCelRoundRect(ctx, 1, -3.4, 2.6, 6.8, 0.8, '#facc15', { lineWidth: 1.0 });
        drawCelPoly(
          ctx,
          [
            [7, -3.5],
            [15, 0],
            [7, 3.5],
          ],
          '#fef9c3',
          { lineWidth: 1.3 },
        );
        break;
      }
      case 'bullet': {
        ctx.rotate(angle);
        drawCelRoundRect(ctx, -6, -2.2, 12, 4.4, 2, '#facc15', { highlight: '#ffffff', lineWidth: 1.4 });
        break;
      }
      case 'grenade': {
        ctx.rotate(spin);
        drawCelEllipse(ctx, 0, 0, 6.2, 6.2, '#1e293b', { highlight: '#64748b', lineWidth: 1.8 });
        drawEnergyOrb(ctx, 4.5, -5.5, 3.2, '#f97316', '#fef08a');
        break;
      }
      case 'cannonball': {
        drawCelEllipse(ctx, 0, 0, 7.2, 7.2, '#1e293b', { highlight: '#94a3b8', shadow: '#090d16', lineWidth: 2.0 });
        break;
      }
      case 'mortar_shell':
      case 'shell': {
        ctx.rotate(angle);
        drawCelEllipse(ctx, 0, 0, 9, 4.8, '#475569', { highlight: '#cbd5e1', lineWidth: 1.8 });
        drawCelPoly(
          ctx,
          [
            [-10, -4.5],
            [-5, 0],
            [-10, 4.5],
          ],
          '#ef4444',
          { lineWidth: 1.3 },
        );
        break;
      }
      case 'rocket': {
        ctx.rotate(angle);
        drawEnergyOrb(ctx, -11, 0, 5.2, '#f97316', '#fef08a');
        drawCelRoundRect(ctx, -9, -3.5, 17, 7, 2.5, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.7 });
        drawCelPoly(
          ctx,
          [
            [7, -3.8],
            [15, 0],
            [7, 3.8],
          ],
          '#ef4444',
          { lineWidth: 1.5 },
        );
        break;
      }
      case 'plasma': {
        ctx.rotate(angle);
        drawCelRoundRect(ctx, -9, -3.5, 18, 7, 3.5, pal.glow, {
          highlight: '#ffffff',
          lineWidth: 1.5,
          ink: pal.dark,
        });
        break;
      }
      case 'antimatter': {
        drawEnergyOrb(ctx, 0, 0, 7.8, '#a855f7', '#fef08a');
        ctx.fillStyle = '#09071a';
        ctx.beginPath();
        ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'quantum_orb': {
        ctx.rotate(spin);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(0, 0, 9.5, 4.2, 0.35, 0, Math.PI * 2);
        ctx.stroke();
        drawEnergyOrb(ctx, 0, 0, 7.5, '#2dd4bf', '#fef9c3');
        break;
      }
      default: {
        drawEnergyOrb(ctx, 0, 0, 5.2, '#fde047', '#ffffff');
      }
    }

    ctx.restore();
  }
}

/** Smooth glowing lightning, Tesla arcs, Solar Wrath, Orbital Laser, Black Hole Vortex, Flames & Railgun beams */
export function renderBeams(ctx: CanvasRenderingContext2D, beams: BeamEffect[]): void {
  for (const b of beams) {
    const ratio = Math.max(0, b.life / b.maxLife);
    ctx.save();

    if (b.style === 'lightning' || b.style === 'tesla_arc') {
      const isHorizontal = b.style === 'tesla_arc';
      const segments = isHorizontal ? 9 : 13;
      const pts: [number, number][] = [[b.x1, b.y1]];
      for (let s = 1; s < segments; s++) {
        const t = s / segments;
        const jitter = Math.sin(b.seed + s * 7.3) * (isHorizontal ? 15 : 26);
        pts.push([
          b.x1 + (b.x2 - b.x1) * t + (isHorizontal ? 0 : jitter),
          b.y1 + (b.y2 - b.y1) * t + (isHorizontal ? jitter : 0),
        ]);
      }
      pts.push([b.x2, b.y2]);

      const strokePoly = (width: number, style: string) => {
        ctx.strokeStyle = style;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      };

      strokePoly(b.width * ratio + 11, `rgba(56, 189, 248, ${(ratio * 0.35).toFixed(2)})`);
      strokePoly(b.width * ratio + 4, `rgba(56, 189, 248, ${(ratio * 0.92).toFixed(2)})`);
      strokePoly(Math.max(2, b.width * 0.45 * ratio), `rgba(255, 255, 255, ${ratio.toFixed(2)})`);
    } else if (b.style === 'orbital_laser' || b.style === 'solar_beam' || b.style === 'chrono_nova_pillar') {
      const isSolar = b.style === 'solar_beam';
      const isChronoNova = b.style === 'chrono_nova_pillar';
      const w = Math.max(10, b.width * (0.5 + ratio * 0.78));
      const h = b.y2 - b.y1;

      const grad = ctx.createLinearGradient(b.x1 - w * 1.5, 0, b.x1 + w * 1.5, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(
        0.24,
        isChronoNova
          ? `rgba(45,212,191,${(ratio * 0.82).toFixed(2)})`
          : isSolar
            ? `rgba(245,158,11,${(ratio * 0.75).toFixed(2)})`
            : `rgba(6,182,212,${(ratio * 0.75).toFixed(2)})`,
      );
      grad.addColorStop(0.5, `rgba(255,255,255,${Math.min(1, ratio * 1.15).toFixed(2)})`);
      grad.addColorStop(
        0.76,
        isChronoNova
          ? `rgba(250,204,21,${(ratio * 0.78).toFixed(2)})`
          : isSolar
            ? `rgba(245,158,11,${(ratio * 0.75).toFixed(2)})`
            : `rgba(6,182,212,${(ratio * 0.75).toFixed(2)})`,
      );
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x1 - w * 1.5, b.y1, w * 3.0, h);

      if (isChronoNova) {
        // Ascending golden Chrono-Clock rings wrapping the supernova column!
        for (let ri = 0; ri < 3; ri++) {
          const ry = GROUND_Y - 38 - ri * 95 - (1 - ratio) * 45;
          ctx.strokeStyle = ri % 2 === 0 ? `rgba(250, 204, 21, ${(ratio * 0.92).toFixed(2)})` : `rgba(94, 234, 212, ${(ratio * 0.88).toFixed(2)})`;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.ellipse(b.x1, ry, w * (1.25 - ri * 0.14), w * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.fillStyle = isChronoNova
        ? `rgba(45, 212, 191, ${(ratio * 0.9).toFixed(2)})`
        : isSolar
          ? `rgba(251, 191, 36, ${(ratio * 0.85).toFixed(2)})`
          : `rgba(56, 189, 248, ${(ratio * 0.85).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(b.x1, GROUND_Y, w * 1.85, w * 0.58, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 255, 255, ${(ratio * 0.95).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(b.x1, GROUND_Y, w * 0.98, w * 0.35, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    } else if (b.style === 'black_hole_vortex') {
      const r = Math.max(18, b.width * (0.55 + Math.sin(ratio * Math.PI) * 0.55));
      const spin = (1 - ratio) * 8 + b.seed;

      // Gravitational lensing outer halo
      const g = ctx.createRadialGradient(b.x1, b.y1, r * 0.3, b.x1, b.y1, r * 1.6);
      g.addColorStop(0, '#05020d');
      g.addColorStop(0.45, `rgba(168, 85, 247, ${(ratio * 0.85).toFixed(2)})`);
      g.addColorStop(0.78, `rgba(126, 34, 206, ${(ratio * 0.35).toFixed(2)})`);
      g.addColorStop(1, 'rgba(126, 34, 206, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x1, b.y1, r * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Tilted golden-magenta spinning accretion disk (back half)
      ctx.save();
      ctx.translate(b.x1, b.y1);
      ctx.rotate(-0.18);
      ctx.strokeStyle = `rgba(240, 171, 252, ${(ratio * 0.85).toFixed(2)})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.5, r * 0.36, 0, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Glowing photon ring + pitch-black event horizon
      ctx.fillStyle = '#05020d';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.54, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(254, 240, 138, ${(ratio * 0.95).toFixed(2)})`;
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // Front sweeping accretion disk arc + orbiting star sparks
      ctx.strokeStyle = `rgba(250, 204, 21, ${(ratio * 0.92).toFixed(2)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.5, r * 0.36, 0, 0, Math.PI);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = spin + (i / 6) * Math.PI * 2;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 1.35, Math.sin(a) * r * 0.32, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (b.style === 'flame_jet') {
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const fx = b.x1 + (b.x2 - b.x1) * t;
        const fy = b.y1 + (b.y2 - b.y1) * t + Math.sin(b.seed * 12 + i * 2) * 5;
        const r = 4.5 + t * b.width * 0.95;
        ctx.globalAlpha = ratio * (1 - t * 0.42);
        drawCelEllipse(ctx, fx, fy, r * 1.15, r * 0.85, t < 0.3 ? '#fef08a' : t < 0.7 ? '#f97316' : '#dc2626', {
          lineWidth: 1.4,
          ink: '#7c2d12',
        });
      }
    } else {
      // Sleek glowing Railgun, Ion Beam, Cosmic Gravity Beam, or Prismatic Chrono Beam
      ctx.lineCap = 'round';
      ctx.globalAlpha = ratio * 0.45;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width * ratio + 9;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.globalAlpha = ratio;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width * ratio + 3;
      ctx.stroke();

      ctx.strokeStyle = b.style === 'gravity_beam' || b.style === 'chrono_beam' ? '#fef08a' : '#ffffff';
      ctx.lineWidth = Math.max(2, b.width * 0.44 * ratio);
      ctx.stroke();

      if (b.style === 'chrono_beam') {
        // Golden spiraling quantum helix ribbon weaving around the Chrono Beam!
        ctx.strokeStyle = `rgba(250, 204, 21, ${(ratio * 0.88).toFixed(2)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        const segs = 12;
        for (let s = 0; s <= segs; s++) {
          const t = s / segs;
          const bx = b.x1 + (b.x2 - b.x1) * t;
          const by = b.y1 + (b.y2 - b.y1) * t + Math.sin(t * Math.PI * 4 + b.seed) * (7 * ratio);
          if (s === 0) ctx.moveTo(bx, by);
          else ctx.lineTo(bx, by);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

/** Stylized cartoon Bombers, Steampunk Zeppelins, Flaming Meteors, Dragon Rockets, Fire Arrows & Missiles */
export function renderActiveUltimates(ctx: CanvasRenderingContext2D, ultimates: ActiveUltimate[]): void {
  for (const ult of ultimates) {
    const pal = getTeamPalette(ult.team);

    if (ult.planes) {
      for (const plane of ult.planes) {
        ctx.save();
        ctx.translate(plane.x, plane.y);
        if (plane.dir === -1) ctx.scale(-1, 1);

        if (plane.kind === 'zeppelin') {
          drawCelEllipse(ctx, 0, 0, 56, 22, '#d97706', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.6 });
          drawCelRoundRect(ctx, -38, -6, 76, 10, 4, pal.main, { highlight: pal.light, lineWidth: 1.8 });
          drawCelPoly(
            ctx,
            [
              [-44, -10],
              [-66, -24],
              [-58, -4],
            ],
            pal.main,
            { lineWidth: 2.0 },
          );
          drawCelPoly(
            ctx,
            [
              [-44, 10],
              [-66, 22],
              [-58, 4],
            ],
            pal.main,
            { lineWidth: 2.0 },
          );
          drawCelRoundRect(ctx, -18, 21, 34, 10, 4, '#475569', { highlight: '#94a3b8', lineWidth: 2.0 });
        } else {
          drawCelPoly(
            ctx,
            [
              [-46, -16],
              [-32, -2],
              [-44, 4],
            ],
            pal.main,
            { lineWidth: 2.0 },
          );
          drawCelEllipse(ctx, 0, 0, 46, 11, '#64748b', { highlight: '#cbd5e1', shadow: '#334155', lineWidth: 2.4 });
          drawCelRoundRect(ctx, -12, -8, 28, 8, 3, pal.main, { highlight: pal.light, lineWidth: 1.8 });
          drawCelEllipse(ctx, 26, -3, 10, 5.5, '#38bdf8', { highlight: '#ffffff', lineWidth: 1.8 });
          drawCelPoly(
            ctx,
            [
              [-14, 4],
              [14, 4],
              [4, 18],
              [-22, 16],
            ],
            '#475569',
            { lineWidth: 2.0 },
          );
        }
        ctx.restore();
      }
    }

    for (const ord of ult.fallingOrdinance) {
      if (ord.impacted) continue;

      if (ord.kind === 'meteor') {
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = `rgba(249, 115, 22, ${(frac * 0.65).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4 + frac * 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(254, 240, 138, ${(frac * 0.7).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2 + frac * 7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(ord.y * 0.03);
        drawCelEllipse(ctx, 0, 0, 16, 14, '#7c2d12', { highlight: '#f97316', shadow: '#292524', lineWidth: 2.5 });
        drawEnergyOrb(ctx, 3, 2, 6, '#f97316', '#fef08a');
        ctx.restore();
      } else if (ord.kind === 'dragon_barrage') {
        // Blazing crimson-gold Singijeon Dragon Fire Rockets streaking down from the sky!
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = `rgba(239, 68, 68, ${(frac * 0.62).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2 + frac * 5.5, 0, Math.PI * 2);
          ctx.fill();
        }
        const a = Math.atan2(ord.vy, ord.vx);
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        drawEnergyOrb(ctx, -14, 0, 5.2, '#f97316', '#fef08a');
        setInkStyle(ctx, 2.4, '#78350f');
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        drawCelRoundRect(ctx, -2, -3.5, 11, 7, 2, '#dc2626', { highlight: '#fca5a5', lineWidth: 1.5 });
        drawCelRoundRect(ctx, 2, -3.6, 3, 7.2, 0.8, '#facc15', { lineWidth: 1.0 });
        drawEnergyOrb(ctx, 13, 0, 5.6, '#ef4444', '#fef9c3');
        ctx.restore();
      } else if (ord.kind === 'fire_arrows') {
        const a = Math.atan2(ord.vy, ord.vx);
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        setInkStyle(ctx, 2.4, '#78350f');
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        drawEnergyOrb(ctx, 10, 0, 5.5, '#f97316', '#fef08a');
        ctx.restore();
      } else if (ord.kind === 'tactical_missiles') {
        // Crisp pulsing ground target reticle
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(ord.targetX, GROUND_Y, 24, 6.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ord.targetX - 30, GROUND_Y);
        ctx.lineTo(ord.targetX + 30, GROUND_Y);
        ctx.stroke();
        ctx.restore();

        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = `rgba(241, 245, 249, ${(frac * 0.65).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5 + frac * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        const a = Math.atan2(ord.vy, ord.vx);
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        drawEnergyOrb(ctx, -14, 0, 6.5, '#f97316', '#fef08a');
        drawCelRoundRect(ctx, -12, -4.5, 24, 9, 3, '#e2e8f0', { highlight: '#ffffff', lineWidth: 2.0 });
        drawCelPoly(
          ctx,
          [
            [11, -4.8],
            [21, 0],
            [11, 4.8],
          ],
          '#ef4444',
          { lineWidth: 1.7 },
        );
        ctx.restore();
      } else {
        // Naval barrage shells & aerial carpet bombs
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = `rgba(148, 163, 184, ${(frac * 0.55).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2 + frac * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        const a = Math.atan2(ord.vy, ord.vx);
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        drawCelEllipse(ctx, 0, 0, 11, 6.2, '#334155', { highlight: '#94a3b8', shadow: '#0f172a', lineWidth: 2.1 });
        drawCelPoly(
          ctx,
          [
            [-14, -6],
            [-7, 0],
            [-14, 6],
          ],
          '#ef4444',
          { lineWidth: 1.5 },
        );
        ctx.restore();
      }
    }
  }
}

/** Smooth bold-ink cartoon fireballs, comic impact starbursts, shockwave rings, smoke puffs & velocity sparks */
export function renderParticles(ctx: CanvasRenderingContext2D, particles: ParticleEntity[]): void {
  for (const p of particles) {
    const frac = Math.max(0, p.life / p.maxLife);
    const prog = 1 - frac;

    ctx.save();
    ctx.globalAlpha = Math.min(1, frac * 1.4) * p.alpha;

    if (p.shape === 'flash_star') {
      const rOuter = Math.max(8, p.size * (0.45 + frac * 0.95));
      const rInner = rOuter * 0.34;
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      const spikes = 8;
      for (let i = 0; i < spikes * 2; i++) {
        const a = (i / (spikes * 2)) * Math.PI * 2;
        const r = i % 2 === 0 ? rOuter : rInner;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = p.color;
      ctx.fill();
      setInkStyle(ctx, 1.4, '#7c2d12');
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, rInner * 0.85, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'fireball') {
      // Vibrant translucent cartoon explosion fireball (keeps fighters clearly readable!)
      const r = Math.max(8, p.size * (0.52 + prog * 0.65));
      ctx.globalAlpha *= frac > 0.35 ? 0.84 : Math.max(0.15, frac * 1.6);
      const outerCol = frac > 0.25 ? p.color : '#ea580c';
      drawCelEllipse(ctx, p.x, p.y, r, r * 0.92, outerCol, {
        lineWidth: 1.8,
        ink: 'rgba(124, 45, 18, 0.72)',
      });
      if (frac > 0.2) {
        ctx.fillStyle = frac > 0.45 ? '#fde047' : '#f97316';
        ctx.beginPath();
        ctx.arc(p.x - r * 0.1, p.y - r * 0.1, r * 0.66, 0, Math.PI * 2);
        ctx.fill();
      }
      if (frac > 0.48) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - r * 0.12, p.y - r * 0.12, r * 0.36, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.shape === 'dust_wave') {
      const rx = Math.max(9, p.size * (0.95 + prog * 1.25));
      const ry = Math.max(4, p.size * 0.36 * frac + 2);
      ctx.globalAlpha *= 0.66;
      drawCelEllipse(ctx, p.x, p.y - ry * 0.5, rx, ry, p.color, { lineWidth: 1.3, ink: 'rgba(20,24,36,0.34)' });
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - ry * 0.4, rx * 1.15, ry * 0.9, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    } else if (p.shape === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(2, 5.2 * frac);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(4, p.size), 0, Math.PI * 2);
      ctx.stroke();
      if (frac > 0.45) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(3, p.size * 0.84), 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (p.shape === 'smoke') {
      const r = Math.max(4.5, p.size * (1.05 - frac * 0.25));
      ctx.globalAlpha *= 0.44;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.arc(p.x - r * 0.25, p.y - r * 0.25, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'debris') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? prog * 6);
      const sz = Math.max(4, p.size * 1.35);
      drawCelRoundRect(ctx, -sz / 2, -sz / 2, sz, sz * 0.85, 1.5, p.color, {
        highlight: 'rgba(255,255,255,0.35)',
        lineWidth: 1.5,
      });
    } else if (p.shape === 'spark') {
      const tx = p.x - p.vx * 0.044;
      const ty = p.y - p.vy * 0.044;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(2.2, p.size * frac + 1.8);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.1, (p.size * frac + 1.2) * 0.45);
      ctx.beginPath();
      ctx.moveTo((tx + p.x) * 0.5, (ty + p.y) * 0.5);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.8, p.size * 0.48), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2, p.size * (0.5 + frac * 0.5)), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/** Crisp comic spring-pop damage numbers with bold dark outline, crit stars, and gleaming gold coins */
export function renderPopups(ctx: CanvasRenderingContext2D, popups: DamagePopup[]): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';

  for (const pop of popups) {
    const frac = Math.max(0, pop.life / pop.maxLife);
    const age = pop.maxLife - pop.life;
    const isCrit = pop.kind === 'crit' || pop.text.endsWith('!');
    const isGold = pop.kind === 'gold' || (pop.text.startsWith('+') && pop.text.endsWith('G'));
    const isBase = pop.kind === 'base';

    let popMult = 1;
    if (age < 0.07) {
      const t = age / 0.07;
      popMult = 0.72 + t * (isCrit ? 0.92 : 0.62);
    } else if (age < 0.18) {
      const t = (age - 0.07) / 0.11;
      popMult = (isCrit ? 1.64 : 1.34) - t * (isCrit ? 0.64 : 0.34);
    }

    const fontSize = Math.round(14.5 * pop.scale * popMult);
    ctx.globalAlpha = Math.min(1, frac * 1.75);
    ctx.font = `900 ${fontSize}px 'Pretendard', system-ui, -apple-system, sans-serif`;

    if (isCrit && frac > 0.25) {
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.85)';
      ctx.strokeText(pop.text, pop.x, pop.y);
    } else if (isBase) {
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(185, 28, 28, 0.78)';
      ctx.strokeText(pop.text, pop.x, pop.y);
    }

    // Crisp drop shadow + bold ink comic outline + vibrant fill
    ctx.fillStyle = 'rgba(10, 14, 24, 0.92)';
    ctx.fillText(pop.text, pop.x + 1.8, pop.y + 2.2);

    ctx.lineWidth = isCrit ? 4.4 : 3.8;
    ctx.strokeStyle = INK;
    ctx.strokeText(pop.text, pop.x, pop.y);

    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);

    // Gleaming cartoon gold coin badge next to kill gold popups!
    if (isGold) {
      const coinX = pop.x - pop.text.length * fontSize * 0.33 - 7;
      drawCelEllipse(ctx, coinX, pop.y, 4.6, 4.6, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.5 });
    }
  }

  ctx.restore();
}

/** Draw parachuting & landed golden Midfield Chrono Supply Crates with drop beacon & HP bar! */
export function renderSupplyCrates(
  ctx: CanvasRenderingContext2D,
  crates: SupplyCrateEntity[],
  time: number,
): void {
  for (const c of crates) {
    const sway = c.landed ? 0 : Math.sin(time * 3.8 + c.uid) * 0.14;
    const pulse = 0.65 + Math.sin(time * 5.2 + c.uid) * 0.25;

    ctx.save();
    // Glowing golden sky beacon guiding both armies to midfield!
    const beaconGrad = ctx.createLinearGradient(c.x, GROUND_Y, c.x, 40);
    beaconGrad.addColorStop(0, `rgba(250, 204, 21, ${(pulse * 0.34).toFixed(2)})`);
    beaconGrad.addColorStop(0.65, `rgba(254, 240, 138, ${(pulse * 0.12).toFixed(2)})`);
    beaconGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beaconGrad;
    ctx.fillRect(c.x - 16, 40, 32, GROUND_Y - 40);

    // Ground contact shadow
    ctx.fillStyle = 'rgba(10, 14, 24, 0.36)';
    ctx.beginPath();
    ctx.ellipse(c.x, GROUND_Y + 2, c.landed ? 22 : 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(c.x, c.y);
    ctx.rotate(sway);

    // Striped cartoon parachute canopy while descending!
    if (!c.landed) {
      setInkStyle(ctx, 1.5, '#cbd5e1');
      ctx.beginPath();
      ctx.moveTo(-12, -26);
      ctx.lineTo(-22, -52);
      ctx.moveTo(12, -26);
      ctx.lineTo(22, -52);
      ctx.moveTo(0, -26);
      ctx.lineTo(0, -56);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -52, 24, Math.PI, 0);
      ctx.closePath();
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -52, 24, Math.PI * 1.25, Math.PI * 1.75);
      ctx.lineTo(0, -52);
      ctx.closePath();
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      setInkStyle(ctx, 2.1, INK);
      ctx.beginPath();
      ctx.arc(0, -52, 24, Math.PI, 0);
      ctx.closePath();
      ctx.stroke();
    }

    // Hit flash jolt
    const jolt = c.hitFlash > 0.2 ? Math.sin(time * 48) * 2.5 * c.hitFlash : 0;
    ctx.translate(jolt, 0);

    // Armored golden-wood Chrono Relic Supply Crate!
    drawCelRoundRect(ctx, -17, -30, 34, 30, 5, c.hitFlash > 0.45 ? '#fef9c3' : '#b45309', {
      highlight: '#fde047',
      shadow: '#78350f',
      lineWidth: 2.4,
    });
    // Crossed golden steel bands
    drawCelRoundRect(ctx, -18, -20, 36, 7, 2, '#facc15', { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.7 });
    drawCelRoundRect(ctx, -4, -31, 8, 32, 2, '#facc15', { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.7 });
    // Glowing cyan Chrono core gem in center
    drawEnergyOrb(ctx, 0, -16, 5.2 + pulse * 1.1, '#22d3ee', '#ffffff');

    // Overhead HP bar once landed
    if (c.landed) {
      const barW = 42;
      const barH = 6;
      const barY = -42;
      const ratio = Math.max(0, Math.min(1, c.hp / Math.max(1, c.maxHp)));
      ctx.fillStyle = '#141c2c';
      ctx.beginPath();
      ctx.roundRect(-barW / 2, barY, barW, barH, 3);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(-barW / 2, barY, barW * ratio, barH, 2.5);
      ctx.fill();
      setInkStyle(ctx, 1.6, INK);
      ctx.beginPath();
      ctx.roundRect(-barW / 2, barY, barW, barH, 3);
      ctx.stroke();
    }

    ctx.restore();
  }
}
