# -*- coding: utf-8 -*-
"""
Vẽ bộ ảnh minh họa mẫu (nguyên bản, phong cách thủy mặc cổ phong) cho dữ liệu mẫu.
Ảnh do code tự vẽ, không lấy từ truyện/phim, nên dùng thoải mái.

  python3 tools/ve_anh_mau.py      → sinh tools/_svg/*.svg
  node tools/chup_anh.js           → chuyển sang assets/img/mau/*.jpg
"""
import math, os, random

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(GOC, "tools", "_svg")
VIET = "'Noto Serif','DejaVu Serif',serif"
HAN = "'Noto Serif CJK SC','Noto Serif CJK TC',serif"
MUC = "#0a0e13"  # màu mực


# ------------------------------------------------------------------ tiện ích hình
def ridge(w, h, y, amp, seed, steps=7, rough=0.55):
    """Đường sống núi ngẫu nhiên (midpoint displacement), trả về path kín."""
    rnd = random.Random(seed)
    pts = [(0, y + rnd.uniform(-amp, amp) * 0.3), (w, y + rnd.uniform(-amp, amp) * 0.3)]
    a = amp
    for _ in range(steps):
        new = []
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            new.append((x1, y1))
            new.append(((x1 + x2) / 2, (y1 + y2) / 2 + rnd.uniform(-a, a)))
        new.append(pts[-1])
        pts = new
        a *= rough
    d = f"M0 {h} L" + " L".join(f"{x:.1f} {yy:.1f}" for x, yy in pts) + f" L{w} {h} Z"
    return d


def peaks(w, h, seed, specs):
    """Núi nhọn kiểu tranh thủy mặc: specs = [(x, đỉnh_y, rộng)]"""
    rnd = random.Random(seed)
    d = f"M0 {h} "
    for x, top, wd in specs:
        l, r = x - wd / 2, x + wd / 2
        d += (f"L{l:.0f} {h} C{l + wd * .25:.0f} {top + (h - top) * .45:.0f} {x - wd * .12:.0f} {top + rnd.uniform(5, 25):.0f} {x:.0f} {top:.0f} "
              f"C{x + wd * .1:.0f} {top + rnd.uniform(10, 40):.0f} {r - wd * .2:.0f} {top + (h - top) * .5:.0f} {r:.0f} {h} ")
    return d + f"L{w} {h} Z"


def lop_nui(w, h, layers):
    """layers: [(d, màu, độ mờ)] vẽ từ xa tới gần, kèm dải sương giữa các lớp."""
    s = ""
    for i, (d, mau, op) in enumerate(layers):
        s += f'<path d="{d}" fill="{mau}" opacity="{op}"/>'
        if i < len(layers) - 1:
            s += f'<rect x="0" y="0" width="{w}" height="{h}" fill="url(#suong)" opacity=".35"/>'
    return s


def may(x, y, s=1.0, mau="#fff", op=0.5, sw=3):
    """Mây tường vân (cuộn xoắn)."""
    return (f'<g transform="translate({x} {y}) scale({s})" fill="none" stroke="{mau}" stroke-opacity="{op}" stroke-width="{sw}" stroke-linecap="round">'
            '<path d="M0 0 C10 -22 40 -22 46 -4 C52 -26 86 -26 92 -2 C110 -12 128 0 120 14 L-10 14 C-24 14 -24 -4 -10 -4 C-4 -4 0 0 0 0"/>'
            '<path d="M20 14 C26 2 38 4 38 12"/><path d="M70 14 C74 4 86 4 88 12"/></g>')


def may_mem(cx, cy, rx, ry, mau="#fff", op=0.5):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{mau}" opacity="{op}" filter="url(#mo30)"/>'


def chim(x, y, s=1.0, mau=MUC):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="none" stroke="{mau}" stroke-width="2.2" stroke-linecap="round">'
            '<path d="M0 0 q6 -6 12 0 q6 -6 12 0"/><path d="M30 -10 q4 -4 8 0 q4 -4 8 0"/><path d="M18 -22 q3 -3 6 0 q3 -3 6 0"/></g>')


