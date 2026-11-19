#!/usr/bin/env python3
"""
PERMAS Nasional - Auto-Updating Local News Aggregator & Static HTTP Server
Fetches real Malaysian & Selangor student news from local media via Google News Malaysia RSS,
maintains js/live-news-cache.json, and serves the portal on port 3000 with no-cache headers.
"""

import argparse
import base64
import datetime
import email.utils
import html
import http.server
import json
import os
import re
import socketserver
import ssl
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_PATH = os.path.join(ROOT_DIR, 'js', 'live-news-cache.json')
ADUAN_LOG_PATH = os.path.join(ROOT_DIR, 'js', 'aduan-submissions.json')
ADUAN_LOCK = threading.Lock()
DRIVE_SYNC_LOCK = threading.Lock()
DRIVE_FOLDER_ID = '1VBIh012vL_y0Fk4CkYZz6XXlZndY4H6g'
MT_DRIVE_MATCHERS = [
    ('presiden', ['amirul irfan', 'saupi']),
    ('tydp1', ['danish hariz', 'hamdan']),
    ('tydp2', ['tharshan', 'pillay', 'wandek']),
    ('suag', ['noor hayati', 'setiausaha agung']),
    ('bendahari', ['faris imran', 'sofan']),
    ('penerangan', ['harith darwish', 'nor mali', 'ketua penerangan']),
    ('su-komunikasi', ['emylieya', 'natasyha']),
    ('su-pembangunan', ['arif khumaini', 'muhamad fairuz']),
    ('su-kebajikan', ['nurul najiha', 'fairulzaman']),
    ('timbalan-bendahari', ['nazirah fatehah', 'mohamed nazri', 'timbalan bendahari']),
]
PORT = 3000
AUTO_REFRESH_SECONDS = 600  # 10 minutes server background refresh
GIT_SYNC_INTERVAL_SECONDS = 15  # 15 seconds file watcher auto-sync to GitHub

QUERIES = [
    'mahasiswa Selangor OR pelajar IPT Selangor OR bantuan IPT Selangor OR UNISEL OR Yayasan Selangor',
    'mahasiswa Selangor',
    'mahasiswa Malaysia IPT universiti biasiswa bantuan',
]

STUDENT_KW = [
    'mahasiswa', 'mahasiswi', 'siswa', 'pelajar ipt', 'universiti',
    'graduan', 'kampus', 'biasiswa', 'dermasiswa', 'unisel', 'uitm',
    'ukm', 'upm', 'uis', 'kpt', 'pengajian tinggi', 'ptptn', 'kolej',
    'politeknik', 'hpipt',
]

SELANGOR_KW = [
    'selangor', 'unisel', 'uis', 'shah alam', 'banting', 'uitm',
    'ukm', 'upm', 'sagong tasi', 'amirudin', 'sungai buloh',
]

BANTUAN_KW = [
    'bantuan', 'biasiswa', 'dermasiswa', 'rm1,000', 'rm500', 'ptptn',
    'belanjawan', 'hpipt', 'percuma', 'tajaan', 'baucar', 'kewangan',
]

MALAY_MONTHS_SHORT = [
    '', 'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis',
]

MALAY_MONTHS_FULL = [
    '', 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
]

LOCAL_IMAGES = [
    'assets/images/selangor_shah_alam_night.jpg',
    'assets/images/campus_life.jpg',
    'assets/images/selangor_masjid_biru.jpg',
    'assets/images/graduation.jpg',
    'assets/images/study_group.jpg',
]

CACHE_LOCK = threading.Lock()
LAST_FETCH_TS = 0.0


def format_malay_date(dt: datetime.datetime):
    local_dt = dt.astimezone(datetime.timezone(datetime.timedelta(hours=8)))
    d = local_dt.day
    m = local_dt.month
    y = local_dt.year
    return (
        f'{d:02d} {MALAY_MONTHS_SHORT[m]} {y}',
        f'{d:02d} {MALAY_MONTHS_FULL[m]} {y}',
    )


