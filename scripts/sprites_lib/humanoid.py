"""HD Metal-Slug / Kingdom-Rush style pixel humanoid builder & arcade VFX helpers.

All HD infantry sprites are authored at 1:1 world pixel density (~68x68 to 80x72px),
using per-part internal dark crease outlining, articulated knees/elbows, expressive faces,
tapered heroic armor torsos, and animated capes/plumes.
"""

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
    SKIN,
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


def draw_muzzle_flash(
    c: PixelCanvas,
    x: int,
    y: int,
    size: int = 8,
    glow_ramp: Sequence[RGBA] = FIRE,
) -> None:
    """Draw a high-impact layered arcade pixel muzzle flash."""
    # Soft outer pixel glow
    c.radial_glow(x + size // 2, y, size + 3, (glow_ramp[2][0], glow_ramp[2][1], glow_ramp[2][2], 145))
    # Main directional star spikes
    c.shaded_poly(
        [
            (x, y - max(2, size // 3)),
            (x + size + 6, y),
            (x, y + max(2, size // 3)),
        ],
        glow_ramp,
    )
    c.line(x, y, x + size + 3, y - size + 1, glow_ramp[2], 2)
    c.line(x, y, x + size + 3, y + size - 1, glow_ramp[2], 2)
    c.line(x + 2, y - size, x + 2, y + size, glow_ramp[2], 2)
    c.line(x + 1, y, x + size + 2, y - size // 2, glow_ramp[3], 1)
    c.line(x + 1, y, x + size + 2, y + size // 2, glow_ramp[3], 1)
    # Bright yellow inner core
    c.ellipse(x + 3, y, max(3, size // 2 + 1), max(3, size // 2), glow_ramp[3])
    c.line(x + 2, y, x + size + 4, y, glow_ramp[4], 2)
    # Blinding white-hot center
    c.ellipse(x + 2, y, max(2, size // 3), max(2, size // 3), WHITE)


def draw_smoke_puff(c: PixelCanvas, x: int, y: int, r: int = 5) -> None:
    """Draw a chunky layered pixel gunsmoke cloud."""
    c.shaded_ellipse(x, y, r, max(3, r - 1), SMOKE)
    c.shaded_ellipse(x + r - 1, y - 2, max(2, r - 1), max(2, r - 2), SMOKE)
    c.shaded_ellipse(x - r // 2, y + 1, max(2, r - 2), max(2, r - 2), SMOKE)


def draw_slash_smear(
    c: PixelCanvas,
    cx: int,
    cy: int,
    radius: int,
    col_outer: RGBA,
    col_inner: RGBA,
) -> None:
    """Draw a silky-solid tapered anime/arcade melee swing crescent with spark trails."""
    for step in range(-28, 29):
        t = step / 28.0
        ang = t * 1.48
        thick = max(1, int(round((1.0 - abs(t) * 0.78) * 5.5)))
        ca, sa = math.cos(ang), math.sin(ang)
        for dr in range(thick):
            r = radius - dr
            sx = int(round(cx + ca * r))
            sy = int(round(cy + sa * r))
            if dr == 0:
                col = WHITE if abs(t) < 0.62 else col_inner
            elif dr <= 1:
                col = col_inner
            else:
                col = col_outer
            c.px(sx, sy, col)
    # Leading speed spark dots
    c.px(cx + radius + 2, cy - 3, WHITE)
    c.px(cx + radius + 3, cy + 2, col_inner)
    c.px(cx + radius - 2, cy + 8, col_outer)


def draw_hit_sparks(c: PixelCanvas, x: int, y: int, scale: int = 1) -> None:
    """Crisp multi-point arcade hit-impact starburst."""
    s = max(1, scale)
    r = 6 * s
    c.line(x - r, y, x + r, y, FIRE[2], 2)
    c.line(x, y - r, x, y + r, FIRE[2], 2)
    c.line(x - r + 2, y - r + 2, x + r - 2, y + r - 2, FIRE[3], 1)
    c.line(x - r + 2, y + r - 2, x + r - 2, y - r + 2, FIRE[3], 1)
    c.line(x - r + 1, y, x + r - 1, y, FIRE[4], 1)
    c.line(x, y - r + 1, x, y + r - 1, FIRE[4], 1)
    c.ellipse(x, y, 2 * s, 2 * s, WHITE)


def draw_hd_face(
    c: PixelCanvas,
    cx: int,
    cy: int,
    anim: str,
    skin: Sequence[RGBA] = SKIN,
    *,
    brow_col: RGBA | None = None,
    beard_ramp: Sequence[RGBA] | None = None,
    warpaint: RGBA | None = None,
    eye_glow: RGBA | None = None,
) -> None:
    """Sculpted 15x14px arcade face with expressive eyes, brow, jaw, nose, and action mouth."""
    # Cranium + sculpted jaw
    c.shaded_ellipse(cx, cy, 7, 7, skin, light_x=-0.3, light_y=-0.45)
    c.shaded_ellipse(cx + 1, cy + 2, 6, 5, skin, light_x=-0.25, light_y=-0.4)
    # Back ear with inner crease
    c.shaded_ellipse(cx - 6, cy + 1, 2, 3, skin)
    c.px(cx - 6, cy + 1, skin[0])
    # Nose bump on right profile
    c.rect(cx + 6, cy, 2, 2, skin[2])
    c.px(cx + 6, cy, skin[3])
    c.px(cx + 6, cy + 2, skin[1])
    # Optional tribal warpaint streak across cheek
    if warpaint is not None:
        c.rect(cx + 1, cy + 2, 4, 1, warpaint)
        c.px(cx + 2, cy + 3, warpaint)

    # Expressive Eyes
    bc = brow_col if brow_col is not None else skin[0]
    ex, ey = cx + 3, cy - 1
    if anim == 'death_0':
        # Knocked-out X eye
        c.px(ex - 1, ey - 1, INK)
        c.px(ex + 1, ey - 1, INK)
        c.px(ex, ey, INK)
        c.px(ex - 1, ey + 1, INK)
        c.px(ex + 1, ey + 1, INK)
    elif anim == 'hurt_0':
        # Tight wincing '>' eye
        c.px(ex - 1, ey - 1, INK)
        c.px(ex, ey - 1, INK)
        c.px(ex + 1, ey, INK)
        c.px(ex, ey + 1, INK)
        c.px(ex - 1, ey + 1, INK)
    elif eye_glow is not None:
        c.rect(ex - 1, ey - 1, 4, 2, INK)
        c.rect(ex, ey - 1, 3, 2, eye_glow)
        c.px(ex + 1, ey - 1, WHITE)
    else:
        # White sclera + dark pupil + determined angled brow
        c.rect(ex - 1, ey - 1, 3, 3, WHITE)
        c.rect(ex + 1, ey - 1, 1, 2, INK)
        c.px(ex, ey, INK_SOFT)
        if anim in ('attack_0', 'attack_1'):
            c.line(ex - 2, ey - 3, ex + 2, ey - 2, bc, 1)
        else:
            c.rect(ex - 1, ey - 2, 4, 1, bc)

    # Battle mouth / grit / shout
    if anim == 'attack_1':
        # Fierce shouting mouth with upper teeth
        c.rect(cx + 2, cy + 3, 4, 3, INK)
        c.rect(cx + 3, cy + 3, 2, 1, WHITE)
        c.px(cx + 3, cy + 5, (185, 58, 58, 255))
    elif anim == 'hurt_0':
        c.rect(cx + 2, cy + 3, 3, 2, INK)
        c.px(cx + 3, cy + 3, WHITE)
    elif anim == 'attack_0':
        c.rect(cx + 2, cy + 4, 4, 1, WHITE)
        c.px(cx + 5, cy + 4, skin[0])
    else:
        c.rect(cx + 3, cy + 4, 3, 1, skin[0])

    # Optional sculpted beard / stubble
    if beard_ramp is not None:
        c.shaded_poly(
            [(cx - 2, cy + 3), (cx + 5, cy + 4), (cx + 4, cy + 8), (cx - 1, cy + 7)],
            beard_ramp,
        )


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
    knee_armor: Sequence[RGBA] | None = None,
    cape_ramp: Sequence[RGBA] | None = None,
    backpack_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    head_fn: Callable[[PixelCanvas, int, int, str], None],
    back_arm_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    weapon_fn: Callable[[PixelCanvas, int, int, str], None],
    shield_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    torso_detail_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    post_fx_fn: Callable[[PixelCanvas, int, int, str], None] | None = None,
    anchor_x: int | None = None,
    torso_armored: bool = False,
) -> PixelCanvas:
    """Render one frame of an HD Metal-Slug-style pixel humanoid with per-part internal creases."""
    c = PixelCanvas(w, h)
    cx = (w // 2 - 4) if anchor_x is None else anchor_x
    gy = h - 3  # bottom boot sole pixel row

    # Dramatic collapsed death pose!
    if anim == 'death_0':
        by = gy - 8
        # Fallen legs + boots right side
        leg_p = c.part()
        leg_p.shaded_capsule(cx + 3, by + 3, cx + 15, by + 5, 3.0, (legs[0], legs[0], legs[1], legs[2]))
        leg_p.box(cx + 15, by + 1, 6, 7, boots)
        leg_p.shaded_capsule(cx + 2, by + 1, cx + 13, by + 2, 3.2, legs)
        leg_p.box(cx + 12, by - 2, 6, 7, boots)
        c.blit_part(leg_p, INK)

        # Collapsed torso
        tor_p = c.part()
        tor_p.armor_plate(cx - 11, by - 3, 17, 10, torso, sheen=torso_armored)
        if has_team_tabard or has_team_sash:
            tor_p.box(cx - 7, by - 1, 10, 6, TEAM_RAMP)
        if has_team_shoulder:
            tor_p.shaded_ellipse(cx - 8, by - 3, 5, 4, TEAM_RAMP)
        tor_p.rect(cx + 3, by - 3, 3, 10, belt)
        if buckle is not None:
            tor_p.rect(cx + 3, by + 1, 3, 3, buckle)
        c.blit_part(tor_p, INK)

        # Slumped head on far left
        head_p = c.part()
        head_fn(head_p, cx - 16, by - 2, anim)
        c.blit_part(head_p, INK)

        # Dropped arm & weapon resting on ground
        wep_p = c.part()
        wep_p.shaded_capsule(cx - 5, by + 3, cx + 5, by + 5, 2.5, skin)
        weapon_fn(wep_p, cx + 3, by + 4, anim)
        c.blit_part(wep_p, INK)

        # Ground dust puff around fallen soldier
        draw_smoke_puff(c, cx - 19, gy - 2, 4)
        draw_smoke_puff(c, cx + 19, gy - 2, 3)
        return c

    # Articulated gait / combat pose kinematics
    # (back_foot_dx, back_lift, back_knee_dx, front_foot_dx, front_lift, front_knee_dx, lean_x, bob)
    if anim == 'walk_0':
        bfx, bfl, bkx, ffx, ffl, fkx, lean_x, bob = -7, 0, -2, 7, 0, 5, 0, 0
    elif anim == 'walk_1':
        bfx, bfl, bkx, ffx, ffl, fkx, lean_x, bob = -2, 5, 2, 2, 0, 3, 1, -2
    elif anim == 'walk_2':
        bfx, bfl, bkx, ffx, ffl, fkx, lean_x, bob = 7, 0, 5, -7, 0, -2, 0, 0
    elif anim == 'walk_3':
        bfx, bfl, bkx, ffx, ffl, fkx, lean_x, bob = 2, 0, 3, -2, 5, 4, 1, -2
    elif anim == 'attack_0':
        bfx, bfl, bkx, ffx, ffl, fkx, lean_x, bob = -8, 0, -4, 5, 0, 4, -3, 1
    elif anim == 'attack_1':
        bfx, bfl, bkx, ffx, ffl, fkx, lean_x, bob = -9, 0, -4, 9, 0, 8, 5, 2
    elif anim == 'attack_2':
        bfx, bfl, bkx, ffx, ffl, fkx, lean_x, bob = -6, 0, -2, 6, 0, 5, 2, 1
    elif anim == 'hurt_0':
        bfx, bfl, bkx, ffx, ffl, fkx, lean_x, bob = -6, 0, -3, 3, 3, 2, -5, -2
    else:
        bfx, bfl, bkx, ffx, ffl, fkx, lean_x, bob = -4, 0, -1, 4, 0, 3, 0, 0

    hip_x = cx + lean_x
    hip_y = gy - 17 + bob
    torso_x = hip_x - 8
    torso_y = hip_y - 18
    shoulder_x = hip_x + 1
    shoulder_y = torso_y + 5
    head_cx = hip_x + (2 if anim == 'attack_1' else (-2 if anim == 'hurt_0' else 1))
    head_cy = torso_y - 7

    # 1. Flowing animated cape behind body
    if cape_ramp is not None:
        cape_p = c.part()
        flutter = 4 if anim in ('walk_1', 'walk_3', 'attack_1') else (2 if anim == 'hurt_0' else 0)
        pts = [
            (torso_x + 3, torso_y + 2),
            (torso_x - 7 - flutter, hip_y + 2),
            (torso_x - 11 - flutter, gy - 4 - (flutter // 2)),
            (torso_x - 2 - flutter // 2, gy - 3),
            (torso_x + 3, hip_y + 5),
        ]
        cape_p.shaded_poly(pts, cape_ramp)
        # Fold crease lines inside cape
        cape_p.line(torso_x + 1, torso_y + 6, torso_x - 6 - flutter, gy - 6, cape_ramp[0], 1)
        cape_p.line(torso_x + 2, torso_y + 7, torso_x - 3 - flutter // 2, gy - 5, cape_ramp[3], 1)
        c.blit_part(cape_p, INK)

    # 2. Backpack / Quiver / Fuel Tanks behind torso
    if backpack_fn is not None:
        bp_p = c.part()
        backpack_fn(bp_p, torso_x - 2, torso_y + 2, anim)
        c.blit_part(bp_p, INK)

    # 3. Optional Back Arm (behind torso)
    if back_arm_fn is not None:
        ba_p = c.part()
        back_arm_fn(ba_p, shoulder_x + 4, shoulder_y, anim)
        c.blit_part(ba_p, INK)

    # 4. Back Leg (articulated thigh -> knee -> shin -> boot, darker shade)
    back_leg_p = c.part()
    back_ramp = (legs[0], legs[0], legs[1], legs[2])
    b_boot_ramp = (boots[0], boots[0], boots[1], boots[2])
    b_hip_x = hip_x - 2
    b_knee_x = cx + bkx - 1
    b_knee_y = (hip_y + gy - bfl) // 2 + 1
    b_foot_x = cx + bfx - 1
    b_foot_y = gy - bfl
    back_leg_p.shaded_capsule(b_hip_x, hip_y, b_knee_x, b_knee_y, 3.2, back_ramp)
    back_leg_p.shaded_capsule(b_knee_x, b_knee_y, b_foot_x, b_foot_y - 3, 2.7, back_ramp)
    if knee_armor is not None:
        back_leg_p.shaded_ellipse(b_knee_x + 1, b_knee_y, 2.5, 2.5, (knee_armor[0], knee_armor[1], knee_armor[2], knee_armor[2]))
    # Sculpted back boot
    back_leg_p.box(b_foot_x - 3, b_foot_y - 5, 9, 5, b_boot_ramp)
    back_leg_p.rect(b_foot_x - 3, b_foot_y - 1, 10, 2, boots[0])
    back_leg_p.px(b_foot_x + 5, b_foot_y - 3, boots[2])
    c.blit_part(back_leg_p, INK)

    # 5. Front Leg (articulated thigh -> knee -> shin -> heroic boot, brightly lit)
    front_leg_p = c.part()
    f_hip_x = hip_x + 2
    f_knee_x = cx + fkx
    f_knee_y = (hip_y + gy - ffl) // 2 + 1
    f_foot_x = cx + ffx
    f_foot_y = gy - ffl
    front_leg_p.shaded_capsule(f_hip_x, hip_y, f_knee_x, f_knee_y, 3.5, legs)
    front_leg_p.shaded_capsule(f_knee_x, f_knee_y, f_foot_x, f_foot_y - 3, 3.0, legs)
    if knee_armor is not None:
        front_leg_p.shaded_ellipse(f_knee_x + 1, f_knee_y, 3.0, 2.8, knee_armor)
    # Chunky front boot with cuff, sole & specular toe
    front_leg_p.box(f_foot_x - 3, f_foot_y - 6, 10, 6, boots)
    front_leg_p.rect(f_foot_x - 3, f_foot_y - 6, 7, 2, boots[3])
    front_leg_p.rect(f_foot_x - 3, f_foot_y - 1, 11, 2, boots[0])
    front_leg_p.px(f_foot_x + 6, f_foot_y - 3, boots[3])
    if len(boots) > 4:
        front_leg_p.px(f_foot_x + 4, f_foot_y - 4, boots[4])
    c.blit_part(front_leg_p, INK)

    # 6. Heroic Tapered Torso Layer (broad shoulders -> defined waist)
    torso_p = c.part()
    torso_poly = [
        (torso_x, torso_y + 1),
        (torso_x + 17, torso_y + 1),
        (torso_x + 15, torso_y + 16),
        (torso_x + 16, torso_y + 20),
        (torso_x + 1, torso_y + 20),
        (torso_x + 2, torso_y + 16),
    ]
    torso_p.shaded_poly(torso_poly, torso)
    if torso_armored:
        # Metallic chest specular band & rib contour
        spec = torso[4] if len(torso) > 4 else torso[3]
        torso_p.line(torso_x + 3, torso_y + 3, torso_x + 13, torso_y + 3, torso[3], 2)
        torso_p.line(torso_x + 5, torso_y + 2, torso_x + 11, torso_y + 2, spec, 1)
        torso_p.line(torso_x + 3, torso_y + 9, torso_x + 14, torso_y + 9, torso[1], 1)

    # Optional team tabard / surcoat / diagonal sash
    if has_team_tabard:
        torso_p.armor_plate(torso_x + 4, torso_y + 2, 10, 18, TEAM_RAMP, sheen=True)
        torso_p.rect(torso_x + 5, torso_y + 18, 8, 2, T_TRIM)
    elif has_team_sash:
        torso_p.shaded_capsule(torso_x + 2, torso_y + 2, torso_x + 14, torso_y + 14, 2.0, TEAM_RAMP)

    # Belt & ornate metallic buckle
    torso_p.rect(torso_x + 1, torso_y + 14, 15, 3, belt)
    torso_p.rect(torso_x + 1, torso_y + 16, 15, 1, INK_SOFT)
    if buckle is not None:
        torso_p.rect(torso_x + 7, torso_y + 13, 5, 5, INK_SOFT)
        torso_p.rect(torso_x + 8, torso_y + 14, 3, 3, buckle)
        torso_p.px(torso_x + 8, torso_y + 14, WHITE)

    if torso_detail_fn is not None:
        torso_detail_fn(torso_p, torso_x, torso_y, anim)

    c.blit_part(torso_p, INK)

    # 7. Head & Iconic Helmet / Hat / Crown Layer
    head_p = c.part()
    head_fn(head_p, head_cx, head_cy, anim)
    c.blit_part(head_p, INK)

    # 8. Front Shield Layer (if carried on off-hand side)
    if shield_fn is not None:
        sh_p = c.part()
        shield_fn(sh_p, shoulder_x + 7, shoulder_y + 4, anim)
        c.blit_part(sh_p, INK)

    # 9. Front Weapon & Articulated Arm Layer
    wep_p = c.part()
    weapon_fn(wep_p, shoulder_x, shoulder_y, anim)
    if has_team_shoulder:
        # Sculpted team shoulder pauldron overlapping shoulder joint cleanly!
        wep_p.shaded_ellipse(shoulder_x - 2, shoulder_y - 1, 5.5, 4.5, TEAM_RAMP)
        wep_p.rect(shoulder_x - 6, shoulder_y + 2, 9, 1, T_TRIM)
    c.blit_part(wep_p, INK)

    # 10. Final Crisp Outer Silhouette Assurance
    c.add_outline(INK)

    # 11. Post-outline bright effects (muzzle flashes, energy glows, melee smears, hit sparks)
    if post_fx_fn is not None:
        post_fx_fn(c, shoulder_x, shoulder_y, anim)

    if anim == 'hurt_0':
        draw_hit_sparks(c, head_cx + 6, shoulder_y - 1, scale=1)

    return c
