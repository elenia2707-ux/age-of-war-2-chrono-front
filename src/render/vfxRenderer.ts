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
import { PIXEL_WORLD_SCALE, drawSprite } from './spriteAtlas';

const snap = (v: number): number => Math.round(v / 2) * 2;

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
    else if (ult.def.kind === 'solar_wrath') tint = 'rgba(84, 52, 8, 0.34)';
    else if (ult.def.kind === 'orbital_laser') tint = 'rgba(6, 22, 36, 0.4)';
    else if (ult.def.kind === 'black_hole') tint = 'rgba(32, 8, 56, 0.52)';
    else if (ult.def.kind === 'meteor') tint = 'rgba(58, 18, 6, 0.34)';
    else if (ult.def.kind === 'fire_arrows') tint = 'rgba(46, 14, 8, 0.28)';

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT);
    ctx.restore();
  }
}

/** Persistent pixel-stepped dark crater scorches + cooling embers on the battlefield floor */
export function renderScorchMarks(ctx: CanvasRenderingContext2D, scorches: ScorchMark[]): void {
  for (const s of scorches) {
    const lifeFrac = Math.max(0, s.life / s.maxLife);
    const alpha = Math.min(1, lifeFrac * 2.5);
    const cx = snap(s.x);
    const rx = Math.max(12, snap(s.radius * 1.05));
    const ry = Math.max(4, snap(s.radius * 0.16));

    ctx.save();
    // Outer charred blast soot (stepped pixel oval)
    ctx.globalAlpha = alpha * 0.56;
    ctx.fillStyle = '#090b0f';
    ctx.fillRect(cx - rx, GROUND_Y + 2, rx * 2, ry * 2);
    ctx.fillRect(cx - rx + 6, GROUND_Y, Math.max(4, (rx - 6) * 2), ry * 2 + 4);

    // Inner crater rim
    const irx = Math.max(6, snap(rx * 0.65));
    ctx.globalAlpha = alpha * 0.78;
    ctx.fillStyle = '#181412';
    ctx.fillRect(cx - irx, GROUND_Y + 2, irx * 2, Math.max(4, ry));

    // Cooling pixel ember glow during first 45% of lifetime
    const heat = Math.max(0, (lifeFrac - 0.55) / 0.45);
    if (heat > 0.02) {
      const hrx = Math.max(4, snap(rx * 0.38));
      ctx.globalAlpha = heat * 0.78;
      ctx.fillStyle = s.glowColor;
      ctx.fillRect(cx - hrx, GROUND_Y + 2, hrx * 2, 4);
    }
    ctx.restore();
  }
}

