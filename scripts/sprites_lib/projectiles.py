"""Crisp pixel-art sprites for all projectiles, falling ultimate ordinance, and WW bomber aircraft."""

from __future__ import annotations

from .canvas import PixelCanvas
from .palettes import (
    BRONZE,
    CHARCOAL,
    CYAN_GLOW,
    DARK_STEEL,
    FIRE,
    GOLD,
    INK,
    IRON,
    OFF_WHITE,
    OLIVE,
    SMOKE,
    STEEL,
    STONE,
    T_DEEP,
    T_GLOW,
    T_LIGHT,
    T_MID,
    T_SHADE,
    T_TRIM,
    WHITE,
    WOOD,
)


def gen_projectiles() -> dict[str, tuple[PixelCanvas, int, int]]:
    """Return map of projectile sprite key -> (PixelCanvas, anchorX, anchorY)."""
    out: dict[str, tuple[PixelCanvas, int, int]] = {}

    # 1. River Stone (8x8)
    c = PixelCanvas(8, 8)
    c.shaded_ellipse(4, 4, 2, 2, STONE)
    c.add_outline(INK)
    out['proj/stone'] = (c, 4, 4)

    # 2. Catapult Boulder (14x14)
    c = PixelCanvas(14, 14)
    c.shaded_ellipse(7, 7, 5, 5, STONE)
    c.px(5, 5, STONE[4])
    c.px(8, 8, STONE[0])
    c.px(9, 7, STONE[0])
    c.add_outline(INK)
    out['proj/boulder'] = (c, 7, 7)

    # 3. Arrow (18x8)
    c = PixelCanvas(18, 8)
    c.rect(2, 3, 10, 2, WOOD[3])
    c.rect(2, 4, 10, 1, WOOD[1])
    # White fletching
    c.rect(1, 2, 3, 1, OFF_WHITE)
    c.rect(1, 5, 3, 1, OFF_WHITE)
    # Steel arrowhead
    c.poly([(11, 1), (16, 4), (11, 6)], STEEL[3])
    c.px(14, 4, WHITE)
    c.add_outline(INK)
    out['proj/arrow'] = (c, 9, 4)

    # 4. Fire Arrow (20x10)
    c = PixelCanvas(20, 10)
    c.rect(2, 4, 10, 2, WOOD[2])
    c.rect(1, 3, 3, 1, OFF_WHITE)
    c.rect(1, 6, 3, 1, OFF_WHITE)
    c.shaded_ellipse(14, 5, 3, 3, FIRE)
    c.px(15, 5, WHITE)
    c.add_outline(INK)
    out['proj/fire_arrow'] = (c, 10, 5)

    # 5. Crossbow / Ballista Steel Bolt (18x8)
    c = PixelCanvas(18, 8)
    c.rect(2, 3, 10, 2, STEEL[3])
    c.rect(2, 4, 10, 1, STEEL[1])
    c.rect(1, 2, 3, 4, IRON[2])
    c.poly([(11, 1), (16, 4), (11, 6)], STEEL[4])
    c.px(15, 4, WHITE)
    c.add_outline(INK)
    out['proj/bolt'] = (c, 9, 4)

    # 6. Glowing Bullet Tracer (14x6)
    c = PixelCanvas(14, 6)
    c.rect(1, 2, 7, 2, FIRE[2])
    c.rect(5, 2, 6, 2, FIRE[3])
    c.rect(9, 2, 3, 2, WHITE)
    c.add_outline(INK)
    out['proj/bullet'] = (c, 8, 3)

    # 7. Iron Cannonball (12x12)
    c = PixelCanvas(12, 12)
    c.shaded_ellipse(6, 6, 4, 4, CHARCOAL)
    c.px(4, 4, STEEL[4])
    c.px(5, 4, STEEL[3])
    c.add_outline(INK)
    out['proj/cannonball'] = (c, 6, 6)

    # 8. Artillery / Tank Brass Shell (16x8)
    c = PixelCanvas(16, 8)
    c.box(2, 2, 8, 4, BRONZE)
    c.poly([(10, 1), (14, 4), (10, 6)], GOLD[3])
    c.px(12, 4, WHITE)
    c.rect(1, 3, 2, 2, FIRE[3])
    c.add_outline(INK)
    out['proj/shell'] = (c, 8, 4)

    # 9. Rocket / RPG Warhead (20x10)
    c = PixelCanvas(20, 10)
    # Exhaust fire tail
    c.shaded_ellipse(3, 5, 3, 2, FIRE)
    c.px(4, 5, WHITE)
    # Stabilizer fins + body
    c.rect(5, 2, 2, 6, IRON[2])
    c.box(6, 3, 8, 4, DARK_STEEL)
    # Red warhead cone
    c.poly([(14, 2), (18, 5), (14, 8)], FIRE[1])
    c.line(14, 3, 17, 5, FIRE[2])
    c.add_outline(INK)
    out['proj/rocket'] = (c, 11, 5)

    # 10. Plasma Bolt (team-swappable, 16x10)
    c = PixelCanvas(16, 10)
    c.shaded_ellipse(9, 5, 5, 3, (T_DEEP, T_SHADE, T_MID, T_GLOW, WHITE))
    c.rect(2, 4, 6, 2, T_MID)
    c.rect(5, 4, 7, 2, WHITE)
    c.add_outline(INK)
    out['proj/plasma/player'] = (c.swap_team('player'), 9, 5)
    out['proj/plasma/enemy'] = (c.swap_team('enemy'), 9, 5)

    # 11. Ultimate Meteor (22x22)
    c = PixelCanvas(22, 22)
    c.shaded_ellipse(11, 11, 8, 8, (FIRE[0], FIRE[0], FIRE[1], FIRE[2], FIRE[3]))
    c.shaded_ellipse(10, 10, 6, 6, (CHARCOAL[0], CHARCOAL[1], FIRE[0], FIRE[1]))
    # Glowing molten lava cracks on meteor
    c.line(7, 9, 13, 13, FIRE[3], 2)
    c.line(11, 6, 13, 12, FIRE[3], 1)
    c.shaded_ellipse(13, 13, 3, 3, (FIRE[2], FIRE[3], FIRE[4], WHITE))
    c.add_outline(INK)
    out['proj/meteor'] = (c, 11, 11)

    # 12. Ultimate Naval Shell / Aerial Bomb (18x10)
    c = PixelCanvas(18, 10)
    c.rect(1, 2, 3, 6, IRON[2])
    c.shaded_ellipse(10, 5, 6, 3, DARK_STEEL)
    c.rect(12, 3, 2, 4, FIRE[2])
    c.px(11, 3, STEEL[4])
    c.add_outline(INK)
    out['proj/bomb'] = (c, 10, 5)

    # 13. Ultimate Tactical Cruise Missile (24x12)
    c = PixelCanvas(24, 12)
    c.shaded_ellipse(3, 6, 3, 2, FIRE)
    c.rect(6, 2, 3, 8, IRON[3])
    c.box(7, 4, 11, 4, STEEL)
    c.rect(10, 4, 3, 4, FIRE[2])
    c.poly([(18, 3), (22, 6), (18, 9)], FIRE[1])
    c.px(20, 6, FIRE[3])
    c.add_outline(INK)
    out['proj/cruise_missile'] = (c, 13, 6)

    # 14. Era 5 Ultimate WW Heavy Bomber Plane (team-swappable, 44x20)
    c = PixelCanvas(44, 20)
    # Fuselage
    c.shaded_ellipse(22, 12, 18, 4, OLIVE)
    # Swept wing
    c.shaded_poly([(14, 11), (28, 11), (23, 3), (12, 4)], OLIVE)
    # Team tailfin
    c.shaded_poly([(4, 11), (10, 11), (8, 3), (2, 4)], (T_DEEP, T_SHADE, T_MID, T_LIGHT))
    # Team wing insignia stripe
    c.rect(17, 6, 7, 2, T_LIGHT)
    # Cockpit glass canopy
    c.rect(28, 9, 6, 3, CYAN_GLOW[3])
    c.rect(29, 9, 4, 1, WHITE)
    # Spinning nose propeller blur
    c.rect(40, 6, 2, 12, SMOKE[3])
    c.rect(41, 8, 1, 8, WHITE)
    c.add_outline(INK)
    out['ult/bomber/player'] = (c.swap_team('player'), 22, 11)
    out['ult/bomber/enemy'] = (c.swap_team('enemy'), 22, 11)

    return out
