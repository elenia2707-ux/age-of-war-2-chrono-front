"""HD 1:1 Metal-Slug / Kingdom-Rush style pixel-art generators for Eras 1, 3, and 4 (10 units):
- Era 1 (Stone Age): clubman (72x72), slinger (72x72), dino_rider (116x104)
- Era 3 (Ancient): spearman (78x70), archer (72x70), chariot (128x102)
- Era 4 (Medieval): knight (74x70), crossbowman (72x70), heavy_cavalry (126x108), catapult (124x96)
"""

from __future__ import annotations

import math

from .canvas import PixelCanvas
from .humanoid import (
    TEAM_RAMP,
    draw_hd_face,
    draw_hit_sparks,
    draw_humanoid,
    draw_slash_smear,
    draw_smoke_puff,
)
from .palettes import (
    BONE,
    BRONZE,
    CHARCOAL,
    DINO_BELLY,
    DINO_GREEN,
    FIRE,
    FUR,
    FUR_DARK,
    GOLD,
    HAIR_BROWN,
    HORSE_BAY,
    HORSE_GREY,
    INK,
    INK_SOFT,
    IRON,
    KHAKI,
    LEATHER,
    OFF_WHITE,
    SKIN,
    SKIN_TAN,
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
    WOOD_DARK,
)


# =============================================================================
# ERA 1: STONE AGE (clubman, slinger, dino_rider)
# =============================================================================

def gen_clubman(anim: str) -> tuple[PixelCanvas, int, int]:
    """Fierce Stone-Age Caveman Warrior with bone-spiked war club & leopard pelt (72x72px)."""
    w, h = 72, 72

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN, brow_col=FUR_DARK[0], beard_ramp=FUR_DARK, warpaint=T_LIGHT)
        # Shaggy wild caveman mane
        c.shaded_ellipse(cx - 2, cy - 6, 8, 5, FUR_DARK)
        c.shaded_ellipse(cx - 7, cy - 1, 4, 6, FUR_DARK)
        c.poly([(cx - 8, cy - 7), (cx - 4, cy - 12), (cx - 1, cy - 7)], FUR_DARK[2])
        c.poly([(cx - 3, cy - 8), (cx + 1, cy - 13), (cx + 4, cy - 8)], FUR_DARK[3])
        c.poly([(cx + 2, cy - 7), (cx + 6, cy - 10), (cx + 6, cy - 5)], FUR_DARK[2])
        # Tribal team headband + twin feathers & bone clasp
        c.box(cx - 8, cy - 5, 16, 4, TEAM_RAMP)
        c.rect(cx - 6, cy - 4, 12, 1, T_TRIM)
        fl = -2 if a in ('walk_1', 'walk_3', 'attack_1') else 0
        c.shaded_capsule(cx - 7, cy - 5, cx - 14, cy - 11 + fl, 1.5, TEAM_RAMP)
        c.shaded_capsule(cx - 6, cy - 4, cx - 13, cy - 7 + fl, 1.2, (BONE[1], BONE[2], BONE[3], BONE[4]))
        c.shaded_ellipse(cx - 6, cy - 4, 2, 2, BONE)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Leopard spots & ragged fur pelt hem
        for sx, sy in ((tx + 4, ty + 4), (tx + 11, ty + 6), (tx + 6, ty + 10), (tx + 12, ty + 11)):
            c.rect(sx, sy, 2, 2, FUR[0])
            c.px(sx, sy, FUR_DARK[1])
        # Bone fang tribal necklace
        c.line(tx + 3, ty + 2, tx + 13, ty + 3, LEATHER[0], 1)
        for nx in (tx + 5, tx + 8, tx + 11):
            c.rect(nx, ty + 3, 2, 3, BONE[3])
            c.px(nx, ty + 5, WHITE)
        # Bold team tribal chest warband
        c.box(tx + 2, ty + 7, 13, 4, TEAM_RAMP)
        # Jagged pelt loincloth hem
        for jx in range(tx + 2, tx + 15, 3):
            c.poly([(jx, ty + 19), (jx + 2, ty + 23), (jx + 3, ty + 19)], FUR[2])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx + 2, sy + 2, sx + 22, sy + 2, 3.0, WOOD)
            c.shaded_ellipse(sx + 21, sy + 2, 6, 4, WOOD)
            c.poly([(sx + 21, sy - 2), (sx + 23, sy - 6), (sx + 25, sy - 2)], BONE[4])
            return
        if a == 'attack_0':
            # Coiled high behind head
            ex, ey = sx - 4, sy - 9
            c.shaded_capsule(sx, sy, ex, ey, 3.0, SKIN)
            c.shaded_capsule(ex, ey, ex - 10, ey - 14, 2.5, WOOD)
            c.shaded_ellipse(ex - 11, ey - 16, 6, 5, WOOD)
            c.poly([(ex - 16, ey - 17), (ex - 20, ey - 19), (ex - 15, ey - 14)], BONE[4])
            c.poly([(ex - 11, ey - 20), (ex - 11, ey - 25), (ex - 8, ey - 20)], BONE[4])
        elif a == 'attack_1':
            # Crushing downward forward slam!
            ex, ey = sx + 10, sy + 1
            c.shaded_capsule(sx, sy, ex, ey, 3.2, SKIN)
            c.shaded_capsule(ex, ey, ex + 18, ey + 7, 3.0, WOOD)
            c.shaded_ellipse(ex + 19, ey + 8, 7, 5, WOOD)
            c.poly([(ex + 21, ey + 3), (ex + 25, ey - 1), (ex + 24, ey + 6)], BONE[4])
            c.poly([(ex + 24, ey + 8), (ex + 29, ey + 9), (ex + 24, ey + 11)], BONE[4])
            c.rect(ex + 2, ey - 2, 4, 5, LEATHER[2])
        elif a == 'attack_2':
            ex, ey = sx + 9, sy + 6
            c.shaded_capsule(sx, sy, ex, ey, 3.0, SKIN)
            c.shaded_capsule(ex, ey, ex + 15, ey + 13, 2.8, WOOD)
            c.shaded_ellipse(ex + 16, ey + 14, 6, 5, WOOD)
            c.poly([(ex + 20, ey + 13), (ex + 25, ey + 14), (ex + 20, ey + 16)], BONE[3])
        elif a == 'hurt_0':
            ex, ey = sx + 5, sy - 6
            c.shaded_capsule(sx, sy, ex, ey, 3.0, SKIN)
            c.shaded_capsule(ex, ey, ex + 10, ey - 10, 2.6, WOOD)
            c.shaded_ellipse(ex + 11, ey - 11, 5, 4, WOOD)
        else:
            sway = -2 if a in ('walk_1', 'walk_2') else 2
            ex, ey = sx + 7, sy + 2 + sway
            c.shaded_capsule(sx, sy, ex, ey, 3.0, SKIN)
            c.shaded_capsule(ex, ey, ex + 14, ey - 10 + sway, 2.8, WOOD)
            c.shaded_ellipse(ex + 16, ey - 12 + sway, 6, 5, WOOD)
            c.poly([(ex + 16, ey - 16 + sway), (ex + 18, ey - 21 + sway), (ex + 19, ey - 15 + sway)], BONE[4])
            c.poly([(ex + 20, ey - 12 + sway), (ex + 25, ey - 13 + sway), (ex + 20, ey - 9 + sway)], BONE[3])
            c.rect(ex - 1, ey - 1, 3, 4, LEATHER[2])

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 16, sy - 2, 18, FIRE[2], FIRE[4])

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=FUR, legs=SKIN, boots=LEATHER,
        belt=LEATHER[1], buckle=BONE[3],
        has_team_shoulder=False,
        head_fn=head, weapon_fn=weapon, torso_detail_fn=torso_detail, post_fx_fn=post_fx,
        anchor_x=30,
    )
    return c, 30, h - 3


