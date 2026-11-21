#!/usr/bin/env python3
"""Generate pixel-art sprite sheet PNG + JSON atlas for Age of War 2: Chrono Front.

Outputs:
  - public/sprites/sprites_sheet.png
  - public/sprites/sprites_atlas.json
"""

from __future__ import annotations

import argparse
import hashlib
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
from sprites_lib.units_extra import EXTRA_UNIT_GENERATORS
from sprites_lib.units_modern import MODERN_UNIT_GENERATORS
from sprites_lib.units_new_eras import NEW_ERA_UNIT_GENERATORS

ALL_UNIT_GENERATORS = {
    **ANCIENT_UNIT_GENERATORS,
    **MODERN_UNIT_GENERATORS,
    **NEW_ERA_UNIT_GENERATORS,
    **EXTRA_UNIT_GENERATORS,
}
TEAMS = ('player', 'enemy')


def build_all_sprites() -> dict[str, tuple[PixelCanvas, int, int]]:
    sprites: dict[str, tuple[PixelCanvas, int, int]] = {}

    # 1. All 40 units x 9 frames x 2 teams (player blue / enemy red palette swap + studio rim light)
    for unit_id, gen_fn in ALL_UNIT_GENERATORS.items():
        for anim in ANIM_FRAMES:
            base_canvas, ax, ay = gen_fn(anim)
            for team in TEAMS:
                swapped = base_canvas.swap_team(team)
                if anim != 'death_0':
                    swapped = swapped.add_rim_light(strength=0.22)
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

    # 5. Seamless 64x64 pixel ground tiles, era props & 8 upgrade icons
    sprites.update(gen_environment_sprites())

    return sprites


def pack_multi_page_atlas(
    sprites: dict[str, tuple[PixelCanvas, int, int]],
    max_width: int = 1536,
    max_height: int = 1400,
    padding: int = 2,
) -> tuple[list[Image.Image], dict[str, dict[str, int]]]:
    """Pack all sprites tightly into iOS-Safari-safe <= 1536x1400 (< 2.2 MP) multi-page PNG sheets."""
    items = sorted(sprites.items(), key=lambda kv: (-kv[1][0].h, -kv[1][0].w, kv[0]))

    pages_placements: list[tuple[int, int, list[tuple[str, PixelCanvas, int, int, int, int]]]] = []
    cur_placements: list[tuple[str, PixelCanvas, int, int, int, int]] = []
    cursor_x = padding
    cursor_y = padding
    row_h = 0
    used_w = 0

    def flush_page() -> None:
        nonlocal cur_placements, cursor_x, cursor_y, row_h, used_w
        if not cur_placements:
            return
        total_h = cursor_y + row_h + padding
        sheet_w = max_width if used_w > max_width - 32 else used_w
        pages_placements.append((sheet_w, total_h, cur_placements))
        cur_placements = []
        cursor_x = padding
        cursor_y = padding
        row_h = 0
        used_w = 0

    for key, (canvas, ax, ay) in items:
        if cursor_x + canvas.w + padding > max_width:
            cursor_x = padding
            cursor_y += row_h + padding
            row_h = 0
        if cursor_y + canvas.h + padding > max_height and cur_placements:
            flush_page()
        cur_placements.append((key, canvas, cursor_x, cursor_y, ax, ay))
        used_w = max(used_w, cursor_x + canvas.w + padding)
        cursor_x += canvas.w + padding
        row_h = max(row_h, canvas.h)

    flush_page()

    sheets: list[Image.Image] = []
    frames_meta: dict[str, dict[str, int]] = {}

    for page_idx, (sheet_w, sheet_h, placements) in enumerate(pages_placements):
        sheet = Image.new('RGBA', (sheet_w, sheet_h), (0, 0, 0, 0))
        for key, canvas, x, y, ax, ay in placements:
            sheet.paste(canvas.to_image(), (x, y))
            frames_meta[key] = {
                'page': page_idx,
                'x': x,
                'y': y,
                'w': canvas.w,
                'h': canvas.h,
                'anchorX': ax,
                'anchorY': ay,
            }
        sheets.append(sheet)

    return sheets, frames_meta


def save_preview_sheet(
    sprites: dict[str, tuple[PixelCanvas, int, int]],
    out_path: Path,
    unit_ids: list[str] | None = None,
) -> None:
    """Create a contact sheet showcasing HD units (walk_0, attack_1, hurt_0, death_0, enemy walk_0)."""
    ids = unit_ids if unit_ids is not None else list(ALL_UNIT_GENERATORS.keys())
    cols = 5
    cell_w, cell_h = 154, 148
    rows = len(ids)
    img_w = cols * cell_w + 16
    img_h = rows * cell_h + 16
    canvas = Image.new('RGBA', (img_w, img_h), (22, 27, 38, 255))

    for r, uid in enumerate(ids):
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
            oy = 8 + r * cell_h + (cell_h - im.height) // 2
            canvas.alpha_composite(im, (ox, oy))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out_path)