def trang(cx, cy, r, mau="#f6e7b8", hao="#f5d27a"):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r * 2.6}" fill="{hao}" opacity=".18" filter="url(#mo30)"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r * 1.35}" fill="{hao}" opacity=".25" filter="url(#mo12)"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{mau}"/>'
            f'<circle cx="{cx - r * .3}" cy="{cy - r * .2}" r="{r * .18}" fill="#000" opacity=".05"/>'
            f'<circle cx="{cx + r * .25}" cy="{cy + r * .3}" r="{r * .12}" fill="#000" opacity=".05"/>')


def thong(x, y, s=1.0, mau=MUC):
    """Cây tùng nghiêng."""
    return (f'<g transform="translate({x} {y}) scale({s})" fill="{mau}">'
            '<path d="M0 0 C4 -30 -6 -60 10 -90 C12 -60 8 -30 6 0 Z"/>'
            '<ellipse cx="20" cy="-92" rx="34" ry="9"/><ellipse cx="-14" cy="-70" rx="26" ry="7"/>'
            '<ellipse cx="22" cy="-60" rx="22" ry="6"/><ellipse cx="4" cy="-108" rx="20" ry="6"/></g>')


def phong(x, y, s=1.0, mau="#c8481f", op=0.9):
    """Cây phong lá đỏ (đám tán tròn)."""
    rnd = random.Random(int(x * 7 + y))
    g = f'<g transform="translate({x} {y}) scale({s})"><path d="M-3 0 L-1 -40 L1 -40 L3 0Z" fill="{MUC}"/>'
    for _ in range(9):
        g += f'<circle cx="{rnd.uniform(-22, 22):.0f}" cy="{rnd.uniform(-70, -38):.0f}" r="{rnd.uniform(10, 18):.0f}" fill="{mau}" opacity="{op}"/>'
    return g + "</g>"


def thap(x, y, s=1.0, mau=MUC, tang=3):
    """Lầu các mái cong."""
    g = f'<g transform="translate({x} {y}) scale({s})" fill="{mau}">'
    yy = 0
    for i in range(tang):
        w = 60 - i * 12
        g += f'<rect x="{-w * .38}" y="{yy - 26}" width="{w * .76}" height="26"/>'
        g += f'<path d="M{-w * .75} {yy - 22} Q{-w * .5} {yy - 30} {-w * .3} {yy - 40} L{w * .3} {yy - 40} Q{w * .5} {yy - 30} {w * .75} {yy - 22} Q{w * .4} {yy - 28} 0 {yy - 30} Q{-w * .4} {yy - 28} {-w * .75} {yy - 22}Z"/>'
        yy -= 40
    g += f'<path d="M-2 {yy} L0 {yy - 18} L2 {yy}Z"/></g>'
    return g


