"""High-density Metal-Slug-style pixel art generators for Eras 4, 5, 6, and 7 (12 units)."""

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
    CYAN_GLOW,
    DARK_STEEL,
    FIRE,
    GOLD,
    HAZARD_YELLOW,
    INK,
    INK_SOFT,
    IRON,
    KHAKI,
    LEATHER,
    OFF_WHITE,
    OLIVE,
    SKIN,
    SMOKE,
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


def _draw_face(c: PixelCanvas, cx: int, cy: int) -> None:
    c.shaded_ellipse(cx, cy, 4, 4, SKIN)
    c.px(cx + 2, cy, INK)
    c.px(cx + 2, cy - 1, SKIN[0])


# =============================================================================
# ERA 4: GUNPOWDER / EARLY MODERN (pikeman, musketeer, field_cannon)
# =============================================================================

def gen_pikeman(anim: str) -> tuple[PixelCanvas, int, int]:
    """Renaissance Morion-Helmeted Pikeman with steel breastplate & long pike (40x38px)."""
    w, h = 40, 38

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        _draw_face(c, cx, cy)
        # Iconic Spanish Morion curved-brim steel helmet
        c.shaded_ellipse(cx, cy - 3, 4, 3, STEEL)
        c.line(cx - 5, cy - 2, cx - 2, cy - 1, STEEL[3])
        c.line(cx - 2, cy - 1, cx + 2, cy - 1, STEEL[2])
        c.line(cx + 2, cy - 1, cx + 5, cy - 2, STEEL[3])
        c.rect(cx - 1, cy - 7, 2, 3, STEEL[4])  # comb ridge
        # Team plume sweeping back
        c.line(cx - 3, cy - 5, cx - 7, cy - 7, T_LIGHT, 2)
        c.px(cx - 7, cy - 7, T_TRIM)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Shining steel cuirass over puffed team sleeves
        c.box(tx + 1, ty + 1, 7, 6, STEEL)
        c.rect(tx + 2, ty + 2, 2, 3, STEEL[4])
        # Skirt tassets
        c.box(tx, ty + 7, 4, 3, TEAM_RAMP)
        c.box(tx + 5, ty + 7, 4, 3, TEAM_RAMP)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx - 6, sy + 2, sx + 18, sy + 2, WOOD, 1)
            c.poly([(sx + 17, sy + 1), (sx + 21, sy + 2), (sx + 17, sy + 3)], STEEL[4])
            return
        thrust = -4 if a == 'attack_0' else (7 if a == 'attack_1' else 2)
        y_off = -1 if a == 'attack_1' else 0
        end_x = min(w - 5, sx + 16 + thrust)
        c.shaded_line(sx - 10 + thrust, sy + 1 + y_off, end_x, sy - 1 + y_off, WOOD, 1)
        # Gleaming steel pike tip + team tassel
        c.poly([(end_x - 1, sy - 3 + y_off), (end_x + 4, sy - 1 + y_off), (end_x - 1, sy + 1 + y_off)], STEEL[4])
        c.px(end_x + 3, sy - 1 + y_off, WHITE)
        c.rect(end_x - 3, sy + y_off, 2, 3, T_LIGHT)
        # Puffed team sleeve arm
        c.shaded_line(sx - 1, sy, sx + 4 + thrust // 2, sy + y_off, TEAM_RAMP, 2)
        c.px(sx + 5 + thrust // 2, sy + y_off, SKIN[3])

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.line(w - 7, sy - 2, w - 1, sy - 2, T_GLOW)
            c.line(w - 5, sy - 1, w - 1, sy - 1, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=TEAM_RAMP, legs=CHARCOAL, boots=LEATHER,
        belt=LEATHER[1], buckle=GOLD[3],
        has_team_shoulder=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_musketeer(anim: str) -> tuple[PixelCanvas, int, int]:
    """Colonial Tricorne Musketeer with vivid team uniform coat & flintlock musket (38x38px)."""
    w, h = 38, 38

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        _draw_face(c, cx, cy)
        # Tricorne colonial hat with gold trim & white/team plume
        c.rect(cx - 5, cy - 3, 11, 2, CHARCOAL[1])
        c.box(cx - 3, cy - 6, 7, 4, CHARCOAL)
        c.rect(cx - 5, cy - 3, 11, 1, GOLD[3])
        c.line(cx - 2, cy - 6, cx - 6, cy - 8, OFF_WHITE, 2)
        c.px(cx - 6, cy - 8, T_LIGHT)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Crisp white colonial X-crossbelt & gold buttons
        c.line(tx + 1, ty + 1, tx + 7, ty + 7, OFF_WHITE)
        c.line(tx + 7, ty + 1, tx + 1, ty + 7, OFF_WHITE)
        c.px(tx + 4, ty + 2, GOLD[3])
        c.px(tx + 4, ty + 5, GOLD[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx, sy + 2, sx + 14, sy + 2, WOOD, 2)
            c.line(sx + 6, sy + 1, sx + 15, sy + 1, STEEL[3])
            return
        recoil = -2 if a == 'attack_1' else 0
        y_off = -1 if a in ('attack_0', 'attack_1') else 1
        # Wooden musket stock
        c.shaded_line(sx - 2 + recoil, sy + 2 + y_off, sx + 9 + recoil, sy + y_off, WOOD, 2)
        # Long steel barrel with brass rings
        c.line(sx + 5 + recoil, sy - 1 + y_off, sx + 16 + recoil, sy - 1 + y_off, STEEL[3], 2)
        c.line(sx + 6 + recoil, sy - 2 + y_off, sx + 15 + recoil, sy - 2 + y_off, STEEL[4], 1)
        c.px(sx + 10 + recoil, sy - 1 + y_off, GOLD[3])
        c.px(sx + 14 + recoil, sy - 1 + y_off, GOLD[3])
        # Hands & sleeve
        c.shaded_line(sx - 1, sy, sx + 4 + recoil, sy + 1 + y_off, TEAM_RAMP, 2)
        c.px(sx + 5 + recoil, sy + 1 + y_off, SKIN[3])

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 15, sy - 2, 4, FIRE)
        elif a == 'attack_2':
            draw_smoke_puff(c, sx + 17, sy - 2, 3)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=TEAM_RAMP, legs=OFF_WHITE if False else (SMOKE[1], SMOKE[2], SMOKE[3], SMOKE[4], WHITE),
        boots=CHARCOAL,
        belt=OFF_WHITE, buckle=GOLD[3],
        has_team_shoulder=True,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_field_cannon(anim: str) -> tuple[PixelCanvas, int, int]:
    """Gunpowder Bronze Field Artillery Cannon + Uniformed Gunner (60x48px)."""
    w, h = 60, 48
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        c.box(14, gy - 8, 28, 6, WOOD_DARK)
        c.shaded_line(22, gy - 10, 44, gy - 5, BRONZE, 5)
        c.wheel(26, gy - 5, 6, WOOD, IRON[2], 0.4)
        c.add_outline(INK)
        draw_smoke_puff(c, 36, gy - 13, 5)
        return c, 30, gy

    phases = {'walk_0': 0.0, 'walk_1': 0.4, 'walk_2': 0.8, 'walk_3': 1.2}
    w_phase = phases.get(anim, 0.0)
    recoil = -4 if anim == 'attack_1' else (-1 if anim == 'attack_2' else 0)
    bob = -1 if anim in ('walk_1', 'walk_3') else 0

    # 1. Uniformed Gunner Crewman standing behind carriage (x=8..19)
    gx = 13 + (recoil // 2)
    leg_s = 2 if anim in ('walk_0', 'walk_2') else 0
    c.line(gx - 1, gy - 8, gx - 1 - leg_s, gy - 1, CHARCOAL[1], 3)
    c.line(gx + 1, gy - 8, gx + 1 + leg_s, gy - 1, CHARCOAL[2], 3)
    c.box(gx - 4, gy - 18 + bob, 8, 10, TEAM_RAMP)
    c.line(gx - 3, gy - 17 + bob, gx + 3, gy - 10 + bob, OFF_WHITE)
    c.shaded_ellipse(gx, gy - 22 + bob, 3, 3, SKIN)
    c.px(gx + 2, gy - 22 + bob, INK)
    c.box(gx - 4, gy - 26 + bob, 8, 3, CHARCOAL)
    c.rect(gx - 4, gy - 24 + bob, 8, 1, GOLD[3])
    # Gunner arm holding linstock torch / pushing carriage
    if anim == 'attack_0':
        c.shaded_line(gx + 2, gy - 15 + bob, gx + 10, gy - 20 + bob, TEAM_RAMP, 2)
        c.px(gx + 11, gy - 21 + bob, FIRE[3])
    else:
        c.shaded_line(gx + 2, gy - 15 + bob, gx + 9, gy - 14 + bob, TEAM_RAMP, 2)

    # 2. Heavy Oak Artillery Carriage Trail
    cx = 22 + recoil
    cy = gy - 10 + bob
    c.poly([(cx - 10, gy - 2), (cx + 12, cy - 4), (cx + 14, cy + 2), (cx - 4, gy - 1)], WOOD[2])
    c.line(cx - 10, gy - 2, cx + 12, cy - 4, WOOD[3])
    c.box(cx + 3, cy - 5, 11, 6, TEAM_RAMP)
    c.rect(cx + 5, cy - 3, 7, 2, GOLD[3])

    # 3. Gleaming Tapered Bronze Cannon Barrel with Reinforcing Rings!
    by = cy - 9
    barrel_pts = [
        (cx - 1, by - 4),
        (cx + 25, by - 3),
        (cx + 25, by + 3),
        (cx - 1, by + 5),
    ]
    c.shaded_poly(barrel_pts, BRONZE)
    # Cascabel breech knob on back
    c.shaded_ellipse(cx - 3, by, 3, 3, BRONZE)
    # Gold reinforcing bands & flared muzzle lip
    for rx in (cx + 5, cx + 14, cx + 23):
        c.rect(rx, by - 4, 2, 8, GOLD[3])
        c.rect(rx, by + 2, 2, 2, BRONZE[0])
    # Dark bore interior
    c.rect(cx + 25, by - 2, 2, 4, INK)

    # 4. Large Spoked Artillery Wheel in front of carriage
    c.wheel(cx + 8, gy - 9, 8, WOOD, IRON[2], w_phase)

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_muzzle_flash(c, cx + 26, by, 6, FIRE)
        draw_smoke_puff(c, cx + 25, by - 6, 4)
    elif anim == 'attack_2':
        draw_smoke_puff(c, cx + 27, by - 4, 4)
        draw_smoke_puff(c, cx + 31, by - 8, 3)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, cx + 14, by)

    return c, 30, gy


# =============================================================================
# ERA 5: WORLD WAR ERA (rifleman, flamethrower, early_tank)
# =============================================================================

def gen_rifleman(anim: str) -> tuple[PixelCanvas, int, int]:
    """World War Olive-Drab Infantry Rifleman with steel helmet & bayonet rifle (36x36px)."""
    w, h = 36, 36

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        c.box(bx - 3, by, 4, 7, KHAKI)
        c.rect(bx - 3, by + 2, 4, 1, LEATHER[1])

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        _draw_face(c, cx, cy)
        # Classic WW steel combat helmet (M1 / Brodie silhouette)
        c.shaded_ellipse(cx, cy - 3, 5, 3, OLIVE)
        c.rect(cx - 5, cy - 2, 10, 2, OLIVE[2])
        c.rect(cx - 4, cy - 2, 8, 1, OLIVE[3])
        # Team identification stripe on helmet
        c.rect(cx - 3, cy - 4, 6, 2, T_MID)
        c.rect(cx - 2, cy - 4, 4, 1, T_LIGHT)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Ammo pouches + team scarf
        c.rect(tx + 2, ty, 5, 2, T_LIGHT)
        c.rect(tx + 2, ty + 5, 2, 3, LEATHER[2])
        c.rect(tx + 5, ty + 5, 2, 3, LEATHER[2])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx, sy + 2, sx + 14, sy + 2, WOOD, 2)
            c.line(sx + 8, sy + 1, sx + 15, sy + 1, DARK_STEEL[3])
            return
        recoil = -2 if a == 'attack_1' else 0
        y_off = -1 if a in ('attack_0', 'attack_1') else 1
        # Wooden bolt-action rifle body + steel barrel + bayonet
        c.shaded_line(sx - 2 + recoil, sy + 2 + y_off, sx + 10 + recoil, sy + y_off, WOOD, 2)
        c.line(sx + 5 + recoil, sy - 1 + y_off, sx + 15 + recoil, sy - 1 + y_off, DARK_STEEL[3], 2)
        # Fixed bayonet blade under barrel
        c.line(sx + 12 + recoil, sy + 1 + y_off, sx + 17 + recoil, sy + 1 + y_off, STEEL[4])
        c.shaded_line(sx - 1, sy, sx + 4 + recoil, sy + 1 + y_off, OLIVE, 2)
        c.px(sx + 5 + recoil, sy + 1 + y_off, SKIN[3])

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 14, sy - 2, 4, FIRE)
        elif a == 'attack_2':
            draw_smoke_puff(c, sx + 16, sy - 2, 2)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=OLIVE, legs=KHAKI, boots=LEATHER,
        belt=LEATHER[1], buckle=BRONZE[3],
        has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=14,
    )
    return c, 14, h - 2


