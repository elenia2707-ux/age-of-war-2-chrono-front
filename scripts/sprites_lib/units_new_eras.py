"""HD 1:1 Metal-Slug / Kingdom-Rush style pixel-art generators for the 3 new civilizations (9 units):
- Era 2 (Ancient Egypt): anubis_warrior (74x72), sun_priest (72x72), sphinx_chariot (126x106)
- Era 6 (Industrial Steampunk): steam_trooper (74x72), gatling_gunner (76x70), steam_walker (128x114)
- Era 10 (Interstellar Cosmic): void_templar (76x72), gravity_sniper (76x70), omega_titan (146x142)
"""

from __future__ import annotations

import math

from .canvas import PixelCanvas
from .humanoid import (
    TEAM_RAMP,
    draw_hd_face,
    draw_hit_sparks,
    draw_humanoid,
    draw_muzzle_flash,
    draw_slash_smear,
    draw_smoke_puff,
)
from .palettes import (
    BRASS,
    BRONZE,
    CHARCOAL,
    COPPER,
    COSMIC_VIOLET,
    CYAN_GLOW,
    DARK_STEEL,
    EGYPT_LINEN,
    FIRE,
    GOLD,
    HAIR_BROWN,
    HAZARD_YELLOW,
    INK,
    INK_SOFT,
    IRON,
    KHAKI,
    LEATHER,
    OBSIDIAN,
    OFF_WHITE,
    PLASMA_PINK,
    SANDSTONE,
    SKIN,
    SKIN_TAN,
    SMOKE,
    SOLAR_GOLD,
    STEEL,
    T_DEEP,
    T_GLOW,
    T_LIGHT,
    T_MID,
    T_SHADE,
    T_TRIM,
    TITANIUM,
    WHITE,
    WOOD,
)


# =============================================================================
# ERA 2: ANCIENT EGYPT (anubis_warrior, sun_priest, sphinx_chariot)
# =============================================================================

