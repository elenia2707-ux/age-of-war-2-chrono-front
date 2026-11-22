import {
  INK,
  drawCartoonHumanoid,
  drawCartoonMuzzleFlash,
  drawCelEllipse,
  drawCelPoly,
  drawCelRoundRect,
  drawEnergyOrb,
  drawGearWheel,
  drawInkLimb,
  drawRivetStrip,
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
        scale: 1.12,
        torsoW: 18,
        torsoH: 19,
        skin: '#b45309',
        torsoFill: '#b45309',
        torsoHighlight: '#fbbf24',
        torsoShadow: '#78350f',
        pantsColor: '#451a03',
        bootColor: '#57534e',
        beltColor: '#475569',
        armColor: '#92400e',
        pauldronColor: '#d97706',
        pauldronTrim: pal.light,
        swingStyle: 'overhead',
        drawBackAccessory: (c, topY) => {
          // Pressurized brass steam boiler backpack + little exhaust pipe
          drawCelRoundRect(c, -15, topY + 1, 9, 17, 3.5, '#d97706', {
            highlight: '#fef08a',
            shadow: '#92400e',
            lineWidth: 2.0,
          });
          drawCelRoundRect(c, -13, topY - 6, 4, 8, 1.5, '#475569', { lineWidth: 1.5 });
          // Steam puff
          drawCelEllipse(c, -13, topY - 9 - (p.walkPhase % 2) * 2, 4.2, 3, 'rgba(241,245,249,0.85)', {
            lineWidth: 1.3,
          });
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Glowing pressure gauge on chest
          drawCelEllipse(c, tx + tw / 2, ty + 8, 4, 4, pal.main, { highlight: pal.light, lineWidth: 1.5 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Iconic brass diving-bell / steampunk pressure helmet with glowing amber porthole!
          drawCelEllipse(c, hx + 0.5, hy - 0.5, hr + 1.8, hr + 1.5, '#d97706', {
            highlight: '#fef08a',
            shadow: '#78350f',
            lineWidth: 2.2,
          });
          drawCelEllipse(c, hx + 4.5, hy - 1, 4.5, 4.5, '#38bdf8', {
            highlight: '#ffffff',
            lineWidth: 1.8,
          });
          drawCelRoundRect(c, hx - hr, hy - hr - 3, hr * 1.8, 3.5, 1.5, pal.main, { lineWidth: 1.4 });
        },
        drawWeapon: (c) => {
          // Heavy pneumatic brass steam-piston warhammer!
          drawInkLimb(c, 0, 5, 3, -18, 3.8, '#475569', 2.8);
          drawCelRoundRect(c, -6, -27, 19, 11, 3, '#d97706', {
            highlight: '#fef08a',
            shadow: '#78350f',
            lineWidth: 2.1,
          });
          drawCelRoundRect(c, 10, -25.5, 4.5, 8, 1.5, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.6 });
          drawCelEllipse(c, 3, -21.5, 3, 3, pal.main, { lineWidth: 1.3 });
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
        scale: 1.09,
        torsoW: 17,
        skin: '#f4c095',
        torsoFill: '#78350f',
        torsoHighlight: '#b45309',
        torsoShadow: '#451a03',
        pantsColor: '#334155',
        bootColor: '#1e293b',
        beltColor: '#d97706',
        armColor: pal.main,
        mask: 'goggles',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Brass ammo hopper backpack
          drawCelRoundRect(c, -13, topY + 2, 8, 15, 2.5, '#92400e', { highlight: '#d97706', lineWidth: 1.8 });
          drawCelRoundRect(c, -12, topY + 5, 6, 4, 1, pal.main, { lineWidth: 1.2 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Victorian leather aviator / gunner cap with team stripe
          drawCelEllipse(c, hx, hy - 4, hr + 1.2, hr * 0.72, '#5c3412', {
            highlight: '#92400e',
            lineWidth: 2.0,
          });
          drawCelRoundRect(c, hx - hr, hy - 6, hr * 2 + 1, 3, 1.2, pal.main, { lineWidth: 1.3 });
        },
        drawWeapon: (c, firing) => {
          // Multi-barrel brass rotary Gatling gun!
          drawCelRoundRect(c, -4, -5, 13, 9, 2.5, '#475569', { highlight: '#94a3b8', lineWidth: 1.9 });
          // Three rotating barrels
          for (let i = -1; i <= 1; i++) {
            drawCelRoundRect(c, 8, -2.5 + i * 3.1, 18, 2.5, 1, '#f59e0b', {
              highlight: '#fef08a',
              lineWidth: 1.4,
            });
          }
          // Barrel clamp ring
          drawCelRoundRect(c, 19, -6.2, 3.6, 11.4, 1, '#334155', { lineWidth: 1.5 });
          if (firing) {
            drawCartoonMuzzleFlash(c, 30, -1, 12, '#f97316', '#fef08a');
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
        scale: 1.11,
        torsoW: 17,
        skin: '#f4c095',
        torsoFill: '#334155',
        torsoHighlight: '#64748b',
        torsoShadow: '#1e293b',
        pantsColor: '#1e293b',
        bootColor: '#0f172a',
        beltColor: '#d97706',
        armColor: '#475569',
        mask: 'goggles',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Iconic dual copper-ring Tesla Coil tower on backpack crackling with electric arcs!
          drawCelRoundRect(c, -15, topY + 2, 10, 17, 2.5, '#475569', { lineWidth: 1.9 });
          drawInkLimb(c, -10, topY + 2, -10, topY - 14, 3.6, '#d97706', 2.4);
          drawCelEllipse(c, -10, topY - 5, 7, 2.5, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.5 });
          drawCelEllipse(c, -10, topY - 10, 6.2, 2.3, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.5 });
          drawEnergyOrb(c, -10, topY - 15, 4.2, '#38bdf8', '#ffffff');
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Insulated dome helm + lightning fin
          drawCelEllipse(c, hx, hy - 3.5, hr + 1.4, hr * 0.85, pal.main, {
            highlight: pal.light,
            shadow: pal.dark,
            lineWidth: 2.0,
          });
          drawCelEllipse(c, hx, hy - hr - 3.5, 3, 3, '#38bdf8', { highlight: '#ffffff', lineWidth: 1.4 });
        },
        drawWeapon: (c, firing) => {
          // Copper Tesla Arc Emitter Rifle!
          drawCelRoundRect(c, -4, -3.5, 22, 6.5, 2, '#475569', { highlight: '#94a3b8', lineWidth: 1.9 });
          drawCelRoundRect(c, 8, -6.2, 3.5, 11.8, 1.2, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.5 });
          drawCelRoundRect(c, 14, -5.6, 3.5, 10.6, 1.2, '#f59e0b', { highlight: '#fef08a', lineWidth: 1.5 });
          drawEnergyOrb(c, 22, -0.5, firing ? 7.2 : 4.2, '#38bdf8', '#ffffff');
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
        scale: 1.07,
        skin: '#f4c095',
        torsoFill: '#4d6b3c',
        torsoHighlight: '#72945a',
        torsoShadow: '#2f4424',
        pantsColor: '#3f5232',
        bootColor: '#292524',
        beltColor: '#78350f',
        armColor: '#4d6b3c',
        swingStyle: 'aim',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Team shoulder armband & ammo pouches
          drawCelRoundRect(c, tx + 2, ty + 3, tw - 4, 3.4, 1.2, pal.main, { highlight: pal.light, lineWidth: 1.2 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Iconic WWII M1 rounded steel combat helmet with team band!
          drawCelEllipse(c, hx + 0.3, hy - 3.5, hr + 2.2, hr * 0.85, '#3f5a32', {
            highlight: '#6d8e58',
            shadow: '#26381e',
            lineWidth: 2.1,
          });
          drawCelRoundRect(c, hx - hr - 1.5, hy - 4.8, hr * 2 + 3.5, 2.6, 1, pal.main, { lineWidth: 1.2 });
        },
        drawWeapon: (c, firing) => {
          // Wooden bolt-action rifle + steel bayonet
          drawCelRoundRect(c, -6, -2.2, 20, 4.6, 1.5, '#854d0e', { highlight: '#b45309', lineWidth: 1.8 });
          drawCelRoundRect(c, 5, -4, 21, 2.8, 1, '#475569', { highlight: '#cbd5e1', lineWidth: 1.6 });
          drawCelPoly(
            c,
            [
              [22, -1],
              [31, -2.5],
              [22, -3.5],
            ],
            '#e2e8f0',
            { lineWidth: 1.3 },
          );
          if (firing) {
            drawCartoonMuzzleFlash(c, 28, -2.6, 10, '#f97316', '#fef08a');
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
        scale: 1.1,
        torsoW: 17.5,
        skin: '#94a3b8',
        torsoFill: '#475569',
        torsoHighlight: '#64748b',
        torsoShadow: '#1e293b',
        pantsColor: '#334155',
        bootColor: '#1e293b',
        beltColor: '#f59e0b',
        armColor: '#475569',
        mask: 'gasmask',
        swingStyle: 'aim',
        drawBackAccessory: (c, topY) => {
          // Twin crimson pressurized napalm fuel tanks on back!
          drawCelRoundRect(c, -15, topY, 7, 18, 3.2, '#dc2626', {
            highlight: '#fca5a5',
            shadow: '#7f1d1d',
            lineWidth: 1.9,
          });
          drawCelRoundRect(c, -10, topY + 1, 6, 17, 2.8, '#ea580c', {
            highlight: '#fdba74',
            shadow: '#9a3412',
            lineWidth: 1.8,
          });
          drawCelRoundRect(c, -14, topY + 6, 10, 3.2, 1, '#facc15', { lineWidth: 1.2 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          drawCelEllipse(c, hx + 0.5, hy - 3.5, hr + 2, hr * 0.85, '#334155', {
            highlight: '#64748b',
            lineWidth: 2.0,
          });
          drawCelRoundRect(c, hx - hr - 1, hy - 5, hr * 2 + 2.5, 2.6, 1, pal.main, { lineWidth: 1.2 });
        },
        drawWeapon: (c, firing) => {
          // Heavy steel flamethrower wand with blazing pilot flame!
          drawCelRoundRect(c, -4, -3.5, 23, 5.5, 1.8, '#334155', { highlight: '#94a3b8', lineWidth: 1.9 });
          drawCelRoundRect(c, 16, -5.2, 6, 8.6, 1.5, '#f97316', { highlight: '#fef08a', lineWidth: 1.6 });
          drawEnergyOrb(c, 24, -1, firing ? 9.5 : 4.2, '#f97316', '#fef08a');
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
        scale: 1.09,
        skin: '#d6a480',
        torsoFill: '#1e293b',
        torsoHighlight: '#475569',
        torsoShadow: '#0f172a',
        pantsColor: '#334155',
        bootColor: '#0f172a',
        beltColor: '#1e293b',
        armColor: '#334155',
        pauldronColor: pal.main,
        mask: 'nvg',
        swingStyle: 'aim',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Tactical ballistic plate carrier + team patch
          drawCelRoundRect(c, tx + 2.5, ty + 3, tw - 5, 11, 2, '#334155', {
            highlight: '#64748b',
            lineWidth: 1.5,
          });
          drawCelRoundRect(c, tx + 4, ty + 5, tw - 8, 3, 1, pal.light, { lineWidth: 1.1 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Modern FAST tactical helmet + headset + dual glowing green NVGs
          drawCelEllipse(c, hx + 0.2, hy - 3.2, hr + 1.8, hr * 0.85, '#1e293b', {
            highlight: '#475569',
            lineWidth: 2.0,
          });
          drawCelRoundRect(c, hx - hr, hy - 5, hr * 1.4, 2.5, 1, pal.main, { lineWidth: 1.1 });
        },
        drawWeapon: (c, firing) => {
          // Sleek suppressed tactical M4/SCAR carbine with red-dot sight!
          drawCelRoundRect(c, -6, -3.5, 18, 5.4, 1.5, '#1e293b', { highlight: '#475569', lineWidth: 1.8 });
          drawCelRoundRect(c, 2, -6.5, 6, 3.2, 1, '#334155', { lineWidth: 1.3 });
          // Suppressor barrel
          drawCelRoundRect(c, 11, -3, 15, 3.6, 1.2, '#475569', { highlight: '#94a3b8', lineWidth: 1.6 });
          // Curved magazine
          drawCelRoundRect(c, 4, 1.5, 4, 7, 1.2, '#0f172a', { lineWidth: 1.4 });
          if (firing) {
            drawCartoonMuzzleFlash(c, 28, -1.5, 9.5, '#fbbf24', '#ffffff');
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
        scale: 1.1,
        torsoW: 17,
        skin: '#f2b88b',
        torsoFill: '#334155',
        torsoHighlight: '#64748b',
        torsoShadow: '#1e293b',
        pantsColor: '#475569',
        bootColor: '#0f172a',
        beltColor: '#1e293b',
        armColor: '#475569',
        swingStyle: 'aim',
        drawHelmet: (c, hx, hy, hr) => {
          drawCelEllipse(c, hx + 0.5, hy - 3.2, hr + 1.8, hr * 0.85, '#334155', {
            highlight: '#64748b',
            lineWidth: 2.0,
          });
          drawCelRoundRect(c, hx - hr, hy - 4.8, hr * 2 + 1.5, 3, 1, pal.main, { highlight: pal.light, lineWidth: 1.3 });
        },
        drawWeapon: (c, firing) => {
          // Chunky shoulder-mounted olive AT Rocket Launcher + warhead tip!
          drawCelRoundRect(c, -18, -10, 38, 8.2, 2.5, '#3f6212', {
            highlight: '#84cc16',
            shadow: '#1a2e05',
            lineWidth: 2.1,
          });
          // Flared rear exhaust cone
          drawCelPoly(
            c,
            [
              [-18, -10],
              [-24, -12.5],
              [-24, 0.5],
              [-18, -2],
            ],
            '#1e293b',
            { lineWidth: 1.7 },
          );
          // Yellow hazard band + red-tipped warhead
          drawCelRoundRect(c, 11, -10, 4, 8.2, 1, '#facc15', { lineWidth: 1.3 });
          if (!firing) {
            drawCelPoly(
              c,
              [
                [19, -10],
                [28, -6],
                [19, -2],
              ],
              '#ef4444',
              { highlight: '#fca5a5', lineWidth: 1.7 },
            );
          } else {
            drawCartoonMuzzleFlash(c, 25, -6, 13, '#f97316', '#fef08a');
            drawCartoonMuzzleFlash(c, -26, -6, 9, '#94a3b8', '#f8fafc');
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
        scale: 1.24,
        torsoW: 21,
        torsoH: 21,
        skin: '#1e293b',
        torsoFill: '#334155',
        torsoHighlight: '#64748b',
        torsoShadow: '#0f172a',
        pantsColor: '#1e293b',
        bootColor: '#0f172a',
        beltColor: '#475569',
        armColor: '#334155',
        pauldronColor: '#475569',
        pauldronTrim: pal.light,
        mask: 'visor',
        visorColor: pal.glow,
        swingStyle: 'aim',
        drawTorsoDetail: (c, tx, ty, tw) => {
          // Heavy armored EOD blast collar
          drawCelRoundRect(c, tx - 1, ty - 2, tw + 2, 6, 2.5, '#475569', {
            highlight: '#94a3b8',
            lineWidth: 1.9,
          });
          drawCelRoundRect(c, tx + 3, ty + 7, tw - 6, 8, 2, pal.main, { highlight: pal.light, lineWidth: 1.5 });
        },
        drawHelmet: (c, hx, hy, hr) => {
          drawCelRoundRect(c, hx - hr - 1.5, hy - hr - 1.5, hr * 2 + 3.5, hr * 2 + 1.5, 5, '#334155', {
            highlight: '#94a3b8',
            shadow: '#0f172a',
            lineWidth: 2.2,
          });
          drawCelRoundRect(c, hx + 1, hy - 3, 8.5, 4.4, 1.8, pal.glow, { highlight: '#ffffff', lineWidth: 1.5 });
        },
        drawOffhand: (c, sx, sy) => {
          // Towering ballistic riot shield with reinforced team window!
          drawCelRoundRect(c, sx - 1, sy - 16, 13, 30, 3.5, '#1e293b', {
            highlight: '#475569',
            shadow: '#090d16',
            lineWidth: 2.3,
          });
          drawCelRoundRect(c, sx + 1.5, sy - 12, 8.5, 5.5, 1.5, pal.glow, { highlight: '#ffffff', lineWidth: 1.5 });
          drawCelRoundRect(c, sx + 1.5, sy - 3, 8.5, 4, 1, pal.main, { lineWidth: 1.3 });
        },
        drawWeapon: (c, firing) => {
          // Chunky tactical breaching auto-shotgun
          drawCelRoundRect(c, -2, -3.5, 22, 6.2, 1.8, '#1e293b', { highlight: '#64748b', lineWidth: 1.9 });
          drawCelRoundRect(c, 15, -4, 8, 3.2, 1, '#94a3b8', { lineWidth: 1.5 });
          if (firing) {
            drawCartoonMuzzleFlash(c, 26, -2, 12, '#f97316', '#fef08a');
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
    // ERA 9: 미래 시대 (SCI-FI FUTURE)
    // ========================================================================
    case 'cyborg': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.15,
        torsoW: 18,
        torsoH: 20,
        skin: '#cbd5e1',
        torsoFill: '#e2e8f0',
        torsoHighlight: '#ffffff',
        torsoShadow: '#64748b',
        pantsColor: '#334155',
        bootColor: '#94a3b8',
        beltColor: pal.main,
        armColor: '#cbd5e1',
        pauldronColor: pal.main,
        pauldronTrim: pal.glow,
        mask: 'visor',
        visorColor: pal.glow,
        swingStyle: 'overhead',
        drawBackAccessory: (c, topY) => {
          // Sleek sci-fi cyber thruster fin
          drawCelPoly(
            c,
            [
              [-8, topY + 2],
              [-17, topY - 8],
              [-13, topY + 8],
            ],
            pal.main,
            { highlight: pal.glow, lineWidth: 1.8 },
          );
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          drawEnergyOrb(c, tx + tw / 2, ty + 8, 3.8, pal.glow, '#ffffff');
        },
        drawHelmet: (c, hx, hy, hr) => {
          drawCelRoundRect(c, hx - hr - 0.5, hy - hr - 1.5, hr * 2 + 2.5, hr * 2 + 1, 5, '#e2e8f0', {
            highlight: '#ffffff',
            shadow: '#64748b',
            lineWidth: 2.1,
          });
          // Swept cyber visor
          drawCelPoly(
            c,
            [
              [hx - 1, hy - 4],
              [hx + hr + 2, hy - 2.5],
              [hx + hr + 1, hy + 2],
              [hx + 1, hy + 1.5],
            ],
            pal.glow,
            { highlight: '#ffffff', lineWidth: 1.5 },
          );
        },
        drawWeapon: (c) => {
          // Blazing high-tech plasma energy katana / saber!
          drawCelRoundRect(c, -2, -4, 6, 8, 1.8, '#334155', { lineWidth: 1.6 });
          c.save();
          c.shadowColor = pal.glow;
          c.shadowBlur = 8;
          drawCelPoly(
            c,
            [
              [-1, -4],
              [4, -4],
              [5.5, -27],
              [1.5, -33],
              [-1.5, -26],
            ],
            pal.glow,
            { highlight: '#ffffff', lineWidth: 1.7, ink: pal.dark },
          );
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
        scale: 1.12,
        torsoW: 16.5,
        skin: '#334155',
        torsoFill: '#1e293b',
        torsoHighlight: '#475569',
        torsoShadow: '#090d16',
        pantsColor: '#0f172a',
        bootColor: '#334155',
        capeColor: pal.dark,
        capeDark: '#090d16',
        armColor: '#334155',
        mask: 'visor',
        visorColor: '#38bdf8',
        swingStyle: 'aim',
        drawHelmet: (c, hx, hy, hr) => {
          // Sleek hooded cyber recon sniper cowl + glowing sniper optic
          drawCelPoly(
            c,
            [
              [hx - hr - 3, hy + 3],
              [hx - hr - 2, hy - hr - 3],
              [hx + 3, hy - hr - 4],
              [hx + hr + 2, hy - 3],
              [hx + 2, hy + 4],
            ],
            '#1e293b',
            { highlight: '#475569', lineWidth: 2.0 },
          );
          drawEnergyOrb(c, hx + 4.8, hy - 1.5, 3.0, pal.glow, '#ffffff');
        },
        drawWeapon: (c, firing) => {
          // Ultra-long twin-rail electromagnetic Railgun!
          drawCelRoundRect(c, -8, -4.5, 20, 7, 2, '#334155', { highlight: '#94a3b8', lineWidth: 1.9 });
          // Upper & lower accelerator rails with glowing core gap
          drawCelRoundRect(c, 10, -5.8, 25, 2.8, 1, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.5 });
          drawCelRoundRect(c, 10, -0.4, 25, 2.8, 1, '#cbd5e1', { highlight: '#ffffff', lineWidth: 1.5 });
          c.fillStyle = pal.glow;
          c.fillRect(11, -3, 23, 2.6);
          if (firing) {
            drawEnergyOrb(c, 36, -1.7, 7.5, pal.glow, '#ffffff');
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
    // ERA 10: 성간 문명 (INTERSTELLAR COSMIC)
    // ========================================================================
    case 'void_templar': {
      drawCartoonHumanoid(ctx, {
        walkPhase: p.walkPhase,
        isWalking: p.isWalking,
        attackAnim: p.attackAnim,
        hitFlash: p.hitFlash,
        deathProgress: p.deathProgress,
        scale: 1.19,
        torsoW: 19,
        torsoH: 20,
        skin: '#1e1b4b',
        torsoFill: '#1e1b4b',
        torsoHighlight: '#4c1d95',
        torsoShadow: '#09071a',
        pantsColor: '#1e1b4b',
        bootColor: '#f59e0b',
        beltColor: '#facc15',
        armColor: '#312e81',
        capeColor: pal.main,
        capeDark: '#312e81',
        pauldronColor: '#f59e0b',
        pauldronTrim: '#fef08a',
        mask: 'visor',
        visorColor: '#facc15',
        swingStyle: 'overhead',
        drawBackAccessory: (c, topY) => {
          // Floating golden cosmic energy halo behind head!
          c.save();
          setInkStyle(c, 3.6, INK);
          c.beginPath();
          c.ellipse(0, topY - 12, 13, 13, 0, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = '#facc15';
          c.lineWidth = 2.0;
          c.stroke();
          c.restore();
        },
        drawTorsoDetail: (c, tx, ty, tw) => {
          drawEnergyOrb(c, tx + tw / 2, ty + 8, 4.0, '#c084fc', '#fef08a');
        },
        drawHelmet: (c, hx, hy, hr) => {
          // Gilded obsidian space-paladin crown helm
          drawCelPoly(
            c,
            [
              [hx - hr - 1, hy + 4],
              [hx - hr - 2, hy - 4],
              [hx + 1, hy - hr - 7],
              [hx + hr + 2, hy - 3],
              [hx + hr, hy + 5],
            ],
            '#1e1b4b',
            { highlight: '#6d28d9', lineWidth: 2.1 },
          );
          drawCelPoly(
            c,
            [
              [hx - 2, hy - hr - 5],
              [hx + 1, hy - hr - 10],
              [hx + 4, hy - hr - 5],
            ],
            '#facc15',
            { highlight: '#fef08a', lineWidth: 1.5 },
          );
          drawCelRoundRect(c, hx + 1, hy - 3.2, 8.2, 3.5, 1.5, '#fef08a', { lineWidth: 1.3 });
        },
        drawWeapon: (c) => {
          // Radiant violet-gold psionic cosmic greatsword!
          drawCelRoundRect(c, -5, -4, 12, 4, 1.4, '#facc15', { highlight: '#fef08a', lineWidth: 1.6 });
          drawCelPoly(
            c,
            [
              [-2.5, -4],
              [4.5, -4],
              [6.5, -28],
              [1, -36],
              [-4.5, -28],
            ],
            '#a855f7',
            { highlight: '#f5d0fe', shadow: '#581c87', lineWidth: 2.0 },
          );
          c.fillStyle = '#fef08a';
          c.fillRect(0, -28, 2, 22);
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
        scale: 1.14,
        skin: '#0f172a',
        torsoFill: '#1e1b4b',
        torsoHighlight: '#4338ca',
        torsoShadow: '#09071a',
        pantsColor: '#1e1b4b',
        bootColor: '#d97706',
        capeColor: '#4c1d95',
        capeDark: '#1e1b4b',
        armColor: '#312e81',
        pauldronColor: pal.main,
        pauldronTrim: '#facc15',
        mask: 'visor',
        visorColor: '#e879f9',
        swingStyle: 'aim',
        drawHelmet: (c, hx, hy, hr) => {
          drawCelPoly(
            c,
            [
              [hx - hr - 3, hy + 4],
              [hx - hr - 3, hy - hr - 4],
              [hx + 4, hy - hr - 6],
              [hx + hr + 3, hy - 2],
              [hx + 2, hy + 5],
            ],
            '#312e81',
            { highlight: '#6366f1', lineWidth: 2.0 },
          );
          drawEnergyOrb(c, hx + 5, hy - 1.5, 3.2, '#e879f9', '#ffffff');
        },
        drawWeapon: (c, firing) => {
          // Levitating graviton-ring dark-matter accelerator cannon!
          drawCelRoundRect(c, -6, -4.5, 19, 7, 2, '#1e1b4b', { highlight: '#6366f1', lineWidth: 1.9 });
          // Two floating golden gravity-focus rings
          drawCelEllipse(c, 18, -1, 3.2, 7.2, '#facc15', { highlight: '#fef08a', lineWidth: 1.6 });
          drawCelEllipse(c, 26, -1, 2.6, 5.8, '#facc15', { highlight: '#fef08a', lineWidth: 1.5 });
          drawEnergyOrb(c, 33, -1, firing ? 8.5 : 4.8, '#c084fc', '#fef08a');
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
  // Back hydraulic steel mech leg
  drawInkLimb(ctx, -6, hipY + 4, -14 - stride * 10, -16, 8.2, '#78350f', 3.8);
  drawInkLimb(ctx, -14 - stride * 10, -16, -6 - stride * 12, -3, 7.6, '#475569', 3.6);
  drawCelRoundRect(ctx, -14 - stride * 12, -7, 16, 7, 2.5, '#334155', { lineWidth: 2.0 });

  // Riveted smoking chimney stack on rear!
  drawCelRoundRect(ctx, -20, hipY - 38, 10, 26, 2.5, '#475569', { highlight: '#94a3b8', lineWidth: 2.1 });
  drawCelRoundRect(ctx, -22, hipY - 41, 14, 5, 1.5, '#d97706', { highlight: '#fef08a', lineWidth: 1.8 });
  const puffY = hipY - 46 - ((p.walkPhase * 4) % 8);
  drawCelEllipse(ctx, -16, puffY, 6.5, 4.8, 'rgba(226, 232, 240, 0.82)', { lineWidth: 1.4 });

  // Front hydraulic mech leg
  drawInkLimb(ctx, 6, hipY + 4, 0 + stride * 11, -16, 8.6, '#b45309', 3.8);
  drawInkLimb(ctx, 0 + stride * 11, -16, 8 + stride * 13, -3, 8.0, '#64748b', 3.6);
  drawCelRoundRect(ctx, 0 + stride * 13, -7, 17, 7, 2.5, '#475569', { highlight: '#94a3b8', lineWidth: 2.0 });

  // Spherical riveted copper boiler cabin!
  drawCelEllipse(ctx, 0, hipY - 12, 22, 20, '#d97706', {
    highlight: '#fef08a',
    shadow: '#92400e',
    lineWidth: 2.5,
  });
  drawRivetStrip(ctx, -14, hipY - 2, 12, hipY - 2, 5, 1.3);
  // Team painted armor plate + glowing amber pilot porthole
  drawCelRoundRect(ctx, -12, hipY - 24, 24, 10, 3, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.9 });
  drawCelEllipse(ctx, 13, hipY - 14, 6.5, 6.5, '#38bdf8', { highlight: '#ffffff', shadow: '#0369a1', lineWidth: 2.0 });
  // Real rotating toothed brass clockwork gear on hull side!
  drawGearWheel(ctx, -8, hipY - 6, 8.2, p.walkPhase * 1.4, 8, '#facc15', '#fef08a', '#b45309');

  // Heavy side-mounted brass steampunk rotary cannon!
  const rx = -recoil * 6;
  drawCelRoundRect(ctx, 8 + rx, hipY - 7, 27, 10, 3, '#334155', {
    highlight: '#94a3b8',
    shadow: '#0f172a',
    lineWidth: 2.2,
  });
  drawCelRoundRect(ctx, 24 + rx, hipY - 8.5, 6, 13, 1.5, '#d97706', { highlight: '#fef08a', lineWidth: 1.7 });
  if (firing) {
    drawCartoonMuzzleFlash(ctx, 40 + rx, hipY - 2, 16, '#f97316', '#fef08a');
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
  ctx.translate(-12, 0);
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
    armColor: '#4d6b3c',
    swingStyle: 'throw',
    drawHelmet: (c, hx, hy, hr) => {
      drawCelEllipse(c, hx + 0.3, hy - 3.5, hr + 2, hr * 0.82, '#3f5a32', { highlight: '#6d8e58', lineWidth: 2.0 });
      drawCelRoundRect(c, hx - hr - 1, hy - 4.8, hr * 2 + 2.5, 2.6, 1, pal.main, { lineWidth: 1.2 });
    },
    drawWeapon: (c) => {
      if (!firing) {
        drawCelEllipse(c, 5, -4, 4.5, 6.2, '#475569', { highlight: '#cbd5e1', lineWidth: 1.6 });
      }
    },
  });
  ctx.restore();

  if (p.deathProgress < 0.4) {
    const mx = 10;
    const drop = recoil * 3.5;
    drawCelRoundRect(ctx, mx - 8, -5, 16, 5, 2, '#334155', { lineWidth: 1.8 });
    drawInkLimb(ctx, mx + 6, -18, mx + 12, -2, 3.0, '#475569', 2.2);
    ctx.save();
    ctx.translate(mx - 2, -5 + drop);
    ctx.rotate(-0.82);
    drawCelRoundRect(ctx, -3, -4.5, 26, 9, 2.5, '#3f5a32', {
      highlight: '#72945a',
      shadow: '#1e2e17',
      lineWidth: 2.2,
    });
    drawCelRoundRect(ctx, 18, -5.2, 5, 10.4, 1.5, pal.main, { highlight: pal.light, lineWidth: 1.5 });
    if (firing) {
      drawCartoonMuzzleFlash(ctx, 27, 0, 14, '#f97316', '#fef08a');
    }
    ctx.restore();
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
  drawTankTreads(ctx, -37, -21, 74, 21, p.walkPhase, 5, '#292524', '#57534e');

  drawCelPoly(
    ctx,
    [
      [-32, -19],
      [-22, -36],
      [22, -36],
      [34, -22],
      [30, -17],
      [-30, -17],
    ],
    '#5c6b45',
    { highlight: '#849668', shadow: '#354026', lineWidth: 2.5 },
  );
  drawRivetStrip(ctx, -26, -21, 26, -21, 7, 1.2);

  drawCelRoundRect(ctx, -18, -32, 34, 9, 2.5, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.8 });
  drawCelEllipse(ctx, -1, -27.5, 4.2, 4.2, '#f8fafc', { lineWidth: 1.3 });

  drawCelRoundRect(ctx, -15, -51, 29, 17, 6, '#4d5d38', {
    highlight: '#798c5c',
    shadow: '#2b361e',
    lineWidth: 2.4,
  });
  drawCelRoundRect(ctx, -10, -56, 11, 6, 2, '#3d4a2c', { highlight: '#798c5c', lineWidth: 1.8 });

  const rx = -recoil * 7;
  drawCelRoundRect(ctx, 11 + rx, -46, 29, 7, 2.2, '#334155', {
    highlight: '#94a3b8',
    shadow: '#0f172a',
    lineWidth: 2.2,
  });
  drawCelRoundRect(ctx, 35 + rx, -47.5, 6, 10, 1.5, '#1e293b', { highlight: '#64748b', lineWidth: 1.8 });

  if (firing) {
    drawCartoonMuzzleFlash(ctx, 45 + rx, -42.5, 17, '#f97316', '#fef08a');
  }
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
  drawTankTreads(ctx, -41, -19, 82, 19, p.walkPhase, 6, '#1e293b', '#475569');

  drawCelPoly(
    ctx,
    [
      [-40, -18],
      [-34, -33],
      [30, -33],
      [42, -21],
      [39, -14],
      [-38, -14],
    ],
    '#64748b',
    { highlight: '#cbd5e1', shadow: '#334155', lineWidth: 2.5 },
  );
  // Reactive ERA armor skirt blocks with bolts
  for (let i = 0; i < 5; i++) {
    drawCelRoundRect(ctx, -33 + i * 13, -24, 11, 8, 1.5, '#475569', {
      highlight: '#94a3b8',
      shadow: '#1e293b',
      lineWidth: 1.5,
    });
  }
  drawCelRoundRect(ctx, -30, -31, 56, 5.5, 1.5, pal.main, { highlight: pal.light, shadow: pal.dark, lineWidth: 1.5 });
  // Headlight glow on front glacis
  drawEnergyOrb(ctx, 37, -23, 2.4, '#fef08a', '#ffffff');

  setInkStyle(ctx, 1.8, '#0f172a');
  ctx.beginPath();
  ctx.moveTo(-22, -47);
  ctx.lineTo(-27 - Math.sin(p.walkPhase) * 2, -64);
  ctx.stroke();

  drawCelPoly(
    ctx,
    [
      [-26, -33],
      [-20, -49],
      [15, -49],
      [27, -39],
      [22, -33],
    ],
    '#475569',
    { highlight: '#94a3b8', shadow: '#1e293b', lineWidth: 2.5 },
  );
  drawRivetStrip(ctx, -18, -46, 12, -46, 5, 1.1);
  // Smoke grenade launcher cluster & glowing modern thermal targeter optic
  drawCelRoundRect(ctx, 6, -54, 9, 6, 1.8, '#1e293b', { highlight: '#475569', lineWidth: 1.6 });
  ctx.fillStyle = pal.glow;
  ctx.fillRect(10.5, -52.5, 3.5, 3);

  const rx = -recoil * 8;
  drawCelRoundRect(ctx, 18 + rx, -44.5, 38, 6.2, 1.8, '#334155', {
    highlight: '#cbd5e1',
    shadow: '#0f172a',
    lineWidth: 2.2,
  });
  drawCelRoundRect(ctx, 32 + rx, -46.2, 11, 9.6, 2.5, '#475569', {
    highlight: '#94a3b8',
    shadow: '#1e293b',
    lineWidth: 1.8,
  });

  if (firing) {
    drawCartoonMuzzleFlash(ctx, 60 + rx, -41.5, 19, '#f97316', '#fef08a');
  }
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

  // Twin glowing anti-gravity plasma thruster plumes underneath!
  const flameH = 9 + Math.sin(p.walkPhase * 5) * 3;
  drawCelPoly(
    ctx,
    [
      [-13, 4],
      [-7, 4],
      [-10, 4 + flameH],
    ],
    pal.glow,
    { lineWidth: 1.2, ink: pal.dark },
  );
  drawCelPoly(
    ctx,
    [
      [4, 4],
      [10, 4],
      [7, 4 + flameH],
    ],
    pal.glow,
    { lineWidth: 1.2, ink: pal.dark },
  );

  // Rear aerodynamic stabilizer wing
  drawCelPoly(
    ctx,
    [
      [-14, -4],
      [-26, -15],
      [-17, -14],
      [-4, -6],
    ],
    pal.main,
    { highlight: pal.light, shadow: pal.dark, lineWidth: 2.0 },
  );

  // Sleek glossy white-titanium oval drone carapace
  drawCelEllipse(ctx, 0, -4, 19, 11.5, '#e2e8f0', {
    highlight: '#ffffff',
    shadow: '#64748b',
    lineWidth: 2.3,
  });
  drawCelRoundRect(ctx, -14, -10, 22, 6, 3, pal.main, { highlight: pal.light, lineWidth: 1.7 });

  // Iconic glowing cyclops optic visor
  drawCelEllipse(ctx, 12, -5, 5.8, 5.2, '#0f172a', { lineWidth: 1.8 });
  drawEnergyOrb(ctx, 13.5, -5, 3.4, pal.glow, '#ffffff');

  // Underslung twin rapid plasma blasters!
  drawCelRoundRect(ctx, 2, 3, 18, 5.5, 2, '#334155', { highlight: '#94a3b8', lineWidth: 1.8 });
  if (firing) {
    drawEnergyOrb(ctx, 23, 5.8, 6.8, pal.glow, '#ffffff');
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
  // Back reverse-joint giant titanium leg
  drawInkLimb(ctx, -7, hipY + 4, -16 - stride * 12, -24, 10, '#475569', 4.2);
  drawInkLimb(ctx, -16 - stride * 12, -24, -8 - stride * 14, -4, 9.2, '#334155', 3.8);
  drawCelRoundRect(ctx, -18 - stride * 14, -9, 21, 9, 3, '#1e293b', { lineWidth: 2.2 });

  // Front reverse-joint giant titanium leg
  drawInkLimb(ctx, 8, hipY + 4, 2 + stride * 13, -24, 10.6, '#cbd5e1', 4.2);
  drawInkLimb(ctx, 2 + stride * 13, -24, 10 + stride * 15, -4, 9.6, '#64748b', 3.8);
  drawCelRoundRect(ctx, 0 + stride * 15, -9, 22, 9, 3, '#334155', { highlight: '#94a3b8', lineWidth: 2.2 });

  // Shoulder missile pod!
  drawCelRoundRect(ctx, -20, hipY - 52, 20, 17, 3.5, '#334155', { highlight: '#64748b', lineWidth: 2.2 });
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      drawCelEllipse(ctx, -15 + c * 5.2, hipY - 46 + r * 6, 2.2, 2.2, '#ef4444', { lineWidth: 1.1 });
    }
  }

  // Towering armored Titan Mech torso!
  drawCelPoly(
    ctx,
    [
      [-22, hipY - 4],
      [-26, hipY - 38],
      [22, hipY - 40],
      [27, hipY - 14],
      [16, hipY + 2],
      [-14, hipY + 2],
    ],
    '#e2e8f0',
    { highlight: '#ffffff', shadow: '#64748b', lineWidth: 2.6 },
  );
  // Team chest armor & glowing cockpit visor!
  drawCelRoundRect(ctx, -16, hipY - 34, 34, 16, 4, pal.main, {
    highlight: pal.light,
    shadow: pal.dark,
    lineWidth: 2.1,
  });
  drawCelPoly(
    ctx,
    [
      [4, hipY - 30],
      [22, hipY - 29],
      [19, hipY - 20],
      [4, hipY - 22],
    ],
    pal.glow,
    { highlight: '#ffffff', lineWidth: 1.8 },
  );
  // Reactor core
  drawEnergyOrb(ctx, -4, hipY - 12, 5.2, pal.glow, '#ffffff');

  // Massive right-arm twin plasma cannon!
  const rx = -recoil * 8;
  drawCelRoundRect(ctx, 4 + rx, hipY - 19, 38, 13, 3.5, '#334155', {
    highlight: '#94a3b8',
    shadow: '#0f172a',
    lineWidth: 2.4,
  });
  ctx.fillStyle = pal.glow;
  ctx.fillRect(10 + rx, hipY - 14.5, 28, 3.8);

  if (firing) {
    drawEnergyOrb(ctx, 46 + rx, hipY - 12.5, 12.5, pal.glow, '#ffffff');
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

  // Spinning golden celestial star-ring halo behind deity!
  ctx.save();
  ctx.translate(-2, -32);
  ctx.rotate(p.walkPhase * 0.65);
  setInkStyle(ctx, 4.4, INK);
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    drawCelEllipse(ctx, Math.cos(a) * 21, Math.sin(a) * 21, 3.2, 3.2, '#fef08a', { lineWidth: 1.4 });
  }
  ctx.restore();

  // Flowing levitating cosmic energy tail (no legs!)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.quadraticCurveTo(-14, -4, -3 + pulse * 0.6, 12);
  ctx.quadraticCurveTo(9, -4, 10, -20);
  ctx.closePath();
  const tailGrad = ctx.createLinearGradient(0, -22, 0, 12);
  tailGrad.addColorStop(0, pal.main);
  tailGrad.addColorStop(0.6, '#a855f7');
  tailGrad.addColorStop(1, '#fef08a');
  ctx.fillStyle = tailGrad;
  ctx.fill();
  setInkStyle(ctx, 2.2);
  ctx.stroke();
  ctx.restore();

  // Gilded obsidian celestial torso armor
  drawCelPoly(
    ctx,
    [
      [-12, -20],
      [-15, -39],
      [15, -39],
      [12, -20],
    ],
    '#1e1b4b',
    { highlight: '#6d28d9', lineWidth: 2.2 },
  );
  drawCelRoundRect(ctx, -16, -42, 10, 9, 3, '#facc15', { highlight: '#fef08a', lineWidth: 1.8 });
  drawCelRoundRect(ctx, 6, -42, 10, 9, 3, '#facc15', { highlight: '#fef08a', lineWidth: 1.8 });

  // Radiant faceless golden Archon crown head
  drawCelEllipse(ctx, 1, -47, 8, 9, '#fef08a', { highlight: '#ffffff', shadow: '#f59e0b', lineWidth: 2.0 });
  drawCelPoly(
    ctx,
    [
      [-6, -52],
      [1, -63],
      [8, -52],
    ],
    '#facc15',
    { highlight: '#fef9c3', lineWidth: 1.8 },
  );

  // Orbiting Antimatter Nova Spheres channeling forward!
  const reach = firing ? 26 : 18;
  drawEnergyOrb(ctx, reach, -32 + pulse * 0.5, firing ? 9.5 : 5.8, '#c084fc', '#ffffff');
  drawEnergyOrb(ctx, -18, -28 - pulse * 0.5, 4.6, pal.glow, '#fef08a');

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

  // Radiant golden-violet celestial energy wings sweeping behind!
  const wingFlap = Math.sin(p.walkPhase * 1.5) * 4;
  drawCelPoly(
    ctx,
    [
      [-10, hipY - 34],
      [-46, hipY - 66 + wingFlap],
      [-32, hipY - 36 + wingFlap * 0.5],
      [-42, hipY - 22 + wingFlap * 0.4],
      [-12, hipY - 14],
    ],
    '#a855f7',
    { highlight: '#f5d0fe', shadow: '#581c87', lineWidth: 2.3 },
  );
  drawCelPoly(
    ctx,
    [
      [-12, hipY - 34],
      [-34, hipY - 54 + wingFlap],
      [-20, hipY - 28],
    ],
    '#facc15',
    { highlight: '#fef08a', lineWidth: 1.7 },
  );

  // Colossal obsidian & gold Titan legs!
  drawInkLimb(ctx, -9, hipY + 4, -18 - stride * 12, -26, 11.5, '#1e1b4b', 4.4);
  drawInkLimb(ctx, -18 - stride * 12, -26, -10 - stride * 14, -4, 10.5, '#312e81', 4.0);
  drawCelRoundRect(ctx, -20 - stride * 14, -10, 23, 10, 3, '#d97706', { highlight: '#fef08a', lineWidth: 2.2 });

  drawInkLimb(ctx, 10, hipY + 4, 4 + stride * 13, -26, 12, '#312e81', 4.4);
  drawInkLimb(ctx, 4 + stride * 13, -26, 12 + stride * 15, -4, 11, '#4c1d95', 4.0);
  drawCelRoundRect(ctx, 2 + stride * 15, -10, 24, 10, 3, '#f59e0b', { highlight: '#fef08a', lineWidth: 2.2 });

  // Monumental gilded-obsidian God-Mech Torso!
  drawCelPoly(
    ctx,
    [
      [-24, hipY - 4],
      [-30, hipY - 44],
      [26, hipY - 44],
      [29, hipY - 16],
      [18, hipY + 2],
      [-16, hipY + 2],
    ],
    '#1e1b4b',
    { highlight: '#4c1d95', shadow: '#09071a', lineWidth: 2.8 },
  );
  // Golden chest armor wings + Team Mantle
  drawCelRoundRect(ctx, -24, hipY - 44, 48, 12, 4, '#f59e0b', {
    highlight: '#fef08a',
    shadow: '#b45309',
    lineWidth: 2.3,
  });
  drawCelRoundRect(ctx, -14, hipY - 30, 30, 18, 4, pal.main, { highlight: pal.light, lineWidth: 2.0 });

  // Pulsing Singularity Chest Core!
  drawEnergyOrb(ctx, 1, hipY - 21, 8.2, '#c084fc', '#fef08a');
  ctx.fillStyle = '#09071a';
  ctx.beginPath();
  ctx.arc(1, hipY - 21, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // Crowned Titan Head + Glowing Halo!
  drawCelPoly(
    ctx,
    [
      [-10, hipY - 43],
      [-12, hipY - 60],
      [2, hipY - 69],
      [15, hipY - 58],
      [13, hipY - 43],
    ],
    '#1e1b4b',
    { highlight: '#6d28d9', lineWidth: 2.4 },
  );
  drawCelRoundRect(ctx, 2, hipY - 55, 11, 4.8, 2, '#fef08a', { highlight: '#ffffff', lineWidth: 1.5 });
  // Crown horns
  drawCelPoly(
    ctx,
    [
      [-9, hipY - 58],
      [-17, hipY - 72],
      [-3, hipY - 62],
    ],
    '#facc15',
    { lineWidth: 1.8 },
  );
  drawCelPoly(
    ctx,
    [
      [9, hipY - 58],
      [18, hipY - 72],
      [5, hipY - 62],
    ],
    '#facc15',
    { lineWidth: 1.8 },
  );

  // Colossal Twin Cosmic Obliterator Cannon Arm!
  const rx = -recoil * 9;
  drawCelRoundRect(ctx, 6 + rx, hipY - 22, 42, 15, 4, '#1e1b4b', {
    highlight: '#6366f1',
    shadow: '#09071a',
    lineWidth: 2.5,
  });
  drawCelRoundRect(ctx, 12 + rx, hipY - 24, 16, 4, 1.5, '#facc15', { lineWidth: 1.5 });
  drawCelRoundRect(ctx, 12 + rx, hipY - 9, 16, 4, 1.5, '#facc15', { lineWidth: 1.5 });
  drawEnergyOrb(ctx, 50 + rx, hipY - 14.5, firing ? 14 : 6.8, '#e879f9', '#fef08a');

  ctx.restore();
}