def gen_flamethrower(anim: str) -> tuple[PixelCanvas, int, int]:
    """WW Heavy Gasmask Flamethrower Trooper with pressurized fuel tanks (38x38px)."""
    w, h = 38, 38

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Twin heavy pressurized fuel tanks with team stripe & brass valves!
        c.box(bx - 5, by - 2, 6, 10, IRON)
        c.rect(bx - 5, by + 2, 6, 3, T_MID)
        c.rect(bx - 4, by + 2, 4, 1, T_LIGHT)
        c.rect(bx - 4, by - 4, 2, 2, BRONZE[3])
        c.rect(bx - 1, by - 4, 2, 2, BRONZE[3])
        # Fuel hose looping down
        c.line(bx - 2, by + 8, bx + 4, by + 8, CHARCOAL[2])

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Heavy dark rubber gasmask + steel helmet + bright glowing goggle lenses
        c.shaded_ellipse(cx, cy, 4, 4, CHARCOAL)
        c.shaded_ellipse(cx, cy - 3, 5, 3, DARK_STEEL)
        c.rect(cx - 5, cy - 2, 10, 1, STEEL[3])
        # Round goggle visor lenses
        c.rect(cx + 1, cy - 1, 3, 2, HAZARD_YELLOW[3])
        c.px(cx + 2, cy - 1, WHITE)
        # Gasmask filter snout
        c.box(cx + 2, cy + 1, 3, 3, IRON)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx, sy + 2, sx + 13, sy + 2, DARK_STEEL, 2)
            return
        recoil = -1 if a == 'attack_1' else 0
        # Heavy double-tube flame wand + pilot nozzle
        c.shaded_line(sx - 1 + recoil, sy + 2, sx + 13 + recoil, sy + 1, DARK_STEEL, 3)
        c.line(sx + 11 + recoil, sy, sx + 15 + recoil, sy, BRONZE[3], 2)
        c.shaded_line(sx - 1, sy, sx + 5 + recoil, sy + 2, OLIVE, 2)
        # Always-lit tiny pilot flame!
        c.px(sx + 16 + recoil, sy, FIRE[3])
        c.px(sx + 16 + recoil, sy - 1, FIRE[4])

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            # Roaring pixel flamethrower jet!
            c.shaded_ellipse(sx + 17, sy, 4, 3, FIRE)
            c.shaded_ellipse(sx + 20, sy, 5, 4, FIRE)
            c.rect(sx + 14, sy - 1, 6, 3, FIRE[4])
            c.px(sx + 16, sy, WHITE)
        elif a == 'attack_2':
            c.shaded_ellipse(sx + 17, sy, 3, 2, FIRE)
            draw_smoke_puff(c, sx + 19, sy - 3, 2)

    c = draw_humanoid(
        w, h, anim,
        skin=CHARCOAL, torso=OLIVE, legs=CHARCOAL, boots=CHARCOAL,
        belt=LEATHER[0], buckle=BRONZE[3],
        has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_early_tank(anim: str) -> tuple[PixelCanvas, int, int]:
    """Metal Slug SV-001 / WW Chunky Riveted Battle Tank (64x48px)."""
    w, h = 64, 48
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        # Charred wrecked tank with blown turret hatch
        c.box(10, gy - 12, 42, 10, CHARCOAL)
        c.box(16, gy - 20, 22, 9, DARK_STEEL)
        c.shaded_line(34, gy - 18, 48, gy - 10, CHARCOAL, 3)
        c.rect(18, gy - 17, 14, 3, T_DEEP)
        c.add_outline(INK)
        draw_smoke_puff(c, 28, gy - 24, 6)
        draw_muzzle_flash(c, 26, gy - 20, 3, FIRE)
        return c, 32, gy

    tread_shift = {'walk_0': 0, 'walk_1': 1, 'walk_2': 2, 'walk_3': 3}.get(anim, 0)
    bob = -1 if anim in ('walk_1', 'walk_3') else 0
    recoil = -3 if anim == 'attack_1' else (-1 if anim == 'attack_2' else 0)
    hull_x = 8 + (recoil // 2)
    hull_y = gy - 22 + bob

    # 1. Articulated Armored Track Sponsons + 5 Road Wheels
    c.poly([
        (hull_x + 4, gy - 11),
        (hull_x + 40, gy - 11),
        (hull_x + 44, gy - 6),
        (hull_x + 40, gy),
        (hull_x + 4, gy),
        (hull_x, gy - 6),
    ], CHARCOAL[0])
    # Moving tread cleats around perimeter!
    for tx in range(hull_x + 3, hull_x + 42, 4):
        shift = (tx + tread_shift) % 4
        if shift < 2:
            c.rect(tx, gy - 12, 2, 2, IRON[3])
            c.rect(tx, gy - 1, 2, 2, IRON[2])
    # 5 chunky steel road wheels
    for idx in range(5):
        wx = hull_x + 6 + idx * 8
        c.shaded_ellipse(wx, gy - 5, 3, 3, IRON)
        c.px(wx + (1 if (tread_shift & 1) else 0), gy - 5, STEEL[4])

    # 2. Chunky Sloped Riveted Olive Hull
    hull_pts = [
        (hull_x + 2, hull_y + 11),
        (hull_x + 6, hull_y + 2),
        (hull_x + 36, hull_y + 2),
        (hull_x + 44, hull_y + 7),
        (hull_x + 43, hull_y + 12),
    ]
    c.shaded_poly(hull_pts, OLIVE)
    # Armored mudguard + rivets
    c.rect(hull_x + 3, hull_y + 10, 40, 2, OLIVE[0])
    for rx in range(hull_x + 8, hull_x + 38, 6):
        c.px(rx, hull_y + 4, OLIVE[4])
        c.px(rx, hull_y + 9, OLIVE[0])
    # Exhaust pipe + team side stripe
    c.box(hull_x + 1, hull_y + 4, 4, 6, IRON)
    c.box(hull_x + 11, hull_y + 5, 18, 4, TEAM_RAMP)
    c.rect(hull_x + 16, hull_y + 6, 8, 2, WHITE)

    # 3. Rounded Cast-Steel Turret + Commander Cupola
    tur_x = hull_x + 12
    tur_y = hull_y - 10
    c.box(tur_x, tur_y + 2, 22, 10, OLIVE)
    c.rect(tur_x + 2, tur_y, 17, 3, OLIVE[3])
    c.box(tur_x + 4, tur_y - 3, 8, 4, OLIVE)  # commander hatch
    # Team identification turret band!
    c.box(tur_x + 2, tur_y + 4, 9, 5, TEAM_RAMP)
    c.px(tur_x + 6, tur_y + 6, GOLD[3])
    # Heavy mantlet & stubby high-caliber tank barrel with recoil
    bar_x = tur_x + 20 + recoil
    bar_y = tur_y + 5
    c.box(tur_x + 18, bar_y - 2, 5, 6, DARK_STEEL)
    c.box(bar_x + 2, bar_y - 1, 18, 4, IRON)
    c.rect(bar_x + 2, bar_y - 1, 18, 1, STEEL[3])
    c.box(bar_x + 18, bar_y - 2, 4, 6, DARK_STEEL)  # muzzle brake

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_muzzle_flash(c, bar_x + 21, bar_y + 1, 6, FIRE)
        draw_smoke_puff(c, hull_x, hull_y + 2, 2)
    elif anim == 'attack_2':
        draw_smoke_puff(c, bar_x + 22, bar_y - 2, 4)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, tur_x + 16, tur_y + 5)

    return c, 32, gy


# =============================================================================
# ERA 6: MODERN ERA (spec_ops, at_rocket, mbt)
# =============================================================================

def gen_spec_ops(anim: str) -> tuple[PixelCanvas, int, int]:
    """Modern Special Forces Operator with NVG goggles & suppressed tactical rifle (36x36px)."""
    w, h = 36, 36

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        c.box(bx - 3, by, 4, 7, CHARCOAL)
        c.line(bx - 2, by, bx - 3, by - 6, STEEL[2])  # tactical radio antenna

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Balaclava mask + modern ballistic helmet + glowing team NVG visor!
        c.shaded_ellipse(cx, cy, 4, 4, CHARCOAL)
        c.shaded_ellipse(cx, cy - 3, 5, 3, DARK_STEEL)
        # Dual glowing tactical NVG lenses
        c.rect(cx + 1, cy - 2, 4, 2, T_GLOW)
        c.px(cx + 2, cy - 2, WHITE)
        c.px(cx + 4, cy - 2, WHITE)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Tactical plate carrier + bright team IFF patch
        c.box(tx + 1, ty + 1, 7, 6, DARK_STEEL)
        c.rect(tx + 2, ty + 2, 4, 2, T_MID)
        c.rect(tx + 3, ty + 2, 2, 1, T_GLOW)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx, sy + 1, 13, 3, DARK_STEEL)
            return
        recoil = -1 if a == 'attack_1' else 0
        y_off = -1 if a in ('attack_0', 'attack_1') else 1
        # Suppressed modern tactical carbine + red-dot optic + curved magazine
        c.box(sx - 1 + recoil, sy + y_off, 12, 3, CHARCOAL)
        c.rect(sx + 3 + recoil, sy - 2 + y_off, 4, 2, STEEL[3])  # optic
        c.rect(sx + 5 + recoil, sy + 3 + y_off, 2, 3, IRON[1])  # magazine
        c.rect(sx + 11 + recoil, sy + y_off, 5, 2, DARK_STEEL[2])  # silencer
        c.shaded_line(sx - 1, sy, sx + 4 + recoil, sy + 1 + y_off, CHARCOAL, 2)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 15, sy, 3, FIRE)
        elif a == 'attack_0':
            # Subtle tactical targeting laser dot
            c.line(sx + 16, sy, sx + 20, sy, T_GLOW)

    c = draw_humanoid(
        w, h, anim,
        skin=CHARCOAL, torso=CHARCOAL, legs=DARK_STEEL, boots=CHARCOAL,
        belt=INK_SOFT, buckle=STEEL[3],
        has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=14,
    )
    return c, 14, h - 2


