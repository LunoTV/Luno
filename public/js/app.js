const app=document.getElementById('app');

const LOCAL_CATALOGS={movie:'./data/movies.json',series:'./data/series.json',anime:'./data/anime.json'};
const catalogStore={movie:[],series:[],anime:[]};

const esc=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yearOf=item=>{
  const y=item?.releaseInfo||item?.year;
  const match=String(y||'').match(/\\d{4}/);
  return match?match[0]:'';
};
const scoreOf=value=>{
  const n=Number(value);
  return Number.isFinite(n)?n.toFixed(1):String(value||'');
};
async function fetchJson(url){
  const res=await fetch(url,{cache:'force-cache',headers:{accept:'application/json'}});
  if(!res.ok)throw new Error(String(res.status));
  return res.json();
}
async function loadCatalog(type){
  const data=await fetchJson(LOCAL_CATALOGS[type]);
  const items=type==='anime'?(Array.isArray(data?.data)?data.data:[]):(Array.isArray(data?.metas)?data.metas:[]);
  catalogStore[type]=items;
  return items;
}
function poster(item){
  return item?.poster||item?.images?.jpg?.large_image_url||item?.images?.jpg?.image_url||'';
}
function backdrop(item){
  return item?.backdrop||item?.images?.jpg?.large_image_url||poster(item)||'';
}
function cardTypeLabel(item,type){
  if(type==='anime')return 'Аниме';
  if(type==='series')return 'Сериал';
  const genres=Array.isArray(item?.genres)?item.genres.join(' ').toLowerCase():String(item?.genre||'').toLowerCase();
  return /animation|анимац|мультфильм|мультик/.test(genres)?'Мультфильм':'Фильм';
}
function cardMarkup(item,type){
  const title=item?.name||item?.title||'Без названия';
  const image=poster(item);
  const score=item?.imdbRating||item?.rating||item?.score;
  const year=yearOf(item)||item?.year||'';
  const label=cardTypeLabel(item,type);
  return '<button class="media-card" tabindex="0" data-type="'+esc(type)+'" data-id="'+esc(item?.imdb_id||item?.tmdb_id||item?.mal_id||item?.id||'')+'">'+
    '<span class="media-card__poster">'+
      (image?'<img src="'+esc(image)+'" alt="" loading="lazy" decoding="async">':'<span class="media-card__poster-fallback">LUNO</span>')+
      '<span class="media-card__shade"></span>'+
      '<span class="media-card__type">'+esc(label)+'</span>'+
      (score?'<span class="media-card__score"><span class="media-card__star">★</span> '+esc(scoreOf(score))+'</span>':'')+
    '</span>'+
    '<span class="media-card__title">'+esc(title)+'</span>'+
    '<span class="media-card__meta">'+esc(year)+'</span>'+
  '</button>';
}
function sectionMarkup(title,sub,id){
  return '<section class="content-section" id="'+id+'"><div class="section__head"><div><h2>'+title+'</h2><p>'+sub+'</p></div><div class="section-tools"><button class="row-control" data-row-scroll="'+id+'" data-dir="-1" aria-label="Назад">‹</button><button class="row-control" data-row-scroll="'+id+'" data-dir="1" aria-label="Вперёд">›</button><button class="section-link" data-scroll="'+id+'">Все</button></div></div><div class="media-row" data-row="'+id+'"><div class="row-loading" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div></div></section>';
}
function homeShell(){
  const el=document.createElement('main');
  el.className='home';
  el.innerHTML=
    '<header class="topbar">'+
      '<button class="brand" data-nav="home" aria-label="LUNO">LUNO</button>'+
      '<nav class="nav" aria-label="Основная навигация">'+
        '<button class="active" data-nav="home">Главная</button><button data-nav="movie">Фильмы</button><button data-nav="series">Сериалы</button><button data-nav="anime">Аниме</button>'+
      '</nav><button class="search" data-search aria-label="Поиск">⌕</button>'+
    '</header>'+
    '<section class="hero" data-hero><div class="hero__backdrop"></div><div class="hero__shade"></div><div class="hero__content"><div class="eyebrow">LUNO / REAL CATALOG</div><div class="hero__loading">Загружаем каталог…</div></div></section>'+
    '<div class="catalog">'+sectionMarkup('Фильмы','Реальные данные TMDB','movies')+sectionMarkup('Сериалы','Реальные данные TMDB','series')+sectionMarkup('Аниме','Реальные данные MyAnimeList через Jikan','anime')+'</div>'+
    '<div class="catalog-error" data-error hidden></div>'+
    '<nav class="mobile-nav"><button class="active" data-nav="home">⌂<br>Главная</button><button data-nav="movie">◌<br>Фильмы</button><button data-nav="series">◯<br>Сериалы</button><button data-search>⌕<br>Поиск</button></nav>';
  return el;
}
function setHero(el,item){
  const hero=el.querySelector('[data-hero]');
  if(!hero||!item)return;
  const image=backdrop(item), title=item?.name||item?.title||'LUNO', score=item?.imdbRating||item?.rating, year=yearOf(item)||item?.year||'';
  hero.querySelector('.hero__backdrop').style.backgroundImage=image?'url("'+image.replace(/"/g,'\\\"')+'")':'';
  hero.querySelector('.hero__content').innerHTML='<div class="eyebrow">LUNO / '+esc(item?.type==='series'?'SERIES':'CINEMA')+'</div><h1>'+esc(title)+'</h1><div class="hero__meta">'+esc([year,score?'★ '+scoreOf(score):''].filter(Boolean).join(' · '))+'</div><p>Реальная карточка из подключённого каталога. LUNO показывает данные источника без выдуманного контента.</p><div class="actions"><button class="primary" data-open="'+esc(item?.imdb_id||item?.tmdb_id||item?.id||'')+'" data-open-type="'+esc(item?.type==='series'?'series':'movie')+'">Подробнее</button><button class="secondary" data-nav="'+esc(item?.type==='series'?'series':'movie')+'">Каталог</button></div>';
}
function renderRow(el,id,items,type){
  const row=el.querySelector('[data-row="'+id+'"]');
  if(!row)return;
  row.innerHTML=items.length?items.slice(0,12).map(item=>cardMarkup(item,type)).join(''):'<div class="row-empty">Источник не вернул данные.</div>';
}
function scrollToSection(el,target){
  if(target==='home'){window.scrollTo({top:0,behavior:document.documentElement.dataset.device==='tv'?'auto':'smooth'});return}
  const id=target==='movie'?'movies':target==='series'?'series':'anime';
  el.querySelector('#'+id)?.scrollIntoView({behavior:document.documentElement.dataset.device==='tv'?'auto':'smooth',block:'start'});
}
function bindHome(el){
  el.addEventListener('click',event=>{
    const nav=event.target.closest('[data-nav]');
    if(nav){
      scrollToSection(el,nav.dataset.nav);
      el.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===nav.dataset.nav));
      return;
    }
    const link=event.target.closest('[data-scroll]');
    if(link){el.querySelector('#'+link.dataset.scroll)?.scrollIntoView({behavior:document.documentElement.dataset.device==='tv'?'auto':'smooth',block:'start'});return}
    if(event.target.closest('[data-search]')){openSearch(el);return}
    const rowControl=event.target.closest('[data-row-scroll]');
    if(rowControl){const row=el.querySelector('[data-row="'+rowControl.dataset.rowScroll+'"]');if(row)row.scrollBy({left:Number(rowControl.dataset.dir)*Math.max(420,row.clientWidth*.72),behavior:document.documentElement.dataset.device==='tv'?'auto':'smooth'});return}
    const card=event.target.closest('.media-card');
    if(card){openDetails(el,card.dataset.type,card.dataset.id);return}
    const open=event.target.closest('[data-open]');
    if(open){openDetails(el,open.dataset.openType||'movie',open.dataset.open)}
  });
  el.querySelectorAll('.media-row').forEach(row=>row.addEventListener('wheel',event=>{if(Math.abs(event.deltaY)>Math.abs(event.deltaX)){event.preventDefault();row.scrollLeft+=event.deltaY}}, {passive:false}));
  const navObserver=new IntersectionObserver(entries=>{const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;const key=visible.target.id==='movies'?'movie':visible.target.id==='series'?'series':visible.target.id==='anime'?'anime':'home';el.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===key))},{rootMargin:'-20% 0px -55% 0px',threshold:[0,.25,.5]});
  el.querySelectorAll('.content-section').forEach(section=>navObserver.observe(section));
  el.addEventListener('keydown',event=>{
    if(document.documentElement.dataset.device!=='tv')return;
    const keys=['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Enter','Escape'];
    if(!keys.includes(event.key))return;
    const modal=el.querySelector('.details-modal,.search-modal');
    if(event.key==='Escape'&&modal){modal.remove();return}
    const active=document.activeElement;
    if(event.key==='Enter'&&active?.matches('button,input')){active.click();return}
    if(!active||!active.matches('button,.media-card'))return;
    const buttons=[...el.querySelectorAll('.topbar button,.media-card,.section-link,.primary,.secondary,.search')].filter(x=>x.offsetParent!==null);
    const index=buttons.indexOf(active);
    if(index<0)return;
    let next=index;
    if(event.key==='ArrowRight')next=Math.min(buttons.length-1,index+1);
    if(event.key==='ArrowLeft')next=Math.max(0,index-1);
    if(event.key==='ArrowDown')next=Math.min(buttons.length-1,index+1);
    if(event.key==='ArrowUp')next=Math.max(0,index-1);
    if(next!==index){event.preventDefault();buttons[next].focus({preventScroll:false});buttons[next].scrollIntoView({behavior:document.documentElement.dataset.device==='tv'?'auto':'smooth',block:'nearest'})}
  });
}
async function openDetails(el,type,id){
  if(!id)return;
  const modal=document.createElement('div');
  modal.className='details-modal';
  modal.innerHTML='<div class="details-modal__panel"><button class="details-modal__close" aria-label="Закрыть">×</button><div class="details-modal__body">Загружаем данные…</div></div>';
  el.appendChild(modal);
  modal.querySelector('.details-modal__close').focus();
  modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.details-modal__close'))modal.remove()});
  const list=catalogStore[type]||[];
  const item=list.find(x=>String(x?.imdb_id||x?.mal_id||x?.id)===String(id));
  if(!item){
    modal.querySelector('.details-modal__body').textContent='Карточка больше недоступна в текущем каталоге.';
    return;
  }
  const image=poster(item), score=item?.imdbRating||item?.rating||item?.score;
  modal.querySelector('.details-modal__body').innerHTML=(image?'<img class="details-modal__poster" src="'+esc(image)+'" alt="">':'')+
    '<div class="details-modal__info"><div class="eyebrow">LUNO / '+esc(type==='anime'?'ANIME':type.toUpperCase())+'</div><h2>'+esc(item.name||item.title||'Без названия')+'</h2><div class="details-modal__meta">'+esc([yearOf(item)||item.year,score?'★ '+scoreOf(score):''].filter(Boolean).join(' · '))+'</div><p>'+esc(item.description||item.synopsis||'Описание отсутствует в источнике.')+'</p><button class="primary" disabled>Смотреть — подключим плеер следующим этапом</button></div>';
}
function openSearch(el){
  const modal=document.createElement('div');
  modal.className='search-modal';
  modal.innerHTML='<div class="search-modal__panel"><button class="details-modal__close" aria-label="Закрыть">×</button><input autofocus placeholder="Поиск по фильмам и сериалам"><div class="search-results"></div></div>';
  el.appendChild(modal);
  const input=modal.querySelector('input');
  const run=()=>{
    const q=input.value.trim().toLowerCase();
    if(q.length<2){modal.querySelector('.search-results').innerHTML='';return}
    const items=[...catalogStore.movie.map(x=>({...x,__type:'movie'})),...catalogStore.series.map(x=>({...x,__type:'series'}))]
      .filter(x=>String(x.name||x.title||'').toLowerCase().includes(q)).slice(0,12);
    modal.querySelector('.search-results').innerHTML=items.length?items.map(x=>'<button class="search-result" data-id="'+esc(x.imdb_id||x.id)+'" data-type="'+esc(x.__type)+'">'+(poster(x)?'<img src="'+esc(poster(x))+'" alt="">':'')+'<span>'+esc(x.name||'Без названия')+'</span></button>').join(''):'<div class="search-status">Ничего не найдено.</div>';
  };
  input.addEventListener('input',run);
  modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.details-modal__close'))modal.remove();const result=e.target.closest('.search-result');if(result){modal.remove();openDetails(el,result.dataset.type,result.dataset.id)}});
}
async function loadHome(){
  const el=homeShell();app.replaceChildren(el);bindHome(el);
  const error=el.querySelector('[data-error]');
  const results=await Promise.allSettled([loadCatalog('movie'),loadCatalog('series'),loadCatalog('anime')]);
  const [movies,series,anime]=results.map(r=>r.status==='fulfilled'?r.value:[]);
  setHero(el,movies[0]||series[0]);
  renderRow(el,'movies',movies,'movie');
  renderRow(el,'series',series,'series');
  renderRow(el,'anime',anime,'anime');
  const failed=results.some(r=>r.status==='rejected');
  if(failed){
    error.hidden=false;
    error.textContent='Один из источников временно недоступен. LUNO продолжает показывать доступные реальные каталоги.';
  }
  requestAnimationFrame(()=>{el.style.opacity='1';el.querySelector('.media-card')?.focus()});
}

