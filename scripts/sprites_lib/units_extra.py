"""HD 1:1 Metal-Slug / Kingdom-Rush style pixel-art generators for the 9 new 4th civilization units:
- Era 1 (Stone Age): shaman (76x74)
- Era 2 (Ancient Egypt): scorpion_guard (76x72)
- Era 3 (Ancient Classical): centurion (78x74)
- Era 5 (Gunpowder): grenadier (76x72)
- Era 6 (Industrial Steampunk): tesla_coil_trooper (78x74)
- Era 7 (World War): mortar_team (84x70)
- Era 8 (Modern): riot_juggernaut (82x74)
- Era 9 (Future): hover_drone (78x62)
- Era 10 (Interstellar Cosmic): star_archon (84x80)
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
    BONE,
    BRASS,
    BRONZE,
    CHARCOAL,
    COPPER,
    COSMIC_VIOLET,
    CRIMSON_FUEL,
    CYAN_GLOW,
    DARK_STEEL,
    EGYPT_LINEN,
    FIRE,
    FUR,
    FUR_DARK,
    GOLD,
    GRASS,
    HAIR_BROWN,
    HAZARD_YELLOW,
    INK,
    INK_SOFT,
    IRON,
    KHAKI,
    LEATHER,
    NVG_GREEN,
    OBSIDIAN,
    OFF_WHITE,
    OLIVE,
    PLASMA_PINK,
    SKIN,
    SKIN_TAN,
    SLATE_ARMOR,
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


# =============================================================================
# ERA 1: STONE AGE 4TH UNIT — SHAMAN (부족 주술사)
# =============================================================================

def gen_shaman(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Tribal Fire Shaman with Horned Skull Mask, Feather Headdress & Blazing Totem Staff (76x74px)."""
    w, h = 76, 74

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Fanning colorful tribal feathers behind skull mask
        fl = -2 if a in ('walk_1', 'walk_3', 'attack_1') else 0
        c.shaded_capsule(cx - 4, cy - 5, cx - 13, cy - 13 + fl, 2.0, TEAM_RAMP)
        c.shaded_capsule(cx - 2, cy - 7, cx - 8, cy - 17 + fl, 1.8, FIRE)
        c.shaded_capsule(cx + 1, cy - 7, cx + 1, cy - 18 + fl, 1.8, TEAM_RAMP)
        c.shaded_capsule(cx + 4, cy - 6, cx + 9, cy - 15 + fl, 1.6, SOLAR_GOLD)
        # Carved bleached animal skull mask over shaman's face!
        c.shaded_ellipse(cx, cy, 8, 7, BONE)
        c.shaded_poly([(cx + 1, cy + 2), (cx + 9, cy + 1), (cx + 7, cy + 7), (cx, cy + 7)], BONE)
        # Curved beast horns sweeping up from temples
        c.shaded_capsule(cx - 5, cy - 4, cx - 10, cy - 12, 2.0, BONE)
        c.shaded_capsule(cx + 3, cy - 5, cx + 9, cy - 13, 1.8, BONE)
        # Tribal warpaint forehead band
        c.rect(cx - 5, cy - 4, 11, 2, T_MID)
        c.rect(cx - 3, cy - 4, 7, 1, T_TRIM)
        # Glowing ember shaman eyes inside dark eye sockets!
        c.rect(cx + 2, cy - 2, 4, 3, INK)
        if a != 'death_0':
            c.rect(cx + 3, cy - 1, 2, 2, FIRE[3])
            c.px(cx + 4, cy - 1, WHITE)
        # Skull fangs along jaw
        for fx in (cx + 2, cx + 5, cx + 7):
            c.px(fx, cy + 6, INK)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Heavy shaman bone rib-necklace & jaguar pelt mantle
        c.shaded_poly([(tx, ty + 1), (tx + 17, ty + 1), (tx + 15, ty + 7), (tx + 2, ty + 7)], FUR)
        for nx in (tx + 4, tx + 8, tx + 12):
            c.rect(nx, ty + 3, 2, 4, BONE[3])
            c.px(nx, ty + 6, WHITE)
        # Glowing painted tribal rune across chest
        c.rect(tx + 6, ty + 9, 5, 5, TEAM_RAMP[2])
        c.px(tx + 8, ty + 11, FIRE[3])
        # Tattered bone-trimmed ceremonial skirt
        for jx in range(tx + 1, tx + 15, 3):
            c.poly([(jx, ty + 18), (jx + 2, ty + 23), (jx + 3, ty + 18)], FUR_DARK[2])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx - 2, sy + 3, sx + 26, sy + 2, 2.0, WOOD_DARK)
            c.shaded_ellipse(sx + 26, sy + 2, 5, 4, BONE)
            return
        thrust = 7 if a == 'attack_1' else (-3 if a == 'attack_0' else 0)
        lift = -4 if a == 'attack_0' else (2 if a == 'attack_1' else 0)
        st_x = sx + 14 + thrust
        # Twisted gnarled wooden totem staff
        c.shaded_capsule(st_x, sy + 18, st_x + 1, sy - 10 + lift, 2.2, WOOD)
        # Crossbar & dangling tribal feathers
        c.box(st_x - 5, sy - 9 + lift, 11, 3, WOOD_DARK)
        c.shaded_capsule(st_x - 4, sy - 6 + lift, st_x - 6, sy + 1 + lift, 1.3, TEAM_RAMP)
        c.shaded_capsule(st_x + 5, sy - 6 + lift, st_x + 7, sy + 1 + lift, 1.3, FIRE)
        # Miniature bone skull crown cradling blazing fire orb!
        c.shaded_ellipse(st_x + 1, sy - 13 + lift, 4.5, 4, BONE)
        c.px(st_x + 2, sy - 13 + lift, INK)
        orb_r = 6 if a in ('attack_0', 'attack_1') else 4.5
        c.shaded_ellipse(st_x + 1, sy - 19 + lift, orb_r, orb_r, FIRE)
        c.ellipse(st_x + 1, sy - 19 + lift, 2.2, 2.2, WHITE)
        # Outstretched shaman arm + tribal bangle
        c.shaded_capsule(sx, sy, st_x - 1, sy + lift // 2, 2.8, SKIN_TAN)
        c.rect(st_x - 4, sy - 2 + lift // 2, 3, 5, BONE[3])

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        thrust = 7 if a == 'attack_1' else (-3 if a == 'attack_0' else 0)
        lift = -4 if a == 'attack_0' else (2 if a == 'attack_1' else 0)
        ox, oy = sx + 15 + thrust, sy - 19 + lift
        c.radial_glow(ox, oy, 11 if a == 'attack_1' else 6, (245, 110, 24, 155))
        if a == 'attack_1':
            draw_muzzle_flash(c, ox + 4, oy, 8, FIRE)
        elif a == 'attack_0':
            draw_hit_sparks(c, ox, oy, scale=1)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN_TAN, torso=FUR_DARK, legs=SKIN_TAN, boots=LEATHER,
        belt=LEATHER[1], buckle=BONE[3],
        cape_ramp=FUR, has_team_sash=True, has_team_shoulder=False,
        head_fn=head, torso_detail_fn=torso_detail, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


# =============================================================================
# ERA 2: ANCIENT EGYPT 4TH UNIT — SCORPION GUARD (전갈 암살병)
# =============================================================================

def gen_scorpion_guard(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Agile Egyptian Scorpion Assassin with Twin Venom Khopesh Blades & Scorpion Tail Plume (76x72px)."""
    w, h = 76, 72

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Sweeping segmented golden scorpion-tail crest curving forward above helm!
        fl = 2 if a == 'attack_1' else (-2 if a == 'hurt_0' else 0)
        c.shaded_capsule(cx - 5, cy - 6, cx - 10, cy - 13, 2.2, GOLD)
        c.shaded_capsule(cx - 10, cy - 13, cx - 2 + fl, cy - 18, 2.0, GOLD)
        c.shaded_capsule(cx - 2 + fl, cy - 18, cx + 6 + fl, cy - 14, 1.7, NVG_GREEN)
        c.px(cx + 7 + fl, cy - 13, WHITE)
        # Sleek obsidian desert assassin cowl & gilded mask
        c.shaded_ellipse(cx, cy, 7.5, 7, OBSIDIAN)
        c.shaded_poly([(cx - 4, cy - 6), (cx + 7, cy - 4), (cx + 6, cy + 1), (cx - 4, cy)], GOLD)
        # Wrapped lower desert scarf in team colors
        c.box(cx - 5, cy + 2, 12, 5, TEAM_RAMP)
        c.rect(cx - 3, cy + 3, 8, 1, T_TRIM)
        # Piercing glowing venom-emerald eyes!
        if a != 'death_0':
            c.rect(cx + 2, cy - 2, 4, 2, NVG_GREEN[3])
            c.px(cx + 4, cy - 2, WHITE)

    def back_arm(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        # Off-hand curved venom-stinger blade slicing forward/back!
        if a == 'attack_1':
            ex, ey = sx + 10, sy - 6
            c.shaded_capsule(sx, sy, ex, ey, 2.5, SKIN_TAN)
            c.shaded_capsule(ex, ey, ex + 14, ey - 8, 1.8, GOLD)
            c.shaded_capsule(ex + 12, ey - 7, ex + 18, ey - 2, 2.0, NVG_GREEN)
        else:
            ex, ey = sx + 7, sy - 3
            c.shaded_capsule(sx, sy, ex, ey, 2.4, SKIN_TAN)
            c.shaded_capsule(ex, ey, ex + 11, ey - 10, 1.6, GOLD)
            c.px(ex + 11, ey - 10, NVG_GREEN[3])

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Gilded scorpion carapace chestplate + emerald core jewel
        c.armor_plate(tx + 2, ty + 2, 13, 10, GOLD, sheen=True)
        c.rect(tx + 7, ty + 5, 3, 4, NVG_GREEN[3])
        c.px(tx + 8, ty + 6, WHITE)
        # Flowing team assassin sash
        c.box(tx + 3, ty + 14, 11, 7, TEAM_RAMP)
        c.rect(tx + 5, ty + 19, 7, 2, GOLD[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx + 2, sy + 3, sx + 18, sy + 3, 1.8, GOLD)
            c.shaded_capsule(sx + 18, sy + 3, sx + 24, sy, 2.0, NVG_GREEN)
            return
        if a == 'attack_0':
            ex, ey = sx - 5, sy - 6
            c.shaded_capsule(sx, sy, ex, ey, 2.8, SKIN_TAN)
            c.shaded_capsule(ex, ey, ex - 10, ey - 12, 2.0, GOLD)
            c.shaded_capsule(ex - 10, ey - 12, ex - 2, ey - 17, 2.2, NVG_GREEN)
        elif a == 'attack_1':
            # Blistering dual-blade cross-slash lunge!
            ex, ey = sx + 11, sy + 2
            c.shaded_capsule(sx, sy, ex, ey, 3.0, SKIN_TAN)
            c.box(ex - 2, ey - 2, 5, 4, GOLD)
            c.shaded_capsule(ex + 2, ey, ex + 17, ey + 2, 2.0, GOLD)
            c.shaded_poly(
                [(ex + 13, ey - 2), (ex + 26, ey + 1), (ex + 24, ey + 8), (ex + 16, ey + 5)],
                NVG_GREEN,
            )
            c.line(ex + 15, ey, ex + 25, ey + 3, WHITE, 1)
        elif a == 'attack_2':
            ex, ey = sx + 8, sy + 7
            c.shaded_capsule(sx, sy, ex, ey, 2.8, SKIN_TAN)
            c.shaded_capsule(ex + 1, ey, ex + 16, ey + 9, 2.0, GOLD)
            c.px(ex + 16, ey + 9, NVG_GREEN[3])
        else:
            sway = -2 if a in ('walk_1', 'walk_2') else 2
            ex, ey = sx + 8, sy + 3 + sway
            c.shaded_capsule(sx, sy, ex, ey, 2.8, SKIN_TAN)
            c.box(ex - 2, ey - 2, 4, 4, GOLD)
            c.shaded_capsule(ex + 2, ey, ex + 14, ey - 7 + sway, 1.9, GOLD)
            c.shaded_capsule(ex + 13, ey - 7 + sway, ex + 20, ey - 3 + sway, 2.0, NVG_GREEN)
            c.px(ex + 19, ey - 3 + sway, WHITE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 18, sy - 2, 21, NVG_GREEN[2], NVG_GREEN[4])
            c.radial_glow(sx + 32, sy + 2, 6, (34, 197, 94, 150))

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN_TAN, torso=OBSIDIAN, legs=OBSIDIAN, boots=GOLD,
        belt=GOLD[3], buckle=NVG_GREEN[3],
        knee_armor=GOLD, cape_ramp=TEAM_RAMP, has_team_shoulder=True,
        head_fn=head, back_arm_fn=back_arm, torso_detail_fn=torso_detail,
        weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29, torso_armored=True,
    )
    return c, 29, h - 3


# =============================================================================
# ERA 3: ANCIENT CLASSICAL 4TH UNIT — CENTURION (백인대장)
# =============================================================================

def gen_centurion(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Roman Centurion Tank with Transverse Plumed Galea, Lorica Segmentata & Scutum Tower Shield (78x74px)."""
    w, h = 78, 74

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy + 1, a, SKIN, brow_col=HAIR_BROWN[0])
        # Iconic wide transverse Roman Centurion horsehair crest (team-colored)!
        fl = -2 if a in ('walk_1', 'walk_3', 'attack_1') else 0
        c.shaded_poly(
            [
                (cx - 12, cy - 11 + fl),
                (cx - 5, cy - 19 + fl),
                (cx + 6, cy - 19 + fl),
                (cx + 12, cy - 11 + fl),
                (cx + 7, cy - 7),
                (cx - 8, cy - 7),
            ],
            TEAM_RAMP,
        )
        c.line(cx - 5, cy - 16 + fl, cx + 6, cy - 16 + fl, T_TRIM, 2)
        c.box(cx - 4, cy - 9, 8, 3, GOLD)
        # Gleaming bronze-and-steel Galea helmet with sculpted cheek guards & brow ridge
        c.shaded_ellipse(cx, cy - 3, 8, 6, STEEL)
        c.rect(cx - 8, cy - 4, 16, 2, GOLD[3])
        c.armor_plate(cx - 6, cy, 6, 7, STEEL, sheen=False)
        c.armor_plate(cx + 1, cy + 2, 5, 5, GOLD, sheen=True)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Layered Lorica Segmentata Roman banded steel cuirass + gold phalerae medals
        c.armor_plate(tx + 1, ty + 2, 15, 13, STEEL, sheen=True)
        for ry in (ty + 5, ty + 8, ty + 11):
            c.rect(tx + 1, ry, 15, 1, DARK_STEEL[0])
            c.rect(tx + 2, ry + 1, 13, 1, STEEL[4])
        # Twin golden officer medals (phalerae)
        c.shaded_ellipse(tx + 5, ty + 6, 2, 2, GOLD)
        c.shaded_ellipse(tx + 12, ty + 6, 2, 2, GOLD)
        # Studded leather pteruges Roman battle skirt
        for px in range(tx + 2, tx + 15, 3):
            c.rect(px, ty + 17, 2, 5, TEAM_RAMP[2])
            c.px(px, ty + 21, GOLD[3])

    def shield(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        # Massive curved rectangular Roman Scutum Tower Shield with golden boss & winged thunderbolt!
        push = 5 if a == 'attack_1' else (-2 if a == 'hurt_0' else 0)
        shx = sx + push
        shy = sy - 8
        c.armor_plate(shx - 5, shy, 14, 28, TEAM_RAMP, sheen=True)
        # Gleaming brass rim border
        c.rect_outline(shx - 5, shy, 14, 28, GOLD[3])
        c.rect(shx - 4, shy + 1, 12, 1, GOLD[4])
        # Golden imperial eagle wings + thunderbolt motif + central steel umbo boss
        c.line(shx - 3, shy + 5, shx + 7, shy + 11, GOLD[3], 2)
        c.line(shx - 3, shy + 22, shx + 7, shy + 16, GOLD[3], 2)
        c.shaded_ellipse(shx + 2, shy + 14, 4, 4.5, GOLD)
        c.px(shx + 1, shy + 13, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx + 2, sy + 2, sx + 22, sy + 2, 2.2, STEEL)
            c.box(sx, sy, 4, 5, GOLD)
            return
        if a == 'attack_0':
            ex, ey = sx - 4, sy - 6
            c.shaded_capsule(sx, sy, ex, ey, 3.0, STEEL)
            c.shaded_capsule(ex, ey, ex + 10, ey - 10, 2.2, STEEL)
            c.box(ex - 1, ey - 3, 5, 4, GOLD)
        elif a == 'attack_1':
            # Brutal forward Roman Gladius thrust past shield!
            ex, ey = sx + 12, sy + 2
            c.shaded_capsule(sx, sy, ex, ey, 3.2, STEEL)
            c.box(ex - 1, ey - 4, 4, 8, GOLD)
            c.shaded_poly(
                [(ex + 3, ey - 3), (ex + 24, ey - 2), (ex + 29, ey), (ex + 24, ey + 2), (ex + 3, ey + 3)],
                STEEL,
            )
            c.line(ex + 4, ey - 1, ex + 26, ey, WHITE, 1)
        elif a == 'attack_2':
            ex, ey = sx + 9, sy + 5
            c.shaded_capsule(sx, sy, ex, ey, 3.0, STEEL)
            c.shaded_capsule(ex + 2, ey, ex + 17, ey + 5, 2.2, STEEL)
        else:
            sway = -2 if a in ('walk_1', 'walk_2') else 2
            ex, ey = sx + 6, sy + 4 + sway
            c.shaded_capsule(sx, sy, ex, ey, 3.0, STEEL)
            c.box(ex, ey - 3, 4, 6, GOLD)
            c.shaded_poly(
                [(ex + 4, ey - 2), (ex + 17, ey - 10 + sway), (ex + 21, ey - 11 + sway), (ex + 18, ey - 6 + sway), (ex + 4, ey + 2)],
                STEEL,
            )
            c.px(ex + 19, ey - 10 + sway, WHITE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 22, sy + 1, 18, GOLD[3], WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=STEEL, legs=SKIN, boots=LEATHER,
        belt=GOLD[2], buckle=GOLD[4],
        knee_armor=GOLD, cape_ramp=TEAM_RAMP, has_team_shoulder=True,
        head_fn=head, torso_detail_fn=torso_detail, shield_fn=shield,
        weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=30, torso_armored=True,
    )
    return c, 30, h - 3


# =============================================================================
# ERA 5: GUNPOWDER 4TH UNIT — GRENADIER (척탄병)
# =============================================================================

def gen_grenadier(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD 18th-Century Royal Mitre-Cap Grenadier lobbing Sparking Iron Black-Powder Grenades (76x72px)."""
    w, h = 76, 72

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy + 2, a, SKIN, brow_col=HAIR_BROWN[0], beard_ramp=HAIR_BROWN)
        # Tall iconic peaked Grenadier Mitre Cap with gleaming embossed brass front plate!
        c.shaded_poly(
            [(cx - 8, cy - 3), (cx - 5, cy - 17), (cx + 1, cy - 20), (cx + 7, cy - 15), (cx + 8, cy - 3)],
            TEAM_RAMP,
        )
        c.shaded_poly(
            [(cx - 2, cy - 4), (cx, cy - 17), (cx + 6, cy - 13), (cx + 7, cy - 4)],
            GOLD,
        )
        c.rect(cx - 8, cy - 4, 16, 3, GOLD[3])
        c.px(cx + 2, cy - 13, WHITE)
        # Fluffy white pom-pom at peak!
        c.shaded_ellipse(cx + 1, cy - 20, 2.5, 2.5, EGYPT_LINEN)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Leather ordnance satchel packed with spare iron grenades!
        c.box(bx - 6, by + 5, 9, 12, LEATHER)
        c.rect(bx - 5, by + 7, 7, 2, GOLD[3])
        c.shaded_ellipse(bx - 3, by + 4, 3.0, 3.0, CHARCOAL)
        c.shaded_ellipse(bx + 1, by + 5, 2.8, 2.8, CHARCOAL)
        c.px(bx - 4, by + 3, STEEL[4])

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Tailored military uniform coat with crisp white crossed bandoliers & brass buttons
        c.line(tx + 2, ty + 2, tx + 14, ty + 14, OFF_WHITE, 2)
        c.line(tx + 14, ty + 2, tx + 2, ty + 14, OFF_WHITE, 2)
        c.box(tx + 6, ty + 6, 5, 5, GOLD)
        c.rect(tx + 2, ty + 16, 13, 5, TEAM_RAMP[1])
        c.rect(tx + 3, ty + 20, 11, 2, GOLD[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_ellipse(sx + 14, sy + 3, 5, 5, CHARCOAL)
            c.px(sx + 12, sy + 1, STEEL[4])
            return
        if a == 'attack_0':
            # Winding grenade far behind shoulder with blazing lit fuse!
            ex, ey = sx - 7, sy - 9
            c.shaded_capsule(sx, sy, ex, ey, 3.0, TEAM_RAMP)
            c.shaded_ellipse(ex - 4, ey - 3, 5, 5, CHARCOAL)
            c.px(ex - 6, ey - 5, STEEL[4])
            c.line(ex - 4, ey - 8, ex - 2, ey - 12, WOOD[3], 1)
            c.shaded_ellipse(ex - 1, ey - 13, 3, 3, FIRE)
            c.px(ex - 1, ey - 13, WHITE)
        elif a == 'attack_1':
            # Powerful overhand grenade hurl forward!
            ex, ey = sx + 12, sy - 7
            c.shaded_capsule(sx, sy, ex, ey, 3.0, TEAM_RAMP)
            c.shaded_ellipse(ex + 2, ey - 1, 2.5, 2.5, SKIN)
            # Launched spinning bomb leaving hand with sizzling sparks!
            bx, by = ex + 12, ey - 5
            c.shaded_ellipse(bx, by, 5, 5, CHARCOAL)
            c.px(bx - 2, by - 2, STEEL[4])
            c.shaded_ellipse(bx + 3, by - 5, 3, 3, FIRE)
            c.px(bx + 3, by - 5, WHITE)
        elif a == 'attack_2':
            ex, ey = sx + 10, sy + 5
            c.shaded_capsule(sx, sy, ex, ey, 3.0, TEAM_RAMP)
            c.shaded_ellipse(ex + 1, ey + 1, 2.5, 2.5, SKIN)
        else:
            sway = -2 if a in ('walk_1', 'walk_2') else 2
            ex, ey = sx + 8, sy + 2 + sway
            c.shaded_capsule(sx, sy, ex, ey, 3.0, TEAM_RAMP)
            c.shaded_ellipse(ex + 4, ey - 2, 4.8, 4.8, CHARCOAL)
            c.px(ex + 2, ey - 4, STEEL[4])
            c.rect(ex + 3, ey - 7, 2, 2, BRONZE[3])
            c.px(ex + 5, ey - 9, FIRE[3])
            c.px(ex + 6, ey - 10, WHITE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_0':
            c.radial_glow(sx - 8, sy - 22, 6, (251, 146, 60, 150))
        elif a == 'attack_1':
            c.radial_glow(sx + 27, sy - 17, 7, (251, 191, 36, 165))
            c.line(sx + 14, sy - 10, sx + 22, sy - 13, OFF_WHITE, 1)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=TEAM_RAMP, legs=EGYPT_LINEN, boots=CHARCOAL,
        belt=LEATHER[1], buckle=GOLD[3],
        has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail,
        weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=30,
    )
    return c, 30, h - 3


# =============================================================================
# ERA 6: INDUSTRIAL STEAMPUNK 4TH UNIT — TESLA COIL TROOPER (테슬라 공병)
# =============================================================================

def gen_tesla_coil_trooper(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Steampunk Tesla Coil Trooper with Copper Toroid Pack, Brass Dome Helm & Lightning Arc Gun (78x74px)."""
    w, h = 78, 74

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Rounded riveted brass diving-bell insulator helmet!
        c.shaded_ellipse(cx, cy - 1, 8, 8, COPPER)
        c.armor_plate(cx - 6, cy - 7, 12, 4, BRASS, sheen=True)
        # Miniature lightning rod antenna on crown
        c.rect(cx - 1, cy - 14, 2, 6, STEEL[3])
        c.shaded_ellipse(cx, cy - 15, 2.5, 2.5, CYAN_GLOW)
        c.px(cx, cy - 15, WHITE)
        # Dual glowing electric cyan insulated goggles
        c.box(cx - 1, cy - 4, 9, 6, DARK_STEEL)
        if a != 'death_0':
            c.rect(cx + 1, cy - 3, 6, 4, CYAN_GLOW[3])
            c.rect(cx + 2, cy - 2, 4, 2, WHITE)
        # Copper breather grille
        c.box(cx + 2, cy + 3, 6, 4, BRASS)
        c.rect(cx + 4, cy + 4, 2, 2, INK)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Towering Twin-Ring Copper Tesla Dynamo Coil Pack!
        c.armor_plate(bx - 9, by + 2, 11, 16, COPPER, rivets=True)
        c.rect(bx - 7, by + 5, 7, 3, CYAN_GLOW[2])
        # Vertical insulated dynamo mast + dual brass capacitor rings
        c.box(bx - 5, by - 13, 4, 15, DARK_STEEL)
        c.box(bx - 9, by - 11, 12, 3, BRASS)
        c.box(bx - 8, by - 6, 10, 3, BRASS)
        c.shaded_ellipse(bx - 3, by - 15, 4.5, 3.5, CYAN_GLOW)
        c.ellipse(bx - 3, by - 15, 2, 1.5, WHITE)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Heavy insulated rubberized leather + brass chest capacitor gauge
        c.armor_plate(tx + 2, ty + 2, 13, 12, COPPER, rivets=True)
        c.shaded_ellipse(tx + 8, ty + 7, 3.5, 3.5, CYAN_GLOW)
        c.px(tx + 8, ty + 7, WHITE)
        c.box(tx + 4, ty + 14, 9, 6, TEAM_RAMP)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx + 2, sy, 22, 6, COPPER)
            c.box(sx + 10, sy - 2, 3, 10, BRASS)
            c.box(sx + 17, sy - 2, 3, 10, BRASS)
            return
        kick = -4 if a == 'attack_1' else (-2 if a == 'attack_2' else 0)
        gy_w = sy + 1 + (1 if a == 'walk_1' else 0)
        # Heavy Steampunk Tesla Arc Projector Rifle with triple brass induction coils!
        c.shaded_capsule(sx, sy, sx + 8 + kick, gy_w + 3, 3.0, COPPER)
        c.armor_plate(sx + 2 + kick, gy_w - 2, 17, 7, DARK_STEEL, sheen=True)
        c.box(sx + 17 + kick, gy_w - 1, 14, 5, COPPER)
        # Triple glowing brass inductor rings along barrel!
        for rx in (19, 24, 29):
            c.box(sx + rx + kick, gy_w - 4, 3, 11, BRASS)
        # Glowing plasma emitter sphere at barrel tip
        c.shaded_ellipse(sx + 33 + kick, gy_w + 1, 3.5, 3.5, CYAN_GLOW)
        c.px(sx + 33 + kick, gy_w + 1, WHITE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        # Crackling blue-white Tesla sparks around backpack coil & emitter tip!
        c.radial_glow(sx - 13, sy - 16, 6, (30, 196, 232, 140))
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 30, sy + 2, 9, CYAN_GLOW)
            c.line(sx + 19, sy - 4, sx + 28, sy - 8, CYAN_GLOW[4], 1)
            c.line(sx + 28, sy - 8, sx + 35, sy - 2, WHITE, 1)
        elif a == 'attack_0':
            c.radial_glow(sx + 33, sy + 2, 8, (128, 240, 255, 165))
            c.line(sx + 20, sy - 4, sx + 33, sy + 1, CYAN_GLOW[4], 1)

    c = draw_humanoid(
        w, h, anim,
        skin=LEATHER, torso=DARK_STEEL, legs=CHARCOAL, boots=COPPER,
        belt=BRASS[2], buckle=CYAN_GLOW[3],
        knee_armor=BRASS, has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail,
        weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29, torso_armored=True,
    )
    return c, 29, h - 3


# =============================================================================
# ERA 7: WORLD WAR 4TH UNIT — MORTAR TEAM (박격포병)
# =============================================================================

def gen_mortar_team(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD World War Trench Mortar Specialist deploying Tilted Tripod Mortar Tube & Finned Shells (84x70px)."""
    w, h = 84, 70
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        # Fallen soldier + knocked-over mortar tube on road
        def _dead_head(hc: PixelCanvas, cx: int, cy: int, a: str) -> None:
            draw_hd_face(hc, cx, cy + 1, a, SKIN, brow_col=HAIR_BROWN[0])
            hc.shaded_ellipse(cx, cy - 4, 9, 5.5, OLIVE)
            hc.rect(cx - 8, cy - 4, 16, 2, TEAM_RAMP[2])

        def _dead_wep(wc: PixelCanvas, sx: int, sy: int, a: str) -> None:
            wc.shaded_capsule(sx + 6, sy + 2, sx + 28, sy - 2, 3.2, DARK_STEEL)
            wc.box(sx + 26, sy - 5, 5, 6, IRON)

        fallen = draw_humanoid(
            w, h, 'death_0',
            skin=SKIN, torso=OLIVE, legs=KHAKI, boots=LEATHER,
            belt=LEATHER[0], buckle=BRASS[3],
            has_team_shoulder=True,
            head_fn=_dead_head, weapon_fn=_dead_wep, anchor_x=28,
        )
        c.blit(fallen, 0, 0)
        draw_smoke_puff(c, 58, gy - 12, 6)
        return c, 36, gy

    # During walk frames: gunner carries folded mortar tube across shoulder; during attack: plants tripod & fires!
    firing_stance = anim in ('attack_0', 'attack_1', 'attack_2')

    def head(hc: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(hc, cx, cy + 1, a, SKIN, brow_col=HAIR_BROWN[0])
        # Classic WW M1 / Brodie steel helmet with netting & team stripe
        hc.shaded_ellipse(cx, cy - 4, 9, 5.5, OLIVE)
        hc.rect(cx - 10, cy - 2, 20, 2, OLIVE[3])
        hc.rect(cx - 8, cy - 4, 16, 2, TEAM_RAMP[2])
        hc.rect(cx - 6, cy - 4, 12, 1, T_TRIM)

    def backpack(bc: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Canvas ammunition rucksack with 2 finned mortar shells sticking out top!
        bc.box(bx - 7, by + 3, 10, 13, KHAKI)
        bc.rect(bx - 6, by + 6, 8, 2, LEATHER[1])
        for ox in (bx - 5, bx - 1):
            bc.box(ox, by - 4, 3, 7, OLIVE)
            bc.rect(ox, by - 3, 3, 2, FIRE[2])

    def torso_detail(tc: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Webbing chest straps + ammo pouches
        tc.rect(tx + 3, ty + 2, 2, 13, KHAKI[3])
        tc.rect(tx + 12, ty + 2, 2, 13, KHAKI[3])
        tc.box(tx + 2, ty + 11, 5, 5, KHAKI)
        tc.box(tx + 10, ty + 11, 5, 5, KHAKI)
        tc.box(tx + 5, ty + 4, 7, 5, TEAM_RAMP)

    def weapon(wc: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if firing_stance:
            # Gunner bracing & dropping finned mortar bomb into tube!
            ex, ey = sx + 12, sy - 6 if a == 'attack_0' else (sy + 2 if a == 'attack_1' else sy)
            wc.shaded_capsule(sx, sy, ex, ey, 3.0, OLIVE)
            wc.shaded_ellipse(ex + 2, ey, 2.5, 2.5, SKIN)
            if a == 'attack_0':
                # Holding finned mortar shell right above muzzle!
                wc.shaded_capsule(ex + 4, ey - 2, ex + 10, ey - 8, 2.5, OLIVE)
                wc.rect(ex + 7, ey - 7, 3, 3, FIRE[2])
        else:
            # Carrying heavy steel mortar barrel tilted across shoulder while marching!
            sway = -1 if a in ('walk_1', 'walk_3') else 1
            wc.shaded_capsule(sx, sy, sx + 9, sy - 3 + sway, 3.0, OLIVE)
            wc.shaded_capsule(sx - 6, sy + 2 + sway, sx + 22, sy - 11 + sway, 3.5, DARK_STEEL)
            wc.box(sx + 20, sy - 14 + sway, 5, 7, IRON)
            wc.rect(sx + 1, sy - 3 + sway, 5, 3, TEAM_RAMP[2])

    # Render gunner cleanly using draw_humanoid
    soldier = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=OLIVE, legs=KHAKI, boots=LEATHER,
        belt=LEATHER[0], buckle=BRASS[3],
        has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail,
        weapon_fn=weapon, anchor_x=24,
    )
    c.blit(soldier, 0, 0)

    # Planted Trench Mortar Tube & Bipod directly in front of gunner during attack frames!
    if firing_stance:
        mt = c.part()
        recoil = 3 if anim == 'attack_1' else 0
        # Heavy steel baseplate anchored on ground
        mt.armor_plate(42, gy - 5, 16, 5, IRON, sheen=False)
        # Bipod supporting legs
        mt.shaded_capsule(55, gy - 20 + recoil, 64, gy - 2, 2.0, DARK_STEEL)
        mt.shaded_capsule(55, gy - 20 + recoil, 50, gy - 2, 1.8, IRON)
        # Tilted high-elevation steel mortar cannon tube!
        mt.shaded_capsule(47, gy - 5, 65 - recoil, gy - 32 + recoil, 4.2, DARK_STEEL)
        mt.shaded_capsule(49, gy - 7, 63 - recoil, gy - 29 + recoil, 2.6, STEEL)
        mt.box(61 - recoil, gy - 35 + recoil, 8, 5, IRON)
        mt.rect(52, gy - 17, 6, 4, TEAM_RAMP[2])
        c.blit_part(mt, INK)

        if anim == 'attack_1':
            draw_muzzle_flash(c, 65, gy - 36, 9, FIRE)
            draw_smoke_puff(c, 69, gy - 41, 6)
        elif anim == 'attack_2':
            draw_smoke_puff(c, 67, gy - 38, 5)

    return c, 36, gy


# =============================================================================
# ERA 8: MODERN 4TH UNIT — RIOT JUGGERNAUT (중장 저거너트)
# =============================================================================

def gen_riot_juggernaut(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Modern EOD Ballistic Juggernaut Tank with Heavy Riot Shield & Breaching Shotgun (82x74px)."""
    w, h = 82, 74

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Massive bulky modern blast-suit collar + thick armored EOD helmet!
        c.armor_plate(cx - 10, cy + 2, 20, 7, CHARCOAL, rivets=True)
        c.shaded_ellipse(cx, cy - 2, 9.5, 8.5, DARK_STEEL)
        c.armor_plate(cx - 7, cy - 9, 14, 4, TEAM_RAMP, sheen=True)
        # Thick armored ballistic face visor with glowing cyan tactical HUD slit!
        c.box(cx - 1, cy - 5, 11, 8, CHARCOAL)
        if a != 'death_0':
            c.rect(cx + 1, cy - 3, 8, 3, CYAN_GLOW[3])
            c.rect(cx + 2, cy - 3, 6, 1, WHITE)
        # Comms antenna on rear of helmet
        c.rect(cx - 8, cy - 16, 2, 9, STEEL[3])
        c.px(cx - 8, cy - 16, FIRE[3])

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Bulky Kevlar & ceramic trauma-plate backpack with radio pack
        c.armor_plate(bx - 8, by + 1, 10, 17, CHARCOAL, rivets=True)
        c.rect(bx - 6, by + 3, 6, 3, TEAM_RAMP[2])

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Heavy layered Kevlar juggernaut vest with ceramic plate & team shoulder straps
        c.armor_plate(tx - 1, ty + 1, 19, 16, CHARCOAL, rivets=True)
        c.armor_plate(tx + 2, ty + 3, 13, 10, SLATE_ARMOR, sheen=True)
        c.rect(tx + 4, ty + 5, 9, 2, TEAM_RAMP[3])
        c.rect(tx + 5, ty + 9, 7, 2, HAZARD_YELLOW[3])
        # Heavy groin blast apron
        c.box(tx + 3, ty + 17, 11, 5, DARK_STEEL)

    def shield(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        # Massive Modern Tactical Ballistic Riot Shield with armored viewport & strobe!
        push = 4 if a == 'attack_1' else (-2 if a == 'hurt_0' else 0)
        shx = sx + push + 2
        shy = sy - 11
        c.armor_plate(shx - 5, shy, 16, 34, DARK_STEEL, rivets=True)
        c.rect_outline(shx - 5, shy, 16, 34, CHARCOAL[0])
        # Bold team tactical stripe & warning chevron
        c.rect(shx - 4, shy + 13, 14, 5, TEAM_RAMP[2])
        c.rect(shx - 3, shy + 14, 12, 2, T_TRIM)
        c.rect(shx - 3, shy + 27, 12, 3, HAZARD_YELLOW[3])
        # Armored ballistic glass viewport window!
        c.box(shx - 3, shy + 4, 12, 6, CHARCOAL)
        c.rect(shx - 1, shy + 5, 8, 4, CYAN_GLOW[2])
        c.rect(shx, shy + 5, 5, 2, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx + 2, sy + 1, 20, 5, CHARCOAL)
            return
        kick = -4 if a == 'attack_1' else (-2 if a == 'attack_2' else 0)
        gy_w = sy + 2
        # Heavy armored arm extending a tactical breaching auto-shotgun around the riot shield!
        c.shaded_capsule(sx, sy, sx + 12 + kick, gy_w + 1, 3.6, DARK_STEEL)
        c.armor_plate(sx + 10 + kick, gy_w - 2, 22, 6, CHARCOAL, sheen=True)
        c.rect(sx + 22 + kick, gy_w - 3, 11, 3, STEEL[3])
        c.rect(sx + 16 + kick, gy_w + 4, 7, 3, DARK_STEEL[2])  # drum magazine!

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_muzzle_flash(c, sx + 30, sy + 1, 10, FIRE)
            draw_smoke_puff(c, sx + 36, sy - 2, 4)

    c = draw_humanoid(
        w, h, anim,
        skin=CHARCOAL, torso=CHARCOAL, legs=DARK_STEEL, boots=CHARCOAL,
        belt=CHARCOAL[0], buckle=STEEL[3],
        knee_armor=SLATE_ARMOR, has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, torso_detail_fn=torso_detail,
        shield_fn=shield, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=30, torso_armored=True,
    )
    return c, 30, h - 3


# =============================================================================
# ERA 9: FUTURE 4TH UNIT — HOVER DRONE (플라즈마 드론)
# =============================================================================

def gen_hover_drone(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Sleek Futuristic Anti-Gravity Plasma Hover Drone with Twin Thrusters & Optic Core (78x62px)."""
    w, h = 78, 62
    c = PixelCanvas(w, h)
    gy = h - 3
    cx = 36

    if anim == 'death_0':
        # Crashed smoking drone wreckage on ground
        p = c.part()
        p.shaded_ellipse(cx, gy - 11, 22, 9, TITANIUM)
        p.armor_plate(cx - 12, gy - 18, 22, 10, TEAM_RAMP, sheen=False)
        p.line(cx - 8, gy - 16, cx + 10, gy - 6, INK, 2)
        p.box(cx + 12, gy - 10, 14, 5, DARK_STEEL)
        c.blit_part(p, INK)
        draw_smoke_puff(c, cx - 4, gy - 22, 7)
        draw_smoke_puff(c, cx + 12, gy - 16, 5)
        return c, cx, gy

    # Hover tilt & engine thruster pulse
    tilt = 3 if anim == 'attack_1' else (-3 if anim == 'hurt_0' else 0)
    bob = -2 if anim in ('walk_1', 'walk_3') else (2 if anim == 'attack_1' else 0)
    cy = 27 + bob

    # 1. Rear armored anti-gravity turbine wing pod
    wing_p = c.part()
    wing_p.shaded_poly(
        [(cx - 24, cy - 10 + tilt), (cx - 4, cy - 15), (cx + 2, cy - 4), (cx - 18, cy + 2 + tilt)],
        TITANIUM,
    )
    wing_p.armor_plate(cx - 21, cy - 7 + tilt, 13, 6, TEAM_RAMP, sheen=True)
    # Glowing cyan turbine intake ring
    wing_p.shaded_ellipse(cx - 20, cy + 5 + tilt, 6, 3.5, DARK_STEEL)
    wing_p.ellipse(cx - 20, cy + 6 + tilt, 4, 2, CYAN_GLOW[3])
    c.blit_part(wing_p, INK_SOFT)

    # 2. Central sleek aerodynamic titanium hunter-killer hull!
    hull_p = c.part()
    hull_p.shaded_poly(
        [
            (cx - 18, cy - 4),
            (cx - 4, cy - 14),
            (cx + 18, cy - 10),
            (cx + 26, cy),
            (cx + 18, cy + 9),
            (cx - 12, cy + 10),
        ],
        TITANIUM,
    )
    # Sovereign team upper cowling armor plate + gleaming diagonal sheen
    hull_p.shaded_poly(
        [(cx - 12, cy - 5), (cx - 2, cy - 13), (cx + 16, cy - 9), (cx + 14, cy - 2), (cx - 8, cy - 1)],
        TEAM_RAMP,
    )
    hull_p.line(cx - 2, cy - 11, cx + 13, cy - 8, T_TRIM, 2)
    # Dorsal sensor fin
    hull_p.shaded_poly([(cx - 10, cy - 12), (cx - 17, cy - 21), (cx - 4, cy - 14)], STEEL)
    hull_p.px(cx - 15, cy - 19, CYAN_GLOW[3])
    # Glowing forward cyclops targeting optic lens!
    hull_p.shaded_ellipse(cx + 18, cy - 2, 5.5, 5, DARK_STEEL)
    hull_p.shaded_ellipse(cx + 19, cy - 2, 4, 3.5, (T_DEEP, T_SHADE, T_GLOW, WHITE))
    hull_p.ellipse(cx + 20, cy - 2, 2, 1.5, WHITE)
    # Ventral repulsor hover ring
    hull_p.box(cx - 8, cy + 8, 18, 4, DARK_STEEL)
    hull_p.rect(cx - 5, cy + 10, 12, 2, CYAN_GLOW[3])
    c.blit_part(hull_p, INK_SOFT)

    # 3. Underslung Twin Rapid-Fire Plasma Repeater Barrels!
    gun_p = c.part()
    kick = -4 if anim == 'attack_1' else (-2 if anim == 'attack_2' else 0)
    gun_p.armor_plate(cx + 2 + kick, cy + 4, 18, 7, DARK_STEEL, sheen=True)
    gun_p.box(cx + 18 + kick, cy + 3, 14, 3, STEEL)
    gun_p.box(cx + 16 + kick, cy + 8, 15, 3, STEEL)
    gun_p.rect(cx + 22 + kick, cy + 4, 8, 1, T_GLOW)
    gun_p.rect(cx + 20 + kick, cy + 9, 8, 1, T_GLOW)
    c.blit_part(gun_p, INK_SOFT)

    # Crisp outer silhouette
    c.add_outline(INK)

    # 4. Luminous anti-gravity plasma thruster jets & firing muzzle flare!
    flame_h = 9 if anim in ('walk_1', 'walk_3', 'attack_1') else 6
    c.shaded_poly([(cx - 24, cy + 8 + tilt), (cx - 20, cy + 8 + flame_h + tilt), (cx - 16, cy + 8 + tilt)], CYAN_GLOW)
    c.shaded_poly([(cx - 4, cy + 12), (cx + 1, cy + 12 + flame_h + 2), (cx + 6, cy + 12)], CYAN_GLOW)
    c.line(cx + 1, cy + 12, cx + 1, cy + 12 + flame_h - 2, WHITE, 2)
    c.radial_glow(cx + 1, cy + 14, 8, (30, 196, 232, 130))

    if anim == 'attack_1':
        draw_muzzle_flash(c, cx + 29, cy + 5, 8, CYAN_GLOW)
        draw_muzzle_flash(c, cx + 27, cy + 9, 7, CYAN_GLOW)
    elif anim == 'attack_0':
        c.radial_glow(cx + 32, cy + 6, 7, (128, 240, 255, 165))
    elif anim == 'hurt_0':
        draw_hit_sparks(c, cx + 10, cy - 2, scale=1)

    return c, cx, gy


# =============================================================================
# ERA 10: INTERSTELLAR COSMIC 4TH UNIT — STAR ARCHON (성운 집정관)
# =============================================================================

def gen_star_archon(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Floating Interstellar Star Archon with Radiant Celestial Halo, Gilded Mantle & Twin Antimatter Orbs (84x80px)."""
    w, h = 84, 80
    c = PixelCanvas(w, h)
    gy = h - 3
    cx = 36

    if anim == 'death_0':
        # Shattered obsidian armor mantle & fading cosmic star-core
        p = c.part()
        p.shaded_poly([(cx - 18, gy - 4), (cx - 6, gy - 18), (cx + 18, gy - 12), (cx + 22, gy - 4)], OBSIDIAN)
        p.box(cx - 6, gy - 16, 14, 6, GOLD)
        p.shaded_ellipse(cx + 4, gy - 10, 6, 4, COSMIC_VIOLET)
        c.blit_part(p, INK)
        c.radial_glow(cx + 4, gy - 12, 12, (155, 59, 230, 140))
        return c, cx, gy

    bob = -3 if anim in ('walk_1', 'walk_3') else (2 if anim == 'attack_1' else 0)
    lean = 4 if anim == 'attack_1' else (-3 if anim == 'attack_0' else (-4 if anim == 'hurt_0' else 1))
    bx = cx + lean
    by = 34 + bob

    # 1. Radiant Floating Golden Celestial Halo Ring behind Archon's shoulders!
    halo_p = c.part()
    halo_r = 16 if anim != 'attack_1' else 18
    for deg in range(0, 360, 12):
        rad = math.radians(deg)
        hx_p = int(round(bx - 2 + math.cos(rad) * halo_r))
        hy_p = int(round(by - 12 + math.sin(rad) * halo_r))
        halo_p.ellipse(hx_p, hy_p, 1.8, 1.8, GOLD[3] if (deg % 24 == 0) else SOLAR_GOLD[2])
    # 4 Cardinal star points on cosmic halo!
    for dx, dy in ((0, -halo_r - 4), (0, halo_r + 3), (-halo_r - 3, 0), (halo_r + 3, 0)):
        halo_p.shaded_ellipse(bx - 2 + dx, by - 12 + dy, 2.5, 2.5, SOLAR_GOLD)
        halo_p.px(bx - 2 + dx, by - 12 + dy, WHITE)
    c.blit_part(halo_p, INK_SOFT)

    # 2. Flowing Levitating Obsidian & Team-Infused Cosmic Energy Robe Tail (no feet — pure floating deity!)
    tail_p = c.part()
    sway = 5 if anim in ('walk_1', 'walk_3', 'attack_1') else 0
    tail_p.shaded_poly(
        [
            (bx - 10, by + 6),
            (bx + 10, by + 6),
            (bx + 7, by + 24),
            (bx - 3 - sway, by + 35),
            (bx - 13 - sway, by + 26),
        ],
        OBSIDIAN,
    )
    tail_p.shaded_poly(
        [(bx - 6, by + 9), (bx + 6, by + 9), (bx + 3, by + 25), (bx - 5 - sway // 2, by + 33)],
        TEAM_RAMP,
    )
    tail_p.shaded_poly(
        [(bx - 2, by + 12), (bx + 2, by + 12), (bx, by + 25), (bx - 3 - sway // 2, by + 31)],
        COSMIC_VIOLET,
    )
    tail_p.line(bx - 1, by + 12, bx - 4 - sway // 2, by + 30, T_TRIM, 1)
    # Floating golden sovereign trim strips
    tail_p.line(bx - 10, by + 8, bx - 12 - sway, by + 25, GOLD[3], 2)
    tail_p.line(bx + 9, by + 8, bx + 6, by + 23, GOLD[3], 2)
    c.blit_part(tail_p, INK_SOFT)

    # 3. Sculpted Gilded-Obsidian Celestial Armor Torso & Towering Floating Pauldrons!
    torso_p = c.part()
    torso_p.shaded_poly(
        [(bx - 11, by - 8), (bx + 11, by - 8), (bx + 9, by + 9), (bx - 9, by + 9)],
        OBSIDIAN,
    )
    torso_p.armor_plate(bx - 7, by - 6, 14, 14, TEAM_RAMP, sheen=True)
    torso_p.rect_outline(bx - 7, by - 6, 14, 14, GOLD[3])
    # Glowing cosmic nebula heart crystal in chest!
    torso_p.shaded_ellipse(bx, by, 4, 4.5, COSMIC_VIOLET)
    torso_p.ellipse(bx, by, 2, 2, WHITE)
    # Majestic floating gilded & team-inlaid shoulder wings
    torso_p.shaded_poly([(bx - 16, by - 12), (bx - 6, by - 10), (bx - 9, by - 1), (bx - 18, by - 5)], GOLD)
    torso_p.rect(bx - 14, by - 9, 6, 3, T_MID)
    torso_p.shaded_poly([(bx + 16, by - 12), (bx + 6, by - 10), (bx + 9, by - 1), (bx + 18, by - 5)], GOLD)
    torso_p.rect(bx + 8, by - 9, 6, 3, T_MID)
    c.blit_part(torso_p, INK_SOFT)

    # 4. Faceless Hooded Celestial Crown with Blazing Star-Core Visage!
    head_p = c.part()
    head_p.shaded_poly(
        [(bx - 9, by - 11), (bx - 6, by - 25), (bx + 2, by - 27), (bx + 10, by - 22), (bx + 9, by - 10)],
        TEAM_RAMP,
    )
    head_p.shaded_poly([(bx - 4, by - 24), (bx + 1, by - 30), (bx + 6, by - 23)], GOLD)
    head_p.rect(bx - 7, by - 21, 15, 2, GOLD[3])
    # Deep star-void hood cavity with radiant blazing twin star eyes!
    head_p.shaded_ellipse(bx + 2, by - 16, 5.5, 5.5, (INK, INK, OBSIDIAN[0], OBSIDIAN[1]))
    head_p.rect(bx + 1, by - 17, 6, 2, T_GLOW)
    head_p.rect(bx + 2, by - 17, 4, 2, WHITE)
    c.blit_part(head_p, INK_SOFT)

    # 5. Outstretched Cosmic Conduit Arms + Orbiting Antimatter Star-Nova Orb!
    arm_p = c.part()
    if anim == 'attack_0':
        # Gathering twin cosmic spheres overhead into singularity!
        arm_p.shaded_capsule(bx + 6, by - 5, bx + 16, by - 17, 3.0, OBSIDIAN)
        arm_p.box(bx + 12, by - 17, 5, 4, GOLD)
        orb_x, orb_y, orb_r = bx + 20, by - 21, 7.0
    elif anim == 'attack_1':
        # Unleashing blazing forward Antimatter Star Nova!
        arm_p.shaded_capsule(bx + 6, by - 4, bx + 22, by - 5, 3.2, OBSIDIAN)
        arm_p.box(bx + 18, by - 7, 5, 5, GOLD)
        orb_x, orb_y, orb_r = bx + 31, by - 5, 8.5
    elif anim == 'attack_2':
        arm_p.shaded_capsule(bx + 6, by - 4, bx + 18, by + 2, 3.0, OBSIDIAN)
        arm_p.box(bx + 15, by, 5, 4, GOLD)
        orb_x, orb_y, orb_r = bx + 24, by + 2, 5.0
    else:
        arm_p.shaded_capsule(bx + 6, by - 4, bx + 17, by - 6, 3.0, OBSIDIAN)
        arm_p.box(bx + 14, by - 8, 5, 4, GOLD)
        orb_x, orb_y, orb_r = bx + 24, by - 10 + (bob // 2), 6.0

    arm_p.shaded_ellipse(orb_x, orb_y, orb_r, orb_r, COSMIC_VIOLET)
    arm_p.shaded_ellipse(orb_x, orb_y, max(2.5, orb_r * 0.55), max(2.5, orb_r * 0.55), PLASMA_PINK)
    arm_p.ellipse(orb_x, orb_y, 2.5, 2.5, WHITE)
    c.blit_part(arm_p, INK_SOFT)

    # Crisp outer silhouette
    c.add_outline(INK)

    # 6. Luminous cosmic halo, floating star motes & antimatter burst flare!
    c.radial_glow(bx, by + 26, 9, (155, 59, 230, 130))
    c.radial_glow(orb_x, orb_y, orb_r + 5, (212, 122, 255, 165))
    if anim == 'attack_1':
        draw_muzzle_flash(c, orb_x + 3, orb_y, 10, COSMIC_VIOLET)
    elif anim == 'attack_0':
        draw_hit_sparks(c, orb_x, orb_y, scale=1)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, bx + 8, by - 8, scale=1)

    return c, cx, gy


EXTRA_UNIT_GENERATORS = {
    'shaman': gen_shaman,
    'scorpion_guard': gen_scorpion_guard,
    'centurion': gen_centurion,
    'grenadier': gen_grenadier,
    'tesla_coil_trooper': gen_tesla_coil_trooper,
    'mortar_team': gen_mortar_team,
    'riot_juggernaut': gen_riot_juggernaut,
    'hover_drone': gen_hover_drone,
    'star_archon': gen_star_archon,
}
