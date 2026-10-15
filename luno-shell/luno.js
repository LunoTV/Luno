(() => {
  const screen = document.querySelector('#screen');
  const navItems = [...document.querySelectorAll('[data-tab]')];
  const TMDB_KEY = '4ef0d7355d9ffb5151e987764708ce96';
  const TMDB_API = 'https://api.themoviedb.org/3';
  const IMG = 'https://image.tmdb.org/t/p/';
  const state = {tab:'home',catalogType:'Фильмы',sort:'По новизне',posterMode:'landscape',catalogGenre:'',search:'',items:[],selected:null,busy:false,error:'',watchlist:[],history:[],watchSection:'Избранное',featureIndex:0,homeShelves:{popular:[],topMovies:[],topShows:[],forYou:[],cult:[]}};
  const safe = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titleOf = x => x.title || x.name || x.original_title || x.original_name || 'Без названия';
  const imageOf = (x,size='w500') => x?.poster_path ? IMG+size+x.poster_path : (x?.poster?.startsWith?.('http') ? x.poster : '');
  const backdropOf = x => x?.backdrop_path ? IMG+'w1280'+x.backdrop_path : imageOf(x,'w780');
  // Choose TMDB artwork by the actual card shape: poster_path for portrait,
  // backdrop_path for landscape. Fall back gracefully when one variant is absent.
  const artworkOf = (x,orientation='portrait') => orientation==='landscape'
    ? (x?.backdrop_path ? IMG+'w1280'+x.backdrop_path : imageOf(x,'w500'))
    : (x?.poster_path ? IMG+'w500'+x.poster_path : (x?.backdrop_path ? IMG+'w780'+x.backdrop_path : imageOf(x,'w500')));
  const dateOf = x => (x.release_date || x.first_air_date || '').slice(0,4);
  const normalize = data => (Array.isArray(data)?data:(data?.results||[])).map(x=>({...x,title:titleOf(x),tag:x.vote_average?'★ '+Number(x.vote_average).toFixed(1):'LUNO',meta:[dateOf(x),x.media_type==='tv'||x.name?'Сериал':'Фильм'].filter(Boolean).join(' · ')}));
  async function tmdb(path,params={}) {
    const q=new URLSearchParams({api_key:TMDB_KEY,language:'ru-RU',...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)]))});
    const response=await fetch(TMDB_API+'/'+path+'?'+q.toString());
    if(!response.ok) throw new Error('Каталог недоступен (TMDB '+response.status+').');
    return response.json();
  }
  function poster(item,i=0) {
    const orientation=state.tab==='catalog'&&state.posterMode==='landscape'?'landscape':'portrait';
    const img=artworkOf(item,orientation);
    const style=img?'':'background-image:radial-gradient(circle at 30% 20%,#7542b8,transparent 60%),linear-gradient(145deg,#39234a,#15101c)';
    const artwork=img?`<img class="poster-image" src="${safe(img)}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true">`:'';
    const kind=state.tab==='catalog'&&state.catalogType==='Аниме'?'АНИМЕ':(item.media_type==='tv'||item.name?(item.genre_ids?.includes(16)?'МУЛЬТФИЛЬМ':'СЕРИАЛ'):(item.genre_ids?.includes(16)?'МУЛЬТФИЛЬМ':'ФИЛЬМ'));
    const year=dateOf(item)||'—';
    const rating=item.vote_average?Number(item.vote_average).toFixed(1):'—';
    return `<button class="poster" style="${style}" data-item="${safe(item._lunoId ?? i)}" data-title="${safe(item.title)}" aria-label="Открыть ${safe(item.title)}"><span class="poster-art"><img class="poster-image" src="${safe(img)}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true" ${img?'':'hidden'}><span class="poster-kind">${kind}</span><span class="poster-rating">★ ${rating}</span><span class="poster-year">${safe(year)}</span><span class="poster-overlay"><strong class="poster-overlay-title">${safe(item.title)}</strong><span class="poster-overlay-meta">★ ${rating} · ${safe(year)} · ${kind.toLowerCase()}</span><span class="poster-overview">${safe((item.overview||'').slice(0,170))}</span></span></span><strong class="poster-title">${safe(item.title)}</strong></button>`;
  }
  const head=t=>`<div class="section-head"><h2>${t}</h2><button class="quiet" data-tab="catalog">Показать ещё ↗</button></div>`;
  const tabs=(items,active,key)=>`<div class="tabs">${items.map(v=>`<button class="tab-chip ${v===active?'selected':''}" data-${key}="${safe(v)}">${safe(v)}</button>`).join('')}</div>`;
  const cards=list=>list.length?list.map((x,i)=>poster(x,i)).join(''):'<p class="quiet">Ничего не найдено.</p>';
  async function loadCatalog(type=state.catalogType) {
    state.busy=true;state.error='';render();
    try {
      const ranked=state.sort==='По рейтингу'?'vote_average.desc':'popularity.desc';
      const base={sort_by:ranked,'vote_count.gte':type==='Аниме'?5:10};
      const withGenre=(extra={})=>({...base,...extra,...(state.catalogGenre?{with_genres:extra.with_genres?`${extra.with_genres},${state.catalogGenre}`:state.catalogGenre}:{})});
      const pages=async(path,params)=>Promise.all([1,2,3].map(page=>tmdb(path,{...params,page})));
      let results=[];
      if(type==='Фильмы'){
        const batches=await pages('discover/movie',withGenre({without_genres:16}));
        results=batches.flatMap(normalize).map(x=>({...x,media_type:'movie'})).filter(x=>!(x.genre_ids||[]).includes(16));
      }else if(type==='Сериалы'){
        const batches=await pages('discover/tv',withGenre({without_genres:16}));
        results=batches.flatMap(normalize).map(x=>({...x,media_type:'tv'})).filter(x=>!(x.genre_ids||[]).includes(16));
      }else if(type==='Мультфильмы'){
        const [movies,shows]=await Promise.all([
          pages('discover/movie',withGenre({with_genres:16})),
          pages('discover/tv',withGenre({with_genres:16}))
        ]);
        results=[...movies.flatMap(normalize).map(x=>({...x,media_type:'movie'})),...shows.flatMap(normalize).map(x=>({...x,media_type:'tv'}))];
      }else if(type==='Аниме'){
        const animeParams={with_genres:16,with_original_language:'ja','vote_count.gte':5,sort_by:ranked};
        const [movies,shows]=await Promise.all([
          pages('discover/movie',{...animeParams,...(state.catalogGenre?{with_genres:'16,'+state.catalogGenre}:{})}),
          pages('discover/tv',{...animeParams,...(state.catalogGenre?{with_genres:'16,'+state.catalogGenre}:{})})
        ]);
        results=[...movies.flatMap(normalize).map(x=>({...x,media_type:'movie'})),...shows.flatMap(normalize).map(x=>({...x,media_type:'tv'}))];
      }
      const unique=new Map();
      for(const item of results){const key=(item.media_type||'movie')+':'+item.id;if(item.id&&!unique.has(key))unique.set(key,item);}
      state.items=[...unique.values()].sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0)).map((x,i)=>({...x,_lunoId:i,source:'tmdb'}));
      if(!state.items.length) state.error='Каталог вернул пустой список.';
    } catch(e){state.error=e.message||'Не удалось загрузить каталог.';}
    finally{state.busy=false;render();}
  }
  async function doSearch(query) {
    state.search=query;state.busy=true;state.error='';render();
    try {
      if(!query.trim()){state.items=[];return;}
      const data=await tmdb('search/multi',{query,include_adult:false,page:1});
      state.items=normalize(data).filter(x=>x.media_type==='movie'||x.media_type==='tv').map((x,i)=>({...x,_lunoId:i,source:'tmdb'}));
      if(!state.items.length)state.error='Ничего не найдено.';
    } catch(e){state.error=e.message||'Поиск временно недоступен.';}
    finally{state.busy=false;render();}
  }
  async function loadHomeShelves(){
    const shelves=state.homeShelves;
    const jobs=[
      ['popular','trending/all/week',{page:1}],
      ['topMovies','movie/top_rated',{page:1}],
      ['topShows','tv/top_rated',{page:1}],
      ['forYou','movie/popular',{page:2}],
      ['cult','movie/top_rated',{page:2}]
    ];
    await Promise.all(jobs.map(async ([key,path,params])=>{
      if(shelves[key].length)return;
      try{
        const data=await tmdb(path,params);
        shelves[key]=normalize(data).filter(x=>x.backdrop_path||x.poster_path).slice(0,10).map((x,i)=>({...x,_lunoId:key+'-'+i,source:'tmdb'}));
      }catch(_){}
    }));
    if(state.tab==='home')render();
  }
  const shelfMarkup=(title,items,key)=>items.length?'<section class="home-shelf themed-shelf"><div class="section-head"><h2>'+safe(title)+'</h2><button class="quiet" data-home-shelf="'+key+'">Показать ещё ↗</button></div><div class="poster-row home-posters">'+cards(items)+'</div></section>':'';
  function home(){
    // Keep the hero and the first poster row in sync: only use titles with real artwork,
    // and put the currently featured title first in the shelf beneath the banner.
    const list=state.items.filter(x=>x && (x.backdrop_path || x.poster_path)).slice(0,10);
    const feature=list[state.featureIndex % Math.max(1,list.length)] || list[0];
    const shelf=feature?[...list.slice(state.featureIndex % Math.max(1,list.length)),...list.slice(0,state.featureIndex % Math.max(1,list.length))]:list;
    const bg=feature&&backdropOf(feature);
    const heroStyle=bg?`style="background-image:linear-gradient(180deg,rgba(10,9,12,.04) 0%,rgba(10,9,12,.04) 38%,rgba(10,9,12,.76) 68%,#101012 100%),url('${safe(bg)}')"`:'';
    const genres=(feature?.genre_ids||[]).map(id=>({16:'Анимация',35:'Комедия',28:'Боевик',14:'Фэнтези',18:'Драма',12:'Приключения',878:'Фантастика',53:'Триллер',80:'Криминал',10749:'Мелодрама',9648:'Детектив',27:'Ужасы',10751:'Семейный',99:'Документальный',10759:'Боевик',10765:'Фэнтези'}[id])).filter(Boolean).slice(0,4).join(', ');
    return `<section class="home-hero" ${heroStyle}>
      <div class="home-hero-content">
        <span class="premiere">ПРЕМЬЕРА</span>
        <h1>${safe(feature?.title||'Открой свою следующую историю')}</h1>
        <div class="feature-meta"><span>✦ ${feature?.vote_average?Number(feature.vote_average).toFixed(1):'—'}</span><span>18+</span><span>${safe(genres||feature?.meta||'ФИЛЬМЫ И СЕРИАЛЫ')}</span></div>
        <p>${safe(feature?.overview||'Новые истории, премьеры и любимые фильмы — в одной вселенной LUNO.')}</p>
        <div class="actions"><button class="primary" data-action="open-featured">▷ &nbsp; Смотреть</button><button class="hero-add" data-action="watch-featured" aria-label="Добавить в список">＋</button></div>
        <div class="hero-progress" aria-hidden="true"><span class="current"></span> ${Array.from({length:Math.min(10,Math.max(1,list.length))},(_,i)=>`<button class="hero-dot ${i===state.featureIndex % Math.max(1,list.length)?'current':''}" data-slide="${i}" aria-label="Слайд ${i+1}"></button>`).join('')}</div>
      </div>
    </section>
    ${shelfMarkup('Популярное сейчас',state.homeShelves.popular,'popular')}
    ${shelfMarkup('Топ 10 фильмов',state.homeShelves.topMovies,'topMovies')}
    ${shelfMarkup('Топ 10 сериалов',state.homeShelves.topShows,'topShows')}
    ${shelfMarkup('Для вас',state.homeShelves.forYou,'forYou')}
    ${shelfMarkup('Культовое кино',state.homeShelves.cult,'cult')}
    ${state.error?`<p class="quiet home-error">${safe(state.error)}</p>`:''}`;
  }
  function catalog(){return `<h1 class="page-title">Каталог</h1>${tabs(['Фильмы','Сериалы','Мультфильмы','Аниме'],state.catalogType,'type')}<div class="catalog-genre"><select id="catalog-genre" aria-label="Жанр"><option value="">Все жанры</option><option value="18">Драма</option><option value="35">Комедия</option><option value="28">Боевик</option><option value="27">Ужасы</option><option value="16">Анимация</option><option value="878">Фантастика</option></select></div><div class="controls catalog-controls"><div class="catalog-sort"><button class="filter" data-sort="По новизне">Популярное</button><button class="filter" data-sort="По рейтингу">В тренде</button></div><div class="poster-modes"><button class="filter mode-button ${state.posterMode==='portrait'?'selected':''}" data-poster-mode="portrait" aria-label="Вертикальные постеры">▯</button><button class="filter mode-button ${state.posterMode==='landscape'?'selected':''}" data-poster-mode="landscape" aria-label="Горизонтальные постеры">▭</button></div></div>${state.busy?'<p class="quiet">Загружаем каталог…</p>':''}<div class="grid">${cards(state.items)}</div>${state.error?`<p class="quiet">${safe(state.error)}</p>`:''}`; }
  function search(){return `<form id="search-form"><input class="searchbox" name="q" placeholder="Сериал, фильм или жанр" value="${safe(state.search)}" aria-label="Поиск фильмов и сериалов"></form><div class="grid">${state.busy?'<p class="quiet">Ищем…</p>':cards(state.items)}</div>${state.error?`<p class="quiet">${safe(state.error)}</p>`:''}`; }
  function watch(){
    const active=state.watchSection||'Избранное';
    const list=active==='История'?state.history:state.watchlist;
    const title=active==='История'?'История просмотров пока пуста':'Ваш список избранного пуст';
    const description=active==='История'?'Открывайте фильмы и сериалы — они появятся здесь, чтобы вы могли быстро к ним вернуться.':'Добавляйте любимые фильмы и сериалы в избранное, чтобы они всегда были под рукой.';
    return `<section class="watch-page"><h1 class="page-title">Я смотрю</h1><div class="tabs watch-tabs">${['Избранное','История'].map(v=>`<button class="tab-chip ${v===active?'selected':''}" data-watch-section="${v}">${v}</button>`).join('')}</div>
    ${list.length?'<div class="grid">'+cards(list)+'</div>':`<div class="empty watch-empty"><div class="empty-illustration" aria-hidden="true"><svg viewBox="0 0 240 180"><path d="M26 145h188M42 145V84h156v61M57 84V57h126v27M75 57V42h90v15M68 145v-42h25v42M146 145v-42h25v42M102 82v-18h36v18" fill="none" stroke="currentColor" stroke-width="2" opacity=".52"/><circle cx="120" cy="29" r="18" fill="currentColor" opacity=".9"/><circle cx="128" cy="23" r="17" fill="#0d0a14"/><path d="M31 155q28-15 56 0t56 0t66 0" fill="none" stroke="currentColor" stroke-width="2" opacity=".65"/><path d="m47 35 3 7 7 3-7 3-3 7-3-7-7-3 7-3zM196 48l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#B56BFF"/></svg></div><h2>${title}</h2><p>${description}</p><button class="primary" data-tab="catalog">Открыть каталог</button></div>`}</section>`;
  }
  function login(){return `<h1 class="page-title">Профиль</h1><section class="login-card"><div class="empty-mark">☾</div><h2>Твоя вселенная LUNO</h2><p class="quiet">Профиль и синхронизация будут подключены отдельно.</p></section>`; }
  function details(){const x=state.selected;if(!x)return '';const img=backdropOf(x);return `<section class="detail-page">${img?`<div class="detail-art" style="background-image:linear-gradient(0deg,#0d0a14 0%,#0d0a1444 100%),url('${safe(img)}')"></div>`:''}<h1>${safe(x.title)}</h1><p class="quiet">${safe([dateOf(x),x.vote_average?'★ '+Number(x.vote_average).toFixed(1):'',x.meta].filter(Boolean).join(' · '))}</p><p>${safe(x.overview||'Описание не предоставлено.')}</p><div class="actions"><button class="primary" data-action="find-stream">Найти источник</button><button class="secondary" data-action="add-selected">＋ В список</button></div><div id="stream-status" class="quiet">${safe(state.error||'Источник ещё не запрошен.')}</div></section>`; }
  function render(){document.body.classList.toggle('catalog-view',state.tab==='catalog');document.body.classList.toggle('poster-landscape',state.tab==='catalog'&&state.posterMode==='landscape');navItems.forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));screen.innerHTML=state.tab==='details'?details():({home,catalog,search,watch,login})[state.tab]();}
  function openItem(item){state.selected=item;state.history.unshift(item);state.tab='details';state.error='';render();}
  async function findStream(){
    const box=document.querySelector('#stream-status');if(box)box.textContent='Подключаем runtime и плагины источников…';
    try{
      if(!window.LunoLampa)throw new Error('Адаптер источников не найден.');
      const api=await window.LunoLampa.loadRuntime();
      await window.LunoLampa.loadPlugins();
      if(!api.Parser||typeof api.Parser.get!=='function')throw new Error('Runtime загружен, но API источника недоступен.');
      const item={...(state.selected||{}),id:state.selected?.id,source:'tmdb',method:state.selected?.media_type==='tv'?'tv':'movie'};
      api.Parser.get(item,data=>{
        const target=document.querySelector('#stream-status');
        if(target)target.textContent=data?'Источник ответил, но формат запуска плеера ещё не подтверждён.':'Источники не вернули ссылок. Проверь доступность плагина и настройки источника.';
      },err=>{const target=document.querySelector('#stream-status');if(target)target.textContent=String(err||'Источники не ответили.');});
      if(box)box.textContent='Запрос источников отправлен…';
    }catch(e){if(box)box.textContent=e?.message||'Не удалось загрузить источники.';}
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.dataset.tab){state.tab=t.dataset.tab;render();if(state.tab==='catalog')loadCatalog(state.catalogType);return;}
    if(t.dataset.slide!==undefined){state.featureIndex=Number(t.dataset.slide);render();return;}
    if(t.dataset.item!==undefined){const item=state.items[Number(t.dataset.item)];if(item)openItem(item);return;}
    if(t.dataset.watchSection){state.watchSection=t.dataset.watchSection;render();return;}
    if(t.dataset.type){state.catalogType=t.dataset.type;loadCatalog(state.catalogType);return;}
    if(t.dataset.posterMode){state.posterMode=t.dataset.posterMode;render();return;}
    if(t.dataset.sort){state.sort=t.dataset.sort;loadCatalog(state.catalogType);return;}
    if(t.dataset.action==='open-featured'){if(state.items[0])openItem(state.items[0]);else{state.tab='catalog';render();loadCatalog('Фильмы');}return;}
    if(t.dataset.action==='watch-featured'){if(state.items[0])state.watchlist.unshift(state.items[0]);state.tab='watch';render();return;}
    if(t.dataset.action==='add-selected'){if(state.selected&&!state.watchlist.some(x=>x.id===state.selected.id&&x.media_type===state.selected.media_type))state.watchlist.unshift(state.selected);state.tab='watch';render();return;}
    if(t.dataset.action==='find-stream')findStream();
  });
  document.addEventListener('change',e=>{if(e.target.id==='catalog-genre'){state.catalogGenre=e.target.value;loadCatalog(state.catalogType);}});
  document.addEventListener('submit',e=>{if(e.target.id!=='search-form')return;e.preventDefault();doSearch(new FormData(e.target).get('q')||'');});
  render();
  loadCatalog('Фильмы');
  loadHomeShelves();
  window.setInterval(()=>{if(state.tab==='home'){const count=Math.min(10,state.items.filter(x=>x&&(x.backdrop_path||x.poster_path)).length);if(count>1){state.featureIndex=(state.featureIndex+1)%count;render();}}},10000);
})();