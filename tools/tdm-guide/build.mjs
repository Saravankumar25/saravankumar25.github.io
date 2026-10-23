#!/usr/bin/env node
// Builds the TDM Guide static blog into public/blogs/tdm-guide/.
// Usage: node tools/tdm-guide/build.mjs [--check]
// Authoring units ("mini chapters") live in tools/tdm-guide/chapters/<NN-slug>/ (meta.json + *.html fragments).
// structure.json groups them into the 10 published chapters. Inside a chapter each unit becomes a titled topic group,
// and the unit's headings are renumbered into one flat list: N.1, N.2, ... with subsections N.j.1, N.j.2, ...
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "public/blogs/tdm-guide");
const chapDir = path.join(here, "chapters");
const SITE = "https://saravankumar25.github.io";
const UPDATED = "2026-10-23";
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

// old unit number -> where it lives now
const where = {};
for (const c of structure.chapters) c.sources.forEach((m, i) => { where[m] = { ch: c, k: i + 1, file: `${pad(c.num)}-${c.slug}.html`, id: `c${c.num}-s${i + 1}` }; });
const miniFileRe = /href="(\d\d)-[a-z0-9-]+\.html(#[^"]*)?"/g;
function rewriteHrefs(html) {
  return html.replace(miniFileRe, (m, nn, frag) => {
    const n = Number(nn);
    if (n === 99) return `href="${'sources-and-limitations.html'}${frag || ""}"`;
    const w = where[n];
    if (!w) return m;
    return `href="${w.file}${frag || "#" + w.id}"`;
  });
}

const warnings = [], errors = [], leadLinks = [], staleRefs = [];

// Published pages are pure notes: no source boxes, evidence badges, "what you will learn" boxes, day tags or links to
// meta pages. (The research ledger stays in the repo under tools/tdm-guide/.)
function stripMeta(h) {
  return h
    .replace(/<section class="sources">[\s\S]*?<\/section>/g, "")
    .replace(/<div class="callout [a-z]+"><strong class="ctitle">(?:What this (?:section|chapter) is based on|What you will learn|What to say in the walkthrough)<\/strong>[\s\S]*?<\/div>/g, "")
    .replace(/<span class="badge [a-z]+">[\s\S]*?<\/span>/g, "")
    .replace(/<span class="day">[\s\S]*?<\/span>/g, "")
    .replace(/<a href="99-sources-and-limitations\.html[^"]*">([\s\S]*?)<\/a>/g, "$1");
}

// ---------- renumber one unit into its chapter ----------
// Old h2 -> new h2 numbered N.j (j runs across the whole chapter); old h3 -> h3 numbered N.j.i.
// `map` records old numbers ("8.13", "8.13.2") so prose cross references can follow.
function numberHeadings(html, ch, state, map) {
  html = stripMeta(html);
  // a unit's "Sources used" box heading must not become a section of its own
  html = html.replace(/<section class="sources">\s*<h2([^>]*)>([\s\S]*?)<\/h2>/g, '<section class="sources"><h4$1>$2</h4>');
  return html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    const mm = inner.match(/^\s*(\d+)\.(\d+)(?:\.(\d+))?(?:\.\d+)*\.?\s*/);
    let text = inner, key = null;
    if (mm) { text = inner.slice(mm[0].length); key = mm[3] !== undefined ? `${mm[1]}.${mm[2]}.${mm[3]}` : `${mm[1]}.${mm[2]}`; }
    if (tag === "h2") {
      state.j++; state.i = 0;
      const n = `${ch.num}.${state.j}`;
      if (key) map[key] = n;
      return `<h2${attrs}>${n} ${text}</h2>`;
    }
    state.i++;
    const n = `${ch.num}.${Math.max(state.j, 1)}.${state.i}`;
    if (key) map[key] = n;
    return `<h3${attrs}>${n} ${text}</h3>`;
  });
}

const numberMap = {};
for (const c of structure.chapters) { // pass 1: learn the old -> new numbers
  const st = { j: 0, i: 0 };
  for (const m of c.sources) if (minis[m]) numberHeadings(minis[m].html, c, st, numberMap);
}

function transformMini(html, c, state) {
  let h = numberHeadings(html, c, state, {});
  // the guide carries no quizzes or practice questions: strip any that slip in
  h = h.replace(/<details class="quiz"[\s\S]*?<\/details>/g, "").replace(/<h[234][^>]*>[^<]*(?:Check yourself|Practice questions?|Self-?check)[^<]*<\/h[234]>/gi, "");
  h = h.replace(/\bthis chapter\b/g, "this section").replace(/\bThis chapter\b/g, "This section");
  // prose references to sections ("section 8.13") follow the renumbering
  h = h.replace(/\b(Sections?\s+)(\d{1,2}\.\d+(?:\.\d+)?)/gi, (m, pre, key) => (numberMap[key] ? `${pre}${numberMap[key]}` : (staleRefs.push(`unit ${c.num}: unmapped section reference "${pre}${key}"`), m)));
  return rewriteHrefs(h);
}

