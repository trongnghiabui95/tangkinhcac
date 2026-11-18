# -*- coding: utf-8 -*-
"""Đọc toàn bộ data/mau/*.csv: báo lỗi nếu file không đọc được, thiếu tab, dòng lệch số cột hoặc trùng tên cột.
Chạy: python3 tools/kiem-tra/doc_csv.py"""
import csv, glob, os, sys

GOC = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TABS = ["TacPham", "AnhTruyen", "NhanVat", "CuocDoi", "QuanHe", "TheLuc", "LoaiTuLuyen", "CapDo",
        "VatPham", "DiaDiem", "HanhTrinh", "ThuatNgu", "DeCu", "CaiDat"]
loi = []
for t in TABS:
    if not os.path.exists(os.path.join(GOC, "data", "mau", t + ".csv")):
        loi.append(f"Thiếu file data/mau/{t}.csv")
for f in sorted(glob.glob(os.path.join(GOC, "data", "mau", "*.csv"))):
    ten = os.path.relpath(f, GOC)
    try:
        with open(f, encoding="utf-8", newline="") as fh:
            rows = list(csv.reader(fh))
    except Exception as e:  # noqa
        loi.append(f"{ten}: không đọc được ({e})"); continue
    if not rows:
        loi.append(f"{ten}: file trống"); continue
    head = [h.strip() for h in rows[0]]
    if len(set(head)) != len(head) or "" in head:
        loi.append(f"{ten}: tên cột trống hoặc bị trùng: {head}")
    for i, r in enumerate(rows[1:], start=2):
        if len(r) != len(head):
            loi.append(f"{ten} dòng {i}: có {len(r)} ô, cần {len(head)}")
    print(f"{'LỖI' if any(l.startswith(ten) for l in loi) else 'OK '}  {ten} ({len(rows) - 1} dòng)")
print("errors:", loi)
sys.exit(1 if loi else 0)
