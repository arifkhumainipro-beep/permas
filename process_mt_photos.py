#!/usr/bin/env python3
"""
Standardize PERMAS Majlis Tertinggi portrait photos into uniform
800x1000 (4:5) executive studio portraits with matched framing,
clean background removal, royal slate studio backdrop, and balanced lighting.
"""

import glob
import os
import cv2
import numpy as np
from PIL import Image, ImageOps

OUT_W = 800
OUT_H = 1000
TARGET_FACE_W = 220.0
TARGET_FACE_CX = 400.0
TARGET_FACE_CY = 305.0

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(ROOT_DIR, 'assets', 'ahli', 'raw')
OUT_DIR = os.path.join(ROOT_DIR, 'assets', 'ahli')


def load_upright_bgr(path: str) -> np.ndarray:
    pil_im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    bgr = cv2.cvtColor(np.array(pil_im), cv2.COLOR_RGB2BGR)
    # Trim thin black screenshot/letterbox bars at top or bottom so suit edge is clean
    row_means = bgr.mean(axis=(1, 2))
    non_black = np.where(row_means >= 6.0)[0]
    if len(non_black) > 60:
        top_trim = int(non_black[0])
        bot_trim = int(bgr.shape[0] - 1 - non_black[-1])
        y1 = top_trim if top_trim <= 24 else 0
        y2 = bgr.shape[0] - bot_trim if bot_trim <= 24 else bgr.shape[0]
        if y1 > 0 or y2 < bgr.shape[0]:
            bgr = bgr[y1:y2]
    return bgr


def detect_primary_face(bgr: np.ndarray):
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
    detector = cv2.CascadeClassifier(cascade_path)
    h, w = gray.shape[:2]
    min_dim = max(40, int(min(h, w) * 0.09))

    # Avoid equalizeHist first because it amplifies faint white-wall blotches
    faces = detector.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=4, minSize=(min_dim, min_dim))
    if len(faces) == 0:
        clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
        faces = detector.detectMultiScale(clahe.apply(gray), scaleFactor=1.06, minNeighbors=5, minSize=(min_dim, min_dim))

    if len(faces) == 0:
        fw = w * 0.24
        return (w * 0.5, h * 0.28, fw, fw * 1.1)

    best_score = -1.0
    best_box = None
    for (fx, fy, fw, fh) in faces:
        fcx = fx + fw * 0.5
        fcy = fy + fh * 0.5
        # Prefer horizontally centered, upper-half, larger boxes with real skin saturation (not plain white wall)
        center_penalty = 1.0 - min(0.85, abs(fcx / w - 0.5) * 2.2)
        upper_bonus = 1.25 if fcy < h * 0.52 else 0.7
        roi_s = float(hsv[fy:fy + fh, fx:fx + fw, 1].mean())
        sat_factor = 1.0 if roi_s > 35.0 else 0.25
        score = (fw * fh) * center_penalty * upper_bonus * sat_factor
        if score > best_score:
            best_score = score
            best_box = (fcx, fcy, float(fw), float(fh))

    return best_box


def align_portrait_canvas(bgr: np.ndarray, face_box):
    cx, cy, fw, fh = face_box
    scale = TARGET_FACE_W / max(fw, 40.0)
    new_w = int(round(bgr.shape[1] * scale))
    new_h = int(round(bgr.shape[0] * scale))
    interp = cv2.INTER_AREA if scale < 1.0 else cv2.INTER_LANCZOS4
    resized = cv2.resize(bgr, (new_w, new_h), interpolation=interp)

    scaled_cx = cx * scale
    scaled_cy = cy * scale
    scaled_fw = fw * scale
    scaled_fh = fh * scale

    x0 = int(round(scaled_cx - TARGET_FACE_CX))
    y0 = int(round(scaled_cy - TARGET_FACE_CY))

    canvas = np.zeros((OUT_H, OUT_W, 3), dtype=np.uint8)
    valid_mask = np.zeros((OUT_H, OUT_W), dtype=bool)

    src_x1 = max(0, x0)
    src_y1 = max(0, y0)
    src_x2 = min(new_w, x0 + OUT_W)
    src_y2 = min(new_h, y0 + OUT_H)

    dst_x1 = src_x1 - x0
    dst_y1 = src_y1 - y0
    dst_x2 = dst_x1 + (src_x2 - src_x1)
    dst_y2 = dst_y1 + (src_y2 - src_y1)

    canvas[dst_y1:dst_y2, dst_x1:dst_x2] = resized[src_y1:src_y2, src_x1:src_x2]
    valid_mask[dst_y1:dst_y2, dst_x1:dst_x2] = True

    # Extend edge border color purely so blur/grabCut never reads pure zero black at padding seam
    if dst_y1 > 0:
        canvas[:dst_y1, dst_x1:dst_x2] = canvas[dst_y1:dst_y1 + 1, dst_x1:dst_x2]
    if dst_y2 < OUT_H:
        canvas[dst_y2:, dst_x1:dst_x2] = canvas[dst_y2 - 1:dst_y2, dst_x1:dst_x2]
    if dst_x1 > 0:
        canvas[:, :dst_x1] = canvas[:, dst_x1:dst_x1 + 1]
    if dst_x2 < OUT_W:
        canvas[:, dst_x2:] = canvas[:, dst_x2 - 1:dst_x2]

    adj_cx = scaled_cx - x0
    adj_cy = scaled_cy - y0
    return canvas, valid_mask, (adj_cx, adj_cy, scaled_fw, scaled_fh)