def gen_slinger(anim: str) -> tuple[PixelCanvas, int, int]:
    """Agile Stone-Age Hunter Slinger with fluttering bandana & whirling leather sling (72x72px)."""
    w, h = 72, 72

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN_TAN, brow_col=FUR_DARK[0], warpaint=BONE[3])
        # Tied wild hunter hair topknot
        c.shaded_ellipse(cx - 2, cy - 6, 8, 4, FUR_DARK)
        c.shaded_ellipse(cx - 7, cy - 8, 4, 4, FUR_DARK)
        c.rect(cx - 8, cy - 4, 4, 7, FUR_DARK[1])
        # Bright team bandana + flowing twin tails
        c.box(cx - 8, cy - 5, 16, 4, TEAM_RAMP)
        c.rect(cx - 6, cy - 4, 12, 1, T_TRIM)
        tail = -3 if a in ('walk_1', 'walk_3', 'attack_1') else 2
        c.shaded_capsule(cx - 7, cy - 4, cx - 16, cy + tail, 1.5, TEAM_RAMP)
        c.shaded_capsule(cx - 7, cy - 2, cx - 14, cy + 4 + tail // 2, 1.2, TEAM_RAMP)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Leather ammo satchel stuffed with river stones
        c.box(bx - 5, by + 6, 8, 10, LEATHER)
        c.rect(bx - 4, by + 8, 6, 2, LEATHER[0])
        c.shaded_ellipse(bx - 3, by + 6, 2.5, 2.5, STONE)
        c.shaded_ellipse(bx, by + 5, 2.5, 2.5, STONE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.line(sx + 2, sy + 2, sx + 15, sy + 4, LEATHER[2], 2)
            c.shaded_ellipse(sx + 17, sy + 4, 4, 3, STONE)
            return
        if a == 'attack_0':
            # Whirling sling high overhead!
            ex, ey = sx + 4, sy - 11
            c.shaded_capsule(sx, sy, ex, ey, 2.8, SKIN_TAN)
            c.line(ex, ey, ex - 10, ey - 10, LEATHER[3], 2)
            c.line(ex, ey, ex + 12, ey - 8, LEATHER[2], 2)
            c.shaded_ellipse(ex - 11, ey - 10, 4, 3.5, STONE)
            # Motion whirl arc
            c.line(ex - 9, ey - 12, ex + 9, ey - 11, OFF_WHITE, 1)
        elif a == 'attack_1':
            # Whipping forward launch!
            ex, ey = sx + 11, sy - 4
            c.shaded_capsule(sx, sy, ex, ey, 3.0, SKIN_TAN)
            c.line(ex, ey, ex + 19, ey - 6, LEATHER[3], 2)
            c.line(ex, ey, ex + 15, ey, LEATHER[2], 2)
            c.shaded_ellipse(ex + 20, ey - 6, 4, 4, STONE)
        elif a == 'attack_2':
            ex, ey = sx + 9, sy + 5
            c.shaded_capsule(sx, sy, ex, ey, 2.8, SKIN_TAN)
            c.line(ex, ey, ex + 14, ey + 9, LEATHER[2], 2)
        else:
            sway = 2 if a in ('walk_0', 'walk_3') else -2
            ex, ey = sx + 7, sy + 4
            c.shaded_capsule(sx, sy, ex, ey, 2.8, SKIN_TAN)
            c.line(ex, ey, ex + 11 + sway, ey + 11, LEATHER[3], 2)
            c.line(ex, ey, ex + 7 + sway, ey + 12, LEATHER[1], 2)
            c.shaded_ellipse(ex + 10 + sway, ey + 12, 3.5, 3, STONE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.line(sx + 32, sy - 11, sx + 39, sy - 12, OFF_WHITE, 2)
            c.px(sx + 39, sy - 12, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN_TAN, torso=FUR, legs=SKIN_TAN, boots=LEATHER,
        belt=T_MID, buckle=BONE[3],
        has_team_sash=True, has_team_shoulder=False,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=30,
    )
    return c, 30, h - 3


def gen_dino_rider(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Ferocious Scaled Raptor/T-Rex Dinosaur Mount + Tribal Spearman (116x104px)."""
    w, h = 116, 104
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.shaded_ellipse(52, gy - 14, 30, 12, DINO_GREEN)
        p.shaded_ellipse(54, gy - 10, 22, 6, DINO_BELLY)
        p.shaded_ellipse(84, gy - 11, 13, 8, DINO_GREEN)
        # Knocked-out X eye
        p.line(86, gy - 15, 90, gy - 11, INK, 2)
        p.line(90, gy - 15, 86, gy - 11, INK, 2)
        p.shaded_poly([(24, gy - 14), (4, gy - 7), (24, gy - 6)], DINO_GREEN)
        p.box(42, gy - 23, 18, 9, TEAM_RAMP)
        p.shaded_ellipse(32, gy - 21, 6, 6, SKIN)
        p.shaded_capsule(37, gy - 22, 68, gy - 24, 1.5, WOOD)
        p.poly([(67, gy - 27), (76, gy - 24), (67, gy - 21)], BONE[4])
        c.blit_part(p, INK)
        draw_smoke_puff(c, 74, gy - 18, 7)
        draw_smoke_puff(c, 36, gy - 12, 5)
        return c, 58, gy

    if anim == 'walk_0':
        fl, bl, bob, tail_dy, jaw = 10, -10, 0, 3, 2
    elif anim == 'walk_1':
        fl, bl, bob, tail_dy, jaw = 2, -2, -4, -2, 1
    elif anim == 'walk_2':
        fl, bl, bob, tail_dy, jaw = -10, 10, 0, -4, 2
    elif anim == 'walk_3':
        fl, bl, bob, tail_dy, jaw = -2, 2, -4, 1, 1
    elif anim == 'attack_0':
        fl, bl, bob, tail_dy, jaw = -5, -11, -3, 5, 5
    elif anim == 'attack_1':
        fl, bl, bob, tail_dy, jaw = 13, -8, 2, -5, 11
    elif anim == 'attack_2':
        fl, bl, bob, tail_dy, jaw = 8, -6, 1, -1, 3
    else:  # hurt_0
        fl, bl, bob, tail_dy, jaw = -7, -5, -4, 4, 6

    dx = 5 if anim == 'attack_1' else (-5 if anim == 'hurt_0' else 0)
    bx = 54 + dx
    by = gy - 36 + bob

    # 1. Back Dino Leg (muscular thigh + clawed foot)
    bl_p = c.part()
    dark_dino = (DINO_GREEN[0], DINO_GREEN[0], DINO_GREEN[1], DINO_GREEN[2])
    bl_p.shaded_capsule(bx - 8, by + 6, bx - 12 + bl // 2, by + 20, 7.5, dark_dino)
    bl_p.shaded_capsule(bx - 12 + bl // 2, by + 20, bx - 8 + bl, gy - 4, 4.5, dark_dino)
    bl_p.box(bx - 12 + bl, gy - 6, 14, 6, dark_dino)
    bl_p.poly([(bx + 1 + bl, gy - 5), (bx + 6 + bl, gy - 2), (bx + 1 + bl, gy)], BONE[3])
    c.blit_part(bl_p, INK)

    # 2. Sweeping Muscular Dino Tail + Dorsal Spikes
    tail_p = c.part()
    tail_pts = [
        (bx - 16, by - 8),
        (bx - 48, by - 4 + tail_dy),
        (bx - 36, by + 7 + tail_dy),
        (bx - 12, by + 10),
    ]
    tail_p.shaded_poly(tail_pts, DINO_GREEN)
    for sp_i in range(4):
        sx = bx - 22 - sp_i * 7
        sy = by - 7 + int(tail_dy * (sp_i / 4.0))
        tail_p.poly([(sx - 2, sy + 1), (sx, sy - 5), (sx + 3, sy + 1)], DINO_BELLY[3])
    c.blit_part(tail_p, INK)

    # 3. Massive Scaled Dino Torso & Pale Ribbed Belly
    body_p = c.part()
    body_p.shaded_ellipse(bx, by, 24, 15, DINO_GREEN, light_x=-0.3, light_y=-0.5)
    body_p.shaded_ellipse(bx + 2, by + 8, 17, 7, DINO_BELLY)
    # Tiger stripes & armored dorsal scales
    for stripe_x in (bx - 12, bx - 4, bx + 4, bx + 11):
        body_p.line(stripe_x, by - 12, stripe_x - 3, by - 1, DINO_GREEN[0], 3)
        body_p.poly([(stripe_x - 2, by - 13), (stripe_x, by - 18), (stripe_x + 3, by - 13)], DINO_BELLY[3])
    # Tiny clawed fore-arm
    body_p.shaded_capsule(bx + 17, by + 4, bx + 25, by + 10, 2.5, DINO_GREEN)
    body_p.px(bx + 27, by + 11, BONE[4])
    c.blit_part(body_p, INK)

    # 4. Near Muscular Dino Leg with Big Raptor Sickle Claw!
    fl_p = c.part()
    fl_p.shaded_capsule(bx - 2, by + 4, bx - 4 + fl // 2, by + 20, 8.5, DINO_GREEN)
    fl_p.shaded_capsule(bx - 4 + fl // 2, by + 20, bx + fl, gy - 4, 5.0, DINO_GREEN)
    fl_p.box(bx - 5 + fl, gy - 6, 16, 6, DINO_GREEN)
    # Curved razor sickle claw
    fl_p.poly([(bx + 10 + fl, gy - 6), (bx + 17 + fl, gy - 1), (bx + 10 + fl, gy)], BONE[4])
    fl_p.px(bx + 15 + fl, gy - 2, WHITE)
    c.blit_part(fl_p, INK)

    # 5. Ferocious Sculpted T-Rex Head & Snapping Fanged Jaws!
    head_p = c.part()
    hx = bx + 28 + (4 if anim == 'attack_1' else 0)
    hy = by - 16 + (3 if anim == 'attack_1' else 0)
    # Thick muscular neck
    head_p.shaded_capsule(bx + 14, by - 7, hx - 6, hy + 4, 9.0, DINO_GREEN)
    # Lower jaw hinged open by `jaw`
    head_p.shaded_poly(
        [(hx - 8, hy + 5), (hx + 16, hy + 5 + jaw), (hx + 13, hy + 11 + jaw), (hx - 8, hy + 11)],
        DINO_GREEN,
    )
    # Crimson mouth interior + sharp lower fangs
    if jaw >= 3:
        head_p.poly([(hx - 3, hy + 4), (hx + 14, hy + 3), (hx + 14, hy + 6 + jaw), (hx - 3, hy + 7)], (150, 24, 34, 255))
        for fx in (hx + 2, hx + 7, hx + 12):
            head_p.poly([(fx, hy + 5 + jaw), (fx + 1, hy + 1 + jaw), (fx + 3, hy + 5 + jaw)], WHITE)
    # Heavy upper snout & brow ridge
    head_p.shaded_poly(
        [(hx - 11, hy - 7), (hx + 7, hy - 8), (hx + 20, hy - 3), (hx + 19, hy + 4), (hx - 10, hy + 5)],
        DINO_GREEN,
    )
    # Upper serrated white fangs
    for fx in (hx + 3, hx + 8, hx + 13, hx + 17):
        head_p.poly([(fx, hy + 4), (fx + 1, hy + 8), (fx + 3, hy + 4)], WHITE)
    # Nostril + fierce glowing amber predator eye + tribal warpaint
    head_p.px(hx + 16, hy - 3, INK)
    head_p.rect(hx + 2, hy - 5, 5, 3, INK)
    head_p.rect(hx + 3, hy - 4, 3, 2, FIRE[3])
    head_p.px(hx + 4, hy - 4, WHITE)
    head_p.line(hx - 5, hy - 4, hx - 2, hy + 2, T_LIGHT, 2)
    head_p.line(hx - 1, hy - 4, hx + 1, hy + 1, T_LIGHT, 2)
    c.blit_part(head_p, INK)

    # 6. Ornate Bone-Tusk War Saddle + Tribal Rider!
    rider_p = c.part()
    rx = bx - 3
    ry = by - 21
    # Team war saddle blanket + curved mammoth tusk horn
    rider_p.box(rx - 10, by - 14, 22, 11, TEAM_RAMP)
    rider_p.rect(rx - 10, by - 5, 22, 2, GOLD[3])
    rider_p.shaded_capsule(rx + 8, by - 14, rx + 14, by - 22, 2.0, BONE)
    # Rider armored legs gripping saddle
    rider_p.shaded_capsule(rx + 1, by - 13, rx + 5, by - 3, 3.0, SKIN)
    rider_p.box(rx + 2, by - 5, 7, 5, LEATHER)
    # Rider torso
    rider_p.armor_plate(rx - 7, ry - 9, 14, 15, FUR, sheen=False)
    rider_p.box(rx - 5, ry - 5, 10, 4, TEAM_RAMP)
    # Rider head with horned skull headdress & fierce face!
    draw_hd_face(rider_p, rx, ry - 15, anim, SKIN, brow_col=FUR_DARK[0])
    rider_p.shaded_ellipse(rx - 1, ry - 20, 8, 4, BONE)
    rider_p.shaded_capsule(rx - 7, ry - 20, rx - 13, ry - 27, 1.8, BONE)
    rider_p.shaded_capsule(rx + 5, ry - 20, rx + 10, ry - 27, 1.8, BONE)
    rider_p.rect(rx - 7, ry - 18, 14, 3, TEAM_RAMP[2])
    # Rider weapon arm thrusting long bone war-spear!
    thrust = -6 if anim == 'attack_0' else (11 if anim == 'attack_1' else 2)
    rider_p.shaded_capsule(rx + 2, ry - 5, rx + 12 + thrust // 2, ry - 8, 2.8, SKIN)
    rider_p.shaded_capsule(rx - 14 + thrust, ry - 7, rx + 32 + thrust, ry - 11, 1.6, WOOD)
    rider_p.shaded_poly(
        [(rx + 30 + thrust, ry - 15), (rx + 42 + thrust, ry - 11), (rx + 30 + thrust, ry - 7)],
        BONE,
    )
    rider_p.rect(rx + 26 + thrust, ry - 10, 4, 5, T_LIGHT)
    c.blit_part(rider_p, INK)

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_slash_smear(c, hx + 16, hy + 8, 14, FIRE[2], FIRE[4])
    elif anim == 'hurt_0':
        draw_hit_sparks(c, bx + 18, by - 12, scale=2)

    return c, 58, gy


# =============================================================================
# ERA 3: ANCIENT CIVILIZATION (spearman, archer, chariot)
# =============================================================================

def gen_spearman(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Spartan Hoplite with Corinthian Plumed Helm, Muscle Cuirass & Aspis Shield (86x70px)."""
    w, h = 86, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN_TAN)
        # Iconic sculpted bronze Corinthian helmet with noseguard & cheekplates
        c.shaded_ellipse(cx, cy - 3, 8, 8, BRONZE)
        c.rect(cx + 1, cy - 3, 7, 4, INK)
        # Glowing fierce eyes peeking through helmet visor slit
        if a != 'death_0':
            c.rect(cx + 3, cy - 2, 3, 2, WHITE)
            c.px(cx + 5, cy - 2, INK)
        c.rect(cx + 4, cy - 3, 2, 5, BRONZE[3])  # nose guard
        c.box(cx - 2, cy + 1, 7, 5, BRONZE)  # cheek guard
        # Tall heroic sweeping horsehair team crest!
        fl = 2 if a in ('walk_1', 'walk_3', 'attack_1') else 0
        c.shaded_poly(
            [
                (cx - 4, cy - 10),
                (cx + 5, cy - 11),
                (cx + 7, cy - 15),
                (cx - 4, cy - 17),
                (cx - 13 - fl, cy - 10),
                (cx - 14 - fl, cy - 2),
                (cx - 7, cy - 7),
            ],
            TEAM_RAMP,
        )
        c.line(cx - 3, cy - 15, cx + 5, cy - 14, T_TRIM, 1)

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Sculpted Greek muscle cuirass lines + pteruges leather skirt strips
        c.line(tx + 4, ty + 6, tx + 13, ty + 6, BRONZE[1], 1)
        c.line(tx + 8, ty + 3, tx + 8, ty + 12, BRONZE[1], 1)
        for sx in range(tx + 2, tx + 15, 3):
            c.rect(sx, ty + 17, 2, 5, T_MID)
            c.px(sx, ty + 21, GOLD[3])

    def shield(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        # Large round bronze-rimmed Hoplite Aspis shield with golden lambda emblem
        ox = 3 if a == 'attack_1' else (-2 if a == 'attack_0' else 0)
        c.shaded_ellipse(sx + ox, sy + 2, 9, 12, BRONZE)
        c.shaded_ellipse(sx + ox, sy + 2, 7, 10, TEAM_RAMP)
        # Bold golden Spartan Lambda /\ emblem
        c.line(sx + ox - 3, sy + 7, sx + ox, sy - 4, GOLD[3], 2)
        c.line(sx + ox + 3, sy + 7, sx + ox, sy - 4, GOLD[4], 2)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx - 8, sy + 3, sx + 26, sy + 3, 1.5, WOOD)
            c.poly([(sx + 25, sy), (sx + 34, sy + 3), (sx + 25, sy + 6)], STEEL[4])
            return
        thrust = -8 if a == 'attack_0' else (14 if a == 'attack_1' else 4)
        y_off = -3 if a == 'attack_1' else 0
        c.shaded_capsule(sx - 18 + thrust, sy + 1 + y_off, sx + 26 + thrust, sy - 3 + y_off, 1.6, WOOD)
        # Gleaming leaf-shaped bronze/steel spearhead + team tassel
        tx = sx + 26 + thrust
        ty = sy - 3 + y_off
        c.shaded_poly([(tx - 2, ty - 4), (tx + 12, ty), (tx - 2, ty + 4)], STEEL)
        c.line(tx, ty, tx + 10, ty, WHITE, 1)
        c.rect(tx - 5, ty + 2, 3, 5, T_LIGHT)
        # Muscular armored arm gripping spear
        c.shaded_capsule(sx, sy, sx + 7 + thrust // 2, sy + 1 + y_off, 3.0, SKIN_TAN)
        c.box(sx + 4 + thrust // 2, sy - 1 + y_off, 5, 4, BRONZE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.line(sx + 40, sy - 6, sx + 54, sy - 6, T_GLOW, 2)
            c.line(sx + 44, sy - 6, sx + 55, sy - 6, WHITE, 1)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN_TAN, torso=BRONZE, legs=SKIN_TAN, boots=BRONZE,
        belt=LEATHER[1], buckle=GOLD[3],
        knee_armor=BRONZE, cape_ramp=TEAM_RAMP, torso_armored=True,
        head_fn=head, torso_detail_fn=torso_detail, shield_fn=shield, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_archer(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Classical Greek Archer with Quiver & Sculpted Recurve Warbow (72x70px)."""
    w, h = 72, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN_TAN, brow_col=HAIR_BROWN[0])
        # Sculpted leather-and-bronze hunter helm with fluttering team crest
        c.shaded_ellipse(cx - 1, cy - 5, 8, 5, BRONZE)
        c.rect(cx - 8, cy - 3, 16, 2, GOLD[3])
        c.shaded_capsule(cx - 6, cy - 6, cx - 14, cy - 9, 2.0, TEAM_RAMP)
        c.shaded_capsule(cx - 5, cy - 4, cx - 12, cy - 4, 1.5, TEAM_RAMP)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Slanted back quiver brimming with feathered arrows!
        c.shaded_capsule(bx - 1, by + 13, bx - 7, by - 3, 3.5, LEATHER)
        for ox in (-9, -6, -3):
            c.line(bx + ox, by - 2, bx + ox - 2, by - 9, WOOD[3], 1)
            c.rect(bx + ox - 3, by - 10, 3, 3, OFF_WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx + 2, sy + 2, sx + 14, sy - 4, 1.5, WOOD)
            c.shaded_capsule(sx + 14, sy - 4, sx + 22, sy + 3, 1.5, WOOD)
            return
        draw_pull = 8 if a == 'attack_0' else (0 if a == 'attack_1' else 2)
        bx = sx + 16
        # Forward bow-holding arm
        c.shaded_capsule(sx + 2, sy, bx - 2, sy - 2, 2.6, SKIN_TAN)
        # Sculpted double-curved recurve warbow limbs
        c.shaded_capsule(bx - 2, sy - 2, bx - 3, sy - 12, 1.8, WOOD)
        c.shaded_capsule(bx - 3, sy - 12, bx - 8, sy - 17, 1.5, GOLD)
        c.shaded_capsule(bx - 2, sy - 2, bx - 3, sy + 8, 1.8, WOOD)
        c.shaded_capsule(bx - 3, sy + 8, bx - 8, sy + 13, 1.5, GOLD)
        # Taut bowstring pulled back on attack_0!
        pull_x = bx - 8 - draw_pull
        c.line(bx - 8, sy - 16, pull_x, sy - 2, OFF_WHITE, 1)
        c.line(pull_x, sy - 2, bx - 8, sy + 12, OFF_WHITE, 1)
        # Draw arm pulling string
        c.shaded_capsule(sx, sy, pull_x + 2, sy - 2, 2.6, SKIN_TAN)
        if a in ('attack_0', 'walk_0', 'walk_1', 'walk_2', 'walk_3'):
            # Nocked arrow with white fletching & gleaming steel head
            c.line(pull_x, sy - 2, bx + 9, sy - 2, WOOD[3], 2)
            c.rect(pull_x - 2, sy - 4, 4, 4, OFF_WHITE)
            c.poly([(bx + 7, sy - 5), (bx + 14, sy - 2), (bx + 7, sy + 1)], STEEL[4])
            c.px(bx + 12, sy - 2, WHITE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.line(sx + 20, sy - 2, sx + 34, sy - 2, OFF_WHITE, 2)
            c.px(sx + 34, sy - 2, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN_TAN, torso=LEATHER, legs=KHAKI, boots=LEATHER,
        belt=BRONZE[2], buckle=GOLD[3],
        has_team_sash=True, has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_chariot(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Bronze War Chariot pulled by Armored Bay Warhorse + Spear Charioteer (128x102px)."""
    w, h = 128, 102
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.shaded_ellipse(84, gy - 14, 24, 10, HORSE_BAY)
        p.shaded_ellipse(108, gy - 12, 9, 6, HORSE_BAY)
        p.line(108, gy - 15, 112, gy - 11, INK, 2)
        p.line(112, gy - 15, 108, gy - 11, INK, 2)
        p.armor_plate(18, gy - 18, 34, 15, BRONZE, rivets=True)
        p.wheel(34, gy - 10, 12, WOOD, GOLD[3], 0.5)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 52, gy - 20, 7)
        return c, 64, gy

    phases = {'walk_0': 0.0, 'walk_1': 0.55, 'walk_2': 1.1, 'walk_3': 1.65}
    w_phase = phases.get(anim, 0.2)
    if anim == 'walk_0':
        fl, bl, bob = 11, -10, 0
    elif anim == 'walk_1':
        fl, bl, bob = 3, -3, -4
    elif anim == 'walk_2':
        fl, bl, bob = -10, 11, 0
    elif anim == 'walk_3':
        fl, bl, bob = -3, 3, -4
    elif anim == 'attack_0':
        fl, bl, bob = 7, -8, -4
    elif anim == 'attack_1':
        fl, bl, bob = 15, -12, 2
    else:
        fl, bl, bob = -6, 6, -2

    dx = 4 if anim == 'attack_1' else (-4 if anim == 'hurt_0' else 0)
    hx = 84 + dx
    hy = gy - 34 + bob

    # 1. Warhorse Back Legs
    hbl = c.part()
    dark_h = (HORSE_BAY[0], HORSE_BAY[0], HORSE_BAY[1], HORSE_BAY[2])
    hbl.shaded_capsule(hx - 14, hy + 8, hx - 18 + bl, gy - 3, 3.6, dark_h)
    hbl.shaded_capsule(hx + 12, hy + 8, hx + 16 - fl, gy - 3, 3.6, dark_h)
    hbl.rect(hx - 21 + bl, gy - 4, 6, 4, CHARCOAL[0])
    hbl.rect(hx + 13 - fl, gy - 4, 6, 4, CHARCOAL[0])
    c.blit_part(hbl, INK)

    # 2. Flowing Horse Tail + Chariot Shaft
    c.shaded_capsule(36 + dx, gy - 22 + bob, hx - 10, hy + 2, 2.2, WOOD)

    # 3. Muscular Armored Warhorse Body, Neck, Flowing Mane & Bronze Chanfron
    horse = c.part()
    horse.shaded_capsule(hx - 18, hy - 2, hx - 27, hy + 10, 2.8, CHARCOAL)  # flowing tail
    horse.shaded_ellipse(hx, hy, 22, 12, HORSE_BAY)
    horse.box(hx - 9, hy - 11, 18, 12, TEAM_RAMP)
    horse.rect(hx - 9, hy, 18, 2, GOLD[3])
    # Muscular arched horse neck & sculpted head
    horse.shaded_capsule(hx + 14, hy - 3, hx + 25, hy - 22, 7.0, HORSE_BAY)
    # Flowing dark mane
    horse.shaded_poly(
        [(hx + 9, hy - 8), (hx + 19, hy - 27), (hx + 23, hy - 22), (hx + 15, hy - 5)],
        CHARCOAL,
    )
    horse.shaded_poly(
        [(hx + 20, hy - 25), (hx + 34, hy - 19), (hx + 32, hy - 12), (hx + 19, hy - 15)],
        HORSE_BAY,
    )
    # Bronze chanfron head armor + team plume!
    horse.shaded_poly([(hx + 22, hy - 25), (hx + 34, hy - 19), (hx + 32, hy - 16), (hx + 21, hy - 21)], BRONZE)
    horse.shaded_capsule(hx + 21, hy - 25, hx + 14, hy - 34, 2.4, TEAM_RAMP)
    horse.rect(hx + 26, hy - 20, 3, 2, WHITE)
    horse.px(hx + 28, hy - 20, INK)
    # Near Horse Legs
    horse.shaded_capsule(hx - 13, hy + 8, hx - 16 - bl, gy - 3, 3.8, HORSE_BAY)
    horse.shaded_capsule(hx + 13, hy + 8, hx + 16 + fl, gy - 3, 3.8, HORSE_BAY)
    horse.rect(hx - 19 - bl, gy - 4, 7, 4, CHARCOAL[1])
    horse.rect(hx + 13 + fl, gy - 4, 7, 4, CHARCOAL[1])
    c.blit_part(horse, INK)

    # 4. Charioteer Warrior standing in Bronze Chariot Box!
    char_p = c.part()
    cx_w = 27 + dx
    cy_w = gy - 40 + bob
    # Charioteer torso + cape + plumed helm + spear
    char_p.shaded_poly([(cx_w - 6, cy_w - 14), (cx_w - 20, cy_w + 4), (cx_w - 10, cy_w + 6), (cx_w - 3, cy_w - 6)], TEAM_RAMP)
    char_p.armor_plate(cx_w - 7, cy_w - 14, 14, 16, BRONZE, sheen=True)
    draw_hd_face(char_p, cx_w, cy_w - 21, anim, SKIN_TAN)
    char_p.shaded_ellipse(cx_w, cy_w - 25, 7, 5, BRONZE)
    char_p.shaded_poly([(cx_w - 5, cy_w - 29), (cx_w + 5, cy_w - 32), (cx_w - 11, cy_w - 34), (cx_w - 13, cy_w - 25)], TEAM_RAMP)
    # Reins to horse
    char_p.line(cx_w + 6, cy_w - 8, hx + 27, hy - 15, LEATHER[3], 1)
    # Long war spear thrusting forward!
    thrust = -6 if anim == 'attack_0' else (14 if anim == 'attack_1' else 2)
    char_p.shaded_capsule(cx_w + 2, cy_w - 10, cx_w + 11 + thrust // 2, cy_w - 12, 2.6, SKIN_TAN)
    char_p.shaded_capsule(cx_w - 12 + thrust, cy_w - 11, cx_w + 36 + thrust, cy_w - 14, 1.6, WOOD)
    char_p.shaded_poly([(cx_w + 34 + thrust, cy_w - 18), (cx_w + 46 + thrust, cy_w - 14), (cx_w + 34 + thrust, cy_w - 10)], STEEL)
    c.blit_part(char_p, INK)

    # 5. Ornate Bronze & Gold War Chariot Cab + Large Spoked Scythed Wheel!
    cab = c.part()
    cab.shaded_poly(
        [(10 + dx, gy - 16 + bob), (46 + dx, gy - 16 + bob), (48 + dx, gy - 38 + bob), (32 + dx, gy - 41 + bob), (12 + dx, gy - 32 + bob)],
        BRONZE,
    )
    cab.armor_plate(18 + dx, gy - 34 + bob, 22, 14, TEAM_RAMP, sheen=True)
    cab.rect(18 + dx, gy - 36 + bob, 24, 3, GOLD[3])
    cab.rect(18 + dx, gy - 20 + bob, 24, 2, GOLD[3])
    cab.wheel(28 + dx, gy - 15 + bob, 14, WOOD, GOLD[3], w_phase)
    # Scythe hub blade gleam!
    cab.shaded_ellipse(28 + dx, gy - 15 + bob, 4, 4, STEEL)
    c.blit_part(cab, INK)

    c.add_outline(INK)
    if anim == 'attack_1':
        draw_slash_smear(c, hx + 30, hy - 8, 16, GOLD[2], GOLD[4])
    elif anim == 'hurt_0':
        draw_hit_sparks(c, hx + 6, hy - 10, scale=2)

    return c, 64, gy


# =============================================================================
# ERA 4: MEDIEVAL ERA (knight, crossbowman, heavy_cavalry, catapult)
# =============================================================================

def gen_knight(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Fluted Steel Plate-Armor Crusader Knight with Greathelm, Kite Shield & Broadsword (74x70px)."""
    w, h = 74, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Iconic gleaming steel crusader greathelm with brass cross & breather slits
        c.armor_plate(cx - 8, cy - 8, 16, 16, STEEL, sheen=True)
        c.rect(cx - 7, cy - 9, 14, 2, STEEL[4])
        # Horizontal eye visor slit + vertical brass crusader cross
        c.rect(cx - 1, cy - 2, 9, 3, INK)
        c.rect(cx + 2, cy - 1, 5, 1, T_GLOW if a == 'attack_1' else STEEL[4])
        c.rect(cx + 2, cy - 8, 3, 15, GOLD[3])
        c.rect(cx - 2, cy - 3, 10, 2, GOLD[3])
        # Breather holes
        for bx in (cx, cx + 3, cx + 6):
            c.px(bx, cy + 3, INK)
            c.px(bx, cy + 5, INK)
        # Dramatic flowing knight helmet plume!
        fl = 3 if a in ('walk_1', 'walk_3', 'attack_1') else 0
        c.shaded_poly(
            [(cx - 4, cy - 9), (cx - 12 - fl, cy - 15), (cx - 17 - fl, cy - 8), (cx - 12 - fl, cy - 5), (cx - 5, cy - 7)],
            TEAM_RAMP,
        )

    def shield(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        ox = 3 if a == 'attack_1' else (-2 if a == 'attack_0' else 0)
        pts = [
            (sx - 7 + ox, sy - 10),
            (sx + 8 + ox, sy - 10),
            (sx + 8 + ox, sy + 2),
            (sx + 1 + ox, sy + 14),
            (sx - 7 + ox, sy + 2),
        ]
        c.shaded_poly(pts, STEEL)
        inner = [
            (sx - 5 + ox, sy - 8),
            (sx + 6 + ox, sy - 8),
            (sx + 6 + ox, sy + 1),
            (sx + 1 + ox, sy + 11),
            (sx - 5 + ox, sy + 1),
        ]
        c.shaded_poly(inner, TEAM_RAMP)
        # Golden heraldic cross on kite shield
        c.rect(sx + ox, sy - 7, 2, 16, GOLD[3])
        c.rect(sx - 4 + ox, sy - 3, 10, 2, GOLD[3])
        c.px(sx + ox, sy - 3, WHITE)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_capsule(sx + 2, sy + 2, sx + 26, sy + 2, 2.0, STEEL)
            c.rect(sx + 5, sy - 3, 3, 10, GOLD[3])
            return
        if a == 'attack_0':
            # Broadsword raised high over shoulder
            ex, ey = sx - 5, sy - 10
            c.shaded_capsule(sx, sy, ex, ey, 3.0, STEEL)
            c.rect(ex - 4, ey - 3, 8, 3, GOLD[3])
            c.shaded_poly([(ex - 3, ey - 3), (ex - 14, ey - 24), (ex - 10, ey - 26), (ex + 1, ey - 3)], STEEL)
        elif a == 'attack_1':
            # Mighty horizontal-downward knight cleave!
            ex, ey = sx + 10, sy + 1
            c.shaded_capsule(sx, sy, ex, ey, 3.2, STEEL)
            c.rect(ex - 1, ey - 5, 3, 10, GOLD[3])
            c.shaded_poly([(ex + 2, ey - 3), (ex + 28, ey + 1), (ex + 25, ey + 5), (ex + 2, ey + 3)], STEEL)
            c.line(ex + 3, ey - 1, ex + 26, ey + 1, WHITE, 1)
        elif a == 'attack_2':
            ex, ey = sx + 8, sy + 6
            c.shaded_capsule(sx, sy, ex, ey, 3.0, STEEL)
            c.rect(ex - 1, ey - 3, 3, 8, GOLD[3])
            c.shaded_poly([(ex + 2, ey), (ex + 22, ey + 12), (ex + 19, ey + 15), (ex + 1, ey + 4)], STEEL)
        else:
            sway = -2 if a in ('walk_1', 'walk_2') else 2
            ex, ey = sx + 7, sy + 3 + sway
            c.shaded_capsule(sx, sy, ex, ey, 3.0, STEEL)
            c.rect(ex - 2, ey - 3, 7, 3, GOLD[3])
            c.shaded_poly([(ex + 1, ey - 3), (ex + 16, ey - 19 + sway), (ex + 19, ey - 17 + sway), (ex + 5, ey - 1)], STEEL)
            c.line(ex + 3, ey - 4, ex + 17, ey - 18 + sway, WHITE, 1)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 18, sy, 20, T_LIGHT, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=STEEL, torso=STEEL, legs=STEEL, boots=STEEL,
        belt=LEATHER[1], buckle=GOLD[3],
        has_team_tabard=True, knee_armor=GOLD, cape_ramp=TEAM_RAMP, torso_armored=True,
        head_fn=head, shield_fn=shield, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=30,
    )
    return c, 30, h - 3


def gen_crossbowman(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Medieval Kettle-Helm Arbalest Crossbowman with Heavy Steel Crossbow (72x70px)."""
    w, h = 72, 70

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        draw_hd_face(c, cx, cy, a, SKIN, brow_col=HAIR_BROWN[0])
        # Wide-brimmed riveted steel kettle helmet
        c.shaded_ellipse(cx, cy - 5, 8, 5, STEEL)
        c.box(cx - 11, cy - 4, 22, 3, STEEL)
        c.rect(cx - 10, cy - 4, 20, 1, STEEL[4])
        c.px(cx - 6, cy - 3, STEEL[0])
        c.px(cx + 6, cy - 3, STEEL[0])

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        c.box(bx - 5, by + 6, 8, 12, LEATHER)
        for qx in (-4, -1):
            c.rect(bx + qx, by + 2, 2, 5, STEEL[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.box(sx + 2, sy, 22, 4, WOOD)
            c.rect(sx + 18, sy - 6, 3, 16, STEEL[3])
            return
        recoil = -3 if a == 'attack_1' else 0
        # Wooden arbalest tiller & stock braced at shoulder
        c.shaded_capsule(sx - 2 + recoil, sy + 2, sx + 22 + recoil, sy - 1, 2.5, WOOD)
        c.rect(sx + 8 + recoil, sy - 3, 14, 2, STEEL[3])  # bolt groove
        # Heavy curved steel bow prod
        c.shaded_capsule(sx + 20 + recoil, sy - 1, sx + 17 + recoil, sy - 11, 1.8, STEEL)
        c.shaded_capsule(sx + 20 + recoil, sy - 1, sx + 17 + recoil, sy + 9, 1.8, STEEL)
        str_x = sx + (12 if a != 'attack_1' else 18) + recoil
        c.line(sx + 17 + recoil, sy - 10, str_x, sy - 1, OFF_WHITE, 1)
        c.line(str_x, sy - 1, sx + 17 + recoil, sy + 8, OFF_WHITE, 1)
        if a != 'attack_1':
            c.line(str_x, sy - 2, sx + 27 + recoil, sy - 2, STEEL[4], 2)
            c.px(sx + 28 + recoil, sy - 2, WHITE)
        # Arm holding stock
        c.shaded_capsule(sx, sy, sx + 9 + recoil, sy + 2, 2.8, TEAM_RAMP)
        c.shaded_ellipse(sx + 10 + recoil, sy + 2, 2.5, 2.5, LEATHER)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.line(sx + 24, sy - 2, sx + 38, sy - 2, WHITE, 2)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=LEATHER, legs=CHARCOAL, boots=LEATHER,
        belt=LEATHER[0], buckle=STEEL[4],
        has_team_tabard=True, has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=29,
    )
    return c, 29, h - 3


def gen_heavy_cavalry(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Caparisoned Heavy Knight Charger Warhorse + Crowned Jousting Lancer (126x108px)."""
    w, h = 126, 108
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.shaded_ellipse(64, gy - 15, 30, 12, TEAM_RAMP)
        p.shaded_ellipse(92, gy - 14, 10, 7, STEEL)
        p.box(46, gy - 26, 18, 12, STEEL)
        p.shaded_capsule(36, gy - 20, 108, gy - 18, 2.0, WOOD)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 68, gy - 22, 8)
        return c, 63, gy

    if anim == 'walk_0':
        fl, bl, bob = 12, -12, 0
    elif anim == 'walk_1':
        fl, bl, bob = 3, -3, -5
    elif anim == 'walk_2':
        fl, bl, bob = -12, 12, 0
    elif anim == 'walk_3':
        fl, bl, bob = -3, 3, -5
    elif anim == 'attack_0':
        fl, bl, bob = 8, -10, -5
    elif anim == 'attack_1':
        fl, bl, bob = 16, -14, 2
    else:
        fl, bl, bob = -6, 6, -2

    dx = 5 if anim == 'attack_1' else (-5 if anim == 'hurt_0' else 0)
    hx = 60 + dx
    hy = gy - 37 + bob

    # 1. Back Armored Warhorse Legs
    hbl = c.part()
    dark_g = (HORSE_GREY[0], HORSE_GREY[0], HORSE_GREY[1], HORSE_GREY[2])
    hbl.shaded_capsule(hx - 18, hy + 8, hx - 22 + bl, gy - 3, 4.2, dark_g)
    hbl.shaded_capsule(hx + 16, hy + 8, hx + 20 - fl, gy - 3, 4.2, dark_g)
    hbl.rect(hx - 25 + bl, gy - 4, 7, 4, CHARCOAL[0])
    hbl.rect(hx + 17 - fl, gy - 4, 7, 4, CHARCOAL[0])
    c.blit_part(hbl, INK)

    # 2. Mighty Caparisoned Warhorse Body + Steel Plate Barding + Flowing Team Cloth
    horse = c.part()
    horse.shaded_capsule(hx - 24, hy - 2, hx - 35, hy + 11, 3.2, HORSE_GREY)  # tail
    horse.shaded_ellipse(hx, hy, 27, 14, HORSE_GREY)
    # Flowing draped royal caparison cloth with golden hem & crest
    horse.shaded_poly(
        [(hx - 27, hy - 8), (hx + 27, hy - 8), (hx + 25, hy + 14), (hx + 8, hy + 10), (hx - 8, hy + 14), (hx - 26, hy + 12)],
        TEAM_RAMP,
    )
    horse.line(hx - 26, hy + 11, hx + 24, hy + 11, GOLD[3], 2)
    # Steel breastplate barding
    horse.armor_plate(hx + 12, hy - 9, 15, 16, STEEL, rivets=True)
    # Armored arched neck & steel horse head chanfron
    horse.shaded_capsule(hx + 17, hy - 5, hx + 29, hy - 25, 8.0, STEEL)
    horse.shaded_poly(
        [(hx + 24, hy - 29), (hx + 40, hy - 21), (hx + 37, hy - 13), (hx + 23, hy - 17)],
        STEEL,
    )
    horse.rect(hx + 27, hy - 26, 10, 2, GOLD[3])
    horse.rect(hx + 30, hy - 22, 3, 2, T_GLOW)
    # Feathered horse crest plume
    horse.shaded_poly([(hx + 25, hy - 29), (hx + 19, hy - 41), (hx + 13, hy - 33), (hx + 22, hy - 27)], TEAM_RAMP)
    # Near Horse Legs with armored hooves
    horse.shaded_capsule(hx - 16, hy + 10, hx - 20 - bl, gy - 3, 4.4, HORSE_GREY)
    horse.shaded_capsule(hx + 16, hy + 10, hx + 20 + fl, gy - 3, 4.4, HORSE_GREY)
    horse.rect(hx - 23 - bl, gy - 4, 8, 4, STEEL[2])
    horse.rect(hx + 17 + fl, gy - 4, 8, 4, STEEL[2])
    c.blit_part(horse, INK)

    # 3. Full-Plate Crowned Knight Rider + Billowing Cape + Couched Jousting Lance!
    rider = c.part()
    rx = hx - 4
    ry = hy - 22
    flut = 5 if anim in ('walk_1', 'walk_3', 'attack_1') else 0
    rider.shaded_poly(
        [(rx - 6, ry - 12), (rx - 28 - flut, ry + 2), (rx - 26 - flut, ry + 14), (rx - 4, ry + 8)],
        TEAM_RAMP,
    )
    # Seated armored knight leg
    rider.shaded_capsule(rx + 2, ry + 3, rx + 7, ry + 18, 3.8, STEEL)
    rider.box(rx + 4, ry + 15, 9, 5, STEEL)
    # Gleaming fluted steel chestplate
    rider.armor_plate(rx - 8, ry - 13, 17, 17, STEEL, sheen=True)
    rider.box(rx - 3, ry - 11, 9, 13, TEAM_RAMP)
    rider.rect(rx + 1, ry - 10, 2, 11, GOLD[3])
    # Crowned greathelm + tall plume
    rider.armor_plate(rx - 7, ry - 27, 15, 15, STEEL, sheen=True)
    rider.rect(rx, ry - 21, 8, 3, INK)
    rider.rect(rx + 2, ry - 20, 4, 1, GOLD[4])
    rider.rect(rx - 7, ry - 30, 15, 3, GOLD[3])  # crown circlet
    for cx_p in (rx - 6, rx - 1, rx + 4):
        rider.rect(cx_p, ry - 33, 3, 3, GOLD[4])
    rider.shaded_poly([(rx - 5, ry - 29), (rx - 17 - flut, ry - 36), (rx - 22 - flut, ry - 25), (rx - 7, ry - 25)], TEAM_RAMP)
    # Heraldic shield mounted on side
    rider.armor_plate(rx + 4, ry - 7, 11, 15, TEAM_RAMP, sheen=True)
    rider.rect(rx + 8, ry - 6, 3, 13, GOLD[3])
    rider.rect(rx + 5, ry - 1, 9, 3, GOLD[3])
    # Massive striped tournament jousting lance with fluttering pennant!
    thrust = -8 if anim == 'attack_0' else (14 if anim == 'attack_1' else 2)
    ly = ry - 6 + (2 if anim == 'attack_1' else 0)
    rider.shaded_capsule(rx - 2, ry - 8, rx + 10 + thrust // 2, ly, 3.2, STEEL)
    # Vamplate hand-guard cone
    rider.shaded_poly([(rx + 8 + thrust, ly - 5), (rx + 19 + thrust, ly), (rx + 8 + thrust, ly + 5)], STEEL)
    # Tapered striped lance shaft extending far forward
    lx_end = min(w - 5, rx + 56 + thrust)
    rider.shaded_poly([(rx - 14 + thrust, ly - 3), (lx_end, ly - 1), (lx_end, ly + 2), (rx - 14 + thrust, ly + 3)], STEEL)
    for stx in range(rx + 20 + thrust, lx_end - 8, 8):
        rider.rect(stx, ly - 2, 4, 4, T_MID)
    # Fluttering swallowtail team pennant near tip
    rider.shaded_poly(
        [(lx_end - 18, ly + 2), (lx_end - 8, ly + 2), (lx_end - 14, ly + 10), (lx_end - 22, ly + 12)],
        TEAM_RAMP,
    )
    c.blit_part(rider, INK)

    c.add_outline(INK)
    if anim == 'attack_1':
        c.line(w - 14, ry - 5, w - 2, ry - 5, WHITE, 3)
        draw_slash_smear(c, w - 18, ry - 5, 16, T_LIGHT, WHITE)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, hx + 12, hy - 14, scale=2)

    return c, 63, gy


def gen_catapult(anim: str) -> tuple[PixelCanvas, int, int]:
    """HD Heavy Medieval Timber Siege Catapult Onager + Armored Siege Engineer (124x96px)."""
    w, h = 124, 96
    c = PixelCanvas(w, h)
    gy = h - 3

    if anim == 'death_0':
        p = c.part()
        p.armor_plate(20, gy - 18, 72, 13, WOOD_DARK, rivets=True)
        p.shaded_capsule(28, gy - 14, 86, gy - 32, 3.0, WOOD)
        p.wheel(38, gy - 10, 11, WOOD, IRON[2], 0.4)
        p.wheel(78, gy - 10, 11, WOOD, IRON[2], 1.1)
        c.blit_part(p, INK)
        draw_smoke_puff(c, 58, gy - 26, 8)
        return c, 62, gy

    phases = {'walk_0': 0.0, 'walk_1': 0.45, 'walk_2': 0.9, 'walk_3': 1.35}
    wp = phases.get(anim, 0.0)
    bob = -1 if anim in ('walk_1', 'walk_3') else 0
    recoil = -4 if anim == 'attack_1' else 0

    # 1. Armored Medieval Engineer behind catapult cranking windlass
    eng = c.part()
    ex = 19 + recoil
    leg_s = 3 if anim in ('walk_0', 'walk_2') else 0
    eng.shaded_capsule(ex - 2, gy - 17, ex - 4 - leg_s, gy - 3, 3.0, CHARCOAL)
    eng.shaded_capsule(ex + 2, gy - 17, ex + 4 + leg_s, gy - 3, 3.0, CHARCOAL)
    eng.armor_plate(ex - 7, gy - 35 + bob, 14, 18, LEATHER, sheen=False)
    eng.box(ex - 4, gy - 33 + bob, 9, 14, TEAM_RAMP)
    draw_hd_face(eng, ex, gy - 41 + bob, anim, SKIN)
    eng.shaded_ellipse(ex, gy - 45 + bob, 8, 4, STEEL)
    eng.rect(ex - 9, gy - 43 + bob, 18, 2, STEEL[3])
    eng.shaded_capsule(ex + 4, gy - 30 + bob, ex + 15, gy - 26 + bob, 2.5, TEAM_RAMP)
    c.blit_part(eng, INK)

    # 2. Pivoting Torsion Throwing Arm & Loaded Boulder!
    arm_p = c.part()
    piv_x, piv_y = 74 + recoil, gy - 28 + bob
    if anim == 'attack_0':
        tip_x, tip_y = 26 + recoil, gy - 42 + bob
        has_boulder = True
    elif anim == 'attack_1':
        tip_x, tip_y = 84 + recoil, gy - 76 + bob
        has_boulder = False
    elif anim == 'attack_2':
        tip_x, tip_y = 70 + recoil, gy - 66 + bob
        has_boulder = False
    else:
        tip_x, tip_y = 34 + recoil, gy - 54 + bob
        has_boulder = True

    arm_p.shaded_capsule(piv_x, piv_y, tip_x, tip_y, 3.4, WOOD)
    # Iron reinforced throwing spoon cup
    arm_p.shaded_ellipse(tip_x, tip_y, 9, 7, IRON)
    if has_boulder:
        arm_p.shaded_ellipse(tip_x - 1, tip_y - 4, 8, 7, STONE)
        arm_p.px(tip_x - 3, tip_y - 7, STONE[4])
    c.blit_part(arm_p, INK)

    # 3. Heavy Oak Siege Chassis Frame, Cross-Braces, Torsion Rope & Team Pennant
    chassis = c.part()
    fx = 30 + recoil
    # Heavy horizontal sill beams + angled A-frame uprights
    chassis.armor_plate(fx, gy - 26 + bob, 74, 12, WOOD, rivets=True)
    chassis.shaded_capsule(fx + 14, gy - 24 + bob, fx + 44, gy - 56 + bob, 4.0, WOOD_DARK)
    chassis.shaded_capsule(fx + 62, gy - 24 + bob, fx + 44, gy - 56 + bob, 4.0, WOOD_DARK)
    # Padded leather stop crossbar
    chassis.armor_plate(fx + 35, gy - 58 + bob, 18, 9, LEATHER, rivets=True)
    # Twisted golden rope torsion coil
    chassis.box(piv_x - 7, piv_y - 5, 14, 10, KHAKI)
    for rx in range(piv_x - 5, piv_x + 6, 3):
        chassis.line(rx, piv_y - 5, rx, piv_y + 4, WOOD_DARK[0], 1)
    # Team heraldic armor plate & banner on chassis side
    chassis.armor_plate(fx + 20, gy - 25 + bob, 26, 10, TEAM_RAMP, sheen=True)
    chassis.rect(fx + 22, gy - 22 + bob, 22, 3, GOLD[3])
    # Iron corner plates
    chassis.armor_plate(fx, gy - 26 + bob, 8, 12, IRON, rivets=True)
    chassis.armor_plate(fx + 66, gy - 26 + bob, 8, 12, IRON, rivets=True)
    # Heavy spoked siege wheels!
    chassis.wheel(fx + 14, gy - 14 + bob, 13, WOOD, IRON[3], wp)
    chassis.wheel(fx + 60, gy - 14 + bob, 13, WOOD, IRON[3], wp + 0.35)
    c.blit_part(chassis, INK)

    c.add_outline(INK)
    if anim == 'attack_1':
        draw_smoke_puff(c, tip_x + 8, tip_y - 4, 6)
        draw_slash_smear(c, piv_x + 4, piv_y - 36, 18, OFF_WHITE, WHITE)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, fx + 40, gy - 32, scale=2)

    return c, 62, gy


ANCIENT_UNIT_GENERATORS = {
    'clubman': gen_clubman,
    'slinger': gen_slinger,
    'dino_rider': gen_dino_rider,
    'spearman': gen_spearman,
    'archer': gen_archer,
    'chariot': gen_chariot,
    'knight': gen_knight,
    'crossbowman': gen_crossbowman,
    'heavy_cavalry': gen_heavy_cavalry,
    'catapult': gen_catapult,
}
