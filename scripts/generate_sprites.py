#!/usr/bin/env python3
"""Generate pixel-art sprite sheet PNG + JSON atlas for Age of War 2: Chrono Front.

Outputs:
  - public/sprites/sprites_sheet.png
  - public/sprites/sprites_atlas.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

from sprites_lib.bases import DAMAGE_STATES, gen_base
from sprites_lib.canvas import PixelCanvas
from sprites_lib.environment import gen_environment_sprites
from sprites_lib.humanoid import ANIM_FRAMES
from sprites_lib.projectiles import gen_projectiles
from sprites_lib.turrets import ALL_TURRET_KINDS, gen_turret, gen_turret_platform
from sprites_lib.units_ancient import ANCIENT_UNIT_GENERATORS
from sprites_lib.units_modern import MODERN_UNIT_GENERATORS
from sprites_lib.units_new_eras import NEW_ERA_UNIT_GENERATORS

ALL_UNIT_GENERATORS = {
    **ANCIENT_UNIT_GENERATORS,
    **MODERN_UNIT_GENERATORS,
    **NEW_ERA_UNIT_GENERATORS,
}
TEAMS = ('player', 'enemy')


def build_all_sprites() -> dict[str, tuple[PixelCanvas, int, int]]:
    sprites: dict[str, tuple[PixelCanvas, int, int]] = {}

    # 1. All 31 units x 9 frames x 2 teams (player blue / enemy red palette swap)
    for unit_id, gen_fn in ALL_UNIT_GENERATORS.items():
        for anim in ANIM_FRAMES:
            base_canvas, ax, ay = gen_fn(anim)
            for team in TEAMS:
                swapped = base_canvas.swap_team(team)
                if anim == 'hurt_0':
                    swapped = swapped.tint_flash((255, 250, 235, 255), 0.36)
                key = f'unit/{unit_id}/{team}/{anim}'
                sprites[key] = (swapped, ax, ay)

    # 2. All 10 era fortresses x 3 damage stages x 2 teams (100x128px each)
    for era_idx in range(10):
        for dmg in DAMAGE_STATES:
            base_canvas, ax, ay = gen_base(era_idx, dmg)
            for team in TEAMS:
                key = f'base/era_{era_idx}/{team}/{dmg}'
                sprites[key] = (base_canvas.swap_team(team), ax, ay)

    # 3. All 20 turrets x 2 states (idle, fire) x 2 teams + turret mount platforms
    plat_canvas, pax, pay = gen_turret_platform()
    for team in TEAMS:
        sprites[f'turret/platform/{team}'] = (plat_canvas.swap_team(team), pax, pay)

    for turret_id in ALL_TURRET_KINDS:
        for state, firing in (('idle', False), ('fire', True)):
            t_canvas, ax, ay = gen_turret(turret_id, firing)
            for team in TEAMS:
                key = f'turret/{turret_id}/{team}/{state}'
                sprites[key] = (t_canvas.swap_team(team), ax, ay)

    # 4. Projectiles & Ultimate Ordinance
    sprites.update(gen_projectiles())

    # 5. Seamless 64x64 pixel ground tiles & era midground/foreground props
    sprites.update(gen_environment_sprites())

    return sprites


def pack_atlas(
    sprites: dict[str, tuple[PixelCanvas, int, int]],
    max_width: int = 2560,
    padding: int = 2,
) -> tuple[Image.Image, dict[str, dict[str, int]]]:
    """Pack all sprites tightly using height-sorted shelf packing with transparent padding."""
    items = sorted(sprites.items(), key=lambda kv: (-kv[1][0].h, -kv[1][0].w, kv[0]))

    cursor_x = padding
    cursor_y = padding
    row_h = 0
    placements: list[tuple[str, PixelCanvas, int, int, int, int]] = []
    used_w = 0

    for key, (canvas, ax, ay) in items:
        if cursor_x + canvas.w + padding > max_width:
            cursor_x = padding
            cursor_y += row_h + padding
            row_h = 0
        placements.append((key, canvas, cursor_x, cursor_y, ax, ay))
        used_w = max(used_w, cursor_x + canvas.w + padding)
        cursor_x += canvas.w + padding
        row_h = max(row_h, canvas.h)

    total_h = cursor_y + row_h + padding
    sheet_w = max_width if used_w > max_width - 32 else used_w
    sheet = Image.new('RGBA', (sheet_w, total_h), (0, 0, 0, 0))
    frames_meta: dict[str, dict[str, int]] = {}

    for key, canvas, x, y, ax, ay in placements:
        sheet.paste(canvas.to_image(), (x, y))
        frames_meta[key] = {
            'x': x,
            'y': y,
            'w': canvas.w,
            'h': canvas.h,
            'anchorX': ax,
            'anchorY': ay,
        }

    return sheet, frames_meta


def save_preview_sheet(sprites: dict[str, tuple[PixelCanvas, int, int]], out_path: Path) -> None:
    """Create a contact sheet showcasing all 31 HD units (walk_0, attack_1, hurt_0, death_0, enemy walk_0)."""
    unit_ids = list(ALL_UNIT_GENERATORS.keys())
    cols = 5
    cell_w, cell_h = 154, 148
    rows = len(unit_ids)
    img_w = cols * cell_w + 16
    img_h = rows * cell_h + 16
    canvas = Image.new('RGBA', (img_w, img_h), (22, 27, 38, 255))

    for r, uid in enumerate(unit_ids):
        keys = [
            f'unit/{uid}/player/walk_0',
            f'unit/{uid}/player/attack_1',
            f'unit/{uid}/player/hurt_0',
            f'unit/{uid}/player/death_0',
            f'unit/{uid}/enemy/walk_0',
        ]
        for ci, key in enumerate(keys):
            sp, _, _ = sprites[key]
            im = sp.to_image()
            ox = 8 + ci * cell_w + (cell_w - im.width) // 2
            oy = 8 + r * cell_h + (cell_h - im.height)
            canvas.alpha_composite(im, (ox, oy))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path)


def main() -> None:
    parser = argparse.ArgumentParser(description='Generate Age of War 2 pixel-art sprite sheet & JSON atlas.')
    parser.add_argument('--preview', type=Path, default=None, help='Optional path to write visual preview sheet')
    args = parser.parse_args()

    out_dir = REPO_ROOT / 'public' / 'sprites'
    out_dir.mkdir(parents=True, exist_ok=True)

    sprites = build_all_sprites()
    sheet, frames_meta = pack_atlas(sprites)

    sheet_path = out_dir / 'sprites_sheet.png'
    atlas_path = out_dir / 'sprites_atlas.json'

    sheet.save(sheet_path, optimize=True)
    atlas = {
        'meta': {
            'image': 'sprites_sheet.png',
            'width': sheet.width,
            'height': sheet.height,
            'pixelScale': 2,
            'unitScale': 1,
            'frameCount': len(frames_meta),
            'version': 2,
        },
        'frames': frames_meta,
    }
    atlas_path.write_text(json.dumps(atlas, indent=2, sort_keys=True) + '\n', encoding='utf-8')

    print(
        f'Generated {len(frames_meta)} pixel-art sprites -> '
        f'{sheet_path.relative_to(REPO_ROOT)} ({sheet.width}x{sheet.height}, '
        f'{sheet_path.stat().st_size // 1024} KB) + {atlas_path.relative_to(REPO_ROOT)}'
    )

    if args.preview:
        save_preview_sheet(sprites, args.preview)
        print(f'Saved visual contact sheet -> {args.preview}')


if __name__ == '__main__':
    main()