def gen_anubis_warrior(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Obsidian Jackal-Headed Anubis Guardian with Curved Golden Khopesh (74x72px)."""
    w, h = 74, 72

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Royal striped Nemes headdress flaps behind jackal head
        c.shaded_poly(
            [(cx - 9, cy - 6), (cx + 1, cy - 6), (cx + 1, cy + 10), (cx - 12, cy + 9)],
            TEAM_RAMP,
        )
        for sy in (cy - 3, cy + 1, cy + 5):
            c.rect(cx - 10, sy, 10, 2, GOLD[3])
        # Sculpted obsidian jackal skull + elongated hound muzzle
        c.shaded_ellipse(cx, cy - 1, 7, 7, OBSIDIAN)
        c.shaded_poly(
            [(cx + 3, cy - 3), (cx + 13, cy - 1), (cx + 12, cy + 4), (cx + 2, cy + 4)],
            OBSIDIAN,
        )
        c.px(cx + 12, cy, OBSIDIAN[4])
        # Tall pointed Anubis jackal ears with gleaming gold interior!
        c.shaded_poly([(cx - 5, cy - 6), (cx - 4, cy - 19), (cx, cy - 6)], OBSIDIAN)
        c.shaded_poly([(cx, cy - 6), (cx + 4, cy - 19), (cx + 6, cy - 6)], OBSIDIAN)
        c.line(cx - 4, cy - 15, cx - 3, cy - 8, GOLD[3], 2)
        c.line(cx + 3, cy - 15, cx + 3, cy - 8, GOLD[4], 2)
        # Fierce glowing golden eye + gold brow band
        c.rect(cx - 5, cy - 5, 11, 2, GOLD[3])
        if a != 'death_0':
            c.rect(cx + 2, cy - 2, 4, 2, SOLAR_GOLD[3])
            c.px(cx + 4, cy - 2, WHITE)
        else:
            c.px(cx + 3, cy - 2, INK)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Broad gilded Wesekh royal collar with team-colored jewel beads
        c.shaded_poly([(tx + 1, ty + 1), (tx + 16, ty + 1), (tx + 14, ty + 7), (tx + 3, ty + 7)], GOLD)
        for bx in (tx + 4, tx + 8, tx + 12):
            c.rect(bx, ty + 4, 2, 2, T_GLOW)
        # Sculpted obsidian chest musculature + royal pleated linen shendyt loincloth
        c.line(tx + 5, ty + 10, tx + 12, ty + 10, OBSIDIAN[1], 1)
        c.armor_plate(tx + 2, ty + 16, 13, 8, EGYPT_LINEN, sheen=False)
        c.box(tx + 6, ty + 16, 5, 9, TEAM_RAMP)
        c.rect(tx + 7, ty + 17, 3, 2, GOLD[4])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx + 2, sy + 2, sx + 18, sy + 2, 2.0, GOLD)
            c.shaded_capsule(sx + 18, sy + 2, sx + 25, sy - 3, 2.2, SOLAR_GOLD)
            return
        if a == 'attack_0':
            ex, ey = sx - 5, sy - 10
            c.shaded_capsule(sx, sy, ex, ey, 3.0, OBSIDIAN)
            c.box(ex - 2, ey - 3, 5, 4, GOLD)
            # Curved sickle Khopesh raised high behind head
            c.shaded_capsule(ex, ey - 2, ex - 6, ey - 14, 2.2, GOLD)
            c.shaded_capsule(ex - 6, ey - 14, ex + 4, ey - 22, 2.6, SOLAR_GOLD)
        elif a == 'attack_1':
            ex, ey = sx + 10, sy + 1
            c.shaded_capsule(sx, sy, ex, ey, 3.2, OBSIDIAN)
            c.box(ex - 2, ey - 2, 5, 5, GOLD)
            # Sweeping golden Khopesh cleave!
            c.shaded_capsule(ex + 2, ey, ex + 16, ey - 3, 2.2, GOLD)
            c.shaded_poly(
                [(ex + 14, ey - 6), (ex + 26, ey - 1), (ex + 28, ey + 9), (ex + 21, ey + 7), (ex + 18, ey)],
                SOLAR_GOLD,
            )
            c.line(ex + 17, ey - 4, ex + 26, ey + 6, WHITE, 1)
        elif a == 'attack_2':
            ex, ey = sx + 8, sy + 6
            c.shaded_capsule(sx, sy, ex, ey, 3.0, OBSIDIAN)
            c.shaded_capsule(ex + 1, ey + 1, ex + 15, ey + 10, 2.2, GOLD)
            c.shaded_capsule(ex + 15, ey + 10, ex + 22, ey + 7, 2.4, SOLAR_GOLD)
        else:
            sway = -2 if a in ('walk_1', 'walk_2') else 2
            ex, ey = sx + 7, sy + 2 + sway
            c.shaded_capsule(sx, sy, ex, ey, 3.0, OBSIDIAN)
            c.box(ex - 2, ey - 2, 5, 4, GOLD)
            c.shaded_capsule(ex + 2, ey - 1, ex + 11, ey - 10 + sway, 2.0, GOLD)
            c.shaded_poly(
                [(ex + 10, ey - 11 + sway), (ex + 21, ey - 16 + sway), (ex + 22, ey - 9 + sway), (ex + 14, ey - 7 + sway)],
                SOLAR_GOLD,
            )
            c.px(ex + 20, ey - 14 + sway, WHITE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 17, sy, 20, SOLAR_GOLD[2], SOLAR_GOLD[4])

    c = draw_humanoid(
        w, h, anim,
        skin=OBSIDIAN, torso=OBSIDIAN, legs=OBSIDIAN, boots=GOLD,
        belt=GOLD[3], buckle=T_GLOW,
        knee_armor=GOLD, has_team_shoulder=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_sun_priest(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Egyptian High Solar Priest with Horned Sun-Disk Crown & Radiant Ankh Scepter (72x72px)."""
    w, h = 72, 72

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN_TAN, brow_col=INK, warpaint=GOLD[3])
        # Striped royal Nemes headdress + curved Hathor horns cradling blazing Sun Disk!
        c.shaded_poly([(cx - 10, cy - 6), (cx + 8, cy - 6), (cx + 7, cy + 2), (cx - 11, cy + 5)], TEAM_RAMP)
        for sy in (cy - 4, cy - 1, cy + 2):
            c.rect(cx - 9, sy, 16, 1, GOLD[3])
        c.shaded_capsule(cx - 5, cy - 6, cx - 8, cy - 15, 1.6, GOLD)
        c.shaded_capsule(cx + 5, cy - 6, cx + 8, cy - 15, 1.6, GOLD)
        c.shaded_ellipse(cx, cy - 13, 5, 5, SOLAR_GOLD)
        c.ellipse(cx, cy - 13, 2, 2, WHITE)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        c.shaded_poly([(tx + 1, ty + 1), (tx + 16, ty + 1), (tx + 14, ty + 6), (tx + 3, ty + 6)], GOLD)
        c.box(tx + 6, ty + 6, 5, 14, TEAM_RAMP)
        c.rect(tx + 7, ty + 8, 3, 10, GOLD[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx - 4, sy + 3, sx + 26, sy + 3, 1.8, GOLD)
            c.shaded_ellipse(sx + 27, sy + 3, 5, 5, SOLAR_GOLD)
            return
        thrust = 6 if a == 'attack_1' else (-3 if a == 'attack_0' else 0)
        st_x = sx + 14 + thrust
        # Tall gilded Ankh Scepter with radiant floating sun crystal
        c.shaded_capsule(st_x, sy + 18, st_x, sy - 13, 2.0, GOLD)
        c.box(st_x - 5, sy - 11, 11, 3, GOLD)
        # Ankh loop + radiant floating sun orb
        orb_r = 6 if a in ('attack_0', 'attack_1') else 4.5
        c.shaded_ellipse(st_x, sy - 19, orb_r, orb_r, SOLAR_GOLD)
        c.ellipse(st_x, sy - 19, 2, 2, WHITE)
        # Priest arm + draped linen sleeve
        c.shaded_capsule(sx, sy, st_x - 2, sy, 3.0, EGYPT_LINEN)
        c.shaded_ellipse(st_x - 1, sy, 2.5, 2.5, SKIN_TAN)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        thrust = 6 if a == 'attack_1' else (-3 if a == 'attack_0' else 0)
        ox, oy = sx + 14 + thrust, sy - 19
        c.radial_glow(ox, oy, 10 if a == 'attack_1' else 6, (255, 223, 89, 150))
        if a == 'attack_1':
            draw_muzzle_flash(c, ox + 4, oy, 8, SOLAR_GOLD)
        elif a == 'attack_0':
            draw_hit_sparks(c, ox, oy, scale=1)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN_TAN, torso=EGYPT_LINEN, legs=EGYPT_LINEN, boots=GOLD,
        belt=GOLD[3], buckle=T_GLOW,
        has_team_sash=True, cape_ramp=TEAM_RAMP, has_team_shoulder=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=28,
    )
    return c, 28, h - 3


