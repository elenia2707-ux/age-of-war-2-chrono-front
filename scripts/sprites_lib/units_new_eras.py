"""High-density Metal-Slug-style pixel art generators for the 3 new civilizations (9 units):
- Era 2 (Ancient Egypt): anubis_warrior, sun_priest, sphinx_chariot
- Era 6 (Industrial Steampunk): steam_trooper, gatling_gunner, steam_walker
- Era 10 (Interstellar Cosmic): void_templar, gravity_sniper, omega_titan
"""

from __future__ import annotations

from .canvas import PixelCanvas
from .humanoid import (
    TEAM_RAMP,
    draw_hit_sparks,
    draw_humanoid,
    draw_muzzle_flash,
    draw_slash_smear,
    draw_smoke_puff,
)
from .palettes import (
    BRONZE,
    CHARCOAL,
    COPPER,
    COSMIC_VIOLET,
    CYAN_GLOW,
    DARK_STEEL,
    EGYPT_LINEN,
    FIRE,
    GOLD,
    HAZARD_YELLOW,
    INK,
    IRON,
    KHAKI,
    LEATHER,
    OBSIDIAN,
    OFF_WHITE,
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
# NEW ERA 2: ANCIENT EGYPT (anubis_warrior, sun_priest, sphinx_chariot)
# =============================================================================

def gen_anubis_warrior(anim: str) -> tuple[PixelCanvas, int, int]:
    """Jackal-headed Anubis Guardian wielding a curved golden Khopesh blade (38x38px)."""
    w, h = 38, 38

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Obsidian jackal head & elongated muzzle
        c.shaded_ellipse(cx, cy, 4, 4, OBSIDIAN)
        c.rect(cx + 2, cy - 1, 4, 3, OBSIDIAN[2])
        c.rect(cx + 2, cy - 1, 4, 1, OBSIDIAN[3])
        # Tall pointed Anubis jackal ears with gold inner trim!
        c.poly([(cx - 3, cy - 3), (cx - 2, cy - 9), (cx, cy - 3)], OBSIDIAN[2])
        c.poly([(cx, cy - 3), (cx + 2, cy - 9), (cx + 3, cy - 3)], OBSIDIAN[3])
        c.line(cx - 2, cy - 7, cx - 2, cy - 4, GOLD[3])
        c.line(cx + 2, cy - 7, cx + 2, cy - 4, GOLD[3])
        # Glowing golden/team eye + striped Nemes headdress flap
        c.rect(cx + 1, cy - 1, 2, 1, SOLAR_GOLD[4])
        c.box(cx - 5, cy - 2, 3, 6, TEAM_RAMP)
        c.px(cx - 4, cy, GOLD[3])
        c.px(cx - 4, cy + 2, GOLD[3])

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Broad golden Egyptian Wesekh collar & striped royal loincloth
        c.rect(tx + 1, ty, 7, 2, GOLD[3])
        c.rect(tx + 2, ty + 2, 5, 1, T_LIGHT)
        c.box(tx + 1, ty + 7, 7, 4, EGYPT_LINEN)
        c.rect(tx + 3, ty + 7, 3, 4, T_MID)
        c.px(tx + 4, ty + 8, GOLD[4])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx + 2, sy + 1, sx + 11, sy + 1, GOLD, 2)
            c.rect(sx + 10, sy - 1, 3, 2, GOLD[4])
            return
        if a == 'attack_0':
            # Curved golden Khopesh raised high behind head
            c.shaded_line(sx, sy, sx - 2, sy - 6, OBSIDIAN, 2)
            c.shaded_line(sx - 2, sy - 6, sx - 5, sy - 12, GOLD, 2)
            c.line(sx - 5, sy - 12, sx - 1, sy - 15, GOLD[4], 2)
        elif a == 'attack_1':
            # Sweeping forward sickle cleave!
            c.shaded_line(sx, sy, sx + 5, sy, OBSIDIAN, 2)
            c.shaded_line(sx + 5, sy, sx + 13, sy - 1, GOLD, 2)
            c.line(sx + 13, sy - 1, sx + 17, sy + 3, GOLD[4], 2)
            c.px(sx + 16, sy + 2, WHITE)
        elif a == 'attack_2':
            c.shaded_line(sx, sy, sx + 4, sy + 3, OBSIDIAN, 2)
            c.shaded_line(sx + 4, sy + 3, sx + 11, sy + 7, GOLD, 2)
            c.line(sx + 11, sy + 7, sx + 14, sy + 6, GOLD[3], 2)
        else:
            sway = -1 if a in ('walk_1', 'walk_2') else 0
            c.shaded_line(sx, sy, sx + 4, sy + 1 + sway, OBSIDIAN, 2)
            c.shaded_line(sx + 4, sy + 1 + sway, sx + 9, sy - 4 + sway, GOLD, 2)
            c.line(sx + 9, sy - 4 + sway, sx + 13, sy - 7 + sway, GOLD[4], 2)
            c.px(sx + 13, sy - 7 + sway, WHITE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 8, sy, 10, SOLAR_GOLD[2], SOLAR_GOLD[4])

    c = draw_humanoid(
        w, h, anim,
        skin=OBSIDIAN, torso=OBSIDIAN, legs=OBSIDIAN, boots=GOLD,
        belt=GOLD[3], buckle=T_GLOW,
        has_team_shoulder=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_sun_priest(anim: str) -> tuple[PixelCanvas, int, int]:
    """Egyptian Solar Priest in linen vestments & horned sun-disk crown firing solar orbs (36x36px)."""
    w, h = 36, 36

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        c.shaded_ellipse(cx, cy, 4, 4, SKIN_TAN)
        c.px(cx + 2, cy, INK)
        # Royal striped headdress + golden horned solar disk crown!
        c.box(cx - 5, cy - 3, 10, 4, TEAM_RAMP)
        c.rect(cx - 4, cy - 2, 8, 1, GOLD[3])
        c.line(cx - 3, cy - 4, cx - 4, cy - 8, GOLD[3])
        c.line(cx + 3, cy - 4, cx + 4, cy - 8, GOLD[3])
        c.shaded_ellipse(cx, cy - 7, 2, 2, SOLAR_GOLD)
        c.px(cx, cy - 7, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx - 2, sy + 2, sx + 13, sy + 2, GOLD, 1)
            c.shaded_ellipse(sx + 13, sy + 2, 2, 2, SOLAR_GOLD)
            return
        thrust = 3 if a == 'attack_1' else (-1 if a == 'attack_0' else 0)
        # Tall gilded Ankh / Solar Scepter
        st_x = sx + 7 + thrust
        c.shaded_line(st_x, sy + 9, st_x, sy - 7, GOLD, 2)
        c.rect(st_x - 2, sy - 5, 5, 2, GOLD[3])
        # Radiant sun orb atop staff
        orb_r = 3 if a in ('attack_0', 'attack_1') else 2
        c.shaded_ellipse(st_x, sy - 9, orb_r, orb_r, SOLAR_GOLD)
        c.px(st_x, sy - 9, WHITE)
        c.shaded_line(sx, sy, st_x - 1, sy, SKIN_TAN, 2)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 11, sy - 9, 4, SOLAR_GOLD)
        elif a == 'attack_0':
            c.px(sx + 6, sy - 13, SOLAR_GOLD[4])
            c.px(sx + 10, sy - 9, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN_TAN, torso=EGYPT_LINEN, legs=EGYPT_LINEN, boots=GOLD,
        belt=GOLD[3], buckle=T_GLOW,
        has_team_sash=True, cape_ramp=TEAM_RAMP, has_team_shoulder=True,
        head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=14,
    )
    return c, 14, h - 2


