// ── EmailJS ──────────────────────────────────────────────
emailjs.init({ publicKey: 'q3x_GEtpFJLWd_n0T' });
document.getElementById('cForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var btn = document.getElementById('cBtn');
  var fb  = document.getElementById('cFb');
  btn.textContent = 'Sending…'; btn.disabled = true; fb.style.display = 'none';
  try {
    await emailjs.send('service_nscfnyq', 'template_a1rxujr', {
      from_name: document.getElementById('cName').value,
      reply_to:  document.getElementById('cEmail').value,
      subject:   document.getElementById('cSubject').value || '(no subject)',
      message:   document.getElementById('cMsg').value,
    });
    fb.textContent = "Message sent! I'll get back to you soon.";
    fb.style.color = 'var(--accent)';
    this.reset();
  } catch(err) {
    fb.textContent = 'Something went wrong. Email me at zzaidanrafi@gmail.com';
    fb.style.color = '#c0392b';
  }
  fb.style.display = 'inline';
  btn.textContent = 'Send message'; btn.disabled = false;
});

// ── Nav ──────────────────────────────────────────────────
var nav = document.getElementById('nav');
window.addEventListener('scroll', function() {
  nav.classList.toggle('on', window.scrollY > 40);
  updateActiveNav();
}, { passive: true });

function updateActiveNav() {
  var ids = ['skills','journey','projects','contact'];
  var active = '';
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 150) active = id;
  });
  document.querySelectorAll('.nav-links a').forEach(function(a) {
    a.classList.toggle('on', a.getAttribute('href') === '#' + active);
  });
}

// ── Hamburger ────────────────────────────────────────────
var hbg = document.getElementById('hamburger');
var mob = document.getElementById('mobileMenu');
hbg.addEventListener('click', function() {
  hbg.classList.toggle('on');
  mob.classList.toggle('on');
});
function closeMob() { hbg.classList.remove('on'); mob.classList.remove('on'); }

// ── Scroll reveal ────────────────────────────────────────
var revObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    if (e.isIntersecting) { e.target.classList.add('vis'); revObs.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('[data-anim]').forEach(function(el) { revObs.observe(el); });

// ── Project tabs ─────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('.proj-tab').forEach(function(t) { t.classList.remove('on'); });
  document.querySelectorAll('.proj-panel').forEach(function(p) { p.classList.remove('on'); });
  btn.classList.add('on');
  document.getElementById('panel-' + tab).classList.add('on');
}

// ── Modal helpers ─────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('on');
  document.body.style.overflow = '';
}
document.querySelectorAll('.modal-bg').forEach(function(el) {
  el.addEventListener('click', function(e) {
    if (e.target === el) closeModal(el.id);
  });
});

// ── LIGHTBOX ─────────────────────────────────────────────
var lbImgs = [], lbIdx = 0;
var lbEl   = document.getElementById('lb');
var lbImg  = document.getElementById('lbImg');

function openLb(imgs, idx) {
  lbImgs = imgs; lbIdx = idx;
  lbEl.classList.add('on');
  document.body.style.overflow = 'hidden';
  lbRender();
}
function lbRender() {
  lbImg.src = lbImgs[lbIdx];
  document.getElementById('lbCtr').textContent = (lbIdx + 1) + ' / ' + lbImgs.length;
  var dots = document.getElementById('lbDots');
  dots.innerHTML = lbImgs.map(function(_, i) {
    return '<div class="lb-dot' + (i === lbIdx ? ' on' : '') + '" onclick="lbGo(' + i + ')"></div>';
  }).join('');
  document.getElementById('lbL').style.display = lbImgs.length > 1 ? '' : 'none';
  document.getElementById('lbR').style.display = lbImgs.length > 1 ? '' : 'none';
}
function lbNav(d) { lbIdx = (lbIdx + d + lbImgs.length) % lbImgs.length; lbRender(); }
function lbGo(i) { lbIdx = i; lbRender(); }
function closeLb() { lbEl.classList.remove('on'); document.body.style.overflow = ''; }

