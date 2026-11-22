import {
  INK,
  drawCartoonHumanoid,
  drawCartoonMuzzleFlash,
  drawCelEllipse,
  drawCelPoly,
  drawCelRoundRect,
  drawEnergyOrb,
  drawGearWheel,
  drawRivetStrip,
  drawSculptedLimb,
  drawTankTreads,
  getTeamPalette,
  setInkStyle,
} from './cartoonPrimitives';
import type { CartoonUnitDrawParams } from './unitsEarly';

/**
 * Render Eras 6–10 Flash-Cartoon units (20 distinct designs).
 * Origin (0, 0) is bottom-center on ground, facing RIGHT (+X).
 */
export function drawLateCartoonUnit(ctx: CanvasRenderingContext2D, p: CartoonUnitDrawParams): boolean {
  const pal = getTeamPalette(p.team);

  switch (p.kind) {
    // ========================================================================
    // ERA 6: 산업·스팀펑크 (STEAMPUNK INDUSTRIAL)
    // ========================================================================
    case 'steam_trooper': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.13,
        torsoW: 18.5,
        torsoH: 19.5,
        skin: '#b45309',
        torsoFill: '#b45309',
        torsoHighlight: '#fbbf24',
        torsoShadow: '#78350f',
        pantsColor: '#451a03',
        bootColor: '#57534e',
        bootCuffColor: '#d97706',
        beltColor: '#475569',
        armColor: '#92400e',
        sleeveCuffColor: '#d97706',
        gloveColor: '#57534e',
        skirtColor: '#78350f',
        skirtTrim: '#f59e0b',
        skirtStyle: 'tassets',
        pauldronColor: '#d97706',
        pauldronTrim: pal.light,
        swingStyle: 'overhead',
        drawBackAccessory: (c, topY) => {
          // Pressurized copper steam boiler backpack + brass valves + animated rising steam puffs!
          drawCelRoundRect(c, -15.5, topY + 1, 9.5, 17.5, 3.5, '#d97706', {
            highlight: '#fef08a',
            shadow: '#92400e',
            lineWidth: 1.9,
          });
          drawRivetStrip(c, -13.5, topY + 4, -8, topY + 4, 3, 0.85);
          drawCelRoundRect(c, -13.5, topY - 6.5, 4.2, 8.5, 1.5, '#475569', { highlight: '#94a3b8', lineWidth: 1.4 });
          // Braided copper steam hose looping toward shoulder
          setInkStyle(c, 2.2, '#f59e0b');
          c.beginPath();
          c.moveTo(-7, topY + 13);
          c.quadraticCurveTo(-2, topY + 19, 3, topY + 11);
          c.stroke();
          // Animated layered steam puffs
          const drift = ((p.walkPhase * 2.5) % 6);
          drawCelEllipse(c, -13, topY - 9 - drift, 4.5, 3.2, 'rgba(241,245,249,0.88)', { lineWidth: 1.2 });
          drawCelEllipse(c, -16, topY - 13 - drift * 0.7, 3.0, 2.2, 'rgba(241,245,249,0.62)', { lineWidth: 1.0 });
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          // White steampunk brass pressure dial with red pressure needle!
          drawCelEllipse(c, tx + tw / 2, ty + 8.2, 4.5, 4.5, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.4 });
          drawCelEllipse(c, tx + tw / 2, ty + 8.2, 3.1, 3.1, '#f8fafc', { lineWidth: 1.0 });
          setInkStyle(c, 1.2, '#dc2626');
          c.beginPath();
          c.moveTo(tx + tw / 2, ty + 8.2);
          c.lineTo(tx + tw / 2 + 2.2, ty + 6.4);
          c.stroke();
          drawRivetStrip(c, tx + 3, ty + 14.5, tx + tw - 3, ty + 14.5, 4, 0.85);
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Riveted brass steampunk pressure diving-bell helm with glowing furnace visor grille!
          drawCelEllipse(c, hx + 0.5, hy - 0.5, hr + 1.9, hr + 1.6, '#d97706', {
            highlight: '#fef08a',
            shadow: '#78350f',
            lineWidth: 2.0,
          });
          drawCelEllipse(c, hx + 4.8, hy - 1, 4.7, 4.7, '#38bdf8', {
            highlight: '#ffffff',
            shadow: '#0284c7',
            lineWidth: 1.65,
          });
          // Crossed brass viewport bars
          setInkStyle(c, 1.15, '#78350f');
          c.beginPath();
          c.moveTo(hx + 1.2, hy - 1);
          c.lineTo(hx + 8.4, hy - 1);
          c.moveTo(hx + 4.8, hy - 4.6);
          c.lineTo(hx + 4.8, hy + 2.6);
          c.stroke();
          drawCelRoundRect(c, hx - hr, hy - hr - 3.2, hr * 1.85, 3.6, 1.5, pal.main, {
            highlight: pal.light,
            lineWidth: 1.35,
          });
        },
        drawWeapon: (c, firing) => {
          // Heavy pneumatic brass steam-piston warhammer with glowing exhaust vents!
          drawSculptedLimb(c, 0, 5, 3, -18, 4.4, 3.6, '#475569', { highlight: '#94a3b8', lineWidth: 1.6 });
          drawCelRoundRect(c, -6.5, -28, 20.5, 11.8, 3, '#d97706', {
            highlight: '#fef08a',
            shadow: '#78350f',
            lineWidth: 1.95,
          });
          drawRivetStrip(c, -4, -26, 8, -26, 4, 0.85);
          // Gleaming hydraulic striker face + glowing orange furnace exhaust
          drawCelRoundRect(c, 10.5, -26.5, 5.0, 8.8, 1.5, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.5 });
          drawCelEllipse(c, 2.5, -22, 3.2, 3.2, pal.main, { highlight: pal.light, lineWidth: 1.25 });
          drawEnergyOrb(c, -5.8, -22, firing ? 4.4 : 2.2, '#f97316', '#fef08a');
        },
      });
      return true;
    }

    case 'gatling_gunner': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.1,
        torsoW: 17.5,
        skin: '#f4c095',
        torsoFill: '#78350f',
        torsoHighlight: '#b45309',
        torsoShadow: '#451a03',
        pantsColor: '#334155',
        bootColor: '#1e293b',
        bootCuffColor: '#b45309',
        beltColor: '#d97706',
        armColor: pal.main,
        sleeveCuffColor: '#d97706',
        skirtColor: '#78350f',
        skirtTrim: '#d97706',
        skirtStyle: 'coat',
        mask: 'goggles',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Brass ammo hopper backpack + draped golden bullet feed belt curving forward!
          drawCelRoundRect(c, -13.5, topY + 2, 8.5, 15.5, 2.5, '#92400e', {
            highlight: '#d97706',
            shadow: '#451a03',
            lineWidth: 1.7,
          });
          drawCelRoundRect(c, -12.5, topY + 5, 6.5, 4.2, 1, pal.main, { highlight: pal.light, lineWidth: 1.15 });
          // Draped brass cartridge feed belt curving into Gatling receiver
          setInkStyle(c, 4.2, INK);
          c.beginPath();
          c.moveTo(-6, topY + 14);
          c.quadraticCurveTo(2, topY + 21, 9, topY + 11);
          c.stroke();
          setInkStyle(c, 2.4, '#facc15');
          c.stroke();
        },
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Victorian leather gunner suspenders & brass buckles
          drawCelRoundRect(c, tx + 3, ty + 1, 2.8, th - 2, 1, '#451a03', { lineWidth: 1.0 });
          drawCelRoundRect(c, tx + tw - 5.8, ty + 1, 2.8, th - 2, 1, '#451a03', { lineWidth: 1.0 });
          c.fillStyle = '#facc15';
          c.fillRect(tx + 3.2, ty + 6, 2.4, 2.4);
          c.fillRect(tx + tw - 5.6, ty + 6, 2.4, 2.4);
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Victorian leather aviator/gunner cap with ear flaps & brass trim
          drawCelEllipse(c, hx, hy - 4.2, hr + 1.3, hr * 0.74, '#5c3412', {
            highlight: '#a16207',
            shadow: '#3b180b',
            lineWidth: 1.85,
          });
          drawCelRoundRect(c, hx - hr, hy - 6.2, hr * 2 + 1.2, 3.0, 1.2, pal.main, {
            highlight: pal.light,
            lineWidth: 1.25,
          });
        },
        drawWeapon: (c, firing) => {
          // 4-barrel spinning brass rotary Gatling gun with side crank & brass hopper!
          drawCelRoundRect(c, -4.5, -5.5, 14, 9.6, 2.5, '#475569', {
            highlight: '#94a3b8',
            shadow: '#1e293b',
            lineWidth: 1.8,
          });
          // Top vertical ammo clip hopper
          drawCelRoundRect(c, 1, -11, 5.5, 6, 1.2, '#d97706', { highlight: '#fef08a', lineWidth: 1.35 });
          // Spinning multi-barrel cluster
          const spinOff = firing ? Math.sin(p.attackAnim * 32) * 0.9 : 0;
          for (let i = -1; i <= 1; i++) {
            drawCelRoundRect(c, 8.5, -2.5 + i * 3.1 + spinOff, 19, 2.5, 1, '#f59e0b', {
              highlight: '#fef9c3',
              shadow: '#92400e',
              lineWidth: 1.35,
            });
          }
          // Twin iron barrel stabilizer rings
          drawCelRoundRect(c, 14, -6.2, 3.0, 11.6, 1, '#334155', { highlight: '#94a3b8', lineWidth: 1.3 });
          drawCelRoundRect(c, 22, -6.2, 3.4, 11.6, 1, '#334155', { highlight: '#94a3b8', lineWidth: 1.35 });
          if (firing) {
            drawCartoonMuzzleFlash(c, 31, -1, 13, '#f97316', '#fef08a');
          }
        },
      });
      return true;
    }

    case 'tesla_coil_trooper': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.12,
        torsoW: 17.5,
        skin: '#f4c095',
        torsoFill: '#334155',
        torsoHighlight: '#64748b',
        torsoShadow: '#1e293b',
        pantsColor: '#1e293b',
        bootColor: '#0f172a',
        bootCuffColor: '#d97706',
        beltColor: '#d97706',
        armColor: '#475569',
        sleeveCuffColor: '#f59e0b',
        skirtColor: '#334155',
        skirtTrim: '#38bdf8',
        skirtStyle: 'coat',
        trimHighlight: '#94a3b8',
        mask: 'goggles',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Dual copper-ring Tesla Coil tower crackling with live animated lightning arcs!
          drawCelRoundRect(c, -15.5, topY + 2, 10.5, 17.5, 2.5, '#475569', {
            highlight: '#94a3b8',
            shadow: '#1e293b',
            lineWidth: 1.8,
          });
          drawSculptedLimb(c, -10.2, topY + 2, -10.2, topY - 15, 4.2, 3.2, '#d97706', {
            highlight: '#fef08a',
            lineWidth: 1.5,
          });
          drawCelEllipse(c, -10.2, topY - 5, 7.5, 2.6, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.4 });
          drawCelEllipse(c, -10.2, topY - 10.5, 6.5, 2.4, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.4 });
          drawEnergyOrb(c, -10.2, topY - 16, 4.4, '#38bdf8', '#ffffff');
          // Live animated jagged cyan lightning arc bridging coil spire toward helmet!
          const zig = Math.sin(p.walkPhase * 9) * 2.5;
          c.save();
          setInkStyle(c, 1.8, '#7dd3fc');
          c.beginPath();
          c.moveTo(-10.2, topY - 16);
          c.lineTo(-5.5, topY - 19 + zig);
          c.lineTo(-2.5, topY - 14 - zig);
          c.lineTo(1.5, topY - 16.5);
          c.stroke();
          c.restore();
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Glowing cyan capacitor tubes strapped across insulated chestplate
          drawCelRoundRect(c, tx + 3, ty + 4, tw - 6, 4.2, 1.5, '#0f172a', { lineWidth: 1.2 });
          c.fillStyle = '#38bdf8';
          c.fillRect(tx + 4.5, ty + 5.2, tw - 9, 1.8);
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Insulated dome helm + copper lightning conductor spire
          drawCelEllipse(c, hx, hy - 3.6, hr + 1.5, hr * 0.86, pal.main, {
            highlight: pal.light,
            shadow: pal.dark,
            lineWidth: 1.9,
          });
          drawCelRoundRect(c, hx - 1.5, hy - hr - 3, 3.0, 4.5, 1, '#f59e0b', { lineWidth: 1.2 });
          drawEnergyOrb(c, hx, hy - hr - 4.2, 3.2, '#38bdf8', '#ffffff');
        },
        drawWeapon: (c, firing) => {
          // Steampunk copper-coiled Tesla Arc Rifle with 3 stepped induction rings & plasma prongs!
          drawCelRoundRect(c, -6, -3.4, 26, 6.4, 2, '#334155', {
            highlight: '#94a3b8',
            shadow: '#0f172a',
            lineWidth: 1.75,
          });
          // Glowing cyan glass induction tube along top of barrel
          c.fillStyle = '#38bdf8';
          c.fillRect(2, -1.4, 17, 2.2);
          // 3 stepped brass induction rings wrapping the barrel
          drawCelRoundRect(c, 5, -6.2, 2.8, 11.8, 1.0, '#d97706', { highlight: '#fef9c3', lineWidth: 1.3 });
          drawCelRoundRect(c, 10.5, -5.6, 2.8, 10.6, 1.0, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.3 });
          drawCelRoundRect(c, 16, -4.8, 2.8, 9.0, 1.0, '#d97706', { highlight: '#fef9c3', lineWidth: 1.3 });
          // Twin copper emitter prongs + blazing cyan discharge orb at tip
          drawCelRoundRect(c, 19.5, -4.2, 5.5, 2.0, 0.8, '#f59e0b', { lineWidth: 1.1 });
          drawCelRoundRect(c, 19.5, 1.6, 5.5, 2.0, 0.8, '#f59e0b', { lineWidth: 1.1 });
          drawEnergyOrb(c, 25.5, -0.4, firing ? 7.6 : 4.2, '#38bdf8', '#ffffff');
        },
      });
      return true;
    }

    case 'steam_walker': {
      drawSteamWalker(ctx, p, pal);
      return true;
    }

    // ========================================================================
    // ERA 7: 세계대전 (WORLD WAR)
    // ========================================================================
    case 'rifleman': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.08,
        skin: '#f4c095',
        torsoFill: '#4d6b3c',
        torsoHighlight: '#72945a',
        torsoShadow: '#2f4424',
        pantsColor: '#3f5232',
        bootColor: '#292524',
        bootCuffColor: '#78716c',
        beltColor: '#78350f',
        armColor: '#4d6b3c',
        sleeveCuffColor: '#3f5232',
        skirtColor: '#4d6b3c',
        skirtTrim: '#2f4424',
        skirtStyle: 'tunic',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Canvas field rucksack with rolled wool blanket on top!
          drawCelRoundRect(c, -12.5, topY + 3, 7.5, 13, 2, '#6b705c', { highlight: '#a3b18a', lineWidth: 1.55 });
          drawCelRoundRect(c, -13, topY + 0.5, 8.5, 4.0, 1.8, '#5c3412', { highlight: '#92400e', lineWidth: 1.3 });
        },
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Webbed canvas Y-suspenders, ammo belt pouches & team shoulder patch!
          setInkStyle(c, 1.8, '#a8a29e');
          c.beginPath();
          c.moveTo(tx + 3.5, ty + 1);
          c.lineTo(tx + 3.5, ty + th - 4);
          c.moveTo(tx + tw - 3.5, ty + 1);
          c.lineTo(tx + tw - 3.5, ty + th - 4);
          c.stroke();
          drawCelRoundRect(c, tx + 2.2, ty + 3.2, tw - 4.4, 3.2, 1.1, pal.main, { highlight: pal.light, lineWidth: 1.15 });
          // Cartridge pouches above waist
          drawCelRoundRect(c, tx + 2.5, ty + th - 7.5, 4.2, 4.2, 1, '#78716c', { lineWidth: 1.0 });
          drawCelRoundRect(c, tx + tw - 6.7, ty + th - 7.5, 4.2, 4.2, 1, '#78716c', { lineWidth: 1.0 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // WWII M1 steel combat helmet with subtle camo netting mesh + team stripe!
          drawCelEllipse(c, hx + 0.3, hy - 3.6, hr + 2.3, hr * 0.86, '#3f5a32', {
            highlight: '#72945a',
            shadow: '#26381e',
            lineWidth: 1.95,
          });
          // Subtle camo netting hatch
          setInkStyle(c, 0.9, 'rgba(15, 23, 42, 0.32)');
          c.beginPath();
          c.moveTo(hx - 4, hy - hr - 1);
          c.lineTo(hx + 2, hy - 5);
          c.moveTo(hx + 4, hy - hr - 1);
          c.lineTo(hx - 2, hy - 5);
          c.stroke();
          drawCelRoundRect(c, hx - hr - 1.5, hy - 4.9, hr * 2 + 3.5, 2.6, 1, pal.main, {
            highlight: pal.light,
            lineWidth: 1.15,
          });
        },
        drawWeapon: (c, firing) => {
          // Detailed wooden bolt-action rifle + leather sling + gleaming steel bayonet!
          drawCelRoundRect(c, -6.5, -2.2, 20.5, 4.8, 1.5, '#854d0e', {
            highlight: '#ca8a04',
            shadow: '#451a03',
            lineWidth: 1.7,
          });
          drawCelRoundRect(c, 5, -4.2, 22, 2.8, 1, '#475569', { highlight: '#cbd5e1', lineWidth: 1.5 });
          // Leather rifle sling curve underneath stock
          setInkStyle(c, 1.2, '#451a03');
          c.beginPath();
          c.moveTo(-2, 2.5);
          c.quadraticCurveTo(6, 6.2, 14, 2);
          c.stroke();
          drawCelPoly(
            c,
            [
              [22.5, -1],
              [32.5, -2.5],
              [22.5, -3.8],
            ],
            '#f1f5f9',
            { highlight: '#ffffff', lineWidth: 1.25 },
          );
          if (firing) {
            drawCartoonMuzzleFlash(c, 29, -2.6, 10.5, '#f97316', '#fef08a');
          }
        },
      });
      return true;
    }

    case 'flamethrower': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.11,
        torsoW: 18,
        skin: '#94a3b8',
        torsoFill: '#475569',
        torsoHighlight: '#7c8ea6',
        torsoShadow: '#1e293b',
        pantsColor: '#334155',
        bootColor: '#1e293b',
        bootCuffColor: '#64748b',
        beltColor: '#f59e0b',
        armColor: '#475569',
        sleeveCuffColor: '#f97316',
        gloveColor: '#1e293b',
        skirtColor: '#334155',
        skirtTrim: '#f59e0b',
        skirtStyle: 'tunic',
        mask: 'gasmask',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Twin crimson pressurized napalm tanks + pressure dial + corrugated fuel hose curving to gun!
          drawCelRoundRect(c, -15.5, topY, 7.2, 18.5, 3.2, '#dc2626', {
            highlight: '#fca5a5',
            shadow: '#7f1d1d',
            lineWidth: 1.85,
          });
          drawCelRoundRect(c, -10.5, topY + 1, 6.2, 17.5, 2.8, '#ea580c', {
            highlight: '#fdba74',
            shadow: '#9a3412',
            lineWidth: 1.75,
          });
          drawCelRoundRect(c, -14.5, topY + 6.5, 10.5, 3.2, 1, '#facc15', { lineWidth: 1.2 });
          // Corrugated black rubber fuel hose linking tank bottom forward!
          setInkStyle(c, 3.0, '#1e293b');
          c.beginPath();
          c.moveTo(-8, topY + 17);
          c.quadraticCurveTo(0, topY + 23, 8, topY + 12);
          c.stroke();
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Heat-shield chest bib & hazard stripes
          drawCelRoundRect(c, tx + 3, ty + 3, tw - 6, 9, 1.5, '#334155', { highlight: '#64748b', lineWidth: 1.3 });
          c.fillStyle = '#f97316';
          c.fillRect(tx + 5, ty + 5.5, tw - 10, 2.2);
        },
        drawHelmet: (c, hx, hy, hr) => {
          drawCelEllipse(c, hx + 0.5, hy - 3.6, hr + 2.1, hr * 0.86, '#334155', {
            highlight: '#7c8ea6',
            shadow: '#0f172a',
            lineWidth: 1.9,
          });
          drawCelRoundRect(c, hx - hr - 1, hy - 5, hr * 2 + 2.6, 2.6, 1, pal.main, {
            highlight: pal.light,
            lineWidth: 1.2,
          });
        },
        drawWeapon: (c, firing) => {
          // Perforated heat-shroud steel flamethrower wand + dancing pilot flame!
          drawCelRoundRect(c, -4.5, -3.6, 24, 5.8, 1.8, '#334155', { highlight: '#94a3b8', lineWidth: 1.8 });
          // Cooling shroud vents
          c.fillStyle = '#0f172a';
          for (let v = 0; v < 4; v++) {
            c.fillRect(4 + v * 3.2, -2.0, 1.6, 2.4);
          }
          drawCelRoundRect(c, 16.5, -5.4, 6.2, 9.0, 1.5, '#f97316', { highlight: '#fef08a', lineWidth: 1.55 });
          drawEnergyOrb(c, 25, -1, firing ? 10.2 : 4.5, '#f97316', '#fef08a');
        },
      });
      return true;
    }

    case 'mortar_team': {
      drawMortarTeam(ctx, p, pal);
      return true;
    }

    case 'early_tank': {
      drawEarlyTank(ctx, p, pal);
      return true;
    }

    // ========================================================================
    // ERA 8: 현대 시대 (MODERN WARFARE)
    // ========================================================================
    case 'spec_ops': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.1,
        skin: '#d6a480',
        torsoFill: '#273449',
        torsoHighlight: '#64748b',
        torsoShadow: '#0f172a',
        pantsColor: '#334155',
        bootColor: '#1e293b',
        bootCuffColor: '#64748b',
        beltColor: '#1e293b',
        armColor: '#334155',
        sleeveCuffColor: '#64748b',
        gloveColor: '#1e293b',
        trimHighlight: '#94a3b8',
        pauldronColor: pal.main,
        pauldronTrim: pal.light,
        mask: 'nvg',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Tactical radio pack + whip antenna
          drawCelRoundRect(c, -11.5, topY + 3, 6.5, 11.5, 2, '#1e293b', { highlight: '#475569', lineWidth: 1.5 });
          setInkStyle(c, 1.4, '#94a3b8');
          c.beginPath();
          c.moveTo(-8.5, topY + 3);
          c.lineTo(-10.5, topY - 12);
          c.stroke();
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          // MOLLE ballistic plate carrier + 3 mag pouches + team flag patch!
          drawCelRoundRect(c, tx + 2.2, ty + 2.8, tw - 4.4, 12, 2, '#334155', {
            highlight: '#64748b',
            lineWidth: 1.45,
          });
          drawCelRoundRect(c, tx + 4, ty + 4.4, tw - 8, 3.0, 1, pal.light, { lineWidth: 1.05 });
          for (let m = 0; m < 3; m++) {
            drawCelRoundRect(c, tx + 3.4 + m * 3.6, ty + 9.2, 2.8, 4.4, 0.8, '#1e293b', { lineWidth: 0.9 });
          }
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Modern FAST tactical helmet + Peltor ear-pro headset + glowing NVGs!
          drawCelEllipse(c, hx + 0.2, hy - 3.4, hr + 1.9, hr * 0.86, '#273449', {
            highlight: '#64748b',
            shadow: '#0f172a',
            lineWidth: 1.9,
          });
          // Tactical ear-pro comms cup
          drawCelEllipse(c, hx - 4.2, hy + 0.5, 2.6, 3.0, '#475569', { highlight: '#94a3b8', lineWidth: 1.25 });
          drawCelRoundRect(c, hx - hr, hy - 5.2, hr * 1.5, 2.6, 1, pal.main, { highlight: pal.light, lineWidth: 1.1 });
        },
        drawWeapon: (c, firing) => {
          // Suppressed tactical SCAR/M4 carbine with Holo sight, rail grip & faint red laser beam!
          drawCelRoundRect(c, -6.5, -3.6, 18.5, 5.6, 1.5, '#1e293b', { highlight: '#64748b', lineWidth: 1.75 });
          drawCelRoundRect(c, 2, -6.8, 6.2, 3.4, 1, '#334155', { highlight: '#94a3b8', lineWidth: 1.25 });
          drawCelRoundRect(c, 11.5, -3.1, 15.5, 3.6, 1.2, '#475569', { highlight: '#cbd5e1', lineWidth: 1.5 });
          drawCelRoundRect(c, 4.5, 1.6, 4.0, 7.2, 1.2, '#0f172a', { highlight: '#475569', lineWidth: 1.3 });
          // Subtle red tactical laser sight dot projecting ahead!
          c.save();
          c.strokeStyle = 'rgba(239, 68, 68, 0.52)';
          c.lineWidth = 1.1;
          c.beginPath();
          c.moveTo(27, -1.2);
          c.lineTo(42, -1.2);
          c.stroke();
          c.restore();
          if (firing) {
            drawCartoonMuzzleFlash(c, 28.5, -1.5, 10, '#fbbf24', '#ffffff');
          }
        },
      });
      return true;
    }

    case 'at_rocket': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.11,
        torsoW: 17.5,
        skin: '#f2b88b',
        torsoFill: '#334155',
        torsoHighlight: '#64748b',
        torsoShadow: '#1e293b',
        pantsColor: '#475569',
        bootColor: '#0f172a',
        bootCuffColor: '#64748b',
        beltColor: '#1e293b',
        armColor: '#475569',
        sleeveCuffColor: '#94a3b8',
        trimHighlight: '#94a3b8',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Tactical pack with spare red-tipped AT warhead sticking out!
          drawCelRoundRect(c, -13, topY + 3, 8, 13, 2, '#334155', { highlight: '#64748b', lineWidth: 1.6 });
          drawCelRoundRect(c, -11.5, topY - 5, 4.5, 9, 1.2, '#3f6212', { lineWidth: 1.25 });
          drawCelPoly(
            c,
            [
              [-11.5, topY - 5],
              [-9.2, topY - 10],
              [-7, topY - 5],
            ],
            '#ef4444',
            { highlight: '#fca5a5', lineWidth: 1.2 },
          );
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          drawCelRoundRect(c, tx + 2.5, ty + 3, tw - 5, 10, 2, '#475569', { highlight: '#94a3b8', lineWidth: 1.35 });
          drawCelRoundRect(c, tx + 4, ty + 5, tw - 8, 2.8, 1, pal.main, { highlight: pal.light, lineWidth: 1.0 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          drawCelEllipse(c, hx + 0.5, hy - 3.3, hr + 1.9, hr * 0.86, '#334155', {
            highlight: '#64748b',
            lineWidth: 1.9,
          });
          drawCelRoundRect(c, hx - hr, hy - 4.9, hr * 2 + 1.6, 3.0, 1, pal.main, { highlight: pal.light, lineWidth: 1.25 });
        },
        drawWeapon: (c, firing) => {
          // Shoulder-mounted olive AT Rocket Launcher with optic scope, rubber bumpers & warhead!
          drawCelRoundRect(c, -18.5, -10.5, 39, 8.6, 2.5, '#3f6212', {
            highlight: '#84cc16',
            shadow: '#1a2e05',
            lineWidth: 2.0,
          });
          // Optical target sight tube mounted atop launcher
          drawCelRoundRect(c, 1, -14.2, 8.5, 4.0, 1.2, '#1e293b', { highlight: '#64748b', lineWidth: 1.3 });
          c.fillStyle = '#38bdf8';
          c.fillRect(8.2, -13.2, 1.6, 2.0);
          // Flared rear backblast exhaust cone
          drawCelPoly(
            c,
            [
              [-18.5, -10.5],
              [-24.5, -13],
              [-24.5, 0.5],
              [-18.5, -2],
            ],
            '#1e293b',
            { highlight: '#475569', lineWidth: 1.65 },
          );
          drawCelRoundRect(c, 11, -10.5, 4.2, 8.6, 1, '#facc15', { lineWidth: 1.25 });
          if (!firing) {
            drawCelPoly(
              c,
              [
                [19.5, -10.5],
                [29, -6.2],
                [19.5, -2],
              ],
              '#ef4444',
              { highlight: '#fca5a5', shadow: '#991b1b', lineWidth: 1.65 },
            );
          } else {
            drawCartoonMuzzleFlash(c, 26, -6.2, 13.5, '#f97316', '#fef08a');
            drawCartoonMuzzleFlash(c, -26.5, -6.2, 9.5, '#94a3b8', '#f8fafc');
          }
        },
      });
      return true;
    }

    case 'riot_juggernaut': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.25,
        torsoW: 21.5,
        torsoH: 21,
        skin: '#1e293b',
        torsoFill: '#334155',
        torsoHighlight: '#7c8ea6',
        torsoShadow: '#0f172a',
        pantsColor: '#1e293b',
        bootColor: '#0f172a',
        bootCuffColor: '#64748b',
        beltColor: '#475569',
        armColor: '#334155',
        sleeveCuffColor: '#94a3b8',
        gloveColor: '#1e293b',
        skirtColor: '#334155',
        skirtTrim: pal.main,
        skirtStyle: 'tassets',
        trimHighlight: '#cbd5e1',
        pauldronColor: '#475569',
        pauldronTrim: pal.light,
        mask: 'visor',
        visorColor: pal.glow,
        swingStyle: 'aim',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Heavy armored EOD blast collar + shoulder strobe beacon + chest armor plate!
          drawCelRoundRect(c, tx - 1.5, ty - 2.5, tw + 3, 6.2, 2.5, '#475569', {
            highlight: '#cbd5e1',
            shadow: '#1e293b',
            lineWidth: 1.8,
          });
          drawEnergyOrb(c, tx + 2.5, ty - 2.5, 2.2, pal.glow, '#ffffff');
          drawCelRoundRect(c, tx + 3, ty + 7, tw - 6, 8.2, 2, pal.main, {
            highlight: pal.light,
            shadow: pal.dark,
            lineWidth: 1.45,
          });
          drawRivetStrip(c, tx + 4, ty + 13.5, tx + tw - 4, ty + 13.5, 4, 0.85);
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Bolted EOD juggernaut ballistic dome with diagonal visor glare!
          drawCelRoundRect(c, hx - hr - 1.5, hy - hr - 1.8, hr * 2 + 3.8, hr * 2 + 1.8, 5, '#334155', {
            highlight: '#94a3b8',
            shadow: '#0f172a',
            lineWidth: 2.05,
          });
          drawCelRoundRect(c, hx + 1, hy - 3.2, 8.8, 4.6, 1.8, pal.glow, { highlight: '#ffffff', lineWidth: 1.45 });
          c.strokeStyle = 'rgba(255,255,255,0.85)';
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(hx + 3, hy - 2.6);
          c.lineTo(hx + 5.2, hy + 0.6);
          c.stroke();
        },
        drawOffhand: (c, sx, sy) => {
          // Towering steel-bolted ballistic Riot Shield with glowing viewport & glass reflection!
          drawCelRoundRect(c, sx - 1.2, sy - 16.5, 13.5, 31, 3.5, '#1e293b', {
            highlight: '#64748b',
            shadow: '#090d16',
            lineWidth: 2.2,
          });
          drawRivetStrip(c, sx + 0.6, sy - 14.5, sx + 0.6, sy + 12.5, 5, 0.85);
          drawCelRoundRect(c, sx + 1.8, sy - 12.2, 8.6, 5.8, 1.5, pal.glow, { highlight: '#ffffff', lineWidth: 1.45 });
          drawCelRoundRect(c, sx + 1.8, sy - 3.2, 8.6, 4.2, 1, pal.main, { highlight: pal.light, lineWidth: 1.25 });
        },
        drawWeapon: (c, firing) => {
          // Drum-fed tactical breaching auto-shotgun!
          drawCelRoundRect(c, -2.5, -3.6, 22.5, 6.4, 1.8, '#1e293b', { highlight: '#64748b', lineWidth: 1.8 });
          drawCelEllipse(c, 8.5, 4.2, 4.2, 4.2, '#334155', { highlight: '#94a3b8', lineWidth: 1.4 });
          drawCelRoundRect(c, 15.5, -4.2, 8.5, 3.4, 1, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.45 });
          if (firing) {
            drawCartoonMuzzleFlash(c, 27, -2, 12.5, '#f97316', '#fef08a');
          }
        },
      });
      return true;
    }

    case 'mbt': {
      drawModernMBT(ctx, p, pal);
      return true;
    }

    // ========================================================================
    // ERA 9: 미래 시대 (SCI-FI FUTURE — HIGH-CONTRAST TITANIUM & NEON!)
    // ========================================================================
    case 'cyborg': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.16,
        torsoW: 18.5,
        torsoH: 20,
        skin: '#cbd5e1',
        torsoFill: '#e2e8f0',
        torsoHighlight: '#ffffff',
        torsoShadow: '#64748b',
        pantsColor: '#475569',
        bootColor: '#cbd5e1',
        bootCuffColor: pal.glow,
        beltColor: pal.main,
        armColor: '#e2e8f0',
        sleeveCuffColor: pal.glow,
        gloveColor: '#334155',
        skirtColor: '#e2e8f0',
        skirtTrim: pal.glow,
        skirtStyle: 'tassets',
        trimHighlight: '#ffffff',
        pauldronColor: pal.main,
        pauldronTrim: pal.glow,
        mask: 'visor',
        visorColor: pal.glow,
        swingStyle: 'overhead',
        drawBackAccessory: (c, topY) => {
          // Twin glowing cybernetic wing-blade thrusters!
          drawCelPoly(
            c,
            [
              [-8, topY + 2],
              [-19, topY - 10],
              [-15, topY + 4],
              [-21, topY + 11],
              [-11, topY + 11],
            ],
            pal.main,
            { highlight: pal.glow, shadow: pal.dark, lineWidth: 1.75 },
          );
          setInkStyle(c, 1.5, '#ffffff');
          c.beginPath();
          c.moveTo(-10, topY + 1);
          c.lineTo(-17, topY - 8);
          c.stroke();
        },
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // Neon cyber energy conduits feeding central reactor core!
          setInkStyle(c, 1.5, pal.glow);
          c.beginPath();
          c.moveTo(tx + 2, ty + 4);
          c.lineTo(tx + tw / 2, ty + 8.5);
          c.lineTo(tx + tw - 2, ty + 4);
          c.moveTo(tx + tw / 2, ty + 8.5);
          c.lineTo(tx + tw / 2, ty + th - 4);
          c.stroke();
          drawEnergyOrb(c, tx + tw / 2, ty + 8.5, 4.0, pal.glow, '#ffffff');
        },
        drawHelmet: (c, hx, hy, hr) => {
          drawCelRoundRect(c, hx - hr - 0.5, hy - hr - 1.6, hr * 2 + 2.6, hr * 2 + 1.2, 5, '#e2e8f0', {
            highlight: '#ffffff',
            shadow: '#64748b',
            lineWidth: 1.95,
          });
          // Swept glowing neon cyber visor + cybernetic ear antenna fin
          drawCelPoly(
            c,
            [
              [hx - hr, hy - 3],
              [hx - hr - 4.5, hy - 10],
              [hx - hr + 2, hy - 5],
            ],
            pal.glow,
            { highlight: '#ffffff', lineWidth: 1.2 },
          );
          drawCelPoly(
            c,
            [
              [hx - 1, hy - 4.2],
              [hx + hr + 2.4, hy - 2.6],
              [hx + hr + 1.2, hy + 2.2],
              [hx + 1, hy + 1.6],
            ],
            pal.glow,
            { highlight: '#ffffff', lineWidth: 1.45 },
          );
        },
        drawWeapon: (c) => {
          // Blazing twin-edge high-tech Plasma Katana with emitter guard & white-hot inner core!
          drawCelRoundRect(c, -2.5, -4.5, 7.0, 8.5, 1.8, '#334155', { highlight: '#cbd5e1', lineWidth: 1.5 });
          drawCelRoundRect(c, -5.5, -5.8, 12.5, 3.0, 1.2, '#e2e8f0', { highlight: '#ffffff', lineWidth: 1.3 });
          c.save();
          c.shadowColor = pal.glow;
          c.shadowBlur = 10;
          drawCelPoly(
            c,
            [
              [-1.2, -5.5],
              [4.2, -5.5],
              [6.0, -28],
              [1.5, -35],
              [-1.8, -27],
            ],
            pal.glow,
            { highlight: '#ffffff', lineWidth: 1.6, ink: pal.dark },
          );
          c.fillStyle = '#ffffff';
          c.fillRect(0.6, -29, 1.8, 22);
          c.restore();
        },
      });
      return true;
    }

    case 'hover_drone': {
      drawHoverDrone(ctx, p, pal);
      return true;
    }

    case 'railgun_sniper': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.13,
        torsoW: 17,
        skin: '#475569',
        torsoFill: '#334155',
        torsoHighlight: '#94a3b8',
        torsoShadow: '#1e293b',
        pantsColor: '#1e293b',
        bootColor: '#64748b',
        bootCuffColor: pal.glow,
        beltColor: '#475569',
        capeColor: pal.main,
        capeDark: '#1e293b',
        armColor: '#475569',
        sleeveCuffColor: pal.glow,
        gloveColor: '#cbd5e1',
        skirtColor: '#334155',
        skirtTrim: pal.glow,
        skirtStyle: 'coat',
        trimHighlight: '#e2e8f0',
        pauldronColor: '#cbd5e1',
        pauldronTrim: pal.glow,
        mask: 'visor',
        visorColor: pal.glow,
        swingStyle: 'aim',
        drawTorsoDetail: (c, tx, ty, tw, th) => {
          // High-contrast titanium-silver chest armor strips + glowing neon power cells!
          drawCelRoundRect(c, tx + 2.5, ty + 2.5, tw - 5, 11, 2, '#64748b', {
            highlight: '#e2e8f0',
            shadow: '#1e293b',
            lineWidth: 1.3,
          });
          c.fillStyle = pal.glow;
          c.fillRect(tx + 4.5, ty + 5, tw - 9, 2.2);
          c.fillRect(tx + 5.5, ty + th - 7, tw - 11, 1.8);
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Bright silver-rimmed cyber recon hood + glowing holographic sniper target lens!
          drawCelPoly(
            c,
            [
              [hx - hr - 3.5, hy + 3.2],
              [hx - hr - 2.2, hy - hr - 3.2],
              [hx + 3.2, hy - hr - 4.4],
              [hx + hr + 2.4, hy - 3],
              [hx + 2, hy + 4.2],
            ],
            '#334155',
            { highlight: '#cbd5e1', shadow: '#0f172a', lineWidth: 1.9 },
          );
          // Neon hood edge accent so sniper pops dramatically against dark Era 9 skyline!
          setInkStyle(c, 1.5, pal.glow);
          c.beginPath();
          c.moveTo(hx - hr - 2, hy - hr - 2.5);
          c.lineTo(hx + 3.2, hy - hr - 3.8);
          c.lineTo(hx + hr + 2, hy - 2.6);
          c.stroke();
          drawEnergyOrb(c, hx + 5.0, hy - 1.5, 3.2, pal.glow, '#ffffff');
        },
        drawWeapon: (c, firing) => {
          // Ultra-long twin-rail electromagnetic Railgun with 3 glowing accelerator coils & targeting beam!
          drawCelRoundRect(c, -8.5, -4.6, 20.5, 7.2, 2, '#475569', {
            highlight: '#e2e8f0',
            shadow: '#1e293b',
            lineWidth: 1.8,
          });
          drawCelRoundRect(c, 10, -6.0, 26, 2.8, 1, '#e2e8f0', { highlight: '#ffffff', lineWidth: 1.45 });
          drawCelRoundRect(c, 10, -0.4, 26, 2.8, 1, '#e2e8f0', { highlight: '#ffffff', lineWidth: 1.45 });
          c.fillStyle = pal.glow;
          c.fillRect(11, -3.2, 24, 2.8);
          // 3 glowing magnetic capacitor rings along barrel
          for (let r = 0; r < 3; r++) {
            drawCelRoundRect(c, 14 + r * 7, -7.2, 2.6, 11.2, 0.8, pal.main, { highlight: pal.glow, lineWidth: 1.1 });
          }
          // Subtle targeting laser sight line
          c.save();
          c.strokeStyle = pal.glowSoft;
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(36, -1.8);
          c.lineTo(54, -1.8);
          c.stroke();
          c.restore();
          if (firing) {
            drawEnergyOrb(c, 37, -1.8, 8.2, pal.glow, '#ffffff');
          }
        },
      });
      return true;
    }

    case 'colossus_mech': {
      drawColossusMech(ctx, p, pal);
      return true;
    }

    // ========================================================================
    // ERA 10: 성간 문명 (INTERSTELLAR COSMIC — RADIANT GOLD & STARLIGHT!)
    // ========================================================================
    case 'void_templar': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.2,
        torsoW: 19.5,
        torsoH: 20,
        skin: '#1e1b4b',
        torsoFill: '#2e1065',
        torsoHighlight: '#7c3aed',
        torsoShadow: '#09071a',
        pantsColor: '#1e1b4b',
        bootColor: '#f59e0b',
        bootCuffColor: '#fef08a',
        beltColor: '#facc15',
        armColor: '#4c1d95',
        sleeveCuffColor: '#facc15',
        gloveColor: '#f59e0b',
        skirtColor: pal.main,
        skirtTrim: '#facc15',
        skirtStyle: 'tunic',
        trimHighlight: '#fef08a',
        capeColor: pal.main,
        capeDark: '#312e81',
        pauldronColor: '#f59e0b',
        pauldronTrim: '#fef9c3',
        mask: 'visor',
        visorColor: '#facc15',
        swingStyle: 'overhead',
        drawBackAccessory: (c, topY) => {
          // Floating golden cosmic halo + 4 orbiting diamond rune shards!
          c.save();
          c.translate(0, topY - 12);
          setInkStyle(c, 3.6, INK);
          c.beginPath();
          c.ellipse(0, 0, 14, 14, 0, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = '#facc15';
          c.lineWidth = 2.0;
          c.stroke();
          const orbit = p.walkPhase * 0.7;
          for (let i = 0; i < 4; i++) {
            const a = orbit + (i / 4) * Math.PI * 2;
            drawCelEllipse(c, Math.cos(a) * 14, Math.sin(a) * 14, 2.2, 2.2, '#fef08a', { lineWidth: 1.0 });
          }
          c.restore();
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Intricate golden celestial chest filigree framing pulsing cosmic gem!
          setInkStyle(c, 1.5, '#facc15');
          c.beginPath();
          c.moveTo(tx + 2, ty + 2);
          c.lineTo(tx + tw / 2, ty + 14);
          c.lineTo(tx + tw - 2, ty + 2);
          c.stroke();
          drawEnergyOrb(c, tx + tw / 2, ty + 8, 4.2, '#c084fc', '#fef08a');
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Gilded obsidian space-paladin crown helm with glowing gold crest wings!
          drawCelPoly(
            c,
            [
              [hx - hr - 1, hy + 4.2],
              [hx - hr - 2.2, hy - 4],
              [hx + 1, hy - hr - 7.5],
              [hx + hr + 2.2, hy - 3],
              [hx + hr, hy + 5],
            ],
            '#2e1065',
            { highlight: '#7c3aed', shadow: '#09071a', lineWidth: 1.95 },
          );
          drawCelPoly(
            c,
            [
              [hx - 2.5, hy - hr - 5],
              [hx + 1, hy - hr - 11.5],
              [hx + 4.5, hy - hr - 5],
            ],
            '#facc15',
            { highlight: '#fef9c3', lineWidth: 1.45 },
          );
          drawCelRoundRect(c, hx + 1, hy - 3.3, 8.6, 3.6, 1.5, '#fef08a', { highlight: '#ffffff', lineWidth: 1.3 });
        },
        drawWeapon: (c) => {
          // Radiant violet-gold psionic cosmic greatsword with floating crystal pommel!
          drawEnergyOrb(c, 1, 7, 2.8, '#e879f9', '#fef08a');
          drawCelRoundRect(c, -6, -4.4, 14, 4.4, 1.4, '#facc15', { highlight: '#fef9c3', lineWidth: 1.55 });
          c.save();
          c.shadowColor = '#c084fc';
          c.shadowBlur = 9;
          drawCelPoly(
            c,
            [
              [-2.8, -4.4],
              [4.8, -4.4],
              [7.2, -29],
              [1, -38],
              [-5.2, -29],
            ],
            '#a855f7',
            { highlight: '#f5d0fe', shadow: '#581c87', lineWidth: 1.9 },
          );
          c.fillStyle = '#fef9c3';
          c.fillRect(0, -31, 2.2, 24);
          c.restore();
        },
      });
      return true;
    }

    case 'gravity_sniper': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.15,
        skin: '#1e1b4b',
        torsoFill: '#312e81',
        torsoHighlight: '#6366f1',
        torsoShadow: '#09071a',
        pantsColor: '#1e1b4b',
        bootColor: '#f59e0b',
        bootCuffColor: '#fef08a',
        beltColor: '#facc15',
        capeColor: '#6d28d9',
        capeDark: '#1e1b4b',
        armColor: '#4338ca',
        sleeveCuffColor: '#facc15',
        gloveColor: '#f59e0b',
        skirtColor: '#4c1d95',
        skirtTrim: '#facc15',
        skirtStyle: 'coat',
        trimHighlight: '#facc15',
        pauldronColor: pal.main,
        pauldronTrim: '#facc15',
        mask: 'visor',
        visorColor: '#e879f9',
        swingStyle: 'aim',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Golden astrolabe chest emblem + starlight veins!
          drawCelEllipse(c, tx + tw / 2, ty + 8, 4.4, 4.4, '#facc15', { highlight: '#fef9c3', lineWidth: 1.25 });
          drawEnergyOrb(c, tx + tw / 2, ty + 8, 2.2, '#e879f9', '#ffffff');
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Crowned gold-trimmed cosmic hood + blazing twin-star visor!
          drawCelPoly(
            c,
            [
              [hx - hr - 3.2, hy + 4],
              [hx - hr - 3.2, hy - hr - 4.2],
              [hx + 4.2, hy - hr - 6.5],
              [hx + hr + 3.2, hy - 2],
              [hx + 2, hy + 5],
            ],
            '#312e81',
            { highlight: '#818cf8', shadow: '#09071a', lineWidth: 1.9 },
          );
          setInkStyle(c, 1.6, '#facc15');
          c.beginPath();
          c.moveTo(hx - hr - 2.8, hy - hr - 3.6);
          c.lineTo(hx + 4.2, hy - hr - 5.8);
          c.lineTo(hx + hr + 2.8, hy - 1.8);
          c.stroke();
          drawEnergyOrb(c, hx + 5.2, hy - 1.5, 3.4, '#e879f9', '#ffffff');
        },
        drawWeapon: (c, firing) => {
          // Levitating graviton-ring dark-matter accelerator cannon with tilted rotating astrolabe rings!
          drawCelRoundRect(c, -6.5, -4.6, 20, 7.2, 2, '#312e81', {
            highlight: '#818cf8',
            shadow: '#09071a',
            lineWidth: 1.85,
          });
          // Glowing violet beam channel linking receiver to floating rings
          c.fillStyle = '#e879f9';
          c.fillRect(13, -2.1, 20, 2.2);
          const tilt = Math.sin(p.walkPhase * 2.2) * 0.28;
          drawCelEllipse(c, 18.5, -1, 3.4, 7.8, '#facc15', { highlight: '#fef9c3', rotation: tilt, lineWidth: 1.5 });
          drawCelEllipse(c, 26.5, -1, 2.8, 6.2, '#facc15', { highlight: '#fef9c3', rotation: -tilt, lineWidth: 1.45 });
          drawEnergyOrb(c, 34, -1, firing ? 9.2 : 5.2, '#c084fc', '#fef9c3');
        },
      });
      return true;
    }

    case 'star_archon': {
      drawStarArchon(ctx, p, pal);
      return true;
    }

    case 'omega_titan': {
      drawOmegaTitan(ctx, p, pal);
      return true;
    }

    // ========================================================================
    // ERA 12: 초월 문명 (CHRONO-ASCENDANT QUANTUM ERA — NEW FUTURE ENDGAME!)
    // ========================================================================
    case 'chrono_blade': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.15,
        torsoW: 17.5,
        torsoH: 19.5,
        skin: '#f8fafc',
        torsoFill: '#f8fafc',
        torsoHighlight: '#ffffff',
        torsoShadow: '#94a3b8',
        pantsColor: '#0f766e',
        bootColor: '#f59e0b',
        bootCuffColor: '#fef9c3',
        beltColor: '#f59e0b',
        armColor: '#e2e8f0',
        sleeveCuffColor: '#facc15',
        gloveColor: '#f59e0b',
        skirtColor: '#f8fafc',
        skirtTrim: '#facc15',
        skirtStyle: 'tassets',
        pauldronColor: '#f59e0b',
        pauldronTrim: '#2dd4bf',
        trimHighlight: '#2dd4bf',
        capeColor: pal.main,
        capeDark: pal.dark,
        mask: 'visor',
        visorColor: '#2dd4bf',
        swingStyle: 'overhead',
        drawBackAccessory: (c, topY) => {
          // Twin floating luminous Chrono-Prism Valkyrie Crystal Wings!
          const flutter = Math.sin(p.walkPhase * 1.8) * 3.2;
          drawCelPoly(
            c,
            [
              [-6, topY + 3],
              [-25, topY - 14 + flutter],
              [-16, topY + 2 + flutter * 0.5],
              [-22, topY + 11 + flutter * 0.4],
              [-5, topY + 12],
            ],
            '#2dd4bf',
            { highlight: '#ffffff', shadow: '#0f766e', lineWidth: 1.6 },
          );
          // Golden wing-frame spine
          setInkStyle(c, 1.8, '#facc15');
          c.beginPath();
          c.moveTo(-6, topY + 4);
          c.lineTo(-22, topY - 11 + flutter);
          c.stroke();
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Golden V-chevron breastplate filigree + glowing cyan chrono heart diamond!
          drawCelPoly(
            c,
            [
              [tx + 2, ty + 2],
              [tx + tw / 2, ty + 13],
              [tx + tw - 2, ty + 2],
              [tx + tw - 4.5, ty + 2],
              [tx + tw / 2, ty + 9.5],
              [tx + 4.5, ty + 2],
            ],
            '#f59e0b',
            { highlight: '#fef9c3', lineWidth: 1.1 },
          );
          drawEnergyOrb(c, tx + tw / 2, ty + 6.5, 3.6, '#2dd4bf', '#ffffff');
        },
        drawHelmet: (c, hx, hy) => {
          // Angelic Pearl-White & Gold Winged Valkyrie Crown Helm + mini Chrono-Halo!
          c.strokeStyle = '#facc15';
          c.lineWidth = 2.0;
          c.beginPath();
          c.ellipse(hx, hy - 15.5, 8.5, 2.8, 0, 0, Math.PI * 2);
          c.stroke();
          drawCelPoly(
            c,
            [
              [hx - 9, hy - 1],
              [hx - 7.5, hy - 11],
              [hx + 1, hy - 14],
              [hx + 9.5, hy - 9],
              [hx + 10, hy - 1],
            ],
            '#f8fafc',
            { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 1.85 },
          );
          // Swept golden Valkyrie ear-wings
          drawCelPoly(
            c,
            [
              [hx - 2, hy - 6],
              [hx - 15, hy - 14],
              [hx - 11, hy - 5],
              [hx - 3, hy - 2],
            ],
            '#f59e0b',
            { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.45 },
          );
          drawCelEllipse(c, hx + 4, hy - 10, 2.2, 2.2, '#2dd4bf', { highlight: '#ffffff', lineWidth: 1.0 });
        },
        drawWeapon: (c) => {
          // Blazing Chrono-Prism Energy Greatsword with floating golden clock-ring crossguard!
          drawCelRoundRect(c, -4, -2, 8, 4, 1.4, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.3 });
          drawCelEllipse(c, 5, 0, 3.2, 7.2, '#facc15', { highlight: '#ffffff', lineWidth: 1.4 });
          drawEnergyOrb(c, 5, 0, 2.8, '#2dd4bf', '#ffffff');
          // Twin-edged luminous cyan-gold crystalline blade
          drawCelPoly(
            c,
            [
              [7, -4.4],
              [27, -3.2],
              [34, 0],
              [27, 3.2],
              [7, 4.4],
            ],
            '#2dd4bf',
            { highlight: '#ffffff', shadow: '#0f766e', lineWidth: 1.75 },
          );
          c.fillStyle = '#fef9c3';
          c.beginPath();
          c.moveTo(9, -1.6);
          c.lineTo(31, 0);
          c.lineTo(9, 1.6);
          c.closePath();
          c.fill();
        },
      });
      return true;
    }

    case 'quantum_weaver': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.13,
        torsoW: 16.5,
        torsoH: 19,
        skin: '#0f766e',
        torsoFill: '#0f766e',
        torsoHighlight: '#2dd4bf',
        torsoShadow: '#083344',
        pantsColor: '#134e4a',
        bootColor: '#f59e0b',
        bootCuffColor: '#fef9c3',
        beltColor: '#facc15',
        armColor: '#f8fafc',
        sleeveCuffColor: '#f59e0b',
        gloveColor: '#f59e0b',
        skirtColor: '#f8fafc',
        skirtTrim: '#f59e0b',
        skirtStyle: 'coat',
        pauldronColor: '#f8fafc',
        pauldronTrim: '#facc15',
        trimHighlight: '#fef08a',
        capeColor: '#f8fafc',
        capeDark: '#94a3b8',
        mask: 'visor',
        visorColor: '#fef08a',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Floating spinning golden Chrono-Halo behind shoulders!
          const spin = p.walkPhase * 0.9;
          c.save();
          c.translate(-8, topY + 3);
          c.rotate(spin);
          c.strokeStyle = '#facc15';
          c.lineWidth = 2.0;
          c.beginPath();
          c.arc(0, 0, 10.5, 0, Math.PI * 2);
          c.stroke();
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2;
            c.fillStyle = '#2dd4bf';
            c.beginPath();
            c.arc(Math.cos(a) * 10.5, Math.sin(a) * 10.5, 2.0, 0, Math.PI * 2);
            c.fill();
          }
          c.restore();
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Pearl-gold diamond collar & glowing quantum core
          drawCelPoly(
            c,
            [
              [tx + tw / 2, ty + 2],
              [tx + tw - 2.5, ty + 9],
              [tx + tw / 2, ty + 16],
              [tx + 2.5, ty + 9],
            ],
            '#f59e0b',
            { highlight: '#fef9c3', lineWidth: 1.3 },
          );
          drawEnergyOrb(c, tx + tw / 2, ty + 9, 3.2, '#2dd4bf', '#ffffff');
        },
        drawHelmet: (c, hx, hy) => {
          // Angular Pearl-White & Gold Quantum Oracle Cowl with floating diamond diadem!
          drawCelPoly(
            c,
            [
              [hx - 10, hy + 1],
              [hx - 9, hy - 12.5],
              [hx + 2, hy - 15.5],
              [hx + 10.5, hy - 9.5],
              [hx + 9.5, hy + 1],
            ],
            '#f8fafc',
            { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 1.9 },
          );
          // Gold crown ridge & recessed teal visor face
          drawCelPoly(
            c,
            [
              [hx - 2, hy - 15.5],
              [hx + 2, hy - 20],
              [hx + 6, hy - 14.5],
            ],
            '#facc15',
            { highlight: '#ffffff', lineWidth: 1.3 },
          );
          drawCelPoly(
            c,
            [
              [hx - 2, hy - 8],
              [hx + 9.5, hy - 8],
              [hx + 9, hy + 0.5],
              [hx - 2, hy + 0.5],
            ],
            '#083344',
            { lineWidth: 1.4 },
          );
          drawEnergyOrb(c, hx + 4.5, hy - 3.8, 3.2, '#2dd4bf', '#fef9c3');
        },
        drawWeapon: (c) => {
          // Levitating Quantum Prism Beam Rifle with twin counter-tilted golden Chrono-Rings!
          drawCelRoundRect(c, -4, -3.2, 24, 6.4, 2.2, '#f8fafc', {
            highlight: '#ffffff',
            shadow: '#64748b',
            lineWidth: 1.75,
          });
          drawCelRoundRect(c, 1, -1.6, 18, 3.2, 1, '#0f766e', { lineWidth: 1.0 });
          // Twin golden focusing gyroscope rings
          drawCelEllipse(c, 15, 0, 2.6, 8.2, '#facc15', { highlight: '#ffffff', lineWidth: 1.35 });
          drawCelEllipse(c, 22, 0, 2.2, 6.4, '#2dd4bf', { highlight: '#ffffff', lineWidth: 1.25 });
          drawEnergyOrb(c, 27, 0, p.attackAnim > 0.45 ? 7.8 : 4.4, '#2dd4bf', '#fef9c3');
          if (p.attackAnim > 0.45) {
            c.strokeStyle = 'rgba(45, 212, 191, 0.9)';
            c.lineWidth = 2.0;
            c.beginPath();
            c.moveTo(29, 0);
            c.lineTo(44, 0);
            c.stroke();
          }
        },
      });
      return true;
    }

    case 'aegis_seraph': {
      drawAegisSeraph(ctx, p, pal);
      return true;
    }

    case 'chrono_sovereign': {
      drawChronoSovereign(ctx, p, pal);
      return true;
    }

    default:
      return false;
  }
}