def gen_sphinx_chariot(anim: str) -> tuple[PixelCanvas, int, int]:
    """Colossal Living Gilded-Stone War Sphinx Guardian with Pharaoh Headdress & Solar Claws (62x54px)."""
    w, h = 62, 54
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        # Crumbled stone sphinx statue with cracked headdress
        c.box(10, gy - 12, 34, 10, SANDSTONE)
        c.box(38, gy - 14, 14, 12, GOLD)
        c.box(36, gy - 12, 8, 8, TEAM_RAMP)
        c.line(20, gy - 11, 26, gy - 3, INK)
        c.add_outline(INK)
        draw_smoke_puff(c, 32, gy - 16, 5)
        return c, 31, gy

    if anim == 'walk_0':
        fl, bl, bob, paw_raise = 5, -5, 0, 0
    elif anim == 'walk_1':
        fl, bl, bob, paw_raise = 1, 1, -2, 0
    elif anim == 'walk_2':
        fl, bl, bob, paw_raise = -5, 5, 0, 0
    elif anim == 'walk_3':
        fl, bl, bob, paw_raise = -1, -1, -2, 0
    elif anim == 'attack_0':
        fl, bl, bob, paw_raise = -2, -4, -3, 7
    elif anim == 'attack_1':
        fl, bl, bob, paw_raise = 8, -5, 1, 2
    elif anim == 'attack_2':
        fl, bl, bob, paw_raise = 5, -3, 0, 0
    else:
        fl, bl, bob, paw_raise = -4, -3, -2, 2

    dx = 2 if anim == 'attack_1' else (-2 if anim == 'hurt_0' else 0)
    bx = 28 + dx
    by = gy - 18 + bob

    # 1. Rear Lion Legs (darker sandstone)
    c.line(bx - 12, by + 4, bx - 15 + bl, gy - 1, SANDSTONE[0], 5)
    c.line(bx + 10, by + 4, bx + 13 - fl, gy - 1, SANDSTONE[0], 5)

    # 2. Curved Lion Tail with Golden Tassel
    c.line(bx - 15, by - 2, bx - 23, by - 8, SANDSTONE[2], 2)
    c.shaded_ellipse(bx - 24, by - 9, 2, 2, GOLD)

    # 3. Massive Carved Sandstone Lion Torso + Gilded Winged Harness + Team Mantle!
    c.shaded_ellipse(bx, by, 17, 9, SANDSTONE)
    c.box(bx - 12, by - 8, 22, 11, TEAM_RAMP)
    c.rect(bx - 12, by + 2, 22, 2, GOLD[3])
    # Sculpted golden falcon wings folded along flanks!
    c.shaded_poly([(bx - 11, by - 6), (bx + 6, by - 8), (bx + 2, by + 2), (bx - 16, by + 1)], GOLD)
    c.line(bx - 10, by - 3, bx + 1, by - 4, SOLAR_GOLD[4])

    # 4. Near Muscular Lion Legs & Gilded Claws
    c.line(bx - 11, by + 5, bx - 12 - bl, gy - 2, SANDSTONE[2], 5)
    c.box(bx - 14 - bl, gy - 4, 7, 4, GOLD)
    # Front paw rears up & slams down in attack!
    fp_x = bx + 12 + fl
    fp_y = gy - 2 - paw_raise
    c.line(bx + 10, by + 3, fp_x, fp_y, SANDSTONE[3], 5)
    c.box(fp_x - 2, fp_y - 3, 8, 5, GOLD)
    c.px(fp_x + 6, fp_y, WHITE)

    # 5. Iconic Royal Pharaoh Sphinx Head + Striped Nemes Headdress + Solar Cobra Crown!
    hx = bx + 15
    hy = by - 14
    # Striped Nemes headdress wings sweeping down onto chest
    c.shaded_poly([(hx - 9, hy - 7), (hx + 5, hy - 7), (hx + 7, hy + 8), (hx - 11, hy + 6)], TEAM_RAMP)
    for sy in (hy - 4, hy, hy + 4):
        c.rect(hx - 8, sy, 14, 2, GOLD[3])
    # Sculpted noble golden Pharaoh face
    c.box(hx - 2, hy - 5, 9, 10, GOLD)
    c.rect(hx + 2, hy - 2, 3, 2, T_GLOW)  # glowing mystic eyes!
    c.px(hx + 3, hy - 2, WHITE)
    # Ceremonial Pharaoh beard
    c.rect(hx + 4, hy + 5, 2, 5, GOLD[3])
    # Uraeus cobra + blazing golden sun crown
    c.shaded_ellipse(hx + 1, hy - 10, 4, 4, SOLAR_GOLD)
    c.px(hx + 1, hy - 10, WHITE)

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_slash_smear(c, fp_x + 6, fp_y - 4, 11, SOLAR_GOLD[2], WHITE)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, hx + 2, hy)

    return c, 31, gy


