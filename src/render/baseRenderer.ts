import { getEra } from '../data/eras';
import type { FactionState, InstalledTurret, Team, TurretVisualKind } from '../data/types';
import {
  BASE_HALF_WIDTH,
  ENEMY_BASE_X,
  GROUND_Y,
  PLAYER_BASE_X,
  TURRET_MOUNT_OFFSETS,
} from '../game/constants';
import { PIXEL_WORLD_SCALE, drawSprite } from './spriteAtlas';

export function renderBase(
  ctx: CanvasRenderingContext2D,
  faction: FactionState,
  time: number,
  highlightSellMode = false,
): void {
  const baseX = faction.team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
  const dir = faction.team === 'player' ? 1 : -1;
  const era = getEra(faction.eraIndex);
  const hpRatio = faction.baseHp / Math.max(1, faction.baseMaxHp);
  const dmgStage = hpRatio <= 0.25 ? 'damaged_25' : hpRatio <= 0.5 ? 'damaged_50' : 'intact';

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(baseX), GROUND_Y);

  // Crisp stepped pixel ground contact shadow beneath fortress
  ctx.fillStyle = 'rgba(6, 9, 16, 0.45)';
  ctx.fillRect(-BASE_HALF_WIDTH - 10, -2, (BASE_HALF_WIDTH + 10) * 2, 6);
  ctx.fillRect(-BASE_HALF_WIDTH - 4, 4, (BASE_HALF_WIDTH + 4) * 2, 4);

  // Pixel evolution & gold-upgrade golden flash aura
  const auraFlash = Math.max(faction.evolveFlash, faction.upgradeFlash * 0.72);
  if (auraFlash > 0.02) {
    const pulseR = Math.round(74 + (1 - auraFlash) * 58);
    ctx.fillStyle = `rgba(254, 240, 138, ${(auraFlash * 0.32).toFixed(2)})`;
    ctx.fillRect(-pulseR, -116 - pulseR, pulseR * 2, pulseR * 2);
    ctx.fillStyle = `rgba(250, 204, 21, ${(auraFlash * 0.48).toFixed(2)})`;
    ctx.fillRect(-BASE_HALF_WIDTH - 6, -12, (BASE_HALF_WIDTH + 6) * 2, 12);
  }

  // Monumental 100x128px Pixel-Art Fortress Sprite (200x256 world units at 2x)
  const baseKey = `base/era_${faction.eraIndex}/${faction.team}/${dmgStage}`;
  const hitJolt = faction.baseHitFlash > 0.45 ? -dir * Math.round((faction.baseHitFlash - 0.45) * 8) : 0;
  const drawn = drawSprite(ctx, baseKey, hitJolt, 0, {
    scale: PIXEL_WORLD_SCALE,
    flipX: faction.team === 'enemy',
  });

  if (!drawn) {
    ctx.fillStyle = faction.team === 'player' ? '#1d4ed8' : '#b91c1c';
    ctx.fillRect(-BASE_HALF_WIDTH, -160, BASE_HALF_WIDTH * 2, 160);
  }

  // Animated rising pixel smoke & flames on damaged fortresses (<= 50% and <= 25% HP)
  if (hpRatio <= 0.5) {
    drawPixelDamageSmokeAndFire(ctx, hpRatio, time, dir);
  }

  // Crisp arcade impact flash & starburst on fortress front wall when hit
  if (faction.baseHitFlash > 0.08) {
    const f = faction.baseHitFlash;
    const fx = dir * 48;
    const fy = -74;
    ctx.fillStyle = `rgba(255, 244, 184, ${(f * 0.55).toFixed(2)})`;
    ctx.fillRect(fx - 28, -118, 56, 88);
    ctx.fillStyle = `rgba(255, 255, 255, ${(f * 0.78).toFixed(2)})`;
    const starR = Math.round(22 * f + 6);
    ctx.fillRect(fx - starR, fy - 3, starR * 2, 6);
    ctx.fillRect(fx - 3, fy - starR, 6, starR * 2);
  }

  // Render Pixel-Art Turret Platforms & Rotatable Pixel Turrets
  for (let i = 0; i < faction.turretSlots; i++) {
    const offset = TURRET_MOUNT_OFFSETS[i];
    const tx = Math.round(offset.dx * dir);
    const ty = Math.round(offset.dy);
    const turret = faction.turrets[i];

    // Armored pixel balcony shelf
    drawSprite(ctx, `turret/platform/${faction.team}`, tx, ty + 8, {
      scale: PIXEL_WORLD_SCALE,
      flipX: faction.team === 'enemy',
    });

    if (turret) {
      drawMountedTurret(ctx, tx, ty, turret, faction.team);
      if (highlightSellMode && faction.team === 'player') {
        const blink = Math.sin(time * 9) > 0;
        ctx.strokeStyle = blink ? '#facc15' : '#fef08a';
        ctx.lineWidth = 3;
        ctx.strokeRect(tx - 24, ty - 22, 48, 40);
      }
    } else {
      // Crisp pixel-dashed empty turret slot marker
      const slotCol =
        faction.team === 'player' ? 'rgba(96, 165, 250, 0.78)' : 'rgba(248, 113, 113, 0.42)';
      ctx.fillStyle = slotCol;
      for (let d = -12; d <= 10; d += 6) {
        ctx.fillRect(tx + d, ty - 14, 4, 2);
        ctx.fillRect(tx + d, ty + 2, 4, 2);
      }
      ctx.fillRect(tx - 12, ty - 12, 2, 14);
      ctx.fillRect(tx + 12, ty - 12, 2, 14);
    }
  }

  // Crisp In-World Pixel-Framed Fortress HP Bar with Delayed White Damage Trail!
  const barW = 148;
  const barH = 14;
  const barY = -268;
  const hpFrac = Math.max(0, Math.min(1, hpRatio));
  const trailFrac = Math.max(hpFrac, Math.min(1, faction.displayBaseHp / Math.max(1, faction.baseMaxHp)));
  const fillW = Math.round(barW * hpFrac);
  const trailW = Math.max(fillW, Math.round(barW * trailFrac));

  ctx.fillStyle = faction.baseHitFlash > 0.5 ? '#fde047' : '#090d16';
  ctx.fillRect(-barW / 2 - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(-barW / 2 - 2, barY - 2, barW + 4, 2);
  ctx.fillStyle = '#141c2b';
  ctx.fillRect(-barW / 2, barY, barW, barH);

  if (trailW > fillW) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-barW / 2 + fillW, barY, trailW - fillW, barH);
  }

  if (fillW > 0) {
    ctx.fillStyle = faction.team === 'player' ? '#1d4ed8' : '#b91c1c';
    ctx.fillRect(-barW / 2, barY, fillW, barH);
    ctx.fillStyle = faction.team === 'player' ? '#38bdf8' : '#fb923c';
    ctx.fillRect(-barW / 2, barY, fillW, 6);
  }

  ctx.font = '800 9.5px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0a0e18';
  ctx.fillText(
    `${era.roman} · ${Math.ceil(faction.baseHp).toLocaleString()} / ${faction.baseMaxHp.toLocaleString()}`,
    1,
    barY + barH / 2 + 1.5,
  );
  ctx.fillStyle = '#ffffff';
  ctx.fillText(
    `${era.roman} · ${Math.ceil(faction.baseHp).toLocaleString()} / ${faction.baseMaxHp.toLocaleString()}`,
    0,
    barY + barH / 2 + 0.5,
  );

  ctx.restore();
}

