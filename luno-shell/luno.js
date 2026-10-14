(() => {
  const screen = document.querySelector('#screen');
  const navItems = [...document.querySelectorAll('[data-tab]')];
  const state = {tab:'home', catalogType:'Фильмы', sort:'По новизне', search:'', items:[], selected:null, busy:false, error:'', watchlist:[]};
  const sample = [
    {title:'Чёрный клевер',tag:'ПРЕМЬЕРА',meta:'Анимация · Фэнтези',poster_path:null},
    {title:'Остров сокровищ',tag:'НОВЫЙ СЕЗОН',meta:'Приключения · Драма',poster_path:null},
    {title:'Школа медсестёр',tag:'СКОРО',meta:'Комедия · Драма',poster_path:null},
    {title:'Призраки',tag:'НОВЫЙ СЕЗОН',meta:'Комедия',poster_path:null}
  ];
  const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titleOf = x => x.title || x.name || x.original_title || x.original_name || 'Без названия';
  const imageOf = x => {
    const p = x.poster_path || x.poster || x.img || x.image;
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    return 'https://image.tmdb.org/t/p/w500' + (String(p).startsWith('/') ? p : '/' + p);
  };
  const normalize = data => {
    const candidates = Array.isArray(data) ? data : (data?.results || data?.items || data?.collection || data?.data || data?.list || []);
    return candidates.filter(x => x && typeof x === 'object').map(x => ({...x,title:titleOf(x),tag:x.tag || (x.vote_average ? '★ ' + Number(x.vote_average).toFixed(1) : 'LUNO'),meta:x.meta || [x.release_date || x.first_air_date || '', x.media_type || ''].filter(Boolean).join(' · ')}));
  };
  const poster = (item, i) => {
    const img = imageOf(item);
    const bg = img ? `background-image:linear-gradient(0deg,#0d0a14ee,transparent 68%),url("${safe(img)}")` : `background-image:linear-gradient(0deg,#0d0a14ee,transparent 68%),radial-gradient(circle at ${25+i*13}% ${20+i*9}%,${['#7b4b9a','#9a633d','#3d6681','#74436e'][i%4]} 0,transparent 60%),linear-gradient(145deg,#39234a,#15101c)`;
    return `<button class="poster" style="${bg}" data-item="${i}" aria-label="Открыть ${safe(item.title)}"><span class="poster-tag">${safe(item.tag || 'LUNO')}</span><strong>${safe(item.title)}</strong><span class="quiet">${safe(item.meta || '')}</span></button>`;
  };
  const head = title => `<div class="section-head"><h2>${title}</h2><button class="quiet" data-tab="catalog">Показать ещё ↗</button></div>`;
  const tabs = (items, active, key) => `<div class="tabs">${items.map(v=>`<button class="tab-chip ${v===active?'selected':''}" data-${key}="${safe(v)}">${safe(v)}</button>`).join('')}</div>`;
  const cards = list => list.length ? list.map(poster).join('') : '<p class="quiet">Пока нет данных. Проверь подключение к каталогу.</p>';
  async function loadCatalog(category) {
    if (!window.LunoLampa) return;
    state.busy = true; state.error = '';
    try {
      const result = await window.LunoLampa.catalog({category:category || '',page:1,sort_by:state.sort === 'По рейтингу' ? 'vote_average.desc' : 'release_date.desc'});
      const items = normalize(result);
      if (items.length) state.items = items;
      else if (!state.items.length) state.error = 'Движок каталога не вернул список фильмов.';
    } catch(e) { state.error = e?.message || 'Не удалось загрузить каталог.'; }
    finally { state.busy = false; render(); }
  }
  async function doSearch(q) {
    state.search = q; state.error = ''; render();
    if (!window.LunoLampa || !q.trim()) return;
    try {
      const items = normalize(await window.LunoLampa.search(q));
      state.items = items;
      state.error = items.length ? '' : 'Ничего не найдено.';
    } catch(e) { state.error = e?.message || 'Поиск сейчас недоступен.'; }
    render();
  }
  function home(){
    const list = state.items.length ? state.items.slice(0,12) : sample;
    return `<section class="hero"><span class="eyebrow">LUNO</span><h1>Твоя следующая история</h1><div class="meta">КИНО • СЕРИАЛЫ • 4K</div><p>Открой новую вселенную фильмов и сериалов. Всё, что хочется посмотреть, — в одном месте.</p><div class="actions"><button class="primary" data-action="open-featured">▷ &nbsp; Смотреть</button><button class="secondary" data-action="watch-featured" aria-label="Добавить в избранное">＋</button></div></section>${head('Новое в LUNO')}<div class="poster-row">${cards(list)}</div>${head('Популярное')}<div class="poster-row">${cards([...list].reverse())}</div>${state.error ? `<p class="quiet">${safe(state.error)}</p>` : ''}`;
  }
  function catalog(){const types=['Фильмы','Сериалы','DAZN','Коллекции','ТВ'];const list=state.items.length?state.items:sample;return `<h1 class="page-title">Каталог</h1>${tabs(types,state.catalogType,'type')}<div class="controls"><button class="filter" data-sort="По новизне">По новизне</button><button class="filter" data-sort="По рейтингу">По рейтингу</button></div>${state.busy?'<p class="quiet">Загружаем каталог…</p>':''}<div class="grid">${cards(list)}</div>${state.error?`<p class="quiet">${safe(state.error)}</p>`:''}`; }
  function search(){return `<form id="search-form"><input class="searchbox" name="q" placeholder="Сериал, фильм или жанр" value="${safe(state.search)}" aria-label="Поиск фильмов и сериалов"></form><h2>Результаты поиска</h2><div class="grid">${state.search?cards(state.items):'<p class="quiet">Введи название фильма или сериала.</p>'}</div>${state.error?`<p class="quiet">${safe(state.error)}</p>`:''}`; }
  function watch(){return `<h1 class="page-title">Я смотрю</h1>${state.watchlist.length?`<div class="grid">${cards(state.watchlist)}</div>`:`<div class="empty"><div class="empty-mark">☾</div><h2>Ваш список пока пуст</h2><p>Добавляйте любимые фильмы и сериалы в избранное, чтобы они всегда были под рукой.</p><button class="primary" data-tab="catalog">Открыть каталог</button></div>`}`; }
  function login(){return `<h1 class="page-title">Профиль</h1><section class="login-card"><div class="empty-mark">☾</div><h2>Твоя вселенная LUNO</h2><p class="quiet">Профиль и синхронизация будут подключены отдельно.</p></section>`; }
  function details(){const x=state.selected;if(!x)return '';const img=imageOf(x);return `<section class="detail-page">${img?`<div class="detail-art" style="background-image:linear-gradient(0deg,#0d0a14,#0d0a1433),url("${safe(img)}")"></div>`:''}<h1>${safe(x.title)}</h1><p class="quiet">${safe(x.meta || '')}</p><p>${safe(x.overview || x.description || 'Информация о фильме')}</p><div class="actions"><button class="primary" data-action="find-stream">Найти источник</button><button class="secondary" data-action="add-selected">＋ В список</button></div><div id="stream-status" class="quiet">${safe(state.error || 'Источник ещё не запрошен.')}</div></section>`; }
  function render(){navItems.forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));screen.innerHTML=state.tab==='details'?details():({home,catalog,search,watch,login})[state.tab]();}
  function openItem(item){state.selected=item;state.tab='details';state.error='';render();}
  async function findStream(){
    const box=document.querySelector('#stream-status'); if(box)box.textContent='Загружаем движок и плагины источников…';
    try {
      if(!window.LunoLampa) throw new Error('Адаптер LUNO не найден.');
      await window.LunoLampa.loadRuntime();
      await window.LunoLampa.loadPlugins();
      const api = await window.LunoLampa.loadRuntime();
      if (!api.Parser || typeof api.Parser.get !== 'function') throw new Error('Движок запущен, но интерфейс получения ссылок источника требует дополнительной интеграции.');
      const item=state.selected||{};
      api.Parser.get(item, (data) => {
        const target=document.querySelector('#stream-status');
        if(target) target.textContent = data ? 'Источник найден. Подключение к плееру требует завершения интеграции.' : 'Источники не вернули ссылок для этого фильма.';
      });
      if(box)box.textContent='Запрос источников отправлен. Ожидаем ответ…';
    } catch(e) { if(box)box.textContent=e?.message || 'Не удалось загрузить источники.'; }
  }
  document.addEventListener('click', async e=>{
    const t=e.target.closest('button');if(!t)return;
    if(t.dataset.tab){state.tab=t.dataset.tab;render();if(state.tab==='catalog'&&!state.items.length)loadCatalog(state.catalogType);return;}
    if(t.dataset.item!==undefined){const i=Number(t.dataset.item);const list=state.items.length?state.items:sample;openItem(list[i]);return;}
    if(t.dataset.type){state.catalogType=t.dataset.type;render();loadCatalog(state.catalogType);return;}
    if(t.dataset.sort){state.sort=t.dataset.sort;render();loadCatalog(state.catalogType);return;}
    if(t.dataset.action==='open-featured'){openItem((state.items.length?state.items:sample)[0]);return;}
    if(t.dataset.action==='watch-featured'){state.watchlist.push((state.items.length?state.items:sample)[0]);state.tab='watch';render();return;}
    if(t.dataset.action==='add-selected'){if(state.selected&&!state.watchlist.some(x=>x.id===state.selected.id&&x.title===state.selected.title))state.watchlist.push(state.selected);state.tab='watch';render();return;}
    if(t.dataset.action==='find-stream'){findStream();return;}
  });
  document.addEventListener('submit',e=>{if(e.target.id!=='search-form')return;e.preventDefault();doSearch(new FormData(e.target).get('q')||'');});
  render();
  // Initialize the headless runtime in the background; UI stays usable if it fails.
  if(window.LunoLampa) window.LunoLampa.loadRuntime().then(()=>window.LunoLampa.loadPlugins()).then(()=>loadCatalog('')).catch(err=>{state.error=err?.message||'Движок временно недоступен.';});
})();