/** Dramatic layered pixel-art melee slash crescents & piercing thrust sonic cones */
export function renderSlashes(ctx: CanvasRenderingContext2D, slashes: SlashEffect[]): void {
  for (const sl of slashes) {
    const frac = Math.max(0, sl.life / sl.maxLife);
    const prog = 1 - frac;

    ctx.save();
    ctx.translate(snap(sl.x), snap(sl.y));
    ctx.scale(sl.dir, 1);
    ctx.globalAlpha = Math.min(1, frac * 1.75);

    if (sl.style === 'thrust') {
      const len = snap(sl.radius * (0.85 + prog * 0.65));
      const h = Math.max(2, snap(8 * frac));
      // Sonic piercing lance streak
      ctx.fillStyle = sl.color;
      ctx.fillRect(-6, -h, len, h * 2);
      ctx.fillRect(len - 6, -Math.max(2, h - 2), 12, Math.max(4, (h - 2) * 2));
      ctx.fillStyle = sl.coreColor;
      ctx.fillRect(0, -2, Math.max(8, len + 2), 4);
      // Expanding sonic ring around spear shaft
      const ringX = snap(len * 0.45);
      const ringH = snap(10 + prog * 14);
      ctx.fillStyle = sl.color;
      ctx.fillRect(ringX - 2, -ringH, 4, ringH * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ringX, -Math.round(ringH * 0.6), 2, Math.round(ringH * 1.2));
    } else {
      // Sweeping 3-layer tapered pixel crescent blade!
      const r = sl.radius * (0.9 + prog * 0.28);
      const steps = 20;
      const startA = -1.45 + prog * 0.5 + sl.angleOffset;
      const endA = 1.25 + sl.angleOffset;
      const maxThick = sl.style === 'heavy' ? 12 : sl.style === 'plasma' ? 10 : 8;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = startA + (endA - startA) * t;
        const taper = Math.sin(t * Math.PI);
        const px = snap(Math.cos(a) * r);
        const py = snap(Math.sin(a) * r);
        const outer = Math.max(4, snap(maxThick * taper * (0.55 + frac * 0.55)));
        const inner = Math.max(2, snap(outer * 0.55));

        ctx.fillStyle = sl.color;
        ctx.fillRect(px - outer / 2, py - outer / 2, outer, outer);

        if (taper > 0.25) {
          ctx.fillStyle = sl.coreColor;
          ctx.fillRect(px - inner / 2, py - inner / 2, inner, inner);
        }
        if (taper > 0.55 && frac > 0.35) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - 2, py - 2, 4, 4);
        }
      }

      // Crisp cross-star glint at leading tip of slash
      if (frac > 0.4) {
        const tipX = snap(Math.cos(endA) * r);
        const tipY = snap(Math.sin(endA) * r);
        const glint = snap(8 * frac);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(tipX - glint, tipY - 2, glint * 2, 4);
        ctx.fillRect(tipX - 2, tipY - glint, 4, glint * 2);
      }
    }

    ctx.restore();
  }
}

/** Pixel-art sprite projectiles with crisp pixel trails */
export function renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: ProjectileEntity[]): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  for (const p of projectiles) {
    const angle = Math.atan2(p.vy, p.vx);

    // Crisp pixel trail behind fast/heavy projectiles
    if (
      p.style === 'bullet' ||
      p.style === 'plasma' ||
      p.style === 'antimatter' ||
      p.style === 'solar_orb' ||
      p.style === 'totem_fire' ||
      p.style === 'grenade' ||
      p.style === 'mortar_shell' ||
      p.style === 'rocket' ||
      p.style === 'shell' ||
      p.style === 'boulder'
    ) {
      const trailCol =
        p.style === 'plasma'
          ? p.team === 'player'
            ? 'rgba(56, 232, 255, 0.55)'
            : 'rgba(255, 77, 125, 0.55)'
          : p.style === 'antimatter'
            ? 'rgba(192, 132, 252, 0.62)'
            : p.style === 'solar_orb'
              ? 'rgba(251, 191, 36, 0.62)'
              : p.style === 'totem_fire'
                ? 'rgba(249, 115, 22, 0.66)'
                : p.style === 'bullet'
                  ? 'rgba(254, 240, 138, 0.52)'
                  : 'rgba(226, 232, 240, 0.36)';
      ctx.fillStyle = trailCol;
      for (let s = 1; s <= 3; s++) {
        const tx = snap(p.x - p.vx * 0.008 * s);
        const ty = snap(p.y - p.vy * 0.008 * s);
        const sz = Math.max(2, 6 - s * 2);
        ctx.fillRect(tx - sz / 2, ty - sz / 2, sz, sz);
      }
    }

    let spriteKey = `proj/${p.style}`;
    if (p.style === 'plasma') {
      spriteKey = `proj/plasma/${p.team}`;
    } else if (p.style === 'antimatter') {
      spriteKey = `proj/antimatter/${p.team}`;
    } else if (p.style === 'grenade') {
      spriteKey = 'proj/grenade';
    } else if (
      p.style === 'flame' ||
      p.style === 'railgun' ||
      p.style === 'tesla_arc' ||
      p.style === 'ion_beam' ||
      p.style === 'gravity_beam'
    ) {
      spriteKey = 'proj/bullet';
    }

    const spinAngle =
      p.style === 'stone' ||
      p.style === 'boulder' ||
      p.style === 'cannonball' ||
      p.style === 'grenade' ||
      p.style === 'solar_orb' ||
      p.style === 'totem_fire'
        ? p.life * 8 * (p.vx >= 0 ? 1 : -1)
        : angle;

    const drawn = drawSprite(ctx, spriteKey, p.x, p.y, {
      scale: PIXEL_WORLD_SCALE,
      rotation: spinAngle,
    });

    if (!drawn) {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(snap(p.x) - 4, snap(p.y) - 4, 8, 8);
    }
  }

  ctx.restore();
}