def main() -> None:
    parser = argparse.ArgumentParser(description='Generate Age of War 2 pixel-art sprite sheets & JSON atlas.')
    parser.add_argument('--preview', type=Path, default=None, help='Optional path to write visual preview sheet')
    parser.add_argument(
        '--preview-extra',
        type=Path,
        default=None,
        help='Optional path to write zoomed preview of the 9 new 4th units',
    )
    args = parser.parse_args()

    out_dir = REPO_ROOT / 'src' / 'assets' / 'sprites'
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = REPO_ROOT / 'src' / 'data' / 'spriteManifest.ts'

    # Clean stale sheet pages before writing fresh pages
    for old_png in out_dir.glob('sprites_sheet_*.png'):
        old_png.unlink()

    sprites = build_all_sprites()
    sheets, frames_meta = pack_multi_page_atlas(sprites)

    hasher = hashlib.sha256()
    pages_meta: list[dict[str, object]] = []
    total_kb = 0
    for idx, sheet in enumerate(sheets):
        fname = f'sprites_sheet_{idx}.png'
        fpath = out_dir / fname
        sheet.save(fpath, optimize=True)
        raw = fpath.read_bytes()
        hasher.update(raw)
        total_kb += len(raw) // 1024
        pages_meta.append({
            'image': fname,
            'width': sheet.width,
            'height': sheet.height,
        })

    frames_bytes = json.dumps(frames_meta, sort_keys=True).encode('utf-8')
    hasher.update(frames_bytes)
    content_hash = hasher.hexdigest()[:10]

    atlas_path = out_dir / 'sprites_atlas.json'
    atlas = {
        'meta': {
            'image': pages_meta[0]['image'],
            'width': max(int(p['width']) for p in pages_meta),
            'height': max(int(p['height']) for p in pages_meta),
            'pageCount': len(pages_meta),
            'pages': pages_meta,
            'pixelScale': 2,
            'unitScale': 1,
            'frameCount': len(frames_meta),
            'version': 4,
            'hash': content_hash,
        },
        'frames': frames_meta,
    }
    atlas_path.write_text(json.dumps(atlas, indent=2, sort_keys=True) + '\n', encoding='utf-8')

    import_lines = ["import atlasJson from '../assets/sprites/sprites_atlas.json';"]
    url_vars = []
    for idx in range(len(sheets)):
        var = f'sheet{idx}Url'
        import_lines.append(f"import {var} from '../assets/sprites/sprites_sheet_{idx}.png';")
        url_vars.append(var)

    manifest_code = (
        '/**\n'
        ' * Auto-generated by scripts/generate_sprites.py.\n'
        ' * Bundles sprites_atlas.json inline and uses Vite content-hashed ES imports for all\n'
        ' * compact (<= 1536x1400, < 2.2 MP) PNG sheets so iOS Safari & SFSafariViewController\n'
        ' * always decode cleanly with zero stale-cache mismatches.\n'
        ' */\n'
        + '\n'.join(import_lines)
        + '\n\n'
        + f"export const SPRITE_ATLAS_VERSION = '{content_hash}';\n"
        + 'export const SPRITE_ATLAS_JSON = atlasJson;\n'
        + 'export const SPRITE_SHEET_URLS: readonly string[] = [\n'
        + ''.join(f'  {v},\n' for v in url_vars)
        + '];\n'
    )
    manifest_path.write_text(manifest_code, encoding='utf-8')

    page_summary = ', '.join(f"{p['width']}x{p['height']}" for p in pages_meta)
    print(
        f'Generated {len(frames_meta)} sprites ({len(ALL_UNIT_GENERATORS)} units) across '
        f'{len(sheets)} iOS-safe pages [{page_summary}] ({total_kb} KB total, hash={content_hash})'
    )

    if args.preview:
        save_preview_sheet(sprites, args.preview)
        print(f'Saved visual contact sheet -> {args.preview}')

    if args.preview_extra:
        save_preview_sheet(sprites, args.preview_extra, list(EXTRA_UNIT_GENERATORS.keys()))
        print(f'Saved 9 new units preview sheet -> {args.preview_extra}')


if __name__ == '__main__':
    main()
