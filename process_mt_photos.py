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
    return cv2.cvtColor(np.array(pil_im), cv2.COLOR_RGB2BGR)


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
    for lbl in range(1, n2):
        area = s2[lbl, cv2.CC_STAT_AREA]
        x, y, bw, bh, _ = s2[lbl]
        touches_edge = (x == 0 or y == 0 or (x + bw) >= OUT_W or (y + bh) >= OUT_H)
        if not touches_edge and area < 45000:
            hole_mask = (l2 == lbl)
            hole_cx = x + bw * 0.5
            # Skip refilling enclosed elbow/armpit triangles that match the outer studio wall color
            if bg_lab_ref is not None and abs(hole_cx - cx) > fw * 0.45:
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


def grabcut_with_priors(bgr: np.ndarray, valid_mask: np.ndarray, face_box, border_bg: np.ndarray = None, is_outdoor: bool = False):
    cx, cy, fw, fh = face_box
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    L_ch, _, _ = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]
    h_ch, s_ch, v_ch = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    b_ch, g_ch, r_ch = bgr[:, :, 0].astype(np.int16), bgr[:, :, 1].astype(np.int16), bgr[:, :, 2].astype(np.int16)

    gc_mask = np.full((OUT_H, OUT_W), cv2.GC_PR_BGD, dtype=np.uint8)

    head_top = cy - fh * 1.02
    margin_x = fw * (1.72 if is_outdoor else 1.85)
    outer_sides = np.abs(xx - cx) > margin_x
    top_bg = yy < max(8.0, head_top - 22.0)

    # Tapered head-to-shoulder exclusion so doorway/pillar gaps beside neck don't stick to collar
    neck_slope_halfw = fw * (0.64 + 0.60 * np.clip((yy - (cy + fh * 0.35)) / (fh * 0.65), 0.0, 1.0))
    upper_bg = (yy < cy + fh * 1.0) & (np.abs(xx - cx) > neck_slope_halfw)

    body_env = ((yy >= head_top) & (np.abs(xx - cx) <= fw * 1.48))
    head_env = (((xx - cx) / (fw * 0.72)) ** 2 + ((yy - (cy - fh * 0.08)) / (fh * 0.86)) ** 2) <= 1.0
    gc_mask[body_env | head_env] = cv2.GC_PR_FGD

    # Core definite foreground priors
    face_core = (((xx - cx) / (fw * 0.36)) ** 2 + ((yy - cy) / (fh * 0.46)) ** 2) <= 1.0
    neck_skin = (np.abs(xx - cx) < fw * 0.30) & (yy >= cy) & (yy <= cy + fh * 0.80) & (s_ch > 28) & (v_ch > 70)
    torso_dark = (yy > cy + fh * 0.62) & (np.abs(xx - cx) < fw * 1.28) & (v_ch < 48)
    maroon = ((h_ch >= 152) | (h_ch <= 10)) & (s_ch >= 65) & (v_ch < 175) & (np.abs(xx - cx) < fw * 0.72) & (yy > head_top) & (yy < cy + fh * 1.6)
    inner_shirt = (
        ((np.abs(xx - cx) < fw * 0.45) & (yy > cy + fh * 0.45) & (yy < cy + fh * 1.05) & (L_ch > 175) & (s_ch < 35))
        | ((np.abs(xx - cx) < fw * 0.34) & (yy > cy + fh * 0.58) & (yy < cy + fh * 1.95) & (L_ch > 140))
    )

    gc_mask[face_core | neck_skin | torso_dark | maroon | inner_shirt] = cv2.GC_FGD
    gc_mask[top_bg | outer_sides | (upper_bg & (~inner_shirt) & (~neck_skin)) | (~valid_mask)] = cv2.GC_BGD

    if border_bg is not None:
        gc_mask[border_bg & (~face_core) & (~neck_skin) & (~inner_shirt)] = cv2.GC_BGD
        # Remove enclosed bright wall pockets OR inner-elbow studio backdrop pockets matching border tone
        enclosed_white = (L_ch > 160) & (s_ch < 42) & (~inner_shirt) & (~face_core) & (~neck_skin)
        lab_f = lab.astype(np.float32)
        mid_samples = np.concatenate([
            lab_f[350:650, 5:35].reshape(-1, 3),
            lab_f[350:650, -35:-5].reshape(-1, 3),
        ], axis=0)
        mid_bg_ref = np.median(mid_samples, axis=0)
        mid_dist = np.linalg.norm(lab_f - mid_bg_ref[None, None, :], axis=-1)
        enclosed_studio = (mid_dist < 24.0) & (v_ch > 48) & (~face_core) & (~neck_skin) & (~inner_shirt) & (np.abs(xx - cx) > fw * 0.52)
        gc_mask[enclosed_white | enclosed_studio] = cv2.GC_BGD

    if is_outdoor:
        # Outdoor architectural steps/glass/greenery background seeds outside face/shirt/suit
        bright_arch = (L_ch > 142) & (s_ch < 85) & (~face_core) & (~inner_shirt) & (np.abs(xx - cx) > fw * 0.38)
        crown_non_maroon = (yy < cy - fh * 0.45) & (~maroon) & (~face_core)
        collar_gap = (yy < cy + fh * 1.05) & (np.abs(xx - cx) > fw * 0.44) & (~maroon) & (~face_core) & (~inner_shirt) & ((v_ch > 28) | (g_ch > r_ch + 1))
        upper_steps = (yy > cy + fh * 2.05) & (L_ch > 100) & (np.abs(xx - cx) > fw * 1.05)
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


def harmonize_lighting(bgr: np.ndarray, face_box, boost_exposure: bool = False):
    cx, cy, fw, fh = face_box
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    face_sample = (((xx - cx) / (fw * 0.28)) ** 2 + ((yy - cy) / (fh * 0.35)) ** 2) <= 1.0

    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    face_L = float(np.median(lab[:, :, 0][face_sample]))

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
    elif mode == 'white_wall':
        border_bg = build_border_flood_bg(aligned, valid_mask, thresh=13.0)
        fg, alpha = grabcut_with_priors(aligned, valid_mask, adj_face, border_bg=border_bg, is_outdoor=False)
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


def main():
    backdrop = make_studio_backdrop()
    jobs = [
        ('tydp1', 'green'),
        ('bendahari', 'white_wall'),
        ('su-komunikasi', 'studio_neutral'),
        ('suag', 'outdoor'),
        ('su-pembangunan', 'studio_neutral'),
    ]
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