/** Crisp pixel-stepped lightning, tesla arc, solar beam, orbital laser, black hole vortex, flame & railgun/gravity beams */
export function renderBeams(ctx: CanvasRenderingContext2D, beams: BeamEffect[]): void {
  for (const b of beams) {
    const ratio = Math.max(0, b.life / b.maxLife);
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (b.style === 'lightning' || b.style === 'tesla_arc') {
      const isHorizontal = b.style === 'tesla_arc';
      const segments = isHorizontal ? 9 : 12;
      let prevX = snap(b.x1);
      let prevY = snap(b.y1);
      const outerW = Math.max(4, snap(b.width * ratio + (isHorizontal ? 4 : 6)));
      const innerW = Math.max(2, snap(b.width * 0.45 * ratio));

      for (let s = 1; s <= segments; s++) {
        const t = s / segments;
        const jitter = s === segments ? 0 : Math.sin(b.seed + s * 7.3) * (isHorizontal ? 14 : 26);
        const nx = isHorizontal ? snap(b.x1 + (b.x2 - b.x1) * t) : snap(b.x1 + (b.x2 - b.x1) * t + jitter);
        const ny = isHorizontal ? snap(b.y1 + (b.y2 - b.y1) * t + jitter) : snap(b.y1 + (b.y2 - b.y1) * t);

        if (isHorizontal) {
          const midX = snap((prevX + nx) * 0.5);
          ctx.fillStyle = `rgba(56, 189, 248, ${(ratio * 0.92).toFixed(2)})`;
          ctx.fillRect(Math.min(prevX, midX), prevY - outerW / 2, Math.abs(midX - prevX) + outerW / 2, outerW);
          ctx.fillRect(midX - outerW / 2, Math.min(prevY, ny) - outerW / 2, outerW, Math.abs(ny - prevY) + outerW);
          ctx.fillRect(Math.min(midX, nx), ny - outerW / 2, Math.abs(nx - midX) + outerW / 2, outerW);

          ctx.fillStyle = `rgba(254, 249, 195, ${ratio.toFixed(2)})`;
          ctx.fillRect(Math.min(prevX, midX), prevY - innerW / 2, Math.abs(midX - prevX) + innerW / 2, innerW);
          ctx.fillRect(midX - innerW / 2, Math.min(prevY, ny) - innerW / 2, innerW, Math.abs(ny - prevY) + innerW);
          ctx.fillRect(Math.min(midX, nx), ny - innerW / 2, Math.abs(nx - midX) + innerW / 2, innerW);
        } else {
          const midY = snap((prevY + ny) * 0.5);
          ctx.fillStyle = `rgba(56, 189, 248, ${(ratio * 0.92).toFixed(2)})`;
          ctx.fillRect(prevX - outerW / 2, Math.min(prevY, midY), outerW, Math.abs(midY - prevY) + outerW / 2);
          ctx.fillRect(Math.min(prevX, nx) - outerW / 2, midY - outerW / 2, Math.abs(nx - prevX) + outerW, outerW);
          ctx.fillRect(nx - outerW / 2, Math.min(midY, ny), outerW, Math.abs(ny - midY) + outerW / 2);

          ctx.fillStyle = `rgba(255, 255, 255, ${ratio.toFixed(2)})`;
          ctx.fillRect(prevX - innerW / 2, Math.min(prevY, midY), innerW, Math.abs(midY - prevY) + innerW / 2);
          ctx.fillRect(Math.min(prevX, nx) - innerW / 2, midY - innerW / 2, Math.abs(nx - prevX) + innerW, innerW);
          ctx.fillRect(nx - innerW / 2, Math.min(midY, ny), innerW, Math.abs(ny - midY) + innerW / 2);
        }

        prevX = nx;
        prevY = ny;
      }
    } else if (b.style === 'orbital_laser' || b.style === 'solar_beam') {
      const isSolar = b.style === 'solar_beam';
      const cx = snap(b.x1);
      const w = Math.max(8, snap(b.width * (0.48 + ratio * 0.8)));
      const h = snap(b.y2 - b.y1);
      ctx.fillStyle = isSolar
        ? `rgba(245, 158, 11, ${(ratio * 0.45).toFixed(2)})`
        : `rgba(6, 182, 212, ${(ratio * 0.42).toFixed(2)})`;
      ctx.fillRect(cx - w, b.y1, w * 2, h);
      ctx.fillStyle = isSolar
        ? `rgba(251, 191, 36, ${(ratio * 0.88).toFixed(2)})`
        : `rgba(34, 211, 238, ${(ratio * 0.85).toFixed(2)})`;
      ctx.fillRect(cx - Math.round(w * 0.65), b.y1, Math.round(w * 1.3), h);
      ctx.fillStyle = isSolar
        ? `rgba(254, 249, 195, ${Math.min(1, ratio * 1.15).toFixed(2)})`
        : `rgba(224, 242, 254, ${Math.min(1, ratio * 1.15).toFixed(2)})`;
      ctx.fillRect(cx - Math.round(w * 0.35), b.y1, Math.round(w * 0.7), h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - Math.max(4, Math.round(w * 0.16)), b.y1, Math.max(8, Math.round(w * 0.32)), h);

      const domeW = snap(w * 1.55);
      ctx.fillStyle = isSolar
        ? `rgba(251, 191, 36, ${(ratio * 0.88).toFixed(2)})`
        : `rgba(34, 211, 238, ${(ratio * 0.85).toFixed(2)})`;
      ctx.fillRect(cx - domeW, GROUND_Y - 10, domeW * 2, 16);
      ctx.fillStyle = `rgba(255, 255, 255, ${(ratio * 0.95).toFixed(2)})`;
      ctx.fillRect(cx - Math.round(domeW * 0.6), GROUND_Y - 14, Math.round(domeW * 1.2), 14);
    } else if (b.style === 'black_hole_vortex') {
      // Crisp pixel-art circular cosmic singularity with tilted accretion disk
      const cx = snap(b.x1);
      const cy = snap(b.y1);
      const r = Math.max(16, snap(b.width * (0.55 + Math.sin(ratio * Math.PI) * 0.55)));
      const drawPixDisc = (rad: number, color: string) => {
        ctx.fillStyle = color;
        for (let dy = -rad; dy <= rad; dy += 4) {
          const hw = snap(Math.sqrt(Math.max(0, rad * rad - dy * dy)));
          if (hw >= 2) ctx.fillRect(cx - hw, cy + dy, hw * 2, 4);
        }
      };

      // 1. Outer violet gravity lensing halo
      drawPixDisc(snap(r * 1.15), `rgba(126, 34, 206, ${(ratio * 0.34).toFixed(2)})`);
      drawPixDisc(snap(r * 0.88), `rgba(168, 85, 247, ${(ratio * 0.48).toFixed(2)})`);

      // 2. Back arc of tilted accretion disk
      const diskRx = snap(r * 1.45);
      const diskRy = Math.max(6, snap(r * 0.34));
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + (1 - ratio) * 9 + b.seed;
        if (Math.sin(ang) > 0) continue;
        const rx = snap(cx + Math.cos(ang) * diskRx);
        const ry = snap(cy + Math.sin(ang) * diskRy);
        ctx.fillStyle = i % 3 === 0 ? '#fde047' : i % 2 === 0 ? '#e879f9' : '#c084fc';
        ctx.fillRect(rx - 4, ry - 2, 8, 4);
      }

      // 3. Glowing photon ring + pitch-black circular event horizon
      const coreR = Math.max(10, snap(r * 0.52));
      drawPixDisc(coreR + 4, `rgba(240, 171, 252, ${(ratio * 0.92).toFixed(2)})`);
      drawPixDisc(coreR + 2, `rgba(255, 255, 255, ${Math.min(1, ratio * 1.1).toFixed(2)})`);
      drawPixDisc(coreR, '#05020d');

      // 4. Front sweeping arc of tilted accretion disk (Gargantua pixel effect)
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2 + (1 - ratio) * 9 + b.seed;
        if (Math.sin(ang) <= 0) continue;
        const rx = snap(cx + Math.cos(ang) * diskRx);
        const ry = snap(cy + Math.sin(ang) * diskRy);
        ctx.fillStyle = i % 3 === 0 ? '#fef08a' : i % 2 === 0 ? '#facc15' : '#f472b6';
        ctx.fillRect(rx - 4, ry - 2, 8, 4);
      }
      ctx.fillStyle = `rgba(254, 240, 138, ${(ratio * 0.85).toFixed(2)})`;
      ctx.fillRect(cx - diskRx + 4, cy - 2, (diskRx - 4) * 2, 4);
    } else if (b.style === 'flame_jet') {
      const steps = 7;
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const fx = snap(b.x1 + (b.x2 - b.x1) * t);
        const fy = snap(b.y1 + (b.y2 - b.y1) * t + Math.sin(b.seed * 12 + i * 2) * 4);
        const sz = snap(6 + t * b.width * 1.35);
        ctx.globalAlpha = ratio * (1 - t * 0.45);
        ctx.fillStyle = t < 0.28 ? '#fef08a' : t < 0.68 ? '#f97316' : '#dc2626';
        ctx.fillRect(fx - sz / 2, fy - sz / 2, sz, sz);
        if (t < 0.45) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(fx - 2, fy - 2, 4, 4);
        }
      }
    } else {
      // Crisp stepped railgun, ion beam, or cosmic gravity beam
      const dx = b.x2 - b.x1;
      const dy = b.y2 - b.y1;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const stepCount = Math.max(2, Math.ceil(dist / 6));
      const outer = Math.max(4, snap(b.width * ratio + 4));
      const inner = Math.max(2, snap(b.width * 0.45 * ratio));

      ctx.globalAlpha = ratio;
      ctx.fillStyle = b.color;
      for (let i = 0; i <= stepCount; i++) {
        const t = i / stepCount;
        const bx = snap(b.x1 + dx * t);
        const by = snap(b.y1 + dy * t);
        ctx.fillRect(bx - outer / 2, by - outer / 2, outer, outer);
      }
      ctx.fillStyle = b.style === 'gravity_beam' ? '#fef08a' : '#ffffff';
      for (let i = 0; i <= stepCount; i++) {
        const t = i / stepCount;
        const bx = snap(b.x1 + dx * t);
        const by = snap(b.y1 + dy * t);
        ctx.fillRect(bx - inner / 2, by - inner / 2, inner, inner);
      }
    }

    ctx.restore();
  }
}

