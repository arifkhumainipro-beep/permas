#!/usr/bin/env python3
"""
PERMAS Nasional - Auto-Updating Local News Aggregator & Static HTTP Server
Fetches real Malaysian & Selangor student news from local media via Google News Malaysia RSS,
maintains js/live-news-cache.json, and serves the portal on port 3000 with no-cache headers.
"""

import argparse
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


def background_news_updater():
    # Initial populate on startup, then periodic auto-update
    refresh_cache(force=True)
    while True:
        time.sleep(AUTO_REFRESH_SECONDS)
        refresh_cache(force=True)


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
            body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        super().do_GET()

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