def gen_sphinx_chariot(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Colossal Living Gilded-Stone War Sphinx with Pharaoh Mask & Falcon Wings (134x106px)."""
    w, h = 134, 106
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.armor_plate(20, gy - 24, 68, 21, SANDSTONE, sheen=False)
        p.armor_plate(76, gy - 28, 28, 24, GOLD, sheen=True)
        p.box(72, gy - 24, 16, 16, TEAM_RAMP)
        p.line(38, gy - 22, 52, gy - 6, INK, 2)
        p.line(54, gy - 20, 62, gy - 8, INK, 2)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 64, gy - 32, 9)
        draw_smoke_puff(c, 92, gy - 24, 6)
        return c, 63, gy

    if anim == 'walk_0':
        fl, bl, bob, paw_lift = 10, -10, 0, 0
    elif anim == 'walk_1':
        fl, bl, bob, paw_lift = 2, 2, -4, 0
    elif anim == 'walk_2':
        fl, bl, bob, paw_lift = -10, 10, 0, 0
    elif anim == 'walk_3':
        fl, bl, bob, paw_lift = -2, -2, -4, 0
    elif anim == 'attack_0':
        fl, bl, bob, paw_lift = -4, -8, -6, 15
    elif anim == 'attack_1':
        fl, bl, bob, paw_lift = 16, -10, 3, 3
    elif anim == 'attack_2':
        fl, bl, bob, paw_lift = 10, -6, 1, 0
    else:
        fl, bl, bob, paw_lift = -8, -6, -4, 4

    dx = 5 if anim == 'attack_1' else (-5 if anim == 'hurt_0' else 0)
    bx = 56 + dx
    by = gy - 36 + bob

    # 1. Rear Carved Sandstone Lion Legs
    rl = c.part()
    dark_sand = (SANDSTONE[0], SANDSTONE[0], SANDSTONE[1], SANDSTONE[2])
    rl.shaded_capsule(bx - 24, by + 8, bx - 30 + bl, gy - 4, 6.5, dark_sand)
    rl.shaded_capsule(bx + 20, by + 8, bx + 26 - fl, gy - 4, 6.5, dark_sand)
    rl.box(bx - 33 + bl, gy - 8, 13, 8, BRONZE)
    rl.box(bx + 22 - fl, gy - 8, 13, 8, BRONZE)
    c.blit_part(rl, INK)

    # 2. Curved Stone Lion Tail with Golden Lotus Tassel
    tail = c.part()
    tail.shaded_capsule(bx - 29, by - 4, bx - 44, by - 16, 3.0, SANDSTONE)
    tail.shaded_ellipse(bx - 47, by - 19, 5, 5, GOLD)
    tail.px(bx - 48, by - 20, WHITE)
    c.blit_part(tail, INK)

    # 3. Massive Carved Sandstone Lion Torso + Ornate Winged Gold Harness & Team Mantle!
    body = c.part()
    body.shaded_ellipse(bx, by, 34, 17, SANDSTONE, light_x=-0.3, light_y=-0.5)
    # Stone masonry carved seams
    body.line(bx - 16, by - 10, bx - 16, by + 10, SANDSTONE[1], 1)
    body.line(bx + 6, by - 12, bx + 6, by + 12, SANDSTONE[1], 1)
    # Royal team cloth saddle mantle with gilded border
    body.armor_plate(bx - 24, by - 16, 44, 21, TEAM_RAMP, sheen=True)
    body.rect(bx - 24, by + 4, 44, 3, GOLD[3])
    # Sculpted layered Golden Falcon Wings sweeping along flank!
    wing_lift = -5 if anim in ('attack_0', 'attack_1') else 0
    body.shaded_poly(
        [(bx - 20, by - 12), (bx + 12, by - 16), (bx + 6, by + 5), (bx - 32, by + 3 + wing_lift)],
        GOLD,
    )
    for fy in (-9, -4, 1):
        body.line(bx - 24, by + fy + wing_lift // 2, bx + 6, by + fy - 2, SOLAR_GOLD[4], 1)
        body.line(bx - 24, by + fy + 1 + wing_lift // 2, bx + 6, by + fy - 1, GOLD[0], 1)
    c.blit_part(body, INK)

    # 4. Near Muscular Lion Legs & Massive Gilded Solar Claws!
    nl = c.part()
    nl.shaded_capsule(bx - 22, by + 9, bx - 25 - bl, gy - 4, 7.2, SANDSTONE)
    nl.armor_plate(bx - 29 - bl, gy - 9, 15, 9, GOLD, sheen=True)
    # Front mighty paw rearing up on attack_0 and smashing down on attack_1!
    fp_x = bx + 24 + fl
    fp_y = gy - 4 - paw_lift
    nl.shaded_capsule(bx + 20, by + 5, fp_x, fp_y, 7.2, SANDSTONE)
    nl.armor_plate(fp_x - 5, fp_y - 6, 17, 10, GOLD, sheen=True)
    for cy_off in (-3, 0, 3):
        nl.poly([(fp_x + 12, fp_y + cy_off - 1), (fp_x + 17, fp_y + cy_off), (fp_x + 12, fp_y + cy_off + 1)], WHITE)
    c.blit_part(nl, INK)

    # 5. Monumental Golden Pharaoh Sphinx Head + Striped Nemes Headdress + Solar Uraeus Cobra!
    head_p = c.part()
    hx = bx + 30
    hy = by - 27
    # Sweeping Nemes royal headdress wings with gold stripes
    head_p.shaded_poly(
        [(hx - 18, hy - 14), (hx + 11, hy - 14), (hx + 15, hy + 16), (hx - 22, hy + 12)],
        TEAM_RAMP,
    )
    for sy in (hy - 10, hy - 4, hy + 2, hy + 8):
        head_p.rect(hx - 17, sy, 29, 3, GOLD[3])
        head_p.rect(hx - 17, sy, 29, 1, SOLAR_GOLD[4])
    # Sculpted noble golden Pharaoh face mask
    head_p.armor_plate(hx - 4, hy - 10, 18, 20, GOLD, sheen=True)
    # Kohl-lined glowing mystic eyes!
    head_p.rect(hx + 4, hy - 4, 8, 4, INK)
    head_p.rect(hx + 6, hy - 3, 5, 2, T_GLOW)
    head_p.px(hx + 8, hy - 3, WHITE)
    # Royal sculpted Pharaoh ceremonial beard
    head_p.armor_plate(hx + 6, hy + 10, 6, 11, TEAM_RAMP, sheen=False)
    head_p.rect(hx + 6, hy + 14, 6, 2, GOLD[3])
    head_p.rect(hx + 6, hy + 18, 6, 2, GOLD[3])
    # Golden Cobra Uraeus & Blazing Solar Orb Crown atop headdress!
    head_p.shaded_capsule(hx + 2, hy - 14, hx + 6, hy - 22, 2.2, GOLD)
    head_p.shaded_ellipse(hx + 4, hy - 23, 6, 6, SOLAR_GOLD)
    head_p.ellipse(hx + 4, hy - 23, 2, 2, WHITE)
    c.blit_part(head_p, INK)

    c.add_outline(INK)
    c.radial_glow(hx + 4, hy - 23, 9, (255, 223, 89, 130))

    if anim == 'attack_1':
        draw_slash_smear(c, fp_x + 8, fp_y - 4, 18, SOLAR_GOLD[2], SOLAR_GOLD[4])
        draw_muzzle_flash(c, hx + 11, hy - 2, 7, SOLAR_GOLD)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, bx + 20, by - 12, scale=2)

    return c, 63, gy


# =============================================================================
# ERA 6: INDUSTRIAL STEAMPUNK (steam_trooper, gatling_gunner, steam_walker)
# =============================================================================

def gen_steam_trooper(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Brass-Helmeted Steampunk Ironclad Trooper with Boiler Pack & Steam Hammer (74x72px)."""
    w, h = 74, 72

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Domed riveted copper/brass diving-boiler ironclad helmet
        c.shaded_ellipse(cx, cy - 1, 9, 9, COPPER)
        c.rect(cx - 8, cy + 5, 16, 3, BRASS[2])
        # Circular brass viewport ring + glowing amber/cyan visor glass
        c.shaded_ellipse(cx + 3, cy - 1, 5, 5, BRASS)
        c.shaded_ellipse(cx + 4, cy - 1, 3.5, 3.5, SOLAR_GOLD if a == 'attack_1' else CYAN_GLOW)
        c.px(cx + 3, cy - 2, WHITE)
        # Top steam relief valve & rivet band
        c.box(cx - 2, cy - 12, 5, 4, BRASS)
        c.rect(cx - 4, cy - 13, 9, 2, GOLD[3])
        c.rect(cx - 7, cy - 5, 5, 3, TEAM_RAMP[2])

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Pressurized copper steam boiler tank + pressure dial + twin smokestacks!
        c.armor_plate(bx - 9, by + 1, 12, 16, COPPER, rivets=True)
        c.rect(bx - 9, by + 6, 12, 2, BRASS[3])
        c.ellipse(bx - 4, by + 11, 3, 3, OFF_WHITE)
        c.px(bx - 4, by + 11, FIRE[1])  # red pressure needle
        c.armor_plate(bx - 8, by - 9, 4, 11, IRON, sheen=False)
        c.armor_plate(bx - 3, by - 6, 4, 8, IRON, sheen=False)
        c.rect(bx - 9, by - 10, 6, 2, BRASS[3])

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Brass-trimmed armored chest plate + glowing boiler furnace grate
        c.armor_plate(tx + 2, ty + 2, 13, 12, IRON, rivets=True)
        c.box(tx + 5, ty + 5, 7, 5, FIRE)
        for gx in (tx + 7, tx + 9):
            c.rect(gx, ty + 5, 1, 5, IRON[0])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx + 2, sy + 2, sx + 22, sy + 2, 2.2, IRON)
            c.armor_plate(sx + 20, sy - 4, 10, 12, COPPER, rivets=True)
            return
        if a == 'attack_0':
            ex, ey = sx - 5, sy - 9
            c.shaded_capsule(sx, sy, ex, ey, 3.2, COPPER)
            c.shaded_capsule(ex, ey, ex - 9, ey - 14, 2.5, IRON)
            c.armor_plate(ex - 16, ey - 22, 13, 10, BRASS, rivets=True)
        elif a == 'attack_1':
            ex, ey = sx + 10, sy + 1
            c.shaded_capsule(sx, sy, ex, ey, 3.4, COPPER)
            c.shaded_capsule(ex, ey, ex + 18, ey + 3, 2.6, IRON)
            # Massive pneumatic brass-and-iron steam piston hammer head!
            c.armor_plate(ex + 15, ey - 5, 13, 15, COPPER, rivets=True)
            c.rect(ex + 25, ey - 5, 4, 15, BRASS[3])
            c.rect(ex + 17, ey, 6, 4, FIRE[3])
        elif a == 'attack_2':
            ex, ey = sx + 8, sy + 6
            c.shaded_capsule(sx, sy, ex, ey, 3.2, COPPER)
            c.shaded_capsule(ex, ey, ex + 16, ey + 11, 2.5, IRON)
            c.armor_plate(ex + 13, ey + 6, 12, 11, COPPER, rivets=True)
        else:
            sway = -2 if a in ('walk_1', 'walk_2') else 2
            ex, ey = sx + 7, sy + 2 + sway
            c.shaded_capsule(sx, sy, ex, ey, 3.2, COPPER)
            c.shaded_capsule(ex, ey, ex + 13, ey - 10 + sway, 2.4, IRON)
            c.armor_plate(ex + 9, ey - 18 + sway, 13, 11, COPPER, rivets=True)
            c.rect(ex + 19, ey - 18 + sway, 3, 11, BRASS[3])

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a in ('walk_1', 'walk_3', 'attack_1'):
            draw_smoke_puff(c, sx - 16, sy - 16, 4)
        if a == 'attack_1':
            draw_slash_smear(c, sx + 19, sy, 20, FIRE[2], SOLAR_GOLD[4])
            draw_smoke_puff(c, sx + 12, sy - 6, 4)

    c = draw_humanoid(
        w, h, anim,
        skin=COPPER, torso=COPPER, legs=CHARCOAL, boots=IRON,
        belt=LEATHER[1], buckle=BRASS[3],
        knee_armor=BRASS, has_team_shoulder=True, torso_armored=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=30,
    )
    return c, 30, h - 3


