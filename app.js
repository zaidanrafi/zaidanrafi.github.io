// ── Language (EN / 繁體中文) ─────────────────────────────
var EN_UI = {
  'ui.langBtn': '中文',
  'ui.langLabel': '切換為繁體中文',
  'ui.tlMore': function (y) { return 'Full story of ' + y + ' →'; },
  'ui.prev': 'Previous',
  'ui.next': 'Next story',
  'ui.highlights': 'Highlights',
  'ui.zoom': 'Zoom image',
  'ui.sending': 'Sending…',
  'ui.sent': "Message sent! I'll get back to you soon.",
  'ui.invalid': 'Please enter your name, a valid email and a message (at least 10 characters).',
  'ui.links': 'Please include at most 2 links in your message.',
  'ui.wait': 'Please wait a minute before sending another message.',
  'ui.daily': 'Message limit reached for today. Please email me directly.',
  'ui.captcha': 'Please tick "I\'m not a robot" first.',
  'ui.tooMany': 'Too many messages. Please wait a minute and try again.',
  'ui.error': 'Something went wrong. Email me at zzaidanrafi@gmail.com'
};
var LANG = (function () {
  var q = new URLSearchParams(location.search).get('lang');
  if (q) return /^zh/i.test(q) ? 'zh' : 'en';
  try { var saved = localStorage.getItem('zr_lang'); if (saved === 'zh' || saved === 'en') return saved; } catch (e) {}
  var langs = navigator.languages || [navigator.language || ''];
  return langs.some(function (l) { return /^zh/i.test(l); }) ? 'zh' : 'en';
})();
function T(key, arg) {
  var v = (LANG === 'zh' && typeof ZH !== 'undefined' && key in ZH) ? ZH[key] : EN_UI[key];
  return typeof v === 'function' ? v(arg) : v;
}
function curTL()   { return LANG === 'zh' && typeof TL_ZH !== 'undefined' ? TL_ZH : TL; }
function curPROJ(key) {
  var base = PROJ[key];
  if (LANG !== 'zh' || typeof PROJ_ZH === 'undefined' || !PROJ_ZH[key]) return base;
  var z = PROJ_ZH[key], out = {};
  for (var k in base) out[k] = base[k];
  out.title = z.title; out.sub = z.sub; out.desc = z.desc; out.tags = z.tags;
  if (base.link && z.linkLabel) out.link = { label: z.linkLabel, url: base.link.url };
  return out;
}
var EN_TEXT = {};       // original English, captured from the DOM once
var EN_META = { title: document.title, desc: (document.getElementById('metaDesc') || {}).content };
function applyLang(lang, persist) {
  LANG = lang;
  var zh = lang === 'zh';
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    if (!(k in EN_TEXT)) EN_TEXT[k] = el.innerHTML;
    el.innerHTML = zh && k in ZH ? ZH[k] : EN_TEXT[k];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
    var k = el.getAttribute('data-i18n-ph');
    if (!(('ph:' + k) in EN_TEXT)) EN_TEXT['ph:' + k] = el.placeholder;
    el.placeholder = zh && k in ZH ? ZH[k] : EN_TEXT['ph:' + k];
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
    var k = el.getAttribute('data-i18n-aria');
    if (!(('aria:' + k) in EN_TEXT)) EN_TEXT['aria:' + k] = el.getAttribute('aria-label');
    el.setAttribute('aria-label', zh && k in ZH ? ZH[k] : EN_TEXT['aria:' + k]);
  });
  document.querySelectorAll('.cv-link').forEach(function (a) {
    a.href = zh ? 'Zaidan_Rafi_CV_ZH.pdf' : 'Zaidan_Muhammad_Rafi_CV.pdf';
  });
  document.documentElement.lang = zh ? 'zh-Hant-TW' : 'en';
  document.title = zh ? ZH['meta.title'] : EN_META.title;
  var md = document.getElementById('metaDesc'); if (md) md.content = zh ? ZH['meta.desc'] : EN_META.desc;
  var cn = document.getElementById('canonical'); if (cn) cn.href = 'https://zaidanrafi.github.io/' + (zh ? '?lang=zh-TW' : '');
  var lb = document.getElementById('langBtn');
  if (lb) { lb.textContent = T('ui.langBtn'); lb.setAttribute('aria-label', T('ui.langLabel')); lb.lang = zh ? 'en' : 'zh-Hant'; }
  if (persist) {
    try { localStorage.setItem('zr_lang', lang); } catch (e) {}
    var u = new URL(location.href);
    if (zh) u.searchParams.set('lang', 'zh-TW'); else u.searchParams.delete('lang');
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  }
  if (typeof tlRenderCard === 'function' && document.getElementById('tlCard')) {
    tlRenderCard(tlCur, false);
    if (document.getElementById('tlModal').classList.contains('on')) tlOpenModal(tlCur);
    if (document.getElementById('prjModal').classList.contains('on')) renderProjModal();
  }
}
document.getElementById('langBtn').addEventListener('click', function () {
  applyLang(LANG === 'zh' ? 'en' : 'zh', true);
});