# =============================================================================
# NEW ERA 6: INDUSTRIAL / STEAMPUNK ERA (steam_trooper, gatling_gunner, steam_walker)
# =============================================================================

def gen_steam_trooper(anim: str) -> tuple[PixelCanvas, int, int]:
    """Heavy Brass-Plated Steampunk Boiler Trooper with Steam Hammer (38x38px)."""
    w, h = 38, 38

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Pressurized copper steam boiler backpack + chimney pipe!
        c.box(bx - 5, by - 1, 6, 9, COPPER)
        c.rect(bx - 4, by - 5, 2, 5, IRON[2])
        c.rect(bx - 4, by + 2, 4, 2, T_MID)
        # Venting white steam puff
        if a in ('walk_1', 'walk_3', 'attack_1'):
            c.px(bx - 5, by - 6, OFF_WHITE)
            c.px(bx - 6, by - 8, WHITE)

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Chunky riveted brass diving/boiler helmet with glowing amber porthole visor!
        c.shaded_ellipse(cx, cy, 4, 4, COPPER)
        c.rect(cx - 2, cy - 5, 4, 2, BRONZE[3])  # pressure dome cap
        c.rect(cx + 1, cy - 2, 3, 3, CYAN_GLOW[3])
        c.px(cx + 2, cy - 1, WHITE)
        c.rect(cx - 4, cy + 2, 8, 2, BRONZE[2])  # bolted neck collar

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Riveted copper chestplate + glowing boiler furnace grate
        c.box(tx + 1, ty + 1, 7, 6, COPPER)
        c.rect(tx + 3, ty + 2, 3, 3, FIRE[2])
        c.px(tx + 4, ty + 3, FIRE[4])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx, sy + 2, sx + 11, sy + 2, IRON, 2)
            c.box(sx + 10, sy - 1, 5, 6, BRONZE)
            return
        if a == 'attack_0':
            c.shaded_line(sx, sy, sx - 2, sy - 6, COPPER, 2)
            c.shaded_line(sx - 2, sy - 6, sx - 6, sy - 13, IRON, 2)
            c.box(sx - 10, sy - 16, 7, 5, BRONZE)
            c.rect(sx - 9, sy - 15, 2, 3, T_MID)
        elif a == 'attack_1':
            # Crushing pneumatic steam hammer slam!
            c.shaded_line(sx, sy, sx + 5, sy + 1, COPPER, 2)
            c.shaded_line(sx + 5, sy + 1, sx + 14, sy + 2, IRON, 2)
            c.box(sx + 12, sy - 2, 6, 8, BRONZE)
            c.rect(sx + 13, sy, 3, 4, T_LIGHT)
        elif a == 'attack_2':
            c.shaded_line(sx, sy, sx + 4, sy + 3, COPPER, 2)
            c.shaded_line(sx + 4, sy + 3, sx + 11, sy + 7, IRON, 2)
            c.box(sx + 10, sy + 4, 6, 6, BRONZE)
        else:
            sway = -1 if a in ('walk_1', 'walk_2') else 0
            c.shaded_line(sx, sy, sx + 4, sy + 1 + sway, COPPER, 2)
            c.shaded_line(sx + 4, sy + 1 + sway, sx + 11, sy - 5 + sway, IRON, 2)
            c.box(sx + 9, sy - 9 + sway, 6, 6, BRONZE)
            c.rect(sx + 10, sy - 7 + sway, 3, 2, T_LIGHT)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 9, sy, 10, OFF_WHITE, FIRE[3])
            draw_smoke_puff(c, sx + 16, sy - 4, 2)

    c = draw_humanoid(
        w, h, anim,
        skin=COPPER, torso=COPPER, legs=IRON, boots=BRONZE,
        belt=LEATHER[0], buckle=GOLD[3],
        has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_gatling_gunner(anim: str) -> tuple[PixelCanvas, int, int]:
    """Victorian Brass-Goggled Gatling Gunner cranking a heavy rotary cannon (38x38px)."""
    w, h = 38, 38

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Brass ammo hopper & leather feed pack
        c.box(bx - 4, by, 5, 7, LEATHER)
        c.rect(bx - 3, by + 1, 3, 2, GOLD[3])

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        c.shaded_ellipse(cx, cy, 4, 4, SKIN)
        # Victorian pith/boiler cap + brass aviator goggles!
        c.shaded_ellipse(cx, cy - 3, 5, 3, LEATHER)
        c.rect(cx - 5, cy - 2, 10, 2, BRONZE[2])
        c.rect(cx + 1, cy - 2, 3, 2, CYAN_GLOW[3])  # goggles
        c.px(cx + 2, cy - 2, WHITE)
        # Handlebar mustache!
        c.rect(cx + 1, cy + 1, 3, 1, WOOD[0])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx, sy + 1, 14, 4, BRONZE)
            return
        recoil = -1 if a == 'attack_1' else 0
        gy = sy + 1
        # Underslung rotary multi-barrel brass Gatling cannon + top ammo drum!
        c.box(sx - 2 + recoil, gy - 2, 9, 5, BRONZE)
        c.box(sx + 1 + recoil, gy - 5, 4, 4, GOLD)  # brass ammo drum
        # Rotating triple barrels
        c.rect(sx + 7 + recoil, gy - 2, 11, 2, IRON[3] if a == 'attack_1' else IRON[2])
        c.rect(sx + 7 + recoil, gy, 11, 2, GOLD[3])
        c.rect(sx + 7 + recoil, gy + 2, 11, 2, IRON[2])
        c.rect(sx + 13 + recoil, gy - 2, 2, 6, BRONZE[3])  # barrel clamp
        c.shaded_line(sx - 1, sy, sx + 3 + recoil, gy + 1, TEAM_RAMP, 2)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 17, sy + 1, 5, FIRE)
        elif a == 'attack_2':
            draw_smoke_puff(c, sx + 18, sy - 1, 3)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=TEAM_RAMP, legs=CHARCOAL, boots=LEATHER,
        belt=LEATHER[1], buckle=GOLD[3],
        has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=14,
    )
    return c, 14, h - 2