document.getElementById('lbX').onclick = closeLb;
document.getElementById('lbL').onclick = function() { lbNav(-1); };
document.getElementById('lbR').onclick = function() { lbNav(1); };
lbEl.addEventListener('click', function(e) { if (e.target === lbEl) closeLb(); });

var lbTx = 0;
lbEl.addEventListener('touchstart', function(e) { lbTx = e.touches[0].clientX; }, { passive: true });
lbEl.addEventListener('touchend',   function(e) {
  var dx = lbTx - e.changedTouches[0].clientX;
  if (Math.abs(dx) > 50) lbNav(dx > 0 ? 1 : -1);
}, { passive: true });

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closeLb(); closeModal('tlModal'); closeModal('prjModal'); }
  if (lbEl.classList.contains('on')) {
    if (e.key === 'ArrowLeft')  lbNav(-1);
    if (e.key === 'ArrowRight') lbNav(1);
  }
});

// ── TIMELINE DATA ────────────────────────────────────────
var TL = [
  {
    year: '2021', focus: 'Foundations',
    title: 'Starting at Universitas Brawijaya — EE & Web Beginnings',
    stats: [{ v: '2', k: 'Organisations' }, { v: 'Year 1', k: 'UB EE' }],
    body: 'First year — building a solid foundation in <b>calculus, electrical engineering, and circuit theory</b> while self-teaching <b>HTML, CSS, JavaScript, and Vue.js</b>. Joined two organisations to accelerate learning from day one.',
    badges: ['SRE UB', 'GDSC UB', 'Vue.js Self-taught', 'Sololearn Certified', 'Finalist LP2PKM UB'],
    wins: ['Finalist LP2PKM UB'],
    cats: [
      { lbl: 'Education', items: [{ t: 'S1 Electrical Engineering (Electronics) — Universitas Brawijaya', s: 'Core: Calculus, Physics, Circuit Theory, Electrical Fundamentals' }] },
      { lbl: 'Skills Acquired', items: [{ t: 'Web Development self-study: HTML, CSS, JavaScript, Vue.js', s: 'Front-End Web Development — Sololearn Certification' }] },
      { lbl: 'Organisations', items: [{ t: 'SRE UB (Society of Renewable Energy)', s: 'PIC of SRE UB × UNDP ACCESS Talkshow Day 1.' }, { t: 'GDSC UB (Google Developer Student Club)', s: 'Developer community, collaborative projects.' }] },
      { lbl: 'Competitions', items: [{ t: 'Finalist — LP2PKM Scientific Proposal Competition, Universitas Brawijaya', s: 'February 2022' }] }
    ]
  },
  {
    year: '2022', focus: 'IoT Deep Dive',
    title: 'Joined IoT UB — First Real Project & First Competition Win',
    stats: [{ v: '🏆 1st', k: 'Dekan Cup' }, { v: '1', k: 'IoT Project' }],
    body: 'Pivoted <b>fully toward IoT</b>. Joined IoT UB organisation, shipped first real <b>IoT monitoring dashboard</b> as website division lead, and claimed <b>1st place at faculty-level competition</b>.',
    badges: ['IoT UB — Staff R&D', 'Project Cangat (Kadiv Website)', '🏆 Juara 1 Dekan Cup FT UB'],
    wins: ['🏆 Juara 1 Dekan Cup FT UB'],
    cats: [
      { lbl: 'Organisation', items: [{ t: 'IoT UB — Staff of Research & Development', s: 'July 2022 – March 2024. IoT R&D, building interfaces, leading web division.' }] },
      { lbl: 'Projects', items: [{ t: 'Project Cangat — Hydroponic Monitoring System', s: 'cangar-europa-server.web.app · PIC Website Division · Vue.js + Firebase · Real-time IoT monitoring in Cangar, Malang.' }] },
      { lbl: 'Awards', items: [{ t: '🏆 1st Place — Scientific Proposal PKM Dekan Cup', s: 'Faculty of Engineering, Universitas Brawijaya · January 2022' }] },
      { lbl: 'Skills', items: [{ t: 'IoT pipeline: sensor → connectivity → real-time web UI' }, { t: 'Vue.js + Firebase real-time dashboards' }] }
    ]
  },
  {
    year: '2023', focus: 'Impact & Recognition',
    title: 'Patent · PKM Dikti Funded · BRIN Internship · 1st Place National Essay',
    stats: [{ v: '🏆 1st', k: 'National Essay' }, { v: '1', k: 'Patent' }, { v: 'BRIN', k: 'Internship' }],
    body: 'The <b>busiest year</b> — PKM Dikti funding, lab assistant role, BRIN internship, national essay championship, and a first patent. Also explored <b>AI (YOLOv8)</b> and startup ideation.',
    badges: ['📄 Patent: PIKO', '🏆 Juara 1 LMI Essay (National)', 'PKM Dikti Funded', 'BRIN-ORPA Intern', 'Lab Assistant IoT UB', 'Startup Incubation'],
    wins: ['🏆 Juara 1 LMI Essay (National)', '📄 Patent: PIKO'],
    cats: [
      { lbl: 'Work & Lab', items: [
        { t: 'Lab Assistant — IoT & Smart Computing Lab UB', s: 'April 2023 – Feb 2024. Developed practicum modules. Taught Basic Microcontroller & Arduino IDE.' },
        { t: 'Internship — BRIN ORPA Bogor', s: 'Dec 2023 – Feb 2024. Built vibration monitoring & control for rockets using external ADC/DAC via SPI on Arduino Mega 2560.' }
      ]},
      { lbl: 'Projects', items: [
        { t: 'IoT UB Organisation Website', s: 'iot.ub.ac.id · Coordinator · Vue.js + Tailwind CSS + Firebase' },
        { t: 'PKM Community Service — Waste Processing at Tumpang Lestari TPS', s: 'Pyrolysis + RDF incineration integrated with electrical monitoring.' },
        { t: 'AI Object Detection — YOLOv8 + Google Colab', s: 'Personal exploration into computer vision.' }
      ]},
      { lbl: 'Patents', items: [{ t: '📄 Patent: PIKO — Waste Processing Technology', s: 'Pyrolysis + condensation + RDF incineration + electrical monitoring. October 2023' }] },
      { lbl: 'Awards', items: [
        { t: '🏆 1st Place — LMI National Essay Competition', s: 'Lembaga Manajemen Infaq Nasional · Environmental theme · November 2023' },
        { t: 'Finalist & Incubation — TUJUBELASAN Startup', s: 'CFO role · Reached final + incubation stages.' },
        { t: 'PKM Dikti 2023 Funded', s: 'Ministry of Education, Culture, Research & Technology RI · June 2023' }
      ]}
    ]
  },
  {
    year: '2024', focus: 'Leadership & Pivot',
    title: 'Lab Coordinator · PT INKA Project · National Awards · WPT Focus Begins',
    stats: [{ v: '2', k: 'National Awards' }, { v: '2', k: 'Patents' }, { v: 'WPT', k: 'Career Pivot' }],
    body: '<b>Full leadership</b> across multiple institutions simultaneously. Lab Coordinator, Research Assistant at CDP UB, commissioned project for <b>PT INKA</b>, two national wins. Made a <b>deliberate pivot toward Wireless Power Transfer (WPT)</b>.',
    badges: ['Lab Coordinator', 'Research Asst. CDP UB', 'PT INKA Project', 'WaterGuard', '📄 Patent: Hydrozen', '🏆 TSIC 2024 Juara 2 (National)', '🏆 Sigma Business Plan Juara 3 (National)', 'PMW Funded', 'Start-up Funding'],
    wins: ['🏆 TSIC 2024 Juara 2 (National)', '🏆 Sigma Business Plan Juara 3 (National)', '📄 Patent: Hydrozen'],
    cats: [
      { lbl: 'Work & Lab', items: [
        { t: 'Lab Coordinator — IoT & Smart Computing Lab UB', s: 'March 2024 – April 2025. Led 6 assistants. 3 practicum cycles incl. external POLTEKAD.' },
        { t: 'Research Assistant — CDP Laboratory, Universitas Brawijaya', s: 'July 2024 – April 2025. Led WaterGuard project. IoT teaching for 150+ SMA students.' }
      ]},
      { lbl: 'Organisation', items: [{ t: 'IoT UB — Manager of Media & Publication', s: 'March 2024 – March 2025. Revitalized Broditech entity. Digital marketing + iot.ub.ac.id.' }] },
      { lbl: 'Projects', items: [
        { t: 'PT INKA — Ethernet Modbus TCP/IP Temperature Display Module', s: 'June–July 2024. Arduino Nano Every + LED Matrix via Ethernet + Modbus for PLC. Railway manufacturing standards.' },
        { t: 'WaterGuard — Smart Fish Pond Monitoring', s: 'Solar-powered buoy. Turbidity, Temp, TDS. Real-time dashboard. Pesantren, Jember.' },
        { t: 'IoT Lab Website Development', s: 'iot.ub.ac.id/#/laboratory · Coordinator role.' }
      ]},
      { lbl: 'Patents & Funding', items: [
        { t: '📄 Patent: Hydrozen — Smart IoT Aquarium System', s: 'Automatic water temp controller. June 2024' },
        { t: 'PMW Funding + Brawijaya Start-up Action Funding (WPT team, 8 members)', s: 'June & December 2024' }
      ]},
      { lbl: 'Awards', items: [
        { t: '🏆 2nd Place — TSIC 2024 National Innovation Competition', s: 'UNESA · OHS subtheme · July 2024' },
        { t: '🏆 3rd Place — SIGMA Business Plan Competition', s: 'Telkom University · AI-based smart farming · November 2024' }
      ]},
      { lbl: 'Career Pivot', items: [{ t: 'Began deep focus on Wireless Power Transfer (WPT)', s: 'Identified WPT as high-opportunity, underexplored field. Started study in magnetics, resonance, analog power electronics.' }] }
    ]
  },
  {
    year: '2025', focus: 'WPT Research & Graduation',
    title: 'Thesis · Graduated · Published · Founded Charless WPT Startup',
    stats: [{ v: '🎓', k: 'Graduated' }, { v: '📰', k: 'Published' }, { v: '2×', k: 'Startup Funding' }],
    body: 'Final year — <b>100% focused on WPT</b>. Founded "Charless" startup, built MVP wireless charging table, completed and defended thesis. <b>Graduated</b>. Published in TEUB journal.',
    badges: ['🎓 B.Eng Graduated', '📰 TEUB Journal Published', 'Charless (2× Hibah)', 'WPT Thesis', 'IELTS 6.5', 'TOEFL ITP 570'],
    wins: ['🎓 B.Eng Graduated', '📰 TEUB Journal Published'],
    cats: [
      { lbl: 'Education & Graduation', items: [
        { t: '🎓 Graduated — B.Eng Electrical Engineering, Universitas Brawijaya · 2025', s: 'Major: Electronics' },
        { t: 'Thesis: Design & Development of 140 kHz Magnetic Resonant Coupling WPT System for IoT Devices', s: 'Custom analog circuit, hand-wound coils, PCB, resonance tuning at 140.2 kHz, FLIR thermal + oscilloscope validation.' }
      ]},
      { lbl: 'Publication', items: [{ t: '📰 Published — TEUB Student Journal', s: '"Design and Development of a 140 kHz Magnetic Resonant Coupling WPT System for IoT Devices" · elektro.studentjournal.ub.ac.id/index.php/teub/article/view/2264 · July 2025' }] },
      { lbl: 'Startup', items: [{ t: 'Founded Charless — WPT commercial wireless charging startup', s: '8-person team · 2× hibah funding · MVP: wireless charging table (phone charges placed on surface, no pad).' }] },
      { lbl: 'Certifications', items: [{ t: 'IELTS 6.5 · TOEFL ITP 570 · Microsoft Office IT Test', s: 'September & July 2025' }] }
    ]
  },
  {
    year: '2026', focus: "What's Next",
    title: 'Graduate School Prep · AI Edge Computing · WPT Research Continues',
    stats: [{ v: 'Jetson', k: 'Orin Nano' }, { v: 'YOLOv11', k: 'Edge AI' }],
    body: '<b>No wasted days.</b> Preparing for graduate school to pursue deeper WPT research at <b>higher power levels</b> while independently conducting AI edge computing research and building a trading bot.',
    badges: ['Jetson Orin Nano', 'YOLOv11 Edge AI', 'AI Trading Bot', 'Graduate School Prep', 'WPT High-Power Research'],
    wins: [],
    cats: [
      { lbl: 'Graduate School Prep', items: [
        { t: 'Preparing international graduate school applications', s: 'Focus: WPT — higher power, electromagnetic design, power electronics' },
        { t: 'English proficiency improvement (IELTS target for admission)' }
      ]},
      { lbl: 'Independent Research', items: [
        { t: 'AI Edge Computing — Jetson Orin Nano', s: 'Real-time object detection: YOLOv11 + external camera, Python + Google libraries. Fully on edge hardware.' },
        { t: 'AI-Integrated Trading Bot', s: 'Built and improving accuracy. Next: AI model integration for smarter pattern detection.' }
      ]}
    ]
  }
];