// ---------- assemble the chapters ----------
const chapters = [];
for (const c of structure.chapters) {
  let html = "";
  const state = { j: 0, i: 0 };
  const units = [];
  c.sources.forEach((m, i) => {
    const mini = minis[m], w = where[m];
    if (!mini) { warnings.push(`chapter ${c.num}: source ${m} not written yet`); return; }
    const days = "";
    html += `<div class="grp" id="${w.id}"><span class="grplabel">${esc(mini.meta.title)}</span>${days}</div>\n${transformMini(mini.html, c, state)}\n`;
    units.push({ id: w.id, title: mini.meta.title, old: m });
  });
  chapters.push({ ...c, html, units, file: `${pad(c.num)}-${c.slug}.html` });
}
// ---------- ids, contents, audits ----------
const slugify = (s) => strip(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
for (const c of chapters) {
  const seen = new Set();
  c.html = c.html.replace(/<(h[234])([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    let id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
    if (!id) { id = `c${c.num}-${slugify(inner)}`; attrs += ` id="${id}"`; }
    const base = id; let n = 2;
    while (seen.has(id)) id = `${base}-${n++}`;
    if (id !== base) attrs = attrs.replace(/\sid="[^"]+"/, ` id="${id}"`);
    seen.add(id);
    return `<${tag}${attrs}>${inner}</${tag}>`;
  });
  // contents: topic groups, each with its numbered sections
  c.groups = [];
  const re = /<div class="grp" id="([^"]+)"><span class="grplabel">([\s\S]*?)<\/span>|<h2[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g;
  let cur = null;
  for (const m of c.html.matchAll(re)) {
    if (m[1]) { cur = { id: m[1], title: strip(m[2]), items: [] }; c.groups.push(cur); }
    else { if (!cur) { cur = { id: "", title: "", items: [] }; c.groups.push(cur); } cur.items.push({ id: m[3], text: strip(m[4]) }); }
  }
  c.sectionCount = c.groups.reduce((a, g) => a + g.items.length, 0);
  for (const m of c.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (u.startsWith(SITE)) continue;
    const nu = normUrl(u);
    if (verified.has(nu)) continue;
    if (leads.has(nu)) { leadLinks.push(`${c.file}: ${u}`); continue; }
    errors.push(`${c.file}: link is neither verified nor a known lead: ${u}`);
  }
  for (const m of c.html.matchAll(/href="(\d\d-[a-z0-9-]+\.html)(#[^"]*)?"/g)) {
    if (!structure.chapters.some((x) => `${pad(x.num)}-${x.slug}.html` === m[1])) errors.push(`${c.file}: broken internal link ${m[1]}`);
    else if (m[2] && !chapters.concat([]).length) { /* anchors checked after all chapters have ids */ }
  }
  for (const m of c.html.matchAll(/\b(?:[Cc]hapters?|ch\.?) \d+(?:\s*(?:-|–|and|,)\s*\d+)*/g)) {
    const after = strip(c.html.slice(m.index, m.index + 160)).slice(0, 90), before = strip(c.html.slice(Math.max(0, m.index - 160), m.index)).slice(-90);
    if (/pp?\.\s*\d|pages? \d|PDF page|"/.test(after) || /User Guide|the guide|manual|Guide \(|Guide,|Guide\)/i.test(before)) continue; // the Informatica manual's own chapters
    staleRefs.push(`${c.file}: "${m[0]}"  …${strip(c.html.slice(Math.max(0, m.index - 40), m.index + 60))}…`);
  }
  for (const m of c.html.matchAll(/\b\d+[- ]?(?:min|minute)s?\b[^<]{0,20}(?:read|reading)|reading time|read time/gi)) warnings.push(`${c.file}: mentions reading time: "${m[0]}"`);
  for (const m of c.html.matchAll(/\b(Sections?\s+)(\d{1,2}\.\d+(?:\.\d+)?)/gi)) {
    const [a] = m[2].split("."); if (Number(a) > structure.chapters.length) staleRefs.push(`${c.file}: "${m[0]}" (no such chapter number)`);
  }
  if (c.html && !/<h2[\s>]/.test(c.html)) warnings.push(`${c.file}: no <h2> sections`);
  c.text = strip(c.html);
  c.words = c.text ? c.text.split(/\s+/).length : 0;
  c.lineCount = c.html.split("\n").length;
}
{ // anchors that point into a chapter must exist
  const ids = {};
  for (const c of chapters) ids[c.file] = new Set([...c.html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const c of chapters) for (const m of c.html.matchAll(/href="(\d\d-[a-z0-9-]+\.html|sources-and-limitations\.html)#([^"]+)"/g)) if (ids[m[1]] && !ids[m[1]].has(m[2])) errors.push(`${c.file}: broken anchor ${m[1]}#${m[2]}`);
}

// ---------- templates ----------
const nav = `<nav aria-label="Main navigation"><a href="${SITE}/">Home</a><a href="${SITE}/projects/">Projects</a><a href="${SITE}/blogs/">Blogs</a><a href="index.html">TDM Guide</a></nav>`;
function head(title, desc, canonical, hasSidebar = false) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0a0a0b"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><link rel="stylesheet" href="assets/guide.css"><script>try{var t=localStorage.getItem('tdm-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}try{var s=localStorage.getItem('tdm-sidebar');if(!s&&matchMedia('(max-width:860px)').matches)s='hidden';if(s==='hidden')document.documentElement.setAttribute('data-sidebar','hidden')}catch(e){}</script></head><body><div id="progress" aria-hidden="true"></div><a class="skip" href="#main">Skip to content</a><header class="header"><div class="wrap headbar"><a class="brand" href="${SITE}/">SK</a>${nav}<div class="tools">${hasSidebar ? '<button id="sidebar-toggle" type="button" aria-controls="sidebar" aria-expanded="true" title="Hide or show the sidebar ([)">☰ <span>Contents</span></button>' : ""}<button id="search-open" type="button" aria-label="Search the guide">Search <kbd>/</kbd></button><button id="theme-toggle" type="button" aria-label="Toggle light and dark theme">◐</button></div></div></header>`;
}
const foot = `<footer class="sitefooter"><div class="wrap">© 2026 Saravan Kumar M K · <a href="${SITE}/">Portfolio</a> · <a href="index.html">TDM Guide</a></div></footer><div id="search-modal" hidden><div class="search-box" role="dialog" aria-label="Search"><input id="search-input" type="search" placeholder="Search the whole guide (e.g. 'primary key', 'shuffle', 'receiver')…" autocomplete="off"><div id="search-results"></div><p class="search-hint">Esc to close · ↑↓ to move · Enter to open</p></div></div><script src="assets/guide.js" defer></script></body></html>`;