def gen_steam_walker(anim: str) -> tuple[PixelCanvas, int, int]:
    """Steampunk Bipedal Copper Boiler Walker Mech with tall chimney & twin cannons (64x58px)."""
    w, h = 64, 58
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        c.shaded_ellipse(30, gy - 12, 17, 10, COPPER)
        c.box(22, gy - 16, 14, 7, TEAM_RAMP)
        c.rect(14, gy - 20, 5, 10, IRON[1])
        c.add_outline(INK)
        draw_smoke_puff(c, 28, gy - 24, 6)
        draw_muzzle_flash(c, 34, gy - 14, 3, FIRE)
        return c, 32, gy

    if anim == 'walk_0':
        f_dx, b_dx, bob, f_lift, b_lift = 7, -6, 0, 0, 0
    elif anim == 'walk_1':
        f_dx, b_dx, bob, f_lift, b_lift = 2, -2, -2, 0, 3
    elif anim == 'walk_2':
        f_dx, b_dx, bob, f_lift, b_lift = -6, 7, 0, 0, 0
    elif anim == 'walk_3':
        f_dx, b_dx, bob, f_lift, b_lift = -2, 2, -2, 3, 0
    elif anim == 'attack_0':
        f_dx, b_dx, bob, f_lift, b_lift = 3, -6, 1, 0, 0
    elif anim == 'attack_1':
        f_dx, b_dx, bob, f_lift, b_lift = 4, -6, 2, 0, 0
    else:
        f_dx, b_dx, bob, f_lift, b_lift = 2, -4, 0, 0, 0

    recoil = -3 if anim == 'attack_1' else (-1 if anim == 'attack_2' else 0)
    cx = 30 + (recoil // 2)
    hull_cy = gy - 27 + bob

    # 1. Rear Articulated Brass Piston Leg
    b_hip_x = cx - 4
    b_knee_x = b_hip_x + b_dx // 2 - 5
    b_knee_y = gy - 13 - b_lift // 2
    b_foot_x = b_hip_x + b_dx
    b_foot_y = gy - b_lift
    c.line(b_hip_x, hull_cy + 8, b_knee_x, b_knee_y, IRON[1], 5)
    c.line(b_knee_x, b_knee_y, b_foot_x, b_foot_y - 2, IRON[2], 5)
    c.box(b_foot_x - 5, b_foot_y - 4, 12, 4, IRON)

    # 2. Tall Iron Boiler Smokestack behind Dome + Billowing Steam!
    c.box(cx - 14, hull_cy - 24, 6, 18, DARK_STEEL)
    c.box(cx - 16, hull_cy - 26, 10, 4, BRONZE)
    # Steam puff drifting out of chimney
    sp_shift = 2 if anim in ('walk_1', 'walk_3', 'attack_1') else 0
    c.shaded_ellipse(cx - 13 - sp_shift, hull_cy - 28, 3, 2, SMOKE)

    # 3. Massive Spherical Riveted Copper Boiler Hull!
    c.shaded_ellipse(cx, hull_cy, 17, 14, COPPER)
    # Iron equatorial boiler band & giant rivets
    c.rect(cx - 16, hull_cy, 32, 4, IRON[2])
    for rx in range(cx - 13, cx + 14, 5):
        c.px(rx, hull_cy + 1, GOLD[4])
    # Team armor crest plate on side + glowing furnace pilot viewport!
    c.box(cx - 10, hull_cy - 8, 12, 8, TEAM_RAMP)
    c.rect(cx - 8, hull_cy - 5, 8, 2, GOLD[3])
    # Glowing circular brass pilot porthole window
    c.shaded_ellipse(cx + 8, hull_cy - 5, 5, 5, GOLD)
    c.shaded_ellipse(cx + 9, hull_cy - 5, 3, 3, FIRE)
    c.px(cx + 9, hull_cy - 6, WHITE)
    # Giant spinning brass gear wheel on flank!
    c.wheel(cx - 5, hull_cy + 6, 5, GOLD, BRONZE[1], 0.4 if (anim in ('walk_1', 'walk_3')) else 0.0)

    # 4. Front Heavy Brass Hydraulic Leg (reverse-jointed steampunk walker!)
    f_hip_x = cx + 1
    f_knee_x = f_hip_x + f_dx // 2 - 5
    f_knee_y = gy - 13 - f_lift // 2
    f_foot_x = f_hip_x + f_dx
    f_foot_y = gy - f_lift
    c.line(f_hip_x, hull_cy + 8, f_knee_x, f_knee_y, BRONZE[2], 6)
    c.line(f_hip_x, hull_cy + 7, f_knee_x, f_knee_y - 1, GOLD[3], 2)
    c.shaded_ellipse(f_knee_x, f_knee_y, 4, 4, IRON)
    c.px(f_knee_x, f_knee_y, GOLD[4])
    c.line(f_knee_x, f_knee_y + 2, f_foot_x, f_foot_y - 3, BRONZE[2], 6)
    c.line(f_knee_x + 3, f_knee_y + 2, f_foot_x + 3, f_foot_y - 3, STEEL[4], 2)  # piston rod
    c.box(f_foot_x - 6, f_foot_y - 4, 15, 5, BRONZE)

    # 5. Twin Heavy Brass Steam Cannons mounted on right side!
    gx = cx + 8 + recoil
    gy_bar = hull_cy + 1
    c.box(gx, gy_bar - 3, 19, 4, BRONZE)
    c.box(gx, gy_bar + 3, 19, 4, BRONZE)
    c.rect(gx + 14, gy_bar - 4, 4, 12, GOLD[3])  # flared brass muzzle collar

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_muzzle_flash(c, gx + 19, gy_bar + 1, 6, FIRE)
        draw_smoke_puff(c, cx - 15, hull_cy - 28, 3)
    elif anim == 'attack_2':
        draw_smoke_puff(c, gx + 20, gy_bar - 2, 4)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, cx + 10, hull_cy - 2)

    return c, 32, gy