def an_trien(x, y, chu, s=1.0):
    """Con dấu đỏ (triện) – chữ xếp 2x2 hoặc dọc."""
    n = len(chu)
    cot = 2 if n == 4 else 1
    hang = math.ceil(n / cot)
    w, h = 34 * cot + 10, 34 * hang + 10
    g = f'<g transform="translate({x} {y}) scale({s})"><rect width="{w}" height="{h}" rx="4" fill="#b8322c"/>'
    g += f'<rect x="3" y="3" width="{w - 6}" height="{h - 6}" rx="3" fill="none" stroke="#f3d9c8" stroke-width="1.5" opacity=".7"/>'
    for i, c in enumerate(chu):
        la_latin = all(ch.isascii() or ch in "ĐđÂâÊêÔôƠơƯư" for ch in chu)
        if cot == 2 and la_latin:
            cc, rr = i % 2, i // 2                         # chữ Latin: đọc theo hàng, trái → phải
        else:
            cc, rr = (cot - 1 - i // hang, i % hang) if cot == 2 else (0, i)   # triện Hán: cột phải → trái
        font = VIET if c.isascii() or c in "ĐđÂâÊêÔôƠơƯư" else HAN   # chữ Latin/Việt dùng font Việt
        g += f'<text x="{5 + cc * 34 + 17}" y="{5 + rr * 34 + 28}" font-family="{font}" font-weight="700" font-size="28" fill="#f8e6d6" text-anchor="middle">{c}</text>'
    return g + "</g>"


def chu_doc(x, y, chu, size, mau="#f5d27a", op=1.0, wt=700):
    return "".join(f'<text x="{x}" y="{y + i * size * 1.08}" font-family="{HAN}" font-weight="{wt}" font-size="{size}" fill="{mau}" opacity="{op}" text-anchor="middle">{c}</text>'
                   for i, c in enumerate(chu))


# ------------------------------------------------------------------ nhân vật (bóng đen, có viền sáng)
def nguoi(kieu, x, y, s, mau=MUC, vien="#f5d27a"):
    """kieu: 'nam' | 'nu' | 'gia'. Gốc toạ độ = điểm giữa bàn chân, cao ~300 đơn vị."""
    if kieu == "nam":
        body = (# kiếm đeo sau lưng: vẽ trước để thân che mất lưỡi, chỉ lộ chuôi trên vai phải
                '<path d="M-30 -150 L30 -296" stroke-width="5"/>'
                '<path d="M30 -296 L44 -330" stroke-width="7" stroke-linecap="round"/>'
                '<path d="M20 -304 L42 -292" stroke-width="5" stroke-linecap="round"/>'
                '<circle cx="46" cy="-334" r="4"/>'
                '<circle cx="0" cy="-262" r="16"/><circle cx="0" cy="-283" r="8"/>'
                '<path d="M-12 -286 L14 -280" stroke-width="2.5"/>'
                '<path d="M-24 -244 Q0 -252 24 -244 L40 -200 Q46 -120 62 0 L-62 0 Q-46 -120 -40 -200 Z"/>'
                '<path d="M-26 -238 Q-62 -200 -82 -116 Q-62 -112 -44 -128 Q-40 -180 -34 -210 Z"/>'
                '<path d="M26 -238 Q62 -200 82 -116 Q62 -112 44 -128 Q40 -180 34 -210 Z"/>'
                '<path d="M36 -160 C70 -150 92 -120 128 -122 C96 -108 70 -132 38 -146 Z"/>'
                '<path d="M32 -144 C64 -120 74 -84 108 -80 C74 -70 60 -104 30 -128 Z" opacity=".85"/>')
    elif kieu == "nu":
        body = ('<circle cx="0" cy="-262" r="15"/><ellipse cx="0" cy="-280" rx="14" ry="8"/>'
                '<path d="M-14 -268 C-34 -200 -14 -150 -48 -86 C-18 -112 -2 -180 12 -262 Z"/>'
                '<path d="M-22 -244 Q0 -252 22 -244 L36 -196 Q50 -110 84 0 L-84 0 Q-50 -110 -36 -196 Z"/>'
                '<path d="M-24 -236 Q-70 -190 -100 -100 Q-74 -96 -50 -120 Q-40 -180 -32 -206 Z"/>'
                '<path d="M24 -236 Q70 -190 100 -100 Q74 -96 50 -120 Q40 -180 32 -206 Z"/>'
                '<path d="M-110 -150 C-60 -230 60 -230 120 -170 C170 -120 200 -150 240 -190" fill="none" stroke-width="5"/>'
                '<path d="M-100 -96 C-160 -60 -190 -120 -240 -90" fill="none" stroke-width="5"/>')
    else:  # gia: ông lão còng, râu dài, chống gậy
        body = ('<circle cx="10" cy="-240" r="16"/><path d="M-6 -252 Q10 -276 28 -252 Z"/>'
                '<path d="M14 -228 L24 -170 L4 -226 Z"/>'
                '<path d="M-14 -226 Q10 -236 26 -220 L36 -180 Q44 -100 54 0 L-54 0 Q-40 -110 -30 -190 Z"/>'
                '<path d="M-16 -220 Q-50 -180 -60 -110 Q-44 -108 -32 -124 Q-30 -170 -26 -196 Z"/>'
                '<path d="M24 -214 Q50 -190 66 -150 Q56 -144 46 -152 Q38 -176 30 -190 Z"/>'
                '<path d="M66 -220 L66 0" stroke-width="5" stroke-linecap="round"/>'
                '<circle cx="66" cy="-226" r="9" fill="none" stroke-width="4"/>'
                '<path d="M-40 -120 C-56 -110 -56 -84 -40 -80 C-28 -84 -28 -110 -40 -120 Z"/>')
    tf = f'translate({x} {y}) scale({s})'
    return (f'<g transform="{tf}" fill="{vien}" stroke="{vien}" opacity=".85" filter="url(#mo6)">{body}</g>'
            f'<g transform="{tf}" fill="{mau}" stroke="{mau}">{body}</g>')


def kiem_bay(x1, y1, x2, y2, mau="#9ff3d6"):
    """Vệt kiếm bay."""
    return (f'<path d="M{x1} {y1} Q{(x1 + x2) / 2} {min(y1, y2) - 60} {x2} {y2}" fill="none" stroke="{mau}" stroke-width="10" opacity=".35" filter="url(#mo12)"/>'
            f'<path d="M{x1} {y1} Q{(x1 + x2) / 2} {min(y1, y2) - 60} {x2} {y2}" fill="none" stroke="#fff" stroke-width="2" opacity=".9"/>')


# ------------------------------------------------------------------ khung SVG
def svg(w, h, body, nen=("#1d4e5f", "#0b1320"), seed=1, giay=True):
    defs = f'''<defs>
<linearGradient id="troi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{nen[0]}"/><stop offset="1" stop-color="{nen[1]}"/></linearGradient>
<linearGradient id="suong" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".75" stop-color="#fff" stop-opacity=".0"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
<linearGradient id="toi-day" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></linearGradient>
<radialGradient id="vignette" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
<filter id="mo6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="mo12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="mo30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="giay"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="{seed}"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .35  0 0 0 .5 0"/></filter>
</defs>'''
    giay_lop = f'<rect width="{w}" height="{h}" filter="url(#giay)" opacity=".18"/>' if giay else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{defs}'
            f'<rect width="{w}" height="{h}" fill="url(#troi)"/>{body}{giay_lop}'
            f'<rect width="{w}" height="{h}" fill="url(#vignette)"/></svg>')