// ── TIMELINE LOGIC ───────────────────────────────────────
var tlCur = 0, tlTimer = null, tlProgTimer = null, tlAutoStopped = false, tlInView = false;
var TL_DUR = 5000;

function tlPick(idx, byUser, dir) {
  if (byUser) {
    tlStopAuto();
    if (idx === tlCur) return;
  }
  dir = dir || (idx >= tlCur ? 1 : -1);
  tlCur = idx;
  document.querySelectorAll('.tl-tab').forEach(function(t, i) { t.classList.toggle('on', i === idx); });
  tlRenderCard(idx, true, dir);
  if (!byUser) {
    tlResetBars();
    tlStartBar();
  }
}

function tlNav(dir) {
  var next = (tlCur + dir + TL.length) % TL.length;
  tlPick(next, true, dir);
}

function tlStartBar() {
  clearInterval(tlProgTimer);
  var bar = document.getElementById('tlProgress');
  if (!bar) return;
  bar.style.width = '0%';
  var t0 = Date.now();
  tlProgTimer = setInterval(function() {
    var pct = Math.min(100, ((Date.now() - t0) / TL_DUR) * 100);
    bar.style.width = pct + '%';
    if (pct >= 100) clearInterval(tlProgTimer);
  }, 30);
}

function tlResetBars() {
  var b = document.getElementById('tlProgress');
  if (b) b.style.width = '0%';
}

