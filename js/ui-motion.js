/* ============================================================================
   PERMAS NASIONAL - UI MOTION, ANIMATED MENU & VISUAL GRAPHICS CONTROLLER (V11)
   ============================================================================ */

// Apply saved Selangor Royal Dark Mode immediately to prevent light flash
if (typeof localStorage !== 'undefined' && localStorage.getItem('permas_royal_theme') === 'dark') {
  document.documentElement.classList.add('dark-mode');
}

document.addEventListener('DOMContentLoaded', () => {
  initRoyalDarkModeToggle();
  initScrollProgressAndHeader();
  initAnimatedNavbar();
  initHeroConstellationCanvas();
  init3DCardTiltAndSpotlight();
  initAnimatedCountersAndBars();
  initScrollRevealAndFloatingDock();
});

/* ---------------------------------------------------------------------------
   0. SELANGOR ROYAL DARK MODE TOGGLE CONTROLLER (MOD GELAP DIRAJA)
--------------------------------------------------------------------------- */
function initRoyalDarkModeToggle() {
  const headerBar = document.querySelector('header .flex.items-center.justify-between');
  if (headerBar && !document.getElementById('royal-theme-toggle')) {
    const mobileBtn = headerBar.querySelector('button[onclick*="toggleMobileMenu"]');
    const rightActions = headerBar.querySelector('div.hidden.sm\\:flex');

    const controlsGroup = document.createElement('div');
    controlsGroup.className = 'flex items-center gap-2 shrink-0';

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'royal-theme-toggle';
    toggleBtn.type = 'button';
    toggleBtn.setAttribute('aria-label', 'Tukar Mod Cerah / Mod Night');
    toggleBtn.onclick = () => window.toggleRoyalDarkMode();

    controlsGroup.appendChild(toggleBtn);

    if (rightActions) {
      // Preserve desktop CTA inside the unified right controls group (compact sizing to prevent overflow)
      const ctaItems = Array.from(rightActions.children);
      const desktopCtaWrap = document.createElement('div');
      desktopCtaWrap.className = 'hidden sm:flex items-center gap-2 shrink-0';
      ctaItems.forEach((child) => {
        if (child.tagName === 'A') {
          child.classList.remove('px-4', 'py-2', 'text-xs');
          child.classList.add('px-3', 'py-2', 'text-[11px]');
          const spans = child.querySelectorAll('span');
          if (spans.length > 0) {
            const lastSpan = spans[spans.length - 1];
            if (lastSpan && lastSpan.textContent.includes('Aduan')) {
              lastSpan.textContent = '📢 Aduan & SOS';
            }
          }
        }
        desktopCtaWrap.appendChild(child);
      });
      controlsGroup.appendChild(desktopCtaWrap);
      rightActions.remove();
    }

    if (mobileBtn) {
      controlsGroup.appendChild(mobileBtn);
    }

    headerBar.appendChild(controlsGroup);
  }

  // Add mobile drawer dark mode toggle item as well
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav && !document.getElementById('royal-theme-toggle-mobile')) {
    const mobileToggle = document.createElement('button');
    mobileToggle.id = 'royal-theme-toggle-mobile';
    mobileToggle.type = 'button';
    mobileToggle.className = 'w-full mt-2 py-2.5 px-3.5 rounded-xl text-sm font-bold border border-amber-300/60 bg-slate-900 text-amber-300 flex items-center justify-between transition';
    mobileToggle.onclick = () => window.toggleRoyalDarkMode();
    mobileNav.appendChild(mobileToggle);
  }

  if (!document.getElementById('royal-theme-toast')) {
    const toast = document.createElement('div');
    toast.id = 'royal-theme-toast';
    document.body.appendChild(toast);
  }

  syncRoyalThemeButtons();
}