// ── Contact form (EmailJS) + anti-spam ───────────────────
// The EmailJS public key and IDs are public by design. Browser-side checks
// below stop simple bots only; real protection is reCAPTCHA v2 enabled on the
// EmailJS template, plus a fixed "To Email" in the template settings.
var EMAILJS = { publicKey: 'q3x_GEtpFJLWd_n0T', serviceId: 'service_nscfnyq', templateId: 'template_a1rxujr' };
// Paste a Google reCAPTCHA v2 (checkbox) SITE key here after enabling
// reCAPTCHA with the SECRET key in the EmailJS template settings.
var RECAPTCHA_SITE_KEY = '';
var LIMITS = { name: 80, email: 120, subject: 120, message: 2000, minMessage: 10, maxLinks: 2,
               minFillMs: 4000, cooldownMs: 60000, maxPerDay: 3 };

(function () {
  var form = document.getElementById('cForm');
  var btn  = document.getElementById('cBtn');
  var fb   = document.getElementById('cFb');
  var loadedAt = Date.now();
  var sending = false;
  var captchaId = null;

  if (window.emailjs) {
    emailjs.init({
      publicKey: EMAILJS.publicKey,
      blockHeadless: true,                                          // rejects headless browsers
      limitRate: { id: 'zr-contact', throttle: LIMITS.cooldownMs }  // SDK-level throttle
    });
  }

  if (RECAPTCHA_SITE_KEY) {
    window.onRecaptchaLoad = function () {
      captchaId = grecaptcha.render('cCaptcha', {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      });
    };
    var sc = document.createElement('script');
    sc.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    sc.async = true; sc.defer = true;
    document.head.appendChild(sc);
  }

  function say(msg, ok) {
    fb.textContent = msg;
    fb.style.color = ok ? 'var(--accent)' : '#c0392b';
    fb.style.display = 'inline';
  }
  // Strip control characters; single-line fields also lose CR/LF
  function clean(v, max, multiline) {
    var str = String(v || '');
    if (str.normalize) str = str.normalize('NFC');
    str = multiline ? str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
                    : str.replace(/[\u0000-\u001F\u007F]/g, ' ');
    return str.trim().slice(0, max);
  }
  var EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
  var LOG_KEY = 'zr_contact_log';
  function readLog() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]').filter(function (t) { return Date.now() - t < 864e5; }); }
    catch (e) { return []; }
  }
  function writeLog(log) { try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) {} }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (sending) return;

    // 1) Honeypot + time trap: pretend success so bots learn nothing
    if (document.getElementById('cWebsite').value !== '' || Date.now() - loadedAt < LIMITS.minFillMs) {
      say(T('ui.sent'), true);
      form.reset();
      return;
    }

    // 2) Validate + sanitise
    var data = {
      from_name: clean(document.getElementById('cName').value, LIMITS.name),
      reply_to:  clean(document.getElementById('cEmail').value, LIMITS.email),
      subject:   clean(document.getElementById('cSubject').value, LIMITS.subject) || '(no subject)',
      message:   clean(document.getElementById('cMsg').value, LIMITS.message, true)
    };
    if (!data.from_name || !EMAIL_RE.test(data.reply_to) || data.message.length < LIMITS.minMessage) {
      say(T('ui.invalid'));
      return;
    }
    if ((data.message.match(/https?:\/\/|www\./gi) || []).length > LIMITS.maxLinks) {
      say(T('ui.links'));
      return;
    }

    // 3) Per-browser throttle
    var log = readLog();
    if (log.length && Date.now() - log[log.length - 1] < LIMITS.cooldownMs) { say(T('ui.wait')); return; }
    if (log.length >= LIMITS.maxPerDay) { say(T('ui.daily')); return; }

    // 4) CAPTCHA (when configured)
    if (RECAPTCHA_SITE_KEY) {
      var token = (window.grecaptcha && captchaId !== null) ? grecaptcha.getResponse(captchaId) : '';
      if (!token) { say(T('ui.captcha')); return; }
      data['g-recaptcha-response'] = token;
    }

    // 5) Send
    sending = true; btn.disabled = true; btn.textContent = T('ui.sending'); fb.style.display = 'none';
    try {
      if (!window.emailjs) throw new Error('EmailJS not loaded');
      await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, data);
      log.push(Date.now()); writeLog(log);
      say(T('ui.sent'), true);
      form.reset();
    } catch (err) {
      if (err && err.status === 429) say(T('ui.tooMany'));
      else say(T('ui.error'));
    } finally {
      if (RECAPTCHA_SITE_KEY && window.grecaptcha && captchaId !== null) grecaptcha.reset(captchaId);
      sending = false; btn.disabled = false; btn.textContent = (LANG === 'zh' ? ZH['f.send'] : 'Send message');
    }
  });
})();

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
    title: 'Started Electrical Engineering at Universitas Brawijaya',
    stats: [{ v: '2', k: 'Student orgs' }, { v: 'Year 1', k: 'EE, UB' }],
    body: 'First year of my electrical engineering degree: <b>calculus, physics and circuit theory</b>. Alongside my courses I taught myself <b>HTML, CSS, JavaScript and Vue.js</b> and joined two student organizations.',
    badges: ['SRE UB', 'GDSC UB', 'Self-taught Vue.js', 'Sololearn certificate'],
    wins: [],
    cats: [
      { lbl: 'Education', items: [{ t: 'BSc Electrical Engineering (Electronics), Universitas Brawijaya', s: 'Core courses: calculus, physics, circuit theory, electrical fundamentals.' }] },
      { lbl: 'Skills', items: [{ t: 'Self-taught web development: HTML, CSS, JavaScript, Vue.js', s: 'Front-End Web Development certificate, Sololearn (June 2021).' }] },
      { lbl: 'Organizations', items: [
        { t: 'SRE UB (Society of Renewable Energy)', s: 'Person in charge of day 1 of the SRE UB × UNDP ACCESS talk show.' },
        { t: 'GDSC UB (Google Developer Student Club)', s: 'Developer community and collaborative projects.' }
      ]}
    ]
  },
  {
    year: '2022', focus: 'IoT',
    title: 'Joined IoT UB: first IoT project and first competition win',
    stats: [{ v: '1st', k: 'Dekan Cup' }, { v: '1', k: 'IoT project' }],
    body: 'I moved my focus to <b>IoT</b>. I joined the IoT UB student organization, led the website division of a hydroponic farm monitoring project, and won <b>1st place in the faculty-level PKM Dekan Cup</b>.',
    badges: ['IoT UB, R&D staff', 'Project Cangar (website lead)', '1st Place, PKM Dekan Cup', 'Finalist, LP2PKM'],
    wins: ['1st Place, PKM Dekan Cup'],
    cats: [
      { lbl: 'Organization', items: [{ t: 'IoT UB, Research & Development Staff', s: 'July 2022 – March 2024. IoT research and development, building interfaces, leading the web division.' }] },
      { lbl: 'Projects', items: [{ t: 'Project Cangar: hydroponic farm monitoring', s: 'cangar-europa-server.web.app · Website division lead · Vue.js + Firebase · Real-time IoT monitoring for a hydroponic farm in Cangar, Malang.' }] },
      { lbl: 'Awards', items: [
        { t: '1st Place, PKM Dekan Cup scientific proposal competition', s: 'Faculty of Engineering, Universitas Brawijaya · January 2022' },
        { t: 'Finalist, LP2PKM scientific proposal competition', s: 'Universitas Brawijaya · February 2022' }
      ]},
      { lbl: 'Skills', items: [{ t: 'A full IoT pipeline: sensor, connectivity, real-time web interface' }, { t: 'Real-time dashboards with Vue.js and Firebase' }] }
    ]
  },
  {
    year: '2023', focus: 'Research & recognition',
    title: 'National funding, BRIN internship, first IP registration, national essay win',
    stats: [{ v: '1st', k: 'National essay' }, { v: '1', k: 'IP registration' }, { v: 'BRIN', k: 'Internship' }],
    body: 'A full year. Our proposal won <b>national PKM funding</b>, I became a lab assistant, interned at <b>BRIN</b>, won a <b>national essay competition</b>, and registered my first IP (PIKO). I also tried computer vision with <b>YOLOv8</b> and joined a startup ideation program.',
    badges: ['IP registration: PIKO', '1st Place, LMI National Essay', 'PKM national funding', 'BRIN-ORPA internship', 'Lab Assistant, IoT Lab UB', 'Startup incubation'],
    wins: ['1st Place, LMI National Essay', 'IP registration: PIKO'],
    cats: [
      { lbl: 'Work & Lab', items: [
        { t: 'Lab Assistant, IoT & Smart Computing Lab UB', s: 'March 2023 – March 2024. Co-wrote practicum modules and taught basic microcontrollers and the Arduino IDE.' },
        { t: 'Electronics Project Intern, BRIN Aerospace Research Organization (ORPA), Bogor', s: 'Dec 2023 – Feb 2024. Assembled a rocket vibration monitoring and control system, linking external ADC/DAC modules to an Arduino Mega 2560 over SPI. Added PID control to improve the response and the reliability of data readings.' }
      ]},
      { lbl: 'Projects', items: [
        { t: 'IoT UB organization website', s: 'iot.ub.ac.id · Coordinator · Vue.js + Tailwind CSS + Firebase' },
        { t: 'PKM community service: waste processing at Tumpang Lestari TPS', s: 'Pyrolysis and RDF incineration, integrated with an electrical monitoring system. I handled finances, social media and external relations.' },
        { t: 'Object detection with YOLOv8 and Google Colab', s: 'Personal exploration of computer vision.' }
      ]},
      { lbl: 'IP Registration', items: [{ t: 'PIKO: waste processing technology (registered IP, Indonesia)', s: 'Pyrolysis, condensation, RDF incineration and electrical monitoring. October 2023' }] },
      { lbl: 'Awards', items: [
        { t: '1st Place, LMI National Essay Competition', s: 'Lembaga Manajemen Infaq · Environment theme · November 2023' },
        { t: 'Finalist and incubation, TUJUBELASAN startup program', s: 'Co-founder and CFO; reached the final and the incubation stage.' },
        { t: 'PKM 2023 national funding', s: 'Indonesian Ministry of Education, Culture, Research and Technology · June 2023' }
      ]}
    ]
  },
  {
    year: '2024', focus: 'Leadership & WPT',
    title: 'Lab coordinator, PT INKA project, two national awards, start of the WPT focus',
    stats: [{ v: '2', k: 'National awards' }, { v: '2', k: 'IP registrations' }, { v: 'WPT', k: 'New focus' }],
    body: 'I took on more responsibility: <b>lab coordinator</b> at the IoT lab, <b>research assistant</b> at the CDP lab, a commissioned project for <b>PT INKA</b>, and two national awards. This is also the year I chose <b>Wireless Power Transfer</b> as my research direction.',
    badges: ['Lab Coordinator', 'Research Assistant, CDP UB', 'PT INKA project', 'WaterGuard', 'IP registration: Hydrozen', '2nd Place, TSIC 2024', '3rd Place, SIGMA', 'PMW funding', 'Start-up Action funding'],
    wins: ['2nd Place, TSIC 2024', '3rd Place, SIGMA', 'IP registration: Hydrozen'],
    cats: [
      { lbl: 'Work & Lab', items: [
        { t: 'Lab Coordinator, IoT & Smart Computing Lab UB', s: 'March 2024 – May 2025. Promoted from lab assistant. Led 6 assistants and handled staffing, equipment and external relations. Ran the 2024 recruitment, led the practicum module revision (including LoRa), and ran 3 practicum cycles, one of them for an external partner (POLTEKAD).' },
        { t: 'Research Assistant and Head of Smart Device Division, CDP Lab UB', s: 'July 2024 – May 2025. Developed smart device and WPT concepts and helped secure 2+ grants for long-term WPT work. Led WaterGuard and taught a hands-on IoT workshop for 150+ high school students.' }
      ]},
      { lbl: 'Organization', items: [{ t: 'Manager of Media & Publication, IoT UB', s: 'March 2024 – March 2025. Relaunched Broditech, the organization\'s business unit, and ran its digital marketing and the iot.ub.ac.id website.' }] },
      { lbl: 'Projects', items: [
        { t: 'PT INKA: Ethernet Modbus TCP/IP temperature display', s: 'June – July 2024. An Arduino Nano Every reads PLC data over Ethernet with Modbus and drives an LED matrix, built to railway manufacturing standards.' },
        { t: 'WaterGuard: smart fish pond monitoring', s: 'Solar-powered buoy measuring turbidity, temperature and TDS, with a real-time dashboard. Deployed at an Islamic boarding school in Jember.' },
        { t: 'IoT Lab website', s: 'iot.ub.ac.id/#/laboratory · Coordinator.' }
      ]},
      { lbl: 'IP & Funding', items: [
        { t: 'Hydrozen: smart IoT aquarium system (registered IP, Indonesia)', s: 'Automatic water temperature control. June 2024' },
        { t: 'PMW funding and Brawijaya Start-up Action funding (8-person WPT team)', s: 'June and December 2024' }
      ]},
      { lbl: 'Awards', items: [
        { t: '2nd Place, TSIC 2024 national innovation competition', s: 'Universitas Negeri Surabaya (UNESA) · Occupational health and safety category · July 2024' },
        { t: '3rd Place, SIGMA Business Plan Competition', s: 'Telkom University · AI-based smart farming · November 2024' }
      ]},
      { lbl: 'Research Direction', items: [{ t: 'Chose Wireless Power Transfer as my focus', s: 'WPT has real demand and relatively few people working on it. I started studying magnetics, resonance and power electronics in depth.' }] }
    ]
  },
  {
    year: '2025', focus: 'WPT thesis & graduation',
    title: 'WPT thesis, graduation, journal paper, Charless startup team',
    stats: [{ v: 'BSc', k: 'Graduated' }, { v: '1', k: 'Journal paper' }, { v: '2', k: 'Startup grants' }],
    body: 'My final year went into <b>WPT</b>. I led <b>Charless</b>, an 8-person WPT startup team, and built an MVP wireless charging table. I finished and defended my thesis, <b>graduated in July</b>, and published the work in the TEUB journal.',
    badges: ['BSc graduate', 'TEUB journal paper', 'Charless (2 grants)', 'WPT thesis', 'IELTS 6.5', 'TOEFL ITP 570'],
    wins: ['BSc graduate', 'TEUB journal paper'],
    cats: [
      { lbl: 'Education', items: [
        { t: 'BSc Electrical Engineering, Universitas Brawijaya · July 2025', s: 'Minor in Electronics · GPA 3.42 / 4.00' },
        { t: 'Thesis: Design and Development of a 140 kHz Magnetic Resonant Coupling WPT System for IoT Devices', s: 'Parallel-parallel resonant topology, PWM-driven half-bridge, hand-wound coils and a custom PCB. Tuned to 140.2 kHz, measured across loads, and validated with an oscilloscope and a FLIR thermal camera.' }
      ]},
      { lbl: 'Publication', items: [{ t: 'TEUB Student Journal, July 2025', s: '"Design and Development of a 140 kHz Magnetic Resonant Coupling WPT System for IoT Devices" · elektro.studentjournal.ub.ac.id/index.php/teub/article/view/2264' }] },
      { lbl: 'Startup', items: [{ t: 'Charless: WPT wireless charging startup', s: 'Led an 8-person team · 2 grants · MVP: a wireless charging table that charges a phone placed on its surface, with no separate pad.' }] },
      { lbl: 'Certifications', items: [{ t: 'IELTS 6.5 · TOEFL ITP 570 · Microsoft Office IT test', s: 'September and July 2025' }] }
    ]
  },
  {
    year: '2026', focus: 'Industry to graduate school',
    title: 'IoT NOC Engineer, then MSc at NSYSU on an MOE Taiwan Scholarship',
    stats: [{ v: 'NSYSU', k: 'MSc, Taiwan' }, { v: '65 W', k: 'WPT target' }, { v: 'MOE', k: 'Scholarship' }],
    body: 'I worked as an <b>IoT NOC Engineer</b>, handling live network and device incidents, then started an <b>MSc in Electrical Power Engineering at National Sun Yat-sen University</b> in Kaohsiung on an <b>MOE Taiwan Scholarship</b>. My research is on making WPT more efficient, aimed at <b>laptop-class (65 W) charging</b>.',
    badges: ['MSc, NSYSU', 'MOE Taiwan Scholarship', 'NOC Engineer (IoT)', 'Python automation', 'WPT efficiency research', 'Open to internships'],
    wins: ['MSc, NSYSU', 'MOE Taiwan Scholarship'],
    cats: [
      { lbl: 'Education', items: [
        { t: 'MSc, International Master\'s Program in Electrical Power Engineering (IMEPE), National Sun Yat-sen University', s: 'Sep 2026 – Aug 2028 · Kaohsiung, Taiwan · MOE Taiwan Scholarship (Taiwan Ministry of Education)' },
        { t: 'Courses: Power Electronic Converters, Power Conditioning Systems, Renewable Energy Applications' }
      ]},
      { lbl: 'Work', items: [
        { t: 'NOC Engineer (IoT Specialist), PT Geo Tekno Globalindo, Jakarta', s: 'May – Aug 2026. Handled network and IoT device incidents, tracing root causes and getting systems back online fast. Worked remotely with on-board engineers to fix connectivity problems in the field. Built Python tools that automated parts of the NOC data analysis.' }
      ]},
      { lbl: 'Research', items: [
        { t: 'Master\'s research: WPT efficiency', s: 'Sep 2026 – present. Studying how to raise WPT efficiency, with laptop-class (65 W) charging as the target application.' }
      ]},
      { lbl: 'Availability', items: [
        { t: 'Open to internships during the winter and summer school breaks', s: 'Full-time roles after graduation in 2028.' }
      ]},
      { lbl: 'Independent Projects', items: [
        { t: 'Edge AI on a Jetson Orin Nano', s: 'Real-time object detection with YOLOv11 and an external camera, written in Python and running fully on the edge device.' },
        { t: 'Trading bot with AI integration', s: 'Working, and being tuned for accuracy. Next step: adding an AI model for pattern detection.' }
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
  var next = (tlCur + dir + curTL().length) % curTL().length;
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
  var d = curTL()[idx];
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
      '<button class="tl-more" onclick="tlOpenModal(' + idx + ')">' + T('ui.tlMore', d.year) + '</button>' +
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
  var d = curTL()[idx];
  var prevIdx = (idx - 1 + curTL().length) % curTL().length;
  var nextIdx = (idx + 1) % curTL().length;
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
      '<div><div class="tm-sec-lbl">' + T('ui.highlights') + '</div><div class="tm-badges">' + badges + '</div></div>' +
      '<div class="tm-story-nav">' +
        '<button onclick="tlModalNav(' + prevIdx + ')"><span>&#8249;</span><small>' + T('ui.prev') + '</small>' + curTL()[prevIdx].year + '</button>' +
        '<button onclick="tlModalNav(' + nextIdx + ')"><small>' + T('ui.next') + '</small>' + curTL()[nextIdx].year + '<span>&#8250;</span></button>' +
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
  tlPick((tlCur + 1) % curTL().length, false);
  tlTimer = setTimeout(tlAdvance, TL_DUR);
}

tlCur = TL.length - 1;
tlRenderCard(tlCur, false);
document.querySelectorAll('.tl-tab').forEach(function(t, i) { t.classList.toggle('on', i === tlCur); });
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
    title: 'WaterGuard: Smart Fish Pond Monitoring',
    sub: 'IoT Hardware + Software · CDP Lab UB × FPIK · Jember · Jul 2024 – Mar 2025',
    desc: 'A <b>solar-powered floating IoT buoy</b> monitoring fish pond water quality in real time. Deployed at a pesantren in Jember. Monitors <b>turbidity, water temperature, and TDS</b>, transmitting data wirelessly to a custom mobile dashboard. Led a <b>6-person team</b> across hardware, software, programming, and mechanics divisions.',
    tags: ['Arduino', 'MQTT', 'Turbidity Sensor', 'TDS Sensor', 'Temperature', 'Solar Power', 'Mobile UI', 'Team Lead (6 people)'],
    imgs: ['img/wg_app.jpeg', 'img/wg_pond.jpeg', 'img/wg_dev.jpeg', 'img/wg_pres.jpeg']
  },
  inka: {
    title: 'PT INKA: Ethernet Modbus TCP/IP Temperature Display',
    sub: 'Industrial IoT · Commissioned · PT Industri Kereta Api · 2024',
    desc: 'A commissioned hardware module for <b>PT INKA</b> (Indonesia\'s state railway manufacturer). Reads temperature and humidity directly from an industrial <b>PLC via Ethernet using Modbus TCP/IP</b>, then displays it on an <b>LED matrix running text display</b> inside train passenger compartments. Built on Arduino Nano Every, validated with Modbus Poll and real PLC communication.',
    tags: ['Arduino Nano Every', 'Modbus TCP/IP', 'Ethernet', 'LED Matrix', 'PLC Integration', 'Industrial IoT', 'Configurable IP/ID'],
    imgs: ['img/inka_led.jpeg', 'img/inka_pcb.jpeg', 'img/inka_sw.jpeg', 'img/inka_lab.jpeg']
  },
  wpt: {
    title: 'WPT System for IoT Devices (Undergraduate Thesis)',
    sub: 'Published · TEUB Journal 2025 · 140 kHz Magnetic Resonant Coupling',
    desc: 'Designed and built a <b>140 kHz parallel-parallel resonant WPT system</b> for low-power IoT devices, from scratch. A <b>PWM-driven half-bridge</b> drives the resonant tank through hand-wound copper coils on custom <b>PCBs</b>. Tuned to <b>140.2 kHz</b>, then measured performance across loads on real hardware, with oscilloscope and <b>FLIR E30</b> thermal validation. Published in the TEUB journal (2025). Technical foundation of the Charless WPT startup, which won Brawijaya Start-up Action funding.',
    tags: ['WPT', 'Magnetic Resonant Coupling', '140 kHz', 'P-P Compensation', 'Half-bridge', 'PWM', 'Custom Coil', 'PCB Design', 'LTspice', 'FLIR Thermal', 'Oscilloscope', 'Published'],
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
  var d = curPROJ(pmKey);
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
        '<button class="pm-zoom" onclick="pmOpenLb()" aria-label="' + T('ui.zoom') + '">⌕</button>' +
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
  var imgs = curPROJ(pmKey).imgs;
  pmIdx = ((idx % imgs.length) + imgs.length) % imgs.length;
  document.getElementById('pmMain').src = imgs[pmIdx];
  var ctr = document.getElementById('pmCtr');
  if (ctr) ctr.textContent = (pmIdx + 1) + ' / ' + imgs.length;
  document.querySelectorAll('.pm-thumb').forEach(function(t, i) { t.classList.toggle('on', i === pmIdx); });
}

function pmOpenLb() {
  openLb(curPROJ(pmKey).imgs, pmIdx);
}

// initial language
applyLang(LANG, false);

// project cards: keyboard accessible
document.querySelectorAll('.pcard').forEach(function (c) {
  c.tabIndex = 0;
  c.setAttribute('role', 'button');
  c.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); }
  });
});
