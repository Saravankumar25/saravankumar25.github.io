import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { load } from 'cheerio';
import { origin, escape, text, socialImage, enrich } from './metadata.mjs';
import { generateDownloads } from './downloads.mjs';

const root = path.resolve('dist');
const series = JSON.parse(await fs.readFile('src/content/series.json','utf8')).filter(s=>s.status==='published');
const walk = async dir => (await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(async e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();
const canonicalPath = file => '/' + file.replaceAll('\\','/').replace(/index\.html$/,'');
const outputPath = url => url.endsWith('/') ? url.slice(1)+'index.html' : url.slice(1);
const hash = value => createHash('sha256').update(value).digest('hex');
const mainText = html => {const $=load(html);$('script,style,#publication-tools').remove(); return text($('main').text());};
await build();
await build({build:{ssr:'src/entry-static.tsx',outDir:'.site-build',emptyOutDir:true,copyPublicDir:false},logLevel:'warn'});
const {routes,render} = await import(pathToFileURL(path.resolve('.site-build/entry-static.js')));
const shell = await fs.readFile(path.join(root,'index.html'),'utf8');
const pages = [], sources = new Map();

for(const route of routes) {
  const page = {...route,output:outputPath(route.path),indexable:true};
  const $=load(shell);$('#root').html(render(page.path));
  $('a[href]').each((_,el)=> {const href=$(el).attr('href');if(href.startsWith('/')&&!href.includes('.')&&!href.includes('#')&&!href.endsWith('/')) $(el).attr('href',href+'/');});
  sources.set(page.path,$.html());pages.push(page);
}
// Existing HTML is the content source. Discovery includes lessons, labs, practice and reference pages.
for(const blog of series) {
  const dir=path.join(root,'blogs',blog.slug);
  for(const file of (await walk(dir)).filter(f=>f.endsWith('.html')).sort()) {
    const html=await fs.readFile(file,'utf8'), $=load(html);
    if(/noindex/.test($('meta[name="robots"]').attr('content')||'')) continue;
    const output=path.relative(root,file).replaceAll('\\','/'), url=canonicalPath(output);
    const title=text($('title').text()) || `${text($('h1').first().text())} · ${blog.title}`;
    const summary=text($('meta[name="description"]').attr('content')||$('main p').first().text());
    if(!summary) throw new Error(`Missing content description: ${output}`);
    const page={path:url,output,title,description:summary,kind:url===`/blogs/${blog.slug}/`?'Blog':'TechArticle',series:blog.slug,seriesTitle:blog.title,educational:true,indexable:true,sourceContentHash:hash(mainText(html))};
    // Series announcement dates are established in the existing blog index; do not infer chapter dates.
    if(page.kind==='Blog') page.datePublished=blog.datePublished;
    const date=$('body').text().match(/Updated\s+(\d{4}-\d{2}-\d{2})/);
    if(date) page.dateModified=date[1];
    sources.set(url,html);pages.push(page);
  }
}
// Disambiguate repeated boilerplate summaries with the actual page title.
const descriptions=new Map();
for(const p of pages) {const list=descriptions.get(p.description)||[];list.push(p);descriptions.set(p.description,list);}
for(const group of descriptions.values()) if(group.length>1) for(const p of group) p.description=`${p.title.split(' · ')[0]} (${p.path.replaceAll('/',' ').trim()}). ${p.description}`;
for(const p of pages) {
  await socialImage(p,root);
  let html=sources.get(p.path);
  const $=load(html);
  // Canonical links replace duplicate directory indexes and historical hash navigation.
  $('a[href]').each((_,el)=>{
    const value=$(el).attr('href');if(/^(mailto:|tel:|data:|javascript:)/.test(value))return;
    let url;try{url=new URL(value,origin+p.path);}catch{return;}
    if(url.origin!==origin)return;
    if(url.hash.startsWith('#/')) {url.pathname=url.hash.slice(1).replace(/^\/journal(?=\/|$)/,'/blogs');url.hash='';}
    url.pathname=url.pathname.replace(/^\/journals\//,'/blogs/').replace(/index\.html$/,'');
    if(!path.posix.extname(url.pathname)&&!url.pathname.endsWith('/'))url.pathname+='/';
    $(el).attr('href',url.pathname+url.search+url.hash);
  });
  html=enrich($.html(),p);
  if(p.sourceContentHash && hash(mainText(html))!==p.sourceContentHash) throw new Error(`Educational content changed: ${p.path}`);
  const file=path.join(root,p.output);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,html);
}

// Keep legacy URLs working with static, crawlable aliases. No server rewrite is needed.
const legacyFiles=(await walk(path.join(root,'journals'))).filter(f=>f.endsWith('.html'));
const aliases=legacyFiles.map(f=>({path:canonicalPath(path.relative(root,f)),target:canonicalPath(path.relative(root,f)).replace(/^\/journals\//,'/blogs/')}));
aliases.push({path:'/journal/',target:'/blogs/'});
for(const alias of aliases) {
  const target=pages.find(p=>p.path===alias.target);if(!target)throw new Error(`Alias has no target: ${alias.path}`);
  const page={...target,path:alias.path,output:outputPath(alias.path),kind:'alias',educational:false,indexable:false,canonical:origin+alias.target};
  const html=enrich(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${alias.target}"></head><body><main><h1>This page has moved</h1><p><a href="${alias.target}">Continue to ${escape(target.title)}</a></p><button data-theme-toggle type="button">Theme</button></main></body></html>`,page);
  await fs.mkdir(path.dirname(path.join(root,page.output)),{recursive:true});await fs.writeFile(path.join(root,page.output),html);pages.push(page);
}
const errorPage={path:'/404.html',output:'404.html',title:'Page not found · Saravan Kumar M K',description:'This page could not be found. Browse the portfolio, projects and engineering guides.',indexable:false,kind:'WebPage',image:pages[0].image};
const $404=load(shell);$404('#root').html(render('/404.html'));
await fs.writeFile(path.join(root,'404.html'),enrich($404.html(),errorPage));pages.push(errorPage);
await fs.writeFile(path.join(root,'.nojekyll'),'');
await fs.writeFile(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.filter(p=>p.indexable).map(p=>`<url><loc>${origin}${p.path}</loc>${p.dateModified?`<lastmod>${p.dateModified}</lastmod>`:''}</url>`).join('')}</urlset>`);
await fs.writeFile(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await fs.writeFile(path.join(root,'site-manifest.json'),JSON.stringify(pages,null,2));
await generateDownloads(pages,root);
console.log(`Published ${pages.filter(p=>p.indexable).length} canonical pages, ${aliases.length} aliases; preserved educational main-text hashes.`);