def khung_vang(w, h, m=18):
    return (f'<rect x="{m}" y="{m}" width="{w - 2 * m}" height="{h - 2 * m}" fill="none" stroke="#f5d27a" stroke-opacity=".55" stroke-width="2" rx="6"/>'
            f'<rect x="{m + 7}" y="{m + 7}" width="{w - 2 * m - 14}" height="{h - 2 * m - 14}" fill="none" stroke="#f5d27a" stroke-opacity=".25" stroke-width="1" rx="4"/>')


# ------------------------------------------------------------------ TỪNG ẢNH
def bia():
    W, H = 600, 900
    b = trang(420, 210, 70)
    b += may(40, 150, 1.1, op=.35) + may(380, 330, .8, op=.25)
    b += chim(120, 260, 1.1, "#c9d6d9")
    b += lop_nui(W, H, [
        (peaks(W, H, 3, [(120, 360, 300), (330, 300, 260), (520, 380, 260)]), "#3d6f7c", .55),
        (ridge(W, H, 560, 90, 11), "#21424d", .8),
        (peaks(W, H, 5, [(60, 520, 260), (300, 470, 240), (560, 540, 260)]), "#122630", .95),
    ])
    b += may_mem(300, 640, 360, 60, "#cfe3e6", .35)
    b += f'<path d="{ridge(W, H, 700, 30, 21, rough=.5)}" fill="{MUC}"/>'
    b += thong(470, 712, .9) + nguoi("nam", 300, 690, .38, vien="#9ff3d6")
    b += kiem_bay(60, 520, 250, 420)
    b += f'<rect width="{W}" height="{H}" fill="url(#toi-day)"/>'
    b += chu_doc(536, 90, "凡人修仙传", 52, "#f5d27a")
    b += f'<text x="300" y="790" font-family="{VIET}" font-weight="700" font-size="50" fill="#fff6dc" text-anchor="middle">Phàm Nhân Tu Tiên</text>'
    b += f'<text x="300" y="830" font-family="{VIET}" font-size="20" fill="#f5d27a" text-anchor="middle" letter-spacing="3">REVIEW · TÀNG KINH CÁC</text>'
    b += an_trien(46, 60, "TCBĐ") + khung_vang(W, H)
    return svg(W, H, b, ("#2a6372", "#0a141c"), 3)