// ============================================================================
// BESPOKE LATE-ERA WAR MACHINES, DRONES & TITAN MECHS (ERAS 6–10)
// ============================================================================

function drawSteamWalker(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const stride = p.isWalking ? Math.sin(p.walkPhase) : 0;
  const bob = p.isWalking ? Math.abs(Math.sin(p.walkPhase)) * 3.2 : 0;
  const recoil = p.attackAnim > 0.35 ? Math.sin(((p.attackAnim - 0.35) / 0.65) * Math.PI) : 0;
  const firing = p.attackAnim > 0.45 && p.attackAnim < 0.85;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 1.1);
    ctx.translate(-f * 6, f * 8);
  }

  const hipY = -30 - bob;
  // Back sculpted hydraulic steel mech leg with chrome piston rod!
  drawSculptedLimb(ctx, -6, hipY + 4, -14 - stride * 10, -16, 11.2, 8.2, '#78350f', {
    highlight: '#b45309',
    shadow: '#451a03',
    piston: true,
    lineWidth: 2.0,
  });
  drawSculptedLimb(ctx, -14 - stride * 10, -16, -6 - stride * 12, -3.5, 9.0, 6.8, '#475569', {
    highlight: '#94a3b8',
    shadow: '#1e293b',
    cuffColor: '#d97706',
    lineWidth: 1.9,
  });
  drawCelEllipse(ctx, -14 - stride * 10, -16, 4.4, 4.4, '#d97706', { highlight: '#fef08a', lineWidth: 1.6 });
  drawCelRoundRect(ctx, -15 - stride * 12, -7.5, 18, 7.5, 2.5, '#334155', { highlight: '#64748b', lineWidth: 1.9 });

  // Dual riveted smoking brass chimney stacks on rear puffing layered steam rings!
  drawCelRoundRect(ctx, -24, hipY - 34, 8, 22, 2, '#334155', { highlight: '#64748b', lineWidth: 1.9 });
  drawCelRoundRect(ctx, -20, hipY - 39, 10, 27, 2.5, '#475569', { highlight: '#94a3b8', lineWidth: 2.0 });
  drawCelRoundRect(ctx, -22, hipY - 42, 14, 5, 1.5, '#d97706', { highlight: '#fef08a', lineWidth: 1.7 });
  const drift = ((p.walkPhase * 4.2) % 9);
  drawCelEllipse(ctx, -15.5, hipY - 47 - drift, 6.5, 4.5, 'rgba(226, 232, 240, 0.85)', { lineWidth: 1.3 });
  drawCelEllipse(ctx, -20, hipY - 52 - drift * 0.8, 4.5, 3.2, 'rgba(226, 232, 240, 0.55)', { lineWidth: 1.1 });

  // Front sculpted hydraulic mech leg with chrome piston rod & armored knee cap!
  drawSculptedLimb(ctx, 6, hipY + 4, 0 + stride * 11, -16, 11.8, 8.6, '#b45309', {
    highlight: '#f59e0b',
    shadow: '#78350f',
    piston: true,
    lineWidth: 2.05,
  });
  drawSculptedLimb(ctx, 0 + stride * 11, -16, 8 + stride * 13, -3.5, 9.5, 7.2, '#64748b', {
    highlight: '#cbd5e1',
    shadow: '#334155',
    cuffColor: '#f59e0b',
    lineWidth: 1.95,
  });
  drawCelEllipse(ctx, 0 + stride * 11, -16, 4.8, 4.8, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.65 });
  drawCelRoundRect(ctx, -1 + stride * 13, -7.5, 19, 7.5, 2.5, '#475569', { highlight: '#cbd5e1', lineWidth: 1.95 });

  // Spherical riveted copper boiler cabin with armored dome seam!
  drawCelEllipse(ctx, 0, hipY - 12, 22.5, 20.5, '#d97706', {
    highlight: '#fef08a',
    shadow: '#92400e',
    lineWidth: 2.35,
  });
  drawRivetStrip(ctx, -15, hipY - 1.5, 13, hipY - 1.5, 6, 1.25);
  // Team painted armor brow + bolted cyan glass pilot porthole with diagonal glare
  drawCelRoundRect(ctx, -13, hipY - 25, 25, 10, 3, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.85 });
  drawCelEllipse(ctx, 13.5, hipY - 14, 7.0, 7.0, '#b45309', { highlight: '#fef08a', lineWidth: 1.65 });
  drawCelEllipse(ctx, 13.5, hipY - 14, 5.2, 5.2, '#38bdf8', { highlight: '#ffffff', shadow: '#0369a1', lineWidth: 1.5 });
  // Counter-rotating meshed toothed brass clockwork gears on hull side!
  drawGearWheel(ctx, -9.5, hipY - 7, 8.2, p.walkPhase * 1.4, 8, '#facc15', '#fef08a', '#b45309');
  drawGearWheel(ctx, 1.5, hipY - 15.5, 5.2, -p.walkPhase * 2.1, 6, '#f59e0b', '#fef9c3', '#92400e');

  // Heavy side-mounted brass steampunk recoil siege cannon!
  const rx = -recoil * 6.5;
  drawCelRoundRect(ctx, 7 + rx, hipY - 7.5, 28, 10.5, 3, '#334155', {
    highlight: '#94a3b8',
    shadow: '#0f172a',
    lineWidth: 2.1,
  });
  drawRivetStrip(ctx, 10 + rx, hipY - 5, 22 + rx, hipY - 5, 4, 0.95);
  drawCelRoundRect(ctx, 25 + rx, hipY - 9, 6.2, 13.5, 1.5, '#d97706', { highlight: '#fef9c3', lineWidth: 1.65 });
  if (firing) {
    drawCartoonMuzzleFlash(ctx, 41 + rx, hipY - 2, 16.5, '#f97316', '#fef08a');
  }

  ctx.restore();
}

