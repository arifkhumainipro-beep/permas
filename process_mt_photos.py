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
TARGET_FACE_W = 224.0
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
    gray = cv2.equalizeHist(gray)
    cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
    detector = cv2.CascadeClassifier(cascade_path)
    h, w = gray.shape[:2]
    min_dim = max(40, int(min(h, w) * 0.08))
    faces = detector.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=5, minSize=(min_dim, min_dim))

    if len(faces) == 0:
        faces = detector.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))

    if len(faces) == 0:
        # Safe center-upper fallback
        fw = w * 0.25
        return (w * 0.5, h * 0.28, fw, fw * 1.1)

    # Prefer largest face in upper half
    best = max(faces, key=lambda f: f[2] * f[3] * (1.2 if f[1] < h * 0.45 else 0.7))
    fx, fy, fw, fh = [float(v) for v in best]
    return (fx + fw * 0.5, fy + fh * 0.5, fw, fh)


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

    # Ensure top of head stays inside canvas with clean headroom (~100-130px above face box)
    x0 = int(round(scaled_cx - TARGET_FACE_CX))
    y0 = int(round(scaled_cy - TARGET_FACE_CY))

    # Clamp vertically if crop tries to go above top of source image
    if y0 < 0:
        y0 = 0

    canvas = np.zeros((OUT_H, OUT_W, 3), dtype=np.uint8)
    # Fill any edge padding using nearest border pixels
    src_x1 = max(0, x0)
    src_y1 = max(0, y0)
    src_x2 = min(new_w, x0 + OUT_W)
    src_y2 = min(new_h, y0 + OUT_H)

    dst_x1 = src_x1 - x0
    dst_y1 = src_y1 - y0
    dst_x2 = dst_x1 + (src_x2 - src_x1)
    dst_y2 = dst_y1 + (src_y2 - src_y1)

    canvas[dst_y1:dst_y2, dst_x1:dst_x2] = resized[src_y1:src_y2, src_x1:src_x2]

    # Replicate border columns/rows cleanly if source was narrower than canvas after scaling
    if dst_x1 > 0:
        canvas[dst_y1:dst_y2, :dst_x1] = canvas[dst_y1:dst_y2, dst_x1:dst_x1 + 1]
    if dst_x2 < OUT_W:
        canvas[dst_y1:dst_y2, dst_x2:] = canvas[dst_y1:dst_y2, dst_x2 - 1:dst_x2]
    if dst_y2 < OUT_H:
        canvas[dst_y2:, :] = canvas[dst_y2 - 1:dst_y2, :]

    adj_cx = scaled_cx - x0
    adj_cy = scaled_cy - y0
    return canvas, (adj_cx, adj_cy, scaled_fw, scaled_fh)


def make_studio_backdrop() -> np.ndarray:
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
    dx = (xx - 400.0) / 360.0
    dy = (yy - 360.0) / 480.0
    dist = np.sqrt(dx * dx + dy * dy)
    glow = np.clip(1.0 - dist, 0.0, 1.0) ** 1.65

    # Studio slate key behind shoulders (#2C3B52) -> obsidian vignette (#0B1120)
    # BGR channels
    b = 26.0 + glow * (86.0 - 26.0)
    g = 17.0 + glow * (62.0 - 17.0)
    r = 12.0 + glow * (48.0 - 12.0)

    # Very subtle warm royal sheen behind upper shoulders
    warm = np.exp(-(((xx - 400.0) / 260.0) ** 2 + ((yy - 410.0) / 220.0) ** 2))
    r = np.clip(r + warm * 10.0, 0, 255)
    g = np.clip(g + warm * 6.0, 0, 255)
    b = np.clip(b + warm * 4.0, 0, 255)

    backdrop = np.stack([b, g, r], axis=-1).astype(np.uint8)
    return backdrop