def gen_at_rocket(anim: str) -> tuple[PixelCanvas, int, int]:
    """Modern Anti-Tank Rocket Trooper with shoulder-mounted RPG/ATGM launcher (38x38px)."""
    w, h = 38, 38

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        _draw_face(c, cx, cy)
        c.shaded_ellipse(cx, cy - 3, 5, 3, OLIVE)
        c.rect(cx + 1, cy - 1, 3, 2, T_GLOW)  # tactical visor
        c.rect(cx - 4, cy - 4, 7, 2, T_MID)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx - 4, sy + 1, 18, 3, OLIVE)
            return
        recoil = -2 if a == 'attack_1' else 0
        ly = sy - 4
        # Heavy shoulder-mounted rocket tube spanning behind shoulder to far right!
        c.box(sx - 9 + recoil, ly, 22, 4, OLIVE)
        c.rect(sx - 10 + recoil, ly - 1, 3, 6, DARK_STEEL[2])  # rear venturi bell
        c.rect(sx + 11 + recoil, ly - 1, 3, 6, DARK_STEEL[3])  # front launch lip
        c.rect(sx + 1 + recoil, ly + 1, 5, 2, T_MID)
        # Protruding warhead cone (visible when loaded)
        if a != 'attack_2':
            c.poly([(sx + 14 + recoil, ly), (sx + 19 + recoil, ly + 2), (sx + 14 + recoil, ly + 4)], FIRE[2])
            c.px(sx + 17 + recoil, ly + 2, FIRE[4])
        # Gripping arm
        c.shaded_line(sx - 1, sy, sx + 4 + recoil, ly + 4, OLIVE, 2)
        c.px(sx + 4 + recoil, ly + 4, SKIN[3])

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        ly = sy - 2
        if a == 'attack_1':
            # Huge forward ignition + dramatic rear backblast!
            draw_muzzle_flash(c, sx + 14, ly, 4, FIRE)
            c.shaded_ellipse(sx - 12, ly, 3, 3, FIRE)
            draw_smoke_puff(c, sx - 14, ly, 3)
        elif a == 'attack_2':
            draw_smoke_puff(c, sx - 12, ly - 1, 3)
            draw_smoke_puff(c, sx + 15, ly - 1, 2)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=OLIVE, legs=OLIVE, boots=CHARCOAL,
        belt=CHARCOAL[1], buckle=STEEL[3],
        has_team_shoulder=True,
        head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=16,
    )
    return c, 16, h - 2