def clean_html_text(raw: str) -> str:
    if not raw:
        return ''
    text = html.unescape(raw)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def pick_image(lower_title: str, idx: int, is_selangor: bool) -> str:
    if is_selangor and idx == 0:
        return 'assets/images/selangor_shah_alam_night.jpg'
    if any(k in lower_title for k in ('biasiswa', 'dermasiswa', 'ptptn', 'graduan', 'tajaan')):
        return 'assets/images/graduation.jpg'
    if any(k in lower_title for k in ('rm1,000', 'belanjawan', 'percuma', 'selangor', 'bantuan')):
        return 'assets/images/selangor_masjid_biru.jpg' if idx % 2 == 0 else 'assets/images/campus_life.jpg'
    if any(k in lower_title for k in ('santuni', 'oku', 'sukarelawan', 'komuniti', 'unisel')):
        return 'assets/images/study_group.jpg'
    return LOCAL_IMAGES[idx % len(LOCAL_IMAGES)]


def build_summary_and_body(title: str, source: str, date_full: str, desc_clean: str, is_selangor: bool, is_bantuan: bool, link: str):
    scope_label = 'Mahasiswa & Pengajian Tinggi Selangor' if is_selangor else 'Pendidikan Tinggi & Siswa Malaysia'
    if is_bantuan:
        summary = (
            f'Laporan terkini oleh {source} ({date_full}) berhubung skim bantuan kewangan, '
            f'biasiswa atau inisiatif kebajikan mahasiswa {("Negeri Selangor" if is_selangor else "di IPT Malaysia")}.'
        )
    else:
        summary = (
            f'Sorotan berita tempatan daripada {source} ({date_full}) mengenai perkembangan, '
            f'aktiviti dan suara mahasiswa {("anak Selangor" if is_selangor else "di institusi pengajian tinggi")}.'
        )

    extra_snippet = ''
    if desc_clean and len(desc_clean) > 25 and desc_clean.lower() not in title.lower():
        snippet_text = desc_clean[:260] + ('...' if len(desc_clean) > 260 else '')
        extra_snippet = f'<p class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600"><strong>Petikan Suapan Media ({html.escape(source)}):</strong> {html.escape(snippet_text)}</p>'

    body_html = f"""
      <div class="p-4 rounded-2xl bg-red-50/70 border border-red-200/80 text-xs sm:text-sm text-slate-800 space-y-1.5">
        <p class="font-bold text-red-800 uppercase tracking-wider text-[11px]">Ringkasan Berita Tempatan &bull; {html.escape(scope_label)}</p>
        <p>{html.escape(summary)}</p>
      </div>
      <p><strong>Sumber Media Rasmi:</strong> {html.escape(source)} &bull; Diterbitkan pada <strong>{html.escape(date_full)}</strong>.</p>
      {extra_snippet}
      <p>Pautan berita ini disegerakkan secara automatik ke Portal PERMAS Nasional bagi memudahkan mahasiswa anak Selangor mengikuti dasar pendidikan negeri, pembukaan biasiswa, serta perkembangan semasa kampus seluruh negara.</p>
      <p class="text-xs text-slate-500">Klik butang <strong>&ldquo;Baca Artikel Penuh di Portal Asal&rdquo;</strong> di bawah untuk membuka laporan lengkap terus di laman web rasmi {html.escape(source)}.</p>
    """.strip()

    return summary, body_html