def keep_main_component(mask_bool: np.ndarray, cx: float, cy: float) -> np.ndarray:
    u8 = mask_bool.astype(np.uint8)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(u8, connectivity=8)
    if num_labels <= 1:
        return mask_bool
    ix = int(np.clip(round(cx), 0, OUT_W - 1))
    iy = int(np.clip(round(cy), 0, OUT_H - 1))
    target_label = labels[iy, ix]
    if target_label == 0:
        # Pick largest non-background component
        areas = stats[1:, cv2.CC_STAT_AREA]
        target_label = 1 + int(np.argmax(areas))
    main_mask = labels == target_label

    # Fill interior holes cleanly
    inv = (~main_mask).astype(np.uint8)
    n2, l2, s2, _ = cv2.connectedComponentsWithStats(inv, connectivity=8)
    filled = main_mask.copy()
    for lbl in range(1, n2):
        area = s2[lbl, cv2.CC_STAT_AREA]
        # Keep external background touching border, fill enclosed small/medium holes
        x, y, bw, bh, _ = s2[lbl]
        touches_edge = (x == 0 or y == 0 or (x + bw) >= OUT_W or (y + bh) >= OUT_H)
        if not touches_edge and area < 45000:
            filled[l2 == lbl] = True
    return filled


def refine_alpha_edges(bin_mask: np.ndarray, blur_ksize: int = 5) -> np.ndarray:
    u8 = (bin_mask.astype(np.uint8)) * 255
    k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    u8 = cv2.morphologyEx(u8, cv2.MORPH_CLOSE, k3, iterations=1)
    u8 = cv2.morphologyEx(u8, cv2.MORPH_OPEN, k3, iterations=1)
    # Slight inward shift + feather avoids bright outer fringe
    eroded = cv2.erode(u8, k3, iterations=1)
    alpha = cv2.GaussianBlur(eroded.astype(np.float32) / 255.0, (blur_ksize, blur_ksize), 0)
    return np.clip(alpha, 0.0, 1.0)


def segment_green_screen(bgr: np.ndarray, face_box):
    cx, cy, fw, fh = face_box
    f = bgr.astype(np.float32)
    b, g, r = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h_ch, s_ch, v_ch = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    green_excess = g - np.maximum(r, b)
    is_green_hue = (h_ch >= 30) & (h_ch <= 92) & (s_ch >= 28) & (v_ch >= 35)

    # Raw soft alpha from green excess
    alpha_green = 1.0 - np.clip((green_excess - 4.0) / 18.0, 0.0, 1.0)
    alpha = np.where(is_green_hue, np.minimum(alpha_green, 1.0 - np.clip((green_excess - 2.0) / 14.0, 0.0, 1.0)), 1.0)

    # Protect core face, eyes, hair & suit interior
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    head_mask = (((xx - cx) / (fw * 0.52)) ** 2 + ((yy - cy) / (fh * 0.68)) ** 2) <= 1.0
    torso_mask = (np.abs(xx - cx) < fw * 1.15) & (yy > cy + fh * 0.65) & (green_excess < 18.0)
    alpha = np.where(head_mask | torso_mask, np.maximum(alpha, 0.96), alpha)

    # Keep primary connected person component
    main_bool = keep_main_component(alpha > 0.35, cx, cy)
    alpha = np.where(main_bool, alpha, 0.0)
    alpha = cv2.GaussianBlur(alpha.astype(np.float32), (3, 3), 0)

    # Green spill suppression across edges & glasses reflection
    max_rb = np.maximum(r, b)
    avg_rb = 0.52 * r + 0.48 * b
    spill = np.maximum(0.0, g - avg_rb)
    # Strong spill cleanup near green hue or edges
    edge_factor = np.clip(1.3 - alpha, 0.0, 1.0)
    clean_g = np.where(
        (is_green_hue | (spill > 4.0)),
        g - spill * np.where(head_mask, 0.68, np.maximum(0.78, edge_factor)),
        g,
    )
    cleaned_bgr = np.stack([b, np.clip(clean_g, 0, 255), r], axis=-1).astype(np.uint8)
    return cleaned_bgr, alpha


def build_border_flood_bg(bgr: np.ndarray, thresh: float = 16.0) -> np.ndarray:
    """Flood-fill similar background starting from left, top, and right border seeds."""
    h, w = bgr.shape[:2]
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)

    # Collect border pixels from top, upper-left, upper-right, mid-left, mid-right
    seed_pts = []
    for x in range(10, w - 10, 40):
        seed_pts.append((x, 4))
    for y in range(20, int(h * 0.85), 40):
        seed_pts.append((4, y))
        seed_pts.append((w - 5, y))

    ff_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
    work = bgr.copy()
    lo_up = (int(thresh), int(thresh), int(thresh))
    flags = 8 | (255 << 8) | cv2.FLOODFILL_FIXED_RANGE | cv2.FLOODFILL_MASK_ONLY

    for sx, sy in seed_pts:
        if ff_mask[sy + 1, sx + 1] == 0:
            # Skip seed if it looks very dark or strongly saturated maroon (person)
            pix = lab[sy, sx]
            if pix[0] > 75:  # non-black wall
                cv2.floodFill(work, ff_mask, (sx, sy), 0, lo_up, lo_up, flags)

    return ff_mask[1:-1, 1:-1] > 0