function tlRenderCard(idx, animate, dir) {
  var d = TL[idx];
  var stats = d.stats.map(function(s) {
    return '<div><div class="tl-sv">' + s.v + '</div><div class="tl-sk">' + s.k + '</div></div>';
  }).join('');
  var badges = d.badges.map(function(b) {
    return '<span class="tl-badge' + (d.wins.indexOf(b) >= 0 ? ' win' : '') + '">' + b + '</span>';
  }).join('');

  var enterClass = dir < 0 ? ' enter enter-left' : ' enter enter-right';
  var exitClass = dir < 0 ? 'exit exit-right' : 'exit exit-left';
  var cardHtml =
    '<div class="tl-card' + (animate ? enterClass : '') + '">' +
      '<div class="tl-main">' +
        '<div class="tl-focus">' + d.focus + '</div>' +
        '<div class="tl-ttl">' + d.title + '</div>' +
        '<div class="tl-body">' + d.body + '</div>' +
        '<div class="tl-badges">' + badges + '</div>' +
      '</div>' +
      '<div class="tl-side">' +
        '<div class="tl-yr-big">' + d.year + '</div>' +
        '<div class="tl-stats">' + stats + '</div>' +
      '</div>' +
      '<button class="tl-more" onclick="tlOpenModal(' + idx + ')">Full story of ' + d.year + ' →</button>' +
    '</div>';

  var holder = document.getElementById('tlCard');
  var oldCard = holder.querySelector('.tl-card:not(.exit)');
  if (animate && oldCard) {
    oldCard.classList.remove('enter', 'enter-left', 'enter-right');
    oldCard.classList.add.apply(oldCard.classList, exitClass.split(' '));
    holder.insertAdjacentHTML('beforeend', cardHtml);
    setTimeout(function() {
      holder.querySelectorAll('.tl-card.exit').forEach(function(card) { card.remove(); });
    }, 420);
  } else {
    holder.innerHTML = cardHtml;
  }
}