# =============================================================================
# NEW ERA 10: INTERSTELLAR / COSMIC ERA (void_templar, gravity_sniper, omega_titan)
# =============================================================================

def gen_void_templar(anim: str) -> tuple[PixelCanvas, int, int]:
    """Celestial Obsidian-and-Gold Void Templar with floating halo & twin warp blades (40x40px)."""
    w, h = 40, 40

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Celestial obsidian hood + radiant golden face mask + floating cosmic halo!
        c.shaded_ellipse(cx, cy, 4, 4, OBSIDIAN)
        c.rect(cx + 1, cy - 2, 3, 3, GOLD[3])
        c.rect(cx + 2, cy - 1, 2, 1, T_GLOW)
        c.px(cx + 3, cy - 1, WHITE)
        # Floating golden halo above head
        c.rect(cx - 4, cy - 7, 8, 2, GOLD[3])
        c.rect(cx - 3, cy - 7, 6, 1, WHITE)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Ornate gilded chest crest + blazing violet/team void crystal!
        c.box(tx + 1, ty + 1, 7, 6, OBSIDIAN)
        c.rect(tx + 1, ty + 1, 7, 1, GOLD[3])
        c.rect(tx + 3, ty + 2, 3, 4, T_GLOW)
        c.px(tx + 4, ty + 3, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx, sy + 1, 4, 3, GOLD)
            c.line(sx + 4, sy + 2, sx + 15, sy + 2, COSMIC_VIOLET[3], 2)
            return
        if a == 'attack_0':
            c.shaded_line(sx, sy, sx - 3, sy - 6, OBSIDIAN, 2)
            c.line(sx - 3, sy - 6, sx - 8, sy - 16, COSMIC_VIOLET[3], 3)
            c.line(sx - 3, sy - 6, sx - 8, sy - 16, WHITE, 1)
        elif a == 'attack_1':
            # Blazing dual warp-energy cleave!
            c.shaded_line(sx, sy, sx + 6, sy - 1, GOLD, 2)
            c.line(sx + 6, sy - 1, sx + 21, sy + 2, COSMIC_VIOLET[3], 4)
            c.line(sx + 7, sy - 1, sx + 20, sy + 2, T_GLOW, 2)
            c.line(sx + 8, sy - 1, sx + 19, sy + 2, WHITE, 1)
        elif a == 'attack_2':
            c.shaded_line(sx, sy, sx + 5, sy + 3, GOLD, 2)
            c.line(sx + 5, sy + 3, sx + 16, sy + 8, COSMIC_VIOLET[3], 2)
            c.line(sx + 6, sy + 3, sx + 15, sy + 8, WHITE, 1)
        else:
            sway = -1 if a in ('walk_1', 'walk_2') else 0
            c.shaded_line(sx, sy, sx + 5, sy + 1 + sway, GOLD, 2)
            c.line(sx + 5, sy + 1 + sway, sx + 16, sy - 8 + sway, COSMIC_VIOLET[3], 3)
            c.line(sx + 6, sy + sway, sx + 15, sy - 7 + sway, WHITE, 1)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 11, sy, 12, COSMIC_VIOLET[3], WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=OBSIDIAN, torso=OBSIDIAN, legs=OBSIDIAN, boots=GOLD,
        belt=GOLD[3], buckle=T_GLOW,
        cape_ramp=TEAM_RAMP, has_team_shoulder=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_gravity_sniper(anim: str) -> tuple[PixelCanvas, int, int]:
    """Interstellar Graviton Marksman wielding a floating-core Singularity Rifle (40x40px)."""
    w, h = 40, 40

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        c.shaded_ellipse(cx, cy, 4, 4, OBSIDIAN)
        c.box(cx - 3, cy - 5, 7, 3, GOLD)
        c.rect(cx + 1, cy - 1, 4, 2, COSMIC_VIOLET[3])
        c.px(cx + 3, cy - 1, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx - 2, sy + 1, 18, 3, OBSIDIAN)
            c.px(sx + 13, sy + 2, COSMIC_VIOLET[3])
            return
        recoil = -2 if a == 'attack_1' else 0
        y_off = -1 if a in ('attack_0', 'attack_1') else 1
        # Ornate gold-and-obsidian singularity lance rifle with floating orb core!
        c.box(sx - 3 + recoil, sy + y_off, 11, 4, OBSIDIAN)
        c.rect(sx + 8 + recoil, sy - 2 + y_off, 13, 2, GOLD[3])
        c.rect(sx + 8 + recoil, sy + 3 + y_off, 13, 2, GOLD[2])
        # Floating mini singularity orb between prongs!
        c.shaded_ellipse(sx + 14 + recoil, sy + 1 + y_off, 2, 2, COSMIC_VIOLET)
        c.px(sx + 14 + recoil, sy + 1 + y_off, WHITE)
        c.shaded_line(sx - 1, sy, sx + 4 + recoil, sy + 2 + y_off, OBSIDIAN, 2)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 19, sy, 5, COSMIC_VIOLET)
        elif a == 'attack_0':
            c.px(sx + 21, sy - 2, COSMIC_VIOLET[4])
            c.px(sx + 21, sy + 2, COSMIC_VIOLET[4])
            c.px(sx + 22, sy, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=OBSIDIAN, torso=OBSIDIAN, legs=OBSIDIAN, boots=GOLD,
        belt=GOLD[3], buckle=COSMIC_VIOLET[3],
        cape_ramp=TEAM_RAMP, has_team_shoulder=True,
        head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=14,
    )
    return c, 14, h - 2