def grabcut_with_priors(bgr: np.ndarray, face_box, border_bg: np.ndarray = None, is_outdoor: bool = False):
    cx, cy, fw, fh = face_box
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    L_ch, a_ch, b_ch = lab[:, :, 0], lab[:, :, 1], lab[:, :, 2]
    h_ch, s_ch, v_ch = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    # Initialize mask with probable background everywhere
    gc_mask = np.full((OUT_H, OUT_W), cv2.GC_PR_BGD, dtype=np.uint8)

    # Outer frame & envelope margins are definite background
    margin_x = fw * (1.75 if is_outdoor else 1.85)
    head_top = cy - fh * 0.92
    # Narrower oval envelope around head height so architectural pillars above shoulders aren't included
    shoulder_y = cy + fh * 0.78
    upper_bg = (yy < shoulder_y) & (np.abs(xx - cx) > fw * 0.82)
    outer_sides = np.abs(xx - cx) > margin_x
    top_bg = yy < max(12.0, head_top - 32.0)

    # Probable foreground envelope centered on person
    body_env = ((yy >= head_top) & (np.abs(xx - cx) <= fw * 1.48))
    head_env = (((xx - cx) / (fw * 0.72)) ** 2 + ((yy - (cy - fh * 0.08)) / (fh * 0.82)) ** 2) <= 1.0
    gc_mask[body_env | head_env] = cv2.GC_PR_FGD

    # Definite foreground priors
    face_core = (((xx - cx) / (fw * 0.40)) ** 2 + ((yy - cy) / (fh * 0.52)) ** 2) <= 1.0
    # Dark blazer torso pixels inside shoulder envelope
    torso_dark = (yy > cy + fh * 0.60) & (np.abs(xx - cx) < fw * 1.32) & (v_ch < 65)
    # Maroon tudung or tie pixels near head/upper chest
    maroon = ((h_ch >= 145) | (h_ch <= 15)) & (s_ch >= 55) & (v_ch < 175) & (np.abs(xx - cx) < fw * 0.78) & (yy > head_top) & (yy < cy + fh * 1.6)
    # Sealed white inner collar / shirt front strictly inside neck/chest V
    inner_shirt = (np.abs(xx - cx) < fw * 0.36) & (yy > cy + fh * 0.58) & (yy < cy + fh * 1.95) & (L_ch > 140)

    gc_mask[face_core | torso_dark | maroon | inner_shirt] = cv2.GC_FGD

    # Definite background priors
    gc_mask[top_bg | outer_sides | upper_bg] = cv2.GC_BGD
    if border_bg is not None:
        # Never overwrite definite core face or inner shirt
        gc_mask[border_bg & (~face_core) & (~inner_shirt)] = cv2.GC_BGD

    if is_outdoor:
        # Outdoor entrance photo (`suag.jpg`): protect outer steps & bright sky/glass pillars away from black suit/maroon tudung
        bright_arch = (L_ch > 155) & (s_ch < 85) & (~face_core) & (~inner_shirt) & (np.abs(xx - cx) > fw * 0.42)
        upper_steps = (yy > cy + fh * 2.2) & (L_ch > 110) & (np.abs(xx - cx) > fw * 1.1)
        # Background between blazer arms/underneath chin stairs outside white V
        gc_mask[bright_arch | upper_steps] = cv2.GC_BGD

    bgd_model = np.zeros((1, 65), dtype=np.float64)
    fgd_model = np.zeros((1, 65), dtype=np.float64)
    cv2.grabCut(bgr, gc_mask, None, bgd_model, fgd_model, 8, cv2.GC_INIT_WITH_MASK)

    fg_bool = (gc_mask == cv2.GC_FGD) | (gc_mask == cv2.GC_PR_FGD)
    fg_bool = keep_main_component(fg_bool, cx, cy)
    alpha = refine_alpha_edges(fg_bool, blur_ksize=5)

    # Decontaminate outer bright fringe pixels along silhouette against dark backdrop
    defringed = bgr.copy().astype(np.float32)
    k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    inner_solid = cv2.erode(fg_bool.astype(np.uint8), k5, iterations=1) > 0
    edge_band = (alpha > 0.05) & (~inner_solid)
    # Darken very bright edge halo (white wall / sky glow) slightly toward inner neighbor tone
    edge_bright = edge_band & (L_ch > 150) & (~face_core)
    defringed[edge_bright] *= 0.72
    return defringed.astype(np.uint8), alpha