const splash=document.createElement('main');
splash.className='splash';
splash.innerHTML='<div class="splash__veil" aria-hidden="true"></div><div class="startup-loader" aria-label="Загрузка LUNO"><div class="startup-loader__brand">LUNO</div><div class="startup-loader__track"><div class="startup-loader__bar"></div></div><div class="startup-loader__text">Загрузка…</div></div>';
if(window.matchMedia('(max-width:620px)').matches){splash.style.backgroundImage='url("./assets/luno-start-mobile.png?v=20261004-3")';splash.style.backgroundSize='cover';splash.style.backgroundPosition='center center';splash.style.backgroundRepeat='no-repeat';}
app.replaceChildren(splash);
setTimeout(loadHome,5600);

(function(){
  const updateTvScale=()=>{
    const w=window.innerWidth||document.documentElement.clientWidth,h=window.innerHeight||document.documentElement.clientHeight,ua=navigator.userAgent||'';
    const tvUA=/(smart-tv|smarttv|hbbtv|web0s|webos|tizen|netcast|viera|bravia|googletv|aftb|aftm|android tv|androidtv|tv;)/i.test(ua);
    const tvViewport=w>=800&&h>=450&&w/h>=1.45;
    const isTv=tvUA||tvViewport;
    const scale=isTv?Math.min(1920/Math.max(w,1),1080/Math.max(h,1)):1;
    document.documentElement.style.setProperty('--tv-scale',Math.max(1,Math.min(2.5,scale)).toFixed(3));
    document.documentElement.dataset.device=isTv?'tv':'other';
  };
  updateTvScale();window.addEventListener('resize',updateTvScale,{passive:true});window.addEventListener('orientationchange',updateTvScale,{passive:true});
})();