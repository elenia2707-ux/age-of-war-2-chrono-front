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

  // 1. Rich Multi-Stop Painterly Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y + 6);
  skyGrad.addColorStop(0, p.skyTop);
  skyGrad.addColorStop(0.52, p.skyMid);
  skyGrad.addColorStop(1, p.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, viewportW + 4, GROUND_Y + 6);

  // 2. Celestial Atmosphere + Volumetric God-Rays + Clouds + Aurora + Dyson Ring
  drawSkyAtmosphere(ctx, eraIndex, cameraX, viewportW, time, p.sunColor, p.accent);

  // 3. Far Parallax Horizon & Landmarks (0.16x)
  drawFarLayer(ctx, eraIndex, cameraX, viewportW, time, p.farHill, p.sunColor, p.accent);

  // 4. Soft Atmospheric Depth Haze separating Far & Mid layers!
  const hazeGrad = ctx.createLinearGradient(0, GROUND_Y - 120, 0, GROUND_Y);
  hazeGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  hazeGrad.addColorStop(
    1,
    eraIndex === 11
      ? 'rgba(45, 212, 191, 0.20)'
      : eraIndex >= 9
        ? 'rgba(139, 92, 246, 0.16)'
        : eraIndex === 3
          ? 'rgba(244, 114, 182, 0.16)'
          : eraIndex === 1 || eraIndex === 0
            ? 'rgba(251, 146, 60, 0.18)'
            : 'rgba(226, 232, 240, 0.13)',
  );
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, GROUND_Y - 120, viewportW + 4, 120);

  // 5. Mid Parallax Hills & Two-Tone Handcrafted Era Props (0.42x)
  drawMidLayer(ctx, eraIndex, cameraX, viewportW, time, p.midHill, p.nearProp, p.accent);

  // 6. Ambient Drifting Era Motes (Volcanic Embers / Desert Glints / Sakura Petals / Stardust / Quantum Sparks)
  drawAmbientMotes(ctx, eraIndex, cameraX, viewportW, time, p.accent);

  // 7. Crisp Multi-Layer Cartoon Battlefield Road & Ground Strata (1.0x)
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
  const sunY = eraIndex >= 9 ? 90 : 102;

  ctx.save();

  // Twinkling cosmic starfield + translucent nebula/quantum aurora for Future, Interstellar & Transcendent eras (9, 10, 11)
  if (eraIndex >= 9) {
    if (eraIndex === 10 || eraIndex === 11) {
      const isChrono = eraIndex === 11;
      ctx.save();
      const neb = ctx.createLinearGradient(0, 36, viewportW, 190);
      if (isChrono) {
        neb.addColorStop(0, 'rgba(45, 212, 191, 0.18)');
        neb.addColorStop(0.5, 'rgba(250, 204, 21, 0.22)');
        neb.addColorStop(1, 'rgba(56, 189, 248, 0.18)');
      } else {
        neb.addColorStop(0, 'rgba(168, 85, 247, 0.14)');
        neb.addColorStop(0.5, 'rgba(236, 72, 153, 0.22)');
        neb.addColorStop(1, 'rgba(56, 189, 248, 0.14)');
      }
      ctx.fillStyle = neb;
      ctx.beginPath();
      ctx.moveTo(0, 110 + Math.sin(time * 0.4) * 14);
      ctx.bezierCurveTo(viewportW * 0.3, 45, viewportW * 0.68, 175, viewportW, 85);
      ctx.lineTo(viewportW, 155);
      ctx.bezierCurveTo(viewportW * 0.65, 210, viewportW * 0.32, 105, 0, 170);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < 52; i++) {
      const sx =
        ((((i * 197 + 41 - cameraX * 0.03) % (viewportW + 40)) + (viewportW + 40)) % (viewportW + 40)) - 20;
      const sy = 14 + ((i * 83) % 192);
      const tw = 0.38 + 0.62 * Math.abs(Math.sin(time * 1.9 + i * 1.3));
      ctx.fillStyle =
        eraIndex === 11
          ? i % 3 === 0
            ? '#fef08a'
            : '#5eead4'
          : i % 5 === 0
            ? '#fef08a'
            : i % 7 === 0
              ? '#f0abfc'
              : '#e0f2fe';
      ctx.globalAlpha = tw * 0.88;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 9 === 0 ? 2.4 : 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Volumetric Diagonal God-Rays fanning gently from the sun/moon!
  ctx.save();
  ctx.translate(sunX, sunY);
  for (let r = 0; r < 5; r++) {
    const baseAngle = 0.52 + r * 0.44 + Math.sin(time * 0.35 + r) * 0.04;
    ctx.save();
    ctx.rotate(baseAngle);
    const rayGrad = ctx.createLinearGradient(0, 0, 290, 0);
    rayGrad.addColorStop(
      0,
      eraIndex === 11
        ? 'rgba(45, 212, 191, 0.18)'
        : eraIndex >= 9
          ? 'rgba(192, 132, 252, 0.14)'
          : 'rgba(254, 240, 138, 0.14)',
    );
    rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(290, -28);
    ctx.lineTo(290, 28);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Luminous atmospheric sun / cosmic orb / Chrono star
  const haloR = eraIndex === 1 || eraIndex >= 10 ? 126 : 96;
  const halo = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, haloR);
  halo.addColorStop(0, 'rgba(255,255,255,0.95)');
  halo.addColorStop(0.24, sunColor);
  halo.addColorStop(
    0.58,
    eraIndex === 11
      ? 'rgba(45, 212, 191, 0.30)'
      : eraIndex === 10
        ? 'rgba(168, 85, 247, 0.28)'
        : 'rgba(255, 232, 160, 0.18)',
  );
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, haloR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, eraIndex === 1 || eraIndex >= 10 ? 31 : 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.beginPath();
  ctx.arc(sunX - 6, sunY - 6, 9, 0, Math.PI * 2);
  ctx.fill();

  // Era XI (10): Interstellar dual-ringed gas giant!
  if (eraIndex === 10) {
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(-0.26);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 64, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240, 171, 252, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 74, 17, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Era XII (11 — NEW): Colossal Golden Dyson Chrono-Ring megastructure orbiting the star!
  if (eraIndex === 11) {
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(-0.14);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.88)';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 82, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.72)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 62, 58, time * 0.12, 0, Math.PI * 2);
    ctx.stroke();
    // 12 Radiant Chrono-Dyson Clock Nodes pulsing around the ring!
    for (let i = 0; i < 12; i++) {
      const a = time * 0.25 + (i / 12) * Math.PI * 2;
      const nx = Math.cos(a) * 82;
      const ny = Math.sin(a) * 22;
      ctx.fillStyle = i % 3 === 0 ? '#fef08a' : '#5eead4';
      ctx.beginPath();
      ctx.arc(nx, ny, i % 3 === 0 ? 3.5 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Two-tone sunlit cartoon clouds with soft flat undersides (Eras 0–8)
  if (eraIndex <= 8) {
    const cloudTop =
      eraIndex === 7
        ? 'rgba(148, 163, 184, 0.28)'
        : eraIndex === 3
          ? 'rgba(255, 228, 230, 0.44)'
          : eraIndex === 6 || eraIndex === 0
            ? 'rgba(254, 226, 192, 0.38)'
            : 'rgba(255, 255, 255, 0.42)';
    const cloudUnder =
      eraIndex === 7 ? 'rgba(51, 65, 85, 0.22)' : 'rgba(148, 163, 184, 0.16)';
    for (let i = 0; i < 6; i++) {
      const span = viewportW + 300;
      const cx = (((i * 250 + time * (6 + i * 1.2) - cameraX * 0.08) % span) + span) % span - 150;
      const cy = 48 + (i % 3) * 34;
      const sc = 0.8 + (i % 3) * 0.18;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.fillStyle = cloudUnder;
      ctx.beginPath();
      ctx.ellipse(22, 10, 36, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cloudTop;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.arc(20, -9, 25, 0, Math.PI * 2);
      ctx.arc(43, 0, 19, 0, Math.PI * 2);
      ctx.arc(22, 5, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Era 1 (0): Gliding prehistoric pterodactyl silhouettes
  if (eraIndex === 0) {
    setInkStyle(ctx, 2.2, 'rgba(69, 26, 3, 0.58)');
    for (let i = 0; i < 4; i++) {
      const span = viewportW + 220;
      const bx = (((i * 280 + time * 24 - cameraX * 0.1) % span) + span) % span - 90;
      const by = 60 + i * 24 + Math.sin(time * 2 + i) * 6;
      const flap = Math.sin(time * 5.2 + i * 2) * 5.5;
      ctx.beginPath();
      ctx.moveTo(bx - 13, by + flap);
      ctx.quadraticCurveTo(bx - 4, by - 6, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 6, bx + 13, by + flap);
      ctx.stroke();
    }
  }

  // Era 4 (3 — NEW): Graceful white Eastern cranes gliding across sunset mist!
  if (eraIndex === 3) {
    setInkStyle(ctx, 2.0, 'rgba(255, 241, 242, 0.62)');
    for (let i = 0; i < 4; i++) {
      const span = viewportW + 220;
      const bx = (((i * 270 + time * 19 - cameraX * 0.09) % span) + span) % span - 90;
      const by = 68 + i * 22 + Math.sin(time * 1.8 + i) * 5;
      const flap = Math.sin(time * 4.5 + i * 1.7) * 4.5;
      ctx.beginPath();
      ctx.moveTo(bx - 11, by + flap);
      ctx.quadraticCurveTo(bx - 4, by - 5, bx, by);
      ctx.quadraticCurveTo(bx + 4, by - 5, bx + 11, by + flap);
      ctx.stroke();
    }
  }

  // Era 8 (7): Sweeping wartime anti-air searchlight cones!
  if (eraIndex === 7) {
    for (let i = 0; i < 3; i++) {
      const bx = viewportW * (0.2 + i * 0.3) - ((cameraX * 0.1) % 140);
      const ang = -Math.PI / 2 + Math.sin(time * 0.9 + i * 2.1) * 0.38;
      ctx.save();
      ctx.translate(bx, GROUND_Y);
      ctx.rotate(ang);
      const beam = ctx.createLinearGradient(0, 0, 340, 0);
      beam.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
      beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(340, -52);
      ctx.lineTo(340, 52);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Era 10 (9): Flying cyberpunk skyline traffic streaks with glowing trails
  if (eraIndex === 9) {
    for (let i = 0; i < 8; i++) {
      const span = viewportW + 180;
      const dir = i % 2 === 0 ? 1 : -1;
      const tx = (((i * 170 + time * 92 * dir - cameraX * 0.12) % span) + span) % span - 90;
      const ty = 104 + (i % 4) * 28;
      ctx.fillStyle = i % 2 === 0 ? accent : '#f43f5e';
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.roundRect(tx, ty, 20, 2.8, 1.5);
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
  farColor: string,
  sunColor: string,
  accent: string,
): void {
  const offset = -(cameraX * 0.16);
  ctx.save();

  if (eraIndex === 0) {
    // Smoking twin prehistoric cartoon volcanoes with glowing lava veins & warm rim glow!
    const spacing = 260;
    const start = Math.floor((-offset - 160) / spacing);
    const end = Math.ceil((viewportW - offset + 160) / spacing);
    for (let i = start; i <= end; i++) {
      const mx = i * spacing + offset;
      const isVolcano = Math.abs(i) % 2 === 1;
      const h = isVolcano ? 156 : 120 + (Math.abs(i * 37) % 36);

      const mGrad = ctx.createLinearGradient(mx, GROUND_Y - h, mx, GROUND_Y);
      mGrad.addColorStop(0, isVolcano ? '#7c3a21' : farColor);
      mGrad.addColorStop(1, farColor);
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.moveTo(mx - 144, GROUND_Y);
      if (isVolcano) {
        ctx.lineTo(mx - 26, GROUND_Y - h);
        ctx.lineTo(mx + 26, GROUND_Y - h);
      } else {
        ctx.quadraticCurveTo(mx, GROUND_Y - h - 22, mx + 144, GROUND_Y);
      }
      ctx.lineTo(mx + 144, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      if (isVolcano) {
        const calderaY = GROUND_Y - h;
        const glow = ctx.createRadialGradient(mx, calderaY, 4, mx, calderaY - 8, 54);
        glow.addColorStop(0, 'rgba(251, 146, 60, 0.55)');
        glow.addColorStop(0.5, 'rgba(234, 88, 12, 0.22)');
        glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mx, calderaY - 4, 54, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(mx, calderaY + 2, 24, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(mx, calderaY + 1, 15, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.78)';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(mx - 7, calderaY + 3);
        ctx.quadraticCurveTo(mx - 15, calderaY + 26, mx - 25, calderaY + 48);
        ctx.stroke();

        const sOff = (time * 14) % 34;
        ctx.fillStyle = 'rgba(255, 237, 213, 0.2)';
        ctx.beginPath();
        ctx.arc(mx + 4 + sOff * 0.6, calderaY - 14 - sOff * 0.55, 16, 0, Math.PI * 2);
        ctx.arc(mx + 22 + sOff * 0.9, calderaY - 28 - sOff * 0.45, 22, 0, Math.PI * 2);
        ctx.arc(mx + 44 + sOff * 1.1, calderaY - 40 - sOff * 0.35, 26, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (eraIndex === 1) {
    // Iconic Giza Pyramids with sunlit faces, stone tier glints & golden capstones!
    const spacing = 310;
    const start = Math.floor((-offset - 180) / spacing);
    const end = Math.ceil((viewportW - offset + 180) / spacing);
    for (let i = start; i <= end; i++) {
      const px = i * spacing + offset;
      const h = 140 + (Math.abs(i) % 2) * 40;
      const hw = h * 0.92;
      ctx.fillStyle = farColor;
      ctx.beginPath();
      ctx.moveTo(px - hw, GROUND_Y);
      ctx.lineTo(px, GROUND_Y - h);
      ctx.lineTo(px + hw, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(254, 240, 138, 0.28)';
      ctx.beginPath();
      ctx.moveTo(px - hw, GROUND_Y);
      ctx.lineTo(px, GROUND_Y - h);
      ctx.lineTo(px - hw * 0.1, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(px - hw * 0.14, GROUND_Y - h * 0.86);
      ctx.lineTo(px, GROUND_Y - h);
      ctx.lineTo(px + hw * 0.14, GROUND_Y - h * 0.86);
      ctx.closePath();
      ctx.fill();
    }
  } else if (eraIndex === 3) {
    // Era IV (NEW ANCIENT): Misty Eastern Jade Karst Peaks + Silhouetted Multi-Tier Pagoda Temple!
    const spacing = 220;
    const start = Math.floor((-offset - 160) / spacing);
    const end = Math.ceil((viewportW - offset + 160) / spacing);
    for (let i = start; i <= end; i++) {
      const mx = i * spacing + offset;
      const h = 128 + (Math.abs(i * 47) % 58);
      const hw = 72 + (Math.abs(i * 23) % 30);
      const mGrad = ctx.createLinearGradient(mx, GROUND_Y - h, mx, GROUND_Y);
      mGrad.addColorStop(0, farColor);
      mGrad.addColorStop(1, '#16282e');
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.moveTo(mx - hw, GROUND_Y);
      ctx.quadraticCurveTo(mx - hw * 0.45, GROUND_Y - h * 0.96, mx, GROUND_Y - h);
      ctx.quadraticCurveTo(mx + hw * 0.45, GROUND_Y - h * 0.92, mx + hw, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Sunlit rosy mist rim on peak
      ctx.fillStyle = 'rgba(254, 215, 170, 0.16)';
      ctx.beginPath();
      ctx.moveTo(mx - hw * 0.65, GROUND_Y);
      ctx.quadraticCurveTo(mx - hw * 0.35, GROUND_Y - h * 0.9, mx, GROUND_Y - h);
      ctx.lineTo(mx - hw * 0.08, GROUND_Y);
      ctx.closePath();
      ctx.fill();

      // Distant 3-tier Pagoda silhouette perched atop every 2nd peak!
      if (Math.abs(i) % 2 === 1) {
        const py = GROUND_Y - h + 6;
        ctx.fillStyle = '#1e353d';
        ctx.fillRect(mx - 14, py - 24, 28, 28);
        for (let t = 0; t < 3; t++) {
          const ty = py - 8 - t * 13;
          const tw = 24 - t * 4.5;
          ctx.beginPath();
          ctx.moveTo(mx - tw - 4, ty + 2);
          ctx.lineTo(mx - tw + 5, ty - 7);
          ctx.lineTo(mx + tw - 5, ty - 7);
          ctx.lineTo(mx + tw + 4, ty + 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillRect(mx - 1.5, py - 50, 3, 12);
        // Subtle warm golden pagoda lantern windows
        ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
        ctx.fillRect(mx - 3, py - 18, 6, 4);
        ctx.fillRect(mx - 2.5, py - 30, 5, 3.5);
      }
    }
  } else if (eraIndex === 6 || eraIndex === 8 || eraIndex === 9) {
    // Steampunk Industrial (6) / Modern Night Metropolis (8) / Cyberpunk Neon Skyline (9)!
    const spacing = 74;
    const start = Math.floor((-offset - 90) / spacing);
    const end = Math.ceil((viewportW - offset + 90) / spacing);
    for (let i = start; i <= end; i++) {
      const bx = i * spacing + offset;
      const seed = Math.abs(i * 73 + 19);
      const bw = 42 + (seed % 28);
      const bh = 95 + (seed % 112);

      const bGrad = ctx.createLinearGradient(bx, GROUND_Y - bh, bx + bw, GROUND_Y);
      bGrad.addColorStop(0, farColor);
      bGrad.addColorStop(1, '#0c1220');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.roundRect(bx, GROUND_Y - bh, bw, bh, eraIndex === 9 ? [10, 10, 0, 0] : 2);
      ctx.fill();

      if (eraIndex === 6) {
        if (seed % 3 === 0) {
          ctx.fillRect(bx + bw * 0.35, GROUND_Y - bh - 28, 10, 28);
          ctx.fillStyle = 'rgba(254, 215, 170, 0.18)';
          ctx.beginPath();
          ctx.arc(bx + bw * 0.4 + 12, GROUND_Y - bh - 38, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(251, 146, 60, 0.38)';
        ctx.fillRect(bx + 8, GROUND_Y - 46, bw - 16, 10);
      } else {
        if (bh > 155) {
          ctx.fillStyle = farColor;
          ctx.fillRect(bx + bw / 2 - 1.5, GROUND_Y - bh - 22, 3, 22);
          const blink = Math.sin(time * 4 + i) > 0;
          if (blink) {
            ctx.fillStyle = eraIndex === 9 ? accent : '#ef4444';
            ctx.beginPath();
            ctx.arc(bx + bw / 2, GROUND_Y - bh - 22, 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.fillStyle = eraIndex === 9 ? accent : 'rgba(254, 240, 138, 0.48)';
        ctx.globalAlpha = eraIndex === 9 ? 0.56 : 0.72;
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
  } else if (eraIndex === 10 || eraIndex === 11) {
    // Era XI (10) Cosmic Monoliths & Era XII (11 — NEW) Floating Pearl-Gold Quantum Chrono-Spires!
    const isChrono = eraIndex === 11;
    const spacing = 220;
    const start = Math.floor((-offset - 120) / spacing);
    const end = Math.ceil((viewportW - offset + 120) / spacing);
    for (let i = start; i <= end; i++) {
      const mx = i * spacing + offset;
      const bob = Math.sin(time * 1.1 + i * 1.7) * 8;
      const mh = 112 + (Math.abs(i * 41) % 65);
      const my = GROUND_Y - 124 + bob;
      ctx.fillStyle = isChrono ? '#134e4a' : farColor;
      ctx.beginPath();
      ctx.moveTo(mx, my - mh * 0.58);
      ctx.lineTo(mx + 27, my);
      ctx.lineTo(mx, my + mh * 0.44);
      ctx.lineTo(mx - 27, my);
      ctx.closePath();
      ctx.fill();
      if (isChrono) {
        // Illuminated pearl-gold crystalline spine & dual teal-gold halo rings!
        ctx.fillStyle = 'rgba(254, 240, 138, 0.78)';
        ctx.fillRect(mx - 2.2, my - mh * 0.42, 4.4, mh * 0.72);
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.58)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(mx, my, 40, 9, -0.18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.42)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(mx, my - 12, 26, 6, 0.2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.65)';
        ctx.fillRect(mx - 2, my - mh * 0.36, 4, mh * 0.66);
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(mx, my, 36, 8, -0.15, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else {
    // Smooth sweeping sunlit mountain range (Classical 2 / Medieval 4 / Gunpowder 5 / WW 7)
    const mGrad = ctx.createLinearGradient(0, GROUND_Y - 165, 0, GROUND_Y);
    mGrad.addColorStop(0, farColor);
    mGrad.addColorStop(1, '#141a26');
    ctx.fillStyle = mGrad;
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

    ctx.strokeStyle = sunColor;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Grounded Distant Classical Parthenon (2) or Medieval Castle (4) Silhouettes!
    if (eraIndex === 2 || eraIndex === 4) {
      const lx = (((420 + offset) % (viewportW + 300)) + (viewportW + 300)) % (viewportW + 300) - 100;
      ctx.fillStyle = farColor;
      if (eraIndex === 2) {
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

  // Rolling smooth shaded cartoon hills with crisp sunlit rim!
  const hillGrad = ctx.createLinearGradient(0, GROUND_Y - 82, 0, GROUND_Y);
  hillGrad.addColorStop(0, midColor);
  hillGrad.addColorStop(1, '#101622');
  ctx.fillStyle = hillGrad;
  ctx.beginPath();
  ctx.moveTo(-20, GROUND_Y);
  const step = 160;
  const start = Math.floor((-offset - 180) / step);
  const end = Math.ceil((viewportW - offset + 180) / step);
  for (let i = start; i <= end; i++) {
    const x = i * step + offset;
    const h = 44 + Math.sin(i * 1.15 + eraIndex) * 20 + Math.cos(i * 0.65) * 14;
    ctx.quadraticCurveTo(x, GROUND_Y - h - 18, x + step * 0.5, GROUND_Y - h * 0.55);
  }
  ctx.lineTo(viewportW + 40, GROUND_Y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Two-tone detailed era props along midground ridge!
  const propStep = 205;
  const pStart = Math.floor((-offset - 120) / propStep);
  const pEnd = Math.ceil((viewportW - offset + 120) / propStep);
  for (let i = pStart; i <= pEnd; i++) {
    const px = i * propStep + offset + ((i * 59) & 31);
    const py = GROUND_Y - 4;

    if (eraIndex === 0 || eraIndex === 4 || eraIndex === 5) {
      // Two-tone Kingdom-Rush cartoon trees with lit crown highlights!
      ctx.fillStyle = '#3b2412';
      ctx.fillRect(px - 4.5, py - 34, 9, 34);
      ctx.fillStyle = propColor;
      ctx.beginPath();
      ctx.arc(px, py - 42, 19, 0, Math.PI * 2);
      ctx.arc(px - 13, py - 32, 13.5, 0, Math.PI * 2);
      ctx.arc(px + 13, py - 32, 13.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(px - 4, py - 47, 11, 0, Math.PI * 2);
      ctx.fill();
    } else if (eraIndex === 3) {
      // Era IV (NEW): Blossoming Pink Sakura Trees & Crimson Torii-Style Shrine Gates!
      if (Math.abs(i) % 2 === 0) {
        ctx.fillStyle = '#3b2412';
        ctx.fillRect(px - 4, py - 34, 8, 34);
        ctx.fillStyle = '#be185d';
        ctx.beginPath();
        ctx.arc(px, py - 42, 19, 0, Math.PI * 2);
        ctx.arc(px - 14, py - 33, 14, 0, Math.PI * 2);
        ctx.arc(px + 14, py - 33, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbcfe8';
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.arc(px - 5, py - 47, 11, 0, Math.PI * 2);
        ctx.arc(px + 10, py - 38, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        // Stylized crimson stone archway gate
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(px - 15, py - 42, 5, 42);
        ctx.fillRect(px + 10, py - 42, 5, 42);
        ctx.fillRect(px - 22, py - 46, 44, 6);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px - 18, py - 36, 36, 4);
      }
    } else if (eraIndex === 1) {
      // Desert date palms & gilded obelisk markers
      ctx.fillStyle = propColor;
      if (Math.abs(i) % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(px - 8, py);
        ctx.lineTo(px - 5, py - 48);
        ctx.lineTo(px, py - 60);
        ctx.lineTo(px + 5, py - 48);
        ctx.lineTo(px + 8, py);
        ctx.fill();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.65)';
        ctx.beginPath();
        ctx.moveTo(px - 5, py - 48);
        ctx.lineTo(px, py - 60);
        ctx.lineTo(px + 5, py - 48);
        ctx.fill();
      } else {
        ctx.fillRect(px - 3, py - 40, 6, 40);
        for (let f = -2; f <= 2; f++) {
          ctx.beginPath();
          ctx.ellipse(px + f * 9, py - 40 + Math.abs(f) * 3, 13, 4.2, f * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (eraIndex === 2) {
      // Classical Mediterranean cypress & marble ruin column
      ctx.fillStyle = propColor;
      ctx.beginPath();
      ctx.ellipse(px, py - 30, 9.5, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.ellipse(px - 2.5, py - 34, 4, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (eraIndex === 6) {
      // Steampunk pipes & silhouette clockwork gear
      ctx.fillStyle = propColor;
      ctx.fillRect(px - 7, py - 48, 14, 48);
      ctx.beginPath();
      ctx.arc(px + 18, py - 24, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = midColor;
      ctx.beginPath();
      ctx.arc(px + 18, py - 24, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (eraIndex >= 9) {
      // Glowing futuristic / cosmic / Chrono energy obelisk pylons
      ctx.fillStyle = propColor;
      ctx.beginPath();
      ctx.moveTo(px - 10, py);
      ctx.lineTo(px - 4.5, py - 54);
      ctx.lineTo(px + 4.5, py - 54);
      ctx.lineTo(px + 10, py);
      ctx.fill();
      const pulse = 0.6 + Math.sin(time * 3.2 + i) * 0.35;
      ctx.fillStyle = eraIndex === 11 ? '#facc15' : accent;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(px, py - 56, 5.5, 0, Math.PI * 2);
      ctx.fill();
      if (eraIndex === 11) {
        ctx.strokeStyle = '#2dd4bf';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(px, py - 56, 11, 3.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = propColor;
      ctx.fillRect(px - 15, py - 24, 30, 24);
      ctx.fillRect(px - 8, py - 36, 14, 14);
    }
  }

  ctx.restore();
}

/** Subtle ambient drifting embers / desert glints / sakura petals / cyber data motes / cosmic stardust */
function drawAmbientMotes(
  ctx: CanvasRenderingContext2D,
  eraIndex: number,
  cameraX: number,
  viewportW: number,
  time: number,
  accent: string,
): void {
  ctx.save();
  const count = eraIndex === 3 || eraIndex === 11 ? 20 : 16;
  const col =
    eraIndex === 0 || eraIndex === 6 || eraIndex === 7
      ? '#fb923c'
      : eraIndex === 1
        ? '#fde047'
        : eraIndex === 3
          ? '#fbcfe8'
          : eraIndex === 11
            ? '#fef08a'
            : eraIndex >= 9
              ? accent
              : '#fef9c3';

  for (let i = 0; i < count; i++) {
    const span = viewportW + 80;
    const speedX = eraIndex === 1 ? -28 : eraIndex === 3 ? -18 - (i % 3) * 4 : 12 + (i % 4) * 5;
    const mx = (((i * 97 + time * speedX - cameraX * 0.55) % span) + span) % span - 40;
    const rise = eraIndex === 0 || eraIndex === 6 || eraIndex >= 9;
    const rawY = rise
      ? GROUND_Y - 12 - ((time * (18 + (i % 3) * 7) + i * 31) % 185)
      : 70 + ((i * 43 + time * (eraIndex === 3 ? 22 : 14)) % 210);
    const alpha = 0.28 + 0.45 * Math.abs(Math.sin(time * 2.5 + i * 1.7));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = eraIndex === 11 && i % 2 === 0 ? '#2dd4bf' : col;
    ctx.beginPath();
    if (eraIndex === 3) {
      // Drifting sakura blossom petals!
      ctx.ellipse(mx, rawY, 3.2, 1.8, time * 1.5 + i, 0, Math.PI * 2);
    } else {
      ctx.arc(mx, rawY, i % 4 === 0 ? 2.4 : 1.5, 0, Math.PI * 2);
    }
    ctx.fill();
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

  const gGrad = ctx.createLinearGradient(0, GROUND_Y, 0, WORLD_HEIGHT + 36);
  gGrad.addColorStop(0, midCol);
  gGrad.addColorStop(0.42, darkCol);
  gGrad.addColorStop(0.85, '#121824');
  gGrad.addColorStop(1, '#0c111b');
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, GROUND_Y, viewportW + 4, groundH + 40);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fillRect(0, GROUND_Y + 26, viewportW + 4, 14);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
  ctx.fillRect(0, GROUND_Y + 54, viewportW + 4, 18);

  const roadGrad = ctx.createLinearGradient(0, GROUND_Y - 3, 0, GROUND_Y + 15);
  roadGrad.addColorStop(0, topCol);
  roadGrad.addColorStop(1, midCol);
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, GROUND_Y - 3, viewportW + 4, 18);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.fillRect(0, GROUND_Y - 2, viewportW + 4, 3);

  const tileW = 64;
  const start = Math.floor((cameraX - 64) / tileW);
  const end = Math.ceil((cameraX + viewportW + 64) / tileW);

  ctx.save();
  for (let i = start; i <= end; i++) {
    const sx = i * tileW - cameraX;
    if (eraIndex === 2 || eraIndex === 3 || eraIndex === 4 || eraIndex === 5) {
      // Handcrafted beveled cartoon cobblestones / imperial stone paving slabs
      ctx.fillStyle = 'rgba(12, 16, 26, 0.2)';
      ctx.beginPath();
      ctx.roundRect(sx + 4, GROUND_Y + 2, 24, 9, 3);
      ctx.roundRect(sx + 34, GROUND_Y + 3, 24, 8, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.fillRect(sx + 6, GROUND_Y + 3, 20, 2);
      ctx.fillRect(sx + 36, GROUND_Y + 4, 20, 2);
    } else if (eraIndex === 8) {
      // Modern highway dashed lane markers + asphalt bevel
      ctx.fillStyle = 'rgba(250, 204, 21, 0.65)';
      ctx.beginPath();
      ctx.roundRect(sx + 12, GROUND_Y + 5, 30, 3.5, 1.5);
      ctx.fill();
    } else if (eraIndex >= 9) {
      // Glowing neon sci-fi / cosmic / Chrono-Gold energy deck plates + circuit seams!
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(sx + 2, GROUND_Y + 1, 58, 12);
      ctx.fillStyle = eraIndex === 11 && i % 2 === 0 ? '#facc15' : accent;
      ctx.globalAlpha = 0.68;
      ctx.beginPath();
      ctx.roundRect(sx + 8, GROUND_Y + 5, 44, 2.8, 1.4);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(12, 16, 26, 0.2)';
      ctx.beginPath();
      ctx.ellipse(sx + 16, GROUND_Y + 7, 7.5, 2.8, 0, 0, Math.PI * 2);
      ctx.ellipse(sx + 48, GROUND_Y + 6, 5.2, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.ellipse(sx + 14.5, GROUND_Y + 6, 3.5, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  setInkStyle(ctx, 2.6, INK);
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 3);
  ctx.lineTo(viewportW + 4, GROUND_Y - 3);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.36)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 15);
  ctx.lineTo(viewportW + 4, GROUND_Y + 15);
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

    if (eraIndex === 0 || eraIndex === 4) {
      drawCelPoly(
        ctx,
        [
          [px - 14, py],
          [px - 18 + sway, py - 14],
          [px - 6, py - 7],
          [px + sway, py - 19],
          [px + 6, py - 7],
          [px + 18 + sway, py - 13],
          [px + 14, py],
        ],
        era.palette.groundTop,
        { highlight: '#a3e635', shadow: '#365314', lineWidth: 1.8 },
      );
    } else if (eraIndex === 3) {
      // Foreground bamboo shoots & crimson stone lanterns for Eastern Dynasty!
      drawCelPoly(
        ctx,
        [
          [px - 12, py],
          [px - 15 + sway, py - 16],
          [px - 5, py - 8],
          [px + sway, py - 21],
          [px + 6, py - 8],
          [px + 15 + sway, py - 15],
          [px + 11, py],
        ],
        '#047857',
        { highlight: '#34d399', shadow: '#064e3b', lineWidth: 1.7 },
      );
    } else if (eraIndex === 1 || eraIndex === 2) {
      drawCelEllipse(ctx, px, py - 6, 15, 8, era.palette.nearProp, {
        highlight: 'rgba(255,255,255,0.28)',
        shadow: 'rgba(0,0,0,0.3)',
        lineWidth: 1.8,
      });
    } else if (eraIndex >= 9) {
      drawCelPoly(
        ctx,
        [
          [px - 10, py],
          [px - 5, py - 18],
          [px + 2, py - 11],
          [px + 8, py - 21],
          [px + 13, py],
        ],
        eraIndex === 11 ? '#facc15' : era.palette.accent,
        { highlight: '#ffffff', shadow: eraIndex === 11 ? '#0f766e' : '#4c1d95', lineWidth: 1.7 },
      );
    } else {
      drawCelRoundRect(ctx, px - 12, py - 12, 24, 12, 3, era.palette.nearProp, {
        highlight: 'rgba(255,255,255,0.2)',
        shadow: 'rgba(0,0,0,0.35)',
        lineWidth: 1.8,
      });
    }
  }

  // Dynamic Era Weather Overlay (desert wind, wartime rain, cyberpunk neon rain, cosmic meteors!)
  if (eraIndex === 1) {
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.16)';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const span = viewportW + 220;
      const sx = (((i * 155 + time * 160 - cameraX * 0.5) % span) + span) % span - 110;
      const sy = 95 + (i % 5) * 44 + Math.sin(time * 2 + i) * 8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + 38, sy - 6, sx + 78, sy + 2);
      ctx.stroke();
    }
  } else if (eraIndex === 5 || eraIndex === 7 || eraIndex === 9) {
    const isNeon = eraIndex === 9;
    ctx.lineWidth = isNeon ? 1.6 : 1.3;
    ctx.lineCap = 'round';
    const drops = isNeon ? 24 : 20;
    for (let i = 0; i < drops; i++) {
      const rx = (((i * 97 - time * 130 - cameraX * 0.45) % (viewportW + 80)) + (viewportW + 80)) % (viewportW + 80) - 40;
      const ry = (((i * 67 + time * 360) % (GROUND_Y + 20)) + (GROUND_Y + 20)) % (GROUND_Y + 20);
      ctx.strokeStyle = isNeon
        ? i % 3 === 0
          ? 'rgba(244, 114, 182, 0.28)'
          : 'rgba(56, 189, 248, 0.28)'
        : 'rgba(203, 213, 225, 0.22)';
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 7, ry + 18);
      ctx.stroke();
    }
  } else if (eraIndex === 10 || eraIndex === 11) {
    // Sweeping cosmic shooting stars / Chrono golden light-streaks!
    for (let i = 0; i < 3; i++) {
      const phase = (time * 0.32 + i * 0.37) % 1;
      if (phase < 0.35) {
        const t = phase / 0.35;
        const sx = viewportW * (0.25 + i * 0.28) + t * 180;
        const sy = 42 + i * 32 + t * 55;
        const alpha = Math.sin(t * Math.PI) * 0.72;
        ctx.strokeStyle =
          eraIndex === 11
            ? `rgba(94, 234, 212, ${alpha.toFixed(2)})`
            : `rgba(254, 240, 138, ${alpha.toFixed(2)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(sx - 34, sy - 11);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
