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
  const tmdbItem = (x,type) => ({
    id:'tmdb-'+type+'-'+x.id, tmdbId:x.id, type,
    title:type==='movie'?(x.title||x.original_title||'Без названия'):(x.name||x.original_name||'Без названия'),
    year:String((type==='movie'?x.release_date:x.first_air_date)||'').slice(0,4)||'—',
    rating:Number(x.vote_average||0), tag:type==='movie'?'Фильм':type==='series'?'Сериал':'Аниме',
    description:x.overview||'Описание отсутствует.',
    poster:x.poster_path?tmdbImage+'w500'+x.poster_path:'',
    backdrop:x.backdrop_path?tmdbImage+'w1280'+x.backdrop_path:''
  });
  const loadTMDB = async () => {
    try {
      const res=await fetch(tmdbDataPath,{cache:'no-store'});
      if(!res.ok) return false;
      const data=await res.json();
      const next=[...(data.movies||[]).slice(0,12).map(x=>tmdbItem(x,'movie')),...(data.series||[]).slice(0,12).map(x=>tmdbItem(x,'series'))];
      if(next.length){ catalog=next; return true; }
    } catch (_) {}
    return false;
  };

  const byId = id => catalog.find(item => item.id === String(id));
  const historyKey = 'luno_history_v2';

  const readHistory = () => {
    try { return JSON.parse(localStorage.getItem(historyKey) || '[]') || []; }
    catch (_) { return []; }
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
    const letter = item.title.slice(0,1);
    return '<button class="media-card" data-id="'+esc(item.id)+'" data-route="details:'+esc(item.type)+':'+esc(item.id)+'" tabindex="0">'+
      '<span class="poster poster--'+esc(item.type)+'"'+(item.poster?' style="background-image:url('+esc(item.poster)+')"':'')+'><span class="poster__glow"></span>'+(!item.poster?'<strong>'+esc(letter)+'</strong>':'')+'<small>'+esc(item.tag)+'</small></span>'+
      '<span class="media-card__title">'+esc(item.title)+'</span>'+
      '<span class="media-card__meta">'+esc(item.year)+' · ★ '+esc(item.rating.toFixed(1))+'</span>'+
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
          navButton('home','Главная')+navButton('movie','Фильмы')+navButton('series','Сериалы')+navButton('history','История')+
        '</nav>'+
        '<div class="top-actions"><button data-action="search" aria-label="Поиск">⌕</button><button data-route="settings" aria-label="Настройки">⚙</button></div>'+
      '</header>'+
      '<div class="screen-host"></div>'+
      '<nav class="mobile-nav" data-focus-container="mobile-nav">'+
        navButton('home','⌂','Главная')+navButton('movie','▣','Фильмы')+navButton('series','▤','Сериалы')+navButton('history','◷','История')+
      '</nav>';
    return el;
  };

  const navButton = (route,label,sub) =>
    '<button class="nav-button" data-route="'+route+'">'+(sub?'<span>'+label+'</span><small>'+sub+'</small>':label)+'</button>';

  const home = () => {
    const el = document.createElement('section');
    el.className = 'screen screen-home';
    const history = readHistory().map(x => byId(x.id)).filter(Boolean);
    el.innerHTML =
      '<section class="hero" data-focus-container="hero">'+
        '<div class="hero-orbit"></div><div class="hero-copy">'+
          '<span class="eyebrow">LUNO · MOONLIGHT</span><h1>Тишина экрана.<br><em>Сила истории.</em></h1>'+
          '<p>Единая оболочка для фильмов, сериалов и аниме. Быстрая навигация и управление с пульта без лишних экранов.</p>'+
          '<div class="hero-actions"><button class="primary" data-route="details:movie:movie-1">Подробнее</button><button class="secondary" data-action="scroll">Каталог</button></div>'+
        '</div><div class="hero-art"><div class="moon"></div><div class="planet"></div></div>'+
      '</section>'+
      section('continue','Продолжить','Ваши последние открытия',history.length?history:catalog.slice(0,5))+
      section('popular','Популярное','Подборка LUNO',catalog.slice(0,6))+
      section('series','Сериалы','Истории на несколько вечеров',catalog.filter(x=>x.type==='series'))+
      section('anime','Аниме','Яркие миры и персонажи',catalog.filter(x=>x.type==='anime'));
    return el;
  };

  const catalogScreen = route => {
    const items = route==='movie'?catalog.filter(x=>x.type==='movie'):route==='series'?catalog.filter(x=>x.type==='series'):readHistory().map(x=>byId(x.id)).filter(Boolean);
    const title = route==='movie'?'Фильмы':route==='series'?'Сериалы':'История';
    const el = baseScreen('CATALOG',title,route==='history'?'Недавно открытые позиции':'Выберите карточку');
    el.querySelector('.screen-body').innerHTML = '<div class="screen-grid" data-focus-container="catalog">'+(items.length?items.map(card).join(''):'<div class="empty-state">Здесь пока пусто.</div>')+'</div>';
    return el;
  };

  const searchScreen = () => {
    const el = baseScreen('SEARCH','Поиск','Найдите фильм, сериал или аниме');
    el.querySelector('.screen-body').innerHTML =
      '<div class="search-box"><input data-search-input type="search" placeholder="Название…" autocomplete="off"><button data-action="clear-search">×</button></div>'+
      '<div class="screen-grid" data-focus-container="search-results"><div class="empty-state">Введите название.</div></div>';
    const input = el.querySelector('[data-search-input]');
    const results = el.querySelector('[data-focus-container="search-results"]');
    const render = () => {
      const q = input.value.trim().toLowerCase();
      const items = q.length<2 ? [] : catalog.filter(x=>x.title.toLowerCase().includes(q));
      results.innerHTML = q.length<2 ? '<div class="empty-state">Введите минимум 2 символа.</div>' : items.length?items.map(card).join(''):'<div class="empty-state">Ничего не найдено.</div>';
    };
    input.addEventListener('input',render);
    el.querySelector('[data-action="clear-search"]').addEventListener('click',()=>{input.value='';render();input.focus();});
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
        '<div class="detail-poster poster poster--'+esc(item.type)+'"'+(item.poster?' style="background-image:url('+esc(item.poster)+')"':'')+'><span class="poster__glow"></span>'+(!item.poster?'<strong>'+esc(item.title.slice(0,1))+'</strong>':'')+'<small>'+esc(item.tag)+'</small></div>'+
        '<div class="detail-copy"><span class="rating">★ '+esc(item.rating.toFixed(1))+'</span><h2>'+esc(item.title)+'</h2><p>'+esc(item.description)+'</p><div class="detail-actions"><button class="primary" disabled>Смотреть</button><button class="secondary" data-action="back">Назад</button></div></div>'+
      '</div>';
    return el;
  };

  const render = route => {
    const host=root.querySelector('.screen-host');
    if(!host)return;
    host.replaceChildren();
    let screen;
    if(route==='home') screen=home();
    else if(route==='search') screen=searchScreen();
    else if(route==='settings') screen=settingsScreen();
    else if(route==='movie'||route==='series'||route==='history') screen=catalogScreen(route);
    else if(route.startsWith('details:')) { const p=route.split(':'); screen=detailsScreen(p[1],p.slice(2).join(':')); }
    else screen=home();
    host.appendChild(screen);
    applyMotion();
    updateNav(route);
    focusInitial(screen,route);
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

  root.appendChild(shell());

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

  const boot = async () => {
    await loadTMDB();
    render(Core.router.current() || 'home');
    if(splash) {
      splash.classList.add('is-hidden');
      setTimeout(()=>splash.remove(),520);
    }
  };
  setTimeout(boot,2500);

  global.LunoUI={catalog,render};
})(window);
