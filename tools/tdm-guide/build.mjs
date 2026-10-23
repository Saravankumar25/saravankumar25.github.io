#!/usr/bin/env node
// Builds the TDM Guide static blog into public/blogs/tdm-guide/.
// Usage: node tools/tdm-guide/build.mjs [--check]
// Sources: tools/tdm-guide/chapters/<NN-slug>/meta.json + one or more *.html fragment parts (concatenated in name order).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "public/blogs/tdm-guide");
const chapDir = path.join(here, "chapters");
const SITE = "https://saravankumar25.github.io";
const checkOnly = process.argv.includes("--check");

const PARTS = {
  1: { title: "Part I · Foundations", blurb: "Everything you need before touching a tool: data, privacy, TDM concepts, and ETL." },
  2: { title: "Part II · Informatica TDM", blurb: "Discovery, subsetting, masking, mapplets, plans and data generation with Informatica." },
  3: { title: "Part III · GenRocket", blurb: "Synthetic test data: domains, generators, receivers, scenarios and data patterns." },
  4: { title: "Part IV · Delphix", blurb: "Masking engine: connectors, rule sets, profiling, algorithms and file masking." },
  5: { title: "Part V · Capstone & Reference", blurb: "Project case study, final presentation, practice questions, glossary and sources." },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

// ---------- load verified link allowlist ----------
const allow = new Set(
  fs.readFileSync(path.join(here, "links.txt"), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")),
);
const normUrl = (u) => u.replace(/#.*$/, "").replace(/\/$/, "");
const allowNorm = new Set([...allow].map(normUrl));

// ---------- load chapters ----------
const chapters = [];
for (const d of fs.readdirSync(chapDir).sort()) {
  const dir = path.join(chapDir, d);
  if (!fs.statSync(dir).isDirectory()) continue;
  const metaFile = path.join(dir, "meta.json");
  if (!fs.existsSync(metaFile)) { console.warn(`! ${d}: no meta.json, skipped`); continue; }
  const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
  const parts = fs.readdirSync(dir).filter((f) => f.endsWith(".html")).sort();
  const html = parts.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  const lines = html.split("\n").length;
  chapters.push({ dir: d, ...meta, html, lines, file: `${String(meta.num).padStart(2, "0")}-${meta.slug}.html` });
}
chapters.sort((a, b) => a.num - b.num);

// ---------- process each chapter: ensure ids, build toc ----------
const warnings = [];
const slugify = (s) => strip(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
for (const c of chapters) {
  const seen = new Set();
  c.toc = [];
  c.html = c.html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    let id = (attrs.match(/\sid="([^"]+)"/) || [])[1];
    if (!id) {
      id = `c${c.num}-${slugify(inner)}`;
      attrs += ` id="${id}"`;
    }
    let base = id, n = 2;
    while (seen.has(id)) id = `${base}-${n++}`;
    if (id !== base) attrs = attrs.replace(/\sid="[^"]+"/, ` id="${id}"`);
    seen.add(id);
    c.toc.push({ level: Number(tag[1]), id, text: strip(inner) });
    return `<${tag}${attrs}>${inner}</${tag}>`;
  });
  // link audit
  for (const m of c.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (u.startsWith(SITE)) continue;
    if (!allowNorm.has(normUrl(u))) warnings.push(`${c.file}: link not in verified list: ${u}`);
  }
  // heading structure
  if (!/<h2[\s>]/.test(c.html)) warnings.push(`${c.file}: no <h2> sections`);
  c.text = strip(c.html);
  c.words = c.text.split(/\s+/).length;
  c.mins = Math.max(1, Math.round(c.words / 210));
}

// ---------- templates ----------
const nav = `<nav aria-label="Main navigation"><a href="${SITE}/">Home</a><a href="${SITE}/projects/">Projects</a><a href="${SITE}/blogs/">Blogs</a><a href="index.html">TDM Guide</a></nav>`;

function head(title, desc, canonical, extra = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0a0a0b"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><link rel="stylesheet" href="assets/guide.css"><script>try{var t=localStorage.getItem('tdm-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>${extra}</head><body><div id="progress" aria-hidden="true"></div><a class="skip" href="#main">Skip to content</a><header class="header"><div class="wrap headbar"><a class="brand" href="${SITE}/">SK</a>${nav}<div class="tools"><button id="search-open" type="button" aria-label="Search the guide">Search <kbd>/</kbd></button><button id="theme-toggle" type="button" aria-label="Toggle light and dark theme">◐</button></div></div></header>`;
}
const foot = `<footer class="sitefooter"><div class="wrap">© 2026 Saravan Kumar M K · <a href="${SITE}/">Portfolio</a> · <a href="index.html">TDM Guide</a> · <a href="99-sources-and-limitations.html">Sources &amp; limitations</a> · Study notes: always confirm UI details against your tool version.</div></footer><div id="search-modal" hidden><div class="search-box" role="dialog" aria-label="Search"><input id="search-input" type="search" placeholder="Search the whole guide (e.g. 'primary key', 'shuffle', 'receiver')…" autocomplete="off"><div id="search-results"></div><p class="search-hint">Esc to close · ↑↓ to move · Enter to open</p></div></div><script src="assets/guide.js" defer></script></body></html>`;

function sidebar(current) {
  let h = `<aside class="sidebar" aria-label="Chapter navigation"><a class="allchap" href="index.html">← Guide home &amp; curriculum map</a>`;
  for (const p of Object.keys(PARTS).map(Number)) {
    const list = chapters.filter((c) => c.part === p);
    if (!list.length) continue;
    const open = current && current.part === p ? " open" : "";
    h += `<details class="partbox"${open}><summary>${esc(PARTS[p].title)}</summary><div class="chapter-list">`;
    for (const c of list) h += `<a class="${current && c.num === current.num ? "current" : ""}" href="${c.file}"><span class="n">${String(c.num).padStart(2, "0")}</span> ${esc(c.title)}</a>`;
    h += `</div></details>`;
  }
  if (current) {
    h += `<h3>On this page</h3><div class="section-list">`;
    for (const t of current.toc) h += `<a class="l${t.level}" href="#${t.id}">${esc(t.text)}</a>`;
    h += `</div>`;
  }
  return h + `</aside>`;
}

function chapterPage(c, i) {
  const prev = chapters[i - 1], next = chapters[i + 1];
  const title = `Chapter ${c.num} — ${c.title} | TDM Guide`;
  const body = `<main id="main"><div class="article-layout">${sidebar(c)}<article class="prose"><div class="article-top"><p class="eyebrow">TDM GUIDE / ${esc(PARTS[c.part].title.toUpperCase())} / CHAPTER ${c.num}</p><h1>${esc(c.title)}</h1><div class="meta"><span>Saravan Kumar M K</span><span>~${c.mins} min read</span><span>${c.words.toLocaleString()} words</span>${c.days ? `<span class="day">${esc(c.days)}</span>` : ""}</div><p class="chapter-summary">${esc(c.summary)}</p></div>${c.html}<nav class="chapter-nav" aria-label="Previous and next chapter">${prev ? `<a href="${prev.file}">← ${prev.num}. ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a href="${next.file}">${next.num}. ${esc(next.title)} →</a>` : "<span></span>"}</nav></article></div></main>`;
  return head(title, c.summary, `${SITE}/blogs/tdm-guide/${c.file}`) + body + foot;
}

// ---------- curriculum map (day → chapters), authored here so the landing page always matches the syllabus ----------
const curriculum = JSON.parse(fs.readFileSync(path.join(here, "curriculum.json"), "utf8"));
const chByNum = Object.fromEntries(chapters.map((c) => [c.num, c]));
const chLink = (n) => (chByNum[n] ? `<a href="${chByNum[n].file}">Ch ${n}</a>` : `<span class="muted">Ch ${n}</span>`);

function indexPage() {
  let h = head("TDM Guide — Test Data Management from zero to tool mastery | Saravan Kumar", "A complete beginner-to-practitioner learning textbook on Test Data Management, ETL, Informatica TDM, GenRocket and Delphix.", `${SITE}/blogs/tdm-guide/`);
  h += `<main id="main"><section class="landing"><div class="wrap"><p class="eyebrow">LEARNING TEXTBOOK · ${chapters.length} CHAPTERS</p><h1>TDM Guide</h1><p class="lead">Test Data Management from absolute zero to hands-on tool mastery: foundations and ETL first, then <strong>Informatica TDM</strong>, <strong>GenRocket</strong> and <strong>Delphix</strong>, with worked examples, labs and a capstone project.</p><div class="meta"><span>${chapters.length} chapters</span><span>${chapters.reduce((a, c) => a + c.words, 0).toLocaleString()} words</span><span>${chapters.reduce((a, c) => a + c.lines, 0).toLocaleString()} lines of source</span></div><a class="action" href="${chapters[0]?.file ?? "#"}">Start Chapter 1 →</a><a class="action ghost" href="#curriculum">Curriculum map</a><a class="action ghost" href="99-sources-and-limitations.html">Sources &amp; limitations</a></div></section>`;
  h += `<div class="wrap landing-body"><div class="callout warn"><strong class="ctitle">Read this first: how this guide was researched</strong><p>This guide was written in an environment that could not open the official documentation sites or YouTube directly. Tool-specific statements are therefore built from search-engine excerpts of the official pages, the course curriculum, and general product knowledge, and are labelled accordingly. No screenshot images are embedded or invented; instead each tool topic links to the exact official page where the screenshots live. The three YouTube videos could not be transcribed. Full details are in <a href="99-sources-and-limitations.html">Sources &amp; limitations</a>.</p></div>`;
  h += `<h2 id="how">How to use this guide</h2><ol class="steps"><li><strong>Read Part I in order.</strong><p>It assumes nothing. Every term is defined the first time it appears and collected again in the glossary.</p></li><li><strong>Then take the tool parts as the curriculum reaches them.</strong><p>Informatica (Days 43–45, 54), GenRocket (Days 45–50), Delphix (Days 51–56). Each tool chapter ends with labs.</p></li><li><strong>Do the labs and the capstone.</strong><p>Concepts stick when you click the buttons yourself. The capstone (Activities 1–3) ties all three tools together.</p></li></ol>`;
  h += `<h2 id="curriculum">Curriculum map: syllabus day → chapters</h2><p>Every row of the programme curriculum is mapped to the chapters that cover it.</p><div class="tablewrap"><table><thead><tr><th>Day</th><th>Topic</th><th>What the syllabus says</th><th>Where to learn it</th></tr></thead><tbody>`;
  for (const r of curriculum.days) h += `<tr><td><span class="day">${esc(r.day)}</span></td><td>${esc(r.topic)}</td><td>${esc(r.desc)}</td><td>${r.chapters.map(chLink).join(" · ")}</td></tr>`;
  h += `</tbody></table></div>`;
  h += `<h3 id="hands-on">Mandatory learning and hands-on list</h3><div class="tablewrap"><table><thead><tr><th>Item</th><th>Where covered</th></tr></thead><tbody>`;
  for (const r of curriculum.extras) h += `<tr><td>${esc(r.item)}</td><td>${r.chapters.map(chLink).join(" · ")}</td></tr>`;
  h += `</tbody></table></div>`;
  h += `<h2 id="chapters">All chapters</h2>`;
  for (const p of Object.keys(PARTS).map(Number)) {
    const list = chapters.filter((c) => c.part === p);
    if (!list.length) continue;
    h += `<h3 class="parthead">${esc(PARTS[p].title)}</h3><p>${esc(PARTS[p].blurb)}</p><div class="cards">`;
    for (const c of list) h += `<a class="chapter-card" href="${c.file}"><span class="eyebrow">CHAPTER ${String(c.num).padStart(2, "0")} · ~${c.mins} MIN</span><h2>${esc(c.title)}</h2><p>${esc(c.summary)}</p></a>`;
    h += `</div>`;
  }
  h += `</div></main>` + foot;
  return h;
}

// ---------- write ----------
const index = chapters.map((c) => ({ ch: c.num, t: c.title, f: c.file, s: c.toc.filter((t) => t.level === 2).map((t) => ({ id: t.id, h: t.text })), x: c.text.slice(0, 0) }));
// full-text search index: split chapter text by h2 sections
const searchDocs = [];
for (const c of chapters) {
  const parts = c.html.split(/(?=<h2[\s>])/);
  for (const p of parts) {
    const m = p.match(/<h2[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/);
    const text = strip(p);
    if (text.length < 40) continue;
    searchDocs.push({ c: c.num, ct: c.title, f: c.file, id: m ? m[1] : "", h: m ? strip(m[2]) : c.title, x: text.slice(0, 6000) });
  }
}

console.log(`\nChapters: ${chapters.length}`);
let totalLines = 0, totalWords = 0;
for (const c of chapters) { console.log(`  ${String(c.num).padStart(2)}  ${String(c.lines).padStart(5)} lines  ${String(c.words).padStart(6)} words  ${c.title}`); totalLines += c.lines; totalWords += c.words; }
console.log(`TOTAL: ${totalLines} source lines, ${totalWords} words`);
if (warnings.length) { console.log(`\n${warnings.length} warning(s):`); for (const w of warnings) console.log("  - " + w); }
if (checkOnly) process.exit(0);

fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.endsWith(".html")) fs.unlinkSync(path.join(outDir, f));
fs.copyFileSync(path.join(here, "assets/guide.css"), path.join(outDir, "assets/guide.css"));
fs.copyFileSync(path.join(here, "assets/guide.js"), path.join(outDir, "assets/guide.js"));
fs.writeFileSync(path.join(outDir, "index.html"), indexPage());
chapters.forEach((c, i) => fs.writeFileSync(path.join(outDir, c.file), chapterPage(c, i)));
fs.writeFileSync(path.join(outDir, "assets/search-index.json"), JSON.stringify(searchDocs));
fs.writeFileSync(path.join(outDir, ".nojekyll"), "");
console.log(`\nWrote ${chapters.length + 1} pages to ${path.relative(root, outDir)}`);