def gen_mbt(anim: str) -> tuple[PixelCanvas, int, int]:
    """Modern Main Battle Tank (Abrams/K2 composite armor, ERA skirts, smoothbore cannon) (68x48px)."""
    w, h = 68, 48
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        c.box(8, gy - 11, 46, 9, CHARCOAL)
        c.box(16, gy - 19, 26, 8, DARK_STEEL)
        c.shaded_line(38, gy - 16, 56, gy - 8, CHARCOAL, 3)
        c.rect(20, gy - 16, 12, 3, T_DEEP)
        c.add_outline(INK)
        draw_smoke_puff(c, 30, gy - 24, 6)
        draw_muzzle_flash(c, 28, gy - 19, 3, FIRE)
        return c, 34, gy

    tread_shift = {'walk_0': 0, 'walk_1': 1, 'walk_2': 2, 'walk_3': 3}.get(anim, 0)
    bob = -1 if anim in ('walk_1', 'walk_3') else 0
    recoil = -4 if anim == 'attack_1' else (-1 if anim == 'attack_2' else 0)
    hx = 6 + (recoil // 2)
    hy = gy - 20 + bob

    # 1. Tracks & 6 Road Wheels
    c.poly([
        (hx + 3, gy - 9),
        (hx + 45, gy - 9),
        (hx + 48, gy - 5),
        (hx + 44, gy),
        (hx + 4, gy),
        (hx + 1, gy - 5),
    ], CHARCOAL[0])
    for idx in range(6):
        wx = hx + 6 + idx * 7
        c.shaded_ellipse(wx, gy - 4, 3, 3, IRON)
        c.px(wx + (1 if (tread_shift & 1) else 0), gy - 4, STEEL[3])
    for tx in range(hx + 4, hx + 44, 4):
        if ((tx + tread_shift) % 4) < 2:
            c.rect(tx, gy - 1, 2, 2, IRON[2])

    # 2. Modern Sloped Composite Hull + Reactive Armor (ERA) Side Skirts
    hull_pts = [
        (hx + 1, hy + 11),
        (hx + 3, hy + 4),
        (hx + 38, hy + 4),
        (hx + 48, hy + 8),
        (hx + 46, hy + 13),
    ]
    c.shaded_poly(hull_pts, DARK_STEEL)
    # ERA armored side skirt blocks
    for sx in range(hx + 5, hx + 42, 7):
        c.box(sx, hy + 9, 6, 5, STEEL)
    # Headlight & rear exhaust louver
    c.rect(hx + 45, hy + 8, 2, 2, HAZARD_YELLOW[3])
    c.rect(hx + 3, hy + 6, 5, 3, CHARCOAL[0])

    # 3. Sleek Angular Composite Turret (Abrams/K2 profile)
    tx = hx + 11
    ty = hy - 8
    tur_pts = [
        (tx, ty + 12),
        (tx + 2, ty + 2),
        (tx + 22, ty + 2),
        (tx + 31, ty + 6),
        (tx + 29, ty + 12),
    ]
    c.shaded_poly(tur_pts, STEEL)
    # Prominent Team IFF Side Panel + Thermal Sight + Whip Antenna
    c.box(tx + 5, ty + 4, 13, 6, TEAM_RAMP)
    c.rect(tx + 7, ty + 6, 9, 2, T_TRIM)
    c.box(tx + 18, ty - 2, 6, 4, DARK_STEEL)  # commander thermal optics
    c.rect(tx + 21, ty - 1, 2, 2, T_GLOW)
    c.line(tx + 3, ty + 2, tx, ty - 9, STEEL[3])  # radio whip antenna

    # 4. Long High-Velocity Smoothbore Cannon with Bore Evacuator
    bx = tx + 29 + recoil
    by = ty + 6
    c.box(bx, by - 1, 24, 3, DARK_STEEL)
    c.rect(bx, by - 1, 24, 1, STEEL[4])
    c.box(bx + 8, by - 2, 6, 5, STEEL)  # bore evacuator bulge
    c.rect(bx + 22, by - 2, 3, 5, CHARCOAL[2])  # muzzle reference sensor

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_muzzle_flash(c, bx + 24, by, 7, FIRE)
    elif anim == 'attack_2':
        draw_smoke_puff(c, bx + 25, by - 2, 4)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, tx + 24, ty + 6)

    return c, 34, gy


