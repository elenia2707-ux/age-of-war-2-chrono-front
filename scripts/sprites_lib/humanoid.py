"""Metal Slug / classic 16-bit style pixel humanoid builder & shared VFX helpers."""

from __future__ import annotations

import math
from typing import Callable, Sequence

from .canvas import PixelCanvas
from .palettes import (
    FIRE,
    INK,
    INK_SOFT,
    OFF_WHITE,
    RGBA,
    SMOKE,
    T_DEEP,
    T_GLOW,
    T_LIGHT,
    T_MID,
    T_SHADE,
    T_TRIM,
    WHITE,
)

TEAM_RAMP = (T_DEEP, T_SHADE, T_MID, T_LIGHT, T_TRIM)

ANIM_FRAMES = (
    'walk_0',
    'walk_1',
    'walk_2',
    'walk_3',
    'attack_0',
    'attack_1',
    'attack_2',
    'hurt_0',
    'death_0',
)


def draw_muzzle_flash(c: PixelCanvas, x: int, y: int, size: int = 4, glow_ramp: Sequence[RGBA] = FIRE) -> None:
    """Draw a crisp star-shaped arcade pixel muzzle flash."""
    # Outer orange spikes
    c.line(x, y, x + size + 3, y, glow_ramp[2])
    c.line(x, y, x + size + 1, y - size + 1, glow_ramp[2])
    c.line(x, y, x + size + 1, y + size - 1, glow_ramp[2])
    c.line(x + 1, y - size, x + 1, y + size, glow_ramp[2])
    # Mid yellow core
    c.ellipse(x + 2, y, max(2, size - 1), max(2, size - 1), glow_ramp[3])
    c.line(x + 1, y, x + size + 2, y, glow_ramp[3])
    # Hot white center
    c.rect(x + 1, y - 1, max(2, size // 2 + 1), 3, glow_ramp[4])
    c.px(x + 1, y, WHITE)


def draw_smoke_puff(c: PixelCanvas, x: int, y: int, r: int = 3) -> None:
    """Draw a chunky pixel gunsmoke puff."""
    c.shaded_ellipse(x, y, r, max(2, r - 1), SMOKE)
    c.shaded_ellipse(x + r - 1, y - 1, max(1, r - 1), max(1, r - 1), SMOKE)


def draw_slash_smear(c: PixelCanvas, cx: int, cy: int, radius: int, col_outer: RGBA, col_inner: RGBA) -> None:
    """Draw a crisp pixel melee swing arc smear."""
    for step in range(-8, 9):
        ang = step * 0.14
        sx = int(round(cx + math.cos(ang) * radius))
        sy = int(round(cy + math.sin(ang) * radius))
        c.px(sx, sy, col_outer)
        sx2 = int(round(cx + math.cos(ang) * (radius - 1)))
        sy2 = int(round(cy + math.sin(ang) * (radius - 1)))
        c.px(sx2, sy2, col_inner)
        if abs(step) < 5:
            sx3 = int(round(cx + math.cos(ang) * (radius - 2)))
            sy3 = int(round(cy + math.sin(ang) * (radius - 2)))
            c.px(sx3, sy3, WHITE)


def draw_hit_sparks(c: PixelCanvas, x: int, y: int) -> None:
    """Crisp arcade impact cross-spark."""
    c.line(x - 3, y, x + 3, y, FIRE[3])
    c.line(x, y - 3, x, y + 3, FIRE[3])
    c.px(x - 2, y - 2, FIRE[2])
    c.px(x + 2, y - 2, FIRE[2])
    c.px(x - 2, y + 2, FIRE[2])
    c.px(x + 2, y + 2, FIRE[2])
    c.px(x, y, WHITE)


def draw_humanoid(
    w: int,
    h: int,
    anim: str,
    *,
    skin: Sequence[RGBA],
    torso: Sequence[RGBA],
    legs: Sequence[RGBA],
    boots: Sequence[RGBA],
    belt: RGBA = INK_SOFT,
    buckle: RGBA | None = None,
    has_team_tabard: bool = False,
    has_team_sash: bool = False,
    has_team_shoulder: bool = True,
    cape_ramp: Sequence[RGBA] | None = None,
    backpack_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    head_fn: Callable[[PixelCanvas, int, int, str], None],
    back_arm_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    weapon_fn: Callable[[PixelCanvas, int, int, str], None],
    shield_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    torso_detail_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    post_fx_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    anchor_x: int | None = None,
) -> PixelCanvas:
    """Render one frame of a dense Metal-Slug-style pixel humanoid."""
    c = PixelCanvas(w, h)
    cx = (w // 2 - 2) if anchor_x is None else anchor_x
    gy = h - 2  # pixel row of boot sole

    # Special collapsed death pose!
    if anim == 'death_0':
        # Draw body lying backward on the ground (head left, feet right)
        by = gy - 4
        # Fallen legs & boots on right
        c.box(cx + 2, by + 1, 7, 3, legs)
        c.box(cx + 8, by, 3, 4, boots)
        c.box(cx + 4, by + 2, 6, 2, (legs[0], legs[0], legs[1], legs[2]))
        # Collapsed torso center-left
        c.box(cx - 5, by - 1, 9, 5, torso)
        if has_team_tabard or has_team_sash:
            c.box(cx - 3, by, 5, 3, TEAM_RAMP)
        if has_team_shoulder:
            c.box(cx - 4, by - 2, 4, 3, TEAM_RAMP)
        # Slumped head on far left
        head_fn(c, cx - 8, by - 1, anim)
        # Dropped arm reaching out
        c.line(cx - 2, by + 2, cx + 3, by + 3, skin[2], 2)
        c.px(cx + 3, by + 3, skin[3])
        # Weapon resting on ground
        weapon_fn(c, cx + 1, by + 2, anim)
        # Subtle dust puff around fallen soldier
        c.add_outline(INK)
        c.px(cx - 9, gy, SMOKE[2])
        c.px(cx - 10, gy - 1, SMOKE[3])
        c.px(cx + 11, gy, SMOKE[2])
        return c

    # Walk / Attack / Hurt pose parameters
    bob = 0
    lean_x = 0
    # Leg offsets: (back_foot_dx, back_foot_lift, front_foot_dx, front_foot_lift)
    if anim == 'walk_0':
        back_dx, back_lift, front_dx, front_lift = -3, 0, 3, 0
        bob = 0
    elif anim == 'walk_1':
        back_dx, back_lift, front_dx, front_lift = -1, 1, 1, 0
        bob = -1
    elif anim == 'walk_2':
        back_dx, back_lift, front_dx, front_lift = 3, 0, -3, 0
        bob = 0
    elif anim == 'walk_3':
        back_dx, back_lift, front_dx, front_lift = 1, 0, -1, 1
        bob = -1
    elif anim == 'attack_0':
        back_dx, back_lift, front_dx, front_lift = -4, 0, 2, 0
        lean_x = -1
        bob = 0
    elif anim == 'attack_1':
        back_dx, back_lift, front_dx, front_lift = -4, 0, 4, 0
        lean_x = 2
        bob = 1
    elif anim == 'attack_2':
        back_dx, back_lift, front_dx, front_lift = -3, 0, 3, 0
        lean_x = 1
        bob = 0
    elif anim == 'hurt_0':
        back_dx, back_lift, front_dx, front_lift = -3, 1, 1, 0
        lean_x = -2
        bob = -1
    else:
        back_dx, back_lift, front_dx, front_lift = -2, 0, 2, 0

    hip_x = cx + lean_x
    hip_y = gy - 8 + bob
    torso_x = hip_x - 4
    torso_y = hip_y - 9
    shoulder_x = hip_x + 1
    shoulder_y = torso_y + 3
    head_cx = hip_x + (1 if anim == 'attack_1' else (-1 if anim == 'hurt_0' else 0))
    head_cy = torso_y - 4

    # 1. Flowing cape behind body
    if cape_ramp is not None:
        flutter = 2 if anim in ('walk_1', 'walk_3', 'attack_1') else 0
        pts = [
            (torso_x + 1, torso_y + 1),
            (torso_x - 4 - flutter, hip_y + 2),
            (torso_x - 5 - flutter, gy - 2 - (flutter // 2)),
            (torso_x + 1, gy - 3),
        ]
        c.shaded_poly(pts, cape_ramp)

    # 2. Backpack / Quiver / Fuel Tanks behind torso
    if backpack_fn is not None:
        backpack_fn(c, torso_x - 1, torso_y + 1, anim)

    # 3. Back arm (optional, behind torso)
    if back_arm_fn is not None:
        back_arm_fn(c, shoulder_x + 2, shoulder_y, anim)

    # 4. Back leg (slightly darker shade)
    back_hip_x = hip_x - 1
    back_fx = cx + back_dx - 1
    back_fy = gy - back_lift
    c.line(back_hip_x, hip_y, back_fx, back_fy - 2, legs[0], 3)
    c.line(back_hip_x, hip_y, back_fx, back_fy - 2, legs[1], 2)
    c.rect(back_fx - 1, back_fy - 2, 4, 3, boots[1])
    c.px(back_fx + 2, back_fy, boots[0])
    c.px(back_fx, back_fy - 2, boots[2])

    # 5. Front leg (lit 3-tone)
    front_hip_x = hip_x + 1
    front_fx = cx + front_dx
    front_fy = gy - front_lift
    c.line(front_hip_x, hip_y, front_fx, front_fy - 2, legs[1], 3)
    c.line(front_hip_x, hip_y, front_fx, front_fy - 2, legs[2], 2)
    c.line(front_hip_x + 1, hip_y, front_fx + 1, front_fy - 3, legs[3], 1)
    # Chunky front boot
    c.rect(front_fx - 1, front_fy - 2, 5, 3, boots[2])
    c.rect(front_fx - 1, front_fy, 5, 1, boots[0])
    c.px(front_fx + 1, front_fy - 2, boots[3])

    # 6. Muscular / Armored Torso (9x9 chunky Metal Slug torso)
    c.box(torso_x, torso_y, 9, 10, torso)
    # Subtle chest curve / waist taper
    c.px(torso_x, torso_y, torso[1])
    c.px(torso_x + 8, torso_y, torso[2])
    # Belt & buckle
    c.rect(torso_x, torso_y + 7, 9, 2, belt)
    if buckle is not None:
        c.rect(torso_x + 4, torso_y + 7, 2, 2, buckle)

    # Optional team tabard / surcoat / diagonal sash
    if has_team_tabard:
        c.box(torso_x + 2, torso_y + 1, 6, 9, TEAM_RAMP)
        c.rect(torso_x + 1, torso_y + 7, 7, 1, belt)
        if buckle is not None:
            c.px(torso_x + 4, torso_y + 7, buckle)
    elif has_team_sash:
        c.line(torso_x + 1, torso_y + 1, torso_x + 7, torso_y + 7, T_MID, 2)
        c.line(torso_x + 2, torso_y + 1, torso_x + 7, torso_y + 6, T_LIGHT, 1)

    if torso_detail_fn is not None:
        torso_detail_fn(c, torso_x, torso_y, anim)

    # 7. Head & Iconic Helmet / Hat / Hair
    head_fn(c, head_cx, head_cy, anim)

    # 8. Front Shield (if carried in off-hand in front of chest)
    if shield_fn is not None:
        shield_fn(c, shoulder_x + 3, shoulder_y + 2, anim)

    # 9. Front Shoulder Pad (team color pop!) & Weapon Arm
    if has_team_shoulder:
        c.box(torso_x + 1, torso_y + 1, 4, 3, TEAM_RAMP)

    # 10. Signature Weapon & Front Arm
    weapon_fn(c, shoulder_x, shoulder_y, anim)

    # 11. Crisp 1px Dark Outline Pass!
    c.add_outline(INK)

    # 12. Post-outline bright effects (muzzle flashes, plasma energy glow, melee smears, hit sparks)
    if post_fx_fn is not None:
        post_fx_fn(c, shoulder_x, shoulder_y, anim)

    if anim == 'hurt_0':
        draw_hit_sparks(c, head_cx + 3, shoulder_y)

    return c
