"""Seamless 64x64px pixel-art ground tiles and era-specific midground/foreground pixel props for all 7 eras."""

from __future__ import annotations

from .canvas import PixelCanvas
from .palettes import (
    BONE,
    BRICK,
    CHARCOAL,
    CLIFF,
    CONCRETE,
    CYAN_GLOW,
    DARK_STEEL,
    DIRT,
    GOLD,
    GRASS,
    HAZARD_YELLOW,
    INK,
    INK_SOFT,
    IRON,
    KHAKI,
    OLIVE,
    SANDSTONE,
    SMOKE,
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
    """Create a seamless horizontally-tiling 64x64px pixel ground stratum for an era."""
    c = PixelCanvas(TILE_SIZE, TILE_SIZE)

    if era_index == 0:
        # ERA 1: Prehistoric mossy grass top + packed dirt + river pebbles + buried fossil bone
        c.rect(0, 0, 64, 5, GRASS[2])
        c.rect(0, 0, 64, 2, GRASS[3])
        c.rect(0, 5, 64, 14, DIRT[2])
        c.rect_dither(0, 15, 64, 10, DIRT[2], DIRT[1], 'check')
        c.rect(0, 25, 64, 18, DIRT[1])
        c.rect_dither(0, 41, 64, 10, DIRT[1], DIRT[0], 'check')
        c.rect(0, 51, 64, 13, DIRT[0])
        # Irregular hanging moss/grass fringes
        for x in range(0, 64, 4):
            drop = 2 + ((x * 7) % 4)
            c.rect(x, 3, 3, drop, GRASS[1])
            c.px(x + 1, 2, GRASS[4])
        # Packed dirt pebbles & rocks
        for rx, ry, rr in ((10, 12, 3), (34, 10, 2), (52, 14, 3), (22, 26, 3), (46, 32, 2)):
            c.shaded_ellipse(rx, ry, rr + 1, max(1, rr - 1), STONE)
        # Half-buried prehistoric bone in lower soil!
        c.rect(14, 35, 12, 3, BONE[2])
        c.rect(14, 35, 12, 1, BONE[3])
        c.ellipse(14, 36, 2, 2, BONE[3])
        c.ellipse(26, 36, 2, 2, BONE[2])
        # Soil grit pixel speckles
        for i in range(42):
            sx = (i * 19 + 5) % 64
            sy = 9 + ((i * 29) % 48)
            c.px(sx, sy, DIRT[3] if (i % 3 == 0) else DIRT[0])

    elif era_index == 1:
        # ERA 2: Travertine ancient sandstone flagstones + desert sand strata
        c.rect(0, 0, 64, 16, SANDSTONE[2])
        c.rect_dither(0, 16, 64, 12, SANDSTONE[1], SANDSTONE[0], 'check')
        c.rect(0, 28, 64, 36, SANDSTONE[0])
        # Beveled travertine road paving slabs (seamless 32px x 2)
        for bx in (0, 32):
            c.box(bx, 1, 31, 10, SANDSTONE, SANDSTONE[0])
            c.rect(bx + 2, 2, 26, 2, SANDSTONE[4])
        for bx in (16, 48):
            c.box(bx % 64, 11, 16, 8, SANDSTONE, SANDSTONE[0])
        c.box(0, 11, 15, 8, SANDSTONE, SANDSTONE[0])
        c.box(32, 11, 15, 8, SANDSTONE, SANDSTONE[0])
        # Lower carved ashlar blocks + sand speckles
        for x in range(4, 60, 18):
            c.box(x, 23, 14, 8, (SANDSTONE[0], SANDSTONE[0], SANDSTONE[1], SANDSTONE[2]))
        for i in range(36):
            c.px((i * 17) % 64, 33 + ((i * 23) % 28), SANDSTONE[1] if i % 2 == 0 else DIRT[0])

    elif era_index == 2:
        # ERA 3: Medieval interlocking cobblestone war-road + emerald turf lip + rich earth
        c.rect(0, 0, 64, 4, GRASS[2])
        c.rect(0, 0, 64, 2, GRASS[3])
        c.rect(0, 4, 64, 16, DIRT[1])
        c.rect_dither(0, 18, 64, 12, DIRT[1], DIRT[0], 'check')
        c.rect(0, 30, 64, 34, DIRT[0])
        # Interlocking pixel cobblestones (2 staggered rows)
        for cx in range(0, 64, 16):
            c.box(cx + 1, 4, 14, 7, STONE, INK_SOFT)
            c.rect(cx + 3, 5, 8, 1, STONE[4])
        for cx in range(0, 64, 16):
            rx = (cx + 8) % 64
            c.box(rx, 11, 14 if rx + 14 <= 64 else 64 - rx, 6, (STONE[0], STONE[1], STONE[1], STONE[2]), INK_SOFT)
        # Emerald turf tufts along upper edge
        for gx in range(2, 64, 10):
            c.px(gx, 0, GRASS[4])
            c.px(gx + 1, 1, GRASS[4])
            c.px(gx + 4, 3, GRASS[1])
        for i in range(32):
            c.px((i * 23) % 64, 22 + ((i * 19) % 38), DIRT[2] if i % 3 == 0 else INK_SOFT)

    elif era_index == 3:
        # ERA 4: Gunpowder rutted mud highway + reinforced oak artillery planks
        c.rect(0, 0, 64, 5, OLIVE[2])
        c.rect(0, 0, 64, 2, OLIVE[3])
        c.rect(0, 5, 64, 20, DIRT[2])
        c.rect_dither(0, 22, 64, 12, DIRT[2], DIRT[1], 'check')
        c.rect(0, 34, 64, 30, DIRT[0])
        # Wheel rut streaks
        c.rect(0, 7, 64, 3, DIRT[1])
        c.rect(0, 14, 64, 2, DIRT[1])
        # Embedded timber road planks for heavy cannons
        for px in (4, 20, 36, 52):
            c.box(px, 8, 12, 8, WOOD, WOOD_DARK[0])
            c.px(px + 2, 10, IRON[3])
            c.px(px + 9, 10, IRON[3])
        for i in range(36):
            c.px((i * 13 + 3) % 64, 20 + ((i * 29) % 40), DIRT[1] if i % 2 == 0 else DIRT[0])

    elif era_index == 4:
        # ERA 5: World War muddy no-man's-land trench duckboards + shell craters + puddle
        c.rect(0, 0, 64, 4, KHAKI[1])
        c.rect(0, 4, 64, 22, DIRT[1])
        c.rect_dither(0, 24, 64, 14, DIRT[1], DIRT[0], 'check')
        c.rect(0, 38, 64, 26, CHARCOAL[0])
        # Trench timber duckboard slats
        for px in range(2, 64, 10):
            c.box(px, 3, 8, 8, WOOD_DARK, INK_SOFT)
            c.rect(px + 1, 4, 6, 1, WOOD[2])
        # Muddy trench puddle reflecting grey sky
        c.ellipse(32, 18, 12, 3, STEEL[1])
        c.rect(25, 17, 12, 1, STEEL[3])
        for i in range(44):
            c.px((i * 19) % 64, 14 + ((i * 17) % 44), DIRT[0] if i % 2 == 0 else CONCRETE[1])

    elif era_index == 5:
        # ERA 6: Weathered pixel asphalt combat highway + dashed yellow center line + concrete curb
        c.rect(0, 0, 64, 3, CONCRETE[3])
        c.rect(0, 3, 64, 1, CONCRETE[1])
        c.rect(0, 4, 64, 20, CHARCOAL[1])
        # Asphalt grain pixel noise
        for i in range(60):
            ax = (i * 17 + 3) % 64
            ay = 5 + ((i * 13) % 18)
            c.px(ax, ay, CHARCOAL[2] if i % 2 == 0 else CHARCOAL[0])
        # Yellow dashed road stripe
        c.rect(10, 12, 26, 3, HAZARD_YELLOW[3])
        c.rect(10, 14, 26, 1, HAZARD_YELLOW[2])
        # Lower concrete foundation & subway/utility wall
        c.rect(0, 24, 64, 3, CONCRETE[2])
        c.rect(0, 27, 64, 18, DARK_STEEL[1])
        c.rect_dither(0, 43, 64, 10, DARK_STEEL[1], CHARCOAL[0], 'check')
        c.rect(0, 53, 64, 11, CHARCOAL[0])
        for sx in (0, 32):
            c.rect(sx, 27, 1, 20, CHARCOAL[0])

    else:
        # ERA 7: Futuristic beveled titanium deck plates + glowing cyan pixel circuit conduits!
        c.rect(0, 0, 64, 2, CYAN_GLOW[2])
        c.rect(0, 0, 64, 1, CYAN_GLOW[3])
        c.rect(0, 2, 64, 22, TITANIUM[1])
        c.rect(0, 24, 64, 40, TITANIUM[0])
        # Twin beveled armored titanium deck panels (32px each)
        for bx in (0, 32):
            c.box(bx, 2, 31, 18, TITANIUM, INK)
            # Corner bolts
            c.px(bx + 3, 5, STEEL[4])
            c.px(bx + 27, 5, STEEL[4])
            c.px(bx + 3, 16, STEEL[3])
            c.px(bx + 27, 16, STEEL[3])
            # Glowing recessed cyan power bus conduit!
            c.rect(bx + 5, 10, 21, 3, CYAN_GLOW[0])
            c.rect(bx + 6, 11, 19, 1, CYAN_GLOW[3])
            c.px(bx + 15, 11, WHITE)
        # Sub-deck armored girder lattice
        for gx in range(0, 64, 16):
            c.box(gx + 1, 23, 14, 14, (TITANIUM[0], TITANIUM[0], TITANIUM[1], TITANIUM[2]), INK)
            c.rect(gx + 5, 28, 6, 2, CYAN_GLOW[1])
        c.rect_dither(0, 40, 64, 12, TITANIUM[0], INK, 'check')
        c.rect(0, 52, 64, 12, INK)

    return c


def _gen_era_props() -> dict[str, tuple[PixelCanvas, int, int]]:
    """Generate crisp pixel-art midground & foreground props for all 7 eras."""
    out: dict[str, tuple[PixelCanvas, int, int]] = {}

    # Era 0 Mid: Prehistoric Palm Tree + Mossy Boulder (32x42)
    c = PixelCanvas(32, 42)
    c.shaded_line(15, 40, 14, 14, WOOD_DARK, 4)
    for lx, ly in ((4, 15), (7, 10), (15, 7), (23, 10), (27, 15)):
        c.line(15, 13, lx, ly, GRASS[1], 3)
        c.line(15, 12, lx, ly - 1, GRASS[2], 2)
        c.px(lx, ly - 1, GRASS[3])
    c.shaded_ellipse(24, 38, 6, 4, CLIFF)
    c.add_outline(INK)
    out['prop/mid_0'] = (c, 16, 40)

    # Era 0 Fore: Prehistoric Fern Cluster (28x18)
    c = PixelCanvas(28, 18)
    c.shaded_ellipse(14, 15, 10, 4, CLIFF)
    for fx, fy in ((4, 6), (9, 3), (14, 2), (19, 4), (24, 7)):
        c.line(14, 14, fx, fy, GRASS[1], 2)
        c.px(fx, fy, GRASS[3])
    c.add_outline(INK)
    out['prop/fore_0'] = (c, 14, 16)

    # Era 1 Mid: Classical Fluted Marble Column + Cypress (32x42)
    c = PixelCanvas(32, 42)
    c.box(11, 12, 10, 28, SANDSTONE)
    c.box(8, 9, 16, 4, SANDSTONE)
    c.box(9, 37, 14, 4, SANDSTONE)
    c.rect(14, 14, 1, 22, SANDSTONE[0])
    c.rect(18, 14, 1, 22, SANDSTONE[0])
    c.add_outline(INK)
    out['prop/mid_1'] = (c, 16, 40)

    # Era 1 Fore: Broken Sandstone Ruin Block (26x16)
    c = PixelCanvas(26, 16)
    c.shaded_poly([(2, 14), (6, 4), (19, 3), (24, 14)], SANDSTONE)
    c.rect(8, 5, 9, 2, SANDSTONE[4])
    c.add_outline(INK)
    out['prop/fore_1'] = (c, 13, 14)

    # Era 2 Mid: Medieval Pine Tree + Pennant Banner (36x44)
    c = PixelCanvas(36, 44)
    c.box(10, 32, 4, 10, WOOD_DARK)
    c.shaded_poly([(12, 6), (3, 22), (21, 22)], GRASS)
    c.shaded_poly([(12, 15), (1, 34), (23, 34)], GRASS)
    # Medieval wooden flagpole + crimson banner
    c.rect(26, 14, 2, 28, WOOD[2])
    c.poly([(28, 15), (35, 18), (28, 22)], hx('#dc2626'))
    c.line(28, 16, 33, 18, hx('#f87171'))
    c.add_outline(INK)
    out['prop/mid_2'] = (c, 18, 42)

    # Era 2 Fore: Emerald Grass Tuft & Fallen Arrow (26x16)
    c = PixelCanvas(26, 16)
    for gx, gh in ((5, 9), (9, 12), (13, 10), (17, 13), (21, 8)):
        c.line(gx, 14, gx + (1 if gx > 13 else -1), 14 - gh, GRASS[1], 2)
        c.px(gx, 14 - gh, GRASS[3])
    c.add_outline(INK)
    out['prop/fore_2'] = (c, 13, 14)

    # Era 3 Mid: Colonial Brick Parapet & Tree (36x38)
    c = PixelCanvas(36, 38)
    c.box(2, 26, 20, 10, BRICK)
    c.box(2, 24, 20, 3, STONE)
    c.box(25, 22, 4, 14, WOOD_DARK)
    c.shaded_ellipse(27, 16, 8, 8, OLIVE)
    c.add_outline(INK)
    out['prop/mid_3'] = (c, 18, 36)

    # Era 3 Fore: Muddy Shrub & Cobbles (26x16)
    c = PixelCanvas(26, 16)
    c.shaded_ellipse(10, 11, 7, 5, OLIVE)
    c.shaded_ellipse(18, 12, 6, 4, STONE)
    c.add_outline(INK)
    out['prop/fore_3'] = (c, 13, 14)

    # Era 4 Mid: WW Anti-Tank Hedgehog & Barbed Wire (34x26)
    c = PixelCanvas(34, 26)
    c.line(6, 24, 24, 6, IRON[2], 3)
    c.line(24, 24, 6, 6, IRON[3], 3)
    c.line(15, 24, 15, 4, IRON[1], 2)
    c.box(20, 19, 12, 5, KHAKI)
    c.add_outline(INK)
    out['prop/mid_4'] = (c, 17, 24)

    # Era 4 Fore: Stacked Sandbags & Wire Coil (30x16)
    c = PixelCanvas(30, 16)
    c.shaded_ellipse(9, 12, 7, 3, KHAKI)
    c.shaded_ellipse(21, 12, 7, 3, KHAKI)
    c.shaded_ellipse(15, 9, 7, 3, KHAKI)
    c.add_outline(INK)
    out['prop/fore_4'] = (c, 15, 14)

    # Era 5 Mid: Modern Highway Lamp Post & Comms Box (26x44)
    c = PixelCanvas(26, 44)
    c.box(10, 6, 3, 36, DARK_STEEL)
    c.box(10, 5, 12, 3, STEEL)
    c.rect(17, 8, 4, 2, HAZARD_YELLOW[4])
    c.box(4, 32, 7, 10, CONCRETE)
    c.add_outline(INK)
    out['prop/mid_5'] = (c, 13, 42)

    # Era 5 Fore: Concrete Jersey Road Barrier (30x16)
    c = PixelCanvas(30, 16)
    c.shaded_poly([(2, 14), (7, 4), (23, 4), (28, 14)], CONCRETE)
    c.rect(9, 6, 12, 2, HAZARD_YELLOW[3])
    c.add_outline(INK)
    out['prop/fore_5'] = (c, 15, 14)

    # Era 6 Mid: Sci-Fi Energy Pylon with Glowing Cyan Core (24x46)
    c = PixelCanvas(24, 46)
    c.shaded_poly([(4, 44), (9, 6), (15, 6), (20, 44)], TITANIUM)
    c.rect(11, 10, 2, 30, CYAN_GLOW[3])
    c.px(11, 12, WHITE)
    c.ellipse(12, 5, 6, 2, CYAN_GLOW[2])
    c.add_outline(INK)
    out['prop/mid_6'] = (c, 12, 44)

    # Era 6 Fore: Futuristic Low Deck Barrier Pylon (26x16)
    c = PixelCanvas(26, 16)
    c.shaded_poly([(2, 14), (6, 4), (20, 4), (24, 14)], TITANIUM)
    c.rect(8, 7, 10, 2, CYAN_GLOW[3])
    c.rect(10, 7, 6, 1, WHITE)
    c.add_outline(INK)
    out['prop/fore_6'] = (c, 13, 14)

    return out


def gen_environment_sprites() -> dict[str, tuple[PixelCanvas, int, int]]:
    out: dict[str, tuple[PixelCanvas, int, int]] = {}
    for era_idx in range(7):
        tile = _gen_ground_tile_era(era_idx)
        out[f'tile/ground_era_{era_idx}'] = (tile, 0, 0)
    out.update(_gen_era_props())
    return out
