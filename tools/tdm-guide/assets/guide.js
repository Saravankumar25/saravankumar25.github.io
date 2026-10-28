(function(){
var d=document,root=d.documentElement;
function safe(f){try{return f()}catch(e){}}
// reading progress
var bar=d.getElementById('progress');
function prog(){var h=d.documentElement.scrollHeight-innerHeight;if(bar)bar.style.width=(h>0?Math.min(100,scrollY/h*100):0)+'%'}
addEventListener('scroll',prog,{passive:true});prog();
// copy buttons
d.querySelectorAll('pre').forEach(function(p){if(p.classList.contains('ascii'))return;var b=d.createElement('button');b.className='copy';b.type='button';b.textContent='Copy';b.addEventListener('click',function(){var t=(p.querySelector('code')||p).innerText;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1400)},function(){b.textContent='Press Ctrl+C'})});p.appendChild(b)});
// screenshots that fail to load fall back to their link text
d.querySelectorAll('figure.shot img').forEach(function(im){im.addEventListener('error',function(){var f=im.closest('figure');if(f)f.classList.add('shot-missing');im.replaceWith(Object.assign(d.createElement('span'),{textContent:'Screenshot did not load here. Use the link below to open it on the official site.',style:'display:block;padding:18px;color:#555'}))})});
// highlight the current section in the sidebar and keep only its topic group open
var links=[].slice.call(d.querySelectorAll('.sidebar .section-list a'));
var boxes=[].slice.call(d.querySelectorAll('.sidebar .section-list .grpbox'));
if(links.length&&'IntersectionObserver' in window){
  var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
  var boxOf={};boxes.forEach(function(b){if(b.getAttribute('data-grp'))boxOf[b.getAttribute('data-grp')]=b});
  var openOnly=function(box){boxes.forEach(function(b){b.open=(b===box)})};
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;
    var id=e.target.id,a=map[id],box=a?a.closest('.grpbox'):boxOf[id];
    links.forEach(function(x){x.classList.remove('current')});if(a)a.classList.add('current');
    if(box)openOnly(box);
  })},{rootMargin:'-80px 0px -70% 0px'});
  d.querySelectorAll('.prose h2[id],.prose .grp[id]').forEach(function(h){io.observe(h)});
}
// collapsible sidebar: hide it so the text gets the full width; the choice is remembered
var sbBtn=d.getElementById('sidebar-toggle');
function setSidebar(hidden){
  if(hidden)root.setAttribute('data-sidebar','hidden');else root.removeAttribute('data-sidebar');
  if(sbBtn)sbBtn.setAttribute('aria-expanded',hidden?'false':'true');
  safe(function(){localStorage.setItem('tdm-sidebar',hidden?'hidden':'shown')});
}
if(sbBtn){
  sbBtn.setAttribute('aria-expanded',root.getAttribute('data-sidebar')==='hidden'?'false':'true');
  sbBtn.addEventListener('click',function(){var hidden=root.getAttribute('data-sidebar')!=='hidden';setSidebar(hidden);if(!hidden&&innerWidth<=860){var sb=d.getElementById('sidebar');if(sb)sb.scrollIntoView()}});
  d.querySelectorAll('[data-sidebar-hide]').forEach(function(b){b.addEventListener('click',function(){setSidebar(true)})});
  d.addEventListener('keydown',function(e){var tag=(e.target.tagName||'').toLowerCase();if(e.key==='['&&tag!=='input'&&tag!=='textarea'){e.preventDefault();setSidebar(root.getAttribute('data-sidebar')!=='hidden')}});
}
// search
var modal=d.getElementById('search-modal'),inp=d.getElementById('search-input'),res=d.getElementById('search-results'),docs=null,sel=0;
function load(){if(docs)return Promise.resolve();return fetch('assets/search-index.json').then(function(r){return r.json()}).then(function(j){docs=j}).catch(function(){docs=[]})}
function open(){modal.hidden=false;inp.value='';res.innerHTML='';inp.focus();load()}
function close(){modal.hidden=true}
function esc(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function run(){var q=inp.value.trim().toLowerCase();if(q.length<2){res.innerHTML='';return}var words=q.split(/\s+/);var out=[];docs.forEach(function(x){var hay=(x.h+' '+x.x).toLowerCase(),score=0;for(var i=0;i<words.length;i++){var w=words[i],ix=hay.indexOf(w);if(ix<0){score=-1;break}score+=(x.h.toLowerCase().indexOf(w)>=0?10:1)}if(score>0)out.push([score,x])});out.sort(function(a,b){return b[0]-a[0]});out=out.slice(0,12);sel=0;res.innerHTML=out.map(function(o,i){var x=o[1],ix=x.x.toLowerCase().indexOf(words[0]),s=x.x.slice(Math.max(0,ix-60),ix+140);return'<a class="'+(i?'':'sel')+'" href="'+x.f+(x.id?'#'+x.id:'')+'"><b>'+esc(x.h)+'</b><small>Chapter '+x.c+' · '+esc(x.ct)+'</small><span>…'+esc(s)+'…</span></a>'}).join('')||'<p class="search-hint">No matches.</p>'}
var so=d.getElementById('search-open');if(so)so.addEventListener('click',open);
if(inp){inp.addEventListener('input',function(){load().then(run)});inp.addEventListener('keydown',function(e){var as=[].slice.call(res.querySelectorAll('a'));if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!as.length)return;as[sel]&&as[sel].classList.remove('sel');sel=(sel+(e.key==='ArrowDown'?1:-1)+as.length)%as.length;as[sel].classList.add('sel');as[sel].scrollIntoView({block:'nearest'})}else if(e.key==='Enter'&&as[sel]){location.href=as[sel].getAttribute('href')}})}
d.addEventListener('keydown',function(e){var tag=(e.target.tagName||'').toLowerCase();if(e.key==='/'&&tag!=='input'&&tag!=='textarea'){e.preventDefault();open()}else if(e.key==='Escape'&&modal&&!modal.hidden)close()});
if(modal)modal.addEventListener('click',function(e){if(e.target===modal)close()});
})();