# =============================================================================
# ERA 7: FUTURE ERA (cyborg, railgun_sniper, colossus_mech)
# =============================================================================

def gen_cyborg(anim: str) -> tuple[PixelCanvas, int, int]:
    """Futuristic Cyber-Exoskeleton Warrior with glowing plasma energy blade (40x40px)."""
    w, h = 40, 40

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Compact twin thruster wings
        c.box(bx - 4, by, 4, 7, TITANIUM)
        c.px(bx - 4, by + 6, T_GLOW)
        if a in ('walk_1', 'walk_3', 'attack_1'):
            c.line(bx - 5, by + 7, bx - 7, by + 9, T_GLOW)

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Sleek angular sci-fi cyber helmet + blazing team visor
        c.box(cx - 4, cy - 4, 8, 8, TITANIUM)
        c.rect(cx - 3, cy - 4, 6, 2, STEEL[4])
        c.rect(cx, cy - 2, 5, 3, T_GLOW)
        c.rect(cx + 1, cy - 1, 3, 1, WHITE)
        # Swept cyber ear-fin
        c.line(cx - 3, cy - 3, cx - 6, cy - 6, T_LIGHT, 2)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Glowing chest fusion core!
        c.box(tx + 2, ty + 2, 5, 4, DARK_STEEL)
        c.rect(tx + 3, ty + 3, 3, 2, T_GLOW)
        c.px(tx + 4, ty + 3, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx, sy + 1, 5, 3, TITANIUM)
            c.line(sx + 5, sy + 2, sx + 14, sy + 2, T_GLOW, 2)
            return
        if a == 'attack_0':
            c.shaded_line(sx, sy, sx - 2, sy - 6, TITANIUM, 2)
            c.line(sx - 2, sy - 6, sx - 6, sy - 15, T_GLOW, 3)
            c.line(sx - 2, sy - 6, sx - 6, sy - 15, WHITE, 1)
        elif a == 'attack_1':
            c.shaded_line(sx, sy, sx + 6, sy - 1, TITANIUM, 2)
            c.line(sx + 6, sy - 1, sx + 19, sy + 2, T_GLOW, 3)
            c.line(sx + 7, sy - 1, sx + 18, sy + 2, WHITE, 1)
        elif a == 'attack_2':
            c.shaded_line(sx, sy, sx + 5, sy + 3, TITANIUM, 2)
            c.line(sx + 5, sy + 3, sx + 15, sy + 8, T_GLOW, 2)
            c.line(sx + 6, sy + 3, sx + 14, sy + 8, WHITE, 1)
        else:
            sway = -1 if a in ('walk_1', 'walk_2') else 0
            c.shaded_line(sx, sy, sx + 5, sy + 1 + sway, TITANIUM, 2)
            c.line(sx + 5, sy + 1 + sway, sx + 15, sy - 7 + sway, T_GLOW, 3)
            c.line(sx + 6, sy + sway, sx + 14, sy - 6 + sway, WHITE, 1)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 10, sy, 11, T_GLOW, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=TITANIUM, torso=TITANIUM, legs=DARK_STEEL, boots=TITANIUM,
        belt=T_MID, buckle=T_GLOW,
        has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_railgun_sniper(anim: str) -> tuple[PixelCanvas, int, int]:
    """Futuristic Stealth Railgun Sniper with split electromagnetic rails & cloak (40x40px)."""
    w, h = 40, 40

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Hooded stealth visor helmet + glowing sniper monocle lens
        c.shaded_ellipse(cx, cy, 4, 4, TITANIUM)
        c.poly([(cx - 5, cy - 3), (cx, cy - 6), (cx + 4, cy - 3), (cx - 4, cy + 2)], DARK_STEEL[1])
        c.rect(cx + 1, cy - 1, 4, 2, T_GLOW)
        c.px(cx + 3, cy - 1, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx - 2, sy + 1, 18, 3, TITANIUM)
            c.line(sx + 6, sy + 2, sx + 16, sy + 2, T_GLOW)
            return
        recoil = -2 if a == 'attack_1' else 0
        y_off = -1 if a in ('attack_0', 'attack_1') else 1
        # Oversized split-rail electromagnetic sniper cannon!
        c.box(sx - 3 + recoil, sy + y_off, 11, 4, TITANIUM)
        # Upper & lower parallel rail prongs with glowing energy channel between
        c.rect(sx + 8 + recoil, sy - 1 + y_off, 14, 2, STEEL[3])
        c.rect(sx + 8 + recoil, sy + 2 + y_off, 14, 2, STEEL[2])
        c.line(sx + 8 + recoil, sy + 1 + y_off, sx + 21 + recoil, sy + 1 + y_off, T_GLOW)
        if a in ('attack_0', 'attack_1'):
            c.line(sx + 9 + recoil, sy + 1 + y_off, sx + 21 + recoil, sy + 1 + y_off, WHITE)
        # High-zoom cyber optic scope
        c.box(sx + 2 + recoil, sy - 3 + y_off, 6, 3, DARK_STEEL)
        c.px(sx + 7 + recoil, sy - 2 + y_off, T_GLOW)
        c.shaded_line(sx - 1, sy, sx + 4 + recoil, sy + 2 + y_off, TITANIUM, 2)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 19, sy, 4, (T_DEEP, T_SHADE, T_MID, T_GLOW, WHITE))
        elif a == 'attack_0':
            # Charging energy ring at rail muzzle
            c.px(sx + 22, sy - 1, T_GLOW)
            c.px(sx + 22, sy + 1, T_GLOW)
            c.px(sx + 23, sy, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=TITANIUM, torso=DARK_STEEL, legs=CHARCOAL, boots=TITANIUM,
        belt=T_MID, buckle=T_GLOW,
        cape_ramp=(T_DEEP, T_SHADE, T_MID, T_LIGHT), has_team_shoulder=True,
        head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=14,
    )
    return c, 14, h - 2


