import { getEra } from '../data/eras';
import type { FactionState, InstalledTurret, Team, TurretVisualKind } from '../data/types';
import {
  BASE_HALF_WIDTH,
  ENEMY_BASE_X,
  GROUND_Y,
  PLAYER_BASE_X,
  TURRET_MOUNT_OFFSETS,
} from '../game/constants';

const INK = '#121622';

export function renderBase(
  ctx: CanvasRenderingContext2D,
  faction: FactionState,
  time: number,
  highlightSellMode = false,
): void {
  const baseX = faction.team === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
  const dir = faction.team === 'player' ? 1 : -1;
  const accent = faction.team === 'player' ? '#2563eb' : '#dc2626';
  const shadeAccent = faction.team === 'player' ? '#1e3a8a' : '#7f1d1d';
  const glow = faction.team === 'player' ? '#38bdf8' : '#fb7185';
  const era = getEra(faction.eraIndex);

  ctx.save();
  ctx.translate(baseX, GROUND_Y);

  // Ground contact shadow beneath entire fortress
  ctx.fillStyle = 'rgba(6, 9, 16, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 3, BASE_HALF_WIDTH + 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Evolution golden shockwave aura
  if (faction.evolveFlash > 0.02) {
    const r = 105 + (1 - faction.evolveFlash) * 65;
    const grad = ctx.createRadialGradient(0, -90, 14, 0, -90, r);
    grad.addColorStop(0, `rgba(254, 240, 138, ${(faction.evolveFlash * 0.7).toFixed(2)})`);
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -90, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fortress architecture (mirrored for right-side enemy base)
  ctx.save();
  ctx.scale(dir, 1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawFortressByEra(ctx, faction.eraIndex, accent, shadeAccent, glow, time);

  // Explicit 50% and 25% HP Damage Stages: cracks, scorches, billowing smoke & flames!
  const hpRatio = faction.baseHp / Math.max(1, faction.baseMaxHp);
  if (hpRatio <= 0.5) {
    drawStructuralCracks(ctx, hpRatio <= 0.25);
    drawDamageSmokeAndFire(ctx, hpRatio, time);
  }

  // Localized impact flash on fortress front (never leaks onto sky/background)
  if (faction.baseHitFlash > 0.05) {
    const glowGrad = ctx.createRadialGradient(54, -72, 6, 54, -72, 78);
    glowGrad.addColorStop(0, `rgba(255, 242, 195, ${(faction.baseHitFlash * 0.7).toFixed(2)})`);
    glowGrad.addColorStop(1, 'rgba(255, 242, 195, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(54, -72, 78, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Render Heavy Reinforced Turret Platforms & Mounted Turrets
  for (let i = 0; i < faction.turretSlots; i++) {
    const offset = TURRET_MOUNT_OFFSETS[i];
    const tx = offset.dx * dir;
    const ty = offset.dy;
    const turret = faction.turrets[i];

    // Armored cel-shaded turret balcony platform
    ctx.fillStyle = faction.eraIndex >= 6 ? '#1e3a52' : '#475569';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx - 19, ty + 4, 38, 9, 2.5);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(tx - 18, ty + 9, 36, 3.5);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillRect(tx - 15, ty + 6, 30, 2.6);

    if (turret) {
      drawMountedTurret(ctx, tx, ty, turret, faction.team);
      if (highlightSellMode && faction.team === 'player') {
        const pulse = 0.55 + Math.sin(time * 7) * 0.35;
        ctx.strokeStyle = `rgba(250, 204, 21, ${pulse.toFixed(2)})`;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(tx, ty - 2, 23, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = faction.team === 'player' ? 'rgba(96, 165, 250, 0.65)' : 'rgba(248, 113, 113, 0.35)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(tx, ty - 4, 12.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Crisp In-World Fortress HP Bar & Era Tag (cleanly above spires/flags)
  const barW = 144;
  const barH = 13;
  const barY = -254;
  const hpFrac = Math.max(0, Math.min(1, faction.baseHp / Math.max(1, faction.baseMaxHp)));

  ctx.fillStyle = 'rgba(10, 15, 24, 0.9)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-barW / 2 - 2, barY - 2, barW + 4, barH + 4, 5);
  ctx.fill();
  ctx.stroke();

  const barGrad = ctx.createLinearGradient(-barW / 2, 0, barW / 2, 0);
  if (faction.team === 'player') {
    barGrad.addColorStop(0, '#1d4ed8');
    barGrad.addColorStop(1, '#38bdf8');
  } else {
    barGrad.addColorStop(0, '#dc2626');
    barGrad.addColorStop(1, '#fb923c');
  }
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(-barW / 2, barY, barW * hpFrac, barH, 3.5);
  ctx.fill();

  ctx.font = '800 9.5px system-ui, -apple-system, sans-serif';
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
  shadeAccent: string,
  glow: string,
  time: number,
): void {
  const hw = BASE_HALF_WIDTH + 6;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;

  switch (eraIndex) {
    case 0: {
      // ERA 1: Monumental Prehistoric Cavern Cliff, Giant Mammoth Skull Arch & Totem Poles
      ctx.fillStyle = '#6b5643';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 6, -158);
      ctx.lineTo(-26, -196);
      ctx.lineTo(38, -172);
      ctx.lineTo(hw - 8, -102);
      ctx.lineTo(hw, 0);
      ctx.closePath();
      ctx.fill();

      // Shaded lower-left rock face (2-tone cel)
      ctx.fillStyle = '#47372a';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 6, -158);
      ctx.lineTo(-32, -110);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();

      // Sunlit upper ridge highlight
      ctx.fillStyle = '#876f58';
      ctx.beginPath();
      ctx.moveTo(-hw + 14, -150);
      ctx.lineTo(-26, -192);
      ctx.lineTo(34, -168);
      ctx.lineTo(14, -98);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rock strata lines
      ctx.strokeStyle = 'rgba(20, 14, 10, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-64, -95);
      ctx.lineTo(4, -112);
      ctx.moveTo(-54, -55);
      ctx.lineTo(2, -62);
      ctx.stroke();

      // Deep shadowed cave entrance
      ctx.fillStyle = '#140f0c';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(40, 0, 42, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Twin colossal curved mammoth tusks & skull keystone
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9.5;
      ctx.beginPath();
      ctx.moveTo(4, -12);
      ctx.quadraticCurveTo(28, -66, 62, -48);
      ctx.stroke();
      ctx.strokeStyle = '#f5eedc';
      ctx.lineWidth = 5.6;
      ctx.stroke();

      // Skull keystone above cave mouth
      ctx.fillStyle = '#ede4cf';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(38, -48, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(32, -50, 4, 4);
      ctx.fillRect(41, -50, 4, 4);

      // Tribal War Totem with feathers
      ctx.fillStyle = '#5c3b1e';
      ctx.fillRect(-62, -210, 12, 72);
      ctx.strokeRect(-62, -210, 12, 72);
      ctx.fillStyle = accent;
      ctx.fillRect(-65, -198, 18, 18);
      ctx.strokeRect(-65, -198, 18, 18);

      // Flickering campfire hearth inside cave entrance
      const flicker = 0.72 + Math.sin(time * 13) * 0.22;
      ctx.fillStyle = `rgba(251, 146, 60, ${flicker.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(38, -10, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(38, -8, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 1: {
      // ERA 2: Grand Limestone Acropolis Temple & Bronze Braziers
      ctx.fillStyle = '#cfb78e';
      ctx.fillRect(-hw + 4, -138, hw * 1.88, 138);
      ctx.fillStyle = '#a88c62';
      ctx.fillRect(-hw + 4, -138, 36, 138);
      ctx.strokeRect(-hw + 4, -138, hw * 1.88, 138);

      // Stepped marble plinth
      ctx.fillStyle = '#b99d72';
      ctx.fillRect(-hw, -22, hw * 2, 22);
      ctx.strokeRect(-hw, -22, hw * 2, 22);

      // Upper Acropolis Sanctuary + Pediment Roof
      ctx.fillStyle = '#d8c39d';
      ctx.fillRect(-60, -192, 110, 56);
      ctx.strokeRect(-60, -192, 110, 56);

      ctx.fillStyle = '#a6885c';
      ctx.beginPath();
      ctx.moveTo(-72, -192);
      ctx.lineTo(-5, -218);
      ctx.lineTo(62, -192);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fluted Doric Columns
      for (let cx = -52; cx <= 44; cx += 24) {
        ctx.fillStyle = '#ebe0c5';
        ctx.fillRect(cx, -132, 12, 110);
        ctx.fillStyle = '#bfa67d';
        ctx.fillRect(cx + 8, -132, 4, 110);
        ctx.strokeRect(cx, -132, 12, 110);
      }

      // Grand arched temple gateway
      ctx.fillStyle = '#241a10';
      ctx.beginPath();
      ctx.arc(46, 0, 36, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Draped banners + blazing bronze brazier
      ctx.fillStyle = accent;
      ctx.fillRect(-38, -176, 26, 38);
      ctx.strokeRect(-38, -176, 26, 38);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-34, -144, 18, 4);
      const fire = 6 + Math.sin(time * 10) * 2;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-5, -203, fire, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 2: {
      // ERA 3: Monumental Medieval Stone Castle Keep with Masonry Blocks & Banners
      // Rear tall keep tower
      ctx.fillStyle = '#5c6b7e';
      ctx.fillRect(-74, -206, 94, 206);
      ctx.fillStyle = '#3f4b5c';
      ctx.fillRect(-74, -206, 26, 206);
      ctx.strokeRect(-74, -206, 94, 206);

      // Front barbican wall
      ctx.fillStyle = '#748499';
      ctx.fillRect(-hw + 4, -148, hw * 1.9, 148);
      ctx.fillStyle = '#536275';
      ctx.fillRect(-hw + 4, -148, 32, 148);
      ctx.strokeRect(-hw + 4, -148, hw * 1.9, 148);

      // Carved stone block masonry joints
      ctx.strokeStyle = 'rgba(18, 22, 34, 0.35)';
      ctx.lineWidth = 1.4;
      for (let my = -126; my <= -24; my += 24) {
        ctx.beginPath();
        ctx.moveTo(-hw + 6, my);
        ctx.lineTo(hw - 6, my);
        ctx.stroke();
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.2;

      // Crenelated battlements on both tiers
      ctx.fillStyle = '#94a3b8';
      for (let mx = -74; mx <= 70; mx += 22) {
        ctx.fillRect(mx, -162, 14, 16);
        ctx.strokeRect(mx, -162, 14, 16);
      }
      for (let mx = -74; mx <= 8; mx += 20) {
        ctx.fillRect(mx, -218, 13, 14);
        ctx.strokeRect(mx, -218, 13, 14);
      }

      // Iron-studded arched portcullis gate
      ctx.fillStyle = '#18202c';
      ctx.beginPath();
      ctx.arc(46, 0, 38, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      for (let gx = 18; gx <= 74; gx += 14) {
        ctx.beginPath();
        ctx.moveTo(gx, -34);
        ctx.lineTo(gx, 0);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(12, -16);
      ctx.lineTo(80, -16);
      ctx.stroke();

      // Heraldic wall tapestry + tall fluttering royal castle pennant
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.fillStyle = accent;
      ctx.fillRect(-56, -130, 28, 48);
      ctx.fillStyle = shadeAccent;
      ctx.fillRect(-42, -130, 14, 48);
      ctx.strokeRect(-56, -130, 28, 48);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-45, -122, 6, 30);
      ctx.fillRect(-52, -112, 20, 6);

      // Flagpole + waving banner
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-28, -238, 3.5, 24);
      const wave = Math.sin(time * 4.5) * 4.5;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-25, -236);
      ctx.lineTo(14, -228 + wave);
      ctx.lineTo(6, -221 + wave * 0.6);
      ctx.lineTo(14, -214 + wave);
      ctx.lineTo(-25, -216);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 3: {
      // ERA 4: Gunpowder Star-Fort Brick Bastion
      ctx.fillStyle = '#8a523e';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 12, -142);
      ctx.lineTo(hw - 12, -142);
      ctx.lineTo(hw, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#61382a';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 12, -142);
      ctx.lineTo(-42, -142);
      ctx.lineTo(-48, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Granite coping + upper citadel
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-hw + 8, -149, hw * 1.9, 10);
      ctx.strokeRect(-hw + 8, -149, hw * 1.9, 10);

      ctx.fillStyle = '#754434';
      ctx.fillRect(-66, -198, 102, 50);
      ctx.strokeRect(-66, -198, 102, 50);

      // Gun embrasures
      ctx.fillStyle = '#181412';
      for (let ex = -48; ex <= 18; ex += 26) {
        ctx.fillRect(ex, -118, 15, 20);
        ctx.strokeRect(ex, -118, 15, 20);
      }

      // Iron-banded oak bastion gate
      ctx.fillStyle = '#472c1a';
      ctx.fillRect(22, -64, 56, 64);
      ctx.strokeRect(22, -64, 56, 64);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(22, -48, 56, 5);
      ctx.fillRect(22, -22, 56, 5);

      // Tall regimental banner
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-16, -236, 3.5, 42);
      const wave = Math.sin(time * 4) * 3;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-13, -234);
      ctx.lineTo(24, -231 + wave);
      ctx.lineTo(24, -212 + wave);
      ctx.lineTo(-13, -215);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 4: {
      // ERA 5: Brutalist Reinforced Concrete WW Bunker Fortress
      ctx.fillStyle = '#656b62';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 14, -136);
      ctx.lineTo(hw - 18, -136);
      ctx.lineTo(hw, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#474c45';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 14, -136);
      ctx.lineTo(-34, -136);
      ctx.lineTo(-42, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Upper pillbox bunker with armored firing slit
      ctx.fillStyle = '#535950';
      ctx.fillRect(-70, -190, 108, 56);
      ctx.strokeRect(-70, -190, 108, 56);
      ctx.fillStyle = '#121512';
      ctx.fillRect(-56, -168, 80, 12);

      // Stacked sandbag parapet at base
      for (let s = 0; s < 5; s++) {
        ctx.fillStyle = '#a8966e';
        ctx.beginPath();
        ctx.ellipse(22 + s * 13, -7, 10, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Riveted blast door & team war stripe
      ctx.fillStyle = '#333935';
      ctx.fillRect(22, -68, 52, 58);
      ctx.strokeRect(22, -68, 52, 58);
      ctx.fillStyle = accent;
      ctx.fillRect(-60, -118, 38, 12);
      ctx.strokeRect(-60, -118, 38, 12);

      // Spinning radio radar mast
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-18, -190);
      ctx.lineTo(-18, -230);
      ctx.moveTo(-30, -220);
      ctx.lineTo(-6, -220);
      ctx.stroke();
      break;
    }

    case 5: {
      // ERA 6: Modern Armored Command HQ Complex
      ctx.fillStyle = '#475569';
      ctx.fillRect(-hw + 6, -144, hw * 1.9, 144);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-hw + 6, -144, 42, 144);
      ctx.strokeRect(-hw + 6, -144, hw * 1.9, 144);

      // Upper command tower with illuminated tactical glass
      ctx.fillStyle = '#5a6b82';
      ctx.fillRect(-70, -198, 114, 56);
      ctx.strokeRect(-70, -198, 114, 56);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-60, -178, 92, 18);
      ctx.fillStyle = glow;
      ctx.fillRect(-52, -173, 24, 8);
      ctx.fillRect(-20, -173, 24, 8);
      ctx.fillRect(12, -173, 14, 8);

      // Armored vehicle bay with hazard stripes
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(18, -74, 62, 74);
      ctx.strokeRect(18, -74, 62, 74);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(18, -79, 62, 5.5);

      ctx.fillStyle = accent;
      ctx.fillRect(-hw + 14, -134, 56, 10);
      ctx.strokeRect(-hw + 14, -134, 56, 10);

      // Satellite dish & blinking aviation beacon
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-18, -214, 15, Math.PI * 0.2, Math.PI * 0.95);
      ctx.stroke();
      ctx.fillStyle = Math.sin(time * 6) > 0 ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(-18, -222, 3.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default: {
      // ERA 7: Monumental Sci-Fi Titanium Citadel Spire with Energy Conduit & Levitating Ring
      ctx.fillStyle = '#243247';
      ctx.beginPath();
      ctx.moveTo(-hw, 0);
      ctx.lineTo(-hw + 14, -166);
      ctx.lineTo(-14, -212);
      ctx.lineTo(48, -174);
      ctx.lineTo(hw, 0);
      ctx.closePath();
      ctx.fill();

      // Angled cel-shaded titanium hull plates
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-66, -18);
      ctx.lineTo(-54, -168);
      ctx.lineTo(16, -194);
      ctx.lineTo(40, -18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-66, -18);
      ctx.lineTo(-54, -168);
      ctx.lineTo(-22, -174);
      ctx.lineTo(-28, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pulsing vertical plasma reactor conduit + armor ribs
      const pulse = 0.74 + Math.sin(time * 5) * 0.22;
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 18;
      ctx.fillStyle = glow;
      ctx.globalAlpha = pulse;
      ctx.fillRect(-18, -178, 14, 142);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-13.5, -174, 5, 134);
      ctx.restore();

      // Armored horizontal reactor clamps
      ctx.fillStyle = '#1e293b';
      for (let ry = -152; ry <= -60; ry += 32) {
        ctx.fillRect(-24, ry, 26, 5.5);
        ctx.strokeRect(-24, ry, 26, 5.5);
      }

      // Levitating glowing energy ring above spire (below HP bar at -244)
      const floatY = -222 + Math.sin(time * 3.2) * 3.5;
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.ellipse(-12, floatY, 28, 6.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Holographic unit deployment portal
      ctx.fillStyle = '#070c16';
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(29, -74);
      ctx.lineTo(72, -74);
      ctx.lineTo(80, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = glow;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      break;
    }
  }
}

/** Draws jagged structural cracks at <=50% HP and deep charred fissures at <=25% HP */
function drawStructuralCracks(ctx: CanvasRenderingContext2D, severe: boolean): void {
  ctx.save();
  // Charred impact stains
  ctx.fillStyle = severe ? 'rgba(15, 12, 10, 0.55)' : 'rgba(15, 12, 10, 0.32)';
  ctx.beginPath();
  ctx.arc(14, -84, severe ? 28 : 18, 0, Math.PI * 2);
  ctx.fill();
  if (severe) {
    ctx.beginPath();
    ctx.arc(-32, -136, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crack network #1 (appears at <= 50% HP)
  ctx.strokeStyle = '#0b0d12';
  ctx.lineWidth = severe ? 3 : 2.2;
  ctx.beginPath();
  ctx.moveTo(42, -124);
  ctx.lineTo(26, -102);
  ctx.lineTo(34, -84);
  ctx.lineTo(14, -64);
  ctx.lineTo(20, -40);
  ctx.moveTo(26, -102);
  ctx.lineTo(6, -94);
  ctx.lineTo(-8, -76);
  ctx.stroke();

  // Crack network #2 + glowing ember seams (appears at <= 25% HP)
  if (severe) {
    ctx.beginPath();
    ctx.moveTo(-48, -162);
    ctx.lineTo(-34, -138);
    ctx.lineTo(-42, -112);
    ctx.lineTo(-22, -88);
    ctx.lineTo(-28, -56);
    ctx.moveTo(-34, -138);
    ctx.lineTo(-10, -128);
    ctx.stroke();

    // Inner glowing orange fracture lines
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.72)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(26, -102);
    ctx.lineTo(34, -84);
    ctx.lineTo(14, -64);
    ctx.moveTo(-34, -138);
    ctx.lineTo(-42, -112);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDamageSmokeAndFire(ctx: CanvasRenderingContext2D, hpRatio: number, time: number): void {
  const severe = hpRatio <= 0.25;
  const puffs = severe ? 8 : 4;
  for (let i = 0; i < puffs; i++) {
    const phase = (time * (severe ? 1.1 : 0.8) + i * 0.37) % 1;
    const px = -34 + ((i * 27) % 78) + Math.sin(time * 2.2 + i) * 9;
    const py = -84 - phase * (severe ? 115 : 85);
    const radius = (severe ? 11 : 8) + phase * 20;

    ctx.fillStyle = `rgba(26, 26, 30, ${((1 - phase) * (severe ? 0.62 : 0.44)).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    if (severe && i % 2 === 0) {
      const fy = -72 - (phase * 30);
      ctx.fillStyle = `rgba(249, 115, 22, ${((1 - phase) * 0.85).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(px, fy, 8 * (1 - phase) + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(254, 240, 138, ${((1 - phase) * 0.9).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(px, fy + 2, 4 * (1 - phase) + 1.5, 0, Math.PI * 2);
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
  ctx.scale(1.18, 1.18);
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
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = 'round';

  // Cel-shaded armored pedestal mount
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.roundRect(-11, -3, 22, 8.5, 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.fillRect(-11, 1.5, 22, 4);
  ctx.stroke();

  const facingLeft = Math.cos(aimAngle) < 0;
  ctx.rotate(aimAngle);
  if (facingLeft) ctx.scale(1, -1);
  ctx.translate(-recoil * 4.5, 0);

  switch (kind) {
    case 'rock_dropper':
      ctx.fillStyle = '#8b572a';
      ctx.fillRect(-9, -6.5, 20, 10);
      ctx.strokeRect(-9, -6.5, 20, 10);
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(11, -2, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'bone_catapult':
      ctx.fillStyle = '#f2ead8';
      ctx.fillRect(-11, -4.5, 26, 7);
      ctx.strokeRect(-11, -4.5, 26, 7);
      ctx.fillStyle = '#7c4c24';
      ctx.beginPath();
      ctx.arc(15, -1, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'arrow_tower':
      ctx.fillStyle = '#c8963e';
      ctx.fillRect(-8, -5.5, 17, 11);
      ctx.strokeRect(-8, -5.5, 17, 11);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(10, 0, 9, -1.1, 1.1);
      ctx.stroke();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    case 'ballista':
      ctx.fillStyle = '#8b572a';
      ctx.fillRect(-12, -4, 28, 8);
      ctx.strokeRect(-12, -4, 28, 8);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(9, -13);
      ctx.lineTo(16, 0);
      ctx.lineTo(9, 13);
      ctx.stroke();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      break;
    case 'crossbow_bastion':
      ctx.fillStyle = '#748499';
      ctx.fillRect(-10, -6, 20, 12);
      ctx.strokeRect(-10, -6, 20, 12);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(6, -2.5, 17, 5);
      ctx.strokeRect(6, -2.5, 17, 5);
      break;
    case 'keep_trebuchet':
      ctx.fillStyle = '#6b4226';
      ctx.fillRect(-13, -5.5, 28, 9);
      ctx.strokeRect(-13, -5.5, 28, 9);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(15, -2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'musket_battery':
      ctx.fillStyle = '#8b572a';
      ctx.fillRect(-10, -7, 15, 14);
      ctx.strokeRect(-10, -7, 15, 14);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(4, -5.5, 20, 3.5);
      ctx.strokeRect(4, -5.5, 20, 3.5);
      ctx.fillRect(4, 2, 20, 3.5);
      ctx.strokeRect(4, 2, 20, 3.5);
      break;
    case 'fortress_cannon':
      ctx.fillStyle = '#d4a037';
      ctx.beginPath();
      ctx.moveTo(-11, -7.5);
      ctx.lineTo(22, -5);
      ctx.lineTo(22, 5);
      ctx.lineTo(-11, 7.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8f6519';
      ctx.fillRect(-10, 0, 31, 5);
      ctx.stroke();
      break;
    case 'mg_nest':
      ctx.fillStyle = '#5a6b4b';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, -3, 21, 6);
      ctx.strokeRect(5, -3, 21, 6);
      break;
    case 'howitzer_turret':
      ctx.fillStyle = '#4c5b3f';
      ctx.fillRect(-12, -8, 19, 16);
      ctx.strokeRect(-12, -8, 19, 16);
      ctx.fillStyle = '#334155';
      ctx.fillRect(6, -4.5, 24, 9);
      ctx.strokeRect(6, -4.5, 24, 9);
      break;
    case 'vulcan_ciws':
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(-2, -1, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.fillRect(5, -5.5, 21, 3);
      ctx.fillRect(5, -1.5, 21, 3);
      ctx.fillRect(5, 2.5, 21, 3);
      ctx.strokeRect(5, -5.5, 21, 11);
      break;
    case 'missile_pod':
      ctx.fillStyle = '#475569';
      ctx.fillRect(-11, -10, 24, 20);
      ctx.strokeRect(-11, -10, 24, 20);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, -8, 5, 4.5);
      ctx.fillRect(10, -2.2, 5, 4.5);
      ctx.fillRect(10, 3.5, 5, 4.5);
      break;
    case 'plasma_repeater':
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-11, -8, 22, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.fillRect(6, -3.5, 20, 7);
      ctx.strokeRect(6, -3.5, 20, 7);
      break;
    case 'ion_cannon':
      ctx.fillStyle = '#334155';
      ctx.fillRect(-13, -9, 24, 18);
      ctx.strokeRect(-13, -9, 24, 18);
      ctx.fillStyle = body;
      ctx.fillRect(-9, -6.5, 13, 13);
      ctx.fillStyle = accent;
      ctx.fillRect(8, -6, 24, 3.8);
      ctx.fillRect(8, 2.2, 24, 3.8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, -1.6, 20, 3.2);
      break;
  }

  ctx.restore();
}
