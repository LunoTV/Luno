const app=document.getElementById('app');

const CINEMETA_ENDPOINTS={
  movie:[
    'https://cinemeta-catalogs.strem.io/top/catalog/movie/top.json',
    'https://v3-cinemeta.strem.io/catalog/movie/top.json'
  ],
  series:[
    'https://cinemeta-catalogs.strem.io/top/catalog/series/top.json',
    'https://v3-cinemeta.strem.io/catalog/series/top.json'
  ]
};
const JIKAN_TOP='https://api.jikan.moe/v4/top/anime?limit=12';

const esc=(value='')=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yearOf=item=>{
  const y=item?.releaseInfo||item?.year;
  const match=String(y||'').match(/\d{4}/);
  return match?match[0]:'';
};
const scoreOf=value=>{
  const n=Number(value);
  return Number.isFinite(n)?n.toFixed(1):String(value||'');
};

async function fetchJson(urls){
  let lastError;
  for(const url of urls){
    try{
      const res=await fetch(url,{headers:{accept:'application/json'}});
      if(!res.ok) throw new Error(String(res.status));
      return await res.json();
    }catch(error){lastError=error}
  }
  throw lastError||new Error('request failed');
}

async function loadCatalog(type){
  const data=await fetchJson(CINEMETA_ENDPOINTS[type]);
  return Array.isArray(data?.metas)?data.metas:[];
}
async function loadAnime(){
  const data=await fetchJson([JIKAN_TOP]);
  return Array.isArray(data?.data)?data.data:[];
}
function poster(item){
  return item?.poster||item?.images?.jpg?.large_image_url||item?.images?.jpg?.image_url||'';
}
function cardMarkup(item,type){
  const title=item?.name||item?.title||'Без названия';
  const image=poster(item);
  const score=item?.imdbRating||item?.rating||item?.score;
  const year=yearOf(item)||item?.year||'';
  return '<button class="media-card" tabindex="0" data-type="'+esc(type)+'" data-id="'+esc(item?.imdb_id||item?.mal_id||'')+'">'+
    '<span class="media-card__poster">'+
      (image?'<img src="'+esc(image)+'" alt="" loading="lazy">':'<span class="media-card__poster-fallback">LUNO</span>')+
      '<span class="media-card__shade"></span>'+
      (score?'<span class="media-card__score">★ '+esc(scoreOf(score))+'</span>':'')+
    '</span>'+
    '<span class="media-card__title">'+esc(title)+'</span>'+
    '<span class="media-card__meta">'+esc([year,type==='anime'?'Аниме':type==='series'?'Сериал':'Фильм'].filter(Boolean).join(' · '))+'</span>'+
  '</button>';
}
function sectionMarkup(title,sub,id){
  return '<section class="content-section" id="'+id+'"><div class="section__head"><div><h2>'+title+'</h2><p>'+sub+'</p></div><button class="section-link" data-scroll="'+id+'">Все</button></div><div class="media-row" data-row="'+id+'"><div class="row-loading" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div></div></section>';
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
    '<div class="catalog">'+sectionMarkup('Фильмы','Реальные данные Cinemeta','movies')+sectionMarkup('Сериалы','Реальные данные Cinemeta','series')+sectionMarkup('Аниме','Реальные данные MyAnimeList через Jikan','anime')+'</div>'+
    '<div class="catalog-error" data-error hidden></div>'+
    '<nav class="mobile-nav"><button class="active" data-nav="home">⌂<br>Главная</button><button data-nav="movie">◌<br>Фильмы</button><button data-nav="series">◯<br>Сериалы</button><button data-search>⌕<br>Поиск</button></nav>';
  return el;
}
function setHero(el,item){
  const hero=el.querySelector('[data-hero]');
  if(!hero||!item)return;
  const image=poster(item), title=item?.name||item?.title||'LUNO', score=item?.imdbRating||item?.rating, year=yearOf(item)||item?.year||'';
  hero.querySelector('.hero__backdrop').style.backgroundImage=image?'url("'+image.replace(/"/g,'\\\"')+'")':'';
  hero.querySelector('.hero__content').innerHTML='<div class="eyebrow">LUNO / '+esc(item?.type==='series'?'SERIES':'CINEMA')+'</div><h1>'+esc(title)+'</h1><div class="hero__meta">'+esc([year,score?'★ '+scoreOf(score):''].filter(Boolean).join(' · '))+'</div><p>Реальная карточка из подключённого каталога. LUNO показывает данные источника без выдуманного контента.</p><div class="actions"><button class="primary" data-open="'+esc(item?.imdb_id||'')+'">Подробнее</button><button class="secondary" data-nav="'+esc(item?.type==='series'?'series':'movie')+'">Каталог</button></div>';
}
function renderRow(el,id,items,type){
  const row=el.querySelector('[data-row="'+id+'"]');
  if(!row)return;
  row.innerHTML=items.length?items.slice(0,12).map(item=>cardMarkup(item,type)).join(''):'<div class="row-empty">Источник не вернул данные.</div>';
}
function scrollToSection(el,target){
  if(target==='home'){window.scrollTo({top:0,behavior:'smooth'});return}
  const id=target==='movie'?'movies':target==='series'?'series':'anime';
  el.querySelector('#'+id)?.scrollIntoView({behavior:'smooth',block:'start'});
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
    if(link){el.querySelector('#'+link.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'});return}
    if(event.target.closest('[data-search]')){openSearch(el);return}
    const card=event.target.closest('.media-card');
    if(card){openDetails(el,card.dataset.type,card.dataset.id);return}
    const open=event.target.closest('[data-open]');
    if(open){openDetails(el,'movie',open.dataset.open)}
  });
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
    if(next!==index){event.preventDefault();buttons[next].focus({preventScroll:false});buttons[next].scrollIntoView({behavior:'smooth',block:'nearest'})}
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
  try{
    const data=await fetchJson([type==='anime'?'https://api.jikan.moe/v4/anime/'+encodeURIComponent(id):'https://cinemeta-catalogs.strem.io/top/meta/'+(type==='series'?'series':'movie')+'/'+encodeURIComponent(id)+'.json']);
    const item=type==='anime'?data?.data:data?.meta;
    if(!item)throw new Error('no data');
    const image=poster(item), score=item?.imdbRating||item?.score;
    modal.querySelector('.details-modal__body').innerHTML=(image?'<img class="details-modal__poster" src="'+esc(image)+'" alt="">':'')+
      '<div class="details-modal__info"><div class="eyebrow">LUNO / '+esc(type==='anime'?'ANIME':type.toUpperCase())+'</div><h2>'+esc(item.name||item.title||'Без названия')+'</h2><div class="details-modal__meta">'+esc([yearOf(item)||item.year,score?'★ '+scoreOf(score):''].filter(Boolean).join(' · '))+'</div><p>'+esc(item.description||item.synopsis||'Описание отсутствует в источнике.')+'</p><button class="primary" disabled>Смотреть — подключим плеер следующим этапом</button></div>';
  }catch{modal.querySelector('.details-modal__body').textContent='Не удалось получить данные источника.'}
}
function openSearch(el){
  const modal=document.createElement('div');
  modal.className='search-modal';
  modal.innerHTML='<div class="search-modal__panel"><button class="details-modal__close" aria-label="Закрыть">×</button><input autofocus placeholder="Название фильма или сериала"><div class="search-results"></div></div>';
  el.appendChild(modal);
  const input=modal.querySelector('input');let timer;
  const run=async()=>{
    const q=input.value.trim();if(q.length<2)return;
    modal.querySelector('.search-results').innerHTML='<div class="search-status">Ищем в реальном каталоге…</div>';
    try{
      const [movies,series]=await Promise.all([fetchJson(['https://cinemeta-catalogs.strem.io/top/catalog/movie/top/search='+encodeURIComponent(q)+'.json']),fetchJson(['https://cinemeta-catalogs.strem.io/top/catalog/series/top/search='+encodeURIComponent(q)+'.json'])]);
      const items=[...(movies?.metas||[]).slice(0,6).map(x=>({...x,__type:'movie'})),...(series?.metas||[]).slice(0,6).map(x=>({...x,__type:'series'}))];
      modal.querySelector('.search-results').innerHTML=items.length?items.map(x=>'<button class="search-result" data-id="'+esc(x.imdb_id)+'" data-type="'+esc(x.__type)+'">'+(poster(x)?'<img src="'+esc(poster(x))+'" alt="">':'')+'<span>'+esc(x.name||'Без названия')+'</span></button>').join(''):'<div class="search-status">Ничего не найдено.</div>';
    }catch{modal.querySelector('.search-results').innerHTML='<div class="search-status">Источник поиска временно недоступен.</div>'}
  };
  input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(run,350)});
  modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.details-modal__close'))modal.remove();const result=e.target.closest('.search-result');if(result){modal.remove();openDetails(el,result.dataset.type,result.dataset.id)}});
}
async function loadHome(){
  const el=homeShell();app.replaceChildren(el);bindHome(el);
  const error=el.querySelector('[data-error]');
  const results=await Promise.allSettled([loadCatalog('movie'),loadCatalog('series'),loadAnime()]);
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
splash.innerHTML='<div class="splash__veil" aria-hidden="true"></div><div class="startup-loader" aria-label="Загрузка LUNO"><div class="startup-loader__track"><div class="startup-loader__bar"></div></div><div class="startup-loader__text">Загрузка приложения…</div></div>';
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