def make_studio_backdrop() -> np.ndarray:
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
    dx = (xx - 400.0) / 360.0
    dy = (yy - 360.0) / 480.0
    dist = np.sqrt(dx * dx + dy * dy)
    glow = np.clip(1.0 - dist, 0.0, 1.0) ** 1.65

    # Studio slate key behind shoulders (#2C3B52) -> obsidian vignette (#0B1120)
    b = 26.0 + glow * (88.0 - 26.0)
    g = 17.0 + glow * (64.0 - 17.0)
    r = 12.0 + glow * (49.0 - 12.0)

    warm = np.exp(-(((xx - 400.0) / 260.0) ** 2 + ((yy - 410.0) / 220.0) ** 2))
    r = np.clip(r + warm * 10.0, 0, 255)
    g = np.clip(g + warm * 6.0, 0, 255)
    b = np.clip(b + warm * 4.0, 0, 255)

    return np.stack([b, g, r], axis=-1).astype(np.uint8)


def keep_main_component(mask_bool: np.ndarray, cx: float, cy: float, bgr: np.ndarray = None, fw: float = 220.0) -> np.ndarray:
    u8 = mask_bool.astype(np.uint8)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(u8, connectivity=8)
    if num_labels <= 1:
        return mask_bool
    ix = int(np.clip(round(cx), 0, OUT_W - 1))
    iy = int(np.clip(round(cy), 0, OUT_H - 1))
    target_label = labels[iy, ix]
    if target_label == 0:
        areas = stats[1:, cv2.CC_STAT_AREA]
        target_label = 1 + int(np.argmax(areas))
    main_mask = labels == target_label

    # Estimate outer background LAB tone to avoid refilling background triangles trapped inside bent elbows
    bg_lab_ref = None
    lab_img = None
    if bgr is not None:
        lab_img = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
        samples = np.concatenate([
            lab_img[5:25, 10:80].reshape(-1, 3),
            lab_img[5:25, -80:-10].reshape(-1, 3),
            lab_img[350:550, 5:25].reshape(-1, 3),
            lab_img[350:550, -25:-5].reshape(-1, 3),
        ], axis=0)
        bg_lab_ref = np.median(samples, axis=0)

    inv = (~main_mask).astype(np.uint8)
    n2, l2, s2, _ = cv2.connectedComponentsWithStats(inv, connectivity=8)
    filled = main_mask.copy()
    hsv_img = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV) if bgr is not None else None
    for lbl in range(1, n2):
        area = s2[lbl, cv2.CC_STAT_AREA]
        x, y, bw, bh, _ = s2[lbl]
        touches_edge = (x == 0 or y == 0 or (x + bw) >= OUT_W or (y + bh) >= OUT_H)
        if not touches_edge and area < 45000:
            hole_mask = (l2 == lbl)
            hole_cx = x + bw * 0.5
            hole_cy = y + bh * 0.5
            # Skip refilling enclosed elbow/armpit background pockets
            if hsv_img is not None and abs(hole_cx - cx) > fw * 0.48:
                mean_v = float(np.median(hsv_img[:, :, 2][hole_mask]))
                max_hole_y = OUT_H if (abs(hole_cx - cx) > fw * 0.54 and mean_v > 110.0) else (cy + fw * 2.45)
                if hole_cy < max_hole_y and mean_v >= 55.0:
                    continue
            if bg_lab_ref is not None and abs(hole_cx - cx) > fw * 0.45 and hole_cy < cy + fw * 2.45:
                hole_lab = np.median(lab_img[hole_mask], axis=0)
                if float(np.linalg.norm(hole_lab - bg_lab_ref)) < 30.0:
                    continue
            filled[hole_mask] = True
    return filled


def refine_alpha_edges(bin_mask: np.ndarray, blur_ksize: int = 5) -> np.ndarray:
    u8 = (bin_mask.astype(np.uint8)) * 255
    k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    u8 = cv2.morphologyEx(u8, cv2.MORPH_CLOSE, k3, iterations=1)
    u8 = cv2.morphologyEx(u8, cv2.MORPH_OPEN, k3, iterations=1)
    eroded = cv2.erode(u8, k3, iterations=1)
    alpha = cv2.GaussianBlur(eroded.astype(np.float32) / 255.0, (blur_ksize, blur_ksize), 0)
    return np.clip(alpha, 0.0, 1.0)


