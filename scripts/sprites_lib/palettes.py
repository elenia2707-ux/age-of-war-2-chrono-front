"""Hue-shifted retro pixel-art color palettes (Metal Slug / 16-bit strategy style).

Every material ramp has 4-5 stops:
  0: deep shadow
  1: mid shadow
  2: base midtone
  3: highlight
  4: specular / brightest rim (optional)
"""

from __future__ import annotations

RGBA = tuple[int, int, int, int]


def hx(code: str, alpha: int = 255) -> RGBA:
    code = code.lstrip('#')
    return (int(code[0:2], 16), int(code[2:4], 16), int(code[4:6], 16), alpha)


TRANSPARENT: RGBA = (0, 0, 0, 0)

# Crisp blue-tinted near-black pixel outline (classic arcade ink)
INK: RGBA = hx('#11131d')
INK_SOFT: RGBA = hx('#1c2030')
WHITE: RGBA = hx('#ffffff')
OFF_WHITE: RGBA = hx('#f1f5f9')
CREAM: RGBA = hx('#fef9c3')

# Symbolic team-color placeholders replaced cleanly during palette swap
# Chosen to be unique sentinel RGBs never used in non-team materials.
T_DEEP: RGBA = (1, 11, 21, 255)
T_SHADE: RGBA = (2, 22, 42, 255)
T_MID: RGBA = (3, 33, 63, 255)
T_LIGHT: RGBA = (4, 44, 84, 255)
T_GLOW: RGBA = (5, 55, 105, 255)
T_TRIM: RGBA = (6, 66, 126, 255)

TEAM_PALETTES: dict[str, dict[RGBA, RGBA]] = {
    'player': {
        T_DEEP: hx('#102359'),
        T_SHADE: hx('#1b429c'),
        T_MID: hx('#2a6df4'),
        T_LIGHT: hx('#66b0ff'),
        T_GLOW: hx('#38e8ff'),
        T_TRIM: hx('#d8f2ff'),
    },
    'enemy': {
        T_DEEP: hx('#4d0a12'),
        T_SHADE: hx('#991620'),
        T_MID: hx('#e0282f'),
        T_LIGHT: hx('#ff6e6b'),
        T_GLOW: hx('#ff4d7d'),
        T_TRIM: hx('#ffe0e0'),
    },
}

# Material Ramps: (deep, shade, mid, light, spec)
SKIN = (hx('#6b361c'), hx('#a85d35'), hx('#d98d5c'), hx('#f4bc8e'), hx('#ffe0bd'))
SKIN_TAN = (hx('#592d17'), hx('#8f4d2a'), hx('#bf7648'), hx('#dfa072'), hx('#f5c9a1'))

FUR = (hx('#3a2010'), hx('#62371b'), hx('#93572c'), hx('#bf8048'), hx('#deb078'))
FUR_DARK = (hx('#271810'), hx('#472c1d'), hx('#6e4830'), hx('#96694a'), hx('#b88b68'))
LEATHER = (hx('#2c180c'), hx('#4f2d17'), hx('#794826'), hx('#a3673c'), hx('#c98e5e'))
WOOD = (hx('#301a0c'), hx('#593218'), hx('#8a5229'), hx('#b87944'), hx('#dca46c'))
WOOD_DARK = (hx('#24140a'), hx('#422514'), hx('#663c22'), hx('#8a5736'), hx('#ae7952'))
BONE = (hx('#5c5242'), hx('#94866f'), hx('#cfc1a5'), hx('#ede3ce'), hx('#fcf7eb'))

STEEL = (hx('#232b3a'), hx('#46546b'), hx('#7c8fa8'), hx('#b8c8db'), hx('#eaf2fa'))
DARK_STEEL = (hx('#161b24'), hx('#2a3444'), hx('#49586e'), hx('#7487a1'), hx('#a9bad1'))
IRON = (hx('#181c22'), hx('#303842'), hx('#515c69'), hx('#7a8796'), hx('#adb8c4'))
BRONZE = (hx('#42240c'), hx('#7d4918'), hx('#b87828'), hx('#e3ae4b'), hx('#fae08c'))
GOLD = (hx('#593308'), hx('#9e6210'), hx('#de9b1f'), hx('#fad046'), hx('#fff3a6'))

