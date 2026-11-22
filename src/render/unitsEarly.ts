import type { Team, UnitVisualKind } from '../data/types';
import {
  INK,
  drawCartoonCape,
  drawCartoonFace,
  drawCartoonHumanoid,
  drawCartoonMuzzleFlash,
  drawCartoonWheel,
  drawCelEllipse,
  drawCelPoly,
  drawCelRoundRect,
  drawEnergyOrb,
  drawInkLimb,
  drawRivetStrip,
  drawSculptedLimb,
  getTeamPalette,
  setInkStyle,
} from './cartoonPrimitives';

export interface CartoonUnitDrawParams {
  kind: UnitVisualKind;
  team: Team;
  walkPhase: number;
  isWalking: boolean;
  attackAnim: number;
  hitFlash: number;
  deathProgress: number;
}

/**
 * Render Eras 1–5 Flash-Cartoon units (20 distinct designs).
 * Origin (0, 0) is bottom-center on ground, facing RIGHT (+X).
 * Returns true if the unit was handled.
 */
export function drawEarlyCartoonUnit(ctx: CanvasRenderingContext2D, p: CartoonUnitDrawParams): boolean {
  const pal = getTeamPalette(p.team);

  switch (p.kind) {
    // ========================================================================
    // ERA 1: 원시 시대 (STONE AGE)
    // ========================================================================
    case 'clubman': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.07,
        skin: '#f2b88b',
        torsoFill: '#a16207',
        torsoHighlight: '#ca8a04',
        torsoShadow: '#713f12',
        pantsColor: '#854d0e',
        bootColor: '#5c3412',
        bootCuffColor: '#d97706',
        beltColor: pal.main,
        sleeveCuffColor: '#78350f',
        skirtColor: '#92400e',
        skirtTrim: '#f59e0b',
        skirtStyle: 'kilt',
        beardColor: '#451a03',
        pauldronColor: '#78350f',
        pauldronTrim: '#fef3c7',
        swingStyle: 'overhead',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Spotted sabertooth pelt diagonal strap + fang necklace!
          drawCelPoly(
            c,
            [
              [tx + 1, ty + 1],
              [tx + tw * 0.58, ty + 1],
              [tx + tw - 1, ty + th - 2],
              [tx + tw * 0.36, ty + th - 2],
            ],
            '#d97706',
            { highlight: '#fbbf24', shadow: '#92400e', lineWidth: 1.45 },
          );
          c.fillStyle = '#451a03';
          c.beginPath();
          c.arc(tx + 6, ty + 5.5, 1.4, 0, Math.PI * 2);
          c.arc(tx + 9.5, ty + 10.5, 1.6, 0, Math.PI * 2);
          c.arc(tx + 12.2, ty + 14.2, 1.3, 0, Math.PI * 2);
          c.fill();
          // Bone fang talisman at chest
          drawCelPoly(
            c,
            [
              [tx + tw * 0.45, ty + 2],
              [tx + tw * 0.58, ty + 7],
              [tx + tw * 0.66, ty + 2],
            ],
            '#f8fafc',
            { lineWidth: 1.1 },
          );
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Bone hairpin tucked into wild shaggy caveman mane!
          drawCelRoundRect(c, hx - hr - 3, hy - hr - 2.5, 12, 3, 1.4, '#f8fafc', { lineWidth: 1.25 });
          drawCelEllipse(c, hx - hr - 3.5, hy - hr - 1.2, 2.2, 2.2, '#f8fafc', { lineWidth: 1.2 });
          drawCelPoly(
            c,
            [
              [hx - hr - 2.5, hy + 1.5],
              [hx - hr - 5, hy - 4.5],
              [hx - 4, hy - hr - 3.5],
              [hx + 1.5, hy - hr - 4.8],
              [hx + 7.5, hy - hr - 1.2],
              [hx + hr + 1.5, hy - 3],
              [hx - 0.5, hy - 2.8],
            ],
            '#451a03',
            { highlight: '#78350f', lineWidth: 1.75 },
          );
          // Tied team war-headband
          drawCelRoundRect(c, hx - hr - 1, hy - 5.4, hr * 2 + 2.5, 3.6, 1.4, pal.main, {
            highlight: pal.light,
            lineWidth: 1.45,
          });
        },
        drawWeapon: (c) => {
          // Chunky wood-grain prehistoric club with leather grip & bone spikes!
          drawCelPoly(
            c,
            [
              [-2.2, 4],
              [2.2, 4],
              [7.2, -22],
              [1.5, -24.5],
              [-5.0, -21],
            ],
            '#854d0e',
            { highlight: '#ca8a04', shadow: '#451a03', lineWidth: 1.95 },
          );
          // Wood grain & leather handle wrap
          setInkStyle(c, 1.1, '#451a03');
          c.beginPath();
          c.moveTo(0.8, -4);
          c.lineTo(2.4, -18);
          c.stroke();
          drawCelRoundRect(c, -2.5, -4, 5.2, 5.5, 1, pal.main, { lineWidth: 1.2 });
          // Embedded bone spikes
          drawCelPoly(
            c,
            [
              [4.5, -18],
              [11.5, -20.5],
              [5.5, -13.5],
            ],
            '#f8fafc',
            { shadow: '#cbd5e1', lineWidth: 1.45 },
          );
          drawCelPoly(
            c,
            [
              [-3.2, -15],
              [-9.5, -17.5],
              [-2.8, -10.5],
            ],
            '#f8fafc',
            { shadow: '#cbd5e1', lineWidth: 1.45 },
          );
          drawCelPoly(
            c,
            [
              [0, -22],
              [2.2, -28.5],
              [4.6, -21.5],
            ],
            '#fef3c7',
            { lineWidth: 1.35 },
          );
        },
      });
      return true;
    }

    case 'slinger': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.02,
        torsoW: 15,
        torsoH: 18.5,
        skin: '#f2b88b',
        torsoFill: '#c28144',
        torsoHighlight: '#e0a56b',
        torsoShadow: '#7c4a1d',
        pantsColor: '#78350f',
        bootColor: '#451a03',
        bootCuffColor: '#a16207',
        beltColor: '#5c3412',
        sleeveCuffColor: pal.main,
        skirtColor: '#78350f',
        skirtTrim: '#d97706',
        skirtStyle: 'kilt',
        swingStyle: 'throw',
        drawBackAccessory: (c, topY) => {
          // Bulging leather stone-ammo pouch with protruding river pebbles
          drawCelEllipse(c, -9.5, topY + 13.5, 5.4, 6.2, '#713f12', {
            highlight: '#a16207',
            shadow: '#451a03',
            lineWidth: 1.7,
          });
          drawCelEllipse(c, -9.5, topY + 8.5, 2.5, 2.1, '#94a3b8', { highlight: '#e2e8f0', lineWidth: 1.1 });
        },
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Cross-chest leather sling strap with tied stone pouches
          setInkStyle(c, 3.0, '#451a03');
          c.beginPath();
          c.moveTo(tx + 2, ty + 1);
          c.lineTo(tx + tw - 2, ty + th - 2);
          c.stroke();
          setInkStyle(c, 1.6, '#d97706');
          c.beginPath();
          c.moveTo(tx + 2, ty + 1);
          c.lineTo(tx + tw - 2, ty + th - 2);
          c.stroke();
          drawCelEllipse(c, tx + tw * 0.55, ty + th * 0.48, 2.3, 2.1, '#94a3b8', {
            highlight: '#e2e8f0',
            lineWidth: 1.1,
          });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Spiky hunter hair + twin fluttering team bandana tails!
          drawCelPoly(
            c,
            [
              [hx - hr, hy - 1],
              [hx - hr - 3.5, hy - 6.5],
              [hx - 2, hy - hr - 4],
              [hx + 3, hy - hr - 3],
              [hx + hr, hy - 4],
            ],
            '#3b1f0b',
            { highlight: '#713f12', lineWidth: 1.65 },
          );
          const flutter = Math.sin(p.walkPhase * 1.7) * 3.2;
          drawCelPoly(
            c,
            [
              [hx - hr, hy - 4.2],
              [hx - hr - 12.5, hy - 7.5 + flutter],
              [hx - hr - 10, hy - 2.8 + flutter],
            ],
            pal.main,
            { highlight: pal.light, lineWidth: 1.4 },
          );
          drawCelPoly(
            c,
            [
              [hx - hr, hy - 2.6],
              [hx - hr - 10, hy + 0.2 - flutter * 0.6],
              [hx - hr - 7, hy + 2.4 - flutter * 0.6],
            ],
            pal.dark,
            { lineWidth: 1.3 },
          );
          drawCelRoundRect(c, hx - hr - 0.5, hy - 5.5, hr * 2 + 2.2, 3.6, 1.5, pal.main, {
            highlight: pal.light,
            lineWidth: 1.45,
          });
        },
        drawWeapon: (c, firing) => {
          // Braided leather sling with leather cup & polished granite stone
          const spin = p.attackAnim > 0.05 ? p.attackAnim * Math.PI * 5 : p.walkPhase * 0.6;
          const sx = Math.cos(spin) * 11.5;
          const sy = Math.sin(spin) * 11.5 - 4;
          setInkStyle(c, 2.2, '#451a03');
          c.beginPath();
          c.moveTo(0, 0);
          c.quadraticCurveTo(sx * 0.45, sy - 4.5, sx, sy);
          c.moveTo(0, 0);
          c.quadraticCurveTo(sx * 0.55, sy + 2.5, sx, sy);
          c.stroke();
          if (!firing) {
            drawCelEllipse(c, sx, sy, 4.6, 3.8, '#94a3b8', {
              highlight: '#f1f5f9',
              shadow: '#334155',
              lineWidth: 1.65,
            });
          } else {
            drawCartoonMuzzleFlash(c, 10, -4, 7.5, '#fde047', '#ffffff');
          }
        },
      });
      return true;
    }

    case 'shaman': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.09,
        skin: '#d99a6c',
        torsoFill: '#5c2d16',
        torsoHighlight: '#854d0e',
        torsoShadow: '#3b180b',
        pantsColor: '#451a03',
        bootColor: '#2c1205',
        bootCuffColor: '#f97316',
        beltColor: '#78350f',
        sleeveCuffColor: '#f8fafc',
        skirtColor: '#5c2d16',
        skirtTrim: '#f97316',
        skirtStyle: 'tunic',
        capeColor: pal.main,
        capeDark: pal.dark,
        swingStyle: 'staff',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Layered tribal feather collar + bone rib necklace!
          for (let i = 0; i < 4; i++) {
            drawCelEllipse(c, tx + 2.5 + i * 4.2, ty + 2.2, 2.2, 3.5, i % 2 === 0 ? pal.light : '#f97316', {
              lineWidth: 1.1,
            });
          }
          for (let i = 0; i < 3; i++) {
            drawCelRoundRect(c, tx + 3.2, ty + 6.5 + i * 4.0, tw - 6.4, 2.2, 1, '#f8fafc', { lineWidth: 1.05 });
          }
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Vivid feather headdress fan behind carved horned beast-skull mask
          drawCelEllipse(c, hx - 7.5, hy - hr - 2, 2.6, 6.8, pal.light, { rotation: -0.55, lineWidth: 1.35 });
          drawCelEllipse(c, hx - 2.5, hy - hr - 5.5, 2.6, 7.2, '#f97316', { rotation: -0.2, lineWidth: 1.35 });
          drawCelEllipse(c, hx + 2.8, hy - hr - 5, 2.4, 6.4, '#facc15', { rotation: 0.18, lineWidth: 1.35 });

          // Horned skull mask with war-paint stripes & blazing ember eye socket
          drawCelEllipse(c, hx + 1.6, hy - 0.5, hr + 1.4, hr + 0.5, '#f8fafc', {
            highlight: '#ffffff',
            shadow: '#cbd5e1',
            lineWidth: 1.9,
          });
          // Tribal team war-paint stripes on brow
          c.fillStyle = pal.main;
          c.fillRect(hx - 1, hy - 5.5, 6, 2.0);
          c.fillStyle = '#0f172a';
          c.beginPath();
          c.arc(hx + 5.2, hy - 1.3, 2.6, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#f97316';
          c.beginPath();
          c.arc(hx + 5.4, hy - 1.3, 1.45, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#fef08a';
          c.beginPath();
          c.arc(hx + 5.1, hy - 1.7, 0.6, 0, Math.PI * 2);
          c.fill();
          // Curved ivory bull horns
          drawCelPoly(
            c,
            [
              [hx - 3.5, hy - hr + 1.5],
              [hx - 12.5, hy - hr - 8.5],
              [hx - 0.5, hy - hr - 1.5],
            ],
            '#fef3c7',
            { shadow: '#d97706', lineWidth: 1.65 },
          );
          drawCelPoly(
            c,
            [
              [hx + 4, hy - hr + 1.5],
              [hx + 12, hy - hr - 8.5],
              [hx + 7.5, hy - hr + 2],
            ],
            '#fef3c7',
            { shadow: '#d97706', lineWidth: 1.65 },
          );
        },
        drawWeapon: (c, firing) => {
          // Carved gnarled fire-totem staff with hanging feathers & blazing ember ring!
          drawSculptedLimb(c, 2, 13, 5, -24, 4.2, 3.0, '#78350f', {
            highlight: '#b45309',
            shadow: '#451a03',
            lineWidth: 1.7,
          });
          // Dangling spirit charm feathers
          drawCelEllipse(c, 0, -17, 2.0, 4.5, pal.light, { rotation: 0.35, lineWidth: 1.15 });
          drawCelEllipse(c, 9.5, -18, 2.0, 4.5, '#facc15', { rotation: -0.35, lineWidth: 1.15 });
          // Carved totem head collar
          drawCelPoly(
            c,
            [
              [-1, -22],
              [11, -22],
              [9, -28],
              [1, -28],
            ],
            pal.main,
            { highlight: pal.light, lineWidth: 1.5 },
          );
          drawEnergyOrb(c, 5, -31, firing ? 8.6 : 5.8, '#f97316', '#fef08a');
        },
      });
      return true;
    }

    case 'dino_rider': {
      drawDinoRider(ctx, p, pal);
      return true;
    }

    // ========================================================================
    // ERA 2: 고대 이집트 (ANCIENT EGYPT)
    // ========================================================================
    case 'anubis_warrior': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.11,
        skin: '#1e293b',
        torsoFill: '#b45309',
        torsoHighlight: '#fbbf24',
        torsoShadow: '#78350f',
        pantsColor: '#f8fafc',
        bootColor: '#d97706',
        bootCuffColor: '#fef08a',
        beltColor: pal.main,
        sleeveCuffColor: '#facc15',
        skirtColor: '#f8fafc',
        skirtTrim: '#facc15',
        skirtStyle: 'kilt',
        pauldronColor: '#f59e0b',
        pauldronTrim: pal.light,
        eyeColor: '#facc15',
        swingStyle: 'overhead',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Layered golden Egyptian Usekh pectoral collar + central royal sash!
          drawCelRoundRect(c, tx + tw * 0.36, ty + 6, tw * 0.28, th - 6, 1.2, pal.main, {
            highlight: pal.light,
            lineWidth: 1.25,
          });
          drawCelEllipse(c, tx + tw / 2, ty + 4.2, tw * 0.56, 4.8, '#facc15', {
            highlight: '#fef9c3',
            shadow: '#b45309',
            lineWidth: 1.55,
          });
          drawCelEllipse(c, tx + tw / 2, ty + 4.5, 2.7, 2.7, pal.light, { highlight: '#ffffff', lineWidth: 1.15 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Striped Nemes headdress lappets draping behind jaw
          drawCelPoly(
            c,
            [
              [hx - hr - 3, hy - 3],
              [hx - hr - 5, hy + 8.5],
              [hx - 2, hy + 7.5],
              [hx - 1, hy - 2],
            ],
            pal.main,
            { highlight: pal.light, shadow: pal.dark, lineWidth: 1.6 },
          );
          c.fillStyle = '#facc15';
          c.fillRect(hx - hr - 3.2, hy + 0.5, 6.2, 1.8);
          c.fillRect(hx - hr - 3.6, hy + 4.2, 6.6, 1.8);

          // Sculpted obsidian Anubis jackal head + golden ear rings!
          drawCelPoly(
            c,
            [
              [hx - hr, hy + 5],
              [hx - hr - 3, hy - 3.5],
              [hx, hy - hr - 1.2],
              [hx + hr + 5.8, hy - 1.2],
              [hx + hr + 4.5, hy + 3.6],
              [hx + 2, hy + 4.8],
            ],
            '#1e293b',
            { highlight: '#475569', shadow: '#090d16', lineWidth: 1.9 },
          );
          // Tall twin Anubis ears with golden inner trim
          drawCelPoly(
            c,
            [
              [hx - 5.2, hy - hr + 2],
              [hx - 7.5, hy - hr - 14],
              [hx - 0.5, hy - hr + 1],
            ],
            '#1e293b',
            { highlight: '#facc15', lineWidth: 1.75 },
          );
          drawCelPoly(
            c,
            [
              [hx + 0.5, hy - hr + 2],
              [hx + 1.8, hy - hr - 13],
              [hx + 5.8, hy - hr + 2],
            ],
            '#1e293b',
            { highlight: '#facc15', lineWidth: 1.75 },
          );
          // Gold ear cuff + brow band + fierce blazing golden jackal eye
          drawCelRoundRect(c, hx - hr - 1.5, hy - 4.4, hr * 1.45, 3.0, 1.2, '#facc15', { lineWidth: 1.25 });
          c.fillStyle = '#fde047';
          c.beginPath();
          c.arc(hx + 5.8, hy - 1.4, 2.0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(hx + 5.3, hy - 1.9, 0.75, 0, Math.PI * 2);
          c.fill();
        },
        drawWeapon: (c) => {
          // Engraved curved golden Khopesh sickle-sword with lapis pommel!
          drawCelEllipse(c, -0.5, 5.2, 2.5, 2.5, pal.light, { highlight: '#ffffff', lineWidth: 1.25 });
          drawSculptedLimb(c, 0, 4, 2, -6, 3.6, 3.0, '#78350f', { lineWidth: 1.45 });
          drawCelRoundRect(c, -2.2, -7.5, 6.8, 3.0, 1, '#facc15', { lineWidth: 1.25 });
          c.save();
          c.beginPath();
          c.moveTo(0, -6.5);
          c.quadraticCurveTo(11, -14.5, 13.5, -24.5);
          c.quadraticCurveTo(4.5, -28.5, -2.5, -23);
          c.quadraticCurveTo(5.2, -18.5, 4.2, -10.5);
          c.closePath();
          const bladeGrad = c.createLinearGradient(0, -27, 13, -7);
          bladeGrad.addColorStop(0, '#fef9c3');
          bladeGrad.addColorStop(0.5, '#facc15');
          bladeGrad.addColorStop(1, '#b45309');
          c.fillStyle = bladeGrad;
          c.fill();
          setInkStyle(c, 1.9);
          c.stroke();
          // Blade inner fuller gleam
          c.strokeStyle = '#ffffff';
          c.lineWidth = 1.45;
          c.beginPath();
          c.moveTo(4.5, -10.5);
          c.quadraticCurveTo(9.8, -16.5, 10.8, -23);
          c.stroke();
          c.restore();
        },
      });
      return true;
    }

    case 'sun_priest': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.06,
        skin: '#d99666',
        torsoFill: '#f8fafc',
        torsoHighlight: '#ffffff',
        torsoShadow: '#cbd5e1',
        pantsColor: '#e2e8f0',
        bootColor: '#d97706',
        bootCuffColor: '#fef08a',
        beltColor: '#f59e0b',
        sleeveCuffColor: '#facc15',
        skirtColor: '#f8fafc',
        skirtTrim: '#f59e0b',
        skirtStyle: 'tunic',
        capeColor: pal.main,
        capeDark: pal.dark,
        swingStyle: 'staff',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Royal turquoise/crimson ceremonial stole + gleaming sun collar
          drawCelRoundRect(c, tx + tw * 0.34, ty + 1, tw * 0.32, th - 2, 1.5, pal.main, {
            highlight: pal.light,
            lineWidth: 1.35,
          });
          drawCelEllipse(c, tx + tw / 2, ty + 3.6, tw * 0.56, 4.4, '#facc15', {
            highlight: '#fef9c3',
            lineWidth: 1.45,
          });
          drawCelEllipse(c, tx + tw / 2, ty + 10.5, 2.2, 2.2, '#facc15', { lineWidth: 1.1 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Subtle radiating solar crown rays behind golden sun disc!
          c.save();
          c.strokeStyle = 'rgba(250, 204, 21, 0.85)';
          c.lineWidth = 1.6;
          for (let i = 0; i < 7; i++) {
            const a = -Math.PI + (i / 6) * Math.PI;
            c.beginPath();
            c.moveTo(hx + 1 + Math.cos(a) * 6.5, hy - hr - 5.5 + Math.sin(a) * 6.5);
            c.lineTo(hx + 1 + Math.cos(a) * 10.5, hy - hr - 5.5 + Math.sin(a) * 10.5);
            c.stroke();
          }
          c.restore();
          drawCelRoundRect(c, hx - hr - 1, hy - 6.2, hr * 2 + 2.2, 4.6, 1.8, '#f59e0b', {
            highlight: '#fef08a',
            lineWidth: 1.55,
          });
          // Crescent Hathor/Ra horns framing glowing sun disc
          setInkStyle(c, 2.3, '#d97706');
          c.beginPath();
          c.arc(hx + 1, hy - hr - 4.8, 7.2, 0.22, Math.PI - 0.22);
          c.stroke();
          drawEnergyOrb(c, hx + 1, hy - hr - 5.8, 5.0, '#f59e0b', '#fef9c3');
        },
        drawWeapon: (c, firing) => {
          // Radiant golden Ankh staff with fluttering gold ribbon!
          drawSculptedLimb(c, 2, 12, 4, -22, 3.6, 2.8, '#d97706', { highlight: '#fef08a', lineWidth: 1.55 });
          drawCelPoly(
            c,
            [
              [3, -15],
              [-4, -10 + Math.sin(p.walkPhase * 2) * 2],
              [-2, -7 + Math.sin(p.walkPhase * 2) * 2],
              [3.5, -13],
            ],
            pal.light,
            { lineWidth: 1.1 },
          );
          drawInkLimb(c, -2.5, -17.5, 10.5, -17.5, 3.1, '#facc15', 2.2);
          c.save();
          c.beginPath();
          c.ellipse(4, -25, 4.5, 5.8, 0, 0, Math.PI * 2);
          setInkStyle(c, 3.6, INK);
          c.stroke();
          c.strokeStyle = '#facc15';
          c.lineWidth = 2.2;
          c.stroke();
          c.restore();
          if (firing) {
            drawEnergyOrb(c, 4, -25, 9.0, '#fbbf24', '#ffffff');
          } else {
            drawEnergyOrb(c, 4, -25, 3.2, '#fde047', '#ffffff');
          }
        },
      });
      return true;
    }

    case 'scorpion_guard': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.08,
        skin: '#c98856',
        torsoFill: '#1e293b',
        torsoHighlight: '#475569',
        torsoShadow: '#0f172a',
        pantsColor: '#1e293b',
        bootColor: '#d97706',
        bootCuffColor: '#10b981',
        beltColor: '#10b981',
        sleeveCuffColor: '#f59e0b',
        skirtColor: '#334155',
        skirtTrim: '#f59e0b',
        skirtStyle: 'tassets',
        trimHighlight: '#facc15',
        pauldronColor: '#f59e0b',
        pauldronTrim: pal.light,
        swingStyle: 'dual',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Segmented gold chitin ribs & glowing emerald chest gem
          setInkStyle(c, 1.4, '#f59e0b');
          c.beginPath();
          c.moveTo(tx + 3, ty + 6);
          c.lineTo(tx + tw - 3, ty + 6);
          c.moveTo(tx + 4, ty + 11);
          c.lineTo(tx + tw - 4, ty + 11);
          c.stroke();
          drawEnergyOrb(c, tx + tw * 0.52, ty + 8.5, 2.4, '#10b981', '#d1fae5');
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Articulated 4-segment golden scorpion tail arching over helmet with glowing emerald venom stinger!
          const bobTail = Math.sin(p.walkPhase * 1.8) * 1.6;
          drawSculptedLimb(c, hx - 4, hy - hr + 1, hx - 11.5, hy - hr - 6.5, 5.2, 4.2, '#d97706', {
            highlight: '#fef08a',
            lineWidth: 1.55,
          });
          drawSculptedLimb(c, hx - 11.5, hy - hr - 6.5, hx - 8.5, hy - hr - 13.5 + bobTail, 4.4, 3.6, '#f59e0b', {
            highlight: '#fef08a',
            lineWidth: 1.5,
          });
          drawSculptedLimb(c, hx - 8.5, hy - hr - 13.5 + bobTail, hx - 0.5, hy - hr - 14.2 + bobTail, 3.6, 2.8, '#d97706', {
            highlight: '#fef08a',
            lineWidth: 1.45,
          });
          drawCelPoly(
            c,
            [
              [hx - 1, hy - hr - 16.5 + bobTail],
              [hx + 9.2, hy - hr - 11.8 + bobTail],
              [hx - 0.5, hy - hr - 11 + bobTail],
            ],
            '#10b981',
            { highlight: '#a7f3d0', shadow: '#047857', lineWidth: 1.45 },
          );
          // Armored golden scorpion helm + team desert brow band
          drawCelRoundRect(c, hx - hr - 0.6, hy - hr - 0.8, hr * 2 + 2.2, hr * 1.15, 4, '#d97706', {
            highlight: '#fef08a',
            shadow: '#92400e',
            lineWidth: 1.75,
          });
          drawCelRoundRect(c, hx - hr, hy - 4.6, hr * 1.7, 2.8, 1, pal.main, { lineWidth: 1.2 });
        },
        drawOffhand: (c, sx, sy) => {
          // Second curved glowing emerald-venom assassin dagger
          drawCelPoly(
            c,
            [
              [sx - 2, sy],
              [sx + 13.5, sy - 7],
              [sx + 8, sy + 2.5],
            ],
            '#10b981',
            { highlight: '#d1fae5', shadow: '#047857', lineWidth: 1.55 },
          );
        },
        drawWeapon: (c) => {
          // Main glowing emerald-venom curved scorpion scimitar + venom drop!
          drawCelPoly(
            c,
            [
              [0, 2],
              [16.5, -14.5],
              [19.5, -5.5],
              [4.5, 4],
            ],
            '#10b981',
            { highlight: '#d1fae5', shadow: '#047857', lineWidth: 1.85 },
          );
          drawCelEllipse(c, 16, -2.5, 1.5, 2.2, '#6ee7b7', { lineWidth: 1.0 });
          drawCelRoundRect(c, -2.4, -1.2, 5.4, 5.2, 1.5, '#facc15', { highlight: '#fef08a', lineWidth: 1.35 });
        },
      });
      return true;
    }

    case 'sphinx_chariot': {
      drawSphinxChariot(ctx, p, pal);
      return true;
    }

    // ========================================================================
    // ERA 3: 고대 문명 (CLASSICAL / GREEK & ROMAN)
    // ========================================================================
    case 'spearman': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.09,
        skin: '#f4c095',
        torsoFill: '#d97706',
        torsoHighlight: '#fef08a',
        torsoShadow: '#92400e',
        pantsColor: pal.main,
        bootColor: '#b45309',
        bootCuffColor: '#facc15',
        beltColor: '#78350f',
        sleeveCuffColor: '#d97706',
        skirtColor: '#92400e',
        skirtTrim: '#facc15',
        skirtStyle: 'kilt',
        capeColor: pal.cape,
        capeDark: pal.capeDark,
        pauldronColor: '#d97706',
        pauldronTrim: '#fef08a',
        swingStyle: 'thrust',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Sculpted bronze Spartan muscle cuirass pectoral & ab lines!
          setInkStyle(c, 1.25, '#78350f');
          c.beginPath();
          c.arc(tx + tw * 0.35, ty + 6, 3.2, 0.2, Math.PI - 0.2);
          c.stroke();
          c.beginPath();
          c.arc(tx + tw * 0.72, ty + 6, 3.0, 0.2, Math.PI - 0.2);
          c.stroke();
          c.beginPath();
          c.moveTo(tx + tw * 0.52, ty + 8.5);
          c.lineTo(tx + tw * 0.52, ty + 14.5);
          c.stroke();
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Tall sweeping Corinthian horsehair crest with painted hair streaks!
          drawCelPoly(
            c,
            [
              [hx - 2, hy - hr - 1],
              [hx - 15.5, hy - hr - 6.5],
              [hx - 12.5, hy - 0.5],
              [hx - 2.5, hy - hr - 9],
              [hx + 8.5, hy - hr - 6.5],
              [hx + 5.5, hy - hr],
            ],
            pal.main,
            { highlight: pal.light, shadow: pal.dark, lineWidth: 1.75 },
          );
          setInkStyle(c, 1.1, '#fef08a');
          c.beginPath();
          c.moveTo(hx - 12, hy - hr - 4.5);
          c.quadraticCurveTo(hx - 2, hy - hr - 7, hx + 6, hy - hr - 4.5);
          c.stroke();
          // Bronze Corinthian helmet + cheek guard & nose-guard bar
          drawCelEllipse(c, hx + 0.5, hy - 2.6, hr + 1.3, hr * 0.92, '#d97706', {
            highlight: '#fef9c3',
            shadow: '#92400e',
            lineWidth: 1.9,
          });
          drawCelRoundRect(c, hx - 2.2, hy - 1, 7.2, 6.8, 2, '#b45309', { highlight: '#f59e0b', lineWidth: 1.4 });
        },
        drawOffhand: (c, sx, sy) => {
          // Big round bronze Greek Hoplon shield with riveted rim & golden lambda!
          drawCelEllipse(c, sx + 2, sy, 8.8, 12.0, '#f59e0b', {
            highlight: '#fef9c3',
            shadow: '#92400e',
            lineWidth: 2.0,
          });
          drawCelEllipse(c, sx + 2.5, sy, 6.0, 8.8, pal.main, {
            highlight: pal.light,
            shadow: pal.dark,
            lineWidth: 1.45,
          });
          setInkStyle(c, 2.1, '#fef08a');
          c.beginPath();
          c.moveTo(sx - 0.2, sy + 4.4);
          c.lineTo(sx + 2.8, sy - 4.2);
          c.lineTo(sx + 5.8, sy + 4.4);
          c.stroke();
        },
        drawWeapon: (c) => {
          // Long Spartan Dory spear with bronze butt-spike & leaf steel spearhead
          drawSculptedLimb(c, -13, 2, 26, -2, 3.4, 2.8, '#78350f', { highlight: '#b45309', lineWidth: 1.5 });
          // Rear bronze sauroter spike
          drawCelPoly(
            c,
            [
              [-13, 0.5],
              [-19, 2.5],
              [-13, 3.8],
            ],
            '#d97706',
            { lineWidth: 1.2 },
          );
          // Bronze collar & gleaming leaf blade
          drawCelRoundRect(c, 22, -4.2, 4, 4.4, 1, '#facc15', { lineWidth: 1.2 });
          drawCelPoly(
            c,
            [
              [24.5, -6.2],
              [38.5, -2.4],
              [24.5, 1.6],
            ],
            '#e2e8f0',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.65 },
          );
        },
      });
      return true;
    }

    case 'archer': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.03,
        torsoW: 15.2,
        skin: '#f4c095',
        torsoFill: '#15803d',
        torsoHighlight: '#4ade80',
        torsoShadow: '#14532d',
        pantsColor: '#5c3412',
        bootColor: '#451a03',
        bootCuffColor: '#92400e',
        beltColor: '#78350f',
        sleeveCuffColor: '#78350f',
        skirtColor: '#166534',
        skirtTrim: '#facc15',
        skirtStyle: 'tunic',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Leather arrow quiver with team-fletched arrows + brass band
          drawCelRoundRect(c, -11.5, topY + 2, 6.2, 14.5, 2, '#78350f', {
            highlight: '#b45309',
            lineWidth: 1.65,
          });
          drawCelRoundRect(c, -11.5, topY + 4.5, 6.2, 2.5, 0.8, '#facc15', { lineWidth: 1.1 });
          for (let i = 0; i < 3; i++) {
            drawCelPoly(
              c,
              [
                [-10.2 + i * 2.1, topY + 2],
                [-12.2 + i * 2.1, topY - 4.5],
                [-8 + i * 2.1, topY - 3.2],
              ],
              pal.light,
              { lineWidth: 1.15 },
            );
          }
        },
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Quiver leather chest strap + brass clasp
          setInkStyle(c, 2.4, '#451a03');
          c.beginPath();
          c.moveTo(tx + 2, ty + 1);
          c.lineTo(tx + tw - 2, ty + th - 3);
          c.stroke();
          drawCelEllipse(c, tx + tw * 0.52, ty + th * 0.45, 2.2, 2.2, '#facc15', { lineWidth: 1.1 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Feathered Ranger hood with team trim
          drawCelEllipse(c, hx - 6.5, hy - hr - 2.5, 2.2, 5.8, '#fef08a', { rotation: -0.55, lineWidth: 1.25 });
          drawCelPoly(
            c,
            [
              [hx - hr - 4.5, hy + 2.2],
              [hx - hr - 3.2, hy - hr - 2.5],
              [hx + 2.2, hy - hr - 4.2],
              [hx + hr + 2.5, hy - 3],
              [hx - 1, hy - 4],
            ],
            pal.main,
            { highlight: pal.light, shadow: pal.dark, lineWidth: 1.8 },
          );
        },
        drawWeapon: (c, firing) => {
          // Sculpted horn-tipped recurve bow with animated string draw & fletched arrow!
          const pull = p.attackAnim > 0.35 ? 6.5 : 1.2;
          c.save();
          setInkStyle(c, 4.8, INK);
          c.beginPath();
          c.arc(4, -2, 13.5, -1.2, 1.2);
          c.stroke();
          c.strokeStyle = '#b45309';
          c.lineWidth = 2.6;
          c.stroke();

          // Gold horn bow tips
          const topX = 4 + Math.cos(-1.2) * 13.5;
          const topY = -2 + Math.sin(-1.2) * 13.5;
          const botX = 4 + Math.cos(1.2) * 13.5;
          const botY = -2 + Math.sin(1.2) * 13.5;
          drawCelEllipse(c, topX, topY, 2.0, 2.0, '#facc15', { lineWidth: 1.1 });
          drawCelEllipse(c, botX, botY, 2.0, 2.0, '#facc15', { lineWidth: 1.1 });

          // Bowstring
          setInkStyle(c, 1.35, '#e2e8f0');
          c.beginPath();
          c.moveTo(topX, topY);
          c.lineTo(topX - pull, -2);
          c.lineTo(botX, botY);
          c.stroke();

          if (!firing) {
            // Arrow shaft + team fletching + steel broadhead
            drawInkLimb(c, topX - pull, -2, 20, -2, 1.9, '#d97706', 1.6);
            drawCelPoly(
              c,
              [
                [topX - pull, -2],
                [topX - pull - 4.2, -5.2],
                [topX - pull + 2.2, -2],
                [topX - pull - 4.2, 1.2],
              ],
              pal.light,
              { lineWidth: 1.0 },
            );
            drawCelPoly(
              c,
              [
                [18.5, -5.2],
                [25, -2],
                [18.5, 1.2],
              ],
              '#e2e8f0',
              { highlight: '#ffffff', lineWidth: 1.35 },
            );
          }
          c.restore();
        },
      });
      return true;
    }

    case 'centurion': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.15,
        torsoW: 18.2,
        torsoH: 20,
        skin: '#f4c095',
        torsoFill: '#94a3b8',
        torsoHighlight: '#f8fafc',
        torsoShadow: '#475569',
        pantsColor: pal.main,
        bootColor: '#7c2d12',
        bootCuffColor: '#d97706',
        beltColor: '#d97706',
        sleeveCuffColor: '#cbd5e1',
        skirtColor: pal.main,
        skirtTrim: '#facc15',
        skirtStyle: 'kilt',
        capeColor: pal.main,
        capeDark: pal.dark,
        pauldronColor: '#cbd5e1',
        pauldronTrim: '#facc15',
        swingStyle: 'overhead',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Segmented Roman Lorica Segmentata armor ribs + golden Phalerae officer medals!
          setInkStyle(c, 1.45, '#475569');
          for (let i = 1; i <= 3; i++) {
            c.beginPath();
            c.moveTo(tx + 2, ty + i * 4.5);
            c.lineTo(tx + tw - 2, ty + i * 4.5);
            c.stroke();
          }
          drawCelEllipse(c, tx + tw * 0.34, ty + 6.5, 2.2, 2.2, '#facc15', { highlight: '#fef9c3', lineWidth: 1.05 });
          drawCelEllipse(c, tx + tw * 0.7, ty + 6.5, 2.2, 2.2, '#facc15', { highlight: '#fef9c3', lineWidth: 1.05 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Wide Roman Centurion transverse plumed crest with gold crest-holder!
          drawCelEllipse(c, hx, hy - hr - 5.8, 12.2, 5.4, pal.main, {
            highlight: pal.light,
            shadow: pal.dark,
            lineWidth: 1.85,
          });
          setInkStyle(c, 1.1, '#fef08a');
          c.beginPath();
          c.moveTo(hx - 9, hy - hr - 6.5);
          c.quadraticCurveTo(hx, hy - hr - 9.5, hx + 9, hy - hr - 6.5);
          c.stroke();
          drawCelRoundRect(c, hx - 2.6, hy - hr - 2.8, 5.2, 4.2, 1, '#facc15', {
            highlight: '#fef9c3',
            lineWidth: 1.25,
          });
          drawCelEllipse(c, hx + 0.5, hy - 2.6, hr + 1.5, hr * 0.86, '#cbd5e1', {
            highlight: '#ffffff',
            shadow: '#64748b',
            lineWidth: 1.9,
          });
          drawCelRoundRect(c, hx - hr, hy - 4.2, hr * 2 + 2.6, 2.8, 1, '#f59e0b', {
            highlight: '#fef08a',
            lineWidth: 1.35,
          });
        },
        drawOffhand: (c, sx, sy) => {
          // Massive curved Roman Scutum tower shield with golden eagle wings & thunderbolt boss!
          drawCelRoundRect(c, sx - 2.2, sy - 14.5, 13.0, 26, 3.2, pal.main, {
            highlight: pal.light,
            shadow: pal.dark,
            lineWidth: 2.1,
          });
          c.strokeStyle = '#facc15';
          c.lineWidth = 1.9;
          c.strokeRect(sx - 0.2, sy - 12.5, 9.0, 22);
          // Golden eagle lightning bolts radiating from boss
          setInkStyle(c, 1.4, '#fef08a');
          c.beginPath();
          c.moveTo(sx + 1, sy - 9);
          c.lineTo(sx + 7.5, sy + 6);
          c.moveTo(sx + 7.5, sy - 9);
          c.lineTo(sx + 1, sy + 6);
          c.stroke();
          drawCelEllipse(c, sx + 4.3, sy - 1.5, 3.3, 4.4, '#facc15', { highlight: '#fef9c3', lineWidth: 1.4 });
        },
        drawWeapon: (c) => {
          // Gleaming Roman Gladius short sword with fuller ridge & ivory pommel
          drawCelEllipse(c, 1, 5, 2.2, 2.2, '#facc15', { lineWidth: 1.15 });
          drawCelRoundRect(c, -2.5, -2.2, 7.2, 3.6, 1, '#facc15', { highlight: '#fef08a', lineWidth: 1.35 });
          drawCelPoly(
            c,
            [
              [-0.8, -2.2],
              [3.8, -2.2],
              [4.2, -18.5],
              [1.5, -24.5],
              [-1.2, -18.5],
            ],
            '#e2e8f0',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.75 },
          );
          c.strokeStyle = '#94a3b8';
          c.lineWidth = 1.1;
          c.beginPath();
          c.moveTo(1.5, -4);
          c.lineTo(1.5, -19);
          c.stroke();
        },
      });
      return true;
    }

    case 'chariot': {
      drawWarChariot(ctx, p, pal);
      return true;
    }

    // ========================================================================
    // ERA 4: 중세 시대 (MEDIEVAL AGE)
    // ========================================================================
    case 'knight': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.13,
        torsoW: 18,
        torsoH: 19.5,
        skin: '#cbd5e1',
        torsoFill: '#cbd5e1',
        torsoHighlight: '#ffffff',
        torsoShadow: '#64748b',
        pantsColor: '#475569',
        bootColor: '#94a3b8',
        bootCuffColor: '#facc15',
        beltColor: '#78350f',
        armColor: '#94a3b8',
        sleeveCuffColor: '#facc15',
        gloveColor: '#cbd5e1',
        skirtColor: pal.main,
        skirtTrim: '#facc15',
        skirtStyle: 'tunic',
        capeColor: pal.cape,
        capeDark: pal.capeDark,
        pauldronColor: '#e2e8f0',
        pauldronTrim: '#facc15',
        mask: 'none',
        swingStyle: 'overhead',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Gorget collar + gleaming heraldic surcoat cross with gold trim
          drawCelRoundRect(c, tx + 1, ty - 1, tw - 2, 4.2, 1.8, '#94a3b8', {
            highlight: '#ffffff',
            lineWidth: 1.35,
          });
          drawCelRoundRect(c, tx + tw * 0.34, ty + 3, tw * 0.32, th - 4, 1, pal.main, {
            highlight: pal.light,
            lineWidth: 1.25,
          });
          drawCelRoundRect(c, tx + 2.2, ty + 7, tw - 4.4, 3.8, 1, pal.main, {
            highlight: pal.light,
            lineWidth: 1.25,
          });
          c.fillStyle = '#facc15';
          c.fillRect(tx + tw * 0.45, ty + 4, 2.2, th - 6);
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Fluttering layered silk knight plume!
          const sway = Math.sin(p.walkPhase * 1.8) * 2.2;
          drawCelPoly(
            c,
            [
              [hx - 2, hy - hr - 1],
              [hx - 14.5, hy - hr - 8.5 + sway],
              [hx - 16.5, hy - 1.5 + sway],
              [hx - 11.5, hy - 4 + sway],
              [hx - 4.5, hy - hr],
            ],
            pal.main,
            { highlight: pal.light, shadow: pal.dark, lineWidth: 1.65 },
          );
          // Chamfered steel Great Helm with gold crown rim, cross-slit visor & breather pinholes!
          drawCelPoly(
            c,
            [
              [hx - hr - 0.8, hy + hr - 1.5],
              [hx - hr - 1.0, hy - hr + 2.5],
              [hx - hr + 2.8, hy - hr - 1.8],
              [hx + hr - 1.5, hy - hr - 1.8],
              [hx + hr + 2.2, hy - hr + 2.8],
              [hx + hr + 2.4, hy + hr - 1.8],
              [hx + 2, hy + hr + 0.6],
            ],
            '#cbd5e1',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.95 },
          );
          // Gold crown brow fillet
          drawCelRoundRect(c, hx - hr - 0.2, hy - 5.6, hr * 2 + 1.8, 2.4, 0.8, '#facc15', {
            highlight: '#fef9c3',
            lineWidth: 1.15,
          });
          // Dark visor T-slit + medieval breather pinholes
          c.fillStyle = '#0f172a';
          c.fillRect(hx - 0.5, hy - 2.6, 9.8, 2.4);
          c.fillRect(hx + 3.4, hy - 2.6, 2.2, 7.6);
          for (let b = 0; b < 3; b++) {
            c.beginPath();
            c.arc(hx + 0.5, hy + 1.4 + b * 2.1, 0.75, 0, Math.PI * 2);
            c.arc(hx + 7.4, hy + 1.4 + b * 2.1, 0.75, 0, Math.PI * 2);
            c.fill();
          }
        },
        drawOffhand: (c, sx, sy) => {
          // Gold-rimmed Heraldic Kite Shield with rivets
          drawCelPoly(
            c,
            [
              [sx - 3.2, sy - 11.5],
              [sx + 9.4, sy - 11.5],
              [sx + 9.4, sy + 1.2],
              [sx + 3.1, sy + 13],
              [sx - 3.2, sy + 1.2],
            ],
            '#facc15',
            { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 2.0 },
          );
          drawCelPoly(
            c,
            [
              [sx - 1.6, sy - 9.8],
              [sx + 7.8, sy - 9.8],
              [sx + 7.8, sy + 0.6],
              [sx + 3.1, sy + 10.6],
              [sx - 1.6, sy + 0.6],
            ],
            pal.main,
            { highlight: pal.light, shadow: pal.dark, lineWidth: 1.35 },
          );
          c.fillStyle = '#fef08a';
          c.fillRect(sx + 1.9, sy - 8.8, 2.4, 16.5);
          c.fillRect(sx - 0.8, sy - 4.2, 7.8, 2.4);
        },
        drawWeapon: (c) => {
          // Broad medieval knight longsword with ruby/sapphire pommel & fuller groove!
          drawCelEllipse(c, 1, 5.8, 2.6, 2.6, '#facc15', { highlight: '#fef9c3', lineWidth: 1.3 });
          drawCelEllipse(c, 1, 5.8, 1.3, 1.3, pal.light, { lineWidth: 0.8 });
          drawCelRoundRect(c, -5.2, -3.8, 12.4, 3.8, 1.2, '#facc15', { highlight: '#fef9c3', lineWidth: 1.45 });
          drawCelPoly(
            c,
            [
              [-1.8, -3.8],
              [3.8, -3.8],
              [4.4, -25],
              [1, -31],
              [-2.4, -25],
            ],
            '#e2e8f0',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.85 },
          );
          // Crisp gleaming sword fuller groove
          c.strokeStyle = '#94a3b8';
          c.lineWidth = 1.35;
          c.beginPath();
          c.moveTo(1, -5);
          c.lineTo(1, -25);
          c.stroke();
        },
      });
      return true;
    }

    case 'crossbowman': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.06,
        skin: '#f4c095',
        torsoFill: pal.main,
        torsoHighlight: pal.light,
        torsoShadow: pal.dark,
        pantsColor: '#475569',
        bootColor: '#451a03',
        bootCuffColor: '#92400e',
        beltColor: '#78350f',
        armColor: '#64748b',
        sleeveCuffColor: '#cbd5e1',
        skirtColor: pal.dark,
        skirtTrim: '#cbd5e1',
        skirtStyle: 'tunic',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Hip/back steel bolt quiver
          drawCelRoundRect(c, -11.5, topY + 6, 6.2, 12, 2, '#5c3412', { highlight: '#92400e', lineWidth: 1.6 });
          for (let i = 0; i < 3; i++) {
            c.fillStyle = '#e2e8f0';
            c.fillRect(-10.5 + i * 2, topY + 2, 1.4, 4.5);
          }
        },
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Quilted padded gambeson diamond stitching + leather cross-strap
          setInkStyle(c, 1.0, 'rgba(15, 23, 42, 0.35)');
          c.beginPath();
          c.moveTo(tx + 3, ty + 4);
          c.lineTo(tx + tw - 3, ty + th - 4);
          c.moveTo(tx + tw - 3, ty + 4);
          c.lineTo(tx + 3, ty + th - 4);
          c.stroke();
          drawCelRoundRect(c, tx + 2, ty + 2, tw - 4, 3.2, 1, '#94a3b8', { highlight: '#f1f5f9', lineWidth: 1.15 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Riveted steel medieval Kettle Hat with gleaming dome ridge & chinstrap!
          drawCelEllipse(c, hx, hy - 4.6, hr + 1.4, hr * 0.74, '#94a3b8', {
            highlight: '#f8fafc',
            shadow: '#475569',
            lineWidth: 1.9,
          });
          drawCelEllipse(c, hx + 0.5, hy - 3.2, hr + 5.8, 2.7, '#cbd5e1', {
            highlight: '#ffffff',
            shadow: '#475569',
            lineWidth: 1.8,
          });
          drawRivetStrip(c, hx - hr + 1, hy - 4.2, hx + hr, hy - 4.2, 4, 0.9);
        },
        drawWeapon: (c, firing) => {
          // Heavy timber & steel windlass crossbow with stirrup ring & taut bowstring!
          drawCelRoundRect(c, -5, -3.2, 22, 5.4, 1.8, '#854d0e', {
            highlight: '#ca8a04',
            shadow: '#451a03',
            lineWidth: 1.75,
          });
          // Steel foot stirrup ring at front
          setInkStyle(c, 1.6, '#94a3b8');
          c.beginPath();
          c.arc(20, -0.8, 3.4, -1.2, 1.2);
          c.stroke();
          // Steel prod bow limbs + taut cord
          setInkStyle(c, 3.8, INK);
          c.beginPath();
          c.moveTo(15.5, -10.5);
          c.quadraticCurveTo(21.5, -0.8, 15.5, 8.8);
          c.stroke();
          setInkStyle(c, 2.2, '#cbd5e1');
          c.stroke();
          setInkStyle(c, 1.2, '#e2e8f0');
          c.beginPath();
          c.moveTo(15.5, -10.5);
          c.lineTo(firing ? 15.5 : 5, -0.8);
          c.lineTo(15.5, 8.8);
          c.stroke();
          // Steel quarrel bolt
          if (!firing) {
            drawInkLimb(c, 4.5, -1.2, 23, -1.2, 2.1, '#e2e8f0', 1.6);
            drawCelPoly(
              c,
              [
                [21.5, -3.6],
                [26.5, -1.2],
                [21.5, 1.2],
              ],
              '#ffffff',
              { lineWidth: 1.15 },
            );
          } else {
            drawCartoonMuzzleFlash(c, 23, -1.2, 7.0, '#fde047', '#ffffff');
          }
        },
      });
      return true;
    }

    case 'heavy_cavalry': {
      drawHeavyCavalry(ctx, p, pal);
      return true;
    }

    case 'catapult': {
      drawCatapult(ctx, p, pal);
      return true;
    }

    // ========================================================================
    // ERA 5: 화약·근세 (GUNPOWDER / RENAISSANCE)
    // ========================================================================
    case 'pikeman': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.1,
        skin: '#f4c095',
        torsoFill: '#cbd5e1',
        torsoHighlight: '#ffffff',
        torsoShadow: '#64748b',
        pantsColor: pal.main,
        bootColor: '#451a03',
        bootCuffColor: '#92400e',
        beltColor: '#78350f',
        armColor: pal.main,
        sleeveCuffColor: '#f8fafc',
        skirtColor: '#cbd5e1',
        skirtTrim: '#facc15',
        skirtStyle: 'tassets',
        pauldronColor: '#e2e8f0',
        pauldronTrim: pal.main,
        swingStyle: 'thrust',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Engraved Renaissance steel breastplate ridge + gold rivets
          setInkStyle(c, 1.35, '#64748b');
          c.beginPath();
          c.moveTo(tx + tw * 0.54, ty + 2);
          c.lineTo(tx + tw * 0.54, ty + th - 3);
          c.stroke();
          drawCelRoundRect(c, tx + 2, ty + 1, tw - 4, 3.2, 1, pal.main, { highlight: pal.light, lineWidth: 1.15 });
          drawRivetStrip(c, tx + 3, ty + th - 5, tx + tw - 3, ty + th - 5, 4, 0.9);
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Tall curved-comb Spanish Morion steel helmet + sweeping plume!
          drawCelEllipse(c, hx - 6.2, hy - hr - 3.5, 2.5, 6.4, pal.light, { rotation: -0.52, lineWidth: 1.35 });
          drawCelPoly(
            c,
            [
              [hx - hr - 3.5, hy - 3],
              [hx - hr, hy - hr - 2.5],
              [hx + 0.5, hy - hr - 9.2],
              [hx + hr, hy - hr - 2.5],
              [hx + hr + 5.5, hy - 4.2],
              [hx + hr + 2.2, hy - 1],
              [hx - hr - 4.5, hy - 1],
            ],
            '#cbd5e1',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.9 },
          );
          // Gold embossed comb ridge & brim band
          setInkStyle(c, 1.4, '#facc15');
          c.beginPath();
          c.moveTo(hx - hr + 2, hy - hr - 1.5);
          c.quadraticCurveTo(hx + 0.5, hy - hr - 7.5, hx + hr - 1, hy - hr - 1.5);
          c.stroke();
          drawRivetStrip(c, hx - hr, hy - 2.6, hx + hr, hy - 2.6, 4, 0.85);
        },
        drawWeapon: (c) => {
          // Extra-long Renaissance steel pike with gold crossbar & fluttering silk tassel!
          drawSculptedLimb(c, -14, 2, 34, -3, 3.4, 2.8, '#78350f', { highlight: '#b45309', lineWidth: 1.5 });
          const flutter = Math.sin(p.walkPhase * 2) * 1.8;
          drawCelPoly(
            c,
            [
              [29, -2.5],
              [25, 4 + flutter],
              [31, 4.5 + flutter],
              [31.5, -2.5],
            ],
            pal.main,
            { highlight: pal.light, lineWidth: 1.3 },
          );
          drawCelRoundRect(c, 29, -5.8, 3.2, 6.8, 1, '#facc15', { lineWidth: 1.2 });
          drawCelPoly(
            c,
            [
              [31.5, -6.8],
              [46.5, -3.5],
              [31.5, 0.2],
            ],
            '#f1f5f9',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.65 },
          );
        },
      });
      return true;
    }

    case 'musketeer': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.08,
        skin: '#f4c095',
        torsoFill: pal.main,
        torsoHighlight: pal.light,
        torsoShadow: pal.dark,
        pantsColor: '#e2e8f0',
        bootColor: '#1e293b',
        bootCuffColor: '#78350f',
        beltColor: '#f8fafc',
        armColor: pal.main,
        sleeveCuffColor: '#f8fafc',
        skirtColor: pal.main,
        skirtTrim: '#facc15',
        skirtStyle: 'coat',
        swingStyle: 'aim',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Crossed white military bandolier + brass buttons & powder charge tubes!
          setInkStyle(c, 3.0, '#f8fafc');
          c.beginPath();
          c.moveTo(tx + 2, ty + 2);
          c.lineTo(tx + tw - 2, ty + th - 3);
          c.moveTo(tx + tw - 2, ty + 2);
          c.lineTo(tx + 2, ty + th - 3);
          c.stroke();
          // Gold buttons & white lace cravat collar
          drawCelPoly(
            c,
            [
              [tx + tw * 0.32, ty],
              [tx + tw * 0.72, ty],
              [tx + tw * 0.52, ty + 5.5],
            ],
            '#ffffff',
            { lineWidth: 1.1 },
          );
          c.fillStyle = '#facc15';
          c.beginPath();
          c.arc(tx + tw / 2, ty + th * 0.48, 2.2, 0, Math.PI * 2);
          c.arc(tx + tw * 0.32, ty + th * 0.72, 1.3, 0, Math.PI * 2);
          c.arc(tx + tw * 0.7, ty + th * 0.72, 1.3, 0, Math.PI * 2);
          c.fill();
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Jaunty wide-brim Cavalier / Tricorn hat with huge flamboyant ostrich plume!
          const plumeSway = Math.sin(p.walkPhase * 1.8) * 1.6;
          drawCelEllipse(c, hx - 6.5, hy - hr - 5.5 + plumeSway, 9.5, 3.6, '#f8fafc', {
            highlight: '#ffffff',
            shadow: '#cbd5e1',
            rotation: -0.34,
            lineWidth: 1.5,
          });
          drawCelPoly(
            c,
            [
              [hx - hr - 5.8, hy - 3],
              [hx - hr + 1, hy - hr - 4.5],
              [hx + hr, hy - hr - 3.5],
              [hx + hr + 6.8, hy - 3],
            ],
            '#1e293b',
            { highlight: '#475569', shadow: '#090d16', lineWidth: 1.9 },
          );
          drawCelRoundRect(c, hx - hr + 1, hy - 6.2, hr * 2 - 1, 2.6, 1, '#facc15', {
            highlight: '#fef9c3',
            lineWidth: 1.1,
          });
        },
        drawWeapon: (c, firing) => {
          // Long brass-banded flintlock musket with cocked flintlock hammer + socket bayonet!
          drawCelRoundRect(c, -6.5, -2.6, 23, 4.8, 1.5, '#854d0e', {
            highlight: '#ca8a04',
            shadow: '#451a03',
            lineWidth: 1.75,
          });
          drawCelRoundRect(c, 2, -4.6, 25, 3.0, 1, '#94a3b8', { highlight: '#f8fafc', lineWidth: 1.55 });
          // Brass barrel bands & flintlock cock mechanism
          c.fillStyle = '#facc15';
          c.fillRect(9, -4.6, 2.4, 6.2);
          c.fillRect(19, -4.6, 2.4, 5.2);
          drawCelRoundRect(c, 2.5, -6.8, 3.2, 3.2, 1, '#facc15', { lineWidth: 1.1 });
          // Socket bayonet blade
          drawCelPoly(
            c,
            [
              [23, -1.6],
              [31.5, -3.0],
              [23, -4.0],
            ],
            '#f1f5f9',
            { lineWidth: 1.15 },
          );
          if (firing) {
            drawCartoonMuzzleFlash(c, 29, -3, 11.5, '#f97316', '#fef08a');
          }
        },
      });
      return true;
    }

    case 'grenadier': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.11,
        torsoW: 17.5,
        skin: '#f4c095',
        torsoFill: pal.main,
        torsoHighlight: pal.light,
        torsoShadow: pal.dark,
        pantsColor: '#f1f5f9',
        bootColor: '#1e293b',
        bootCuffColor: '#facc15',
        beltColor: '#1e293b',
        armColor: pal.main,
        sleeveCuffColor: '#facc15',
        skirtColor: pal.main,
        skirtTrim: '#facc15',
        skirtStyle: 'coat',
        pauldronColor: '#facc15',
        pauldronTrim: '#fef9c3',
        swingStyle: 'throw',
        drawBackAccessory: (c, topY) => {
          // Grenade ammo satchel packed with black iron bombs
          drawCelRoundRect(c, -12.5, topY + 7, 8.5, 11.5, 2.5, '#78350f', { highlight: '#b45309', lineWidth: 1.65 });
          drawCelEllipse(c, -8.2, topY + 5.8, 3.8, 3.8, '#1e293b', { highlight: '#64748b', lineWidth: 1.35 });
        },
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Diagonal leather bomb-satchel strap + gleaming brass slow-match case!
          setInkStyle(c, 2.8, '#f8fafc');
          c.beginPath();
          c.moveTo(tx + 2, ty + 2);
          c.lineTo(tx + tw - 2, ty + th - 2);
          c.stroke();
          drawCelRoundRect(c, tx + tw * 0.42, ty + 4, 4.2, 8.2, 1.5, '#facc15', {
            highlight: '#fef9c3',
            lineWidth: 1.25,
          });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Iconic tall brass-plated 18th-century Grenadier Mitre Cap with pom-pom & royal emblem!
          drawCelPoly(
            c,
            [
              [hx - hr, hy - 3],
              [hx - hr + 2, hy - hr - 11.5],
              [hx + 2, hy - hr - 15],
              [hx + hr, hy - hr - 9.5],
              [hx + hr + 1.2, hy - 3],
            ],
            pal.dark,
            { highlight: pal.main, lineWidth: 1.9 },
          );
          drawCelEllipse(c, hx + 2, hy - hr - 15.5, 2.6, 2.6, '#fef08a', { lineWidth: 1.2 });
          drawCelPoly(
            c,
            [
              [hx - 2.2, hy - 3.8],
              [hx + 1.2, hy - hr - 12.8],
              [hx + hr + 0.5, hy - 3.8],
            ],
            '#facc15',
            { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.55 },
          );
          // Embossed flaming bomb emblem on brass mitre plate
          drawCelEllipse(c, hx + 2.5, hy - hr - 3.2, 2.2, 2.2, '#b91c1c', { lineWidth: 1.0 });
        },
        drawWeapon: (c, firing) => {
          // Sizzling lit-fuse black iron spherical hand grenade with sparkling sparks!
          if (!firing) {
            drawCelEllipse(c, 4.5, -4.5, 6.5, 6.5, '#1e293b', {
              highlight: '#64748b',
              shadow: '#090d16',
              lineWidth: 1.9,
            });
            drawCelRoundRect(c, 2.5, -12, 4.2, 3, 1, '#94a3b8', { lineWidth: 1.2 });
            setInkStyle(c, 1.8, '#d97706');
            c.beginPath();
            c.moveTo(6, -11);
            c.quadraticCurveTo(10.5, -15, 13, -11.5);
            c.stroke();
            drawEnergyOrb(c, 13.2, -11.5, 3.8, '#f97316', '#fef08a');
          } else {
            drawCartoonMuzzleFlash(c, 8, -4, 8.0, '#f97316', '#fef08a');
          }
        },
      });
      return true;
    }

    case 'field_cannon': {
      drawFieldCannon(ctx, p, pal);
      return true;
    }

    default:
      return false;
  }
}