def segment_green_screen(bgr: np.ndarray, valid_mask: np.ndarray, face_box):
    cx, cy, fw, fh = face_box
    f = bgr.astype(np.float32)
    b, g, r = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h_ch, s_ch, v_ch = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    green_excess = g - np.maximum(r, b)
    is_green_hue = (h_ch >= 32) & (h_ch <= 92) & (s_ch >= 22) & (v_ch >= 28)

    # Smooth matte solely from green-screen excess (no unconditional green oval over ears/background)
    alpha_green = 1.0 - np.clip((green_excess - 2.0) / 14.0, 0.0, 1.0)
    alpha = np.where(is_green_hue | (green_excess > 6.0), alpha_green, 1.0)

    # Protect core skin, glasses eyes, hair & suit interior ONLY when pixel is non-green
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    inner_face = (((xx - cx) / (fw * 0.36)) ** 2 + ((yy - cy) / (fh * 0.48)) ** 2) <= 1.0
    torso_inner = (np.abs(xx - cx) < fw * 1.15) & (yy > cy + fh * 0.65) & (green_excess < 7.0)
    alpha = np.where((inner_face & (~is_green_hue)) | torso_inner, np.maximum(alpha, 0.96), alpha)
    alpha = np.where(valid_mask, alpha, 0.0)

    # Connected component keeps subject cleanly and removes any isolated green curtain specks
    main_bool = keep_main_component(alpha > 0.38, cx, cy)
    alpha = np.where(main_bool, alpha, 0.0)
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (3, 3), 0)

    # Suppress green spill around hair, ears, glass frames, and suit lapel without yellowing face
    avg_rb = 0.52 * r + 0.48 * b
    spill = np.maximum(0.0, g - avg_rb)
    edge_factor = np.clip(1.35 - alpha, 0.0, 1.0)
    spill_strength = np.where(inner_face, 0.72, np.maximum(0.84, edge_factor))
    clean_g = np.where(
        is_green_hue | (spill > 3.0),
        g - spill * spill_strength,
        g,
    )
    cleaned_bgr = np.stack([b, np.clip(clean_g, 0, 255), r], axis=-1).astype(np.uint8)
    return cleaned_bgr, alpha


