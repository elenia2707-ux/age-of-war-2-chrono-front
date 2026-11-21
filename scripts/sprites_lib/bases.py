"""Monumental 100x128px pixel-art fortresses for all 7 eras x 3 damage stages (intact, damaged_50, damaged_25)."""

from __future__ import annotations

from .canvas import PixelCanvas
from .humanoid import TEAM_RAMP
from .palettes import (
    BONE,
    BRICK,
    BRONZE,
    CHARCOAL,
    CLIFF,
    CONCRETE,
    COPPER,
    COSMIC_VIOLET,
    DARK_STEEL,
    FIRE,
    GOLD,
    GRASS,
    HAZARD_YELLOW,
    INK,
    INK_SOFT,
    IRON,
    KHAKI,
    LEATHER,
    OBSIDIAN,
    OFF_WHITE,
    OLIVE,
    SANDSTONE,
    SMOKE,
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

BASE_W = 100
BASE_H = 128
DAMAGE_STATES = ('intact', 'damaged_50', 'damaged_25')


def _apply_damage_overlay(c: PixelCanvas, state: str, seed: int) -> None:
    """Carve crisp pixel structural cracks, soot stains, and glowing fissures for 50% / 25% HP."""
    if state == 'intact':
        return
    severe = state == 'damaged_25'

    # Dark charred impact soot splotches (only onto already-opaque fortress pixels)
    soots = [(62, 74, 11), (36, 92, 9)]
    if severe:
        soots.extend([(28, 56, 12), (56, 48, 10), (74, 88, 9)])
    for sx, sy, sr in soots:
        for y in range(max(0, sy - sr), min(c.h, sy + sr + 1)):
            for x in range(max(0, sx - sr), min(c.w, sx + sr + 1)):
                if (x - sx) ** 2 + (y - sy) ** 2 <= sr * sr:
                    col = c.get(x, y)
                    if col[3] > 200 and col != INK:
                        # Checkerboard dither soot near edge
                        d2 = (x - sx) ** 2 + (y - sy) ** 2
                        if d2 < (sr * sr) * 0.45 or ((x + y) & 1):
                            c.px(x, y, (max(10, col[0] // 2), max(10, col[1] // 2), max(12, col[2] // 2), 255))

    # Jagged dark structural cracks
    cracks = [
        [(68, 58), (60, 69), (64, 79), (53, 91), (57, 104)],
        [(60, 69), (49, 73), (42, 83)],
    ]
    if severe:
        cracks.extend([
            [(26, 44), (34, 57), (29, 70), (39, 82), (35, 98)],
            [(34, 57), (46, 62)],
            [(72, 82), (80, 95), (76, 108)],
        ])

    for path in cracks:
        for i in range(len(path) - 1):
            x0, y0 = path[i]
            x1, y1 = path[i + 1]
            # Only draw cracks where wall exists
            steps = max(abs(x1 - x0), abs(y1 - y0), 1)
            for s in range(steps + 1):
                px = int(round(x0 + (x1 - x0) * s / steps))
                py = int(round(y0 + (y1 - y0) * s / steps))
                if c.get(px, py)[3] > 200:
                    c.px(px, py, INK)
                    if severe and c.get(px + 1, py)[3] > 200:
                        c.px(px + 1, py, FIRE[2] if (s % 2 == 0) else FIRE[3])
                    elif c.get(px + 1, py)[3] > 200:
                        c.px(px + 1, py, INK_SOFT)

    # Chip small pixel chunks out of upper parapet when severely damaged
    if severe:
        for cx, cy in ((22 + (seed % 5), 42), (48, 46), (72, 54)):
            for dy in range(4):
                for dx in range(5):
                    if dx + dy < 5 and c.get(cx + dx, cy + dy)[3] > 0:
                        c.px(cx + dx, cy + dy, INK_SOFT)


def _draw_masonry(c: PixelCanvas, x0: int, y0: int, w: int, h: int, ramp, mortar, block_w: int = 10, block_h: int = 6) -> None:
    """Fill a wall rectangle with classic shaded stone/brick masonry blocks."""
    c.box(x0, y0, w, h, ramp)
    row_idx = 0
    for y in range(y0 + block_h, y0 + h - 1, block_h):
        c.rect(x0 + 1, y, w - 2, 1, mortar)
        c.rect(x0 + 1, y + 1, w - 2, 1, ramp[3])
        offset = (block_w // 2) if (row_idx & 1) else 0
        for x in range(x0 + offset + block_w, x0 + w - 2, block_w):
            c.rect(x, y - block_h + 1, 1, block_h - 1, mortar)
            # Occasional darker/lighter weathered stone variation
            if ((x * 7 + y * 13) % 5) == 0:
                c.rect(x - block_w + 2, y - block_h + 2, block_w - 3, block_h - 3, ramp[1])
        row_idx += 1


def _draw_waving_banner(c: PixelCanvas, pole_x: int, top_y: int, length: int = 20, height: int = 9) -> None:
    """Crisp pixel flagpole & team-colored swallowtail war banner."""
    c.rect(pole_x, top_y, 2, height + 14, STEEL[3])
    c.px(pole_x, top_y, GOLD[4])
    c.px(pole_x + 1, top_y, GOLD[3])
    for dx in range(2, length + 2):
        wave = 1 if (dx // 4) % 2 == 1 else 0
        # Swallowtail notch at end
        notch = (dx > length - 4)
        for dy in range(height):
            if notch and 2 <= dy <= height - 3 and dx > length - 2:
                continue
            col = T_LIGHT if dy <= 1 else (T_MID if dy < height - 2 else T_SHADE)
            if dy == height // 2 and 3 <= dx <= length - 5:
                col = GOLD[3]
            c.px(pole_x + dx, top_y + 1 + dy + wave, col)


def _draw_era_0_base(c: PixelCanvas) -> None:
    """Era 1: Prehistoric Cavern Cliff, Giant Mammoth Tusk Arch, Tribal Totem & Cave Hearth."""
    gy = BASE_H - 2
    # Jagged prehistoric cliff silhouette
    cliff_pts = [
        (4, gy),
        (7, gy - 82),
        (24, gy - 96),
        (44, gy - 103),
        (68, gy - 88),
        (88, gy - 54),
        (95, gy),
    ]
    c.shaded_poly(cliff_pts, CLIFF, dither=True)

    # Shaded left rock overhang facet & sunlit upper ridge
    c.poly([(4, gy), (7, gy - 82), (28, gy - 58), (34, gy)], CLIFF[1])
    c.poly([(16, gy - 80), (44, gy - 101), (66, gy - 86), (52, gy - 62)], CLIFF[3])
    # Horizontal geological strata ledges
    for sy, sx0, sx1 in ((gy - 72, 12, 66), (gy - 52, 10, 74), (gy - 30, 8, 56)):
        c.line(sx0, sy, sx1, sy - 4, CLIFF[0], 2)
        c.line(sx0 + 2, sy + 2, sx1 - 2, sy - 2, CLIFF[3], 1)

    # Mossy prehistoric fern overhang along upper cliff lip
    for mx in range(18, 66, 6):
        my = gy - 94 + abs(mx - 42) // 3
        c.shaded_ellipse(mx, my, 5, 3, GRASS)

    # Deep dark cavern gateway on right side (x=54..88)
    c.ellipse(70, gy, 19, 25, INK)
    c.ellipse(70, gy, 16, 22, (16, 12, 10, 255))
    # Flickering hearth campfire glow inside cavern
    c.shaded_ellipse(70, gy - 5, 8, 7, FIRE)
    c.shaded_ellipse(70, gy - 4, 4, 4, (FIRE[2], FIRE[3], FIRE[4], WHITE))

    # Colossal curved mammoth tusks framing cave mouth!
    for t_dir in (-1, 1):
        for s in range(22):
            f = s / 21.0
            tx = int(round(70 + t_dir * (18 - f * 8 + (f * f) * 4)))
            ty = int(round(gy - 4 - f * 24))
            r = max(1, int(round(3 - f * 1.5)))
            c.shaded_ellipse(tx, ty, r, r, BONE)

    # Giant Mammoth Skull Keystone above cave arch
    c.shaded_ellipse(70, gy - 29, 9, 7, BONE)
    c.rect(65, gy - 30, 3, 3, INK)  # eye sockets
    c.rect(72, gy - 30, 3, 3, INK)
    c.px(69, gy - 25, INK)
    c.px(71, gy - 25, INK)

    # Tribal War Totem Pole on upper left crest with team cloth & feathers!
    c.box(16, gy - 114, 8, 42, WOOD)
    c.box(14, gy - 108, 12, 10, TEAM_RAMP)
    c.rect(16, gy - 105, 3, 2, WHITE)  # totem eyes
    c.rect(21, gy - 105, 3, 2, WHITE)
    c.box(15, gy - 94, 10, 8, BONE)
    c.rect(17, gy - 91, 6, 2, INK)
    # Feathers crowning totem
    for fx, fy in ((14, gy - 116), (19, gy - 119), (24, gy - 116)):
        c.line(20, gy - 113, fx, fy, T_LIGHT, 2)
        c.px(fx, fy, T_TRIM)

    # Draped tribal team hide banner on cliff front
    c.box(34, gy - 68, 15, 22, TEAM_RAMP)
    c.rect(34, gy - 68, 15, 2, BONE[3])
    c.rect(38, gy - 60, 7, 6, BONE[3])
    c.rect(40, gy - 58, 3, 2, INK)


def _draw_era_1_base(c: PixelCanvas) -> None:
    """Era 2: Grand Limestone Acropolis Temple with Doric columns, pediment roof & brazier."""
    gy = BASE_H - 2
    # Stepped marble foundation plinth
    c.box(4, gy - 11, 92, 11, SANDSTONE)
    c.box(8, gy - 17, 84, 7, SANDSTONE)

    # Main temple wall behind colonnade
    _draw_masonry(c, 10, gy - 76, 80, 60, SANDSTONE, SANDSTONE[0], 12, 8)
    # Recessed shaded colonnade backdrop
    c.rect(14, gy - 72, 72, 54, SANDSTONE[1])

    # Fluted Doric Marble Columns
    for cx in (15, 29, 43, 57, 79):
        c.box(cx, gy - 73, 8, 56, (SANDSTONE[1], SANDSTONE[2], SANDSTONE[3], SANDSTONE[4], WHITE))
        c.rect(cx + 2, gy - 71, 1, 52, SANDSTONE[1])
        c.rect(cx + 5, gy - 71, 1, 52, SANDSTONE[1])
        # Capital & base
        c.box(cx - 1, gy - 75, 10, 3, SANDSTONE)
        c.box(cx - 1, gy - 19, 10, 3, SANDSTONE)

    # Temple entablature frieze with team meander motif
    c.box(6, gy - 82, 88, 8, SANDSTONE)
    c.rect(8, gy - 80, 84, 4, T_MID)
    for mx in range(10, 90, 6):
        c.rect(mx, gy - 79, 3, 2, GOLD[3])

    # Upper Acropolis Sanctuary + Triangular Pediment Roof
    _draw_masonry(c, 18, gy - 104, 56, 23, SANDSTONE, SANDSTONE[0], 10, 7)
    c.shaded_poly([(10, gy - 103), (46, gy - 118), (82, gy - 103)], SANDSTONE)
    c.shaded_poly([(18, gy - 105), (46, gy - 114), (74, gy - 105)], TEAM_RAMP)
    c.shaded_ellipse(46, gy - 109, 4, 3, GOLD)

    # Grand Arched Bronze Gateway on right
    c.ellipse(70, gy - 14, 15, 22, INK)
    c.rect(55, gy - 18, 30, 18, INK)
    c.ellipse(70, gy - 14, 13, 19, (26, 18, 12, 255))
    c.rect(57, gy - 16, 26, 16, (26, 18, 12, 255))
    # Bronze arch trim
    for deg in range(0, 181, 8):
        import math
        rad = math.radians(deg)
        ax = int(round(70 + math.cos(rad) * 14))
        ay = int(round(gy - 16 - math.sin(rad) * 19))
        c.px(ax, ay, BRONZE[3])

    # Hanging team temple banners + blazing rooftop bronze brazier
    c.box(26, gy - 100, 14, 24, TEAM_RAMP)
    c.rect(28, gy - 98, 10, 2, GOLD[3])
    c.rect(28, gy - 80, 10, 2, GOLD[3])
    c.rect(31, gy - 93, 4, 10, GOLD[3])
    # Blazing brazier on roof apex
    c.box(42, gy - 121, 8, 4, BRONZE)
    c.shaded_ellipse(46, gy - 123, 4, 3, FIRE)
    c.px(46, gy - 124, WHITE)


def _draw_era_2_base(c: PixelCanvas) -> None:
    """Era 3: Monumental Medieval Stone Castle Keep with ashlar masonry, battlements & portcullis."""
    gy = BASE_H - 2
    # Tall Rear Citadel Keep Tower (left-center)
    _draw_masonry(c, 10, gy - 106, 52, 106, STONE, STONE[0], 10, 7)
    # Shaded left edge of tower
    c.rect(11, gy - 105, 10, 104, STONE[1])
    # Upper Keep Crenelated Battlements
    for bx in range(8, 60, 10):
        c.box(bx, gy - 113, 7, 8, STONE)

    # Front Heavy Barbican Wall
    _draw_masonry(c, 6, gy - 76, 88, 76, STONE, STONE[0], 10, 7)
    c.rect(7, gy - 75, 11, 74, STONE[1])
    # Front Wall Crenelations + corbel machicolations
    c.rect(6, gy - 77, 88, 3, STONE[0])
    for bx in range(6, 90, 10):
        c.box(bx, gy - 84, 7, 8, STONE)

    # Narrow archer arrow-slit windows
    for wx, wy in ((24, gy - 96), (44, gy - 96), (26, gy - 58), (44, gy - 58)):
        c.rect(wx, wy, 3, 9, INK)
        c.rect(wx - 1, wy + 3, 5, 2, INK)

    # Iron-Studded Arched Portcullis Castle Gate on right
    c.ellipse(72, gy - 14, 16, 22, INK)
    c.rect(56, gy - 18, 32, 18, INK)
    c.ellipse(72, gy - 14, 14, 19, (20, 24, 32, 255))
    c.rect(58, gy - 16, 28, 16, (20, 24, 32, 255))
    # Iron portcullis grate bars
    for gx in range(61, 84, 5):
        c.rect(gx, gy - 32, 2, 22, IRON[3])
    c.rect(59, gy - 24, 26, 2, IRON[3])
    c.rect(59, gy - 16, 26, 2, IRON[2])

    # Royal Heraldic Tapestry on Barbican Wall (vivid team blue/red + gold cross!)
    c.box(21, gy - 68, 18, 28, TEAM_RAMP)
    c.rect(28, gy - 64, 4, 20, GOLD[3])
    c.rect(24, gy - 57, 12, 4, GOLD[3])
    c.rect(21, gy - 41, 18, 2, GOLD[2])

    # Tall Waving Royal Castle Pennant atop Keep
    _draw_waving_banner(c, 34, gy - 125, 22, 9)


def _draw_era_3_base(c: PixelCanvas) -> None:
    """Era 4: Gunpowder Star-Fort Red Brick Bastion with granite coping & cannon embrasures."""
    gy = BASE_H - 2
    # Sloped Red Brick Bastion Wall
    bastion_pts = [(4, gy), (10, gy - 74), (90, gy - 74), (96, gy)]
    c.shaded_poly(bastion_pts, BRICK)
    # Brick masonry lines
    for y in range(gy - 68, gy, 6):
        inset = int((gy - y) * 0.08)
        c.rect(5 + inset, y, 90 - inset * 2, 1, BRICK[0])
        off = 5 if (y // 6) & 1 else 0
        for x in range(10 + off, 88, 10):
            c.rect(x, y - 5, 1, 5, BRICK[0])

    # Heavy Beveled Granite Coping Ledge
    c.box(7, gy - 79, 86, 6, STONE)

    # Upper Brick Citadel Command House
    _draw_masonry(c, 14, gy - 106, 56, 28, BRICK, BRICK[0], 9, 6)
    c.box(12, gy - 110, 60, 5, STONE)

    # Recessed Dark Cannon Embrasures + Bronze Gun Muzzles peeking out!
    for ex in (19, 35, 51):
        c.box(ex, gy - 62, 10, 12, CHARCOAL)
        c.rect(ex + 1, gy - 61, 8, 10, INK)
        c.box(ex + 3, gy - 58, 6, 4, BRONZE)

    # Heavy Iron-Banded Oak Fort Gate
    c.box(61, gy - 36, 27, 36, WOOD_DARK)
    for gx in range(65, 86, 4):
        c.rect(gx, gy - 35, 1, 34, WOOD[0])
    # Brass reinforcement straps & studs
    c.box(61, gy - 28, 27, 3, BRONZE)
    c.box(61, gy - 12, 27, 3, BRONZE)
    c.box(59, gy - 39, 31, 4, STONE)

    # Team Regimental Crest + Tall Waving Flag
    c.box(22, gy - 100, 18, 14, TEAM_RAMP)
    c.rect(25, gy - 95, 12, 4, GOLD[3])
    _draw_waving_banner(c, 42, gy - 125, 22, 10)


def _draw_era_4_base(c: PixelCanvas) -> None:
    """Era 5: World War Brutalist Concrete Bunker Fortress with armored pillbox, sandbags & radar mast."""
    gy = BASE_H - 2
    # Sloped Reinforced Concrete Lower Bunker
    bunker_pts = [(4, gy), (11, gy - 72), (88, gy - 72), (96, gy)]
    c.shaded_poly(bunker_pts, CONCRETE, dither=True)
    # Concrete panel seams & weathering streaks
    for sx in (26, 50, 74):
        c.rect(sx, gy - 71, 1, 70, CONCRETE[0])
        c.rect(sx + 1, gy - 71, 1, 70, CONCRETE[3])
    c.rect(10, gy - 42, 80, 2, CONCRETE[0])

    # Upper Pillbox Casemate with Armored Firing Slit
    c.box(12, gy - 102, 58, 31, CONCRETE)
    c.box(10, gy - 106, 62, 6, CONCRETE)  # overhanging blast roof
    c.rect(18, gy - 90, 44, 8, INK)
    c.rect(20, gy - 88, 40, 2, CHARCOAL[1])
    # Twin MG barrels poking from firing slit
    c.rect(34, gy - 86, 10, 2, STEEL[2])
    c.rect(50, gy - 86, 10, 2, STEEL[2])

    # Riveted Heavy Steel Blast Door
    c.box(60, gy - 38, 26, 38, DARK_STEEL)
    c.box(63, gy - 35, 20, 32, IRON)
    c.rect(72, gy - 35, 2, 32, INK)
    for ry in range(gy - 33, gy - 3, 6):
        c.px(65, ry, STEEL[4])
        c.px(81, ry, STEEL[4])

    # Stacked Sandbag Parapet at Base Front
    for row in range(2):
        for sx in range(56 + row * 4, 90 - row * 4, 8):
            c.shaded_ellipse(sx, gy - 3 - row * 4, 5, 3, KHAKI)

    # Bold Team War Stripe + Star Emblem on Bunker Wall
    c.box(16, gy - 62, 30, 10, TEAM_RAMP)
    c.rect(26, gy - 59, 10, 4, OFF_WHITE)

    # Steel Radio / Radar Antenna Mast atop Bunker
    c.rect(36, gy - 125, 2, 20, STEEL[3])
    c.rect(28, gy - 121, 18, 2, STEEL[4])
    c.rect(31, gy - 116, 12, 2, STEEL[3])
    c.px(36, gy - 126, FIRE[2])


def _draw_era_5_base(c: PixelCanvas) -> None:
    """Era 6: Modern Armored Command HQ with tactical glass ops room, hazard bay & radar dish."""
    gy = BASE_H - 2
    # Main Armored Composite-Steel HQ Block
    c.box(6, gy - 76, 88, 76, DARK_STEEL)
    c.rect(7, gy - 75, 16, 74, CHARCOAL[1])
    # Modular armor plate paneling
    for py in (gy - 54, gy - 32):
        c.rect(8, py, 84, 1, CHARCOAL[0])
        c.rect(8, py + 1, 84, 1, STEEL[2])
    for px in (30, 54):
        c.rect(px, gy - 74, 1, 72, CHARCOAL[0])

    # Upper Tactical Command Tower with Glowing Ops Glass
    c.box(12, gy - 106, 60, 31, STEEL)
    c.box(16, gy - 97, 50, 12, CHARCOAL)
    # Glowing team-colored tactical displays inside glass
    for wx in (20, 34, 48):
        c.rect(wx, gy - 94, 11, 6, T_GLOW)
        c.rect(wx + 1, gy - 93, 9, 2, WHITE)

    # Armored Vehicle Deployment Bay with Hazard Chevrons!
    c.box(58, gy - 41, 32, 41, CHARCOAL)
    c.rect(61, gy - 37, 26, 37, INK)
    # Yellow/black hazard stripe header
    c.rect(58, gy - 44, 32, 4, HAZARD_YELLOW[3])
    for hx in range(58, 90, 6):
        c.rect(hx, gy - 44, 3, 4, INK)

    # Bold Team Identification Band & Insignia
    c.box(10, gy - 70, 38, 9, TEAM_RAMP)
    c.rect(14, gy - 67, 14, 3, T_TRIM)

    # Roof Satellite Dish & Aviation Beacon Tower
    c.rect(40, gy - 118, 3, 12, STEEL[3])
    c.shaded_ellipse(37, gy - 117, 7, 5, STEEL)
    c.rect(34, gy - 118, 4, 2, DARK_STEEL[1])
    c.line(41, gy - 117, 45, gy - 122, STEEL[4])
    # Blinking beacon spire
    c.rect(60, gy - 123, 2, 17, STEEL[3])
    c.rect(59, gy - 125, 4, 3, FIRE[2])
    c.px(60, gy - 124, FIRE[4])


def _draw_era_6_base(c: PixelCanvas) -> None:
    """Era 7: Futuristic Titanium Sci-Fi Citadel Spire with Plasma Reactor Core & Floating Holo Ring."""
    gy = BASE_H - 2
    # Sloped Beveled Titanium Arcology Hull
    hull_pts = [
        (4, gy),
        (11, gy - 84),
        (36, gy - 109),
        (68, gy - 90),
        (95, gy),
    ]
    c.shaded_poly(hull_pts, TITANIUM, dither=True)

    # Armored Inner Ribbing Plates
    plate_pts = [
        (14, gy - 8),
        (20, gy - 84),
        (48, gy - 98),
        (64, gy - 8),
    ]
    c.shaded_poly(plate_pts, STEEL)
    c.poly([(14, gy - 8), (20, gy - 84), (34, gy - 88), (30, gy - 8)], DARK_STEEL[1])

    # Vertical Blazing Team Plasma Reactor Conduit!
    c.box(34, gy - 92, 12, 74, CHARCOAL)
    c.rect(36, gy - 90, 8, 70, T_MID)
    c.rect(37, gy - 90, 6, 70, T_GLOW)
    c.rect(39, gy - 88, 2, 66, WHITE)
    # Heavy armored reactor containment clamps
    for ry in (gy - 80, gy - 62, gy - 44, gy - 26):
        c.box(31, ry, 18, 4, TITANIUM)
        c.rect(33, ry + 1, 14, 1, T_LIGHT)

    # Team Energy Conduits & Tech Trim
    c.line(15, gy - 72, 30, gy - 72, T_GLOW, 2)
    c.line(12, gy - 50, 30, gy - 50, T_GLOW, 2)
    c.box(16, gy - 34, 14, 10, TEAM_RAMP)

    # Holographic Unit Deployment Portal on Right
    portal_pts = [(60, gy), (65, gy - 38), (85, gy - 38), (90, gy)]
    c.poly(portal_pts, INK)
    c.line(60, gy, 65, gy - 38, T_GLOW, 2)
    c.line(65, gy - 38, 85, gy - 38, T_GLOW, 2)
    c.line(85, gy - 38, 90, gy, T_GLOW, 2)
    # Subtle vertical energy field scanlines inside portal
    for py in range(gy - 34, gy - 2, 4):
        c.rect(67, py, 16, 1, T_DEEP)

    # Floating Levitating Holo-Ring above Spire Apex!
    c.rect(37, gy - 114, 6, 6, TITANIUM[2])
    c.px(39, gy - 113, T_GLOW)
    c.ellipse(40, gy - 120, 15, 3, T_GLOW)
    c.ellipse(40, gy - 120, 12, 2, INK)
    # Carve hollow inside floating holo ring
    for x in range(28, 53):
        for y in range(gy - 121, gy - 118):
            if ((x - 40) / 11.5) ** 2 + ((y - (gy - 120)) / 1.4) ** 2 < 1.0:
                c.erase(x, y)
    c.rect(32, gy - 122, 16, 1, WHITE)


def _draw_egypt_base(c: PixelCanvas) -> None:
    """New Era 2: Monumental Ancient Egyptian Pyramid-Pylon Temple & Golden Solar Obelisk."""
    gy = BASE_H - 2
    # Stepped golden sandstone foundation
    c.box(4, gy - 10, 92, 10, SANDSTONE)

    # Rear golden pyramid crest rising behind temple pylon
    c.shaded_poly([(8, gy - 68), (44, gy - 116), (80, gy - 68)], SANDSTONE)
    # Gilded pyramidion capstone!
    c.shaded_poly([(35, gy - 104), (44, gy - 116), (53, gy - 104)], SOLAR_GOLD)
    c.px(44, gy - 115, WHITE)

    # Twin sloped Egyptian Pylon Temple Towers
    left_pylon = [(6, gy - 8), (12, gy - 78), (46, gy - 78), (50, gy - 8)]
    c.shaded_poly(left_pylon, SANDSTONE)
    right_pylon = [(52, gy - 8), (56, gy - 70), (88, gy - 70), (94, gy - 8)]
    c.shaded_poly(right_pylon, SANDSTONE)

    # Horizontal carved hieroglyph masonry grooves
    for y in range(gy - 66, gy - 12, 10):
        c.rect(12, y, 36, 1, SANDSTONE[0])
        c.rect(56, y, 32, 1, SANDSTONE[0])

    # Carved golden cornice moldings with lapis/team stripes
    c.box(9, gy - 83, 40, 6, GOLD)
    c.rect(11, gy - 81, 36, 2, T_MID)
    c.box(54, gy - 75, 36, 6, GOLD)
    c.rect(56, gy - 73, 32, 2, T_MID)

    # Tall Carved Solar Obelisk Spire on left flank!
    c.box(16, gy - 114, 10, 34, SANDSTONE)
    c.shaded_poly([(16, gy - 114), (21, gy - 123), (26, gy - 114)], SOLAR_GOLD)
    for hy in range(gy - 109, gy - 85, 6):
        c.rect(19, hy, 4, 2, T_MID)

    # Draped Royal Egyptian Team Banners on Pylon Face
    c.box(20, gy - 70, 16, 32, TEAM_RAMP)
    c.rect(22, gy - 68, 12, 2, GOLD[3])
    c.rect(22, gy - 42, 12, 2, GOLD[3])
    # Golden Ankh emblem on banner
    c.rect(26, gy - 61, 4, 4, GOLD[3])
    c.rect(27, gy - 57, 2, 11, GOLD[3])
    c.rect(24, gy - 55, 8, 2, GOLD[3])

    # Temple Sanctuary Portal Gate + Winged Sun Disk Keystone!
    c.box(58, gy - 44, 28, 44, GOLD)
    c.rect(61, gy - 38, 22, 38, INK)
    # Winged Sun Disk above gate
    c.shaded_ellipse(72, gy - 48, 5, 4, SOLAR_GOLD)
    c.px(72, gy - 48, WHITE)
    c.rect(58, gy - 49, 10, 3, T_LIGHT)
    c.rect(76, gy - 49, 10, 3, T_LIGHT)
    # Glowing temple braziers flanking doorway
    for bx in (54, 88):
        c.box(bx - 2, gy - 14, 5, 6, BRONZE)
        c.shaded_ellipse(bx, gy - 16, 3, 3, FIRE)


def _draw_industrial_base(c: PixelCanvas) -> None:
    """New Era 6: Steampunk Copper-and-Iron Clockwork Citadel with Giant Gears & Chimneys."""
    gy = BASE_H - 2
    # Main Riveted Copper & Iron Industrial Factory Fortress
    c.box(6, gy - 76, 88, 76, IRON)
    _draw_masonry(c, 10, gy - 72, 80, 68, COPPER, COPPER[0], 14, 10)
    # Corner steel buttresses with bright rivets
    c.box(6, gy - 76, 8, 76, DARK_STEEL)
    c.box(86, gy - 76, 8, 76, DARK_STEEL)
    for ry in range(gy - 70, gy - 6, 10):
        c.px(9, ry, GOLD[3])
        c.px(89, ry, GOLD[3])

    # Twin Tall Smoking Iron Boiler Smokestacks!
    for cx in (16, 30):
        c.box(cx, gy - 120, 8, 44, DARK_STEEL)
        c.box(cx - 2, gy - 122, 12, 4, BRONZE)
        c.shaded_ellipse(cx + 4, gy - 124, 5, 3, SMOKE)

    # Upper Riveted Copper Boiler Dome Citadel
    c.shaded_ellipse(50, gy - 90, 26, 18, COPPER)
    c.box(24, gy - 92, 52, 18, COPPER)
    c.rect(24, gy - 84, 52, 3, BRONZE[3])
    # Glowing pressure gauges / boiler windows
    for wx in (36, 50, 64):
        c.shaded_ellipse(wx, gy - 94, 4, 4, GOLD)
        c.shaded_ellipse(wx, gy - 94, 2, 2, FIRE)

    # Giant Exposed Interlocking Golden Clockwork Gears on Facade!
    c.wheel(30, gy - 44, 13, GOLD, BRONZE[1], 0.2)
    c.wheel(49, gy - 54, 9, BRONZE, GOLD[2], 0.7)

    # Team Identification Iron Crest + Waving Steampunk Flag
    c.box(18, gy - 26, 28, 12, TEAM_RAMP)
    c.rect(20, gy - 24, 24, 2, GOLD[3])
    _draw_waving_banner(c, 50, gy - 124, 20, 9)

    # Heavy Arched Iron Foundry Deployment Gate glowing hot orange inside!
    c.ellipse(72, gy - 16, 15, 22, DARK_STEEL[0])
    c.rect(57, gy - 18, 30, 18, DARK_STEEL[0])
    c.ellipse(72, gy - 16, 12, 19, INK)
    c.rect(60, gy - 16, 24, 16, INK)
    c.shaded_ellipse(72, gy - 8, 7, 6, FIRE)
    c.box(55, gy - 41, 34, 4, BRONZE)


def _draw_interstellar_base(c: PixelCanvas) -> None:
    """New Era 10: Cosmic Celestial Star-Citadel with Floating Monoliths & Singularity Core."""
    gy = BASE_H - 2
    # Sculpted Obsidian & Gold Celestial Mothership Spire
    hull_pts = [
        (4, gy),
        (10, gy - 82),
        (36, gy - 106),
        (68, gy - 86),
        (95, gy),
    ]
    c.shaded_poly(hull_pts, OBSIDIAN, dither=True)

    # Sweeping Gilded Armor Wing Buttresses
    c.shaded_poly([(12, gy - 6), (18, gy - 78), (30, gy - 88), (26, gy - 6)], GOLD)
    c.shaded_poly([(52, gy - 6), (56, gy - 84), (66, gy - 76), (62, gy - 6)], GOLD)

    # Central Cosmic Singularity Reactor Conduit (Violet + Team Glow + White Core!)
    c.box(32, gy - 90, 18, 74, OBSIDIAN)
    c.rect(34, gy - 88, 14, 70, COSMIC_VIOLET[1])
    c.rect(36, gy - 86, 10, 66, T_MID)
    c.rect(38, gy - 86, 6, 66, T_GLOW)
    c.rect(40, gy - 84, 2, 62, WHITE)
    # Floating Golden Containment Rings around Core
    for ry in (gy - 78, gy - 58, gy - 38):
        c.box(29, ry, 24, 4, GOLD)
        c.rect(31, ry + 1, 20, 1, COSMIC_VIOLET[4])

    # Radiant Cosmic Singularity Orb hovering inside Upper Spire Arch!
    c.shaded_ellipse(41, gy - 98, 9, 8, COSMIC_VIOLET)
    c.shaded_ellipse(41, gy - 98, 5, 5, (T_SHADE, T_MID, T_GLOW, WHITE))
    c.px(41, gy - 98, WHITE)

    # Twin Floating Golden Crown Rings levitating above Apex!
    c.ellipse(41, gy - 114, 17, 3, GOLD[3])
    c.ellipse(41, gy - 114, 13, 2, INK)
    for x in range(29, 54):
        for y in range(gy - 115, gy - 112):
            if ((x - 41) / 12.5) ** 2 + ((y - (gy - 114)) / 1.4) ** 2 < 1.0:
                c.erase(x, y)
    c.rect(33, gy - 116, 16, 1, WHITE)
    # Floating diamond star crystal above rings
    c.shaded_poly([(41, gy - 125), (37, gy - 121), (41, gy - 117), (45, gy - 121)], SOLAR_GOLD)
    c.px(41, gy - 121, WHITE)

    # Team Energy Banners on Left Flank
    c.box(12, gy - 54, 14, 18, TEAM_RAMP)
    c.rect(14, gy - 52, 10, 2, GOLD[3])
    c.rect(14, gy - 39, 10, 2, GOLD[3])

    # Dimensional Warp Deployment Portal on Right
    portal_pts = [(62, gy), (66, gy - 40), (86, gy - 40), (91, gy)]
    c.poly(portal_pts, INK)
    c.line(62, gy, 66, gy - 40, GOLD[3], 2)
    c.line(66, gy - 40, 86, gy - 40, GOLD[3], 2)
    c.line(86, gy - 40, 91, gy, GOLD[3], 2)
    for py in range(gy - 36, gy - 2, 4):
        c.rect(68, py, 16, 2, COSMIC_VIOLET[2] if (py % 8 == 0) else T_DEEP)


ERA_BASE_DRAWERS = [
    _draw_era_0_base,       # 0: Stone Age
    _draw_egypt_base,       # 1: Ancient Egypt (NEW)
    _draw_era_1_base,       # 2: Ancient Classical
    _draw_era_2_base,       # 3: Medieval
    _draw_era_3_base,       # 4: Gunpowder
    _draw_industrial_base,  # 5: Industrial Steampunk (NEW)
    _draw_era_4_base,       # 6: World War
    _draw_era_5_base,       # 7: Modern
    _draw_era_6_base,       # 8: Future
    _draw_interstellar_base,# 9: Interstellar Cosmic (NEW)
]


def gen_base(era_index: int, damage_state: str) -> tuple[PixelCanvas, int, int]:
    """Generate a 100x128px fortress sprite for the given era (0..9) and damage state."""
    c = PixelCanvas(BASE_W, BASE_H)
    ERA_BASE_DRAWERS[era_index](c)
    _apply_damage_overlay(c, damage_state, era_index)
    c.add_outline(INK)
    # Bottom-center ground anchor at (50, 126)
    return c, BASE_W // 2, BASE_H - 2

