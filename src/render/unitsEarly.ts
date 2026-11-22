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
        scale: 1.06,
        skin: '#f2b88b',
        torsoFill: '#a16207',
        torsoHighlight: '#ca8a04',
        torsoShadow: '#713f12',
        pantsColor: '#854d0e',
        bootColor: '#5c3412',
        beltColor: pal.main,
        beardColor: '#451a03',
        swingStyle: 'overhead',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Spotted sabertooth pelt diagonal strap
          drawCelPoly(
            c,
            [
              [tx + 1, ty + 1],
              [tx + tw * 0.55, ty + 1],
              [tx + tw - 1, ty + th - 2],
              [tx + tw * 0.4, ty + th - 2],
            ],
            '#d97706',
            { lineWidth: 1.5 },
          );
          c.fillStyle = '#451a03';
          c.beginPath();
          c.arc(tx + 6, ty + 6, 1.5, 0, Math.PI * 2);
          c.arc(tx + 10, ty + 11, 1.6, 0, Math.PI * 2);
          c.fill();
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Wild shaggy caveman hair + bold team headband
          drawCelPoly(
            c,
            [
              [hx - hr - 2, hy + 1],
              [hx - hr - 4, hy - 5],
              [hx - 3, hy - hr - 3],
              [hx + 2, hy - hr - 4],
              [hx + 7, hy - hr - 1],
              [hx + hr + 1, hy - 3],
              [hx - 1, hy - 3],
            ],
            '#451a03',
            { lineWidth: 1.8 },
          );
          drawCelRoundRect(c, hx - hr - 1, hy - 5.2, hr * 2 + 2.5, 3.6, 1.4, pal.main, {
            highlight: pal.light,
            lineWidth: 1.5,
          });
        },
        drawWeapon: (c) => {
          // Chunky bone-spiked prehistoric wooden club
          drawCelPoly(
            c,
            [
              [-2, 3],
              [2, 3],
              [6.5, -21],
              [-4.5, -20],
            ],
            '#854d0e',
            { highlight: '#b45309', shadow: '#451a03', lineWidth: 2.0 },
          );
          // Embedded bone spikes
          drawCelPoly(
            c,
            [
              [4, -17],
              [10.5, -19],
              [5, -13],
            ],
            '#f8fafc',
            { lineWidth: 1.5 },
          );
          drawCelPoly(
            c,
            [
              [-3, -14],
              [-8.5, -16],
              [-2.5, -10.5],
            ],
            '#f8fafc',
            { lineWidth: 1.5 },
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
        scale: 1.0,
        torsoW: 14.5,
        torsoH: 18,
        skin: '#f2b88b',
        torsoFill: '#c28144',
        torsoHighlight: '#e0a56b',
        torsoShadow: '#7c4a1d',
        pantsColor: '#78350f',
        bootColor: '#451a03',
        beltColor: '#5c3412',
        swingStyle: 'throw',
        drawBackAccessory: (c, topY) => {
          // Stone ammo leather pouch
          drawCelEllipse(c, -9, topY + 13, 5, 6, '#713f12', { highlight: '#a16207', lineWidth: 1.8 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Spiky hair + fluttering team bandana tails
          drawCelPoly(
            c,
            [
              [hx - hr, hy - 1],
              [hx - hr - 3, hy - 6],
              [hx, hy - hr - 3],
              [hx + hr, hy - 4],
            ],
            '#3b1f0b',
            { lineWidth: 1.7 },
          );
          drawCelRoundRect(c, hx - hr - 0.5, hy - 5.4, hr * 2 + 2, 3.6, 1.5, pal.main, {
            highlight: pal.light,
            lineWidth: 1.5,
          });
          const flutter = Math.sin(p.walkPhase * 1.6) * 3;
          drawCelPoly(
            c,
            [
              [hx - hr, hy - 4],
              [hx - hr - 11, hy - 6 + flutter],
              [hx - hr - 9, hy - 1 + flutter],
            ],
            pal.main,
            { lineWidth: 1.5 },
          );
        },
        drawWeapon: (c, firing) => {
          // Whirling leather sling & stone
          const spin = p.attackAnim > 0.05 ? p.attackAnim * Math.PI * 5 : p.walkPhase * 0.6;
          const sx = Math.cos(spin) * 11;
          const sy = Math.sin(spin) * 11 - 4;
          setInkStyle(c, 2.0, '#78350f');
          c.beginPath();
          c.moveTo(0, 0);
          c.quadraticCurveTo(sx * 0.5, sy - 4, sx, sy);
          c.stroke();
          if (!firing) {
            drawCelEllipse(c, sx, sy, 4.2, 3.5, '#94a3b8', { highlight: '#e2e8f0', shadow: '#475569', lineWidth: 1.7 });
          } else {
            drawCartoonMuzzleFlash(c, 10, -4, 7, '#fde047', '#ffffff');
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
        scale: 1.08,
        skin: '#d99a6c',
        torsoFill: '#5c2d16',
        torsoHighlight: '#854d0e',
        torsoShadow: '#3b180b',
        pantsColor: '#451a03',
        bootColor: '#2c1205',
        capeColor: pal.main,
        capeDark: pal.dark,
        swingStyle: 'staff',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Bone rib necklace
          for (let i = 0; i < 3; i++) {
            drawCelRoundRect(c, tx + 3, ty + 4 + i * 4.5, tw - 6, 2.3, 1, '#f8fafc', { lineWidth: 1.1 });
          }
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Iconic horned skull mask + vibrant feathers
          drawCelEllipse(c, hx + 1.5, hy - 0.5, hr + 1.2, hr + 0.4, '#f8fafc', {
            shadow: '#cbd5e1',
            lineWidth: 2.0,
          });
          // Glowing eye socket
          c.fillStyle = '#0f172a';
          c.beginPath();
          c.arc(hx + 5, hy - 1.5, 2.4, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#f97316';
          c.beginPath();
          c.arc(hx + 5.2, hy - 1.5, 1.3, 0, Math.PI * 2);
          c.fill();
          // Curved horns
          drawCelPoly(
            c,
            [
              [hx - 3, hy - hr + 1],
              [hx - 11, hy - hr - 8],
              [hx - 1, hy - hr - 2],
            ],
            '#fef3c7',
            { lineWidth: 1.7 },
          );
          drawCelPoly(
            c,
            [
              [hx + 4, hy - hr + 1],
              [hx + 11, hy - hr - 8],
              [hx + 7, hy - hr + 2],
            ],
            '#fef3c7',
            { lineWidth: 1.7 },
          );
          // Team feathers behind mask
          drawCelEllipse(c, hx - 6, hy - hr - 3, 2.5, 6, pal.light, { rotation: -0.4, lineWidth: 1.4 });
          drawCelEllipse(c, hx - 1, hy - hr - 5, 2.5, 6.5, '#f97316', { rotation: -0.1, lineWidth: 1.4 });
        },
        drawWeapon: (c, firing) => {
          // Carved fire-totem staff with blazing ember orb!
          drawInkLimb(c, 2, 12, 5, -24, 3.6, '#78350f', 3.0);
          drawCelRoundRect(c, 0, -25, 10, 6, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
          drawEnergyOrb(c, 5, -29, firing ? 8.2 : 5.6, '#f97316', '#fef08a');
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
        scale: 1.1,
        skin: '#1e293b',
        torsoFill: '#b45309',
        torsoHighlight: '#fbbf24',
        torsoShadow: '#78350f',
        pantsColor: '#f8fafc',
        bootColor: '#d97706',
        beltColor: pal.main,
        eyeColor: '#facc15',
        swingStyle: 'overhead',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Royal golden Egyptian pectoral collar with team turquoise/ruby gem
          drawCelEllipse(c, tx + tw / 2, ty + 4, tw * 0.54, 4.5, '#facc15', {
            highlight: '#fef08a',
            lineWidth: 1.6,
          });
          drawCelEllipse(c, tx + tw / 2, ty + 4.5, 2.5, 2.5, pal.light, { lineWidth: 1.2 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Iconic tall golden-trimmed Anubis jackal head & ears
          drawCelPoly(
            c,
            [
              [hx - hr, hy + 5],
              [hx - hr - 3, hy - 3],
              [hx, hy - hr - 1],
              [hx + hr + 5, hy - 1],
              [hx + hr + 4, hy + 3.5],
              [hx + 2, hy + 4.5],
            ],
            '#1e293b',
            { highlight: '#334155', lineWidth: 2.0 },
          );
          // Tall twin Anubis ears
          drawCelPoly(
            c,
            [
              [hx - 5, hy - hr + 2],
              [hx - 7, hy - hr - 13],
              [hx - 0.5, hy - hr + 1],
            ],
            '#1e293b',
            { highlight: '#facc15', lineWidth: 1.8 },
          );
          drawCelPoly(
            c,
            [
              [hx + 0.5, hy - hr + 2],
              [hx + 1.5, hy - hr - 12],
              [hx + 5.5, hy - hr + 2],
            ],
            '#1e293b',
            { highlight: '#facc15', lineWidth: 1.8 },
          );
          // Team nemes stripe + glowing golden eye
          drawCelRoundRect(c, hx - hr - 1.5, hy - 4, hr * 1.4, 3.2, 1.2, pal.main, { lineWidth: 1.3 });
          c.fillStyle = '#fde047';
          c.beginPath();
          c.arc(hx + 5.5, hy - 1.5, 1.8, 0, Math.PI * 2);
          c.fill();
        },
        drawWeapon: (c) => {
          // Curved gleaming golden Khopesh sickle-sword!
          drawInkLimb(c, 0, 4, 2, -6, 3.2, '#78350f', 2.4);
          c.save();
          c.beginPath();
          c.moveTo(0, -6);
          c.quadraticCurveTo(10, -14, 12, -23);
          c.quadraticCurveTo(4, -27, -2, -22);
          c.quadraticCurveTo(5, -18, 4, -10);
          c.closePath();
          c.fillStyle = '#facc15';
          c.fill();
          setInkStyle(c, 2.0);
          c.stroke();
          // Blade sheen
          c.strokeStyle = '#fef9c3';
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(4, -10);
          c.quadraticCurveTo(9, -16, 10, -22);
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
        scale: 1.05,
        skin: '#d99666',
        torsoFill: '#f8fafc',
        torsoHighlight: '#ffffff',
        torsoShadow: '#cbd5e1',
        pantsColor: '#e2e8f0',
        bootColor: '#d97706',
        beltColor: '#f59e0b',
        capeColor: pal.main,
        capeDark: pal.dark,
        swingStyle: 'staff',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Gold & team ceremonial stole
          drawCelRoundRect(c, tx + tw * 0.34, ty + 1, tw * 0.32, th - 2, 1.5, pal.main, {
            highlight: pal.light,
            lineWidth: 1.4,
          });
          drawCelEllipse(c, tx + tw / 2, ty + 3.5, tw * 0.52, 4, '#facc15', { lineWidth: 1.5 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Horned golden solar-disk crown
          drawCelRoundRect(c, hx - hr - 1, hy - 6, hr * 2 + 2, 4.5, 1.8, '#f59e0b', {
            highlight: '#fef08a',
            lineWidth: 1.6,
          });
          // Crescent horns framing glowing sun disc
          setInkStyle(c, 2.2, '#d97706');
          c.beginPath();
          c.arc(hx + 1, hy - hr - 4.5, 6.8, 0.25, Math.PI - 0.25);
          c.stroke();
          drawEnergyOrb(c, hx + 1, hy - hr - 5.5, 4.8, '#f59e0b', '#fef08a');
        },
        drawWeapon: (c, firing) => {
          // Radiant golden Ankh staff
          drawInkLimb(c, 2, 11, 4, -22, 3.2, '#d97706', 2.6);
          drawInkLimb(c, -2, -17, 10, -17, 3.0, '#facc15', 2.2);
          c.save();
          c.beginPath();
          c.ellipse(4, -24.5, 4.2, 5.4, 0, 0, Math.PI * 2);
          setInkStyle(c, 3.6, INK);
          c.stroke();
          c.strokeStyle = '#facc15';
          c.lineWidth = 2.2;
          c.stroke();
          c.restore();
          if (firing) {
            drawEnergyOrb(c, 4, -24.5, 8.5, '#fbbf24', '#ffffff');
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
        scale: 1.07,
        skin: '#c98856',
        torsoFill: '#1e293b',
        torsoHighlight: '#475569',
        torsoShadow: '#0f172a',
        pantsColor: '#1e293b',
        bootColor: '#d97706',
        beltColor: '#10b981',
        pauldronColor: '#f59e0b',
        pauldronTrim: pal.light,
        swingStyle: 'dual',
        drawHelmet: (c, hx, hy, hr) => {
          // Golden armored mask + arching scorpion stinger tail crest!
          drawCelRoundRect(c, hx - hr - 0.5, hy - hr - 0.5, hr * 2 + 2, hr * 1.1, 4, '#d97706', {
            highlight: '#fde047',
            lineWidth: 1.8,
          });
          // Curved segmented scorpion tail overhead
          drawInkLimb(c, hx - 4, hy - hr, hx - 10, hy - hr - 8, 4.2, '#f59e0b', 2.8);
          drawInkLimb(c, hx - 10, hy - hr - 8, hx - 1, hy - hr - 13, 3.6, '#d97706', 2.6);
          drawCelPoly(
            c,
            [
              [hx - 1, hy - hr - 15],
              [hx + 8, hy - hr - 11],
              [hx, hy - hr - 10],
            ],
            '#10b981',
            { highlight: '#6ee7b7', lineWidth: 1.5 },
          );
          drawCelRoundRect(c, hx - hr, hy - 4.5, hr * 1.6, 2.8, 1, pal.main, { lineWidth: 1.2 });
        },
        drawOffhand: (c, sx, sy) => {
          // Second curved emerald-venom dagger
          drawCelPoly(
            c,
            [
              [sx - 2, sy],
              [sx + 12, sy - 6],
              [sx + 7, sy + 2],
            ],
            '#10b981',
            { highlight: '#a7f3d0', lineWidth: 1.6 },
          );
        },
        drawWeapon: (c) => {
          // Glowing emerald-venom curved assassin blade
          drawCelPoly(
            c,
            [
              [0, 2],
              [15, -13],
              [18, -5],
              [4, 4],
            ],
            '#10b981',
            { highlight: '#a7f3d0', shadow: '#047857', lineWidth: 1.9 },
          );
          drawCelRoundRect(c, -2, -1, 5, 5, 1.5, '#facc15', { lineWidth: 1.4 });
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
        scale: 1.08,
        skin: '#f4c095',
        torsoFill: '#d97706',
        torsoHighlight: '#fde047',
        torsoShadow: '#92400e',
        pantsColor: pal.main,
        bootColor: '#b45309',
        beltColor: '#78350f',
        capeColor: pal.cape,
        capeDark: pal.capeDark,
        swingStyle: 'thrust',
        drawHelmet: (c, hx, hy, hr) => {
          // Sweeping Corinthian horsehair plume!
          drawCelPoly(
            c,
            [
              [hx - 2, hy - hr - 1],
              [hx - 14, hy - hr - 6],
              [hx - 11, hy - 1],
              [hx - 2, hy - hr - 8],
              [hx + 8, hy - hr - 6],
              [hx + 5, hy - hr],
            ],
            pal.main,
            { highlight: pal.light, lineWidth: 1.8 },
          );
          // Bronze Corinthian helmet
          drawCelEllipse(c, hx + 0.5, hy - 2.5, hr + 1.2, hr * 0.9, '#d97706', {
            highlight: '#fef08a',
            shadow: '#92400e',
            lineWidth: 2.0,
          });
          // Cheek guard
          drawCelRoundRect(c, hx - 2, hy - 1, 7, 6.5, 2, '#b45309', { lineWidth: 1.5 });
        },
        drawOffhand: (c, sx, sy) => {
          // Iconic big round bronze Greek Hoplon shield with team lambda emblem
          drawCelEllipse(c, sx + 2, sy, 8.5, 11.5, '#f59e0b', {
            highlight: '#fef08a',
            shadow: '#92400e',
            lineWidth: 2.1,
          });
          drawCelEllipse(c, sx + 2.5, sy, 5.8, 8.4, pal.main, {
            highlight: pal.light,
            lineWidth: 1.5,
          });
          // Golden chevron
          setInkStyle(c, 2.0, '#fef08a');
          c.beginPath();
          c.moveTo(sx, sy + 4);
          c.lineTo(sx + 2.8, sy - 4);
          c.lineTo(sx + 5.5, sy + 4);
          c.stroke();
        },
        drawWeapon: (c) => {
          // Long Spartan spear
          drawInkLimb(c, -12, 2, 26, -2, 3.0, '#78350f', 2.4);
          drawCelPoly(
            c,
            [
              [24, -6],
              [37, -2.5],
              [24, 1.5],
            ],
            '#e2e8f0',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.7 },
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
        scale: 1.02,
        torsoW: 15,
        skin: '#f4c095',
        torsoFill: '#15803d',
        torsoHighlight: '#4ade80',
        torsoShadow: '#14532d',
        pantsColor: '#5c3412',
        bootColor: '#451a03',
        beltColor: '#78350f',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Quiver packed with team-fletched arrows
          drawCelRoundRect(c, -11, topY + 2, 6, 14, 2, '#78350f', { lineWidth: 1.7 });
          for (let i = 0; i < 3; i++) {
            drawCelPoly(
              c,
              [
                [-10 + i * 2, topY + 2],
                [-12 + i * 2, topY - 4],
                [-8 + i * 2, topY - 3],
              ],
              pal.light,
              { lineWidth: 1.2 },
            );
          }
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Iconic Robin-Hood / Classical ranger hood with team trim
          drawCelPoly(
            c,
            [
              [hx - hr - 4, hy + 2],
              [hx - hr - 3, hy - hr - 2],
              [hx + 2, hy - hr - 4],
              [hx + hr + 2, hy - 3],
              [hx - 1, hy - 4],
            ],
            pal.main,
            { highlight: pal.light, shadow: pal.dark, lineWidth: 1.9 },
          );
        },
        drawWeapon: (c, firing) => {
          // Curved wooden recurve bow with animated string pull
          const pull = p.attackAnim > 0.35 ? 6 : 1;
          c.save();
          setInkStyle(c, 4.8, INK);
          c.beginPath();
          c.arc(4, -2, 13, -1.18, 1.18);
          c.stroke();
          c.strokeStyle = '#b45309';
          c.lineWidth = 2.6;
          c.stroke();

          // Bowstring
          const topX = 4 + Math.cos(-1.18) * 13;
          const topY = -2 + Math.sin(-1.18) * 13;
          const botX = 4 + Math.cos(1.18) * 13;
          const botY = -2 + Math.sin(1.18) * 13;
          setInkStyle(c, 1.4, '#e2e8f0');
          c.beginPath();
          c.moveTo(topX, topY);
          c.lineTo(topX - pull, -2);
          c.lineTo(botX, botY);
          c.stroke();

          if (!firing) {
            drawInkLimb(c, topX - pull, -2, 19, -2, 2.0, '#d97706', 1.8);
            drawCelPoly(
              c,
              [
                [18, -5],
                [24, -2],
                [18, 1],
              ],
              '#e2e8f0',
              { lineWidth: 1.4 },
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
        torsoW: 18,
        torsoH: 20,
        skin: '#f4c095',
        torsoFill: '#94a3b8',
        torsoHighlight: '#f1f5f9',
        torsoShadow: '#475569',
        pantsColor: pal.main,
        bootColor: '#7c2d12',
        beltColor: '#d97706',
        capeColor: pal.main,
        capeDark: pal.dark,
        pauldronColor: '#cbd5e1',
        pauldronTrim: '#facc15',
        swingStyle: 'overhead',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Segmented Roman Lorica Segmentata ribs
          setInkStyle(c, 1.5, '#475569');
          for (let i = 1; i <= 3; i++) {
            c.beginPath();
            c.moveTo(tx + 2, ty + i * 4.5);
            c.lineTo(tx + tw - 2, ty + i * 4.5);
            c.stroke();
          }
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Wide Roman Centurion transverse plumed crest!
          drawCelEllipse(c, hx, hy - hr - 5.5, 11.5, 5.2, pal.main, {
            highlight: pal.light,
            shadow: pal.dark,
            lineWidth: 1.9,
          });
          drawCelRoundRect(c, hx - 2.5, hy - hr - 2.5, 5, 4, 1, '#facc15', { lineWidth: 1.3 });
          drawCelEllipse(c, hx + 0.5, hy - 2.5, hr + 1.4, hr * 0.85, '#cbd5e1', {
            highlight: '#ffffff',
            shadow: '#64748b',
            lineWidth: 2.0,
          });
          drawCelRoundRect(c, hx - hr, hy - 4, hr * 2 + 2.5, 2.8, 1, '#f59e0b', { lineWidth: 1.4 });
        },
        drawOffhand: (c, sx, sy) => {
          // Massive curved Roman Scutum tower shield with golden thunderbolt boss!
          drawCelRoundRect(c, sx - 2, sy - 14, 12.5, 25, 3, pal.main, {
            highlight: pal.light,
            shadow: pal.dark,
            lineWidth: 2.2,
          });
          c.strokeStyle = '#facc15';
          c.lineWidth = 2.0;
          c.strokeRect(sx, sy - 12, 8.5, 21);
          drawCelEllipse(c, sx + 4.2, sy - 1.5, 3.2, 4.2, '#facc15', { highlight: '#fef08a', lineWidth: 1.4 });
        },
        drawWeapon: (c) => {
          // Gleaming Roman Gladius short sword
          drawCelRoundRect(c, -2, -2, 6, 3.5, 1, '#facc15', { lineWidth: 1.4 });
          drawCelPoly(
            c,
            [
              [-0.5, -2],
              [3.5, -2],
              [4, -18],
              [1.5, -23],
              [-1, -18],
            ],
            '#e2e8f0',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.8 },
          );
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
        scale: 1.12,
        torsoW: 17.5,
        torsoH: 19.5,
        skin: '#cbd5e1',
        torsoFill: '#cbd5e1',
        torsoHighlight: '#ffffff',
        torsoShadow: '#64748b',
        pantsColor: '#475569',
        bootColor: '#64748b',
        beltColor: '#78350f',
        armColor: '#94a3b8',
        capeColor: pal.cape,
        capeDark: pal.capeDark,
        pauldronColor: '#cbd5e1',
        pauldronTrim: pal.main,
        mask: 'none',
        swingStyle: 'overhead',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Team surcoat cross
          drawCelRoundRect(c, tx + tw * 0.34, ty + 2, tw * 0.32, th - 4, 1, pal.main, { lineWidth: 1.3 });
          drawCelRoundRect(c, tx + 2, ty + 6, tw - 4, 4, 1, pal.main, { lineWidth: 1.3 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Flowing knight plume
          drawCelPoly(
            c,
            [
              [hx - 2, hy - hr - 1],
              [hx - 13, hy - hr - 8],
              [hx - 15, hy - 2],
              [hx - 5, hy - hr],
            ],
            pal.main,
            { highlight: pal.light, lineWidth: 1.7 },
          );
          // Classic medieval Great Helm with cross-slit visor!
          drawCelRoundRect(c, hx - hr - 0.5, hy - hr - 1.5, hr * 2 + 2.5, hr * 2 + 1.5, 4.5, '#cbd5e1', {
            highlight: '#ffffff',
            shadow: '#64748b',
            lineWidth: 2.1,
          });
          // Dark visor T-slit
          c.fillStyle = '#0f172a';
          c.fillRect(hx - 1, hy - 2.6, 9.5, 2.6);
          c.fillRect(hx + 3.2, hy - 2.6, 2.4, 7.5);
          // Gold brow trim
          c.fillStyle = '#facc15';
          c.fillRect(hx - hr + 1, hy - 5.2, hr * 2, 1.8);
        },
        drawOffhand: (c, sx, sy) => {
          // Heraldic Kite Shield
          drawCelPoly(
            c,
            [
              [sx - 3, sy - 11],
              [sx + 9, sy - 11],
              [sx + 9, sy + 1],
              [sx + 3, sy + 12],
              [sx - 3, sy + 1],
            ],
            pal.main,
            { highlight: pal.light, shadow: pal.dark, lineWidth: 2.1 },
          );
          c.fillStyle = '#facc15';
          c.fillRect(sx + 1.8, sy - 9, 2.6, 17);
          c.fillRect(sx - 1.2, sy - 4, 8.6, 2.6);
        },
        drawWeapon: (c) => {
          // Broad medieval knight longsword with golden crossguard
          drawCelRoundRect(c, -4.5, -3.5, 11, 3.6, 1.2, '#facc15', { highlight: '#fef08a', lineWidth: 1.5 });
          drawCelPoly(
            c,
            [
              [-1.5, -3.5],
              [3.5, -3.5],
              [4, -24],
              [1, -29],
              [-2, -24],
            ],
            '#e2e8f0',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.9 },
          );
          c.strokeStyle = '#94a3b8';
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(1, -5);
          c.lineTo(1, -24);
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
        scale: 1.05,
        skin: '#f4c095',
        torsoFill: pal.main,
        torsoHighlight: pal.light,
        torsoShadow: pal.dark,
        pantsColor: '#475569',
        bootColor: '#451a03',
        beltColor: '#78350f',
        armColor: '#64748b',
        swingStyle: 'aim',
        drawHelmet: (c, hx, hy, hr) => {
          // Iconic medieval steel Kettle Hat!
          drawCelEllipse(c, hx, hy - 4.5, hr + 1.2, hr * 0.72, '#94a3b8', {
            highlight: '#f1f5f9',
            shadow: '#475569',
            lineWidth: 2.0,
          });
          drawCelEllipse(c, hx + 0.5, hy - 3.2, hr + 5.5, 2.6, '#cbd5e1', {
            shadow: '#64748b',
            lineWidth: 1.9,
          });
        },
        drawWeapon: (c, firing) => {
          // Heavy timber & steel mechanical crossbow
          drawCelRoundRect(c, -4, -3, 21, 5.2, 1.8, '#854d0e', { highlight: '#b45309', lineWidth: 1.8 });
          // Steel bow prod
          setInkStyle(c, 3.6, '#475569');
          c.beginPath();
          c.moveTo(15, -10);
          c.quadraticCurveTo(20, -1, 15, 8);
          c.stroke();
          // Steel bolt
          if (!firing) {
            drawInkLimb(c, 4, -1.5, 22, -1.5, 2.2, '#e2e8f0', 1.8);
          } else {
            drawCartoonMuzzleFlash(c, 22, -1.5, 6.5, '#fde047', '#ffffff');
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
        scale: 1.09,
        skin: '#f4c095',
        torsoFill: '#cbd5e1',
        torsoHighlight: '#ffffff',
        torsoShadow: '#64748b',
        pantsColor: pal.main,
        bootColor: '#451a03',
        beltColor: '#78350f',
        armColor: pal.main,
        pauldronColor: '#cbd5e1',
        swingStyle: 'thrust',
        drawHelmet: (c, hx, hy, hr) => {
          // Iconic Spanish Morion curved-crest steel helmet!
          drawCelPoly(
            c,
            [
              [hx - hr - 3, hy - 3],
              [hx - hr, hy - hr - 2],
              [hx, hy - hr - 8],
              [hx + hr, hy - hr - 2],
              [hx + hr + 5, hy - 4],
              [hx + hr + 2, hy - 1],
              [hx - hr - 4, hy - 1],
            ],
            '#cbd5e1',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.0 },
          );
          // Side feather
          drawCelEllipse(c, hx - 5, hy - hr - 3, 2.4, 5.5, pal.light, { rotation: -0.5, lineWidth: 1.4 });
        },
        drawWeapon: (c) => {
          // Extra-long Renaissance steel pike with team tassel!
          drawInkLimb(c, -14, 2, 34, -3, 3.0, '#78350f', 2.4);
          drawCelEllipse(c, 30, -1, 3, 4.5, pal.main, { lineWidth: 1.4 });
          drawCelPoly(
            c,
            [
              [31, -6.5],
              [45, -3.5],
              [31, 0],
            ],
            '#f1f5f9',
            { highlight: '#ffffff', shadow: '#64748b', lineWidth: 1.7 },
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
        scale: 1.07,
        skin: '#f4c095',
        torsoFill: pal.main,
        torsoHighlight: pal.light,
        torsoShadow: pal.dark,
        pantsColor: '#e2e8f0',
        bootColor: '#1e293b',
        beltColor: '#f8fafc',
        armColor: pal.main,
        swingStyle: 'aim',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Crossed white military bandolier + brass buttons
          setInkStyle(c, 3.0, '#f8fafc');
          c.beginPath();
          c.moveTo(tx + 2, ty + 2);
          c.lineTo(tx + tw - 2, ty + th - 3);
          c.moveTo(tx + tw - 2, ty + 2);
          c.lineTo(tx + 2, ty + th - 3);
          c.stroke();
          c.fillStyle = '#facc15';
          c.beginPath();
          c.arc(tx + tw / 2, ty + th * 0.48, 2, 0, Math.PI * 2);
          c.fill();
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Jaunty cavalier / tricorn hat with big flamboyant feather!
          drawCelEllipse(c, hx - 5, hy - hr - 5, 8, 3.2, '#f8fafc', { rotation: -0.32, lineWidth: 1.6 });
          drawCelPoly(
            c,
            [
              [hx - hr - 5, hy - 3],
              [hx - hr + 1, hy - hr - 4],
              [hx + hr, hy - hr - 3],
              [hx + hr + 6, hy - 3],
            ],
            '#1e293b',
            { highlight: '#475569', lineWidth: 2.0 },
          );
          drawCelRoundRect(c, hx - hr + 1, hy - 6, hr * 2 - 1, 2.5, 1, '#facc15', { lineWidth: 1.1 });
        },
        drawWeapon: (c, firing) => {
          // Long wooden flintlock musket + bayonet + cartoon muzzle flash
          drawCelRoundRect(c, -6, -2.5, 22, 4.6, 1.5, '#854d0e', { highlight: '#b45309', lineWidth: 1.8 });
          drawCelRoundRect(c, 2, -4.4, 24, 3.0, 1, '#94a3b8', { highlight: '#f8fafc', lineWidth: 1.6 });
          if (firing) {
            drawCartoonMuzzleFlash(c, 28, -3, 11, '#f97316', '#fef08a');
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
        scale: 1.1,
        torsoW: 17,
        skin: '#f4c095',
        torsoFill: pal.main,
        torsoHighlight: pal.light,
        torsoShadow: pal.dark,
        pantsColor: '#f1f5f9',
        bootColor: '#1e293b',
        beltColor: '#1e293b',
        armColor: pal.main,
        pauldronColor: '#facc15',
        swingStyle: 'throw',
        drawBackAccessory: (c, topY) => {
          // Grenade ammo satchel packed with black iron bombs
          drawCelRoundRect(c, -12, topY + 7, 8, 11, 2.5, '#78350f', { lineWidth: 1.7 });
          drawCelEllipse(c, -8, topY + 6, 3.5, 3.5, '#1e293b', { highlight: '#64748b', lineWidth: 1.4 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Iconic tall brass-plated 18th-century Grenadier Mitre Cap!
          drawCelPoly(
            c,
            [
              [hx - hr, hy - 3],
              [hx - hr + 2, hy - hr - 11],
              [hx + 2, hy - hr - 14],
              [hx + hr, hy - hr - 9],
              [hx + hr + 1, hy - 3],
            ],
            pal.dark,
            { lineWidth: 2.0 },
          );
          drawCelPoly(
            c,
            [
              [hx - 2, hy - 4],
              [hx + 1, hy - hr - 12],
              [hx + hr, hy - 4],
            ],
            '#facc15',
            { highlight: '#fef08a', lineWidth: 1.6 },
          );
        },
        drawWeapon: (c, firing) => {
          // Lit-fuse black iron spherical hand grenade!
          if (!firing) {
            drawCelEllipse(c, 4, -4, 6.2, 6.2, '#1e293b', {
              highlight: '#64748b',
              shadow: '#090d16',
              lineWidth: 2.0,
            });
            setInkStyle(c, 1.8, '#d97706');
            c.beginPath();
            c.moveTo(6, -10);
            c.quadraticCurveTo(10, -14, 12, -11);
            c.stroke();
            drawEnergyOrb(c, 12.5, -11, 3.4, '#f97316', '#fef08a');
          } else {
            drawCartoonMuzzleFlash(c, 8, -4, 7.5, '#f97316', '#fef08a');
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

  // Expressive green cartoon Raptor/T-Rex body
  const bodyY = -28 - bob;
  const tailWag = Math.sin(p.walkPhase * 1.3) * 4;

  // Back dino leg
  drawInkLimb(ctx, -6, bodyY + 7, -10 - stride * 9, -12, 7.5, '#15803d', 3.8);
  drawInkLimb(ctx, -10 - stride * 9, -12, -4 - stride * 11, -3, 6.2, '#166534', 3.4);
  drawCelEllipse(ctx, -1 - stride * 11, -2.5, 6, 3.2, '#166534', { lineWidth: 1.8 });

  // Swishing curved tail with jagged prehistoric ridge spikes!
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-12, bodyY + 2);
  ctx.quadraticCurveTo(-28, bodyY - 2 + tailWag, -39, bodyY - 12 + tailWag);
  ctx.quadraticCurveTo(-25, bodyY + 9 + tailWag * 0.5, -10, bodyY + 10);
  ctx.closePath();
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  setInkStyle(ctx, 2.2);
  ctx.stroke();
  ctx.restore();

  // Amber dinosaur dorsal spikes along tail & neck
  for (let sp = 0; sp < 3; sp++) {
    const sx = -16 - sp * 7;
    const sy = bodyY - 3 - sp * 2 + tailWag * (0.25 + sp * 0.25);
    drawCelPoly(
      ctx,
      [
        [sx - 3, sy + 2],
        [sx - 1, sy - 6],
        [sx + 3, sy + 2],
      ],
      '#f59e0b',
      { highlight: '#fef08a', lineWidth: 1.4 },
    );
  }

  // Main muscular dino torso + cream belly + darker dorsal stripes
  drawCelEllipse(ctx, 0, bodyY + 2, 20, 12.5, '#22c55e', {
    highlight: '#86efac',
    shadow: '#15803d',
    lineWidth: 2.3,
    rotation: -0.14,
  });
  ctx.fillStyle = 'rgba(21, 128, 61, 0.5)';
  ctx.beginPath();
  ctx.ellipse(-6, bodyY - 2, 4.5, 2.4, -0.3, 0, Math.PI * 2);
  ctx.ellipse(5, bodyY - 3, 5.2, 2.5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  drawCelEllipse(ctx, 2, bodyY + 7.5, 13, 6.2, '#fef08a', { shadow: '#eab308', lineWidth: 1.6 });

  // Saddle & team war-paint blanket with gold buckle
  drawCelRoundRect(ctx, -11, bodyY - 10, 18, 9, 3, pal.main, {
    highlight: pal.light,
    shadow: pal.dark,
    lineWidth: 2.0,
  });
  drawCelRoundRect(ctx, -5, bodyY - 4, 6, 4.5, 1, '#facc15', { highlight: '#fef08a', lineWidth: 1.2 });

  // Muscular neck + fierce snapping dino head!
  ctx.save();
  ctx.translate(15, bodyY - 6);
  ctx.rotate(-0.18 + bite * 0.35);
  drawCelRoundRect(ctx, -4, -14, 12, 16, 5, '#22c55e', { highlight: '#86efac', shadow: '#15803d', lineWidth: 2.1 });
  // Upper snout with nostril & ridge brow
  drawCelRoundRect(ctx, 2, -22, 22, 11.5, 5, '#22c55e', {
    highlight: '#86efac',
    shadow: '#15803d',
    lineWidth: 2.2,
  });
  ctx.fillStyle = '#14532d';
  ctx.beginPath();
  ctx.arc(20, -18, 1.4, 0, Math.PI * 2);
  ctx.fill();
  // Lower jaw snaps open on attack!
  ctx.save();
  ctx.translate(6, -11);
  ctx.rotate(0.08 + bite * 0.45);
  drawCelRoundRect(ctx, 0, -2, 17, 6.5, 3, '#16a34a', { lineWidth: 2.0 });
  // Sharp cartoon teeth
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(4 + i * 4.2, -2);
    ctx.lineTo(6 + i * 4.2, -6);
    ctx.lineTo(8 + i * 4.2, -2);
    ctx.fill();
  }
  ctx.restore();
  // Fierce amber dino eye
  drawCelEllipse(ctx, 10, -18, 3.2, 3.2, '#fde047', { lineWidth: 1.5 });
  ctx.fillStyle = INK;
  ctx.fillRect(10.5, -19.5, 1.8, 3.2);
  ctx.restore();

  // Front dino leg
  drawInkLimb(ctx, 4, bodyY + 8, 2 + stride * 10, -12, 8.2, '#22c55e', 3.8);
  drawInkLimb(ctx, 2 + stride * 10, -12, 8 + stride * 12, -3, 6.6, '#16a34a', 3.4);
  drawCelEllipse(ctx, 11 + stride * 12, -2.5, 6.5, 3.5, '#16a34a', { highlight: '#86efac', lineWidth: 1.8 });

  // Caveman rider perched on saddle waving tribal spear!
  ctx.save();
  ctx.translate(-3, bodyY - 7);
  drawCelRoundRect(ctx, -6, -15, 12, 14, 4, '#a16207', { highlight: '#ca8a04', lineWidth: 1.9 });
  drawCelEllipse(ctx, 1, -20, 6.2, 6, '#f2b88b', { lineWidth: 1.9 });
  drawCartoonFace(ctx, 1, -19.5, { mood: bite > 0.2 ? 'attack' : 'normal' });
  drawCelRoundRect(ctx, -6, -24, 14, 3.2, 1.2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
  // Rider spear arm
  ctx.save();
  ctx.translate(2, -11);
  ctx.rotate(-0.35 + bite * 0.75);
  drawInkLimb(ctx, 0, 0, 10, 2, 3.6, '#f2b88b', 2.4);
  drawInkLimb(ctx, -6, 3, 25, -4, 2.8, '#78350f', 2.2);
  drawCelPoly(
    ctx,
    [
      [23, -8],
      [34, -5],
      [24, -1],
    ],
    '#f1f5f9',
    { highlight: '#ffffff', lineWidth: 1.5 },
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
  // Back sandstone lion legs
  drawInkLimb(ctx, -14, y + 8, -16 - stride * 8, -3, 7, '#b45309', 3.4);
  drawInkLimb(ctx, 12, y + 8, 14 + stride * 8, -3, 7, '#b45309', 3.4);

  // Sculpted golden-sandstone lion body
  drawCelRoundRect(ctx, -23, y - 4, 44, 18, 8, '#eab308', {
    highlight: '#fef08a',
    shadow: '#a16207',
    lineWidth: 2.3,
  });

  // Sweeping gilded Falcon Wing mounted on side!
  ctx.save();
  ctx.translate(-4, y - 2);
  ctx.rotate(-0.15 - surge * 0.28);
  drawCelPoly(
    ctx,
    [
      [6, 0],
      [-18, -16],
      [-26, -8],
      [-16, -2],
      [-22, 4],
      [-6, 7],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 2.0 },
  );
  drawCelPoly(
    ctx,
    [
      [4, -1],
      [-12, -10],
      [-10, 2],
    ],
    '#facc15',
    { highlight: '#fef08a', lineWidth: 1.5 },
  );
  ctx.restore();

  // Front sandstone paws
  drawInkLimb(ctx, -10, y + 10, -8 + stride * 9, -2.5, 7.5, '#eab308', 3.4);
  drawInkLimb(ctx, 15, y + 10, 18 - stride * 9, -2.5, 7.5, '#eab308', 3.4);
  drawCelEllipse(ctx, 21 - stride * 9, -2.5, 5.5, 3, '#ca8a04', { lineWidth: 1.7 });

  // Pharaoh Nemes Sphinx Head + Glowing Solar Crest!
  drawCelPoly(
    ctx,
    [
      [11, y - 2],
      [15, y - 24],
      [27, y - 22],
      [30, y - 4],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 2.1 },
  );
  // Gold stripes on nemes
  ctx.fillStyle = '#facc15';
  ctx.fillRect(14, y - 19, 12, 2.5);
  ctx.fillRect(14, y - 13, 13, 2.5);
  // Golden sphinx face
  drawCelEllipse(ctx, 24, y - 13, 7.2, 8.2, '#facc15', {
    highlight: '#fef9c3',
    shadow: '#b45309',
    lineWidth: 2.0,
  });
  // Glowing sun eyes + crown cobra
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(27, y - 14.5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  drawEnergyOrb(ctx, 24, y - 26, surge > 0.2 ? 8.5 : 5.5, '#f59e0b', '#fef08a');

  // Rotating golden chariot wheel at rear
  drawCartoonWheel(ctx, -17, -11, 11, p.walkPhase * 1.4, '#d97706', pal.main, 6, true);
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

  // 1. Armored Classical Warhorse in front (+X side)
  const hx = 14;
  const hy = -26 - bob;
  drawInkLimb(ctx, hx - 8, hy + 6, hx - 11 - stride * 9, -2, 4.6, '#78350f', 2.8);
  drawInkLimb(ctx, hx + 8, hy + 6, hx + 11 + stride * 9, -2, 4.6, '#78350f', 2.8);
  drawCelEllipse(ctx, hx, hy + 1, 16, 9.5, '#92400e', {
    highlight: '#b45309',
    shadow: '#451a03',
    lineWidth: 2.1,
  });
  // Team barding saddlecloth
  drawCelRoundRect(ctx, hx - 9, hy - 8, 17, 10, 3, pal.main, { highlight: pal.light, lineWidth: 1.8 });
  // Horse neck & armored chamfron head
  drawCelPoly(
    ctx,
    [
      [hx + 8, hy - 2],
      [hx + 16, hy - 18],
      [hx + 27, hy - 12],
      [hx + 23, hy - 7],
      [hx + 15, hy + 2],
    ],
    '#92400e',
    { highlight: '#b45309', lineWidth: 2.0 },
  );
  // Bronze head armor + plume
  drawCelPoly(
    ctx,
    [
      [hx + 16, hy - 18],
      [hx + 27, hy - 12],
      [hx + 25, hy - 15],
      [hx + 18, hy - 20],
    ],
    '#facc15',
    { lineWidth: 1.5 },
  );
  drawCelEllipse(ctx, hx + 14, hy - 22, 5, 3, pal.light, { lineWidth: 1.5 });
  drawInkLimb(ctx, hx - 5, hy + 7, hx - 4 + stride * 10, -2, 4.8, '#b45309', 2.8);
  drawInkLimb(ctx, hx + 10, hy + 7, hx + 13 - stride * 10, -2, 4.8, '#b45309', 2.8);

  // Hitch pole connecting horse to chariot
  drawInkLimb(ctx, -10, -16, hx + 6, hy + 2, 3.2, '#78350f', 2.2);

  // 2. Chariot Rider standing inside golden-bronze cab (-X side)
  ctx.save();
  ctx.translate(-15, -21 - bob * 0.5);
  drawCelRoundRect(ctx, -6, -17, 13, 15, 4, '#d97706', { highlight: '#fde047', lineWidth: 1.9 });
  drawCelEllipse(ctx, 1, -22, 6.2, 6, '#f4c095', { lineWidth: 1.9 });
  drawCartoonFace(ctx, 1, -21.5, { mood: p.attackAnim > 0.25 ? 'attack' : 'normal' });
  // Crested helm
  drawCelEllipse(ctx, 0, -28, 8, 3.5, pal.main, { highlight: pal.light, lineWidth: 1.5 });
  drawCelEllipse(ctx, 1, -24.5, 6.8, 4.5, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.7 });
  // Thrusting chariot lance
  const thrust = p.attackAnim > 0.2 ? Math.sin(p.attackAnim * Math.PI) * 11 : 0;
  drawInkLimb(ctx, -4 + thrust, -10, 29 + thrust, -13, 3.0, '#78350f', 2.2);
  drawCelPoly(
    ctx,
    [
      [27 + thrust, -17],
      [38 + thrust, -13.5],
      [27 + thrust, -10],
    ],
    '#f1f5f9',
    { lineWidth: 1.5 },
  );
  ctx.restore();

  // 3. Gilded Chariot Cab & Scythe-Bladed Wheel
  drawCelPoly(
    ctx,
    [
      [-26, -12],
      [-26, -28],
      [-7, -30],
      [-4, -12],
    ],
    '#d97706',
    { highlight: '#fef08a', shadow: '#92400e', lineWidth: 2.2 },
  );
  drawCelRoundRect(ctx, -23, -25, 14, 9, 2, pal.main, { highlight: pal.light, lineWidth: 1.6 });
  drawCartoonWheel(ctx, -16, -13, 13, p.walkPhase * 1.5, '#92400e', '#facc15', 6, true);
  ctx.restore();
}

function drawHeavyCavalry(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const stride = p.isWalking ? Math.sin(p.walkPhase) : 0;
  const bob = p.isWalking ? Math.abs(Math.sin(p.walkPhase)) * 3.0 : 0;
  const thrust = p.attackAnim > 0.2 ? Math.sin(p.attackAnim * Math.PI) * 12 : 0;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 1.15);
    ctx.translate(-f * 6, f * 6);
  }

  const hy = -28 - bob;
  // Back armored horse legs
  drawInkLimb(ctx, -12, hy + 8, -16 - stride * 10, -2, 5.2, '#475569', 3.0);
  drawInkLimb(ctx, 11, hy + 8, 14 + stride * 10, -2, 5.2, '#475569', 3.0);

  // Flowing horse tail
  drawCelPoly(
    ctx,
    [
      [-18, hy - 2],
      [-29, hy + 5 + Math.sin(p.walkPhase) * 3],
      [-24, hy + 12],
      [-16, hy + 4],
    ],
    '#1e293b',
    { lineWidth: 1.8 },
  );

  // Destrier horse body draped in royal team caparison!
  drawCelEllipse(ctx, 0, hy + 2, 20, 11, '#f8fafc', { shadow: '#cbd5e1', lineWidth: 2.2 });
  drawCelPoly(
    ctx,
    [
      [-19, hy - 5],
      [18, hy - 5],
      [20, hy + 11],
      [10, hy + 7],
      [0, hy + 13],
      [-10, hy + 7],
      [-20, hy + 11],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 2.0 },
  );
  // Gold border hem
  setInkStyle(c_safe(ctx), 2.0, '#facc15');
  ctx.beginPath();
  ctx.moveTo(-18, hy + 8);
  ctx.lineTo(0, hy + 10);
  ctx.lineTo(18, hy + 8);
  ctx.stroke();

  // Horse armored neck & steel barding head
  drawCelPoly(
    ctx,
    [
      [11, hy - 2],
      [19, hy - 20],
      [31, hy - 12],
      [26, hy - 7],
      [17, hy + 4],
    ],
    '#cbd5e1',
    { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.1 },
  );
  drawCelEllipse(ctx, 18, hy - 22, 5.5, 3, pal.main, { highlight: pal.light, lineWidth: 1.5 });

  // Front horse legs
  drawInkLimb(ctx, -9, hy + 9, -7 + stride * 11, -2, 5.4, '#64748b', 3.0);
  drawInkLimb(ctx, 13, hy + 9, 16 - stride * 11, -2, 5.4, '#64748b', 3.0);

  // Plated Medieval Knight Rider on top!
  ctx.save();
  ctx.translate(-2, hy - 7);
  drawCartoonCape(ctx, -6, -15, 22, 16, pal.cape, pal.capeDark, p.walkPhase);
  drawCelRoundRect(ctx, -8, -17, 16, 17, 5, '#cbd5e1', {
    highlight: '#ffffff',
    shadow: '#64748b',
    lineWidth: 2.1,
  });
  // Great Helm + dramatic tall plume
  drawCelPoly(
    ctx,
    [
      [-1, -29],
      [-14, -36],
      [-16, -24],
      [-4, -27],
    ],
    pal.main,
    { highlight: pal.light, lineWidth: 1.7 },
  );
  drawCelRoundRect(ctx, -6, -31, 13, 13, 4, '#cbd5e1', {
    highlight: '#ffffff',
    shadow: '#64748b',
    lineWidth: 2.0,
  });
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, -26, 7, 2.5);

  // Couched striped jousting lance!
  drawCelPoly(
    ctx,
    [
      [-6 + thrust, -9],
      [44 + thrust, -12],
      [-6 + thrust, -14],
    ],
    '#f1f5f9',
    { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 2.0 },
  );
  // Team pennant flag fluttering near lance tip
  drawCelPoly(
    ctx,
    [
      [27 + thrust, -11],
      [18 + thrust, -6 + Math.sin(p.walkPhase * 2) * 2.5],
      [19 + thrust, -11],
    ],
    pal.main,
    { lineWidth: 1.4 },
  );
  // Kite shield on side
  drawCelPoly(
    ctx,
    [
      [-4, -14],
      [8, -14],
      [8, -3],
      [2, 5],
      [-4, -3],
    ],
    pal.main,
    { highlight: pal.light, lineWidth: 2.0 },
  );
  ctx.restore();

  ctx.restore();
}

function drawCatapult(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const dp = p.deathProgress;
  // Throwing arm snaps upright on attack!
  const throwSwing = p.attackAnim > 0.15 ? Math.sin(((p.attackAnim - 0.15) / 0.85) * Math.PI) : 0;
  const armAngle = -2.45 + throwSwing * 1.95;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 0.55);
    ctx.translate(0, f * 8);
  }

  // Heavy wooden siege chassis beam
  drawCelRoundRect(ctx, -28, -22, 56, 11, 3, '#78350f', {
    highlight: '#b45309',
    shadow: '#451a03',
    lineWidth: 2.3,
  });

  // Back upright crossbar frame
  drawCelPoly(
    ctx,
    [
      [6, -21],
      [14, -44],
      [21, -44],
      [17, -21],
    ],
    '#854d0e',
    { highlight: '#b45309', lineWidth: 2.1 },
  );
  drawCelRoundRect(ctx, 10, -45, 13, 6, 2, pal.main, { highlight: pal.light, lineWidth: 1.8 });

  // Flexing catapult throwing arm & stone bucket!
  ctx.save();
  ctx.translate(8, -21);
  ctx.rotate(armAngle);
  drawCelRoundRect(ctx, -3, -3.5, 36, 6.5, 2.5, '#a16207', { highlight: '#ca8a04', lineWidth: 2.1 });
  // Bucket cup
  drawCelRoundRect(ctx, 27, -9, 13, 12, 3, '#5c3412', { lineWidth: 2.0 });
  if (throwSwing < 0.55) {
    drawCelEllipse(ctx, 33, -7, 6.2, 5.5, '#94a3b8', {
      highlight: '#e2e8f0',
      shadow: '#475569',
      lineWidth: 1.8,
    });
  }
  ctx.restore();

  // Front A-frame timber brace + iron rivets
  drawCelPoly(
    ctx,
    [
      [-18, -21],
      [12, -40],
      [16, -34],
      [-11, -21],
    ],
    '#92400e',
    { highlight: '#b45309', lineWidth: 2.1 },
  );

  // Team heraldic side shield plate
  drawCelRoundRect(ctx, -9, -23, 18, 12, 3, pal.main, {
    highlight: pal.light,
    shadow: pal.dark,
    lineWidth: 1.9,
  });

  // Twin spoked siege wheels
  drawCartoonWheel(ctx, -18, -12, 12, p.walkPhase * 1.3, '#854d0e', '#94a3b8', 6);
  drawCartoonWheel(ctx, 18, -12, 12, p.walkPhase * 1.3, '#854d0e', '#94a3b8', 6);

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

  // Uniformed cannonier standing behind trail
  ctx.save();
  ctx.translate(-22, 0);
  drawCartoonHumanoid(ctx, {
    walkPhase: p.walkPhase,
    isWalking: p.isWalking,
    attackAnim: p.attackAnim,
    hitFlash: p.hitFlash,
    deathProgress: 0,
    scale: 0.9,
    skin: '#f4c095',
    torsoFill: pal.main,
    torsoHighlight: pal.light,
    torsoShadow: pal.dark,
    pantsColor: '#f1f5f9',
    bootColor: '#1e293b',
    swingStyle: 'throw',
    drawHelmet: (c, hx, hy, hr) => {
      drawCelPoly(
        c,
        [
          [hx - hr - 3, hy - 3],
          [hx, hy - hr - 5],
          [hx + hr + 4, hy - 3],
        ],
        '#1e293b',
        { lineWidth: 1.8 },
      );
    },
    drawWeapon: (c) => {
      drawInkLimb(c, 0, 2, 10, -8, 2.4, '#78350f', 1.8);
      if (firing) drawEnergyOrb(c, 11, -9, 3.2, '#f97316', '#fef08a');
    },
  });
  ctx.restore();

  // Wooden artillery trail carriage
  const rx = -recoil * 6;
  drawCelPoly(
    ctx,
    [
      [-18 + rx, -5],
      [14 + rx, -22],
      [18 + rx, -15],
      [-12 + rx, -2],
    ],
    '#78350f',
    { highlight: '#b45309', shadow: '#451a03', lineWidth: 2.2 },
  );

  // Gleaming tapered bronze cannon barrel with gold reinforcement rings!
  ctx.save();
  ctx.translate(4 + rx, -24);
  ctx.rotate(-0.14 - recoil * 0.14);
  drawCelPoly(
    ctx,
    [
      [-14, -6.5],
      [25, -4.5],
      [25, 4.5],
      [-14, 6.5],
    ],
    '#334155',
    { highlight: '#94a3b8', shadow: '#0f172a', lineWidth: 2.3 },
  );
  // Cascabel knob at breech & brass bands
  drawCelEllipse(ctx, -16, 0, 4.2, 4.2, '#d97706', { highlight: '#fef08a', lineWidth: 1.8 });
  drawCelRoundRect(ctx, -4, -6.4, 4.2, 12.8, 1.5, '#d97706', { highlight: '#fef08a', lineWidth: 1.5 });
  drawCelRoundRect(ctx, 18, -5.4, 4.5, 10.8, 1.5, '#d97706', { highlight: '#fef08a', lineWidth: 1.5 });
  // Team emblem plate
  drawCelEllipse(ctx, 6, 0, 3.5, 3.5, pal.main, { highlight: pal.light, lineWidth: 1.3 });

  if (firing) {
    drawCartoonMuzzleFlash(c_safe(ctx), 30, 0, 15, '#f97316', '#fef08a');
  }
  ctx.restore();

  // Large spoked artillery carriage wheel in front
  drawCartoonWheel(ctx, 5 + rx * 0.5, -14, 14, p.walkPhase * 1.4, '#854d0e', '#d97706', 8);
  ctx.restore();
}

function c_safe(ctx: CanvasRenderingContext2D): CanvasRenderingContext2D {
  return ctx;
}
