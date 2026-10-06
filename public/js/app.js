(function(global){
  'use strict';

  const Core = global.LunoCore;
  const Adapter = global.LunoAdapter;
  const root = document.getElementById('app');
  const splash = document.getElementById('luno-splash');
  const motionKey = 'luno_motion';
  const applyMotion = () => root.querySelector('.luno-app')?.classList.toggle('motion-off', localStorage.getItem(motionKey)==='off');

  const fallbackCatalog = [
    {id:'movie-1',type:'movie',title:'Дюна: Часть вторая',year:'2024',rating:8.7,tag:'Фильм',description:'Пол Атрейдес объединяется с Чани и фременами, вступая на путь войны против заговорщиков.'},
    {id:'movie-2',type:'movie',title:'Оппенгеймер',year:'2023',rating:8.6,tag:'Фильм',description:'История физика, который возглавил проект по созданию первой атомной бомбы.'},
    {id:'movie-3',type:'movie',title:'Интерстеллар',year:'2014',rating:8.7,tag:'Фильм',description:'Команда исследователей отправляется через червоточину в поисках нового дома для человечества.'},
    {id:'movie-4',type:'movie',title:'Бегущий по лезвию 2049',year:'2017',rating:8.0,tag:'Фильм',description:'Офицер Кей раскрывает тайну, способную изменить отношения людей и репликантов.'},
    {id:'movie-5',type:'movie',title:'Начало',year:'2010',rating:8.8,tag:'Фильм',description:'Профессионал проникает в сны людей, но получает почти невозможное задание.'},
    {id:'movie-6',type:'movie',title:'Грань будущего',year:'2014',rating:7.9,tag:'Фильм',description:'Военный снова и снова переживает один и тот же день, пытаясь изменить исход битвы.'},
    {id:'series-1',type:'series',title:'Разделение',year:'2022',rating:8.7,tag:'Сериал',description:'Сотрудники корпорации проходят процедуру, разделяющую рабочие и личные воспоминания.'},
    {id:'series-2',type:'series',title:'Дом дракона',year:'2022',rating:8.3,tag:'Сериал',description:'История дома Таргариенов и борьбы за Железный трон.'},
    {id:'series-3',type:'series',title:'Андор',year:'2022',rating:8.4,tag:'Сериал',description:'Шпионский триллер о зарождении восстания против Империи.'},
    {id:'series-4',type:'series',title:'Очень странные дела',year:'2016',rating:8.6,tag:'Сериал',description:'Компания друзей сталкивается с тайнами маленького города и параллельного мира.'},
    {id:'anime-1',type:'anime',title:'Атака титанов',year:'2013',rating:9.1,tag:'Аниме',description:'Человечество пытается выжить за стенами, защищающими его от гигантских титанов.'},
    {id:'anime-2',type:'anime',title:'Монолог фармацевта',year:'2023',rating:8.9,tag:'Аниме',description:'Мэймэй расследует загадочные происшествия во дворце, используя знания о лекарствах.'}
  ];
  let catalog = fallbackCatalog.slice();
  const tmdbDataPath = './data/tmdb.json';
  const tmdbImage = 'https://image.tmdb.org/t/p/';
  const tmdbImageAlt = 'https://media.themoviedb.org/t/p/';
  const appScriptUrl = (() => {
    try {
      const script = Array.from(document.scripts).find(s => /\/js\/app\.js(?:\?|$)/.test(s.src));
      return script ? script.src : '';
    } catch (_) { return ''; }
  })();
  const appRootUrl = (() => {
    try { return appScriptUrl ? new URL('../', appScriptUrl).href : new URL('./', document.baseURI).href; }
    catch (_) { return './'; }
  })();
  const localPosterUrl = (kind,id) => {
    if (!id) return '';
    return appRootUrl + 'data/posters/' + kind + '-' + id + '.jpg';
  };
  const remotePosterUrl = (path,size='w500') => path ? tmdbImageAlt + size + path : '';
  const posterCandidates = item => {
    const kind = item.type === 'series' ? 'series' : 'movie';
    const list = [];
    if (item.tmdbId) list.push(localPosterUrl(kind,item.tmdbId));
    if (item.poster_path) {
      list.push(tmdbImageAlt + 'w500' + item.poster_path);
      list.push(tmdbImage + 'w500' + item.poster_path);
    }
    if (item.posterFallback) list.push(item.posterFallback);
    if (item.poster_url) list.push(item.poster_url);
    return [...new Set(list.filter(Boolean))];
  };
  const tmdbItem = (x,type) => ({
    id:'tmdb-'+type+'-'+x.id, tmdbId:x.id, type,
    title:type==='movie'?(x.title||x.original_title||'Без названия'):(x.name||x.original_name||'Без названия'),
    displayTitle:'',
    originalTitle:type==='movie'?(x.original_title||''):(x.original_name||''),
    year:String((type==='movie'?x.release_date:x.first_air_date)||'').slice(0,4)||'—',
    rating:Number(x.vote_average||0), popularity:Number(x.popularity||0), votes:Number(x.vote_count||0),
    genreIds:Array.isArray(x.genre_ids)?x.genre_ids:[], tag:type==='movie'?'Фильм':type==='series'?'Сериал':'Аниме',
    description:x.overview||'Описание отсутствует.',
    poster:x.poster_path ? remotePosterUrl(x.poster_path,'w500') : (x.poster_url || ''),
    posterFallback:x.poster_fallback_url || remotePosterUrl(x.poster_path,'w500') || x.poster_url || (x.backdrop_path?tmdbImageAlt+'w1280'+x.backdrop_path:''),
    poster_path:x.poster_path || '',
    poster_url:x.poster_url || '',
    backdrop:x.backdrop_path?tmdbImage+'w1280'+x.backdrop_path:'',
    backdropFallback:x.backdrop_path?tmdbImageAlt+'w1280'+x.backdrop_path:''
  });

  const runtimeItem = (x,type) => tmdbItem(Object.assign({},x,{
    poster_url:'',
    poster_local_url:'',
    poster_fallback_url:x.poster_path ? tmdbImageAlt+'w500'+x.poster_path : '',
  }),type);

  const translit = value => String(value||'')
    .toLowerCase()
    .replace(/ё/g,'е')
    .replace(/щ/g,'shh').replace(/ж/g,'zh').replace(/х/g,'kh').replace(/ц/g,'ts')
    .replace(/ч/g,'ch').replace(/ш/g,'sh').replace(/ю/g,'yu').replace(/я/g,'ya')
    .replace(/й/g,'y').replace(/ъ|ь/g,'').replace(/э/g,'e')
    .replace(/а/g,'a').replace(/б/g,'b').replace(/в/g,'v').replace(/г/g,'g')
    .replace(/д/g,'d').replace(/е/g,'e').replace(/з/g,'z').replace(/и/g,'i')
    .replace(/к/g,'k').replace(/л/g,'l').replace(/м/g,'m').replace(/н/g,'n')
    .replace(/о/g,'o').replace(/п/g,'p').replace(/р/g,'r').replace(/с/g,'s')
    .replace(/т/g,'t').replace(/у/g,'u').replace(/ф/g,'f').replace(/ы/g,'y')
    .replace(/в/g,'v').replace(/ /g,'').replace(/[^a-z0-9]+/g,'');

  const normalizeSearch = value => String(value||'')
    .toLowerCase()
    .replace(/ё/g,'е')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim();

  const searchKey = value => normalizeSearch(value).replace(/\s+/g,'');
  const catalogIndex = item => {
    const fields = [item.title,item.originalTitle,item.description||''];
    const plain = fields.map(normalizeSearch).join(' ');
    const transliterated = fields.map(translit).join(' ');
    return {plain,compact:searchKey(plain),transliterated};
  };
  const searchCatalog = (query, source=catalog) => {
    const q=normalizeSearch(query);
    if(q.length<2) return [];
    const qc=searchKey(q);
    const qt=translit(q);
    return source.map(item=>{
      const index=catalogIndex(item);
      let score=0;
      const title=normalizeSearch(item.title);
      const original=normalizeSearch(item.originalTitle);
      const titleCompact=searchKey(title);
      const originalCompact=searchKey(original);
      if(title===q) score+=1000;
      else if(original===q) score+=900;
      else if(titleCompact.includes(qc)) score+=700;
      else if(originalCompact.includes(qc)) score+=650;
      if(index.transliterated.includes(qt)) score+=600;
      if(index.plain.includes(q)) score+=250;
      if(normalizeSearch(item.description).includes(q)) score+=40;
      score += Math.min(60, Math.round((item.popularity||0)/10));
      score += Math.min(40, Math.round((item.rating||0)*3));
      return score?{item,score}:null;
    }).filter(Boolean).sort((a,b)=>b.score-a.score).map(x=>x.item);
  };
  const loadTMDB = async () => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), 6000) : null;
    try {
      const res=await fetch(tmdbDataPath,{cache:'no-store',signal:controller?.signal});
      if(!res.ok) return false;
      const data=await res.json();
      const next=[...(data.movies||[]).map(x=>tmdbItem(x,'movie')),...(data.series||[]).map(x=>tmdbItem(x,'series'))];
      if(next.length){ catalog=uniqueItems(next); return true; }
    } catch (_) {
      return false;
    } finally {
      if (timeout) clearTimeout(timeout);
    }
    return false;
  };

  const isRussianTitle = value => /[А-Яа-яЁё]/.test(String(value||''));
  const uiTitle = item => isRussianTitle(item.title) ? item.title : (isRussianTitle(item.originalTitle) ? item.originalTitle : '');
  const uniqueItems = items => {
    const seen = new Set();
    return (Array.isArray(items) ? items : []).filter(item => {
      const key = item.tmdbId ? (item.type + ':tmdb:' + item.tmdbId) : String(item.id || '');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const displayable = items => uniqueItems(items).filter(item => uiTitle(item));

  const byId = id => catalog.find(item => item.id === String(id));
  const historyKey = 'luno_history_v2';

  const readHistory = () => {
    try {
      const value = JSON.parse(localStorage.getItem(historyKey) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  };

  const writeHistory = list => {
    try { localStorage.setItem(historyKey, JSON.stringify(list.slice(0,24))); } catch (_) {}
  };

  const remember = item => {
    const list = readHistory().filter(x => x.id !== item.id);
    list.unshift({...item, openedAt: Date.now()});
    writeHistory(list);
  };

  const card = item => {
    const title=uiTitle(item);
    const letter=(title||item.title||'L').slice(0,1);
    const candidates = posterCandidates(item);
    const media = candidates.length
      ? '<img class="poster__image" data-poster-candidates="'+esc(JSON.stringify(candidates))+'" alt="" loading="lazy" decoding="async"><span class="poster__fallback" hidden><strong>'+esc(letter)+'</strong></span>'
      : '<span class="poster__fallback"><strong>'+esc(letter)+'</strong></span>';
    return '<button class="media-card" data-id="'+esc(item.id)+'" data-route="details:'+esc(item.type)+':'+esc(item.id)+'" tabindex="0">'+
      '<span class="poster poster--'+esc(item.type)+'">'+media+
      '<span class="poster__glow"></span><span class="poster__tag">'+esc(item.tag)+'</span>'+
      '<span class="poster__meta">'+esc(item.year)+' · ★ '+esc(Number(item.rating||0).toFixed(1))+'</span></span>'+
      (title?'<span class="media-card__title">'+esc(title)+'</span>':'')+
    '</button>';
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const section = (id,title,sub,items) =>
    '<section class="catalog-section" id="'+id+'">'+
      '<div class="section-head"><div><span class="section-kicker">LUNO</span><h2>'+title+'</h2><p>'+sub+'</p></div></div>'+
      '<div class="card-row" data-focus-container="'+id+'">'+items.map(card).join('')+'</div>'+
    '</section>';

  const shell = () => {
    const el = document.createElement('main');
    el.className = 'luno-app';
    el.innerHTML =
      '<header class="topbar" data-focus-container="topbar">'+
        '<button class="brand" data-route="home" data-focus-key="brand">LUNO</button>'+
        '<nav class="desktop-nav">'+
          navButton('home','Главная')+navButton('catalog','Каталог')+navButton('movie','Фильмы')+navButton('series','Сериалы')+navButton('stream','Поток')+navButton('history','История')+
        '</nav>'+
        '<div class="top-actions"><button data-action="search" aria-label="Поиск">⌕</button><button data-route="settings" aria-label="Настройки">⚙</button></div>'+
      '</header>'+
      '<div class="screen-host"></div>'+
      '<nav class="mobile-nav" data-focus-container="mobile-nav">'+
        navButton('home','⌂','Главная')+navButton('catalog','▦','Каталог')+navButton('movie','▣','Фильмы')+navButton('series','▤','Сериалы')+navButton('stream','≋','Поток')+navButton('history','◷','История')+
      '</nav>';
    return el;
  };

  const navButton = (route,label,sub) =>
    '<button class="nav-button" data-route="'+route+'">'+(sub?'<span>'+label+'</span><small>'+sub+'</small>':label)+'</button>';

  const ranked = (items, limit=12) => items.slice().sort((a,b)=>(b.popularity||0)-(a.popularity||0) || (b.rating||0)-(a.rating||0)).slice(0,limit);
  const topRated = (items, limit=12) => items.slice().sort((a,b)=>(b.rating||0)-(a.rating||0) || (b.votes||0)-(a.votes||0)).slice(0,limit);
  const newest = (items, limit=12) => items.slice().sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0) || (b.popularity||0)-(a.popularity||0)).slice(0,limit);

  const home = () => {
    const el = document.createElement('section');
    el.className = 'screen screen-home';
    const history = readHistory().map(x => byId(x.id)).filter(Boolean);
    const featured = ranked(displayable(Array.isArray(catalog) ? catalog : []),1)[0] || fallbackCatalog[0];
    const backdrop = featured.backdrop || featured.poster || '';
    const movies=catalog.filter(x=>x.type==='movie'), series=catalog.filter(x=>x.type==='series');
    el.innerHTML =
      '<section class="hero" data-focus-container="hero"'+(backdrop?' style="--hero-image:url('+esc(backdrop)+')"':'')+'>'+
        '<div class="hero-backdrop"></div><div class="hero-vignette"></div>'+
        '<div class="hero-copy">'+
          '<span class="eyebrow">LUNO · В ЦЕНТРЕ ВНИМАНИЯ</span><div class="hero-meta"><span>'+esc(featured.tag)+'</span><i>•</i><span>'+esc(featured.year)+'</span><i>•</i><span>★ '+esc(featured.rating.toFixed(1))+'</span></div>'+
          '<h1>'+esc(featured.title)+'</h1>'+
          '<p>'+esc(featured.description)+'</p>'+
          '<div class="hero-actions"><button class="primary" data-route="details:'+esc(featured.type)+':'+esc(featured.id)+'">Подробнее</button><button class="secondary" data-action="scroll">Открыть каталог</button></div>'+
        '</div>'+
      '</section>'+
      '<div class="home-quick" data-focus-container="quick"><button data-route="movie">Фильмы</button><button data-route="series">Сериалы</button><button data-route="stream">Поток</button><button data-action="search">Поиск</button></div>'+
      section('continue','Продолжить','Ваши последние открытия',history.length?displayable(history):ranked(displayable(catalog),8))+
      section('top10','Топ 10','Самые заметные фильмы и сериалы',topRated(displayable(catalog),10))+
      section('new','Новинки','Свежие релизы и новые открытия',newest(displayable(catalog),12))+
      section('trending','Сейчас в тренде','Популярное прямо сейчас',ranked(displayable(catalog),12))+
      section('movies','Фильмы','Большое кино на любой вечер',ranked(displayable(movies),12))+
      section('series','Сериалы','Истории на несколько вечеров',ranked(displayable(series),12))+
      section('for-you','Для вас','LUNO собирает подборку из того, что вы открывали',history.length?ranked(displayable(history.concat(catalog)),12):ranked(displayable(catalog),12));
    return el;
  };

  const genreNames = {
    28:'Боевик',12:'Приключения',16:'Мультфильм',35:'Комедия',80:'Криминал',99:'Документальный',
    18:'Драма',10751:'Семейный',14:'Фэнтези',36:'История',27:'Ужасы',10402:'Музыка',
    9648:'Детектив',10749:'Мелодрама',878:'Фантастика',10770:'Телефильм',53:'Триллер',10752:'Военный',
    37:'Вестерн',10759:'Боевик',10762:'Детский',10763:'Новости',10764:'Реалити',10765:'Фантастика и фэнтези',
    10766:'Мыльная опера',10767:'Ток-шоу',10768:'Война и политика'
  };
  const catalogSorters = {
    popular:(a,b)=>(b.popularity||0)-(a.popularity||0) || (b.rating||0)-(a.rating||0),
    rating:(a,b)=>(b.rating||0)-(a.rating||0) || (b.votes||0)-(a.votes||0),
    newest:(a,b)=>(Number(b.year)||0)-(Number(a.year)||0) || (b.popularity||0)-(a.popularity||0),
    oldest:(a,b)=>(Number(a.year)||9999)-(Number(b.year)||9999) || (b.rating||0)-(a.rating||0),
    title:(a,b)=>String(a.title||'').localeCompare(String(b.title||''),'ru')
  };
  const catalogScreen = route => {
    const baseItems = route==='movie'?catalog.filter(x=>x.type==='movie'):route==='series'?catalog.filter(x=>x.type==='series'):route==='history'?readHistory().map(x=>byId(x.id)).filter(Boolean):catalog.slice();
    const title = route==='movie'?'Фильмы':route==='series'?'Сериалы':route==='history'?'История':'Каталог';
    const el = baseScreen('CATALOG',title,route==='history'?'Недавно открытые позиции':'Большая библиотека LUNO');
    const body=el.querySelector('.screen-body');
    if(!baseItems.length){body.innerHTML='<div class="empty-state">Здесь пока пусто.</div>';return el;}

    const years=[...new Set(baseItems.map(x=>Number(x.year)).filter(y=>y>1900))].sort((a,b)=>b-a);
    const genres=[...new Set(baseItems.flatMap(x=>x.genreIds||[]).map(Number).filter(Boolean))]
      .sort((a,b)=>String(genreNames[a]||a).localeCompare(String(genreNames[b]||b),'ru'));

    body.innerHTML=
      '<div class="catalog-toolbar catalog-toolbar--filters">'+
        '<div class="catalog-title"><strong>'+esc(title)+'</strong><span data-count></span></div>'+
        '<div class="catalog-filters" data-focus-container="catalog-filters">'+
          (route==='history'?'':'<label><span>Тип</span><select data-filter="type"><option value="all">Все</option><option value="movie">Фильмы</option><option value="series">Сериалы</option></select></label>')+
          '<label><span>Жанр</span><select data-filter="genre"><option value="all">Все жанры</option>'+genres.map(id=>'<option value="'+id+'">'+esc(genreNames[id]||('Жанр '+id))+'</option>').join('')+'</select></label>'+
          '<label><span>Год</span><select data-filter="year"><option value="all">Все годы</option>'+years.map(y=>'<option value="'+y+'">'+y+'</option>').join('')+'</select></label>'+
          '<label><span>Рейтинг</span><select data-filter="rating"><option value="0">Любой</option><option value="7">7+</option><option value="8">8+</option><option value="9">9+</option></select></label>'+
          '<label><span>Сортировка</span><select data-filter="sort"><option value="popular">Популярные</option><option value="rating">По рейтингу</option><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option><option value="title">По названию</option></select></label>'+
        '</div>'+
      '</div>'+
      '<div class="screen-grid" data-catalog-grid data-focus-container="catalog"></div>';

    const grid=body.querySelector('[data-catalog-grid]');
    const count=body.querySelector('[data-count]');
    const filters=[...body.querySelectorAll('[data-filter]')];
    let shown=0,batch=30,filtered=[];

    const apply=()=>{
      const values=Object.fromEntries(filters.map(x=>[x.dataset.filter,x.value]));
      filtered=baseItems.filter(item=>{
        if(values.type && values.type!=='all' && item.type!==values.type) return false;
        if(values.genre!=='all' && !(item.genreIds||[]).map(Number).includes(Number(values.genre))) return false;
        if(values.year!=='all' && String(item.year)!==values.year) return false;
        if(Number(values.rating)>0 && Number(item.rating||0)<Number(values.rating)) return false;
        return true;
      }).slice().sort(catalogSorters[values.sort]||catalogSorters.popular);
      shown=0; grid.innerHTML=''; body.querySelector('[data-catalog-sentinel]')?.remove();
      count.textContent=filtered.length+' '+(filtered.length===1?'материал':'материалов');
      append();
    };
    const append=()=>{
      const next=filtered.slice(shown,shown+batch);
      if(!next.length){body.querySelector('[data-catalog-sentinel]')?.remove();return;}
      grid.insertAdjacentHTML('beforeend',next.map(card).join(''));
      shown+=next.length;
      if(shown<filtered.length) sentinel();
    };
    const sentinel=()=>{
      body.querySelector('[data-catalog-sentinel]')?.remove();
      const s=document.createElement('div');s.dataset.catalogSentinel='';s.className='stream-sentinel';body.appendChild(s);
      const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();s.remove();append();}},{rootMargin:'900px'});
      io.observe(s);
    };
    filters.forEach(filter=>filter.addEventListener('change',apply));
    apply();
    return el;
  };

  const streamScreen = () => {
    const el = baseScreen('STREAM','Поток','Бесконечная лента фильмов и сериалов');
    const body=el.querySelector('.screen-body');
    let shown=0;
    const batch=24;
    const items=catalog.slice();
    const append=()=>{
      const next=items.slice(shown,shown+batch);
      if(!next.length) return;
      const wrap=body.querySelector('[data-stream-grid]');
      wrap.insertAdjacentHTML('beforeend',next.map(card).join(''));
      shown+=next.length;
      if(shown<items.length) sentinel();
      else body.querySelector('[data-stream-end]')?.remove();
    };
    const sentinel=()=>{
      body.querySelector('[data-stream-sentinel]')?.remove();
      const s=document.createElement('div'); s.dataset.streamSentinel=''; s.className='stream-sentinel'; body.appendChild(s);
      const io=new IntersectionObserver(entries=>{if(entries.some(x=>x.isIntersecting)){io.disconnect();s.remove();append();}}, {rootMargin:'700px'});
      io.observe(s);
    };
    body.innerHTML='<div class="stream-toolbar"><strong>Все</strong><span>'+catalog.length+'+ материалов</span></div><div class="screen-grid" data-stream-grid data-focus-container="stream"></div>';
    append();
    return el;
  };

  const searchScreen = () => {
    const el = baseScreen('SEARCH','Поиск','LUNO ищет в локальном каталоге и через Lampa Runtime');
    el.querySelector('.screen-body').innerHTML =
      '<div class="search-box"><input data-search-input type="search" placeholder="Название…" autocomplete="off"><button data-action="clear-search">×</button></div>'+
      '<div class="screen-grid" data-focus-container="search-results"><div class="empty-state">Введите название.</div></div>';
    const input = el.querySelector('[data-search-input]');
    const results = el.querySelector('[data-focus-container="search-results"]');
    let requestId = 0;
    const render = async () => {
      const q = input.value.trim();
      const normalized = normalizeSearch(q);
      if(normalized.length < 2){
        results.innerHTML='<div class="empty-state">Введите минимум 2 символа.</div>';
        return;
      }
      const local = searchCatalog(q);
      results.innerHTML = local.length ? local.map(card).join('') : '<div class="empty-state">Поиск…</div>';
      const current = ++requestId;
      const runtime = window.LunoLampaRuntime;
      if(!runtime || !window.LunoRuntimeReady) return;
      try{
        const found = await runtime.search(q);
        if(current !== requestId || input.value.trim() !== q) return;
        const remote = [];
        for(const group of [found && found.movie, found && found.tv]){
          if(!group || !Array.isArray(group.results)) continue;
          const type = group.type === 'tv' ? 'series' : 'movie';
          group.results.forEach(item=>remote.push(runtimeItem(item,type)));
        }
        const merged = [...remote,...local];
        const seen = new Set();
        const unique = merged.filter(item=>{
          const key = item.type+':'+item.tmdbId;
          if(seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0,60);
        results.innerHTML = unique.length ? unique.map(card).join('') : '<div class="empty-state">Ничего не найдено.</div>';
      }catch(error){
        console.warn('[LUNO] headless search failed',error);
      }
    };
    input.addEventListener('input',render);
    el.querySelector('[data-action="clear-search"]').addEventListener('click',()=>{requestId++;input.value='';render();input.focus();});
    setTimeout(()=>input.focus(),0);
    return el;
  };

  const settingsScreen = () => {
    const el = baseScreen('SETTINGS','Настройки','Только то, что относится к оболочке LUNO');
    const reduced = localStorage.getItem('luno_motion')==='off';
    const hasTmdb = true;
    el.querySelector('.screen-body').innerHTML =
      '<div class="settings-grid" data-focus-container="settings">'+
        setting('interface','◌','Интерфейс',reduced?'Анимации выключены':'Анимации включены')+
        setting('history','⌫','История','Очистить локальную историю')+
        setting('tmdb','✦','TMDB','Каталог обновляется при деплое')+setting('about','L','О LUNO','Core '+esc(Core.version))+
      '</div><div class="settings-note" data-settings-note></div>';
    return el;
  };

  const setting = (id,icon,title,sub) => '<button class="setting" data-setting="'+id+'"><span>'+icon+'</span><strong>'+title+'</strong><small>'+sub+'</small></button>';

  const baseScreen = (kicker,title,sub) => {
    const el = document.createElement('section');
    el.className='screen';
    el.innerHTML='<header class="screen-head" data-focus-container="screen-head"><button class="back" data-action="back">‹</button><div><span class="eyebrow">LUNO / '+kicker+'</span><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div></header><div class="screen-body"></div>';
    return el;
  };

  const detailsScreen = (type,id) => {
    const item=byId(id);
    const el=baseScreen('DETAILS',item?item.title:'Карточка',item?[item.tag,item.year].join(' · '):'');
    if(!item){el.querySelector('.screen-body').innerHTML='<div class="empty-state">Карточка недоступна.</div>';return el;}
    remember(item);
    el.querySelector('.screen-body').innerHTML=
      '<div class="detail" data-focus-container="details">'+
        '<div class="detail-poster poster poster--'+esc(item.type)+'">'+(posterCandidates(item).length?'<img class="poster__image" data-poster-candidates="'+esc(JSON.stringify(posterCandidates(item)))+'" alt=""><span class="poster__fallback" hidden><strong>'+esc(item.title.slice(0,1))+'</strong></span>':'<span class="poster__fallback"><strong>'+esc(item.title.slice(0,1))+'</strong></span>')+'<span class="poster__glow"></span><small>'+esc(item.tag)+'</small></div>'+
        '<div class="detail-copy"><span class="rating">★ '+esc(item.rating.toFixed(1))+'</span><h2>'+esc(item.title)+'</h2><p>'+esc(item.description)+'</p><div class="detail-actions"><button class="primary" disabled>Смотреть</button><button class="secondary" data-action="back">Назад</button></div></div>'+
      '</div>';
    return el;
  };

  const wirePosters = rootNode => {
    if (!rootNode) return;
    rootNode.querySelectorAll('img[data-poster-candidates]').forEach(img => {
      let candidates = [];
      try { candidates = JSON.parse(img.dataset.posterCandidates || '[]'); } catch (_) {}
      let index = -1;
      const fallback = img.nextElementSibling;
      const showFallback = () => {
        img.style.display = 'none';
        if (fallback) fallback.style.display = 'flex';
      };
      const showImage = () => {
        img.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
      };
      const next = () => {
        index += 1;
        if (index >= candidates.length) {
          showFallback();
          return;
        }
        showImage();
        img.src = candidates[index];
      };
      img.addEventListener('load', showImage, {passive:true});
      img.addEventListener('error', next, {passive:true});
      next();
    });
  };

  const render = route => {
    const host=root.querySelector('.screen-host');
    if(!host)return;
    try {
      host.replaceChildren();
    let screen;
    if(route==='home') screen=home();
    else if(route==='search') screen=searchScreen();
    else if(route==='settings') screen=settingsScreen();
    else if(route==='catalog'||route==='movie'||route==='series'||route==='history') screen=catalogScreen(route);
    else if(route==='stream') screen=streamScreen();
    else if(route.startsWith('details:')) { const p=route.split(':'); screen=detailsScreen(p[1],p.slice(2).join(':')); }
    else screen=home();
      host.appendChild(screen);
      wirePosters(screen);
      applyMotion();
      updateNav(route);
      focusInitial(screen,route);
    } catch (error) {
      console.error('[LUNO] render failed', route, error);
      host.innerHTML='<section class="screen"><div class="empty-state"><strong>LUNO</strong><br>Не удалось отрисовать экран.</div></section>';
    }
  };

  const updateNav = route => {
    let active = route;
    if(route.startsWith('details:')) {
      const type = route.split(':')[1];
      active = type === 'series' ? 'series' : type === 'movie' ? 'movie' : '';
    }
    root.querySelectorAll('[data-route]').forEach(button=>{
      const target=button.dataset.route;
      button.classList.toggle('active',target===active);
    });
  };

  const focusInitial = (screen,route) => {
    const remembered=Core.focus.remembered(route);
    let target=remembered ? [...screen.querySelectorAll('[data-id]')].find(item=>item.dataset.id===remembered) : null;
    target=target||screen.querySelector('[data-search-input]')||screen.querySelector('.media-card')||screen.querySelector('.setting')||screen.querySelector('.primary')||screen.querySelector('.back');
    if(target) Core.focus.set(target,{scope:route,preventScroll:true});
  };

  const bootstrap=root.querySelector('.luno-bootstrap');
  let appShell=null;
  try {
    appShell=shell();
    root.appendChild(appShell);
  } catch (error) {
    console.error('[LUNO] shell failed', error);
    if (bootstrap) {
      bootstrap.querySelector('.empty-state').textContent='Не удалось запустить LUNO. Попробуйте обновить страницу.';
    }
    return;
  }
  if (bootstrap) bootstrap.remove();

  root.addEventListener('click',event=>{
    const route=event.target.closest('[data-route]')?.dataset.route;
    if(route){ Core.router.go(route); return; }
    if(event.target.closest('[data-action="search"]')){Core.router.go('search');return;}
    if(event.target.closest('[data-action="back"]')){Core.router.back();return;}
    if(event.target.closest('[data-action="scroll"]')){root.querySelector('.catalog-section')?.scrollIntoView({behavior:'smooth'});return;}
    const cardEl=event.target.closest('.media-card');
    if(cardEl){Core.focus.set(cardEl,{scope:Core.router.current()});Core.router.go(cardEl.dataset.route);return;}
    const settingEl=event.target.closest('[data-setting]');
    if(settingEl){
      const note=root.querySelector('.settings-note');
      if(settingEl.dataset.setting==='tmdb'){
        const note=root.querySelector('.settings-note');
        if(note) note.textContent='TMDB подключён через GitHub Actions. Токен хранится только в GitHub Secret.';
      } else if(settingEl.dataset.setting==='interface'){
        const off=localStorage.getItem('luno_motion')==='off';
        localStorage.setItem(motionKey,off?'on':'off');
        render('settings');
      } else if(settingEl.dataset.setting==='history'){
        localStorage.removeItem(historyKey);
        render('settings');
        const nextNote=root.querySelector('.settings-note');
        if(nextNote)nextNote.textContent='История очищена.';
      } else if(note) note.textContent='LUNO Core '+Core.version;
    }
  });

  Core.on('navigate',event=>render(event.route));
  Core.controller.bind('Home',()=>{Core.router.go('home');return true;});

  const hideSplash = () => {
    if(splash) {
      splash.classList.add('is-hidden');
      setTimeout(()=>splash.remove(),520);
    }
  };

  const boot = async () => {
    // First paint is deliberately independent from router, Core state and TMDB.
    // A broken persisted session must never leave the shell with an empty screen.
    try {
      render('home');
    } catch (error) {
      console.error('[LUNO] initial home render failed', error);
      const host=root.querySelector('.screen-host');
      if (host) host.innerHTML='<section class="screen"><div class="empty-state">LUNO: ошибка первого экрана.</div></section>';
    }
    hideSplash();

    try {
      const route = (Core && Core.router && typeof Core.router.current === 'function')
        ? (Core.router.current() || 'home')
        : 'home';
      if (route !== 'home') render(route);

      // TMDB must never block the initial LUNO UI.
      const loaded = await loadTMDB();
      if (loaded) {
        const nextRoute = (Core && Core.router && typeof Core.router.current === 'function')
          ? (Core.router.current() || 'home')
          : 'home';
        render(nextRoute);
      }
    } catch (error) {
      console.error('[LUNO] background boot failed', error);
      // Keep the already-rendered Home screen visible.
    }
  };

  boot();

  global.LunoUI={catalog,render};
})(window);