const main = chapters.filter((c) => !c.extra);
function contentsList(c, cls) {
  return c.groups.map((g, gi) => `<details class="grpbox"${gi === 0 ? " open" : ""}${g.id ? ` data-grp="${g.id}"` : ""}><summary>${esc(g.title || "Sections")}</summary><div class="${cls}">${g.items.map((t) => `<a href="#${t.id}">${esc(t.text)}</a>`).join("")}</div></details>`).join("");
}
function sidebar(current) {
  let h = `<aside class="sidebar" id="sidebar" aria-label="Chapter navigation"><div class="sbtop"><a class="allchap" href="index.html">← All ${main.length} chapters</a><button type="button" class="sbhide" data-sidebar-hide title="Hide the sidebar ([)">« Hide</button></div><h3>Chapters</h3><div class="chapter-list">`;
  for (const c of main) h += `<a class="${current && c.num === current.num ? "current" : ""}" href="${c.file}"><span class="n">${pad(c.num)}</span> ${esc(c.title)}</a>`;
  h += `</div>`;
  if (current) h += `<h3>In this chapter</h3><div class="section-list">${contentsList(current, "secs")}</div>`;
  return h + `</aside>`;
}

const ordered = main;
function chapterPage(c, i) {
  const prev = ordered[i - 1], next = ordered[i + 1];
  const label = (x) => (x.extra ? "About the sources" : `${x.num}. ${x.title}`);
  const eyebrow = `CHAPTER ${pad(c.num)}`;
  const title = c.extra ? `${c.title} | TDM Guide` : `Chapter ${c.num}: ${c.title} | TDM Guide`;
  const toc = c.groups.length ? `<details class="pagetoc"><summary>Contents of this chapter</summary>${contentsList(c, "secs")}</details>` : "";
  const body = `<main id="main"><div class="article-layout">${sidebar(c)}<article class="prose"><div class="article-top"><p class="eyebrow">${eyebrow}</p><h1>${esc(c.title)}</h1><p class="chapter-summary">${esc(c.summary)}</p></div>${toc}${c.html}<nav class="chapter-nav" aria-label="Previous and next chapter">${prev ? `<a href="${prev.file}">← ${esc(label(prev))}</a>` : "<span></span>"}${next ? `<a href="${next.file}">${esc(label(next))} →</a>` : "<span></span>"}</nav></article></div></main>`;
  return head(title, c.summary, `${SITE}/blogs/tdm-guide/${c.file}`, true) + body + foot;
}
function partOf(id) { return structure.parts.find((p) => p.id === id); }

