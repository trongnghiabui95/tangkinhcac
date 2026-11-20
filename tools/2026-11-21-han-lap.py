# Dựng clip TikTok "Hàn Lập" – 1080x1920, 30fps, chữ chạy theo nhịp, nhạc tự tạo.
import math, random, subprocess, sys, wave, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
D = os.path.dirname(os.path.abspath(__file__))
F = lambda n, s: ImageFont.truetype(f"{D}/fonts/{n}.ttf", s)
SERIF, BOLD, SEMI = "noto-serif-700", "be-vietnam-pro-700", "be-vietnam-pro-600"
GOLD = (212, 169, 68); JADE = (63, 181, 155); RED = (192, 80, 77)
TEXT = (235, 227, 207); BG1 = (11, 18, 26); BG2 = (27, 39, 53); SURF = (17, 26, 36)
OUT = sys.argv[1] if len(sys.argv) > 1 else f"{D}/clip.mp4"

# ---------- Nền tự vẽ ----------
def make_bg():
    y = np.linspace(0, 1, H)[:, None]; x = np.linspace(0, 1, W)[None, :]
    g = np.zeros((H, W, 3), np.float32)
    for c in range(3):
        g[..., c] = BG1[c] + (BG2[c] - BG1[c]) * (0.55 * np.exp(-((x - .5) ** 2 + (y - .35) ** 2) / .08))
    im = Image.fromarray(g.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    # vầng trăng + vòng trận pháp
    cx, cy = W // 2, 560
    for r, a in [(330, 40), (360, 25), (420, 18)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GOLD + (a,), width=2)
    # núi xa
    rnd = random.Random(7)
    for layer, (col, base) in enumerate([((20, 31, 44), 1450), ((15, 24, 34), 1600)]):
        pts = [(0, H)]; xx = 0
        while xx <= W + 80:
            pts.append((xx, base - rnd.randint(40, 220))); xx += rnd.randint(90, 180)
        pts += [(W, H)]
        d.polygon(pts, fill=col)
    im = im.filter(ImageFilter.GaussianBlur(1.2))
    d = ImageDraw.Draw(im)
    # khung viền
    d.rectangle([28, 28, W - 28, H - 28], outline=(212, 169, 68), width=2)
    d.rectangle([40, 40, W - 40, H - 40], outline=(90, 74, 36), width=1)
    return im

BG = make_bg()
rnd = random.Random(3)
PARTS = [(rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(1.5, 4), rnd.uniform(20, 60), rnd.uniform(0, 6.28)) for _ in range(70)]

def ease(t): t = max(0, min(1, t)); return 1 - (1 - t) ** 3

def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def draw_lines(im, lines, y, font, color, alpha=1.0, dy=0, gap=1.25, stroke=0):
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for ln in lines:
        w = d.textlength(ln, font=font)
        d.text(((W - w) / 2, y + dy), ln, font=font, fill=color + (int(255 * alpha),),
               stroke_width=stroke, stroke_fill=(5, 8, 12, int(255 * alpha)))
        y += font.size * gap
    im.alpha_composite(lay); return y

def txt(im, text, y, font, color, t, start, maxw=900, gap=1.25, stroke=3):
    a = ease((t - start) / .45)
    d = ImageDraw.Draw(im); lines = wrap(d, text, font, maxw)
    if a <= 0: return y + len(lines) * font.size * gap
    return draw_lines(im, lines, y, font, color, a, (1 - a) * 40, gap, stroke)

def pill(im, text, cx, y, font, fg, bg, a):
    if a <= 0: return
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    w = d.textlength(text, font=font); pad = 34; h = font.size + 36
    d.rounded_rectangle([cx - w / 2 - pad, y, cx + w / 2 + pad, y + h], radius=h // 2, fill=bg + (int(235 * a),))
    d.text((cx - w / 2, y + 12), text, font=font, fill=fg + (int(255 * a),))
    im.alpha_composite(lay)

# ---------- Kịch bản (giây) ----------
SCENES = [(0, 4.2), (4.2, 9.2), (9.2, 15.2), (15.2, 20.2), (20.2, 22.4), (22.4, 31.4), (31.4, 35.4), (35.4, 41.0)]
TOTAL = SCENES[-1][1]
LADDER = ["Luyện Khí", "Trúc Cơ", "Kết Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Đại Thừa", "CHÂN TIÊN"]

def scene(im, i, t):
    s = t - SCENES[i][0]
    G = 40
    if i == 0:
        y = txt(im, "Bị cả làng gọi là", 520, F(BOLD, 64), TEXT, s, 0)
        y = txt(im, "“NHỊ LĂNG TỬ”", y + 10, F(SERIF, 112), GOLD, s, .4, maxw=1000)
        y = txt(im, "(thằng ngốc thứ hai)", y, F(SEMI, 50), (170, 165, 150), s, .8)
        y = txt(im, "…vậy mà thành", y + 80, F(BOLD, 72), TEXT, s, 1.8)
        txt(im, "TIÊN NHÂN?", y + 10, F(SERIF, 140), JADE, s, 2.3, maxw=1000)
    elif i == 1:
        pill(im, "HÀN LẬP · PHÀM NHÂN TU TIÊN", W / 2, 470, F(BOLD, 42), (27, 20, 5), GOLD, ease(s / .4))
        y = txt(im, "Linh căn:", 640, F(BOLD, 64), TEXT, s, .3)
        y = txt(im, "NGỤY LINH CĂN", y + 10, F(SERIF, 112), RED, s, .7, maxw=1000)
        y = txt(im, "4 thuộc tính: hỏa, mộc, thủy, thổ", y + 10, F(SEMI, 54), TEXT, s, 1.3)
        txt(im, "Loại tư chất các tông môn lớn gần như không thèm nhận.", y + 70, F(BOLD, 60), GOLD, s, 2.2)
    elif i == 2:
        y = txt(im, "Không phải thiên tài.", 470, F(SERIF, 84), TEXT, s, 0, maxw=1000)
        y = txt(im, "Thứ đưa cậu đi xa:", y + G, F(BOLD, 60), (170, 165, 150), s, .7)
        for k, (lab, col) in enumerate([("1. Thận trọng tới mức đa nghi", JADE),
                                         ("2. Đầu óc tính toán", JADE),
                                         ("3. Chiếc bình nhỏ màu xanh", GOLD)]):
            y = txt(im, lab, y + 50, F(BOLD, 64), col, s, 1.3 + k * 1.0, maxw=980)
        txt(im, "(chính là Chưởng Thiên Bình)", y + 30, F(SEMI, 50), (170, 165, 150), s, 4.2)
    elif i == 3:
        y = txt(im, "Người thầy đầu tiên", 540, F(BOLD, 70), TEXT, s, 0)
        y = txt(im, "Mặc Đại Phu", y + 10, F(SERIF, 110), GOLD, s, .4)
        y = txt(im, "muốn ĐOẠT XÁ", y + 60, F(SERIF, 100), RED, s, 1.4, maxw=1000)
        y = txt(im, "chính thân thể của cậu.", y + 10, F(BOLD, 66), TEXT, s, 2.0)
        txt(im, "Từ đó, Hàn Lập không tin ai.", y + 80, F(BOLD, 60), JADE, s, 3.0)
    elif i == 4:
        a = ease(s / .3)
        pill(im, "SPOILER", W / 2, 760, F(BOLD, 110), (255, 240, 235), RED, a)
        txt(im, "Đoạn sau nói kết cục của Hàn Lập", 1000, F(SEMI, 52), TEXT, s, .4)
    elif i == 5:
        txt(im, "Hành trình cảnh giới", 300, F(SERIF, 82), GOLD, s, 0)
        top, step = 470, 132
        for k, name in enumerate(LADDER):
            st = .5 + k * .8; a = ease((s - st) / .35)
            if a <= 0: continue
            y = top + (len(LADDER) - 1 - k) * step
            last = k == len(LADDER) - 1
            lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
            col = JADE if last else GOLD
            w0 = 560 if last else 440
            d.rounded_rectangle([W / 2 - w0 / 2, y, W / 2 + w0 / 2, y + 108], radius=22,
                                fill=(col if last else SURF) + (int(240 * a),), outline=col + (int(255 * a),), width=3)
            f = F(SERIF if last else BOLD, 64 if last else 54)
            tw = d.textlength(name, font=f)
            d.text((W / 2 - tw / 2, y + (16 if last else 22)), name, font=f,
                   fill=((4, 20, 15) if last else TEXT) + (int(255 * a),))
            im.alpha_composite(lay)
        txt(im, "Cuối truyện: vượt tiên kiếp", 1700, F(BOLD, 54), TEXT, s, 7.7)
    elif i == 6:
        y = txt(im, "Triết lý chiến đấu:", 520, F(BOLD, 64), (170, 165, 150), s, 0)
        y = txt(im, "Đánh được thì diệt gọn.", y + 50, F(SERIF, 84), GOLD, s, .5, maxw=960)
        y = txt(im, "Không đánh được thì…", y + 60, F(SERIF, 80), TEXT, s, 1.6, maxw=960)
        txt(im, "CHẠY THẬT XA!", y + 30, F(SERIF, 120), JADE, s, 2.4, maxw=1000)
    elif i == 7:
        y = txt(im, "Tiểu sử, đạo lữ, pháp bảo của Hàn Lập", 500, F(BOLD, 62), TEXT, s, 0)
        y = txt(im, "Đọc đủ tại", y + 90, F(BOLD, 60), (170, 165, 150), s, .6)
        pill(im, "tuchanbaodien.com", W / 2, y + 10, F(BOLD, 76), (27, 20, 5), GOLD, ease((s - 1.0) / .4))
        y = txt(im, "Bạn thích Hàn Lập ở giai đoạn nào nhất?", y + 220, F(SERIF, 70), JADE, s, 1.8)
        txt(im, "Bình luận cho mình biết nhé!", y + 50, F(BOLD, 56), TEXT, s, 2.6)

def frame(n):
    t = n / FPS
    im = BG.copy().convert("RGBA")
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for (x, y, r, sp, ph) in PARTS:
        yy = (y - t * sp) % H; xx = x + 14 * math.sin(t * .8 + ph)
        a = int(110 + 90 * math.sin(t * 2 + ph))
        d.ellipse([xx - r, yy - r, xx + r, yy + r], fill=GOLD + (max(0, a),))
    im.alpha_composite(lay)
    # thương hiệu nhỏ
    d = ImageDraw.Draw(im); f = F(SEMI, 36); lab = "TU CHÂN BẢO ĐIỂN"
    d.text(((W - d.textlength(lab, font=f)) / 2, 120), lab, font=f, fill=GOLD + (200,))
    for i, (a, b) in enumerate(SCENES):
        if a <= t < b:
            scene(im, i, t)
            # chuyển cảnh: mờ dần 0,25s cuối
            fo = (b - t) / .25
            if fo < 1 and i < len(SCENES) - 1:
                im = Image.blend(BG.convert("RGBA"), im, max(0, fo))
    # thanh tiến độ
    d = ImageDraw.Draw(im)
    d.rectangle([60, H - 90, 60 + (W - 120) * t / TOTAL, H - 82], fill=GOLD)
    return im.convert("RGB")

# ---------- Nhạc tự tạo ----------
def music(path):
    sr = 44100; n = int(TOTAL * sr); tt = np.arange(n) / sr
    out = np.zeros(n)
    # drone thấp
    for f0, a in [(55, .18), (82.4, .10), (110, .06)]:
        out += a * np.sin(2 * np.pi * f0 * tt) * (0.7 + 0.3 * np.sin(2 * np.pi * .1 * tt))
    # pad ngũ cung
    chords = [[220, 261.6, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [196, 246.9, 329.6]]
    for k in range(int(TOTAL / 4) + 1):
        seg = (tt >= k * 4) & (tt < k * 4 + 4.5)
        env = np.clip(np.minimum((tt - k * 4) / 1.2, (k * 4 + 4.5 - tt) / 1.2), 0, 1)
        for f0 in chords[k % 4]:
            out += seg * env * .045 * (np.sin(2 * np.pi * f0 * tt) + .3 * np.sin(2 * np.pi * 2 * f0 * tt))
    # tiếng gảy (đàn tranh giả) theo thang ngũ cung
    scale = [440, 493.9, 587.3, 659.3, 784, 880]
    r = random.Random(11); beat = .5
    for k in range(int(TOTAL / beat)):
        if r.random() < .55:
            st = k * beat; f0 = r.choice(scale); L = int(1.6 * sr); i0 = int(st * sr)
            if i0 + L > n: L = n - i0
            ts = np.arange(L) / sr
            note = np.exp(-ts * 3.5) * (np.sin(2 * np.pi * f0 * ts) + .4 * np.sin(2 * np.pi * 2 * f0 * ts) + .15 * np.sin(2 * np.pi * 3 * f0 * ts))
            out[i0:i0 + L] += .10 * note
    # trống nhẹ ở cảnh SPOILER và đỉnh thang
    for st in [SCENES[4][0], SCENES[5][0] + .5 + 8 * .8]:
        i0 = int(st * sr); L = int(.8 * sr); ts = np.arange(L) / sr
        out[i0:i0 + L] += .5 * np.exp(-ts * 6) * np.sin(2 * np.pi * (60 + 40 * np.exp(-ts * 20)) * ts)
    fade = np.clip(np.minimum(tt / 1.0, (TOTAL - tt) / 2.0), 0, 1)
    out = out * fade; out = out / np.max(np.abs(out)) * .6
    st = np.stack([out, np.roll(out, 300)], 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

if __name__ == "__main__":
    if os.environ.get("KHUNG"):
        for s in os.environ["KHUNG"].split(","):
            frame(int(float(s) * FPS)).save(f"{D}/khung_{s}.png")
        sys.exit()
    wav = f"{D}/nhac.wav"; music(wav)
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                          "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                          "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", OUT],
                         stdin=subprocess.PIPE)
    for n in range(int(TOTAL * FPS)):
        p.stdin.write(frame(n).tobytes())
    p.stdin.close(); p.wait(); print("xong", OUT)