def gen_gatling_gunner(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Steampunk Aviator-Goggled Rotary Brass Gatling Gunner (76x70px)."""
    w, h = 76, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN, brow_col=HAIR_BROWN[0], beard_ramp=HAIR_BROWN)
        # Leather aviator skullcap + large gleaming brass goggles with cyan glass lenses!
        c.shaded_ellipse(cx - 1, cy - 5, 8, 5, LEATHER)
        c.rect(cx - 9, cy - 4, 17, 3, LEATHER[0])
        c.shaded_ellipse(cx + 1, cy - 3, 4, 4, BRASS)
        c.shaded_ellipse(cx + 6, cy - 3, 3.5, 4, BRASS)
        c.shaded_ellipse(cx + 1, cy - 3, 2.2, 2.2, CYAN_GLOW)
        c.shaded_ellipse(cx + 6, cy - 3, 2, 2.2, CYAN_GLOW)
        c.px(cx + 1, cy - 4, WHITE)
        c.px(cx + 6, cy - 4, WHITE)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Heavy riveted brass ammo drum hopper + brass cartridge feed belt
        c.armor_plate(bx - 9, by + 2, 11, 15, BRASS, rivets=True)
        c.box(bx - 7, by + 5, 7, 7, TEAM_RAMP)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.armor_plate(sx + 2, sy - 2, 24, 9, BRASS, rivets=True)
            return
        recoil = -3 if a == 'attack_1' else 0
        gy_w = sy + 2
        # Heavy underslung brass-and-iron multi-barrel Rotary Gatling Cannon!
        c.armor_plate(sx + 1 + recoil, gy_w - 5, 14, 10, IRON, rivets=True)
        c.box(sx + 4 + recoil, gy_w - 3, 8, 6, TEAM_RAMP)
        # Hanging brass bullet feed belt
        for bx_c in range(sx - 4, sx + 5, 3):
            c.rect(bx_c, gy_w + 4, 2, 4, GOLD[3])
            c.px(bx_c, gy_w + 4, WHITE)
        # 3 gleaming rotating brass barrels + barrel clamp rings
        for by_b in (gy_w - 4, gy_w - 1, gy_w + 2):
            c.box(sx + 14 + recoil, by_b, 20, 2, BRASS if a != 'attack_1' else SOLAR_GOLD)
        c.rect(sx + 22 + recoil, gy_w - 5, 3, 10, IRON[3])
        c.rect(sx + 31 + recoil, gy_w - 5, 3, 10, IRON[3])
        # Gripping arm + crank handle
        c.shaded_capsule(sx - 1, sy, sx + 8 + recoil, gy_w - 1, 2.8, LEATHER)
        c.shaded_ellipse(sx + 9 + recoil, gy_w - 1, 2.5, 2.5, SKIN)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 32, sy + 1, 9, FIRE)
        elif a == 'attack_2':
            draw_smoke_puff(c, sx + 35, sy, 4)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=LEATHER, legs=KHAKI, boots=LEATHER,
        belt=LEATHER[0], buckle=BRASS[3],
        has_team_sash=True, has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_steam_walker(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Towering Victorian Steampunk Boiler Dreadnought Walker with Clockwork Gears & Furnace (128x114px)."""
    w, h = 128, 114
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.shaded_ellipse(62, gy - 20, 30, 16, COPPER)
        p.armor_plate(44, gy - 14, 34, 11, DARK_STEEL, rivets=True)
        p.wheel(44, gy - 18, 9, GOLD, BRASS[1], 0.4)
        p.armor_plate(82, gy - 15, 26, 10, IRON, rivets=True)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 58, gy - 36, 10)
        draw_smoke_puff(c, 80, gy - 26, 8)
        return c, 64, gy

    if anim == 'walk_0':
        fl, bl, bob, gear_rot = 11, -11, 0, 0.0
    elif anim == 'walk_1':
        fl, bl, bob, gear_rot = 3, -3, -4, 0.35
    elif anim == 'walk_2':
        fl, bl, bob, gear_rot = -11, 11, 0, 0.7
    elif anim == 'walk_3':
        fl, bl, bob, gear_rot = -3, 3, -4, 1.05
    elif anim == 'attack_0':
        fl, bl, bob, gear_rot = -3, -8, -2, 0.2
    elif anim == 'attack_1':
        fl, bl, bob, gear_rot = 7, -10, 3, 0.6
    else:
        fl, bl, bob, gear_rot = -6, -5, -2, 0.1

    rec = -6 if anim == 'attack_1' else (-2 if anim == 'attack_2' else 0)
    cx = 60 + rec
    cy = gy - 54 + bob

    # 1. Back Heavy Hydraulic Iron Piston Leg
    bl_p = c.part()
    dark_i = (IRON[0], IRON[0], IRON[1], IRON[2])
    bl_p.shaded_capsule(cx - 12, cy + 16, cx - 18 + bl // 2, cy + 34, 6.5, dark_i)
    bl_p.shaded_capsule(cx - 18 + bl // 2, cy + 34, cx - 14 + bl, gy - 6, 5.5, dark_i)
    bl_p.armor_plate(cx - 24 + bl, gy - 11, 22, 10, DARK_STEEL, rivets=True)
    c.blit_part(bl_p, INK)

    # 2. Towering Twin Riveted Iron Chimneys & Brass Pressure Pipes behind Hull
    pipes = c.part()
    pipes.armor_plate(cx - 24, cy - 50, 9, 32, DARK_STEEL, rivets=True)
    pipes.armor_plate(cx - 11, cy - 44, 9, 26, DARK_STEEL, rivets=True)
    pipes.box(cx - 26, cy - 52, 13, 4, BRASS)
    pipes.box(cx - 13, cy - 46, 13, 4, BRASS)
    c.blit_part(pipes, INK)

    # 3. Massive Domed Riveted Copper & Iron Boiler Hull + Glowing Furnace Belly + Spinning Clockwork Gear!
    hull = c.part()
    # Main domed copper boiler carapace
    hull.shaded_ellipse(cx, cy - 4, 30, 26, COPPER, light_x=-0.3, light_y=-0.5)
    hull.armor_plate(cx - 28, cy + 4, 56, 18, DARK_STEEL, rivets=True)
    # Riveted brass boiler bands
    hull.rect(cx - 29, cy - 2, 58, 4, BRASS[3])
    hull.rect(cx - 28, cy - 2, 56, 1, GOLD[4])
    # Bold team sovereign heraldry armor plate
    hull.armor_plate(cx - 14, cy - 20, 28, 15, TEAM_RAMP, rivets=True)
    # Armored Brass Cockpit Viewport with glowing cyan glass!
    hull.shaded_ellipse(cx + 17, cy - 11, 9, 8, BRASS)
    hull.shaded_ellipse(cx + 18, cy - 11, 6, 5, CYAN_GLOW)
    hull.rect(cx + 15, cy - 14, 4, 2, WHITE)
    # Glowing fiery coal furnace belly grate!
    hull.armor_plate(cx + 4, cy + 7, 16, 11, IRON, sheen=False)
    hull.box(cx + 6, cy + 9, 12, 7, FIRE)
    for gx in (cx + 9, cx + 12, cx + 15):
        hull.rect(gx, cy + 9, 1, 7, IRON[0])
    # Iconic large spinning golden clockwork gear on flank!
    hull.wheel(cx - 14, cy + 9, 11, GOLD, BRASS[1], gear_rot)
    c.blit_part(hull, INK)

    # 4. Near Heavy Hydraulic Piston Leg + Brass Knee Joint + Clamped Iron Foot
    fl_p = c.part()
    fl_p.shaded_capsule(cx + 4, cy + 16, cx + 10 + fl // 2, cy + 34, 7.2, IRON)
    fl_p.shaded_capsule(cx + 10 + fl // 2, cy + 34, cx + 8 + fl, gy - 6, 6.2, IRON)
    # Brass hydraulic piston rod & riveted knee shield
    fl_p.line(cx + 1, cy + 20, cx + 5 + fl // 2, cy + 34, GOLD[3], 2)
    fl_p.shaded_ellipse(cx + 10 + fl // 2, cy + 34, 6.5, 6.5, BRASS)
    fl_p.armor_plate(cx - 2 + fl, gy - 11, 24, 10, IRON, rivets=True)
    fl_p.rect(cx + 18 + fl, gy - 9, 5, 8, BRASS[3])
    c.blit_part(fl_p, INK)

    # 5. Massive Pneumatic Arm-Mounted Steam Siege Cannon!
    gun = c.part()
    gun_y = cy + 2
    gun.shaded_ellipse(cx + 12, gun_y, 10, 10, COPPER)
    gun.armor_plate(cx + 16, gun_y - 7, 36, 14, IRON, rivets=True)
    gun.rect(cx + 22, gun_y - 8, 5, 16, BRASS[3])
    gun.rect(cx + 38, gun_y - 8, 5, 16, BRASS[3])
    gun.armor_plate(cx + 48, gun_y - 9, 7, 18, BRASS, sheen=True)
    gun.rect(cx + 54, gun_y - 5, 3, 10, INK)
    c.blit_part(gun, INK)

    c.add_outline(INK)
    # Billowing steam & coal smoke from twin chimneys
    draw_smoke_puff(c, cx - 20, cy - 56, 6)
    draw_smoke_puff(c, cx - 8, cy - 50, 5)
    if anim == 'attack_1':
        draw_muzzle_flash(c, cx + 55, gun_y, 12, FIRE)
        draw_smoke_puff(c, cx + 48, gun_y - 12, 6)
    elif anim == 'attack_2':
        draw_smoke_puff(c, cx + 56, gun_y - 4, 7)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, cx + 16, cy - 6, scale=2)

    return c, 64, gy


# =============================================================================
# ERA 10: INTERSTELLAR COSMIC (void_templar, gravity_sniper, omega_titan)
# =============================================================================

def gen_void_templar(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Cosmic Obsidian-Gold Void Templar with Floating Halo Crown & Blazing Plasma Greatsword (76x72px)."""
    w, h = 76, 72

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Sleek angular obsidian-and-gold celestial paladin helm
        c.shaded_ellipse(cx, cy - 1, 8, 8, OBSIDIAN)
        c.shaded_poly([(cx - 8, cy - 2), (cx + 1, cy - 10), (cx + 9, cy - 2), (cx + 6, cy + 6), (cx - 6, cy + 6)], OBSIDIAN)
        c.rect(cx - 2, cy - 9, 4, 15, GOLD[3])  # golden crest spine
        # Glowing cosmic T-visor slit
        c.rect(cx, cy - 3, 8, 4, INK)
        c.rect(cx + 1, cy - 2, 7, 2, T_GLOW)
        c.px(cx + 5, cy - 2, WHITE)
        # Levitating radiant golden Halo Ring floating above helmet!
        h_bob = -2 if a in ('walk_1', 'walk_3', 'attack_1') else 0
        c.rect(cx - 7, cy - 15 + h_bob, 14, 3, GOLD[3])
        c.rect(cx - 5, cy - 15 + h_bob, 10, 1, SOLAR_GOLD[4])
        c.px(cx, cy - 15 + h_bob, WHITE)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Sculpted obsidian-gold chestplate with glowing singularity star-core
        c.armor_plate(tx + 2, ty + 2, 13, 12, OBSIDIAN, sheen=True)
        c.rect(tx + 2, ty + 2, 13, 2, GOLD[3])
        c.shaded_ellipse(tx + 9, ty + 8, 3.5, 3.5, COSMIC_VIOLET)
        c.px(tx + 9, ty + 8, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx + 2, sy + 2, sx + 26, sy + 2, 2.2, COSMIC_VIOLET)
            c.rect(sx + 5, sy - 3, 3, 10, GOLD[3])
            return
        if a == 'attack_0':
            ex, ey = sx - 5, sy - 10
            c.shaded_capsule(sx, sy, ex, ey, 3.0, OBSIDIAN)
            c.rect(ex - 4, ey - 3, 9, 3, GOLD[3])
            c.shaded_poly([(ex - 2, ey - 3), (ex - 15, ey - 25), (ex - 10, ey - 27), (ex + 2, ey - 3)], COSMIC_VIOLET)
            c.line(ex - 1, ey - 4, ex - 12, ey - 25, WHITE, 1)
        elif a == 'attack_1':
            ex, ey = sx + 10, sy + 1
            c.shaded_capsule(sx, sy, ex, ey, 3.2, OBSIDIAN)
            c.rect(ex - 1, ey - 5, 4, 10, GOLD[3])
            # Massive blazing twin-edged cosmic plasma greatsword!
            c.shaded_poly([(ex + 3, ey - 4), (ex + 31, ey), (ex + 27, ey + 5), (ex + 3, ey + 4)], COSMIC_VIOLET)
            c.line(ex + 4, ey, ex + 29, ey, WHITE, 2)
        elif a == 'attack_2':
            ex, ey = sx + 8, sy + 6
            c.shaded_capsule(sx, sy, ex, ey, 3.0, OBSIDIAN)
            c.rect(ex - 1, ey - 3, 4, 8, GOLD[3])
            c.shaded_poly([(ex + 3, ey), (ex + 24, ey + 12), (ex + 21, ey + 16), (ex + 1, ey + 4)], COSMIC_VIOLET)
        else:
            sway = -2 if a in ('walk_1', 'walk_2') else 2
            ex, ey = sx + 7, sy + 2 + sway
            c.shaded_capsule(sx, sy, ex, ey, 3.0, OBSIDIAN)
            c.rect(ex - 2, ey - 3, 8, 3, GOLD[3])
            c.shaded_poly([(ex + 2, ey - 3), (ex + 19, ey - 21 + sway), (ex + 23, ey - 18 + sway), (ex + 6, ey)], COSMIC_VIOLET)
            c.line(ex + 4, ey - 4, ex + 20, ey - 19 + sway, WHITE, 1)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.radial_glow(sx + 28, sy + 1, 10, (212, 122, 255, 160))
            draw_slash_smear(c, sx + 19, sy, 22, COSMIC_VIOLET[3], WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=OBSIDIAN, torso=OBSIDIAN, legs=OBSIDIAN, boots=GOLD,
        belt=GOLD[3], buckle=T_GLOW,
        has_team_tabard=True, knee_armor=GOLD, cape_ramp=TEAM_RAMP, torso_armored=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_gravity_sniper(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Interstellar Astral Gravity-Lance Sharpshooter with Crystal Prism Visor (76x70px)."""
    w, h = 76, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Sleek sculpted astral recon helmet with glowing violet-gold cyclops prism
        c.shaded_ellipse(cx, cy - 1, 8, 8, OBSIDIAN)
        c.shaded_poly([(cx - 9, cy - 4), (cx - 1, cy - 10), (cx + 8, cy - 3), (cx + 5, cy + 5), (cx - 7, cy + 5)], OBSIDIAN)
        c.rect(cx + 1, cy - 4, 8, 5, GOLD[3])
        c.rect(cx + 3, cy - 3, 5, 3, COSMIC_VIOLET[3])
        c.px(cx + 5, cy - 2, WHITE)
        # Floating golden halo crescent
        c.rect(cx - 6, cy - 14, 12, 2, SOLAR_GOLD[3])
        c.px(cx, cy - 15, WHITE)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Floating diamond singularity battery prism behind back
        c.shaded_poly([(bx - 6, by + 2), (bx - 1, by + 9), (bx - 6, by + 16), (bx - 11, by + 9)], GOLD)
        c.shaded_ellipse(bx - 6, by + 9, 3, 3, COSMIC_VIOLET)
        c.px(bx - 6, by + 9, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.armor_plate(sx + 2, sy, 26, 5, GOLD, sheen=True)
            return
        recoil = -4 if a == 'attack_1' else 0
        # Twin-prong levitating Golden Gravity Singularity Lance!
        c.armor_plate(sx - 2 + recoil, sy - 4, 14, 9, OBSIDIAN, sheen=True)
        c.box(sx + 10 + recoil, sy - 6, 22, 3, GOLD)
        c.box(sx + 10 + recoil, sy + 2, 22, 3, GOLD)
        # Glowing violet-gold singularity core suspended between prongs!
        c.shaded_ellipse(sx + 21 + recoil, sy - 1, 4.5, 4.5, COSMIC_VIOLET)
        c.ellipse(sx + 21 + recoil, sy - 1, 2, 2, WHITE)
        # Gripping arm
        c.shaded_capsule(sx - 1, sy, sx + 9 + recoil, sy + 1, 2.8, OBSIDIAN)
        c.box(sx + 7 + recoil, sy - 1, 4, 4, GOLD)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        recoil = -4 if a == 'attack_1' else 0
        c.radial_glow(sx + 21 + recoil, sy - 1, 7, (192, 132, 252, 135))
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 31, sy - 1, 10, COSMIC_VIOLET)
        elif a == 'attack_0':
            draw_hit_sparks(c, sx + 30, sy - 1, scale=1)

    c = draw_humanoid(
        w, h, anim,
        skin=OBSIDIAN, torso=OBSIDIAN, legs=OBSIDIAN, boots=GOLD,
        belt=GOLD[3], buckle=COSMIC_VIOLET[3],
        has_team_sash=True, cape_ramp=TEAM_RAMP, has_team_shoulder=True, torso_armored=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_omega_titan(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Transcendent Interstellar God-Machine Omega Titan with Wing Pylons & Singularity Core (156x142px)."""
    w, h = 156, 142
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.armor_plate(26, gy - 26, 76, 22, OBSIDIAN, rivets=True)
        p.armor_plate(42, gy - 32, 42, 16, GOLD, sheen=True)
        p.shaded_ellipse(64, gy - 24, 11, 8, COSMIC_VIOLET)
        p.armor_plate(96, gy - 22, 26, 14, TEAM_RAMP, sheen=True)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 64, gy - 40, 11)
        draw_smoke_puff(c, 92, gy - 28, 8)
        return c, 68, gy

    hover = -4 if anim in ('walk_1', 'walk_3') else (-7 if anim == 'attack_0' else (2 if anim == 'attack_1' else 0))
    tilt = 5 if anim == 'attack_1' else (-5 if anim == 'hurt_0' else 0)
    cx = 64 + tilt
    cy = gy - 72 + hover

    # 1. Majestic Angled Celestial Energy Wing Pylons fanning behind Titan!
    wings = c.part()
    # Upper & lower sculpted golden-obsidian wing blades
    wings.shaded_poly(
        [(cx - 12, cy - 22), (cx - 56, cy - 52), (cx - 52, cy - 36), (cx - 18, cy - 8)],
        GOLD,
    )
    wings.shaded_poly(
        [(cx - 16, cy - 10), (cx - 54, cy - 28), (cx - 48, cy - 16), (cx - 18, cy)],
        TEAM_RAMP,
    )
    wings.shaded_poly(
        [(cx - 16, cy + 4), (cx - 46, cy - 4), (cx - 40, cy + 10), (cx - 16, cy + 12)],
        OBSIDIAN,
    )
    # Glowing energy plasma veins along wings
    wings.line(cx - 18, cy - 18, cx - 52, cy - 44, COSMIC_VIOLET[4], 2)
    wings.line(cx - 20, cy - 8, cx - 48, cy - 22, T_GLOW, 2)
    c.blit_part(wings, INK)

    # 2. Floating Levitation Throne-Legs & Plasma Thruster Trails!
    legs_p = c.part()
    # Back thruster greave
    legs_p.shaded_poly([(cx - 16, cy + 20), (cx - 4, cy + 20), (cx - 10, gy - 14), (cx - 24, gy - 12)], OBSIDIAN)
    legs_p.armor_plate(cx - 26, gy - 14, 20, 8, GOLD, sheen=True)
    # Front armored titan greave with glowing knee crystal
    legs_p.shaded_poly([(cx + 2, cy + 20), (cx + 18, cy + 20), (cx + 24, gy - 14), (cx + 6, gy - 12)], OBSIDIAN)
    legs_p.shaded_ellipse(cx + 12, cy + 36, 6, 6, GOLD)
    legs_p.ellipse(cx + 12, cy + 36, 3, 3, T_GLOW)
    legs_p.armor_plate(cx + 2, gy - 14, 24, 9, GOLD, sheen=True)
    # Anti-gravity blue-violet plasma jets beneath boots!
    legs_p.shaded_poly([(cx - 22, gy - 5), (cx - 8, gy - 5), (cx - 15, gy + 2)], COSMIC_VIOLET)
    legs_p.poly([(cx + 6, gy - 5), (cx + 22, gy - 5), (cx + 14, gy + 2)], T_GLOW)
    c.blit_part(legs_p, INK)

    # 3. Colossal Sculpted Obsidian-Gold Chassis & Blazing Miniature Singularity Reactor!
    body = c.part()
    body.shaded_poly(
        [(cx - 26, cy - 24), (cx + 26, cy - 24), (cx + 20, cy + 22), (cx - 20, cy + 22)],
        OBSIDIAN,
    )
    # Ornate golden rib framing & heraldic waist skirt
    body.armor_plate(cx - 26, cy - 24, 52, 9, GOLD, sheen=True)
    body.armor_plate(cx - 18, cy + 16, 36, 9, TEAM_RAMP, sheen=True)
    body.rect(cx - 18, cy + 22, 36, 3, GOLD[3])
    # Massive Sculpted Team Shoulder Pauldron Bastions with glowing crystals!
    body.armor_plate(cx - 32, cy - 30, 20, 22, GOLD, rivets=True)
    body.armor_plate(cx - 28, cy - 26, 12, 14, TEAM_RAMP, sheen=True)
    body.armor_plate(cx + 12, cy - 30, 20, 22, GOLD, rivets=True)
    body.armor_plate(cx + 16, cy - 26, 12, 14, TEAM_RAMP, sheen=True)
    # Central Swirling Singularity Reactor Chest Core!
    body.shaded_ellipse(cx + 2, cy - 2, 14, 14, GOLD)
    body.shaded_ellipse(cx + 2, cy - 2, 11, 11, COSMIC_VIOLET)
    body.ellipse(cx + 2, cy - 2, 5, 5, INK)
    body.rect(cx - 11, cy - 3, 26, 2, SOLAR_GOLD[4])
    body.px(cx + 2, cy - 2, WHITE)
    c.blit_part(body, INK)

    # 4. Crowned Celestial Angel-Mech Head + Orbiting Solar Halo Crown!
    head_p = c.part()
    hx, hy = cx + 4, cy - 36
    head_p.armor_plate(hx - 11, hy - 10, 22, 18, OBSIDIAN, sheen=True)
    head_p.rect(hx - 11, hy - 12, 22, 4, GOLD[3])
    head_p.rect(hx - 5, hy - 5, 16, 6, INK)
    head_p.rect(hx - 3, hy - 4, 13, 4, T_GLOW)
    head_p.rect(hx + 2, hy - 4, 6, 2, WHITE)
    # Levitating Cosmic Halo Ring + Crown Star
    head_p.shaded_ellipse(hx, hy - 19, 17, 4, SOLAR_GOLD)
    head_p.ellipse(hx, hy - 19, 11, 2, (0, 0, 0, 0))
    head_p.shaded_poly([(hx, hy - 28), (hx + 4, hy - 22), (hx, hy - 17), (hx - 4, hy - 22)], SOLAR_GOLD)
    head_p.px(hx, hy - 22, WHITE)
    c.blit_part(head_p, INK)

    # 5. Devastating Arm-Mounted Celestial Hyper-Singularity Cannon!
    gun = c.part()
    gx = cx + 10 + (4 if anim == 'attack_1' else 0)
    gy_c = cy + 6
    gun.armor_plate(gx - 8, gy_c - 10, 24, 20, OBSIDIAN, rivets=True)
    gun.box(gx + 14, gy_c - 11, 36, 5, GOLD)
    gun.box(gx + 14, gy_c + 5, 36, 5, GOLD)
    gun.box(gx + 12, gy_c - 6, 30, 11, TEAM_RAMP)
    # Crackling singularity plasma rail channel!
    gun.rect(gx + 14, gy_c - 3, 38, 5, COSMIC_VIOLET[3])
    gun.rect(gx + 16, gy_c - 1, 36, 2, WHITE)
    gun.shaded_ellipse(gx + 52, gy_c, 6 if anim in ('attack_0', 'attack_1') else 4, 6 if anim in ('attack_0', 'attack_1') else 4, COSMIC_VIOLET)
    gun.ellipse(gx + 52, gy_c, 2, 2, WHITE)
    c.blit_part(gun, INK)

    c.add_outline(INK)
    c.radial_glow(cx + 2, cy - 2, 16, (212, 122, 255, 110))
    c.radial_glow(gx + 52, gy_c, 11 if anim == 'attack_1' else 6, (250, 227, 255, 150))

    if anim == 'attack_1':
        draw_muzzle_flash(c, gx + 54, gy_c, 14, COSMIC_VIOLET)
    elif anim == 'attack_0':
        draw_hit_sparks(c, gx + 52, gy_c, scale=2)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, cx + 14, cy - 10, scale=2)

    return c, 68, gy


NEW_ERA_UNIT_GENERATORS = {
    'anubis_warrior': gen_anubis_warrior,
    'sun_priest': gen_sun_priest,
    'sphinx_chariot': gen_sphinx_chariot,
    'steam_trooper': gen_steam_trooper,
    'gatling_gunner': gen_gatling_gunner,
    'steam_walker': gen_steam_walker,
    'void_templar': gen_void_templar,
    'gravity_sniper': gen_gravity_sniper,
    'omega_titan': gen_omega_titan,
}