function syncRoyalThemeButtons() {
  const isDark = document.documentElement.classList.contains('dark-mode');
  const mainBtn = document.getElementById('royal-theme-toggle');
  if (mainBtn) {
    mainBtn.title = isDark ? 'Tukar ke Mod Cerah' : 'Tukar ke Mod Night';
    mainBtn.innerHTML = isDark
      ? `<span class="theme-icon-spin" aria-hidden="true">☀️</span><span class="hidden xl:inline">Mod Cerah</span>`
      : `<span class="theme-icon-spin" aria-hidden="true">🌙</span><span class="hidden xl:inline">Mod Night</span>`;
  }

  const mobileBtn = document.getElementById('royal-theme-toggle-mobile');
  if (mobileBtn) {
    mobileBtn.innerHTML = isDark
      ? `<span>☀️ Tukar ke Mod Cerah</span><span class="text-xs opacity-80">Aktif</span>`
      : `<span>🌙 Aktifkan Mod Night</span><span class="text-xs opacity-80">Selangor Night</span>`;
  }
}

let royalToastTimer = null;
window.toggleRoyalDarkMode = function () {
  const isDarkNow = document.documentElement.classList.toggle('dark-mode');
  try {
    localStorage.setItem('permas_royal_theme', isDarkNow ? 'dark' : 'light');
  } catch (e) {}

  syncRoyalThemeButtons();

  const toast = document.getElementById('royal-theme-toast');
  if (toast) {
    clearTimeout(royalToastTimer);
    toast.innerHTML = isDarkNow
      ? '🌙 <span class="text-amber-300">Mod Night</span> Diaktifkan'
      : '☀️ <span class="text-amber-300">Mod Cerah</span> Diaktifkan';
    toast.classList.add('show');
    royalToastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
};

/* ---------------------------------------------------------------------------
   1. SCROLL PROGRESS BAR & FLOATING HEADER
--------------------------------------------------------------------------- */
function initScrollProgressAndHeader() {
  if (!document.getElementById('scroll-progress-bar')) {
    const bar = document.createElement('div');
    bar.id = 'scroll-progress-bar';
    document.body.prepend(bar);
  }

  const header = document.querySelector('header');
  const progressBar = document.getElementById('scroll-progress-bar');

  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (header) {
      if (scrollTop > 30) {
        header.classList.add('nav-scrolled');
      } else {
        header.classList.remove('nav-scrolled');
      }
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------------------------------------------------------------------------
   2. ANIMATED SLIDING MENU & FLOATING MEGA-PREVIEW CARD
--------------------------------------------------------------------------- */
function initAnimatedNavbar() {
  const nav = document.querySelector('header nav');
  if (!nav) return;

  nav.classList.add('nav-animated-wrap');
  const navItems = Array.from(nav.querySelectorAll('.nav-tab-item'));
  if (!navItems.length) return;

  const MENU_META = [
    {
      match: 'index.html',
      icon: '🏠',
      badge: 'Portal Utama & Warta',
      title: 'Laman Utama PERMAS Nasional',
      desc: 'Hebahan rasmi, statistik impak RM 3.8M+, infografik pelajar dan galeri lensa Selangor.',
      accent: 'bg-red-700',
      links: [
        { label: '📰 Berita & Warta Terkini', href: 'index.html?v=10#berita-terkini' },
        { label: '📊 Infografik Impak Dana', href: 'index.html?v=10#infografik-impak' }
      ]
    },
    {
      match: 'inisiatif.html',
      icon: '🎓',
      badge: '4 Skim Bantuan Negeri',
      title: 'Inisiatif & Dermasiswa Selangor',
      desc: 'Panduan lengkap Dermasiswa Yuran, Komputer Riba B40, Tiket Kasih dan SISPRO GLC.',
      accent: 'bg-amber-600',
      links: [
        { label: '💻 Semak 4 Skim Bantuan', href: 'inisiatif.html?v=10#tab-section' },
        { label: '❓ Soalan Lazim (FAQ)', href: 'inisiatif.html?v=10#faq-inisiatif-container' }
      ]
    },
    {
      match: 'kampus.html',
      icon: '🗺️',
      badge: 'Peta Satelit Interaktif',
      title: 'Rangkaian 20 UA & 38 Cawangan IPT',
      desc: 'Teroka lokasi universiti, nombor perwakilan YDP kampus dan agihan 5 zon wilayah.',
      accent: 'bg-blue-700',
      links: [
        { label: '📍 Buka Peta Satelit 20 UA', href: 'kampus.html?v=10#peta-section' },
        { label: '🏫 Direktori Kampus', href: 'kampus.html?v=10#senarai-ua' }
      ]
    },
    {
      match: 'takwim.html',
      icon: '📅',
      badge: 'Kalendar Rasmi 2026',
      title: 'Takwim Program & Acara Mega',
      desc: 'Jadual Konvensyen Mahasiswa Selangor (KMS), Sukan SUKMAS dan Kembara Bakti.',
      accent: 'bg-emerald-700',
      links: [
        { label: '📅 Jadual Acara 2026', href: 'takwim.html?v=10' },
        { label: '🏆 Sukan SUKMAS & KMS', href: 'takwim.html?v=10' }
      ]
    },
    {
      match: 'kepimpinan.html',
      icon: '🏛️',
      badge: 'Sesi 2024–2026',
      title: 'Saf Majlis Tertinggi & Exco',
      desc: 'Kenali 22 pimpinan utama kebangsaan serta slaid warta pelantikan rasmi PERMAS.',
      accent: 'bg-slate-800',
      links: [
        { label: '👥 Direktori 22 Pimpinan', href: 'kepimpinan.html?v=10#leadership-grid' },
        { label: '📜 Lihat Direktori Penuh', href: 'kepimpinan.html?v=10' }
      ]
    },
    {
      match: 'aduan.html',
      icon: '📢',
      badge: 'Talian Hayat 24 Jam',
      title: 'Meja E-Aduan & Hab Bencana SOS',
      desc: 'Saluran sulit masalah yuran, rumah sewa, kesihatan serta respon pantas kecemasan.',
      accent: 'bg-red-800',
      links: [
        { label: '📝 Isi Borang E-Aduan', href: 'aduan.html?v=10#borang-aduan' },
        { label: '🚨 Hab Bencana & SOS', href: 'aduan.html?v=10#sos-teras' }
      ]
    }
  ];

  const getMetaForItem = (anchor) => {
    const href = (anchor.getAttribute('href') || '').toLowerCase();
    return MENU_META.find(m => href.includes(m.match)) || MENU_META[0];
  };

  // Inject animated icons inside each tab link
  navItems.forEach((item) => {
    if (!item.querySelector('.nav-tab-icon')) {
      const meta = getMetaForItem(item);
      const text = item.textContent.trim();
      item.innerHTML = `<span class="nav-tab-icon" aria-hidden="true">${meta.icon}</span><span>${text}</span>`;
    }
  });

  // Inject floating sliding magic pill & bottom bar
  const magicPill = document.createElement('span');
  magicPill.id = 'nav-magic-pill';
  const magicBar = document.createElement('span');
  magicBar.id = 'nav-magic-bar';
  nav.prepend(magicPill, magicBar);

  // Inject floating mega-preview popover anchored to nav
  const previewCard = document.createElement('div');
  previewCard.id = 'nav-hover-preview';
  previewCard.className = 'hidden lg:block text-left';
  nav.appendChild(previewCard);

  const moveIndicatorTo = (el) => {
    if (!el || el.offsetWidth === 0) return;
    magicPill.style.opacity = '1';
    magicPill.style.left = `${el.offsetLeft + 2}px`;
    magicPill.style.width = `${Math.max(20, el.offsetWidth - 4)}px`;

    magicBar.style.opacity = '1';
    magicBar.style.left = `${el.offsetLeft + 8}px`;
    magicBar.style.width = `${Math.max(16, el.offsetWidth - 16)}px`;
  };

  const getActiveItem = () => nav.querySelector('.nav-tab-item.active') || navItems[0];

  // Position initially once fonts/layout settle
  requestAnimationFrame(() => moveIndicatorTo(getActiveItem()));
  window.addEventListener('resize', () => moveIndicatorTo(getActiveItem()));

  let hidePreviewTimer = null;

  const showPreviewFor = (item) => {
    clearTimeout(hidePreviewTimer);
    const meta = getMetaForItem(item);
    previewCard.innerHTML = `
      <div class="flex items-start gap-3.5">
        <div class="w-11 h-11 rounded-2xl ${meta.accent} text-white flex items-center justify-center text-xl shadow-md shrink-0">
          ${meta.icon}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
              ${meta.badge}
            </span>
          </div>
          <h4 class="font-heading font-extrabold text-sm text-slate-900 leading-snug">${meta.title}</h4>
          <p class="text-[11px] text-slate-600 mt-1 leading-relaxed">${meta.desc}</p>
        </div>
      </div>
      <div class="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
        ${meta.links.map(l => `
          <a href="${l.href}" class="px-3 py-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200/80 hover:border-red-200 text-[11px] font-bold transition flex items-center justify-between gap-1">
            <span class="truncate">${l.label}</span>
            <span class="text-red-600">&rarr;</span>
          </a>
        `).join('')}
      </div>
    `;

    // Align horizontal center under hovered item while keeping within nav bounds
    const navWidth = nav.offsetWidth || 480;
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const clampedCenter = Math.max(160, Math.min(navWidth - 120, itemCenter));
    previewCard.style.left = `${clampedCenter}px`;
    previewCard.classList.add('show');
  };

  const scheduleHidePreview = () => {
    clearTimeout(hidePreviewTimer);
    hidePreviewTimer = setTimeout(() => {
      previewCard.classList.remove('show');
      moveIndicatorTo(getActiveItem());
    }, 160);
  };

  navItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      moveIndicatorTo(item);
      showPreviewFor(item);
    });
    item.addEventListener('focus', () => {
      moveIndicatorTo(item);
      showPreviewFor(item);
    });
  });

  nav.addEventListener('mouseleave', scheduleHidePreview);
  previewCard.addEventListener('mouseenter', () => clearTimeout(hidePreviewTimer));
  previewCard.addEventListener('mouseleave', scheduleHidePreview);
}

