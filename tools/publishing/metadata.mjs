import { load } from 'cheerio';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
export const origin = 'https://saravankumar25.github.io';
export const author = 'Saravan Kumar M K';
export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const text = value => value.replace(/\s+/g, ' ').trim();
export const imagePath = page => '/social/' + (page.path === '/' ? 'home' : page.path.replace(/^\//,'').replace(/\/$/,'').replace(/\.html$/,'').replaceAll('/','--')) + '.png';

export async function socialImage(page, root) {
  const title = page.title.split(/ [·|] /)[0];
  const words = title.split(/\s+/), lines = [''];
  for (const word of words) {
    if ((lines.at(-1) + word).length > 32) lines.push('');
    lines[lines.length - 1] += word + ' ';
  }
  const size = lines.length > 3 ? 42 : 58;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0a0a0b"/><rect x="64" y="64" width="8" height="500" rx="4" fill="#88c8bd"/><text x="104" y="118" font-family="sans-serif" font-size="26" fill="#88c8bd">SK / ${page.educational ? 'ENGINEERING GUIDES' : 'SOFTWARE &amp; AI'}</text>${lines.map((line,i)=>`<text x="104" y="${225+i*(size+16)}" font-family="sans-serif" font-weight="700" font-size="${size}" fill="#e8e8ea">${escape(line.trim())}</text>`).join('')}<text x="104" y="550" font-family="sans-serif" font-size="25" fill="#a1a1a9">${author} · saravankumar25.github.io</text></svg>`;
  const target = path.join(root, imagePath(page));
  await fs.mkdir(path.dirname(target),{recursive:true});
  await sharp(Buffer.from(svg)).png().toFile(target);
  page.image = origin + imagePath(page);
}

export function enrich(html, page) {
  const $ = load(html);
  $('html').attr('lang','en');
  $('title,meta[name="description"],meta[name="robots"],meta[name="author"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],script[type="application/ld+json"]').remove();
  const canonical = page.canonical || origin + page.path;
  const head = $('head');
  head.append(`<title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}"><link rel="canonical" href="${canonical}"><meta name="robots" content="${page.indexable === false ? 'noindex, follow' : 'index, follow, max-image-preview:large'}"><meta name="author" content="${author}">`);
  const meta = { 'og:title':page.title, 'og:description':page.description, 'og:url':canonical, 'og:type':page.educational ? 'article' : 'website', 'og:locale':'en_US', 'og:site_name':author, 'og:image':page.image, 'og:image:width':'1200', 'og:image:height':'630', 'og:image:alt':`${page.title} — engineering portfolio and learning guides`, 'twitter:card':'summary_large_image','twitter:title':page.title,'twitter:description':page.description,'twitter:image':page.image,'twitter:image:alt':page.title };
  for (const [key,value] of Object.entries(meta)) if (value) head.append(`<meta ${key.startsWith('og:')?'property':'name'}="${key}" content="${escape(value)}">`);
  const person = {'@type':'Person','@id':origin+'/#person',name:author,url:origin+'/',sameAs:['https://github.com/Saravankumar25','https://www.linkedin.com/in/saravan-kumar-m-k-35014a220/']};
  const node = {'@type':page.kind,'@id':canonical+'#page',url:canonical,name:page.title,description:page.description,inLanguage:'en',isPartOf:{'@id':page.series ? `${origin}/blogs/${page.series}/#page` : origin+'/#website'},author:{'@id':person['@id']},image:page.image};
  if (page.kind === 'ProfilePage') node.mainEntity = {'@id':person['@id']};
  if (page.educational && page.kind !== 'Blog') node.headline = page.title;
  if (page.datePublished) node.datePublished = page.datePublished;
  if (page.dateModified) node.dateModified = page.dateModified;
  if(page.kind === 'Blog') node.isPartOf = {'@id':origin+'/#website'};
  const crumbs = [{name:'Home',item:origin+'/'}];
  if(page.educational) crumbs.push({name:'Blogs',item:origin+'/blogs/'});
  if(page.series && page.path !== `/blogs/${page.series}/`) crumbs.push({name:page.seriesTitle,item:`${origin}/blogs/${page.series}/`});
  if(page.path !== '/') crumbs.push({name:page.title.split(' · ')[0],item:canonical});
  const graph = [person,{'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:author,inLanguage:'en',publisher:{'@id':person['@id']}},node,{'@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,...c}))}];
  head.append(`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c')}</script>`);
  if(!$('script[src="/shared/theme.js"]').length) head.prepend('<script src="/shared/theme.js"></script>');
  $('link[href="/shared/theme.css"]').remove();
  head.append('<link rel="stylesheet" href="/shared/theme.css"><link rel="stylesheet" href="/shared/publication.css">');
  // Rendered content must remain visible if JavaScript is unavailable or interrupted.
  head.append('<noscript><style>.reveal{opacity:1!important;transform:none!important}.hero [style]{opacity:1!important;transform:none!important}nav#nav{display:flex!important;flex-wrap:wrap}.menu{display:none!important}</style></noscript>');
  if(page.educational) {
    const control = !$('[data-theme-toggle],#theme-toggle').length ? '<button type="button" data-theme-toggle>Theme</button>' : '';
    const toolbar = `<aside id="publication-tools" class="publication-tools" aria-label="Article information"><nav aria-label="Breadcrumb">${crumbs.map(c=>`<a href="${new URL(c.item).pathname}">${escape(c.name)}</a>`).join(' <span aria-hidden="true">/</span> ')}</nav><span>By <a rel="author" href="/about/">${author}</a></span>${page.dateModified ? `<span>Updated <time datetime="${page.dateModified}">${page.dateModified}</time></span>` : ''}${control}</aside>`;
    const main=$('main').first();
    if(main.length) main.prepend(toolbar); else $('body').prepend(toolbar);
  }
  return $.html();
}