/** Pixel-art bombers, steampunk zeppelins & falling ultimate ordinance */
export function renderActiveUltimates(ctx: CanvasRenderingContext2D, ultimates: ActiveUltimate[]): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  for (const ult of ultimates) {
    if (ult.planes) {
      for (const plane of ult.planes) {
        const craftKey =
          plane.kind === 'zeppelin' ? `ult/zeppelin/${ult.team}` : `ult/bomber/${ult.team}`;
        drawSprite(ctx, craftKey, plane.x, plane.y, {
          scale: PIXEL_WORLD_SCALE,
          flipX: plane.dir === -1,
        });
      }
    }

    for (const ord of ult.fallingOrdinance) {
      if (ord.impacted) continue;

      if (ord.kind === 'meteor') {
        // Chunky pixel roaring comet tail
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          const sz = snap(6 + frac * 18);
          ctx.fillStyle = `rgba(234, 88, 12, ${(frac * 0.72).toFixed(2)})`;
          ctx.fillRect(snap(pt.x) - sz / 2, snap(pt.y) - sz / 2, sz, sz);
          const core = Math.max(4, snap(sz * 0.5));
          ctx.fillStyle = `rgba(253, 224, 71, ${(frac * 0.65).toFixed(2)})`;
          ctx.fillRect(snap(pt.x) - core / 2, snap(pt.y) - core / 2, core, core);
        }
        drawSprite(ctx, 'proj/meteor', ord.x, ord.y, {
          scale: PIXEL_WORLD_SCALE,
          rotation: ord.y * 0.04,
        });
      } else if (ord.kind === 'fire_arrows') {
        const a = Math.atan2(ord.vy, ord.vx);
        drawSprite(ctx, 'proj/fire_arrow', ord.x, ord.y, {
          scale: PIXEL_WORLD_SCALE,
          rotation: a,
        });
      } else if (ord.kind === 'tactical_missiles') {
        // Pixel target reticle on ground
        const tx = snap(ord.targetX);
        ctx.fillStyle = 'rgba(244, 63, 94, 0.88)';
        ctx.fillRect(tx - 24, GROUND_Y - 2, 48, 4);
        ctx.fillRect(tx - 2, GROUND_Y - 8, 4, 16);

        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          const sz = snap(4 + frac * 6);
          ctx.fillStyle = `rgba(241, 245, 249, ${(frac * 0.72).toFixed(2)})`;
          ctx.fillRect(snap(pt.x) - sz / 2, snap(pt.y) - sz / 2, sz, sz);
        }

        const a = Math.atan2(ord.vy, ord.vx);
        drawSprite(ctx, 'proj/cruise_missile', ord.x, ord.y, {
          scale: PIXEL_WORLD_SCALE,
          rotation: a,
        });
      } else {
        // Naval barrage shells & carpet bombs
        for (let i = 0; i < ord.trail.length; i++) {
          const pt = ord.trail[i];
          const frac = (i + 1) / ord.trail.length;
          const sz = snap(4 + frac * 4);
          ctx.fillStyle = `rgba(148, 163, 184, ${(frac * 0.6).toFixed(2)})`;
          ctx.fillRect(snap(pt.x) - sz / 2, snap(pt.y) - sz / 2, sz, sz);
        }
        const a = Math.atan2(ord.vy, ord.vx);
        drawSprite(ctx, 'proj/bomb', ord.x, ord.y, {
          scale: PIXEL_WORLD_SCALE,
          rotation: a,
        });
      }
    }
  }

  ctx.restore();
}

