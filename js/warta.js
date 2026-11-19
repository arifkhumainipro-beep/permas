/* PERMAS NASIONAL — WARTA DIGITAL BROADSHEET (READ-ONLY EDITORIAL VIEWER)
   Handles fetching, broadsheet newspaper rendering, full article reading,
   gallery photo switching, paper themes, and printing.
*/
(function () {
  const PAPER_MODE_KEY = 'permas_warta_paper_mode';

  const state = {
    edition: 'Jilid I • Bil. 01/2026',
    updatedLabel: '19 November 2026',
    articles: [],
    category: 'all',
    query: '',
    paperMode: 'classic',
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

  const MALAY_MONTHS = [
    '', 'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
  ];

  function formatCurrentMalayDate() {
    const d = new Date();
    return `${d.getDate()} ${MALAY_MONTHS[d.getMonth() + 1] || ''} ${d.getFullYear()}`.trim();
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

  async function loadWartaArticles() {
    try {
      const res = await fetch('/api/warta?t=' + Date.now(), { cache: 'no-store' });
      const ctype = (res.headers.get('content-type') || '').toLowerCase();
      if (res.ok && ctype.includes('application/json')) {
        const payload = await res.json();
        if (payload && Array.isArray(payload.articles)) {
          state.edition = payload.edition || state.edition;
          state.updatedLabel = payload.updatedLabel || state.updatedLabel;
          state.articles = payload.articles;
          return state;
        }
      }
    } catch (e) {}

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
    if (dateEl) dateEl.textContent = `Kemaskini: ${state.updatedLabel || formatCurrentMalayDate()}`;
    if (countEl) countEl.textContent = `${state.articles.length} Laporan Program Terlaksana`;
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
            Cuba ubah kata kunci carian atau pilih kategori lain untuk membaca edisi laporan program PERMAS Nasional.
          </p>
        </div>`;
      if (archWrap) archWrap.classList.add('hidden');
      return;
    }

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
    const leadExcerpt = leadParas.slice(0, 4).join('\n\n');
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

        <figure class="paper-photo-frame border p-2 sm:p-2.5 cursor-pointer group" onclick="openWartaReader('${esc(lead.id)}', 0)">
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

        ${leadGalCount > 0 ? `
          <div class="paper-card border p-2.5 rounded-xl no-print">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-[10px] font-extrabold uppercase tracking-wider paper-accent">
                📷 Lensa Program (${leadGalCount + 1} Gambar Pilihan)
              </span>
              <span class="text-[10px] font-mono paper-muted">Klik gambar untuk zum penuh</span>
            </div>
            <div class="flex items-center gap-2 overflow-x-auto pb-1">
              ${lead.gallery.map((g, gIdx) => `
                <button type="button" onclick="openWartaReader('${esc(lead.id)}', ${gIdx + 1})" class="shrink-0 w-24 h-16 paper-photo-frame border p-0.5 overflow-hidden group hover:border-red-700 transition">
                  <img src="${esc(g.url)}" alt="${esc(g.caption || lead.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="broadsheet-columns pt-1">
          ${renderParagraphsHtml(leadExcerpt, true)}
        </div>

        <div class="pt-3 border-t broadsheet-hairline flex flex-wrap items-center justify-between gap-2 no-print">
          <button onclick="openWartaReader('${esc(lead.id)}')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white text-xs font-bold transition shadow-xs">
            Baca Laporan Penuh &amp; Galeri →
          </button>
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
                <p class="font-newsbody text-xs paper-muted leading-relaxed mt-2 line-clamp-3">
                  ${esc(art.subtitle || splitParagraphs(art.body)[0] || '')}
                </p>
                <div class="mt-2 text-[11px] no-print">
                  <button onclick="openWartaReader('${esc(art.id)}')" class="font-bold paper-accent hover:underline">
                    Baca Penuh →
                  </button>
                </div>
              </article>
            `).join('') : `
              <p class="font-newsbody italic text-xs paper-muted">
                Arkib sorotan program terlaksana akan dipaparkan di ruangan ini.
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
              <div class="pt-3 mt-3 border-t broadsheet-hairline text-[11px] no-print">
                <button onclick="openWartaReader('${esc(art.id)}')" class="font-bold paper-accent hover:underline">
                  Baca Artikel →
                </button>
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

  window.openWartaReader = function (id, startPhotoIdx = 0) {
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

    const allPhotos = [{ url: art.imageUrl, caption: art.caption || art.title }]
      .concat(Array.isArray(art.gallery) ? art.gallery : [])
      .filter(p => p && p.url);

    const activeIdx = Math.max(0, Math.min(Number(startPhotoIdx) || 0, Math.max(0, allPhotos.length - 1)));
    const initialPhoto = allPhotos[activeIdx] || { url: art.imageUrl, caption: art.caption };
    setMainPhoto(initialPhoto.url, initialPhoto.caption);

    const galStrip = document.getElementById('reader-gallery-strip');
    if (allPhotos.length > 1) {
      galStrip.classList.remove('hidden');
      galStrip.innerHTML = allPhotos.map((p, idx) => `
        <button type="button" data-idx="${idx}" class="warta-reader-thumb shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 ${idx === activeIdx ? 'border-red-700 ring-2 ring-red-400/50' : 'border-transparent opacity-80 hover:opacity-100'} transition">
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

    const srcBtn = document.getElementById('reader-source-btn');
    if (srcBtn) {
      if (art.sourceUrl) {
        srcBtn.href = art.sourceUrl;
        srcBtn.classList.remove('hidden');
      } else {
        srcBtn.classList.add('hidden');
      }
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}#artikel=${encodeURIComponent(art.id)}`;
    const waHref = `https://wa.me/?text=${encodeURIComponent(`*WARTA DIGITAL PERMAS NASIONAL*\n*${art.title}*\n(${art.dateLabel} • ${art.location})\n\n${shareUrl}`)}`;
    const waBtn = document.getElementById('reader-wa-btn');
    if (waBtn) waBtn.href = waHref;

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
            <a href="warta.html?v=4#artikel=${encodeURIComponent(lead.id)}" class="block font-editorial font-black text-xl sm:text-3xl leading-tight paper-ink hover:underline">
              ${esc(lead.title)}
            </a>
            <a href="warta.html?v=4#artikel=${encodeURIComponent(lead.id)}" class="block paper-photo-frame border p-1.5 overflow-hidden group">
              <div class="aspect-[16/9] overflow-hidden bg-slate-900">
                <img src="${esc(lead.imageUrl)}" alt="${esc(lead.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              </div>
            </a>
            <div class="broadsheet-columns">
              ${renderParagraphsHtml(splitParagraphs(lead.body).slice(0, 2).join('\n\n') || lead.subtitle || '', true)}
            </div>
            <div class="pt-1">
              <a href="warta.html?v=4#artikel=${encodeURIComponent(lead.id)}" class="inline-flex items-center gap-1.5 text-xs font-extrabold paper-accent hover:underline">
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
              <a href="warta.html?v=4#artikel=${encodeURIComponent(art.id)}" class="block ${idx > 0 ? 'pt-3.5 border-t broadsheet-hairline' : ''} group">
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
                <p class="text-[10px] font-extrabold uppercase tracking-wider paper-gold">Arkib Akhbar Program</p>
                <p class="font-newsbody text-xs paper-muted mt-0.5">Lihat semua sorotan aktiviti &amp; program rasmi PERMAS Nasional.</p>
              </div>
              <a href="warta.html?v=4" class="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white text-[11px] font-bold transition">
                Buka Warta →
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('home-warta-preview')) {
      await renderHomeWartaPreview();
    }

    if (document.getElementById('warta-broadsheet')) {
      try {
        const savedMode = localStorage.getItem(PAPER_MODE_KEY);
        if (savedMode === 'dark' || savedMode === 'classic') state.paperMode = savedMode;
      } catch (e) {}
      applyPaperMode(state.paperMode);
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeWartaReader();
      });

      await loadWartaArticles();
      renderWartaBroadsheet();

      const h = window.location.hash || '';
      if (h.startsWith('#artikel=')) {
        const targetId = decodeURIComponent(h.slice(9));
        if (targetId) openWartaReader(targetId);
      }
    }
  });
})();