def harmonize_lighting(bgr: np.ndarray, alpha: np.ndarray, face_box, boost_exposure: bool = False):
    cx, cy, fw, fh = face_box
    yy, xx = np.mgrid[0:OUT_H, 0:OUT_W]
    face_sample = (((xx - cx) / (fw * 0.28)) ** 2 + ((yy - cy) / (fh * 0.35)) ** 2) <= 1.0

    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    face_L = float(np.median(lab[:, :, 0][face_sample]))

    # Target uniform studio skin luminance (~152 in 0..255 LAB space)
    target_L = 152.0
    if boost_exposure or face_L < 138.0:
        gain = np.clip(target_L / max(face_L, 65.0), 1.0, 1.38)
        # Apply smooth shadow-friendly lift
        l_norm = np.clip(lab[:, :, 0] / 255.0, 0.0, 1.0)
        gamma = 1.0 / (1.0 + (gain - 1.0) * 1.15)
        l_lifted = (l_norm ** gamma) * 255.0
        # Blend slightly stronger lift cleanly without washing out dark blazer completely
        lab[:, :, 0] = np.clip(0.88 * l_lifted + 0.12 * lab[:, :, 0], 0, 255)
        # Gentle warmth correction for cool green screen shots
        lab[:, :, 1] = np.clip(lab[:, :, 1] + 2.5, 0, 255)
        lab[:, :, 2] = np.clip(lab[:, :, 2] + 3.0, 0, 255)
    elif face_L > 168.0:
        l_norm = np.clip(lab[:, :, 0] / 255.0, 0.0, 1.0)
        lab[:, :, 0] = np.clip((l_norm ** 1.06) * 255.0, 0, 255)

    out = cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2BGR)
    # Mild contrast polish
    out_f = np.clip((out.astype(np.float32) - 127.0) * 1.05 + 127.0, 0, 255).astype(np.uint8)
    return out_f


def composite_portrait(fg_bgr: np.ndarray, alpha: np.ndarray, backdrop: np.ndarray) -> np.ndarray:
    a3 = alpha[:, :, None]
    comp = fg_bgr.astype(np.float32) * a3 + backdrop.astype(np.float32) * (1.0 - a3)

    # Subtle bottom card gradient blend (y = 830..1000) toward #0B1120 (BGR: 32, 17, 11)
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
    aligned, adj_face = align_portrait_canvas(raw_bgr, face_box)

    if mode == 'green':
        fg, alpha = segment_green_screen(aligned, adj_face)
        fg = harmonize_lighting(fg, alpha, adj_face, boost_exposure=True)
    elif mode == 'white_wall':
        border_bg = build_border_flood_bg(aligned, thresh=14.0)
        fg, alpha = grabcut_with_priors(aligned, adj_face, border_bg=border_bg, is_outdoor=False)
        fg = harmonize_lighting(fg, alpha, adj_face, boost_exposure=False)
    elif mode == 'studio_neutral':
        border_bg = build_border_flood_bg(aligned, thresh=16.0)
        fg, alpha = grabcut_with_priors(aligned, adj_face, border_bg=border_bg, is_outdoor=False)
        fg = harmonize_lighting(fg, alpha, adj_face, boost_exposure=False)
    else:  # outdoor
        fg, alpha = grabcut_with_priors(aligned, adj_face, border_bg=None, is_outdoor=True)
        fg = harmonize_lighting(fg, alpha, adj_face, boost_exposure=False)

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
    ]
    for leader_id, mode in jobs:
        process_one(leader_id, mode, backdrop)


if __name__ == '__main__':
    main()