/** High-impact Metal-Slug pixel fireballs, arcade impact starbursts, shockwaves, dust waves & streaking sparks */
export function renderParticles(ctx: CanvasRenderingContext2D, particles: ParticleEntity[]): void {
  for (const p of particles) {
    const frac = Math.max(0, p.life / p.maxLife);
    const prog = 1 - frac;
    const px = snap(p.x);
    const py = snap(p.y);

    ctx.save();
    ctx.globalAlpha = Math.min(1, frac * 1.35) * p.alpha;

    if (p.shape === 'flash_star') {
      // Blinding 4-point + diagonal arcade impact starburst!
      const arm = Math.max(6, snap(p.size * (0.4 + frac * 0.9)));
      const diag = Math.max(4, snap(arm * 0.55));
      const core = Math.max(4, snap(arm * 0.34));
      ctx.fillStyle = p.color;
      ctx.fillRect(px - arm, py - 2, arm * 2, 4);
      ctx.fillRect(px - 2, py - arm, 4, arm * 2);
      ctx.fillRect(px - diag, py - diag, 4, 4);
      ctx.fillRect(px + diag - 4, py - diag, 4, 4);
      ctx.fillRect(px - diag, py + diag - 4, 4, 4);
      ctx.fillRect(px + diag - 4, py + diag - 4, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - core, py - core, core * 2, core * 2);
      ctx.fillRect(px - Math.round(arm * 0.6), py - 1, Math.round(arm * 1.2), 2);
      ctx.fillRect(px - 1, py - Math.round(arm * 0.6), 2, Math.round(arm * 1.2));
    } else if (p.shape === 'fireball') {
      // Multi-stage stepped circular Metal-Slug pixel explosion fireball (white -> gold -> orange -> charcoal)
      const r = Math.max(8, snap(p.size * (0.58 + prog * 0.78)));
      const outerCol = frac > 0.42 ? p.color : '#292524';
      const drawDisc = (cx: number, cy: number, rad: number, col: string) => {
        ctx.fillStyle = col;
        for (let dy = -rad; dy <= rad; dy += 4) {
          const hw = snap(Math.sqrt(Math.max(0, rad * rad - dy * dy)));
          if (hw >= 2) ctx.fillRect(cx - hw, cy + dy - 2, hw * 2, 4);
        }
      };

      drawDisc(px, py, r + 2, '#11131d');
      drawDisc(px, py, r, outerCol);

      if (frac > 0.25) {
        const midR = Math.max(4, snap(r * 0.72));
        drawDisc(px - 2, py - 2, midR, frac > 0.5 ? '#fde047' : '#f97316');
      }
      if (frac > 0.52) {
        const coreR = Math.max(4, snap(r * 0.42));
        drawDisc(px - 2, py - 2, coreR, '#ffffff');
      }
    } else if (p.shape === 'dust_wave') {
      // Horizontal ground shock-dust cloud skimming along GROUND_Y
      const w = Math.max(8, snap(p.size * (0.9 + prog * 1.2)));
      const h = Math.max(4, snap(p.size * 0.42 * frac + 2));
      ctx.fillStyle = p.color;
      ctx.fillRect(px - w / 2, py - h, w, h);
      ctx.fillRect(px - w / 2 + 4, py - h - 2, Math.max(4, w - 8), 2);
    } else if (p.shape === 'ring') {
      // Crisp dual-layer pixel shockwave octagon ring (outer accent + inner white glint)
      const r = snap(p.size);
      const pts = 20;
      const dot = Math.max(4, snap(6 * frac + 2));
      ctx.fillStyle = p.color;
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const rx = snap(px + Math.cos(a) * r);
        const ry = snap(py + Math.sin(a) * r);
        ctx.fillRect(rx - dot / 2, ry - dot / 2, dot, dot);
      }
      if (frac > 0.45) {
        const ir = Math.max(4, snap(r * 0.82));
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < pts; i += 2) {
          const a = (i / pts) * Math.PI * 2;
          const rx = snap(px + Math.cos(a) * ir);
          const ry = snap(py + Math.sin(a) * ir);
          ctx.fillRect(rx - 2, ry - 2, 4, 4);
        }
      }
    } else if (p.shape === 'smoke') {
      const sz = Math.max(4, snap(p.size * (1.55 - frac * 0.45)));
      ctx.fillStyle = p.color;
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      ctx.fillRect(px - sz / 2 + 2, py - sz / 2 - 2, Math.max(2, sz - 4), sz + 4);
      if (frac > 0.55) {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
        ctx.fillRect(px - sz / 2 + 2, py - sz / 2, Math.max(2, sz - 6), 4);
      }
    } else if (p.shape === 'debris') {
      const sz = Math.max(4, snap(p.size * 1.45));
      ctx.fillStyle = '#0c0f18';
      ctx.fillRect(px - sz / 2 - 2, py - sz / 2 - 2, sz + 4, sz + 4);
      ctx.fillStyle = p.color;
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(px - sz / 2, py - sz / 2, Math.max(2, sz - 2), 2);
    } else if (p.shape === 'spark') {
      // Streaking arcade velocity spark with white-hot leading tip + glowing tail!
      const sz = Math.max(2, snap(p.size * frac + 2));
      ctx.fillStyle = p.color;
      for (let s = 1; s <= 3; s++) {
        const tx = snap(p.x - p.vx * 0.011 * s);
        const ty = snap(p.y - p.vy * 0.011 * s);
        const ts = Math.max(2, sz - s);
        ctx.fillRect(tx - ts / 2, ty - ts / 2, ts, ts);
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    } else {
      const sz = Math.max(4, snap(p.size * (0.5 + frac * 0.6)));
      ctx.fillStyle = p.color;
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    }

    ctx.restore();
  }
}

