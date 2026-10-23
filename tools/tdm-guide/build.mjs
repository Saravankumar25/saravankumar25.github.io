#!/usr/bin/env node
// Builds the TDM Guide static blog into public/blogs/tdm-guide/.
// Usage: node tools/tdm-guide/build.mjs [--check]
// Authoring units ("mini chapters") live in tools/tdm-guide/chapters/<NN-slug>/ (meta.json + *.html fragments).
// structure.json groups them into the 10 published chapters; each mini chapter becomes a numbered section.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "public/blogs/tdm-guide");
const chapDir = path.join(here, "chapters");
const SITE = "https://saravankumar25.github.io";
const checkOnly = process.argv.includes("--check");
const structure = JSON.parse(fs.readFileSync(path.join(here, "structure.json"), "utf8"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const pad = (n) => String(n).padStart(2, "0");

// ---------- link registries ----------
const lines = (f) => fs.readFileSync(path.join(here, f), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
const normUrl = (u) => u.replace(/#.*$/, "").replace(/\/$/, "");
const leads = new Set(lines("links.txt").map(normUrl)); // surfaced by search / supplied, NOT fetched
const verified = new Set(lines("verified-links.txt").map(normUrl)); // fetched and HTTP 200

// ---------- load authoring units ----------
const minis = {};
for (const d of fs.readdirSync(chapDir).sort()) {
  const dir = path.join(chapDir, d);
  if (!fs.statSync(dir).isDirectory() || !fs.existsSync(path.join(dir, "meta.json"))) continue;
  const meta = JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8"));
  const html = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort().map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  minis[meta.num] = { meta, html };
}

// old mini number -> where it lives now
const where = {};
for (const c of structure.chapters) c.sources.forEach((m, i) => { where[m] = { ch: c, k: i + 1, file: `${pad(c.num)}-${c.slug}.html`, id: `c${c.num}-s${i + 1}` }; });
const miniFileRe = /href="(\d\d)-[a-z0-9-]+\.html(#[^"]*)?"/g;
function rewriteHrefs(html) {
  return html.replace(miniFileRe, (m, nn, frag) => {
    const n = Number(nn);
    if (n === 99) return `href="${structure.extra.file}${frag || ""}"`;
    const w = where[n];
    if (!w) return m;
    return `href="${w.file}${frag || "#" + w.id}"`;
  });
}

const warnings = [], errors = [], leadLinks = [], staleRefs = [];

// ---------- assemble the 10 chapters ----------
function transformMini(html, oldNum, w) {
  let h = html;
  // demote headings: section h2 becomes h3, h3 becomes h4 (do h3 first to avoid double demotion)
  h = h.replace(/<(\/?)h3(\s|>)/g, "<$1h4$2").replace(/<(\/?)h2(\s|>)/g, "<$1h3$2");
  // renumber leading "OLD.x" in headings to "N.K.x"
  const num = new RegExp(`^(\\s*(?:<[^>]+>\\s*)*)${oldNum}\\.(\\d+)`);
  h = h.replace(/<(h[34])([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => `<${tag}${attrs}>${inner.replace(num, `$1${w.ch.num}.${w.k}.$2`)}</${tag}>`);
  h = h.replace(/\bthis chapter\b/g, "this section").replace(/\bThis chapter\b/g, "This section").replace(/Sources used in this section/g, "Sources used in this section");
  return rewriteHrefs(h);
}

const chapters = [];
for (const c of structure.chapters) {
  let html = "";
  const secs = [];
  c.sources.forEach((m, i) => {
    const mini = minis[m];
    const w = where[m];
    if (!mini) { warnings.push(`chapter ${c.num}: source ${m} not written yet`); return; }
    const days = mini.meta.days ? `<p><span class="day">${esc(mini.meta.days)}</span></p>` : "";
    html += `<h2 id="${w.id}">${c.num}.${w.k} ${esc(mini.meta.title)}</h2>\n${days}\n${transformMini(mini.html, m, w)}\n`;
    secs.push({ k: w.k, title: mini.meta.title, id: w.id, old: m });
  });
  chapters.push({ ...c, html, secs, file: `${pad(c.num)}-${c.slug}.html` });
}
// extra page (sources and limitations): authored directly, headings "99.x" shown as "A.x"
{
  const e = structure.extra, mini = minis[e.source];
  let html = mini ? rewriteHrefs(mini.html).replace(/<(h[23])([^>]*)>(\s*)99\./g, "<$1$2>$3A.") : "";
  chapters.push({ num: e.num, slug: e.slug, part: 0, title: e.title, summary: mini ? mini.meta.summary : "", html, secs: [], file: e.file, extra: true });
}

// ---------- ids, toc, audits ----------
const slugify = (s) => strip(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
for (const c of chapters) {
  const seen = new Set();
  c.toc = [];
  c.html = c.html.replace(/<(h[234])([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    let id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
    if (!id) { id = `c${c.num}-${slugify(inner)}`; attrs += ` id="${id}"`; }
    const base = id; let n = 2;
    while (seen.has(id)) id = `${base}-${n++}`;
    if (id !== base) attrs = attrs.replace(/\sid="[^"]+"/, ` id="${id}"`);
    seen.add(id);
    if (tag !== "h4") c.toc.push({ level: Number(tag[1]), id, text: strip(inner) });
    return `<${tag}${attrs}>${inner}</${tag}>`;
  });
  for (const m of c.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (u.startsWith(SITE)) continue;
    const nu = normUrl(u);
    if (verified.has(nu)) continue;
    if (leads.has(nu)) { leadLinks.push(`${c.file}: ${u}`); continue; }
    errors.push(`${c.file}: link is neither verified nor a known lead: ${u}`);
  }
  // internal links must resolve
  for (const m of c.html.matchAll(/href="(\d\d-[a-z0-9-]+\.html)(#[^"]*)?"/g)) {
    if (!structure.chapters.some((x) => `${pad(x.num)}-${x.slug}.html` === m[1])) errors.push(`${c.file}: broken internal link ${m[1]}`);
  }
  for (const m of c.html.matchAll(/\b(?:[Cc]hapters?|ch\.?) \d+(?:\s*(?:-|–|and|,)\s*\d+)*/g)) staleRefs.push(`${c.file}: "${m[0]}"  …${strip(c.html.slice(Math.max(0, m.index - 40), m.index + 60))}…`);
  for (const m of c.html.matchAll(/\b\d+[- ]?(?:min|minute)s?\b[^<]{0,20}(?:read|reading)|reading time|read time/gi)) warnings.push(`${c.file}: mentions reading time: "${m[0]}"`);
  if (c.html && !/<h2[\s>]/.test(c.html)) warnings.push(`${c.file}: no <h2> sections`);
  c.text = strip(c.html);
  c.words = c.text ? c.text.split(/\s+/).length : 0;
  c.lineCount = c.html.split("\n").length;
}

// ---------- templates ----------
const nav = `<nav aria-label="Main navigation"><a href="${SITE}/">Home</a><a href="${SITE}/projects/">Projects</a><a href="${SITE}/blogs/">Blogs</a><a href="index.html">TDM Guide</a></nav>`;
function head(title, desc, canonical) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0a0a0b"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><link rel="stylesheet" href="assets/guide.css"><script>try{var t=localStorage.getItem('tdm-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script></head><body><div id="progress" aria-hidden="true"></div><a class="skip" href="#main">Skip to content</a><header class="header"><div class="wrap headbar"><a class="brand" href="${SITE}/">SK</a>${nav}<div class="tools"><button id="search-open" type="button" aria-label="Search the guide">Search <kbd>/</kbd></button><button id="theme-toggle" type="button" aria-label="Toggle light and dark theme">◐</button></div></div></header>`;
}
const foot = `<footer class="sitefooter"><div class="wrap">© 2026 Saravan Kumar M K · <a href="${SITE}/">Portfolio</a> · <a href="index.html">TDM Guide</a> · <a href="${structure.extra.file}">Sources &amp; limitations</a> · Study notes: always confirm screen details against your own tool version.</div></footer><div id="search-modal" hidden><div class="search-box" role="dialog" aria-label="Search"><input id="search-input" type="search" placeholder="Search the whole guide (e.g. 'primary key', 'shuffle', 'receiver')…" autocomplete="off"><div id="search-results"></div><p class="search-hint">Esc to close · ↑↓ to move · Enter to open</p></div></div><script src="assets/guide.js" defer></script></body></html>`;
const partOf = (id) => structure.parts.find((p) => p.id === id);

function sidebar(current) {
  let h = `<aside class="sidebar" aria-label="Chapter navigation"><a class="allchap" href="index.html">← Guide home &amp; curriculum map</a>`;
  for (const p of structure.parts) {
    const list = chapters.filter((c) => c.part === p.id);
    const open = current && current.part === p.id ? " open" : "";
    h += `<details class="partbox"${open}><summary>${esc(p.title)}</summary><div class="chapter-list">`;
    for (const c of list) h += `<a class="${current && c.num === current.num ? "current" : ""}" href="${c.file}"><span class="n">${pad(c.num)}</span> ${esc(c.title)}</a>`;
    h += `</div></details>`;
  }
  h += `<a class="${current && current.extra ? "current" : ""}" href="${structure.extra.file}" style="margin-top:10px">About the sources</a>`;
  if (current) {
    h += `<h3>On this page</h3><div class="section-list">`;
    for (const t of current.toc) h += `<a class="l${t.level}" href="#${t.id}">${esc(t.text)}</a>`;
    h += `</div>`;
  }
  return h + `</aside>`;
}

const ordered = [...chapters.filter((c) => !c.extra), ...chapters.filter((c) => c.extra)];
function chapterPage(c, i) {
  const prev = ordered[i - 1], next = ordered[i + 1];
  const label = (x) => (x.extra ? "About the sources" : `${x.num}. ${x.title}`);
  const eyebrow = c.extra ? "TDM GUIDE / APPENDIX" : `TDM GUIDE / ${esc(partOf(c.part).title.toUpperCase())} / CHAPTER ${c.num}`;
  const title = c.extra ? `${c.title} | TDM Guide` : `Chapter ${c.num}: ${c.title} | TDM Guide`;
  const body = `<main id="main"><div class="article-layout">${sidebar(c)}<article class="prose"><div class="article-top"><p class="eyebrow">${eyebrow}</p><h1>${esc(c.title)}</h1><div class="meta"><span>Saravan Kumar M K</span>${c.secs.length ? `<span>${c.secs.length} sections</span>` : ""}</div><p class="chapter-summary">${esc(c.summary)}</p></div>${c.html}<nav class="chapter-nav" aria-label="Previous and next chapter">${prev ? `<a href="${prev.file}">← ${esc(label(prev))}</a>` : "<span></span>"}${next ? `<a href="${next.file}">${esc(label(next))} →</a>` : "<span></span>"}</nav></article></div></main>`;
  return head(title, c.summary, `${SITE}/blogs/tdm-guide/${c.file}`) + body + foot;
}

// ---------- landing page ----------
const curriculum = JSON.parse(fs.readFileSync(path.join(here, "curriculum.json"), "utf8"));
const secLink = (m) => { const w = where[m]; return w ? `<a href="${w.file}#${w.id}">Ch ${w.ch.num}.${w.k}</a>` : `<span class="muted">Ch ?</span>`; };
function indexPage() {
  const main = chapters.filter((c) => !c.extra);
  let h = head("TDM Guide: Test Data Management from zero to tool mastery | Saravan Kumar", "A beginner-first learning textbook on Test Data Management, ETL, Informatica TDM, GenRocket and Delphix.", `${SITE}/blogs/tdm-guide/`);
  h += `<main id="main"><section class="landing"><div class="wrap"><p class="eyebrow">LEARNING TEXTBOOK · ${main.length} CHAPTERS</p><h1>TDM Guide</h1><p class="lead">Test Data Management from absolute zero to hands-on tool work: foundations and ETL first, then <strong>Informatica TDM</strong>, <strong>GenRocket</strong> and <strong>Delphix</strong>, with worked examples, labs and a capstone project.</p><a class="action" href="${main[0].file}">Start with Chapter 1 →</a><a class="action ghost" href="#curriculum">Curriculum map</a><a class="action ghost" href="${structure.extra.file}">Sources &amp; limitations</a></div></section>`;
  h += `<div class="wrap landing-body"><div class="callout warn"><strong class="ctitle">How this guide was researched</strong><p>Delphix and GenRocket content comes from their official help sites, downloaded in full; screenshots are linked from those pages. Informatica content comes from the TDM 10.5.10 User Guide PDF, and its figures are cited by page number. The three YouTube videos could not be transcribed, so none of their content is used. Details and every limitation are on the <a href="${structure.extra.file}">Sources &amp; limitations</a> page.</p></div>`;
  h += `<h2 id="how">How to use this guide</h2><ol class="steps"><li><strong>Read Chapters 1 to 3 in order.</strong><p>They assume nothing. Every term is defined the first time it appears, and the glossary at the end of Chapter 10 collects them.</p></li><li><strong>Take the tool chapters as the curriculum reaches them.</strong><p>Informatica (Days 43 to 45 and 54), GenRocket (Days 45 to 50), Delphix (Days 51 to 56). Each section ends with a recap and a short self-check.</p></li><li><strong>Do the labs, then the capstone.</strong><p>Concepts stick when you do them yourself. Chapter 10 ties all three tools into the project case study.</p></li></ol>`;
  h += `<h2 id="curriculum">Curriculum map: syllabus day → where it is covered</h2><p>Every row of the programme curriculum points to the chapter sections that teach it.</p><div class="tablewrap"><table><thead><tr><th>Day</th><th>Topic</th><th>What the syllabus says</th><th>Where to learn it</th></tr></thead><tbody>`;
  for (const r of curriculum.days) h += `<tr><td><span class="day">${esc(r.day)}</span></td><td>${esc(r.topic)}</td><td>${esc(r.desc)}</td><td>${r.chapters.map(secLink).join(" · ")}</td></tr>`;
  h += `</tbody></table></div><h3 id="hands-on">Mandatory learning and hands-on list</h3><div class="tablewrap"><table><thead><tr><th>Item</th><th>Where covered</th></tr></thead><tbody>`;
  for (const r of curriculum.extras) h += `<tr><td>${esc(r.item)}</td><td>${r.chapters.map(secLink).join(" · ")}</td></tr>`;
  h += `</tbody></table></div><h2 id="chapters">The ten chapters</h2>`;
  for (const p of structure.parts) {
    const list = main.filter((c) => c.part === p.id);
    h += `<h3 class="parthead">${esc(p.title)}</h3><p>${esc(p.blurb)}</p><div class="cards">`;
    for (const c of list) h += `<a class="chapter-card" href="${c.file}"><span class="eyebrow">CHAPTER ${pad(c.num)}</span><h2>${esc(c.title)}</h2><p>${esc(c.summary)}</p></a>`;
    h += `</div>`;
  }
  return h + `</div></main>` + foot;
}

// ---------- search index (split at h2/h3) ----------
const searchDocs = [];
for (const c of chapters) {
  for (const p of c.html.split(/(?=<h[23][\s>])/)) {
    const m = p.match(/<h[23][^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h[23]>/);
    const text = strip(p);
    if (text.length < 40) continue;
    searchDocs.push({ c: c.extra ? "A" : c.num, ct: c.title, f: c.file, id: m ? m[1] : "", h: m ? strip(m[2]) : c.title, x: text.slice(0, 5000) });
  }
}

// ---------- report ----------
console.log(`\nChapters: ${chapters.filter((c) => !c.extra).length} (+ sources page)`);
let totalLines = 0, totalWords = 0;
for (const c of chapters) { console.log(`  ${c.extra ? "A " : pad(c.num)}  ${String(c.lineCount).padStart(5)} lines  ${String(c.words).padStart(6)} words  ${c.secs.length} sections  ${c.title}`); totalLines += c.lineCount; totalWords += c.words; }
console.log(`TOTAL: ${totalLines} source lines, ${totalWords} words`);
if (leadLinks.length) { console.log(`\n${leadLinks.length} link(s) to LEADS (not fetched; must be labelled "unverified"):`); for (const w of leadLinks) console.log("  ~ " + w); }
if (staleRefs.length) { console.log(`\n${staleRefs.length} bare chapter-number reference(s) to review (legit if they cite the Informatica manual):`); for (const w of staleRefs.slice(0, 80)) console.log("  ? " + w); }
if (errors.length) { console.log(`\n${errors.length} ERROR(S):`); for (const w of errors) console.log("  x " + w); }
if (warnings.length) { console.log(`\n${warnings.length} warning(s):`); for (const w of warnings) console.log("  - " + w); }
if (checkOnly) process.exit(errors.length ? 1 : 0);
if (errors.length) { console.error("Refusing to write output while errors exist."); process.exit(1); }

fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.endsWith(".html")) fs.unlinkSync(path.join(outDir, f));
fs.copyFileSync(path.join(here, "assets/guide.css"), path.join(outDir, "assets/guide.css"));
fs.copyFileSync(path.join(here, "assets/guide.js"), path.join(outDir, "assets/guide.js"));
fs.writeFileSync(path.join(outDir, "index.html"), indexPage());
ordered.forEach((c, i) => fs.writeFileSync(path.join(outDir, c.file), chapterPage(c, i)));
fs.writeFileSync(path.join(outDir, "assets/search-index.json"), JSON.stringify(searchDocs));
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
console.log(`\nWrote ${ordered.length + 1} pages to ${path.relative(root, outDir)}`);