// ============================================================================
// BESPOKE HEAVY MOUNTS & SIEGE ENGINES (ERAS 1–5)
// ============================================================================

function drawDinoRider(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const stride = p.isWalking ? Math.sin(p.walkPhase) : 0;
  const bob = p.isWalking ? Math.abs(Math.sin(p.walkPhase)) * 3.2 : 0;
  const bite = p.attackAnim > 0.25 ? Math.sin(((p.attackAnim - 0.25) / 0.75) * Math.PI) : 0;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.translate(-f * 10, -f * 4);
    ctx.rotate(-f * 1.35);
  }

  const bodyY = -28 - bob;
  const tailWag = Math.sin(p.walkPhase * 1.3) * 4.2;

  // Sculpted muscular back dino leg + clawed foot
  drawSculptedLimb(ctx, -6, bodyY + 6, -11 - stride * 9, -12, 11.2, 7.2, '#15803d', {
    shadow: '#14532d',
    lineWidth: 1.9,
  });
  drawSculptedLimb(ctx, -11 - stride * 9, -12, -4 - stride * 11, -3, 7.0, 5.2, '#166534', {
    shadow: '#052e16',
    lineWidth: 1.8,
  });
  drawCelEllipse(ctx, -1 - stride * 11, -2.2, 6.2, 3.0, '#166534', { lineWidth: 1.65 });
  // Sharp curved Raptor dewclaw
  drawCelPoly(
    ctx,
    [
      [4 - stride * 11, -3.5],
      [9 - stride * 11, -1.2],
      [4 - stride * 11, -0.4],
    ],
    '#fef3c7',
    { lineWidth: 1.15 },
  );

  // Swishing curved scaly tail with banded underside & full ridge of dorsal spikes!
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-12, bodyY + 1);
  ctx.quadraticCurveTo(-29, bodyY - 2 + tailWag, -41, bodyY - 13 + tailWag);
  ctx.quadraticCurveTo(-25, bodyY + 10 + tailWag * 0.5, -10, bodyY + 10);
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(-40, bodyY - 12, -10, bodyY + 10);
  tailGrad.addColorStop(0, '#4ade80');
  tailGrad.addColorStop(0.5, '#22c55e');
  tailGrad.addColorStop(1, '#15803d');
  ctx.fillStyle = tailGrad;
  ctx.fill();
  setInkStyle(ctx, 2.05);
  ctx.stroke();
  ctx.restore();

  // 5 amber prehistoric dorsal ridge spikes along tail & spine!
  for (let sp = 0; sp < 4; sp++) {
    const sx = -13 - sp * 6.5;
    const sy = bodyY - 3 - sp * 2.1 + tailWag * (0.18 + sp * 0.24);
    const sh = 6.2 - sp * 0.7;
    drawCelPoly(
      ctx,
      [
        [sx - 2.8, sy + 2],
        [sx - 0.8, sy - sh],
        [sx + 2.8, sy + 2],
      ],
      '#f59e0b',
      { highlight: '#fef08a', shadow: '#b45309', lineWidth: 1.3 },
    );
  }

  // Main muscular dino torso + ribbed cream belly scales + darker jungle tiger stripes
  drawCelEllipse(ctx, 0, bodyY + 2, 20.5, 13.0, '#22c55e', {
    highlight: '#86efac',
    shadow: '#15803d',
    lineWidth: 2.2,
    rotation: -0.14,
  });
  ctx.fillStyle = 'rgba(20, 83, 45, 0.52)';
  for (let st = 0; st < 3; st++) {
    ctx.beginPath();
    ctx.ellipse(-9 + st * 7, bodyY - 2.5 - st * 0.4, 3.6, 5.2, -0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  drawCelEllipse(ctx, 2, bodyY + 8.0, 13.5, 5.8, '#fef08a', { shadow: '#ca8a04', lineWidth: 1.5 });
  // Ribbed lizard belly scale lines
  setInkStyle(ctx, 1.0, 'rgba(161, 98, 7, 0.5)');
  for (let b = -6; b <= 8; b += 4.5) {
    ctx.beginPath();
    ctx.moveTo(b, bodyY + 4.5);
    ctx.lineTo(b - 1.5, bodyY + 12.2);
    ctx.stroke();
  }

  // Armored leather war-saddle with team war-paint blanket & hanging trophy skull!
  drawCelRoundRect(ctx, -12, bodyY - 10.5, 19.5, 9.5, 3, pal.main, {
    highlight: pal.light,
    shadow: pal.dark,
    lineWidth: 1.9,
  });
  drawCelRoundRect(ctx, -6, bodyY - 4.2, 6.2, 4.5, 1, '#facc15', { highlight: '#fef08a', lineWidth: 1.2 });
  // Tiny bone skull trophy hanging on saddle flank
  drawCelEllipse(ctx, 4.5, bodyY + 0.2, 3.0, 2.7, '#f8fafc', { shadow: '#cbd5e1', lineWidth: 1.2 });
  ctx.fillStyle = INK;
  ctx.fillRect(3.6, bodyY - 0.5, 1.1, 1.1);
  ctx.fillRect(5.5, bodyY - 0.5, 1.1, 1.1);

  // Tiny tucked raptor forearms + muscular neck + fierce snapping dino head!
  drawSculptedLimb(ctx, 12, bodyY + 4, 21, bodyY + 7, 4.0, 2.6, '#16a34a', { lineWidth: 1.4 });
  ctx.save();
  ctx.translate(15, bodyY - 6);
  ctx.rotate(-0.18 + bite * 0.35);
  drawCelRoundRect(ctx, -4, -14.5, 12.5, 16.5, 5, '#22c55e', { highlight: '#86efac', shadow: '#15803d', lineWidth: 2.0 });
  // Neck dorsal spikes
  drawCelPoly(
    ctx,
    [
      [-5, -10],
      [-10.5, -13],
      [-4, -6],
    ],
    '#f59e0b',
    { highlight: '#fef08a', lineWidth: 1.25 },
  );
  // Upper snout with ridge brow, tribal paint stripe & menacing upper fangs
  drawCelRoundRect(ctx, 2, -22.5, 22.5, 11.8, 5, '#22c55e', {
    highlight: '#86efac',
    shadow: '#15803d',
    lineWidth: 2.1,
  });
  // Team war-paint slash across dino snout
  ctx.fillStyle = pal.main;
  ctx.fillRect(14, -22, 3.4, 5.2);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(9 + i * 4.4, -11);
    ctx.lineTo(11 + i * 4.4, -6.8);
    ctx.lineTo(13 + i * 4.4, -11);
    ctx.fill();
  }
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.arc(20.5, -18.2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Lower jaw snaps open wide on attack!
  ctx.save();
  ctx.translate(6, -11);
  ctx.rotate(0.08 + bite * 0.58);
  drawCelRoundRect(ctx, 0, -2, 17.5, 6.5, 3, '#16a34a', { highlight: '#4ade80', lineWidth: 1.9 });
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(4 + i * 4.2, -2);
    ctx.lineTo(6 + i * 4.2, -6.2);
    ctx.lineTo(8 + i * 4.2, -2);
    ctx.fill();
  }
  ctx.restore();
  // Fierce slit-pupil amber dino eye + sonic roar rings on bite peak!
  drawCelEllipse(ctx, 10, -18.2, 3.4, 3.4, '#fde047', { highlight: '#ffffff', lineWidth: 1.45 });
  ctx.fillStyle = INK;
  ctx.fillRect(10.6, -19.8, 1.6, 3.4);
  if (bite > 0.35) {
    ctx.save();
    ctx.strokeStyle = `rgba(254, 240, 138, ${(bite * 0.78).toFixed(2)})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(26, -12, 6 + bite * 8, -0.75, 0.75);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Sculpted muscular front dino leg + 3-clawed foot!
  drawSculptedLimb(ctx, 4, bodyY + 6.5, 2 + stride * 10, -12, 12.2, 7.6, '#22c55e', {
    highlight: '#86efac',
    shadow: '#15803d',
    lineWidth: 1.95,
  });
  drawSculptedLimb(ctx, 2 + stride * 10, -12, 8 + stride * 12, -3, 7.4, 5.4, '#16a34a', {
    highlight: '#4ade80',
    shadow: '#14532d',
    lineWidth: 1.85,
  });
  drawCelEllipse(ctx, 11 + stride * 12, -2.2, 6.8, 3.3, '#16a34a', { highlight: '#86efac', lineWidth: 1.7 });
  drawCelPoly(
    ctx,
    [
      [16 + stride * 12, -3.8],
      [22 + stride * 12, -1.2],
      [16 + stride * 12, -0.4],
    ],
    '#fef3c7',
    { lineWidth: 1.2 },
  );

  // Feathered tribal caveman rider perched on saddle waving decorated spear!
  ctx.save();
  ctx.translate(-3, bodyY - 7.5);
  // Leather reins connecting rider to dino neck
  setInkStyle(ctx, 1.5, '#78350f');
  ctx.beginPath();
  ctx.moveTo(5, -9);
  ctx.quadraticCurveTo(13, -3, 18, -7);
  ctx.stroke();

  drawCelRoundRect(ctx, -6.5, -15.5, 13, 14.5, 4, '#a16207', {
    highlight: '#ca8a04',
    shadow: '#713f12',
    lineWidth: 1.85,
  });
  drawCelEllipse(ctx, 1, -20.5, 6.6, 6.4, '#f2b88b', { lineWidth: 1.85 });
  drawCartoonFace(ctx, 1, -20, { mood: bite > 0.2 ? 'attack' : 'normal', skin: '#f2b88b' });
  // Wild rider hair + fluttering team bandana + feather
  drawCelPoly(
    ctx,
    [
      [-6, -21],
      [-9, -26],
      [-2, -28],
      [6, -26],
      [8, -22],
    ],
    '#451a03',
    { lineWidth: 1.5 },
  );
  drawCelEllipse(ctx, -5, -28, 2.0, 5.2, '#f97316', { rotation: -0.45, lineWidth: 1.15 });
  drawCelRoundRect(ctx, -6.5, -24.5, 14.5, 3.2, 1.2, pal.main, { highlight: pal.light, lineWidth: 1.4 });
  // Rider bent spear arm + feathered obsidian spear
  ctx.save();
  ctx.translate(2, -11);
  ctx.rotate(-0.35 + bite * 0.78);
  drawSculptedLimb(ctx, 0, 0, 10, 2, 4.4, 3.4, '#f2b88b', { lineWidth: 1.5 });
  drawSculptedLimb(ctx, -6, 3, 25, -4, 3.2, 2.6, '#78350f', { highlight: '#b45309', lineWidth: 1.4 });
  drawCelEllipse(ctx, 21, -1.5, 2.0, 4.4, pal.light, { rotation: 0.3, lineWidth: 1.05 });
  drawCelPoly(
    ctx,
    [
      [23.5, -8.2],
      [35, -5.2],
      [24.5, -1],
    ],
    '#f1f5f9',
    { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.5 },
  );
  ctx.restore();
  ctx.restore();

  ctx.restore();
}

function drawSphinxChariot(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const stride = p.isWalking ? Math.sin(p.walkPhase) : 0;
  const bob = p.isWalking ? Math.abs(Math.sin(p.walkPhase)) * 2.5 : 0;
  const surge = p.attackAnim > 0.25 ? Math.sin(((p.attackAnim - 0.25) / 0.75) * Math.PI) : 0;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 0.85);
    ctx.translate(0, f * 8);
  }

  const y = -26 - bob;
  // Back sculpted sandstone lion legs with golden anklets
  drawSculptedLimb(ctx, -14, y + 7, -16 - stride * 8, -3, 9.2, 6.2, '#b45309', {
    shadow: '#78350f',
    cuffColor: '#facc15',
    lineWidth: 1.85,
  });
  drawSculptedLimb(ctx, 12, y + 7, 14 + stride * 8, -3, 9.2, 6.2, '#b45309', {
    shadow: '#78350f',
    cuffColor: '#facc15',
    lineWidth: 1.85,
  });

  // Sculpted golden-sandstone lion body with engraved hieroglyph sash
  drawCelRoundRect(ctx, -23.5, y - 4.5, 45, 18.5, 8.5, '#eab308', {
    highlight: '#fef08a',
    shadow: '#a16207',
    lineWidth: 2.2,
  });
  drawCelRoundRect(ctx, -12, y - 4, 24, 5.2, 2, pal.main, { highlight: pal.light, lineWidth: 1.4 });

  // Multi-tiered Sweeping Gilded Falcon Wing (3 feathered tiers!)
  ctx.save();
  ctx.translate(-3, y - 2.5);
  ctx.rotate(-0.14 - surge * 0.3);
  drawCelPoly(
    ctx,
    [
      [7, 0],
      [-19, -18],
      [-28, -9],
      [-18, -3],
      [-25, 3],
      [-14, 5],
      [-18, 9],
      [-4, 8],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 1.95 },
  );
  drawCelPoly(
    ctx,
    [
      [5, -1],
      [-14, -12],
      [-19, -5],
      [-12, 0],
      [-15, 4],
      [-3, 4],
    ],
    '#facc15',
    { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.45 },
  );
  drawCelPoly(
    ctx,
    [
      [4, -1],
      [-7, -7],
      [-7, 1.5],
    ],
    '#fef9c3',
    { lineWidth: 1.1 },
  );
  ctx.restore();

  // Front sculpted sandstone lion legs with golden bracers & lion paws!
  drawSculptedLimb(ctx, -10, y + 9, -8 + stride * 9, -2.5, 9.6, 6.6, '#eab308', {
    highlight: '#fef08a',
    shadow: '#a16207',
    cuffColor: '#facc15',
    lineWidth: 1.9,
  });
  drawSculptedLimb(ctx, 15, y + 9, 18 - stride * 9, -2.5, 9.6, 6.6, '#eab308', {
    highlight: '#fef08a',
    shadow: '#a16207',
    cuffColor: '#facc15',
    lineWidth: 1.9,
  });
  drawCelEllipse(ctx, 21.5 - stride * 9, -2.4, 5.8, 3.0, '#ca8a04', { highlight: '#fef08a', lineWidth: 1.65 });

  // Pharaoh Nemes Sphinx Head + Uraeus Cobra Crown + Blazing Solar Crystal!
  drawCelPoly(
    ctx,
    [
      [11, y - 1],
      [14.5, y - 24.5],
      [27.5, y - 22.5],
      [30.5, y - 3.5],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 2.0 },
  );
  ctx.fillStyle = '#facc15';
  ctx.fillRect(14, y - 20, 12.5, 2.4);
  ctx.fillRect(14, y - 14.5, 13.5, 2.4);
  ctx.fillRect(14, y - 9, 13.5, 2.4);
  // Golden sphinx face + ceremonial pharaoh beard
  drawCelEllipse(ctx, 24.2, y - 13, 7.4, 8.4, '#facc15', {
    highlight: '#fef9c3',
    shadow: '#b45309',
    lineWidth: 1.9,
  });
  drawCelPoly(
    ctx,
    [
      [23, y - 5.5],
      [26.8, y - 5.5],
      [28.5, y + 1.5],
      [24.5, y + 1.5],
    ],
    pal.main,
    { highlight: '#facc15', lineWidth: 1.3 },
  );
  // Glowing sapphire eye & Uraeus cobra crest
  drawEnergyOrb(ctx, 27.2, y - 14.5, 2.2, '#38bdf8', '#ffffff');
  drawEnergyOrb(ctx, 24.5, y - 26.5, surge > 0.2 ? 9.0 : 5.8, '#f59e0b', '#fef9c3');

  // Rotating scythed golden chariot wheel at rear
  drawCartoonWheel(ctx, -17, -11, 11.5, p.walkPhase * 1.4, '#d97706', pal.main, 6, true);
  ctx.restore();
}

function drawWarChariot(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const stride = p.isWalking ? Math.sin(p.walkPhase) : 0;
  const bob = p.isWalking ? Math.abs(Math.sin(p.walkPhase)) * 2.4 : 0;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 0.75);
    ctx.translate(0, f * 9);
  }

  // 1. Sculpted Armored Classical Warhorse in front (+X side)
  const hx = 14;
  const hy = -26 - bob;
  // Back horse legs with dark iron hooves
  drawSculptedLimb(ctx, hx - 8, hy + 5, hx - 11 - stride * 9, -2.5, 6.2, 3.8, '#78350f', {
    shadow: '#451a03',
    cuffColor: '#1e293b',
    lineWidth: 1.65,
  });
  drawSculptedLimb(ctx, hx + 8, hy + 5, hx + 11 + stride * 9, -2.5, 6.2, 3.8, '#78350f', {
    shadow: '#451a03',
    cuffColor: '#1e293b',
    lineWidth: 1.65,
  });
  // Flowing horse tail
  drawCelPoly(
    ctx,
    [
      [hx - 14, hy - 1],
      [hx - 23, hy + 6 + Math.sin(p.walkPhase) * 2.5],
      [hx - 18, hy + 11],
      [hx - 12, hy + 4],
    ],
    '#3b1f0b',
    { lineWidth: 1.5 },
  );
  // Muscular horse body + bronze breastplate collar & team barding
  drawCelEllipse(ctx, hx, hy + 1, 16.5, 9.8, '#92400e', {
    highlight: '#ca8a04',
    shadow: '#451a03',
    lineWidth: 2.0,
  });
  drawCelRoundRect(ctx, hx - 9.5, hy - 8.2, 17.5, 10.2, 3, pal.main, {
    highlight: pal.light,
    shadow: pal.dark,
    lineWidth: 1.7,
  });
  drawCelRoundRect(ctx, hx + 8, hy - 5, 7, 10, 2.5, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.4 });
  // Horse arched neck + flowing dark mane + bronze chamfron head armor
  drawCelPoly(
    ctx,
    [
      [hx + 8, hy - 2],
      [hx + 16, hy - 18.5],
      [hx + 27.5, hy - 12],
      [hx + 23.5, hy - 7],
      [hx + 15.5, hy + 2],
    ],
    '#92400e',
    { highlight: '#b45309', shadow: '#451a03', lineWidth: 1.9 },
  );
  drawCelPoly(
    ctx,
    [
      [hx + 16, hy - 18.5],
      [hx + 27.5, hy - 12],
      [hx + 25.5, hy - 15.5],
      [hx + 18, hy - 20.5],
    ],
    '#facc15',
    { highlight: '#fef9c3', lineWidth: 1.4 },
  );
  drawCelEllipse(ctx, hx + 14.5, hy - 22.5, 5.5, 3.2, pal.light, { highlight: '#ffffff', lineWidth: 1.4 });
  // Front horse legs with hooves
  drawSculptedLimb(ctx, hx - 5, hy + 6, hx - 4 + stride * 10, -2.5, 6.5, 4.0, '#b45309', {
    highlight: '#d97706',
    cuffColor: '#1e293b',
    lineWidth: 1.7,
  });
  drawSculptedLimb(ctx, hx + 10, hy + 6, hx + 13 - stride * 10, -2.5, 6.5, 4.0, '#b45309', {
    highlight: '#d97706',
    cuffColor: '#1e293b',
    lineWidth: 1.7,
  });

  // Wooden hitch pole + leather bridle reins connecting horse to charioteer!
  drawSculptedLimb(ctx, -10, -16, hx + 6, hy + 2, 3.6, 3.0, '#78350f', { highlight: '#b45309', lineWidth: 1.5 });
  setInkStyle(ctx, 1.4, '#451a03');
  ctx.beginPath();
  ctx.moveTo(-10, -32 - bob * 0.5);
  ctx.quadraticCurveTo(8, -26 - bob, hx + 22, hy - 11);
  ctx.stroke();

  // 2. Chariot Rider standing inside golden-bronze cab (-X side)
  ctx.save();
  ctx.translate(-15, -21 - bob * 0.5);
  drawCartoonCape(ctx, -5, -15, 19, 13, pal.cape, pal.capeDark, p.walkPhase);
  drawCelRoundRect(ctx, -6.5, -17.5, 13.5, 15.5, 4, '#d97706', { highlight: '#fef08a', shadow: '#92400e', lineWidth: 1.85 });
  drawCelEllipse(ctx, 1, -22.5, 6.4, 6.2, '#f4c095', { lineWidth: 1.85 });
  drawCartoonFace(ctx, 1, -22, { mood: p.attackAnim > 0.25 ? 'attack' : 'normal', skin: '#f4c095' });
  drawCelEllipse(ctx, 0, -28.5, 8.5, 3.6, pal.main, { highlight: pal.light, lineWidth: 1.45 });
  drawCelEllipse(ctx, 1, -25, 7.0, 4.6, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.65 });
  const thrust = p.attackAnim > 0.2 ? Math.sin(p.attackAnim * Math.PI) * 11.5 : 0;
  drawSculptedLimb(ctx, -4 + thrust, -10, 29 + thrust, -13, 3.4, 2.8, '#78350f', { highlight: '#b45309', lineWidth: 1.45 });
  drawCelPoly(
    ctx,
    [
      [27 + thrust, -17.2],
      [39 + thrust, -13.5],
      [27 + thrust, -9.8],
    ],
    '#f1f5f9',
    { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.45 },
  );
  ctx.restore();

  // 3. Embossed Gilded Chariot Cab & Scythe-Bladed Wheel
  drawCelPoly(
    ctx,
    [
      [-26.5, -12],
      [-26.5, -28.5],
      [-6.5, -30.5],
      [-3.5, -12],
    ],
    '#d97706',
    { highlight: '#fef9c3', shadow: '#92400e', lineWidth: 2.1 },
  );
  drawCelRoundRect(ctx, -23.5, -25.5, 14.5, 9.5, 2, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.55 });
  drawRivetStrip(ctx, -24, -14, -7, -14, 4, 1.0);
  drawCartoonWheel(ctx, -16, -13, 13.5, p.walkPhase * 1.5, '#92400e', '#facc15', 6, true);
  ctx.restore();
}

function drawHeavyCavalry(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const stride = p.isWalking ? Math.sin(p.walkPhase) : 0;
  const bob = p.isWalking ? Math.abs(Math.sin(p.walkPhase)) * 3.0 : 0;
  const thrust = p.attackAnim > 0.2 ? Math.sin(p.attackAnim * Math.PI) * 13 : 0;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 1.15);
    ctx.translate(-f * 6, f * 6);
  }

  const hy = -28 - bob;
  // Back sculpted armored Destrier legs with iron hooves
  drawSculptedLimb(ctx, -12, hy + 7, -16 - stride * 10, -2.5, 7.0, 4.4, '#475569', {
    shadow: '#1e293b',
    cuffColor: '#0f172a',
    lineWidth: 1.75,
  });
  drawSculptedLimb(ctx, 11, hy + 7, 14 + stride * 10, -2.5, 7.0, 4.4, '#475569', {
    shadow: '#1e293b',
    cuffColor: '#0f172a',
    lineWidth: 1.75,
  });

  // Flowing dark Destrier tail
  drawCelPoly(
    ctx,
    [
      [-18, hy - 2],
      [-30, hy + 5 + Math.sin(p.walkPhase) * 3.2],
      [-24.5, hy + 13],
      [-16, hy + 4],
    ],
    '#1e293b',
    { highlight: '#475569', lineWidth: 1.7 },
  );

  // Destrier horse body draped in gold-tasseled royal heraldic caparison!
  drawCelEllipse(ctx, 0, hy + 2, 20.5, 11.2, '#f8fafc', { shadow: '#cbd5e1', lineWidth: 2.1 });
  drawCelPoly(
    ctx,
    [
      [-19.5, hy - 5.5],
      [18.5, hy - 5.5],
      [21, hy + 11.5],
      [10.5, hy + 7.5],
      [0, hy + 13.5],
      [-10.5, hy + 7.5],
      [-20.5, hy + 11.5],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 1.95 },
  );
  // Embossed golden cross crest & hem trim on caparison!
  setInkStyle(ctx, 2.0, '#facc15');
  ctx.beginPath();
  ctx.moveTo(-19, hy + 8.5);
  ctx.lineTo(-10.5, hy + 5.5);
  ctx.lineTo(0, hy + 10.8);
  ctx.lineTo(10.5, hy + 5.5);
  ctx.lineTo(19, hy + 8.5);
  ctx.stroke();
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-1.2, hy - 2.5, 2.6, 10.5);
  ctx.fillRect(-4.5, hy + 0.8, 9.2, 2.4);

  // Steel Peytral breastplate + articulated steel Crinet neck barding + Chamfron head!
  drawCelPoly(
    ctx,
    [
      [11, hy - 2],
      [19, hy - 20.5],
      [31.5, hy - 12],
      [26.5, hy - 6.8],
      [17, hy + 4.5],
    ],
    '#cbd5e1',
    { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.0 },
  );
  // Articulated steel crinet segment lines & golden chamfron horn spike
  setInkStyle(ctx, 1.2, '#475569');
  for (let n = 0; n < 3; n++) {
    ctx.beginPath();
    ctx.moveTo(13 + n * 2.2, hy - 3 - n * 4.5);
    ctx.lineTo(18.5 + n * 2.2, hy - 1 - n * 4.5);
    ctx.stroke();
  }
  drawCelPoly(
    ctx,
    [
      [25, hy - 15],
      [32, hy - 18],
      [27, hy - 12],
    ],
    '#facc15',
    { lineWidth: 1.2 },
  );
  drawCelEllipse(ctx, 18, hy - 22.8, 6.0, 3.2, pal.main, { highlight: pal.light, lineWidth: 1.45 });

  // Front sculpted steel-shod Destrier legs!
  drawSculptedLimb(ctx, -9, hy + 8, -7 + stride * 11, -2.5, 7.2, 4.6, '#64748b', {
    highlight: '#cbd5e1',
    cuffColor: '#0f172a',
    lineWidth: 1.8,
  });
  drawSculptedLimb(ctx, 13, hy + 8, 16 - stride * 11, -2.5, 7.2, 4.6, '#64748b', {
    highlight: '#cbd5e1',
    cuffColor: '#0f172a',
    lineWidth: 1.8,
  });

  // Plated Medieval Jousting Knight Rider on top!
  ctx.save();
  ctx.translate(-2, hy - 7.5);
  // Bridle reins to armored horse head
  setInkStyle(ctx, 1.4, '#451a03');
  ctx.beginPath();
  ctx.moveTo(4, -8);
  ctx.quadraticCurveTo(16, -2, 26, -3);
  ctx.stroke();

  drawCartoonCape(ctx, -6, -15, 22, 16, pal.cape, pal.capeDark, p.walkPhase);
  drawCelRoundRect(ctx, -8.2, -17.5, 16.4, 17.5, 5, '#cbd5e1', {
    highlight: '#ffffff',
    shadow: '#64748b',
    lineWidth: 2.0,
  });
  // Great Helm + gold crown band + dramatic flowing plume
  const plumeSway = Math.sin(p.walkPhase * 1.9) * 2.2;
  drawCelPoly(
    ctx,
    [
      [-1, -29.5],
      [-15, -37 + plumeSway],
      [-17, -24 + plumeSway],
      [-4, -27],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 1.65 },
  );
  drawCelRoundRect(ctx, -6.2, -31.5, 13.5, 13.5, 4, '#cbd5e1', {
    highlight: '#ffffff',
    shadow: '#64748b',
    lineWidth: 1.95,
  });
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-5.2, -29.2, 11.5, 2.0);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, -26, 7.2, 2.5);

  // Couched candy-striped Steel Tournament Lance + long swallowtail pennant!
  drawCelPoly(
    ctx,
    [
      [-6 + thrust, -8.5],
      [46 + thrust, -12],
      [-6 + thrust, -14.5],
    ],
    '#f1f5f9',
    { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 1.9 },
  );
  // Diagonal team tournament stripes along lance
  ctx.fillStyle = pal.main;
  ctx.fillRect(5 + thrust, -13.6, 4.5, 4.4);
  ctx.fillRect(16 + thrust, -13.2, 4.2, 3.6);
  // Gold vamplate lance hand-guard cone
  drawCelPoly(
    ctx,
    [
      [0 + thrust, -16],
      [7 + thrust, -12],
      [0 + thrust, -7.5],
    ],
    '#facc15',
    { highlight: '#fef9c3', lineWidth: 1.35 },
  );
  // Fluttering swallowtail tournament pennant near tip
  const flagWave = Math.sin(p.walkPhase * 2.3) * 2.6;
  drawCelPoly(
    ctx,
    [
      [31 + thrust, -11.5],
      [17 + thrust, -5.5 + flagWave],
      [21 + thrust, -8.5 + flagWave * 0.5],
      [16 + thrust, -11.5 + flagWave * 0.4],
    ],
    pal.main,
    { highlight: pal.light, lineWidth: 1.35 },
  );
  // Gold-bordered Kite Shield on flank
  drawCelPoly(
    ctx,
    [
      [-4.2, -14.5],
      [8.2, -14.5],
      [8.2, -3],
      [2, 5.5],
      [-4.2, -3],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 1.9 },
  );
  ctx.fillStyle = '#facc15';
  ctx.fillRect(1.1, -12.5, 2.0, 14.5);
  ctx.fillRect(-2.5, -8.5, 9.2, 2.0);
  ctx.restore();

  ctx.restore();
}

function drawCatapult(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const dp = p.deathProgress;
  const throwSwing = p.attackAnim > 0.15 ? Math.sin(((p.attackAnim - 0.15) / 0.85) * Math.PI) : 0;
  const armAngle = -2.45 + throwSwing * 1.95;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 0.55);
    ctx.translate(0, f * 8);
  }

  // Heavy oak siege chassis beam with iron corner brackets & rivets
  drawCelRoundRect(ctx, -28.5, -22.5, 57, 11.5, 3, '#78350f', {
    highlight: '#b45309',
    shadow: '#451a03',
    lineWidth: 2.2,
  });
  drawCelRoundRect(ctx, -28.5, -22.5, 7, 11.5, 1.5, '#475569', { highlight: '#94a3b8', lineWidth: 1.4 });
  drawCelRoundRect(ctx, 21.5, -22.5, 7, 11.5, 1.5, '#475569', { highlight: '#94a3b8', lineWidth: 1.4 });
  drawRivetStrip(ctx, -20, -17, 20, -17, 6, 1.1);

  // Back upright crossbar frame + fluttering medieval siege pennant!
  drawCelPoly(
    ctx,
    [
      [6, -21],
      [14, -44.5],
      [21.5, -44.5],
      [17, -21],
    ],
    '#854d0e',
    { highlight: '#ca8a04', shadow: '#451a03', lineWidth: 2.0 },
  );
  // Fluttering pennant flag atop upright crossbar
  const flagSway = Math.sin(p.walkPhase * 1.9) * 2.2;
  drawCelPoly(
    ctx,
    [
      [18, -44.5],
      [4, -49 + flagSway],
      [9, -44.5 + flagSway * 0.5],
      [5, -40 + flagSway],
      [18, -41.5],
    ],
    pal.main,
    { highlight: pal.light, lineWidth: 1.35 },
  );
  drawCelRoundRect(ctx, 10, -45.5, 13.5, 6.2, 2, pal.main, { highlight: pal.light, lineWidth: 1.7 });

  // Coiled twisted-hemp torsion rope cylinder at pivot!
  drawCelRoundRect(ctx, 2, -25.5, 12, 9.5, 3, '#d97706', { highlight: '#fef08a', shadow: '#78350f', lineWidth: 1.6 });
  setInkStyle(ctx, 1.2, '#78350f');
  for (let r = 4; r <= 12; r += 2.6) {
    ctx.beginPath();
    ctx.moveTo(r, -25);
    ctx.lineTo(r, -16.5);
    ctx.stroke();
  }

  // Flexing catapult throwing arm & iron-banded boulder bucket!
  ctx.save();
  ctx.translate(8, -21);
  ctx.rotate(armAngle);
  drawCelRoundRect(ctx, -3, -3.6, 36.5, 6.8, 2.5, '#a16207', { highlight: '#eab308', shadow: '#451a03', lineWidth: 2.0 });
  // Iron reinforcement collar on throwing arm
  drawCelRoundRect(ctx, 14, -4.2, 4.5, 8.0, 1, '#475569', { highlight: '#cbd5e1', lineWidth: 1.25 });
  // Bucket cup
  drawCelRoundRect(ctx, 27, -9.2, 13.5, 12.4, 3, '#5c3412', { highlight: '#92400e', lineWidth: 1.9 });
  if (throwSwing < 0.55) {
    // Cracked flaming/molten siege boulder loaded in cup!
    drawCelEllipse(ctx, 33.5, -7.2, 6.5, 5.8, '#64748b', {
      highlight: '#e2e8f0',
      shadow: '#1e293b',
      lineWidth: 1.75,
    });
    setInkStyle(ctx, 1.15, '#f97316');
    ctx.beginPath();
    ctx.moveTo(31, -9.5);
    ctx.lineTo(34, -6.5);
    ctx.lineTo(37, -8.2);
    ctx.stroke();
  }
  ctx.restore();

  // Front A-frame timber brace + iron gusset
  drawCelPoly(
    ctx,
    [
      [-18.5, -21],
      [12, -40.5],
      [16.5, -34],
      [-11, -21],
    ],
    '#92400e',
    { highlight: '#ca8a04', shadow: '#451a03', lineWidth: 2.0 },
  );

  // Team heraldic side shield plate with golden cross emblem
  drawCelRoundRect(ctx, -9.5, -23.5, 19, 12.5, 3, pal.main, {
    highlight: pal.light,
    shadow: pal.dark,
    lineWidth: 1.85,
  });
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-1.2, -21.5, 2.4, 8.5);
  ctx.fillRect(-5, -18.2, 10, 2.2);

  // Twin heavy spoked siege wheels
  drawCartoonWheel(ctx, -18.5, -12, 12.2, p.walkPhase * 1.3, '#854d0e', '#94a3b8', 6);
  drawCartoonWheel(ctx, 18.5, -12, 12.2, p.walkPhase * 1.3, '#854d0e', '#94a3b8', 6);

  ctx.restore();
}

function drawFieldCannon(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const recoil = p.attackAnim > 0.3 ? Math.sin(((p.attackAnim - 0.3) / 0.7) * Math.PI) : 0;
  const firing = p.attackAnim > 0.45 && p.attackAnim < 0.85;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 0.65);
    ctx.translate(0, f * 8);
  }

  // Uniformed tricorn cannonier standing behind trail holding glowing linstock!
  ctx.save();
  ctx.translate(-22, 0);
  drawCartoonHumanoid(ctx, {
    walkPhase: p.walkPhase,
    isWalking: p.isWalking,
    attackAnim: p.attackAnim,
    hitFlash: p.hitFlash,
    deathProgress: 0,
    scale: 0.92,
    skin: '#f4c095',
    torsoFill: pal.main,
    torsoHighlight: pal.light,
    torsoShadow: pal.dark,
    pantsColor: '#f1f5f9',
    bootColor: '#1e293b',
    beltColor: '#f8fafc',
    skirtColor: pal.main,
    skirtTrim: '#facc15',
    skirtStyle: 'coat',
    swingStyle: 'throw',
    drawHelmet: (c, hx, hy, hr) => {
      drawCelPoly(
        c,
        [
          [hx - hr - 3.5, hy - 3],
          [hx, hy - hr - 5.5],
          [hx + hr + 4.5, hy - 3],
        ],
        '#1e293b',
        { highlight: '#475569', lineWidth: 1.75 },
      );
      drawCelRoundRect(c, hx - hr + 1, hy - 5.5, hr * 2 - 1, 2.0, 0.8, '#facc15', { lineWidth: 1.0 });
    },
    drawWeapon: (c) => {
      drawSculptedLimb(c, 0, 2, 11, -8, 2.6, 2.0, '#78350f', { lineWidth: 1.35 });
      drawEnergyOrb(c, 11.5, -8.8, firing ? 3.8 : 2.1, '#f97316', '#fef08a');
    },
  });
  ctx.restore();

  // Stacked iron cannonball pyramid beside carriage!
  drawCelEllipse(ctx, -10.5, -3.4, 3.6, 3.6, '#1e293b', { highlight: '#64748b', lineWidth: 1.35 });
  drawCelEllipse(ctx, -4.5, -3.4, 3.6, 3.6, '#1e293b', { highlight: '#64748b', lineWidth: 1.35 });
  drawCelEllipse(ctx, -7.5, -8.2, 3.5, 3.5, '#1e293b', { highlight: '#94a3b8', lineWidth: 1.35 });

  // Wooden artillery trail carriage + slung ramrod + iron rivets
  const rx = -recoil * 6;
  drawCelPoly(
    ctx,
    [
      [-18 + rx, -5],
      [14 + rx, -22.5],
      [18.5 + rx, -15],
      [-12 + rx, -2],
    ],
    '#78350f',
    { highlight: '#ca8a04', shadow: '#451a03', lineWidth: 2.1 },
  );
  drawRivetStrip(ctx, -10 + rx, -8, 12 + rx, -19, 4, 1.0);
  // Slung wooden rammer rod along side of trail
  drawSculptedLimb(ctx, -14 + rx, -10, 14 + rx, -24, 2.4, 2.4, '#d97706', { lineWidth: 1.2 });

  // Gleaming tapered bronze-and-iron cannon barrel with flared muzzle & gold trunnion bands!
  ctx.save();
  ctx.translate(4 + rx, -24.5);
  ctx.rotate(-0.14 - recoil * 0.14);
  drawCelPoly(
    ctx,
    [
      [-14.5, -6.8],
      [24, -4.6],
      [27, -6.2],
      [27, 6.2],
      [24, 4.6],
      [-14.5, 6.8],
    ],
    '#334155',
    { highlight: '#94a3b8', shadow: '#0f172a', lineWidth: 2.2 },
  );
  // Cascabel knob at breech & ornate brass reinforcement bands
  drawCelEllipse(ctx, -16.8, 0, 4.4, 4.4, '#d97706', { highlight: '#fef9c3', lineWidth: 1.7 });
  drawCelRoundRect(ctx, -5, -6.6, 4.5, 13.2, 1.5, '#d97706', { highlight: '#fef9c3', lineWidth: 1.45 });
  drawCelRoundRect(ctx, 16.5, -5.6, 4.6, 11.2, 1.5, '#d97706', { highlight: '#fef9c3', lineWidth: 1.45 });
  // Brass trunnion mount & team crest medallion
  drawCelEllipse(ctx, 6, 0, 3.8, 3.8, pal.main, { highlight: pal.light, lineWidth: 1.3 });

  if (firing) {
    drawCartoonMuzzleFlash(c_safe(ctx), 32, 0, 16, '#f97316', '#fef08a');
  }
  ctx.restore();

  // Large spoked artillery carriage wheel in front
  drawCartoonWheel(ctx, 5 + rx * 0.5, -14, 14.2, p.walkPhase * 1.4, '#854d0e', '#d97706', 8);
  ctx.restore();
}

function c_safe(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
  return ctx;
}