/* ---------------------------------------------------------------------------
   3. INTERACTIVE HERO CONSTELLATION GRAPHIC CANVAS
--------------------------------------------------------------------------- */
function initHeroConstellationCanvas() {
  const canvas = document.getElementById('hero-particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let nodes = [];
  const mouse = { x: null, y: null, radius: 130 };
  const NODE_COUNT = window.innerWidth < 768 ? 28 : 52;
  const PALETTE = ['#991B1B', '#DC2626', '#D97706', '#F59E0B', '#64748B'];

  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    width = canvas.width = parent.offsetWidth;
    height = canvas.height = parent.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const section = canvas.parentElement;
  if (section) {
    section.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    section.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
  }

  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r: Math.random() * 2.2 + 1.4,
      color: PALETTE[i % PALETTE.length]
    });
  }

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      const p = nodes[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Gentle cursor magnetic repulsion/interaction
      if (mouse.x !== null && mouse.y !== null) {
        const dxM = p.x - mouse.x;
        const dyM = p.y - mouse.y;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);
        if (distM < mouse.radius && distM > 0) {
          const force = (mouse.radius - distM) / mouse.radius;
          p.x += (dxM / distM) * force * 1.4;
          p.y += (dyM / distM) * force * 1.4;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.42;
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j++) {
        const q = nodes[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 125) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = i % 2 === 0 ? '#991B1B' : '#D97706';
          ctx.globalAlpha = 0.14 * (1 - dist / 125);
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  };
  draw();
}

