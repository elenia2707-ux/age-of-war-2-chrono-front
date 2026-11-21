"""Pixel-art generators for all 14 base turrets (2 per era x idle/fire) + armored balcony platform."""

from __future__ import annotations

from .canvas import PixelCanvas
from .humanoid import TEAM_RAMP, draw_muzzle_flash
from .palettes import (
    BONE,
    BRONZE,
    CHARCOAL,
    COPPER,
    COSMIC_VIOLET,
    DARK_STEEL,
    FIRE,
    GOLD,
    INK,
    IRON,
    LEATHER,
    OBSIDIAN,
    OFF_WHITE,
    OLIVE,
    SANDSTONE,
    SOLAR_GOLD,
    STEEL,
    STONE,
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

TURRET_W = 34
TURRET_H = 24
TURRET_PIVOT_X = 12
TURRET_PIVOT_Y = 12


def gen_turret_platform() -> tuple[PixelCanvas, int, int]:
    """Armored pixel balcony shelf mounted on fortress walls for turret slots (26x10px)."""
    c = PixelCanvas(26, 10)
    c.box(1, 1, 24, 7, DARK_STEEL)
    c.rect(3, 2, 20, 2, T_MID)
    c.rect(4, 2, 18, 1, T_LIGHT)
    # Support brackets underneath
    c.rect(3, 7, 3, 2, CHARCOAL[1])
    c.rect(20, 7, 3, 2, CHARCOAL[1])
    c.px(5, 5, STEEL[4])
    c.px(20, 5, STEEL[4])
    c.add_outline(INK)
    return c, 13, 3


def gen_turret(kind: str, firing: bool) -> tuple[PixelCanvas, int, int]:
    """Generate a 34x24px right-facing rotatable pixel turret centered on (12, 12)."""
    c = PixelCanvas(TURRET_W, TURRET_H)
    px, py = TURRET_PIVOT_X, TURRET_PIVOT_Y
    rec = -2 if firing else 0

    # Base swivel mount ring (drawn around pivot)
    c.box(px - 6, py + 1, 12, 5, IRON)
    c.rect(px - 4, py + 2, 8, 2, T_MID)

    if kind == 'rock_dropper':
        c.box(px - 6 + rec, py - 4, 14, 7, WOOD)
        c.rect(px - 4 + rec, py - 3, 5, 3, TEAM_RAMP[2])
        if not firing:
            c.shaded_ellipse(px + 9 + rec, py - 2, 4, 4, STONE)
        else:
            c.shaded_ellipse(px + 12, py - 3, 3, 3, STONE)

    elif kind == 'bone_catapult':
        c.box(px - 7 + rec, py - 3, 18, 5, BONE)
        c.rect(px - 3 + rec, py - 2, 5, 3, T_MID)
        c.shaded_ellipse(px + 11 + rec, py - 2, 4, 4, WOOD_DARK)
        if not firing:
            c.shaded_ellipse(px + 11 + rec, py - 3, 3, 3, STONE)

    elif kind == 'arrow_tower':
        c.box(px - 5 + rec, py - 4, 11, 8, BRONZE)
        c.rect(px - 3 + rec, py - 2, 5, 4, T_MID)
        # Mounted recurve bronze war bow
        c.line(px + 5 + rec, py - 8, px + 10 + rec, py, GOLD[3], 2)
        c.line(px + 10 + rec, py, px + 5 + rec, py + 8, GOLD[2], 2)
        if not firing:
            c.line(px + 5, py - 7, px + 1, py, OFF_WHITE)
            c.line(px + 1, py, px + 5, py + 7, OFF_WHITE)
            c.line(px + 1, py, px + 14, py, WOOD[3])
            c.px(px + 15, py, WHITE)
        else:
            c.line(px + 5 + rec, py - 7, px + 5 + rec, py + 7, OFF_WHITE)
            c.line(px + 9, py, px + 18, py, WOOD[3])
            c.px(px + 19, py, WHITE)

    elif kind == 'ballista':
        c.box(px - 7 + rec, py - 3, 19, 6, WOOD)
        c.rect(px - 5 + rec, py - 1, 7, 2, T_MID)
        # Swept steel torsion bow arms
        c.line(px + 6 + rec, py - 9, px + 12 + rec, py, STEEL[3], 2)
        c.line(px + 12 + rec, py, px + 6 + rec, py + 9, STEEL[2], 2)
        c.line(px + 6 + rec, py - 8, px + (5 if firing else 0) + rec, py, OFF_WHITE)
        c.line(px + (5 if firing else 0) + rec, py, px + 6 + rec, py + 8, OFF_WHITE)
        c.line(px + 2 + rec, py, px + 16 + rec, py, STEEL[4], 1)
        c.px(px + 17 + rec, py, WHITE)

    elif kind == 'crossbow_bastion':
        c.box(px - 6 + rec, py - 5, 13, 9, STONE)
        c.box(px - 4 + rec, py - 3, 8, 5, TEAM_RAMP)
        c.box(px + 5 + rec, py - 2, 11, 4, STEEL)
        c.line(px + 11 + rec, py - 7, px + 14 + rec, py, STEEL[3], 2)
        c.line(px + 14 + rec, py, px + 11 + rec, py + 7, STEEL[2], 2)
        if firing:
            c.line(px + 15, py, px + 21, py, WHITE)

    elif kind == 'keep_trebuchet':
        c.box(px - 8 + rec, py - 4, 19, 7, WOOD_DARK)
        c.box(px - 6 + rec, py - 2, 8, 4, TEAM_RAMP)
        c.rect(px + 4 + rec, py - 5, 4, 9, IRON[3])
        c.shaded_ellipse(px + 12 + rec, py - 2, 5, 5, STONE)

    elif kind == 'musket_battery':
        c.box(px - 6 + rec, py - 5, 11, 10, WOOD)
        c.box(px - 4 + rec, py - 3, 6, 6, TEAM_RAMP)
        # Twin parallel long brass-banded barrels
        c.box(px + 4 + rec, py - 4, 14, 3, STEEL)
        c.box(px + 4 + rec, py + 1, 14, 3, STEEL)
        c.rect(px + 11 + rec, py - 4, 2, 8, GOLD[3])

    elif kind == 'fortress_cannon':
        # Heavy tapered siege bronze cannon
        pts = [
            (px - 7 + rec, py - 5),
            (px + 16 + rec, py - 3),
            (px + 16 + rec, py + 3),
            (px - 7 + rec, py + 5),
        ]
        c.shaded_poly(pts, BRONZE)
        c.rect(px - 2 + rec, py - 4, 3, 8, T_MID)
        c.rect(px + 6 + rec, py - 4, 2, 8, GOLD[3])
        c.rect(px + 14 + rec, py - 4, 3, 8, GOLD[3])

    elif kind == 'mg_nest':
        c.shaded_ellipse(px - 1, py - 1, 7, 6, OLIVE)
        c.rect(px - 4, py - 3, 6, 3, T_MID)
        # Perforated air-cooled MG barrel
        c.box(px + 5 + rec, py - 2, 14, 4, DARK_STEEL)
        for vx in (px + 7, px + 10, px + 13):
            c.px(vx + rec, py - 1, STEEL[4])

    elif kind == 'howitzer_turret':
        c.box(px - 7 + rec, py - 6, 13, 11, OLIVE)
        c.box(px - 5 + rec, py - 4, 7, 5, TEAM_RAMP)
        c.box(px + 5 + rec, py - 3, 15, 6, DARK_STEEL)
        c.rect(px + 5 + rec, py - 3, 15, 1, STEEL[4])
        c.box(px + 17 + rec, py - 4, 3, 8, IRON)

    elif kind == 'vulcan_ciws':
        # White/grey Phalanx radar dome + rotary 6-barrel gatling gun!
        c.shaded_ellipse(px - 2, py - 2, 6, 7, STEEL)
        c.rect(px - 5, py - 3, 6, 3, T_MID)
        c.box(px + 4 + rec, py - 4, 14, 2, DARK_STEEL)
        c.box(px + 4 + rec, py - 1, 14, 2, STEEL)
        c.box(px + 4 + rec, py + 2, 14, 2, DARK_STEEL)
        c.rect(px + 11 + rec, py - 4, 2, 8, IRON[3])
        c.rect(px + 15 + rec, py - 4, 2, 8, IRON[3])

    elif kind == 'missile_pod':
        # Armored 3-tube tactical missile box launcher
        c.box(px - 7 + rec, py - 7, 16, 13, DARK_STEEL)
        c.box(px - 5 + rec, py - 5, 8, 9, TEAM_RAMP)
        for my in (py - 5, py - 1, py + 3):
            c.rect(px + 7 + rec, my, 4, 3, FIRE[2])
            c.px(px + 9 + rec, my + 1, FIRE[4])

    elif kind == 'plasma_repeater':
        c.box(px - 7 + rec, py - 6, 14, 11, TITANIUM)
        c.box(px - 5 + rec, py - 4, 8, 7, TEAM_RAMP)
        c.box(px + 6 + rec, py - 3, 12, 6, DARK_STEEL)
        c.rect(px + 7 + rec, py - 1, 11, 2, T_GLOW)
        if firing:
            c.rect(px + 7 + rec, py - 1, 12, 2, WHITE)

    elif kind == 'obelisk_beam':
        # Carved Egyptian sandstone obelisk turret topped with blazing solar crystal!
        c.box(px - 6 + rec, py - 5, 12, 10, SANDSTONE)
        c.box(px - 4 + rec, py - 3, 6, 6, TEAM_RAMP)
        c.box(px + 5 + rec, py - 3, 12, 6, GOLD)
        c.shaded_ellipse(px + 16 + rec, py, 3, 3, SOLAR_GOLD)
        c.px(px + 16 + rec, py, WHITE)

    elif kind == 'scarab_catapult':
        c.box(px - 7 + rec, py - 4, 17, 7, GOLD)
        c.box(px - 5 + rec, py - 2, 7, 4, TEAM_RAMP)
        c.shaded_ellipse(px + 11 + rec, py - 1, 5, 5, SOLAR_GOLD)
        c.px(px + 11 + rec, py - 2, WHITE)

    elif kind == 'steam_repeater':
        # Steampunk rotary brass & copper clockwork gatling turret
        c.box(px - 7 + rec, py - 6, 13, 11, COPPER)
        c.box(px - 5 + rec, py - 4, 7, 6, TEAM_RAMP)
        c.box(px + 5 + rec, py - 4, 14, 2, GOLD)
        c.box(px + 5 + rec, py - 1, 14, 2, IRON)
        c.box(px + 5 + rec, py + 2, 14, 2, GOLD)
        c.rect(px + 13 + rec, py - 4, 2, 8, BRONZE[3])

    elif kind == 'boiler_mortar':
        # Heavy stubby copper boiler siege mortar with pressure dome
        c.shaded_ellipse(px - 1 + rec, py - 1, 7, 7, COPPER)
        c.rect(px - 4 + rec, py - 3, 6, 4, T_MID)
        c.box(px + 4 + rec, py - 5, 13, 10, BRONZE)
        c.rect(px + 14 + rec, py - 6, 3, 12, GOLD[3])

    elif kind == 'prism_spire':
        # Floating golden cosmic prism crystal emitter
        c.box(px - 7 + rec, py - 6, 13, 11, OBSIDIAN)
        c.box(px - 5 + rec, py - 4, 7, 7, TEAM_RAMP)
        c.shaded_poly([(px + 6 + rec, py - 6), (px + 19 + rec, py), (px + 6 + rec, py + 6)], GOLD)
        c.rect(px + 8 + rec, py - 2, 8, 4, COSMIC_VIOLET[3])
        c.px(px + 14 + rec, py, WHITE)

    elif kind == 'singularity_cannon':
        # Colossal cosmic void-ring accelerator cannon
        c.box(px - 8 + rec, py - 7, 15, 13, OBSIDIAN)
        c.box(px - 6 + rec, py - 5, 9, 9, GOLD)
        c.rect(px - 4 + rec, py - 3, 5, 5, TEAM_RAMP[2])
        c.box(px + 6 + rec, py - 5, 15, 3, GOLD)
        c.box(px + 6 + rec, py + 2, 15, 3, GOLD)
        c.shaded_ellipse(px + 13 + rec, py, 4, 3, COSMIC_VIOLET)
        c.rect(px + 9 + rec, py - 1, 11, 2, WHITE)

    else:  # ion_cannon
        c.box(px - 8 + rec, py - 7, 15, 13, TITANIUM)
        c.box(px - 6 + rec, py - 5, 9, 9, TEAM_RAMP)
        # Split heavy electromagnetic ion accelerator rails
        c.box(px + 6 + rec, py - 5, 15, 3, STEEL)
        c.box(px + 6 + rec, py + 2, 15, 3, STEEL)
        c.rect(px + 6 + rec, py - 2, 14, 4, T_GLOW)
        c.rect(px + 7 + rec, py - 1, 13, 2, WHITE)

    c.add_outline(INK)

    # Post-outline firing flashes!
    if firing:
        if kind == 'missile_pod':
            draw_muzzle_flash(c, px + 11, py, 4, FIRE)
        elif kind in ('musket_battery', 'fortress_cannon', 'mg_nest', 'howitzer_turret', 'vulcan_ciws', 'steam_repeater', 'boiler_mortar'):
            draw_muzzle_flash(c, px + 17, py, 4, FIRE)
        elif kind in ('obelisk_beam', 'scarab_catapult'):
            draw_muzzle_flash(c, px + 17, py, 4, SOLAR_GOLD)
        elif kind in ('prism_spire', 'singularity_cannon'):
            draw_muzzle_flash(c, px + 17, py, 5, COSMIC_VIOLET)
        elif kind in ('plasma_repeater', 'ion_cannon'):
            draw_muzzle_flash(c, px + 17, py, 4, (T_DEEP, T_SHADE, T_MID, T_GLOW, WHITE))

    return c, px, py


ALL_TURRET_KINDS = (
    'rock_dropper',
    'bone_catapult',
    'obelisk_beam',
    'scarab_catapult',
    'arrow_tower',
    'ballista',
    'crossbow_bastion',
    'keep_trebuchet',
    'musket_battery',
    'fortress_cannon',
    'steam_repeater',
    'boiler_mortar',
    'mg_nest',
    'howitzer_turret',
    'vulcan_ciws',
    'missile_pod',
    'plasma_repeater',
    'ion_cannon',
    'prism_spire',
    'singularity_cannon',
)
