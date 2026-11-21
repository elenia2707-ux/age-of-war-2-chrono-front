"""Seamless 64x64px pixel-art ground tiles, midground/foreground props for all 10 eras, and 4 pixel upgrade icons."""

from __future__ import annotations

from .canvas import PixelCanvas
from .palettes import (
    BONE,
    BRICK,
    BRONZE,
    CHARCOAL,
    CLIFF,
    CONCRETE,
    COPPER,
    COSMIC_VIOLET,
    CYAN_GLOW,
    DARK_STEEL,
    DIRT,
    FIRE,
    GOLD,
    GRASS,
    HAZARD_YELLOW,
    INK,
    INK_SOFT,
    IRON,
    KHAKI,
    OBSIDIAN,
    OLIVE,
    SANDSTONE,
    SMOKE,
    SOLAR_GOLD,
    STEEL,
    STONE,
    TITANIUM,
    WHITE,
    WOOD,
    WOOD_DARK,
    hx,
)

TILE_SIZE = 64


def _gen_ground_tile_era(era_index: int) -> PixelCanvas:
    """Create a seamless horizontally-tiling 64x64px pixel ground stratum for an era (0..9)."""
    c = PixelCanvas(TILE_SIZE, TILE_SIZE)

    if era_index == 0:
        # ERA 1 (Stone): Prehistoric mossy grass top + packed dirt + pebbles + buried fossil bone
        c.rect(0, 0, 64, 5, GRASS[2])
        c.rect(0, 0, 64, 2, GRASS[3])
        c.rect(0, 5, 64, 14, DIRT[2])
        c.rect_dither(0, 15, 64, 10, DIRT[2], DIRT[1], 'check')
        c.rect(0, 25, 64, 18, DIRT[1])
        c.rect_dither(0, 41, 64, 10, DIRT[1], DIRT[0], 'check')
        c.rect(0, 51, 64, 13, DIRT[0])
        for x in range(0, 64, 4):
            drop = 2 + ((x * 7) % 4)
            c.rect(x, 3, 3, drop, GRASS[1])
            c.px(x + 1, 2, GRASS[4])
        for rx, ry, rr in ((10, 12, 3), (34, 10, 2), (52, 14, 3), (22, 26, 3), (46, 32, 2)):
            c.shaded_ellipse(rx, ry, rr + 1, max(1, rr - 1), STONE)
        c.rect(14, 35, 12, 3, BONE[2])
        c.rect(14, 35, 12, 1, BONE[3])
        c.ellipse(14, 36, 2, 2, BONE[3])
        c.ellipse(26, 36, 2, 2, BONE[2])
        for i in range(42):
            c.px((i * 19 + 5) % 64, 9 + ((i * 29) % 48), DIRT[3] if (i % 3 == 0) else DIRT[0])

    elif era_index == 1:
        # ERA 2 (Ancient Egypt — NEW!): Golden Saharan dunes + carved temple slabs + golden scarab glyph
        c.rect(0, 0, 64, 6, SANDSTONE[3])
        c.rect(0, 0, 64, 2, SANDSTONE[4])
        c.rect(0, 6, 64, 16, SANDSTONE[2])
        c.rect_dither(0, 20, 64, 12, SANDSTONE[2], SANDSTONE[1], 'check')
        c.rect(0, 32, 64, 32, SANDSTONE[0])
        # Wind-rippled desert sand ridges
        for y in (4, 10):
            for x in range(0, 64, 16):
                c.rect(x + 2, y, 10, 1, SANDSTONE[4])
                c.rect(x + 4, y + 1, 8, 1, SANDSTONE[1])
        # Carved Egyptian golden temple paving stones
        for bx in (2, 34):
            c.box(bx, 13, 28, 10, SANDSTONE, SANDSTONE[0])
            c.rect(bx + 3, 15, 22, 2, SOLAR_GOLD[3])
            c.rect(bx + 11, 18, 6, 3, GOLD[2])
        for i in range(36):
            c.px((i * 19 + 7) % 64, 27 + ((i * 23) % 32), SOLAR_GOLD[2] if i % 6 == 0 else SANDSTONE[1])

    elif era_index == 2:
        # ERA 3 (Ancient Classical): Travertine flagstones with mortar seams
        c.rect(0, 0, 64, 16, SANDSTONE[2])
        c.rect_dither(0, 16, 64, 12, SANDSTONE[1], SANDSTONE[0], 'check')
        c.rect(0, 28, 64, 36, SANDSTONE[0])
        for bx in (0, 32):
            c.box(bx, 1, 31, 10, SANDSTONE, SANDSTONE[0])
            c.rect(bx + 2, 2, 26, 2, SANDSTONE[4])
        for bx in (16, 48):
            c.box(bx % 64, 11, 16, 8, SANDSTONE, SANDSTONE[0])
        c.box(0, 11, 15, 8, SANDSTONE, SANDSTONE[0])
        c.box(32, 11, 15, 8, SANDSTONE, SANDSTONE[0])
        for x in range(4, 60, 18):
            c.box(x, 23, 14, 8, (SANDSTONE[0], SANDSTONE[0], SANDSTONE[1], SANDSTONE[2]))
        for i in range(36):
            c.px((i * 17) % 64, 33 + ((i * 23) % 28), SANDSTONE[1] if i % 2 == 0 else DIRT[0])

    elif era_index == 3:
        # ERA 4 (Medieval): Interlocking cobblestones + emerald turf lip
        c.rect(0, 0, 64, 4, GRASS[2])
        c.rect(0, 0, 64, 2, GRASS[3])
        c.rect(0, 4, 64, 16, DIRT[1])
        c.rect_dither(0, 18, 64, 12, DIRT[1], DIRT[0], 'check')
        c.rect(0, 30, 64, 34, DIRT[0])
        for cx in range(0, 64, 16):
            c.box(cx + 1, 4, 14, 7, STONE, INK_SOFT)
            c.rect(cx + 3, 5, 8, 1, STONE[4])
        for cx in range(0, 64, 16):
            rx = (cx + 8) % 64
            c.box(rx, 11, 14 if rx + 14 <= 64 else 64 - rx, 6, (STONE[0], STONE[1], STONE[1], STONE[2]), INK_SOFT)
        for gx in range(2, 64, 10):
            c.px(gx, 0, GRASS[4])
            c.px(gx + 1, 1, GRASS[4])
            c.px(gx + 4, 3, GRASS[1])
        for i in range(32):
            c.px((i * 23) % 64, 22 + ((i * 19) % 38), DIRT[2] if i % 3 == 0 else INK_SOFT)

    elif era_index == 4:
        # ERA 5 (Gunpowder): Rutted mud highway + oak artillery planks
        c.rect(0, 0, 64, 5, OLIVE[2])
        c.rect(0, 0, 64, 2, OLIVE[3])
        c.rect(0, 5, 64, 20, DIRT[2])
        c.rect_dither(0, 22, 64, 12, DIRT[2], DIRT[1], 'check')
        c.rect(0, 34, 64, 30, DIRT[0])
        c.rect(0, 7, 64, 3, DIRT[1])
        c.rect(0, 14, 64, 2, DIRT[1])
        for px in (4, 20, 36, 52):
            c.box(px, 8, 12, 8, WOOD, WOOD_DARK[0])
            c.px(px + 2, 10, IRON[3])
            c.px(px + 9, 10, IRON[3])
        for i in range(36):
            c.px((i * 13 + 3) % 64, 20 + ((i * 29) % 40), DIRT[1] if i % 2 == 0 else DIRT[0])

    elif era_index == 5:
        # ERA 6 (Industrial Steampunk — NEW!): Riveted iron railway plates, dark cobbles & brass steam pipes!
        c.rect(0, 0, 64, 3, STEEL[3])
        c.rect(0, 3, 64, 1, IRON[0])
        c.rect(0, 4, 64, 16, CHARCOAL[1])
        # Heavy wooden sleepers & twin gleaming steel rails
        for sx in range(2, 64, 12):
            c.box(sx, 5, 8, 12, WOOD_DARK, INK_SOFT)
        c.rect(0, 6, 64, 2, STEEL[4])
        c.rect(0, 8, 64, 1, IRON[1])
        c.rect(0, 14, 64, 2, STEEL[3])
        # Underground copper steam conduit pipe & riveted industrial girders!
        c.rect(0, 20, 64, 20, IRON[0])
        c.box(0, 24, 64, 7, COPPER, INK)
        for jx in (14, 46):
            c.box(jx, 23, 5, 9, GOLD, INK)
        c.rect_dither(0, 36, 64, 14, IRON[0], CHARCOAL[0], 'check')
        c.rect(0, 50, 64, 14, INK_SOFT)

    elif era_index == 6:
        # ERA 7 (World War): Muddy trench duckboards + craters + puddles
        c.rect(0, 0, 64, 4, KHAKI[1])
        c.rect(0, 4, 64, 22, DIRT[1])
        c.rect_dither(0, 24, 64, 14, DIRT[1], DIRT[0], 'check')
        c.rect(0, 38, 64, 26, CHARCOAL[0])
        for px in range(2, 64, 10):
            c.box(px, 3, 8, 8, WOOD_DARK, INK_SOFT)
            c.rect(px + 1, 4, 6, 1, WOOD[2])
        c.ellipse(32, 18, 12, 3, STEEL[1])
        c.rect(25, 17, 12, 1, STEEL[3])
        for i in range(44):
            c.px((i * 19) % 64, 14 + ((i * 17) % 44), DIRT[0] if i % 2 == 0 else CONCRETE[1])

    elif era_index == 7:
        # ERA 8 (Modern): Weathered asphalt highway + yellow center dash + concrete curb
        c.rect(0, 0, 64, 3, CONCRETE[3])
        c.rect(0, 3, 64, 1, CONCRETE[1])
        c.rect(0, 4, 64, 20, CHARCOAL[1])
        for i in range(60):
            c.px((i * 17 + 3) % 64, 5 + ((i * 13) % 18), CHARCOAL[2] if i % 2 == 0 else CHARCOAL[0])
        c.rect(10, 12, 26, 3, HAZARD_YELLOW[3])
        c.rect(10, 14, 26, 1, HAZARD_YELLOW[2])
        c.rect(0, 24, 64, 3, CONCRETE[2])
        c.rect(0, 27, 64, 18, DARK_STEEL[1])
        c.rect_dither(0, 43, 64, 10, DARK_STEEL[1], CHARCOAL[0], 'check')
        c.rect(0, 53, 64, 11, CHARCOAL[0])
        for sx in (0, 32):
            c.rect(sx, 27, 1, 20, CHARCOAL[0])

    elif era_index == 8:
        # ERA 9 (Future): Beveled dark titanium deck plates + glowing cyan circuit conduits
        c.rect(0, 0, 64, 2, CYAN_GLOW[2])
        c.rect(0, 0, 64, 1, CYAN_GLOW[3])
        c.rect(0, 2, 64, 22, TITANIUM[1])
        c.rect(0, 24, 64, 40, TITANIUM[0])
        for bx in (0, 32):
            c.box(bx, 2, 31, 18, TITANIUM, INK)
            c.px(bx + 3, 5, STEEL[4])
            c.px(bx + 27, 5, STEEL[4])
            c.px(bx + 3, 16, STEEL[3])
            c.px(bx + 27, 16, STEEL[3])
            c.rect(bx + 5, 10, 21, 3, CYAN_GLOW[0])
            c.rect(bx + 6, 11, 19, 1, CYAN_GLOW[3])
            c.px(bx + 15, 11, WHITE)
        for gx in range(0, 64, 16):
            c.box(gx + 1, 23, 14, 14, (TITANIUM[0], TITANIUM[0], TITANIUM[1], TITANIUM[2]), INK)
            c.rect(gx + 5, 28, 6, 2, CYAN_GLOW[1])
        c.rect_dither(0, 40, 64, 12, TITANIUM[0], INK, 'check')
        c.rect(0, 52, 64, 12, INK)

    else:
        # ERA 10 (Interstellar Cosmic — NEW!): Obsidian star-bridge inlaid with gold & violet energy conduits!
        c.rect(0, 0, 64, 2, GOLD[3])
        c.rect(0, 0, 64, 1, WHITE)
        c.rect(0, 2, 64, 22, OBSIDIAN[1])
        c.rect(0, 24, 64, 40, OBSIDIAN[0])
        for bx in (0, 32):
            c.box(bx, 2, 31, 18, OBSIDIAN, INK)
            c.rect(bx + 2, 4, 27, 1, GOLD[3])
            c.rect(bx + 5, 10, 21, 3, COSMIC_VIOLET[1])
            c.rect(bx + 6, 11, 19, 1, COSMIC_VIOLET[3])
            c.px(bx + 15, 11, WHITE)
            c.px(bx + 3, 16, GOLD[3])
            c.px(bx + 27, 16, GOLD[3])
        for gx in range(0, 64, 16):
            c.box(gx + 1, 23, 14, 14, (OBSIDIAN[0], OBSIDIAN[0], OBSIDIAN[1], OBSIDIAN[2]), INK)
            c.rect(gx + 5, 28, 6, 2, COSMIC_VIOLET[2])
        c.rect_dither(0, 40, 64, 12, OBSIDIAN[0], INK, 'check')
        c.rect(0, 52, 64, 12, INK)

    return c