def chan_dung(ten, han, kieu, nen, vien, seed, an):
    W, H = 600, 800
    b = trang(300, 230, 120, "#f3e8c8" if kieu != "gia" else "#e9c9a0", vien)
    b += may(30, 120, .9, op=.3) + may(440, 90, .7, op=.25)
    b += lop_nui(W, H, [
        (peaks(W, H, seed, [(90, 420, 260), (500, 400, 280)]), nen[0], .45),
        (ridge(W, H, 560, 70, seed + 1), nen[1], .8),
    ])
    b += may_mem(300, 560, 340, 50, "#ffffff", .25)
    b += nguoi(kieu, 300, 880, 2.25, vien=vien)
    b += f'<rect width="{W}" height="{H}" fill="url(#toi-day)"/>'
    b += chu_doc(545, 80, han, 46, vien, .95)
    b += f'<text x="300" y="730" font-family="{VIET}" font-weight="700" font-size="54" fill="#fff6dc" text-anchor="middle">{ten}</text>'
    b += an_trien(40, 50, an, .9) + khung_vang(W, H)
    return svg(W, H, b, (nen[0], "#080b10"), seed)


def logo(ten_han, bieu_tuong, mau, seed):
    W = H = 400
    b = f'<circle cx="200" cy="200" r="178" fill="{mau[1]}"/>'
    b += f'<circle cx="200" cy="200" r="178" fill="none" stroke="#f5d27a" stroke-width="10"/>'
    b += f'<circle cx="200" cy="200" r="160" fill="none" stroke="#f5d27a" stroke-width="2" opacity=".7"/>'
    b += f'<circle cx="200" cy="200" r="120" fill="{mau[0]}" opacity=".9"/>'
    for i in range(24):
        a = i * math.pi / 12
        b += f'<circle cx="{200 + 140 * math.cos(a):.1f}" cy="{200 + 140 * math.sin(a):.1f}" r="3" fill="#f5d27a" opacity=".8"/>'
    b += bieu_tuong
    b += f'<text x="200" y="358" font-family="{HAN}" font-weight="700" font-size="30" fill="#f5d27a" text-anchor="middle" letter-spacing="8">{ten_han}</text>'
    return svg(W, H, b, ("#10161e", "#0a0e13"), seed, giay=False)


def la_phong():
    pts = []
    for i in range(22):
        a = -math.pi / 2 + i * 2 * math.pi / 22
        r = 92 if i % 2 == 0 else (52 if i % 4 == 1 else 40)
        if i in (10, 11, 12):
            r *= .55
        pts.append(f"{200 + r * math.cos(a):.1f},{195 + r * math.sin(a):.1f}")
    return (f'<polygon points="{" ".join(pts)}" fill="#e2632a" stroke="#f5d27a" stroke-width="3" stroke-linejoin="round"/>'
            '<path d="M200 195 L200 300 M200 210 L150 160 M200 210 L250 160 M200 230 L140 230 M200 230 L260 230" stroke="#7a2a10" stroke-width="4"/>')


def trang_khuyet():
    return ('<circle cx="200" cy="190" r="80" fill="#f3e8c8"/><circle cx="235" cy="170" r="72" fill="#2c2f66"/>'
            '<path d="M120 270 Q200 240 280 270" stroke="#f5d27a" stroke-width="4" fill="none"/>'
            '<circle cx="268" cy="132" r="5" fill="#f5d27a"/><circle cx="290" cy="170" r="3" fill="#f5d27a"/>')