/** Crisp spring-pop arcade damage numbers with fiery crit halos, coin icons, and strong dark outlines */
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

    // Crisp spring-pop scale overshoot in the first 0.14s!
    let popMult = 1;
    if (age < 0.07) {
      const t = age / 0.07;
      popMult = 0.75 + t * (isCrit ? 0.92 : 0.62);
    } else if (age < 0.18) {
      const t = (age - 0.07) / 0.11;
      popMult = (isCrit ? 1.67 : 1.37) - t * (isCrit ? 0.67 : 0.37);
    }

    const fontSize = Math.round(14 * pop.scale * popMult);
    const px = Math.round(pop.x);
    const py = Math.round(pop.y);

    ctx.globalAlpha = Math.min(1, frac * 1.75);
    ctx.font = `900 ${fontSize}px ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace`;

    // Fiery outer glow halo + pixel starburst behind CRIT & BASE damage hits!
    if (isCrit && frac > 0.25) {
      ctx.lineWidth = 6.5;
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.85)';
      ctx.strokeText(pop.text, px, py);

      // Tiny crisp pixel star glints flanking the crit number
      const halfW = Math.round(pop.text.length * fontSize * 0.34) + 6;
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px - halfW - 4, py - 1, 8, 2);
      ctx.fillRect(px - halfW - 1, py - 4, 2, 8);
      ctx.fillRect(px + halfW - 4, py - 1, 8, 2);
      ctx.fillRect(px + halfW - 1, py - 4, 2, 8);
    } else if (isBase) {
      ctx.lineWidth = 5.5;
      ctx.strokeStyle = 'rgba(185, 28, 28, 0.75)';
      ctx.strokeText(pop.text, px, py);
    }

    // Hard 2px arcade drop shadow for guaranteed contrast over busy pixel battles
    ctx.fillStyle = 'rgba(6, 8, 15, 0.98)';
    ctx.fillText(pop.text, px + 2, py + 2.5);

    ctx.lineWidth = isCrit ? 4.2 : 3.6;
    ctx.strokeStyle = '#090c14';
    ctx.strokeText(pop.text, px, py);

    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, px, py);

    // Tiny gleaming pixel gold coin badge next to kill gold popups!
    if (isGold) {
      const coinX = px - Math.round(pop.text.length * fontSize * 0.34) - 6;
      ctx.fillStyle = '#090c14';
      ctx.fillRect(coinX - 4, py - 4, 8, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(coinX - 3, py - 3, 6, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(coinX - 2, py - 2, 3, 3);
    }
  }

  ctx.restore();
}