function tlOpenModal(idx) {
  tlStopAuto();
  var d = TL[idx];
  var prevIdx = (idx - 1 + TL.length) % TL.length;
  var nextIdx = (idx + 1) % TL.length;
  var catsHtml = d.cats.map(function(cat) {
    var items = cat.items.map(function(item) {
      return '<div class="tm-item"><div class="tm-dot"></div><div class="tm-txt">' +
        item.t + (item.s ? '<small>' + item.s + '</small>' : '') + '</div></div>';
    }).join('');
    return '<div><div class="tm-sec-lbl">' + cat.lbl + '</div><div class="tm-items">' + items + '</div></div>';
  }).join('');

  var badges = d.badges.map(function(b) {
    return '<span class="tl-badge' + (d.wins.indexOf(b) >= 0 ? ' win' : '') + '">' + b + '</span>';
  }).join('');

  document.getElementById('tlBox').innerHTML =
    '<button class="m-close" onclick="closeModal(\'tlModal\')">✕</button>' +
    '<div class="tm-hdr">' +
      '<div class="tm-yr">' + d.year + '</div>' +
      '<div class="tm-focus">' + d.focus + '</div>' +
      '<div class="tm-ttl">' + d.title + '</div>' +
      '<div class="tm-sum">' + d.body + '</div>' +
    '</div>' +
    '<div class="tm-body">' +
      catsHtml +
      '<div><div class="tm-sec-lbl">Highlights</div><div class="tm-badges">' + badges + '</div></div>' +
      '<div class="tm-story-nav">' +
        '<button onclick="tlModalNav(' + prevIdx + ')"><span>&#8249;</span><small>Previous</small>' + TL[prevIdx].year + '</button>' +
        '<button onclick="tlModalNav(' + nextIdx + ')"><small>Next story</small>' + TL[nextIdx].year + '<span>&#8250;</span></button>' +
      '</div>' +
    '</div>';

  openModal('tlModal');
}