def vat(kieu, mau, seed, ten):
    W = H = 400
    b = f'<circle cx="200" cy="190" r="150" fill="{mau}" opacity=".35" filter="url(#mo30)"/>'
    for i in range(14):
        rnd = random.Random(seed + i)
        b += f'<circle cx="{rnd.uniform(40, 360):.0f}" cy="{rnd.uniform(40, 330):.0f}" r="{rnd.uniform(1.5, 3.5):.1f}" fill="#fff6dc" opacity="{rnd.uniform(.3, .8):.2f}"/>'
    if kieu == "binh":
        b += ('<path d="M178 92 L222 92 L218 112 Q262 140 262 200 Q262 278 200 290 Q138 278 138 200 Q138 140 182 112 Z" fill="#1f8a72" stroke="#9ff3d6" stroke-width="3"/>'
              '<rect x="172" y="80" width="56" height="16" rx="4" fill="#d4a944"/>'
              '<path d="M160 170 Q170 140 196 128" stroke="#e8fff7" stroke-width="7" fill="none" opacity=".6" stroke-linecap="round"/>'
              '<path d="M150 210 Q200 230 250 210" stroke="#d4a944" stroke-width="3" fill="none"/>'
              '<ellipse cx="200" cy="305" rx="70" ry="10" fill="#000" opacity=".4"/>'
              '<path d="M200 40 q8 16 0 24 q-8 -8 0 -24z" fill="#9ff3d6" filter="url(#mo6)"/><path d="M200 44 q6 12 0 18 q-6 -6 0 -18z" fill="#e8fff7"/>')
    elif kieu == "kiem":
        b += '<g transform="rotate(-40 200 200)">'
        b += ('<path d="M196 40 L204 40 L208 250 L192 250 Z" fill="#cfe8d8" stroke="#2f6b3a" stroke-width="2"/>'
              '<path d="M200 40 L200 250" stroke="#7fbf8f" stroke-width="2"/>'
              '<rect x="166" y="250" width="68" height="12" rx="5" fill="#d4a944"/>'
              '<rect x="193" y="262" width="14" height="60" rx="3" fill="#2f6b3a"/>'
              '<path d="M193 272 h14 M193 286 h14 M193 300 h14" stroke="#9fd4a8" stroke-width="2"/>'
              '<circle cx="200" cy="330" r="9" fill="#d4a944"/></g>')
        b += ('<path d="M90 120 L120 150 L105 155 L140 200" stroke="#f5e27a" stroke-width="4" fill="none" filter="url(#mo6)"/>'
              '<path d="M90 120 L120 150 L105 155 L140 200" stroke="#fffbe0" stroke-width="2" fill="none"/>'
              '<path d="M300 230 L270 260 L290 262 L255 310" stroke="#f5e27a" stroke-width="4" fill="none" filter="url(#mo6)"/>'
              '<path d="M300 230 L270 260 L290 262 L255 310" stroke="#fffbe0" stroke-width="2" fill="none"/>')
    else:  # sach công pháp
        b += ('<g transform="rotate(-8 200 200)"><rect x="120" y="90" width="170" height="220" rx="6" fill="#7a5a2a" stroke="#d4a944" stroke-width="3"/>'
              '<rect x="112" y="90" width="16" height="220" rx="4" fill="#4a3518"/>'
              '<path d="M112 120 h16 M112 170 h16 M112 230 h16 M112 280 h16" stroke="#d4a944" stroke-width="2"/>'
              '<rect x="186" y="110" width="66" height="180" fill="#f2e6c8" stroke="#3a2a10" stroke-width="2"/>'
              f'{chu_doc(219, 160, "长春功", 46, "#2a1d0a")}</g>'
              '<path d="M60 300 Q120 280 160 310" stroke="#9ff3d6" stroke-width="3" fill="none" opacity=".7"/>')
    b += f'<text x="200" y="372" font-family="{VIET}" font-weight="700" font-size="24" fill="#fff6dc" text-anchor="middle">{ten}</text>'
    b += khung_vang(W, H, 10)
    return svg(W, H, b, ("#18232e", "#0a0e13"), seed)