function drawMortarTeam(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const firing = p.attackAnim > 0.4 && p.attackAnim < 0.85;
  const recoil = p.attackAnim > 0.3 ? Math.sin(((p.attackAnim - 0.3) / 0.7) * Math.PI) : 0;

  ctx.save();
  ctx.save();
  ctx.translate(-13, 0);
  drawCartoonHumanoid(ctx, {
    walkPhase: p.walkPhase,
    isWalking: p.isWalking,
    attackAnim: p.attackAnim,
    hitFlash: p.hitFlash,
    deathProgress: p.deathProgress,
    scale: 1.0,
    skin: '#f4c095',
    torsoFill: '#4d6b3c',
    torsoHighlight: '#72945a',
    torsoShadow: '#2f4424',
    pantsColor: '#3f5232',
    bootColor: '#292524',
    beltColor: '#78350f',
    armColor: '#4d6b3c',
    skirtColor: '#4d6b3c',
    skirtStyle: 'tunic',
    swingStyle: 'throw',
    drawHelmet: (c, hx, hy, hr) => {
      drawCelEllipse(c, hx + 0.3, hy - 3.5, hr + 2.1, hr * 0.84, '#3f5a32', { highlight: '#72945a', lineWidth: 1.9 });
      drawCelRoundRect(c, hx - hr - 1, hy - 4.8, hr * 2 + 2.6, 2.6, 1, pal.main, { highlight: pal.light, lineWidth: 1.2 });
    },
    drawWeapon: (c) => {
      if (!firing) {
        // Finned iron mortar bomb held ready to drop!
        drawCelEllipse(c, 5, -4, 4.4, 6.2, '#475569', { highlight: '#cbd5e1', shadow: '#1e293b', lineWidth: 1.55 });
        drawCelRoundRect(c, 2.8, -10.2, 4.4, 2.2, 0.8, '#facc15', { lineWidth: 1.0 });
      }
    },
  });
  ctx.restore();

  if (p.deathProgress < 0.4) {
    const mx = 10;
    const drop = recoil * 3.5;
    // Spare upright finned mortar rounds stacked behind baseplate
    drawCelEllipse(ctx, mx - 11.5, -5.5, 2.4, 5.2, '#475569', { highlight: '#94a3b8', lineWidth: 1.2 });
    drawCelEllipse(ctx, mx - 7.5, -5.5, 2.4, 5.2, '#475569', { highlight: '#94a3b8', lineWidth: 1.2 });

    // Heavy ribbed baseplate + adjustable steel bipod legs
    drawCelRoundRect(ctx, mx - 8.5, -5.2, 17, 5.2, 2, '#334155', { highlight: '#64748b', lineWidth: 1.75 });
    drawSculptedLimb(ctx, mx + 6, -18.5, mx + 12.5, -2, 3.2, 2.6, '#475569', { highlight: '#94a3b8', lineWidth: 1.45 });
    drawSculptedLimb(ctx, mx + 4, -18.5, mx + 8.5, -2, 2.8, 2.2, '#334155', { lineWidth: 1.35 });

    // Olive heavy siege mortar tube with team identification ring
    ctx.save();
    ctx.translate(mx - 2, -5 + drop);
    ctx.rotate(-0.82);
    drawCelRoundRect(ctx, -3.5, -4.8, 27, 9.6, 2.6, '#3f5a32', {
      highlight: '#72945a',
      shadow: '#1e2e17',
      lineWidth: 2.1,
    });
    drawCelRoundRect(ctx, 18.5, -5.4, 5.2, 10.8, 1.5, pal.main, { highlight: pal.light, lineWidth: 1.45 });
    if (firing) {
      drawCartoonMuzzleFlash(ctx, 28, 0, 14.5, '#f97316', '#fef08a');
    }
    ctx.restore();

    // Sandbag protective parapet in front of mortar position!
    drawCelEllipse(ctx, mx + 14.5, -3.2, 6.2, 3.4, '#b48a56', { highlight: '#d6b78a', shadow: '#7c5c34', lineWidth: 1.45 });
    drawCelEllipse(ctx, mx + 13.5, -7.8, 5.4, 3.1, '#c29965', { highlight: '#e5caa1', shadow: '#7c5c34', lineWidth: 1.4 });
  }
  ctx.restore();
}