def fetch_live_news_items():
    ctx = ssl._create_unverified_context()
    seen_titles = set()
    raw_entries = []

    for q in QUERIES:
        rss_url = (
            'https://news.google.com/rss/search?q='
            + urllib.parse.quote(q)
            + '&hl=ms&gl=MY&ceid=MY:ms'
        )
        req = urllib.request.Request(
            rss_url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PERMAS-Portal/1.0'},
        )
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            xml_bytes = resp.read()

        root = ET.fromstring(xml_bytes)
        for item in root.findall('.//item'):
            raw_title = (item.findtext('title') or '').strip()
            clean_title = raw_title.rsplit(' - ', 1)[0].strip() if ' - ' in raw_title else raw_title
            source = (item.findtext('source') or 'Media Tempatan').strip()
            if ' | ' in clean_title and clean_title.lower().endswith(source.lower()):
                clean_title = clean_title.rsplit(' | ', 1)[0].strip()
            if not clean_title:
                continue
            norm_key = re.sub(r'\W+', '', clean_title.lower())
            if norm_key in seen_titles:
                continue

            low = clean_title.lower()
            if not any(kw in low for kw in STUDENT_KW):
                continue

            pub_str = (item.findtext('pubDate') or '').strip()
            try:
                dt = email.utils.parsedate_to_datetime(pub_str)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=datetime.timezone.utc)
            except Exception:
                continue

            if dt.year < 2025:
                continue

            seen_titles.add(norm_key)
            link = (item.findtext('link') or '#').strip()
            desc_clean = clean_html_text(item.findtext('description') or '')
            is_selangor = any(sk in low for sk in SELANGOR_KW)
            is_bantuan = any(bk in low for bk in BANTUAN_KW)

            categories = []
            if is_selangor:
                categories.append('selangor')
            if is_bantuan:
                categories.append('bantuan')
            if not is_bantuan or any(ak in low for ak in ('santuni', 'sukarelawan', 'sukma', 'solar', 'literasi', 'nuklear', 'bas', 'pulang')):
                categories.append('aktiviti')

            primary_cat = 'selangor' if is_selangor else ('bantuan' if is_bantuan else 'aktiviti')

            raw_entries.append({
                'dt': dt,
                'timestamp': int(dt.timestamp()),
                'title': clean_title,
                'source': source,
                'link': link,
                'descClean': desc_clean,
                'isSelangor': is_selangor,
                'isBantuan': is_bantuan,
                'category': primary_cat,
                'categories': categories,
            })

    # Prioritize Selangor student news first, then sort newest-first
    raw_entries.sort(key=lambda x: (1 if x['isSelangor'] else 0, x['timestamp']), reverse=True)
    raw_entries = raw_entries[:24]

    articles = []
    for idx, entry in enumerate(raw_entries):
        date_short, date_full = format_malay_date(entry['dt'])
        img_path = pick_image(entry['title'].lower(), idx, entry['isSelangor'])
        badge_label = (
            'Mahasiswa Selangor' if entry['isSelangor']
            else ('Bantuan & Biasiswa' if entry['isBantuan'] else 'Kampus Malaysia')
        )
        summary, body_html = build_summary_and_body(
            entry['title'],
            entry['source'],
            date_full,
            entry['descClean'],
            entry['isSelangor'],
            entry['isBantuan'],
            entry['link'],
        )
        articles.append({
            'id': idx,
            'title': entry['title'],
            'source': entry['source'],
            'link': entry['link'],
            'dateShort': date_short,
            'dateFull': date_full,
            'timestamp': entry['timestamp'],
            'isoDate': entry['dt'].astimezone(datetime.timezone(datetime.timedelta(hours=8))).isoformat(),
            'isSelangor': entry['isSelangor'],
            'isBantuan': entry['isBantuan'],
            'category': entry['category'],
            'categories': entry['categories'],
            'badge': badge_label,
            'image': img_path,
            'summary': summary,
            'bodyHtml': body_html,
        })

    now_my = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8)))
    return {
        'status': 'ok',
        'mode': 'live-rss',
        'updatedAt': now_my.isoformat(),
        'updatedLabel': now_my.strftime('%d/%m/%Y %H:%M MYT'),
        'nextRefreshMinutes': 5,
        'total': len(articles),
        'selangorCount': sum(1 for a in articles if a['isSelangor']),
        'articles': articles,
    }


def load_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return None
    return None


def save_cache(payload: dict):
    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    tmp_path = CACHE_PATH + '.tmp'
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, CACHE_PATH)


def refresh_cache(force: bool = False):
    global LAST_FETCH_TS
    with CACHE_LOCK:
        now = time.time()
        existing = load_cache()
        if not force and existing and existing.get('articles') and (now - LAST_FETCH_TS < AUTO_REFRESH_SECONDS):
            return existing

        try:
            fresh = fetch_live_news_items()
            if fresh.get('articles'):
                save_cache(fresh)
                LAST_FETCH_TS = time.time()
                return fresh
        except Exception as exc:
            print(f'[PERMAS News] RSS refresh fallback to cache ({exc})', file=sys.stderr)

        if existing:
            fallback = dict(existing)
            fallback['mode'] = 'cached-fallback'
            return fallback

        return {
            'status': 'empty',
            'mode': 'empty',
            'updatedAt': datetime.datetime.now().isoformat(),
            'updatedLabel': 'Tiada sambungan suapan buat masa ini',
            'nextRefreshMinutes': 5,
            'total': 0,
            'selangorCount': 0,
            'articles': [],
        }


