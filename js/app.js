// PERMAS NASIONAL - MAIN INTERACTIVE CONTROLLER
document.addEventListener('DOMContentLoaded', () => {
  initParticleCanvas();
  initCounters();
  renderLeadership('all');
  renderCampusBranches('all');
  renderNews();
  renderInitiatives();
  renderCalendarEvents('all');
  initStatusVerificationWidget();
  initMembershipCardGenerator();
  initEligibilityChecker();
  initAduanSystem();
  initScrollSpy();
  initMobileMenu();
});

/* -----------------------------------------------------------
   1. INTERACTIVE HERO CANVAS (PARTICLE NETWORK)
----------------------------------------------------------- */
function initParticleCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = window.innerWidth < 768 ? 40 : 85;

  function resize() {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#DA291C', '#FFCD00', '#F59E0B', '#991B1B', '#E2E8F0'];

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 2 + 1;
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.5;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#FFCD00';
          ctx.globalAlpha = 0.15 * (1 - dist / 110);
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

/* -----------------------------------------------------------
   2. COUNTERS ANIMATION
----------------------------------------------------------- */
function initCounters() {
  const counterElements = document.querySelectorAll('.stat-counter');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        counterElements.forEach(el => {
          const target = parseInt(el.getAttribute('data-target'), 10);
          const duration = 2000;
          const stepTime = 30;
          const steps = duration / stepTime;
          const increment = target / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              current = target;
              clearInterval(timer);
              el.innerText = target.toLocaleString() + (el.getAttribute('data-suffix') || '');
            } else {
              el.innerText = Math.floor(current).toLocaleString() + (el.getAttribute('data-suffix') || '');
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.getElementById('stats-section');
  if (statsSection) observer.observe(statsSection);
}

/* -----------------------------------------------------------
   3. LEADERSHIP RENDERING & FILTER
----------------------------------------------------------- */
function renderLeadership(filter = 'all') {
  const container = document.getElementById('leadership-grid');
  if (!container) return;

  const list = PERMAS_DATA.leadership.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'tertijggi') return item.badge === 'Majlis Tertinggi';
    if (filter === 'biro') return item.badge === 'Biro Eksekutif';
    return true;
  });

  container.innerHTML = list.map(member => `
    <div class="glass-panel rounded-2xl overflow-hidden group glass-card-hover border border-slate-800 transition-all duration-300">
      <div class="relative h-72 overflow-hidden bg-slate-900">
        <img src="${member.image}" alt="${member.name}" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        
        <span class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${member.badge === 'Majlis Tertinggi' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}">
          ${member.badge}
        </span>

        <div class="absolute bottom-4 left-4 right-4">
          <p class="text-xs font-semibold text-amber-400 tracking-wide uppercase flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
            ${member.position}
          </p>
          <h3 class="text-lg font-bold text-white mt-1 group-hover:text-amber-200 transition-colors">${member.name}</h3>
        </div>
      </div>

      <div class="p-5 flex flex-col justify-between space-y-4">
        <div>
          <div class="flex items-center text-xs text-slate-400 gap-2 mb-2">
            <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <span class="truncate">${member.institution} • ${member.faculty}</span>
          </div>
          <div class="flex items-center text-xs text-slate-400 gap-2 mb-3">
            <svg class="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span>Asal: ${member.hometown}</span>
          </div>
          <p class="text-xs text-slate-300 italic border-l-2 border-red-500/50 pl-3 py-1 bg-slate-900/40 rounded-r">
            "${member.quote}"
          </p>
        </div>

        <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <button onclick="openLeaderBio('${member.id}')" class="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 group/btn">
            Profil Penuh 
            <svg class="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          <a href="mailto:${member.social.email}" class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition" title="Emel Rasmi">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

window.filterLeadership = function(type, btn) {
  document.querySelectorAll('#leader-filters button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLeadership(type);
};

window.openLeaderBio = function(id) {
  const member = PERMAS_DATA.leadership.find(m => m.id === id);
  if (!member) return;

  const modal = document.getElementById('bio-modal');
  const content = document.getElementById('bio-modal-content');

  content.innerHTML = `
    <div class="flex flex-col md:flex-row gap-6 items-center md:items-start">
      <img src="${member.image}" class="w-40 h-40 md:w-52 md:h-52 object-cover rounded-2xl border-2 border-amber-500/40 shadow-2xl shrink-0" alt="${member.name}">
      <div class="flex-1 space-y-3 text-left">
        <div class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/50">
          ${member.badge} • ${member.position}
        </div>
        <h3 class="text-2xl font-black text-white">${member.name}</h3>
        <p class="text-amber-400 text-sm font-semibold">${member.institution} — ${member.faculty}</p>
        <p class="text-xs text-slate-400">Daerah Asal: <strong class="text-slate-200">${member.hometown}</strong></p>
        <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-slate-300 italic">
          "${member.quote}"
        </div>
        <div class="pt-2 flex flex-wrap gap-3">
          <a href="mailto:${member.social.email}" class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            Hubungi Emel Rasmi
          </a>
          <button onclick="closeBioModal()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
};

window.closeBioModal = function() {
  const modal = document.getElementById('bio-modal');
  if (modal) modal.classList.add('hidden');
};

/* -----------------------------------------------------------
   4. CAMPUS NETWORK & SEARCH DIRECTORY
----------------------------------------------------------- */
function renderCampusBranches(zoneFilter = 'all', searchQuery = '') {
  const container = document.getElementById('campus-branches-grid');
  if (!container) return;

  let list = PERMAS_DATA.campusBranches;

  if (zoneFilter !== 'all') {
    list = list.filter(item => item.zone === zoneFilter);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    list = list.filter(item => 
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.university.toLowerCase().includes(q) ||
      item.zone.toLowerCase().includes(q)
    );
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 glass-panel rounded-2xl border border-slate-800">
        <svg class="w-12 h-12 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p class="text-base font-bold text-white">Tiada cawangan kampus sepadan ditemui</p>
        <p class="text-xs text-slate-400 mt-1">Cuba kata kunci lain seperti "UKM", "Zon Utara", atau "IPTS".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(c => `
    <div class="glass-panel p-6 rounded-2xl glass-card-hover border border-slate-800/80 flex flex-col justify-between space-y-4">
      <div>
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/30 to-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-300 font-heading text-lg">
            ${c.code.replace('PERMAS ', '')}
          </div>
          <div class="text-right">
            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-slate-800 text-amber-400 border border-slate-700">
              ${c.zone}
            </span>
            <p class="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center justify-end gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ${c.status}
            </p>
          </div>
        </div>

        <h4 class="text-lg font-bold text-white leading-snug group-hover:text-amber-300 transition-colors">${c.name}</h4>
        <p class="text-xs text-slate-400 mt-1 font-medium">${c.university} • Negeri ${c.state}</p>
        <p class="text-xs text-slate-300 italic mt-3 bg-slate-900/50 p-2.5 rounded-lg border-l-2 border-amber-500">
          "${c.tagline}"
        </p>

        <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Pengerusi</span>
            <span class="font-semibold text-slate-200 truncate block">${c.president}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Keahlian Aktif</span>
            <span class="font-semibold text-amber-400">${c.membersCount.toLocaleString()} Mahasiswa</span>
          </div>
        </div>
      </div>

      <div class="pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
        <span class="text-slate-400 font-mono text-[11px]">${c.instagram}</span>
        <button onclick="contactBranch('${c.code}', '${c.president}', '${c.contact}')" class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white font-bold text-xs border border-red-500/30 transition flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          Hubungi
        </button>
      </div>
    </div>
  `).join('');
}

window.filterCampuses = function(zone, btn) {
  document.querySelectorAll('#campus-filters button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const searchInput = document.getElementById('campus-search-input');
  renderCampusBranches(zone, searchInput ? searchInput.value : '');
};

window.handleCampusSearch = function(val) {
  const activeBtn = document.querySelector('#campus-filters button.active');
  const zone = activeBtn ? activeBtn.getAttribute('data-zone') : 'all';
  renderCampusBranches(zone, val);
};

window.contactBranch = function(code, president, contact) {
  showToast(`Menghubungkan ke ${code} (${president}) — Talian Rasmi: ${contact}`, 'info');
};

/* -----------------------------------------------------------
   5. INITIATIVES & AID PORTAL
----------------------------------------------------------- */
function renderInitiatives() {
  const container = document.getElementById('initiatives-grid');
  if (!container) return;

  container.innerHTML = PERMAS_DATA.initiatives.map(item => `
    <div class="glass-panel p-6 rounded-2xl glass-card-hover border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
      <div class="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${item.badgeColor} opacity-10 rounded-full blur-2xl group-hover:opacity-25 transition-opacity"></div>
      
      <div>
        <div class="flex items-center justify-between gap-2 mb-4">
          <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-amber-300 border border-amber-500/30">
            ${item.category}
          </span>
          ${item.isOpen 
            ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Permohonan Dibuka</span>` 
            : `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Fasa Akan Datang</span>`}
        </div>

        <h3 class="text-xl font-bold text-white group-hover:text-amber-200 transition-colors">${item.title}</h3>
        <p class="text-base font-extrabold text-amber-400 mt-1">${item.value}</p>
        <p class="text-xs text-slate-400 mt-2 font-medium">Sasaran: <span class="text-slate-300">${item.target}</span></p>

        <p class="text-xs text-slate-300 mt-4 leading-relaxed">${item.description}</p>

        <div class="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
          ${item.features.map(f => `
            <div class="flex items-start gap-2 text-xs text-slate-300">
              <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>${f}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between">
        <button onclick="openApplyInitiative('${item.title}')" class="w-full py-2.5 px-4 rounded-xl text-xs font-bold ${item.isOpen ? 'btn-gradient-royal text-white' : 'bg-slate-800 text-slate-400 cursor-not-allowed'} transition shadow-md flex items-center justify-center gap-2">
          ${item.isOpen ? 'Mohon Sekarang Melalui PERMAS' : 'Akan Dibuka Julai 2026'}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

window.openApplyInitiative = function(title) {
  const modal = document.getElementById('apply-modal');
  const titleEl = document.getElementById('apply-modal-title');
  if (titleEl) titleEl.innerText = title;
  if (modal) modal.classList.remove('hidden');
};

window.closeApplyModal = function() {
  const modal = document.getElementById('apply-modal');
  if (modal) modal.classList.add('hidden');
};

/* -----------------------------------------------------------
   6. INTERACTIVE ELIGIBILITY CHECKER (KALKULATOR KELAYAKAN)
----------------------------------------------------------- */
function initEligibilityChecker() {
  const btn = document.getElementById('btn-check-eligibility');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const origin = document.getElementById('elig-origin').value;
    const level = document.getElementById('elig-level').value;
    const income = document.getElementById('elig-income').value;
    const location = document.getElementById('elig-location').value;

    const resultBox = document.getElementById('eligibility-results');
    const resultContent = document.getElementById('eligibility-results-list');

    let eligibleList = [];

    // Logic rules
    if (origin !== 'other') {
      if (income === 'b40') {
        eligibleList.push({
          name: "Skim Komputer Riba Siswa Selangor",
          badge: "100% Layak (Keutamaan B40)",
          desc: "Bantuan komputer riba percuma spesifikasi tinggi bagi kemudahan kuliah hibrid."
        });
        eligibleList.push({
          name: "Dermasiswa Siswa Selangor",
          badge: "100% Layak (Tajaan Penuh/Sebahagian)",
          desc: "Tajaan yuran pengajian sehingga RM5,000/tahun tanpa perlu bayar balik."
        });
      } else if (income === 'm40') {
        eligibleList.push({
          name: "Dermasiswa Siswa Selangor (Kuota M40)",
          badge: "Layak (Berdasarkan Merit & Kuota)",
          desc: "Tajaan sokongan yuran sara hidup peringkat negeri."
        });
      }

      if (location === 'outstation' || location === 'borneo') {
        eligibleList.push({
          name: "Tiket Kasih Siswa Selangor",
          badge: "Layak (Subsidi Tambang Sehingga 100%)",
          desc: "Pemberian subsidi penerbangan/bas ekspres balik ke kampung sempena perayaan dan cuti semester."
        });
      }

      eligibleList.push({
        name: "Baucar Buku Digital Siswa Selangor",
        badge: "Layak (Seluruh Ahli Berdaftar)",
        desc: "Kredit RM200 bagi rujukan e-buku dan langganan ilmiah antarabangsa."
      });

      if (level === 'degree' || level === 'diploma') {
        eligibleList.push({
          name: "SISPRO Selangor (Latihan Industri Eksekutif GLC)",
          badge: "Layak Mohon",
          desc: "Penempatan praktikal bergaji RM1,200 - RM1,800 di syarikat GLC Selangor."
        });
      }
    } else {
      eligibleList.push({
        name: "Geran Aktiviti Mahasiswa Selangor (GAMS)",
        badge: "Terbuka Menerusi Persatuan Kampus",
        desc: "Anda boleh sertai program anjuran cawangan PERMAS di IPT anda untuk manfaat kepimpinan dan jaringan."
      });
    }

    resultContent.innerHTML = eligibleList.map(item => `
      <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h4 class="font-bold text-white text-sm">${item.name}</h4>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ${item.badge}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">${item.desc}</p>
        </div>
        <button onclick="openApplyInitiative('${item.name}')" class="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0 transition">
          Mohon
        </button>
      </div>
    `).join('');

    resultBox.classList.remove('hidden');
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

/* -----------------------------------------------------------
   7. VIRTUAL DIGITAL MEMBERSHIP CARD GENERATOR
----------------------------------------------------------- */
function initMembershipCardGenerator() {
  const nameInput = document.getElementById('card-input-name');
  const icInput = document.getElementById('card-input-ic');
  const uniInput = document.getElementById('card-input-uni');
  const facultyInput = document.getElementById('card-input-faculty');
  const districtInput = document.getElementById('card-input-district');

  const cardName = document.getElementById('card-preview-name');
  const cardMatric = document.getElementById('card-preview-matric');
  const cardUni = document.getElementById('card-preview-uni');
  const cardFaculty = document.getElementById('card-preview-faculty');
  const cardDistrict = document.getElementById('card-preview-district');

  function updateCard() {
    if (cardName) cardName.innerText = (nameInput && nameInput.value.trim()) ? nameInput.value.toUpperCase() : "MUHAMMAD HAZIQ BIN KAMAL";
    if (cardUni) cardUni.innerText = (uniInput && uniInput.value.trim()) ? uniInput.value : "Universiti Kebangsaan Malaysia (UKM)";
    if (cardFaculty) cardFaculty.innerText = (facultyInput && facultyInput.value.trim()) ? facultyInput.value : "Fakulti Teknologi & Sains Maklumat";
    if (cardDistrict) cardDistrict.innerText = (districtInput && districtInput.value) ? districtInput.value : "Petaling";

    if (cardMatric) {
      const hash = Math.abs((nameInput ? nameInput.value : "PERMAS").split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
      const code = "PMS-" + (1000 + (hash % 8999)) + "-26";
      cardMatric.innerText = code;
    }
  }

  [nameInput, icInput, uniInput, facultyInput, districtInput].forEach(inp => {
    if (inp) inp.addEventListener('input', updateCard);
  });

  // 3D Tilt Effect on mouse movement
  const cardWrapper = document.getElementById('digital-id-card-element');
  if (cardWrapper) {
    cardWrapper.addEventListener('mousemove', (e) => {
      const rect = cardWrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      cardWrapper.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    cardWrapper.addEventListener('mouseleave', () => {
      cardWrapper.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }

  const printBtn = document.getElementById('btn-download-card');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

/* -----------------------------------------------------------
   8. E-ADUAN & MEJA SUARA MAHASISWA
----------------------------------------------------------- */
function initAduanSystem() {
  const form = document.getElementById('aduan-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const resultBox = document.getElementById('aduan-success-box');
    if (resultBox) {
      resultBox.classList.remove('hidden');
      form.reset();
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    showToast('Aduan anda telah berjaya dihantar kepada Biro Advokasi PERMAS.', 'success');
  });
}

/* -----------------------------------------------------------
   9. NEWS & PRESS RELEASE RENDERING
----------------------------------------------------------- */
function renderNews() {
  const container = document.getElementById('news-grid');
  if (!container) return;

  container.innerHTML = PERMAS_DATA.news.map((item, index) => `
    <div class="glass-panel rounded-2xl overflow-hidden glass-card-hover border border-slate-800 flex flex-col justify-between group">
      <div>
        <div class="relative h-48 overflow-hidden bg-slate-900">
          <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
          <span class="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-600/90 text-white backdrop-blur-md">
            ${item.category}
          </span>
          <span class="absolute bottom-3 right-3 text-[11px] text-slate-300 font-mono">
            ${item.date}
          </span>
        </div>

        <div class="p-5">
          <h4 class="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
            ${item.title}
          </h4>
          <p class="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
            ${item.summary}
          </p>
        </div>
      </div>

      <div class="p-5 pt-0 border-t border-slate-800/80 flex items-center justify-between text-xs mt-2">
        <span class="text-slate-500 font-medium">${item.readTime}</span>
        <button onclick="openNewsModal('${item.id}')" class="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 group/link">
          Baca Lanjut 
          <svg class="w-3.5 h-3.5 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

window.openNewsModal = function(id) {
  const article = PERMAS_DATA.news.find(n => n.id === id);
  if (!article) return;

  const modal = document.getElementById('news-modal');
  const content = document.getElementById('news-modal-content');

  content.innerHTML = `
    <div class="space-y-4 text-left">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded text-xs font-bold bg-red-600 text-white uppercase">${article.category}</span>
        <span class="text-xs text-slate-400 font-mono">${article.date} • ${article.readTime}</span>
      </div>
      <h2 class="text-2xl font-black text-white leading-tight">${article.title}</h2>
      <p class="text-xs text-amber-400 font-semibold">Disediakan oleh: ${article.author}</p>
      
      <div class="rounded-xl overflow-hidden max-h-72 my-4 border border-slate-800">
        <img src="${article.image}" class="w-full h-full object-cover" alt="${article.title}">
      </div>

      <div class="text-slate-300 text-sm leading-relaxed whitespace-pre-line space-y-3 font-normal">
        ${article.content}
      </div>

      <div class="pt-4 border-t border-slate-800 flex justify-end">
        <button onclick="closeNewsModal()" class="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition">
          Tutup
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
};

window.closeNewsModal = function() {
  const modal = document.getElementById('news-modal');
  if (modal) modal.classList.add('hidden');
};

/* -----------------------------------------------------------
   10. MOBILE MENU & SCROLL SPY
----------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const closeBtn = document.getElementById('mobile-menu-close');

  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }

  if (closeBtn && menu) {
    closeBtn.addEventListener('click', () => {
      menu.classList.add('hidden');
    });
  }

  // Close when clicked nav link
  document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
      if (menu) menu.classList.add('hidden');
    });
  });
}

function initScrollSpy() {
  const navbar = document.getElementById('main-navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('bg-slate-950/90', 'shadow-2xl', 'border-b', 'border-slate-800');
      navbar.classList.remove('bg-transparent');
    } else {
      navbar.classList.remove('bg-slate-950/90', 'shadow-2xl', 'border-b', 'border-slate-800');
      navbar.classList.add('bg-transparent');
    }
  });
}

/* -----------------------------------------------------------
   11. TOAST SYSTEM
----------------------------------------------------------- */
window.showToast = function(msg, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'border-emerald-500 bg-slate-900 text-emerald-300' :
                  type === 'error' ? 'border-red-500 bg-slate-900 text-red-300' :
                  'border-amber-500 bg-slate-900 text-amber-300';

  toast.className = `p-4 rounded-xl border ${bgClass} shadow-2xl backdrop-blur-xl flex items-center gap-3 text-xs font-bold transition-all transform translate-y-4 opacity-0`;
  toast.innerHTML = `
    <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    <span>${msg}</span>
  `;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 50);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

/* -----------------------------------------------------------
   12. TAKWIM & KALENDAR PROGRAM MAHASISWA SELANGOR 2026
----------------------------------------------------------- */
window.renderCalendarEvents = function(category = 'all') {
  const container = document.getElementById('calendar-events-grid');
  if (!container) return;

  const events = window.PERMAS_DATA && window.PERMAS_DATA.calendarEvents ? window.PERMAS_DATA.calendarEvents : [];
  const filtered = category === 'all' 
    ? events 
    : events.filter(e => e.category === category);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p class="text-slate-500 text-sm">Tiada program tersenarai bagi kategori ini buat masa ini.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(ev => {
    const imgSrc = ev.image || 'assets/images/campus_life.jpg';
    return `
      <div class="bento-card flex flex-col justify-between group text-left">
        <div>
          <!-- Visual Image Banner with Overlay & Floating Date Block -->
          <div class="relative h-44 bg-slate-900 overflow-hidden">
            <img src="${imgSrc}" alt="${ev.title}" class="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/35 to-transparent"></div>
            
            <!-- Top Status & Category Badges -->
            <div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span class="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/15 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                ${ev.type}
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${ev.status === 'Pendaftaran Dibuka' ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40' : 'bg-amber-950/90 text-amber-300 border border-amber-500/40'}">
                <span class="w-1.5 h-1.5 rounded-full ${ev.status === 'Pendaftaran Dibuka' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
                ${ev.status}
              </span>
            </div>

            <!-- Bottom Date Lockup inside Image -->
            <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-red-900 border border-red-400/40 text-white flex flex-col items-center justify-center font-heading font-black shadow-lg shrink-0">
                  <span class="text-[9px] leading-none uppercase text-amber-300 font-bold">${ev.dayMonth ? ev.dayMonth.split(' ')[1] : '2026'}</span>
                  <span class="text-xs leading-none text-white mt-0.5">${ev.dayMonth ? ev.dayMonth.split(' ')[0] : '20'}</span>
                </div>
                <div>
                  <span class="block text-xs font-bold text-white">${ev.date}</span>
                  <span class="block text-[10px] text-slate-300 font-mono">${ev.target || 'Mahasiswa Selangor'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="p-6 pb-4">
            <h3 class="font-heading font-extrabold text-lg text-slate-900 group-hover:text-red-700 transition leading-snug">
              ${ev.title}
            </h3>

            <p class="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
              ${ev.summary}
            </p>

            <div class="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span class="font-semibold text-slate-800 truncate">${ev.location}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span class="font-mono text-[11px]">${ev.time} • <strong class="text-emerald-700">${ev.seats || 'Terbuka'}</strong></span>
              </div>
              ${ev.highlight ? `
                <div class="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-950 font-medium flex items-start gap-1.5">
                  <span class="text-amber-600 shrink-0">⭐</span>
                  <span>${ev.highlight}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Action CTA Buttons -->
        <div class="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button onclick="openEventRsvpModal('${ev.id}')" class="flex-1 btn-primary-red py-2.5 text-xs font-bold shadow-xs hover:shadow-md flex items-center justify-center gap-1.5">
            <span>ℹ️ Lihat Info Penuh Program</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.filterCalendarEvents = function(category, btn) {
  document.querySelectorAll('.calendar-filter-btn').forEach(b => {
    b.classList.remove('bg-slate-900', 'text-white');
    b.classList.add('bg-white', 'text-slate-700', 'hover:bg-slate-100');
  });
  if (btn) {
    btn.classList.add('bg-slate-900', 'text-white');
    btn.classList.remove('bg-white', 'text-slate-700', 'hover:bg-slate-100');
  }
  renderCalendarEvents(category);
};

window.openEventRsvpModal = function(eventId) {
  const modal = document.getElementById('event-rsvp-modal');
  const events = window.PERMAS_DATA && window.PERMAS_DATA.calendarEvents ? window.PERMAS_DATA.calendarEvents : [];
  const ev = events.find(e => e.id === eventId) || events[0];

  const titleEl = document.getElementById('rsvp-event-title');
  const detailsEl = document.getElementById('rsvp-event-details');

  const gcalDates = {
    'kms-2026': '20260324T010000Z/20260324T090000Z',
    'Jelajah-ramadan-2026': '20260410T080000Z/20260410T140000Z',
    'sukmas-2026': '20260612T000000Z/20260614T100000Z',
    'hackathon-selangor-2026': '20260718T010000Z/20260719T090000Z',
    'kem-kepimpinan-2026': '20260821T010000Z/20260823T090000Z',
    'townhall-2026': '20261016T063000Z/20261016T100000Z'
  };
  const dateRange = gcalDates[ev.id] || '20260324T010000Z/20260324T090000Z';
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title + ' (PERMAS Nasional)')}&dates=${dateRange}&details=${encodeURIComponent(ev.summary)}&location=${encodeURIComponent(ev.location)}`;
  const waShareUrl = `https://wa.me/?text=${encodeURIComponent('*TAKWIM ACARA PERMAS 2026*\n' + ev.title + '\n📅 ' + ev.date + ' (' + ev.time + ')\n📍 ' + ev.location)}`;

  if (titleEl) titleEl.innerText = ev.title;
  if (detailsEl) {
    detailsEl.innerHTML = `
      <div class="space-y-3.5 mt-2">
        <div class="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span class="font-bold text-red-700">📅 ${ev.date}</span>
          <span>•</span>
          <span class="text-slate-700">📍 ${ev.location}</span>
          <span>•</span>
          <span class="text-emerald-700 font-semibold font-mono">${ev.time}</span>
        </div>
        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">${ev.summary}</p>
        ${ev.highlight ? `<div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">⭐ ${ev.highlight}</div>` : ''}
        <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <a href="${gcalUrl}" target="_blank" rel="noopener" class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">
            <span>📅 Simpan ke Google Calendar</span>
          </a>
          <a href="${waShareUrl}" target="_blank" rel="noopener" class="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs">
            <span>💬 Kongsi Acara (WhatsApp)</span>
          </a>
        </div>
      </div>
    `;
  }
  if (modal) modal.classList.remove('hidden');
};

window.closeEventRsvpModal = function() {
  const modal = document.getElementById('event-rsvp-modal');
  if (modal) modal.classList.add('hidden');
};