def outpaint_tight_suit(bgr: np.ndarray, alpha: np.ndarray, valid_mask: np.ndarray, face_box):
    """Extend a tight passport crop's suit/blazer smoothly across shoulders and lower torso."""
    ys_v = np.where(valid_mask.any(axis=1))[0]
    xs_v = np.where(valid_mask.any(axis=0))[0]
    if len(ys_v) == 0 or len(xs_v) == 0:
        return bgr, alpha
    dst_x1, dst_x2 = int(xs_v[0]), int(xs_v[-1]) + 1
    dst_y1, dst_y2 = int(ys_v[0]), int(ys_v[-1]) + 1
    if dst_x1 <= 0 and dst_x2 >= OUT_W and dst_y2 >= OUT_H:
        return bgr, alpha

    cx, cy, fw, fh = face_box
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
    fg_mask = alpha > 0.45

    def _shoulder_y(col: int, fallback: float) -> float:
        col_c = int(np.clip(col, dst_x1, dst_x2 - 1))
        hits = np.where(fg_mask[:, col_c] & (np.arange(OUT_H) > cy + fh * 0.25))[0]
        return float(hits[0]) if len(hits) > 0 else fallback

    y_sh_l = _shoulder_y(dst_x1 + 3, cy + fh * 0.84)
    y_sh_in_l = _shoulder_y(dst_x1 + 42, y_sh_l - 12.0)
    slope_l = float(np.clip((y_sh_l - y_sh_in_l) / 39.0, 0.22, 0.55))

    y_sh_r = _shoulder_y(dst_x2 - 4, cy + fh * 0.88)
    y_sh_in_r = _shoulder_y(dst_x2 - 43, y_sh_r - 12.0)
    slope_r = float(np.clip((y_sh_r - y_sh_in_r) / 39.0, 0.22, 0.55))

    target_x_l = max(86.0, cx - fw * 1.28)
    target_x_r = min(float(OUT_W - 86), cx + fw * 1.28)
    span_l = max(12.0, float(dst_x1) - target_x_l)
    span_r = max(12.0, target_x_r - float(dst_x2 - 1))

    out_bgr = bgr.astype(np.float32).copy()
    out_alpha = alpha.copy()

    # 1. Horizontal shoulder cap & sleeve extension (within valid vertical band)
    y_end_v = min(OUT_H, dst_y2)
    if dst_x1 > int(target_x_l):
        xs_ext = np.arange(0, dst_x1, dtype=np.float32)
        t_l = np.clip((float(dst_x1) - xs_ext) / span_l, 0.0, 1.0)
        y_top_l = y_sh_l + (slope_l * span_l) * t_l + (88.0 - slope_l * span_l) * (t_l ** 3.2)
        # Subtle outward arm expansion down to waist (mirroring executive silhouette)
        x_lim_l = np.where(
            yy < y_sh_l + 88.0,
            target_x_l,
            target_x_l - 16.0 * np.clip((yy - (y_sh_l + 88.0)) / 400.0, 0.0, 1.0),
        )
        for x in range(int(target_x_l) - 18, dst_x1):
            if x < 0:
                continue
            t = max(0.0, (float(dst_x1) - x) / span_l)
            y_t = y_sh_l + (slope_l * span_l) * min(t, 1.0) + max(18.0, 88.0 - slope_l * span_l) * (min(t, 1.0) ** 3.2)
            src_x = int(np.clip(dst_x1 + 3 + (dst_x1 - x), dst_x1 + 2, int(cx - fw * 0.52)))
            src_hits = np.where(fg_mask[:, src_x] & (np.arange(OUT_H) > cy + fh * 0.25))[0]
            src_y0 = int(src_hits[0]) + 4 if len(src_hits) > 0 else int(y_sh_l) + 4
            shade = max(0.76, 1.0 - 0.14 * (min(t, 1.2) ** 1.3))
            ys_col = np.arange(int(round(y_t)), y_end_v)
            if len(ys_col) > 0:
                src_ys = np.clip(ys_col, src_y0, y_end_v - 4)
                out_bgr[ys_col, x] = out_bgr[src_ys, src_x] * shade
                inside = (float(x) >= x_lim_l[ys_col, x]) & (t <= 1.05)
                out_alpha[ys_col, x] = np.where(inside, 1.0, 0.0)

    if dst_x2 < int(target_x_r):
        x_lim_r = np.where(
            yy < y_sh_r + 88.0,
            target_x_r,
            target_x_r + 14.0 * np.clip((yy - (y_sh_r + 88.0)) / 400.0, 0.0, 1.0),
        )
        for x in range(dst_x2, min(OUT_W, int(target_x_r) + 18)):
            t = max(0.0, (x - float(dst_x2 - 1)) / span_r)
            y_t = y_sh_r + (slope_r * span_r) * min(t, 1.0) + max(18.0, 88.0 - slope_r * span_r) * (min(t, 1.0) ** 3.2)
            src_x = int(np.clip((dst_x2 - 4) - (x - (dst_x2 - 1)), int(cx + fw * 0.52), dst_x2 - 3))
            src_hits = np.where(fg_mask[:, src_x] & (np.arange(OUT_H) > cy + fh * 0.25))[0]
            src_y0 = int(src_hits[0]) + 4 if len(src_hits) > 0 else int(y_sh_r) + 4
            shade = max(0.76, 1.0 - 0.14 * (min(t, 1.2) ** 1.3))
            ys_col = np.arange(int(round(y_t)), y_end_v)
            if len(ys_col) > 0:
                src_ys = np.clip(ys_col, src_y0, y_end_v - 4)
                out_bgr[ys_col, x] = out_bgr[src_ys, src_x] * shade
                inside = (float(x) <= x_lim_r[ys_col, x]) & (t <= 1.05)
                out_alpha[ys_col, x] = np.where(inside, 1.0, 0.0)

    # Smooth any tiny seam along dst_x1 / dst_x2 inside the suit
    if dst_x1 > 0:
        seam_y = np.arange(int(y_sh_l) + 6, y_end_v)
        if len(seam_y) > 0:
            blend_patch = cv2.GaussianBlur(out_bgr[:, max(0, dst_x1 - 5):min(OUT_W, dst_x1 + 6)], (7, 3), 0)
            out_bgr[seam_y, max(0, dst_x1 - 3):min(OUT_W, dst_x1 + 4)] = blend_patch[seam_y, 2:9]
    if dst_x2 < OUT_W:
        seam_y = np.arange(int(y_sh_r) + 6, y_end_v)
        if len(seam_y) > 0:
            blend_patch = cv2.GaussianBlur(out_bgr[:, max(0, dst_x2 - 6):min(OUT_W, dst_x2 + 5)], (7, 3), 0)
            out_bgr[seam_y, max(0, dst_x2 - 4):min(OUT_W, dst_x2 + 3)] = blend_patch[seam_y, 2:9]

    # 2. Vertical lower-torso blazer extension down to OUT_H (y = dst_y2 .. 999)
    if dst_y2 < OUT_H:
        anchor_y = dst_y2 - 7  # avoid any bottom-edge JPEG darkening right at dst_y2 - 1
        # Detect lowest bright shirt/tie pixel near center so we never reflect the tie
        hsv_now = cv2.cvtColor(np.clip(out_bgr, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
        cx_i = int(round(cx))
        center_bright = np.where((hsv_now[:anchor_y, max(0, cx_i - 42):min(OUT_W, cx_i + 42), 2].max(axis=1) > 78) & (np.arange(anchor_y) > cy + fh * 0.5))[0]
        tie_end = int(center_bright[-1]) + 4 if len(center_bright) > 0 else int(cy + fh * 1.65)
        center_span = max(14, anchor_y - tie_end)
        side_span = max(36, min(92, anchor_y - int(max(y_sh_l, y_sh_r) + 45)))

        x_lim_l_bot = target_x_l - 16.0 * np.clip((yy - (y_sh_l + 88.0)) / 400.0, 0.0, 1.0)
        x_lim_r_bot = target_x_r + 14.0 * np.clip((yy - (y_sh_r + 88.0)) / 400.0, 0.0, 1.0)

        for y in range(anchor_y, OUT_H):
            dy = y - anchor_y
            # Gentle vertical darkening toward waist bottom
            v_shade = 1.0 - 0.10 * np.clip(dy / max(1.0, float(OUT_H - anchor_y)), 0.0, 1.0)

            # Triangle wave bounce over [anchor_y - side_span .. anchor_y] keeps pinstripes unbroken
            p_side = dy % (2 * side_span)
            src_y_side = anchor_y - p_side if p_side <= side_span else (anchor_y - 2 * side_span + p_side)
            src_y_side = int(np.clip(src_y_side, 0, anchor_y))

            p_ctr = dy % (2 * center_span)
            src_y_ctr = anchor_y - p_ctr if p_ctr <= center_span else (anchor_y - 2 * center_span + p_ctr)
            src_y_ctr = int(np.clip(src_y_ctr, 0, anchor_y))

            is_center = np.abs(xx[y] - cx) < 46.0
            row_vals = np.where(is_center[:, None], out_bgr[src_y_ctr], out_bgr[src_y_side]) * v_shade
            out_bgr[y] = row_vals

            inside_row = (xx[y] >= x_lim_l_bot[y]) & (xx[y] <= x_lim_r_bot[y])
            out_alpha[y] = np.where(inside_row, 1.0, 0.0)

        # Feather transition rows right at anchor_y
        seam_band = cv2.GaussianBlur(out_bgr[anchor_y - 5:anchor_y + 6], (3, 7), 0)
        out_bgr[anchor_y - 3:anchor_y + 4] = seam_band[2:9]

    # Feather the outpainted outer arm/shoulder contour slightly so matte blends naturally on backdrop
    ext_region = (~valid_mask)
    soft_alpha = cv2.GaussianBlur(out_alpha.astype(np.float32), (5, 5), 0)
    out_alpha = np.where(ext_region, soft_alpha, out_alpha)
    return np.clip(out_bgr, 0, 255).astype(np.uint8), np.clip(out_alpha, 0.0, 1.0)


def segment_blue_screen(bgr: np.ndarray, valid_mask: np.ndarray, face_box):
    cx, cy, fw, fh = face_box
    f = bgr.astype(np.float32)
    b, g, r = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h_ch, s_ch, v_ch = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    blue_excess = b - np.maximum(r, g)
    is_blue_hue = (h_ch >= 96) & (h_ch <= 134) & (s_ch >= 65) & (v_ch >= 45)
    is_blue_bg = is_blue_hue & (blue_excess > 30.0)

    alpha_blue = 1.0 - np.clip((blue_excess - 32.0) / 28.0, 0.0, 1.0)
    alpha = np.where(is_blue_bg | (blue_excess > 34.0), alpha_blue, 1.0)

    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    inner_face = (((xx - cx) / (fw * 0.36)) ** 2 + ((yy - cy) / (fh * 0.48)) ** 2) <= 1.0
    torso_inner = (np.abs(xx - cx) < fw * 1.15) & (yy > cy + fh * 0.65) & (blue_excess < 35.0)
    alpha = np.where((inner_face & (~is_blue_hue)) | torso_inner, np.maximum(alpha, 0.96), alpha)
    alpha = np.where(valid_mask, alpha, 0.0)

    main_bool = keep_main_component(alpha > 0.38, cx, cy)
    alpha = np.where(main_bool, alpha, 0.0)
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (3, 3), 0)

    # Suppress blue spill along hair, ears, collar, and shoulder boundaries
    avg_rg = 0.52 * r + 0.48 * g
    spill = np.maximum(0.0, b - avg_rg)
    edge_factor = np.clip(1.35 - alpha, 0.0, 1.0)
    spill_strength = np.where(inner_face, 0.55, np.maximum(0.82, edge_factor))
    clean_b = np.where(
        is_blue_bg | (spill > 12.0),
        b - spill * spill_strength,
        b,
    )
    cleaned_bgr = np.stack([np.clip(clean_b, 0, 255), g, r], axis=-1).astype(np.uint8)
    cleaned_bgr, alpha = outpaint_tight_suit(cleaned_bgr, alpha, valid_mask, face_box)
    return cleaned_bgr, alpha


def build_border_flood_bg(bgr: np.ndarray, valid_mask: np.ndarray, thresh: float = 13.0) -> np.ndarray:
    h, w = bgr.shape[:2]
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)

    seed_pts = []
    for x in range(10, w - 10, 32):
        seed_pts.append((x, 4))
    for y in range(20, int(h * 0.88), 32):
        seed_pts.append((4, y))
        seed_pts.append((w - 5, y))

    ff_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
    work = bgr.copy()
    lo_up = (int(thresh), int(thresh), int(thresh))
    flags = 8 | (255 << 8) | cv2.FLOODFILL_FIXED_RANGE | cv2.FLOODFILL_MASK_ONLY

    for sx, sy in seed_pts:
        if ff_mask[sy + 1, sx + 1] == 0:
            pix = lab[sy, sx]
            if pix[0] > 35:
                cv2.floodFill(work, ff_mask, (sx, sy), 0, lo_up, lo_up, flags)

    return (ff_mask[1:-1, 1:-1] > 0) | (~valid_mask)