def ban_do():
    W, H = 1200, 800
    rnd = random.Random(7)

    def dao(cx, cy, r, seed, n=40, rough=.28):
        rr = random.Random(seed)
        ks = [r * (1 + rr.uniform(-rough, rough)) for _ in range(n)]
        for _ in range(3):
            ks = [(ks[i - 1] + ks[i] * 2 + ks[(i + 1) % n]) / 4 for i in range(n)]
        p = [(cx + k * math.cos(2 * math.pi * i / n) * 1.5, cy + k * math.sin(2 * math.pi * i / n)) for i, k in enumerate(ks)]
        return "M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in p) + "Z"

    b = f'<rect width="{W}" height="{H}" fill="#e8d9b0"/>'
    b += f'<rect width="{W}" height="{H}" fill="#7a5a2a" opacity=".12" filter="url(#giay)"/>'
    for i in range(30):  # sóng biển
        x, y = rnd.uniform(60, 1140), rnd.uniform(80, 740)
        b += f'<path d="M{x:.0f} {y:.0f} q8 -6 16 0 q8 -6 16 0" stroke="#6a8a9a" stroke-width="1.5" fill="none" opacity=".45"/>'
    dl = dao(560, 400, 230, 3)
    b += f'<path d="{dl}" fill="#d6c08a" stroke="#5a4320" stroke-width="3"/>'
    b += f'<path d="{dl}" fill="none" stroke="#5a4320" stroke-width="1" opacity=".4" transform="translate(560 400) scale(1.05) translate(-560 -400)"/>'
    b += f'<path d="{dao(960, 640, 50, 9)}" fill="#d6c08a" stroke="#5a4320" stroke-width="2"/>'
    b += f'<path d="{dao(200, 180, 40, 5)}" fill="#d6c08a" stroke="#5a4320" stroke-width="2"/>'
    # vùng Thiên Nam & Việt Quốc
    b += f'<path d="{dao(620, 500, 110, 13, rough=.2)}" fill="#c9a86a" opacity=".55" stroke="#8a2a20" stroke-width="2.5" stroke-dasharray="10 6"/>'
    b += f'<path d="{dao(560, 540, 38, 17, rough=.15)}" fill="#b8322c" opacity=".25" stroke="#8a2a20" stroke-width="2"/>'
    for i in range(26):  # núi
        x, y = rnd.uniform(400, 760), rnd.uniform(250, 420)
        b += f'<path d="M{x:.0f} {y:.0f} l12 -20 l12 20" fill="#a88a50" stroke="#5a4320" stroke-width="1.6"/>'
    b += '<path d="M470 300 C520 360 500 420 560 470 S640 560 700 600" stroke="#4a7a8a" stroke-width="3" fill="none"/>'
    b += thap(560, 548, .45, "#5a1e18", 2)
    lb = lambda x, y, t, s, w=700, m="#3a2a10": f'<text x="{x}" y="{y}" font-family="{VIET}" font-weight="{w}" font-size="{s}" fill="{m}" text-anchor="middle">{t}</text>'
    b += lb(600, 92, "BẢN ĐỒ NHÂN GIỚI", 44) + lb(600, 124, "人界", 22, 400)
    b += lb(560, 300, "Nhân Giới", 30) + lb(680, 470, "Thiên Nam", 26, 700, "#6a1e18") + lb(560, 600, "Việt Quốc", 20, 700, "#6a1e18")
    b += lb(980, 520, "Biển", 22, 400, "#3a5a6a") + lb(150, 560, "Biển", 22, 400, "#3a5a6a")
    # la bàn
    b += ('<g transform="translate(1060 150)"><circle r="56" fill="none" stroke="#5a4320" stroke-width="2"/><circle r="44" fill="none" stroke="#5a4320" stroke-width="1"/>'
          '<path d="M0 -60 L10 0 L0 60 L-10 0Z" fill="#5a4320"/><path d="M-60 0 L0 -10 L60 0 L0 10Z" fill="#8a6a3a"/>'
          f'<text y="-66" font-family="{HAN}" font-size="18" fill="#5a4320" text-anchor="middle">北</text></g>')
    b += an_trien(70, 660, "TCBĐ") + f'<rect x="20" y="20" width="{W - 40}" height="{H - 40}" fill="none" stroke="#5a4320" stroke-width="4"/>'
    b += f'<rect x="32" y="32" width="{W - 64}" height="{H - 64}" fill="none" stroke="#5a4320" stroke-width="1.5"/>'
    return svg(W, H, b, ("#e8d9b0", "#e8d9b0"), 7, giay=False)


