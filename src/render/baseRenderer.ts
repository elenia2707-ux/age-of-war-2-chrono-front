import { getEra } from '../data/eras';
import type { FactionState, InstalledTurret, Team, TurretVisualKind } from '../data/types';
import {
  BASE_HALF_WIDTH,
  ENEMY_BASE_X,
  GROUND_Y,
  PLAYER_BASE_X,
  TURRET_MOUNT_OFFSETS,
} from '../game/constants';
import {
  INK,
  drawCartoonMuzzleFlash,
  drawCelEllipse,
  drawCelPoly,
  drawCelRoundRect,
  drawEnergyOrb,
  getTeamPalette,
  setInkStyle,
} from './cartoonPrimitives';

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
  const pal = getTeamPalette(faction.team);

  ctx.save();
  ctx.translate(baseX, GROUND_Y);

  // Soft wide oval contact shadow beneath fortress
  ctx.fillStyle = 'rgba(8, 12, 22, 0.38)';
  ctx.beginPath();
  ctx.ellipse(0, 3, BASE_HALF_WIDTH + 18, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Golden evolution / upgrade celebration glow aura
  const auraFlash = Math.max(faction.evolveFlash, faction.upgradeFlash * 0.72);
  if (auraFlash > 0.02) {
    const grad = ctx.createRadialGradient(0, -108, 16, 0, -108, 150 + (1 - auraFlash) * 45);
    grad.addColorStop(0, `rgba(254, 240, 138, ${(auraFlash * 0.55).toFixed(2)})`);
    grad.addColorStop(0.6, `rgba(250, 204, 21, ${(auraFlash * 0.25).toFixed(2)})`);
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -108, 195, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fortress body (drawn facing +X, flipped horizontally for enemy!)
  const hitJolt = faction.baseHitFlash > 0.45 ? -dir * (faction.baseHitFlash - 0.45) * 7 : 0;
  ctx.save();
  ctx.translate(hitJolt, 0);
  if (faction.team === 'enemy') {
    ctx.scale(-1, 1);
  }
  drawEraFortress(ctx, faction.eraIndex, pal, time, hpRatio);
  if (hpRatio <= 0.5) {
    drawFortressCracks(ctx, hpRatio);
  }
  ctx.restore();

  // Rising smooth cartoon smoke puffs & flames when fortress is damaged (<=50% / <=25%)
  if (hpRatio <= 0.5) {
    drawCartoonDamageSmokeAndFire(ctx, hpRatio, time, dir);
  }

  // Crisp comic hit starburst on fortress front gate when struck
  if (faction.baseHitFlash > 0.08) {
    const f = faction.baseHitFlash;
    const fx = dir * 56;
    const fy = -68;
    drawCartoonMuzzleFlash(ctx, fx, fy, 18 * f + 7, '#f97316', '#fef08a');
  }

  // Render Armored Cartoon Turret Platforms & Rotating Turrets
  for (let i = 0; i < faction.turretSlots; i++) {
    const offset = TURRET_MOUNT_OFFSETS[i];
    const tx = offset.dx * dir;
    const ty = offset.dy;
    const turret = faction.turrets[i];

    drawTurretPlatform(ctx, tx, ty + 9, pal, dir);

    if (turret) {
      drawMountedTurret(ctx, tx, ty, turret, faction.team);
      if (highlightSellMode && faction.team === 'player') {
        const blink = Math.sin(time * 9) > 0;
        ctx.save();
        ctx.strokeStyle = blink ? '#facc15' : '#fef08a';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.roundRect(tx - 24, ty - 22, 48, 40, 8);
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Dashed glowing empty turret slot indicator
      ctx.save();
      ctx.strokeStyle =
        faction.team === 'player' ? 'rgba(96, 165, 250, 0.85)' : 'rgba(248, 113, 113, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(tx - 15, ty - 16, 30, 20, 5);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Crisp Cel-Framed Overhead Fortress HP Bar with Delayed White Drain Trail
  const barW = 152;
  const barH = 15;
  const barY = -262;
  const hpFrac = Math.max(0, Math.min(1, hpRatio));
  const trailFrac = Math.max(hpFrac, Math.min(1, faction.displayBaseHp / Math.max(1, faction.baseMaxHp)));
  const fillW = barW * hpFrac;
  const trailW = Math.max(fillW, barW * trailFrac);

  ctx.fillStyle = '#141c2b';
  ctx.beginPath();
  ctx.roundRect(-barW / 2, barY, barW, barH, 5);
  ctx.fill();

  if (trailW > fillW + 0.5) {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-barW / 2 + fillW, barY, trailW - fillW, barH, 3);
    ctx.fill();
  }

  if (fillW > 0.5) {
    const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
    if (faction.team === 'player') {
      grad.addColorStop(0, '#60a5fa');
      grad.addColorStop(0.55, '#2563eb');
      grad.addColorStop(1, '#1d4ed8');
    } else {
      grad.addColorStop(0, '#fb923c');
      grad.addColorStop(0.55, '#ef4444');
      grad.addColorStop(1, '#b91c1c');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-barW / 2, barY, fillW, barH, 4);
    ctx.fill();
  }

  setInkStyle(ctx, 2.2, faction.baseHitFlash > 0.5 ? '#fde047' : INK);
  ctx.beginPath();
  ctx.roundRect(-barW / 2, barY, barW, barH, 5);
  ctx.stroke();

  ctx.font = '800 9.5px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = `${era.roman} · ${Math.ceil(faction.baseHp).toLocaleString()} / ${faction.baseMaxHp.toLocaleString()}`;
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = INK;
  ctx.strokeText(label, 0, barY + barH / 2 + 0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 0, barY + barH / 2 + 0.5);

  ctx.restore();
}

function drawTurretPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pal: ReturnType<typeof getTeamPalette>,
  dir: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  // Support bracket underneath balcony
  drawCelPoly(
    ctx,
    [
      [-18, 3],
      [18, 3],
      [10 * dir, 14],
      [-14 * dir, 14],
    ],
    '#334155',
    { shadow: '#0f172a', lineWidth: 1.9 },
  );
  // Top steel & team-trimmed turret ledge
  drawCelRoundRect(ctx, -21, -4, 42, 8, 3, '#64748b', {
    highlight: '#cbd5e1',
    shadow: '#334155',
    lineWidth: 2.0,
  });
  ctx.fillStyle = pal.main;
  ctx.fillRect(-16, -1.5, 32, 3);
  ctx.restore();
}

function drawTeamFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pal: ReturnType<typeof getTeamPalette>,
  time: number,
): void {
  const wave = Math.sin(time * 4.2) * 3.0;
  setInkStyle(ctx, 2.8, '#78350f');
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 26);
  ctx.stroke();
  drawCelEllipse(ctx, x, y - 27, 2.8, 2.8, '#facc15', { highlight: '#fef08a', lineWidth: 1.4 });

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + 1, y - 25);
  ctx.quadraticCurveTo(x + 13, y - 27 + wave, x + 24, y - 21 + wave);
  ctx.lineTo(x + 19, y - 16 + wave * 0.7);
  ctx.lineTo(x + 24, y - 11 + wave);
  ctx.quadraticCurveTo(x + 12, y - 12 + wave * 0.5, x + 1, y - 10);
  ctx.closePath();
  ctx.fillStyle = pal.main;
  ctx.fill();
  setInkStyle(ctx, 1.8);
  ctx.stroke();
  ctx.restore();
}

