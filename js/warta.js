/* PERMAS NASIONAL — WARTA DIGITAL BROADSHEET & EDITORIAL STUDIO
   Handles fetching, broadsheet newspaper rendering, full article reading,
   multi-photo upload/compression, and static/server persistence.
*/
(function () {
  const STATIC_STORAGE_KEY = 'permas_warta_static_v1';
  const PAPER_MODE_KEY = 'permas_warta_paper_mode';

  const state = {
    edition: 'Jilid I • Bil. 01/2026',
    updatedLabel: '19 November 2026',
    articles: [],
    category: 'all',
    query: '',
    paperMode: 'classic',
    serverAvailable: false,
    usingStaticFallback: false,
    editingId: '',
    coverDataUrl: '',
    existingCoverUrl: '',
    galleryDraft: [], // [{ url, dataUrl, caption }]
    activeReaderId: '',
  };

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function todayIso() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const MALAY_MONTHS = [
    '', 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
  ];

  function formatMalayDate(iso) {
    const m = String(iso || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) {
      const d = new Date();
      return `${d.getDate()} ${MALAY_MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`;
    }
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    return `${day} ${MALAY_MONTHS[month] || ''} ${year}`.trim();
  }

  function splitParagraphs(body) {
    const raw = String(body || '').trim();
    if (!raw) return [];
    const blocks = raw.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    if (blocks.length > 1) return blocks;
    return raw.split(/\n/).map(s => s.trim()).filter(Boolean);
  }

  function renderParagraphsHtml(body, withDropCap) {
    const paras = splitParagraphs(body);
    return paras.map((p, idx) => {
      const cls = withDropCap && idx === 0
        ? 'broadsheet-dropcap font-newsbody paper-ink text-[15.5px] sm:text-base leading-[1.72] mb-3.5 text-justify'
        : 'font-newsbody paper-ink text-[15px] sm:text-[15.5px] leading-[1.72] mb-3.5 text-justify';
      return `<p class="${cls}">${esc(p)}</p>`;
    }).join('');
  }

  function slugify(text) {
    const clean = String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
    return `${clean || 'program'}-${Date.now().toString().slice(-6)}`;
  }

  function showToast(msg, isError) {
    let el = document.getElementById('warta-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'warta-toast';
      el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[140] px-4 py-3 rounded-xl text-xs font-bold shadow-2xl border backdrop-blur-md transition-all duration-300 max-w-[92vw] text-center no-print';
      document.body.appendChild(el);
    }
    el.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[140] px-4 py-3 rounded-xl text-xs font-bold shadow-2xl border backdrop-blur-md transition-all duration-300 max-w-[92vw] text-center no-print ${
      isError
        ? 'bg-red-950/95 border-red-500/60 text-red-100'
        : 'bg-slate-900/95 border-amber-400/60 text-amber-200'
    }`;
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, 0)';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%, 10px)';
    }, 4200);
  }

  async function compressImageFile(file, maxW = 1400, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Sila pilih fail gambar (JPG, PNG atau WebP).'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Gagal membaca fail gambar.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Gambar tidak sah atau rosak.'));
        img.onload = () => {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function loadLocalStaticEdits() {
    try {
      const raw = localStorage.getItem(STATIC_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.articles)) return parsed;
    } catch (e) {}
    return null;
  }

  function saveLocalStaticEdits() {
    try {
      localStorage.setItem(STATIC_STORAGE_KEY, JSON.stringify({
        edition: state.edition,
        updatedLabel: state.updatedLabel,
        articles: state.articles,
      }));
    } catch (e) {}
  }

  async function loadWartaArticles() {
    // 1. Try local server API first
    try {
      const res = await fetch('/api/warta?t=' + Date.now(), { cache: 'no-store' });
      const ctype = (res.headers.get('content-type') || '').toLowerCase();
      if (res.ok && ctype.includes('application/json')) {
        const payload = await res.json();
        if (payload && Array.isArray(payload.articles)) {
          state.serverAvailable = true;
          state.edition = payload.edition || state.edition;
          state.updatedLabel = payload.updatedLabel || state.updatedLabel;
          state.articles = payload.articles;
          return state;
        }
      }
    } catch (e) {}

    // 2. Fallback to static JSON file (GitHub Pages / file server without API)
    state.serverAvailable = false;
    try {
      const res2 = await fetch('js/warta-data.json?t=' + Date.now(), { cache: 'no-store' });
      if (res2.ok) {
        const payload2 = await res2.json();
        if (payload2 && Array.isArray(payload2.articles)) {
          state.edition = payload2.edition || state.edition;
          state.updatedLabel = payload2.updatedLabel || state.updatedLabel;
          state.articles = payload2.articles;
        }
      }
    } catch (e) {}

    // Merge localStorage static edits if present
    const localSaved = loadLocalStaticEdits();
    if (localSaved && localSaved.articles.length > 0) {
      state.usingStaticFallback = true;
      state.articles = localSaved.articles;
      state.updatedLabel = localSaved.updatedLabel || state.updatedLabel;
    }
    return state;
  }

  function getFilteredArticles() {
    const q = state.query.trim().toLowerCase();
    return state.articles.filter(a => {
      const catMatch = state.category === 'all' || String(a.category || '') === state.category;
      if (!catMatch) return false;
      if (!q) return true;
      const hay = `${a.title} ${a.subtitle} ${a.location} ${a.author} ${a.category} ${a.body}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function updateMastheadMeta() {
    const edEl = document.getElementById('warta-masthead-edition');
    const dateEl = document.getElementById('warta-masthead-date');
    const countEl = document.getElementById('warta-masthead-count');
    if (edEl) edEl.textContent = state.edition || 'Jilid I • Bil. 01/2026';
    if (dateEl) dateEl.textContent = `Kemaskini: ${state.updatedLabel || formatMalayDate(todayIso())}`;
    if (countEl) countEl.textContent = `${state.articles.length} Laporan Program Terlaksana`;

    const exportBtn = document.getElementById('warta-export-json-btn');
    if (exportBtn) {
      exportBtn.classList.toggle('hidden', state.serverAvailable && !state.usingStaticFallback);
    }
  }

  function renderWartaBroadsheet() {
    updateMastheadMeta();
    const fpEl = document.getElementById('warta-frontpage');
    const archEl = document.getElementById('warta-archive-grid');
    const archWrap = document.getElementById('warta-archive-section');
    const archCount = document.getElementById('warta-archive-count');
    if (!fpEl) return;

    const list = getFilteredArticles();
    if (!list.length) {
      fpEl.innerHTML = `
        <div class="lg:col-span-12 py-14 px-6 text-center paper-card rounded-2xl border">
          <p class="font-editorial text-2xl font-bold paper-ink">Tiada Laporan Ditemui</p>
          <p class="font-newsbody paper-muted text-sm mt-2 max-w-md mx-auto">
            Cuba ubah kata kunci carian atau pilih kategori lain, atau klik butang muat naik untuk menerbitkan program baharu PERMAS Nasional.
          </p>
          <button onclick="openWartaEditor()" class="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold shadow-sm transition">
            + Muat Naik Program Baharu
          </button>
        </div>`;
      if (archWrap) archWrap.classList.add('hidden');
      return;
    }

    // Pick Lead Story (explicit featured when in 'all' & no search, else first match)
    let leadIdx = 0;
    if (state.category === 'all' && !state.query.trim()) {
      const fIdx = list.findIndex(a => a.featured);
      if (fIdx >= 0) leadIdx = fIdx;
    }
    const lead = list[leadIdx];
    const others = list.filter((_, i) => i !== leadIdx);
    const sideStories = others.slice(0, 3);
    const archiveStories = others.slice(3);

    const leadParas = splitParagraphs(lead.body);
    const leadExcerpt = leadParas.slice(0, 2).join('\n\n');
    const leadGalCount = Array.isArray(lead.gallery) ? lead.gallery.length : 0;

    const leadHtml = `
      <div class="lg:col-span-8 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 border border-current text-[10px] font-extrabold uppercase tracking-widest paper-accent">
            ★ Laporan Utama &bull; ${esc(lead.category)}
          </span>
          <span class="text-[11px] font-mono uppercase tracking-wider paper-muted">
            ${esc(lead.location)} &bull; ${esc(lead.dateLabel)}
          </span>
        </div>

        <h2 onclick="openWartaReader('${esc(lead.id)}')" class="font-editorial font-black text-2xl sm:text-4xl lg:text-[40px] leading-[1.08] paper-ink hover:underline cursor-pointer">
          ${esc(lead.title)}
        </h2>

        ${lead.subtitle ? `
          <p class="font-newsbody italic text-base sm:text-lg leading-relaxed paper-muted">
            ${esc(lead.subtitle)}
          </p>
        ` : ''}

        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 pb-2 border-b broadsheet-hairline text-[11px] paper-muted font-medium">
          <span>Oleh <strong class="paper-ink">${esc(lead.author || 'Sekretariat PERMAS Nasional')}</strong></span>
          <span>Diterbitkan dalam Warta Digital PERMAS</span>
        </div>

        <figure class="paper-photo-frame border p-2 sm:p-2.5 cursor-pointer group" onclick="openWartaReader('${esc(lead.id)}')">
          <div class="relative overflow-hidden aspect-[16/9] bg-slate-900">
            <img src="${esc(lead.imageUrl)}" alt="${esc(lead.title)}" class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500">
            ${leadGalCount > 0 ? `
              <span class="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded bg-black/75 text-white text-[10px] font-bold tracking-wide">
                📷 +${leadGalCount} Foto Program
              </span>
            ` : ''}
          </div>
          ${lead.caption ? `
            <figcaption class="mt-2 px-1 text-[11.5px] font-newsbody italic paper-muted leading-snug">
              <strong>FOTO:</strong> ${esc(lead.caption)}
            </figcaption>
          ` : ''}
        </figure>

        <div class="broadsheet-columns pt-1">
          ${renderParagraphsHtml(leadExcerpt, true)}
        </div>

        <div class="pt-3 border-t broadsheet-hairline flex flex-wrap items-center justify-between gap-2 no-print">
          <button onclick="openWartaReader('${esc(lead.id)}')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white text-xs font-bold transition shadow-xs">
            Baca Laporan Penuh &amp; Galeri →
          </button>
          <div class="flex items-center gap-2">
            <button onclick="openWartaEditor('${esc(lead.id)}')" class="px-3 py-1.5 rounded-lg border broadsheet-hairline text-xs font-bold paper-ink hover:opacity-80 transition">
              ✏️ Sunting
            </button>
            <button onclick="confirmDeleteWarta('${esc(lead.id)}')" class="px-3 py-1.5 rounded-lg border border-red-400/50 text-xs font-bold paper-accent hover:bg-red-500/10 transition">
              🗑️ Padam
            </button>
          </div>
        </div>
      </div>
    `;

    const sideHtml = `
      <aside class="lg:col-span-4 broadsheet-sidebar-rule flex flex-col justify-between gap-6">
        <div>
          <div class="pb-2 mb-4 border-b-2 broadsheet-hairline flex items-center justify-between">
            <h3 class="font-editorial font-extrabold text-sm uppercase tracking-widest paper-accent">
              Sorotan Program Terkini
            </h3>
            <span class="text-[10px] font-mono uppercase paper-muted">Muka 1</span>
          </div>

          <div class="space-y-5">
            ${sideStories.length ? sideStories.map((art, i) => `
              <article class="${i > 0 ? 'pt-4 border-t broadsheet-hairline' : ''} group">
                <div class="flex gap-3.5 items-start">
                  <div onclick="openWartaReader('${esc(art.id)}')" class="w-24 h-20 shrink-0 paper-photo-frame border p-0.5 cursor-pointer overflow-hidden">
                    <img src="${esc(art.imageUrl)}" alt="${esc(art.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  </div>
                  <div class="min-w-0 flex-1">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider paper-accent block">
                      ${esc(art.category)}
                    </span>
                    <h4 onclick="openWartaReader('${esc(art.id)}')" class="font-editorial font-bold text-base leading-snug paper-ink hover:underline cursor-pointer mt-0.5">
                      ${esc(art.title)}
                    </h4>
                    <p class="text-[10.5px] font-mono paper-muted mt-1">
                      ${esc(art.dateLabel)} &bull; ${esc(art.location)}
                    </p>
                  </div>
                </div>
                <p class="font-newsbody text-xs paper-muted leading-relaxed mt-2 line-clamp-2">
                  ${esc(art.subtitle || splitParagraphs(art.body)[0] || '')}
                </p>
                <div class="mt-2 flex items-center justify-between text-[11px] no-print">
                  <button onclick="openWartaReader('${esc(art.id)}')" class="font-bold paper-accent hover:underline">
                    Baca Penuh →
                  </button>
                  <div class="flex items-center gap-2 paper-muted">
                    <button onclick="openWartaEditor('${esc(art.id)}')" class="hover:underline font-semibold">Sunting</button>
                    <span>•</span>
                    <button onclick="confirmDeleteWarta('${esc(art.id)}')" class="hover:underline font-semibold paper-accent">Padam</button>
                  </div>
                </div>
              </article>
            `).join('') : `
              <p class="font-newsbody italic text-xs paper-muted">
                Muat naik lebih banyak program untuk memenuhi ruangan sorotan sisi akhbar.
              </p>
            `}
          </div>
        </div>

        <!-- Editorial Note / Motto Box -->
        <div class="paper-card border p-4 rounded-xl space-y-2">
          <p class="text-[10px] font-extrabold uppercase tracking-widest paper-gold">
            Nota Sidang Pengarang
          </p>
          <p class="font-newsbody italic text-xs leading-relaxed paper-ink">
            &ldquo;KITA SISWA SELANGOR — PERMAS Proaktif, Selangor Progresif. Setiap program dan misi kebajikan direkodkan sebagai rujukan rasmi mahasiswa anak Selangor.&rdquo;
          </p>
          <button onclick="openWartaEditor()" class="no-print w-full mt-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition">
            + Tambah Berita Program Baharu
          </button>
        </div>
      </aside>
    `;

    fpEl.innerHTML = leadHtml + sideHtml;

    if (archWrap && archEl) {
      if (archiveStories.length > 0) {
        archWrap.classList.remove('hidden');
        if (archCount) archCount.textContent = `${archiveStories.length} Edisi Arkib`;
        archEl.innerHTML = archiveStories.map(art => {
          const galLen = Array.isArray(art.gallery) ? art.gallery.length : 0;
          return `
            <article class="flex flex-col justify-between pb-6 border-b broadsheet-hairline lg:border-b-0 lg:pr-5 lg:border-r lg:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n)]:pr-0 group">
              <div>
                <div onclick="openWartaReader('${esc(art.id)}')" class="relative paper-photo-frame border p-1 cursor-pointer mb-3 overflow-hidden">
                  <div class="aspect-[16/10] overflow-hidden bg-slate-900">
                    <img src="${esc(art.imageUrl)}" alt="${esc(art.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                  </div>
                  ${galLen > 0 ? `
                    <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-bold">
                      +${galLen} Foto
                    </span>
                  ` : ''}
                </div>
                <div class="flex items-center justify-between gap-2 text-[10px] font-mono uppercase paper-muted mb-1">
                  <span class="font-sans font-extrabold paper-accent">${esc(art.category)}</span>
                  <span>${esc(art.dateLabel)}</span>
                </div>
                <h4 onclick="openWartaReader('${esc(art.id)}')" class="font-editorial font-extrabold text-lg leading-snug paper-ink hover:underline cursor-pointer">
                  ${esc(art.title)}
                </h4>
                <p class="font-newsbody text-xs paper-muted leading-relaxed mt-1.5 line-clamp-3">
                  ${esc(art.subtitle || splitParagraphs(art.body)[0] || '')}
                </p>
              </div>
              <div class="pt-3 mt-3 border-t broadsheet-hairline flex items-center justify-between text-[11px] no-print">
                <button onclick="openWartaReader('${esc(art.id)}')" class="font-bold paper-accent hover:underline">
                  Baca Artikel →
                </button>
                <div class="flex items-center gap-2 paper-muted">
                  <button onclick="openWartaEditor('${esc(art.id)}')" class="font-semibold hover:underline">Sunting</button>
                  <span>•</span>
                  <button onclick="confirmDeleteWarta('${esc(art.id)}')" class="font-semibold paper-accent hover:underline">Padam</button>
                </div>
              </div>
            </article>
          `;
        }).join('');
      } else {
        archWrap.classList.add('hidden');
      }
    }
  }

  function applyPaperMode(mode) {
    state.paperMode = mode === 'dark' ? 'dark' : 'classic';
    try { localStorage.setItem(PAPER_MODE_KEY, state.paperMode); } catch (e) {}
    const targets = [
      document.getElementById('warta-broadsheet'),
      document.getElementById('warta-reader-sheet'),
    ];
    targets.forEach(el => {
      if (!el) return;
      el.classList.toggle('paper-classic', state.paperMode === 'classic');
      el.classList.toggle('paper-dark', state.paperMode === 'dark');
    });
    const btnClassic = document.getElementById('paper-mode-classic');
    const btnDark = document.getElementById('paper-mode-dark');
    if (btnClassic && btnDark) {
      btnClassic.className = state.paperMode === 'classic'
        ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-950 border border-amber-400 shadow-xs transition whitespace-nowrap'
        : 'px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800/60 text-slate-300 border border-slate-700 hover:bg-slate-800 transition whitespace-nowrap';
      btnDark.className = state.paperMode === 'dark'
        ? 'px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-amber-300 border border-amber-400/60 shadow-xs transition whitespace-nowrap'
        : 'px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition whitespace-nowrap';
    }
  }

  window.setWartaPaperMode = applyPaperMode;

  window.filterWartaCategory = function (cat) {
    state.category = cat || 'all';
    document.querySelectorAll('.warta-cat-btn').forEach(btn => {
      const active = btn.getAttribute('data-cat') === state.category;
      btn.className = active
        ? 'warta-cat-btn px-3.5 py-2 rounded-xl text-xs font-bold bg-red-800 text-white shadow-xs transition whitespace-nowrap shrink-0'
        : 'warta-cat-btn px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition whitespace-nowrap shrink-0';
    });
    renderWartaBroadsheet();
  };

  window.onWartaSearch = function (val) {
    state.query = val || '';
    renderWartaBroadsheet();
  };

  window.openWartaReader = function (id) {
    const art = state.articles.find(a => a.id === id);
    if (!art) return;
    state.activeReaderId = id;
    const modal = document.getElementById('warta-reader-modal');
    if (!modal) return;

    document.getElementById('reader-kicker').textContent = art.category || 'Warta PERMAS';
    document.getElementById('reader-dateline').textContent = `${art.location || 'Selangor'} • ${art.dateLabel || ''}`;
    document.getElementById('reader-title').textContent = art.title || '';
    const subEl = document.getElementById('reader-subtitle');
    subEl.textContent = art.subtitle || '';
    subEl.classList.toggle('hidden', !art.subtitle);
    document.getElementById('reader-author').textContent = `Oleh ${art.author || 'Biro Komunikasi Korporat PERMAS'}`;

    const setMainPhoto = (url, caption) => {
      document.getElementById('reader-main-img').src = url || 'assets/images/campus_life.jpg';
      const capEl = document.getElementById('reader-main-caption');
      if (caption) {
        capEl.textContent = `FOTO: ${caption}`;
        capEl.classList.remove('hidden');
      } else {
        capEl.classList.add('hidden');
      }
    };
    setMainPhoto(art.imageUrl, art.caption);

    const allPhotos = [{ url: art.imageUrl, caption: art.caption || art.title }]
      .concat(Array.isArray(art.gallery) ? art.gallery : [])
      .filter(p => p && p.url);

    const galStrip = document.getElementById('reader-gallery-strip');
    if (allPhotos.length > 1) {
      galStrip.classList.remove('hidden');
      galStrip.innerHTML = allPhotos.map((p, idx) => `
        <button type="button" data-idx="${idx}" class="warta-reader-thumb shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 ${idx === 0 ? 'border-red-700 ring-2 ring-red-400/50' : 'border-transparent opacity-80 hover:opacity-100'} transition">
          <img src="${esc(p.url)}" alt="${esc(p.caption)}" class="w-full h-full object-cover">
        </button>
      `).join('');
      galStrip.querySelectorAll('.warta-reader-thumb').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-idx'));
          const chosen = allPhotos[i];
          if (chosen) setMainPhoto(chosen.url, chosen.caption);
          galStrip.querySelectorAll('.warta-reader-thumb').forEach((b, bi) => {
            b.className = `warta-reader-thumb shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 ${bi === i ? 'border-red-700 ring-2 ring-red-400/50' : 'border-transparent opacity-80 hover:opacity-100'} transition`;
          });
        });
      });
    } else {
      galStrip.classList.add('hidden');
      galStrip.innerHTML = '';
    }

    document.getElementById('reader-body').innerHTML = renderParagraphsHtml(art.body, true);

    const shareUrl = `${window.location.origin}${window.location.pathname}#artikel=${encodeURIComponent(art.id)}`;
    const waHref = `https://wa.me/?text=${encodeURIComponent(`*WARTA DIGITAL PERMAS NASIONAL*\n*${art.title}*\n(${art.dateLabel} • ${art.location})\n\n${shareUrl}`)}`;
    const waBtn = document.getElementById('reader-wa-btn');
    if (waBtn) waBtn.href = waHref;

    const editBtn = document.getElementById('reader-edit-btn');
    if (editBtn) editBtn.onclick = () => { closeWartaReader(); openWartaEditor(art.id); };

    modal.classList.remove('hidden');
    applyPaperMode(state.paperMode);
    if (history.replaceState) {
      history.replaceState(null, '', '#artikel=' + encodeURIComponent(art.id));
    }
  };

  window.closeWartaReader = function () {
    const modal = document.getElementById('warta-reader-modal');
    if (modal) modal.classList.add('hidden');
    if (window.location.hash.startsWith('#artikel=') && history.replaceState) {
      history.replaceState(null, '', window.location.pathname);
    }
  };

  function renderGalleryDraftUI() {
    const box = document.getElementById('ed-gallery-preview');
    if (!box) return;
    if (!state.galleryDraft.length) {
      box.innerHTML = `<p class="text-[11px] text-slate-400">Tiada foto tambahan lagi. Anda boleh pilih berbilang foto program di atas (maksimum 6 foto).</p>`;
      return;
    }
    box.innerHTML = state.galleryDraft.map((item, idx) => `
      <div class="flex items-center gap-3 p-2 rounded-xl border border-slate-200 bg-slate-50/70">
        <img src="${esc(item.dataUrl || item.url)}" class="w-16 h-12 rounded-lg object-cover shrink-0">
        <input type="text" data-gidx="${idx}" value="${esc(item.caption)}" placeholder="Kapsyen ringkas foto #${idx + 1}..." class="ed-gal-cap flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 outline-none focus:border-red-600">
        <button type="button" onclick="removeWartaGalleryDraft(${idx})" class="px-2 py-1 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50">Buang</button>
      </div>
    `).join('');
    box.querySelectorAll('.ed-gal-cap').forEach(inp => {
      inp.addEventListener('input', () => {
        const i = Number(inp.getAttribute('data-gidx'));
        if (state.galleryDraft[i]) state.galleryDraft[i].caption = inp.value;
      });
    });
  }

  window.removeWartaGalleryDraft = function (idx) {
    state.galleryDraft.splice(idx, 1);
    renderGalleryDraftUI();
  };

  window.openWartaEditor = function (editId = '') {
    const modal = document.getElementById('warta-editor-modal');
    if (!modal) return;
    const form = document.getElementById('warta-editor-form');
    form.reset();

    state.editingId = editId || '';
    state.coverDataUrl = '';
    state.existingCoverUrl = '';
    state.galleryDraft = [];

    const existing = editId ? state.articles.find(a => a.id === editId) : null;
    document.getElementById('editor-modal-title').textContent = existing
      ? 'Sunting Artikel Warta Digital'
      : 'Terbitkan Berita Program Baharu';

    if (existing) {
      document.getElementById('ed-title').value = existing.title || '';
      document.getElementById('ed-subtitle').value = existing.subtitle || '';
      document.getElementById('ed-category').value = existing.category || 'Kepimpinan & Wacana';
      document.getElementById('ed-date').value = existing.date || todayIso();
      document.getElementById('ed-location').value = existing.location || '';
      document.getElementById('ed-author').value = existing.author || '';
      document.getElementById('ed-caption').value = existing.caption || '';
      document.getElementById('ed-body').value = existing.body || '';
      document.getElementById('ed-featured').checked = Boolean(existing.featured);
      state.existingCoverUrl = existing.imageUrl || '';
      state.galleryDraft = (Array.isArray(existing.gallery) ? existing.gallery : []).map(g => ({
        url: g.url || '',
        dataUrl: '',
        caption: g.caption || '',
      }));
    } else {
      document.getElementById('ed-date').value = todayIso();
      document.getElementById('ed-author').value = 'Biro Komunikasi Korporat PERMAS';
      document.getElementById('ed-featured').checked = true;
    }

    const previewImg = document.getElementById('ed-cover-preview');
    const placeholder = document.getElementById('ed-cover-placeholder');
    if (state.existingCoverUrl) {
      previewImg.src = state.existingCoverUrl;
      previewImg.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      previewImg.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }
    renderGalleryDraftUI();
    modal.classList.remove('hidden');
  };

  window.closeWartaEditor = function () {
    const modal = document.getElementById('warta-editor-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.confirmDeleteWarta = async function (id) {
    const art = state.articles.find(a => a.id === id);
    if (!art) return;
    if (!window.confirm(`Padam laporan "${art.title}" daripada Warta Digital?`)) return;

    let deletedOnServer = false;
    if (state.serverAvailable) {
      try {
        const res = await fetch('/api/warta/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          const payload = await res.json();
          if (payload.data && Array.isArray(payload.data.articles)) {
            state.articles = payload.data.articles;
            state.updatedLabel = payload.data.updatedLabel || state.updatedLabel;
            deletedOnServer = true;
          }
        }
      } catch (e) {}
    }

    if (!deletedOnServer) {
      state.articles = state.articles.filter(a => a.id !== id);
      if (state.articles.length && !state.articles.some(a => a.featured)) {
        state.articles[0].featured = true;
      }
      state.updatedLabel = formatMalayDate(todayIso());
      state.usingStaticFallback = true;
      saveLocalStaticEdits();
    }

    renderWartaBroadsheet();
    showToast('Artikel program telah dipadam daripada Warta Digital.');
  };

  window.exportWartaJson = function () {
    const payload = {
      edition: state.edition,
      updatedLabel: state.updatedLabel,
      articles: state.articles,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'warta-data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Fail warta-data.json telah dimuat turun untuk simpanan/kemaskini repo.');
  };

  async function handleEditorSubmit(ev) {
    ev.preventDefault();
    const title = document.getElementById('ed-title').value.trim();
    const subtitle = document.getElementById('ed-subtitle').value.trim();
    const category = document.getElementById('ed-category').value.trim();
    const dateIso = document.getElementById('ed-date').value.trim() || todayIso();
    const location = document.getElementById('ed-location').value.trim() || 'Negeri Selangor';
    const author = document.getElementById('ed-author').value.trim() || 'Biro Komunikasi Korporat PERMAS';
    const caption = document.getElementById('ed-caption').value.trim();
    const body = document.getElementById('ed-body').value.trim();
    const featured = document.getElementById('ed-featured').checked;

    if (!title || !body) {
      showToast('Sila isi tajuk dan ayat/isi laporan program.', true);
      return;
    }

    const submitBtn = document.getElementById('ed-submit-btn');
    const origText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Menerbitkan...';

    const payload = {
      id: state.editingId || slugify(title),
      title,
      subtitle,
      category,
      date: dateIso,
      dateLabel: formatMalayDate(dateIso),
      location,
      author,
      caption,
      body,
      featured,
      imageUrl: state.existingCoverUrl || 'assets/images/campus_life.jpg',
      imageDataUrl: state.coverDataUrl || '',
      gallery: state.galleryDraft.slice(0, 6),
    };

    let savedOnServer = false;
    try {
      const res = await fetch('/api/warta/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ctype = (res.headers.get('content-type') || '').toLowerCase();
      if (res.ok && ctype.includes('application/json')) {
        const respData = await res.json();
        if (respData && respData.data && Array.isArray(respData.data.articles)) {
          state.serverAvailable = true;
          state.usingStaticFallback = false;
          state.articles = respData.data.articles;
          state.updatedLabel = respData.data.updatedLabel || state.updatedLabel;
          savedOnServer = true;
        }
      }
    } catch (e) {}

    if (!savedOnServer) {
      // Static browser mode: save locally in browser storage
      const localRecord = {
        id: payload.id,
        title: payload.title,
        subtitle: payload.subtitle,
        category: payload.category,
        date: payload.date,
        dateLabel: payload.dateLabel,
        location: payload.location,
        author: payload.author,
        caption: payload.caption,
        body: payload.body,
        featured: payload.featured,
        imageUrl: payload.imageDataUrl || payload.imageUrl,
        gallery: payload.gallery.map(g => ({
          url: g.dataUrl || g.url,
          caption: g.caption || '',
        })).filter(g => g.url),
        updatedAt: new Date().toISOString(),
      };
      if (localRecord.featured) {
        state.articles.forEach(a => { a.featured = false; });
      }
      const idx = state.articles.findIndex(a => a.id === localRecord.id);
      if (idx >= 0) {
        if (localRecord.featured) {
          state.articles.splice(idx, 1);
          state.articles.unshift(localRecord);
        } else {
          state.articles[idx] = localRecord;
        }
      } else {
        state.articles.unshift(localRecord);
      }
      if (!state.articles.some(a => a.featured) && state.articles.length) {
        state.articles[0].featured = true;
      }
      state.updatedLabel = formatMalayDate(todayIso());
      state.usingStaticFallback = true;
      saveLocalStaticEdits();
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = origText;
    closeWartaEditor();
    renderWartaBroadsheet();
    showToast(
      savedOnServer
        ? 'Berjaya diterbitkan ke Warta Digital PERMAS & sedia disegerak ke GitHub!'
        : 'Disimpan dalam pelayar (Mod Statik). Klik "Eksport JSON" untuk sandaran.'
    );
  }

  function wireEditorInputs() {
    const coverInput = document.getElementById('ed-cover-file');
    const dropZone = document.getElementById('ed-cover-dropzone');
    const previewImg = document.getElementById('ed-cover-preview');
    const placeholder = document.getElementById('ed-cover-placeholder');

    const handleCoverFile = async (file) => {
      if (!file) return;
      try {
        const dataUrl = await compressImageFile(file, 1400, 0.86);
        state.coverDataUrl = dataUrl;
        previewImg.src = dataUrl;
        previewImg.classList.remove('hidden');
        placeholder.classList.add('hidden');
      } catch (err) {
        showToast(err.message || 'Gagal memproses gambar.', true);
      }
    };

    if (coverInput) {
      coverInput.addEventListener('change', () => {
        if (coverInput.files && coverInput.files[0]) handleCoverFile(coverInput.files[0]);
      });
    }
    if (dropZone) {
      dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('border-red-500', 'bg-red-50/30');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-red-500', 'bg-red-50/30');
      });
      dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('border-red-500', 'bg-red-50/30');
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) handleCoverFile(file);
      });
    }

    const galInput = document.getElementById('ed-gallery-files');
    if (galInput) {
      galInput.addEventListener('change', async () => {
        const files = Array.from(galInput.files || []);
        for (const f of files) {
          if (state.galleryDraft.length >= 6) break;
          try {
            const dataUrl = await compressImageFile(f, 1280, 0.84);
            state.galleryDraft.push({ url: '', dataUrl, caption: '' });
          } catch (e) {}
        }
        renderGalleryDraftUI();
        galInput.value = '';
      });
    }

    const form = document.getElementById('warta-editor-form');
    if (form) form.addEventListener('submit', handleEditorSubmit);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeWartaReader();
        closeWartaEditor();
      }
    });
  }

  async function renderHomeWartaPreview() {
    const container = document.getElementById('home-warta-preview');
    if (!container) return;
    await loadWartaArticles();
    if (!state.articles.length) return;

    const leadIdx = Math.max(0, state.articles.findIndex(a => a.featured));
    const lead = state.articles[leadIdx];
    const side = state.articles.filter((_, i) => i !== leadIdx).slice(0, 2);

    container.innerHTML = `
      <div class="broadsheet-paper paper-classic rounded-3xl p-5 sm:p-7 shadow-xl border">
        <div class="broadsheet-double-rule mb-5 text-center py-2">
          <div class="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest paper-muted px-1">
            <span>${esc(state.edition)}</span>
            <span class="font-bold paper-accent">SURAT KHABAR DIGITAL PROGRAM PERMAS</span>
            <span>Kemaskini: ${esc(state.updatedLabel)}</span>
          </div>
          <h3 class="font-editorial font-black text-2xl sm:text-4xl paper-ink tracking-tight mt-1">
            WARTA DIGITAL PERMAS NASIONAL
          </h3>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div class="lg:col-span-7 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono uppercase paper-muted">
              <span class="font-sans font-extrabold paper-accent">${esc(lead.category)}</span>
              <span>${esc(lead.location)} &bull; ${esc(lead.dateLabel)}</span>
            </div>
            <a href="warta.html?v=1#artikel=${encodeURIComponent(lead.id)}" class="block font-editorial font-black text-xl sm:text-3xl leading-tight paper-ink hover:underline">
              ${esc(lead.title)}
            </a>
            <a href="warta.html?v=1#artikel=${encodeURIComponent(lead.id)}" class="block paper-photo-frame border p-1.5 overflow-hidden group">
              <div class="aspect-[16/9] overflow-hidden bg-slate-900">
                <img src="${esc(lead.imageUrl)}" alt="${esc(lead.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              </div>
            </a>
            <p class="broadsheet-dropcap font-newsbody text-sm sm:text-[15px] paper-ink leading-relaxed text-justify">
              ${esc(splitParagraphs(lead.body)[0] || lead.subtitle || '')}
            </p>
            <div class="pt-1">
              <a href="warta.html?v=1#artikel=${encodeURIComponent(lead.id)}" class="inline-flex items-center gap-1.5 text-xs font-extrabold paper-accent hover:underline">
                Baca Edisi Penuh Akhbar →
              </a>
            </div>
          </div>

          <div class="lg:col-span-5 broadsheet-sidebar-rule space-y-4">
            <div class="pb-1.5 border-b broadsheet-hairline flex items-center justify-between">
              <span class="font-editorial font-extrabold text-xs uppercase tracking-widest paper-accent">Berita Program Terlaksana</span>
              <span class="text-[10px] font-mono paper-muted">${state.articles.length} Edisi</span>
            </div>
            ${side.map((art, idx) => `
              <a href="warta.html?v=1#artikel=${encodeURIComponent(art.id)}" class="block ${idx > 0 ? 'pt-3.5 border-t broadsheet-hairline' : ''} group">
                <div class="flex gap-3 items-start">
                  <div class="w-24 h-18 shrink-0 paper-photo-frame border p-0.5 overflow-hidden">
                    <img src="${esc(art.imageUrl)}" alt="${esc(art.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                  </div>
                  <div class="min-w-0 flex-1">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider paper-accent block">${esc(art.category)}</span>
                    <h4 class="font-editorial font-bold text-sm sm:text-base leading-snug paper-ink group-hover:underline mt-0.5">
                      ${esc(art.title)}
                    </h4>
                    <p class="text-[10px] font-mono paper-muted mt-1">${esc(art.dateLabel)} &bull; ${esc(art.location)}</p>
                  </div>
                </div>
              </a>
            `).join('')}

            <div class="paper-card border p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p class="text-[10px] font-extrabold uppercase tracking-wider paper-gold">Meja Sidang Pengarang</p>
                <p class="font-newsbody text-xs paper-muted mt-0.5">Muat naik gambar &amp; laporan program baharu terus ke akhbar.</p>
              </div>
              <a href="warta.html?v=1#upload" class="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white text-[11px] font-bold transition">
                + Muat Naik
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // 1. Homepage preview mode
    if (document.getElementById('home-warta-preview')) {
      await renderHomeWartaPreview();
    }

    // 2. Full Warta Digital Broadsheet mode
    if (document.getElementById('warta-broadsheet')) {
      try {
        const savedMode = localStorage.getItem(PAPER_MODE_KEY);
        if (savedMode === 'dark' || savedMode === 'classic') state.paperMode = savedMode;
      } catch (e) {}
      applyPaperMode(state.paperMode);
      wireEditorInputs();
      await loadWartaArticles();
      renderWartaBroadsheet();

      const h = window.location.hash || '';
      if (h === '#upload') {
        openWartaEditor();
      } else if (h.startsWith('#artikel=')) {
        const targetId = decodeURIComponent(h.slice(9));
        if (targetId) openWartaReader(targetId);
      }
    }
  });
})();
