"""HD 1:1 Metal-Slug / Kingdom-Rush style pixel-art generators for Eras 5, 7, 8, and 9 (12 units):
- Era 5 (Gunpowder): pikeman (80x70), musketeer (74x70), field_cannon (122x96)
- Era 7 (World War): rifleman (74x70), flamethrower (74x70), early_tank (124x92)
- Era 8 (Modern): spec_ops (74x70), at_rocket (76x70), mbt (128x92)
- Era 9 (Future): cyborg (74x70), railgun_sniper (78x70), colossus_mech (138x132)
"""

from __future__ import annotations

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
    CRIMSON_FUEL,
    CYAN_GLOW,
    DARK_STEEL,
    FIRE,
    GOLD,
    HAIR_BROWN,
    HAZARD_YELLOW,
    INK,
    INK_SOFT,
    IRON,
    KHAKI,
    LEATHER,
    NVG_GREEN,
    OFF_WHITE,
    OLIVE,
    SKIN,
    SLATE_ARMOR,
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
    WOOD_DARK,
)


# =============================================================================
# ERA 5: GUNPOWDER / EARLY MODERN (pikeman, musketeer, field_cannon)
# =============================================================================

def gen_pikeman(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Renaissance Morion-Helmeted Pikeman with Steel Cuirass & Long Pike (80x70px)."""
    w, h = 80, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN, brow_col=HAIR_BROWN[0])
        # Iconic Spanish Morion curved-brim steel helmet with tall comb ridge!
        c.shaded_ellipse(cx, cy - 5, 8, 6, STEEL)
        c.shaded_poly(
            [(cx - 11, cy - 4), (cx - 4, cy - 2), (cx + 4, cy - 2), (cx + 11, cy - 4), (cx + 9, cy - 1), (cx - 9, cy - 1)],
            STEEL,
        )
        c.shaded_poly([(cx - 3, cy - 10), (cx, cy - 15), (cx + 4, cy - 10)], STEEL)
        c.line(cx, cy - 14, cx, cy - 5, STEEL[4], 1)
        # Sweeping Renaissance team plume
        fl = 2 if a in ('walk_1', 'walk_3', 'attack_1') else 0
        c.shaded_poly(
            [(cx - 5, cy - 9), (cx - 14 - fl, cy - 15), (cx - 17 - fl, cy - 10), (cx - 9, cy - 6)],
            TEAM_RAMP,
        )

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Gleaming steel breastplate cuirass + puffed Renaissance team tassets
        c.armor_plate(tx + 2, ty + 2, 13, 12, STEEL, sheen=True)
        c.armor_plate(tx + 1, ty + 16, 7, 7, TEAM_RAMP, sheen=False)
        c.armor_plate(tx + 9, ty + 16, 7, 7, TEAM_RAMP, sheen=False)
        c.rect(tx + 1, ty + 21, 15, 2, GOLD[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx - 10, sy + 3, sx + 30, sy + 3, 1.5, WOOD)
            c.shaded_poly([(sx + 29, sy), (sx + 38, sy + 3), (sx + 29, sy + 6)], STEEL)
            return
        thrust = -8 if a == 'attack_0' else (14 if a == 'attack_1' else 4)
        y_off = -2 if a == 'attack_1' else 0
        end_x = min(w - 11, sx + 31 + thrust)
        c.shaded_capsule(sx - 18 + thrust, sy + 2 + y_off, end_x, sy - 2 + y_off, 1.6, WOOD)
        # Gleaming steel pike tip + fluttering team tassel
        c.shaded_poly([(end_x - 1, sy - 6 + y_off), (end_x + 10, sy - 2 + y_off), (end_x - 1, sy + 2 + y_off)], STEEL)
        c.line(end_x, sy - 2 + y_off, end_x + 8, sy - 2 + y_off, WHITE, 1)
        c.box(end_x - 6, sy + y_off, 4, 6, TEAM_RAMP)
        # Puffed Renaissance team sleeve gripping pike
        c.shaded_capsule(sx, sy, sx + 8 + thrust // 2, sy + 1 + y_off, 3.2, TEAM_RAMP)
        c.shaded_ellipse(sx + 9 + thrust // 2, sy + 1 + y_off, 2.5, 2.5, SKIN)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.line(w - 14, sy - 4, w - 2, sy - 4, T_GLOW, 2)
            c.line(w - 10, sy - 4, w - 2, sy - 4, WHITE, 1)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=TEAM_RAMP, legs=CHARCOAL, boots=LEATHER,
        belt=LEATHER[1], buckle=GOLD[3],
        knee_armor=STEEL, has_team_shoulder=True, torso_armored=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_musketeer(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Colonial Tricorne Musketeer with Braided Uniform Coat & Flintlock Musket (74x70px)."""
    w, h = 74, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN, brow_col=HAIR_BROWN[0])
        # Iconic Colonial Tricorne Hat with gold braid trim & sweeping white plume
        c.shaded_poly(
            [(cx - 11, cy - 4), (cx + 11, cy - 4), (cx + 8, cy - 12), (cx - 7, cy - 12)],
            CHARCOAL,
        )
        c.rect(cx - 11, cy - 5, 22, 2, GOLD[3])
        c.rect(cx + 3, cy - 10, 3, 3, T_LIGHT)  # cockade pin
        fl = 2 if a in ('walk_1', 'walk_3') else 0
        c.shaded_poly(
            [(cx - 4, cy - 12), (cx - 14 - fl, cy - 17), (cx - 16 - fl, cy - 12), (cx - 6, cy - 9)],
            (SMOKE[2], SMOKE[3], OFF_WHITE, WHITE),
        )

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Crisp white colonial X-crossbelts & double row of gleaming brass buttons
        c.line(tx + 2, ty + 2, tx + 14, ty + 14, OFF_WHITE, 2)
        c.line(tx + 14, ty + 2, tx + 2, ty + 14, OFF_WHITE, 2)
        for by_p in (ty + 4, ty + 8, ty + 12):
            c.rect(tx + 7, by_p, 2, 2, GOLD[4])
        # Flared coat tail hem
        c.armor_plate(tx + 1, ty + 16, 15, 6, TEAM_RAMP, sheen=False)
        c.rect(tx + 1, ty + 20, 15, 2, GOLD[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx - 2, sy + 2, sx + 26, sy + 2, 2.0, WOOD)
            c.line(sx + 10, sy, sx + 28, sy, STEEL[3], 2)
            return
        recoil = -4 if a == 'attack_1' else 0
        y_off = -2 if a in ('attack_0', 'attack_1') else 2
        # Walnut flintlock musket stock + long gleaming steel barrel + brass barrel bands
        c.shaded_capsule(sx - 4 + recoil, sy + 4 + y_off, sx + 17 + recoil, sy + 1 + y_off, 2.2, WOOD)
        c.box(sx + 10 + recoil, sy - 2 + y_off, 23, 3, STEEL)
        c.rect(sx + 11 + recoil, sy - 2 + y_off, 21, 1, STEEL[4])
        for bx in (sx + 18, sx + 27):
            c.rect(bx + recoil, sy - 2 + y_off, 2, 4, GOLD[3])
        # Gleaming steel socket bayonet
        c.line(sx + 29 + recoil, sy + 1 + y_off, sx + 37 + recoil, sy + 1 + y_off, STEEL[4], 1)
        # Uniform cuff sleeve & hand
        c.shaded_capsule(sx - 1, sy, sx + 8 + recoil, sy + 2 + y_off, 2.8, TEAM_RAMP)
        c.rect(sx + 6 + recoil, sy + y_off, 3, 4, GOLD[3])
        c.shaded_ellipse(sx + 10 + recoil, sy + 2 + y_off, 2.5, 2.5, SKIN)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 29, sy - 3, 8, FIRE)
        elif a == 'attack_2':
            draw_smoke_puff(c, sx + 33, sy - 4, 5)

    white_breeches = (SMOKE[1], SMOKE[2], SMOKE[3], SMOKE[4], WHITE)
    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=TEAM_RAMP, legs=white_breeches, boots=CHARCOAL,
        belt=OFF_WHITE, buckle=GOLD[3],
        has_team_shoulder=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_field_cannon(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Gunpowder Ringed Bronze Field Artillery Cannon + Uniformed Gunner Crewman (122x96px)."""
    w, h = 122, 96
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.armor_plate(26, gy - 16, 56, 12, WOOD_DARK, rivets=True)
        p.shaded_capsule(44, gy - 20, 90, gy - 10, 7.0, BRONZE)
        p.wheel(52, gy - 11, 13, WOOD, IRON[2], 0.5)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 74, gy - 26, 9)
        return c, 61, gy

    phases = {'walk_0': 0.0, 'walk_1': 0.45, 'walk_2': 0.9, 'walk_3': 1.35}
    wp = phases.get(anim, 0.0)
    recoil = -8 if anim == 'attack_1' else (-3 if anim == 'attack_2' else 0)
    bob = -1 if anim in ('walk_1', 'walk_3') else 0

    # 1. Uniformed Colonial Artilleryman lighting touchhole with burning linstock!
    crew = c.part()
    gx = 24 + recoil // 2
    leg_s = 3 if anim in ('walk_0', 'walk_2') else 0
    crew.shaded_capsule(gx - 2, gy - 17, gx - 4 - leg_s, gy - 3, 3.0, CHARCOAL)
    crew.shaded_capsule(gx + 2, gy - 17, gx + 4 + leg_s, gy - 3, 3.0, CHARCOAL)
    crew.armor_plate(gx - 7, gy - 35 + bob, 15, 18, TEAM_RAMP, sheen=False)
    crew.line(gx - 5, gy - 33 + bob, gx + 6, gy - 20 + bob, OFF_WHITE, 2)
    draw_hd_face(crew, gx, gy - 41 + bob, anim, SKIN)
    crew.shaded_poly([(gx - 9, gy - 44 + bob), (gx + 9, gy - 44 + bob), (gx + 7, gy - 51 + bob), (gx - 6, gy - 51 + bob)], CHARCOAL)
    crew.rect(gx - 9, gy - 45 + bob, 18, 2, GOLD[3])
    if anim == 'attack_0':
        crew.shaded_capsule(gx + 4, gy - 30 + bob, gx + 17, gy - 39 + bob, 2.5, TEAM_RAMP)
        crew.shaded_capsule(gx + 15, gy - 39 + bob, gx + 25, gy - 45 + bob, 1.2, WOOD)
        crew.shaded_ellipse(gx + 26, gy - 46 + bob, 3, 3, FIRE)
    else:
        crew.shaded_capsule(gx + 4, gy - 30 + bob, gx + 16, gy - 27 + bob, 2.5, TEAM_RAMP)
    c.blit_part(crew, INK)

    # 2. Heavy Oak Artillery Trail Carriage + Gleaming Ringed Bronze Barrel!
    gun = c.part()
    cx = 46 + recoil
    cy = gy - 20 + bob
    # Sloped heavy timber trail carriage
    gun.shaded_poly(
        [(cx - 22, gy - 4), (cx + 24, cy - 9), (cx + 28, cy + 4), (cx - 10, gy - 2)],
        WOOD,
    )
    gun.armor_plate(cx + 6, cy - 11, 22, 12, TEAM_RAMP, rivets=True)
    gun.rect(cx + 10, cy - 7, 14, 4, GOLD[3])
    # Gleaming tapered cast-bronze siege barrel with cascabel & golden reinforcing rings!
    by = cy - 17
    gun.shaded_poly(
        [(cx - 2, by - 9), (cx + 50, by - 6), (cx + 50, by + 6), (cx - 2, by + 10)],
        BRONZE,
    )
    gun.shaded_ellipse(cx - 6, by, 6, 5, BRONZE)
    for rx in (cx + 10, cx + 28, cx + 45):
        gun.box(rx, by - 8, 4, 16, GOLD)
    gun.rect(cx + 49, by - 5, 4, 10, INK)
    # Huge Iron-Rimmed Spoked Artillery Wheel in front
    gun.wheel(cx + 16, gy - 18 + bob, 16, WOOD, IRON[3], wp)
    c.blit_part(gun, INK)

    c.add_outline(INK)
    if anim == 'attack_1':
        draw_muzzle_flash(c, cx + 52, by, 13, FIRE)
        draw_smoke_puff(c, cx + 48, by - 14, 7)
    elif anim == 'attack_2':
        draw_smoke_puff(c, cx + 54, by - 8, 8)
        draw_smoke_puff(c, cx + 62, by - 16, 6)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, cx + 26, by, scale=2)

    return c, 61, gy


# =============================================================================
# ERA 7: WORLD WAR ERA (rifleman, flamethrower, early_tank)
# =============================================================================

def gen_rifleman(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD World-War Steel-Helmeted Trench Rifleman with Bolt-Action Rifle & Bayonet (74x70px)."""
    w, h = 74, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN, brow_col=HAIR_BROWN[0])
        # Classic domed olive steel M1/Brodie combat helmet + team identification band
        c.shaded_ellipse(cx, cy - 5, 9, 6, OLIVE)
        c.box(cx - 10, cy - 4, 20, 3, OLIVE)
        c.rect(cx - 8, cy - 5, 16, 2, T_MID)
        c.rect(cx - 6, cy - 5, 12, 1, T_LIGHT)
        # Chinstrap
        c.line(cx - 4, cy + 1, cx - 1, cy + 6, LEATHER[1], 1)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Canvas field pack + rolled blanket + steel canteen
        c.armor_plate(bx - 8, by + 2, 10, 14, KHAKI, sheen=False)
        c.shaded_ellipse(bx - 3, by + 1, 5, 3, OLIVE)
        c.rect(bx - 6, by + 6, 6, 2, LEATHER[1])

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Webbing Y-straps + twin leather ammo pouches
        c.rect(tx + 4, ty + 2, 2, 12, KHAKI[3])
        c.rect(tx + 11, ty + 2, 2, 12, KHAKI[3])
        c.box(tx + 2, ty + 11, 5, 5, LEATHER)
        c.box(tx + 10, ty + 11, 5, 5, LEATHER)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx - 2, sy + 2, sx + 26, sy + 2, 2.0, WOOD)
            c.line(sx + 10, sy, sx + 28, sy, DARK_STEEL[3], 2)
            return
        recoil = -4 if a == 'attack_1' else 0
        y_off = -2 if a in ('attack_0', 'attack_1') else 1
        # Walnut bolt-action rifle + steel barrel + gleaming fixed bayonet
        c.shaded_capsule(sx - 4 + recoil, sy + 4 + y_off, sx + 18 + recoil, sy + 1 + y_off, 2.2, WOOD)
        c.box(sx + 11 + recoil, sy - 2 + y_off, 20, 3, DARK_STEEL)
        c.rect(sx + 12 + recoil, sy - 2 + y_off, 18, 1, STEEL[3])
        # Gleaming steel bayonet blade under muzzle
        c.shaded_poly([(sx + 27 + recoil, sy + 1 + y_off), (sx + 38 + recoil, sy + 2 + y_off), (sx + 27 + recoil, sy + 3 + y_off)], STEEL)
        c.shaded_capsule(sx - 1, sy, sx + 8 + recoil, sy + 2 + y_off, 2.8, OLIVE)
        c.shaded_ellipse(sx + 10 + recoil, sy + 2 + y_off, 2.5, 2.5, SKIN)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 28, sy - 3, 8, FIRE)
        elif a == 'attack_2':
            draw_smoke_puff(c, sx + 32, sy - 4, 4)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=OLIVE, legs=KHAKI, boots=LEATHER,
        belt=LEATHER[0], buckle=BRASS[3],
        has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_flamethrower(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Gas-Masked WW Flame Trooper with Pressurized Twin Fuel Tanks & Napalm Lance (74x70px)."""
    w, h = 74, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Steel combat helmet over full rubber gas mask + glowing twin eyepieces + respirator snout!
        c.shaded_ellipse(cx, cy, 7, 8, CHARCOAL)
        c.shaded_ellipse(cx, cy - 5, 9, 5, DARK_STEEL)
        c.box(cx - 10, cy - 4, 20, 3, DARK_STEEL)
        c.rect(cx - 8, cy - 5, 16, 2, T_MID)
        # Glowing circular gas-mask lenses
        c.shaded_ellipse(cx + 2, cy - 1, 3.2, 3.2, FIRE if a == 'attack_1' else CYAN_GLOW)
        c.shaded_ellipse(cx + 6, cy - 1, 2.6, 3.0, FIRE if a == 'attack_1' else CYAN_GLOW)
        c.px(cx + 2, cy - 2, WHITE)
        # Respirator snout filter canister
        c.armor_plate(cx + 3, cy + 2, 7, 5, IRON, sheen=False)
        c.rect(cx + 8, cy + 3, 2, 3, BRASS[3])

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Twin pressurized crimson/steel napalm fuel tanks with hazard yellow bands!
        c.armor_plate(bx - 10, by + 1, 6, 17, CRIMSON_FUEL, sheen=True)
        c.armor_plate(bx - 4, by + 1, 6, 17, CRIMSON_FUEL, sheen=True)
        c.rect(bx - 10, by + 6, 12, 2, HAZARD_YELLOW[3])
        c.rect(bx - 10, by + 13, 12, 2, IRON[3])
        c.box(bx - 8, by - 2, 8, 3, BRASS)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx + 2, sy, 24, 5, DARK_STEEL)
            return
        recoil = -2 if a == 'attack_1' else 0
        # Fuel hose looping from backpack to heavy flame lance
        c.line(sx - 10, sy + 6, sx + 3 + recoil, sy + 5, CHARCOAL[1], 3)
        c.armor_plate(sx + recoil, sy - 3, 18, 7, DARK_STEEL, rivets=True)
        c.box(sx + 16 + recoil, sy - 2, 14, 4, IRON)
        c.box(sx + 28 + recoil, sy - 4, 5, 8, BRASS)
        # Pilot ignition flame always flickering at nozzle!
        c.shaded_ellipse(sx + 34 + recoil, sy - 1, 3, 3, FIRE)
        c.px(sx + 34 + recoil, sy - 1, WHITE)
        c.shaded_capsule(sx - 1, sy, sx + 9 + recoil, sy + 1, 2.8, CHARCOAL)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 32, sy - 1, 11, FIRE)
        elif a == 'attack_2':
            draw_smoke_puff(c, sx + 35, sy - 3, 5)

    c = draw_humanoid(
        w, h, anim,
        skin=CHARCOAL, torso=DARK_STEEL, legs=CHARCOAL, boots=IRON,
        belt=LEATHER[0], buckle=HAZARD_YELLOW[3],
        has_team_shoulder=True, torso_armored=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_early_tank(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Riveted WWI/WWII Assault Tank with Rotating Road Wheels, Turret & 75mm Cannon (124x92px)."""
    w, h = 124, 92
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.armor_plate(18, gy - 24, 84, 20, CHARCOAL, rivets=True)
        p.armor_plate(38, gy - 36, 40, 14, DARK_STEEL, rivets=True)
        p.shaded_capsule(74, gy - 30, 108, gy - 20, 3.5, IRON)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 58, gy - 44, 11)
        draw_smoke_puff(c, 82, gy - 34, 8)
        return c, 62, gy

    tread_shift = {'walk_0': 0, 'walk_1': 2, 'walk_2': 4, 'walk_3': 6}.get(anim, 0)
    bob = -1 if anim in ('walk_1', 'walk_3') else 0
    rec = -7 if anim == 'attack_1' else (-2 if anim == 'attack_2' else 0)
    tx = 18 + (rec // 2)

    # 1. Heavy Wrap-Around Steel Tank Treads + 6 Articulated Road Wheels!
    tracks = c.part()
    tracks.shaded_poly(
        [(tx, gy - 12), (tx + 8, gy - 26), (tx + 78, gy - 26), (tx + 88, gy - 12), (tx + 80, gy), (tx + 8, gy)],
        CHARCOAL,
    )
    # Tread tooth cleats animated with tread_shift
    for rx in range(tx + 8 + (tread_shift % 6), tx + 80, 6):
        tracks.rect(rx, gy - 27, 3, 2, IRON[3])
        tracks.rect(rx, gy - 1, 3, 2, IRON[0])
    # 6 heavy spoked steel road wheels
    for wi in range(6):
        wx = tx + 14 + wi * 12
        tracks.wheel(wx, gy - 11, 6, IRON, DARK_STEEL[1], tread_shift * 0.25)
    c.blit_part(tracks, INK)

    # 2. Riveted Olive-Steel Armored Hull + Side Sponson + Exhaust Muffler
    hull = c.part()
    hull.shaded_poly(
        [(tx + 4, gy - 22 + bob), (tx + 14, gy - 40 + bob), (tx + 76, gy - 40 + bob), (tx + 88, gy - 25 + bob), (tx + 84, gy - 20 + bob), (tx + 6, gy - 20 + bob)],
        OLIVE,
    )
    hull.armor_plate(tx + 18, gy - 37 + bob, 50, 14, OLIVE, rivets=True)
    # Bold team identification stripe + white star emblem
    hull.box(tx + 24, gy - 34 + bob, 32, 8, TEAM_RAMP)
    hull.rect(tx + 38, gy - 32 + bob, 4, 4, OFF_WHITE)
    # Rear exhaust muffler pipe
    hull.armor_plate(tx + 2, gy - 36 + bob, 10, 7, IRON, rivets=False)
    c.blit_part(hull, INK)

    # 3. Cast-Steel Rotating Tank Turret + Commander Cupola + Recoiling 75mm Gun!
    tur = c.part()
    t_x = tx + 24
    t_y = gy - 58 + bob
    tur.shaded_poly(
        [(t_x, t_y + 18), (t_x + 6, t_y), (t_x + 38, t_y), (t_x + 46, t_y + 10), (t_x + 42, t_y + 18)],
        OLIVE,
    )
    tur.armor_plate(t_x + 8, t_y + 3, 28, 12, OLIVE, rivets=True)
    tur.box(t_x + 12, t_y + 6, 16, 6, TEAM_RAMP)
    # Commander hatch cupola + pintle MG
    tur.box(t_x + 10, t_y - 6, 13, 6, DARK_STEEL)
    # Heavy recoiling 75mm main barrel + mantlet
    gun_y = t_y + 8
    tur.armor_plate(t_x + 40, gun_y - 5, 9, 10, DARK_STEEL, rivets=True)
    tur.box(t_x + 47 + rec, gun_y - 3, 32, 6, DARK_STEEL)
    tur.rect(t_x + 47 + rec, gun_y - 3, 32, 2, STEEL[4])
    tur.box(t_x + 76 + rec, gun_y - 4, 5, 8, IRON)
    c.blit_part(tur, INK)

    c.add_outline(INK)
    if anim in ('walk_1', 'walk_3'):
        draw_smoke_puff(c, tx - 2, gy - 38, 4)
    if anim == 'attack_1':
        draw_muzzle_flash(c, t_x + 80 + rec, gun_y, 13, FIRE)
        draw_smoke_puff(c, t_x + 76 + rec, gun_y - 12, 6)
    elif anim == 'attack_2':
        draw_smoke_puff(c, t_x + 82 + rec, gun_y - 6, 7)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, t_x + 28, t_y + 8, scale=2)

    return c, 62, gy


