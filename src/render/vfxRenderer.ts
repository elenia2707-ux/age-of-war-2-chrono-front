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

/**
 * Dramatic per-era sky atmosphere & centerpiece celestial/tactical spectacles for all 12 Ultimates!
 * Zero screen shake, zero ctx.shadowBlur (60fps smooth on iPhone WebKit).
 */
export function renderUltimateAtmosphere(
  ctx: CanvasRenderingContext2D,
  ultimates: ActiveUltimate[],
  viewportW: number,
): void {
  if (ultimates.length === 0) return;

  for (const ult of ultimates) {
    const fade =
      Math.min(1, ult.elapsed * 3.4) *
      Math.min(1, Math.max(0, (ult.duration + 0.65 - ult.elapsed) * 1.55));
    if (fade <= 0.01) continue;

    const kind = ult.def.kind;
    const t = ult.elapsed;
    const cx = viewportW * 0.5;

    let topTint = 'rgba(20, 12, 8, 0.34)';
    let botTint = 'rgba(20, 12, 8, 0.08)';
    if (kind === 'meteor') {
      topTint = 'rgba(84, 20, 6, 0.48)';
      botTint = 'rgba(180, 56, 12, 0.16)';
    } else if (kind === 'solar_wrath') {
      topTint = 'rgba(120, 68, 8, 0.42)';
      botTint = 'rgba(250, 204, 21, 0.14)';
    } else if (kind === 'lightning') {
      topTint = 'rgba(8, 22, 54, 0.58)';
      botTint = 'rgba(30, 64, 118, 0.16)';
    } else if (kind === 'dragon_barrage') {
      topTint = 'rgba(92, 12, 22, 0.46)';
      botTint = 'rgba(220, 38, 38, 0.12)';
    } else if (kind === 'fire_arrows') {
      topTint = 'rgba(64, 18, 10, 0.38)';
      botTint = 'rgba(194, 65, 12, 0.12)';
    } else if (kind === 'naval_barrage') {
      topTint = 'rgba(20, 34, 52, 0.42)';
      botTint = 'rgba(120, 53, 15, 0.14)';
    } else if (kind === 'zeppelin_raid') {
      topTint = 'rgba(54, 34, 14, 0.44)';
      botTint = 'rgba(146, 64, 14, 0.14)';
    } else if (kind === 'carpet_bomb') {
      topTint = 'rgba(16, 24, 42, 0.50)';
      botTint = 'rgba(71, 85, 105, 0.14)';
    } else if (kind === 'tactical_missiles') {
      topTint = 'rgba(12, 22, 38, 0.40)';
      botTint = 'rgba(244, 63, 94, 0.10)';
    } else if (kind === 'orbital_laser') {
      topTint = 'rgba(6, 26, 48, 0.50)';
      botTint = 'rgba(34, 211, 238, 0.14)';
    } else if (kind === 'black_hole') {
      topTint = 'rgba(28, 6, 56, 0.60)';
      botTint = 'rgba(88, 28, 135, 0.18)';
    } else if (kind === 'chrono_nova') {
      topTint = 'rgba(6, 48, 56, 0.52)';
      botTint = 'rgba(250, 204, 21, 0.16)';
    }

    ctx.save();
    ctx.globalAlpha = fade;

    // 1. Dramatic sky-to-ground atmospheric wash (zero per-frame gradient allocation!)
    ctx.fillStyle = topTint;
    ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT * 0.42);
    ctx.fillStyle = botTint;
    ctx.fillRect(0, WORLD_HEIGHT * 0.34, viewportW, WORLD_HEIGHT * 0.48);

    // 2. Signature sky centerpiece per Ultimate!
    if (kind === 'meteor') {
      // High-altitude burning entry streaks slashing diagonally across the dusk sky
      const dir = ult.team === 'player' ? 1 : -1;
      for (let i = 0; i < 6; i++) {
        const phase = (t * 0.9 + i * 0.23) % 1;
        const sx = ((i * 197 + ult.uid * 43) % Math.max(400, viewportW)) - dir * 80 + dir * phase * 140;
        const sy = 14 + (i % 3) * 26 + phase * 65;
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(251, 146, 60, 0.45)' : 'rgba(254, 240, 138, 0.42)';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx - dir * 56, sy - 34);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
    } else if (kind === 'solar_wrath') {
      // Radiant descending Golden Sun Disk / Eye of Ra Mandala with rotating sunburst rays
      const sy = 104;
      ctx.save();
      ctx.translate(cx, sy);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.14)';
      ctx.beginPath();
      ctx.arc(0, 0, 156, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(251, 191, 36, 0.30)';
      ctx.beginPath();
      ctx.arc(0, 0, 102, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(254, 240, 138, 0.56)';
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 251, 235, 0.85)';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();

      // Rotating golden sun rays
      ctx.rotate(t * 0.45);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
      for (let r = 0; r < 12; r++) {
        const a = (r / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.06) * 28, Math.sin(a - 0.06) * 28);
        ctx.lineTo(Math.cos(a) * 148, Math.sin(a) * 148);
        ctx.lineTo(Math.cos(a + 0.06) * 28, Math.sin(a + 0.06) * 28);
        ctx.closePath();
        ctx.fill();
      }

      // Concentric sacred solar rings
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.68)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.58)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (kind === 'lightning') {
      // Rolling Olympian thunderhead clouds across top edge + sheet lightning pulses
      const flash = Math.max(0, Math.sin(t * 17.5 + ult.uid) * Math.sin(t * 7.3));
      if (flash > 0.35) {
        ctx.fillStyle = `rgba(186, 230, 253, ${((flash - 0.35) * 0.34).toFixed(3)})`;
        ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT * 0.72);
      }
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      for (let x = -40; x < viewportW + 80; x += 88) {
        const bob = Math.sin(t * 2.2 + x * 0.03) * 4;
        ctx.beginPath();
        ctx.arc(x, 18 + bob, 44, 0, Math.PI * 2);
        ctx.arc(x + 36, 12 - bob, 36, 0, Math.PI * 2);
        ctx.fill();
      }
      // Subtle cyan underside rim on storm clouds
      ctx.strokeStyle = `rgba(125, 211, 252, ${(0.24 + flash * 0.35).toFixed(2)})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let x = -40; x < viewportW + 80; x += 88) {
        const bob = Math.sin(t * 2.2 + x * 0.03) * 4;
        ctx.moveTo(x - 32, 46 + bob);
        ctx.quadraticCurveTo(x + 12, 62 + bob, x + 52, 44 - bob);
      }
      ctx.stroke();
    } else if (kind === 'dragon_barrage') {
      // Sweeping golden-crimson Imperial Dragon spirit ribbons undulating across upper sky
      ctx.save();
      for (let r = 0; r < 2; r++) {
        ctx.strokeStyle = r === 0 ? 'rgba(250, 204, 21, 0.38)' : 'rgba(239, 68, 68, 0.34)';
        ctx.lineWidth = r === 0 ? 7 : 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let x = 0; x <= viewportW; x += 28) {
          const y = 78 + r * 20 + Math.sin(x * 0.015 - t * 4.5 + r * 1.4) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if (kind === 'fire_arrows') {
      // Distant silhouetted flaming arrow arcs streaming across the dusk backdrop
      const dir = ult.team === 'player' ? 1 : -1;
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.36)';
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 10; i++) {
        const phase = (t * 1.4 + i * 0.14) % 1;
        const bx = ((i * 107 + 60) % Math.max(360, viewportW)) + dir * (phase - 0.5) * 90;
        const by = 22 + phase * 120;
        ctx.beginPath();
        ctx.moveTo(bx - dir * 24, by - 16);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    } else if (kind === 'naval_barrage') {
      // Distant sea-horizon broadside cannon muzzle flashes blooming periodically
      const pulse = 0.5 + 0.5 * Math.sin(t * 11 + ult.uid);
      for (let i = 0; i < 4; i++) {
        const fx = viewportW * (0.14 + i * 0.24);
        const fPulse = Math.max(0, Math.sin(t * 9.5 + i * 1.9));
        if (fPulse < 0.2) continue;
        ctx.fillStyle = `rgba(249, 115, 22, ${(0.28 * fPulse).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(fx, GROUND_Y - 115, 52 * fPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(254, 240, 138, ${(0.55 * fPulse).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(fx, GROUND_Y - 115, 24 * fPulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(148, 163, 184, ${(0.12 + pulse * 0.06).toFixed(2)})`;
      ctx.fillRect(0, GROUND_Y - 125, viewportW, 38);
    } else if (kind === 'zeppelin_raid' || kind === 'carpet_bomb') {
      // Dramatic sweeping wartime / steampunk searchlight cones crisscrossing the sky!
      const isZepp = kind === 'zeppelin_raid';
      const beamCol = isZepp ? 'rgba(253, 224, 71, 0.14)' : 'rgba(186, 230, 253, 0.15)';
      for (let s = 0; s < 3; s++) {
        const baseX = viewportW * (0.18 + s * 0.32);
        const sway = Math.sin(t * (1.7 + s * 0.35) + s * 2.1) * 150;
        ctx.fillStyle = beamCol;
        ctx.beginPath();
        ctx.moveTo(baseX - 10, GROUND_Y);
        ctx.lineTo(baseX + sway - 46, 0);
        ctx.lineTo(baseX + sway + 46, 0);
        ctx.lineTo(baseX + 10, GROUND_Y);
        ctx.closePath();
        ctx.fill();
      }
      if (!isZepp) {
        // Distant AA flak smoke bursts popping in the upper sky
        for (let k = 0; k < 5; k++) {
          const cycle = (t * 1.1 + k * 0.37) % 1;
          const fx = viewportW * (0.15 + ((k * 0.21) % 0.72));
          const fy = 58 + (k % 3) * 28;
          ctx.fillStyle = `rgba(51, 65, 85, ${((1 - cycle) * 0.45).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(fx, fy, 7 + cycle * 14, 0, Math.PI * 2);
          ctx.fill();
          if (cycle < 0.18) {
            ctx.fillStyle = 'rgba(254, 240, 138, 0.75)';
            ctx.beginPath();
            ctx.arc(fx, fy, 7 * (1 - cycle * 4), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else if (kind === 'tactical_missiles') {
      // Sleek military satellite-lock HUD scanline + corner lock brackets
      const scanY = ((t * 140) % (GROUND_Y - 20)) + 10;
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(viewportW, scanY);
      ctx.stroke();

      // Subtle tactical corner frame brackets
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.45)';
      ctx.lineWidth = 2.4;
      const m = 18;
      const b = 22;
      ctx.beginPath();
      ctx.moveTo(m, m + b);
      ctx.lineTo(m, m);
      ctx.lineTo(m + b, m);
      ctx.moveTo(viewportW - m - b, m);
      ctx.lineTo(viewportW - m, m);
      ctx.lineTo(viewportW - m, m + b);
      ctx.stroke();
    } else if (kind === 'orbital_laser') {
      // Colossal Space-Station Orbital Emitter Ring hovering cleanly in upper sky
      ctx.save();
      ctx.translate(cx, 62);
      const pulse = 0.78 + Math.sin(t * 10) * 0.22;
      ctx.fillStyle = `rgba(6, 182, 212, ${(0.20 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 175, 62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(103, 232, 249, ${(0.42 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 108, 34, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(103, 232, 249, 0.72)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 132, 24, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -t * 60;
      ctx.beginPath();
      ctx.ellipse(0, 0, 96, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    } else if (kind === 'black_hole') {
      // Cosmic void star-streaks pulling radially inward toward an open-sky singularity rift!
      const rx = cx;
      const ry = 118;
      ctx.fillStyle = 'rgba(88, 28, 135, 0.16)';
      ctx.beginPath();
      ctx.arc(rx, ry, 182, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(147, 51, 234, 0.34)';
      ctx.beginPath();
      ctx.arc(rx, ry, 106, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(5, 2, 13, 0.78)';
      ctx.beginPath();
      ctx.arc(rx, ry, 42, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(233, 213, 255, 0.48)';
      ctx.lineWidth = 1.7;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + t * 0.35;
        const pull = 1 - ((t * 0.9 + i * 0.17) % 1);
        const r1 = 26 + pull * 165;
        const r2 = Math.max(18, r1 - 24);
        ctx.beginPath();
        ctx.moveTo(rx + Math.cos(a) * r1, ry + Math.sin(a) * r1 * 0.52);
        ctx.lineTo(rx + Math.cos(a + 0.12) * r2, ry + Math.sin(a + 0.12) * r2 * 0.52);
        ctx.stroke();
      }
    } else if (kind === 'chrono_nova') {
      // Giant Celestial Astral Chrono-Clock Mandala positioned cleanly in the open sky band!
      ctx.save();
      ctx.translate(cx, 122);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
      ctx.beginPath();
      ctx.arc(0, 0, 168, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(45, 212, 191, 0.24)';
      ctx.beginPath();
      ctx.arc(0, 0, 108, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(254, 249, 195, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, Math.PI * 2);
      ctx.fill();

      // Outer golden clock dial & 12 hour markers
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.72)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, 74, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.64)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, Math.PI * 2);
      ctx.stroke();

      for (let h = 0; h < 12; h++) {
        const a = (h / 12) * Math.PI * 2 + t * 0.15;
        ctx.strokeStyle = h % 3 === 0 ? 'rgba(254, 240, 138, 0.88)' : 'rgba(94, 234, 212, 0.64)';
        ctx.lineWidth = h % 3 === 0 ? 2.8 : 1.6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 60, Math.sin(a) * 60);
        ctx.lineTo(Math.cos(a) * 72, Math.sin(a) * 72);
        ctx.stroke();
      }

      // Sweeping golden Chrono hands (fast minute hand + slow hour hand)
      const hand1 = t * 2.8 - Math.PI / 2;
      const hand2 = -t * 0.9 - Math.PI / 4;
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(hand1) * 52, Math.sin(hand1) * 52);
      ctx.stroke();
      ctx.strokeStyle = '#5eead4';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(hand2) * 36, Math.sin(hand2) * 36);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}

/** Smooth cartoon oval crater scorch marks + radial fissure cracks + cooling molten ember glow on road */
export function renderScorchMarks(
  ctx: CanvasRenderingContext2D,
  scorches: ScorchMark[],
  viewMinX = -Infinity,
  viewMaxX = Infinity,
): void {
  for (const s of scorches) {
    if (s.x + s.radius * 1.4 < viewMinX || s.x - s.radius * 1.4 > viewMaxX) continue;
    const lifeFrac = Math.max(0, s.life / s.maxLife);
    const alpha = Math.min(1, lifeFrac * 2.4);
    const rx = Math.max(15, s.radius * 1.02);
    const ry = Math.max(4.8, s.radius * 0.17);

    ctx.save();
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = '#0c0e14';
    ctx.beginPath();
    ctx.ellipse(s.x, GROUND_Y + 3, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jagged radial ground fissure cracks radiating from larger impact craters
    if (rx >= 24) {
      ctx.globalAlpha = alpha * 0.52;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let c = 0; c < 6; c++) {
        const a = (c / 6) * Math.PI * 2 + (s.x % 1.3);
        const x0 = s.x + Math.cos(a) * rx * 0.55;
        const y0 = GROUND_Y + 3 + Math.sin(a) * ry * 0.55;
        const x1 = s.x + Math.cos(a) * rx * 1.24;
        const y1 = GROUND_Y + 3 + Math.sin(a) * ry * 1.22;
        ctx.moveTo(x0, y0);
        ctx.lineTo((x0 + x1) * 0.5 + Math.sin(c * 4) * 3, (y0 + y1) * 0.5);
        ctx.lineTo(x1, y1);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = alpha * 0.76;
    ctx.fillStyle = '#1f1916';
    ctx.beginPath();
    ctx.ellipse(s.x, GROUND_Y + 3, rx * 0.66, ry * 0.66, 0, 0, Math.PI * 2);
    ctx.fill();

    const heat = Math.max(0, (lifeFrac - 0.48) / 0.52);
    if (heat > 0.02) {
      ctx.globalAlpha = heat * 0.85;
      ctx.fillStyle = s.glowColor;
      ctx.beginPath();
      ctx.ellipse(s.x, GROUND_Y + 3, rx * 0.4, ry * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = heat * 0.72;
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.ellipse(s.x, GROUND_Y + 3, rx * 0.18, ry * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/** Weapon-distinct anime/cartoon glossy crescent slashes, twin ribbons, seismic smashes & Mach spear thrusts */
export function renderSlashes(
  ctx: CanvasRenderingContext2D,
  slashes: SlashEffect[],
  viewMinX = -Infinity,
  viewMaxX = Infinity,
): void {
  for (const sl of slashes) {
    if (sl.x + sl.radius * 2 < viewMinX || sl.x - sl.radius * 2 > viewMaxX) continue;
    const frac = Math.max(0, sl.life / sl.maxLife);
    const prog = 1 - frac;

    ctx.save();
    ctx.translate(sl.x, sl.y);
    ctx.scale(sl.dir, 1);
    ctx.globalAlpha = Math.min(1, frac * 1.85);

    if (sl.style === 'thrust') {
      // Triple-ring sonic Mach-cone lance thrust + piercing speed lines!
      const len = sl.radius * (0.95 + prog * 0.78);
      const h = Math.max(3, 10.5 * frac);

      // Wide outer energy aura cone
      ctx.save();
      ctx.globalAlpha *= 0.42;
      ctx.beginPath();
      ctx.moveTo(-8, -h * 1.55);
      ctx.lineTo(len + 14, 0);
      ctx.lineTo(-8, h * 1.55);
      ctx.closePath();
      ctx.fillStyle = sl.color;
      ctx.fill();
      ctx.restore();

      // Main piercing spear wake
      ctx.beginPath();
      ctx.moveTo(-4, -h);
      ctx.lineTo(len + 10, 0);
      ctx.lineTo(-4, h);
      ctx.closePath();
      ctx.fillStyle = sl.color;
      ctx.fill();

      // Razor white core needle
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.45);
      ctx.lineTo(len + 9, 0);
      ctx.lineTo(0, h * 0.45);
      ctx.closePath();
      ctx.fillStyle = sl.coreColor;
      ctx.fill();

      // Dual nested sonic Mach shock rings around thrust shaft
      for (let r = 0; r < 2; r++) {
        const rx = 3.5 + prog * (4.5 - r * 1.2);
        const ry = (9 + r * 5) + prog * (15 - r * 3);
        ctx.strokeStyle = r === 0 ? '#ffffff' : sl.color;
        ctx.lineWidth = (2.4 - r * 0.7) * frac + 0.7;
        ctx.beginPath();
        ctx.ellipse(len * (0.34 + r * 0.28), 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Parallel wind speed streaks flanking tip
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(len * 0.15, -h - 4);
      ctx.lineTo(len * 0.85, -h * 0.4 - 2);
      ctx.moveTo(len * 0.15, h + 4);
      ctx.lineTo(len * 0.85, h * 0.4 + 2);
      ctx.stroke();
    } else {
      // Razor-tapered anime/Flash crescent blade with weapon-specific flourish!
      const rOuter = sl.radius * (0.94 + prog * 0.34);
      const maxThick =
        (sl.style === 'heavy' ? 18 : sl.style === 'plasma' ? 15 : 12) * (0.52 + frac * 0.58);
      const startA = -1.56 + prog * 0.46 + sl.angleOffset;
      const endA = 1.4 + sl.angleOffset;
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
          const taper = Math.sin(t * Math.PI) * (0.65 + t * 0.5);
          const rIn = Math.max(3, rOut - thick * taper);
          ctx.lineTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
        }
        ctx.closePath();
      };

      // Soft wide glowing outer energy aura
      ctx.save();
      ctx.globalAlpha *= 0.46;
      buildTaperedCrescent(rOuter + 4.5, maxThick * 1.5, startA - 0.08, endA + 0.06);
      ctx.fillStyle = sl.color;
      ctx.fill();
      ctx.restore();

      // Secondary trailing ghost ribbon for sleek blade & heavy swings
      if (sl.style === 'blade' || sl.style === 'heavy') {
        ctx.save();
        ctx.globalAlpha *= 0.52;
        buildTaperedCrescent(rOuter - 6.5, maxThick * 0.55, startA - 0.16, endA - 0.18);
        ctx.fillStyle = sl.coreColor;
        ctx.fill();
        ctx.restore();
      }

      // Main vibrant cel-colored crescent
      buildTaperedCrescent(rOuter, maxThick, startA, endA);
      ctx.fillStyle = sl.color;
      ctx.fill();

      // Razor-bright white-hot cutting edge core
      buildTaperedCrescent(rOuter - 0.8, maxThick * 0.52, startA + 0.12, endA - 0.02);
      ctx.fillStyle = sl.coreColor;
      ctx.fill();

      // Weapon-class extra impact signatures
      if (sl.style === 'plasma') {
        // Crackling energy zig-zag arcing along the plasma slash!
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0 * frac + 0.6;
        ctx.beginPath();
        for (let i = 0; i <= 7; i++) {
          const t = i / 7;
          const a = startA + (endA - startA) * t;
          const rr = rOuter - maxThick * 0.3 + (i % 2 === 0 ? 4.5 : -4.5);
          if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
          else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.stroke();
      } else if (sl.style === 'heavy') {
        // Bold seismic wind-pressure streaks fanning radially off the heavy slam arc!
        ctx.strokeStyle = sl.coreColor;
        ctx.lineWidth = 2.2 * frac + 0.6;
        ctx.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          const ka = startA + (endA - startA) * (0.35 + k * 0.26);
          const r0 = rOuter + 2;
          const r1 = rOuter + 12 + prog * 10;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ka) * r0, Math.sin(ka) * r0);
          ctx.lineTo(Math.cos(ka) * r1, Math.sin(ka) * r1);
          ctx.stroke();
        }
      }

      // Trailing spark flecks spinning off outer arc
      for (let k = 0; k < 4; k++) {
        const ka = startA + (endA - startA) * (0.2 + k * 0.22);
        const kr = rOuter + 4 + k * 2.4 + prog * 8;
        ctx.fillStyle = k >= 2 ? '#ffffff' : sl.coreColor;
        ctx.beginPath();
        ctx.arc(Math.cos(ka) * kr, Math.sin(ka) * kr, Math.max(1.3, 2.8 * frac), 0, Math.PI * 2);
        ctx.fill();
      }

      // Crisp 4-point anime star glint at leading blade tip
      if (frac > 0.24) {
        const tx = Math.cos(endA - 0.05) * (rOuter - 1.5);
        const ty = Math.sin(endA - 0.05) * (rOuter - 1.5);
        const g = 13.5 * frac;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(tx - g, ty);
        ctx.lineTo(tx, ty - g * 0.24);
        ctx.lineTo(tx + g, ty);
        ctx.lineTo(tx, ty + g * 0.24);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(tx, ty - g);
        ctx.lineTo(tx + g * 0.24, ty);
        ctx.lineTo(tx, ty + g);
        ctx.lineTo(tx - g * 0.24, ty);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

/** Bold-ink cel-shaded cartoon projectiles with dual-layer tapered glowing motion trails (zero gradient alloc!) */
export function renderProjectiles(
  ctx: CanvasRenderingContext2D,
  projectiles: ProjectileEntity[],
  viewMinX = -Infinity,
  viewMaxX = Infinity,
): void {
  for (const p of projectiles) {
    if (p.x + 60 < viewMinX || p.x - 60 > viewMaxX) continue;
    const angle = Math.atan2(p.vy, p.vx);
    const pal = getTeamPalette(p.team);

    ctx.save();
    // Dual-layer sleek tapered motion trail (zero per-projectile createLinearGradient!)
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > 40) {
      const tailLen = Math.min(44, speed * 0.062);
      const tx = p.x - (p.vx / speed) * tailLen;
      const ty = p.y - (p.vy / speed) * tailLen;
      const mx = (tx + p.x) * 0.5;
      const my = (ty + p.y) * 0.5;
      const trailCol =
        p.style === 'quantum_orb'
          ? 'rgba(45, 212, 191, 0.72)'
          : p.style === 'plasma'
            ? pal.glowSoft
            : p.style === 'antimatter'
              ? 'rgba(192, 132, 252, 0.68)'
              : p.style === 'dragon_rocket'
                ? 'rgba(239, 68, 68, 0.72)'
                : p.style === 'solar_orb' || p.style === 'totem_fire' || p.style === 'fire_arrow' || p.style === 'rocket'
                  ? 'rgba(249, 115, 22, 0.68)'
                  : p.style === 'bullet'
                    ? 'rgba(254, 240, 138, 0.75)'
                    : 'rgba(226, 232, 240, 0.42)';
      const outerW = p.style === 'boulder' || p.style === 'cannonball' ? 7.5 : p.style === 'plasma' || p.style === 'quantum_orb' ? 6.5 : 4.2;

      ctx.lineCap = 'round';
      ctx.strokeStyle = trailCol;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = outerW * 0.68;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(mx, my);
      ctx.stroke();

      ctx.globalAlpha = 0.92;
      ctx.lineWidth = outerW;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Bright white-hot core streak for energetic / high-velocity projectiles
      if (
        p.style === 'bullet' ||
        p.style === 'plasma' ||
        p.style === 'quantum_orb' ||
        p.style === 'antimatter' ||
        p.style === 'solar_orb' ||
        p.style === 'dragon_rocket' ||
        p.style === 'rocket' ||
        p.style === 'fire_arrow'
      ) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = Math.max(1.5, outerW * 0.36);
        ctx.beginPath();
        ctx.moveTo((mx + p.x) * 0.5, (my + p.y) * 0.5);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
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
        drawCelEllipse(ctx, 0, 0, 10, 8.6, '#78716c', { highlight: '#d6d3d1', shadow: '#44403c', lineWidth: 2.1 });
        break;
      case 'totem_fire':
        drawEnergyOrb(ctx, 0, 0, 6.8, '#f97316', '#fef08a');
        break;
      case 'solar_orb':
        ctx.rotate(spin);
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 4.5, 0.25, 0, Math.PI * 2);
        ctx.stroke();
        drawEnergyOrb(ctx, 0, 0, 7.6, '#f59e0b', '#ffffff');
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
          drawEnergyOrb(ctx, 10, 0, 5.2, '#f97316', '#fef08a');
        }
        break;
      }
      case 'dragon_rocket': {
        ctx.rotate(angle);
        drawEnergyOrb(ctx, -12, 0, 5.8, '#f97316', '#fef08a');
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
        drawCelRoundRect(ctx, -6.5, -2.3, 13, 4.6, 2, '#facc15', { highlight: '#ffffff', lineWidth: 1.4 });
        break;
      }
      case 'grenade': {
        ctx.rotate(spin);
        drawCelEllipse(ctx, 0, 0, 6.4, 6.4, '#1e293b', { highlight: '#64748b', lineWidth: 1.8 });
        drawEnergyOrb(ctx, 4.5, -5.5, 3.5, '#f97316', '#fef08a');
        break;
      }
      case 'cannonball': {
        drawCelEllipse(ctx, 0, 0, 7.6, 7.6, '#1e293b', { highlight: '#94a3b8', shadow: '#090d16', lineWidth: 2.0 });
        ctx.fillStyle = 'rgba(251, 146, 60, 0.72)';
        ctx.beginPath();
        ctx.arc(3.5, -2.5, 2.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'mortar_shell':
      case 'shell': {
        ctx.rotate(angle);
        drawCelEllipse(ctx, 0, 0, 9.5, 5.0, '#475569', { highlight: '#cbd5e1', lineWidth: 1.8 });
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
        drawEnergyOrb(ctx, -12, 0, 5.8, '#f97316', '#fef08a');
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
        drawCelRoundRect(ctx, -10, -3.8, 20, 7.6, 3.8, pal.glow, {
          highlight: '#ffffff',
          lineWidth: 1.5,
          ink: pal.dark,
        });
        break;
      }
      case 'antimatter': {
        ctx.rotate(spin);
        ctx.strokeStyle = 'rgba(233, 213, 255, 0.78)';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10.5, 4.2, -0.4, 0, Math.PI * 2);
        ctx.stroke();
        drawEnergyOrb(ctx, 0, 0, 8.2, '#a855f7', '#fef08a');
        ctx.fillStyle = '#09071a';
        ctx.beginPath();
        ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'quantum_orb': {
        ctx.rotate(spin);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10.5, 4.2, 0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#5eead4';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10.5, 4.2, -0.85, 0, Math.PI * 2);
        ctx.stroke();
        drawEnergyOrb(ctx, 0, 0, 7.8, '#2dd4bf', '#fef9c3');
        break;
      }
      default: {
        drawEnergyOrb(ctx, 0, 0, 5.4, '#fde047', '#ffffff');
      }
    }

    ctx.restore();
  }
}

/** High-craft forked lightning, Tesla arcs, Solar Wrath, Orbital Laser, Black Hole Vortex, Flames & Mach Railgun beams */
export function renderBeams(
  ctx: CanvasRenderingContext2D,
  beams: BeamEffect[],
  viewMinX = -Infinity,
  viewMaxX = Infinity,
): void {
  for (const b of beams) {
    if (Math.max(b.x1, b.x2) + 120 < viewMinX || Math.min(b.x1, b.x2) - 120 > viewMaxX) continue;
    const ratio = Math.max(0, b.life / b.maxLife);
    const prog = 1 - ratio;
    ctx.save();

    if (b.style === 'lightning' || b.style === 'tesla_arc') {
      const isHorizontal = b.style === 'tesla_arc';
      const segments = isHorizontal ? 9 : 14;
      const pts: [number, number][] = [[b.x1, b.y1]];
      for (let s = 1; s < segments; s++) {
        const t = s / segments;
        const jitter = Math.sin(b.seed + s * 7.3) * (isHorizontal ? 16 : 28);
        pts.push([
          b.x1 + (b.x2 - b.x1) * t + (isHorizontal ? 0 : jitter),
          b.y1 + (b.y2 - b.y1) * t + (isHorizontal ? jitter : 0),
        ]);
      }
      pts.push([b.x2, b.y2]);

      const strokePath = (pathPts: [number, number][], width: number, style: string) => {
        ctx.strokeStyle = style;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pathPts[0][0], pathPts[0][1]);
        for (let i = 1; i < pathPts.length; i++) ctx.lineTo(pathPts[i][0], pathPts[i][1]);
        ctx.stroke();
      };

      // Main jagged thunderbolt (wide outer bloom + vibrant cyan + white-hot core)
      strokePath(pts, b.width * ratio + 14, `rgba(56, 189, 248, ${(ratio * 0.34).toFixed(2)})`);
      strokePath(pts, b.width * ratio + 5, `rgba(125, 211, 252, ${(ratio * 0.94).toFixed(2)})`);
      strokePath(pts, Math.max(2.2, b.width * 0.48 * ratio), `rgba(255, 255, 255, ${ratio.toFixed(2)})`);

      // Forked secondary lightning branches splitting dramatically off the main bolt!
      const branchCount = isHorizontal ? 2 : 3;
      for (let br = 0; br < branchCount; br++) {
        const anchorIdx = Math.min(pts.length - 3, Math.max(2, Math.floor(((br + 1) / (branchCount + 1)) * pts.length)));
        const [ax, ay] = pts[anchorIdx];
        const side = br % 2 === 0 ? 1 : -1;
        const branchPts: [number, number][] = [[ax, ay]];
        let bx = ax;
        let by = ay;
        const stepLen = isHorizontal ? 16 : 26;
        for (let k = 1; k <= 3; k++) {
          if (isHorizontal) {
            bx += (b.x2 >= b.x1 ? 1 : -1) * stepLen;
            by += side * (12 + Math.sin(b.seed + k * 5 + br) * 8);
          } else {
            bx += side * (18 + Math.cos(b.seed + k * 4.3 + br) * 14);
            by += stepLen * (0.9 + k * 0.15);
          }
          branchPts.push([bx, by]);
        }
        strokePath(branchPts, Math.max(2.5, b.width * 0.45 * ratio), `rgba(56, 189, 248, ${(ratio * 0.72).toFixed(2)})`);
        strokePath(branchPts, Math.max(1.2, b.width * 0.2 * ratio), `rgba(255, 255, 255, ${(ratio * 0.9).toFixed(2)})`);
      }

      // Ground / target electric discharge crown!
      if (!isHorizontal) {
        const crownR = 22 + prog * 28;
        ctx.fillStyle = `rgba(186, 230, 253, ${(ratio * 0.75).toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(b.x2, b.y2, crownR * 1.15, crownR * 0.34, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 255, ${(ratio * 0.95).toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(b.x2, b.y2, crownR * 0.6, crownR * 0.2, 0, Math.PI, Math.PI * 2);
        ctx.fill();
      } else {
        drawEnergyOrb(ctx, b.x2, b.y2, 7.5 * ratio + 2, '#38bdf8', '#ffffff');
      }
    } else if (b.style === 'orbital_laser' || b.style === 'solar_beam' || b.style === 'chrono_nova_pillar') {
      const isSolar = b.style === 'solar_beam';
      const isChronoNova = b.style === 'chrono_nova_pillar';
      const pulse = 0.92 + Math.sin(prog * 26 + b.seed) * 0.1;
      const w = Math.max(12, b.width * (0.54 + ratio * 0.8) * pulse);
      const h = b.y2 - b.y1;

      // Zero-allocation layered cel energy column (outer wash -> vibrant core -> incandescent center)
      ctx.fillStyle = isChronoNova
        ? `rgba(45, 212, 191, ${(ratio * 0.26).toFixed(2)})`
        : isSolar
          ? `rgba(245, 158, 11, ${(ratio * 0.26).toFixed(2)})`
          : `rgba(6, 182, 212, ${(ratio * 0.26).toFixed(2)})`;
      ctx.fillRect(b.x1 - w * 1.95, b.y1, w * 3.9, h);

      ctx.fillStyle = isChronoNova
        ? `rgba(45, 212, 191, ${(ratio * 0.52).toFixed(2)})`
        : isSolar
          ? `rgba(251, 191, 36, ${(ratio * 0.52).toFixed(2)})`
          : `rgba(56, 189, 248, ${(ratio * 0.52).toFixed(2)})`;
      ctx.fillRect(b.x1 - w * 1.15, b.y1, w * 2.3, h);

      ctx.fillStyle = isChronoNova
        ? `rgba(254, 240, 138, ${(ratio * 0.84).toFixed(2)})`
        : isSolar
          ? `rgba(254, 240, 138, ${(ratio * 0.82).toFixed(2)})`
          : `rgba(186, 230, 253, ${(ratio * 0.82).toFixed(2)})`;
      ctx.fillRect(b.x1 - w * 0.68, b.y1, w * 1.36, h);

      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, ratio * 1.2).toFixed(2)})`;
      ctx.fillRect(b.x1 - w * 0.3, b.y1, w * 0.6, h);

      // Spiraling plasma / time-helix ribbons coiling down the beam column!
      const helixCount = isChronoNova ? 2 : 1;
      for (let hx = 0; hx < helixCount; hx++) {
        ctx.strokeStyle =
          isChronoNova
            ? hx === 0
              ? `rgba(250, 204, 21, ${(ratio * 0.92).toFixed(2)})`
              : `rgba(94, 234, 212, ${(ratio * 0.92).toFixed(2)})`
            : isSolar
              ? `rgba(254, 240, 138, ${(ratio * 0.85).toFixed(2)})`
              : `rgba(165, 243, 252, ${(ratio * 0.85).toFixed(2)})`;
        ctx.lineWidth = isChronoNova ? 3.2 : 2.6;
        ctx.beginPath();
        const segs = 18;
        for (let s = 0; s <= segs; s++) {
          const st = s / segs;
          const yy = b.y1 + h * st;
          const phase = st * Math.PI * 5 - prog * 14 + hx * Math.PI + b.seed;
          const xx = b.x1 + Math.sin(phase) * (w * 0.95);
          if (s === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }

      // Signature orbiting halo rings descending / ascending around the column!
      const ringCount = isChronoNova ? 4 : 3;
      for (let ri = 0; ri < ringCount; ri++) {
        const ringDir = isChronoNova ? -1 : 1;
        const ry = GROUND_Y - 34 - ri * 86 + ringDir * prog * 55;
        if (ry < 10 || ry > GROUND_Y - 8) continue;
        const ringW = w * (1.42 - ri * 0.14);
        const ringH = w * 0.3;
        ctx.strokeStyle = isChronoNova
          ? ri % 2 === 0
            ? `rgba(250, 204, 21, ${(ratio * 0.94).toFixed(2)})`
            : `rgba(94, 234, 212, ${(ratio * 0.9).toFixed(2)})`
          : isSolar
            ? `rgba(254, 240, 138, ${(ratio * 0.9).toFixed(2)})`
            : `rgba(103, 232, 249, ${(ratio * 0.9).toFixed(2)})`;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.ellipse(b.x1, ry, ringW, ringH, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Solar sun-notches or Chrono clock-ticks around halo rim
        if (isSolar || isChronoNova) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${(ratio * 0.85).toFixed(2)})`;
          ctx.lineWidth = 2;
          for (let k = 0; k < 4; k++) {
            const ka = prog * 5 + (k / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(b.x1 + Math.cos(ka) * (ringW - 5), ry + Math.sin(ka) * (ringH - 1.5));
            ctx.lineTo(b.x1 + Math.cos(ka) * (ringW + 7), ry + Math.sin(ka) * (ringH + 2));
            ctx.stroke();
          }
        }
      }

      // Scorching ground impact plasma-dome + radiating floor light burst!
      ctx.fillStyle = isChronoNova
        ? `rgba(45, 212, 191, ${(ratio * 0.92).toFixed(2)})`
        : isSolar
          ? `rgba(251, 191, 36, ${(ratio * 0.88).toFixed(2)})`
          : `rgba(56, 189, 248, ${(ratio * 0.88).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(b.x1, GROUND_Y + 2, w * 2.15, w * 0.68, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${(ratio * 0.98).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(b.x1, GROUND_Y + 2, w * 1.15, w * 0.38, 0, Math.PI, Math.PI * 2);
      ctx.fill();

      // Upward ejecta energy needles blasting away from ground contact
      ctx.strokeStyle = isChronoNova ? '#fef08a' : isSolar ? '#fef9c3' : '#cffafe';
      ctx.lineWidth = 2.2 * ratio + 0.8;
      for (let e = -2; e <= 2; e++) {
        if (e === 0) continue;
        const ex = b.x1 + e * w * 0.6;
        ctx.beginPath();
        ctx.moveTo(ex, GROUND_Y);
        ctx.lineTo(ex + e * (14 + prog * 18), GROUND_Y - 18 - Math.abs(e) * 7 - prog * 24);
        ctx.stroke();
      }
    } else if (b.style === 'black_hole_vortex') {
      const r = Math.max(22, b.width * (0.58 + Math.sin(ratio * Math.PI) * 0.58));
      const spin = prog * 10 + b.seed;
      const jetBot = Math.min(GROUND_Y, b.y1 + r * 1.25);

      // Relativistic vertical polar astrophysical jets blasting from singularity poles (zero gradient alloc!)
      ctx.fillStyle = `rgba(192, 132, 252, ${(ratio * 0.42).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(b.x1 - 4, b.y1);
      ctx.lineTo(b.x1 - 12 * ratio, b.y1 - r * 2.45);
      ctx.lineTo(b.x1 + 12 * ratio, b.y1 - r * 2.45);
      ctx.lineTo(b.x1 + 4, b.y1);
      ctx.lineTo(b.x1 + 10 * ratio, jetBot);
      ctx.lineTo(b.x1 - 10 * ratio, jetBot);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${(ratio * 0.78).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(b.x1 - 2, b.y1);
      ctx.lineTo(b.x1 - 4.5 * ratio, b.y1 - r * 1.9);
      ctx.lineTo(b.x1 + 4.5 * ratio, b.y1 - r * 1.9);
      ctx.lineTo(b.x1 + 2, b.y1);
      ctx.lineTo(b.x1 + 4 * ratio, jetBot);
      ctx.lineTo(b.x1 - 4 * ratio, jetBot);
      ctx.closePath();
      ctx.fill();

      // Gravitational lensing outer halo (layered translucent rings — zero gradient alloc!)
      ctx.fillStyle = `rgba(126, 34, 206, ${(ratio * 0.24).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(b.x1, b.y1, r * 1.82, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(168, 85, 247, ${(ratio * 0.52).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(b.x1, b.y1, r * 1.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(b.x1, b.y1);

      // Spiraling sucked-in star streaks curving into the singularity!
      for (let i = 0; i < 10; i++) {
        const a = spin * 0.9 + (i / 10) * Math.PI * 2;
        const dist = r * (0.7 + ((i * 0.27 + ratio * 1.4) % 1) * 1.15);
        ctx.strokeStyle = i % 2 === 0 ? `rgba(240, 171, 252, ${(ratio * 0.85).toFixed(2)})` : `rgba(254, 240, 138, ${(ratio * 0.85).toFixed(2)})`;
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * dist, Math.sin(a) * dist * 0.56);
        ctx.lineTo(Math.cos(a + 0.34) * (dist * 0.72), Math.sin(a + 0.34) * (dist * 0.72) * 0.56);
        ctx.stroke();
      }

      // Tilted golden-magenta double accretion disk (back half)
      ctx.rotate(-0.2);
      ctx.strokeStyle = `rgba(240, 171, 252, ${(ratio * 0.9).toFixed(2)})`;
      ctx.lineWidth = 7.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.65, r * 0.4, 0, Math.PI, Math.PI * 2);
      ctx.stroke();

      // Glowing razor photon ring + pitch-black event horizon
      ctx.fillStyle = '#05020d';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(254, 240, 138, ${(ratio * 0.98).toFixed(2)})`;
      ctx.lineWidth = 3.8;
      ctx.stroke();

      // Front sweeping accretion disk arc (outer gold + inner incandescent white)
      ctx.strokeStyle = `rgba(250, 204, 21, ${(ratio * 0.95).toFixed(2)})`;
      ctx.lineWidth = 6.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.65, r * 0.4, 0, 0, Math.PI);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 255, 255, ${(ratio * 0.85).toFixed(2)})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.25, r * 0.28, 0, 0, Math.PI);
      ctx.stroke();

      for (let i = 0; i < 8; i++) {
        const a = spin + (i / 8) * Math.PI * 2;
        ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#ffffff';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r * 1.48, Math.sin(a) * r * 0.35, 2.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (b.style === 'flame_jet') {
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const fx = b.x1 + (b.x2 - b.x1) * t;
        const fy = b.y1 + (b.y2 - b.y1) * t + Math.sin(b.seed * 12 + i * 2.1) * (4 + t * 4);
        const r = 4.5 + t * b.width * 1.05;
        ctx.globalAlpha = ratio * (1 - t * 0.38);
        drawCelEllipse(ctx, fx, fy, r * 1.2, r * 0.88, t < 0.26 ? '#fef08a' : t < 0.65 ? '#f97316' : '#dc2626', {
          lineWidth: 1.4,
          ink: '#7c2d12',
        });
        if (t < 0.55) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(fx, fy, r * 0.45, r * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Sleek high-impact Railgun, Ion Beam, Cosmic Gravity Beam, or Prismatic Chrono Beam
      const dx = b.x2 - b.x1;
      const dy = b.y2 - b.y1;
      const angle = Math.atan2(dy, dx);

      ctx.lineCap = 'round';
      ctx.globalAlpha = ratio * 0.42;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width * ratio + 12;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.globalAlpha = ratio;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width * ratio + 3.5;
      ctx.stroke();

      ctx.strokeStyle = b.style === 'gravity_beam' || b.style === 'chrono_beam' ? '#fef08a' : '#ffffff';
      ctx.lineWidth = Math.max(2.2, b.width * 0.48 * ratio);
      ctx.stroke();

      // Spaced Mach / sonic shockwave rings punched along the beam shaft!
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const rt = 0.14 + r * 0.28 + prog * 0.08;
        if (rt > 0.96) continue;
        const rx = b.x1 + dx * rt;
        const ry = b.y1 + dy * rt;
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(angle);
        ctx.strokeStyle = r === 0 ? '#ffffff' : b.color;
        ctx.globalAlpha = ratio * (0.85 - r * 0.15);
        ctx.lineWidth = 2.0 * ratio + 0.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.2 + prog * 3, (b.width * 1.15 + 5) * (0.85 + prog * 0.6), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (b.style === 'chrono_beam' || b.style === 'gravity_beam') {
        // Double spiraling quantum/graviton helix ribbons weaving around the beam!
        const helixCols = b.style === 'chrono_beam' ? ['#facc15', '#5eead4'] : ['#f0abfc', '#fef08a'];
        for (let hx = 0; hx < 2; hx++) {
          ctx.strokeStyle = helixCols[hx];
          ctx.globalAlpha = ratio * 0.9;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          const segs = 14;
          for (let s = 0; s <= segs; s++) {
            const st = s / segs;
            const bx = b.x1 + dx * st;
            const by = b.y1 + dy * st + Math.sin(st * Math.PI * 4.5 + b.seed + hx * Math.PI) * ((b.width + 2) * ratio);
            if (s === 0) ctx.moveTo(bx, by);
            else ctx.lineTo(bx, by);
          }
          ctx.stroke();
        }
      }

      // Bright muzzle ignition flare & endpoint starburst!
      drawEnergyOrb(ctx, b.x1, b.y1, (b.width + 3) * ratio, b.color, '#ffffff');
      drawEnergyOrb(ctx, b.x2, b.y2, (b.width + 5) * ratio, b.color, '#ffffff');
    }

    ctx.restore();
  }
}

/** High-craft cartoon Bombers, Steampunk Zeppelins, Volcanic Meteors, Dragon Rockets, Naval Shells, Fire Arrows & Missiles */
export function renderActiveUltimates(ctx: CanvasRenderingContext2D, ultimates: ActiveUltimate[]): void {
  for (const ult of ultimates) {
    const pal = getTeamPalette(ult.team);
    const t = ult.elapsed;

    if (ult.planes) {
      for (const plane of ult.planes) {
        ctx.save();
        ctx.translate(plane.x, plane.y);
        if (plane.dir === -1) ctx.scale(-1, 1);

        if (plane.kind === 'zeppelin') {
          // Trailing billowing white steam exhaust puffs
          for (let sp = 1; sp <= 3; sp++) {
            ctx.fillStyle = `rgba(241, 245, 249, ${(0.45 - sp * 0.11).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(-58 - sp * 14, 18 + Math.sin(t * 10 + sp) * 3, 5 + sp * 2.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Riveted Steampunk Brass War Zeppelin hull
          drawCelEllipse(ctx, 0, 0, 62, 25, '#d97706', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.6 });
          // Segmented brass rib seams
          ctx.strokeStyle = 'rgba(120, 53, 15, 0.55)';
          ctx.lineWidth = 1.6;
          for (const rx of [-26, 0, 26]) {
            ctx.beginPath();
            ctx.ellipse(rx, 0, 6, 23, 0, -Math.PI * 0.45, Math.PI * 0.45);
            ctx.stroke();
          }
          // Team-colored armored battle stripe
          drawCelRoundRect(ctx, -44, -6, 88, 11, 4, pal.main, { highlight: pal.light, lineWidth: 1.8 });
          // Upper & lower stabilizer fins
          drawCelPoly(
            ctx,
            [
              [-46, -12],
              [-72, -28],
              [-62, -4],
            ],
            pal.main,
            { lineWidth: 2.0 },
          );
          drawCelPoly(
            ctx,
            [
              [-46, 12],
              [-72, 26],
              [-62, 4],
            ],
            pal.main,
            { lineWidth: 2.0 },
          );
          // Armored iron war-gondola with glowing warm portholes
          drawCelRoundRect(ctx, -22, 22, 42, 12, 4, '#475569', { highlight: '#94a3b8', lineWidth: 2.0 });
          for (let w = -12; w <= 12; w += 8) {
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(w, 28, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
          // Animated spinning brass rear propeller
          const propH = 4 + Math.abs(Math.sin(t * 28)) * 12;
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(-26, 28 - propH);
          ctx.lineTo(-26, 28 + propH);
          ctx.stroke();
        } else {
          // Wingtip contrail ribbons behind WW2 Heavy Bomber
          ctx.strokeStyle = 'rgba(241, 245, 249, 0.48)';
          ctx.lineWidth = 3.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-58, -8);
          ctx.lineTo(-104, -8);
          ctx.moveTo(-58, 10);
          ctx.lineTo(-104, 10);
          ctx.stroke();

          // Tail stabilizer & fuselage
          drawCelPoly(
            ctx,
            [
              [-50, -18],
              [-34, -2],
              [-46, 5],
            ],
            pal.main,
            { lineWidth: 2.0 },
          );
          drawCelEllipse(ctx, 0, 0, 50, 12, '#64748b', { highlight: '#e2e8f0', shadow: '#334155', lineWidth: 2.4 });
          // Team roundel fuselage stripe
          drawCelRoundRect(ctx, -14, -9, 30, 8, 3, pal.main, { highlight: pal.light, lineWidth: 1.8 });
          // Glass nose cockpit with specular glint
          drawCelEllipse(ctx, 30, -3, 11, 6, '#38bdf8', { highlight: '#ffffff', lineWidth: 1.8 });
          // Swept armored wing + twin engine nacelle
          drawCelPoly(
            ctx,
            [
              [-16, 4],
              [16, 4],
              [5, 22],
              [-24, 19],
            ],
            '#475569',
            { highlight: '#94a3b8', lineWidth: 2.0 },
          );
          // Blurred spinning twin propeller disc at wing leading edge
          const propBlur = 5 + Math.abs(Math.sin(t * 36)) * 9;
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(16, 8 - propBlur);
          ctx.lineTo(16, 8 + propBlur);
          ctx.stroke();
          // Blinking red wingtip strobe
          if (Math.sin(t * 18) > 0) {
            drawEnergyOrb(ctx, -14, 19, 3.6, '#ef4444', '#ffffff');
          }
        }
        ctx.restore();
      }
    }

    for (const ord of ult.fallingOrdinance) {
      if (ord.impacted) continue;
      const a = Math.atan2(ord.vy, ord.vx);

      if (ord.kind === 'meteor') {
        // Thick volcanic smoke + blazing fiery plasma wake
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = `rgba(68, 64, 60, ${(frac * 0.42).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x - 4, pt.y - 4, 6 + frac * 17, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(249, 115, 22, ${(frac * 0.72).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5 + frac * 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(254, 240, 138, ${(frac * 0.85).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5 + frac * 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.save();
        ctx.translate(ord.x, ord.y);
        // Parabolic hypersonic atmospheric entry bow-shock arc ahead of meteor!
        ctx.save();
        ctx.rotate(a);
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.arc(4, 0, 21, -Math.PI * 0.44, Math.PI * 0.44);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.65)';
        ctx.lineWidth = 7.5;
        ctx.beginPath();
        ctx.arc(2, 0, 23, -Math.PI * 0.48, Math.PI * 0.48);
        ctx.stroke();
        ctx.restore();

        // Jagged spinning volcanic asteroid boulder with glowing magma fissures
        ctx.rotate(ord.y * 0.032);
        drawCelPoly(
          ctx,
          [
            [-17, -6],
            [-8, -17],
            [8, -15],
            [18, -3],
            [13, 14],
            [-4, 17],
            [-16, 10],
          ],
          '#7c2d12',
          { highlight: '#f97316', shadow: '#292524', lineWidth: 2.5 },
        );
        // Glowing lava cracks across surface
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-9, -6);
        ctx.lineTo(1, 0);
        ctx.lineTo(10, -5);
        ctx.moveTo(1, 0);
        ctx.lineTo(-3, 10);
        ctx.stroke();
        drawEnergyOrb(ctx, 2, 1, 6.2, '#f97316', '#ffffff');
        ctx.restore();
      } else if (ord.kind === 'dragon_barrage') {
        // Blazing crimson-gold Singijeon Dragon Fire Rockets with glowing calligraphy ribbon tail!
        if (ord.trail.length > 1) {
          ctx.save();
          ctx.lineCap = 'round';
          for (let i = 1; i < ord.trail.length; i++) {
            const p0 = ord.trail[i - 1];
            const p1 = ord.trail[i];
            const frac = i / ord.trail.length;
            ctx.strokeStyle = `rgba(239, 68, 68, ${(frac * 0.78).toFixed(2)})`;
            ctx.lineWidth = 2 + frac * 7.5;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
            ctx.strokeStyle = `rgba(254, 240, 138, ${(frac * 0.85).toFixed(2)})`;
            ctx.lineWidth = 1 + frac * 2.8;
            ctx.stroke();
          }
          ctx.restore();
        }
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        drawEnergyOrb(ctx, -15, 0, 6.2, '#f97316', '#fef08a');
        setInkStyle(ctx, 2.5, '#78350f');
        ctx.beginPath();
        ctx.moveTo(-13, 0);
        ctx.lineTo(13, 0);
        ctx.stroke();
        drawCelRoundRect(ctx, -3, -4, 12, 8, 2, '#dc2626', { highlight: '#fca5a5', lineWidth: 1.6 });
        drawCelRoundRect(ctx, 1, -4.1, 3.2, 8.2, 0.8, '#facc15', { lineWidth: 1.0 });
        drawEnergyOrb(ctx, 14, 0, 6.8, '#ef4444', '#fef9c3');
        ctx.restore();
      } else if (ord.kind === 'fire_arrows') {
        // Blazing siege fire-arrow with flaming streak ribbon (zero gradient alloc!)
        if (ord.trail.length > 1) {
          const p0 = ord.trail[0];
          const mx = (p0.x + ord.x) * 0.5;
          const my = (p0.y + ord.y) * 0.5;
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.34)';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(mx, my);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.82)';
          ctx.lineWidth = 4.6;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(ord.x, ord.y);
          ctx.stroke();
        }
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        setInkStyle(ctx, 2.5, '#78350f');
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(11, 0);
        ctx.stroke();
        drawCelPoly(
          ctx,
          [
            [-16, -3.5],
            [-9, 0],
            [-16, 3.5],
          ],
          '#fef08a',
          { lineWidth: 1.1 },
        );
        drawEnergyOrb(ctx, 11, 0, 6.5, '#f97316', '#ffffff');
        ctx.restore();
      } else if (ord.kind === 'tactical_missiles') {
        // Rotating dual-ring red laser-designator reticle + vertical laser acquisition beam!
        const pulse = 0.72 + Math.sin(t * 20 + ord.targetX) * 0.28;
        ctx.save();
        // Vertical translucent laser designator beam (zero gradient alloc!)
        ctx.fillStyle = `rgba(244, 63, 94, ${(0.16 * pulse).toFixed(2)})`;
        ctx.fillRect(ord.targetX - 3, 20, 6, GROUND_Y - 20);
        ctx.fillStyle = `rgba(251, 113, 133, ${(0.34 * pulse).toFixed(2)})`;
        ctx.fillRect(ord.targetX - 1.5, GROUND_Y * 0.48, 3, GROUND_Y * 0.52);

        // Ground elliptical lock-on reticle
        ctx.strokeStyle = `rgba(244, 63, 94, ${(0.88 * pulse).toFixed(2)})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(ord.targetX, GROUND_Y, 28, 7.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(ord.targetX, GROUND_Y, 14, 3.8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(ord.targetX - 36, GROUND_Y);
        ctx.lineTo(ord.targetX + 36, GROUND_Y);
        ctx.stroke();
        ctx.restore();

        // Corkscrew supersonic white vapor trail
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = `rgba(241, 245, 249, ${(frac * 0.72).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.8 + frac * 5.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        // Mach-diamond supersonic afterburner cone
        ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
        ctx.beginPath();
        ctx.moveTo(-12, -4.2);
        ctx.lineTo(-32, 0);
        ctx.lineTo(-12, 4.2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.moveTo(-12, -2.2);
        ctx.lineTo(-24, 0);
        ctx.lineTo(-12, 2.2);
        ctx.closePath();
        ctx.fill();

        drawCelRoundRect(ctx, -13, -4.8, 25, 9.6, 3, '#e2e8f0', { highlight: '#ffffff', lineWidth: 2.0 });
        drawCelPoly(
          ctx,
          [
            [-14, -7.5],
            [-7, -4],
            [-14, -3],
          ],
          '#475569',
          { lineWidth: 1.3 },
        );
        drawCelPoly(
          ctx,
          [
            [-14, 7.5],
            [-7, 4],
            [-14, 3],
          ],
          '#475569',
          { lineWidth: 1.3 },
        );
        drawCelPoly(
          ctx,
          [
            [11, -5],
            [23, 0],
            [11, 5],
          ],
          '#ef4444',
          { lineWidth: 1.7 },
        );
        ctx.restore();
      } else if (ord.kind === 'naval_barrage') {
        // Thick gunpowder smoke trail + superheated glowing cast-iron broadside shell
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = `rgba(148, 163, 184, ${(frac * 0.62).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3 + frac * 6.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        drawEnergyOrb(ctx, -9, 0, 6.2, '#f97316', '#fef08a');
        drawCelEllipse(ctx, 2, 0, 11.5, 7.8, '#1e293b', { highlight: '#94a3b8', shadow: '#090d16', lineWidth: 2.2 });
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(4, 0, 8.2, -0.7, 0.7);
        ctx.stroke();
        ctx.restore();
      } else {
        // Zeppelin brass incendiary bombs & WW2 heavy carpet bombs
        const isZepp = ord.kind === 'zeppelin_raid';
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          ctx.fillStyle = isZepp
            ? `rgba(251, 191, 36, ${(frac * 0.55).toFixed(2)})`
            : `rgba(148, 163, 184, ${(frac * 0.58).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.2 + frac * 4.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.save();
        ctx.translate(ord.x, ord.y);
        ctx.rotate(a);
        drawCelEllipse(
          ctx,
          0,
          0,
          12,
          6.8,
          isZepp ? '#b45309' : '#334155',
          { highlight: isZepp ? '#fde047' : '#94a3b8', shadow: '#0f172a', lineWidth: 2.2 },
        );
        // Painted hazard band
        drawCelRoundRect(ctx, 2, -6.2, 3.2, 12.4, 1, isZepp ? '#facc15' : '#ef4444', { lineWidth: 1.0 });
        drawCelPoly(
          ctx,
          [
            [-15, -6.5],
            [-7, 0],
            [-15, 6.5],
          ],
          isZepp ? '#f59e0b' : '#ef4444',
          { lineWidth: 1.5 },
        );
        ctx.restore();
      }
    }
  }
}

/** High-craft cartoon explosions, 12-point hit starbursts, perspective ground shockwaves, muzzle flashes & impact crosses */
export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: ParticleEntity[],
  viewMinX = -Infinity,
  viewMaxX = Infinity,
): void {
  if (particles.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const p of particles) {
    const pad = Math.max(40, p.size * 2.6);
    if (p.x + pad < viewMinX || p.x - pad > viewMaxX) continue;
    const frac = Math.max(0, p.life / p.maxLife);
    const prog = 1 - frac;
    const baseAlpha = Math.min(1, frac * 1.45) * p.alpha;
    ctx.globalAlpha = baseAlpha;

    if (p.shape === 'ground_shockwave') {
      // Crisp 3D perspective elliptical ground shockwave + radial ground speed-lines!
      const rx = Math.max(10, p.size * 1.18);
      const ry = Math.max(3.5, rx * 0.25);

      // Soft outer colored glow ring
      ctx.globalAlpha = baseAlpha * 0.45;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(3.5, 9 * frac);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Crisp main colored ring
      ctx.globalAlpha = baseAlpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.8, 4.4 * frac);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Blinding white inner specular ring
      if (frac > 0.3) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.2, 2.2 * frac);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rx * 0.86, ry * 0.82, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radiating ground-level speed needles on fresh blasts
      if (frac > 0.45) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        for (let k = -1; k <= 1; k += 2) {
          ctx.beginPath();
          ctx.moveTo(p.x + k * rx * 0.8, p.y);
          ctx.lineTo(p.x + k * (rx + 12 * frac), p.y - 2);
          ctx.stroke();
        }
      }
    } else if (p.shape === 'muzzle_flash') {
      // Directional 3-prong cel-shaded weapon muzzle blast cone!
      const sz = Math.max(6, p.size * (0.65 + frac * 0.65));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? 0);

      // Outer vibrant muzzle star/cone
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(-2, -sz * 0.34);
      ctx.lineTo(sz * 0.42, -sz * 0.68);
      ctx.lineTo(sz * 0.32, -sz * 0.18);
      ctx.lineTo(sz * 1.48, 0);
      ctx.lineTo(sz * 0.32, sz * 0.18);
      ctx.lineTo(sz * 0.42, sz * 0.68);
      ctx.lineTo(-2, sz * 0.34);
      ctx.closePath();
      ctx.fill();

      // Blinding white-hot inner blast needle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-1, -sz * 0.18);
      ctx.lineTo(sz * 1.05, 0);
      ctx.lineTo(-1, sz * 0.18);
      ctx.closePath();
      ctx.fill();

      // Bright core muzzle flash dot
      ctx.beginPath();
      ctx.arc(sz * 0.12, 0, sz * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.shape === 'impact_cross') {
      // Razor-sharp anime X-hit impact flare with elongated diamond rays!
      const len = Math.max(10, p.size * (0.7 + prog * 0.65));
      const thick = Math.max(1.8, p.size * 0.18 * frac);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? 0.35);

      const drawDiamondRay = (rx: number, ry: number, col: string) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(-rx, 0);
        ctx.lineTo(0, -ry);
        ctx.lineTo(rx, 0);
        ctx.lineTo(0, ry);
        ctx.closePath();
        ctx.fill();
      };

      // Colored outer flare cross
      drawDiamondRay(len * 1.18, thick * 1.55, p.color);
      drawDiamondRay(thick * 1.45, len * 0.88, p.color);
      // Blinding white razor inner cross
      drawDiamondRay(len * 0.92, thick * 0.72, '#ffffff');
      drawDiamondRay(thick * 0.68, len * 0.68, '#ffffff');
      ctx.restore();
    } else if (p.shape === 'flash_star') {
      // Dynamic 12-point uneven anime hit-starburst + crisp ink outline + radial needles!
      const rOuter = Math.max(9, p.size * (0.48 + frac * 0.98));
      const rInner = rOuter * 0.32;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? 0);
      ctx.beginPath();
      const spikes = 12;
      for (let i = 0; i < spikes * 2; i++) {
        const a = (i / (spikes * 2)) * Math.PI * 2;
        const isTip = i % 2 === 0;
        const tipScale = i % 4 === 0 ? 1.08 : 0.78;
        const r = isTip ? rOuter * tipScale : rInner;
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
      ctx.arc(0, 0, rInner * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // 4 crisp radial impact needles bursting outward
      if (frac > 0.35) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + 0.38;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * rOuter * 0.95, Math.sin(a) * rOuter * 0.95);
          ctx.lineTo(Math.cos(a) * (rOuter * 1.42), Math.sin(a) * (rOuter * 1.42));
          ctx.stroke();
        }
      }
      ctx.restore();
    } else if (p.shape === 'fireball') {
      // Rich 3-lobe clustered cel-shaded cartoon explosion cloud (keeps fighters clearly readable!)
      const r = Math.max(9, p.size * (0.52 + prog * 0.68));
      ctx.globalAlpha = baseAlpha * (frac > 0.32 ? 0.86 : Math.max(0.16, frac * 1.7));
      const outerCol = frac > 0.24 ? p.color : '#ea580c';
      const inkCol = 'rgba(124, 45, 18, 0.74)';

      // Two billowing shoulder lobes behind main blast core
      drawCelEllipse(ctx, p.x - r * 0.56, p.y + r * 0.12, r * 0.66, r * 0.6, outerCol, {
        lineWidth: 1.6,
        ink: inkCol,
      });
      drawCelEllipse(ctx, p.x + r * 0.54, p.y + r * 0.08, r * 0.62, r * 0.58, outerCol, {
        lineWidth: 1.6,
        ink: inkCol,
      });
      // Main billowing fireball crown
      drawCelEllipse(ctx, p.x, p.y - r * 0.08, r, r * 0.92, outerCol, {
        lineWidth: 1.9,
        ink: inkCol,
      });
      if (frac > 0.18) {
        ctx.fillStyle = frac > 0.44 ? '#fde047' : '#f97316';
        ctx.beginPath();
        ctx.arc(p.x - r * 0.08, p.y - r * 0.14, r * 0.68, 0, Math.PI * 2);
        ctx.fill();
      }
      if (frac > 0.46) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x - r * 0.1, p.y - r * 0.16, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.shape === 'dust_wave') {
      const rx = Math.max(9, p.size * (0.95 + prog * 1.28));
      const ry = Math.max(4, p.size * 0.36 * frac + 2);
      ctx.globalAlpha = baseAlpha * 0.68;
      drawCelEllipse(ctx, p.x, p.y - ry * 0.5, rx, ry, p.color, { lineWidth: 1.3, ink: 'rgba(20,24,36,0.34)' });
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - ry * 0.4, rx * 1.15, ry * 0.9, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    } else if (p.shape === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(2.2, 5.6 * frac);
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(4, p.size), 0, Math.PI * 2);
      ctx.stroke();
      if (frac > 0.42) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(3, p.size * 0.84), 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (p.shape === 'smoke') {
      const r = Math.max(4.5, p.size * (1.08 - frac * 0.25));
      ctx.globalAlpha = baseAlpha * 0.44;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
      ctx.beginPath();
      ctx.arc(p.x - r * 0.25, p.y - r * 0.25, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'debris') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation ?? prog * 6);
      const sz = Math.max(4, p.size * 1.38);
      drawCelRoundRect(ctx, -sz / 2, -sz / 2, sz, sz * 0.85, 1.5, p.color, {
        highlight: 'rgba(255,255,255,0.38)',
        lineWidth: 1.5,
      });
      ctx.restore();
    } else if (p.shape === 'spark') {
      const tx = p.x - p.vx * 0.048;
      const ty = p.y - p.vy * 0.048;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(2.3, p.size * frac + 2.0);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.2, (p.size * frac + 1.2) * 0.48);
      ctx.beginPath();
      ctx.moveTo((tx + p.x) * 0.5, (ty + p.y) * 0.5);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.9, p.size * 0.5), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2, p.size * (0.5 + frac * 0.5)), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** Crisp comic spring-pop damage numbers with bold dark outline, sparkling crit stars, and gleaming gold coins */
export function renderPopups(
  ctx: CanvasRenderingContext2D,
  popups: DamagePopup[],
  viewMinX = -Infinity,
  viewMaxX = Infinity,
): void {
  if (popups.length === 0) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  let lastFontSize = -1;

  for (const pop of popups) {
    if (pop.x + 80 < viewMinX || pop.x - 80 > viewMaxX) continue;
    const frac = Math.max(0, pop.life / pop.maxLife);
    const age = pop.maxLife - pop.life;
    const isCrit = pop.kind === 'crit' || pop.text.endsWith('!');
    const isGold = pop.kind === 'gold' || (pop.text.startsWith('+') && pop.text.endsWith('G'));
    const isBase = pop.kind === 'base';

    let popMult = 1;
    if (age < 0.07) {
      const t = age / 0.07;
      popMult = 0.72 + t * (isCrit ? 0.96 : 0.62);
    } else if (age < 0.18) {
      const t = (age - 0.07) / 0.11;
      popMult = (isCrit ? 1.68 : 1.34) - t * (isCrit ? 0.68 : 0.34);
    }

    const fontSize = Math.round(14.5 * pop.scale * popMult);
    ctx.globalAlpha = Math.min(1, frac * 1.75);
    if (fontSize !== lastFontSize) {
      lastFontSize = fontSize;
      ctx.font = `900 ${fontSize}px 'Pretendard', system-ui, -apple-system, sans-serif`;
    }

    if (isCrit && frac > 0.25) {
      ctx.lineWidth = 7.5;
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.88)';
      ctx.strokeText(pop.text, pop.x, pop.y);
    } else if (isBase) {
      ctx.lineWidth = 6;
      ctx.strokeStyle = 'rgba(185, 28, 28, 0.78)';
      ctx.strokeText(pop.text, pop.x, pop.y);
    }

    // Crisp drop shadow + bold ink comic outline + vibrant fill
    ctx.fillStyle = 'rgba(10, 14, 24, 0.92)';
    ctx.fillText(pop.text, pop.x + 1.8, pop.y + 2.2);

    ctx.lineWidth = isCrit ? 4.5 : 3.8;
    ctx.strokeStyle = INK;
    ctx.strokeText(pop.text, pop.x, pop.y);

    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);

    // Sparkling 4-point comic crit stars flanking critical hit numbers!
    if (isCrit && frac > 0.32) {
      const spreadX = pop.text.length * fontSize * 0.34 + 6;
      const drawCritSparkle = (sx: number, sy: number, r: number) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(sx - r, sy);
        ctx.lineTo(sx, sy - r * 0.28);
        ctx.lineTo(sx + r, sy);
        ctx.lineTo(sx, sy + r * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx, sy - r);
        ctx.lineTo(sx + r * 0.28, sy);
        ctx.lineTo(sx, sy + r);
        ctx.lineTo(sx - r * 0.28, sy);
        ctx.closePath();
        ctx.fill();
      };
      drawCritSparkle(pop.x - spreadX, pop.y - fontSize * 0.26, 6.2 * frac);
      drawCritSparkle(pop.x + spreadX, pop.y + fontSize * 0.18, 4.8 * frac);
    }

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
    // Glowing golden sky beacon guiding both armies to midfield (zero gradient alloc!)
    ctx.fillStyle = `rgba(254, 240, 138, ${(pulse * 0.14).toFixed(2)})`;
    ctx.fillRect(c.x - 16, 40, 32, GROUND_Y - 40);
    ctx.fillStyle = `rgba(250, 204, 21, ${(pulse * 0.22).toFixed(2)})`;
    ctx.fillRect(c.x - 8, GROUND_Y * 0.36, 16, GROUND_Y * 0.64);

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
