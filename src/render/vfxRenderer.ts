import type {
  ActiveUltimate,
  BeamEffect,
  DamagePopup,
  ParticleEntity,
  ProjectileEntity,
  ScorchMark,
  SlashEffect,
} from '../data/types';
import { GROUND_Y, WORLD_HEIGHT } from '../game/constants';

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
    let tint = 'rgba(20, 12, 8, 0.24)';
    if (ult.def.kind === 'lightning') tint = 'rgba(10, 20, 42, 0.45)';
    else if (ult.def.kind === 'orbital_laser') tint = 'rgba(6, 22, 36, 0.4)';
    else if (ult.def.kind === 'meteor') tint = 'rgba(58, 18, 6, 0.34)';
    else if (ult.def.kind === 'fire_arrows') tint = 'rgba(46, 14, 8, 0.28)';

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT);
    ctx.restore();
  }
}

/** Persistent dark crater scorches + cooling embers on the battlefield floor */
export function renderScorchMarks(ctx: CanvasRenderingContext2D, scorches: ScorchMark[]): void {
  for (const s of scorches) {
    const lifeFrac = Math.max(0, s.life / s.maxLife);
    const alpha = Math.min(1, lifeFrac * 2.5);

    ctx.save();
    // Charred outer blast soot
    ctx.globalAlpha = alpha * 0.58;
    ctx.fillStyle = '#090b0f';
    ctx.beginPath();
    ctx.ellipse(s.x, GROUND_Y + 4, s.radius * 1.1, Math.max(5, s.radius * 0.2), 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner crater rim
    ctx.globalAlpha = alpha * 0.78;
    ctx.fillStyle = '#181412';
    ctx.beginPath();
    ctx.ellipse(s.x, GROUND_Y + 3.5, s.radius * 0.72, Math.max(3.5, s.radius * 0.13), 0, 0, Math.PI * 2);
    ctx.fill();

    // Hot cooling ember/plasma glow during first 35% of lifetime
    const heat = Math.max(0, (lifeFrac - 0.55) / 0.45);
    if (heat > 0.01) {
      ctx.globalAlpha = heat * 0.72;
      ctx.fillStyle = s.glowColor;
      ctx.beginPath();
      ctx.ellipse(s.x, GROUND_Y + 3, s.radius * 0.45, Math.max(2.2, s.radius * 0.08), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Stylized curved melee slash crescents & spear thrust streaks */
export function renderSlashes(ctx: CanvasRenderingContext2D, slashes: SlashEffect[]): void {
  for (const sl of slashes) {
    const frac = Math.max(0, sl.life / sl.maxLife);
    const prog = 1 - frac;

    ctx.save();
    ctx.translate(sl.x, sl.y);
    ctx.scale(sl.dir, 1);
    ctx.rotate(sl.angleOffset);
    ctx.globalAlpha = Math.min(1, frac * 1.6);

    if (sl.style === 'thrust') {
      // Sharp piercing thrust cone & speed lines
      const len = sl.radius * (0.7 + prog * 0.55);
      ctx.fillStyle = sl.color;
      ctx.beginPath();
      ctx.moveTo(-6, -5 * frac);
      ctx.lineTo(len, 0);
      ctx.lineTo(-6, 5 * frac);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = sl.coreColor;
      ctx.beginPath();
      ctx.moveTo(-2, -2.2 * frac);
      ctx.lineTo(len * 0.92, 0);
      ctx.lineTo(-2, 2.2 * frac);
      ctx.closePath();
      ctx.fill();
    } else {
      // Sweeping curved crescent slash arc (blade / heavy / plasma)
      const r = sl.radius * (0.85 + prog * 0.25);
      const startA = -1.35 + prog * 0.45;
      const endA = 1.15;

      if (sl.style === 'plasma') {
        ctx.shadowColor = sl.color;
        ctx.shadowBlur = 12;
      }

      // Outer tapered crescent ribbon
      ctx.fillStyle = sl.color;
      ctx.beginPath();
      ctx.arc(0, 0, r, startA, endA);
      ctx.arc(-6, 1, r * 0.72, endA, startA, true);
      ctx.closePath();
      ctx.fill();

      // White-hot leading razor edge
      ctx.strokeStyle = sl.coreColor;
      ctx.lineWidth = sl.style === 'heavy' ? 3.2 * frac : 2.6 * frac;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.94, startA + 0.15, endA - 0.05);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export function renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: ProjectileEntity[]): void {
  for (const p of projectiles) {
    const angle = Math.atan2(p.vy, p.vx);

    ctx.save();
    switch (p.style) {
      case 'stone':
        ctx.fillStyle = '#a8a29e';
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'boulder':
        ctx.strokeStyle = 'rgba(214, 211, 209, 0.4)';
        ctx.lineWidth = 7.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.prevX - p.vx * 0.02, p.prevY - p.vy * 0.02);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = '#78716c';
        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#d6d3d1';
        ctx.beginPath();
        ctx.arc(p.x - 2.5, p.y - 2.5, 2.8, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'arrow':
      case 'fire_arrow':
      case 'bolt':
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-22, 0);
        ctx.lineTo(-10, 0);
        ctx.stroke();

        ctx.strokeStyle = p.style === 'bolt' ? '#e2e8f0' : '#d97706';
        ctx.lineWidth = p.style === 'bolt' ? 2.8 : 2.2;
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
        // Fletching
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -2.5, 4, 5);
        // Steel arrowhead
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#121622';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(6, -3);
        ctx.lineTo(13, 0);
        ctx.lineTo(6, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (p.style === 'fire_arrow') {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(8, 0, 4.8, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'bullet':
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.prevX - p.vx * 0.022, p.prevY - p.vy * 0.022);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.strokeStyle = '#fef9c3';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'cannonball':
      case 'shell':
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.prevX - p.vx * 0.02, p.prevY - p.vy * 0.02);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = p.style === 'shell' ? '#d97706' : '#1f2937';
        ctx.strokeStyle = '#090d14';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.style === 'shell' ? 6 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'rocket':
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#121622';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-11, -3.2, 18, 6.4);
        ctx.strokeRect(-11, -3.2, 18, 6.4);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(7, -3.6);
        ctx.lineTo(15, 0);
        ctx.lineTo(7, 3.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-13, 0, 5.2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'plasma': {
        const col = p.team === 'player' ? '#22d3ee' : '#fb7185';
        ctx.shadowColor = col;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = col;
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.prevX - p.vx * 0.022, p.prevY - p.vy * 0.022);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }

      default:
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    ctx.restore();
  }
}

export function renderBeams(ctx: CanvasRenderingContext2D, beams: BeamEffect[]): void {
  for (const b of beams) {
    const ratio = Math.max(0, b.life / b.maxLife);
    ctx.save();

    if (b.style === 'lightning') {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      const segments = 10;
      const pts: { x: number; y: number }[] = [{ x: b.x1, y: b.y1 }];
      for (let s = 1; s < segments; s++) {
        const t = s / segments;
        pts.push({
          x: b.x1 + (b.x2 - b.x1) * t + Math.sin(b.seed + s * 7.3) * 26,
          y: b.y1 + (b.y2 - b.y1) * t,
        });
      }
      pts.push({ x: b.x2, y: b.y2 });

      ctx.beginPath();
      pts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
      ctx.strokeStyle = `rgba(56, 189, 248, ${(ratio * 0.92).toFixed(2)})`;
      ctx.lineWidth = b.width * ratio + 5;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${ratio.toFixed(2)})`;
      ctx.lineWidth = Math.max(2.5, b.width * 0.4 * ratio);
      ctx.stroke();

      // Secondary jagged lightning side forks
      const forkPt = pts[4];
      ctx.beginPath();
      ctx.moveTo(forkPt.x, forkPt.y);
      ctx.lineTo(forkPt.x + 28, forkPt.y + 34);
      ctx.lineTo(forkPt.x + 42, forkPt.y + 72);
      ctx.strokeStyle = `rgba(125, 211, 252, ${(ratio * 0.7).toFixed(2)})`;
      ctx.lineWidth = 2.4 * ratio;
      ctx.stroke();
    } else if (b.style === 'orbital_laser') {
      const w = b.width * (0.48 + ratio * 0.8);
      const grad = ctx.createLinearGradient(b.x1 - w, 0, b.x1 + w, 0);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
      grad.addColorStop(0.24, `rgba(6, 182, 212, ${(ratio * 0.78).toFixed(2)})`);
      grad.addColorStop(0.5, `rgba(255, 255, 255, ${Math.min(1, ratio * 1.25).toFixed(2)})`);
      grad.addColorStop(0.76, `rgba(6, 182, 212, ${(ratio * 0.78).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x1 - w, b.y1, w * 2, b.y2 - b.y1);

      // Blinding ground impact shock dome & elliptical plasma ring
      ctx.fillStyle = `rgba(224, 242, 254, ${(ratio * 0.95).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(b.x2, GROUND_Y, w * 1.45, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(34, 211, 238, ${(ratio * 0.9).toFixed(2)})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(b.x2, GROUND_Y, w * 1.8 + (1 - ratio) * 52, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (b.style === 'flame_jet') {
      const grad = ctx.createLinearGradient(b.x1, b.y1, b.x2, b.y2);
      grad.addColorStop(0, `rgba(254, 249, 195, ${(ratio * 0.98).toFixed(2)})`);
      grad.addColorStop(0.45, `rgba(249, 115, 22, ${(ratio * 0.88).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1 - 4);
      ctx.lineTo(b.x2, b.y2 - b.width * 1.25);
      ctx.lineTo(b.x2, b.y2 + b.width * 1.25);
      ctx.lineTo(b.x1, b.y1 + 4);
      ctx.closePath();
      ctx.fill();
    } else {
      // Railgun or Ion beam
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = ratio;
      ctx.lineWidth = b.width * ratio + 3;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(2, b.width * 0.45 * ratio);
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export function renderActiveUltimates(ctx: CanvasRenderingContext2D, ultimates: ActiveUltimate[]): void {
  for (const ult of ultimates) {
    if (ult.planes) {
      for (const plane of ult.planes) {
        ctx.save();
        ctx.translate(plane.x, plane.y);
        ctx.scale(plane.dir, 1);
        ctx.strokeStyle = '#121622';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#4a5543';
        ctx.beginPath();
        ctx.ellipse(0, 0, 38, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#5c6953';
        ctx.beginPath();
        ctx.moveTo(-12, -2);
        ctx.lineTo(14, -2);
        ctx.lineTo(3, -18);
        ctx.lineTo(-15, -16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = ult.team === 'player' ? '#2563eb' : '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-29, -3);
        ctx.lineTo(-40, -17);
        ctx.lineTo(-24, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(15, -4.5, 10, 4.5);
        ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
        ctx.fillRect(36, -10, 3, 20);
        ctx.restore();
      }
    }

    for (const ord of ult.fallingOrdinance) {
      if (ord.impacted) continue;

      ctx.save();
      if (ord.kind === 'meteor') {
        // Multi-layered roaring fiery comet tail
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = `rgba(234, 88, 12, ${(frac * 0.65).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5 + frac * 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(253, 224, 71, ${(frac * 0.55).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5 + frac * 7, 0, Math.PI * 2);
          ctx.fill();
        }
        // Craggy cel-shaded glowing lava boulder
        ctx.fillStyle = '#3b1708';
        ctx.strokeStyle = '#120804';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(ord.x, ord.y, 14.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(ord.x + 2, ord.y + 3, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(ord.x + 3, ord.y + 4, 4.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (ord.kind === 'fire_arrows') {
        const a = Math.atan2(ord.vy, ord.vx);
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(9, 0);
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(9, 0, 4.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (ord.kind === 'tactical_missiles') {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(ord.targetX, GROUND_Y, 26, 7, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (ord.trail.length > 1) {
          ctx.strokeStyle = 'rgba(241, 245, 249, 0.78)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(ord.trail[0].x, ord.trail[0].y);
          for (const pt of ord.trail) ctx.lineTo(pt.x, pt.y);
          ctx.lineTo(ord.x, ord.y);
          ctx.stroke();
        }

        const a = Math.atan2(ord.vy, ord.vx);
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#121622';
        ctx.lineWidth = 1.8;
        ctx.fillRect(-15, -4, 26, 8);
        ctx.strokeRect(-15, -4, 26, 8);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(11, -4.5);
        ctx.lineTo(20, 0);
        ctx.lineTo(11, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        const a = Math.atan2(ord.vy, ord.vx);
        if (ord.trail.length > 1) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(ord.trail[0].x, ord.trail[0].y);
          for (const pt of ord.trail) ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        }
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#090d14';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(-10, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

export function renderParticles(ctx: CanvasRenderingContext2D, particles: ParticleEntity[]): void {
  for (const p of particles) {
    const frac = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = frac * p.alpha;

    if (p.shape === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.8, 5.5 * frac);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.shape === 'smoke') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.55 - frac * 0.45), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'debris') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? 0);
      const s = p.size;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#121622';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-s, -s * 0.6);
      ctx.lineTo(s * 0.9, -s * 0.8);
      ctx.lineTo(s, s * 0.7);
      ctx.lineTo(-s * 0.6, s * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.shape === 'spark') {
      // Velocity-stretched glowing spark streak
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.6, p.size * 0.65 * frac);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + frac * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function renderPopups(ctx: CanvasRenderingContext2D, popups: DamagePopup[]): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const pop of popups) {
    const frac = Math.max(0, pop.life / pop.maxLife);
    const fontSize = Math.round(14 * pop.scale);
    ctx.globalAlpha = Math.min(1, frac * 1.45);
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.lineWidth = 3.8;
    ctx.strokeStyle = 'rgba(10, 14, 22, 0.92)';
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);
  }

  ctx.restore();
}