# =============================================================================
# ERA 8: MODERN ERA (spec_ops, at_rocket, mbt)
# =============================================================================

def gen_spec_ops(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Modern Special Forces Operator with Glowing Green NVG Optics & Suppressed Carbine (74x70px)."""
    w, h = 74, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Tactical balaclava mask + ballistic FAST helmet + twin glowing NVG night-vision goggles!
        c.shaded_ellipse(cx, cy, 7, 7, CHARCOAL)
        c.rect(cx + 1, cy - 2, 6, 3, SKIN[2])  # eye slit
        c.shaded_ellipse(cx - 1, cy - 5, 9, 5, DARK_STEEL)
        c.box(cx - 9, cy - 4, 18, 3, DARK_STEEL)
        c.rect(cx - 6, cy - 6, 8, 2, T_MID)
        # Iconic glowing emerald-green twin NVG lenses mounted on helmet brow!
        c.box(cx + 2, cy - 6, 7, 5, IRON)
        c.rect(cx + 4, cy - 5, 2, 3, NVG_GREEN[3])
        c.rect(cx + 7, cy - 5, 2, 3, NVG_GREEN[3])
        c.px(cx + 4, cy - 5, WHITE)
        c.px(cx + 7, cy - 5, WHITE)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Modular MOLLE tactical plate carrier + mag pouches + glowing team shoulder/chest patch
        c.armor_plate(tx + 2, ty + 2, 13, 13, SLATE_ARMOR, rivets=False)
        for mx in (tx + 3, tx + 7, tx + 11):
            c.box(mx, ty + 9, 3, 5, CHARCOAL)
        c.rect(tx + 5, ty + 4, 7, 3, T_LIGHT)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx + 2, sy, 24, 4, CHARCOAL)
            return
        recoil = -3 if a == 'attack_1' else 0
        # Modern suppressed tactical M4/SCAR carbine with holo sight & red laser dot
        c.armor_plate(sx - 2 + recoil, sy - 3, 18, 6, CHARCOAL, sheen=False)
        c.box(sx + 5 + recoil, sy - 6, 6, 3, DARK_STEEL)  # holo optic
        c.px(sx + 9 + recoil, sy - 5, NVG_GREEN[3])
        c.rect(sx + 8 + recoil, sy + 3, 3, 5, CHARCOAL[1])  # curved magazine
        c.box(sx + 16 + recoil, sy - 2, 14, 3, DARK_STEEL)  # suppressor
        c.rect(sx + 17 + recoil, sy + 1, 5, 2, T_GLOW)  # tactical underbarrel laser module
        c.shaded_capsule(sx - 1, sy, sx + 8 + recoil, sy + 2, 2.8, SLATE_ARMOR)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 28, sy - 1, 7, FIRE)
        elif a == 'attack_0':
            c.line(sx + 22, sy + 2, sx + 38, sy + 2, (255, 70, 70, 180), 1)

    c = draw_humanoid(
        w, h, anim,
        skin=CHARCOAL, torso=CHARCOAL, legs=SLATE_ARMOR, boots=CHARCOAL,
        belt=CHARCOAL[0], buckle=STEEL[3],
        knee_armor=DARK_STEEL, has_team_shoulder=True, torso_armored=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_at_rocket(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Modern Heavy Anti-Tank Trooper with Ballistic Visor & Shoulder ATGM Launcher (76x70px)."""
    w, h = 76, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN)
        # Heavy ballistic helmet with tinted orange-gold visor & comms headset
        c.shaded_ellipse(cx, cy - 5, 9, 6, OLIVE)
        c.box(cx - 9, cy - 4, 18, 3, OLIVE)
        c.box(cx + 1, cy - 4, 8, 4, SOLAR_GOLD)
        c.px(cx + 3, cy - 3, WHITE)
        c.box(cx - 5, cy - 1, 4, 5, CHARCOAL)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Spare AT rocket tubes strapped vertically on back!
        c.armor_plate(bx - 9, by, 5, 16, OLIVE, sheen=False)
        c.rect(bx - 9, by + 3, 5, 2, HAZARD_YELLOW[3])
        c.armor_plate(bx - 4, by + 2, 5, 14, DARK_STEEL, sheen=False)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.armor_plate(sx - 6, sy - 1, 30, 6, OLIVE, rivets=False)
            return
        recoil = -4 if a == 'attack_1' else 0
        # Heavy shoulder-mounted ATGM rocket tube extending front & back!
        ty = sy - 5
        c.armor_plate(sx - 18 + recoil, ty - 3, 44, 8, OLIVE, sheen=True)
        c.box(sx - 20 + recoil, ty - 4, 5, 10, DARK_STEEL)  # rear exhaust venturi bell
        c.box(sx + 24 + recoil, ty - 4, 5, 10, DARK_STEEL)  # front blast shield
        c.rect(sx + 10 + recoil, ty - 3, 5, 8, HAZARD_YELLOW[3])
        c.rect(sx + 2 + recoil, ty - 3, 5, 8, T_MID)
        if a != 'attack_1':
            # Warhead nose peeking out front
            c.shaded_poly([(sx + 29 + recoil, ty - 2), (sx + 35 + recoil, ty + 1), (sx + 29 + recoil, ty + 4)], FIRE)
        # Dual hands bracing tube
        c.shaded_capsule(sx, sy + 1, sx + 9 + recoil, ty + 4, 2.8, OLIVE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 26, sy - 4, 10, FIRE)
            # Signature AT launcher rear backblast flame & smoke!
            draw_smoke_puff(c, sx - 25, sy - 4, 5)
            c.shaded_ellipse(sx - 22, sy - 4, 4, 3, FIRE)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=OLIVE, legs=CHARCOAL, boots=CHARCOAL,
        belt=CHARCOAL[0], buckle=HAZARD_YELLOW[3],
        knee_armor=CHARCOAL, has_team_shoulder=True, torso_armored=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=30,
    )
    return c, 30, h - 3


