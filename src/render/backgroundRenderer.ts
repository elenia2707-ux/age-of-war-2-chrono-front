import { getEra } from '../data/eras';
import { GROUND_Y, WORLD_HEIGHT } from '../game/constants';
import { INK, drawCelEllipse, drawCelPoly, drawCelRoundRect, setInkStyle } from './cartoonPrimitives';

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  transition?: { active: boolean; fromEra: number; toEra: number; progress: number },
): void {
  ctx.save();

  if (transition && transition.active) {
    renderSingleEraBackground(ctx, transition.fromEra, cameraX, viewportW, time);
    ctx.save();
    ctx.globalAlpha = easeInOut(transition.progress);
    renderSingleEraBackground(ctx, transition.toEra, cameraX, viewportW, time);
    ctx.restore();

    const glowAlpha = Math.sin(transition.progress * Math.PI) * 0.25;
    if (glowAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 232, 150, ${glowAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT);
    }
    ctx.restore();
    return;
  }

  renderSingleEraBackground(ctx, eraIndex, cameraX, viewportW, time);
  ctx.restore();
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function renderSingleEraBackground(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
): void {
  const era = getEra(eraIndex);
  const p = era.palette;

  // 1. Rich Painterly Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y + 6);
  skyGrad.addColorStop(0, p.skyTop);
  skyGrad.addColorStop(0.54, p.skyMid);
  skyGrad.addColorStop(1, p.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewportW + 4, GROUND_Y + 6);

  // 2. Celestial Atmosphere (Sun / Stars / Ringed Planet / Clouds / Pterodactyls / Searchlights)
  drawSkyAtmosphere(ctx, eraIndex, cameraX, viewportW, time, p.sunColor, p.accent);

  // 3. Far Parallax Horizon & Landmarks (0.16x)
  drawFarLayer(ctx, eraIndex, cameraX, viewportW, time, p.farHill, p.accent);

  // 4. Mid Parallax Hills & Era Silhouettes (0.42x)
  drawMidLayer(ctx, eraIndex, cameraX, viewportW, time, p.midHill, p.nearProp, p.accent);

  // 5. Crisp Cartoon Battlefield Road & Ground Strata (1.0x)
  drawCartoonGround(ctx, eraIndex, cameraX, viewportW, p.groundTop, p.groundMid, p.groundDark, p.accent);
}

function drawSkyAtmosphere(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  sunColor: string,
  accent: string,
): void {
  const sunX = viewportW * 0.64 - cameraX * 0.045;
  const sunY = eraIndex >= 8 ? 92 : 104;

  ctx.save();

  // Twinkling starfield for Future & Interstellar eras
  if (eraIndex >= 8) {
    for (let i = 0; i < 42; i++) {
      const sx = ((i * 197 + 41 - cameraX * 0.03) % (viewportW + 40) + (viewportW + 40)) % (viewportW + 40) - 20;
      const sy = 16 + ((i * 83) % 185);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.8 + i * 1.3));
      ctx.fillStyle = i % 5 === 0 ? '#fef08a' : '#e0f2fe';
      ctx.globalAlpha = tw * 0.85;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 7 === 0 ? 2.2 : 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Luminous atmospheric sun / cosmic orb
  const haloR = eraIndex === 1 || eraIndex === 9 ? 115 : 88;
  const halo = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, haloR);
  halo.addColorStop(0, 'rgba(255,255,255,0.92)');
  halo.addColorStop(0.26, sunColor);
  halo.addColorStop(0.6, eraIndex === 9 ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 232, 160, 0.16)');
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Crisp glowing disc
  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, eraIndex === 1 || eraIndex === 9 ? 31 : 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.arc(sunX - 6, sunY - 6, 9, 0, Math.PI * 2);
  ctx.fill();

  // Interstellar ringed planet & nebula ribbon!
  if (eraIndex === 9) {
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(-0.28);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.78)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 62, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Soft stylized cartoon clouds (Eras 0–7)
  if (eraIndex <= 7) {
    const cloudCol =
      eraIndex === 6
        ? 'rgba(148, 163, 184, 0.24)'
        : eraIndex === 5
          ? 'rgba(254, 215, 170, 0.34)'
          : 'rgba(255, 255, 255, 0.34)';
    ctx.fillStyle = cloudCol;
    for (let i = 0; i < 5; i++) {
      const span = viewportW + 280;
      const cx =
        (((i * 270 + time * (7 + i * 1.3) - cameraX * 0.08) % span) + span) % span - 140;
      const cy = 54 + (i % 3) * 34;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.arc(cx + 20, cy - 8, 26, 0, Math.PI * 2);
      ctx.arc(cx + 44, cy, 20, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy + 6, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Era 1: Gliding prehistoric pterodactyl silhouettes
  if (eraIndex === 0) {
    setInkStyle(ctx, 2.2, 'rgba(69, 26, 3, 0.55)');
    for (let i = 0; i < 3; i++) {
      const span = viewportW + 200;
      const bx = (((i * 310 + time * 24 - cameraX * 0.1) % span) + span) % span - 80;
      const by = 68 + i * 26 + Math.sin(time * 2 + i) * 6;
      const flap = Math.sin(time * 5 + i * 2) * 5;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by + flap);
      ctx.quadraticCurveTo(bx - 4, by - 6, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 6, bx + 12, by + flap);
      ctx.stroke();
    }
  }

  // Era 7: Sweeping wartime anti-air searchlight cones!
  if (eraIndex === 6) {
    for (let i = 0; i < 3; i++) {
      const bx = viewportW * (0.22 + i * 0.3) - (cameraX * 0.1) % 140;
      const ang = -Math.PI / 2 + Math.sin(time * 0.9 + i * 2.1) * 0.38;
      ctx.save();
      ctx.translate(bx, GROUND_Y);
      ctx.rotate(ang);
      const beam = ctx.createLinearGradient(0, 0, 320, 0);
      beam.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
      beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(320, -48);
      ctx.lineTo(320, 48);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Era 9: Flying cyberpunk skyline traffic streaks
  if (eraIndex === 8) {
    for (let i = 0; i < 6; i++) {
      const span = viewportW + 160;
      const dir = i % 2 === 0 ? 1 : -1;
      const tx = (((i * 190 + time * 85 * dir - cameraX * 0.12) % span) + span) % span - 80;
      const ty = 115 + (i % 4) * 28;
      ctx.fillStyle = i % 2 === 0 ? accent : '#f43f5e';
      ctx.globalAlpha = 0.72;
      ctx.fillRect(tx, ty, 18, 2.5);
    }
  }

  ctx.restore();
}

function drawFarLayer(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  farColor: string,
  accent: string,
): void {
  const offset = -(cameraX * 0.16);
  ctx.save();

  if (eraIndex === 0) {
    // Smoking cartoon prehistoric mountains & volcanoes!
    const spacing = 260;
    const start = Math.floor((-offset - 160) / spacing);
    const end = Math.ceil((viewportW - offset + 160) / spacing);
    for (let i = start; i <= end; i++) {
      const mx = i * spacing + offset;
      const isVolcano = Math.abs(i) % 2 === 1;
      const h = isVolcano ? 154 : 118 + (Math.abs(i * 37) % 36);
      ctx.fillStyle = farColor;
      ctx.beginPath();
      ctx.moveTo(mx - 140, GROUND_Y);
      if (isVolcano) {
        ctx.lineTo(mx - 26, GROUND_Y - h);
        ctx.lineTo(mx + 26, GROUND_Y - h);
      } else {
        ctx.quadraticCurveTo(mx, GROUND_Y - h - 22, mx + 140, GROUND_Y);
      }
      ctx.lineTo(mx + 140, GROUND_Y);
      ctx.closePath();
      ctx.fill();
      if (isVolcano) {
        // Glowing lava rim + cartoon smoke plume
        ctx.fillStyle = '#f97316';
        ctx.fillRect(mx - 22, GROUND_Y - h, 44, 6);
        const sOff = (time * 14) % 28;
        ctx.fillStyle = 'rgba(241, 245, 249, 0.25)';
        ctx.beginPath();
        ctx.arc(mx + sOff * 0.7, GROUND_Y - h - 18 - sOff * 0.5, 18, 0, Math.PI * 2);
        ctx.arc(mx + 24 + sOff * 0.9, GROUND_Y - h - 32 - sOff * 0.4, 24, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (eraIndex === 1) {
    // Iconic Giza Pyramids silhouette across the desert horizon!
    const spacing = 310;
    const start = Math.floor((-offset - 180) / spacing);
    const end = Math.ceil((viewportW - offset + 180) / spacing);
    for (let i = start; i <= end; i++) {
      const px = i * spacing + offset;
      const h = 138 + (Math.abs(i) % 2) * 38;
      const hw = h * 0.92;
      // Shaded right face + sunlit left face
      ctx.fillStyle = farColor;
      ctx.beginPath();
      ctx.moveTo(px - hw, GROUND_Y);
      ctx.lineTo(px, GROUND_Y - h);
      ctx.lineTo(px + hw, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(254, 240, 138, 0.24)';
      ctx.beginPath();
      ctx.moveTo(px - hw, GROUND_Y);
      ctx.lineTo(px, GROUND_Y - h);
      ctx.lineTo(px - hw * 0.12, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Golden pyramidion capstone
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(px - hw * 0.14, GROUND_Y - h * 0.86);
      ctx.lineTo(px, GROUND_Y - h);
      ctx.lineTo(px + hw * 0.14, GROUND_Y - h * 0.86);
      ctx.closePath();
      ctx.fill();
    }
  } else if (eraIndex === 5 || eraIndex === 7 || eraIndex === 8) {
    // Industrial steampunk / Modern metropolis / Sci-fi cyberpunk skyline!
    const spacing = 74;
    const start = Math.floor((-offset - 90) / spacing);
    const end = Math.ceil((viewportW - offset + 90) / spacing);
    for (let i = start; i <= end; i++) {
      const bx = i * spacing + offset;
      const seed = Math.abs(i * 73 + 19);
      const bw = 42 + (seed % 28);
      const bh = 95 + (seed % 110);
      ctx.fillStyle = farColor;
      ctx.beginPath();
      ctx.roundRect(bx, GROUND_Y - bh, bw, bh, eraIndex === 8 ? [10, 10, 0, 0] : 2);
      ctx.fill();

      // Lit glowing city / cyberpunk windows or steampunk smokestacks
      if (eraIndex === 5) {
        if (seed % 3 === 0) {
          ctx.fillRect(bx + bw * 0.35, GROUND_Y - bh - 28, 10, 28);
        }
      } else {
        ctx.fillStyle = eraIndex === 8 ? accent : 'rgba(254, 240, 138, 0.42)';
        ctx.globalAlpha = eraIndex === 8 ? 0.52 : 0.7;
        for (let wy = GROUND_Y - bh + 12; wy < GROUND_Y - 28; wy += 16) {
          for (let wx = bx + 7; wx < bx + bw - 10; wx += 11) {
            if ((wx + wy + seed) % 3 !== 0) {
              ctx.fillRect(wx, wy, 5, 8);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
    }
  } else if (eraIndex === 9) {
    // Floating golden-trimmed cosmic monoliths hovering over interstellar abyss!
    const spacing = 220;
    const start = Math.floor((-offset - 120) / spacing);
    const end = Math.ceil((viewportW - offset + 120) / spacing);
    for (let i = start; i <= end; i++) {
      const mx = i * spacing + offset;
      const bob = Math.sin(time * 1.1 + i * 1.7) * 8;
      const mh = 110 + (Math.abs(i * 41) % 65);
      const my = GROUND_Y - 120 + bob;
      ctx.fillStyle = farColor;
      ctx.beginPath();
      ctx.moveTo(mx, my - mh * 0.55);
      ctx.lineTo(mx + 26, my);
      ctx.lineTo(mx, my + mh * 0.42);
      ctx.lineTo(mx - 26, my);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
      ctx.fillRect(mx - 2, my - mh * 0.35, 4, mh * 0.65);
    }
  } else {
    // Smooth sweeping cartoon mountain range (Classical / Medieval / Gunpowder / WW)
    ctx.fillStyle = farColor;
    ctx.beginPath();
    ctx.moveTo(-20, GROUND_Y);
    const step = 120;
    const start = Math.floor((-offset - 140) / step);
    const end = Math.ceil((viewportW - offset + 140) / step);
    for (let i = start; i <= end; i++) {
      const x = i * step + offset;
      const peakY = GROUND_Y - 96 - Math.sin(i * 1.35) * 34 - Math.cos(i * 0.72) * 24;
      const nextX = (i + 1) * step + offset;
      const midX = (x + nextX) * 0.5;
      ctx.quadraticCurveTo(x, peakY, midX, GROUND_Y - 68);
    }
    ctx.lineTo(viewportW + 40, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Distant Medieval castle or Classical Parthenon landmark silhouettes anchored into ridge!
    if (eraIndex === 2 || eraIndex === 3) {
      const lx = ((420 + offset) % (viewportW + 300) + (viewportW + 300)) % (viewportW + 300) - 100;
      ctx.fillStyle = farColor;
      if (eraIndex === 2) {
        // Parthenon temple seated atop acropolis cliff down to GROUND_Y
        ctx.beginPath();
        ctx.moveTo(lx - 76, GROUND_Y);
        ctx.lineTo(lx - 48, GROUND_Y - 98);
        ctx.lineTo(lx + 48, GROUND_Y - 98);
        ctx.lineTo(lx + 76, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(lx - 44, GROUND_Y - 134, 88, 38);
        ctx.beginPath();
        ctx.moveTo(lx - 50, GROUND_Y - 134);
        ctx.lineTo(lx, GROUND_Y - 154);
        ctx.lineTo(lx + 50, GROUND_Y - 134);
        ctx.closePath();
        ctx.fill();
      } else {
        // Fairytale distant medieval keep grounded on hilltop ridge down to GROUND_Y
        ctx.beginPath();
        ctx.moveTo(lx - 86, GROUND_Y);
        ctx.lineTo(lx - 46, GROUND_Y - 96);
        ctx.lineTo(lx + 46, GROUND_Y - 96);
        ctx.lineTo(lx + 86, GROUND_Y);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(lx - 32, GROUND_Y - 144, 64, 52);
        ctx.fillRect(lx - 42, GROUND_Y - 166, 18, 74);
        ctx.fillRect(lx + 24, GROUND_Y - 166, 18, 74);
        ctx.beginPath();
        ctx.moveTo(lx - 45, GROUND_Y - 166);
        ctx.lineTo(lx - 33, GROUND_Y - 190);
        ctx.lineTo(lx - 21, GROUND_Y - 166);
        ctx.moveTo(lx + 21, GROUND_Y - 166);
        ctx.lineTo(lx + 33, GROUND_Y - 190);
        ctx.lineTo(lx + 45, GROUND_Y - 166);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

function drawMidLayer(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  midColor: string,
  propColor: string,
  accent: string,
): void {
  const offset = -(cameraX * 0.42);
  ctx.save();

  // Rolling smooth cartoon hills
  ctx.fillStyle = midColor;
  ctx.beginPath();
  ctx.moveTo(-20, GROUND_Y);
  const step = 160;
  const start = Math.floor((-offset - 180) / step);
  const end = Math.ceil((viewportW - offset + 180) / step);
  for (let i = start; i <= end; i++) {
    const x = i * step + offset;
    const h = 42 + Math.sin(i * 1.15 + eraIndex) * 20 + Math.cos(i * 0.65) * 14;
    ctx.quadraticCurveTo(x, GROUND_Y - h - 18, x + step * 0.5, GROUND_Y - h * 0.55);
  }
  ctx.lineTo(viewportW + 40, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Era-specific midground props along the ridge
  const propStep = 210;
  const pStart = Math.floor((-offset - 120) / propStep);
  const pEnd = Math.ceil((viewportW - offset + 120) / propStep);
  for (let i = pStart; i <= pEnd; i++) {
    const px = i * propStep + offset + ((i * 59) & 31);
    const py = GROUND_Y - 6;

    if (eraIndex === 0 || eraIndex === 3 || eraIndex === 4) {
      // Stylized Kingdom-Rush cartoon pine / palm / oak trees
      ctx.fillStyle = propColor;
      ctx.fillRect(px - 4, py - 34, 8, 34);
      ctx.beginPath();
      ctx.arc(px, py - 42, 18, 0, Math.PI * 2);
      ctx.arc(px - 12, py - 32, 13, 0, Math.PI * 2);
      ctx.arc(px + 12, py - 32, 13, 0, Math.PI * 2);
      ctx.fill();
    } else if (eraIndex === 1) {
      // Desert date palms & sandstone obelisks
      ctx.fillStyle = propColor;
      if (Math.abs(i) % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(px - 8, py);
        ctx.lineTo(px - 5, py - 46);
        ctx.lineTo(px, py - 58);
        ctx.lineTo(px + 5, py - 46);
        ctx.lineTo(px + 8, py);
        ctx.fill();
      } else {
        ctx.fillRect(px - 3, py - 38, 6, 38);
        for (let f = -2; f <= 2; f++) {
          ctx.beginPath();
          ctx.ellipse(px + f * 9, py - 38 + Math.abs(f) * 3, 12, 4, f * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (eraIndex === 2) {
      // Classical cypress trees & marble columns
      ctx.fillStyle = propColor;
      ctx.beginPath();
      ctx.ellipse(px, py - 28, 9, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (eraIndex === 5) {
      // Steampunk factory pipes & rotating gear silhouettes
      ctx.fillStyle = propColor;
      ctx.fillRect(px - 7, py - 46, 14, 46);
      ctx.beginPath();
      ctx.arc(px + 18, py - 22, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (eraIndex === 8 || eraIndex === 9) {
      // Glowing futuristic / cosmic energy pylons
      ctx.fillStyle = propColor;
      ctx.beginPath();
      ctx.moveTo(px - 10, py);
      ctx.lineTo(px - 4, py - 52);
      ctx.lineTo(px + 4, py - 52);
      ctx.lineTo(px + 10, py);
      ctx.fill();
      const pulse = 0.65 + Math.sin(time * 3 + i) * 0.3;
      ctx.fillStyle = accent;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(px, py - 54, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Sandbag posts / ruined wall silhouettes (Era 6/7/8)
      ctx.fillStyle = propColor;
      ctx.fillRect(px - 14, py - 22, 28, 22);
      ctx.fillRect(px - 8, py - 34, 14, 14);
    }
  }

  ctx.restore();
}

function drawCartoonGround(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  topCol: string,
  midCol: string,
  darkCol: string,
  accent: string,
): void {
  const groundH = WORLD_HEIGHT - GROUND_Y;

  // Sub-ground deep strata gradient
  const gGrad = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_HEIGHT);
  gGrad.addColorStop(0, midCol);
  gGrad.addColorStop(0.42, darkCol);
  gGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, GROUND_Y, viewportW + 4, groundH + 4);

  // Top walkable battlefield road strip with crisp cartoon bevel
  ctx.fillStyle = topCol;
  ctx.fillRect(0, GROUND_Y - 3, viewportW + 4, 17);

  // Subtle top highlight rim along road surface
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(0, GROUND_Y - 2, viewportW + 4, 3);

  // World-locked road surface details (pebbles / cobblestones / dashed road / cyber circuit lines)
  const tileW = 64;
  const start = Math.floor((cameraX - 64) / tileW);
  const end = Math.ceil((cameraX + viewportW + 64) / tileW);

  ctx.save();
  for (let i = start; i <= end; i++) {
    const sx = i * tileW - cameraX;
    if (eraIndex === 2 || eraIndex === 3 || eraIndex === 4) {
      // Stylized cartoon cobblestones
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
      ctx.beginPath();
      ctx.roundRect(sx + 4, GROUND_Y + 2, 24, 8, 3);
      ctx.roundRect(sx + 34, GROUND_Y + 3, 22, 7, 3);
      ctx.fill();
    } else if (eraIndex === 7) {
      // Modern road lane dashes
      ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
      ctx.fillRect(sx + 12, GROUND_Y + 5, 28, 3);
    } else if (eraIndex >= 8) {
      // Glowing neon sci-fi / cosmic energy deck seams!
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(sx + 8, GROUND_Y + 5, 42, 2.5);
      ctx.globalAlpha = 1;
    } else {
      // Organic cartoon pebbles & soil tufts
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.beginPath();
      ctx.ellipse(sx + 16, GROUND_Y + 7, 7, 2.8, 0, 0, Math.PI * 2);
      ctx.ellipse(sx + 48, GROUND_Y + 6, 5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Crisp dark cartoon ink horizon border separating sky from walkable road
  setInkStyle(ctx, 2.6, INK);
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 3);
  ctx.lineTo(viewportW + 4, GROUND_Y - 3);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 14);
  ctx.lineTo(viewportW + 4, GROUND_Y + 14);
  ctx.stroke();
  ctx.restore();
}

export function renderForegroundParallax(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
): void {
  const offset = -(cameraX * 1.18);
  const spacing = 220;
  const startIdx = Math.floor((-offset - 120) / spacing);
  const endIdx = Math.ceil((viewportW - offset + 120) / spacing);
  const era = getEra(eraIndex);

  ctx.save();
  for (let i = startIdx; i <= endIdx; i++) {
    const px = i * spacing + offset + (((i * 53) & 31) - 16);
    const py = GROUND_Y + 34;
    const sway = Math.sin(time * 2.1 + i) * 2.5;

    if (eraIndex === 0 || eraIndex === 3) {
      // Cartoon grass bush tuft + pebbles
      drawCelPoly(
        ctx,
        [
          [px - 14, py],
          [px - 18 + sway, py - 14],
          [px - 6, py - 7],
          [px + sway, py - 18],
          [px + 6, py - 7],
          [px + 18 + sway, py - 13],
          [px + 14, py],
        ],
        era.palette.groundTop,
        { lineWidth: 1.8 },
      );
    } else if (eraIndex === 1 || eraIndex === 2) {
      // Stylized sandstone boulder / marble rubble
      drawCelEllipse(ctx, px, py - 6, 15, 8, era.palette.nearProp, {
        highlight: 'rgba(255,255,255,0.2)',
        lineWidth: 1.8,
      });
    } else if (eraIndex >= 8) {
      // Glowing sci-fi / cosmic crystal cluster along foreground lip
      drawCelPoly(
        ctx,
        [
          [px - 10, py],
          [px - 5, py - 18],
          [px + 2, py - 11],
          [px + 8, py - 21],
          [px + 13, py],
        ],
        era.palette.accent,
        { highlight: '#ffffff', lineWidth: 1.7 },
      );
    } else {
      // Subtle military crate / gear / road bollard silhouette
      drawCelRoundRect(ctx, px - 12, py - 12, 24, 12, 3, era.palette.nearProp, {
        highlight: 'rgba(255,255,255,0.14)',
        lineWidth: 1.8,
      });
    }
  }
  ctx.restore();
}