/* ---------------------------------------------------------------------------
   4. 3D CARD TILT & CURSOR SPOTLIGHT GLOW
--------------------------------------------------------------------------- */
function init3DCardTiltAndSpotlight() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = document.querySelectorAll('.bento-card, .bento-card-dark');

  cards.forEach((card) => {
    if (card.dataset.tiltBound === '1') return;
    card.dataset.tiltBound = '1';
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Subtle tilt only on reasonably sized cards so long articles stay comfortable
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -2.8;
      const rotateY = ((x - centerX) / centerX) * 2.8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}
window.init3DCardTiltAndSpotlight = init3DCardTiltAndSpotlight;

/* ---------------------------------------------------------------------------
   5. ANIMATED NUMBER COUNTERS & PROGRESS BARS
--------------------------------------------------------------------------- */
function initAnimatedCountersAndBars() {
  const counters = document.querySelectorAll('[data-count]');
  const bars = document.querySelectorAll('[data-bar-width]');

  if (counters.length) {
    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1400;
        const startTime = performance.now();

        const step = (now) => {
          const progress = Math.min(1, (now - startTime) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = target * eased;

          const formatted = decimals > 0
            ? value.toFixed(decimals)
            : Math.floor(value).toLocaleString('en-US');
          el.textContent = `${prefix}${formatted}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            const finalStr = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('en-US');
            el.textContent = `${prefix}${finalStr}${suffix}`;
          }
        };

        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.25 });

    counters.forEach((c) => counterObserver.observe(c));
  }

  if (bars.length) {
    const barObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const targetW = el.getAttribute('data-bar-width') || '0%';
        setTimeout(() => {
          el.style.width = targetW;
        }, 120);
        obs.unobserve(el);
      });
    }, { threshold: 0.2 });

    bars.forEach((b) => barObserver.observe(b));
  }
}

/* ---------------------------------------------------------------------------
   6. SCROLL REVEAL & FLOATING QUICK ACTION DOCK
--------------------------------------------------------------------------- */
function initScrollRevealAndFloatingDock() {
  const sections = document.querySelectorAll('section');
  sections.forEach((sec, idx) => {
    // Keep the very first hero section immediately visible above the fold
    if (idx > 0 && !sec.classList.contains('reveal-up')) {
      sec.classList.add('reveal-up');
    }
  });

  const revealTargets = document.querySelectorAll('.reveal-up');
  if (revealTargets.length) {
    const revObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    revealTargets.forEach((t) => revObserver.observe(t));
  }

  // Inject floating quick-access dock if not present
  if (!document.getElementById('permas-floating-dock')) {
    const dock = document.createElement('div');
    dock.id = 'permas-floating-dock';
    dock.innerHTML = `
      <div id="dock-menu-panel" class="hidden flex-col gap-2 items-end mb-1 transition-all duration-200">
        <a href="aduan.html?v=10#sos-teras" class="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-lg border border-red-500/40 flex items-center gap-2 transition hover:-translate-x-1">
          <span class="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
          <span>Bilik Gerakan SOS 24/7</span>
        </a>
        <a href="inisiatif.html?v=10" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-2 transition hover:-translate-x-1">
          <span>🎓</span>
          <span>Semak 4 Skim Bantuan</span>
        </a>
        <a href="index.html?v=10#berita-terkini" class="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold shadow-lg border border-slate-200 flex items-center gap-2 transition hover:-translate-x-1">
          <span>📰</span>
          <span>Warta Berita Terkini</span>
        </a>
      </div>
      <div class="flex items-center gap-2">
        <button id="dock-scroll-top" type="button" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" title="Kembali ke Atas" class="hidden w-11 h-11 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xl items-center justify-center transition hover:-translate-y-0.5">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>
        </button>
        <button id="dock-toggle-btn" type="button" onclick="toggleQuickDockMenu()" title="Menu Pantas PERMAS" class="px-4 py-3 rounded-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-slate-900 text-white text-xs font-extrabold shadow-2xl border border-amber-400/40 flex items-center gap-2 transition hover:scale-105">
          <span class="w-2 h-2 rounded-full bg-amber-300 animate-pulse"></span>
          <span>Menu Pantas</span>
        </button>
      </div>
    `;
    document.body.appendChild(dock);

    const scrollTopBtn = document.getElementById('dock-scroll-top');
    window.addEventListener('scroll', () => {
      if (!scrollTopBtn) return;
      if (window.scrollY > 360) {
        scrollTopBtn.classList.remove('hidden');
        scrollTopBtn.classList.add('flex');
      } else {
        scrollTopBtn.classList.add('hidden');
        scrollTopBtn.classList.remove('flex');
      }
    }, { passive: true });
  }
}

window.toggleQuickDockMenu = function () {
  const panel = document.getElementById('dock-menu-panel');
  if (!panel) return;
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
    panel.classList.add('flex');
  } else {
    panel.classList.add('hidden');
    panel.classList.remove('flex');
  }
};