def canh(so):
    W, H = 1200, 800
    if so == 1:  # Hoàng Phong Cốc lúc bình minh
        b = trang(860, 300, 70, "#ffe2a8", "#ffb35a")
        b += may(120, 160, 1.4, "#fff2d8", .4) + chim(300, 230, 1.3, "#5a3a20")
        b += lop_nui(W, H, [
            (peaks(W, H, 31, [(200, 330, 420), (640, 280, 420), (1050, 340, 400)]), "#b46a3a", .45),
            (ridge(W, H, 470, 90, 32), "#7a3e22", .75),
        ])
        b += may_mem(600, 520, 700, 70, "#ffe6c0", .35)
        b += f'<path d="{ridge(W, H, 600, 60, 33)}" fill="#2a160c"/>'
        for x in range(60, 1200, 95):
            b += phong(x, 640 + (x % 3) * 18, 1.1 + (x % 2) * .3, "#d4502a" if x % 2 else "#e8862e")
        b += thap(600, 590, 1.6, "#1a0e08", 3)
        nen = ("#f0a65a", "#3a1a0e")
    elif so == 2:  # Huyết Sắc Cấm Địa
        b = trang(300, 220, 80, "#ff8a7a", "#ff3a2a")
        b += lop_nui(W, H, [
            (peaks(W, H, 41, [(150, 300, 300), (500, 260, 320), (900, 300, 300), (1150, 280, 260)]), "#5a1010", .6),
            (ridge(W, H, 520, 120, 42, rough=.6), "#2a0606", .9),
        ])
        b += may_mem(600, 560, 700, 90, "#ff3a2a", .3)
        b += f'<path d="{ridge(W, H, 660, 40, 43)}" fill="#0e0303"/>'
        for x, s in [(140, 1.4), (980, 1.2), (1100, .9)]:  # cây khô
            b += (f'<g transform="translate({x} 690) scale({s})" stroke="#0e0303" stroke-width="7" fill="none" stroke-linecap="round">'
                  '<path d="M0 0 C-4 -60 6 -100 0 -160 M0 -80 C-30 -100 -40 -130 -70 -140 M2 -110 C30 -130 50 -150 60 -190 M-40 -128 L-50 -160"/></g>')
        b += nguoi("nam", 620, 700, .55, vien="#ff8a7a")
        nen = ("#7a1414", "#120404")
    else:  # Biển mây Thiên Nam
        b = trang(950, 180, 55)
        b += lop_nui(W, H, [
            (peaks(W, H, 51, [(160, 300, 260), (420, 360, 240), (760, 250, 300), (1080, 330, 260)]), "#2c5a7a", .7),
        ])
        for i in range(7):
            b += may_mem(100 + i * 170, 470 + (i % 2) * 30, 220, 70, "#e6f0f8", .7)
        b += may(100, 420, 1.6, "#ffffff", .7, 4) + may(820, 470, 1.3, "#ffffff", .6, 4)
        b += f'<path d="{peaks(W, H, 52, [(240, 520, 200), (980, 560, 220)])}" fill="#0e1e2c"/>'
        for i in range(4):
            b += may_mem(150 + i * 320, 690, 260, 60, "#dbe8f4", .8)
        b += thong(230, 548, 1.1, "#0e1e2c")
        b += kiem_bay(80, 360, 640, 300, "#9ff3d6") + nguoi("nam", 640, 300, .32, vien="#9ff3d6")
        nen = ("#5a9ac0", "#16324a")
    b += an_trien(W - 90, 40, "TCBĐ")
    return svg(W, H, b, nen, 60 + so)


ANH = {
    "bia-pham-nhan-tu-tien": bia,
    "han-lap": lambda: chan_dung("Hàn Lập", "韩立", "nam", ("#2d6a5a", "#173a32"), "#9ff3d6", 101, "韩立"),
    "nam-cung-uyen": lambda: chan_dung("Nam Cung Uyển", "南宫婉", "nu", ("#6a3b6c", "#341a3a"), "#f3b8e8", 202, "南宫"),
    "mac-dai-phu": lambda: chan_dung("Mặc Đại Phu", "墨大夫", "gia", ("#5a4630", "#2a1e12"), "#e8b070", 303, "墨"),
    "logo-hoang-phong-coc": lambda: logo("黄枫谷", la_phong(), ("#6b3a14", "#1e140a"), 401),
    "logo-yem-nguyet-tong": lambda: logo("掩月宗", trang_khuyet(), ("#2c2f66", "#11132a"), 402),
    "chuong-thien-binh": lambda: vat("binh", "#1fb08a", 501, "Bình nhỏ màu xanh"),
    "thanh-truc-phong-van-kiem": lambda: vat("kiem", "#4fbf6a", 502, "Thanh Trúc Phong Vân Kiếm"),
    "truong-xuan-cong": lambda: vat("sach", "#d4a944", 503, "Trường Xuân Công"),
    "ban-do-nhan-gioi": ban_do,
    "anh-truyen-1": lambda: canh(1),
    "anh-truyen-2": lambda: canh(2),
    "anh-truyen-3": lambda: canh(3),
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for ten, fn in ANH.items():
        with open(os.path.join(OUT, ten + ".svg"), "w", encoding="utf-8") as f:
            f.write(fn())
    print("Đã vẽ", len(ANH), "ảnh vào", OUT)
