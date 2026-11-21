"""Core integer-grid pixel drawing canvas with 1px outlining, dithering, and team palette swapping."""

from __future__ import annotations

import math
from typing import Callable, Iterable, Sequence

from PIL import Image

from .palettes import INK, RGBA, TEAM_PALETTES, TRANSPARENT


class PixelCanvas:
    """Crisp pixel-by-pixel RGBA drawing surface backed by a Python bytearray."""

    def __init__(self, width: int, height: int) -> None:
        self.w = width
        self.h = height
        self.data = bytearray(width * height * 4)

    def copy(self) -> 'PixelCanvas':
        c = PixelCanvas(self.w, self.h)
        c.data[:] = self.data
        return c

    def get(self, x: int, y: int) -> RGBA:
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 4
            return (self.data[i], self.data[i + 1], self.data[i + 2], self.data[i + 3])
        return TRANSPARENT

    def px(self, x: int, y: int, col: RGBA) -> None:
        ix = int(round(x))
        iy = int(round(y))
        if 0 <= ix < self.w and 0 <= iy < self.h:
            a = col[3]
            if a == 0:
                return
            i = (iy * self.w + ix) * 4
            if a == 255 or self.data[i + 3] == 0:
                self.data[i] = col[0]
                self.data[i + 1] = col[1]
                self.data[i + 2] = col[2]
                self.data[i + 3] = a
            else:
                # Alpha blend
                da = self.data[i + 3] / 255.0
                sa = a / 255.0
                out_a = sa + da * (1.0 - sa)
                if out_a > 0:
                    self.data[i] = int((col[0] * sa + self.data[i] * da * (1.0 - sa)) / out_a)
                    self.data[i + 1] = int((col[1] * sa + self.data[i + 1] * da * (1.0 - sa)) / out_a)
                    self.data[i + 2] = int((col[2] * sa + self.data[i + 2] * da * (1.0 - sa)) / out_a)
                    self.data[i + 3] = int(out_a * 255)

    def erase(self, x: int, y: int) -> None:
        ix = int(round(x))
        iy = int(round(y))
        if 0 <= ix < self.w and 0 <= iy < self.h:
            i = (iy * self.w + ix) * 4
            self.data[i] = 0
            self.data[i + 1] = 0
            self.data[i + 2] = 0
            self.data[i + 3] = 0

    def rect(self, x: int, y: int, w: int, h: int, col: RGBA) -> None:
        x0 = max(0, int(round(x)))
        y0 = max(0, int(round(y)))
        x1 = min(self.w, int(round(x + w)))
        y1 = min(self.h, int(round(y + h)))
        for yy in range(y0, y1):
            for xx in range(x0, x1):
                self.px(xx, yy, col)

    def rect_dither(self, x: int, y: int, w: int, h: int, col_a: RGBA, col_b: RGBA, mode: str = 'check') -> None:
        x0 = max(0, int(round(x)))
        y0 = max(0, int(round(y)))
        x1 = min(self.w, int(round(x + w)))
        y1 = min(self.h, int(round(y + h)))
        for yy in range(y0, y1):
            for xx in range(x0, x1):
                if mode == 'check':
                    use_b = ((xx + yy) & 1) == 1
                elif mode == 'sparse':
                    use_b = (xx % 2 == 0 and yy % 2 == 0)
                elif mode == 'hstripe':
                    use_b = (yy & 1) == 1
                elif mode == 'vstripe':
                    use_b = (xx & 1) == 1
                else:
                    use_b = ((xx * 3 + yy * 5) % 4) == 0
                self.px(xx, yy, col_b if use_b else col_a)

    def box(
        self,
        x: int,
        y: int,
        w: int,
        h: int,
        ramp: Sequence[RGBA],
        outline: RGBA | None = None,
        light_dir: str = 'tl',
    ) -> None:
        """Draw a shaded 3-4 tone beveled pixel box with optional 1px border."""
        x0 = int(round(x))
        y0 = int(round(y))
        iw = int(round(w))
        ih = int(round(h))
        if iw <= 0 or ih <= 0:
            return
        deep, shade, mid, light = ramp[0], ramp[1], ramp[2], ramp[3]
        self.rect(x0, y0, iw, ih, mid)
        if ih >= 3:
            # Top highlight & bottom shadow
            self.rect(x0, y0, iw, 1, light)
            self.rect(x0, y0 + ih - 1, iw, 1, shade)
        if iw >= 4:
            if light_dir == 'tl':
                self.rect(x0, y0, 1, ih - 1, light)
                self.rect(x0 + iw - 1, y0 + 1, 1, ih - 1, shade)
            else:
                self.rect(x0, y0 + 1, 1, ih - 1, shade)
                self.rect(x0 + iw - 1, y0, 1, ih - 1, light)
        if ih >= 6:
            self.rect(x0, y0 + ih - 2, iw, 1, shade)
            self.rect(x0, y0 + ih - 1, iw, 1, deep)
        if len(ramp) > 4 and iw >= 4 and ih >= 4:
            self.px(x0 + (1 if light_dir == 'tl' else iw - 2), y0 + 1, ramp[4])
        if outline is not None:
            self.rect_outline(x0, y0, iw, ih, outline)

    def rect_outline(self, x: int, y: int, w: int, h: int, col: RGBA) -> None:
        x0, y0 = int(round(x)), int(round(y))
        iw, ih = int(round(w)), int(round(h))
        if iw <= 0 or ih <= 0:
            return
        self.rect(x0, y0, iw, 1, col)
        self.rect(x0, y0 + ih - 1, iw, 1, col)
        self.rect(x0, y0, 1, ih, col)
        self.rect(x0 + iw - 1, y0, 1, ih, col)

    def line(self, x0: int, y0: int, x1: int, y1: int, col: RGBA, thickness: int = 1) -> None:
        ix0, iy0 = int(round(x0)), int(round(y0))
        ix1, iy1 = int(round(x1)), int(round(y1))
        dx = abs(ix1 - ix0)
        dy = -abs(iy1 - iy0)
        sx = 1 if ix0 < ix1 else -1
        sy = 1 if iy0 < iy1 else -1
        err = dx + dy
        while True:
            if thickness <= 1:
                self.px(ix0, iy0, col)
            elif thickness == 2:
                self.px(ix0, iy0, col)
                self.px(ix0 + 1, iy0, col)
                self.px(ix0, iy0 + 1, col)
            else:
                r = thickness // 2
                for oy in range(-r, r + 1):
                    for ox in range(-r, r + 1):
                        if ox * ox + oy * oy <= r * r + 1:
                            self.px(ix0 + ox, iy0 + oy, col)
            if ix0 == ix1 and iy0 == iy1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                ix0 += sx
            if e2 <= dx:
                err += dx
                iy0 += sy

    def shaded_line(
        self,
        x0: float,
        y0: float,
        x1: float,
        y1: float,
        ramp: Sequence[RGBA],
        thickness: int = 2,
    ) -> None:
        """Draw a thick pixel limb/barrel with upper highlight and lower shadow."""
        self.line(int(round(x0)), int(round(y0)) + 1, int(round(x1)), int(round(y1)) + 1, ramp[1], thickness)
        self.line(int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1)), ramp[2], thickness)
        self.line(int(round(x0)), int(round(y0)) - 1, int(round(x1)), int(round(y1)) - 1, ramp[3], max(1, thickness - 1))

    def ellipse(self, cx: float, cy: float, rx: float, ry: float, col: RGBA) -> None:
        if rx <= 0 or ry <= 0:
            self.px(int(round(cx)), int(round(cy)), col)
            return
        x0 = max(0, int(math.floor(cx - rx)))
        x1 = min(self.w - 1, int(math.ceil(cx + rx)))
        y0 = max(0, int(math.floor(cy - ry)))
        y1 = min(self.h - 1, int(math.ceil(cy + ry)))
        inv_rx2 = 1.0 / (rx * rx)
        inv_ry2 = 1.0 / (ry * ry)
        for y in range(y0, y1 + 1):
            dy = y - cy
            dy2 = dy * dy * inv_ry2
            for x in range(x0, x1 + 1):
                dx = x - cx
                if dx * dx * inv_rx2 + dy2 <= 1.02:
                    self.px(x, y, col)

    def shaded_ellipse(
        self,
        cx: float,
        cy: float,
        rx: float,
        ry: float,
        ramp: Sequence[RGBA],
        light_x: float = -0.35,
        light_y: float = -0.45,
    ) -> None:
        """Draw a 4-tone cel-shaded pixel sphere/ellipse with directional lighting."""
        if rx <= 0 or ry <= 0:
            self.px(int(round(cx)), int(round(cy)), ramp[2])
            return
        x0 = max(0, int(math.floor(cx - rx)))
        x1 = min(self.w - 1, int(math.ceil(cx + rx)))
        y0 = max(0, int(math.floor(cy - ry)))
        y1 = min(self.h - 1, int(math.ceil(cy + ry)))
        inv_rx = 1.0 / rx
        inv_ry = 1.0 / ry
        has_spec = len(ramp) > 4
        for y in range(y0, y1 + 1):
            ny = (y - cy) * inv_ry
            ny2 = ny * ny
            for x in range(x0, x1 + 1):
                nx = (x - cx) * inv_rx
                r2 = nx * nx + ny2
                if r2 <= 1.02:
                    # Directional dot light score
                    nd = (nx - light_x) ** 2 + (ny - light_y) ** 2
                    if has_spec and nd < 0.14:
                        col = ramp[4]
                    elif nd < 0.55:
                        col = ramp[3]
                    elif nd < 1.35:
                        col = ramp[2]
                    elif nd < 2.05:
                        col = ramp[1]
                    else:
                        col = ramp[0]
                    self.px(x, y, col)

    def poly(self, pts: Sequence[tuple[float, float]], col: RGBA) -> None:
        """Scanline fill polygon with crisp integer pixel edges."""
        if len(pts) < 3:
            return
        ys = [p[1] for p in pts]
        min_y = max(0, int(math.floor(min(ys))))
        max_y = min(self.h - 1, int(math.ceil(max(ys))))
        n = len(pts)
        for y in range(min_y, max_y + 1):
            sy = y + 0.5
            xs: list[float] = []
            for i in range(n):
                x1, y1 = pts[i]
                x2, y2 = pts[(i + 1) % n]
                if (y1 <= sy < y2) or (y2 <= sy < y1):
                    t = (sy - y1) / (y2 - y1)
                    xs.append(x1 + t * (x2 - x1))
            xs.sort()
            for j in range(0, len(xs) - 1, 2):
                x_start = max(0, int(math.floor(xs[j])))
                x_end = min(self.w - 1, int(math.ceil(xs[j + 1] - 0.5)))
                for x in range(x_start, x_end + 1):
                    self.px(x, y, col)

    def shaded_poly(
        self,
        pts: Sequence[tuple[float, float]],
        ramp: Sequence[RGBA],
        dither: bool = False,
    ) -> None:
        """Fill polygon with top-left to bottom-right 3-4 tone directional shading."""
        if len(pts) < 3:
            return
        xs_all = [p[0] for p in pts]
        ys_all = [p[1] for p in pts]
        min_x, max_x = min(xs_all), max(xs_all)
        min_y_f, max_y_f = min(ys_all), max(ys_all)
        span_x = max(1.0, max_x - min_x)
        span_y = max(1.0, max_y_f - min_y_f)
        min_y = max(0, int(math.floor(min_y_f)))
        max_y = min(self.h - 1, int(math.ceil(max_y_f)))
        n = len(pts)
        for y in range(min_y, max_y + 1):
            sy = y + 0.5
            xs: list[float] = []
            for i in range(n):
                x1, y1 = pts[i]
                x2, y2 = pts[(i + 1) % n]
                if (y1 <= sy < y2) or (y2 <= sy < y1):
                    t = (sy - y1) / (y2 - y1)
                    xs.append(x1 + t * (x2 - x1))
            xs.sort()
            for j in range(0, len(xs) - 1, 2):
                x_start = max(0, int(math.floor(xs[j])))
                x_end = min(self.w - 1, int(math.ceil(xs[j + 1] - 0.5)))
                for x in range(x_start, x_end + 1):
                    # Light score from top-right/top-left
                    t_y = (y - min_y_f) / span_y
                    t_x = (x - min_x) / span_x
                    score = t_y * 0.72 + t_x * 0.28
                    if dither and ((x + y) & 1):
                        score += 0.08
                    if score < 0.22:
                        col = ramp[3]
                    elif score < 0.62:
                        col = ramp[2]
                    elif score < 0.85:
                        col = ramp[1]
                    else:
                        col = ramp[0]
                    self.px(x, y, col)

    def wheel(
        self,
        cx: int,
        cy: int,
        radius: int,
        rim_ramp: Sequence[RGBA],
        spoke_col: RGBA,
        phase: float = 0.0,
    ) -> None:
        """Draw a detailed spoked wooden/iron pixel wheel with rotation phase."""
        self.ellipse(cx, cy, radius, radius, INK)
        self.shaded_ellipse(cx, cy, max(1, radius - 1), max(1, radius - 1), rim_ramp)
        inner_r = max(1, radius - 2)
        # Carve interior dark gaps between spokes
        self.ellipse(cx, cy, inner_r, inner_r, (24, 20, 18, 255))
        # 4 spokes rotated by phase
        for s in range(4):
            ang = phase + s * (math.pi / 4.0)
            dx = math.cos(ang) * inner_r
            dy = math.sin(ang) * inner_r
            self.line(int(round(cx - dx)), int(round(cy - dy)), int(round(cx + dx)), int(round(cy + dy)), spoke_col)
        # Center iron hub
        self.ellipse(cx, cy, max(1, radius // 3), max(1, radius // 3), rim_ramp[3])
        self.px(cx, cy, rim_ramp[0])

    def shaded_capsule(
        self,
        x0: float,
        y0: float,
        x1: float,
        y1: float,
        radius: float,
        ramp: Sequence[RGBA],
        light_x: float = -0.35,
        light_y: float = -0.55,
    ) -> None:
        """Draw a smooth 4-tone directionally shaded organic/armored capsule limb between two points."""
        dx = x1 - x0
        dy = y1 - y0
        len2 = dx * dx + dy * dy
        r = max(0.75, radius)
        min_x = max(0, int(math.floor(min(x0, x1) - r - 1)))
        max_x = min(self.w - 1, int(math.ceil(max(x0, x1) + r + 1)))
        min_y = max(0, int(math.floor(min(y0, y1) - r - 1)))
        max_y = min(self.h - 1, int(math.ceil(max(y0, y1) + r + 1)))
        inv_r = 1.0 / r
        has_spec = len(ramp) > 4
        for y in range(min_y, max_y + 1):
            for x in range(min_x, max_x + 1):
                if len2 > 1e-6:
                    t = max(0.0, min(1.0, ((x - x0) * dx + (y - y0) * dy) / len2))
                    cx = x0 + t * dx
                    cy = y0 + t * dy
                else:
                    cx, cy = x0, y0
                nx = (x - cx) * inv_r
                ny = (y - cy) * inv_r
                dist2 = nx * nx + ny * ny
                if dist2 <= 1.04:
                    nd = (nx - light_x) ** 2 + (ny - light_y) ** 2
                    if has_spec and nd < 0.16:
                        col = ramp[4]
                    elif nd < 0.62:
                        col = ramp[3]
                    elif nd < 1.38:
                        col = ramp[2]
                    elif nd < 2.02:
                        col = ramp[1]
                    else:
                        col = ramp[0]
                    self.px(x, y, col)

    def armor_plate(
        self,
        x: int,
        y: int,
        w: int,
        h: int,
        ramp: Sequence[RGBA],
        *,
        rivets: bool = False,
        sheen: bool = True,
        outline: RGBA | None = None,
    ) -> None:
        """Draw a rich metallic/armored pixel panel with diagonal specular sheen and optional rivets."""
        x0, y0 = int(round(x)), int(round(y))
        iw, ih = int(round(w)), int(round(h))
        if iw <= 0 or ih <= 0:
            return
        self.box(x0, y0, iw, ih, ramp, outline=None)
        if sheen and iw >= 5 and ih >= 5:
            spec = ramp[4] if len(ramp) > 4 else ramp[3]
            for sy in range(1, ih - 2):
                sx = x0 + 1 + (sy // 2)
                if sx < x0 + iw - 1:
                    self.px(sx, y0 + sy, ramp[3])
                    if sy < ih // 2 and sx + 1 < x0 + iw - 1:
                        self.px(sx + 1, y0 + sy, spec)
        if rivets and iw >= 6 and ih >= 6:
            riv_dark = ramp[0]
            riv_lit = ramp[4] if len(ramp) > 4 else ramp[3]
            for rx, ry in (
                (x0 + 2, y0 + 2),
                (x0 + iw - 3, y0 + 2),
                (x0 + 2, y0 + ih - 3),
                (x0 + iw - 3, y0 + ih - 3),
            ):
                self.px(rx, ry, riv_lit)
                self.px(rx, ry + 1, riv_dark)
        if outline is not None:
            self.rect_outline(x0, y0, iw, ih, outline)

    def radial_glow(self, cx: float, cy: float, radius: float, col: RGBA) -> None:
        """Crisp stepped dithered pixel glow halo around glowing weapons/cores."""
        r = max(1, int(math.ceil(radius)))
        icx, icy = int(round(cx)), int(round(cy))
        r2 = radius * radius
        for y in range(max(0, icy - r), min(self.h, icy + r + 1)):
            dy = y - cy
            for x in range(max(0, icx - r), min(self.w, icx + r + 1)):
                dx = x - cx
                d2 = dx * dx + dy * dy
                if d2 <= r2:
                    frac = 1.0 - math.sqrt(d2) / max(0.01, radius)
                    if frac > 0.45 or ((x + y) & 1) == 0:
                        a = int(col[3] * frac)
                        if a > 12:
                            self.px(x, y, (col[0], col[1], col[2], a))

    def part(self) -> 'PixelCanvas':
        """Create a transparent scratch layer of identical dimensions for outlined part compositing."""
        return PixelCanvas(self.w, self.h)

    def blit_part(
        self,
        layer: 'PixelCanvas',
        crease: RGBA | None = INK,
        ox: int = 0,
        oy: int = 0,
    ) -> None:
        """Composite a drawn sub-part onto this canvas with an optional crisp 1px internal separation crease."""
        if crease is not None:
            layer.add_outline(crease)
        self.blit(layer, ox, oy)

    def blit(self, src: 'PixelCanvas', ox: int = 0, oy: int = 0) -> None:
        sw, sh, sdata = src.w, src.h, src.data
        dw, dh, ddata = self.w, self.h, self.data
        y_start = max(0, -oy)
        y_end = min(sh, dh - oy)
        x_start = max(0, -ox)
        x_end = min(sw, dw - ox)
        for y in range(y_start, y_end):
            srow = y * sw
            drow = (y + oy) * dw
            for x in range(x_start, x_end):
                si = (srow + x) * 4
                sa = sdata[si + 3]
                if sa == 0:
                    continue
                di = (drow + x + ox) * 4
                if sa == 255 or ddata[di + 3] == 0:
                    ddata[di] = sdata[si]
                    ddata[di + 1] = sdata[si + 1]
                    ddata[di + 2] = sdata[si + 2]
                    ddata[di + 3] = sa
                else:
                    self.px(x + ox, y + oy, (sdata[si], sdata[si + 1], sdata[si + 2], sa))

    def add_outline(self, color: RGBA = INK, skip_colors: Iterable[RGBA] = ()) -> None:
        """Add a crisp 1px 4-connected dark pixel outline around all opaque pixels."""
        skip = set(skip_colors)
        to_paint: list[tuple[int, int]] = []
        w, h, data = self.w, self.h, self.data
        c0, c1, c2, c3 = color
        for y in range(h):
            row = y * w
            for x in range(w):
                idx0 = (row + x) * 4
                if data[idx0 + 3] > 0:
                    continue
                has_opaque = False
                if x > 0:
                    i = idx0 - 4
                    if data[i + 3] >= 180 and (not skip or (data[i], data[i + 1], data[i + 2], data[i + 3]) not in skip):
                        has_opaque = True
                if not has_opaque and x + 1 < w:
                    i = idx0 + 4
                    if data[i + 3] >= 180 and (not skip or (data[i], data[i + 1], data[i + 2], data[i + 3]) not in skip):
                        has_opaque = True
                if not has_opaque and y > 0:
                    i = idx0 - w * 4
                    if data[i + 3] >= 180 and (not skip or (data[i], data[i + 1], data[i + 2], data[i + 3]) not in skip):
                        has_opaque = True
                if not has_opaque and y + 1 < h:
                    i = idx0 + w * 4
                    if data[i + 3] >= 180 and (not skip or (data[i], data[i + 1], data[i + 2], data[i + 3]) not in skip):
                        has_opaque = True
                if has_opaque:
                    to_paint.append((x, y))
        for x, y in to_paint:
            i = (y * w + x) * 4
            data[i] = c0
            data[i + 1] = c1
            data[i + 2] = c2
            data[i + 3] = c3

    def shift(self, dx: int, dy: int) -> 'PixelCanvas':
        out = PixelCanvas(self.w, self.h)
        out.blit(self, dx, dy)
        return out

    def rotate_90_ccw(self) -> 'PixelCanvas':
        """Rotate sprite 90 degrees counter-clockwise (useful for fallen death frames)."""
        out = PixelCanvas(self.h, self.w)
        for y in range(self.h):
            for x in range(self.w):
                col = self.get(x, y)
                if col[3] > 0:
                    out.px(y, self.w - 1 - x, col)
        return out

    def rotate_nearest(self, angle_deg: float, cx: float, cy: float) -> 'PixelCanvas':
        """Nearest-neighbor pixel rotation around (cx, cy) preserving sharp edges."""
        out = PixelCanvas(self.w, self.h)
        rad = math.radians(-angle_deg)
        ca = math.cos(rad)
        sa = math.sin(rad)
        for y in range(self.h):
            dy = y - cy
            for x in range(self.w):
                dx = x - cx
                sx = int(round(cx + dx * ca - dy * sa))
                sy = int(round(cy + dx * sa + dy * ca))
                if 0 <= sx < self.w and 0 <= sy < self.h:
                    col = self.get(sx, sy)
                    if col[3] > 0:
                        out.px(x, y, col)
        return out

    def swap_team(self, team: str) -> 'PixelCanvas':
        """Return a new PixelCanvas with symbolic team tokens swapped to player/enemy colors."""
        mapping = TEAM_PALETTES[team]
        out = self.copy()
        d = out.data
        for i in range(0, len(d), 4):
            if d[i + 3] == 0:
                continue
            key = (d[i], d[i + 1], d[i + 2], d[i + 3])
            rep = mapping.get(key)
            if rep is not None:
                d[i], d[i + 1], d[i + 2], d[i + 3] = rep
        return out

    def tint_flash(self, tint: RGBA, strength: float = 0.45) -> 'PixelCanvas':
        """Blend a bright hit-flash tint onto non-outline opaque pixels."""
        out = self.copy()
        d = out.data
        inv = 1.0 - strength
        for i in range(0, len(d), 4):
            if d[i + 3] < 128:
                continue
            if (d[i], d[i + 1], d[i + 2], d[i + 3]) == INK:
                continue
            d[i] = min(255, int(d[i] * inv + tint[0] * strength))
            d[i + 1] = min(255, int(d[i + 1] * inv + tint[1] * strength))
            d[i + 2] = min(255, int(d[i + 2] * inv + tint[2] * strength))
        return out

    def to_image(self) -> Image.Image:
        return Image.frombytes('RGBA', (self.w, self.h), bytes(self.data))

    def map_pixels(self, fn: Callable[[int, int, RGBA], RGBA]) -> None:
        for y in range(self.h):
            for x in range(self.w):
                col = self.get(x, y)
                if col[3] > 0:
                    new_col = fn(x, y, col)
                    i = (y * self.w + x) * 4
                    self.data[i : i + 4] = bytes(new_col)