def grabcut_with_priors(bgr: np.ndarray, valid_mask: np.ndarray, face_box, border_bg: np.ndarray = None, is_outdoor: bool = False, is_white_wall: bool = False, tight_sides: bool = False):
    cx, cy, fw, fh = face_box
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    L_ch, _, _ = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]
    h_ch, s_ch, v_ch = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    b_ch, g_ch, r_ch = bgr[:, :, 0].astype(np.int16), bgr[:, :, 1].astype(np.int16), bgr[:, :, 2].astype(np.int16)

    gc_mask = np.full((OUT_H, OUT_W), cv2.GC_PR_BGD, dtype=np.uint8)

    head_top = cy - fh * 1.02
    margin_x = fw * (1.44 if tight_sides else (1.72 if is_outdoor else 1.85))
    outer_sides = np.abs(xx - cx) > margin_x
    top_bg = yy < max(8.0, head_top - 22.0)

    # Tapered head-to-shoulder exclusion so doorway/pillar gaps beside neck don't stick to collar
    neck_start = 0.56 if (not is_white_wall and not is_outdoor) else 0.64
    neck_slope_halfw = fw * (neck_start + 0.64 * np.clip((yy - (cy + fh * 0.35)) / (fh * 0.65), 0.0, 1.0))
    upper_bg = (yy < cy + fh * 1.0) & (np.abs(xx - cx) > neck_slope_halfw)

    body_env = ((yy >= head_top) & (np.abs(xx - cx) <= fw * 1.48))
    head_env = (((xx - cx) / (fw * 0.72)) ** 2 + ((yy - (cy - fh * 0.08)) / (fh * 0.86)) ** 2) <= 1.0
    gc_mask[body_env | head_env] = cv2.GC_PR_FGD

    # Core definite foreground priors
    not_border = (~border_bg) if border_bg is not None else np.ones((OUT_H, OUT_W), dtype=bool)
    face_core = (((xx - cx) / (fw * 0.36)) ** 2 + ((yy - cy) / (fh * 0.46)) ** 2) <= 1.0
    torso_dark = (yy > cy + fh * 0.62) & (np.abs(xx - cx) < fw * 1.28) & (v_ch < 48)
    maroon = ((h_ch >= 152) | (h_ch <= 10)) & (s_ch >= 65) & (v_ch < 175) & (np.abs(xx - cx) < fw * 0.72) & (yy > head_top) & (yy < cy + fh * 1.6)

    if is_white_wall or is_outdoor:
        neck_skin = np.zeros((OUT_H, OUT_W), dtype=bool)
        inner_shirt = (np.abs(xx - cx) < fw * 0.34) & (yy > cy + fh * 0.58) & (yy < cy + fh * 1.95) & (L_ch > 140)
    else:
        neck_skin = (np.abs(xx - cx) < fw * 0.24) & (yy >= cy) & (yy <= cy + fh * 0.72) & (s_ch > 35) & (v_ch > 70) & not_border
        inner_shirt = (
            ((np.abs(xx - cx) < fw * 0.42) & (yy > cy + fh * 0.50) & (yy < cy + fh * 1.05) & (L_ch > 185) & (s_ch < 28) & not_border)
            | ((np.abs(xx - cx) < fw * 0.32) & (yy > cy + fh * 0.62) & (yy < cy + fh * 1.95) & (L_ch > 140) & not_border)
        )

    gc_mask[face_core | neck_skin | torso_dark | maroon | inner_shirt] = cv2.GC_FGD
    gc_mask[top_bg | outer_sides | (upper_bg & (~inner_shirt) & (~neck_skin)) | (~valid_mask)] = cv2.GC_BGD

    if border_bg is not None:
        gc_mask[border_bg & (~face_core) & (~inner_shirt)] = cv2.GC_BGD
        if is_white_wall:
            enclosed_white = (L_ch > 160) & (s_ch < 42) & (~inner_shirt) & (~face_core)
            gc_mask[enclosed_white] = cv2.GC_BGD
        else:
            # Remove enclosed inner-elbow backdrop triangles strictly above wrists (keeps wristwatch intact)
            elbow_ymax = OUT_H if tight_sides else (cy + fh * 2.45)
            elbow_lmin = 72 if tight_sides else 85
            enclosed_elbow = (L_ch > elbow_lmin) & (L_ch < 215) & (s_ch < (95 if tight_sides else 35)) & (np.abs(xx - cx) > fw * 0.54) & (yy > cy + fh * 1.25) & (yy < elbow_ymax)
            gc_mask[enclosed_elbow] = cv2.GC_BGD

    if is_outdoor:
        # Outdoor architectural steps/glass/greenery background seeds strictly away from wrists/hands
        bright_arch = (L_ch > 152) & (s_ch < 75) & (~face_core) & (~inner_shirt) & (np.abs(xx - cx) > fw * 0.40) & (yy < cy + fh * 2.05)
        crown_non_maroon = (yy < cy - fh * 0.45) & (~maroon) & (~face_core)
        collar_gap = (yy < cy + fh * 1.05) & (np.abs(xx - cx) > fw * 0.44) & (~maroon) & (~face_core) & (~inner_shirt) & ((v_ch > 28) | (g_ch > r_ch + 1))
        upper_steps = (yy > cy + fh * 2.15) & (L_ch > 105) & (np.abs(xx - cx) > fw * 1.08)
        gc_mask[bright_arch | crown_non_maroon | collar_gap | upper_steps] = cv2.GC_BGD

    bgd_model = np.zeros((1, 65), dtype=np.float64)
    fgd_model = np.zeros((1, 65), dtype=np.float64)
    cv2.grabCut(bgr, gc_mask, None, bgd_model, fgd_model, 8, cv2.GC_INIT_WITH_MASK)

    fg_bool = ((gc_mask == cv2.GC_FGD) | (gc_mask == cv2.GC_PR_FGD)) & valid_mask
    fg_bool = keep_main_component(fg_bool, cx, cy, bgr=bgr, fw=fw)
    alpha = refine_alpha_edges(fg_bool, blur_ksize=5)

    # Decontaminate outer bright fringe pixels (white wall / outdoor glow) against dark studio backdrop
    defringed = bgr.copy().astype(np.float32)
    k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    inner_solid = cv2.erode(fg_bool.astype(np.uint8), k5, iterations=1) > 0
    edge_band = (alpha > 0.05) & (~inner_solid)
    edge_bright = edge_band & (L_ch > 135) & (~face_core)
    defringed[edge_bright] *= 0.62
    return defringed.astype(np.uint8), alpha


