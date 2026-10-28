import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';
import { validateDownloads } from './downloads.mjs';

const root = path.resolve('dist');
const origin = 'https://saravankumar25.github.io';
const pages = JSON.parse(fs.readFileSync(path.join(root, 'site-manifest.json'), 'utf8'));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const documents = new Map();
const titles = new Map(), descriptions = new Map();
const resolveFile = pathname => {
  const decoded = decodeURIComponent(pathname);
  let file = path.resolve(root, '.' + decoded);
  if (!file.startsWith(root + path.sep) && file !== root) return null;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  return fs.existsSync(file) ? file : null;
};
for (const file of walk(root).filter(f => f.endsWith('.html'))) documents.set(file, load(fs.readFileSync(file, 'utf8')));
for (const page of pages) {
  const file = path.resolve(root, page.output);
  const $ = documents.get(file);
  check($, `${page.path}: missing HTML output`);
  if (!$) continue;
  const canonical = page.canonical || origin + page.path;
  check($('link[rel="canonical"]').length === 1 && $('link[rel="canonical"]').attr('href') === canonical, `${page.path}: canonical mismatch`);
  if (page.indexable === false) continue;
  const title = $('title').text().trim();
  const description = $('meta[name="description"]').attr('content');
  check(title === page.title && $('title').length === 1, `${page.path}: title mismatch`);
  check(description === page.description && !!description, `${page.path}: description mismatch`);
  for (const [map, value, label] of [[titles, title, 'title'], [descriptions, description, 'description']]) {
    check(!map.has(value), `${page.path}: duplicate ${label} with ${map.get(value)}`);
    map.set(value, page.path);
  }
  check($('html').attr('lang') === 'en', `${page.path}: missing English language`);
  check($('h1').length >= 1, `${page.path}: no server-rendered h1`);
  check($('body').text().trim().length > 100, `${page.path}: missing static content`);
  check(!/noindex/.test($('meta[name="robots"]').attr('content') || ''), `${page.path}: indexable page has noindex`);
  for (const [key, expected] of Object.entries({ 'og:title': title, 'og:description': description, 'og:url': canonical, 'og:image': page.image, 'og:image:width': '1200', 'og:image:height': '630' })) {
    check($(`meta[property="${key}"]`).attr('content') === expected, `${page.path}: ${key} mismatch`);
  }
  for (const key of ['og:type', 'og:image:alt']) check(!!$(`meta[property="${key}"]`).attr('content'), `${page.path}: missing ${key}`);
  check($('meta[name="twitter:card"]').attr('content') === 'summary_large_image', `${page.path}: Twitter card`);
  check($('meta[name="twitter:image"]').attr('content') === page.image, `${page.path}: Twitter image`);
  if (page.image) {
    const image = resolveFile(new URL(page.image).pathname);
    check(image, `${page.path}: missing social image`);
    if (image) { const bytes = fs.readFileSync(image); check(bytes.toString('ascii', 1, 4) === 'PNG' && bytes.readUInt32BE(16) === 1200 && bytes.readUInt32BE(20) === 630, `${page.path}: social image must be 1200 × 630 PNG`); }
  }
  const schema = $('script[type="application/ld+json"]');
  check(schema.length > 0, `${page.path}: missing structured data`);
  schema.each((_, el) => {
    try { const data = JSON.parse($(el).text()); check(data['@context'] === 'https://schema.org', `${page.path}: schema context`); check(!!(data['@type'] || data['@graph']), `${page.path}: schema type`); }
    catch { check(false, `${page.path}: invalid JSON-LD`); }
  });
  check($('script[src*="shared/theme"]').length > 0, `${page.path}: missing shared theme runtime`);
  check($('[data-theme-toggle],#theme-toggle,.theme-toggle').length > 0, `${page.path}: missing theme toggle`);
  $('img').each((_, el) => check($(el).attr('alt') !== undefined, `${page.path}: image missing alt: ${$(el).attr('src')}`));
  if (page.educational) check($('a[href*="/downloads/"]').length > 0, `${page.path}: missing download controls`);
}

// Resolve references against their real document URL, including directory indexes.
for (const [file, $] of documents) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const base = new URL('/' + relative, origin);
  $('[href],[src],[poster]').each((_, el) => {
    for (const attr of ['href', 'src', 'poster']) {
      const value = $(el).attr(attr);
      if (!value || /^(?:mailto:|tel:|data:|blob:|javascript:)/i.test(value)) continue;
      let url; try { url = new URL(value, base); } catch { check(false, `${relative}: malformed ${attr} ${value}`); continue; }
      if (url.origin !== origin) continue;
      // Legacy hash routes are redirected by the client bootstrap.
      if (url.hash.startsWith('#/')) continue;
      const target = resolveFile(url.pathname);
      check(target, `${relative}: missing ${attr} target ${value}`);
      if (target && url.hash && documents.has(target)) {
        const targetDoc = documents.get(target), id = decodeURIComponent(url.hash.slice(1));
        check(targetDoc('[id]').toArray().some(e => targetDoc(e).attr('id') === id) || targetDoc('a[name]').toArray().some(e => targetDoc(e).attr('name') === id), `${relative}: missing fragment ${value}`);
      }
    }
  });
}
for (const file of walk(root).filter(f => f.endsWith('.css'))) {
  const css = fs.readFileSync(file, 'utf8');
  for (const match of css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) {
    if (/^(data:|https?:|#)/.test(match[1])) continue;
    const url = new URL(match[1], origin + '/' + path.relative(root, file).split(path.sep).join('/'));
    check(resolveFile(url.pathname), `${path.relative(root, file)}: missing CSS asset ${match[1]}`);
  }
}
const sitemap = load(fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8'), { xmlMode: true });
const urls = sitemap('loc').toArray().map(e => sitemap(e).text());
const expected = pages.filter(p => p.indexable !== false).map(p => p.canonical || origin + p.path);
check(new Set(urls).size === urls.length, 'Sitemap contains duplicates');
for (const url of expected) check(urls.includes(url), `Sitemap missing ${url}`);
for (const url of urls) check(expected.includes(url), `Sitemap includes noncanonical/unpublished ${url}`);
check(fs.readFileSync(path.join(root, 'robots.txt'), 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt missing sitemap');
const registered = new Set(pages.map(p => path.resolve(root, p.output)));
for (const [file, $] of documents) check(registered.has(file) || /noindex/.test($('meta[name="robots"]').attr('content') || '') || $('meta[http-equiv="refresh"]').length, `${path.relative(root, file)}: HTML omitted from registry`);
if (errors.length) { console.error(errors.join('\n')); throw new Error(`Publication validation failed: ${errors.length} errors`); }
await validateDownloads(root);
console.log(`Validated ${expected.length} indexable pages, ${documents.size} HTML documents, metadata, sitemap, links, assets, themes and download controls.`);
