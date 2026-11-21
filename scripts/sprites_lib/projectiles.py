"""Crisp pixel-art sprites for all projectiles, falling ultimate ordinance, and WW bomber aircraft."""

from __future__ import annotations

from .canvas import PixelCanvas
from .palettes import (
    BRONZE,
    CHARCOAL,
    COPPER,
    COSMIC_VIOLET,
    CYAN_GLOW,
    DARK_STEEL,
    FIRE,
    GOLD,
    INK,
    IRON,
    OFF_WHITE,
    OLIVE,
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

    # 15. Egyptian Blazing Solar Orb (14x14)
    c = PixelCanvas(14, 14)
    c.shaded_ellipse(7, 7, 5, 5, SOLAR_GOLD)
    c.shaded_ellipse(7, 7, 2, 2, (SOLAR_GOLD[3], SOLAR_GOLD[4], WHITE, WHITE))
    c.px(7, 1, SOLAR_GOLD[3])
    c.px(7, 12, SOLAR_GOLD[3])
    c.px(1, 7, SOLAR_GOLD[3])
    c.px(12, 7, SOLAR_GOLD[3])
    c.add_outline(INK)
    out['proj/solar_orb'] = (c, 7, 7)

    # 16. Interstellar Antimatter Orb (team-swappable, 16x16)
    c = PixelCanvas(16, 16)
    c.shaded_ellipse(8, 8, 6, 6, COSMIC_VIOLET)
    c.shaded_ellipse(8, 8, 3, 3, (T_SHADE, T_MID, T_GLOW, WHITE))
    c.px(8, 8, WHITE)
    c.add_outline(INK)
    out['proj/antimatter/player'] = (c.swap_team('player'), 8, 8)
    out['proj/antimatter/enemy'] = (c.swap_team('enemy'), 8, 8)

    # 17. Industrial Era Ultimate Steampunk War Zeppelin (team-swappable, 56x28)
    c = PixelCanvas(56, 28)
    # Giant armored brass-ribbed dirigible envelope!
    c.shaded_ellipse(28, 12, 24, 9, COPPER)
    # Team sovereign stripe across hull
    c.rect(10, 10, 36, 4, T_MID)
    c.rect(12, 10, 32, 2, T_LIGHT)
    # Brass structural ribs
    for rx in (16, 26, 36, 44):
        c.rect(rx, 5, 2, 14, GOLD[3])
    # Tail stabilizer fins
    c.shaded_poly([(3, 10), (10, 6), (11, 12), (4, 13)], (T_DEEP, T_SHADE, T_MID, T_LIGHT))
    c.shaded_poly([(3, 14), (10, 18), (11, 13), (4, 12)], (T_DEEP, T_SHADE, T_MID, T_LIGHT))
    # Armored underslung bomb gondola & spinning rear propeller
    c.box(18, 20, 20, 6, DARK_STEEL)
    c.rect(22, 22, 4, 2, FIRE[3])
    c.rect(28, 22, 4, 2, FIRE[3])
    c.rect(34, 22, 2, 2, GOLD[3])
    c.rect(14, 20, 2, 6, SMOKE[3])
    c.add_outline(INK)
    out['ult/zeppelin/player'] = (c.swap_team('player'), 28, 14)
    out['ult/zeppelin/enemy'] = (c.swap_team('enemy'), 28, 14)

    # 18. Tribal Shaman Blazing Totem Fire Orb (14x14)
    c = PixelCanvas(14, 14)
    c.shaded_ellipse(7, 7, 5, 5, FIRE)
    c.shaded_ellipse(7, 7, 3, 3, SOLAR_GOLD)
    c.px(6, 6, WHITE)
    c.px(7, 7, WHITE)
    c.px(3, 5, FIRE[3])
    c.px(11, 9, FIRE[3])
    c.add_outline(INK)
    out['proj/totem_fire'] = (c, 7, 7)

    # 19. Gunpowder Era Iron Grenade with Sparking Fuse (12x14)
    c = PixelCanvas(12, 14)
    c.shaded_ellipse(6, 8, 4, 4, CHARCOAL)
    c.px(4, 6, STEEL[4])
    c.rect(5, 3, 2, 2, BRONZE[3])
    c.px(7, 2, FIRE[2])
    c.px(8, 1, FIRE[3])
    c.px(9, 2, WHITE)
    c.add_outline(INK)
    out['proj/grenade'] = (c, 6, 8)

    # 20. World War Finned Mortar Bomb Shell (18x10)
    c = PixelCanvas(18, 10)
    # Tail stabilizer fins
    c.rect(1, 2, 3, 6, DARK_STEEL[2])
    c.rect(2, 4, 3, 2, IRON[3])
    # Olive bomb body + red explosive nose band
    c.shaded_ellipse(10, 5, 5, 3.5, OLIVE)
    c.rect(12, 2, 2, 6, FIRE[2])
    c.poly([(14, 3), (17, 5), (14, 7)], STEEL[3])
    c.px(10, 3, OLIVE[4])
    c.add_outline(INK)
    out['proj/mortar_shell'] = (c, 10, 5)

    return out