def harmonize_lighting(bgr: np.ndarray, face_box, boost_exposure: bool = False, boost_suit: bool = False):
    cx, cy, fw, fh = face_box
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    face_sample = (((xx - cx) / (fw * 0.28)) ** 2 + ((yy - cy) / (fh * 0.35)) ** 2) <= 1.0

    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    face_L = float(np.median(lab[:, :, 0][face_sample]))

    if boost_suit:
        # Lift dark charcoal suit/blazer tones cleanly off the obsidian backdrop while preserving pinstripes
        suit_band = (yy > cy + fh * 0.55) & (lab[:, :, 0] >= 12.0) & (lab[:, :, 0] <= 75.0)
        suit_lift = 14.0 * np.clip(1.0 - (lab[:, :, 0] - 42.0) / 36.0, 0.0, 1.0)
        lab[:, :, 0] = np.where(suit_band, np.clip(lab[:, :, 0] + suit_lift, 0, 255), lab[:, :, 0])

    if boost_exposure or face_L < 142.0:
        # Lift midtones & skin brightness while keeping dark charcoal suit crisp black
        l_norm = np.clip(lab[:, :, 0] / 255.0, 0.0, 1.0)
        l_lifted = (l_norm ** 0.68) * 255.0
        # Keep suit fabric dark charcoal (L < 62 stays rich & dark, skin/shirt L > 75 gets clean studio lift)
        suit_protect = np.clip((lab[:, :, 0] - 54.0) / 36.0, 0.0, 1.0)
        lab[:, :, 0] = np.clip(lab[:, :, 0] * (1.0 - suit_protect * 0.92) + l_lifted * (suit_protect * 0.92), 0, 255)
        # Neutralize faint greenish-brown cast on dark suit while keeping warm natural skin tone
        skin_like = (lab[:, :, 0] > 72.0) & (lab[:, :, 1] > 128.0) & (lab[:, :, 2] > 130.0)
        lab[:, :, 1] = np.where(skin_like, np.clip(lab[:, :, 1] + 2.5, 0, 255), 128.0 + (lab[:, :, 1] - 128.0) * 0.85)
        lab[:, :, 2] = np.where(skin_like, np.clip(lab[:, :, 2] + 3.0, 0, 255), 128.0 + (lab[:, :, 2] - 128.0) * 0.65)
    elif face_L > 168.0:
        l_norm = np.clip(lab[:, :, 0] / 255.0, 0.0, 1.0)
        lab[:, :, 0] = np.clip((l_norm ** 1.05) * 255.0, 0, 255)

    out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
    out_f = np.clip((out.astype(np.float32) - 127.0) * 1.04 + 127.0, 0, 255).astype(np.uint8)
    return out_f