function tlModalNav(idx) {
  tlPick(idx, true);
  tlOpenModal(idx);
  document.getElementById('tlBox').scrollTop = 0;
}

// auto-advance
function tlStopAuto() {
  tlAutoStopped = true;
  clearTimeout(tlTimer);
  clearInterval(tlProgTimer);
  tlResetBars();
}

function tlStartAutoCycle() {
  clearTimeout(tlTimer);
  clearInterval(tlProgTimer);
  tlResetBars();

  if (tlAutoStopped || !tlInView) return;

  tlStartBar();
  tlTimer = setTimeout(tlAdvance, TL_DUR);
}

function tlAdvance() {
  if (tlAutoStopped || !tlInView) return;
  tlPick((tlCur + 1) % TL.length, false);
  tlTimer = setTimeout(tlAdvance, TL_DUR);
}

tlRenderCard(0, false);
document.querySelectorAll('.tl-tab').forEach(function(t, i) { t.classList.toggle('on', i === 0); });
tlResetBars();

var tlSection = document.getElementById('journey');
if ('IntersectionObserver' in window && tlSection) {
  var tlObserver = new IntersectionObserver(function(entries) {
    tlInView = entries[0].isIntersecting;
    if (tlInView) {
      tlStartAutoCycle();
    } else {
      clearTimeout(tlTimer);
      clearInterval(tlProgTimer);
      tlResetBars();
    }
  }, { threshold: 0.45 });
  tlObserver.observe(tlSection);
} else {
  tlInView = true;
  tlStartAutoCycle();
}

