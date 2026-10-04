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
      '<span class="media-card__bottom">'+
        '<span class="media-card__meta">'+esc(year)+'</span>'+
        (score?'<span class="media-card__score"><span class="media-card__star">★</span> '+esc(scoreOf(score))+'</span>':'')+
      '</span>'+
    '</span>'+
    '<span class="media-card__title">'+esc(title)+'</span>'+
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
        '<button class="active" data-nav="home">⌂ Главная</button><button data-nav="history">◷ История</button><button data-nav="movie">▣ Фильмы</button><button data-nav="series">▤ Сериалы</button><button data-settings>⚙ Настройки</button>'+
      '</nav><button class="search" data-search aria-label="Поиск">⌕</button>'+
    '</header>'+
    '<section class="hero" data-hero><div class="hero__backdrop"></div><div class="hero__shade"></div><div class="hero__content"><div class="eyebrow">LUNO / REAL CATALOG</div><div class="hero__loading">Загружаем каталог…</div></div></section>'+
    '<div class="catalog">'+
      sectionMarkup('История','Недавно открытые фильмы и сериалы','history')+
      sectionMarkup('Рекомендуем посмотреть','Подборка на основе ваших просмотров','recommendations')+
      sectionMarkup('Популярное','Что сейчас чаще выбирают в каталоге','popular')+
      sectionMarkup('Новинки','Самые свежие позиции из подключённых каталогов','new')+
      sectionMarkup('Фильмы','Реальные данные TMDB','movies')+
      sectionMarkup('Сериалы','Реальные данные TMDB','series')+
      sectionMarkup('Аниме','Реальные данные MyAnimeList через Jikan','anime')+
    '</div>'+
    '<div class="catalog-error" data-error hidden></div>'+
    '<nav class="mobile-nav"><button class="active" data-nav="home">⌂<br>Главная</button><button data-nav="history">◷<br>История</button><button data-nav="movie">▣<br>Фильмы</button><button data-nav="series">▤<br>Сериалы</button><button data-settings>⚙<br>Настройки</button></nav>';
  return el;
}
function setHero(el,item){
  const hero=el.querySelector('[data-hero]');
  if(!hero||!item)return;
  const image=backdrop(item), title=item?.name||item?.title||'LUNO';
  const score=item?.imdbRating||item?.rating||item?.score;
  const year=yearOf(item)||item?.year||'';
  const genres=Array.isArray(item?.genres)?item.genres.join(' · '):String(item?.genre||'');
  const description=item?.description||item?.overview||item?.synopsis||'';
  const type=item?.type==='series'?'Сериал':item?.type==='anime'?'Аниме':cardTypeLabel(item,'movie');
  hero.querySelector('.hero__backdrop').style.backgroundImage=image?'url("'+image.replace(/"/g,'\\\"')+'")':'';
  hero.querySelector('.hero__content').innerHTML=
    '<div class="eyebrow">LUNO / '+esc(type.toUpperCase())+'</div>'+
    '<h1>'+esc(title)+'</h1>'+
    (description?'<p class="hero__quote">'+esc(description)+'</p>':'')+
    '<div class="hero__meta">'+esc([type,year,genres].filter(Boolean).join(' · '))+'</div>'+
    '<div class="hero__actions-row"><div class="actions"><button class="primary" data-open="'+esc(item?.imdb_id||item?.tmdb_id||item?.id||'')+'" data-open-type="'+esc(item?.type==='series'?'series':'movie')+'">▶ Смотреть</button><button class="secondary" data-open="'+esc(item?.imdb_id||item?.tmdb_id||item?.id||'')+'" data-open-type="'+esc(item?.type==='series'?'series':'movie')+'">Подробнее</button></div>'+
    (score?'<div class="hero-rating"><span>★</span><strong>'+esc(scoreOf(score))+'</strong><small>оценка</small></div>':'')+
    '</div>';
}
function renderRow(el,id,items,type){
  const row=el.querySelector('[data-row="'+id+'"]');
  if(!row)return;
  row.innerHTML=items.length?items.slice(0,16).map(item=>cardMarkup(item,item.__type||type)).join(''):'<div class="row-empty">Пока здесь ничего нет. Откройте фильм или сериал — LUNO добавит его в историю.</div>';
}
function readHistory(){
  try{return JSON.parse(localStorage.getItem('luno_history_v1')||'[]').filter(Boolean)}catch{return[]}
}
function saveHistory(item,type){
  const id=item?.imdb_id||item?.tmdb_id||item?.mal_id||item?.id;
  if(!id)return;
  const entry={...item,__type:type,__historyId:String(id),__historyAt:Date.now()};
  const list=readHistory().filter(x=>String(x.__historyId)!==String(id));
  list.unshift(entry);
  try{localStorage.setItem('luno_history_v1',JSON.stringify(list.slice(0,24)))}catch{}
}
function historyItems(){
  return readHistory().map(x=>({...x,__type:x.__type||'movie'}));
}
function allCatalogItems(){
  return [
    ...catalogStore.movie.map(x=>({...x,__type:'movie'})),
    ...catalogStore.series.map(x=>({...x,__type:'series'})),
    ...catalogStore.anime.map(x=>({...x,__type:'anime'}))
  ];
}
function recommendationItems(){
  const all=allCatalogItems();
  const history=historyItems();
  if(!history.length)return all.slice().sort((a,b)=>Number(b.imdbRating||b.rating||b.score||0)-Number(a.imdbRating||a.rating||a.score||0)).slice(0,16);
  const watchedTitles=new Set(history.map(x=>String(x.name||x.title||'').toLowerCase()));
  const genreText=history.map(x=>Array.isArray(x.genres)?x.genres.join(' '):String(x.genre||'')).join(' ').toLowerCase();
  return all.filter(x=>!watchedTitles.has(String(x.name||x.title||'').toLowerCase())).sort((a,b)=>{
    const ga=String(Array.isArray(a.genres)?a.genres.join(' '):a.genre||'').toLowerCase();
    const gb=String(Array.isArray(b.genres)?b.genres.join(' '):b.genre||'').toLowerCase();
    const ma=genreText?genreText.split(/\\s+/).reduce((n,g)=>n+(g.length>3&&ga.includes(g)?1:0),0):0;
    const mb=genreText?genreText.split(/\\s+/).reduce((n,g)=>n+(g.length>3&&gb.includes(g)?1:0),0):0;
    return (mb-ma)*10+(Number(b.imdbRating||b.rating||b.score||0)-Number(a.imdbRating||a.rating||a.score||0));
  }).slice(0,16);
}
function popularItems(){
  return allCatalogItems().sort((a,b)=>Number(b.imdbRating||b.rating||b.score||0)-Number(a.imdbRating||a.rating||a.score||0)).slice(0,16);
}
function newItems(){
  return allCatalogItems().sort((a,b)=>Number(yearOf(b)||b.year||0)-Number(yearOf(a)||a.year||0)).slice(0,16);
}
function routeTo(target){
  if(window.LunoCore?.router?.go){window.LunoCore.router.go(target);return;}
  scrollToSection(document.querySelector('.home'),target);
}
function renderRouteScreen(el,route){
  if(route==='home'){el.querySelector('.luno-screen')?.remove();el.querySelector('.home')?.classList.remove('route-hidden');return;}
  el.querySelector('.home')?.classList.add('route-hidden');
  el.querySelector('.luno-screen')?.remove();
  const screen=document.createElement('main');screen.className='luno-screen';
  const title=route==='movie'?'Фильмы':route==='series'?'Сериалы':route==='anime'?'Аниме':route==='history'?'История':'LUNO';
  const sub=route==='movie'?'Полный каталог фильмов':route==='series'?'Полный каталог сериалов':route==='anime'?'Полный каталог аниме':'Недавно открытые';
  const type=route==='movie'?'movie':route==='series'?'series':route==='anime'?'anime':'history';
  const items=type==='history'?historyItems():catalogStore[type]||[];
  screen.innerHTML='<header class="screen-head"><button class="screen-back" data-route-back>‹</button><div><div class="eyebrow">LUNO / CATALOG</div><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div></header><div class="screen-grid">'+(items.length?items.map(x=>cardMarkup(x,x.__type||type)).join(''):'<div class="row-empty">Каталог пока пуст.</div>')+'</div>';
  el.appendChild(screen);const firstCard=screen.querySelector('.media-card');(firstCard||screen.querySelector('[data-route-back]'))?.focus();
}
function bindHome(el){
  el.addEventListener('click',event=>{
    const nav=event.target.closest('[data-nav]');
    if(nav){
      routeTo(nav.dataset.nav);
      el.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===nav.dataset.nav));
      return;
    }
    const routeBack=event.target.closest('[data-route-back]');if(routeBack){window.LunoCore?.router?.back?.()||routeTo('home');return}
    const link=event.target.closest('[data-scroll]');
    if(link){el.querySelector('#'+link.dataset.scroll)?.scrollIntoView({behavior:document.documentElement.dataset.device==='tv'?'auto':'smooth',block:'start'});return}
    if(event.target.closest('[data-search]')){openSearch(el);return}
    if(event.target.closest('[data-settings]')){openSettings(el);return}
    const rowControl=event.target.closest('[data-row-scroll]');
    if(rowControl){const row=el.querySelector('[data-row="'+rowControl.dataset.rowScroll+'"]');if(row)row.scrollBy({left:Number(rowControl.dataset.dir)*Math.max(420,row.clientWidth*.72),behavior:document.documentElement.dataset.device==='tv'?'auto':'smooth'});return}
    const card=event.target.closest('.media-card');
    if(card){openDetails(el,card.dataset.type,card.dataset.id);return}
    const open=event.target.closest('[data-open]');
    if(open){openDetails(el,open.dataset.openType||'movie',open.dataset.open)}
  });
  const scrollHost=document.documentElement.dataset.device==='tv'?app:window;scrollHost.addEventListener('scroll',()=>{const y=document.documentElement.dataset.device==='tv'?app.scrollTop:window.scrollY;el.querySelector('.topbar')?.classList.toggle('is-scrolled',y>28)},{passive:true});
  el.querySelectorAll('.media-row').forEach(row=>row.addEventListener('wheel',event=>{if(Math.abs(event.deltaY)>Math.abs(event.deltaX)){event.preventDefault();row.scrollLeft+=event.deltaY}}, {passive:false}));
  const navObserver=new IntersectionObserver(entries=>{const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;const key=visible.target.id==='movies'?'movie':visible.target.id==='series'?'series':visible.target.id==='anime'?'anime':visible.target.id==='history'?'history':'home';el.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===key))},{root:document.documentElement.dataset.device==='tv'?app:null,rootMargin:'-20% 0px -55% 0px',threshold:[0,.25,.5]});
  el.querySelectorAll('.content-section').forEach(section=>navObserver.observe(section));
  el.addEventListener('keydown',event=>{
    if(document.documentElement.dataset.device!=='tv')return;
    const keys=['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Enter','Escape'];
    if(!keys.includes(event.key))return;
    const modal=el.querySelector('.details-modal,.search-modal,.settings-modal');
    if(event.key==='Escape'&&modal){modal.remove();return}
    const active=document.activeElement;
    if(event.key==='Enter'&&active?.matches('button,input')){active.click();return}
    if(!active?.matches('button,.media-card'))return;

    const focusElement=(target)=>{
      if(!target||target===active)return;
      event.preventDefault();
      target.focus({preventScroll:true});
      target.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});
    };

    const moveWithinRow=(direction)=>{
      const row=active.closest('.media-row');
      if(!row)return false;
      const cards=[...row.querySelectorAll('.media-card')].filter(x=>x.offsetParent!==null);
      const index=cards.indexOf(active);
      if(index<0)return false;
      const next=index+(direction==='right'?1:-1);
      if(cards[next])focusElement(cards[next]);
      return true;
    };

    const moveBetweenRows=(direction)=>{
      const currentRow=active.closest('.media-row');
      if(!currentRow)return false;
      const sections=[...el.querySelectorAll('.content-section')].filter(section=>{
        const row=section.querySelector('.media-row');
        return row&&row.querySelector('.media-card')&&row.offsetParent!==null;
      });
      const currentSection=active.closest('.content-section');
      const sectionIndex=sections.indexOf(currentSection);
      if(sectionIndex<0)return false;
      const targetSection=sections[sectionIndex+(direction==='down'?1:-1)];
      if(!targetSection)return false;
      const cards=[...targetSection.querySelectorAll('.media-card')].filter(x=>x.offsetParent!==null);
      if(!cards.length)return false;
      const activeRect=active.getBoundingClientRect();
      const activeCenter=activeRect.left+activeRect.width/2;
      const target=cards.reduce((best,card)=>{
        if(!best)return card;
        const bestRect=best.getBoundingClientRect();
        const cardRect=card.getBoundingClientRect();
        return Math.abs(cardRect.left+cardRect.width/2-activeCenter)<Math.abs(bestRect.left+bestRect.width/2-activeCenter)?card:best;
      },null);
      focusElement(target);
      target?.closest('.content-section')?.scrollIntoView({behavior:'auto',block:'start'});
      return true;
    };

    // TV: ArrowDown from the top navigation opens the feed.
    if(active.closest('.topbar')){
      if(event.key==='ArrowDown'){
        const firstCard=el.querySelector('.content-section .media-row .media-card');
        if(firstCard){
          focusElement(firstCard);
          firstCard.closest('.content-section')?.scrollIntoView({behavior:'auto',block:'start'});
          return;
        }
        const heroAction=el.querySelector('.hero .primary,.hero .secondary');
        if(heroAction){focusElement(heroAction);return;}
      }
      if(event.key==='ArrowUp')return;
    }

    if(active.matches('.media-card')){
      if(event.key==='ArrowRight'&&moveWithinRow('right'))return;
      if(event.key==='ArrowLeft'&&moveWithinRow('left'))return;
      if(event.key==='ArrowDown'&&moveBetweenRows('down'))return;
      if(event.key==='ArrowUp'&&moveBetweenRows('up'))return;
    }

    const buttons=[...el.querySelectorAll('.topbar button,.media-card,.section-link,.primary,.secondary,.search,.settings-tile,.row-control')].filter(x=>x.offsetParent!==null);
    const index=buttons.indexOf(active);
    if(index<0)return;
    let next=index;
    if(event.key==='ArrowRight')next=Math.min(buttons.length-1,index+1);
    if(event.key==='ArrowLeft')next=Math.max(0,index-1);
    if(event.key==='ArrowDown')next=Math.min(buttons.length-1,index+1);
    if(event.key==='ArrowUp')next=Math.max(0,index-1);
    if(next!==index)focusElement(buttons[next]);
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
  const item=list.find(x=>String(x?.imdb_id||x?.tmdb_id||x?.mal_id||x?.id)===String(id))||historyItems().find(x=>String(x?.__historyId)===String(id));
  if(!item){
    modal.querySelector('.details-modal__body').textContent='Карточка больше недоступна в текущем каталоге.';
    return;
  }
  saveHistory(item,type);
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
  const history=historyItems();
  renderRow(el,'history',history,'movie');
  renderRow(el,'recommendations',recommendationItems(),'movie');
  renderRow(el,'popular',popularItems(),'movie');
  renderRow(el,'new',newItems(),'movie');
  renderRow(el,'movies',movies,'movie');
  renderRow(el,'series',series,'series');
  renderRow(el,'anime',anime,'anime');
  const failed=results.some(r=>r.status==='rejected');
  if(failed){error.hidden=false;error.textContent='Один из источников временно недоступен. LUNO продолжает показывать доступные реальные каталоги.'}
  requestAnimationFrame(()=>{el.style.opacity='1';el.querySelector('.media-card')?.focus()});
}
function openSettings(el){
  const modal=document.createElement('div');
  modal.className='settings-modal';
  modal.innerHTML='<div class="settings-panel"><button class="details-modal__close" aria-label="Закрыть">×</button><div class="settings-head"><span class="settings-icon">☾</span><div><div class="eyebrow">LUNO</div><h2>Настройки</h2><p>Настройте интерфейс под себя</p></div></div><div class="settings-grid">'+
    '<button class="settings-tile" data-setting="profile"><span>◉</span><strong>Профиль</strong><small>Локальный профиль</small></button>'+
    '<button class="settings-tile" data-setting="interface"><span>◌</span><strong>Интерфейс</strong><small>Анимации и вид</small></button>'+
    '<button class="settings-tile" data-setting="catalog"><span>▤</span><strong>Каталог</strong><small>Фильмы, сериалы, аниме</small></button>'+
    '<button class="settings-tile" data-setting="player"><span>▶</span><strong>Плеер</strong><small>Настроим следующим этапом</small></button>'+
    '<button class="settings-tile settings-tile--wide" data-setting="other"><span>◒</span><strong>Остальное</strong><small>Поведение LUNO и история</small></button>'+
    '<button class="settings-tile settings-tile--wide" data-setting="pin"><span>⌁</span><strong>Защита PIN-кодом</strong><small>Раздел будет доступен после авторизации</small></button>'+
    '</div></div>';
  el.appendChild(modal);
  modal.querySelector('.details-modal__close').focus();
  modal.addEventListener('click',e=>{
    if(e.target===modal||e.target.closest('.details-modal__close')){modal.remove();return}
    const tile=e.target.closest('[data-setting]');
    if(tile) settingsAction(tile.dataset.setting);
  });
}
function settingsAction(key){
  if(key==='interface'){
    const enabled=localStorage.getItem('luno_motion')!=='off';
    localStorage.setItem('luno_motion',enabled?'off':'on');
    document.documentElement.classList.toggle('luno-reduced-motion',enabled);
    return;
  }
  if(key==='other'){return;}
}
const splash=document.createElement('main');
splash.className='splash';
splash.innerHTML='<div class="splash__veil" aria-hidden="true"></div><div class="startup-loader" aria-label="Загрузка LUNO"><div class="startup-loader__brand">LUNO</div><div class="startup-loader__track"><div class="startup-loader__bar"></div></div><div class="startup-loader__text">Загрузка…</div></div>';
if(window.matchMedia('(max-width:620px)').matches){splash.style.backgroundImage='url("./assets/luno-start-mobile.png?v=20261004-3")';splash.style.backgroundSize='cover';splash.style.backgroundPosition='center center';splash.style.backgroundRepeat='no-repeat';}
app.replaceChildren(splash);
loadHome();

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
window.addEventListener('luno:navigate',event=>{const route=event.detail?.route||'home';const home=document.querySelector('.home');if(!home)return;renderRouteScreen(home,route);home.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===route));});