// ---------- landing page: a hero and the chapter cards ----------
function indexPage() {
  let h = head("TDM Guide: Test Data Management from zero to tool mastery | Saravan Kumar", "A beginner-first learning textbook on Test Data Management, ETL, Informatica TDM, GenRocket and Delphix.", `${SITE}/blogs/tdm-guide/`);
  h += `<main id="main"><section class="landing"><div class="wrap"><p class="eyebrow">TEST DATA MANAGEMENT · ${main.length} CHAPTERS</p><h1>TDM Guide</h1><p class="lead">Test Data Management from absolute zero to hands-on tool work: the foundations and ETL first, then <strong>Informatica TDM</strong>, <strong>GenRocket</strong> and <strong>Delphix</strong>, with worked examples, labs, a capstone project and a glossary.</p><a class="action" href="${main[0].file}">Start reading →</a></div></section><section class="wrap landing-body"><h2 id="contents" class="nobar">Contents</h2>`;
  for (const p of structure.parts) {
    const list = main.filter((c) => c.part === p.id);
    h += `<h3 class="parthead">${esc(p.title)}</h3><div class="cards">`;
    for (const c of list) {
      h += `<div class="chapter-card"><span class="eyebrow">CHAPTER ${pad(c.num)} · ${c.sectionCount} SECTIONS</span><h2><a href="${c.file}">${esc(c.title)}</a></h2><p>${esc(c.summary)}</p><ul class="cardtoc">${c.groups.map((g) => `<li><a href="${c.file}#${g.id}">${esc(g.title)}</a></li>`).join("")}</ul></div>`;
    }
    h += `</div>`;
  }
  h += `</section></main>` + foot;
  return h;
}

// ---------- syllabus index: the day-by-day map, kept out of the way ----------
const curriculum = JSON.parse(fs.readFileSync(path.join(here, "curriculum.json"), "utf8"));
const secLink = (m) => { const w = where[m]; return w ? `<a href="${w.file}#${w.id}">Ch ${w.ch.num}</a> <span class="muted">${esc(minis[m] ? minis[m].meta.title : "")}</span>` : ""; };
function syllabusPage() {
  let h = head("Syllabus index | TDM Guide", "Where each syllabus day and hands-on item is covered in the TDM Guide.", `${SITE}/blogs/tdm-guide/syllabus.html`, true);
  h += `<main id="main"><div class="article-layout">${sidebar(null)}<article class="prose"><div class="article-top"><p class="eyebrow">TDM GUIDE / INDEX</p><h1>Syllabus index</h1><p class="chapter-summary">Every day of the programme syllabus and every hands-on item, with the topic in this guide that covers it.</p></div>`;
  h += `<h2 id="days">Syllabus days</h2><div class="tablewrap"><table><thead><tr><th>Day</th><th>Topic</th><th>Where to read it</th></tr></thead><tbody>`;
  for (const r of curriculum.days) h += `<tr><td><span class="day">${esc(r.day)}</span></td><td><strong>${esc(r.topic)}</strong><br><span class="muted">${esc(r.desc)}</span></td><td>${r.chapters.map(secLink).filter(Boolean).join("<br>")}</td></tr>`;
  h += `</tbody></table></div><h2 id="hands-on">Mandatory learning and hands-on list</h2><div class="tablewrap"><table><thead><tr><th>Item</th><th>Where to read it</th></tr></thead><tbody>`;
  for (const r of curriculum.extras) h += `<tr><td>${esc(r.item)}</td><td>${r.chapters.map(secLink).filter(Boolean).join("<br>")}</td></tr>`;
  h += `</tbody></table></div></article></div></main>` + foot;
  return h;
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
console.log(`\nChapters: ${main.length} (+ sources page)`);
let totalLines = 0, totalWords = 0;
for (const c of chapters) { console.log(`  ${c.extra ? "A " : pad(c.num)}  ${String(c.lineCount).padStart(5)} lines  ${String(c.words).padStart(6)} words  ${c.groups.length} groups  ${String(c.sectionCount).padStart(3)} sections  ${c.title}`); totalLines += c.lineCount; totalWords += c.words; }
console.log(`TOTAL: ${totalLines} source lines, ${totalWords} words`);
if (leadLinks.length) { console.log(`\n${leadLinks.length} link(s) to LEADS (not fetched; must be labelled "unverified"):`); for (const w of leadLinks) console.log("  ~ " + w); }
if (staleRefs.length) { console.log(`\n${staleRefs.length} chapter-number reference(s) to review (legit if they cite the Informatica manual):`); for (const w of staleRefs.slice(0, 80)) console.log("  ? " + w); }
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
console.log(`\nWrote ${ordered.length + 2} pages to ${path.relative(root, outDir)}`);
