import { getEra } from '../data/eras';
import type { FactionState, InstalledTurret, Team, TurretVisualKind } from '../data/types';
import {
  BASE_HALF_WIDTH,
  ENEMY_BASE_X,
  GROUND_Y,
  PLAYER_BASE_X,
  TURRET_MOUNT_OFFSETS,
} from '../game/constants';

export function renderBase(
  ctx: CanvasRenderingContext2D,
  faction: FactionState,
  time: number,
  highlightSellMode = false,
): void {
  const baseX = faction.team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
  const dir = faction.team === 'player' ? 1 : -1;
  const accent = faction.team === 'player' ? '#2563eb' : '#dc2626';
  const glow = faction.team === 'player' ? '#38bdf8' : '#fb7185';
  const era = getEra(faction.eraIndex);

  ctx.save();
  ctx.translate(baseX, GROUND_Y);

  // Evolution golden aura
  if (faction.evolveFlash > 0.02) {
    const r = 95 + (1 - faction.evolveFlash) * 55;
    const grad = ctx.createRadialGradient(0, -80, 12, 0, -80, r);
    grad.addColorStop(0, `rgba(254, 240, 138, ${(faction.evolveFlash * 0.65).toFixed(2)})`);
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -80, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw fortress architecture flipped horizontally for enemy team
  ctx.save();
  ctx.scale(dir, 1);
  drawFortressByEra(ctx, faction.eraIndex, accent, glow, time);

  // Damage smoke & fire embers when damaged
  const hpRatio = faction.baseHp / Math.max(1, faction.baseMaxHp);
  if (hpRatio < 0.65) {
    drawDamageSmoke(ctx, hpRatio, time);
  }

  // Localized impact flash on fortress front (never paints over background)
  if (faction.baseHitFlash > 0.05) {
    const glowGrad = ctx.createRadialGradient(54, -64, 6, 54, -64, 72);
    glowGrad.addColorStop(0, `rgba(255, 240, 195, ${(faction.baseHitFlash * 0.65).toFixed(2)})`);
    glowGrad.addColorStop(1, 'rgba(255, 240, 195, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(54, -64, 72, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Render Turret Slot Pads & Mounted Turrets in world orientation
  for (let i = 0; i < faction.turretSlots; i++) {
    const offset = TURRET_MOUNT_OFFSETS[i];
    const tx = offset.dx * dir;
    const ty = offset.dy;
    const turret = faction.turrets[i];

    // Turret platform bracket
    ctx.fillStyle = faction.eraIndex >= 6 ? '#1e3a52' : '#334155';
    ctx.fillRect(tx - 16, ty + 4, 32, 7);
    ctx.fillStyle = accent;
    ctx.fillRect(tx - 14, ty + 6, 28, 2.5);

    if (turret) {
      drawMountedTurret(ctx, tx, ty, turret, faction.team);
      if (highlightSellMode && faction.team === 'player') {
        const pulse = 0.55 + Math.sin(time * 7) * 0.35;
        ctx.strokeStyle = `rgba(250, 204, 21, ${pulse.toFixed(2)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(tx, ty - 2, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Empty unlocked turret pad
      ctx.strokeStyle = faction.team === 'player' ? 'rgba(96, 165, 250, 0.55)' : 'rgba(248, 113, 113, 0.35)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(tx, ty - 3, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Crisp In-World Fortress HP Bar & Era Tag (positioned cleanly above tallest spire/flag)
  const barW = 136;
  const barH = 12;
  const barY = -236;
  const hpFrac = Math.max(0, Math.min(1, faction.baseHp / Math.max(1, faction.baseMaxHp)));

  ctx.fillStyle = 'rgba(10, 15, 24, 0.84)';
  ctx.beginPath();
  ctx.roundRect(-barW / 2 - 2, barY - 2, barW + 4, barH + 4, 5);
  ctx.fill();

  const barGrad = ctx.createLinearGradient(-barW / 2, 0, barW / 2, 0);
  if (faction.team === 'player') {
    barGrad.addColorStop(0, '#2563eb');
    barGrad.addColorStop(1, '#38bdf8');
  } else {
    barGrad.addColorStop(0, '#ef4444');
    barGrad.addColorStop(1, '#f97316');
  }
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(-barW / 2, barY, barW * hpFrac, barH, 3.5);
  ctx.fill();

  ctx.font = '700 9.5px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(
    `${era.roman} · ${Math.ceil(faction.baseHp).toLocaleString()} / ${faction.baseMaxHp.toLocaleString()}`,
    0,
    barY + barH / 2 + 0.5,
  );

  ctx.restore();
}

function drawFortressByEra(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  accent: string,
  glow: string,
  time: number,
): void {
  const hw = BASE_HALF_WIDTH;

  switch (eraIndex) {
    case 0: {
      // Era 1: Prehistoric Cave Cliff & Mammoth Tusks
      ctx.fillStyle = '#5c4b3b';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 8, -145);
      ctx.lineTo(-22, -182);
      ctx.lineTo(35, -162);
      ctx.lineTo(hw - 10, -96);
      ctx.lineTo(hw, 0);
      ctx.closePath();
      ctx.fill();

      // Lighter rock facet
      ctx.fillStyle = '#735f4c';
      ctx.beginPath();
      ctx.moveTo(-hw + 14, -140);
      ctx.lineTo(-22, -176);
      ctx.lineTo(26, -155);
      ctx.lineTo(10, -82);
      ctx.closePath();
      ctx.fill();

      // Dark cave mouth
      ctx.fillStyle = '#1b1410';
      ctx.beginPath();
      ctx.arc(38, 0, 38, Math.PI, 0);
      ctx.fill();

      // Curved mammoth tusks framing entrance
      ctx.strokeStyle = '#f5eedc';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(6, -10);
      ctx.quadraticCurveTo(28, -56, 56, -42);
      ctx.stroke();

      // Team war totem
      ctx.fillStyle = '#4a321f';
      ctx.fillRect(-56, -196, 10, 62);
      ctx.fillStyle = accent;
      ctx.fillRect(-58, -188, 14, 16);

      // Flickering campfire glow
      const flicker = 0.65 + Math.sin(time * 12) * 0.2;
      ctx.fillStyle = `rgba(251, 146, 60, ${flicker.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(34, -8, 12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 1: {
      // Era 2: Ancient Limestone Acropolis Temple
      ctx.fillStyle = '#c8b08a';
      ctx.fillRect(-hw + 4, -130, hw * 1.85, 130);
      ctx.fillStyle = '#b1966d';
      ctx.fillRect(-hw, -22, hw * 2, 22);

      // Upper temple sanctuary
      ctx.fillStyle = '#d4be98';
      ctx.fillRect(-58, -184, 104, 58);
      // Pediment triangular roof
      ctx.fillStyle = '#9c7f54';
      ctx.beginPath();
      ctx.moveTo(-66, -184);
      ctx.lineTo(-6, -206);
      ctx.lineTo(54, -184);
      ctx.closePath();
      ctx.fill();

      // Doric columns
      ctx.fillStyle = '#e5d4b3';
      for (let cx = -50; cx <= 42; cx += 23) {
        ctx.fillRect(cx, -124, 11, 102);
      }

      // Arched portal
      ctx.fillStyle = '#291e14';
      ctx.beginPath();
      ctx.arc(46, 0, 32, Math.PI, 0);
      ctx.fill();

      // Team banners & bronze brazier
      ctx.fillStyle = accent;
      ctx.fillRect(-34, -168, 22, 34);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(-6, -194, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 2: {
      // Era 3: Medieval Stone Castle Keep
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-hw + 4, -142, hw * 1.88, 142);
      // Tall rear keep tower
      ctx.fillStyle = '#475569';
      ctx.fillRect(-68, -194, 88, 194);

      // Battlement merlons
      ctx.fillStyle = '#94a3b8';
      for (let mx = -70; mx <= 70; mx += 22) {
        ctx.fillRect(mx, -154, 14, 14);
      }
      for (let mx = -68; mx <= 12; mx += 20) {
        ctx.fillRect(mx, -204, 12, 12);
      }

      // Iron portcullis arched gate
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(46, 0, 34, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      for (let gx = 20; gx <= 72; gx += 13) {
        ctx.beginPath();
        ctx.moveTo(gx, -30);
        ctx.lineTo(gx, 0);
        ctx.stroke();
      }

      // Fluttering castle banners
      const wave = Math.sin(time * 4.5) * 4;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-24, -204);
      ctx.lineTo(-24, -228);
      ctx.lineTo(8, -220 + wave);
      ctx.lineTo(-24, -212);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-52, -124, 24, 42);
      break;
    }

    case 3: {
      // Era 4: Gunpowder Star-Fort Brick Bastion
      ctx.fillStyle = '#7c4a38';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 12, -136);
      ctx.lineTo(hw - 12, -136);
      ctx.lineTo(hw, 0);
      ctx.closePath();
      ctx.fill();

      // Granite cap & upper command bastion
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-hw + 8, -142, hw * 1.88, 9);
      ctx.fillStyle = '#663c2d';
      ctx.fillRect(-62, -190, 96, 50);

      // Cannon embrasure windows
      ctx.fillStyle = '#1c1917';
      for (let ex = -44; ex <= 16; ex += 26) {
        ctx.fillRect(ex, -112, 14, 18);
      }

      // Heavy oak fortified gate
      ctx.fillStyle = '#3b2416';
      ctx.fillRect(24, -58, 52, 58);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(24, -44, 52, 4);

      // Royal standard flag
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-16, -228, 3, 42);
      ctx.fillStyle = accent;
      ctx.fillRect(-13, -226, 32, 18);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-13, -219, 32, 4);
      break;
    }

    case 4: {
      // Era 5: World War Reinforced Concrete Bunker
      ctx.fillStyle = '#575c55';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 14, -128);
      ctx.lineTo(hw - 20, -128);
      ctx.lineTo(hw, 0);
      ctx.closePath();
      ctx.fill();

      // Upper pillbox tier
      ctx.fillStyle = '#474c45';
      ctx.fillRect(-66, -182, 102, 56);
      // Dark observation slit
      ctx.fillStyle = '#141714';
      ctx.fillRect(-52, -162, 74, 10);

      // Sandbags along base front
      ctx.fillStyle = '#9c8c68';
      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        ctx.ellipse(26 + s * 14, -6, 9, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Steel blast door
      ctx.fillStyle = '#2c312e';
      ctx.fillRect(22, -62, 48, 56);
      ctx.fillStyle = accent;
      ctx.fillRect(-56, -114, 34, 10);

      // Radio antenna mast
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-18, -182);
      ctx.lineTo(-18, -224);
      ctx.stroke();
      break;
    }

    case 5: {
      // Era 6: Modern Military Command Complex
      ctx.fillStyle = '#334155';
      ctx.fillRect(-hw + 6, -138, hw * 1.88, 138);
      // Armored steel composite paneling
      ctx.fillStyle = '#475569';
      ctx.fillRect(-66, -190, 108, 56);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-56, -172, 86, 16);

      // Illuminated command windows
      ctx.fillStyle = glow;
      ctx.fillRect(-48, -168, 22, 7);
      ctx.fillRect(-18, -168, 22, 7);

      // Armored vehicle hanger bay
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(20, -68, 58, 68);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(20, -72, 58, 4);

      // Team trim + radar dish
      ctx.fillStyle = accent;
      ctx.fillRect(-hw + 12, -130, 52, 8);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-18, -206, 14, Math.PI * 0.2, Math.PI * 0.95);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-18, -214, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default: {
      // Era 7: Future Sci-Fi Titanium Citadel Spire
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 16, -156);
      ctx.lineTo(-12, -204);
      ctx.lineTo(44, -168);
      ctx.lineTo(hw, 0);
      ctx.closePath();
      ctx.fill();

      // White-titanium outer plating
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(-64, -22);
      ctx.lineTo(-52, -162);
      ctx.lineTo(14, -186);
      ctx.lineTo(36, -22);
      ctx.closePath();
      ctx.fill();

      // Pulsing vertical plasma conduit core
      const pulse = 0.72 + Math.sin(time * 5) * 0.25;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = glow;
      ctx.globalAlpha = pulse;
      ctx.fillRect(-18, -172, 12, 134);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Levitating energy halo above spire
      const floatY = -214 + Math.sin(time * 3.2) * 4;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(-12, floatY, 26, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Holographic gate portal
      ctx.fillStyle = '#090f1a';
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(30, -68);
      ctx.lineTo(68, -68);
      ctx.lineTo(76, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = glow;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
  }
}

function drawDamageSmoke(ctx: CanvasRenderingContext2D, hpRatio: number, time: number): void {
  const puffs = hpRatio < 0.35 ? 6 : 3;
  for (let i = 0; i < puffs; i++) {
    const phase = (time * 0.9 + i * 0.43) % 1;
    const px = -24 + ((i * 29) % 64) + Math.sin(time * 2 + i) * 8;
    const py = -80 - phase * 95;
    const radius = 8 + phase * 18;
    ctx.fillStyle = `rgba(30, 30, 34, ${((1 - phase) * 0.5).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    if (hpRatio < 0.35 && i % 2 === 0) {
      ctx.fillStyle = `rgba(251, 146, 60, ${((1 - phase) * 0.75).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(px, -74 - phase * 24, 6 * (1 - phase) + 2, 0, Math.PI * 2);
      ctx.fill();
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
  ctx.translate(x, y);
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
  const accent = team === 'player' ? '#38bdf8' : '#f87171';
  const body = team === 'player' ? '#2563eb' : '#dc2626';

  ctx.save();
  // Pedestal base
  ctx.fillStyle = '#475569';
  ctx.fillRect(-10, -3, 20, 8);

  // Rotate barrel/weapon toward aimAngle (mirror vertically if pointing left)
  const facingLeft = Math.cos(aimAngle) < 0;
  ctx.rotate(aimAngle);
  if (facingLeft) ctx.scale(1, -1);
  ctx.translate(-recoil * 4.5, 0);

  switch (kind) {
    case 'rock_dropper':
      ctx.fillStyle = '#784824';
      ctx.fillRect(-8, -6, 18, 9);
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(10, -2, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'bone_catapult':
      ctx.fillStyle = '#e7dfd1';
      ctx.fillRect(-10, -4, 24, 6);
      ctx.fillStyle = '#6b4226';
      ctx.beginPath();
      ctx.arc(14, -1, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'arrow_tower':
      ctx.fillStyle = '#b48a3e';
      ctx.fillRect(-7, -5, 16, 10);
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(9, 0, 8, -1.1, 1.1);
      ctx.stroke();
      break;
    case 'ballista':
      ctx.fillStyle = '#784824';
      ctx.fillRect(-11, -3.5, 26, 7);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(9, -12);
      ctx.lineTo(15, 0);
      ctx.lineTo(9, 12);
      ctx.stroke();
      break;
    case 'crossbow_bastion':
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-9, -5, 18, 10);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(6, -2, 16, 4);
      break;
    case 'keep_trebuchet':
      ctx.fillStyle = '#5c3a1d';
      ctx.fillRect(-12, -5, 26, 8);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(14, -2, 6.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'musket_battery':
      ctx.fillStyle = '#7c4a21';
      ctx.fillRect(-9, -6, 14, 12);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(4, -5, 18, 3);
      ctx.fillRect(4, 2, 18, 3);
      break;
    case 'fortress_cannon':
      ctx.fillStyle = '#b48a3e';
      ctx.beginPath();
      ctx.moveTo(-10, -7);
      ctx.lineTo(20, -4.5);
      ctx.lineTo(20, 4.5);
      ctx.lineTo(-10, 7);
      ctx.closePath();
      ctx.fill();
      break;
    case 'mg_nest':
      ctx.fillStyle = '#47553b';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(5, -2.5, 19, 5);
      break;
    case 'howitzer_turret':
      ctx.fillStyle = '#3f4c35';
      ctx.fillRect(-11, -7, 18, 14);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(6, -4, 22, 8);
      break;
    case 'vulcan_ciws':
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(-2, -1, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(5, -5, 19, 2.5);
      ctx.fillRect(5, -1, 19, 2.5);
      ctx.fillRect(5, 3, 19, 2.5);
      break;
    case 'missile_pod':
      ctx.fillStyle = '#334155';
      ctx.fillRect(-10, -9, 22, 18);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, -7, 4, 4);
      ctx.fillRect(10, -2, 4, 4);
      ctx.fillRect(10, 3, 4, 4);
      break;
    case 'plasma_repeater':
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-10, -7, 20, 14, 4);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.fillRect(6, -3, 18, 6);
      break;
    case 'ion_cannon':
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, -8, 22, 16);
      ctx.fillStyle = body;
      ctx.fillRect(-8, -6, 12, 12);
      ctx.fillStyle = accent;
      ctx.fillRect(8, -5, 22, 3);
      ctx.fillRect(8, 2, 22, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, -1.5, 18, 3);
      break;
  }

  ctx.restore();
}
