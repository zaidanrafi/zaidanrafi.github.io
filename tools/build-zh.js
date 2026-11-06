// Builds zh-tw/index.html (Traditional Chinese page) from index.html + i18n.js.
//
//   node tools/build-zh.js
//
// Run it after every change to index.html or i18n.js, then commit both pages.
// The Chinese page is static HTML so search engines can index the Chinese text
// without running JavaScript; app.js still renders the timeline and projects.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const SITE = 'https://zaidanrafi.github.io';

// Cache-busting: stamp /style.css, /app.js, /i18n.js with a hash of their
// content so browsers fetch the new file right after a deploy
// (GitHub Pages tells browsers to cache assets for 10 minutes).
const crypto = require('crypto');
let enHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const file of ['style.css', 'app.js', 'i18n.js']) {
  const hash = crypto.createHash('sha1').update(fs.readFileSync(path.join(root, file))).digest('hex').slice(0, 8);
  const re = new RegExp(`(["'])/${file.replace('.', '\\.')}(\\?v=[0-9a-f]+)?\\1`, 'g');
  if (!re.test(enHtml)) throw new Error(`reference to /${file} not found in index.html`);
  enHtml = enHtml.replace(re, `$1/${file}?v=${hash}$1`);
}
fs.writeFileSync(path.join(root, 'index.html'), enHtml);
let html = enHtml;

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8') + ';this.ZH = ZH;', ctx);
const ZH = ctx.ZH;

const missing = new Set();
function zh(key) {
  if (!(key in ZH) || typeof ZH[key] !== 'string') { missing.add(key); return null; }
  return ZH[key];
}
function attr(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function replaceOnce(from, to) {
  const n = html.split(from).length - 1;
  if (n !== 1) throw new Error(`expected 1 match, found ${n}: ${from.slice(0, 80)}`);
  html = html.replace(from, to);
}

// 1) element text: <tag ... data-i18n="key" ...>inner</tag>
html = html.replace(/<(\w+)((?:\s[^>]*?)?\sdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
  (m, tag, attrs, key, inner) => {
    const v = zh(key);
    return v === null ? m : `<${tag}${attrs}>${v}</${tag}>`;
  });

// 2) placeholders and aria-labels
html = html.replace(/<[^>]*\sdata-i18n-ph="([^"]+)"[^>]*>/g, (tag, key) => {
  const v = zh(key);
  return v === null ? tag : tag.replace(/placeholder="[^"]*"/, `placeholder="${attr(v)}"`);
});
html = html.replace(/<[^>]*\sdata-i18n-aria="([^"]+)"[^>]*>/g, (tag, key) => {
  const v = zh(key);
  return v === null ? tag : tag.replace(/aria-label="[^"]*"/, `aria-label="${attr(v)}"`);
});

// 3) page language, head metadata
replaceOnce('<html lang="en">', '<html lang="zh-Hant-TW" data-lang="zh">');
html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${ZH['meta.title']}</title>`);
html = html.replace(/<meta name="description" content="[^"]*"\/>/, `<meta name="description" content="${attr(ZH['meta.desc'])}"/>`);
replaceOnce(`<link rel="canonical" href="${SITE}/"/>`, `<link rel="canonical" href="${SITE}/zh-tw/"/>`);
replaceOnce(`<meta property="og:url" content="${SITE}/"/>`, `<meta property="og:url" content="${SITE}/zh-tw/"/>`);
replaceOnce('<meta property="og:locale" content="en_US"/>', '<meta property="og:locale" content="zh_TW"/>');
replaceOnce('<meta property="og:locale:alternate" content="zh_TW"/>', '<meta property="og:locale:alternate" content="en_US"/>');
html = html.replace(/<meta property="og:title" content="[^"]*"\/>/, `<meta property="og:title" content="${attr(ZH['og.title'])}"/>`);
html = html.replace(/<meta property="og:description" content="[^"]*"\/>/, `<meta property="og:description" content="${attr(ZH['og.desc'])}"/>`);
html = html.replace(/<meta property="og:image:alt" content="[^"]*"\/>/, `<meta property="og:image:alt" content="${attr(ZH['og.imgAlt'])}"/>`);
html = html.replace(/<meta name="twitter:title" content="[^"]*"\/>/, `<meta name="twitter:title" content="${attr(ZH['og.title'])}"/>`);
html = html.replace(/<meta name="twitter:description" content="[^"]*"\/>/, `<meta name="twitter:description" content="${attr(ZH['og.desc'])}"/>`);
html = html.replace(/"@type":"ProfilePage","@id":"[^"]*","url":"[^"]*","name":"[^"]*","inLanguage":"en"/,
  `"@type":"ProfilePage","@id":"${SITE}/zh-tw/#profile","url":"${SITE}/zh-tw/","name":"${ZH['meta.title']}","inLanguage":"zh-Hant-TW"`);

// Chinese web fonts only on the Chinese page
html = html.replace('family=Outfit:wght@300;400;500&amp;display=swap',
  'family=Outfit:wght@300;400;500&amp;family=Noto+Sans+TC:wght@300;400;500&amp;family=Noto+Serif+TC:wght@500&amp;display=swap');

// 4) body bits that are not text nodes
html = html.split('href="/Zaidan_Muhammad_Rafi_CV.pdf"').join('href="/Zaidan_Rafi_CV_ZH.pdf"');
html = html.replace(/<button class="lang-btn" id="langBtn" type="button" aria-label="[^"]*" lang="zh-Hant">中文<\/button>/,
  '<button class="lang-btn" id="langBtn" type="button" aria-label="Switch to English" lang="en">EN</button>');
html = html.split('alt="Portrait of Zaidan Muhammad Rafi"').join('alt="趙伊登（Zaidan Muhammad Rafi）個人照"');

html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- GENERATED by tools/build-zh.js from index.html + i18n.js. Do not edit by hand. -->');

if (missing.size) {
  console.error('Missing zh translations:', [...missing].join(', '));
  process.exit(1);
}
fs.mkdirSync(path.join(root, 'zh-tw'), { recursive: true });
fs.writeFileSync(path.join(root, 'zh-tw', 'index.html'), html);
console.log('wrote zh-tw/index.html');
