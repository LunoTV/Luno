(() => {
  const screen = document.querySelector('#screen');
  const navItems = [...document.querySelectorAll('[data-tab]')];
  const TMDB_KEY = '4ef0d7355d9ffb5151e987764708ce96';
  const TMDB_API = 'https://api.themoviedb.org/3';
  const IMG = 'https://image.tmdb.org/t/p/';
  const state = {tab:'home',catalogType:'Фильмы',sort:'По новизне',search:'',items:[],selected:null,busy:false,error:'',watchlist:[],history:[]};
  const safe = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titleOf = x => x.title || x.name || x.original_title || x.original_name || 'Без названия';
  const imageOf = (x,size='w500') => x?.poster_path ? IMG+size+x.poster_path : (x?.poster?.startsWith?.('http') ? x.poster : '');
  const backdropOf = x => x?.backdrop_path ? IMG+'w1280'+x.backdrop_path : imageOf(x,'w780');
  const dateOf = x => (x.release_date || x.first_air_date || '').slice(0,4);
  const normalize = data => (Array.isArray(data)?data:(data?.results||[])).map(x=>({...x,title:titleOf(x),tag:x.vote_average?'★ '+Number(x.vote_average).toFixed(1):'LUNO',meta:[dateOf(x),x.media_type==='tv'||x.name?'Сериал':'Фильм'].filter(Boolean).join(' · ')}));
  async function tmdb(path,params={}) {
    const q=new URLSearchParams({api_key:TMDB_KEY,language:'ru-RU',...Object.fromEntries(Object.entries(params).map(([k,v])=>[k,String(v)]))});
    const response=await fetch(TMDB_API+'/'+path+'?'+q.toString());
    if(!response.ok) throw new Error('Каталог недоступен (TMDB '+response.status+').');
    return response.json();
  }
  function poster(item,i=0) {
    const img=imageOf(item);
    const style=img?'':'background-image:radial-gradient(circle at 30% 20%,#7542b8,transparent 60%),linear-gradient(145deg,#39234a,#15101c)';
    const artwork=img?`<img class="poster-image" src="${safe(img)}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true">`:'';
    return `<button class="poster" style="${style}" data-item="${safe(item._lunoId ?? i)}" aria-label="Открыть ${safe(item.title)}">${artwork}<span class="poster-tag">${safe(item.tag||'LUNO')}</span><strong>${safe(item.title)}</strong><span class="quiet">${safe(item.meta||'')}</span></button>`;
  }
  const head=t=>`<div class="section-head"><h2>${t}</h2><button class="quiet" data-tab="catalog">Показать ещё ↗</button></div>`;
  const tabs=(items,active,key)=>`<div class="tabs">${items.map(v=>`<button class="tab-chip ${v===active?'selected':''}" data-${key}="${safe(v)}">${safe(v)}</button>`).join('')}</div>`;
  const cards=list=>list.length?list.map((x,i)=>poster(x,i)).join(''):'<p class="quiet">Ничего не найдено.</p>';
  async function loadCatalog(type=state.catalogType) {
    state.busy=true;state.error='';render();
    try {
      const media=type==='Сериалы'?'tv':'movie';
      const endpoint=state.sort==='По рейтингу'?'trending/all/week':(type==='Коллекции'?'movie/top_rated':media+'/popular');
      const data=await tmdb(endpoint,{page:1});
      state.items=normalize(data).map((x,i)=>({...x,_lunoId:i,source:'tmdb'}));
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
  function home(){
    const list=state.items.slice(0,12);
    const feature=list[0];
    const bg=feature&&backdropOf(feature);
    const heroStyle=bg?`style="background-image:linear-gradient(180deg,rgba(10,9,12,.04) 0%,rgba(10,9,12,.04) 38%,rgba(10,9,12,.76) 68%,#101012 100%),url('${safe(bg)}')"`:'';
    const genres=(feature?.genre_ids||[]).map(id=>({16:'Анимация',35:'Комедия',28:'Боевик',14:'Фэнтези',18:'Драма',12:'Приключения',878:'Фантастика',53:'Триллер',80:'Криминал',10749:'Мелодрама',9648:'Детектив',27:'Ужасы',10751:'Семейный',99:'Документальный',10759:'Боевик',10765:'Фэнтези'}[id])).filter(Boolean).slice(0,4).join(', ');
    return `<section class="home-hero" ${heroStyle}>
      <div class="home-hero-content">
        <span class="premiere">ПРЕМЬЕРА</span>
        <h1>${safe(feature?.title||'Открой свою следующую историю')}</h1>
        <div class="feature-meta"><span>✦ ${feature?.vote_average?Number(feature.vote_average).toFixed(1):'—'}</span><span>18+</span><span>${safe(genres||feature?.meta||'ФИЛЬМЫ И СЕРИАЛЫ')}</span><span class="meta-chevron">⌄</span></div>
        <p>${safe(feature?.overview||'Новые истории, премьеры и любимые фильмы — в одной вселенной LUNO.')}</p>
        <div class="actions"><button class="primary" data-action="open-featured">▷ &nbsp; Смотреть</button><button class="hero-add" data-action="watch-featured" aria-label="Добавить в список">＋</button></div>
        <div class="hero-progress" aria-hidden="true"><span class="current"></span>${Array.from({length:9},()=>'<i></i>').join('')}</div>
      </div>
    </section>
    <section class="home-shelf">${head('Новое в Амедиатеке')}<div class="poster-row home-posters">${cards(list)}</div></section>
    <section class="home-shelf secondary-shelf">${head('Популярное сейчас')}<div class="poster-row">${cards(list.slice().reverse())}</div></section>
    ${state.error?`<p class="quiet home-error">${safe(state.error)}</p>`:''}`;
  }
  function catalog(){return `<h1 class="page-title">Каталог</h1>${tabs(['Фильмы','Сериалы','DAZN','Коллекции','ТВ'],state.catalogType,'type')}<div class="controls"><button class="filter" data-sort="По новизне">Популярное</button><button class="filter" data-sort="По рейтингу">В тренде</button></div>${state.busy?'<p class="quiet">Загружаем каталог…</p>':''}<div class="grid">${cards(state.items)}</div>${state.error?`<p class="quiet">${safe(state.error)}</p>`:''}`; }
  function search(){return `<form id="search-form"><input class="searchbox" name="q" placeholder="Сериал, фильм или жанр" value="${safe(state.search)}" aria-label="Поиск фильмов и сериалов"></form><div class="grid">${state.busy?'<p class="quiet">Ищем…</p>':cards(state.items)}</div>${state.error?`<p class="quiet">${safe(state.error)}</p>`:''}`; }
  function watch(){return `<h1 class="page-title">Я смотрю</h1>${state.watchlist.length?'<div class="grid">'+cards(state.watchlist)+'</div>':'<div class="empty"><div class="empty-mark">☾</div><h2>Ваш список пока пуст</h2><p>Добавляйте любимые фильмы и сериалы в избранное.</p><button class="primary" data-tab="catalog">Открыть каталог</button></div>'}${state.history.length?'<h2>Недавно открытые</h2><div class="grid">'+cards(state.history)+'</div>':''}`; }
  function login(){return `<h1 class="page-title">Профиль</h1><section class="login-card"><div class="empty-mark">☾</div><h2>Твоя вселенная LUNO</h2><p class="quiet">Профиль и синхронизация будут подключены отдельно.</p></section>`; }
  function details(){const x=state.selected;if(!x)return '';const img=backdropOf(x);return `<section class="detail-page">${img?`<div class="detail-art" style="background-image:linear-gradient(0deg,#0d0a14 0%,#0d0a1444 100%),url('${safe(img)}')"></div>`:''}<h1>${safe(x.title)}</h1><p class="quiet">${safe([dateOf(x),x.vote_average?'★ '+Number(x.vote_average).toFixed(1):'',x.meta].filter(Boolean).join(' · '))}</p><p>${safe(x.overview||'Описание не предоставлено.')}</p><div class="actions"><button class="primary" data-action="find-stream">Найти источник</button><button class="secondary" data-action="add-selected">＋ В список</button></div><div id="stream-status" class="quiet">${safe(state.error||'Источник ещё не запрошен.')}</div></section>`; }
  function render(){navItems.forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));screen.innerHTML=state.tab==='details'?details():({home,catalog,search,watch,login})[state.tab]();}
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
    if(t.dataset.item!==undefined){const item=state.items[Number(t.dataset.item)];if(item)openItem(item);return;}
    if(t.dataset.type){state.catalogType=t.dataset.type;loadCatalog(state.catalogType);return;}
    if(t.dataset.sort){state.sort=t.dataset.sort;loadCatalog(state.catalogType);return;}
    if(t.dataset.action==='open-featured'){if(state.items[0])openItem(state.items[0]);else{state.tab='catalog';render();loadCatalog('Фильмы');}return;}
    if(t.dataset.action==='watch-featured'){if(state.items[0])state.watchlist.unshift(state.items[0]);state.tab='watch';render();return;}
    if(t.dataset.action==='add-selected'){if(state.selected&&!state.watchlist.some(x=>x.id===state.selected.id&&x.media_type===state.selected.media_type))state.watchlist.unshift(state.selected);state.tab='watch';render();return;}
    if(t.dataset.action==='find-stream')findStream();
  });
  document.addEventListener('submit',e=>{if(e.target.id!=='search-form')return;e.preventDefault();doSearch(new FormData(e.target).get('q')||'');});
  render();
  loadCatalog('Фильмы');
})();