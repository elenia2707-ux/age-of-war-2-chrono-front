"""High-density Metal-Slug-style pixel art generators for Eras 1, 2, and 3 (10 units)."""

from __future__ import annotations

import math

from .canvas import PixelCanvas
from .humanoid import (
    ANIM_FRAMES,
    TEAM_RAMP,
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


def _draw_face_base(c: PixelCanvas, cx: int, cy: int, skin=SKIN) -> None:
    c.shaded_ellipse(cx, cy, 4, 4, skin)
    # Expressive dark arcade eye + brow
    c.px(cx + 2, cy, INK)
    c.px(cx + 2, cy - 1, skin[0])
    c.px(cx + 1, cy + 2, skin[1])


# =============================================================================
# ERA 1: STONE AGE (clubman, slinger, dino_rider)
# =============================================================================

def gen_clubman(anim: str) -> tuple[PixelCanvas, int, int]:
    w, h = 36, 36

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        _draw_face_base(c, cx, cy, SKIN)
        # Wild shaggy dark caveman hair
        c.shaded_ellipse(cx - 1, cy - 3, 4, 2, FUR_DARK)
        c.rect(cx - 5, cy - 2, 3, 4, FUR_DARK[1])
        c.px(cx - 4, cy - 4, FUR_DARK[2])
        c.px(cx - 1, cy - 5, FUR_DARK[2])
        c.px(cx + 2, cy - 4, FUR_DARK[1])
        # Team-colored tribal headband + feather
        c.rect(cx - 4, cy - 2, 8, 2, T_MID)
        c.rect(cx - 2, cy - 2, 5, 1, T_LIGHT)
        # Tribal feather sticking out back
        c.line(cx - 4, cy - 2, cx - 7, cy - 5, T_LIGHT)
        c.px(cx - 7, cy - 5, T_TRIM)
        # Jaw beard stubble
        c.rect(cx, cy + 2, 3, 2, FUR_DARK[1])

    def torso_detail(c: PixelCanvas, tx: int, ty: int, a: str) -> None:
        # Tiger/leopard pelt spots + diagonal bone strap
        c.px(tx + 2, ty + 2, FUR[0])
        c.px(tx + 6, ty + 4, FUR[0])
        c.px(tx + 3, ty + 5, FUR[0])
        # Team war-paint chest band
        c.rect(tx + 1, ty + 3, 7, 2, T_MID)
        c.rect(tx + 2, ty + 3, 4, 1, T_LIGHT)
        # Ragged pelt hem
        c.px(tx + 1, ty + 9, FUR[1])
        c.px(tx + 4, ty + 9, FUR[2])
        c.px(tx + 7, ty + 9, FUR[1])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            # Club fallen on ground
            c.shaded_line(sx + 2, sy + 1, sx + 10, sy + 1, WOOD, 2)
            c.shaded_ellipse(sx + 10, sy + 1, 3, 2, WOOD)
            c.px(sx + 11, sy - 1, BONE[3])
            return
        if a == 'attack_0':
            # Raised high behind head
            c.shaded_line(sx, sy, sx - 2, sy - 6, SKIN, 2)
            c.shaded_line(sx - 2, sy - 6, sx - 7, sy - 12, WOOD, 2)
            c.shaded_ellipse(sx - 8, sy - 13, 3, 3, WOOD)
            c.px(sx - 10, sy - 14, BONE[3])
            c.px(sx - 7, sy - 16, BONE[4])
        elif a == 'attack_1':
            # Smashing downward-forward!
            c.shaded_line(sx, sy, sx + 6, sy + 1, SKIN, 2)
            c.shaded_line(sx + 6, sy + 1, sx + 14, sy + 4, WOOD, 2)
            c.shaded_ellipse(sx + 14, sy + 4, 4, 3, WOOD)
            c.px(sx + 15, sy + 1, BONE[4])
            c.px(sx + 17, sy + 3, BONE[3])
        elif a == 'attack_2':
            # Low follow-through
            c.shaded_line(sx, sy, sx + 5, sy + 3, SKIN, 2)
            c.shaded_line(sx + 5, sy + 3, sx + 12, sy + 7, WOOD, 2)
            c.shaded_ellipse(sx + 13, sy + 7, 3, 3, WOOD)
            c.px(sx + 15, sy + 6, BONE[3])
        elif a == 'hurt_0':
            c.shaded_line(sx, sy, sx + 3, sy - 3, SKIN, 2)
            c.shaded_line(sx + 3, sy - 3, sx + 7, sy - 7, WOOD, 2)
            c.shaded_ellipse(sx + 8, sy - 8, 3, 2, WOOD)
        else:
            sway = -1 if a in ('walk_1', 'walk_2') else 1
            c.shaded_line(sx, sy, sx + 4, sy + 1 + sway, SKIN, 2)
            c.shaded_line(sx + 4, sy + 1 + sway, sx + 11, sy - 4 + sway, WOOD, 2)
            c.shaded_ellipse(sx + 12, sy - 5 + sway, 3, 3, WOOD)
            c.px(sx + 12, sy - 8 + sway, BONE[4])
            c.px(sx + 15, sy - 5 + sway, BONE[3])

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 8, sy - 1, 9, FIRE[2], FIRE[3])

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=FUR, legs=SKIN, boots=LEATHER,
        belt=LEATHER[1], buckle=BONE[3],
        has_team_shoulder=False,
        head_fn=head, weapon_fn=weapon, torso_detail_fn=torso_detail, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_slinger(anim: str) -> tuple[PixelCanvas, int, int]:
    w, h = 36, 36

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        _draw_face_base(c, cx, cy, SKIN_TAN)
        # Tied hunter topknot hair
        c.shaded_ellipse(cx - 1, cy - 3, 4, 2, FUR_DARK)
        c.rect(cx - 5, cy - 1, 2, 3, FUR_DARK[1])
        # Bright team bandana with fluttering tails
        c.rect(cx - 4, cy - 2, 8, 2, T_MID)
        c.rect(cx - 3, cy - 2, 6, 1, T_LIGHT)
        tail_dy = -1 if a in ('walk_1', 'walk_3', 'attack_1') else 1
        c.line(cx - 4, cy - 1, cx - 8, cy + tail_dy, T_MID, 1)
        c.px(cx - 8, cy + tail_dy, T_LIGHT)

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Leather stone pouch on hip/back
        c.box(bx - 2, by + 3, 4, 5, LEATHER)
        c.px(bx - 1, by + 4, STONE[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.line(sx + 1, sy + 1, sx + 7, sy + 2, LEATHER[2])
            c.shaded_ellipse(sx + 8, sy + 2, 2, 2, STONE)
            return
        if a == 'attack_0':
            # Whirling sling overhead!
            c.shaded_line(sx, sy, sx + 2, sy - 6, SKIN_TAN, 2)
            c.line(sx + 2, sy - 6, sx - 4, sy - 11, LEATHER[3])
            c.line(sx + 2, sy - 6, sx + 8, sy - 10, LEATHER[2])
            c.shaded_ellipse(sx - 5, sy - 11, 2, 2, STONE)
        elif a == 'attack_1':
            # Whipping sling forward launching stone
            c.shaded_line(sx, sy, sx + 6, sy - 2, SKIN_TAN, 2)
            c.line(sx + 6, sy - 2, sx + 15, sy - 5, LEATHER[3])
            c.line(sx + 6, sy - 2, sx + 13, sy - 1, LEATHER[2])
            c.shaded_ellipse(sx + 15, sy - 5, 2, 2, STONE)
        elif a == 'attack_2':
            c.shaded_line(sx, sy, sx + 5, sy + 2, SKIN_TAN, 2)
            c.line(sx + 5, sy + 2, sx + 11, sy + 5, LEATHER[2])
        else:
            sway = 1 if a in ('walk_0', 'walk_3') else -1
            c.shaded_line(sx, sy, sx + 4, sy + 2, SKIN_TAN, 2)
            c.line(sx + 4, sy + 2, sx + 9 + sway, sy + 6, LEATHER[3])
            c.line(sx + 4, sy + 2, sx + 7 + sway, sy + 7, LEATHER[1])
            c.shaded_ellipse(sx + 9 + sway, sy + 7, 2, 2, STONE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.px(sx + 16, sy - 6, OFF_WHITE)
            c.px(sx + 18, sy - 6, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN_TAN, torso=FUR, legs=SKIN_TAN, boots=LEATHER,
        belt=T_MID, buckle=BONE[3],
        has_team_sash=True, has_team_shoulder=False,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_dino_rider(anim: str) -> tuple[PixelCanvas, int, int]:
    """Muscular scaled raptor/T-Rex dinosaur mount + tribal spearman (56x52px)."""
    w, h = 56, 52
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        # Toppled dinosaur & rider knocked down
        c.shaded_ellipse(26, gy - 7, 16, 6, DINO_GREEN)
        c.shaded_ellipse(27, gy - 5, 11, 3, DINO_BELLY)
        c.shaded_ellipse(43, gy - 5, 6, 4, DINO_GREEN)
        c.px(44, gy - 6, INK)
        c.px(45, gy - 5, INK)
        c.poly([(12, gy - 7), (2, gy - 4), (12, gy - 4)], DINO_GREEN[1])
        c.box(21, gy - 12, 9, 4, TEAM_RAMP)
        c.shaded_ellipse(16, gy - 11, 3, 3, SKIN)
        c.shaded_line(19, gy - 12, 34, gy - 13, WOOD, 1)
        c.px(35, gy - 13, BONE[4])
        c.add_outline(INK)
        draw_smoke_puff(c, 36, gy - 10, 3)
        return c, 28, gy

    # Gait cycle
    if anim == 'walk_0':
        f_dx, b_dx, bob, tail_dy, jaw_open = 5, -5, 0, 1, 0
    elif anim == 'walk_1':
        f_dx, b_dx, bob, tail_dy, jaw_open = 1, -1, -2, -1, 0
    elif anim == 'walk_2':
        f_dx, b_dx, bob, tail_dy, jaw_open = -5, 5, 0, -2, 0
    elif anim == 'walk_3':
        f_dx, b_dx, bob, tail_dy, jaw_open = -1, 1, -2, 0, 0
    elif anim == 'attack_0':
        f_dx, b_dx, bob, tail_dy, jaw_open = -2, -6, -1, 2, 2
    elif anim == 'attack_1':
        f_dx, b_dx, bob, tail_dy, jaw_open = 6, -4, 1, -2, 5
    elif anim == 'attack_2':
        f_dx, b_dx, bob, tail_dy, jaw_open = 4, -3, 0, 0, 1
    else:  # hurt_0
        f_dx, b_dx, bob, tail_dy, jaw_open = -3, -5, -2, 2, 2

    dx = 2 if anim == 'attack_1' else (-2 if anim == 'hurt_0' else 0)
    body_cx = 26 + dx
    body_cy = gy - 17 + bob

    # 1. Back leg (darker green)
    b_hip_x, b_hip_y = body_cx - 3, body_cy + 4
    b_knee_x, b_knee_y = b_hip_x + b_dx // 2 - 2, gy - 8
    b_foot_x, b_foot_y = b_hip_x + b_dx, gy - 1
    c.line(b_hip_x, b_hip_y, b_knee_x, b_knee_y, DINO_GREEN[0], 4)
    c.line(b_knee_x, b_knee_y, b_foot_x, b_foot_y, DINO_GREEN[1], 3)
    c.rect(b_foot_x - 2, gy - 2, 6, 2, DINO_GREEN[0])
    c.px(b_foot_x + 4, gy - 1, BONE[3])

    # 2. Muscular whip tail
    tail_pts = [
        (body_cx - 9, body_cy - 3),
        (body_cx - 23, body_cy - 2 + tail_dy),
        (body_cx - 21, body_cy + 2 + tail_dy),
        (body_cx - 8, body_cy + 5),
    ]
    c.shaded_poly(tail_pts, DINO_GREEN)

    # 3. Torso + pale ribbed belly
    c.shaded_ellipse(body_cx, body_cy, 13, 8, DINO_GREEN)
    c.shaded_ellipse(body_cx + 1, body_cy + 4, 9, 4, DINO_BELLY)
    # Dark tiger stripes along dinosaur back
    for sx in (-7, -3, 1, 5):
        c.line(body_cx + sx, body_cy - 7, body_cx + sx - 1, body_cy - 3, DINO_GREEN[0], 2)

    # 4. Neck & Fierce Snapping Head
    head_x = body_cx + 13 + (3 if anim == 'attack_1' else 0)
    head_y = body_cy - 9 + (2 if anim == 'attack_1' else 0)
    neck_pts = [
        (body_cx + 6, body_cy - 5),
        (head_x - 3, head_y - 3),
        (head_x + 2, head_y + 4),
        (body_cx + 10, body_cy + 3),
    ]
    c.shaded_poly(neck_pts, DINO_GREEN)
    # Upper skull / snout
    c.shaded_ellipse(head_x + 2, head_y - 2, 7, 4, DINO_GREEN)
    c.rect(head_x + 4, head_y - 4, 6, 4, DINO_GREEN[2])
    c.rect(head_x + 4, head_y - 4, 6, 1, DINO_GREEN[3])
    # Fierce yellow eye + nostril
    c.rect(head_x + 1, head_y - 4, 2, 2, FIRE[3])
    c.px(head_x + 2, head_y - 3, INK)
    c.px(head_x + 8, head_y - 3, DINO_GREEN[0])
    # Lower jaw (opens wide on attack!)
    jaw_y = head_y + 1 + jaw_open
    c.rect(head_x + 1, jaw_y, 8, 2, DINO_GREEN[1])
    if jaw_open > 0:
        # Red mouth interior + white fangs!
        c.rect(head_x + 2, head_y, 6, jaw_open + 1, (140, 28, 36, 255))
        for tx in (head_x + 4, head_x + 6, head_x + 8):
            c.px(tx, head_y, WHITE)
            c.px(tx - 1, jaw_y, WHITE)
    else:
        c.px(head_x + 6, head_y + 1, WHITE)
        c.px(head_x + 8, head_y + 1, WHITE)

    # Tiny clawed forelimb
    c.line(body_cx + 9, body_cy + 1, body_cx + 13, body_cy + 4, DINO_GREEN[2], 2)
    c.px(body_cx + 14, body_cy + 4, BONE[3])

    # 5. Front Muscular Leg
    f_hip_x, f_hip_y = body_cx - 1, body_cy + 3
    f_knee_x, f_knee_y = f_hip_x + f_dx // 2 + 1, gy - 8
    f_foot_x, f_foot_y = f_hip_x + f_dx, gy - 1
    c.shaded_ellipse(f_hip_x, f_hip_y, 5, 5, DINO_GREEN)
    c.line(f_hip_x, f_hip_y + 2, f_knee_x, f_knee_y, DINO_GREEN[2], 4)
    c.line(f_knee_x, f_knee_y, f_foot_x, f_foot_y, DINO_GREEN[2], 3)
    c.line(f_knee_x + 1, f_knee_y, f_foot_x + 1, f_foot_y - 1, DINO_GREEN[3], 1)
    c.rect(f_foot_x - 2, gy - 2, 7, 2, DINO_GREEN[1])
    c.px(f_foot_x + 5, gy - 1, BONE[4])
    c.px(f_foot_x + 4, gy - 2, BONE[3])

    # 6. Tribal Saddle Cloth (Team Color!) & Rider
    saddle_x = body_cx - 5
    saddle_y = body_cy - 8
    c.box(saddle_x, saddle_y, 11, 7, TEAM_RAMP)
    c.rect(saddle_x + 1, saddle_y + 5, 9, 1, GOLD[3])
    c.rect(saddle_x - 1, saddle_y, 12, 2, LEATHER[2])

    # Rider sitting on saddle
    rx = body_cx - 1
    ry = saddle_y - 2
    # Rider leg gripping dino
    c.rect(rx - 1, ry + 2, 4, 5, SKIN[2])
    c.rect(rx, ry + 6, 3, 2, LEATHER[2])
    # Rider torso
    c.box(rx - 3, ry - 7, 7, 8, FUR)
    c.rect(rx - 2, ry - 4, 6, 2, T_MID)
    c.rect(rx - 1, ry - 4, 4, 1, T_LIGHT)
    # Rider head + bone skull/plume helm
    c.shaded_ellipse(rx, ry - 11, 3, 3, SKIN)
    c.px(rx + 2, ry - 11, INK)
    c.shaded_ellipse(rx - 1, ry - 13, 4, 2, BONE)
    c.line(rx - 3, ry - 14, rx - 7, ry - 17, T_LIGHT, 2)
    c.px(rx - 7, ry - 17, T_TRIM)

    # Rider weapon: long bone-tipped hunting spear
    spear_shift = -4 if anim == 'attack_0' else (7 if anim == 'attack_1' else 2)
    c.shaded_line(rx + 1, ry - 5, rx + 5 + spear_shift // 2, ry - 3, SKIN, 2)
    c.shaded_line(rx - 7 + spear_shift, ry - 3, rx + 19 + spear_shift, ry - 5, WOOD, 2)
    # Jagged flint/bone spearhead + team tassel
    c.poly([(rx + 18 + spear_shift, ry - 7), (rx + 25 + spear_shift, ry - 5), (rx + 18 + spear_shift, ry - 3)], BONE[3])
    c.px(rx + 22 + spear_shift, ry - 5, WHITE)
    c.rect(rx + 16 + spear_shift, ry - 4, 2, 3, T_LIGHT)

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_slash_smear(c, head_x + 9, head_y, 7, FIRE[2], FIRE[3])
    elif anim == 'hurt_0':
        draw_hit_sparks(c, body_cx + 8, body_cy - 6)

    return c, 28, gy


# =============================================================================
# ERA 2: ANCIENT ERA (spearman, archer, chariot)
# =============================================================================

def gen_spearman(anim: str) -> tuple[PixelCanvas, int, int]:
    """Bronze Spartan/Hoplite Shield-Spearman (38x38px)."""
    w, h = 38, 38

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Corinthian bronze helmet with dark visor slit
        c.shaded_ellipse(cx, cy, 4, 4, BRONZE)
        c.rect(cx + 1, cy - 1, 3, 2, INK)
        c.px(cx + 2, cy, SKIN[2])
        # Prominent high sweeping team-colored horsehair crest!
        c.poly([(cx - 4, cy - 3), (cx - 1, cy - 8), (cx + 4, cy - 6), (cx + 2, cy - 3)], T_MID)
        c.line(cx - 3, cy - 4, cx - 1, cy - 7, T_LIGHT, 1)
        c.line(cx - 1, cy - 7, cx + 3, cy - 6, T_LIGHT, 1)
        c.px(cx - 5, cy - 2, T_SHADE)

    def shield(c: PixelCanvas, shx: int, shy: int, a: str) -> None:
        if a == 'death_0':
            return
        dx = -1 if a == 'attack_0' else (1 if a == 'attack_1' else 0)
        # Round bronze hoplite aspis shield with bold team face
        c.shaded_ellipse(shx + dx, shy + 1, 5, 6, BRONZE)
        c.shaded_ellipse(shx + dx, shy + 1, 3, 4, TEAM_RAMP)
        c.px(shx + dx + 1, shy, GOLD[4])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx - 4, sy + 2, sx + 14, sy + 2, WOOD, 1)
            c.poly([(sx + 13, sy + 1), (sx + 17, sy + 2), (sx + 13, sy + 3)], BRONZE[3])
            return
        thrust = -4 if a == 'attack_0' else (7 if a == 'attack_1' else 3)
        y_off = -1 if a == 'attack_1' else 0
        c.shaded_line(sx - 8 + thrust, sy + 1 + y_off, sx + 12 + thrust, sy - 1 + y_off, WOOD, 1)
        # Spearhead
        c.poly([(sx + 11 + thrust, sy - 3 + y_off), (sx + 17 + thrust, sy - 1 + y_off), (sx + 11 + thrust, sy + 1 + y_off)], STEEL[3])
        c.px(sx + 15 + thrust, sy - 1 + y_off, WHITE)
        # Arm holding spear
        c.shaded_line(sx - 1, sy, sx + 2 + thrust // 2, sy + 1 + y_off, SKIN, 2)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.line(sx + 15, sy - 2, sx + 22, sy - 2, T_GLOW)
            c.line(sx + 17, sy - 1, sx + 23, sy - 1, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=BRONZE, legs=SKIN, boots=BRONZE,
        belt=LEATHER[1], buckle=GOLD[3],
        cape_ramp=TEAM_RAMP, has_team_shoulder=True,
        head_fn=head, shield_fn=shield, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_archer(anim: str) -> tuple[PixelCanvas, int, int]:
    """Ancient Recurve Bowman with quiver & team cloak (36x36px)."""
    w, h = 36, 36

    def backpack(c: PixelCanvas, bx: int, by: int, a: str) -> None:
        # Leather quiver with white-fletched arrows sticking out
        c.line(bx - 1, by - 2, bx + 1, by + 6, LEATHER[2], 3)
        c.px(bx - 2, by - 3, WHITE)
        c.px(bx, by - 4, WHITE)
        c.px(bx - 1, by - 2, T_LIGHT)

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        _draw_face_base(c, cx, cy, SKIN)
        # Conical bronze/leather archer cap + team headband
        c.poly([(cx - 4, cy - 2), (cx, cy - 6), (cx + 4, cy - 2)], BRONZE[2])
        c.line(cx - 2, cy - 3, cx, cy - 5, BRONZE[3])
        c.rect(cx - 4, cy - 2, 8, 2, T_MID)
        c.rect(cx - 2, cy - 2, 5, 1, T_LIGHT)

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.line(sx + 2, sy, sx + 7, sy + 2, WOOD[3])
            c.line(sx + 7, sy + 2, sx + 11, sy + 1, WOOD[2])
            return
        bx = sx + 7
        by = sy - 1
        # Curved wooden recurve war bow
        c.line(bx - 2, by - 7, bx + 2, by - 4, WOOD[3])
        c.line(bx + 2, by - 4, bx + 3, by, WOOD[2])
        c.line(bx + 3, by, bx + 2, by + 4, WOOD[2])
        c.line(bx + 2, by + 4, bx - 2, by + 7, WOOD[1])
        # Bowstring & arrow animation
        if a == 'attack_0':
            # Drawn taut!
            c.line(bx - 2, by - 6, sx - 1, by, OFF_WHITE)
            c.line(sx - 1, by, bx - 2, by + 6, OFF_WHITE)
            c.line(sx - 1, by, bx + 7, by, WOOD[3])
            c.px(bx + 8, by, WHITE)
            c.px(sx - 1, by - 1, T_LIGHT)
            c.shaded_line(sx - 1, sy, sx + 1, by, SKIN, 2)
        elif a == 'attack_1':
            # Released! String vibrating straight, arrow flying off tip
            c.line(bx - 2, by - 6, bx - 2, by + 6, OFF_WHITE)
            c.shaded_line(sx, sy, sx + 5, by, SKIN, 2)
            c.line(bx + 4, by, bx + 11, by, WOOD[3])
            c.px(bx + 12, by, WHITE)
        else:
            c.line(bx - 2, by - 6, bx - 2, by + 6, OFF_WHITE)
            c.shaded_line(sx, sy, sx + 5, sy + 1, SKIN, 2)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=LEATHER, legs=KHAKI, boots=LEATHER,
        belt=T_MID, buckle=BRONZE[3],
        has_team_tabard=True, has_team_shoulder=True,
        backpack_fn=backpack, head_fn=head, weapon_fn=weapon,
        anchor_x=14,
    )
    return c, 14, h - 2


def gen_chariot(anim: str) -> tuple[PixelCanvas, int, int]:
    """Ancient Armored War Chariot with galloping warhorse & charioteer (64x52px)."""
    w, h = 64, 52
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        # Shattered chariot wheel & fallen horse
        c.shaded_ellipse(42, gy - 6, 11, 5, HORSE_BAY)
        c.shaded_ellipse(54, gy - 5, 4, 3, HORSE_BAY)
        c.box(8, gy - 9, 18, 7, BRONZE)
        c.box(10, gy - 7, 12, 4, TEAM_RAMP)
        c.wheel(18, gy - 5, 6, BRONZE, WOOD[2], 0.4)
        c.add_outline(INK)
        draw_smoke_puff(c, 22, gy - 11, 4)
        return c, 32, gy

    walk_phases = {'walk_0': 0.0, 'walk_1': 0.55, 'walk_2': 1.1, 'walk_3': 1.65}
    w_phase = walk_phases.get(anim, 0.2)
    bob = -1 if anim in ('walk_1', 'walk_3') else (1 if anim == 'attack_1' else 0)
    horse_stride = math.sin(w_phase * 2.8)
    dx = 2 if anim == 'attack_1' else (-2 if anim == 'hurt_0' else 0)

    # 1. Warhorse (right half of sprite, x=32..58)
    hx = 44 + dx
    hy = gy - 18 + bob
    # Horse back legs
    fl = int(round(horse_stride * 5))
    c.line(hx - 6, hy + 4, hx - 8 - fl, gy - 2, HORSE_BAY[0], 3)
    c.line(hx + 5, hy + 4, hx + 6 + fl, gy - 2, HORSE_BAY[0], 3)
    # Flowing dark mane & tail
    c.line(hx - 10, hy - 1, hx - 14, hy + 5, CHARCOAL[1], 3)
    # Horse body + team caparison cloth
    c.shaded_ellipse(hx, hy, 11, 6, HORSE_BAY)
    c.box(hx - 6, hy - 4, 11, 6, TEAM_RAMP)
    c.rect(hx - 6, hy + 1, 11, 1, GOLD[3])
    # Front legs
    c.line(hx - 5, hy + 4, hx - 4 + fl, gy - 1, HORSE_BAY[2], 3)
    c.line(hx + 6, hy + 3, hx + 8 - fl, gy - 1, HORSE_BAY[2], 3)
    c.px(hx - 4 + fl, gy - 1, CHARCOAL[0])
    c.px(hx + 8 - fl, gy - 1, CHARCOAL[0])
    # Arched neck & armored head
    neck_pts = [(hx + 6, hy - 2), (hx + 10, hy - 12), (hx + 14, hy - 10), (hx + 11, hy + 1)]
    c.shaded_poly(neck_pts, HORSE_BAY)
    c.line(hx + 7, hy - 5, hx + 9, hy - 12, CHARCOAL[1], 2)  # mane
    # Horse head + bronze chanfron + team crest plume
    head_pts = [(hx + 10, hy - 12), (hx + 18, hy - 8), (hx + 16, hy - 5), (hx + 10, hy - 6)]
    c.shaded_poly(head_pts, HORSE_BAY)
    c.line(hx + 11, hy - 12, hx + 17, hy - 9, BRONZE[3], 2)
    c.px(hx + 13, hy - 10, INK)
    c.poly([(hx + 8, hy - 13), (hx + 11, hy - 17), (hx + 14, hy - 13)], T_LIGHT)

    # 2. Yoke & wooden shaft connecting chariot to horse
    c.shaded_line(24 + dx, gy - 12 + bob, hx + 5, hy - 2, WOOD, 2)
    c.line(22 + dx, gy - 26 + bob, hx + 11, hy - 8, LEATHER[3], 1)  # reins

    # 3. Charioteer standing inside bronze box (x=14..24)
    cx = 16 + dx
    cy = gy - 23 + bob
    # Torso in bronze cuirass + team cape
    c.poly([(cx - 4, cy - 3), (cx - 11, cy + 3), (cx - 9, cy + 8), (cx - 2, cy + 4)], T_MID)
    c.box(cx - 3, cy - 4, 8, 9, BRONZE)
    c.box(cx - 1, cy - 3, 4, 3, TEAM_RAMP)
    # Plumed bronze helmet
    c.shaded_ellipse(cx + 1, cy - 8, 4, 4, BRONZE)
    c.rect(cx + 2, cy - 9, 2, 2, INK)
    c.poly([(cx - 3, cy - 11), (cx, cy - 15), (cx + 5, cy - 12), (cx + 2, cy - 10)], T_MID)
    c.line(cx - 1, cy - 14, cx + 4, cy - 12, T_LIGHT)

    # Charioteer thrusting long spear
    sp_dx = -4 if anim == 'attack_0' else (8 if anim == 'attack_1' else 2)
    c.shaded_line(cx - 3 + sp_dx, cy - 2, cx + 22 + sp_dx, cy - 4, WOOD, 2)
    c.poly([(cx + 21 + sp_dx, cy - 6), (cx + 27 + sp_dx, cy - 4), (cx + 21 + sp_dx, cy - 2)], STEEL[3])
    c.px(cx + 25 + sp_dx, cy - 4, WHITE)
    c.shaded_line(cx + 1, cy - 2, cx + 5 + sp_dx // 2, cy - 2, SKIN, 2)

    # 4. Gilded Bronze Chariot Body + Team Shield Emblem
    c.box(8 + dx, gy - 21 + bob, 18, 12, BRONZE)
    c.box(11 + dx, gy - 19 + bob, 12, 8, TEAM_RAMP)
    c.rect(8 + dx, gy - 22 + bob, 19, 2, GOLD[3])
    c.rect(14 + dx, gy - 17 + bob, 6, 4, GOLD[3])
    # Front curved bronze prow
    c.poly([(25 + dx, gy - 22 + bob), (29 + dx, gy - 17 + bob), (28 + dx, gy - 9 + bob), (25 + dx, gy - 9 + bob)], BRONZE[3])

    # 5. Large Spoked Bronze Chariot Wheel (rotates across walk frames!)
    c.wheel(17 + dx, gy - 8, 8, BRONZE, GOLD[2], w_phase)

    c.add_outline(INK)

    if anim == 'attack_1':
        draw_slash_smear(c, hx + 14, hy - 6, 8, GOLD[3], WHITE)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, hx + 6, hy - 4)

    return c, 32, gy


# =============================================================================
# ERA 3: MEDIEVAL ERA (knight, crossbowman, heavy_cavalry, catapult)
# =============================================================================

def gen_knight(anim: str) -> tuple[PixelCanvas, int, int]:
    """Full-plate Medieval Steel Knight with kite shield, plumed great helm & broadsword (38x38px)."""
    w, h = 38, 38

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        # Steel Great Helm with cross-visor & specular glint
        c.box(cx - 4, cy - 4, 8, 8, STEEL)
        c.rect(cx, cy - 1, 4, 2, INK)  # eye visor slit
        c.px(cx + 2, cy + 2, INK)  # breather holes
        c.px(cx + 3, cy + 2, INK)
        c.rect(cx - 3, cy - 3, 2, 5, STEEL[4])
        # Gold crown band
        c.rect(cx - 4, cy - 4, 8, 1, GOLD[3])
        # Waving knight plume!
        wave = -1 if a in ('walk_1', 'walk_3', 'attack_1') else 0
        c.poly([(cx - 2, cy - 5), (cx - 7, cy - 7 + wave), (cx - 8, cy - 3 + wave), (cx - 3, cy - 4)], T_MID)
        c.line(cx - 2, cy - 5, cx - 7, cy - 7 + wave, T_LIGHT)

    def shield(c: PixelCanvas, shx: int, shy: int, a: str) -> None:
        if a == 'death_0':
            return
        dx = -1 if a == 'attack_0' else (1 if a == 'attack_1' else 0)
        # Heraldic Medieval Kite Shield
        pts = [
            (shx - 3 + dx, shy - 5),
            (shx + 4 + dx, shy - 5),
            (shx + 4 + dx, shy + 1),
            (shx + dx, shy + 7),
            (shx - 3 + dx, shy + 1),
        ]
        c.shaded_poly(pts, TEAM_RAMP)
        # Steel rim & gold cross
        c.rect(shx - 3 + dx, shy - 5, 7, 1, STEEL[3])
        c.rect(shx + dx, shy - 4, 1, 9, GOLD[3])
        c.rect(shx - 2 + dx, shy - 1, 5, 1, GOLD[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx + 2, sy + 2, sx + 14, sy + 1, STEEL, 2)
            c.rect(sx + 3, sy, 2, 4, GOLD[3])
            return
        if a == 'attack_0':
            # Broadsword raised overhead ready to cleave
            c.shaded_line(sx, sy, sx - 2, sy - 6, STEEL, 2)
            c.rect(sx - 4, sy - 7, 5, 2, GOLD[3])
            c.shaded_line(sx - 2, sy - 7, sx - 7, sy - 15, STEEL, 2)
            c.px(sx - 7, sy - 15, WHITE)
        elif a == 'attack_1':
            # Full forward horizontal/diagonal cleave!
            c.shaded_line(sx, sy, sx + 5, sy, STEEL, 2)
            c.rect(sx + 5, sy - 3, 2, 6, GOLD[3])
            c.shaded_line(sx + 6, sy, sx + 18, sy + 2, STEEL, 2)
            c.line(sx + 7, sy - 1, sx + 17, sy + 1, WHITE)
        elif a == 'attack_2':
            c.shaded_line(sx, sy, sx + 4, sy + 2, STEEL, 2)
            c.rect(sx + 4, sy + 1, 2, 4, GOLD[3])
            c.shaded_line(sx + 5, sy + 3, sx + 14, sy + 8, STEEL, 2)
        else:
            sway = -1 if a in ('walk_1', 'walk_2') else 0
            c.shaded_line(sx, sy, sx + 4, sy + 1 + sway, STEEL, 2)
            c.rect(sx + 3, sy - 1 + sway, 4, 2, GOLD[3])
            c.shaded_line(sx + 5, sy - 1 + sway, sx + 12, sy - 10 + sway, STEEL, 2)
            c.px(sx + 12, sy - 10 + sway, WHITE)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            draw_slash_smear(c, sx + 9, sy, 10, T_LIGHT, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=STEEL, torso=STEEL, legs=STEEL, boots=STEEL,
        belt=LEATHER[1], buckle=GOLD[3],
        has_team_tabard=True, cape_ramp=TEAM_RAMP, has_team_shoulder=True,
        head_fn=head, shield_fn=shield, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_crossbowman(anim: str) -> tuple[PixelCanvas, int, int]:
    """Medieval Kettle-Helm Crossbowman with steel-prodded crossbow (36x36px)."""
    w, h = 36, 36

    def head(c: PixelCanvas, cx: int, cy: int, a: str) -> None:
        _draw_face_base(c, cx, cy, SKIN)
        # Wide-brimmed medieval steel kettle helmet
        c.shaded_ellipse(cx, cy - 3, 4, 3, STEEL)
        c.rect(cx - 6, cy - 2, 12, 2, STEEL[2])
        c.rect(cx - 5, cy - 2, 10, 1, STEEL[3])

    def weapon(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'death_0':
            c.shaded_line(sx + 1, sy + 2, sx + 11, sy + 2, WOOD, 2)
            c.line(sx + 9, sy, sx + 9, sy + 4, STEEL[3])
            return
        recoil = -2 if a == 'attack_1' else 0
        # Heavy wooden crossbow stock & steel bow prod
        c.shaded_line(sx - 1 + recoil, sy + 1, sx + 11 + recoil, sy, WOOD, 2)
        c.line(sx + 9 + recoil, sy - 5, sx + 12 + recoil, sy, STEEL[3], 2)
        c.line(sx + 12 + recoil, sy, sx + 9 + recoil, sy + 5, STEEL[2], 2)
        # Bolt loaded in attack_0 / walk
        if a != 'attack_2':
            bolt_x = sx + (14 if a == 'attack_1' else 11) + recoil
            c.line(sx + 4 + recoil, sy - 1, bolt_x, sy - 1, STEEL[4])
            c.px(bolt_x + 1, sy - 1, WHITE)
        # Trigger hand
        c.shaded_line(sx, sy, sx + 4 + recoil, sy + 1, SKIN, 2)

    def post_fx(c: PixelCanvas, sx: int, sy: int, a: str) -> None:
        if a == 'attack_1':
            c.line(sx + 13, sy - 1, sx + 19, sy - 1, OFF_WHITE)
            c.px(sx + 19, sy - 1, WHITE)

    c = draw_humanoid(
        w, h, anim,
        skin=SKIN, torso=LEATHER, legs=CHARCOAL, boots=LEATHER,
        belt=LEATHER[0], buckle=STEEL[3],
        has_team_tabard=True, has_team_shoulder=True,
        head_fn=head, weapon_fn=weapon, post_fx_fn=post_fx,
        anchor_x=15,
    )
    return c, 15, h - 2


def gen_heavy_cavalry(anim: str) -> tuple[PixelCanvas, int, int]:
    """Armored Destrier Warhorse & Plate Lancer Knight with Team Caparison & Pennant (60x56px)."""
    w, h = 60, 56
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        c.shaded_ellipse(28, gy - 7, 15, 6, HORSE_GREY)
        c.box(18, gy - 11, 18, 7, TEAM_RAMP)
        c.shaded_ellipse(44, gy - 6, 5, 3, STEEL)
        c.box(16, gy - 15, 7, 5, STEEL)
        c.shaded_line(14, gy - 14, 48, gy - 12, WOOD, 2)
        c.add_outline(INK)
        draw_smoke_puff(c, 32, gy - 12, 4)
        return c, 30, gy

    if anim == 'walk_0':
        fl, bl, bob = 6, -5, 0
    elif anim == 'walk_1':
        fl, bl, bob = 1, 2, -2
    elif anim == 'walk_2':
        fl, bl, bob = -6, 5, 0
    elif anim == 'walk_3':
        fl, bl, bob = -1, -2, -2
    elif anim == 'attack_0':
        fl, bl, bob = -3, -5, -1
    elif anim == 'attack_1':
        fl, bl, bob = 7, -5, 1
    elif anim == 'attack_2':
        fl, bl, bob = 4, -3, 0
    else:
        fl, bl, bob = -4, -3, -1

    dx = 2 if anim == 'attack_1' else (-2 if anim == 'hurt_0' else 0)
    hx = 27 + dx
    hy = gy - 19 + bob

    # 1. Horse far legs
    c.line(hx - 9, hy + 4, hx - 12 + bl, gy - 1, HORSE_GREY[0], 3)
    c.line(hx + 8, hy + 4, hx + 10 - fl, gy - 1, HORSE_GREY[0], 3)

    # 2. Flowing tail
    c.line(hx - 13, hy - 2, hx - 18, hy + 5, HORSE_GREY[1], 3)
    c.line(hx - 14, hy - 1, hx - 17, hy + 6, HORSE_GREY[2], 1)

    # 3. Warhorse body draped in rich royal team caparison cloth + gold trim!
    c.shaded_ellipse(hx, hy, 14, 7, HORSE_GREY)
    c.box(hx - 13, hy - 5, 25, 11, TEAM_RAMP)
    c.rect(hx - 13, hy + 5, 25, 2, GOLD[3])
    c.rect(hx - 12, hy + 6, 23, 1, GOLD[1])
    # Steel breastplate barding on horse chest
    c.shaded_ellipse(hx + 10, hy - 1, 5, 5, STEEL)

    # 4. Horse near legs with steel greaves
    c.line(hx - 8, hy + 5, hx - 9 - bl, gy - 1, HORSE_GREY[2], 3)
    c.line(hx + 8, hy + 4, hx + 11 + fl, gy - 1, HORSE_GREY[2], 3)
    c.px(hx - 9 - bl, gy - 1, CHARCOAL[0])
    c.px(hx + 11 + fl, gy - 1, CHARCOAL[0])

    # 5. Horse armored neck & steel chanfron head
    c.shaded_poly([(hx + 8, hy - 4), (hx + 14, hy - 15), (hx + 19, hy - 13), (hx + 14, hy + 1)], TEAM_RAMP)
    c.shaded_poly([(hx + 14, hy - 15), (hx + 23, hy - 10), (hx + 21, hy - 6), (hx + 14, hy - 8)], STEEL)
    c.px(hx + 18, hy - 12, INK)
    c.poly([(hx + 12, hy - 15), (hx + 15, hy - 20), (hx + 18, hy - 15)], T_LIGHT)

    # 6. Full-Plate Lancer Knight in high saddle
    kx = hx - 2
    ky = hy - 11
    # Knight armored leg in stirrup
    c.box(kx - 2, ky + 4, 5, 9, STEEL)
    # Flowing knight cloak
    c.poly([(kx - 4, ky - 5), (kx - 13, ky + 3), (kx - 11, ky + 9), (kx - 3, ky + 4)], T_SHADE)
    # Plate cuirass + team tabard
    c.box(kx - 4, ky - 6, 9, 10, STEEL)
    c.box(kx - 2, ky - 5, 6, 8, TEAM_RAMP)
    c.box(kx - 3, ky - 6, 5, 4, STEEL)  # shoulder pauldron
    # Knight helmet + soaring team plume
    c.box(kx - 3, ky - 14, 8, 8, STEEL)
    c.rect(kx + 1, ky - 11, 4, 2, INK)
    c.rect(kx - 3, ky - 14, 8, 1, GOLD[3])
    c.poly([(kx - 2, ky - 15), (kx - 9, ky - 19), (kx - 11, ky - 13), (kx - 4, ky - 13)], T_MID)
    c.line(kx - 2, ky - 15, kx - 9, ky - 19, T_LIGHT)

    # 7. Couched Jousting Lance + Fluttering Pennant!
    lance_dx = -5 if anim == 'attack_0' else (7 if anim == 'attack_1' else 0)
    ly = ky - 1
    # Guard cone (vamplate)
    c.poly([(kx + 4 + lance_dx, ly - 3), (kx + 10 + lance_dx, ly), (kx + 4 + lance_dx, ly + 3)], STEEL[3])
    # Tapered striped lance shaft extending far right
    c.shaded_line(kx - 6 + lance_dx, ly + 1, min(w - 3, kx + 33 + lance_dx), ly - 2, WOOD, 2)
    tip_x = min(w - 2, kx + 34 + lance_dx)
    c.line(tip_x - 6, ly - 2, tip_x, ly - 2, STEEL[4], 2)
    c.px(tip_x, ly - 2, WHITE)
    # Fluttering triangular lance pennant
    p_x = min(w - 9, kx + 22 + lance_dx)
    wave = 1 if anim in ('walk_1', 'walk_3', 'attack_1') else -1
    c.poly([(p_x, ly - 1), (p_x - 7, ly + 3 + wave), (p_x - 2, ly + 5 + wave), (p_x, ly + 1)], T_LIGHT)

    # Shield mounted on knight's side
    c.box(kx + 1, ky - 2, 5, 7, TEAM_RAMP)
    c.rect(kx + 3, ky - 1, 1, 5, GOLD[3])

    c.add_outline(INK)

    if anim == 'attack_1':
        c.line(tip_x - 3, ly - 3, w - 1, ly - 3, T_GLOW)
        c.line(tip_x - 2, ly - 2, w - 1, ly - 2, WHITE)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, hx + 8, hy - 10)

    return c, 30, gy


def gen_catapult(anim: str) -> tuple[PixelCanvas, int, int]:
    """Medieval Timber Siege Catapult with animated spoked wheels & swinging arm (60x54px)."""
    w, h = 60, 54
    c = PixelCanvas(w, h)
    gy = h - 2

    if anim == 'death_0':
        # Splintered siege frame
        c.box(10, gy - 9, 34, 6, WOOD_DARK)
        c.line(18, gy - 9, 36, gy - 16, WOOD[2], 3)
        c.wheel(16, gy - 5, 5, WOOD, IRON[2], 0.5)
        c.wheel(38, gy - 5, 5, WOOD, IRON[2], 1.1)
        c.add_outline(INK)
        draw_smoke_puff(c, 28, gy - 14, 5)
        return c, 30, gy

    phases = {'walk_0': 0.0, 'walk_1': 0.4, 'walk_2': 0.8, 'walk_3': 1.2}
    w_phase = phases.get(anim, 0.0)
    rumble = -1 if anim in ('walk_1', 'walk_3') else 0
    recoil = -2 if anim == 'attack_1' else 0

    bx = 10 + recoil
    by = gy - 13 + rumble

    # 1. Rear wheels (darker)
    c.wheel(bx + 7, gy - 7, 6, WOOD_DARK, IRON[1], w_phase + 0.3)
    c.wheel(bx + 32, gy - 7, 6, WOOD_DARK, IRON[1], w_phase + 0.3)

    # 2. Swinging Torsion Throwing Arm (drawn behind A-frame crossbar)
    pivot_x = bx + 20
    pivot_y = by - 2
    if anim == 'attack_0':
        # Cocked all the way back & down with heavy boulder loaded!
        arm_x, arm_y = pivot_x - 16, pivot_y - 4
        has_rock = True
    elif anim == 'attack_1':
        # Whipped violently forward-up against crossbar, launching boulder!
        arm_x, arm_y = pivot_x + 11, pivot_y - 24
        has_rock = False
    elif anim == 'attack_2':
        # Settling slightly back after firing
        arm_x, arm_y = pivot_x + 4, pivot_y - 22
        has_rock = False
    else:
        # Ready half-cocked marching position with rock
        arm_x, arm_y = pivot_x - 12, pivot_y - 14
        has_rock = True

    c.shaded_line(pivot_x, pivot_y, arm_x, arm_y, WOOD, 3)
    # Throwing cup
    c.shaded_ellipse(arm_x, arm_y, 4, 3, WOOD_DARK)
    if has_rock:
        c.shaded_ellipse(arm_x, arm_y - 3, 4, 4, STONE)

    # 3. Heavy Timber Chassis & A-Frame Struts
    c.box(bx, by, 39, 7, WOOD)
    # Iron corner plates & rivets
    c.box(bx, by, 5, 7, IRON)
    c.box(bx + 34, by, 5, 7, IRON)
    # Upright A-frame posts
    c.shaded_line(bx + 10, by, bx + 22, by - 20, WOOD, 3)
    c.shaded_line(bx + 33, by, bx + 24, by - 20, WOOD, 3)
    # Padded leather stop crossbar
    c.box(bx + 18, by - 22, 11, 5, WOOD_DARK)
    c.rect(bx + 19, by - 21, 9, 3, LEATHER[2])
    # Coiled rope torsion bundle
    c.box(pivot_x - 3, pivot_y - 2, 7, 5, BONE)
    c.rect(pivot_x - 2, pivot_y - 1, 1, 3, BONE[1])
    c.rect(pivot_x + 1, pivot_y - 1, 1, 3, BONE[1])

    # 4. Team-colored armored side shield & war pennant!
    c.box(bx + 13, by - 1, 13, 8, TEAM_RAMP)
    c.rect(bx + 18, by, 2, 6, GOLD[3])
    c.rect(bx + 15, by + 2, 8, 2, GOLD[3])
    # Flagpole on frame
    c.line(bx + 26, by - 22, bx + 26, by - 32, WOOD[3])
    wave = 1 if anim in ('walk_1', 'walk_3', 'attack_1') else 0
    c.poly([(bx + 27, by - 32), (bx + 37, by - 29 + wave), (bx + 27, by - 26)], T_MID)
    c.line(bx + 27, by - 31, bx + 35, by - 29 + wave, T_LIGHT)

    # 5. Front Iron-Rimmed Spoked Wheels
    c.wheel(bx + 8, gy - 7, 7, WOOD, STEEL[2], w_phase)
    c.wheel(bx + 31, gy - 7, 7, WOOD, STEEL[2], w_phase)

    c.add_outline(INK)

    if anim == 'attack_1':
        # Kinetic launch arc + launched boulder glint
        draw_slash_smear(c, pivot_x + 2, pivot_y - 14, 13, SMOKE[3], OFF_WHITE)
    elif anim == 'hurt_0':
        draw_hit_sparks(c, bx + 26, by - 8)

    return c, 30, gy


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