function drawPixelDamageSmokeAndFire(
  ctx: CanvasRenderingContext2D,
  hpRatio: number,
  time: number,
  dir: number,
): void {
  const severe = hpRatio <= 0.25;
  const puffs = severe ? 8 : 4;
  for (let i = 0; i < puffs; i++) {
    const phase = (time * (severe ? 1.15 : 0.85) + i * 0.37) % 1;
    const rawX = (-34 + ((i * 27) % 74) + Math.sin(time * 2.4 + i) * 8) * dir;
    const rawY = -88 - phase * (severe ? 112 : 82);
    const px = Math.round(rawX / 2) * 2;
    const py = Math.round(rawY / 2) * 2;
    const sz = Math.round(((severe ? 12 : 8) + phase * 18) / 2) * 2;

    ctx.fillStyle = `rgba(22, 24, 30, ${((1 - phase) * (severe ? 0.68 : 0.48)).toFixed(2)})`;
    ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
    ctx.fillStyle = `rgba(52, 58, 68, ${((1 - phase) * (severe ? 0.5 : 0.35)).toFixed(2)})`;
    ctx.fillRect(px - sz / 2 + 2, py - sz / 2 + 2, Math.max(4, sz - 6), Math.max(4, sz - 6));

    if (severe && i % 2 === 0) {
      const fy = Math.round((-76 - phase * 28) / 2) * 2;
      const fs = Math.round((10 * (1 - phase) + 4) / 2) * 2;
      ctx.fillStyle = `rgba(249, 115, 22, ${((1 - phase) * 0.92).toFixed(2)})`;
      ctx.fillRect(px - fs / 2, fy - fs / 2, fs, fs);
      ctx.fillStyle = `rgba(254, 240, 138, ${((1 - phase) * 0.95).toFixed(2)})`;
      ctx.fillRect(px - fs / 4, fy - fs / 4, Math.max(2, fs / 2), Math.max(2, fs / 2));
    }
  }
}

export function drawMountedTurret(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  turret: InstalledTurret,
  team: Team,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y));
  drawTurretArt(ctx, turret.turretId, team, turret.aimAngle, turret.recoil);
  ctx.restore();
}

export function drawTurretArt(
  ctx: CanvasRenderingContext2D,
  kind: TurretVisualKind,
  team: Team,
  aimAngle: number,
  recoil: number,
): void {
  const firing = recoil > 0.32;
  const key = `turret/${kind}/${team}/${firing ? 'fire' : 'idle'}`;
  const facingLeft = Math.cos(aimAngle) < 0;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const rx = -Math.cos(aimAngle) * recoil * 4;
  const ry = -Math.sin(aimAngle) * recoil * 4;
  drawSprite(ctx, key, rx, ry, {
    scale: PIXEL_WORLD_SCALE,
    rotation: aimAngle,
    flipY: facingLeft,
  });
  ctx.restore();
}