def gen_omega_titan(anim: str) -> tuple[PixelCanvas, int, int]:
    """Final-Era 72x72px Celestial Omega Titan God-Mech with Winged Pylons & Antimatter Cannons!"""
    w, h = 72, 72
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        c.box(10, gy - 20, 42, 16, OBSIDIAN)
        c.box(16, gy - 17, 18, 8, GOLD)
        c.rect(20, gy - 15, 10, 4, T_DEEP)
        c.add_outline(INK)
        draw_smoke_puff(c, 30, gy - 28, 7)
        draw_muzzle_flash(c, 34, gy - 18, 4, COSMIC_VIOLET)
        return c, 34, gy

    if anim == 'walk_0':
        f_dx, b_dx, bob, wing_dy = 6, -6, 0, 0
    elif anim == 'walk_1':
        f_dx, b_dx, bob, wing_dy = 2, -2, -3, -2
    elif anim == 'walk_2':
        f_dx, b_dx, bob, wing_dy = -6, 6, 0, 0
    elif anim == 'walk_3':
        f_dx, b_dx, bob, wing_dy = -2, 2, -3, 2
    elif anim == 'attack_0':
        f_dx, b_dx, bob, wing_dy = 3, -6, -1, -3
    elif anim == 'attack_1':
        f_dx, b_dx, bob, wing_dy = 5, -7, 1, 2
    else:
        f_dx, b_dx, bob, wing_dy = 2, -5, 0, 0

    recoil = -3 if anim == 'attack_1' else (-1 if anim == 'attack_2' else 0)
    cx = 31 + (recoil // 2)
    pelvis_y = gy - 24 + bob
    torso_y = pelvis_y - 23

    # 1. Floating Celestial Winged Energy Pylons sweeping behind back!
    for wy, wx_off in ((torso_y - 9 + wing_dy, -19), (torso_y + 2 - wing_dy, -22)):
        c.shaded_poly([
            (cx + wx_off, wy),
            (cx - 9, wy + 5),
            (cx - 11, wy + 10),
            (cx + wx_off + 2, wy + 6),
        ], GOLD)
        c.line(cx + wx_off + 2, wy + 2, cx - 10, wy + 7, COSMIC_VIOLET[3], 2)
        c.px(cx + wx_off + 1, wy + 2, WHITE)

    # 2. Rear Armored Leg (Obsidian + Gold Greave)
    b_hip_x = cx - 4
    b_knee_x = b_hip_x + b_dx // 2 + 4
    b_knee_y = gy - 12
    b_foot_x = b_hip_x + b_dx
    c.line(b_hip_x, pelvis_y + 2, b_knee_x, b_knee_y, OBSIDIAN[1], 8)
    c.line(b_knee_x, b_knee_y, b_foot_x, gy - 3, OBSIDIAN[2], 8)
    c.box(b_foot_x - 6, gy - 5, 15, 5, GOLD)

    # 3. Pelvis & Floating Void Energy Belt
    c.box(cx - 11, pelvis_y - 3, 22, 8, OBSIDIAN)
    c.rect(cx - 9, pelvis_y - 1, 18, 3, GOLD[3])
    c.rect(cx - 4, pelvis_y, 8, 2, T_GLOW)

    # 4. Towering Gilded Obsidian Titan Torso + Cosmic Singularity Chest Core!
    c.box(cx - 15, torso_y, 30, 22, OBSIDIAN)
    c.box(cx - 13, torso_y + 2, 26, 18, GOLD)
    c.box(cx - 11, torso_y + 4, 22, 14, OBSIDIAN)
    # Team sovereign chest banners
    c.box(cx - 12, torso_y + 3, 7, 10, TEAM_RAMP)
    c.box(cx + 6, torso_y + 3, 7, 10, TEAM_RAMP)
    # Blazing Cosmic Singularity Vortex Core in chest!
    c.shaded_ellipse(cx + 1, torso_y + 10, 6, 5, COSMIC_VIOLET)
    c.shaded_ellipse(cx + 1, torso_y + 10, 3, 3, (T_SHADE, T_MID, T_GLOW, WHITE))
    c.px(cx + 1, torso_y + 10, WHITE)

    # 5. Crowned Celestial Helm + Levitating Golden Halo Arc!
    c.box(cx - 6, torso_y - 9, 13, 9, OBSIDIAN)
    c.rect(cx - 5, torso_y - 9, 11, 2, GOLD[3])
    c.rect(cx - 1, torso_y - 5, 7, 3, T_GLOW)
    c.rect(cx + 1, torso_y - 4, 4, 1, WHITE)
    # Floating golden crown halo!
    c.rect(cx - 10, torso_y - 14, 20, 2, GOLD[3])
    c.rect(cx - 7, torso_y - 14, 14, 1, WHITE)
    # Ornate shoulder spires
    c.box(cx - 17, torso_y - 7, 10, 10, GOLD)
    c.box(cx - 15, torso_y - 5, 6, 6, TEAM_RAMP)
    c.box(cx + 8, torso_y - 7, 10, 10, GOLD)
    c.box(cx + 10, torso_y - 5, 6, 6, TEAM_RAMP)

    # 6. Front Armored Celestial Leg
    f_hip_x = cx - 1
    f_knee_x = f_hip_x + f_dx // 2 + 5
    f_knee_y = gy - 12
    f_foot_x = f_hip_x + f_dx
    c.line(f_hip_x, pelvis_y + 2, f_knee_x, f_knee_y, OBSIDIAN[2], 9)
    c.line(f_hip_x, pelvis_y + 1, f_knee_x, f_knee_y - 1, OBSIDIAN[3], 4)
    c.box(f_knee_x - 4, f_knee_y - 4, 9, 8, GOLD)
    c.rect(f_knee_x - 2, f_knee_y - 2, 5, 4, T_GLOW)
    c.line(f_knee_x + 1, f_knee_y + 2, f_foot_x + 1, gy - 3, OBSIDIAN[2], 8)
    c.line(f_knee_x - 2, f_knee_y + 2, f_foot_x - 2, gy - 3, GOLD[3], 2)
    c.box(f_foot_x - 7, gy - 6, 17, 6, GOLD)
    c.rect(f_foot_x - 5, gy - 5, 13, 2, OBSIDIAN[3])

    # 7. Super-Heavy Antimatter Singularity Cannon Arm!
    arm_x = cx - 12
    arm_y = torso_y + 6
    c.box(arm_x - 5, arm_y - 3, 12, 10, GOLD)
    c.box(arm_x - 4, arm_y - 1, 10, 6, TEAM_RAMP)
    gun_x = arm_x + 3 + recoil
    gun_y = arm_y + 7
    c.box(gun_x, gun_y - 4, 18, 10, OBSIDIAN)
    c.box(gun_x + 2, gun_y - 3, 14, 2, GOLD)
    c.shaded_ellipse(gun_x + 9, gun_y + 1, 4, 3, COSMIC_VIOLET)
    # Floating split golden accelerator rails!
    c.box(gun_x + 17, gun_y - 4, 19, 3, GOLD)
    c.box(gun_x + 17, gun_y + 3, 19, 3, GOLD)
    c.rect(gun_x + 17, gun_y, 18, 2, COSMIC_VIOLET[3])
    if anim in ('attack_0', 'attack_1'):
        c.rect(gun_x + 18, gun_y, 18, 2, WHITE)

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_muzzle_flash(c, gun_x + 35, gun_y + 1, 7, COSMIC_VIOLET)
    elif anim == 'attack_2':
        draw_smoke_puff(c, gun_x + 36, gun_y - 2, 4)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, cx + 10, torso_y + 10)

    return c, 34, gy


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