def composite_portrait(fg_bgr: np.ndarray, alpha: np.ndarray, backdrop: np.ndarray) -> np.ndarray:
    a3 = alpha[:, :, None]
    comp = fg_bgr.astype(np.float32) * a3 + backdrop.astype(np.float32) * (1.0 - a3)

    yy = np.linspace(0.0, 1.0, OUT_H)[:, None]
    vig = np.clip((yy - 0.82) / 0.18, 0.0, 1.0) * 0.45
    vig3 = vig[:, :, None]
    dark_edge = np.array([32.0, 17.0, 11.0], dtype=np.float32)[None, None, :]
    comp = comp * (1.0 - vig3) + dark_edge * vig3
    return np.clip(comp, 0, 255).astype(np.uint8)


def process_one(leader_id: str, mode: str, backdrop: np.ndarray):
    src_path = os.path.join(RAW_DIR, f'{leader_id}.jpg')
    out_path = os.path.join(OUT_DIR, f'{leader_id}.jpg')
    if not os.path.exists(src_path):
        print(f'SKIP missing raw: {src_path}')
        return False

    raw_bgr = load_upright_bgr(src_path)
    face_box = detect_primary_face(raw_bgr)
    aligned, valid_mask, adj_face = align_portrait_canvas(raw_bgr, face_box)

    if mode == 'green':
        fg, alpha = segment_green_screen(aligned, valid_mask, adj_face)
        fg = harmonize_lighting(fg, adj_face, boost_exposure=True)
    elif mode == 'blue':
        fg, alpha = segment_blue_screen(aligned, valid_mask, adj_face)
        fg = harmonize_lighting(fg, adj_face, boost_exposure=False, boost_suit=True)
    elif mode == 'white_wall':
        border_bg = build_border_flood_bg(aligned, valid_mask, thresh=13.0)
        fg, alpha = grabcut_with_priors(aligned, valid_mask, adj_face, border_bg=border_bg, is_outdoor=False, is_white_wall=True)
        fg = harmonize_lighting(fg, adj_face, boost_exposure=False)
    elif mode == 'studio_hall':
        border_bg = build_border_flood_bg(aligned, valid_mask, thresh=14.0)
        fg, alpha = grabcut_with_priors(aligned, valid_mask, adj_face, border_bg=border_bg, is_outdoor=False, tight_sides=True)
        fg = harmonize_lighting(fg, adj_face, boost_exposure=False)
    elif mode == 'studio_neutral':
        border_bg = build_border_flood_bg(aligned, valid_mask, thresh=15.0)
        fg, alpha = grabcut_with_priors(aligned, valid_mask, adj_face, border_bg=border_bg, is_outdoor=False)
        fg = harmonize_lighting(fg, adj_face, boost_exposure=False)
    else:
        fg, alpha = grabcut_with_priors(aligned, valid_mask, adj_face, border_bg=None, is_outdoor=True)
        fg = harmonize_lighting(fg, adj_face, boost_exposure=False)

    final_bgr = composite_portrait(fg, alpha, backdrop)
    cv2.imwrite(out_path, final_bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
    print(f'PROCESSED {leader_id}.jpg ({OUT_W}x{OUT_H}) face_center=({adj_face[0]:.1f},{adj_face[1]:.1f}) fw={adj_face[2]:.1f}')
    return True


DEFAULT_MODES = {
    'presiden': 'studio_hall',
    'tydp1': 'green',
    'tydp2': 'blue',
    'bendahari': 'white_wall',
    'su-komunikasi': 'studio_neutral',
    'suag': 'outdoor',
    'su-pembangunan': 'studio_neutral',
}


def main():
    backdrop = make_studio_backdrop()
    jobs = list(DEFAULT_MODES.items())
    seen_ids = {lid for lid, _ in jobs}
    if os.path.isdir(RAW_DIR):
        for p in sorted(glob.glob(os.path.join(RAW_DIR, '*.jpg'))):
            lid = os.path.splitext(os.path.basename(p))[0]
            if lid not in seen_ids:
                jobs.append((lid, 'studio_neutral'))
                seen_ids.add(lid)
    for leader_id, mode in jobs:
        process_one(leader_id, mode, backdrop)


if __name__ == '__main__':
    main()