def sync_drive_mt_photos(force: bool = False) -> dict:
    with DRIVE_SYNC_LOCK:
        ahli_dir = os.path.join(ROOT_DIR, 'assets', 'ahli')
        os.makedirs(ahli_dir, exist_ok=True)
        ctx = ssl._create_unverified_context()
        synced_ids = []
        found_in_drive = []
        errors = []

        try:
            folder_url = f'https://drive.google.com/embeddedfolderview?id={DRIVE_FOLDER_ID}#list'
            req = urllib.request.Request(folder_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=20) as r:
                folder_html = r.read().decode('utf-8', errors='ignore')

            entries = re.findall(
                r'id="entry-([^"]+)"[^>]*>.*?<div class="flip-entry-title">([^<]+)</div>',
                folder_html,
                flags=re.S,
            )

            for file_id, raw_title in entries:
                clean_title = html.unescape(raw_title).strip()
                lower_title = clean_title.lower()
                found_in_drive.append({'id': file_id, 'title': clean_title})

                matched_leader_id = None
                for leader_id, keywords in MT_DRIVE_MATCHERS:
                    if any(kw in lower_title for kw in keywords):
                        matched_leader_id = leader_id
                        break

                if not matched_leader_id:
                    continue

                out_path = os.path.join(ahli_dir, f'{matched_leader_id}.jpg')
                if not force and os.path.exists(out_path) and os.path.getsize(out_path) > 500:
                    continue

                dl_url = f'https://drive.google.com/uc?export=download&id={file_id}'
                dl_req = urllib.request.Request(dl_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(dl_req, context=ctx, timeout=30) as img_resp:
                    img_bytes = img_resp.read()

                if len(img_bytes) > 500 and (
                    img_bytes.startswith(b'\xff\xd8')
                    or img_bytes.startswith(b'\x89PNG')
                    or img_bytes[:4] == b'RIFF'
                ):
                    raw_dir = os.path.join(ahli_dir, 'raw')
                    os.makedirs(raw_dir, exist_ok=True)
                    raw_path = os.path.join(raw_dir, f'{matched_leader_id}.jpg')
                    raw_tmp = raw_path + '.tmp'
                    with open(raw_tmp, 'wb') as rf:
                        rf.write(img_bytes)
                    os.replace(raw_tmp, raw_path)

                    processed = False
                    try:
                        import process_mt_photos
                        backdrop = process_mt_photos.make_studio_backdrop()
                        processed = bool(process_mt_photos.process_one(matched_leader_id, 'studio_neutral', backdrop))
                    except Exception as proc_exc:
                        print(f'[PERMAS Drive Sync] Studio processing fallback for {matched_leader_id}: {proc_exc}', file=sys.stderr)

                    if not processed:
                        tmp_path = out_path + '.tmp'
                        with open(tmp_path, 'wb') as f:
                            f.write(img_bytes)
                        os.replace(tmp_path, out_path)

                    synced_ids.append(matched_leader_id)
                else:
                    errors.append(f'{matched_leader_id}: invalid image payload from Drive ({file_id})')
        except Exception as exc:
            errors.append(str(exc))
            print(f'[PERMAS Drive Sync] Warning: {exc}', file=sys.stderr)

        existing_ids = [
            leader_id
            for leader_id, _ in MT_DRIVE_MATCHERS
            if os.path.exists(os.path.join(ahli_dir, f'{leader_id}.jpg'))
            and os.path.getsize(os.path.join(ahli_dir, f'{leader_id}.jpg')) > 500
        ]

        if synced_ids:
            print(f"[PERMAS Drive Sync] Downloaded MT photos: {', '.join(synced_ids)}")

        return {
            'status': 'ok' if not errors else 'partial',
            'folderId': DRIVE_FOLDER_ID,
            'foundInDrive': len(found_in_drive),
            'syncedIds': synced_ids,
            'existingIds': existing_ids,
            'errors': errors,
        }


def background_news_updater():
    # Initial populate on startup, then periodic auto-update
    refresh_cache(force=True)
    sync_drive_mt_photos(force=False)
    while True:
        time.sleep(AUTO_REFRESH_SECONDS)
        refresh_cache(force=True)
        sync_drive_mt_photos(force=False)


GIT_SYNC_LOCK = threading.Lock()
LAST_GIT_SYNC = {
    'status': 'idle',
    'lastSyncLabel': 'Belum disegerakkan',
    'lastCommit': '',
    'message': 'Pemantau auto-sync GitHub aktif (setiap 15 saat)',
}


def run_git(args, timeout=30):
    return subprocess.run(
        ['git', '-C', ROOT_DIR] + args,
        capture_output=True,
        text=True,
        timeout=timeout,
        encoding='utf-8',
        errors='replace',
    )


def sync_to_github(force_cache: bool = False):
    with GIT_SYNC_LOCK:
        if not os.path.isdir(os.path.join(ROOT_DIR, '.git')):
            LAST_GIT_SYNC.update({'status': 'no-git', 'message': 'Tiada folder .git ditemui'})
            return dict(LAST_GIT_SYNC)

        st = run_git(['status', '--porcelain'])
        if st.returncode != 0:
            LAST_GIT_SYNC.update({'status': 'error', 'message': st.stderr.strip()})
            return dict(LAST_GIT_SYNC)

        lines = [ln.strip() for ln in st.stdout.splitlines() if ln.strip()]
        if not lines:
            return dict(LAST_GIT_SYNC)

        changed_files = [ln[3:].strip().strip('"') for ln in lines if len(ln) > 3]
        non_cache_files = [f for f in changed_files if f.replace('\\', '/') != 'js/live-news-cache.json']

        # Skip background commit if only live-news-cache.json timestamp changed and not forced
        if not non_cache_files and not force_cache:
            return dict(LAST_GIT_SYNC)

        # Brief debounce so multi-file edits settle before staging
        if non_cache_files and not force_cache:
            time.sleep(2)

        run_git(['add', '-A'])
        st_after = run_git(['status', '--porcelain'])
        lines_after = [ln.strip() for ln in st_after.stdout.splitlines() if ln.strip()]
        if not lines_after:
            return dict(LAST_GIT_SYNC)

        short_names = [os.path.basename(ln[3:].strip().strip('"')) for ln in lines_after[:4]]
        commit_msg = f"auto-sync: kemas kini {', '.join(short_names)}"
        cm = run_git(['commit', '-m', commit_msg])
        if cm.returncode != 0 and 'nothing to commit' not in (cm.stdout + cm.stderr).lower():
            LAST_GIT_SYNC.update({'status': 'error', 'message': cm.stderr.strip() or cm.stdout.strip()})
            return dict(LAST_GIT_SYNC)

        # Pull latest remote commits safely (in case GitHub Actions updated live-news-cache.json)
        pl = run_git(['pull', '--rebase', '--autostash', 'origin', 'main'], timeout=45)
        if pl.returncode != 0:
            run_git(['rebase', '--abort'])
            run_git(['fetch', 'origin', 'main'], timeout=30)
            run_git(['merge', '-X', 'ours', 'origin/main', '-m', 'chore: merge remote origin/main'])

        ps = run_git(['push', 'origin', 'main'], timeout=60)
        now_label = datetime.datetime.now().strftime('%d/%m/%Y %H:%M:%S MYT')
        rev = run_git(['rev-parse', '--short', 'HEAD'])
        short_sha = rev.stdout.strip() if rev.returncode == 0 else ''

        if ps.returncode == 0:
            LAST_GIT_SYNC.update({
                'status': 'ok',
                'lastSyncLabel': now_label,
                'lastCommit': short_sha,
                'message': commit_msg,
            })
            print(f'[PERMAS GitHub Auto-Sync] Pushed {short_sha} ({commit_msg}) at {now_label}')
        else:
            LAST_GIT_SYNC.update({
                'status': 'error',
                'lastSyncLabel': now_label,
                'lastCommit': short_sha,
                'message': ps.stderr.strip() or ps.stdout.strip(),
            })
        return dict(LAST_GIT_SYNC)


def background_git_auto_sync():
    while True:
        try:
            sync_to_github(force_cache=False)
        except Exception as exc:
            print(f'[PERMAS GitHub Auto-Sync] Error: {exc}', file=sys.stderr)
        time.sleep(GIT_SYNC_INTERVAL_SECONDS)


def handle_submit_aduan(data: dict) -> dict:
    if not isinstance(data, dict):
        raise ValueError('Format aduan tidak sah')

    now_my = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8)))
    ref_id = str(data.get('refId') or f"PERMAS/ADUAN/{now_my.strftime('%Y%m%d-%H%M%S')}").strip()
    record = {
        'refId': ref_id,
        'submittedAt': now_my.isoformat(),
        'submittedLabel': now_my.strftime('%d/%m/%Y %H:%M MYT'),
        'nama': str(data.get('nama', '')).strip(),
        'ic': str(data.get('ic', '')).strip(),
        'ipt': str(data.get('ipt', '')).strip(),
        'tel': str(data.get('tel', '')).strip(),
        'daerah': str(data.get('daerah', '')).strip(),
        'kategori': str(data.get('kategori', '')).strip(),
        'sulit': str(data.get('sulit', '')).strip(),
        'tajuk': str(data.get('tajuk', '')).strip(),
        'priority': str(data.get('priority', '')).strip(),
        'bureau': str(data.get('bureau', '')).strip(),
        'aiReportText': str(data.get('aiReportText', '')).strip(),
    }
    if not record['nama'] or not record['tajuk']:
        raise ValueError('Nama dan tajuk aduan diperlukan')

    with ADUAN_LOCK:
        existing = []
        if os.path.exists(ADUAN_LOG_PATH):
            try:
                with open(ADUAN_LOG_PATH, 'r', encoding='utf-8') as f:
                    loaded = json.load(f)
                    if isinstance(loaded, list):
                        existing = loaded
            except Exception:
                existing = []
        existing.insert(0, record)
        os.makedirs(os.path.dirname(ADUAN_LOG_PATH), exist_ok=True)
        tmp_path = ADUAN_LOG_PATH + '.tmp'
        with open(tmp_path, 'w', encoding='utf-8') as f:
            json.dump(existing[:200], f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, ADUAN_LOG_PATH)

    email_sent = False
    email_detail = ''
    relay_payload = json.dumps({
        '_subject': f"[E-Aduan AI PERMAS] {record['refId']} | {record['kategori']} - {record['tajuk']}",
        '_template': 'box',
        '_captcha': 'false',
        'No_Rujukan': record['refId'],
        'Keutamaan_AI': record['priority'],
        'Biro_Bertanggungjawab': record['bureau'],
        'Nama_Pengadu': record['nama'],
        'Universiti_IPT': record['ipt'],
        'No_Telefon_WhatsApp': record['tel'],
        'Daerah_Selangor': record['daerah'],
        'Status_Kerahsiaan': record['sulit'],
        'Laporan_Penuh_Janaan_AI': record['aiReportText'],
    }).encode('utf-8')

    try:
        ctx = ssl._create_unverified_context()
        req = urllib.request.Request(
            'https://formsubmit.co/ajax/permasnasionalofficial@gmail.com',
            data=relay_payload,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'https://arifkhumainipro-beep.github.io',
                'Referer': 'https://arifkhumainipro-beep.github.io/permas/aduan.html',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            method='POST',
        )
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            resp_data = json.loads(resp.read().decode('utf-8', errors='replace'))
            succ = str(resp_data.get('success', '')).lower()
            msg = str(resp_data.get('message', '')).strip()
            email_sent = succ == 'true'
            email_detail = msg or ('Dihantar ke permasnasionalofficial@gmail.com' if email_sent else 'Perlu pengaktifan FormSubmit')
    except Exception as exc:
        email_detail = f'Relay emel tidak dapat dihubungi ({exc})'

    return {
        'status': 'ok',
        'savedLocally': True,
        'emailSent': email_sent,
        'emailDetail': email_detail,
        'refId': ref_id,
    }


class PermasRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/live-news':
            qs = urllib.parse.parse_qs(parsed.query)
            force_refresh = qs.get('refresh', ['0'])[0] == '1'
            payload = refresh_cache(force=force_refresh)
            body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if parsed.path == '/api/git-sync':
            qs = urllib.parse.parse_qs(parsed.query)
            force_sync = qs.get('force', ['0'])[0] == '1'
            payload = sync_to_github(force_cache=force_sync)
            self._send_json(200, payload)
            return

        if parsed.path == '/api/sync-drive-photos':
            qs = urllib.parse.parse_qs(parsed.query)
            force_sync = qs.get('force', ['0'])[0] == '1'
            payload = sync_drive_mt_photos(force=force_sync)
            self._send_json(200, payload)
            return

        super().do_GET()

    def _send_json(self, status_code: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/upload-leader-photo':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                raw = self.rfile.read(length).decode('utf-8')
                data = json.loads(raw)
                leader_id = str(data.get('id', '')).strip()
                data_url = str(data.get('dataUrl', '')).strip()
                if not re.fullmatch(r'[a-z0-9-]+', leader_id) or ',' not in data_url:
                    raise ValueError('Invalid leader id or image data')
                b64_part = data_url.split(',', 1)[1]
                img_bytes = base64.b64decode(b64_part)
                ahli_dir = os.path.join(ROOT_DIR, 'assets', 'ahli')
                os.makedirs(ahli_dir, exist_ok=True)
                rel_path = f'assets/ahli/{leader_id}.jpg'
                out_path = os.path.join(ahli_dir, f'{leader_id}.jpg')
                with open(out_path, 'wb') as f:
                    f.write(img_bytes)
                self._send_json(200, {'status': 'ok', 'id': leader_id, 'path': rel_path})
            except Exception as exc:
                self._send_json(400, {'status': 'error', 'message': str(exc)})
            return

        if parsed.path == '/api/submit-aduan':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                raw = self.rfile.read(length).decode('utf-8')
                data = json.loads(raw)
                resp = handle_submit_aduan(data)
                self._send_json(200, resp)
            except Exception as exc:
                self._send_json(400, {'status': 'error', 'message': str(exc)})
            return

        self.send_error(404)

    def log_message(self, format, *args):
        # Keep console logs clean
        pass


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    parser = argparse.ArgumentParser(description='PERMAS Nasional News Aggregator & HTTP Server')
    parser.add_argument('--fetch-once', action='store_true', help='Fetch live RSS once into cache and exit')
    parser.add_argument('--sync-once', action='store_true', help='Auto-commit and push pending changes to GitHub once and exit')
    args = parser.parse_args()

    if args.fetch_once:
        payload = refresh_cache(force=True)
        print(f"Fetched {payload.get('total', 0)} articles ({payload.get('selangorCount', 0)} Selangor) -> {CACHE_PATH}")
        for art in payload.get('articles', [])[:8]:
            tag = '[SELANGOR]' if art['isSelangor'] else '[MALAYSIA]'
            print(f"  - {art['dateShort']} {tag} | {art['source']} | {art['title']}")
        drive_res = sync_drive_mt_photos(force=False)
        print(f"Drive MT photos: {len(drive_res.get('existingIds', []))} ready ({', '.join(drive_res.get('existingIds', []))})")
        return

    if args.sync_once:
        res = sync_to_github(force_cache=True)
        print(json.dumps(res, ensure_ascii=False))
        return

    updater = threading.Thread(target=background_news_updater, daemon=True)
    updater.start()

    git_sync_thread = threading.Thread(target=background_git_auto_sync, daemon=True)
    git_sync_thread.start()

    server = ThreadingHTTPServer(('', PORT), PermasRequestHandler)
    print(f'PERMAS Portal, Live News & GitHub Auto-Sync Server running at http://localhost:{PORT}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == '__main__':
    main()
