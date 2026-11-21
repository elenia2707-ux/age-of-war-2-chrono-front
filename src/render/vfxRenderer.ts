import type {
  ActiveUltimate,
  BeamEffect,
  DamagePopup,
  ParticleEntity,
  ProjectileEntity,
} from '../data/types';
import { GROUND_Y, WORLD_HEIGHT } from '../game/constants';

export function renderUltimateAtmosphere(
  ctx: CanvasRenderingContext2D,
  ultimates: ActiveUltimate[],
  viewportW: number,
): void {
  if (ultimates.length === 0) return;

  for (const ult of ultimates) {
    const fade = Math.min(1, ult.elapsed * 3) * Math.min(1, Math.max(0, (ult.duration + 0.6 - ult.elapsed) * 1.6));
    let tint = 'rgba(20, 12, 8, 0.22)';
    if (ult.def.kind === 'lightning') tint = 'rgba(10, 20, 42, 0.42)';
    else if (ult.def.kind === 'orbital_laser') tint = 'rgba(6, 22, 36, 0.38)';
    else if (ult.def.kind === 'meteor') tint = 'rgba(56, 18, 6, 0.3)';
    else if (ult.def.kind === 'fire_arrows') tint = 'rgba(42, 14, 8, 0.25)';

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT);
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
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'boulder':
        // Motion smear + rocky boulder
        ctx.strokeStyle = 'rgba(214, 211, 209, 0.35)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = '#78716c';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a8a29e';
        ctx.beginPath();
        ctx.arc(p.x - 2, p.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'arrow':
      case 'fire_arrow':
      case 'bolt':
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.strokeStyle = p.style === 'bolt' ? '#cbd5e1' : '#d97706';
        ctx.lineWidth = p.style === 'bolt' ? 2.4 : 1.8;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(6, -2.5);
        ctx.lineTo(11, 0);
        ctx.lineTo(6, 2.5);
        ctx.closePath();
        ctx.fill();
        if (p.style === 'fire_arrow') {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(7, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'bullet':
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(p.prevX - p.vx * 0.015, p.prevY - p.vy * 0.015);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        break;

      case 'cannonball':
      case 'shell':
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = p.style === 'shell' ? '#d97706' : '#1f2937';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.style === 'shell' ? 5.2 : 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'rocket':
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#475569';
        ctx.fillRect(-9, -2.6, 15, 5.2);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(6, -3);
        ctx.lineTo(12, 0);
        ctx.lineTo(6, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-10, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'plasma': {
        const col = p.team === 'player' ? '#22d3ee' : '#fb7185';
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = col;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(p.prevX - p.vx * 0.018, p.prevY - p.vy * 0.018);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }

      default:
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
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
      ctx.shadowBlur = 16;
      const segments = 9;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      for (let s = 1; s < segments; s++) {
        const t = s / segments;
        const jx = b.x1 + (b.x2 - b.x1) * t + Math.sin(b.seed + s * 7.3) * 24;
        const jy = b.y1 + (b.y2 - b.y1) * t;
        ctx.lineTo(jx, jy);
      }
      ctx.lineTo(b.x2, b.y2);

      ctx.strokeStyle = `rgba(56, 189, 248, ${(ratio * 0.9).toFixed(2)})`;
      ctx.lineWidth = b.width * ratio + 4;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${ratio.toFixed(2)})`;
      ctx.lineWidth = Math.max(2, b.width * 0.35 * ratio);
      ctx.stroke();
    } else if (b.style === 'orbital_laser') {
      const w = b.width * (0.45 + ratio * 0.75);
      // Outer plasma halo
      const grad = ctx.createLinearGradient(b.x1 - w, 0, b.x1 + w, 0);
      grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
      grad.addColorStop(0.3, `rgba(34, 211, 238, ${(ratio * 0.75).toFixed(2)})`);
      grad.addColorStop(0.5, `rgba(255, 255, 255, ${Math.min(1, ratio * 1.2).toFixed(2)})`);
      grad.addColorStop(0.7, `rgba(34, 211, 238, ${(ratio * 0.75).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(b.x1 - w, b.y1, w * 2, b.y2 - b.y1);

      // Ground impact scorch flare
      ctx.fillStyle = `rgba(224, 242, 254, ${(ratio * 0.9).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(b.x2, GROUND_Y, w * 1.35, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.style === 'flame_jet') {
      const grad = ctx.createLinearGradient(b.x1, b.y1, b.x2, b.y2);
      grad.addColorStop(0, `rgba(254, 240, 138, ${(ratio * 0.95).toFixed(2)})`);
      grad.addColorStop(0.45, `rgba(249, 115, 22, ${(ratio * 0.85).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1 - 3);
      ctx.lineTo(b.x2, b.y2 - b.width);
      ctx.lineTo(b.x2, b.y2 + b.width);
      ctx.lineTo(b.x1, b.y1 + 3);
      ctx.closePath();
      ctx.fill();
    } else {
      // Railgun or Ion beam
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = ratio;
      ctx.lineWidth = b.width * ratio + 2;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, b.width * 0.4 * ratio);
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
    // 1. Carpet Bombing WW Twin-Prop Bombers
    if (ult.planes) {
      for (const plane of ult.planes) {
        ctx.save();
        ctx.translate(plane.x, plane.y);
        ctx.scale(plane.dir, 1);
        // Fuselage
        ctx.fillStyle = '#3f473a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 34, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wings
        ctx.fillStyle = '#525c4b';
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.lineTo(12, -2);
        ctx.lineTo(2, -16);
        ctx.lineTo(-14, -14);
        ctx.closePath();
        ctx.fill();
        // Tail fin
        ctx.fillStyle = ult.team === 'player' ? '#2563eb' : '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-26, -3);
        ctx.lineTo(-36, -15);
        ctx.lineTo(-22, -14);
        ctx.closePath();
        ctx.fill();
        // Cockpit & propeller blur
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(14, -4, 9, 4);
        ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
        ctx.fillRect(32, -9, 2.5, 18);
        ctx.restore();
      }
    }

    // 2. Falling Sky Ordinance
    for (const ord of ult.fallingOrdinance) {
      if (ord.impacted) continue;

      ctx.save();
      if (ord.kind === 'meteor') {
        // Fiery meteor trail
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = `rgba(249, 115, 22, ${(frac * 0.65).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4 + frac * 11, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(ord.x, ord.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(ord.x + 2, ord.y + 2, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (ord.kind === 'fire_arrows') {
        const a = Math.atan2(ord.vy, ord.vx);
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(8, 0, 3.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (ord.kind === 'tactical_missiles') {
        // Target lock reticle on ground
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.78)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(ord.targetX, GROUND_Y, 22, 6, 0, 0, Math.PI * 2);
        ctx.stroke();

        // White contrail
        if (ord.trail.length > 1) {
          ctx.strokeStyle = 'rgba(241, 245, 249, 0.7)';
          ctx.lineWidth = 5;
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
        ctx.fillRect(-14, -3.5, 24, 7);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(10, -4);
        ctx.lineTo(18, 0);
        ctx.lineTo(10, 4);
        ctx.closePath();
        ctx.fill();
      } else {
        // Naval shells & aerial bombs
        const a = Math.atan2(ord.vy, ord.vx);
        if (ord.trail.length > 1) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(ord.trail[0].x, ord.trail[0].y);
          for (const pt of ord.trail) ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        }
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(-9, 0, 3.8, 0, Math.PI * 2);
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
      ctx.lineWidth = Math.max(1.5, 4.5 * frac);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.shape === 'smoke') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.4 - frac * 0.4), 0, Math.PI * 2);
      ctx.fill();
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
    const fontSize = Math.round(13 * pop.scale);
    ctx.globalAlpha = Math.min(1, frac * 1.4);
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = 'rgba(10, 14, 22, 0.85)';
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);
  }

  ctx.restore();
}
