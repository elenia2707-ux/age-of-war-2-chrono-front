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
  drawGearWheel,
  drawRivetStrip,
  drawStoneMasonry,
  drawWallTorch,
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

  // Golden evolution / upgrade celebration glow aura (zero createRadialGradient!)
  const auraFlash = Math.max(faction.evolveFlash, faction.upgradeFlash * 0.72);
  if (auraFlash > 0.02) {
    const rad = 148 + (1 - auraFlash) * 44;
    ctx.fillStyle = `rgba(250, 204, 21, ${(auraFlash * 0.2).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(0, -108, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(254, 240, 138, ${(auraFlash * 0.34).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(0, -108, rad * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(254, 240, 138, ${(auraFlash * 0.72).toFixed(2)})`;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(0, -108, rad * 0.92, 0, Math.PI * 2);
    ctx.stroke();
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

  // Visual Fortress Upgrade Evolution (live fortification badges & energy dome as 요새포탑 levels up!)
  const fortLv = faction.upgrades.fortress;
  if (fortLv >= 2) {
    // Gleaming golden reinforced foundation bumper & rivets
    drawCelRoundRect(ctx, -86, -12, 174, 12, 3, '#d97706', {
      highlight: '#fef08a',
      shadow: '#78350f',
      lineWidth: 2.0,
    });
    drawRivetStrip(ctx, -78, -6, 78, -6, 8, 1.3);
  }
  if (fortLv >= 5) {
    // Glowing fortified diamond bastion crest mounted on front bastion!
    drawCelPoly(
      ctx,
      [
        [72, -46],
        [82, -62],
        [93, -46],
        [82, -30],
      ],
      pal.main,
      { highlight: '#fef08a', shadow: pal.dark, lineWidth: 2.0 },
    );
    drawEnergyOrb(ctx, 82, -46, 3.8 + Math.sin(time * 5) * 0.7, '#38bdf8', '#ffffff');
  }
  if (fortLv >= 8) {
    // Shimmering translucent Aegis Energy Shield Dome guarding the fortress (upgrades to Golden Sovereign rim at Lv.10!)
    const isSovereign = fortLv >= 10;
    const domePulse = 0.22 + Math.sin(time * 4.5) * 0.08;
    ctx.save();
    ctx.strokeStyle = isSovereign
      ? `rgba(250, 204, 21, ${(domePulse + 0.56).toFixed(2)})`
      : faction.team === 'player'
        ? `rgba(96, 165, 250, ${(domePulse + 0.42).toFixed(2)})`
        : `rgba(248, 113, 113, ${(domePulse + 0.42).toFixed(2)})`;
    ctx.lineWidth = isSovereign ? 3.8 : 3.2;
    ctx.beginPath();
    ctx.arc(4, -22, 112, Math.PI * 1.15, Math.PI * 1.98);
    ctx.stroke();
    ctx.strokeStyle = isSovereign
      ? `rgba(254, 249, 195, ${(domePulse * 1.45).toFixed(2)})`
      : `rgba(255, 255, 255, ${(domePulse * 1.1).toFixed(2)})`;
    ctx.lineWidth = isSovereign ? 1.8 : 1.4;
    ctx.beginPath();
    ctx.arc(4, -22, 107, Math.PI * 1.24, Math.PI * 1.9);
    ctx.stroke();
    ctx.fillStyle = isSovereign
      ? `rgba(250, 204, 21, ${(domePulse * 0.34).toFixed(2)})`
      : faction.team === 'player'
        ? `rgba(56, 189, 248, ${(domePulse * 0.42).toFixed(2)})`
        : `rgba(244, 63, 94, ${(domePulse * 0.42).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(4, -22, 112, Math.PI * 1.15, Math.PI * 1.98);
    ctx.lineTo(4, -22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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

    drawTurretPlatform(ctx, tx, ty + 9, pal, dir, faction.eraIndex);

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

  // Crisp Cel-Framed Overhead Fortress HP Bar with Delayed White Drain Trail (zero gradient!)
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
    ctx.fillStyle = faction.team === 'player' ? '#2563eb' : '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-barW / 2, barY, fillW, barH, 4);
    ctx.fill();
    if (fillW > 5) {
      ctx.fillStyle = faction.team === 'player' ? '#60a5fa' : '#fb923c';
      ctx.fillRect(-barW / 2 + 2.5, barY + 1.5, fillW - 5, 4.2);
    }
  }

  setInkStyle(ctx, 2.2, faction.baseHitFlash > 0.5 ? '#fde047' : fortLv >= 10 ? '#facc15' : INK);
  ctx.beginPath();
  ctx.roundRect(-barW / 2, barY, barW, barH, 5);
  ctx.stroke();

  // Unobstructed MAX Lv.10 Sovereign Bastion Golden Crown Crest beside HP bar!
  if (fortLv >= 10) {
    const cx = dir * (barW / 2 + 14);
    const cy = barY + barH - 2 + Math.sin(time * 3.8) * 1.2;
    drawCelPoly(
      ctx,
      [
        [cx - 9, cy],
        [cx - 10, cy - 11],
        [cx - 4, cy - 6],
        [cx, cy - 13],
        [cx + 4, cy - 6],
        [cx + 10, cy - 11],
        [cx + 9, cy],
      ],
      '#facc15',
      { highlight: '#ffffff', shadow: '#b45309', lineWidth: 1.6 },
    );
    drawEnergyOrb(ctx, cx, cy - 5, 3.0, '#fef08a', '#ffffff');
  }

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
  eraIndex: number,
): void {
  ctx.save();
  ctx.translate(x, y);

  if (eraIndex >= 9) {
    // Future / Interstellar / Transcendent: Sleek floating anti-gravity energy pad!
    const padCol = eraIndex === 11 ? '#f8fafc' : eraIndex === 10 ? '#1e1b4b' : '#cbd5e1';
    const trimCol = eraIndex === 11 ? '#2dd4bf' : eraIndex === 10 ? '#facc15' : pal.glow;
    ctx.fillStyle = eraIndex === 11 ? 'rgba(45, 212, 191, 0.35)' : eraIndex === 10 ? 'rgba(192, 132, 252, 0.35)' : 'rgba(56, 189, 248, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 16, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawCelPoly(
      ctx,
      [
        [-21, -4],
        [21, -4],
        [15, 5],
        [-15, 5],
      ],
      padCol,
      { highlight: '#ffffff', shadow: '#334155', lineWidth: 1.9 },
    );
    ctx.fillStyle = trimCol;
    ctx.fillRect(-15, -1.5, 30, 3);
    ctx.restore();
    return;
  }

  let bracketCol = '#334155';
  let ledgeCol = '#64748b';
  let ledgeHi = '#cbd5e1';
  let ledgeSh = '#334155';
  let stripeCol = pal.main;

  if (eraIndex === 0) {
    // Stone Age: lashed timber log scaffolding!
    bracketCol = '#5c3412';
    ledgeCol = '#92400e';
    ledgeHi = '#d97706';
    ledgeSh = '#451a03';
    stripeCol = '#f59e0b';
  } else if (eraIndex === 1) {
    // Egypt: gilded sandstone lotus bracket!
    bracketCol = '#92400e';
    ledgeCol = '#eab308';
    ledgeHi = '#fef08a';
    ledgeSh = '#a16207';
    stripeCol = pal.main;
  } else if (eraIndex === 2) {
    // Classical: carved marble cornice!
    bracketCol = '#94a3b8';
    ledgeCol = '#f1f5f9';
    ledgeHi = '#ffffff';
    ledgeSh = '#94a3b8';
    stripeCol = '#facc15';
  } else if (eraIndex === 3) {
    // Eastern Dynasty: crimson lacquered cloud-scroll bracket!
    bracketCol = '#7f1d1d';
    ledgeCol = '#b91c1c';
    ledgeHi = '#f87171';
    ledgeSh = '#450a0a';
    stripeCol = '#facc15';
  } else if (eraIndex === 4) {
    // Medieval: carved granite castle corbel!
    bracketCol = '#475569';
    ledgeCol = '#94a3b8';
    ledgeHi = '#e2e8f0';
    ledgeSh = '#475569';
  } else if (eraIndex === 5 || eraIndex === 6) {
    // Gunpowder / Steampunk: riveted copper & brass industrial balcony!
    bracketCol = '#78350f';
    ledgeCol = '#b45309';
    ledgeHi = '#fbbf24';
    ledgeSh = '#451a03';
    stripeCol = '#facc15';
  }

  drawCelPoly(
    ctx,
    [
      [-18, 3],
      [18, 3],
      [10 * dir, 14],
      [-14 * dir, 14],
    ],
    bracketCol,
    { shadow: '#0f172a', lineWidth: 1.9 },
  );
  drawCelRoundRect(ctx, -21, -4, 42, 8, 3, ledgeCol, {
    highlight: ledgeHi,
    shadow: ledgeSh,
    lineWidth: 2.0,
  });
  ctx.fillStyle = stripeCol;
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
// 12 MONUMENTAL HD CARTOON ERA FORTRESSES (facing +X, origin bottom-center)
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
      // Era 1: Prehistoric Mammoth-Skull Cave Mound + War-Totem, Glowing Torch & Palisade
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
        '#7c5d44',
        { highlight: '#ad8764', shadow: '#453020', lineWidth: 2.8 },
      );
      drawStoneMasonry(ctx, -78, -165, 130, 88, 4, 4, 'rgba(35,20,10,0.2)', 'rgba(255,235,200,0.12)');
      // Lush moss & grass overhang cap
      drawCelPoly(
        ctx,
        [
          [-68, -172],
          [-48, -202],
          [12, -210],
          [46, -176],
          [20, -166],
          [-26, -176],
        ],
        '#4d7c0f',
        { highlight: '#a3e635', shadow: '#365314', lineWidth: 2.2 },
      );
      // Giant Stone Archway Cave Entrance with warm firelight glow inside!
      drawCelPoly(
        ctx,
        [
          [16, 0],
          [18, -68],
          [48, -82],
          [74, -64],
          [78, 0],
        ],
        '#171412',
        { lineWidth: 2.6 },
      );
      const fireGlow = 0.22 + Math.sin(time * 6) * 0.06;
      ctx.fillStyle = `rgba(249, 115, 22, ${fireGlow.toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(48, -12, 22, 14, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Mammoth tusks & tribal bone skull trophy crowning cave archway!
      drawCelPoly(
        ctx,
        [
          [16, -42],
          [6, -78],
          [24, -92],
          [24, -64],
        ],
        '#fef3c7',
        { highlight: '#ffffff', shadow: '#d6c3a5', lineWidth: 2.0 },
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
        { highlight: '#ffffff', shadow: '#d6c3a5', lineWidth: 2.0 },
      );
      drawCelEllipse(ctx, 47, -86, 13, 10, '#fef3c7', { highlight: '#ffffff', shadow: '#d6c3a5', lineWidth: 1.9 });
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(43, -86, 2.4, 0, Math.PI * 2);
      ctx.arc(51, -86, 2.4, 0, Math.PI * 2);
      ctx.fill();
      // Timber palisade logs bound with rope + flickering cave torch!
      for (let i = 0; i < 4; i++) {
        drawCelRoundRect(ctx, -78 + i * 16, -72, 13, 72, 4, '#78350f', {
          highlight: '#b45309',
          shadow: '#451a03',
          lineWidth: 2.0,
        });
      }
      drawCelRoundRect(ctx, -80, -48, 66, 6, 2, '#d97706', { highlight: '#fef08a', lineWidth: 1.5 });
      drawWallTorch(ctx, 4, -76, time, 1.05);
      drawTeamFlag(ctx, -20, -204, pal, time);
      break;
    }

    case 1: {
      // Era 2: Golden Giza Pyramid Temple Fortress + Obelisk + Winged Sun Disk & Hieroglyphs
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
        { highlight: '#ffffff', shadow: '#b45309', lineWidth: 2.1 },
      );
      // Glowing golden hieroglyph runes down the obelisk shaft
      ctx.fillStyle = '#fef08a';
      for (let hy = -182; hy <= -100; hy += 22) {
        ctx.fillRect(-63, hy, 6, 3);
        ctx.fillRect(-61.5, hy + 5, 3, 6);
      }
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
      drawStoneMasonry(ctx, -62, -172, 118, 152, 6, 4, 'rgba(120,53,15,0.2)', 'rgba(255,250,210,0.18)');
      setInkStyle(ctx, 1.8, '#92400e');
      for (let y = -40; y >= -160; y -= 32) {
        const shrink = (-y / 192) * 38;
        ctx.beginPath();
        ctx.moveTo(-80 + shrink * 0.85, y);
        ctx.lineTo(82 - shrink * 1.4, y);
        ctx.stroke();
      }
      // Royal turquoise/team temple pylon portal + Winged Sun Disk relief!
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
      drawCelRoundRect(ctx, 12, -96, 66, 9, 2.5, '#facc15', { highlight: '#fef08a', shadow: '#b45309', lineWidth: 1.9 });
      drawCelRoundRect(ctx, 26, -68, 40, 68, 6, '#1e1b4b', { lineWidth: 2.4 });
      // Winged Sun Disk (Behedeti) flanking solar orb
      drawCelPoly(
        ctx,
        [
          [16, -84],
          [38, -87],
          [38, -81],
        ],
        '#fde047',
        { lineWidth: 1.3 },
      );
      drawCelPoly(
        ctx,
        [
          [76, -84],
          [54, -87],
          [54, -81],
        ],
        '#fde047',
        { lineWidth: 1.3 },
      );
      drawEnergyOrb(ctx, 46, -84, 8, '#facc15', '#ffffff');
      drawWallTorch(ctx, 16, -66, time, 0.95);
      drawTeamFlag(ctx, -10, -192, pal, time);
      break;
    }

    case 2: {
      // Era 3: Classical Marble Acropolis Citadel + Fluted Columns, Golden Laurel Crest & Brazier
      drawCelRoundRect(ctx, -84, -184, 134, 184, 5, '#e2e8f0', {
        highlight: '#ffffff',
        shadow: '#94a3b8',
        lineWidth: 2.7,
      });
      drawStoneMasonry(ctx, -78, -176, 122, 166, 6, 4, 'rgba(71,85,105,0.16)', 'rgba(255,255,255,0.22)');
      drawCelPoly(
        ctx,
        [
          [-92, -182],
          [-17, -224],
          [58, -182],
        ],
        pal.main,
        { highlight: pal.light, shadow: pal.dark, lineWidth: 2.6 },
      );
      drawCelPoly(
        ctx,
        [
          [-74, -186],
          [-17, -214],
          [40, -186],
        ],
        '#f8fafc',
        { shadow: '#cbd5e1', lineWidth: 1.8 },
      );
      // Golden sun-shield & laurel wreath inside pediment
      drawCelEllipse(ctx, -17, -196, 10, 10, '#facc15', { highlight: '#fef08a', shadow: '#b45309', lineWidth: 1.7 });
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(-17, -196, 12, 0.4, Math.PI - 0.4);
      ctx.stroke();
      // Fluted marble columns with capitals & shadow fluting
      for (let i = 0; i < 4; i++) {
        const cx = -74 + i * 32;
        drawCelRoundRect(ctx, cx, -172, 14, 152, 2, '#f8fafc', {
          highlight: '#ffffff',
          shadow: '#cbd5e1',
          lineWidth: 1.9,
        });
        ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.fillRect(cx + 4, -168, 2, 144);
        ctx.fillRect(cx + 9, -168, 2, 144);
        drawCelRoundRect(ctx, cx - 3, -176, 20, 6, 1.5, '#e2e8f0', { highlight: '#ffffff', lineWidth: 1.5 });
      }
      drawCelRoundRect(ctx, 18, -106, 66, 106, 4, '#cbd5e1', {
        highlight: '#f8fafc',
        shadow: '#64748b',
        lineWidth: 2.6,
      });
      drawCelRoundRect(ctx, 32, -66, 38, 66, 18, '#1e293b', { lineWidth: 2.4 });
      drawWallTorch(ctx, 25, -72, time, 0.95);
      drawTeamFlag(ctx, -17, -224, pal, time);
      break;
    }

    case 3: {
      // Era 4 (NEW ANCIENT): Imperial Eastern Pagoda Citadel (황금 누각 성채)!
      // Stone fortress terrace base
      drawCelPoly(
        ctx,
        [
          [-88, 0],
          [-80, -82],
          [80, -82],
          [88, 0],
        ],
        '#64748b',
        { highlight: '#94a3b8', shadow: '#334155', lineWidth: 2.8 },
      );
      drawStoneMasonry(ctx, -78, -76, 154, 70, 4, 5, 'rgba(15,23,42,0.22)', 'rgba(255,255,255,0.16)');

      // Tier 2 Crimson Lacquered Imperial Pavilion
      drawCelRoundRect(ctx, -68, -150, 122, 70, 3, '#991b1b', {
        highlight: '#ef4444',
        shadow: '#450a0a',
        lineWidth: 2.5,
      });
      // Vertical golden-trimmed temple pillars
      for (let i = 0; i < 4; i++) {
        drawCelRoundRect(ctx, -60 + i * 34, -146, 8, 64, 1.5, '#dc2626', {
          highlight: '#fca5a5',
          shadow: '#7f1d1d',
          lineWidth: 1.5,
        });
      }
      // Tier 1 Swooping Jade-Teal Curved Pagoda Roof Eaves!
      drawCelPoly(
        ctx,
        [
          [-86, -142],
          [-68, -162],
          [56, -162],
          [76, -142],
          [58, -147],
          [-68, -147],
        ],
        '#047857',
        { highlight: '#34d399', shadow: '#064e3b', lineWidth: 2.4 },
      );
      drawCelRoundRect(ctx, -66, -164, 120, 5, 2, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.4 });

      // Tier 3 Upper Watchtower Pavilion + Curved Crown Pagoda Roof + Golden Dragon Finial!
      drawCelRoundRect(ctx, -46, -202, 78, 42, 3, '#b91c1c', {
        highlight: '#f87171',
        shadow: '#450a0a',
        lineWidth: 2.3,
      });
      drawCelRoundRect(ctx, -26, -194, 38, 22, 3, '#0f172a', { lineWidth: 1.8 });
      // Warm amber imperial palace window glow
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-22, -190, 30, 14);
      setInkStyle(ctx, 1.6, '#7f1d1d');
      ctx.beginPath();
      ctx.moveTo(-7, -190);
      ctx.lineTo(-7, -176);
      ctx.moveTo(-22, -183);
      ctx.lineTo(8, -183);
      ctx.stroke();

      drawCelPoly(
        ctx,
        [
          [-66, -194],
          [-46, -220],
          [32, -220],
          [54, -194],
          [34, -200],
          [-46, -200],
        ],
        '#047857',
        { highlight: '#34d399', shadow: '#064e3b', lineWidth: 2.4 },
      );
      // Golden imperial roof ridge & dragon-horn upturned finials!
      drawCelRoundRect(ctx, -44, -224, 74, 7, 2.5, '#f59e0b', { highlight: '#fef9c3', shadow: '#92400e', lineWidth: 1.8 });
      drawCelEllipse(ctx, -7, -231, 6.5, 6.5, '#facc15', { highlight: '#ffffff', shadow: '#b45309', lineWidth: 1.6 });

      // Crimson Palace Archway Gate with Golden Brass Studs!
      drawCelRoundRect(ctx, 22, -74, 48, 74, 18, '#7f1d1d', {
        highlight: '#dc2626',
        shadow: '#450a0a',
        lineWidth: 2.5,
      });
      drawRivetStrip(ctx, 30, -58, 30, -14, 4, 1.6);
      drawRivetStrip(ctx, 62, -58, 62, -14, 4, 1.6);
      drawCelRoundRect(ctx, 26, -84, 40, 11, 2.5, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.8 });
      drawCelEllipse(ctx, 46, -78.5, 3.6, 3.6, '#facc15', { lineWidth: 1.1 });

      // Swaying Glowing Red Imperial Paper Lanterns hanging from eaves!
      const sway = Math.sin(time * 3.1) * 2.5;
      for (const lx of [-72, 62]) {
        setInkStyle(ctx, 1.5, '#facc15');
        ctx.beginPath();
        ctx.moveTo(lx, -144);
        ctx.lineTo(lx + sway, -133);
        ctx.stroke();
        drawCelEllipse(ctx, lx + sway, -126, 6.5, 8.5, '#ef4444', {
          highlight: '#fef08a',
          shadow: '#991b1b',
          lineWidth: 1.6,
        });
        drawEnergyOrb(ctx, lx + sway, -126, 3.5 + Math.sin(time * 5 + lx) * 0.6, '#f97316', '#fef9c3');
      }
      drawTeamFlag(ctx, -38, -224, pal, time);
      break;
    }

    case 4: {
      // Era 5: Gothic Medieval Stone Castle Keep + Rose Window, Masonry, Torches & Royal Banner!
      drawCelRoundRect(ctx, -82, -186, 68, 186, 4, '#64748b', {
        highlight: '#94a3b8',
        shadow: '#334155',
        lineWidth: 2.7,
      });
      drawStoneMasonry(ctx, -78, -180, 60, 174, 8, 3);
      // Glowing Gothic Rose-Window Stained Glass on Tall Keep Tower!
      drawCelEllipse(ctx, -48, -152, 11, 11, '#1e293b', { lineWidth: 2.0 });
      drawCelEllipse(ctx, -48, -152, 7.5, 7.5, pal.light, { highlight: '#fef08a', lineWidth: 1.3 });
      drawCelPoly(
        ctx,
        [
          [-88, -184],
          [-48, -214],
          [-8, -184],
        ],
        pal.main,
        { highlight: pal.light, shadow: pal.dark, lineWidth: 2.5 },
      );
      drawCelRoundRect(ctx, -28, -158, 110, 158, 4, '#94a3b8', {
        highlight: '#cbd5e1',
        shadow: '#475569',
        lineWidth: 2.7,
      });
      drawStoneMasonry(ctx, -24, -152, 102, 146, 7, 4);
      for (let i = 0; i < 5; i++) {
        drawCelRoundRect(ctx, -28 + i * 23, -172, 15, 16, 2, '#cbd5e1', {
          highlight: '#f8fafc',
          shadow: '#64748b',
          lineWidth: 2.0,
        });
      }
      // Arched portcullis gate with iron crossbar & flanking glowing torches!
      drawCelRoundRect(ctx, 26, -74, 46, 74, 22, '#1c1917', { lineWidth: 2.6 });
      setInkStyle(ctx, 2.2, '#64748b');
      for (let gx = 34; gx <= 64; gx += 10) {
        ctx.beginPath();
        ctx.moveTo(gx, -68);
        ctx.lineTo(gx, -2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(28, -42);
      ctx.lineTo(70, -42);
      ctx.moveTo(28, -20);
      ctx.lineTo(70, -20);
      ctx.stroke();
      drawWallTorch(ctx, 18, -62, time, 0.95);
      // Royal heraldic banner with gold cross trim
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
        { highlight: pal.light, shadow: pal.dark, lineWidth: 2.0 },
      );
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0.5, -132, 3, 40);
      ctx.fillRect(-6, -118, 16, 3);
      drawTeamFlag(ctx, -48, -214, pal, time);
      break;
    }

    case 5: {
      // Era 6: Brick Renaissance Star-Fort Bastion + Cupola Bell-Dome, Crossed-Cannon Plaque & Stud Doors
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
      drawStoneMasonry(ctx, -78, -182, 92, 168, 8, 4, 'rgba(67,20,7,0.28)', 'rgba(254,215,170,0.14)');
      drawCelRoundRect(ctx, -86, -198, 108, 14, 3, '#e7e5e4', { highlight: '#ffffff', shadow: '#a8a29e', lineWidth: 2.3 });
      drawCelRoundRect(ctx, 14, -128, 72, 12, 3, '#e7e5e4', { highlight: '#ffffff', shadow: '#a8a29e', lineWidth: 2.2 });
      drawCelPoly(
        ctx,
        [
          [-78, -198],
          [-64, -226],
          [4, -226],
          [16, -198],
        ],
        pal.dark,
        { highlight: pal.main, shadow: '#0f172a', lineWidth: 2.4 },
      );
      // Gilded baroque cupola lantern dome atop roof!
      drawCelEllipse(ctx, -30, -226, 13, 10, '#d97706', { highlight: '#fef08a', shadow: '#78350f', lineWidth: 1.8 });
      // Golden artillery medallion above timber bastion gate
      drawCelEllipse(ctx, 52, -94, 11, 11, '#f59e0b', { highlight: '#fef9c3', shadow: '#92400e', lineWidth: 1.7 });
      drawCelEllipse(ctx, 52, -94, 5, 5, pal.main, { lineWidth: 1.1 });
      drawCelRoundRect(ctx, 28, -76, 48, 76, 10, '#5c3412', { highlight: '#92400e', shadow: '#3b1f0b', lineWidth: 2.5 });
      drawRivetStrip(ctx, 35, -62, 35, -12, 4, 1.5);
      drawRivetStrip(ctx, 69, -62, 69, -12, 4, 1.5);
      drawWallTorch(ctx, 18, -76, time, 0.95);
      drawTeamFlag(ctx, -30, -236, pal, time);
      break;
    }

    case 6: {
      // Era 7: Steampunk Copper Clockwork Foundry + Triple Meshing Toothed Gears, Pressure Gauge & Steam!
      drawCelRoundRect(ctx, -74, -230, 20, 72, 3, '#475569', { highlight: '#94a3b8', shadow: '#1e293b', lineWidth: 2.4 });
      drawCelRoundRect(ctx, -44, -218, 18, 60, 3, '#475569', { highlight: '#94a3b8', shadow: '#1e293b', lineWidth: 2.3 });
      drawCelRoundRect(ctx, -77, -233, 26, 6, 1.5, '#d97706', { highlight: '#fef08a', lineWidth: 1.7 });
      drawCelRoundRect(ctx, -47, -221, 24, 6, 1.5, '#d97706', { highlight: '#fef08a', lineWidth: 1.7 });
      const p1 = (time * 0.7) % 1;
      const p2 = (time * 0.7 + 0.5) % 1;
      ctx.save();
      ctx.globalAlpha = (1 - p1) * 0.65;
      drawCelEllipse(ctx, -64 + p1 * 22, -240 - p1 * 26, 9 + p1 * 9, 6.5 + p1 * 5, '#e2e8f0', { lineWidth: 1.4 });
      ctx.globalAlpha = (1 - p2) * 0.58;
      drawCelEllipse(ctx, -35 + p2 * 20, -228 - p2 * 24, 7 + p2 * 8, 5 + p2 * 4, '#e2e8f0', { lineWidth: 1.3 });
      ctx.restore();
      drawCelRoundRect(ctx, -84, -182, 152, 182, 8, '#b45309', {
        highlight: '#f59e0b',
        shadow: '#78350f',
        lineWidth: 2.8,
      });
      drawRivetStrip(ctx, -78, -162, 58, -162, 8, 1.6);
      drawRivetStrip(ctx, -78, -14, 12, -14, 6, 1.6);
      // Glowing amber steam furnace grate + brass pressure gauge
      drawCelRoundRect(ctx, -72, -56, 48, 28, 4, '#451a03', { lineWidth: 2.0 });
      ctx.fillStyle = '#f97316';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(-66 + i * 10, -50, 6, 16);
      }
      drawCelEllipse(ctx, -10, -44, 10, 10, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.7 });
      drawCelEllipse(ctx, -10, -44, 7, 7, '#f8fafc', { lineWidth: 1.2 });
      const needleAng = -0.8 + Math.sin(time * 3.5) * 0.55;
      setInkStyle(ctx, 1.6, '#dc2626');
      ctx.beginPath();
      ctx.moveTo(-10, -44);
      ctx.lineTo(-10 + Math.cos(needleAng) * 5.5, -44 + Math.sin(needleAng) * 5.5);
      ctx.stroke();
      // THREE real toothed golden clockwork gears meshing!
      drawGearWheel(ctx, -38, -118, 23, time * 0.75, 10, '#facc15', '#fef08a', '#b45309');
      drawGearWheel(ctx, -4, -92, 14, -time * 1.25 + 0.3, 8, '#d97706', '#fde047', '#78350f');
      drawGearWheel(ctx, -64, -84, 11, -time * 1.55, 7, '#f59e0b', '#fef9c3', '#92400e');
      drawCelRoundRect(ctx, 18, -94, 66, 94, 6, '#334155', { highlight: '#64748b', shadow: '#0f172a', lineWidth: 2.6 });
      drawCelRoundRect(ctx, 30, -72, 42, 72, 6, '#0f172a', { lineWidth: 2.4 });
      drawCelRoundRect(ctx, -84, -184, 152, 14, 3, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 2.1 });
      drawTeamFlag(ctx, 12, -184, pal, time);
      break;
    }

    case 7: {
      // Era 8: Reinforced World War Concrete Command Bunker + Riveted Steel, Alert Beacon & Sandbags
      setInkStyle(ctx, 2.6, '#334155');
      ctx.beginPath();
      ctx.moveTo(-48, -172);
      ctx.lineTo(-34, -228);
      ctx.lineTo(-20, -172);
      ctx.stroke();
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
      drawRivetStrip(ctx, -72, -166, 20, -166, 6, 1.5);
      // Slit pillbox observation windows + pulsing wartime alert lamp
      drawCelRoundRect(ctx, -64, -154, 72, 14, 3, '#0f172a', { lineWidth: 2.2 });
      ctx.fillStyle = 'rgba(251, 191, 36, 0.38)';
      ctx.fillRect(-58, -150, 60, 6);
      if (Math.sin(time * 5.2) > -0.2) {
        drawEnergyOrb(ctx, 22, -168, 4.5, '#ef4444', '#fef08a');
      }
      drawCelRoundRect(ctx, -78, -126, 122, 12, 2, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.9 });
      drawCelRoundRect(ctx, 26, -74, 48, 74, 4, '#1e293b', { lineWidth: 2.5 });
      drawRivetStrip(ctx, 32, -66, 32, -10, 4, 1.3);
      drawRivetStrip(ctx, 68, -66, 68, -10, 4, 1.3);
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 4 - row; i++) {
          drawCelEllipse(ctx, -70 + i * 22 + row * 10, -6 - row * 10, 13, 6.5, '#a16207', {
            highlight: '#d97706',
            shadow: '#713f12',
            lineWidth: 1.8,
          });
        }
      }
      drawTeamFlag(ctx, -34, -228, pal, time);
      break;
    }

    case 8: {
      // Era 9: Modern Reinforced Tactical Command HQ + Mast Radar Dish, Comms Array & Reflective Glass!
      drawCelRoundRect(ctx, -84, -196, 124, 196, 6, '#475569', {
        highlight: '#94a3b8',
        shadow: '#1e293b',
        lineWidth: 2.8,
      });
      drawRivetStrip(ctx, -76, -188, 30, -188, 6, 1.5);
      // Secondary comms whip antenna + roof aviation beacon
      setInkStyle(ctx, 2.2, '#94a3b8');
      ctx.beginPath();
      ctx.moveTo(16, -196);
      ctx.lineTo(16, -234);
      ctx.stroke();
      if (Math.sin(time * 4.5) > 0) {
        drawEnergyOrb(ctx, 16, -236, 3.8, '#ef4444', '#ffffff');
      }
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
      drawCelRoundRect(ctx, -68, -176, 86, 22, 4, '#0284c7', { highlight: '#7dd3fc', shadow: '#0c4a6e', lineWidth: 2.2 });
      ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
      ctx.beginPath();
      ctx.moveTo(-54, -175);
      ctx.lineTo(-42, -175);
      ctx.lineTo(-52, -155);
      ctx.lineTo(-64, -155);
      ctx.closePath();
      ctx.fill();
      drawCelRoundRect(ctx, -76, -138, 102, 12, 3, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 2.0 });
      drawCelRoundRect(ctx, -40, -214, 12, 20, 2, '#334155', { highlight: '#64748b', lineWidth: 2.0 });
      const sway = Math.sin(time * 2.2) * 0.25;
      ctx.save();
      ctx.translate(-34, -218);
      ctx.rotate(sway);
      drawCelEllipse(ctx, 0, 0, 22, 11, '#cbd5e1', { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.2 });
      drawEnergyOrb(ctx, 0, -6, 4.5, '#4ade80', '#ffffff');
      ctx.restore();
      drawCelRoundRect(ctx, 26, -78, 50, 78, 4, '#0f172a', { lineWidth: 2.5 });
      drawCelRoundRect(ctx, 26, -78, 50, 10, 2, '#facc15', { highlight: '#fef08a', lineWidth: 1.6 });
      ctx.fillStyle = INK;
      for (let hx = 30; hx < 72; hx += 10) {
        ctx.fillRect(hx, -77, 4, 8);
      }
      break;
    }

    case 9: {
      // Era 10: Sci-Fi Titanium Cyberpunk Arcology Core + Holographic Energy Wings & Shield Portal!
      // Glowing floating neon chevron energy wing beside tower
      const wingPulse = 0.55 + Math.sin(time * 4.2) * 0.25;
      ctx.save();
      ctx.globalAlpha = wingPulse;
      drawCelPoly(
        ctx,
        [
          [-86, -110],
          [-102, -170],
          [-82, -152],
          [-80, -104],
        ],
        pal.glow,
        { highlight: '#ffffff', lineWidth: 1.6 },
      );
      ctx.restore();
      drawCelPoly(
        ctx,
        [
          [-86, 0],
          [-74, -206],
          [-26, -234],
          [22, -206],
          [66, -126],
          [86, 0],
        ],
        '#e2e8f0',
        { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.8 },
      );
      drawCelRoundRect(ctx, -40, -206, 26, 176, 8, '#0f172a', { lineWidth: 2.4 });
      const pulse = 0.78 + Math.sin(time * 4.5) * 0.22;
      ctx.save();
      ctx.globalAlpha = pulse;
      drawCelRoundRect(ctx, -34, -198, 14, 160, 6, pal.glow, { highlight: '#ffffff', lineWidth: 1.6 });
      ctx.restore();
      for (let fy = -182; fy <= -62; fy += 30) {
        drawCelRoundRect(ctx, -44, fy, 34, 5, 2, '#94a3b8', { highlight: '#ffffff', lineWidth: 1.4 });
      }
      drawCelRoundRect(ctx, -72, -166, 92, 14, 4, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 2.0 });
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      const scanY = -74 + ((time * 42) % 66);
      ctx.fillRect(34, scanY, 38, 2.5);
      break;
    }

    case 10: {
      // Era 11: Interstellar Obsidian-Gold Cosmic Nexus + Levitating Pylon, Dual Rune Rings & Stargate!
      const pylonBob = Math.sin(time * 2.4) * 5;
      drawCelPoly(
        ctx,
        [
          [-94, -124 + pylonBob],
          [-84, -168 + pylonBob],
          [-74, -124 + pylonBob],
          [-84, -104 + pylonBob],
        ],
        '#312e81',
        { highlight: '#a855f7', shadow: '#09071a', lineWidth: 1.8 },
      );
      drawCelPoly(
        ctx,
        [
          [-88, 0],
          [-68, -194],
          [-18, -224],
          [36, -182],
          [84, -92],
          [88, 0],
        ],
        '#1e1b4b',
        { highlight: '#5b21b6', shadow: '#09071a', lineWidth: 2.9 },
      );
      drawCelPoly(
        ctx,
        [
          [-76, -16],
          [-56, -188],
          [-44, -188],
          [-62, -16],
        ],
        '#f59e0b',
        { highlight: '#fef08a', shadow: '#b45309', lineWidth: 1.9 },
      );
      drawCelPoly(
        ctx,
        [
          [16, -16],
          [22, -176],
          [34, -170],
          [28, -16],
        ],
        '#f59e0b',
        { highlight: '#fef08a', shadow: '#b45309', lineWidth: 1.9 },
      );
      const floatY = -228 + Math.sin(time * 2.8) * 4.5;
      ctx.save();
      ctx.translate(-18, floatY);
      setInkStyle(ctx, 4.0, INK);
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 10, -0.18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(240, 171, 252, 0.8)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 8, 0.25 + Math.sin(time * 1.4) * 0.1, 0, Math.PI * 2);
      ctx.stroke();
      drawEnergyOrb(ctx, 0, 0, 13, '#c084fc', '#fef08a');
      ctx.restore();
      drawCelEllipse(ctx, 50, -44, 24, 42, pal.main, { highlight: '#e879f9', shadow: '#312e81', lineWidth: 2.6 });
      drawCelEllipse(ctx, 50, -44, 16, 32, '#09071a', { lineWidth: 2.0 });
      drawEnergyOrb(ctx, 50, -44, 11 + Math.sin(time * 5) * 1.2, '#a855f7', '#fef08a');
      break;
    }

    default: {
      // Era 12 (NEW FUTURE ENDGAME): Chrono-Spire Cathedral (크로노 영원 성채)!
      const floatY = Math.sin(time * 2.6) * 4.2;

      // Colossal Rotating Golden Astral Chrono-Clock Halo behind Citadel Apex!
      ctx.save();
      ctx.translate(-14, -200 + floatY);
      setInkStyle(ctx, 5.2, INK);
      ctx.beginPath();
      ctx.arc(0, 0, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3.2;
      ctx.stroke();
      ctx.strokeStyle = '#2dd4bf';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = time * 0.55 + (i / 12) * Math.PI * 2;
        const card = i % 3 === 0;
        ctx.strokeStyle = card ? '#fef9c3' : '#2dd4bf';
        ctx.lineWidth = card ? 2.8 : 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (card ? 20 : 24), Math.sin(a) * (card ? 20 : 24));
        ctx.lineTo(Math.cos(a) * (card ? 36 : 32), Math.sin(a) * (card ? 36 : 32));
        ctx.stroke();
      }
      drawEnergyOrb(ctx, 0, 0, 11, '#2dd4bf', '#fef9c3');
      ctx.restore();

      // Glowing crystalline Seraph wing-buttress flanking left side
      drawCelPoly(
        ctx,
        [
          [-78, -90],
          [-102, -168 + floatY],
          [-76, -150 + floatY * 0.5],
          [-68, -76],
        ],
        '#2dd4bf',
        { highlight: '#ffffff', shadow: '#0f766e', lineWidth: 2.0 },
      );

      // Radiant Pearl-White & Royal-Gold Chrono Cathedral Monolith!
      drawCelPoly(
        ctx,
        [
          [-86, 0],
          [-72, -196],
          [-14, -236],
          [34, -186],
          [82, -96],
          [88, 0],
        ],
        '#f8fafc',
        { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 2.9 },
      );
      // Deep astral-teal inner energy spine + golden filigree ribs
      drawCelPoly(
        ctx,
        [
          [-44, -18],
          [-34, -196],
          [-14, -214],
          [6, -196],
          [12, -18],
        ],
        '#0f766e',
        { highlight: '#2dd4bf', shadow: '#083344', lineWidth: 2.2 },
      );
      drawCelPoly(
        ctx,
        [
          [-72, -14],
          [-56, -188],
          [-46, -188],
          [-60, -14],
        ],
        '#f59e0b',
        { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.8 },
      );
      drawCelRoundRect(ctx, -68, -148, 92, 13, 3.5, pal.main, {
        highlight: pal.light,
        shadow: pal.dark,
        lineWidth: 2.0,
      });
      // Vertical pulsing diamond energy core conduit
      const corePulse = 0.78 + Math.sin(time * 5) * 0.22;
      ctx.save();
      ctx.globalAlpha = corePulse;
      drawCelRoundRect(ctx, -20, -188, 12, 152, 6, '#2dd4bf', { highlight: '#ffffff', lineWidth: 1.5 });
      ctx.restore();

      // Golden-Framed Quantum Chrono-Gate Portal!
      drawCelEllipse(ctx, 50, -45, 25, 43, '#f59e0b', { highlight: '#fef9c3', shadow: '#92400e', lineWidth: 2.6 });
      drawCelEllipse(ctx, 50, -45, 18, 34, '#083344', { lineWidth: 2.0 });
      drawEnergyOrb(ctx, 50, -45, 12 + Math.sin(time * 5.2) * 1.4, '#2dd4bf', '#fef9c3');
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
// ALL 24 BESPOKE ROTATING FLASH-CARTOON TURRETS (facing RIGHT at angle 0)
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
  const rx = -Math.cos(aimAngle) * recoil * 5.2;
  const ry = -Math.sin(aimAngle) * recoil * 5.2;
  ctx.translate(rx, ry);
  ctx.rotate(aimAngle);
  if (facingLeft) {
    ctx.scale(1, -1);
  }

  switch (kind) {
    // ---- ERA I: STONE AGE ----
    case 'rock_dropper': {
      // Lashed timber boulder sling crane with rope coils & heavy flint rock
      drawCelRoundRect(ctx, -14, -7, 22, 14, 3, '#78350f', { highlight: '#b45309', shadow: '#451a03', lineWidth: 2.0 });
      drawCelRoundRect(ctx, -10, -8, 4, 16, 1, '#d97706', { highlight: '#fef08a', lineWidth: 1.2 });
      drawCelRoundRect(ctx, -5, -9, 22, 6, 2, '#92400e', { highlight: '#ca8a04', lineWidth: 1.8 });
      drawCelEllipse(ctx, 16, -6, 5.8, 5.2, '#64748b', { highlight: '#cbd5e1', shadow: '#1e293b', lineWidth: 1.7 });
      drawCelEllipse(ctx, -4, 0, 5, 5, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      break;
    }

    case 'bone_catapult': {
      // Prehistoric mammoth-rib & tusk torsion catapult with flaming stone!
      drawCelRoundRect(ctx, -15, -8, 22, 16, 3.5, '#5c3412', { highlight: '#92400e', shadow: '#3b180b', lineWidth: 2.0 });
      // Curved ivory tusk side-rails
      drawCelPoly(
        ctx,
        [
          [-10, -10],
          [12, -13],
          [16, -8],
          [-6, -6],
        ],
        '#fef3c7',
        { highlight: '#ffffff', shadow: '#d6c3a5', lineWidth: 1.7 },
      );
      drawCelRoundRect(ctx, -4, -3, 25, 6, 2, '#f8fafc', { highlight: '#ffffff', shadow: '#cbd5e1', lineWidth: 1.8 });
      drawCelEllipse(ctx, 18, 0, 6.2, 5.8, '#475569', { highlight: '#cbd5e1', lineWidth: 1.7 });
      drawCelEllipse(ctx, -6, 1, 5.2, 5.2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      if (firing) drawCartoonMuzzleFlash(ctx, 23, 0, 9, '#f97316', '#fef08a');
      break;
    }

    // ---- ERA II: ANCIENT EGYPT ----
    case 'obelisk_beam': {
      // Gilded sandstone obelisk solar prism emitter with Ankh crystal tip!
      drawCelPoly(
        ctx,
        [
          [-13, -9.5],
          [15, -5],
          [15, 5],
          [-13, 9.5],
        ],
        '#d97706',
        { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.1 },
      );
      drawCelRoundRect(ctx, -9, -5.5, 11, 11, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      drawCelRoundRect(ctx, 4, -6.5, 4, 13, 1, '#facc15', { highlight: '#ffffff', lineWidth: 1.3 });
      drawEnergyOrb(ctx, 19, 0, firing ? 9 : 5.5, '#fbbf24', '#ffffff');
      break;
    }

    case 'scarab_catapult': {
      // Jeweled gold-and-emerald winged Scarab solar orb launcher!
      drawCelEllipse(ctx, -3, 0, 14, 10.5, '#eab308', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.1 });
      // Winged emerald scarab elytra shells
      drawCelPoly(
        ctx,
        [
          [-10, -7],
          [2, -13],
          [8, -6],
        ],
        '#10b981',
        { highlight: '#6ee7b7', shadow: '#065f46', lineWidth: 1.4 },
      );
      drawCelPoly(
        ctx,
        [
          [-10, 7],
          [2, 13],
          [8, 6],
        ],
        '#10b981',
        { highlight: '#6ee7b7', shadow: '#065f46', lineWidth: 1.4 },
      );
      drawCelEllipse(ctx, -3, 0, 6.8, 5, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      drawCelRoundRect(ctx, 5, -4, 17, 8, 3, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.8 });
      drawEnergyOrb(ctx, 22, 0, firing ? 8.5 : 4.2, '#f59e0b', '#fef08a');
      break;
    }

    // ---- ERA III: CLASSICAL ----
    case 'arrow_tower': {
      // Timber-framed twin-bow archer parapet with quiver & notched arrows
      drawCelRoundRect(ctx, -13, -7.5, 22, 15, 3, '#854d0e', { highlight: '#ca8a04', shadow: '#451a03', lineWidth: 2.0 });
      setInkStyle(ctx, 4.0, INK);
      ctx.beginPath();
      ctx.moveTo(6, -13.5);
      ctx.quadraticCurveTo(15, 0, 6, 13.5);
      ctx.stroke();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      // Loaded steel-tipped arrow + red fletching
      drawCelRoundRect(ctx, -5, -1.6, 26, 3.2, 1, '#e2e8f0', { lineWidth: 1.3 });
      drawCelPoly(
        ctx,
        [
          [19, -3.5],
          [26, 0],
          [19, 3.5],
        ],
        '#f8fafc',
        { lineWidth: 1.2 },
      );
      drawCelEllipse(ctx, -6, 0, 4.8, 4.8, pal.main, { highlight: pal.light, lineWidth: 1.4 });
      if (firing) drawCartoonMuzzleFlash(ctx, 25, 0, 7.5, '#fde047', '#ffffff');
      break;
    }

    case 'ballista': {
      // Roman bronze-clad double-torsion siege ballista with armored shield plates!
      drawCelRoundRect(ctx, -15, -7, 26, 14, 3, '#92400e', { highlight: '#d97706', shadow: '#451a03', lineWidth: 2.0 });
      // Twin bronze torsion coil drums
      drawCelEllipse(ctx, 6, -10.5, 4.6, 4.6, '#f59e0b', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 1.5 });
      drawCelEllipse(ctx, 6, 10.5, 4.6, 4.6, '#f59e0b', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 1.5 });
      // Reinforced Roman bow arms + bowstring
      setInkStyle(ctx, 4.2, INK);
      ctx.beginPath();
      ctx.moveTo(6, -15);
      ctx.lineTo(14, -7);
      ctx.moveTo(6, 15);
      ctx.lineTo(14, 7);
      ctx.stroke();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      setInkStyle(ctx, 1.3, '#f8fafc');
      ctx.beginPath();
      ctx.moveTo(6, -14.5);
      ctx.lineTo(-4, 0);
      ctx.lineTo(6, 14.5);
      ctx.stroke();
      // Heavy siege iron lance bolt
      drawCelRoundRect(ctx, -4, -2.2, 28, 4.4, 1.2, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.5 });
      drawCelEllipse(ctx, -8, 0, 4.6, 4.6, pal.main, { highlight: pal.light, lineWidth: 1.4 });
      if (firing) drawCartoonMuzzleFlash(ctx, 26, 0, 9.5, '#fbbf24', '#ffffff');
      break;
    }

    // ---- ERA IV: EASTERN DYNASTY ----
    case 'dragon_repeater': {
      // Lacquered crimson & gold Chu-Ko-Nu repeating magazine crossbow battery!
      drawCelRoundRect(ctx, -14, -8, 22, 16, 3, '#991b1b', { highlight: '#ef4444', shadow: '#450a0a', lineWidth: 2.0 });
      drawCelRoundRect(ctx, -9, -12, 14, 7, 2, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.5 });
      setInkStyle(ctx, 4.2, INK);
      ctx.beginPath();
      ctx.moveTo(8, -14);
      ctx.quadraticCurveTo(16, 0, 8, 14);
      ctx.stroke();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      drawCelRoundRect(ctx, -2, -2.5, 25, 5, 1.2, '#fef9c3', { lineWidth: 1.4 });
      drawCelEllipse(ctx, -6, 0, 4.5, 4.5, pal.main, { highlight: pal.light, lineWidth: 1.4 });
      if (firing) drawCartoonMuzzleFlash(ctx, 25, 0, 9, '#facc15', '#ffffff');
      break;
    }

    case 'fire_ox_cannon': {
      // Ornate bronze Dragon-Head Fire-Rocket Cannon (화룡포)!
      drawCelRoundRect(ctx, -14, -9, 18, 18, 4, '#047857', { highlight: '#34d399', shadow: '#064e3b', lineWidth: 2.1 });
      drawCelPoly(
        ctx,
        [
          [-4, -7.5],
          [18, -6.5],
          [24, -10.5],
          [22, 0],
          [24, 10.5],
          [18, 6.5],
          [-4, 7.5],
        ],
        '#d97706',
        { highlight: '#fef9c3', shadow: '#92400e', lineWidth: 2.0 },
      );
      drawCelEllipse(ctx, 13, -4, 2.3, 2.3, '#ef4444', { highlight: '#fef08a', lineWidth: 1.0 });
      drawCelEllipse(ctx, -6, 0, 5, 5, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      drawEnergyOrb(ctx, 24, 0, firing ? 10.5 : 4.8, '#ef4444', '#fef08a');
      break;
    }

    // ---- ERA V: MEDIEVAL ----
    case 'crossbow_bastion': {
      // Crenellated steel-mantlet heavy medieval arbalest turret!
      drawCelRoundRect(ctx, -14, -8, 22, 16, 3.5, '#64748b', { highlight: '#cbd5e1', shadow: '#334155', lineWidth: 2.1 });
      // Front steel pavise gun-shield wing
      drawCelRoundRect(ctx, 4, -11, 5.5, 22, 2, '#94a3b8', { highlight: '#ffffff', shadow: '#475569', lineWidth: 1.6 });
      setInkStyle(ctx, 4.2, INK);
      ctx.beginPath();
      ctx.moveTo(9, -14);
      ctx.quadraticCurveTo(16, 0, 9, 14);
      ctx.stroke();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      drawCelRoundRect(ctx, -2, -2, 26, 4, 1, '#f8fafc', { lineWidth: 1.4 });
      drawCelEllipse(ctx, -6, 0, 5.0, 5.0, pal.main, { highlight: pal.light, lineWidth: 1.4 });
      if (firing) drawCartoonMuzzleFlash(ctx, 25, 0, 9, '#fde047', '#ffffff');
      break;
    }

    case 'keep_trebuchet': {
      // Heavy medieval counterweight timber trebuchet with flaming boulder pouch!
      drawCelRoundRect(ctx, -15, -9.5, 23, 19, 3, '#78350f', { highlight: '#b45309', shadow: '#451a03', lineWidth: 2.1 });
      drawCelRoundRect(ctx, -10, -3.8, 30, 7.6, 2, '#92400e', { highlight: '#ca8a04', lineWidth: 1.9 });
      drawCelRoundRect(ctx, -16, -5.5, 9, 11, 2, '#475569', { highlight: '#94a3b8', lineWidth: 1.7 });
      drawCelEllipse(ctx, -4, 0, 4.6, 4.6, pal.main, { highlight: pal.light, lineWidth: 1.4 });
      drawEnergyOrb(ctx, 20, 0, firing ? 9.5 : 5.5, '#f97316', '#fef08a');
      break;
    }

    // ---- ERA VI: GUNPOWDER ----
    case 'musket_battery': {
      // Triple-barrel Renaissance volley organ-gun battery with brass carriage!
      drawCelRoundRect(ctx, -14, -9.5, 19, 19, 4.5, '#78350f', { highlight: '#b45309', shadow: '#451a03', lineWidth: 2.1 });
      for (let b = -1; b <= 1; b++) {
        drawCelRoundRect(ctx, 2, -1.6 + b * 4.5, 21, 3.2, 1, '#334155', {
          highlight: '#cbd5e1',
          shadow: '#0f172a',
          lineWidth: 1.45,
        });
      }
      drawCelRoundRect(ctx, 13, -7.2, 3.8, 14.4, 1, '#d97706', { highlight: '#fef08a', lineWidth: 1.3 });
      drawCelEllipse(ctx, -6, 0, 5.2, 5.2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      if (firing) drawCartoonMuzzleFlash(ctx, 27, 0, 12, '#fbbf24', '#ffffff');
      break;
    }

    case 'fortress_cannon': {
      // Heavy cast-iron & brass-banded bastion siege cannon with flared muzzle!
      drawCelRoundRect(ctx, -14, -10, 18, 20, 5, '#475569', { highlight: '#94a3b8', shadow: '#1e293b', lineWidth: 2.1 });
      drawCelPoly(
        ctx,
        [
          [-5, -7.5],
          [21, -5],
          [24, -7],
          [24, 7],
          [21, 5],
          [-5, 7.5],
        ],
        '#1e293b',
        { highlight: '#94a3b8', shadow: '#090d16', lineWidth: 2.1 },
      );
      drawCelRoundRect(ctx, 4, -6.8, 4, 13.6, 1, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.3 });
      drawCelRoundRect(ctx, 15, -6, 3.8, 12, 1, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.3 });
      drawCelEllipse(ctx, -6, 0, 5.2, 5.2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      if (firing) drawCartoonMuzzleFlash(ctx, 29, 0, 14, '#f97316', '#fef08a');
      break;
    }

    // ---- ERA VII: STEAMPUNK ----
    case 'steam_repeater': {
      // Brass twin-barrel clockwork rotary repeater with side flywheel & copper feed!
      drawCelEllipse(ctx, -5, 0, 12, 11.5, '#d97706', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.1 });
      drawCelEllipse(ctx, -13, -7, 4.5, 4.5, '#facc15', { highlight: '#ffffff', lineWidth: 1.3 });
      drawCelRoundRect(ctx, -10, -5, 11, 10, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      drawCelRoundRect(ctx, 4, -5.8, 21, 4.2, 1.2, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.6 });
      drawCelRoundRect(ctx, 4, 1.6, 21, 4.2, 1.2, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.6 });
      drawCelRoundRect(ctx, 15, -6.8, 3.6, 13.6, 1, '#334155', { highlight: '#94a3b8', lineWidth: 1.2 });
      if (firing) drawCartoonMuzzleFlash(ctx, 29, 0, 13, '#f97316', '#fef08a');
      break;
    }

    case 'boiler_mortar': {
      // Riveted pressurized copper boiler siege mortar with pressure gauge!
      drawCelEllipse(ctx, -6, 0, 13, 12, '#b45309', { highlight: '#fbbf24', shadow: '#78350f', lineWidth: 2.2 });
      drawCelRoundRect(ctx, 2, -7.5, 20, 15, 3.5, '#334155', { highlight: '#94a3b8', shadow: '#0f172a', lineWidth: 2.1 });
      drawCelRoundRect(ctx, 18, -8.8, 5, 17.6, 1.5, '#d97706', { highlight: '#fef08a', lineWidth: 1.6 });
      drawCelEllipse(ctx, -6, 0, 5.8, 5.8, '#f8fafc', { lineWidth: 1.4 });
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-6, -4, 1.6, 4.5);
      drawCelRoundRect(ctx, -14, -4, 6, 8, 1.5, pal.main, { highlight: pal.light, lineWidth: 1.3 });
      if (firing) drawCartoonMuzzleFlash(ctx, 28, 0, 15, '#f97316', '#fef08a');
      break;
    }

    // ---- ERA VIII: WORLD WAR ----
    case 'mg_nest': {
      // Armored olive-drab machine-gun pillbox turret with ribbed cooling jacket & ammo belt!
      drawCelRoundRect(ctx, -14, -10, 21, 20, 6.5, '#4d5d38', { highlight: '#798c5c', shadow: '#2b361e', lineWidth: 2.2 });
      drawCelRoundRect(ctx, -10, -5.5, 10, 11, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      // Ribbed water-cooled MG barrel + flash hider
      drawCelRoundRect(ctx, 5, -3.5, 20, 7, 2, '#334155', { highlight: '#94a3b8', lineWidth: 1.9 });
      drawCelRoundRect(ctx, 9, -4.4, 8, 8.8, 1.2, '#475569', { highlight: '#cbd5e1', lineWidth: 1.3 });
      // Brass ammo feed box on flank
      drawCelRoundRect(ctx, -3, 6.5, 10, 5.5, 1.2, '#ca8a04', { highlight: '#fef08a', lineWidth: 1.3 });
      if (firing) drawCartoonMuzzleFlash(ctx, 29, 0, 12.5, '#fbbf24', '#ffffff');
      break;
    }

    case 'howitzer_turret': {
      // Heavy sloped wartime steel artillery cupola with muzzle brake & recoil cylinder!
      drawCelPoly(
        ctx,
        [
          [-15, -11],
          [6, -10],
          [11, -6],
          [11, 6],
          [6, 10],
          [-15, 11],
        ],
        '#475569',
        { highlight: '#94a3b8', shadow: '#1e293b', lineWidth: 2.2 },
      );
      drawCelRoundRect(ctx, -11, -5.5, 11, 11, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      // Heavy 155mm barrel + underside hydraulic recuperator + muzzle brake
      drawCelRoundRect(ctx, 7, -4.6, 20, 9.2, 2, '#334155', { highlight: '#cbd5e1', shadow: '#0f172a', lineWidth: 2.0 });
      drawCelRoundRect(ctx, 9, 4.2, 11, 3.6, 1, '#475569', { lineWidth: 1.2 });
      drawCelRoundRect(ctx, 24, -6.2, 5, 12.4, 1.2, '#1e293b', { highlight: '#64748b', lineWidth: 1.6 });
      if (firing) drawCartoonMuzzleFlash(ctx, 33, 0, 15.5, '#f97316', '#fef08a');
      break;
    }

    // ---- ERA IX: MODERN ----
    case 'vulcan_ciws': {
      // Iconic white Phalanx radar dome + 6-barrel rotary Vulcan gatling!
      drawCelRoundRect(ctx, -14, -10, 21, 20, 5, '#475569', { highlight: '#cbd5e1', shadow: '#1e293b', lineWidth: 2.2 });
      // Iconic white radar radome cap
      drawCelEllipse(ctx, -6, -9, 7, 5.5, '#f8fafc', { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 1.7 });
      drawCelRoundRect(ctx, -11, -4.5, 13, 9, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      for (let i = -1; i <= 1; i++) {
        drawCelRoundRect(ctx, 7, -1.5 + i * 3.6, 20, 2.8, 1, '#94a3b8', { highlight: '#ffffff', lineWidth: 1.35 });
      }
      drawCelRoundRect(ctx, 19, -5.8, 3.5, 11.6, 1, '#1e293b', { lineWidth: 1.2 });
      if (firing) drawCartoonMuzzleFlash(ctx, 30, 0, 13.5, '#fbbf24', '#ffffff');
      break;
    }

    case 'missile_pod': {
      // Armored 4-tube tactical MLRS missile battery with laser designator!
      drawCelRoundRect(ctx, -14, -10.5, 20, 21, 4, '#334155', { highlight: '#94a3b8', shadow: '#0f172a', lineWidth: 2.2 });
      drawCelRoundRect(ctx, -11, -5, 12, 10, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
      drawCelRoundRect(ctx, 3, -10.5, 19, 21, 3, '#475569', { highlight: '#cbd5e1', shadow: '#1e293b', lineWidth: 2.0 });
      // 4 glowing red missile warhead noses
      drawCelEllipse(ctx, 18.5, -5.2, 3.1, 3.1, '#ef4444', { highlight: '#fca5a5', lineWidth: 1.2 });
      drawCelEllipse(ctx, 18.5, 5.2, 3.1, 3.1, '#ef4444', { highlight: '#fca5a5', lineWidth: 1.2 });
      drawCelEllipse(ctx, 11.5, -5.2, 2.7, 2.7, '#ef4444', { highlight: '#fca5a5', lineWidth: 1.1 });
      drawCelEllipse(ctx, 11.5, 5.2, 2.7, 2.7, '#ef4444', { highlight: '#fca5a5', lineWidth: 1.1 });
      if (firing) drawCartoonMuzzleFlash(ctx, 27, 0, 14, '#f97316', '#fef08a');
      break;
    }

    // ---- ERA X: FUTURE ----
    case 'plasma_repeater': {
      // Sleek titanium twin-rail rapid plasma repeater with cyan cooling coils!
      drawCelEllipse(ctx, -4, 0, 13, 10.5, '#e2e8f0', { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.2 });
      drawCelRoundRect(ctx, -10, -4.8, 12, 9.6, 3, pal.main, { highlight: pal.light, lineWidth: 1.6 });
      drawCelRoundRect(ctx, 5, -6.2, 21, 4.2, 1.5, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.6 });
      drawCelRoundRect(ctx, 5, 2.0, 21, 4.2, 1.5, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.6 });
      ctx.fillStyle = pal.glow;
      ctx.fillRect(6, -2.0, 19, 4.0);
      drawEnergyOrb(ctx, 27, 0, firing ? 9.5 : 4.5, pal.glow, '#ffffff');
      break;
    }

    case 'ion_cannon': {
      // Heavy focusing-ring orbital-grade Ion Beam Cannon with dual capacitor coils!
      drawCelPoly(
        ctx,
        [
          [-15, -11],
          [5, -12],
          [12, -6],
          [12, 6],
          [5, 12],
          [-15, 11],
        ],
        '#f1f5f9',
        { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.2 },
      );
      drawCelRoundRect(ctx, -11, -5.5, 13, 11, 3, pal.main, { highlight: pal.light, lineWidth: 1.6 });
      // Long focusing emitter core + twin glowing cyan accelerator rings
      drawCelRoundRect(ctx, 8, -4.2, 19, 8.4, 2, '#0f172a', { highlight: '#334155', lineWidth: 1.7 });
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(10, -2.0, 16, 4.0);
      drawCelEllipse(ctx, 16, 0, 2.8, 9.8, '#38bdf8', { highlight: '#ffffff', lineWidth: 1.4 });
      drawCelEllipse(ctx, 23, 0, 2.6, 8.2, '#38bdf8', { highlight: '#ffffff', lineWidth: 1.4 });
      drawEnergyOrb(ctx, 29, 0, firing ? 11.5 : 5.8, '#22d3ee', '#ffffff');
      break;
    }

    // ---- ERA XI: INTERSTELLAR ----
    case 'prism_spire': {
      // Faceted obsidian-and-amethyst floating crystal prism spire turret!
      drawCelPoly(
        ctx,
        [
          [-14, -10],
          [6, -12],
          [16, 0],
          [6, 12],
          [-14, 10],
        ],
        '#1e1b4b',
        { highlight: '#6d28d9', shadow: '#09071a', lineWidth: 2.3 },
      );
      drawCelRoundRect(ctx, -10, -5, 12, 10, 3, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.6 });
      // Faceted glowing prism crystal nose
      drawCelPoly(
        ctx,
        [
          [10, -7],
          [26, 0],
          [10, 7],
          [14, 0],
        ],
        pal.glow,
        { highlight: '#ffffff', lineWidth: 1.5 },
      );
      drawEnergyOrb(ctx, 26, 0, firing ? 9.5 : 5.0, pal.glow, '#fef08a');
      break;
    }

    case 'singularity_cannon': {
      // Interstellar obsidian gravity-well cannon with golden dark-matter containment rings!
      drawCelPoly(
        ctx,
        [
          [-15, -11],
          [8, -13],
          [16, -6],
          [16, 6],
          [8, 13],
          [-15, 11],
        ],
        '#0f0a2c',
        { highlight: '#5b21b6', lineWidth: 2.3 },
      );
      drawCelRoundRect(ctx, -11, -5.5, 13, 11, 3, pal.main, { highlight: '#c084fc', lineWidth: 1.6 });
      drawCelEllipse(ctx, 17, 0, 3.6, 11.2, '#facc15', { highlight: '#ffffff', lineWidth: 1.6 });
      drawCelEllipse(ctx, 23, 0, 3.0, 9.0, '#c084fc', { highlight: '#ffffff', lineWidth: 1.5 });
      drawEnergyOrb(ctx, 27, 0, firing ? 11.5 : 6.4, '#a855f7', '#09071a');
      break;
    }

    // ---- ERA XII: TRANSCENDENT ----
    case 'chrono_pylon': {
      // Sacred pearl-white & royal gold Chrono Hourglass Pylon turret!
      drawCelPoly(
        ctx,
        [
          [-14, -10],
          [5, -12],
          [16, -5],
          [16, 5],
          [5, 12],
          [-14, 10],
        ],
        '#f8fafc',
        { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 2.2 },
      );
      drawCelRoundRect(ctx, -10, -5.5, 13, 11, 3, '#0f766e', { highlight: '#2dd4bf', lineWidth: 1.5 });
      drawCelRoundRect(ctx, -7, -3, 7, 6, 1.5, pal.main, { highlight: pal.light, lineWidth: 1.2 });
      drawCelEllipse(ctx, 16, 0, 3.4, 8.8, '#facc15', { highlight: '#ffffff', lineWidth: 1.5 });
      drawEnergyOrb(ctx, 24, 0, firing ? 10 : 5.6, '#2dd4bf', '#fef9c3');
      break;
    }

    default: {
      // Era XII: eternity_beam — Colossal Triple-Halo Transcendental Eternity Lance!
      drawCelPoly(
        ctx,
        [
          [-16, -11],
          [6, -13.5],
          [19, -5.5],
          [19, 5.5],
          [6, 13.5],
          [-16, 11],
        ],
        '#f8fafc',
        { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 2.3 },
      );
      drawCelRoundRect(ctx, -12, -6, 15, 12, 3, '#f59e0b', { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.5 });
      drawCelRoundRect(ctx, -8, -3.2, 8, 6.4, 1.5, pal.main, { highlight: pal.light, lineWidth: 1.2 });
      drawCelEllipse(ctx, 17, 0, 3.5, 12, '#facc15', { highlight: '#ffffff', lineWidth: 1.5 });
      drawCelEllipse(ctx, 23.5, 0, 3.0, 9.8, '#2dd4bf', { highlight: '#ffffff', lineWidth: 1.45 });
      drawEnergyOrb(ctx, 29, 0, firing ? 12.5 : 6.6, '#2dd4bf', '#fef9c3');
      break;
    }
  }

  ctx.restore();
}