function drawEarlyTank(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const recoil = p.attackAnim > 0.35 ? Math.sin(((p.attackAnim - 0.35) / 0.65) * Math.PI) : 0;
  const firing = p.attackAnim > 0.45 && p.attackAnim < 0.85;
  const bob = p.isWalking ? Math.sin(p.walkPhase * 2) * 1.1 : 0;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 0.32);
    ctx.translate(0, f * 6);
  }

  ctx.translate(0, bob);
  drawTankTreads(ctx, -37.5, -21, 75, 21, p.walkPhase, 5, '#292524', '#57534e');

  // Subtle upward turret/hull recoil rock on cannon fire!
  ctx.save();
  ctx.translate(0, -20);
  ctx.rotate(-recoil * 0.065);
  ctx.translate(0, 20);

  // Rear diesel exhaust muffler puffing tiny dark exhaust ring!
  drawCelRoundRect(ctx, -36, -29, 7, 5, 1.5, '#334155', { highlight: '#64748b', lineWidth: 1.5 });
  const smokeDrift = ((p.walkPhase * 3.5) % 8);
  drawCelEllipse(ctx, -39 - smokeDrift * 0.7, -30 - smokeDrift * 0.8, 3.6, 2.6, 'rgba(148, 163, 184, 0.55)', {
    lineWidth: 1.0,
  });

  // Heavy riveted sloped olive-green WWII hull
  drawCelPoly(
    ctx,
    [
      [-32.5, -19],
      [-22.5, -36.5],
      [22.5, -36.5],
      [34.5, -22],
      [30.5, -17],
      [-30.5, -17],
    ],
    '#5c6b45',
    { highlight: '#8ea36f', shadow: '#354026', lineWidth: 2.35 },
  );
  drawRivetStrip(ctx, -26, -20.5, 26, -20.5, 7, 1.15);
  // Spare track links & fuel jerrycan strapped on hull side!
  drawCelRoundRect(ctx, -28.5, -32.5, 8.5, 9.5, 1.5, '#3f4d2d', { highlight: '#6d7f54', lineWidth: 1.4 });
  drawCelRoundRect(ctx, 20, -31.5, 8, 7, 1.2, '#334155', { highlight: '#64748b', lineWidth: 1.3 });
  // Warm front glacis headlamp
  drawEnergyOrb(ctx, 31.5, -24, 2.2, '#fde047', '#ffffff');

  // Team armored plate + crisp stenciled star emblem
  drawCelRoundRect(ctx, -18, -32.5, 34, 9.5, 2.5, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.75 });
  drawCelEllipse(ctx, -1, -27.8, 4.4, 4.4, '#f8fafc', { lineWidth: 1.25 });
  drawCelEllipse(ctx, -1, -27.8, 1.8, 1.8, pal.main, { lineWidth: 0.8 });

  // Rounded cast-steel turret + commander cupola with periscope slit!
  drawCelRoundRect(ctx, -15.5, -51.5, 30, 17.5, 6.5, '#4d5d38', {
    highlight: '#7f9660',
    shadow: '#2b361e',
    lineWidth: 2.3,
  });
  drawRivetStrip(ctx, -11, -37.5, 9, -37.5, 4, 1.0);
  drawCelRoundRect(ctx, -10.5, -56.8, 11.5, 6.2, 2, '#3d4a2c', { highlight: '#798c5c', lineWidth: 1.7 });
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-2, -55, 2.2, 2.2);

  // Heavy recoil mantlet + 75mm cannon barrel + ribbed muzzle brake!
  const rx = -recoil * 10;
  drawCelRoundRect(ctx, 8, -48, 8.5, 11, 2.5, '#3d4a2c', { highlight: '#798c5c', lineWidth: 1.7 });
  drawCelRoundRect(ctx, 13 + rx, -46, 28, 7, 2.2, '#334155', {
    highlight: '#94a3b8',
    shadow: '#0f172a',
    lineWidth: 2.1,
  });
  drawCelRoundRect(ctx, 36 + rx, -47.8, 6.5, 10.6, 1.5, '#1e293b', { highlight: '#64748b', lineWidth: 1.75 });
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(38.5 + rx, -45.5, 1.8, 6);

  if (firing) {
    drawCartoonMuzzleFlash(ctx, 47 + rx, -42.5, 20.5, '#f97316', '#fef08a');
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(45 + rx, -42.5, 4, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function drawModernMBT(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const recoil = p.attackAnim > 0.35 ? Math.sin(((p.attackAnim - 0.35) / 0.65) * Math.PI) : 0;
  const firing = p.attackAnim > 0.45 && p.attackAnim < 0.85;
  const bob = p.isWalking ? Math.sin(p.walkPhase * 2) * 0.9 : 0;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 0.25);
    ctx.translate(0, f * 5);
  }

  ctx.translate(0, bob);
  drawTankTreads(ctx, -41.5, -19, 83, 19, p.walkPhase, 6, '#1e293b', '#475569');

  // Heavy cannon suspension rock-back on main gun discharge!
  ctx.save();
  ctx.translate(0, -18);
  ctx.rotate(-recoil * 0.055);
  ctx.translate(0, 18);

  // Sleek angular composite armored hull
  drawCelPoly(
    ctx,
    [
      [-40.5, -18],
      [-34.5, -33.5],
      [30.5, -33.5],
      [42.5, -21],
      [39.5, -14],
      [-38.5, -14],
    ],
    '#64748b',
    { highlight: '#e2e8f0', shadow: '#334155', lineWidth: 2.35 },
  );
  // Rear engine deck exhaust louver grille & side steel tow cable!
  ctx.fillStyle = '#1e293b';
  for (let g = 0; g < 3; g++) {
    ctx.fillRect(-35 + g * 3.2, -31, 1.8, 5);
  }
  // Reactive ERA armor skirt blocks with metallic bolts
  for (let i = 0; i < 5; i++) {
    drawCelRoundRect(ctx, -33 + i * 13, -24.5, 11.2, 8.2, 1.5, '#475569', {
      highlight: '#94a3b8',
      shadow: '#1e293b',
      lineWidth: 1.45,
    });
  }
  drawCelRoundRect(ctx, -30, -31.5, 56, 5.5, 1.5, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.45 });
  // Headlight glow on front glacis
  drawEnergyOrb(ctx, 37.5, -23, 2.5, '#fef08a', '#ffffff');

  // Flexible whip radio comms antenna + commander roof-mounted .50-cal MG pintle!
  setInkStyle(ctx, 1.6, '#94a3b8');
  ctx.beginPath();
  ctx.moveTo(-22, -47);
  ctx.lineTo(-27.5 - Math.sin(p.walkPhase) * 2.2, -65);
  ctx.stroke();

  // Angular Chobham composite turret with bustle storage rack
  drawCelRoundRect(ctx, -31, -46.5, 8.5, 9.5, 1.5, '#334155', { highlight: '#64748b', lineWidth: 1.5 });
  drawCelPoly(
    ctx,
    [
      [-26, -33],
      [-20, -49.5],
      [15.5, -49.5],
      [27.5, -39],
      [22.5, -33],
    ],
    '#475569',
    { highlight: '#cbd5e1', shadow: '#1e293b', lineWidth: 2.35 },
  );
  // Sloped turret cheek armor panel seam & rivets
  setInkStyle(ctx, 1.3, '#1e293b');
  ctx.beginPath();
  ctx.moveTo(8, -49);
  ctx.lineTo(14, -33.5);
  ctx.stroke();
  drawRivetStrip(ctx, -18, -46.5, 6, -46.5, 4, 1.0);

  // Roof-mounted commander .50-cal MG pintle + glowing thermal CITV sight optic!
  drawCelRoundRect(ctx, -11, -55, 7, 5.5, 1.5, '#334155', { highlight: '#64748b', lineWidth: 1.4 });
  drawCelRoundRect(ctx, -6, -54.2, 13, 2.5, 0.8, '#1e293b', { highlight: '#94a3b8', lineWidth: 1.2 });
  drawCelRoundRect(ctx, 6.5, -54.5, 9.5, 6.2, 1.8, '#1e293b', { highlight: '#64748b', lineWidth: 1.55 });
  drawEnergyOrb(ctx, 13, -51.5, 2.2, pal.glow, '#ffffff');

  // 120mm smoothbore barrel + thermal sleeve + bore evacuator!
  const rx = -recoil * 11;
  drawCelRoundRect(ctx, 18 + rx, -44.8, 39, 6.4, 1.8, '#334155', {
    highlight: '#cbd5e1',
    shadow: '#0f172a',
    lineWidth: 2.1,
  });
  drawCelRoundRect(ctx, 32 + rx, -46.6, 11.5, 10.0, 2.5, '#475569', {
    highlight: '#cbd5e1',
    shadow: '#1e293b',
    lineWidth: 1.75,
  });

  if (firing) {
    drawCartoonMuzzleFlash(ctx, 62 + rx, -41.5, 22.5, '#f97316', '#fef08a');
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.88)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(59 + rx, -41.5, 4.5, 15.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function drawHoverDrone(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const firing = p.attackAnim > 0.45 && p.attackAnim < 0.85;
  const tilt = p.isWalking ? 0.12 : 0.04;
  const dp = p.deathProgress;

  ctx.save();
  ctx.translate(0, -18);
  if (dp > 0) {
    ctx.rotate(-dp * 1.4);
    ctx.translate(0, dp * 18);
  } else {
    ctx.rotate(tilt - (p.attackAnim > 0.4 ? 0.14 : 0));
  }

  // Twin glowing anti-gravity plasma thruster plumes + glowing underside hover ring!
  const flameH = 9.5 + Math.sin(p.walkPhase * 5) * 3.2;
  drawCelPoly(
    ctx,
    [
      [-13.5, 4.5],
      [-6.5, 4.5],
      [-10, 4.5 + flameH],
    ],
    pal.glow,
    { highlight: '#ffffff', lineWidth: 1.2, ink: pal.dark },
  );
  drawCelPoly(
    ctx,
    [
      [3.5, 4.5],
      [10.5, 4.5],
      [7, 4.5 + flameH],
    ],
    pal.glow,
    { highlight: '#ffffff', lineWidth: 1.2, ink: pal.dark },
  );
  // Luminous underside anti-grav stabilization ring
  ctx.save();
  ctx.strokeStyle = pal.glow;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(-1.5, 6.2, 13, 2.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Rear aerodynamic stabilizer wing + glowing wingtip nav light
  drawCelPoly(
    ctx,
    [
      [-14, -4],
      [-27, -16],
      [-17, -14.5],
      [-4, -6],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 1.9 },
  );
  drawEnergyOrb(ctx, -25.5, -15, 2.0, pal.glow, '#ffffff');

  // Sleek glossy white-titanium oval drone carapace + articulated side thruster nacelle!
  drawCelEllipse(ctx, 0, -4, 19.5, 11.8, '#e2e8f0', {
    highlight: '#ffffff',
    shadow: '#64748b',
    lineWidth: 2.15,
  });
  drawCelRoundRect(ctx, -14.5, -10.5, 22.5, 6.2, 3, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.6 });
  // Side engine pod nacelle with glowing intake vent
  drawCelRoundRect(ctx, -15, -3.5, 14, 6.2, 2.8, '#475569', { highlight: '#cbd5e1', shadow: '#1e293b', lineWidth: 1.55 });
  ctx.fillStyle = pal.glow;
  ctx.fillRect(-12, -1.6, 8, 2.2);

  // Iconic glowing cyclops optic visor + concentric holographic HUD scan ring!
  drawCelEllipse(ctx, 12.2, -5, 6.2, 5.5, '#0f172a', { highlight: '#334155', lineWidth: 1.75 });
  ctx.save();
  ctx.strokeStyle = pal.glow;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(13.5, -5, 4.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  drawEnergyOrb(ctx, 13.5, -5, 3.2, pal.glow, '#ffffff');

  // Underslung twin rapid plasma blasters!
  drawCelRoundRect(ctx, 2, 2.8, 19, 5.6, 2, '#334155', { highlight: '#94a3b8', lineWidth: 1.7 });
  ctx.fillStyle = pal.glow;
  ctx.fillRect(6, 4.8, 13, 1.6);
  if (firing) {
    drawEnergyOrb(ctx, 24, 5.6, 7.2, pal.glow, '#ffffff');
  }
  ctx.restore();
}

function drawColossusMech(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const stride = p.isWalking ? Math.sin(p.walkPhase) : 0;
  const bob = p.isWalking ? Math.abs(Math.sin(p.walkPhase)) * 3.8 : 0;
  const recoil = p.attackAnim > 0.35 ? Math.sin(((p.attackAnim - 0.35) / 0.65) * Math.PI) : 0;
  const firing = p.attackAnim > 0.45 && p.attackAnim < 0.85;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 1.15);
    ctx.translate(-f * 8, f * 10);
  }

  const hipY = -44 - bob;
  // Back reverse-joint giant titanium leg with gleaming chrome hydraulic piston & claw foot!
  drawSculptedLimb(ctx, -7, hipY + 4, -16.5 - stride * 12, -24, 14.5, 10.5, '#475569', {
    highlight: '#94a3b8',
    shadow: '#1e293b',
    piston: true,
    lineWidth: 2.15,
  });
  drawSculptedLimb(ctx, -16.5 - stride * 12, -24, -8 - stride * 14, -4.5, 11.5, 8.6, '#334155', {
    highlight: '#64748b',
    shadow: '#0f172a',
    cuffColor: pal.main,
    lineWidth: 2.05,
  });
  drawCelEllipse(ctx, -16.5 - stride * 12, -24, 5.5, 5.5, '#64748b', { highlight: '#cbd5e1', lineWidth: 1.7 });
  drawCelPoly(
    ctx,
    [
      [-19 - stride * 14, -9.5],
      [2 - stride * 14, -9.5],
      [6 - stride * 14, -1],
      [-21 - stride * 14, -1],
    ],
    '#1e293b',
    { highlight: '#475569', lineWidth: 2.0 },
  );

  // Front reverse-joint giant titanium leg with chrome hydraulic piston, glowing knee vent & multi-toe foot!
  drawSculptedLimb(ctx, 8, hipY + 4, 2 + stride * 13, -24, 15.2, 11.2, '#cbd5e1', {
    highlight: '#ffffff',
    shadow: '#64748b',
    piston: true,
    lineWidth: 2.2,
  });
  drawSculptedLimb(ctx, 2 + stride * 13, -24, 10 + stride * 15, -4.5, 12.2, 9.2, '#64748b', {
    highlight: '#e2e8f0',
    shadow: '#334155',
    cuffColor: pal.glow,
    lineWidth: 2.1,
  });
  // Beveled titanium knee armor shield + glowing cyan/rose servo eye
  drawCelRoundRect(ctx, -4 + stride * 13, -29.5, 11.5, 10.5, 3, '#e2e8f0', {
    highlight: '#ffffff',
    shadow: '#64748b',
    lineWidth: 1.75,
  });
  drawEnergyOrb(ctx, 2 + stride * 13, -24.2, 2.3, pal.glow, '#ffffff');
  drawCelPoly(
    ctx,
    [
      [-1 + stride * 15, -9.5],
      [20 + stride * 15, -9.5],
      [25 + stride * 15, -1],
      [-3 + stride * 15, -1],
    ],
    '#334155',
    { highlight: '#cbd5e1', shadow: '#0f172a', lineWidth: 2.1 },
  );

  // 6-tube armored shoulder missile pod + comms antenna!
  drawCelRoundRect(ctx, -21, hipY - 53, 21, 18, 3.5, '#334155', {
    highlight: '#94a3b8',
    shadow: '#0f172a',
    lineWidth: 2.1,
  });
  for (let r = 0; r < 2; r++) {
    for (let col = 0; col < 3; col++) {
      drawCelEllipse(ctx, -16 + col * 5.4, hipY - 47 + r * 6.2, 2.4, 2.4, '#ef4444', {
        highlight: '#fca5a5',
        lineWidth: 1.1,
      });
    }
  }
  setInkStyle(ctx, 1.8, '#cbd5e1');
  ctx.beginPath();
  ctx.moveTo(-18, hipY - 53);
  ctx.lineTo(-22, hipY - 64);
  ctx.stroke();
  drawEnergyOrb(ctx, -22, hipY - 64.5, 2.0, pal.glow, '#ffffff');

  // Towering armored Titan Mech torso with glowing turbine vents!
  drawCelPoly(
    ctx,
    [
      [-22.5, hipY - 4],
      [-26.5, hipY - 38.5],
      [22.5, hipY - 40.5],
      [28, hipY - 14],
      [16.5, hipY + 2.5],
      [-14.5, hipY + 2.5],
    ],
    '#e2e8f0',
    { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.45 },
  );
  drawRivetStrip(ctx, -20, hipY - 37, 18, hipY - 38, 6, 1.0);
  // Team chest armor & sleek angled glass cockpit canopy with diagonal glare!
  drawCelRoundRect(ctx, -16.5, hipY - 34.5, 35, 16.5, 4, pal.main, {
    highlight: pal.light,
    shadow: pal.dark,
    lineWidth: 2.0,
  });
  drawCelPoly(
    ctx,
    [
      [3.5, hipY - 30.5],
      [22.5, hipY - 29.5],
      [19.5, hipY - 20],
      [3.5, hipY - 22],
    ],
    pal.glow,
    { highlight: '#ffffff', lineWidth: 1.75 },
  );
  // Crisp glass reflection streaks across cockpit visor
  setInkStyle(ctx, 1.6, 'rgba(255,255,255,0.85)');
  ctx.beginPath();
  ctx.moveTo(8, hipY - 29.5);
  ctx.lineTo(12.5, hipY - 22);
  ctx.moveTo(14, hipY - 29);
  ctx.lineTo(17, hipY - 23.5);
  ctx.stroke();

  // Pulsing chest plasma reactor core surrounded by armored ring!
  drawCelEllipse(ctx, -4, hipY - 12, 8.2, 8.2, '#334155', { highlight: '#94a3b8', lineWidth: 1.6 });
  drawEnergyOrb(ctx, -4, hipY - 12, firing ? 7.8 : 5.4, pal.glow, '#ffffff');

  // Massive right-arm triple-core rail-plasma cannon!
  const rx = -recoil * 10;
  drawCelRoundRect(ctx, 4 + rx, hipY - 19.5, 39, 13.8, 3.5, '#334155', {
    highlight: '#cbd5e1',
    shadow: '#0f172a',
    lineWidth: 2.3,
  });
  drawCelRoundRect(ctx, 12 + rx, hipY - 21.5, 6, 17.8, 1.5, '#e2e8f0', { highlight: '#ffffff', lineWidth: 1.4 });
  drawCelRoundRect(ctx, 25 + rx, hipY - 21.0, 5.5, 16.8, 1.5, '#e2e8f0', { highlight: '#ffffff', lineWidth: 1.4 });
  ctx.fillStyle = pal.glow;
  ctx.fillRect(10 + rx, hipY - 14.8, 31, 4.2);

  if (firing) {
    drawEnergyOrb(ctx, 48 + rx, hipY - 12.5, 15.2, pal.glow, '#ffffff');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(46 + rx, hipY - 12.5, 4.5, 15.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStarArchon(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const pulse = Math.sin(p.walkPhase * 1.8) * 3;
  const firing = p.attackAnim > 0.4 && p.attackAnim < 0.85;
  const dp = p.deathProgress;

  ctx.save();
  ctx.translate(0, -14);
  if (dp > 0) {
    ctx.globalAlpha = Math.max(0.2, 1 - dp);
    ctx.scale(1 + dp * 0.4, 1 - dp * 0.6);
  }

  // Twin luminous ethereal plasma wings fanning behind celestial deity!
  const wingPulse = Math.sin(p.walkPhase * 2.2) * 3.5;
  drawCelPoly(
    ctx,
    [
      [-8, -34],
      [-32, -52 + wingPulse],
      [-23, -34 + wingPulse * 0.4],
      [-28, -22 + wingPulse * 0.3],
      [-10, -22],
    ],
    'rgba(192, 132, 252, 0.82)',
    { highlight: '#fef08a', shadow: '#6b21a8', lineWidth: 1.7 },
  );
  drawCelPoly(
    ctx,
    [
      [8, -34],
      [27, -48 - wingPulse],
      [19, -34 - wingPulse * 0.4],
      [23, -24 - wingPulse * 0.3],
      [10, -22],
    ],
    'rgba(192, 132, 252, 0.72)',
    { highlight: '#fef08a', shadow: '#6b21a8', lineWidth: 1.6 },
  );

  // Double-layered spinning golden celestial mandala halo + 8 star nodes!
  ctx.save();
  ctx.translate(-2, -33);
  ctx.rotate(p.walkPhase * 0.65);
  setInkStyle(ctx, 4.2, INK);
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Inner counter-star diamond ring
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rad = i % 2 === 0 ? 3.2 : 2.1;
    drawCelEllipse(ctx, Math.cos(a) * 22, Math.sin(a) * 22, rad, rad, i % 2 === 0 ? '#fef08a' : pal.glow, {
      lineWidth: 1.2,
    });
  }
  ctx.restore();

  // Flowing levitating cosmic energy tail with golden filigree ribbons!
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-10.5, -20);
  ctx.quadraticCurveTo(-15, -3, -3 + pulse * 0.6, 13);
  ctx.quadraticCurveTo(9.5, -3, 10.5, -20);
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(0, -22, 0, 13);
  tailGrad.addColorStop(0, pal.main);
  tailGrad.addColorStop(0.55, '#a855f7');
  tailGrad.addColorStop(1, '#fef08a');
  ctx.fillStyle = tailGrad;
  ctx.fill();
  setInkStyle(ctx, 2.05);
  ctx.stroke();
  ctx.restore();

  // Gilded obsidian celestial torso armor + pulsing galaxy chest core!
  drawCelPoly(
    ctx,
    [
      [-12.5, -20],
      [-15.5, -39.5],
      [15.5, -39.5],
      [12.5, -20],
    ],
    '#2e1065',
    { highlight: '#7c3aed', shadow: '#09071a', lineWidth: 2.1 },
  );
  drawEnergyOrb(ctx, 0, -30, 5.2, '#e879f9', '#fef9c3');
  drawCelRoundRect(ctx, -16.5, -42.5, 10.5, 9.2, 3, '#facc15', { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.7 });
  drawCelRoundRect(ctx, 6, -42.5, 10.5, 9.2, 3, '#facc15', { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.7 });

  // Radiant faceless golden Archon crown head + starlight brow crest
  drawCelEllipse(ctx, 1, -47.5, 8.2, 9.2, '#fef08a', { highlight: '#ffffff', shadow: '#f59e0b', lineWidth: 1.9 });
  drawCelPoly(
    ctx,
    [
      [-6.5, -52.5],
      [1, -64.5],
      [8.5, -52.5],
    ],
    '#facc15',
    { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.7 },
  );
  drawEnergyOrb(ctx, 1, -56, 2.4, pal.glow, '#ffffff');

  // Orbiting Antimatter Nova Spheres channeling forward with starlight arc!
  const reach = firing ? 27 : 18.5;
  drawEnergyOrb(ctx, reach, -32 + pulse * 0.5, firing ? 10.0 : 6.0, '#c084fc', '#ffffff');
  drawEnergyOrb(ctx, -18.5, -28 - pulse * 0.5, 4.8, pal.glow, '#fef08a');

  ctx.restore();
}

function drawOmegaTitan(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const stride = p.isWalking ? Math.sin(p.walkPhase) : 0;
  const bob = p.isWalking ? Math.abs(Math.sin(p.walkPhase)) * 4.0 : 0;
  const recoil = p.attackAnim > 0.35 ? Math.sin(((p.attackAnim - 0.35) / 0.65) * Math.PI) : 0;
  const firing = p.attackAnim > 0.45 && p.attackAnim < 0.85;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 1.15);
    ctx.translate(-f * 10, f * 12);
  }

  const hipY = -48 - bob;

  // Floating spinning golden celestial god-halo behind Omega Titan crown!
  ctx.save();
  ctx.translate(1, hipY - 56);
  ctx.rotate(p.walkPhase * 0.45);
  setInkStyle(ctx, 3.8, INK);
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    drawCelEllipse(ctx, Math.cos(a) * 22, Math.sin(a) * 22, 2.6, 2.6, '#fef08a', { lineWidth: 1.0 });
  }
  ctx.restore();

  // 3-Tiered Radiant Cosmic Energy Wings with luminous feather veins!
  const wingFlap = Math.sin(p.walkPhase * 1.5) * 4.5;
  drawCelPoly(
    ctx,
    [
      [-10, hipY - 35],
      [-50, hipY - 70 + wingFlap],
      [-34, hipY - 39 + wingFlap * 0.6],
      [-48, hipY - 26 + wingFlap * 0.45],
      [-31, hipY - 19 + wingFlap * 0.3],
      [-40, hipY - 10 + wingFlap * 0.25],
      [-12, hipY - 12],
    ],
    '#a855f7',
    { highlight: '#f5d0fe', shadow: '#581c87', lineWidth: 2.2 },
  );
  drawCelPoly(
    ctx,
    [
      [-12, hipY - 34],
      [-38, hipY - 58 + wingFlap],
      [-24, hipY - 34 + wingFlap * 0.4],
      [-33, hipY - 22 + wingFlap * 0.3],
      [-15, hipY - 18],
    ],
    '#facc15',
    { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.65 },
  );
  drawCelPoly(
    ctx,
    [
      [-13, hipY - 33],
      [-26, hipY - 46 + wingFlap * 0.8],
      [-17, hipY - 25],
    ],
    '#ffffff',
    { lineWidth: 1.2 },
  );

  // Colossal sculpted obsidian-and-gold Titan legs with hydraulic pistons & glowing knee runes!
  drawSculptedLimb(ctx, -9, hipY + 4, -18.5 - stride * 12, -26, 16.5, 11.8, '#1e1b4b', {
    highlight: '#6d28d9',
    shadow: '#09071a',
    piston: true,
    lineWidth: 2.25,
  });
  drawSculptedLimb(ctx, -18.5 - stride * 12, -26, -10 - stride * 14, -4.5, 13.0, 9.8, '#312e81', {
    highlight: '#7c3aed',
    shadow: '#09071a',
    cuffColor: '#facc15',
    lineWidth: 2.15,
  });
  drawCelRoundRect(ctx, -21 - stride * 14, -10.5, 24.5, 10.5, 3, '#d97706', {
    highlight: '#fef08a',
    shadow: '#78350f',
    lineWidth: 2.1,
  });

  drawSculptedLimb(ctx, 10, hipY + 4, 4 + stride * 13, -26, 17.2, 12.2, '#312e81', {
    highlight: '#818cf8',
    shadow: '#09071a',
    piston: true,
    lineWidth: 2.3,
  });
  drawSculptedLimb(ctx, 4 + stride * 13, -26, 12 + stride * 15, -4.5, 13.8, 10.2, '#4c1d95', {
    highlight: '#a855f7',
    shadow: '#1e1b4b',
    cuffColor: '#facc15',
    lineWidth: 2.2,
  });
  // Gilded knee shield plate with glowing cosmic rune gem!
  drawCelPoly(
    ctx,
    [
      [-2 + stride * 13, -32],
      [10 + stride * 13, -32],
      [11 + stride * 13, -21],
      [4 + stride * 13, -17.5],
      [-3 + stride * 13, -21],
    ],
    '#f59e0b',
    { highlight: '#fef9c3', shadow: '#92400e', lineWidth: 1.7 },
  );
  drawEnergyOrb(ctx, 4 + stride * 13, -25.5, 2.6, '#e879f9', '#ffffff');
  drawCelRoundRect(ctx, 1 + stride * 15, -10.5, 25.5, 10.5, 3, '#f59e0b', {
    highlight: '#fef9c3',
    shadow: '#92400e',
    lineWidth: 2.15,
  });

  // Monumental gilded-obsidian God-Mech Torso!
  drawCelPoly(
    ctx,
    [
      [-24.5, hipY - 4],
      [-31, hipY - 44.5],
      [27, hipY - 44.5],
      [30, hipY - 16],
      [18.5, hipY + 2.5],
      [-16.5, hipY + 2.5],
    ],
    '#1e1b4b',
    { highlight: '#6d28d9', shadow: '#09071a', lineWidth: 2.65 },
  );
  // Sculpted golden shoulder arch mantle + team tabard crest
  drawCelRoundRect(ctx, -26, hipY - 45.5, 52, 12.5, 4, '#f59e0b', {
    highlight: '#fef9c3',
    shadow: '#b45309',
    lineWidth: 2.2,
  });
  drawRivetStrip(ctx, -21, hipY - 42, 21, hipY - 42, 6, 1.0);
  drawCelRoundRect(ctx, -15, hipY - 30.5, 32, 18.5, 4, pal.main, {
    highlight: pal.light,
    shadow: pal.dark,
    lineWidth: 1.95,
  });

  // Swirling Tilted Black-Hole Accretion Disk Singularity Reactor Core!
  ctx.save();
  ctx.translate(1, hipY - 21);
  ctx.rotate(-0.28 + Math.sin(p.walkPhase * 1.4) * 0.08);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12.5, 4.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  drawEnergyOrb(ctx, 1, hipY - 21, firing ? 9.5 : 8.0, '#c084fc', '#fef08a');
  ctx.fillStyle = '#09071a';
  ctx.beginPath();
  ctx.arc(1, hipY - 21, 3.6, 0, Math.PI * 2);
  ctx.fill();

  // Crowned Titan God-Helm + Twin Golden Horns!
  drawCelPoly(
    ctx,
    [
      [-10.5, hipY - 43.5],
      [-12.5, hipY - 60.5],
      [2, hipY - 70],
      [15.5, hipY - 58.5],
      [13.5, hipY - 43.5],
    ],
    '#1e1b4b',
    { highlight: '#7c3aed', shadow: '#09071a', lineWidth: 2.25 },
  );
  drawCelRoundRect(ctx, 2, hipY - 55.5, 11.5, 5.0, 2, '#fef08a', { highlight: '#ffffff', lineWidth: 1.45 });
  drawCelPoly(
    ctx,
    [
      [-9, hipY - 58.5],
      [-18, hipY - 73.5],
      [-3, hipY - 62.5],
    ],
    '#facc15',
    { highlight: '#fef9c3', lineWidth: 1.7 },
  );
  drawCelPoly(
    ctx,
    [
      [9, hipY - 58.5],
      [19, hipY - 73.5],
      [5, hipY - 62.5],
    ],
    '#facc15',
    { highlight: '#fef9c3', lineWidth: 1.7 },
  );

  // Colossal Gilded Cosmic Obliterator Cannon Arm + Floating Focus Rings!
  const rx = -recoil * 11;
  drawCelRoundRect(ctx, 6 + rx, hipY - 22.5, 43, 15.5, 4, '#1e1b4b', {
    highlight: '#818cf8',
    shadow: '#09071a',
    lineWidth: 2.35,
  });
  drawCelRoundRect(ctx, 12 + rx, hipY - 24.5, 16, 4.2, 1.5, '#facc15', { highlight: '#fef9c3', lineWidth: 1.45 });
  drawCelRoundRect(ctx, 12 + rx, hipY - 9.0, 16, 4.2, 1.5, '#facc15', { highlight: '#fef9c3', lineWidth: 1.45 });
  // Glowing plasma channel + floating golden collimator ring near muzzle
  ctx.fillStyle = '#e879f9';
  ctx.fillRect(14 + rx, hipY - 16.5, 33, 3.6);
  drawCelEllipse(ctx, 43 + rx, hipY - 14.5, 3.2, 10.5, '#facc15', { highlight: '#fef9c3', lineWidth: 1.45 });
  drawEnergyOrb(ctx, 52 + rx, hipY - 14.5, firing ? 17.0 : 7.6, '#e879f9', '#fef08a');
  if (firing) {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.92)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.ellipse(50 + rx, hipY - 14.5, 5.5, 19.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAegisSeraph(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const bob = Math.sin(p.walkPhase * 1.5) * 3.5;
  const recoil = p.attackAnim > 0.35 ? Math.sin(((p.attackAnim - 0.35) / 0.65) * Math.PI) : 0;
  const firing = p.attackAnim > 0.54;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.translate(0, f * 20);
    ctx.rotate(-f * 0.8);
  }

  const cy = -34 + bob;
  const rx = -recoil * 6;

  // 1. Underside Anti-Gravity Golden Ring & Cyan Lift Plume
  ctx.save();
  ctx.fillStyle = 'rgba(45, 212, 191, 0.42)';
  ctx.beginPath();
  ctx.moveTo(-10 + rx, cy + 12);
  ctx.lineTo(0 + rx, cy + 28);
  ctx.lineTo(10 + rx, cy + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0 + rx, cy + 14, 16, 4.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 2. Twin Rear & Upper Floating Crystalline Seraph Wing-Blades!
  const flap = Math.sin(p.walkPhase * 1.9) * 3.0;
  // Upper sweeping seraph wing
  drawCelPoly(
    ctx,
    [
      [-6 + rx, cy - 8],
      [-28 + rx, cy - 26 + flap],
      [-12 + rx, cy - 15 + flap * 0.4],
      [-23 + rx, cy - 11 + flap * 0.6],
      [-4 + rx, cy - 2],
    ],
    '#f8fafc',
    { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 1.9 },
  );
  drawCelPoly(
    ctx,
    [
      [-8 + rx, cy - 9],
      [-23 + rx, cy - 22 + flap],
      [-10 + rx, cy - 12 + flap * 0.4],
    ],
    '#2dd4bf',
    { highlight: '#ffffff', lineWidth: 1.1 },
  );
  // Lower swept seraph stabilizer wing
  drawCelPoly(
    ctx,
    [
      [-4 + rx, cy + 6],
      [-24 + rx, cy + 18 - flap * 0.7],
      [-10 + rx, cy + 10],
      [6 + rx, cy + 10],
    ],
    '#f59e0b',
    { highlight: '#fef9c3', shadow: '#92400e', lineWidth: 1.7 },
  );

  // 3. Sleek Angelic Pearl-White & Gold Seraphim Hull!
  drawCelPoly(
    ctx,
    [
      [-20 + rx, cy - 2],
      [-10 + rx, cy - 13],
      [14 + rx, cy - 11],
      [26 + rx, cy],
      [14 + rx, cy + 11],
      [-12 + rx, cy + 11],
    ],
    '#f8fafc',
    { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 2.3 },
  );
  // Recessed astral-teal hull panel + team emblem stripe
  drawCelPoly(
    ctx,
    [
      [-13 + rx, cy - 5],
      [12 + rx, cy - 6],
      [16 + rx, cy],
      [12 + rx, cy + 6],
      [-13 + rx, cy + 5],
    ],
    '#0f766e',
    { highlight: '#2dd4bf', shadow: '#083344', lineWidth: 1.55 },
  );
  drawCelRoundRect(ctx, -10 + rx, cy - 3.5, 16, 7, 2.5, pal.main, {
    highlight: pal.light,
    shadow: pal.dark,
    lineWidth: 1.4,
  });
  // Golden dorsal crown fin
  drawCelPoly(
    ctx,
    [
      [-4 + rx, cy - 12],
      [5 + rx, cy - 20],
      [12 + rx, cy - 11],
    ],
    '#f59e0b',
    { highlight: '#fef9c3', shadow: '#b45309', lineWidth: 1.6 },
  );

  // 4. Forward Quantum Prism Halo & Radiant Emitter Core!
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(24 + rx, cy, 4.2, 11.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawEnergyOrb(ctx, 27 + rx, cy, firing ? 11.5 : 6.2, '#2dd4bf', '#fef9c3');

  ctx.restore();
}

function drawChronoSovereign(
  ctx: CanvasRenderingContext2D,
  p: CartoonUnitDrawParams,
  pal: ReturnType<typeof getTeamPalette>,
): void {
  const stride = p.isWalking ? Math.sin(p.walkPhase) : 0;
  const bob = Math.sin(p.walkPhase * 1.3) * 3.5;
  const recoil = p.attackAnim > 0.35 ? Math.sin(((p.attackAnim - 0.35) / 0.65) * Math.PI) : 0;
  const firing = p.attackAnim > 0.56;
  const dp = p.deathProgress;

  ctx.save();
  if (dp > 0) {
    const f = Math.min(1, dp * 1.4);
    ctx.rotate(-f * 0.95);
    ctx.translate(-f * 10, f * 12);
  }

  const hipY = -56 - bob;
  const clockSpin = p.walkPhase * 0.55;

  // 1. COLOSSAL SPINNING GOLDEN ASTRAL CLOCK HALO (12 glowing Chrono runes!) behind Sovereign!
  ctx.save();
  ctx.translate(0, hipY - 40);
  // Outer golden clock ring + inner cyan chrono ring
  setInkStyle(ctx, 5.2, INK);
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3.2;
  ctx.stroke();

  ctx.strokeStyle = '#2dd4bf';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 31, 0, Math.PI * 2);
  ctx.stroke();

  // 12 Radiant Roman-Clock Marker Spikes orbiting the halo!
  for (let i = 0; i < 12; i++) {
    const a = clockSpin + (i / 12) * Math.PI * 2;
    const isCardinal = i % 3 === 0;
    const r0 = isCardinal ? 27 : 31;
    const r1 = isCardinal ? 43 : 38.5;
    ctx.strokeStyle = isCardinal ? '#fef08a' : '#2dd4bf';
    ctx.lineWidth = isCardinal ? 3.0 : 1.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Twin Crystalline Celestial Seraph Wing-Pylons behind back
  drawCelPoly(
    ctx,
    [
      [-18, hipY - 36],
      [-52, hipY - 62],
      [-34, hipY - 30],
      [-46, hipY - 12],
      [-16, hipY - 14],
    ],
    '#2dd4bf',
    { highlight: '#ffffff', shadow: '#0f766e', lineWidth: 2.1 },
  );
  drawCelPoly(
    ctx,
    [
      [-18, hipY - 34],
      [-45, hipY - 54],
      [-28, hipY - 29],
    ],
    '#facc15',
    { highlight: '#fef9c3', lineWidth: 1.5 },
  );

  // 3. Sculpted Pearl-White & Gold Hydraulic Piston Legs + Diamond Knee Crests!
  drawSculptedLimb(ctx, -11, hipY + 4, -18 - stride * 12, -27, 17, 12, '#cbd5e1', {
    highlight: '#ffffff',
    shadow: '#64748b',
    piston: true,
    lineWidth: 2.2,
  });
  drawSculptedLimb(ctx, -18 - stride * 12, -27, -11 - stride * 14, -5, 13.5, 10, '#0f766e', {
    highlight: '#2dd4bf',
    shadow: '#083344',
    cuffColor: '#facc15',
    lineWidth: 2.1,
  });
  drawCelRoundRect(ctx, -22 - stride * 14, -10.5, 25, 10.5, 3, '#f59e0b', {
    highlight: '#fef9c3',
    shadow: '#92400e',
    lineWidth: 2.1,
  });

  drawSculptedLimb(ctx, 11, hipY + 4, 5 + stride * 12, -27, 17.5, 12.5, '#f8fafc', {
    highlight: '#ffffff',
    shadow: '#94a3b8',
    piston: true,
    lineWidth: 2.3,
  });
  drawSculptedLimb(ctx, 5 + stride * 12, -27, 13 + stride * 14, -5, 14, 10.5, '#0f766e', {
    highlight: '#2dd4bf',
    shadow: '#083344',
    cuffColor: '#facc15',
    lineWidth: 2.2,
  });
  // Gilded diamond knee guard + glowing cyan gem
  drawCelPoly(
    ctx,
    [
      [5 + stride * 12, -35],
      [13 + stride * 12, -26],
      [5 + stride * 12, -17],
      [-3 + stride * 12, -26],
    ],
    '#f59e0b',
    { highlight: '#fef9c3', shadow: '#92400e', lineWidth: 1.75 },
  );
  drawEnergyOrb(ctx, 5 + stride * 12, -26, 2.8, '#2dd4bf', '#ffffff');
  drawCelRoundRect(ctx, 2 + stride * 14, -10.5, 26, 10.5, 3, '#f59e0b', {
    highlight: '#fef9c3',
    shadow: '#92400e',
    lineWidth: 2.15,
  });

  // 4. Monumental Pearl-White & Royal Gold Sovereign Torso + Temporal Singularity Heart!
  drawCelPoly(
    ctx,
    [
      [-26, hipY - 3],
      [-33, hipY - 46],
      [29, hipY - 46],
      [31, hipY - 16],
      [19, hipY + 3],
      [-18, hipY + 3],
    ],
    '#f8fafc',
    { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 2.65 },
  );
  // Broad golden Seraphim shoulder mantle + team tabard crest
  drawCelRoundRect(ctx, -29, hipY - 47.5, 58, 13, 4.5, '#f59e0b', {
    highlight: '#fef9c3',
    shadow: '#b45309',
    lineWidth: 2.25,
  });
  drawCelRoundRect(ctx, -16, hipY - 31, 34, 19.5, 4.5, '#0f766e', {
    highlight: '#2dd4bf',
    shadow: '#083344',
    lineWidth: 2.0,
  });
  drawCelRoundRect(ctx, -12, hipY - 44.5, 24, 6.5, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });

  // Radiant Prismatic Chrono-Heart Core in Chest!
  ctx.save();
  ctx.translate(1, hipY - 21);
  ctx.rotate(clockSpin * 1.4);
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13.5, 4.6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#2dd4bf';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.ellipse(0, 0, 4.6, 13.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  drawEnergyOrb(ctx, 1, hipY - 21, firing ? 10.5 : 8.2, '#2dd4bf', '#fef9c3');

  // 5. Crowned Celestial Seraph-Sovereign Helm + Twin Golden Diadem Horns!
  drawCelPoly(
    ctx,
    [
      [-11, hipY - 45],
      [-13, hipY - 62],
      [2, hipY - 73],
      [16, hipY - 60],
      [14, hipY - 45],
    ],
    '#f8fafc',
    { highlight: '#ffffff', shadow: '#94a3b8', lineWidth: 2.25 },
  );
  // Glowing golden-cyan divine visor
  drawCelPoly(
    ctx,
    [
      [1, hipY - 58],
      [14.5, hipY - 58],
      [13.5, hipY - 51],
      [1, hipY - 51],
    ],
    '#083344',
    { lineWidth: 1.5 },
  );
  drawEnergyOrb(ctx, 8.5, hipY - 54.5, 3.8, '#2dd4bf', '#fef9c3');
  // Twin soaring golden diadem wings on crown
  drawCelPoly(
    ctx,
    [
      [-9, hipY - 60],
      [-21, hipY - 77],
      [-3, hipY - 64],
    ],
    '#facc15',
    { highlight: '#ffffff', lineWidth: 1.7 },
  );
  drawCelPoly(
    ctx,
    [
      [9, hipY - 60],
      [21, hipY - 77],
      [5, hipY - 64],
    ],
    '#facc15',
    { highlight: '#ffffff', lineWidth: 1.7 },
  );

  // 6. Colossal Triple-Ring Eternity Prism Cannon Arm!
  const rx = -recoil * 12;
  drawCelRoundRect(ctx, 6 + rx, hipY - 23.5, 45, 16, 4.5, '#f8fafc', {
    highlight: '#ffffff',
    shadow: '#64748b',
    lineWidth: 2.35,
  });
  drawCelRoundRect(ctx, 11 + rx, hipY - 25.5, 22, 4.5, 1.5, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.45 });
  drawCelRoundRect(ctx, 11 + rx, hipY - 9.2, 22, 4.5, 1.5, '#f59e0b', { highlight: '#fef9c3', lineWidth: 1.45 });
  ctx.fillStyle = '#2dd4bf';
  ctx.fillRect(14 + rx, hipY - 17.5, 35, 4.2);
  // Twin floating golden prism accelerator rings
  drawCelEllipse(ctx, 36 + rx, hipY - 15.5, 3.0, 10.5, '#facc15', { highlight: '#ffffff', lineWidth: 1.4 });
  drawCelEllipse(ctx, 46 + rx, hipY - 15.5, 3.4, 12.2, '#2dd4bf', { highlight: '#ffffff', lineWidth: 1.45 });
  drawEnergyOrb(ctx, 55 + rx, hipY - 15.5, firing ? 18.5 : 8.5, '#2dd4bf', '#fef9c3');
  if (firing) {
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.96)';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.ellipse(53 + rx, hipY - 15.5, 6.2, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