def _gen_era_props() -> dict[str, tuple[PixelCanvas, int, int]]:
    """Generate crisp pixel-art midground & foreground props for all 10 eras."""
    out: dict[str, tuple[PixelCanvas, int, int]] = {}

    # 0: Stone Age
    c = PixelCanvas(32, 42)
    c.shaded_line(15, 40, 14, 14, WOOD_DARK, 4)
    for lx, ly in ((4, 15), (7, 10), (15, 7), (23, 10), (27, 15)):
        c.line(15, 13, lx, ly, GRASS[1], 3)
        c.line(15, 12, lx, ly - 1, GRASS[2], 2)
        c.px(lx, ly - 1, GRASS[3])
    c.shaded_ellipse(24, 38, 6, 4, CLIFF)
    c.add_outline(INK)
    out['prop/mid_0'] = (c, 16, 40)

    c = PixelCanvas(28, 18)
    c.shaded_ellipse(14, 15, 10, 4, CLIFF)
    for fx, fy in ((4, 6), (9, 3), (14, 2), (19, 4), (24, 7)):
        c.line(14, 14, fx, fy, GRASS[1], 2)
        c.px(fx, fy, GRASS[3])
    c.add_outline(INK)
    out['prop/fore_0'] = (c, 14, 16)

    # 1: Ancient Egypt (NEW!) — Carved Golden Obelisk & Oasis Palm
    c = PixelCanvas(34, 46)
    c.box(7, 14, 8, 30, SANDSTONE)
    c.shaded_poly([(7, 14), (11, 6), (15, 14)], SOLAR_GOLD)
    c.rect(10, 18, 2, 16, GOLD[2])
    c.shaded_line(24, 44, 23, 20, WOOD, 3)
    for lx, ly in ((16, 20), (20, 15), (27, 15), (31, 20)):
        c.line(23, 19, lx, ly, GRASS[2], 2)
    c.add_outline(INK)
    out['prop/mid_1'] = (c, 17, 44)

    c = PixelCanvas(28, 18)
    c.shaded_ellipse(9, 12, 5, 5, SANDSTONE)
    c.rect(7, 6, 4, 2, GOLD[3])
    c.shaded_poly([(15, 15), (19, 7), (25, 15)], SANDSTONE)
    c.add_outline(INK)
    out['prop/fore_1'] = (c, 14, 16)

    # 2: Ancient Classical
    c = PixelCanvas(32, 42)
    c.box(11, 12, 10, 28, SANDSTONE)
    c.box(8, 9, 16, 4, SANDSTONE)
    c.box(9, 37, 14, 4, SANDSTONE)
    c.rect(14, 14, 1, 22, SANDSTONE[0])
    c.rect(18, 14, 1, 22, SANDSTONE[0])
    c.add_outline(INK)
    out['prop/mid_2'] = (c, 16, 40)

    c = PixelCanvas(26, 16)
    c.shaded_poly([(2, 14), (6, 4), (19, 3), (24, 14)], SANDSTONE)
    c.rect(8, 5, 9, 2, SANDSTONE[4])
    c.add_outline(INK)
    out['prop/fore_2'] = (c, 13, 14)

    # 3: Medieval
    c = PixelCanvas(36, 44)
    c.box(10, 32, 4, 10, WOOD_DARK)
    c.shaded_poly([(12, 6), (3, 22), (21, 22)], GRASS)
    c.shaded_poly([(12, 15), (1, 34), (23, 34)], GRASS)
    c.rect(26, 14, 2, 28, WOOD[2])
    c.poly([(28, 15), (35, 18), (28, 22)], hx('#dc2626'))
    c.line(28, 16, 33, 18, hx('#f87171'))
    c.add_outline(INK)
    out['prop/mid_3'] = (c, 18, 42)

    c = PixelCanvas(26, 16)
    for gx, gh in ((5, 9), (9, 12), (13, 10), (17, 13), (21, 8)):
        c.line(gx, 14, gx + (1 if gx > 13 else -1), 14 - gh, GRASS[1], 2)
        c.px(gx, 14 - gh, GRASS[3])
    c.add_outline(INK)
    out['prop/fore_3'] = (c, 13, 14)

    # 4: Gunpowder
    c = PixelCanvas(36, 38)
    c.box(2, 26, 20, 10, BRICK)
    c.box(2, 24, 20, 3, STONE)
    c.box(25, 22, 4, 14, WOOD_DARK)
    c.shaded_ellipse(27, 16, 8, 8, OLIVE)
    c.add_outline(INK)
    out['prop/mid_4'] = (c, 18, 36)

    c = PixelCanvas(26, 16)
    c.shaded_ellipse(10, 11, 7, 5, OLIVE)
    c.shaded_ellipse(18, 12, 6, 4, STONE)
    c.add_outline(INK)
    out['prop/fore_4'] = (c, 13, 14)

    # 5: Industrial Steampunk (NEW!) — Victorian Gas Lamp & Copper Steam Valve Stack
    c = PixelCanvas(32, 44)
    c.box(9, 12, 4, 30, DARK_STEEL)
    c.box(7, 7, 8, 6, GOLD)
    c.rect(9, 8, 4, 4, FIRE[3])
    c.px(10, 9, WHITE)
    c.box(19, 20, 7, 22, COPPER)
    c.wheel(22, 26, 4, GOLD, BRONZE[1], 0.2)
    c.shaded_ellipse(22, 17, 3, 2, SMOKE)
    c.add_outline(INK)
    out['prop/mid_5'] = (c, 16, 42)

    c = PixelCanvas(28, 16)
    c.wheel(10, 10, 5, BRONZE, GOLD[2], 0.3)
    c.box(15, 8, 10, 6, COPPER)
    c.add_outline(INK)
    out['prop/fore_5'] = (c, 14, 14)

    # 6: World War
    c = PixelCanvas(34, 26)
    c.line(6, 24, 24, 6, IRON[2], 3)
    c.line(24, 24, 6, 6, IRON[3], 3)
    c.line(15, 24, 15, 4, IRON[1], 2)
    c.box(20, 19, 12, 5, KHAKI)
    c.add_outline(INK)
    out['prop/mid_6'] = (c, 17, 24)

    c = PixelCanvas(30, 16)
    c.shaded_ellipse(9, 12, 7, 3, KHAKI)
    c.shaded_ellipse(21, 12, 7, 3, KHAKI)
    c.shaded_ellipse(15, 9, 7, 3, KHAKI)
    c.add_outline(INK)
    out['prop/fore_6'] = (c, 15, 14)

    # 7: Modern
    c = PixelCanvas(26, 44)
    c.box(10, 6, 3, 36, DARK_STEEL)
    c.box(10, 5, 12, 3, STEEL)
    c.rect(17, 8, 4, 2, HAZARD_YELLOW[4])
    c.box(4, 32, 7, 10, CONCRETE)
    c.add_outline(INK)
    out['prop/mid_7'] = (c, 13, 42)

    c = PixelCanvas(30, 16)
    c.shaded_poly([(2, 14), (7, 4), (23, 4), (28, 14)], CONCRETE)
    c.rect(9, 6, 12, 2, HAZARD_YELLOW[3])
    c.add_outline(INK)
    out['prop/fore_7'] = (c, 15, 14)

    # 8: Future
    c = PixelCanvas(24, 46)
    c.shaded_poly([(4, 44), (9, 6), (15, 6), (20, 44)], TITANIUM)
    c.rect(11, 10, 2, 30, CYAN_GLOW[3])
    c.px(11, 12, WHITE)
    c.ellipse(12, 5, 6, 2, CYAN_GLOW[2])
    c.add_outline(INK)
    out['prop/mid_8'] = (c, 12, 44)

    c = PixelCanvas(26, 16)
    c.shaded_poly([(2, 14), (6, 4), (20, 4), (24, 14)], TITANIUM)
    c.rect(8, 7, 10, 2, CYAN_GLOW[3])
    c.rect(10, 7, 6, 1, WHITE)
    c.add_outline(INK)
    out['prop/fore_8'] = (c, 13, 14)

    # 9: Interstellar Cosmic (NEW!) — Floating Gilded Obsidian Prism Monolith & Void Crystals
    c = PixelCanvas(28, 48)
    c.box(9, 38, 10, 8, OBSIDIAN)
    c.rect(10, 38, 8, 2, GOLD[3])
    # Levitating cosmic diamond spire floating above pedestal!
    c.shaded_poly([(14, 5), (7, 20), (14, 34), (21, 20)], OBSIDIAN)
    c.shaded_poly([(14, 10), (10, 20), (14, 29), (18, 20)], COSMIC_VIOLET)
    c.px(14, 18, WHITE)
    c.rect(6, 19, 16, 2, GOLD[3])
    c.add_outline(INK)
    out['prop/mid_9'] = (c, 14, 46)

    c = PixelCanvas(28, 18)
    c.shaded_poly([(4, 15), (9, 4), (14, 15)], COSMIC_VIOLET)
    c.shaded_poly([(12, 15), (18, 6), (24, 15)], GOLD)
    c.px(9, 7, WHITE)
    c.add_outline(INK)
    out['prop/fore_9'] = (c, 14, 16)

    return out