def gen_colossus_mech(anim: str) -> tuple[PixelCanvas, int, int]:
    """Towering 72x72px Sci-Fi Colossus Assault Mech Titan (centerpiece unit!)."""
    w, h = 72, 72
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        # Fallen smoking mech chassis on ground
        c.box(10, gy - 20, 38, 16, TITANIUM)
        c.box(18, gy - 16, 16, 8, TEAM_RAMP)
        c.box(44, gy - 14, 18, 10, DARK_STEEL)
        c.box(14, gy - 26, 14, 8, DARK_STEEL)
        c.rect(24, gy - 14, 6, 4, T_DEEP)
        c.add_outline(INK)
        draw_smoke_puff(c, 28, gy - 30, 7)
        draw_smoke_puff(c, 42, gy - 24, 5)
        draw_muzzle_flash(c, 32, gy - 20, 4, FIRE)
        return c, 34, gy

    # Heavy hydraulic bipedal stride!
    if anim == 'walk_0':
        f_dx, b_dx, bob, f_lift, b_lift = 7, -6, 0, 0, 0
    elif anim == 'walk_1':
        f_dx, b_dx, bob, f_lift, b_lift = 2, -2, -2, 0, 3
    elif anim == 'walk_2':
        f_dx, b_dx, bob, f_lift, b_lift = -6, 7, 0, 0, 0
    elif anim == 'walk_3':
        f_dx, b_dx, bob, f_lift, b_lift = -2, 2, -2, 3, 0
    elif anim == 'attack_0':
        f_dx, b_dx, bob, f_lift, b_lift = 4, -7, 1, 0, 0
    elif anim == 'attack_1':
        f_dx, b_dx, bob, f_lift, b_lift = 5, -7, 2, 0, 0
    elif anim == 'attack_2':
        f_dx, b_dx, bob, f_lift, b_lift = 4, -6, 1, 0, 0
    else:
        f_dx, b_dx, bob, f_lift, b_lift = 1, -5, -1, 0, 0

    recoil = -3 if anim == 'attack_1' else (-1 if anim == 'attack_2' else 0)
    cx = 31 + (recoil // 2)
    pelvis_y = gy - 23 + bob
    torso_y = pelvis_y - 22

    # 1. Rear Heavy Hydraulic Leg (darker titanium)
    b_hip_x = cx - 4
    b_knee_x = b_hip_x + b_dx // 2 + 4
    b_knee_y = gy - 12 - b_lift // 2
    b_foot_x = b_hip_x + b_dx
    b_foot_y = gy - b_lift
    c.line(b_hip_x, pelvis_y + 2, b_knee_x, b_knee_y, DARK_STEEL[1], 8)
    c.line(b_knee_x, b_knee_y, b_foot_x, b_foot_y - 3, DARK_STEEL[2], 8)
    c.box(b_foot_x - 6, b_foot_y - 4, 15, 5, DARK_STEEL)

    # 2. Rear Arm (Armored Energy Shield / Heavy Siege Claw on left/far side)
    c.box(cx + 10, torso_y + 7, 9, 13, DARK_STEEL)
    c.box(cx + 13, torso_y + 15, 8, 9, TITANIUM)
    c.rect(cx + 15, torso_y + 17, 4, 5, T_MID)

    # 3. Pelvis & Armored Waist Piston Joint
    c.box(cx - 11, pelvis_y - 3, 22, 8, DARK_STEEL)
    c.rect(cx - 6, pelvis_y - 1, 12, 4, TITANIUM[2])
    c.rect(cx - 9, pelvis_y + 3, 18, 2, HAZARD_YELLOW[2])

    # 4. Massive Broad-Shouldered Titan Torso!
    c.box(cx - 15, torso_y, 30, 21, TITANIUM)
    # Beveled chest armor plates
    c.box(cx - 13, torso_y + 2, 26, 15, STEEL)
    c.box(cx - 11, torso_y + 4, 22, 11, TITANIUM)
    # Team armor chest plating & hazard trim
    c.box(cx - 12, torso_y + 2, 9, 7, TEAM_RAMP)
    c.box(cx + 4, torso_y + 2, 9, 7, TEAM_RAMP)
    c.rect(cx - 10, torso_y + 16, 20, 2, HAZARD_YELLOW[3])
    for hx_pos in range(cx - 10, cx + 10, 4):
        c.rect(hx_pos, torso_y + 16, 2, 2, INK)

    # Glowing Panoramic Cockpit Visor & Central Plasma Reactor Core!
    c.box(cx - 6, torso_y + 4, 14, 6, CHARCOAL)
    c.rect(cx - 4, torso_y + 5, 11, 4, T_GLOW)
    c.rect(cx - 2, torso_y + 6, 7, 2, WHITE)
    # Reactor core below cockpit
    c.shaded_ellipse(cx + 1, torso_y + 12, 4, 3, (T_DEEP, T_SHADE, T_MID, T_GLOW, WHITE))

    # 5. Twin Shoulder-Mounted Tactical Missile Pods + Head Sensor Array
    # Rear shoulder pod
    c.box(cx + 5, torso_y - 10, 12, 10, DARK_STEEL)
    for my in (torso_y - 8, torso_y - 4):
        c.rect(cx + 14, my, 3, 3, FIRE[2])
        c.px(cx + 15, my + 1, FIRE[4])
    # Head sensor crest
    c.box(cx - 5, torso_y - 7, 10, 7, TITANIUM)
    c.rect(cx - 1, torso_y - 5, 6, 3, T_GLOW)
    c.px(cx + 1, torso_y - 4, WHITE)
    c.line(cx - 3, torso_y - 7, cx - 5, torso_y - 13, STEEL[3])  # comms antenna
    # Near shoulder pod (team striped!)
    c.box(cx - 16, torso_y - 11, 13, 11, TITANIUM)
    c.box(cx - 15, torso_y - 9, 8, 7, TEAM_RAMP)
    for my in (torso_y - 9, torso_y - 5):
        c.rect(cx - 5, my, 3, 3, FIRE[2])
        c.px(cx - 4, my + 1, FIRE[4])

    # 6. Front Heavy Articulated Hydraulic Leg
    f_hip_x = cx - 2
    f_knee_x = f_hip_x + f_dx // 2 + 5
    f_knee_y = gy - 12 - f_lift // 2
    f_foot_x = f_hip_x + f_dx
    f_foot_y = gy - f_lift
    # Thick upper thigh armor
    c.line(f_hip_x, pelvis_y + 2, f_knee_x, f_knee_y, TITANIUM[1], 9)
    c.line(f_hip_x, pelvis_y + 1, f_knee_x, f_knee_y - 1, TITANIUM[3], 5)
    # Armored kneecap with team badge
    c.box(f_knee_x - 4, f_knee_y - 4, 9, 8, STEEL)
    c.rect(f_knee_x - 2, f_knee_y - 2, 5, 4, T_MID)
    c.rect(f_knee_x - 1, f_knee_y - 1, 3, 1, T_LIGHT)
    # Lower hydraulic shin + piston rod
    c.line(f_knee_x - 3, f_knee_y + 2, f_foot_x - 3, f_foot_y - 3, STEEL[4], 2)
    c.line(f_knee_x + 1, f_knee_y + 2, f_foot_x + 1, f_foot_y - 3, TITANIUM[2], 8)
    c.line(f_knee_x + 2, f_knee_y + 2, f_foot_x + 2, f_foot_y - 3, TITANIUM[3], 3)
    # Massive stomping mech foot!
    c.box(f_foot_x - 7, f_foot_y - 5, 17, 6, TITANIUM)
    c.rect(f_foot_x - 5, f_foot_y - 4, 13, 2, STEEL[3])
    c.rect(f_foot_x + 7, f_foot_y - 3, 3, 3, DARK_STEEL[1])

    # 7. Colossal Right-Arm Twin Plasma Autocannon!
    arm_x = cx - 12
    arm_y = torso_y + 6
    # Heavy shoulder pauldron
    c.box(arm_x - 5, arm_y - 4, 12, 11, TITANIUM)
    c.box(arm_x - 4, arm_y - 2, 10, 7, TEAM_RAMP)
    c.rect(arm_x - 2, arm_y, 6, 2, T_TRIM)
    # Forearm gun housing + twin plasma barrels extending right
    gun_x = arm_x + 3 + recoil
    gun_y = arm_y + 7
    c.box(gun_x, gun_y - 3, 18, 9, DARK_STEEL)
    c.box(gun_x + 2, gun_y - 2, 12, 7, TITANIUM)
    c.rect(gun_x + 4, gun_y, 8, 3, T_GLOW)
    # Upper & lower plasma barrels
    c.box(gun_x + 17, gun_y - 3, 19, 3, STEEL)
    c.box(gun_x + 17, gun_y + 2, 19, 3, STEEL)
    c.line(gun_x + 17, gun_y + 1, gun_x + 35, gun_y + 1, T_GLOW)
    if anim in ('attack_0', 'attack_1'):
        c.line(gun_x + 18, gun_y + 1, gun_x + 35, gun_y + 1, WHITE)

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_muzzle_flash(c, gun_x + 35, gun_y + 1, 7, (T_DEEP, T_SHADE, T_MID, T_GLOW, WHITE))
    elif anim == 'attack_2':
        draw_smoke_puff(c, gun_x + 36, gun_y - 2, 4)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, cx + 10, torso_y + 10)

    return c, 34, gy


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