STONE = (hx('#2b313b'), hx('#4a5361'), hx('#748091'), hx('#a1aebf'), hx('#ced8e3'))
SANDSTONE = (hx('#574124'), hx('#8a6b41'), hx('#bd9b68'), hx('#dec494'), hx('#f5e5c4'))
BRICK = (hx('#3b1810'), hx('#692d20'), hx('#9c4a36'), hx('#c76e54'), hx('#e39b81'))
CONCRETE = (hx('#272b26'), hx('#474d44'), hx('#6e7569'), hx('#969e90'), hx('#bfc7b8'))
CLIFF = (hx('#2b1f18'), hx('#4a3629'), hx('#705642'), hx('#997a60'), hx('#bf9f82'))

OLIVE = (hx('#212919'), hx('#3d4a2d'), hx('#5f7045'), hx('#879c65'), hx('#b4c791'))
KHAKI = (hx('#403622'), hx('#6b5b3c'), hx('#9c875c'), hx('#c7b283'), hx('#e6d7b0'))
CHARCOAL = (hx('#141820'), hx('#252c38'), hx('#3e4859'), hx('#606e82'), hx('#8a99ad'))
TITANIUM = (hx('#111926'), hx('#213047'), hx('#3c5270'), hx('#6b88ab'), hx('#b0cbe6'))

DINO_GREEN = (hx('#19331c'), hx('#2c5c2e'), hx('#498c42'), hx('#7ec261'), hx('#bce896'))
DINO_BELLY = (hx('#5e5430'), hx('#96884e'), hx('#cbbd78'), hx('#ebe0a4'), hx('#faf4cc'))
HORSE_BAY = (hx('#30160b'), hx('#592c17'), hx('#8c4927'), hx('#b86b3e'), hx('#db9667'))
HORSE_GREY = (hx('#2f3540'), hx('#566070'), hx('#8a96a8'), hx('#bec8d6'), hx('#e6ecf5'))

FIRE = (hx('#7c1d0a'), hx('#cc370e'), hx('#f56e18'), hx('#fcb928'), hx('#fff8b5'))
SMOKE = (hx('#22262e'), hx('#3d4452'), hx('#626d80'), hx('#95a2b5'), hx('#cbd5e1'))
GRASS = (hx('#1d3315'), hx('#335723'), hx('#548234'), hx('#82b04c'), hx('#b4d975'))
DIRT = (hx('#24180f'), hx('#422c1b'), hx('#66462b'), hx('#8f6742'), hx('#b88d62'))
CYAN_GLOW = (hx('#0a3b5c'), hx('#0d749c'), hx('#1ec4e8'), hx('#80f0ff'), hx('#e8feff'))
HAZARD_YELLOW = (hx('#593b08'), hx('#9c6e0e'), hx('#dba718'), hx('#facc15'), hx('#fef08a'))
COPPER = (hx('#3d1a0d'), hx('#75361c'), hx('#b55c32'), hx('#de8c56'), hx('#f7c392'))
OBSIDIAN = (hx('#0f0c1a'), hx('#1e1833'), hx('#332952'), hx('#54467d'), hx('#8574b5'))
COSMIC_VIOLET = (hx('#2c0c4f'), hx('#5b1c99'), hx('#9b3be6'), hx('#d47aff'), hx('#fae3ff'))
SOLAR_GOLD = (hx('#663406'), hx('#b3640c'), hx('#f2a51a'), hx('#ffdf59'), hx('#fffce0'))
EGYPT_LINEN = (hx('#5e523e'), hx('#948468'), hx('#cfc1a5'), hx('#ede4d1'), hx('#fffdf5'))
NVG_GREEN = (hx('#0a2e16'), hx('#156b2f'), hx('#22c55e'), hx('#86efac'), hx('#ecfdf5'))
HAIR_BROWN = (hx('#1f120b'), hx('#3d2214'), hx('#633a22'), hx('#8c5636'), hx('#b57c56'))
BRASS = (hx('#42290a'), hx('#7a4e14'), hx('#b87f24'), hx('#e3b448'), hx('#faea96'))
SLATE_ARMOR = (hx('#161d29'), hx('#2a374a'), hx('#475c78'), hx('#7690b3'), hx('#b2c8e0'))
CRIMSON_FUEL = (hx('#450a0a'), hx('#8c1616'), hx('#cc2929'), hx('#f25c5c'), hx('#ffb0b0'))
PLASMA_PINK = (hx('#4a0a36'), hx('#91166b'), hx('#db2ea6'), hx('#ff75d8'), hx('#ffe0f7'))


