import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';

const ORIGIN = 'https://saravankumar25.github.io';
const posix = path.posix;
const fileFor = (url) => decodeURIComponent(url.replace(/^\//, '').replace(/\/$/, '/index.html'));
const hash = (data) => createHash('sha256').update(data).digest('hex');
const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const relative = (from, to) => posix.relative(posix.dirname(from), to) || posix.basename(to);
function localReference(value, file) {
  if (!value || /^(?:#|data:|mailto:|tel:|javascript:)/i.test(value)) return null;
  const url = new URL(value, `${ORIGIN}/${file}`);
  if (url.origin !== ORIGIN) return null;
  return { file: fileFor(url.pathname === '/' ? '/index.html' : url.pathname), url, suffix: url.search + url.hash };
}
const slugFor = (page) => fileFor(page.path).replace(/^blogs\//, '').replace(/\.html$/, '').replaceAll('/', '--');

/** Build downloads only from the published registry, never by zipping the repository. */
export async function generateDownloads(pages, distRoot) {
  const educational = pages.filter(p => p.educational && p.series);
  const groups = Map.groupBy(educational, p => p.series);
  const pageDownloads = {};
  const jobs = [];
  const all = '/downloads/all-educational-content.zip';
  for (const [series, members] of groups) {
    const seriesURL = `/downloads/${series}.zip`;
    jobs.push({ url: seriesURL, kind: 'series', pages: members, entry: members.find(p => p.path.endsWith('/')) || members[0] });
    for (const page of members) {
      // Series landing pages download the existing series archive instead of duplicating it.
      const individual = page.path === `/blogs/${series}/` ? seriesURL : `/downloads/${slugFor(page)}.zip`;
      pageDownloads[page.path] = { individual, series: seriesURL, all };
      if (individual !== seriesURL) {
        let children = [];
        if (/\/parts\/\d+\.html$/.test(page.path)) {
          const $ = load(fs.readFileSync(path.join(distRoot, fileFor(page.path)), 'utf8'));
          const linked = new Set($('main a[href]').map((_, a) => localReference($(a).attr('href'), fileFor(page.path))?.file).get());
          children = members.filter(p => /\/chapters\//.test(p.path) && linked.has(fileFor(p.path)));
        }
        jobs.push({ url: individual, kind: children.length ? 'chapter' : 'page', pages: [page, ...children], entry: page });
      }
    }
  }
  jobs.push({ url: all, kind: 'collection', pages: educational, entry: null });
  // Install controls before packaging: archives contain the same content as the published pages.
  for (const page of educational) {
    const file = path.join(distRoot, fileFor(page.path));
    const $ = load(fs.readFileSync(file, 'utf8'));
    $('.publication-downloads').remove();
    if (!$('#publication-tools').length) $('body').append('<aside id="publication-tools" aria-label="Publication tools"></aside>');
    const urls = pageDownloads[page.path];
    $('#publication-tools').append(`<nav class="publication-downloads" aria-label="Offline downloads"><a href="${urls.individual}" download>Download this ${page.path.endsWith('/') ? 'series' : 'page'} (ZIP)</a> · <a href="${urls.series}" download>Complete series (ZIP)</a> · <a href="${all}" download>All educational content (ZIP)</a><p>ZIPs contain HTML and local assets. Extract before opening start.html. External references and vendor screenshots require internet; details are included.</p></nav>`);
    fs.writeFileSync(file, $.html());
  }
  const blogsFile = path.join(distRoot, 'blogs/index.html');
  if (fs.existsSync(blogsFile)) {
    const $ = load(fs.readFileSync(blogsFile, 'utf8'));
    $('.collection-download').remove();
    $('body').append(`<aside class="collection-download publication-downloads" aria-label="Offline collection"><a href="${all}" download>Download all educational content (ZIP)</a><p>Extract the ZIP and open start.html. External references and vendor screenshots require internet.</p></aside>`);
    fs.writeFileSync(blogsFile, $.html());
  }
  const archives = [];
  const sourceCache = new Map();
  const read = file => {
    if (!sourceCache.has(file)) sourceCache.set(file, fs.readFileSync(path.join(distRoot, file)));
    return sourceCache.get(file);
  };
  for (const job of jobs) {
    const included = new Set(job.pages.map(p => fileFor(p.path)));
    const files = {};
    const externalAssets = new Set();
    const addAsset = (file) => {
      if (files[file]) return;
      if (!fs.existsSync(path.join(distRoot, file))) throw new Error(`Offline asset missing: ${file}`);
      let bytes = read(file);
      files[file] = bytes;
      if (/\.css$/i.test(file)) {
        let css = bytes.toString('utf8').replace(/@import\s+url\(['"]?(https?:[^)'"\s]+)['"]?\)\s*;/g, (_, url) => { externalAssets.add(url); return '/* Offline edition uses the declared system font fallbacks. */'; });
        css = css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (whole, quote, value) => {
          const ref = localReference(value, file);
          if (!ref) return whole;
          addAsset(ref.file);
          return `url("${relative(file, ref.file)}${ref.suffix}")`;
        });
        files[file] = strToU8(css);
      }
      if (file.endsWith('/guide.js')) {
        const js = bytes.toString('utf8').replace("return fetch('assets/search-index.json')", "if(window.TDM_OFFLINE_SEARCH){docs=window.TDM_OFFLINE_SEARCH;return Promise.resolve()}return fetch('assets/search-index.json')");
        files[file] = strToU8(js);
      }
      if (file.endsWith('/search-index.js')) {
        const raw = bytes.toString('utf8');
        if (raw.startsWith('window.HCW_SEARCH=')) {
          const records = JSON.parse(raw.replace(/^window\.HCW_SEARCH=/, '').replace(/;\s*$/, ''));
          const base = file.replace('/assets/search-index.js', '/reference/search.html');
          files[file] = strToU8(`window.HCW_SEARCH=${JSON.stringify(records.filter(r => included.has(localReference(r.url, base)?.file)))};`);
        }
      }
    };
    for (const page of job.pages) {
      const file = fileFor(page.path);
      const $ = load(read(file).toString('utf8'));
      $('.publication-downloads').remove();
      $('head').append('<meta name="robots" content="noindex,nofollow">');
      $('body').prepend('<aside class="offline-notice" style="padding:12px;border:1px solid currentColor">Offline edition · <a href="' + relative(file, 'start.html') + '">Archive contents</a>. Links marked “online” require internet. Vendor screenshots are linked with text alternatives; local diagrams and interactive labs are included.</aside>');
      $('a[href], link[href], script[src], img[src], source[src], video[src], audio[src], iframe[src], object[data]').each((_, element) => {
        const el = $(element), tag = element.tagName;
        const attr = el.attr('href') !== undefined ? 'href' : el.attr('src') !== undefined ? 'src' : 'data';
        const value = el.attr(attr);
        const ref = localReference(value, file);
        if (!ref) {
          if (tag === 'img' && /^https?:/.test(value || '')) {
            externalAssets.add(value);
            el.replaceWith(`<span class="offline-image"><a href="${escape(value)}">${escape(el.attr('alt') || 'Vendor screenshot')} (online screenshot)</a></span>`);
          }
          return;
        }
        if (tag === 'link' && /canonical/.test(el.attr('rel') || '')) return;
        if (tag === 'a' && (!included.has(ref.file) || /\.(pdf|zip)$/i.test(ref.file))) {
          el.attr(attr, ref.url.href).removeAttr('download');
          if (!el.text().includes('(online)')) el.append(' <small>(online)</small>');
          return;
        }
        if (tag !== 'a' && !included.has(ref.file)) addAsset(ref.file);
        el.attr(attr, `${relative(file, ref.file)}${ref.suffix}`);
      });
      // TDM's JSON fetch cannot work under file://. Embed only entries present in this archive.
      const searchFile = `blogs/${page.series}/assets/search-index.json`;
      if (fs.existsSync(path.join(distRoot, searchFile))) {
        const records = JSON.parse(read(searchFile));
        const selected = records.filter(r => included.has(localReference(r.f, file)?.file));
        $('head').append(`<script>window.TDM_OFFLINE_SEARCH=${JSON.stringify(selected).replace(/</g, '\\u003c')};</script>`);
      }
      files[file] = strToU8($.html());
    }
    addAsset('shared/theme.js');
    addAsset('shared/theme.css');
    const title = job.kind === 'collection' ? 'All educational content' : job.entry.title;
    const links = job.pages.map(p => `<li><a href="${escape(fileFor(p.path))}">${escape(p.title)}</a></li>`).join('');
    files['start.html'] = strToU8(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} — offline archive</title><script src="shared/theme.js"></script><link rel="stylesheet" href="shared/theme.css"><style>body{font:18px/1.6 system-ui;max-width:75ch;margin:3rem auto;padding:1rem;color-scheme:light dark;background:var(--bg,#0a0a0b);color:var(--text,#eee)}a{color:inherit}li{margin:.6rem 0}</style></head><body><button type="button" data-theme-toggle aria-label="Dark theme" aria-pressed="false">Theme</button><h1>${escape(title)}</h1><p>Open a page below. Internet-only links are marked. See README.txt for limitations.</p><ol>${links}</ol></body></html>`);
    files['README.txt'] = strToU8(`OFFLINE EDUCATIONAL ARCHIVE\n\nExtract the entire ZIP, then open start.html in a modern browser. Keep the directory structure unchanged.\n\nIncluded: ${job.pages.length} published HTML pages, their local styles, diagrams, scripts and fonts. Chapter archives include linked child lessons. Series and collection archives include all published pages in their registry order.\n\nLocal interactive labs and search run in the browser with JavaScript enabled. TDM search data is embedded to support file://. Clipboard copying and browser storage may be restricted for local files. Links to pages outside this archive, existing PDF downloads, external references, vendor services and screenshot sources are marked online and require an internet connection. Remote screenshots have explicit descriptive links in place of broken images. Google Fonts imports are omitted; system fallback fonts are used. No drafts or nested ZIP/PDF collections are included.\n\nOnline original: ${ORIGIN}\n\nExternal visual/font sources omitted from this archive:\n${[...externalAssets].sort().join('\n') || 'None'}\n`);
    // Deterministic timestamps avoid treating archive generation time as a publication date.
    const entries = Object.fromEntries(Object.entries(files).map(([name, data]) => [name, [data, { mtime: new Date('2020-01-01T00:00:00Z') }]]));
    const bytes = zipSync(entries, { level: 6 });
    const output = path.join(distRoot, fileFor(job.url));
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, bytes);
    archives.push({ url: job.url, kind: job.kind, pages: job.pages.map(p => p.path), entry: 'start.html', size: bytes.length, sha256: hash(bytes) });
  }
  const manifest = { archives, pageDownloads };
  fs.writeFileSync(path.join(distRoot, 'downloads/manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

/** Validate actual ZIP bytes, selected page completeness, and local HTML/CSS references. */
export function validateDownloads(distRoot) {
  const manifest = JSON.parse(fs.readFileSync(path.join(distRoot, 'downloads/manifest.json'), 'utf8'));
  let checked = 0;
  for (const archive of manifest.archives) {
    const bytes = fs.readFileSync(path.join(distRoot, fileFor(archive.url)));
    if (hash(bytes) !== archive.sha256 || bytes.length !== archive.size) throw new Error(`Archive checksum mismatch: ${archive.url}`);
    const files = unzipSync(bytes);
    for (const file of ['start.html', 'README.txt', ...archive.pages.map(fileFor)]) if (!files[file]) throw new Error(`Archive ${archive.url} lacks ${file}`);
    const check = (value, from) => {
      // Absolute URLs intentionally refer to the live site, never the ZIP filesystem.
      if (/^(?:https?:)?\/\//.test(value || '')) return;
      const ref = localReference(value, from);
      if (ref && !files[ref.file]) throw new Error(`Archive ${archive.url}: ${from} refers to absent ${ref.file}`);
    };
    for (const [file, data] of Object.entries(files)) {
      if (/\.html$/.test(file)) {
        const $ = load(strFromU8(data));
        $('[href], [src], object[data]').each((_, el) => {
          if ($(el).attr('rel') === 'canonical') return;
          for (const attr of ['href','src','data']) if ($(el).attr(attr)) check($(el).attr(attr), file);
        });
      } else if (/\.css$/.test(file)) {
        for (const match of strFromU8(data).matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) check(match[1], file);
      }
    }
    checked++;
  }
  return { archives: checked, pages: Object.keys(manifest.pageDownloads).length };
}