def gen_mbt(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Modern Composite Main Battle Tank with ERA Armor, 7 Road Wheels & 120mm Gun (128x92px)."""
    w, h = 128, 92
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.armor_plate(16, gy - 22, 90, 18, CHARCOAL, rivets=True)
        p.armor_plate(34, gy - 34, 46, 13, DARK_STEEL, rivets=True)
        p.shaded_capsule(76, gy - 28, 114, gy - 18, 3.0, IRON)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 58, gy - 42, 12)
        draw_smoke_puff(c, 86, gy - 32, 9)
        return c, 64, gy

    tread_shift = {'walk_0': 0, 'walk_1': 2, 'walk_2': 4, 'walk_3': 6}.get(anim, 0)
    bob = -1 if anim in ('walk_1', 'walk_3') else 0
    rec = -8 if anim == 'attack_1' else (-3 if anim == 'attack_2' else 0)
    tx = 14 + rec // 2

    # 1. Low-Profile Composite Tank Tracks + 7 Heavy Road Wheels + Ballistic Side Skirts!
    tracks = c.part()
    tracks.shaded_poly(
        [(tx, gy - 14), (tx + 10, gy - 24), (tx + 86, gy - 24), (tx + 96, gy - 14), (tx + 88, gy), (tx + 8, gy)],
        CHARCOAL,
    )
    for wi in range(7):
        wx = tx + 13 + wi * 11
        tracks.wheel(wx, gy - 9, 5, DARK_STEEL, CHARCOAL[0], tread_shift * 0.3)
    # Segmented ERA Reactive Armor Ballistic Side Skirts!
    for sx in range(tx + 8, tx + 86, 12):
        tracks.armor_plate(sx, gy - 25 + bob, 11, 10, SLATE_ARMOR, sheen=False)
    c.blit_part(tracks, INK)

    # 2. Sleek Sloped Composite MBT Hull
    hull = c.part()
    hull.shaded_poly(
        [(tx + 4, gy - 24 + bob), (tx + 12, gy - 36 + bob), (tx + 84, gy - 36 + bob), (tx + 96, gy - 26 + bob), (tx + 90, gy - 21 + bob), (tx + 6, gy - 21 + bob)],
        SLATE_ARMOR,
    )
    # Glowing front LED tactical headlights & team stripe
    hull.rect(tx + 90, gy - 29 + bob, 4, 3, SOLAR_GOLD[4])
    hull.box(tx + 18, gy - 33 + bob, 56, 6, TEAM_RAMP)
    c.blit_part(hull, INK)

    # 3. Angular Wedge Composite Turret + Optic Fire-Control Pod + 120mm Smoothbore Gun!
    tur = c.part()
    t_x = tx + 18
    t_y = gy - 54 + bob
    # Sleek Abrams/K2 sloped wedge turret profile
    tur.shaded_poly(
        [(t_x, t_y + 18), (t_x + 4, t_y + 2), (t_x + 42, t_y), (t_x + 58, t_y + 10), (t_x + 50, t_y + 18)],
        SLATE_ARMOR,
    )
    tur.armor_plate(t_x + 8, t_y + 4, 34, 11, SLATE_ARMOR, sheen=True)
    tur.box(t_x + 12, t_y + 7, 22, 5, TEAM_RAMP)
    # Commander thermal optic sensor pod + whip antenna
    tur.box(t_x + 28, t_y - 6, 8, 6, DARK_STEEL)
    tur.rect(t_x + 33, t_y - 5, 3, 3, NVG_GREEN[3])
    tur.line(t_x + 6, t_y + 2, t_x + 2, t_y - 18, STEEL[3], 1)
    # Long 120mm smoothbore barrel with bore evacuator cylinder!
    gun_y = t_y + 9
    tur.box(t_x + 52 + rec, gun_y - 2, 42, 5, DARK_STEEL)
    tur.rect(t_x + 52 + rec, gun_y - 2, 42, 1, STEEL[4])
    tur.armor_plate(t_x + 67 + rec, gun_y - 4, 12, 8, SLATE_ARMOR, sheen=True)
    c.blit_part(tur, INK)

    c.add_outline(INK)
    if anim == 'attack_1':
        draw_muzzle_flash(c, t_x + 93 + rec, gun_y, 14, FIRE)
        draw_smoke_puff(c, t_x + 88 + rec, gun_y - 11, 7)
    elif anim == 'attack_2':
        draw_smoke_puff(c, t_x + 95 + rec, gun_y - 6, 8)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, t_x + 34, t_y + 8, scale=2)

    return c, 64, gy


# =============================================================================
# ERA 9: FUTURE ERA (cyborg, railgun_sniper, colossus_mech)
# =============================================================================

def gen_cyborg(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Futuristic Titanium Cybernetic Exo-Warrior with Neon Energy Blade (74x70px)."""
    w, h = 74, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Sleek angular sci-fi cybernetic exo-helmet + glowing panoramic visor slit + fin crest
        c.shaded_poly(
            [(cx - 9, cy - 2), (cx - 2, cy - 10), (cx + 8, cy - 5), (cx + 8, cy + 5), (cx - 6, cy + 6)],
            TITANIUM,
        )
        c.rect(cx - 2, cy - 11, 6, 3, TEAM_RAMP[3])
        c.rect(cx, cy - 4, 9, 4, INK)
        c.rect(cx + 1, cy - 3, 8, 2, T_GLOW)
        c.px(cx + 5, cy - 3, WHITE)
        # Side comms antenna
        c.line(cx - 7, cy - 4, cx - 10, cy - 11, STEEL[3], 1)
        c.px(cx - 10, cy - 12, T_GLOW)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        c.armor_plate(tx + 2, ty + 2, 13, 12, TITANIUM, sheen=True)
        # Glowing cyan/team cybernetic chest arc-reactor
        c.shaded_ellipse(tx + 9, ty + 7, 3.5, 3.5, (T_DEEP, T_SHADE, T_MID, T_GLOW, WHITE))
        c.px(tx + 9, ty + 7, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx + 2, sy + 2, sx + 22, sy + 2, 2.0, CYAN_GLOW)
            return
        if a == 'attack_0':
            ex, ey = sx - 5, sy - 9
            c.shaded_capsule(sx, sy, ex, ey, 3.0, TITANIUM)
            c.shaded_poly([(ex - 2, ey - 2), (ex - 13, ey - 22), (ex - 8, ey - 24), (ex + 2, ey - 2)], CYAN_GLOW)
        elif a == 'attack_1':
            ex, ey = sx + 11, sy + 1
            c.shaded_capsule(sx, sy, ex, ey, 3.2, TITANIUM)
            # Blazing dual-beam cybernetic plasma arm-blade!
            c.box(ex - 2, ey - 4, 6, 8, DARK_STEEL)
            c.shaded_poly([(ex + 4, ey - 4), (ex + 30, ey), (ex + 26, ey + 5), (ex + 4, ey + 4)], CYAN_GLOW)
            c.line(ex + 5, ey, ex + 28, ey, WHITE, 2)
        elif a == 'attack_2':
            ex, ey = sx + 9, sy + 6
            c.shaded_capsule(sx, sy, ex, ey, 3.0, TITANIUM)
            c.shaded_poly([(ex + 2, ey), (ex + 22, ey + 11), (ex + 19, ey + 14), (ex + 1, ey + 4)], CYAN_GLOW)
        else:
            sway = -2 if a in ('walk_1', 'walk_2') else 2
            ex, ey = sx + 7, sy + 2 + sway
            c.shaded_capsule(sx, sy, ex, ey, 3.0, TITANIUM)
            c.box(ex - 2, ey - 3, 6, 6, DARK_STEEL)
            c.shaded_poly([(ex + 3, ey - 2), (ex + 19, ey - 16 + sway), (ex + 22, ey - 12 + sway), (ex + 6, ey + 1)], CYAN_GLOW)
            c.line(ex + 4, ey - 2, ex + 19, ey - 14 + sway, WHITE, 1)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.radial_glow(sx + 28, sy + 1, 9, (56, 232, 255, 160))
            draw_slash_smear(c, sx + 19, sy, 21, CYAN_GLOW[3], WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=TITANIUM, torso=TITANIUM, legs=DARK_STEEL, boots=TITANIUM,
        belt=DARK_STEEL[0], buckle=T_GLOW,
        knee_armor=TEAM_RAMP, has_team_shoulder=True, torso_armored=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_railgun_sniper(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Future Recon Marksman with Stealth Cloak & Twin-Rail Electromagnetic Rifle (78x70px)."""
    w, h = 78, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        c.shaded_ellipse(cx, cy - 1, 8, 7, TITANIUM)
        c.shaded_poly([(cx - 9, cy - 3), (cx, cy - 10), (cx + 9, cy - 3), (cx + 6, cy + 5), (cx - 7, cy + 5)], TITANIUM)
        # Precision multi-lens targeting recon visor!
        c.rect(cx + 1, cy - 4, 8, 5, INK)
        c.rect(cx + 2, cy - 3, 3, 3, T_GLOW)
        c.rect(cx + 6, cy - 3, 3, 3, CYAN_GLOW[3])
        c.px(cx + 7, cy - 2, WHITE)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # High-voltage capacitor battery pack with glowing cyan power cells
        c.armor_plate(bx - 9, by + 2, 10, 15, DARK_STEEL, rivets=True)
        c.rect(bx - 7, by + 5, 3, 9, CYAN_GLOW[3])
        c.rect(bx - 3, by + 5, 2, 9, T_GLOW)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx + 2, sy, 28, 5, TITANIUM)
            return
        recoil = -4 if a == 'attack_1' else 0
        # Massive twin-rail electromagnetic railgun rifle crackling with cyan energy!
        c.armor_plate(sx - 3 + recoil, sy - 4, 16, 8, DARK_STEEL, sheen=True)
        c.box(sx + 11 + recoil, sy - 6, 25, 3, TITANIUM)
        c.box(sx + 11 + recoil, sy + 1, 25, 3, TITANIUM)
        c.rect(sx + 12 + recoil, sy - 3, 24, 4, CYAN_GLOW[2] if a != 'attack_1' else WHITE)
        c.rect(sx + 14 + recoil, sy - 2, 22, 2, CYAN_GLOW[4])
        # Precision top rail optic
        c.box(sx + 4 + recoil, sy - 8, 9, 3, TITANIUM)
        c.px(sx + 11 + recoil, sy - 7, T_GLOW)
        c.shaded_capsule(sx - 1, sy, sx + 9 + recoil, sy + 2, 2.8, TITANIUM)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        recoil = -4 if a == 'attack_1' else 0
        c.radial_glow(sx + 34 + recoil, sy - 1, 8 if a == 'attack_1' else 4, (56, 232, 255, 160))
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 34, sy - 1, 11, CYAN_GLOW)
        elif a == 'attack_0':
            draw_hit_sparks(c, sx + 35, sy - 1, scale=1)

    c = draw_humanoid(
        w, h, anim,
        skin=TITANIUM, torso=DARK_STEEL, legs=CHARCOAL, boots=TITANIUM,
        belt=DARK_STEEL[0], buckle=CYAN_GLOW[3],
        has_team_sash=True, cape_ramp=TEAM_RAMP, has_team_shoulder=True, torso_armored=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_colossus_mech(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Towering Sci-Fi Heavy Assault Colossus Mecha with Missile Pods & Twin Plasma Cannon (138x132px)."""
    w, h = 138, 132
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.armor_plate(24, gy - 26, 74, 22, TITANIUM, rivets=True)
        p.armor_plate(44, gy - 34, 38, 15, TEAM_RAMP, sheen=True)
        p.shaded_ellipse(64, gy - 24, 9, 7, CYAN_GLOW)
        p.armor_plate(92, gy - 20, 26, 12, DARK_STEEL, rivets=True)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 64, gy - 42, 11)
        draw_smoke_puff(c, 90, gy - 28, 8)
        return c, 69, gy

    if anim == 'walk_0':
        fl, bl, bob = 12, -12, 0
    elif anim == 'walk_1':
        fl, bl, bob = 3, -3, -4
    elif anim == 'walk_2':
        fl, bl, bob = -12, 12, 0
    elif anim == 'walk_3':
        fl, bl, bob = -3, 3, -4
    elif anim == 'attack_0':
        fl, bl, bob = -4, -9, -2
    elif anim == 'attack_1':
        fl, bl, bob = 8, -12, 3
    else:
        fl, bl, bob = -6, -5, -2

    rec = -6 if anim == 'attack_1' else (-2 if anim == 'attack_2' else 0)
    cx = 64 + rec
    cy = gy - 68 + bob

    # 1. Back Reverse-Jointed Hydraulic Mech Leg
    bl_p = c.part()
    dark_t = (DARK_STEEL[0], DARK_STEEL[0], DARK_STEEL[1], DARK_STEEL[2])
    bl_p.shaded_capsule(cx - 12, cy + 20, cx - 22 + bl // 2, cy + 40, 7.5, dark_t)
    bl_p.shaded_capsule(cx - 22 + bl // 2, cy + 40, cx - 14 + bl, gy - 8, 6.5, dark_t)
    bl_p.armor_plate(cx - 26 + bl, gy - 12, 24, 11, DARK_STEEL, rivets=True)
    c.blit_part(bl_p, INK)

    # 2. Shoulder-Mounted Twin 6-Tube Tactical Missile Pods!
    pods = c.part()
    pods.armor_plate(cx - 32, cy - 42, 22, 22, DARK_STEEL, rivets=True)
    pods.box(cx - 30, cy - 40, 18, 6, TEAM_RAMP)
    for my in (cy - 32, cy - 26):
        for mx in (cx - 28, cx - 22, cx - 16):
            pods.shaded_ellipse(mx, my, 2.2, 2.2, FIRE)
    c.blit_part(pods, INK)

    # 3. Massive Sloped Titanium Mech Torso + Glowing Fusion Reactor + Armored Cockpit Head!
    body = c.part()
    body.shaded_poly(
        [(cx - 26, cy - 26), (cx + 26, cy - 26), (cx + 22, cy + 22), (cx - 22, cy + 22)],
        TITANIUM,
    )
    body.armor_plate(cx - 22, cy - 22, 44, 34, TITANIUM, rivets=True)
    # Bold team shoulder & chest armor accents
    body.armor_plate(cx - 20, cy - 20, 40, 11, TEAM_RAMP, sheen=True)
    # Glowing Cyan Fusion Chest Core!
    body.shaded_ellipse(cx + 4, cy + 1, 11, 10, DARK_STEEL)
    body.shaded_ellipse(cx + 4, cy + 1, 8, 7, CYAN_GLOW)
    body.ellipse(cx + 4, cy + 1, 3, 3, WHITE)
    # Sleek Armored Mecha Head with glowing tactical visor & twin comms antennae!
    body.armor_plate(cx - 8, cy - 40, 22, 16, TITANIUM, sheen=True)
    body.rect(cx, cy - 34, 14, 5, INK)
    body.rect(cx + 2, cy - 33, 11, 3, T_GLOW)
    body.rect(cx + 6, cy - 33, 5, 2, WHITE)
    body.line(cx - 4, cy - 40, cx - 8, cy - 54, STEEL[3], 2)
    body.line(cx + 4, cy - 40, cx + 2, cy - 50, STEEL[3], 1)
    body.px(cx - 8, cy - 55, T_GLOW)
    c.blit_part(body, INK)

    # 4. Near Heavy Hydraulic Titanium Leg with Glowing Knee Thruster & Armored Claw Foot
    fl_p = c.part()
    fl_p.shaded_capsule(cx + 4, cy + 20, cx + 14 + fl // 2, cy + 40, 8.5, TITANIUM)
    fl_p.shaded_capsule(cx + 14 + fl // 2, cy + 40, cx + 10 + fl, gy - 8, 7.5, TITANIUM)
    fl_p.armor_plate(cx + 7 + fl // 2, cy + 34, 14, 12, TEAM_RAMP, rivets=True)
    fl_p.rect(cx + 10 + fl // 2, cy + 38, 8, 3, CYAN_GLOW[3])
    fl_p.armor_plate(cx - 2 + fl, gy - 12, 26, 11, TITANIUM, rivets=True)
    fl_p.rect(cx + 20 + fl, gy - 9, 6, 8, DARK_STEEL[2])
    c.blit_part(fl_p, INK)

    # 5. Heavy Twin-Barrel Forearm Plasma / Rail Autocannon!
    gun = c.part()
    gy_c = cy + 6
    gun.armor_plate(cx - 2, gy_c - 10, 24, 20, TEAM_RAMP, rivets=True)
    gun.armor_plate(cx + 20, gy_c - 9, 36, 7, TITANIUM, rivets=True)
    gun.armor_plate(cx + 20, gy_c + 2, 36, 7, TITANIUM, rivets=True)
    gun.rect(cx + 22, gy_c - 2, 34, 4, CYAN_GLOW[3])
    gun.rect(cx + 24, gy_c - 1, 32, 2, WHITE)
    c.blit_part(gun, INK)

    c.add_outline(INK)
    c.radial_glow(cx + 4, cy + 1, 13, (56, 232, 255, 110))
    if anim == 'attack_1':
        draw_muzzle_flash(c, cx + 56, gy_c, 14, CYAN_GLOW)
        draw_muzzle_flash(c, cx - 12, cy - 30, 7, FIRE)
    elif anim == 'attack_0':
        draw_hit_sparks(c, cx + 56, gy_c, scale=2)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, cx + 16, cy - 6, scale=2)

    return c, 69, gy


MODERN_UNIT_GENERATORS = {
    'pikeman': gen_pikeman,
    'musketeer': gen_musketeer,
    'field_cannon': gen_field_cannon,
    'rifleman': gen_rifleman,
    'flamethrower': gen_flamethrower,
    'early_tank': gen_early_tank,
    'spec_ops': gen_spec_ops,
    'at_rocket': gen_at_rocket,
    'mbt': gen_mbt,
    'cyborg': gen_cyborg,
    'railgun_sniper': gen_railgun_sniper,
    'colossus_mech': gen_colossus_mech,
}