// ============================================================================
// 10 MONUMENTAL CARTOON ERA FORTRESSES (facing +X, origin bottom-center)
// ============================================================================
function drawEraFortress(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  pal: ReturnType<typeof getTeamPalette>,
  time: number,
  _hpRatio: number,
): void {
  switch (eraIndex) {
    case 0: {
      // Era 1: Prehistoric Giant Mammoth-Skull Cave & Totem Mound
      drawCelPoly(
        ctx,
        [
          [-88, 0],
          [-84, -142],
          [-56, -196],
          [8, -206],
          [56, -162],
          [82, -76],
          [86, 0],
        ],
        '#785942',
        { highlight: '#a17c5b', shadow: '#4a3525', lineWidth: 2.8 },
      );
      // Grassy moss top cap
      drawCelPoly(
        ctx,
        [
          [-68, -172],
          [-48, -202],
          [12, -210],
          [46, -176],
          [20, -168],
          [-26, -178],
        ],
        '#4d7c0f',
        { highlight: '#84cc16', lineWidth: 2.2 },
      );
      // Giant Stone Archway Cave Entrance
      drawCelPoly(
        ctx,
        [
          [16, 0],
          [18, -68],
          [48, -82],
          [74, -64],
          [78, 0],
        ],
        '#1c1917',
        { lineWidth: 2.6 },
      );
      // Mammoth tusks framing entrance!
      drawCelPoly(
        ctx,
        [
          [16, -42],
          [6, -78],
          [24, -92],
          [24, -64],
        ],
        '#fef3c7',
        { highlight: '#ffffff', lineWidth: 2.0 },
      );
      drawCelPoly(
        ctx,
        [
          [72, -38],
          [86, -72],
          [70, -88],
          [66, -60],
        ],
        '#fef3c7',
        { highlight: '#ffffff', lineWidth: 2.0 },
      );
      // Team wooden palisade logs & fluttering tribal totem banner
      for (let i = 0; i < 4; i++) {
        drawCelRoundRect(ctx, -78 + i * 16, -72, 13, 72, 4, '#78350f', { highlight: '#b45309', lineWidth: 2.0 });
      }
      drawTeamFlag(ctx, -20, -204, pal, time);
      break;
    }

    case 1: {
      // Era 2: Golden Giza Pyramid Temple Fortress & Obelisk
      // Rear golden obelisk tower
      drawCelPoly(
        ctx,
        [
          [-78, 0],
          [-74, -202],
          [-60, -228],
          [-46, -202],
          [-42, 0],
        ],
        '#d97706',
        { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.6 },
      );
      drawCelPoly(
        ctx,
        [
          [-74, -202],
          [-60, -228],
          [-46, -202],
        ],
        '#facc15',
        { highlight: '#ffffff', lineWidth: 2.1 },
      );
      // Stepped sandstone temple pyramid body
      drawCelPoly(
        ctx,
        [
          [-82, 0],
          [-48, -192],
          [28, -192],
          [84, 0],
        ],
        '#eab308',
        { highlight: '#fef08a', shadow: '#a16207', lineWidth: 2.8 },
      );
      // Horizontal sandstone tiers
      setInkStyle(ctx, 1.8, '#92400e');
      for (let y = -40; y >= -160; y -= 32) {
        const shrink = (-y / 192) * 38;
        ctx.beginPath();
        ctx.moveTo(-80 + shrink * 0.85, y);
        ctx.lineTo(82 - shrink * 1.4, y);
        ctx.stroke();
      }
      // Royal turquoise/team temple pylon portal
      drawCelPoly(
        ctx,
        [
          [6, 0],
          [14, -92],
          [76, -92],
          [84, 0],
        ],
        pal.main,
        { highlight: pal.light, shadow: pal.dark, lineWidth: 2.5 },
      );
      drawCelRoundRect(ctx, 26, -68, 40, 68, 6, '#1e1b4b', { lineWidth: 2.4 });
      drawEnergyOrb(ctx, 46, -84, 8, '#facc15', '#ffffff');
      drawTeamFlag(ctx, -10, -192, pal, time);
      break;
    }

    case 2: {
      // Era 3: Classical Marble Acropolis Citadel
      drawCelRoundRect(ctx, -84, -184, 134, 184, 5, '#e2e8f0', {
        highlight: '#ffffff',
        shadow: '#94a3b8',
        lineWidth: 2.7,
      });
      // Classical triangular pediment roof with gold trim
      drawCelPoly(
        ctx,
        [
          [-92, -182],
          [-17, -226],
          [58, -182],
        ],
        pal.main,
        { highlight: pal.light, shadow: pal.dark, lineWidth: 2.6 },
      );
      drawCelPoly(
        ctx,
        [
          [-74, -186],
          [-17, -216],
          [40, -186],
        ],
        '#f8fafc',
        { lineWidth: 1.8 },
      );
      // Fluted marble columns
      for (let i = 0; i < 4; i++) {
        drawCelRoundRect(ctx, -74 + i * 32, -172, 14, 152, 2, '#f8fafc', {
          highlight: '#ffffff',
          shadow: '#cbd5e1',
          lineWidth: 1.9,
        });
      }
      // Forward bastion gatehouse
      drawCelRoundRect(ctx, 18, -106, 66, 106, 4, '#cbd5e1', {
        highlight: '#f8fafc',
        shadow: '#64748b',
        lineWidth: 2.6,
      });
      drawCelRoundRect(ctx, 32, -66, 38, 66, 18, '#1e293b', { lineWidth: 2.4 });
      drawTeamFlag(ctx, -17, -226, pal, time);
      break;
    }

    case 3: {
      // Era 4: Gothic Medieval Stone Castle Keep!
      // Tall rear keep spire with conical team roof
      drawCelRoundRect(ctx, -82, -186, 68, 186, 4, '#64748b', {
        highlight: '#94a3b8',
        shadow: '#334155',
        lineWidth: 2.7,
      });
      drawCelPoly(
        ctx,
        [
          [-88, -184],
          [-48, -226],
          [-8, -184],
        ],
        pal.main,
        { highlight: pal.light, shadow: pal.dark, lineWidth: 2.5 },
      );
      // Main crenellated castle curtain wall & front tower
      drawCelRoundRect(ctx, -28, -158, 110, 158, 4, '#94a3b8', {
        highlight: '#cbd5e1',
        shadow: '#475569',
        lineWidth: 2.7,
      });
      // Subtle stylized masonry blocks
      ctx.fillStyle = 'rgba(30, 41, 59, 0.22)';
      ctx.fillRect(-70, -142, 22, 10);
      ctx.fillRect(-44, -108, 20, 10);
      ctx.fillRect(24, -132, 26, 10);
      ctx.fillRect(46, -104, 24, 10);
      // Castle battlements (crenellations)
      for (let i = 0; i < 5; i++) {
        drawCelRoundRect(ctx, -28 + i * 23, -172, 15, 16, 2, '#cbd5e1', { lineWidth: 2.0 });
      }
      // Iron portcullis arched gate!
      drawCelRoundRect(ctx, 26, -74, 46, 74, 22, '#1c1917', { lineWidth: 2.6 });
      setInkStyle(ctx, 2.2, '#64748b');
      for (let gx = 34; gx <= 64; gx += 10) {
        ctx.beginPath();
        ctx.moveTo(gx, -68);
        ctx.lineTo(gx, -2);
        ctx.stroke();
      }
      // Hanging heraldic banner
      drawCelPoly(
        ctx,
        [
          [-10, -138],
          [14, -138],
          [14, -92],
          [2, -80],
          [-10, -92],
        ],
        pal.main,
        { highlight: pal.light, lineWidth: 2.0 },
      );
      drawTeamFlag(ctx, -48, -226, pal, time);
      break;
    }

    case 4: {
      // Era 5: Brick Renaissance Star-Fort Bastion
      drawCelPoly(
        ctx,
        [
          [-86, 0],
          [-82, -192],
          [18, -192],
          [42, -132],
          [84, -120],
          [88, 0],
        ],
        '#9a3412',
        { highlight: '#c2410c', shadow: '#7c2d12', lineWidth: 2.8 },
      );
      // Cream stone corner quoins & horizontal cornice
      drawCelRoundRect(ctx, -86, -198, 108, 14, 3, '#e7e5e4', { highlight: '#ffffff', lineWidth: 2.3 });
      drawCelRoundRect(ctx, 14, -128, 72, 12, 3, '#e7e5e4', { highlight: '#ffffff', lineWidth: 2.2 });
      // Team mansard roof dome
      drawCelPoly(
        ctx,
        [
          [-78, -198],
          [-64, -228],
          [4, -228],
          [16, -198],
        ],
        pal.dark,
        { highlight: pal.main, lineWidth: 2.4 },
      );
      // Heavy timber double bastion doors with brass studs
      drawCelRoundRect(ctx, 28, -76, 48, 76, 10, '#5c3412', { highlight: '#854d0e', lineWidth: 2.5 });
      drawTeamFlag(ctx, -30, -228, pal, time);
      break;
    }

    case 5: {
      // Era 6: Steampunk Copper Clockwork Foundry
      // Smoking twin factory chimneys
      drawCelRoundRect(ctx, -74, -234, 20, 74, 3, '#475569', { highlight: '#94a3b8', lineWidth: 2.4 });
      drawCelRoundRect(ctx, -44, -222, 18, 62, 3, '#475569', { highlight: '#94a3b8', lineWidth: 2.3 });
      // Rising cartoon steam clouds
      const p1 = (time * 0.7) % 1;
      drawCelEllipse(ctx, -64 + p1 * 18, -242 - p1 * 28, 10 + p1 * 8, 7 + p1 * 5, 'rgba(226,232,240,0.65)', {
        lineWidth: 1.5,
      });
      // Main riveted copper & iron foundry hall
      drawCelRoundRect(ctx, -84, -182, 152, 182, 8, '#b45309', {
        highlight: '#f59e0b',
        shadow: '#78350f',
        lineWidth: 2.8,
      });
      // Spinning huge golden clockwork gear on facade!
      ctx.save();
      ctx.translate(-34, -118);
      ctx.rotate(time * 0.7);
      drawCelEllipse(ctx, 0, 0, 26, 26, '#facc15', { highlight: '#fef08a', shadow: '#b45309', lineWidth: 2.2 });
      drawCelEllipse(ctx, 0, 0, 12, 12, '#1e293b', { lineWidth: 2.0 });
      ctx.restore();
      // Armored steel sliding gate + team trim
      drawCelRoundRect(ctx, 18, -94, 66, 94, 6, '#334155', { highlight: '#64748b', lineWidth: 2.6 });
      drawCelRoundRect(ctx, 30, -72, 42, 72, 6, '#0f172a', { lineWidth: 2.4 });
      drawCelRoundRect(ctx, -84, -184, 152, 14, 3, pal.main, { highlight: pal.light, lineWidth: 2.1 });
      drawTeamFlag(ctx, 12, -184, pal, time);
      break;
    }

    case 6: {
      // Era 7: Reinforced World War Concrete Command Bunker
      // Radar / radio tower mast on roof
      setInkStyle(ctx, 2.6, '#334155');
      ctx.beginPath();
      ctx.moveTo(-48, -172);
      ctx.lineTo(-34, -234);
      ctx.lineTo(-20, -172);
      ctx.stroke();
      // Heavy sloped brutalist concrete bunker
      drawCelPoly(
        ctx,
        [
          [-88, 0],
          [-80, -176],
          [28, -176],
          [56, -124],
          [84, -92],
          [88, 0],
        ],
        '#64748b',
        { highlight: '#94a3b8', shadow: '#334155', lineWidth: 2.8 },
      );
      // Slit pillbox observation windows
      drawCelRoundRect(ctx, -64, -154, 72, 14, 3, '#0f172a', { lineWidth: 2.2 });
      // Team painted stripe + sandbag berm at base
      drawCelRoundRect(ctx, -78, -126, 122, 12, 2, pal.main, { highlight: pal.light, lineWidth: 1.9 });
      drawCelRoundRect(ctx, 26, -74, 48, 74, 4, '#1e293b', { lineWidth: 2.5 });
      for (let i = 0; i < 4; i++) {
        drawCelEllipse(ctx, -72 + i * 22, -6, 13, 7, '#a16207', { highlight: '#ca8a04', lineWidth: 1.8 });
      }
      drawTeamFlag(ctx, -34, -232, pal, time);
      break;
    }

    case 7: {
      // Era 8: Modern Reinforced Tactical Command HQ with Rotating Radar Dish!
      drawCelRoundRect(ctx, -84, -196, 124, 196, 6, '#475569', {
        highlight: '#94a3b8',
        shadow: '#1e293b',
        lineWidth: 2.8,
      });
      // Modern armored angled annex + hangar door
      drawCelPoly(
        ctx,
        [
          [8, 0],
          [16, -128],
          [78, -110],
          [86, 0],
        ],
        '#334155',
        { highlight: '#64748b', shadow: '#0f172a', lineWidth: 2.7 },
      );
      // Glowing command room glass windows
      drawCelRoundRect(ctx, -68, -176, 86, 22, 4, '#38bdf8', { highlight: '#ffffff', lineWidth: 2.2 });
      drawCelRoundRect(ctx, -76, -138, 102, 12, 3, pal.main, { highlight: pal.light, lineWidth: 2.0 });
      // Spinning radar dish mounted on armored roof mast!
      drawCelRoundRect(ctx, -40, -214, 12, 20, 2, '#334155', { highlight: '#64748b', lineWidth: 2.0 });
      const sway = Math.sin(time * 2.2) * 0.25;
      ctx.save();
      ctx.translate(-34, -218);
      ctx.rotate(sway);
      drawCelEllipse(ctx, 0, 0, 22, 11, '#cbd5e1', { highlight: '#ffffff', lineWidth: 2.2 });
      drawEnergyOrb(ctx, 0, -6, 4.5, '#4ade80', '#ffffff');
      ctx.restore();
      // Blast hangar bay door
      drawCelRoundRect(ctx, 26, -78, 50, 78, 4, '#0f172a', { lineWidth: 2.5 });
      drawCelRoundRect(ctx, 26, -78, 50, 10, 2, '#facc15', { lineWidth: 1.6 });
      break;
    }

    case 8: {
      // Era 9: Sci-Fi Titanium Cyberpunk Arcology Core!
      drawCelPoly(
        ctx,
        [
          [-86, 0],
          [-74, -206],
          [-26, -238],
          [22, -206],
          [66, -126],
          [86, 0],
        ],
        '#e2e8f0',
        { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.8 },
      );
      // Sleek vertical glowing plasma core conduit!
      drawCelRoundRect(ctx, -40, -208, 26, 178, 8, '#0f172a', { lineWidth: 2.4 });
      const pulse = 0.78 + Math.sin(time * 4.5) * 0.22;
      ctx.save();
      ctx.globalAlpha = pulse;
      drawCelRoundRect(ctx, -34, -200, 14, 162, 6, pal.glow, { highlight: '#ffffff', lineWidth: 1.6 });
      ctx.restore();
      // Team armor trim chevron
      drawCelRoundRect(ctx, -72, -166, 92, 14, 4, pal.main, { highlight: pal.light, lineWidth: 2.0 });
      // Glowing holographic forcefield portal
      drawCelPoly(
        ctx,
        [
          [24, 0],
          [32, -82],
          [74, -82],
          [82, 0],
        ],
        '#0f172a',
        { lineWidth: 2.6 },
      );
      ctx.fillStyle = pal.glowSoft;
      ctx.fillRect(34, -76, 38, 72);
      break;
    }

    default: {
      // Era 10: Interstellar Obsidian-Gold Cosmic Nexus with Levitating Singularity Crystal!
      drawCelPoly(
        ctx,
        [
          [-88, 0],
          [-68, -196],
          [-18, -228],
          [36, -184],
          [84, -92],
          [88, 0],
        ],
        '#1e1b4b',
        { highlight: '#4c1d95', shadow: '#09071a', lineWidth: 2.9 },
      );
      // Sweeping golden celestial filigree ribs
      drawCelPoly(
        ctx,
        [
          [-76, -16],
          [-56, -190],
          [-44, -190],
          [-62, -16],
        ],
        '#f59e0b',
        { highlight: '#fef08a', lineWidth: 1.9 },
      );
      drawCelPoly(
        ctx,
        [
          [16, -16],
          [22, -178],
          [34, -172],
          [28, -16],
        ],
        '#f59e0b',
        { highlight: '#fef08a', lineWidth: 1.9 },
      );
      // Floating cosmic halo + radiant singularity core above spire!
      const floatY = -232 + Math.sin(time * 2.8) * 5;
      ctx.save();
      ctx.translate(-18, floatY);
      setInkStyle(ctx, 4.0, INK);
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 10, -0.18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      drawEnergyOrb(ctx, 0, 0, 13, '#c084fc', '#fef08a');
      ctx.restore();
      // Stargate warp portal entrance
      drawCelEllipse(ctx, 50, -44, 24, 42, pal.main, { highlight: '#e879f9', lineWidth: 2.6 });
      drawCelEllipse(ctx, 50, -44, 16, 32, '#09071a', { lineWidth: 2.0 });
      drawEnergyOrb(ctx, 50, -44, 11, '#a855f7', '#fef08a');
      break;
    }
  }
}