def _gen_upgrade_icons() -> dict[str, tuple[PixelCanvas, int, int]]:
    """Generate 4 crisp 24x24px pixel-art icons for the Gold Spec Upgrade HUD tab."""
    out: dict[str, tuple[PixelCanvas, int, int]] = {}

    # 1. Weapons Upgrade (Crossed Gleaming Pixel Swords)
    c = PixelCanvas(24, 24)
    c.shaded_line(5, 19, 19, 5, STEEL, 3)
    c.line(7, 17, 18, 6, WHITE, 1)
    c.shaded_line(19, 19, 5, 5, STEEL, 3)
    c.line(17, 17, 6, 6, WHITE, 1)
    # Golden hilts & crossguards
    c.line(5, 14, 10, 19, GOLD[3], 2)
    c.line(19, 14, 14, 19, GOLD[3], 2)
    c.rect(4, 18, 3, 3, GOLD[3])
    c.rect(17, 18, 3, 3, GOLD[3])
    c.add_outline(INK)
    out['icon/upg_weapons'] = (c, 12, 12)

    # 2. Armor Upgrade (Royal Kite Shield with Gold Cross)
    c = PixelCanvas(24, 24)
    pts = [(5, 4), (19, 4), (19, 13), (12, 21), (5, 13)]
    c.shaded_poly(pts, (hx('#102359'), hx('#1b429c'), hx('#2a6df4'), hx('#66b0ff')))
    c.rect(5, 4, 14, 2, STEEL[4])
    c.rect(11, 6, 2, 13, GOLD[3])
    c.rect(7, 10, 10, 2, GOLD[3])
    c.px(11, 10, WHITE)
    c.add_outline(INK)
    out['icon/upg_armor'] = (c, 12, 12)

    # 3. Economy & Training Speed (Shining Gold Coin + Lightning Bolt)
    c = PixelCanvas(24, 24)
    c.shaded_ellipse(10, 13, 7, 7, SOLAR_GOLD)
    c.rect(9, 10, 2, 6, GOLD[0])
    # Rapid training lightning bolt overlapping coin
    c.poly([(16, 3), (11, 12), (15, 12), (12, 21), (20, 10), (16, 10)], CYAN_GLOW[3])
    c.px(15, 6, WHITE)
    c.px(15, 11, WHITE)
    c.add_outline(INK)
    out['icon/upg_economy'] = (c, 12, 12)

    # 4. Fortress & Turret Upgrade (Crenelated Castle Tower + Green Repair Plus)
    c = PixelCanvas(24, 24)
    c.box(4, 9, 13, 12, STONE)
    c.box(3, 5, 4, 5, STONE)
    c.box(9, 5, 4, 5, STONE)
    c.box(14, 5, 4, 5, STONE)
    c.rect(9, 14, 4, 7, INK)
    # Bright green repair/boost cross badge on bottom-right!
    c.rect(14, 14, 8, 4, GRASS[3])
    c.rect(16, 12, 4, 8, GRASS[3])
    c.rect(17, 13, 2, 6, GRASS[4])
    c.rect(15, 15, 6, 2, GRASS[4])
    c.add_outline(INK)
    out['icon/upg_fortress'] = (c, 12, 12)

    return out


def gen_environment_sprites() -> dict[str, tuple[PixelCanvas, int, int]]:
    out: dict[str, tuple[PixelCanvas, int, int]] = {}
    for era_idx in range(10):
        tile = _gen_ground_tile_era(era_idx)
        out[f'tile/ground_era_{era_idx}'] = (tile, 0, 0)
    out.update(_gen_era_props())
    out.update(_gen_upgrade_icons())
    return out
