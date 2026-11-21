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

    // Subtle golden evolution sweep light
    const glowAlpha = Math.sin(transition.progress * Math.PI) * 0.25;
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

  // 1. Sky gradient (Layer 0 - static/slowest)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  skyGrad.addColorStop(0, p.skyTop);
  skyGrad.addColorStop(0.58, p.skyMid);
  skyGrad.addColorStop(1, p.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewportW, GROUND_Y + 4);

  // Celestial body & sky atmosphere (parallax 0.06)
  drawSkyAtmosphere(ctx, eraIndex, cameraX, viewportW, time, p.sunColor);

  // 2. Far Horizon Silhouettes (parallax 0.16)
  drawFarLayer(ctx, eraIndex, cameraX, viewportW, time, p.farHill);

  // 3. Midground Scenic Landmarks (parallax 0.38)
  drawMidLayer(ctx, eraIndex, cameraX, viewportW, time, p.midHill, p.nearProp, p.accent);

  // 4. Battlefield Ground & Terrain Details (parallax 1.0)
  drawGround(ctx, eraIndex, cameraX, viewportW, p.groundTop, p.groundMid, p.groundDark, p.accent);
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
  // Sun / Moon halo
  const halo = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 96);
  halo.addColorStop(0, sunColor);
  halo.addColorStop(0.35, sunColor + '66');
  halo.addColorStop(1, sunColor + '00');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 96, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, eraIndex === 6 ? 28 : 24, 0, Math.PI * 2);
  ctx.fill();

  // Era-specific sky details
  if (eraIndex === 0) {
    // Prehistoric gliding pterodactyls
    ctx.strokeStyle = 'rgba(42, 22, 16, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const bx = ((i * 290 + time * 22 - cameraX * 0.12) % (viewportW + 180) + (viewportW + 180)) % (viewportW + 180) - 90;
      const by = 68 + (i % 3) * 26 + Math.sin(time * 2.5 + i) * 5;
      const flap = Math.sin(time * 5.2 + i * 2) * 5;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by + flap);
      ctx.quadraticCurveTo(bx - 4, by - 6, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 6, bx + 12, by + flap);
      ctx.stroke();
    }
  } else if (eraIndex === 4) {
    // World War searchlights & distant zeppelin
    ctx.fillStyle = 'rgba(240, 232, 195, 0.07)';
    for (let i = 0; i < 3; i++) {
      const lx = ((i * 340 - cameraX * 0.18) % (viewportW + 300) + (viewportW + 300)) % (viewportW + 300) - 100;
      const sway = Math.sin(time * 0.7 + i * 2.1) * 75;
      ctx.beginPath();
      ctx.moveTo(lx, GROUND_Y - 20);
      ctx.lineTo(lx - 26 + sway, 0);
      ctx.lineTo(lx + 26 + sway, 0);
      ctx.closePath();
      ctx.fill();
    }
    // Zeppelin silhouette
    const zx = ((time * 9 + 240 - cameraX * 0.09) % (viewportW + 260) + (viewportW + 260)) % (viewportW + 260) - 130;
    ctx.fillStyle = 'rgba(30, 32, 34, 0.52)';
    ctx.beginPath();
    ctx.ellipse(zx, 74, 34, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(zx - 10, 84, 20, 4);
  } else if (eraIndex === 5) {
    // Modern jet contrails
    ctx.strokeStyle = 'rgba(226, 241, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 96);
    ctx.lineTo(viewportW + 20, 56);
    ctx.moveTo(-20, 128);
    ctx.lineTo(viewportW + 20, 82);
    ctx.stroke();
  } else if (eraIndex === 6) {
    // Future starfield & planetary orbital rings
    ctx.fillStyle = 'rgba(186, 245, 255, 0.65)';
    for (let i = 0; i < 36; i++) {
      const sx = ((i * 97.3 - cameraX * 0.04) % viewportW + viewportW) % viewportW;
      const sy = (i * 37.7) % (GROUND_Y * 0.55);
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.8 + i));
      ctx.globalAlpha = twinkle * 0.75;
      ctx.fillRect(sx, sy, i % 4 === 0 ? 2.2 : 1.3, i % 4 === 0 ? 2.2 : 1.3);
    }
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sunX, sunY, 64, 15, -0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Soft drifting clouds for eras 1..5
  if (eraIndex >= 1 && eraIndex <= 5) {
    ctx.fillStyle = eraIndex === 4 ? 'rgba(65, 62, 56, 0.35)' : 'rgba(255, 250, 240, 0.16)';
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
): void {
  const offset = -(cameraX * 0.16);
  ctx.save();
  ctx.fillStyle = color;

  if (eraIndex === 0) {
    // Jagged volcanic ridges & smoking volcano
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let wx = -100; wx <= viewportW + 200; wx += 90) {
      const worldSample = wx - offset;
      const ridge =
        Math.sin(worldSample * 0.0055) * 44 +
        Math.cos(worldSample * 0.013) * 24 +
        76;
      ctx.lineTo(wx, GROUND_Y - ridge);
    }
    ctx.lineTo(viewportW + 200, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Twin iconic volcano cones
    for (const vxBase of [340, 1040]) {
      const vx = vxBase + offset;
      ctx.beginPath();
      ctx.moveTo(vx - 110, GROUND_Y - 20);
      ctx.lineTo(vx - 22, GROUND_Y - 168);
      ctx.lineTo(vx + 22, GROUND_Y - 168);
      ctx.lineTo(vx + 115, GROUND_Y - 20);
      ctx.closePath();
      ctx.fill();

      // Lava glow & smoke plume
      ctx.fillStyle = 'rgba(255, 118, 42, 0.48)';
      ctx.beginPath();
      ctx.ellipse(vx, GROUND_Y - 168, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(82, 54, 48, 0.35)';
      for (let s = 0; s < 4; s++) {
        const sy = GROUND_Y - 182 - s * 18 - ((time * 12 + s * 10) % 24);
        const sx = vx + Math.sin(time + s) * 10 + s * 8;
        ctx.beginPath();
        ctx.arc(sx, sy, 14 + s * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = color;
    }
  } else if (eraIndex === 1) {
    // Distant sand dunes + Great Pyramids & aqueduct
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
      [260, 128],
      [420, 92],
      [980, 116],
    ]) {
      const px = pxBase + offset;
      ctx.beginPath();
      ctx.moveTo(px - ph, GROUND_Y - 32);
      ctx.lineTo(px, GROUND_Y - 32 - ph);
      ctx.lineTo(px + ph, GROUND_Y - 32);
      ctx.closePath();
      ctx.fill();
      // Shaded face
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath();
      ctx.moveTo(px, GROUND_Y - 32 - ph);
      ctx.lineTo(px + ph, GROUND_Y - 32);
      ctx.lineTo(px + ph * 0.18, GROUND_Y - 32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
    }
  } else if (eraIndex === 2) {
    // Alpine peaks & distant gothic spire silhouettes
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = -40; x <= viewportW + 100; x += 70) {
      const ws = x - offset;
      const h = 72 + Math.abs(Math.sin(ws * 0.0045)) * 78 + Math.cos(ws * 0.011) * 18;
      ctx.lineTo(x, GROUND_Y - h);
    }
    ctx.lineTo(viewportW + 100, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  } else if (eraIndex === 3) {
    // Sea horizon & sailing warships
    ctx.fillStyle = 'rgba(42, 68, 90, 0.6)';
    ctx.fillRect(0, GROUND_Y - 78, viewportW, 78);
    ctx.fillStyle = color;
    for (const sxBase of [280, 690, 1120]) {
      const sx = sxBase + offset;
      const bob = Math.sin(time * 1.4 + sxBase) * 2;
      ctx.beginPath();
      ctx.moveTo(sx - 34, GROUND_Y - 76 + bob);
      ctx.lineTo(sx + 34, GROUND_Y - 76 + bob);
      ctx.lineTo(sx + 24, GROUND_Y - 62 + bob);
      ctx.lineTo(sx - 24, GROUND_Y - 62 + bob);
      ctx.closePath();
      ctx.fill();
      // Masts & billowing sails
      ctx.fillRect(sx - 12, GROUND_Y - 124 + bob, 2, 48);
      ctx.fillRect(sx + 8, GROUND_Y - 116 + bob, 2, 40);
      ctx.fillStyle = 'rgba(235, 224, 200, 0.45)';
      ctx.beginPath();
      ctx.moveTo(sx - 10, GROUND_Y - 120 + bob);
      ctx.quadraticCurveTo(sx + 4, GROUND_Y - 102 + bob, sx - 10, GROUND_Y - 84 + bob);
      ctx.fill();
      ctx.fillStyle = color;
    }
  } else if (eraIndex === 4) {
    // Ruined industrial hills & smokestacks
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= viewportW + 80; x += 65) {
      const ws = x - offset;
      ctx.lineTo(x, GROUND_Y - (56 + Math.sin(ws * 0.008) * 26));
    }
    ctx.lineTo(viewportW + 80, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    for (const fxBase of [240, 620, 960]) {
      const fx = fxBase + offset;
      ctx.fillRect(fx, GROUND_Y - 126, 46, 70);
      ctx.fillRect(fx + 8, GROUND_Y - 166, 9, 44);
      ctx.fillRect(fx + 26, GROUND_Y - 154, 8, 34);
    }
  } else if (eraIndex === 5) {
    // Modern metropolitan skyline with lit windows
    for (let i = 0; i < 22; i++) {
      const bx = i * 68 + offset;
      const bw = 38 + ((i * 19) % 26);
      const bh = 78 + ((i * 47) % 108);
      ctx.fillStyle = color;
      ctx.fillRect(bx, GROUND_Y - bh, bw, bh);
      // Tiny illuminated windows
      ctx.fillStyle = 'rgba(255, 232, 165, 0.34)';
      for (let wy = GROUND_Y - bh + 10; wy < GROUND_Y - 40; wy += 12) {
        for (let wx = bx + 5; wx < bx + bw - 8; wx += 9) {
          if (((wx + wy + i) & 3) !== 0) {
            ctx.fillRect(wx, wy, 4, 5);
          }
        }
      }
    }
  } else {
    // Era 7: Sci-fi megastructures & cyan neon vertical conduits
    for (let i = 0; i < 16; i++) {
      const bx = i * 95 + offset;
      const bw = 46 + ((i * 23) % 34);
      const bh = 95 + ((i * 53) % 128);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(bx, GROUND_Y);
      ctx.lineTo(bx + 8, GROUND_Y - bh);
      ctx.lineTo(bx + bw - 8, GROUND_Y - bh - 12);
      ctx.lineTo(bx + bw, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Cyan neon strip
      ctx.fillStyle = 'rgba(34, 211, 238, 0.42)';
      ctx.fillRect(bx + bw * 0.48, GROUND_Y - bh + 6, 2.5, bh - 36);
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
  const offset = -(cameraX * 0.38);
  ctx.save();

  // Rolling midground hill band
  ctx.fillStyle = midColor;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = -40; x <= viewportW + 80; x += 50) {
    const ws = x - offset;
    const h = 34 + Math.sin(ws * 0.0085) * 18 + Math.cos(ws * 0.019) * 8;
    ctx.lineTo(x, GROUND_Y - h);
  }
  ctx.lineTo(viewportW + 80, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  // Era-specific midground props spaced cleanly across world
  ctx.fillStyle = propColor;
  const spacing = 190;
  const startIdx = Math.floor((-offset - 120) / spacing);
  const endIdx = Math.ceil((viewportW - offset + 120) / spacing);

  for (let i = startIdx; i <= endIdx; i++) {
    const px = i * spacing + offset;
    const py = GROUND_Y - 18;

    if (eraIndex === 0) {
      // Prehistoric fern / palm silhouette + boulders
      ctx.fillRect(px - 3, py - 46, 6, 48);
      for (let f = -2; f <= 2; f++) {
        ctx.beginPath();
        ctx.ellipse(px + f * 12, py - 46 + Math.abs(f) * 4, 18, 4.5, f * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (eraIndex === 1) {
      // Ancient cypress trees & broken marble column
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.ellipse(px, py - 30, 10, 34, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(px - 7, py - 38, 14, 40);
        ctx.fillRect(px - 10, py - 42, 20, 5);
      }
    } else if (eraIndex === 2) {
      // Pine silhouettes & medieval pennant poles
      ctx.beginPath();
      ctx.moveTo(px, py - 56);
      ctx.lineTo(px - 18, py);
      ctx.lineTo(px + 18, py);
      ctx.closePath();
      ctx.fill();
      if (i % 3 === 0) {
        ctx.fillRect(px + 34, py - 44, 3, 44);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(px + 37, py - 42);
        ctx.lineTo(px + 54, py - 36 + Math.sin(time * 4 + i) * 3);
        ctx.lineTo(px + 37, py - 29);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = propColor;
      }
    } else if (eraIndex === 3) {
      // Low stone parapet walls & colonial trees
      ctx.fillRect(px - 26, py - 14, 52, 16);
      ctx.beginPath();
      ctx.arc(px + 42, py - 36, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px + 39, py - 22, 6, 24);
    } else if (eraIndex === 4) {
      // Barbed wire X-posts & dead tree trunks
      ctx.strokeStyle = propColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px - 10, py);
      ctx.lineTo(px + 10, py - 24);
      ctx.moveTo(px + 10, py);
      ctx.lineTo(px - 10, py - 24);
      ctx.stroke();
    } else if (eraIndex === 5) {
      // Highway light poles & radar masts
      ctx.fillRect(px - 2, py - 54, 4, 56);
      ctx.fillRect(px - 2, py - 54, 16, 3);
      ctx.fillStyle = 'rgba(255, 242, 188, 0.55)';
      ctx.fillRect(px + 9, py - 51, 5, 3);
      ctx.fillStyle = propColor;
    } else {
      // Glowing futuristic energy pylons
      ctx.beginPath();
      ctx.moveTo(px - 10, py + 4);
      ctx.lineTo(px - 4, py - 58);
      ctx.lineTo(px + 4, py - 58);
      ctx.lineTo(px + 10, py + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(34, 211, 238, ${(0.55 + Math.sin(time * 3 + i) * 0.25).toFixed(2)})`;
      ctx.fillRect(px - 1.5, py - 52, 3, 46);
      ctx.fillStyle = propColor;
    }
  }

  ctx.restore();
}

function drawGround(
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
  const grad = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_HEIGHT);
  grad.addColorStop(0, topCol);
  grad.addColorStop(0.22, midCol);
  grad.addColorStop(1, darkCol);
  ctx.fillStyle = grad;
  ctx.fillRect(0, GROUND_Y, viewportW, groundH);

  // Crisp top battlefield edge highlight
  ctx.fillStyle = eraIndex === 6 ? 'rgba(34, 211, 238, 0.55)' : 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(0, GROUND_Y, viewportW, 3);

  // Repeating world-locked road details (1:1 parallax with units!)
  const tile = 80;
  const firstTile = Math.floor(cameraX / tile);
  const lastTile = Math.ceil((cameraX + viewportW) / tile);

  ctx.save();
  for (let i = firstTile; i <= lastTile; i++) {
    const sx = i * tile - cameraX;
    if (eraIndex === 6) {
      // Sci-fi deck panel seams & cyan markers
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.fillRect(sx, GROUND_Y + 9, 34, 2.5);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(sx + 60, GROUND_Y + 3, 2, 28);
    } else if (eraIndex === 5) {
      // Asphalt road dashed lines
      ctx.fillStyle = 'rgba(245, 215, 110, 0.35)';
      ctx.fillRect(sx + 14, GROUND_Y + 11, 36, 3);
    } else {
      // Natural grass tufts / stones / wheel ruts
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(sx + 10, GROUND_Y + 12, 28, 3);
      ctx.fillRect(sx + 46, GROUND_Y + 22, 18, 3);
      if (eraIndex <= 3) {
        ctx.fillStyle = topCol;
        ctx.beginPath();
        ctx.moveTo(sx + 20, GROUND_Y + 1);
        ctx.lineTo(sx + 24, GROUND_Y - 6);
        ctx.lineTo(sx + 28, GROUND_Y + 1);
        ctx.fill();
      }
    }
  }

  // Subtle midfield marker stone/chevron at WORLD_WIDTH / 2
  const midX = WORLD_WIDTH * 0.5 - cameraX;
  if (midX > -40 && midX < viewportW + 40) {
    ctx.fillStyle = accent + '55';
    ctx.fillRect(midX - 2, GROUND_Y + 3, 4, 16);
  }
  ctx.restore();
}