// ── PROJECT DATA ─────────────────────────────────────────
var PROJ = {
  rafinance: {
    title: 'Rafinance',
    sub: 'Personal Finance Web App · Vue.js + Firebase · Vercel',
    desc: 'A personal finance web application for tracking income, expenses, and financial goals with a clean, real-time dashboard. Features <b>daily/weekly/monthly cash flow charts</b>, category-based analysis, and financial health indicators. Built with Vue.js 3 + Tailwind CSS, backed by <b>Firebase Realtime Database</b> for instant sync.',
    tags: ['Vue.js 3', 'Tailwind CSS', 'Firebase', 'Vercel', 'Real-time DB', 'UI/UX'],
    imgs: ['img/rafi1.jpeg', 'img/rafi2.jpeg'],
    link: { label: 'Live Demo ↗', url: 'http://rafinance-peach.vercel.app/' }
  },
  iotlab: {
    title: 'IoT Lab Website',
    sub: 'Laboratory Profile · iot.ub.ac.id/#/laboratory · Web Coordinator',
    desc: 'Official website for the <b>IoT & Smart Computing Laboratory</b> at Universitas Brawijaya. Designed and developed the full frontend covering lab profile, research areas, organizational structure, and practicum resources. Built with Vue.js 3 + Tailwind CSS + <b>Google Firebase</b>, hosted on UB\'s internal server.',
    tags: ['Vue.js 3', 'Tailwind CSS', 'Firebase', 'Internal Hosting UB', 'Web Coordinator'],
    imgs: ['img/lab1.jpeg', 'img/lab2.jpeg'],
    link: { label: 'Visit Site ↗', url: 'https://iot.ub.ac.id/#/laboratory' }
  },
  icgc: {
    title: 'ICGC Registration Platform',
    sub: 'Indonesian Collegiate Golf Competition · icgc-registration.web.app',
    desc: 'Registration platform for the <b>Indonesian Collegiate Golf Competition</b>, a national collegiate tournament. Features multi-step participant registration, identity document management, team grouping, and admin verification. UI follows a <b>dark-gold brand identity</b>. Built with Vue.js 3 + Supabase (PostgreSQL), hosted on Firebase.',
    tags: ['Vue.js 3', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Firebase Hosting', 'UI/UX'],
    imgs: ['img/icgc.jpeg'],
    link: { label: 'Live Site ↗', url: 'https://icgc-registration.web.app/#/' }
  },
  waterguard: {
    title: 'WaterGuard — Smart Fish Pond Monitoring',
    sub: 'IoT Hardware + Software · CDP Lab UB × FPIK · Jember, 2024',
    desc: 'A <b>solar-powered floating IoT buoy</b> monitoring fish pond water quality in real time. Deployed at a pesantren in Jember. Monitors <b>turbidity, water temperature, and TDS</b>, transmitting data wirelessly to a custom mobile dashboard. Led a <b>6-person team</b> across hardware, software, programming, and mechanics divisions.',
    tags: ['Arduino', 'MQTT', 'Turbidity Sensor', 'TDS Sensor', 'Temperature', 'Solar Power', 'Mobile UI', 'Team Lead (6 people)'],
    imgs: ['img/wg_app.jpeg', 'img/wg_pond.jpeg', 'img/wg_dev.jpeg', 'img/wg_pres.jpeg']
  },
  inka: {
    title: 'PT INKA — Ethernet Modbus TCP/IP Temperature Display',
    sub: 'Industrial IoT · Commissioned · PT Industri Kereta Api · 2024',
    desc: 'A commissioned hardware module for <b>PT INKA</b> (Indonesia\'s state railway manufacturer). Reads temperature and humidity directly from an industrial <b>PLC via Ethernet using Modbus TCP/IP</b>, then displays it on an <b>LED matrix running text display</b> inside train passenger compartments. Built on Arduino Nano Every, validated with Modbus Poll and real PLC communication.',
    tags: ['Arduino Nano Every', 'Modbus TCP/IP', 'Ethernet', 'LED Matrix', 'PLC Integration', 'Industrial IoT', 'Configurable IP/ID'],
    imgs: ['img/inka_led.jpeg', 'img/inka_pcb.jpeg', 'img/inka_sw.jpeg', 'img/inka_lab.jpeg']
  },
  wpt: {
    title: 'WPT System for IoT Devices — Undergraduate Thesis',
    sub: 'Published · TEUB Journal 2025 · 140 kHz Magnetic Resonant Coupling',
    desc: 'Designed a <b>Wireless Power Transfer (WPT) system</b> for low-power IoT devices, built from scratch. Custom <b>analog circuits</b> (H-bridge inverter, resonant tank), hand-wound copper coils, and custom <b>PCB layout</b>. Tuned to <b>140.2 kHz</b> resonant frequency. Thermal validation with <b>FLIR E30</b>. Published in TEUB journal. Technical foundation of the Charless WPT startup.',
    tags: ['WPT', 'Magnetic Resonant Coupling', '140 kHz', 'Analog Circuit Design', 'H-Bridge Inverter', 'Custom Coil', 'PCB Design', 'FLIR Thermal', 'Oscilloscope', 'Published'],
    imgs: ['img/wpt_test.jpeg', 'img/wpt_osc.jpeg', 'img/wpt_pcb.jpeg', 'img/wpt_therm.jpeg'],
    link: { label: 'Read Publication ↗', url: 'https://elektro.studentjournal.ub.ac.id/index.php/teub/article/view/2264' }
  }
};

// ── PROJECT MODAL ─────────────────────────────────────────
var pmKey = '', pmIdx = 0;

function openProj(key) {
  pmKey = key; pmIdx = 0;
  renderProjModal();
  openModal('prjModal');
}

function renderProjModal() {
  var d = PROJ[pmKey];
  var imgs = d.imgs;
  var n = imgs.length;

  // gallery: main image + thumbs
  var thumbsHtml = n > 1
    ? '<div class="pm-thumbs">' + imgs.map(function(src, i) {
        return '<div class="pm-thumb' + (i === 0 ? ' on' : '') + '" id="pmThumb' + i + '" onclick="pmGoTo(' + i + ')">' +
               '<img src="' + src + '" loading="lazy" alt=""/></div>';
      }).join('') + '</div>'
    : '';

  var tags = d.tags.map(function(t) { return '<span class="tag hi">' + t + '</span>'; }).join('');
  var link = d.link
    ? '<a href="' + d.link.url + '" target="_blank" rel="noopener" class="pm-link">' + d.link.label + '</a>'
    : '';

  document.getElementById('prjBox').innerHTML =
    '<button class="m-close" onclick="closeModal(\'prjModal\')">✕</button>' +
    '<div class="pm-gal">' +
      '<div class="pm-main-wrap">' +
        '<img class="pm-main" id="pmMain" src="' + imgs[0] + '" alt="' + d.title + '" onclick="pmOpenLb()"/>' +
        '<button class="pm-zoom" onclick="pmOpenLb()" aria-label="Zoom image">⌕</button>' +
      '</div>' +
      '<div class="pm-nav-row">' +
        '<button class="pm-nav-btn" id="pmL" onclick="pmGoTo(pmIdx-1)"' + (n < 2 ? ' disabled' : '') + '>&#8249;</button>' +
        (n > 1 ? '<span class="pm-ctr" id="pmCtr">1 / ' + n + '</span>' : '<span></span>') +
        '<button class="pm-nav-btn" id="pmR" onclick="pmGoTo(pmIdx+1)"' + (n < 2 ? ' disabled' : '') + '>&#8250;</button>' +
      '</div>' +
      thumbsHtml +
    '</div>' +
    '<div class="pm-body">' +
      '<div class="pm-title">' + d.title + '</div>' +
      '<div class="pm-sub">' + d.sub + '</div>' +
      '<div class="pm-desc">' + d.desc + '</div>' +
      '<div class="tags" style="margin-bottom:1rem">' + tags + '</div>' +
      link +
    '</div>';
}

function pmGoTo(idx) {
  var imgs = PROJ[pmKey].imgs;
  pmIdx = ((idx % imgs.length) + imgs.length) % imgs.length;
  document.getElementById('pmMain').src = imgs[pmIdx];
  var ctr = document.getElementById('pmCtr');
  if (ctr) ctr.textContent = (pmIdx + 1) + ' / ' + imgs.length;
  document.querySelectorAll('.pm-thumb').forEach(function(t, i) { t.classList.toggle('on', i === pmIdx); });
}

function pmOpenLb() {
  openLb(PROJ[pmKey].imgs, pmIdx);
}
