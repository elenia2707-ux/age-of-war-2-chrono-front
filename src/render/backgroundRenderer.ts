import { getEra } from '../data/eras';
import { GROUND_Y, WORLD_HEIGHT, WORLD_WIDTH } from '../game/constants';

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  transition?: { active: boolean; fromEra: number; toEra: number; progress: number },
): void {
  if (transition && transition.active) {
    renderSingleEraBackground(ctx, transition.fromEra, cameraX, viewportW, time);
    ctx.save();
    ctx.globalAlpha = easeInOut(transition.progress);
    renderSingleEraBackground(ctx, transition.toEra, cameraX, viewportW, time);
    ctx.restore();

    const glowAlpha = Math.sin(transition.progress * Math.PI) * 0.28;
    if (glowAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 224, 130, ${glowAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, viewportW, WORLD_HEIGHT);
      ctx.restore();
    }
    return;
  }

  renderSingleEraBackground(ctx, eraIndex, cameraX, viewportW, time);
}

/**
 * Foreground parallax grass / rocks / barbed wire / neon pylons drawn subtly
 * along the bottom lip of the battlefield road (1.18x parallax) for rich 2.5D depth.
 */
export function renderForegroundParallax(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
): void {
  const offset = -(cameraX * 1.18);
  const spacing = 175;
  const startIdx = Math.floor((-offset - 100) / spacing);
  const endIdx = Math.ceil((viewportW - offset + 100) / spacing);

  ctx.save();
  for (let i = startIdx; i <= endIdx; i++) {
    const px = i * spacing + offset + (((i * 53) & 31) - 16);
    const py = GROUND_Y + 26;

    if (eraIndex === 0) {
      // Prehistoric silhouetted foreground ferns & mossy rock
      ctx.fillStyle = '#1b2112';
      ctx.beginPath();
      ctx.ellipse(px, py + 4, 24, 11, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#263318';
      for (let b = -2; b <= 2; b++) {
        const sway = Math.sin(time * 2.2 + i + b) * 2.2;
        ctx.beginPath();
        ctx.moveTo(px + b * 7, py + 3);
        ctx.quadraticCurveTo(px + b * 11 + sway, py - 14, px + b * 16 + sway, py - 21);
        ctx.quadraticCurveTo(px + b * 9, py - 9, px + b * 7 + 4, py + 3);
        ctx.closePath();
        ctx.fill();
      }
    } else if (eraIndex === 1) {
      // Ancient broken sandstone chunks & desert reeds
      ctx.fillStyle = '#3d2d1a';
      ctx.beginPath();
      ctx.moveTo(px - 18, py + 6);
      ctx.lineTo(px - 10, py - 10);
      ctx.lineTo(px + 8, py - 12);
      ctx.lineTo(px + 20, py + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5c462a';
      ctx.fillRect(px - 8, py - 10, 14, 4);
    } else if (eraIndex === 2) {
      // Lush dark-emerald grass tufts & fallen arrow shaft
      ctx.fillStyle = '#1e3018';
      for (let g = -3; g <= 3; g++) {
        const sway = Math.sin(time * 2.5 + i + g) * 1.8;
        ctx.beginPath();
        ctx.moveTo(px + g * 5, py + 4);
        ctx.lineTo(px + g * 6.5 + sway, py - 14 - (Math.abs(g) % 2) * 5);
        ctx.lineTo(px + g * 5 + 4, py + 4);
        ctx.closePath();
        ctx.fill();
      }
    } else if (eraIndex === 3) {
      // Muddy parapet stones & shrub
      ctx.fillStyle = '#24231a';
      ctx.beginPath();
      ctx.arc(px, py - 2, 14, Math.PI, 0);
      ctx.arc(px + 14, py, 10, Math.PI, 0);
      ctx.fill();
    } else if (eraIndex === 4) {
      // Coiled foreground barbed wire & sandbag silhouette
      ctx.fillStyle = '#242019';
      ctx.beginPath();
      ctx.ellipse(px - 10, py, 16, 8, 0, Math.PI, 0);
      ctx.ellipse(px + 10, py + 1, 14, 7, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#181a1c';
      ctx.lineWidth = 1.8;
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath();
        ctx.arc(px + c * 11, py - 7, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (eraIndex === 5) {
      // Concrete road barrier silhouette
      ctx.fillStyle = '#192028';
      ctx.beginPath();
      ctx.moveTo(px - 22, py + 5);
      ctx.lineTo(px - 15, py - 12);
      ctx.lineTo(px + 15, py - 12);
      ctx.lineTo(px + 22, py + 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.fillRect(px - 11, py - 9, 22, 3);
    } else {
      // Era 7: Low metallic deck pylon with pulsing cyan LED strip
      ctx.fillStyle = '#0c1622';
      ctx.beginPath();
      ctx.moveTo(px - 16, py + 6);
      ctx.lineTo(px - 10, py - 15);
      ctx.lineTo(px + 10, py - 15);
      ctx.lineTo(px + 16, py + 6);
      ctx.closePath();
      ctx.fill();
      const glow = 0.45 + Math.sin(time * 4 + i) * 0.25;
      ctx.fillStyle = `rgba(34, 211, 238, ${glow.toFixed(2)})`;
      ctx.fillRect(px - 7, py - 11, 14, 2.5);
    }
  }
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

  // 1. Rich Multi-Stop Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, p.skyTop);
  skyGrad.addColorStop(0.55, p.skyMid);
  skyGrad.addColorStop(1, p.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewportW, GROUND_Y + 4);

  // Celestial body, clouds & sky atmosphere
  drawSkyAtmosphere(ctx, eraIndex, cameraX, viewportW, time, p.sunColor);

  // 2. Far Horizon Silhouettes (parallax 0.16)
  drawFarLayer(ctx, eraIndex, cameraX, viewportW, time, p.farHill, p.skyBottom);

  // Atmospheric distance mist separating Far from Mid layer
  const farMist = ctx.createLinearGradient(0, GROUND_Y - 120, 0, GROUND_Y);
  farMist.addColorStop(0, p.skyBottom + '00');
  farMist.addColorStop(1, p.skyBottom + '42');
  ctx.fillStyle = farMist;
  ctx.fillRect(0, GROUND_Y - 120, viewportW, 120);

  // 3. Midground Scenic Landmarks (parallax 0.38)
  drawMidLayer(ctx, eraIndex, cameraX, viewportW, time, p.midHill, p.nearProp, p.accent);

  // 4. High-Detail Era Ground & Battlefield Road (parallax 1.0)
  drawGround(ctx, eraIndex, cameraX, viewportW, time, p.groundTop, p.groundMid, p.groundDark, p.accent);
}

function drawSkyAtmosphere(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  sunColor: string,
): void {
  const sunX = viewportW * 0.62 - cameraX * 0.05;
  const sunY = eraIndex === 6 ? 95 : 108;

  ctx.save();
  // Warm/electric god-ray glow halo
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 130);
  halo.addColorStop(0, sunColor);
  halo.addColorStop(0.28, sunColor + '70');
  halo.addColorStop(0.65, sunColor + '1c');
  halo.addColorStop(1, sunColor + '00');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, eraIndex === 6 ? 28 : 24, 0, Math.PI * 2);
  ctx.fill();

  if (eraIndex === 0) {
    // Gliding pterodactyl flock
    ctx.strokeStyle = 'rgba(42, 20, 14, 0.62)';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 4; i++) {
      const bx = ((i * 290 + time * 24 - cameraX * 0.12) % (viewportW + 180) + (viewportW + 180)) % (viewportW + 180) - 90;
      const by = 68 + (i % 3) * 26 + Math.sin(time * 2.5 + i) * 5;
      const flap = Math.sin(time * 5.2 + i * 2) * 5.5;
      ctx.beginPath();
      ctx.moveTo(bx - 13, by + flap);
      ctx.quadraticCurveTo(bx - 4, by - 6, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 6, bx + 13, by + flap);
      ctx.stroke();
    }
  } else if (eraIndex === 4) {
    // Sweeping wartime anti-aircraft searchlights + distant zeppelin
    ctx.fillStyle = 'rgba(245, 236, 198, 0.08)';
    for (let i = 0; i < 4; i++) {
      const lx = ((i * 290 - cameraX * 0.18) % (viewportW + 300) + (viewportW + 300)) % (viewportW + 300) - 100;
      const sway = Math.sin(time * 0.75 + i * 2.1) * 85;
      ctx.beginPath();
      ctx.moveTo(lx, GROUND_Y - 20);
      ctx.lineTo(lx - 28 + sway, 0);
      ctx.lineTo(lx + 28 + sway, 0);
      ctx.closePath();
      ctx.fill();
    }
    const zx = ((time * 9 + 240 - cameraX * 0.09) % (viewportW + 260) + (viewportW + 260)) % (viewportW + 260) - 130;
    ctx.fillStyle = 'rgba(28, 30, 32, 0.56)';
    ctx.beginPath();
    ctx.ellipse(zx, 74, 36, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(zx - 11, 84, 22, 4.5);
  } else if (eraIndex === 5) {
    ctx.strokeStyle = 'rgba(226, 241, 255, 0.24)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 96);
    ctx.lineTo(viewportW + 20, 56);
    ctx.moveTo(-20, 128);
    ctx.lineTo(viewportW + 20, 82);
    ctx.stroke();
  } else if (eraIndex === 6) {
    // Deep starfield, nebula streaks, and dual planetary orbital rings
    ctx.fillStyle = 'rgba(186, 245, 255, 0.72)';
    for (let i = 0; i < 48; i++) {
      const sx = ((i * 97.3 - cameraX * 0.04) % viewportW + viewportW) % viewportW;
      const sy = (i * 37.7) % (GROUND_Y * 0.58);
      const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * 1.9 + i));
      ctx.globalAlpha = twinkle * 0.8;
      ctx.fillRect(sx, sy, i % 4 === 0 ? 2.4 : 1.4, i % 4 === 0 ? 2.4 : 1.4);
    }
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(sunX, sunY, 68, 16, -0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(165, 243, 252, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(sunX, sunY, 82, 20, -0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Clean fluffy drifting clouds for eras 1..5
  if (eraIndex >= 1 && eraIndex <= 5) {
    ctx.fillStyle = eraIndex === 4 ? 'rgba(62, 58, 52, 0.38)' : 'rgba(255, 250, 240, 0.18)';
    for (let i = 0; i < 5; i++) {
      const cx =
        ((i * 270 + time * (6 + i * 1.2) - cameraX * 0.08) % (viewportW + 240) + (viewportW + 240)) %
          (viewportW + 240) -
        120;
      const cy = 62 + (i % 3) * 34;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 52, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 28, cy - 6, 36, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - 24, cy + 2, 32, 10, 0, 0, Math.PI * 2);
      ctx.fill();
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
  color: string,
  skyBottom: string,
): void {
  const offset = -(cameraX * 0.16);
  ctx.save();
  ctx.fillStyle = color;

  if (eraIndex === 0) {
    // Jagged volcanic ridges with sunlit rim highlights
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let wx = -100; wx <= viewportW + 200; wx += 80) {
      const worldSample = wx - offset;
      const ridge =
        Math.sin(worldSample * 0.0055) * 44 +
        Math.cos(worldSample * 0.013) * 24 +
        78;
      ctx.lineTo(wx, GROUND_Y - ridge);
    }
    ctx.lineTo(viewportW + 200, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Twin dramatic smoking volcanoes with glowing lava fissures
    for (const vxBase of [340, 1040]) {
      const vx = vxBase + offset;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(vx - 118, GROUND_Y - 18);
      ctx.lineTo(vx - 24, GROUND_Y - 172);
      ctx.lineTo(vx + 24, GROUND_Y - 172);
      ctx.lineTo(vx + 122, GROUND_Y - 18);
      ctx.closePath();
      ctx.fill();

      // Lit right ridge facet
      ctx.fillStyle = 'rgba(255, 168, 92, 0.16)';
      ctx.beginPath();
      ctx.moveTo(vx + 2, GROUND_Y - 172);
      ctx.lineTo(vx + 24, GROUND_Y - 172);
      ctx.lineTo(vx + 122, GROUND_Y - 18);
      ctx.lineTo(vx + 36, GROUND_Y - 18);
      ctx.closePath();
      ctx.fill();

      // Crater glow + lava trickle
      ctx.fillStyle = 'rgba(255, 118, 42, 0.72)';
      ctx.beginPath();
      ctx.ellipse(vx, GROUND_Y - 172, 24, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(vx - 6, GROUND_Y - 170);
      ctx.quadraticCurveTo(vx - 14, GROUND_Y - 142, vx - 28, GROUND_Y - 115);
      ctx.stroke();

      // Rising volcanic ash plumes
      ctx.fillStyle = 'rgba(72, 46, 40, 0.4)';
      for (let s = 0; s < 5; s++) {
        const sy = GROUND_Y - 184 - s * 17 - ((time * 12 + s * 10) % 24);
        const sx = vx + Math.sin(time + s) * 10 + s * 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 14 + s * 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (eraIndex === 1) {
    // Golden desert dunes + monumental pyramids + Roman aqueduct silhouettes
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= viewportW + 80; x += 60) {
      const ws = x - offset;
      ctx.lineTo(x, GROUND_Y - (48 + Math.sin(ws * 0.006) * 22));
    }
    ctx.lineTo(viewportW + 80, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    for (const [pxBase, ph] of [
      [250, 134],
      [420, 96],
      [980, 122],
    ]) {
      const px = pxBase + offset;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(px - ph, GROUND_Y - 30);
      ctx.lineTo(px, GROUND_Y - 30 - ph);
      ctx.lineTo(px + ph, GROUND_Y - 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.moveTo(px, GROUND_Y - 30 - ph);
      ctx.lineTo(px + ph, GROUND_Y - 30);
      ctx.lineTo(px + ph * 0.16, GROUND_Y - 30);
      ctx.closePath();
      ctx.fill();
    }
  } else if (eraIndex === 2) {
    // Dramatic alpine peaks with sunlit snow caps + distant castle keep silhouette
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = -40; x <= viewportW + 100; x += 65) {
      const ws = x - offset;
      const h = 76 + Math.abs(Math.sin(ws * 0.0045)) * 84 + Math.cos(ws * 0.011) * 18;
      ctx.lineTo(x, GROUND_Y - h);
    }
    ctx.lineTo(viewportW + 100, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Distant gothic hill fortress silhouette
    const cx = 620 + offset;
    ctx.fillStyle = '#303b4a';
    ctx.fillRect(cx - 26, GROUND_Y - 148, 52, 48);
    ctx.fillRect(cx - 32, GROUND_Y - 166, 14, 66);
    ctx.fillRect(cx + 18, GROUND_Y - 162, 14, 62);
    ctx.beginPath();
    ctx.moveTo(cx - 34, GROUND_Y - 166);
    ctx.lineTo(cx - 25, GROUND_Y - 186);
    ctx.lineTo(cx - 16, GROUND_Y - 166);
    ctx.fill();
  } else if (eraIndex === 3) {
    // Sea horizon with shimmering reflections & sailing frigates
    ctx.fillStyle = 'rgba(38, 62, 84, 0.72)';
    ctx.fillRect(0, GROUND_Y - 82, viewportW, 82);
    ctx.fillStyle = color;
    for (const sxBase of [280, 690, 1120]) {
      const sx = sxBase + offset;
      const bob = Math.sin(time * 1.4 + sxBase) * 2;
      ctx.beginPath();
      ctx.moveTo(sx - 36, GROUND_Y - 78 + bob);
      ctx.lineTo(sx + 36, GROUND_Y - 78 + bob);
      ctx.lineTo(sx + 25, GROUND_Y - 62 + bob);
      ctx.lineTo(sx - 25, GROUND_Y - 62 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(sx - 12, GROUND_Y - 130 + bob, 2.5, 52);
      ctx.fillRect(sx + 9, GROUND_Y - 120 + bob, 2.5, 42);
      ctx.fillStyle = 'rgba(242, 232, 208, 0.5)';
      ctx.beginPath();
      ctx.moveTo(sx - 10, GROUND_Y - 126 + bob);
      ctx.quadraticCurveTo(sx + 6, GROUND_Y - 106 + bob, sx - 10, GROUND_Y - 86 + bob);
      ctx.fill();
      ctx.fillStyle = color;
    }
  } else if (eraIndex === 4) {
    // Shell-blasted hills & ruined factories with glowing ember horizon
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= viewportW + 80; x += 65) {
      const ws = x - offset;
      ctx.lineTo(x, GROUND_Y - (58 + Math.sin(ws * 0.008) * 26));
    }
    ctx.lineTo(viewportW + 80, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    for (const fxBase of [240, 620, 960]) {
      const fx = fxBase + offset;
      ctx.fillRect(fx, GROUND_Y - 128, 48, 72);
      ctx.fillRect(fx + 8, GROUND_Y - 170, 9, 46);
      ctx.fillRect(fx + 26, GROUND_Y - 156, 8, 36);
    }
  } else if (eraIndex === 5) {
    // Layered modern metropolitan skyline with lit office grids & red tower beacons
    for (let i = 0; i < 22; i++) {
      const bx = i * 68 + offset;
      const bw = 38 + ((i * 19) % 26);
      const bh = 80 + ((i * 47) % 112);
      ctx.fillStyle = color;
      ctx.fillRect(bx, GROUND_Y - bh, bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(bx, GROUND_Y - bh, 5, bh);
      ctx.fillStyle = 'rgba(255, 232, 165, 0.36)';
      for (let wy = GROUND_Y - bh + 10; wy < GROUND_Y - 40; wy += 12) {
        for (let wx = bx + 5; wx < bx + bw - 8; wx += 9) {
          if (((wx + wy + i) & 3) !== 0) {
            ctx.fillRect(wx, wy, 4, 5);
          }
        }
      }
      if (bh > 155) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(bx + bw * 0.5, GROUND_Y - bh - 3, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Era 7: Layered cyberpunk megastructure arcologies + holographic sky bridges
    for (let i = 0; i < 16; i++) {
      const bx = i * 95 + offset;
      const bw = 48 + ((i * 23) % 34);
      const bh = 100 + ((i * 53) % 132);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(bx, GROUND_Y);
      ctx.lineTo(bx + 8, GROUND_Y - bh);
      ctx.lineTo(bx + bw - 8, GROUND_Y - bh - 12);
      ctx.lineTo(bx + bw, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Illuminated bevel edge & vertical cyan conduit
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.fillRect(bx + 9, GROUND_Y - bh + 4, 6, bh - 26);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.52)';
      ctx.fillRect(bx + bw * 0.48, GROUND_Y - bh + 6, 3, bh - 36);
      // Horizontal floor light bands
      ctx.fillStyle = 'rgba(125, 211, 252, 0.25)';
      for (let fy = GROUND_Y - bh + 22; fy < GROUND_Y - 50; fy += 24) {
        ctx.fillRect(bx + 12, fy, bw - 24, 2);
      }
    }
  }

  void skyBottom;
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
  const offset = -(cameraX * 0.38);
  ctx.save();

  // Rolling midground hill ridge with soft rim highlight
  ctx.fillStyle = midColor;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = -40; x <= viewportW + 80; x += 48) {
    const ws = x - offset;
    const h = 36 + Math.sin(ws * 0.0085) * 20 + Math.cos(ws * 0.019) * 8;
    ctx.lineTo(x, GROUND_Y - h);
  }
  ctx.lineTo(viewportW + 80, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = propColor;
  const spacing = 185;
  const startIdx = Math.floor((-offset - 120) / spacing);
  const endIdx = Math.ceil((viewportW - offset + 120) / spacing);

  for (let i = startIdx; i <= endIdx; i++) {
    const px = i * spacing + offset;
    const py = GROUND_Y - 16;

    if (eraIndex === 0) {
      // Prehistoric palm trees + mossy monolith boulders
      ctx.fillStyle = '#382a1c';
      ctx.fillRect(px - 3.5, py - 52, 7, 54);
      ctx.fillStyle = propColor;
      for (let f = -2; f <= 2; f++) {
        const sway = Math.sin(time * 1.8 + i + f) * 1.5;
        ctx.beginPath();
        ctx.ellipse(px + f * 13 + sway, py - 52 + Math.abs(f) * 4.5, 20, 5, f * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#473c32';
      ctx.beginPath();
      ctx.ellipse(px + 42, py + 4, 22, 12, 0, Math.PI, 0);
      ctx.fill();
    } else if (eraIndex === 1) {
      // Cypress trees & classical marble columns
      if (i % 2 === 0) {
        ctx.fillStyle = propColor;
        ctx.beginPath();
        ctx.ellipse(px, py - 32, 11, 36, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#b49a74';
        ctx.fillRect(px - 7, py - 42, 14, 44);
        ctx.fillStyle = '#d4be98';
        ctx.fillRect(px - 11, py - 46, 22, 5.5);
        ctx.fillRect(px - 5, py - 40, 3, 38);
      }
    } else if (eraIndex === 2) {
      // Multi-tier conifer trees & fluttering medieval war flags
      ctx.fillStyle = propColor;
      ctx.beginPath();
      ctx.moveTo(px, py - 66);
      ctx.lineTo(px - 17, py - 28);
      ctx.lineTo(px + 17, py - 28);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px, py - 46);
      ctx.lineTo(px - 22, py + 2);
      ctx.lineTo(px + 22, py + 2);
      ctx.closePath();
      ctx.fill();

      // Medieval fluttering pennant banner
      const flagX = px + 44;
      ctx.fillStyle = '#3f3023';
      ctx.fillRect(flagX, py - 52, 3.2, 54);
      const wave = Math.sin(time * 4.5 + i) * 3.5;
      ctx.fillStyle = i % 2 === 0 ? '#2563eb' : accent;
      ctx.beginPath();
      ctx.moveTo(flagX + 3, py - 50);
      ctx.lineTo(flagX + 26, py - 44 + wave);
      ctx.lineTo(flagX + 20, py - 38 + wave * 0.6);
      ctx.lineTo(flagX + 26, py - 32 + wave);
      ctx.lineTo(flagX + 3, py - 34);
      ctx.closePath();
      ctx.fill();
    } else if (eraIndex === 3) {
      // Brick bastion parapet + colonial trees
      ctx.fillStyle = '#4f3a2e';
      ctx.fillRect(px - 28, py - 16, 56, 18);
      ctx.fillStyle = '#735b4c';
      ctx.fillRect(px - 28, py - 16, 56, 3.5);
      ctx.fillStyle = propColor;
      ctx.beginPath();
      ctx.arc(px + 44, py - 38, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px + 41, py - 22, 6, 24);
    } else if (eraIndex === 4) {
      // Wartime trench wooden stakes, barbed wire coils & broken trees
      ctx.strokeStyle = '#1f1d18';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(px - 12, py + 2);
      ctx.lineTo(px + 12, py - 26);
      ctx.moveTo(px + 12, py + 2);
      ctx.lineTo(px - 12, py - 26);
      ctx.stroke();
      ctx.strokeStyle = '#474c45';
      ctx.lineWidth = 1.4;
      for (let w = -18; w <= 18; w += 9) {
        ctx.beginPath();
        ctx.arc(px + w, py - 10, 6.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (eraIndex === 5) {
      // Highway overhead lights & comms dish
      ctx.fillStyle = propColor;
      ctx.fillRect(px - 2.5, py - 58, 5, 60);
      ctx.fillRect(px - 2.5, py - 58, 18, 3.5);
      ctx.fillStyle = 'rgba(255, 242, 188, 0.72)';
      ctx.fillRect(px + 10, py - 54.5, 6, 3.2);
    } else {
      // Glowing futuristic energy pylons with hovering holo ring
      ctx.fillStyle = propColor;
      ctx.beginPath();
      ctx.moveTo(px - 12, py + 4);
      ctx.lineTo(px - 5, py - 64);
      ctx.lineTo(px + 5, py - 64);
      ctx.lineTo(px + 12, py + 4);
      ctx.closePath();
      ctx.fill();
      const pulse = 0.55 + Math.sin(time * 3.4 + i) * 0.25;
      ctx.fillStyle = `rgba(34, 211, 238, ${pulse.toFixed(2)})`;
      ctx.fillRect(px - 1.8, py - 58, 3.6, 52);
    }
  }

  ctx.restore();
}

function drawGround(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  topCol: string,
  midCol: string,
  darkCol: string,
  accent: string,
): void {
  const groundH = WORLD_HEIGHT - GROUND_Y;

  // Base earth / deck gradient
  const grad = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_HEIGHT);
  grad.addColorStop(0, topCol);
  grad.addColorStop(0.18, midCol);
  grad.addColorStop(0.68, darkCol);
  grad.addColorStop(1, '#090d14');
  ctx.fillStyle = grad;
  ctx.fillRect(0, GROUND_Y, viewportW, groundH);

  // Subtle recessed top track border
  ctx.fillStyle = eraIndex === 6 ? 'rgba(34, 211, 238, 0.75)' : 'rgba(18, 22, 32, 0.45)';
  ctx.fillRect(0, GROUND_Y - 1.5, viewportW, 3);
  ctx.fillStyle = eraIndex === 6 ? 'rgba(165, 243, 252, 0.55)' : 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(0, GROUND_Y + 1.5, viewportW, 2);

  // Era-specific world-locked road & surface textures!
  const tile = 72;
  const firstTile = Math.floor(cameraX / tile) - 1;
  const lastTile = Math.ceil((cameraX + viewportW) / tile) + 1;

  ctx.save();
  for (let i = firstTile; i <= lastTile; i++) {
    const sx = i * tile - cameraX;
    const h = Math.abs((i * 73) % 17);

    if (eraIndex === 0) {
      // ERA 1: Prehistoric packed dirt road, rocks, mossy grass blades & fossil bones
      ctx.fillStyle = '#4a351f';
      ctx.beginPath();
      ctx.ellipse(sx + 20, GROUND_Y + 12, 16, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Embedded river pebbles & mossy rock
      ctx.fillStyle = '#78716c';
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(sx + 50, GROUND_Y + 15, 8 + (h % 4), 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(sx + 47, GROUND_Y + 12.5, 5, 1.8);
      // Grass tufts along upper ground lip
      ctx.fillStyle = '#7b943f';
      for (let g = 0; g < 3; g++) {
        const gx = sx + 8 + g * 24;
        ctx.beginPath();
        ctx.moveTo(gx - 4, GROUND_Y + 1);
        ctx.lineTo(gx, GROUND_Y - 7 - (g % 2) * 3);
        ctx.lineTo(gx + 4, GROUND_Y + 1);
        ctx.fill();
      }
      if (i % 4 === 0) {
        // Half-buried ancient bone in soil stratum
        ctx.fillStyle = '#d6cbb8';
        ctx.fillRect(sx + 16, GROUND_Y + 26, 18, 3.2);
        ctx.beginPath();
        ctx.arc(sx + 16, GROUND_Y + 27.5, 2.8, 0, Math.PI * 2);
        ctx.arc(sx + 34, GROUND_Y + 27.5, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (eraIndex === 1) {
      // ERA 2: Travertine stone flagstones with beveled mortar seams
      ctx.fillStyle = i % 2 === 0 ? '#c4a46b' : '#b8965d';
      ctx.strokeStyle = '#5c4628';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.roundRect(sx + 2, GROUND_Y + 4, tile - 5, 14, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 244, 214, 0.22)';
      ctx.fillRect(sx + 5, GROUND_Y + 5.5, tile - 12, 2.4);
      // Lower sandstone block layer
      ctx.fillStyle = '#7c5e37';
      ctx.fillRect(sx + 14, GROUND_Y + 22, 42, 9);
    } else if (eraIndex === 2) {
      // ERA 3: Interlocking medieval cobblestone war-road + lush emerald turf lip
      for (let c = 0; c < 3; c++) {
        const cx = sx + c * 24 + 2;
        ctx.fillStyle = (i + c) % 2 === 0 ? '#78756e' : '#65625c';
        ctx.strokeStyle = '#292724';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cx, GROUND_Y + 5, 21, 11, 3.5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        ctx.fillRect(cx + 3, GROUND_Y + 6.5, 13, 2);
      }
      // Lush emerald grass clusters poking up behind cobbles
      ctx.fillStyle = '#5a7d42';
      for (let g = 0; g < 3; g++) {
        const gx = sx + 6 + g * 24;
        ctx.beginPath();
        ctx.moveTo(gx - 5, GROUND_Y + 2);
        ctx.lineTo(gx - 1, GROUND_Y - 8 - (g % 2) * 3);
        ctx.lineTo(gx + 4, GROUND_Y + 2);
        ctx.fill();
      }
    } else if (eraIndex === 3) {
      // ERA 4: Rutted mud & timber artillery highway
      ctx.fillStyle = '#473a2c';
      ctx.fillRect(sx + 4, GROUND_Y + 7, tile - 8, 5);
      ctx.fillStyle = '#6b4f34';
      ctx.strokeStyle = '#2b2016';
      ctx.lineWidth = 1.2;
      ctx.fillRect(sx + 12, GROUND_Y + 15, 28, 7);
      ctx.strokeRect(sx + 12, GROUND_Y + 15, 28, 7);
    } else if (eraIndex === 4) {
      // ERA 5: World War muddy trench duckboard planks + crater puddles
      ctx.fillStyle = '#5c4b34';
      ctx.strokeStyle = '#1f1a13';
      ctx.lineWidth = 1.2;
      for (let p = 0; p < 4; p++) {
        ctx.fillRect(sx + p * 18 + 2, GROUND_Y + 5, 14, 9);
        ctx.strokeRect(sx + p * 18 + 2, GROUND_Y + 5, 14, 9);
      }
      if (i % 3 === 0) {
        // Muddy water puddle
        ctx.fillStyle = 'rgba(84, 102, 114, 0.45)';
        ctx.beginPath();
        ctx.ellipse(sx + 32, GROUND_Y + 21, 18, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (eraIndex === 5) {
      // ERA 6: Weathered asphalt highway + tactical lane stripes + curb blocks
      ctx.fillStyle = '#333a42';
      ctx.fillRect(sx, GROUND_Y + 3, tile, 18);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
      ctx.fillRect(sx + 12, GROUND_Y + 10.5, 34, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(sx + h * 3, GROUND_Y + 6, 4, 2);
      ctx.fillRect(sx + 52 - h, GROUND_Y + 16, 3, 2);
    } else {
      // ERA 7: Beveled dark titanium alloy deck plates + pulsing cyan circuit conduits
      ctx.fillStyle = '#1a2f42';
      ctx.strokeStyle = '#09111c';
      ctx.lineWidth = 1.5;
      ctx.fillRect(sx + 1, GROUND_Y + 3, tile - 2, 22);
      ctx.strokeRect(sx + 1, GROUND_Y + 3, tile - 2, 22);
      // Bolted deck corners
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx + 5, GROUND_Y + 6, 3, 3);
      ctx.fillRect(sx + tile - 9, GROUND_Y + 6, 3, 3);
      // Glowing cyan neon strip conduit
      const glow = 0.52 + Math.sin(time * 3 + i * 0.7) * 0.22;
      ctx.fillStyle = `rgba(34, 211, 238, ${glow.toFixed(2)})`;
      ctx.fillRect(sx + 12, GROUND_Y + 13, tile - 24, 3);
    }
  }

  // Distinct Midfield Landmark Pillar / Line at WORLD_WIDTH / 2
  const midX = WORLD_WIDTH * 0.5 - cameraX;
  if (midX > -40 && midX < viewportW + 40) {
    ctx.fillStyle = accent + '88';
    ctx.fillRect(midX - 2.5, GROUND_Y + 2, 5, 22);
  }
  ctx.restore();
}
