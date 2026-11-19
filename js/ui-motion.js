/* ============================================================================
   PERMAS NASIONAL - UI MOTION, ANIMATED MENU & VISUAL GRAPHICS CONTROLLER (V11)
   ============================================================================ */

// Permanent Selangor Dark Mode (Mod Gelap)
document.documentElement.classList.add('dark-mode');
try {
  localStorage.setItem('permas_royal_theme', 'dark');
} catch (e) {}

document.addEventListener('DOMContentLoaded', () => {
  initRoyalDarkModeToggle();
  initScrollProgressAndHeader();
  initAnimatedNavbar();
  initMobileNavAutoClose();
  initHeroConstellationCanvas();
  init3DCardTiltAndSpotlight();
  initAnimatedCountersAndBars();
  initScrollRevealAndFloatingDock();
});

function initMobileNavAutoClose() {
  const mobileNav = document.getElementById('mobile-nav');
  if (!mobileNav) return;
  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
    });
  });
}

/* ---------------------------------------------------------------------------
   0. SELANGOR PERMANENT DARK MODE (MOD GELAP KEKAL)
--------------------------------------------------------------------------- */
function initRoyalDarkModeToggle() {
  document.documentElement.classList.add('dark-mode');

  ['royal-theme-toggle', 'royal-theme-toggle-mobile', 'royal-theme-toast'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  const headerBar = document.querySelector('header .flex.items-center.justify-between');
  if (headerBar) {
    const rightActions = headerBar.querySelector('div.hidden.sm\\:flex');
    if (rightActions) {
      rightActions.classList.add('shrink-0');
      Array.from(rightActions.children).forEach((child) => {
        if (child.tagName === 'A') {
          child.classList.remove('px-4', 'px-3', 'text-[11px]', 'rounded-xl', 'font-bold');
          child.classList.add('px-3.5', 'py-2', 'text-xs', 'font-semibold', 'rounded-lg');
          const spans = child.querySelectorAll('span');
          if (spans.length > 0) {
            const lastSpan = spans[spans.length - 1];
            if (lastSpan) {
              const cleaned = lastSpan.textContent.replace(/^📢\s*/, '').trim();
              lastSpan.textContent = cleaned.includes('Aduan') ? 'Salur Aduan & SOS' : cleaned;
            }
          }
        }
      });
    }
  }
}

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
   2. CLEAN EXECUTIVE SLIDING NAVBAR
--------------------------------------------------------------------------- */
function initAnimatedNavbar() {
  const nav = document.querySelector('header nav');
  if (!nav) return;

  nav.classList.add('nav-animated-wrap');
  const navItems = Array.from(nav.querySelectorAll('.nav-tab-item'));
  if (!navItems.length) return;

  const oldPreview = document.getElementById('nav-hover-preview');
  if (oldPreview) oldPreview.remove();
  navItems.forEach((item) => {
    const iconEl = item.querySelector('.nav-tab-icon');
    if (iconEl) iconEl.remove();
  });

  // Inject subtle sliding pill & bottom accent bar
  const magicPill = document.createElement('span');
  magicPill.id = 'nav-magic-pill';
  const magicBar = document.createElement('span');
  magicBar.id = 'nav-magic-bar';
  nav.prepend(magicPill, magicBar);

  const moveIndicatorTo = (el) => {
    if (!el || el.offsetWidth === 0) return;
    magicPill.style.opacity = '1';
    magicPill.style.left = `${el.offsetLeft + 2}px`;
    magicPill.style.width = `${Math.max(20, el.offsetWidth - 4)}px`;

    magicBar.style.opacity = '1';
    magicBar.style.left = `${el.offsetLeft + 10}px`;
    magicBar.style.width = `${Math.max(16, el.offsetWidth - 20)}px`;
  };

  const getActiveItem = () => nav.querySelector('.nav-tab-item.active') || navItems[0];

  requestAnimationFrame(() => moveIndicatorTo(getActiveItem()));
  window.addEventListener('resize', () => moveIndicatorTo(getActiveItem()));

  navItems.forEach((item) => {
    item.addEventListener('mouseenter', () => moveIndicatorTo(item));
    item.addEventListener('focus', () => moveIndicatorTo(item));
  });

  nav.addEventListener('mouseleave', () => moveIndicatorTo(getActiveItem()));
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
  if (window.innerWidth < 768 || window.matchMedia('(hover: none)').matches) return;
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
        <a href="warta.html?v=1" class="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-lg border border-amber-300 flex items-center gap-2 transition hover:-translate-x-1">
          <span>🗞️</span>
          <span>Surat Khabar Program</span>
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

