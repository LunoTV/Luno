(() => {
  const screen = document.querySelector('#screen');
  const navItems = [...document.querySelectorAll('[data-tab]')];
  const TMDB_KEY = '4ef0d7355d9ffb5151e987764708ce96';
  const TMDB_API = 'https://api.themoviedb.org/3';
  const IMG = 'https://image.tmdb.org/t/p/';
  const readPreference = (key,fallback,allowed=[]) => { try { const value=localStorage.getItem(key); return value && (!allowed.length||allowed.includes(value)) ? value : fallback; } catch(_) { return fallback; } };
  const state = {tab:readPreference('luno-active-tab-v1','home',['home','catalog','search','watch','login']),catalogType:'Фильм',sort:'По новизне',posterMode:'landscape',catalogGenre:'',catalogPage:1,catalogHasMore:true,catalogLoadingMore:false,catalogGeneration:0,search:'',searchItems:[],items:[],selected:null,busy:false,error:'',watchlist:[],history:[],watchSection:readPreference('luno-watch-section-v1','История',['История','Избранное']),featureIndex:0,detailExtras:{cast:[],similar:[],collection:null,loading:false,tab:'Обзор'},browse:{title:'',items:[],page:1,person:null,collection:null,genre:null},franchises:[],franchisesLoading:false,franchisesError:'',homeShelves:{popular:[],topMovies:[],topShows:[],forYou:[],cult:[]}};
  const readSaved = key => { try { const value=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(value)?value:[]; } catch(_){ return []; } };
  const saveLibrary = () => { try { localStorage.setItem('luno-watchlist-v1',JSON.stringify(state.watchlist)); localStorage.setItem('luno-history-v1',JSON.stringify(state.history.slice(0,100))); } catch(_){} };
  state.watchlist=readSaved('luno-watchlist-v1');
  state.history=readSaved('luno-history-v1');
  const allItems = () => [...state.searchItems,...state.items,...state.homeShelves.popular,...state.homeShelves.topMovies,...state.homeShelves.topShows,...state.homeShelves.forYou,...state.homeShelves.cult,...state.watchlist,...state.history,...(state.browse?.items||[])];
  const itemKey = (x,i=0) => x?.id!=null ? String(x.media_type||((x.name||x.first_air_date)?'tv':'movie'))+':'+String(x.id) : String(x?._lunoId ?? i);
  const findItem = key => allItems().find((x,i)=>itemKey(x,i)===String(key)) || state.items[Number(key)];
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
  function mediaKind(item){
    const genres=item.genre_ids||[];
    if([10764,10767,10763,10766,10762].some(id=>genres.includes(id))||item.media_kind==='show')return 'ШОУ';
    if(genres.includes(16)&&item.original_language==='ja')return 'АНИМЕ';
    if(genres.includes(16))return 'МУЛЬТФИЛЬМ';
    return (item.media_type==='tv'||item.name||item.first_air_date)?'СЕРИАЛ':'ФИЛЬМ';
  }
  function poster(item,i=0) {
    const img=artworkOf(item,'portrait');
    const style=img?'':'background-image:radial-gradient(circle at 30% 20%,#7542b8,transparent 60%),linear-gradient(145deg,#39234a,#15101c)';
    const kind=mediaKind(item);
    const year=dateOf(item)||'—';
    const rating=item.vote_average?Number(item.vote_average).toFixed(1):'—';
    return `<button class="poster" style="${style}" data-item="${safe(itemKey(item,i))}" data-title="${safe(item.title||titleOf(item))}" aria-label="Открыть ${safe(item.title||titleOf(item))}"><span class="poster-art"><img class="poster-image" src="${safe(img)}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true" ${img?'':'hidden'}><span class="poster-kind">${kind}</span><span class="poster-rating">★ ${rating}</span><span class="poster-year">${safe(year)}</span><span class="poster-overlay"><strong class="poster-overlay-title">${safe(item.title||titleOf(item))}</strong><span class="poster-overlay-meta">★ ${rating} · ${safe(year)} · ${kind.toLowerCase()}</span><span class="poster-overview">${safe((item.overview||'').slice(0,170))}</span></span></span><strong class="poster-title">${safe(item.title||titleOf(item))}</strong></button>`;
  }
  const head=t=>`<div class="section-head"><h2>${t}</h2><button class="quiet" data-tab="catalog">Показать ещё ↗</button></div>`;
  const tabs=(items,active,key)=>`<div class="tabs">${items.map(v=>`<button class="tab-chip ${v===active?'selected':''}" data-${key}="${safe(v)}">${safe(v)}</button>`).join('')}</div>`;
  const cards=list=>list.length?list.map((x,i)=>poster(x,i)).join(''):'<p class="quiet">Ничего не найдено.</p>';
  async function loadCatalog(type=state.catalogType,append=false) {
    if(state.busy)return;
    if(!append){state.catalogGeneration++;state.catalogPage=1;state.catalogHasMore=true;state.items=[];}
    if(!state.catalogHasMore)return;
    const generation=state.catalogGeneration;
    state.busy=true;state.catalogLoadingMore=append;state.error='';if(!append)render();
    try {
      const ranked=state.sort==='По рейтингу'?'vote_average.desc':'popularity.desc';
      const base={sort_by:ranked,'vote_count.gte':type==='Аниме'?5:10};
      const withGenre=(extra={})=>({...base,...extra,...(state.catalogGenre?{with_genres:extra.with_genres?`${extra.with_genres},${state.catalogGenre}`:state.catalogGenre}:{})});
      const page=state.catalogPage;
      const pages=async(path,params)=>[await tmdb(path,{...params,page})];
      let results=[];
      if(type==='Фильм'||type==='Фильмы'){
        const batches=await pages('discover/movie',withGenre({without_genres:16}));
        results=batches.flatMap(normalize).map(x=>({...x,media_type:'movie'})).filter(x=>!(x.genre_ids||[]).includes(16));
      }else if(type==='Сериал'||type==='Сериалы'){
        const batches=await pages('discover/tv',withGenre({without_genres:16}));
        results=batches.flatMap(normalize).map(x=>({...x,media_type:'tv'})).filter(x=>!(x.genre_ids||[]).includes(16));
      }else if(type==='Мультфильм'||type==='Мультфильмы'){
        const [movies,shows]=await Promise.all([
          pages('discover/movie',withGenre({with_genres:16})),
          pages('discover/tv',withGenre({with_genres:16}))
        ]);
        results=[...movies.flatMap(normalize).map(x=>({...x,media_type:'movie'})),...shows.flatMap(normalize).map(x=>({...x,media_type:'tv'}))];
      }else if(type==='Шоу'){
        const batches=await pages('discover/tv',withGenre({with_genres:'10764|10767|10763'}));
        results=batches.flatMap(normalize).map(x=>({...x,media_type:'tv'}));
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
      if(generation!==state.catalogGeneration)return;
      const incoming=[...unique.values()].sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0)).map(x=>({...x,source:'tmdb'}));
      const seen=new Set(state.items.map(x=>(x.media_type||'movie')+':'+x.id));
      const fresh=incoming.filter(x=>!seen.has((x.media_type||'movie')+':'+x.id));
      const offset=state.items.length;
      state.items=append?[...state.items,...fresh].map((x,i)=>({...x,_lunoId:i})):fresh.map((x,i)=>({...x,_lunoId:i}));
      if(append&&fresh.length){const grid=document.querySelector('.grid');if(grid){const holder=document.createElement('div');holder.innerHTML=cards(fresh.map((x,i)=>({...x,_lunoId:offset+i})));while(holder.firstElementChild)grid.appendChild(holder.firstElementChild);}}
      const rawPages=type==='Мультфильмы'||type==='Мультфильм'||type==='Аниме'?2:1;
      state.catalogHasMore=page<500 && incoming.length>0;
      state.catalogPage=page+1;
      if(!state.items.length) state.error='Каталог вернул пустой список.';
    } catch(e){if(generation===state.catalogGeneration)state.error=e.message||'Не удалось загрузить каталог.';}
    finally{if(generation===state.catalogGeneration){state.busy=false;state.catalogLoadingMore=false;if(!append)render();else if(state.error){const grid=document.querySelector('.grid');if(grid){const note=document.createElement('p');note.className='quiet';note.textContent=state.error;grid.appendChild(note);}}}}
  }
  let searchTimer=0, searchGeneration=0;
  async function doSearch(query) {
    const keepFocus=document.activeElement?.id==='search-input';state.search=query;const q=String(query||'').trim();const generation=++searchGeneration;
    state.busy=!!q;state.error='';state.searchItems=[];render();if(keepFocus){const input=document.querySelector('#search-input');input?.focus({preventScroll:true});if(input&&input.setSelectionRange)input.setSelectionRange(input.value.length,input.value.length);}
    if(!q){state.busy=false;return;}
    try {
      let data=await tmdb('search/multi',{query:q,include_adult:false,page:1});
      if(generation!==searchGeneration)return;
      let results=normalize(data).filter(x=>x.media_type==='movie'||x.media_type==='tv');
      // Some TMDB responses or older cached runtimes omit media_type; retry the
      // dedicated endpoints so a valid movie/series query never disappears.
      if(!results.length){
        const [movies,shows]=await Promise.all([
          tmdb('search/movie',{query:q,include_adult:false,page:1}),
          tmdb('search/tv',{query:q,page:1})
        ]);
        if(generation!==searchGeneration)return;
        results=[
          ...normalize(movies).map(x=>({...x,media_type:'movie'})),
          ...normalize(shows).map(x=>({...x,media_type:'tv'}))
        ].sort((a,b)=>(b.popularity||0)-(a.popularity||0));
      }
      state.searchItems=results.map((x,i)=>({...x,_lunoId:'search-'+i,source:'tmdb'}));
      if(!state.searchItems.length)state.error='Ничего не найдено. Попробуй другое название или проверь написание.';
    } catch(e){if(generation===searchGeneration)state.error=e.message||'Поиск временно недоступен.';}
    finally{if(generation===searchGeneration){const keepFocus=document.activeElement?.id==='search-input';state.busy=false;render();if(keepFocus){const input=document.querySelector('#search-input');input?.focus({preventScroll:true});if(input&&input.setSelectionRange)input.setSelectionRange(input.value.length,input.value.length);}}}
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
    const heroSource=state.homeShelves.popular.length?state.homeShelves.popular:state.items;
    const list=heroSource.filter(x=>x && (x.backdrop_path || x.poster_path)).slice(0,10);
    const feature=list[state.featureIndex % Math.max(1,list.length)] || list[0];
    const shelf=feature?[...list.slice(state.featureIndex % Math.max(1,list.length)),...list.slice(0,state.featureIndex % Math.max(1,list.length))]:list;
    const bg=feature&&backdropOf(feature);
    const heroStyle=bg?`style="background-image:linear-gradient(180deg,rgba(10,9,12,.04) 0%,rgba(10,9,12,.04) 38%,rgba(10,9,12,.76) 68%,#101012 100%),url('${safe(bg)}')"`:'';
    const genres=(feature?.genre_ids||[]).map(id=>({16:'Анимация',35:'Комедия',28:'Боевик',14:'Фэнтези',18:'Драма',12:'Приключения',878:'Фантастика',53:'Триллер',80:'Криминал',10749:'Мелодрама',9648:'Детектив',27:'Ужасы',10751:'Семейный',99:'Документальный',10759:'Боевик',10765:'Фэнтези'}[id])).filter(Boolean).slice(0,4).join(', ');
    state.featuredItem=feature||null;
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
    ${state.history.length?shelfMarkup('Продолжить просмотр',state.history.slice(0,10),'history'):''}
    ${shelfMarkup('Популярное сейчас',state.homeShelves.popular,'popular')}
    ${shelfMarkup('Топ 10 фильмов',state.homeShelves.topMovies,'topMovies')}
    ${shelfMarkup('Топ 10 сериалов',state.homeShelves.topShows,'topShows')}
    ${shelfMarkup('Для вас',state.homeShelves.forYou,'forYou')}
    ${shelfMarkup('Культовое кино',state.homeShelves.cult,'cult')}
    ${state.error?`<p class="quiet home-error">${safe(state.error)}</p>`:''}`;
  }
  function catalog(){if(state.browse.title)return `<div class="browse-head"><button class="secondary" data-action="close-browse">‹ Назад</button><h1 class="page-title">${safe(state.browse.title)}</h1></div><div class="grid">${cards(state.browse.items)}</div>${state.browse.loading?'<p class="quiet">Загружаем…</p>':''}${state.browse.error?'<p class="quiet">'+safe(state.browse.error)+'</p>':''}`;;return `<h1 class="page-title">Каталог</h1>${tabs(['Фильм','Сериал','Мультфильм','Аниме','Шоу'],state.catalogType,'type')}<div class="catalog-genre"><select id="catalog-genre" aria-label="Жанр"><option value="">Все жанры</option><option value="18">Драма</option><option value="35">Комедия</option><option value="28">Боевик</option><option value="27">Ужасы</option><option value="16">Анимация</option><option value="878">Фантастика</option></select></div><div class="controls catalog-controls"><div class="catalog-sort"><button class="filter" data-sort="По новизне">Популярное</button><button class="filter" data-sort="По рейтингу">В тренде</button></div><div class="poster-modes"><button class="filter mode-button ${state.posterMode==='portrait'?'selected':''}" data-poster-mode="portrait" aria-label="Вертикальные постеры">▯</button><button class="filter mode-button ${state.posterMode==='landscape'?'selected':''}" data-poster-mode="landscape" aria-label="Горизонтальные постеры">▭</button></div></div>${state.busy&& !state.catalogLoadingMore?'<p class="quiet">Загружаем каталог…</p>':''}<div class="grid">${cards(state.items)}</div>${state.error?`<p class="quiet">${safe(state.error)}</p>`:''}${state.busy&&state.catalogLoadingMore?'<p class="quiet catalog-loading-more">Загружаем ещё…</p>':''}${!state.catalogHasMore&&state.items.length?'<p class="quiet catalog-end">Больше результатов нет.</p>':''}`; }
  function searchKind(x){return mediaKind(x).replace('МУЛЬТФИЛЬМ','Мультфильм').replace('АНИМЕ','Аниме').replace('СЕРИАЛ','Сериал').replace('ФИЛЬМ','Фильм').replace('ШОУ','Шоу');}
  function search(){const suggestions=['Человек-паук','Гарри Поттер','Аниме','Комедии'];const kinds=['Фильм','Сериал','Мультфильм','Аниме','Шоу'];const groups=kinds.map(kind=>({kind,items:state.searchItems.filter(x=>searchKind(x)===kind)})).filter(g=>g.items.length);return `<section class="search-page"><div class="search-heading"><span class="eyebrow">НАЙДИ СВОЮ ИСТОРИЮ</span><h1 class="page-title">Поиск</h1><p>Фильмы и сериалы — в одном месте</p></div><form id="search-form" class="search-form"><span class="search-symbol" aria-hidden="true">⌕</span><input class="searchbox" id="search-input" name="q" autocomplete="off" enterkeyhint="search" placeholder="Название фильма или сериала" value="${safe(state.search)}" aria-label="Поиск фильмов и сериалов">${state.search?'<button class="search-clear" type="button" data-action="clear-search" aria-label="Очистить поиск">×</button>':''}<button class="search-submit" type="submit" aria-label="Искать">Найти</button></form>${!state.search.trim()?'<section class="search-suggestions"><h2>Попробуй найти</h2><div class="search-chips">'+suggestions.map(x=>'<button class="search-chip" type="button" data-search-query="'+x+'">'+x+'</button>').join('')+'</div></section>':''}${state.busy?'<div class="search-status"><span class="search-spinner"></span><span>Ищем…</span></div>':''}${state.error?'<div class="search-empty"><span>⌕</span><h2>Ничего не нашлось</h2><p>${safe(state.error)}</p></div>':''}${state.searchItems.length?groups.map(g=>'<section class="search-category"><div class="search-category-head"><h2>'+g.kind+'</h2><span>'+g.items.length+'</span></div><div class="search-category-row">'+cards(g.items)+'</div></section>').join(''):''}</section>`; }
  function watch(){
    const active=state.watchSection||'Избранное';
    const list=active==='История'?state.history:state.watchlist;
    const title=active==='История'?'История просмотров пока пуста':'Ваш список избранного пуст';
    const description=active==='История'?'Открывайте фильмы и сериалы — они появятся здесь, чтобы вы могли быстро к ним вернуться.':'Добавляйте любимые фильмы и сериалы в избранное, чтобы они всегда были под рукой.';
    return `<section class="watch-page"><h1 class="page-title">Медиатека</h1><div class="tabs watch-tabs">${['История','Избранное'].map(v=>`<button class="tab-chip ${v===active?'selected':''}" data-watch-section="${v}">${v}</button>`).join('')}</div>
    ${list.length?'<div class="grid">'+cards(list)+'</div>':`<div class="empty watch-empty"><div class="empty-illustration" aria-hidden="true"><svg viewBox="0 0 240 180"><path d="M26 145h188M42 145V84h156v61M57 84V57h126v27M75 57V42h90v15M68 145v-42h25v42M146 145v-42h25v42M102 82v-18h36v18" fill="none" stroke="currentColor" stroke-width="2" opacity=".52"/><circle cx="120" cy="29" r="18" fill="currentColor" opacity=".9"/><circle cx="128" cy="23" r="17" fill="#0d0a14"/><path d="M31 155q28-15 56 0t56 0t66 0" fill="none" stroke="currentColor" stroke-width="2" opacity=".65"/><path d="m47 35 3 7 7 3-7 3-3 7-3-7-7-3 7-3zM196 48l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#B56BFF"/></svg></div><h2>${title}</h2><p>${description}</p><button class="primary" data-tab="catalog">Открыть каталог</button></div>`}</section>`;
  }
  function login(){return `<h1 class="page-title">Профиль</h1><section class="login-card"><div class="empty-mark">☾</div><h2>Твоя вселенная LUNO</h2><p class="quiet">Профиль и синхронизация будут подключены отдельно.</p></section>`; }
  function details(){
    const x=state.selected;if(!x)return '';
    const d=state.detailExtras||{cast:[],similar:[],collection:null,loading:false,tab:'Обзор'};
    const img=backdropOf(x),kind=x.media_type==='tv'||x.name?'Сериал':'Фильм';
    const year=dateOf(x)||'—',rating=x.vote_average?Number(x.vote_average).toFixed(1):'—';
    const genres=(x.genre_ids||[]).map(id=>({16:'Анимация',35:'Комедия',28:'Боевик',14:'Фэнтези',18:'Драма',12:'Приключения',878:'Фантастика',53:'Триллер',80:'Криминал',10749:'Мелодрама',9648:'Детектив',27:'Ужасы',10751:'Семейный',99:'Документальный',10759:'Боевик',10765:'Фэнтези'}[id])).filter(Boolean).slice(0,4);
    const inList=state.watchlist.some(v=>v.id===x.id&&v.media_type===x.media_type);
    const cast=d.cast||[];
    const actors=cast.length?'<section class="detail-section"><div class="detail-section-head"><h2>В главных ролях</h2><button data-action="all-cast">Весь состав ›</button></div><div class="actor-row">'+cast.slice(0,12).map(a=>`<button class="actor-card" data-person="${a.id}"><span class="actor-photo">${a.profile_path?`<img loading="lazy" src="${safe(IMG+'w185'+a.profile_path)}" alt="">`:'<span class="actor-placeholder">◯</span>'}</span><strong>${safe(a.name)}</strong><small>${safe(a.character||'')}</small></button>`).join('')+'</div></section>':'';
    const similar=d.similar?.length?'<section class="detail-section"><div class="detail-section-head"><h2>Похожие фильмы и сериалы</h2><button data-action="more-similar">Все ›</button></div><div class="poster-row detail-poster-row">'+cards(d.similar.slice(0,12))+'</div></section>':'';
    const collection=d.collection?'<section class="detail-section"><div class="detail-section-head"><h2>Франшиза</h2></div><button class="collection-feature" data-action="open-collection" style="background-image:linear-gradient(0deg,rgba(8,8,15,.88),rgba(8,8,15,.02)),url(\''+safe(d.collection.backdrop_path?IMG+'w780'+d.collection.backdrop_path:IMG+'w500'+d.collection.poster_path)+'\')"><strong>'+safe(d.collection.name)+'</strong><span>Смотреть коллекцию ›</span></button></section>':'';
    const shelves='';
    return `<section class="detail-page">
      <div class="detail-topbar"><button class="detail-back" data-action="detail-back" aria-label="Назад">‹</button></div>
      ${img?`<div class="detail-hero-art" style="background-image:linear-gradient(90deg,rgba(8,8,15,.68),rgba(8,8,15,.03)),linear-gradient(0deg,#080910 0%,transparent 75%),url('${safe(img)}')"></div>`:''}
      <div class="detail-main"><h1>${safe(x.title)}</h1><div class="detail-meta"><span>${safe(year)}</span><span>★ ${rating}</span><span>${kind}</span><span>16+</span></div>
      <div class="detail-genres">${genres.map(g=>'<span>'+safe(g)+'</span>').join('')}</div>

      <div class="detail-actions"><button class="primary detail-play" data-action="find-stream" aria-label="Смотреть"><span>▶</span><b>Смотреть</b></button><button class="detail-icon-action" data-action="add-selected" aria-label="Добавить в избранное"><span>${inList?'♥':'＋'}</span></button></div>
      <div id="stream-status" class="detail-stream-status">${safe(state.error||'')}</div></div>
      <div class="detail-tabs">${['Обзор','Актёры','Похожие'].map(v=>'<button class="'+(d.tab===v?'selected':'')+'" data-detail-tab="'+v+'">'+v+'</button>').join('')}</div>
      ${d.tab==='Актёры'?actors:d.tab==='Похожие'?similar:'<section class="detail-section detail-about"><h2>О '+(kind==='Сериал'?'сериале':'фильме')+'</h2><p>'+safe(x.overview||'Описание пока отсутствует.')+'</p><div class="detail-facts"><span>Год выпуска</span><b>'+safe(year)+'</b><span>Рейтинг TMDB</span><b>★ '+rating+'</b><span>Тип</span><b>'+kind+'</b></div></section>'+actors+collection+similar+shelves}
      ${d.loading?'<p class="quiet detail-loading">Загружаем актёров и рекомендации…</p>':''}
    </section>`;
  }
  async function loadDetailExtras(item){
    const generation=(state.detailGeneration||0)+1;state.detailGeneration=generation;
    state.detailExtras={cast:[],similar:[],collection:null,loading:true,tab:'Обзор'};render();
    const media=item.media_type==='tv'||item.name?'tv':'movie';
    const jobs=[
      tmdb(media+'/'+item.id+'/credits').catch(()=>({cast:[]})),
      tmdb(media+'/'+item.id+'/recommendations',{page:1}).catch(()=>({results:[]})),
      media==='movie'?tmdb('movie/'+item.id).catch(()=>({})):Promise.resolve({})
    ];
    const [credits,recs,full]=await Promise.all(jobs);
    if(generation!==state.detailGeneration||state.selected?.id!==item.id)return;
    state.detailExtras={cast:(credits.cast||[]).filter(a=>a.profile_path).slice(0,16),similar:normalize(recs).filter(v=>v.id!==item.id&&v.poster_path).slice(0,16).map((v,i)=>({...v,media_type:v.media_type||media,_lunoId:'similar-'+i})),collection:full.belongs_to_collection||null,loading:false,tab:state.detailExtras.tab||'Обзор'};
    render();
  }

  async function showBrowse(title,loader,meta={}){
    state.browse={title,items:[],page:1,loading:true,error:'',...meta};
    state.tab='catalog';render();
    try{
      const items=await loader();
      state.browse.items=(items||[]).filter(x=>x&&x.id).map((x,i)=>({...x,title:titleOf(x),media_type:x.media_type||((x.name||x.first_air_date)?'tv':'movie'),_lunoId:'browse-'+i,tag:x.vote_average?'★ '+Number(x.vote_average).toFixed(1):'LUNO',meta:[dateOf(x),x.media_type==='tv'||x.name?'Сериал':'Фильм'].filter(Boolean).join(' · ')}));
      if(!state.browse.items.length)state.browse.error='Пока нет доступных результатов.';
    }catch(e){state.browse.error=e.message||'Не удалось загрузить результаты.';}
    finally{state.browse.loading=false;render();}
  }
  async function openCollection(){
    const collection=state.detailExtras.collection;
    if(!collection?.id)return;
    await showBrowse(collection.name,async()=>{
      const d=await tmdb('collection/'+collection.id);
      return (d.parts||[]).sort((a,b)=>(a.release_date||'').localeCompare(b.release_date||'')).map(x=>({...x,media_type:'movie'}));
    },{collection:collection.id});
  }
  async function openPerson(personId){
    const person=(state.detailExtras.cast||[]).find(x=>String(x.id)===String(personId));
    if(!person)return;
    await showBrowse('Фильмография: '+person.name,async()=>{
      const d=await tmdb('person/'+personId+'/combined_credits');
      return (d.cast||[]).filter(x=>x.poster_path).sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0)).slice(0,40);
    },{person:personId});
  }
  async function openGenre(label){
    const ids={'Драма':18,'Комедия':35,'Боевик':28,'Ужасы':27,'Анимация':16,'Фантастика':878,'Фэнтези':14,'Детектив':964,'Триллер':53,'Популярное':null,'Похожие':null};
    const id=ids[label];
    if(label==='Похожие'){
      const list=state.detailExtras.similar||[];
      await showBrowse('Похожие истории',async()=>list);
      return;
    }
    await showBrowse(label==='Популярное'?'Популярное кино':label,async()=>{
      const d=await tmdb('discover/movie',{page:1,sort_by:'popularity.desc',...(id?{with_genres:id}:{})});
      return (d.results||[]).map(x=>({...x,media_type:'movie'}));
    },{genre:id||null});
  }

  const franchiseIds=[10,86311,1241,119,9485,328,556,8650,131292,2150,10194,87359,263,645,135416,173710,748,84,122917];
  async function loadFranchises(){if(state.franchisesLoading||state.franchises.length)return;state.franchisesLoading=true;state.franchisesError='';render();try{const results=await Promise.all([...new Set(franchiseIds)].map(async id=>{try{const d=await tmdb('collection/'+id);return d&&d.id&&d.parts&&d.parts.length?{...d,partsCount:d.parts.length}:null;}catch(_){return null;}}));state.franchises=results.filter(Boolean).sort((a,b)=>b.partsCount-a.partsCount);if(!state.franchises.length)state.franchisesError='Не удалось загрузить франшизы. Попробуй обновить страницу.';}catch(e){state.franchisesError=e.message||'Не удалось загрузить франшизы.';}finally{state.franchisesLoading=false;render();}}
  async function openFranchise(id){const franchise=state.franchises.find(x=>String(x.id)===String(id));if(!franchise)return;await showBrowse(franchise.name,async()=>{const d=await tmdb('collection/'+id);return(d.parts||[]).sort((a,b)=>(a.release_date||'').localeCompare(b.release_date||'')).map(x=>({...x,media_type:'movie'}));},{collection:Number(id)});}
  function render(){try{if(state.tab!=='details')localStorage.setItem('luno-active-tab-v1',state.tab);}catch(_){}document.body.classList.toggle('search-view',state.tab==='search');document.body.classList.toggle('catalog-view',state.tab==='catalog');document.body.classList.toggle('watch-view',state.tab==='watch');document.body.classList.toggle('poster-landscape',state.tab==='catalog'&&state.posterMode==='landscape');navItems.forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));screen.innerHTML=state.tab==='details'?details():({home,catalog,search,watch,login})[state.tab]();}
  function openItem(item){state.selected=item;try{localStorage.setItem('luno-active-tab-v1','details');}catch(_){}state.history=[item,...state.history.filter(x=>!(x.id===item.id&&x.media_type===item.media_type))].slice(0,100);saveLibrary();state.tab='details';state.error='';render();loadDetailExtras(item);}
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
    if(t.dataset.tab){state.tab=t.dataset.tab;try{localStorage.setItem('luno-active-tab-v1',state.tab);}catch(_){}render();if(state.tab==='catalog'){state.browse={title:'',items:[],page:1,person:null,collection:null,genre:null};loadCatalog(state.catalogType);}return;}
    if(t.dataset.slide!==undefined){state.featureIndex=Number(t.dataset.slide);render();return;}
    if(t.dataset.homeShelf){state.tab='catalog';state.catalogType=t.dataset.homeShelf==='topShows'?'Сериалы':(t.dataset.homeShelf==='history'?'Фильмы':'Фильмы');state.sort='По новизне';state.catalogGenre='';render();loadCatalog(state.catalogType);return;}
    if(t.dataset.item!==undefined){const item=findItem(t.dataset.item);if(item)openItem(item);return;}
    if(t.dataset.franchise){openFranchise(t.dataset.franchise);return;}
    if(t.dataset.watchSection){state.watchSection=t.dataset.watchSection;try{localStorage.setItem('luno-watch-section-v1',state.watchSection);localStorage.setItem('luno-active-tab-v1','watch');}catch(_){}state.tab='watch';render();return;}
    if(t.dataset.type){state.catalogType=t.dataset.type;loadCatalog(state.catalogType);return;}
    if(t.dataset.posterMode){state.posterMode=t.dataset.posterMode;render();return;}
    if(t.dataset.sort){state.sort=t.dataset.sort;loadCatalog(state.catalogType);return;}
    if(t.dataset.action==='load-more'){loadCatalog(state.catalogType,true);return;}
    if(t.dataset.action==='open-featured'){if(state.featuredItem)openItem(state.featuredItem);else{state.tab='catalog';render();loadCatalog('Фильмы');}return;}
    if(t.dataset.action==='watch-featured'){const item=state.featuredItem;if(item&&!state.watchlist.some(x=>x.id===item.id&&x.media_type===item.media_type))state.watchlist.unshift(item);saveLibrary();state.tab='watch';render();return;}
    if(t.dataset.action==='add-selected'){if(state.selected&&!state.watchlist.some(x=>x.id===state.selected.id&&x.media_type===state.selected.media_type))state.watchlist.unshift(state.selected);saveLibrary();state.tab='watch';render();return;}
    if(t.dataset.detailTab){state.detailExtras.tab=t.dataset.detailTab;render();return;}
    if(t.dataset.person){openPerson(t.dataset.person);return;}
    if(t.dataset.action==='detail-back'){state.tab='catalog';render();return;}
    if(t.dataset.action==='detail-more'){state.detailExtras.tab='Обзор';render();return;}
    if(t.dataset.action==='open-collection'){openCollection();return;}
    if(t.dataset.action==='all-cast'){state.detailExtras.tab='Актёры';render();return;}
    if(t.dataset.action==='close-browse'){state.browse={title:'',items:[],page:1,person:null,collection:null,genre:null};state.tab='details';render();return;}
    if(t.dataset.action==='more-similar'){state.detailExtras.tab='Похожие';render();return;}
    if(t.dataset.action==='open-genre'){openGenre(t.dataset.genre||'Популярное');return;}
    if(t.dataset.action==='clear-search'){state.search='';state.searchItems=[];state.error='';render();document.querySelector('#search-input')?.focus();return;}
    if(t.dataset.searchQuery){state.tab='search';doSearch(t.dataset.searchQuery);return;}
    if(t.dataset.action==='find-stream')findStream();
  });
  document.addEventListener('input',e=>{if(e.target.id==='search-input'){state.search=e.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>doSearch(e.target.value),350);}});
  document.addEventListener('change',e=>{if(e.target.id==='catalog-genre'){state.catalogGenre=e.target.value;loadCatalog(state.catalogType);}});
  let infiniteScrollQueued=false;
  window.addEventListener('scroll',()=>{if(infiniteScrollQueued||state.tab!=='catalog'||state.browse.title||state.busy||!state.catalogHasMore)return;const nearBottom=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-700;if(nearBottom){infiniteScrollQueued=true;loadCatalog(state.catalogType,true).finally(()=>{infiniteScrollQueued=false;});}},{passive:true});
  document.addEventListener('submit',e=>{if(e.target.id!=='search-form')return;e.preventDefault();doSearch(new FormData(e.target).get('q')||'');});
  let swipeStart=null;
  function swipeBack(){
    if(state.tab==='details'){
      if(state.browse.title){state.browse={title:'',items:[],page:1,person:null,collection:null,genre:null};state.tab='details';}
      else state.tab='catalog';
      render();return;
    }
    if(state.tab!=='home'){state.tab='home';state.browse={title:'',items:[],page:1,person:null,collection:null,genre:null};render();}
  }
  document.addEventListener('touchstart',e=>{if(e.touches.length===1)swipeStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  document.addEventListener('touchend',e=>{if(!swipeStart||e.changedTouches.length!==1)return;const dx=e.changedTouches[0].clientX-swipeStart.x;const dy=e.changedTouches[0].clientY-swipeStart.y;if(swipeStart.x<32&&dx>90&&Math.abs(dy)<70)swipeBack();swipeStart=null;},{passive:true});
  window.addEventListener('keydown',e=>{if(e.key==='Escape')swipeBack();});
  render();
  state.catalogType='Фильм';
  loadCatalog('Фильм');
  loadHomeShelves();
  window.setInterval(()=>{if(state.tab==='home'){const source=state.homeShelves.popular.length?state.homeShelves.popular:state.items;const count=Math.min(10,source.filter(x=>x&&(x.backdrop_path||x.poster_path)).length);if(count>1){state.featureIndex=(state.featureIndex+1)%count;render();}}},10000);
})();