function drawFortressCracks(ctx: CanvasRenderingContext2D, hpRatio: number): void {
  const severe = hpRatio <= 0.25;
  ctx.save();
  setInkStyle(ctx, severe ? 3.2 : 2.4, '#090d16');
  // Main diagonal masonry fracture
  ctx.beginPath();
  ctx.moveTo(-42, -148);
  ctx.lineTo(-22, -118);
  ctx.lineTo(-34, -92);
  ctx.lineTo(-10, -64);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(42, -112);
  ctx.lineTo(24, -84);
  ctx.lineTo(36, -54);
  ctx.stroke();

  if (severe) {
    // Additional deep orange-glowing fracture lines!
    setInkStyle(ctx, 2.2, '#f97316');
    ctx.beginPath();
    ctx.moveTo(-22, -118);
    ctx.lineTo(-4, -104);
    ctx.lineTo(-18, -76);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCartoonDamageSmokeAndFire(
  ctx: CanvasRenderingContext2D,
  hpRatio: number,
  time: number,
  dir: number,
): void {
  const severe = hpRatio <= 0.25;
  const puffs = severe ? 7 : 4;
  for (let i = 0; i < puffs; i++) {
    const phase = (time * (severe ? 1.05 : 0.78) + i * 0.37) % 1;
    const px = (-34 + ((i * 29) % 78) + Math.sin(time * 2.2 + i) * 9) * dir;
    const py = -86 - phase * (severe ? 115 : 82);
    const r = (severe ? 11 : 8) + phase * 14;

    ctx.save();
    ctx.globalAlpha = (1 - phase) * (severe ? 0.72 : 0.5);
    drawCelEllipse(ctx, px, py, r, r * 0.85, '#334155', {
      highlight: '#64748b',
      shadow: '#0f172a',
      lineWidth: 1.6,
    });
    ctx.restore();

    if (severe && i % 2 === 0) {
      const fy = -74 - phase * 26;
      const fr = 9 * (1 - phase) + 4;
      ctx.save();
      ctx.globalAlpha = (1 - phase) * 0.92;
      drawCelEllipse(ctx, px, fy, fr * 0.78, fr * 1.15, '#f97316', {
        highlight: '#fef08a',
        lineWidth: 1.5,
      });
      ctx.restore();
    }
  }
}

// ============================================================================
// ALL 20 ROTATING FLASH-CARTOON TURRETS (facing RIGHT at angle 0)
// ============================================================================
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
  const pal = getTeamPalette(team);
  const firing = recoil > 0.32;
  const facingLeft = Math.cos(aimAngle) < 0;

  ctx.save();
  const rx = -Math.cos(aimAngle) * recoil * 5;
  const ry = -Math.sin(aimAngle) * recoil * 5;
  ctx.translate(rx, ry);
  ctx.rotate(aimAngle);
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  switch (kind) {
    case 'rock_dropper':
    case 'bone_catapult': {
      drawCelRoundRect(ctx, -14, -7, 22, 14, 3, '#78350f', { highlight: '#b45309', lineWidth: 2.0 });
      drawCelRoundRect(ctx, -6, -10, 24, 6, 2, kind === 'bone_catapult' ? '#f8fafc' : '#a16207', {
        lineWidth: 1.8,
      });
      drawCelEllipse(ctx, 16, -7, 5.5, 5.5, '#94a3b8', { highlight: '#e2e8f0', lineWidth: 1.7 });
      drawCelEllipse(ctx, -4, 0, 5, 5, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      break;
    }

    case 'obelisk_beam': {
      drawCelPoly(
        ctx,
        [
          [-12, -9],
          [14, -5],
          [14, 5],
          [-12, 9],
        ],
        '#d97706',
        { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.1 },
      );
      drawCelRoundRect(ctx, -8, -5, 10, 10, 2, pal.main, { lineWidth: 1.5 });
      drawEnergyOrb(ctx, 18, 0, firing ? 8.5 : 5.2, '#fbbf24', '#ffffff');
      break;
    }

    case 'scarab_catapult': {
      drawCelEllipse(ctx, -3, 0, 13, 10, '#eab308', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.1 });
      drawCelEllipse(ctx, -3, 0, 7, 5, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      drawCelRoundRect(ctx, 4, -4, 17, 8, 3, '#f59e0b', { lineWidth: 1.8 });
      if (firing) drawEnergyOrb(ctx, 22, 0, 7, '#f59e0b', '#fef08a');
      break;
    }

    case 'arrow_tower':
    case 'ballista':
    case 'crossbow_bastion': {
      const bodyCol = kind === 'crossbow_bastion' ? '#64748b' : '#854d0e';
      drawCelRoundRect(ctx, -13, -6, 24, 12, 3, bodyCol, { highlight: '#cbd5e1', lineWidth: 2.0 });
      // Bow arms
      setInkStyle(ctx, 4.2, INK);
      ctx.beginPath();
      ctx.moveTo(8, -14);
      ctx.quadraticCurveTo(15, 0, 8, 14);
      ctx.stroke();
      ctx.strokeStyle = kind === 'ballista' ? '#d97706' : '#475569';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      // Loaded heavy bolt
      drawCelRoundRect(ctx, -4, -2, 26, 4, 1, '#e2e8f0', { lineWidth: 1.5 });
      drawCelEllipse(ctx, -5, 0, 4.5, 4.5, pal.main, { lineWidth: 1.4 });
      if (firing) drawCartoonMuzzleFlash(ctx, 24, 0, 8, '#fde047', '#ffffff');
      break;
    }

    case 'keep_trebuchet': {
      drawCelRoundRect(ctx, -14, -9, 22, 18, 3, '#78350f', { highlight: '#b45309', lineWidth: 2.1 });
      drawCelRoundRect(ctx, -8, -4, 28, 7, 2, '#92400e', { lineWidth: 1.9 });
      drawCelEllipse(ctx, -11, 2, 6, 6, '#475569', { lineWidth: 1.7 });
      drawCelEllipse(ctx, 18, -1, 5.5, 5.5, '#f97316', { highlight: '#fef08a', lineWidth: 1.6 });
      break;
    }

    case 'musket_battery':
    case 'fortress_cannon': {
      drawCelRoundRect(ctx, -14, -9, 18, 18, 5, '#475569', { highlight: '#94a3b8', lineWidth: 2.1 });
      drawCelPoly(
        ctx,
        [
          [-4, -6.5],
          [22, -4.5],
          [22, 4.5],
          [-4, 6.5],
        ],
        '#334155',
        { highlight: '#94a3b8', shadow: '#0f172a', lineWidth: 2.1 },
      );
      drawCelRoundRect(ctx, 14, -5.5, 4, 11, 1, '#d97706', { highlight: '#fef08a', lineWidth: 1.4 });
      drawCelEllipse(ctx, -5, 0, 5, 5, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      if (firing) drawCartoonMuzzleFlash(ctx, 26, 0, 12, '#f97316', '#fef08a');
      break;
    }

    case 'steam_repeater':
    case 'boiler_mortar': {
      drawCelEllipse(ctx, -5, 0, 12, 11, '#d97706', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.1 });
      drawCelRoundRect(ctx, -10, -5, 10, 10, 2, pal.main, { lineWidth: 1.5 });
      if (kind === 'steam_repeater') {
        drawCelRoundRect(ctx, 4, -5.5, 20, 4, 1.2, '#f59e0b', { lineWidth: 1.6 });
        drawCelRoundRect(ctx, 4, 1.5, 20, 4, 1.2, '#f59e0b', { lineWidth: 1.6 });
      } else {
        drawCelRoundRect(ctx, 3, -6.5, 19, 13, 3, '#475569', { highlight: '#94a3b8', lineWidth: 2.0 });
      }
      if (firing) drawCartoonMuzzleFlash(ctx, 27, 0, 13, '#f97316', '#fef08a');
      break;
    }

    case 'mg_nest':
    case 'howitzer_turret': {
      drawCelRoundRect(ctx, -14, -10, 22, 20, 6, '#4d5d38', { highlight: '#798c5c', shadow: '#2b361e', lineWidth: 2.2 });
      drawCelRoundRect(ctx, -10, -6, 10, 12, 2, pal.main, { lineWidth: 1.5 });
      drawCelRoundRect(
        ctx,
        6,
        kind === 'howitzer_turret' ? -5.5 : -3.2,
        kind === 'howitzer_turret' ? 21 : 19,
        kind === 'howitzer_turret' ? 11 : 6.4,
        2,
        '#334155',
        { highlight: '#94a3b8', lineWidth: 1.9 },
      );
      if (firing) drawCartoonMuzzleFlash(ctx, 29, 0, 13, '#f97316', '#fef08a');
      break;
    }

    case 'vulcan_ciws':
    case 'missile_pod': {
      drawCelRoundRect(ctx, -14, -10, 22, 20, 5, '#475569', { highlight: '#cbd5e1', shadow: '#1e293b', lineWidth: 2.2 });
      drawCelRoundRect(ctx, -11, -5, 14, 10, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      if (kind === 'vulcan_ciws') {
        for (let i = -1; i <= 1; i++) {
          drawCelRoundRect(ctx, 7, -1.5 + i * 3.6, 19, 2.8, 1, '#94a3b8', { lineWidth: 1.4 });
        }
      } else {
        drawCelRoundRect(ctx, 4, -9, 17, 18, 3, '#334155', { highlight: '#64748b', lineWidth: 2.0 });
        drawCelEllipse(ctx, 18, -4.5, 3.2, 3.2, '#ef4444', { lineWidth: 1.2 });
        drawCelEllipse(ctx, 18, 4.5, 3.2, 3.2, '#ef4444', { lineWidth: 1.2 });
      }
      if (firing) drawCartoonMuzzleFlash(ctx, 28, 0, 13, '#f97316', '#fef08a');
      break;
    }

    case 'plasma_repeater':
    case 'ion_cannon': {
      drawCelEllipse(ctx, -4, 0, 13, 11, '#e2e8f0', { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.2 });
      drawCelRoundRect(ctx, -10, -5, 12, 10, 3, pal.main, { highlight: pal.light, lineWidth: 1.6 });
      drawCelRoundRect(ctx, 5, -6, 20, 4.2, 1.5, '#cbd5e1', { lineWidth: 1.6 });
      drawCelRoundRect(ctx, 5, 1.8, 20, 4.2, 1.5, '#cbd5e1', { lineWidth: 1.6 });
      ctx.fillStyle = pal.glow;
      ctx.fillRect(6, -1.8, 18, 3.6);
      drawEnergyOrb(ctx, 26, 0, firing ? 9 : 4.2, pal.glow, '#ffffff');
      break;
    }

    default: {
      // Era 10: prism_spire & singularity_cannon
      drawCelPoly(
        ctx,
        [
          [-14, -10],
          [8, -12],
          [16, 0],
          [8, 12],
          [-14, 10],
        ],
        '#1e1b4b',
        { highlight: '#6d28d9', lineWidth: 2.3 },
      );
      drawCelRoundRect(ctx, -10, -5, 12, 10, 3, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.6 });
      drawCelEllipse(ctx, 18, 0, 3.5, 9, '#facc15', { highlight: '#fef08a', lineWidth: 1.6 });
      drawEnergyOrb(ctx, 24, 0, firing ? 10 : 5.5, kind === 'singularity_cannon' ? '#c084fc' : pal.glow, '#fef08a');
      break;
    }
  }

  ctx.restore();
}
