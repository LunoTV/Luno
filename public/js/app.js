const app=document.getElementById('app');
const home=()=>{const el=document.createElement('main');el.className='home';el.innerHTML='<header class="topbar"><div class="brand">LUNO</div><nav class="nav"><button class="active">Главная</button><button>Фильмы</button><button>Сериалы</button><button>Аниме</button></nav><button class="search" aria-label="Поиск">⌕</button></header><section class="hero"><div class="hero__moon" aria-hidden="true"></div><div class="hero__content"><div class="eyebrow">LUNO / CINEMA</div><h1>Ночь начинается<br>с хорошего кино.</h1><p>Пространство LUNO для фильмов и сериалов. Собственный интерфейс, собственный опыт просмотра.</p><div class="actions"><button class="primary">Начать просмотр</button><button class="secondary">Подробнее</button></div></div></section><section class="sections"><div class="section empty"><div class="section__head"><h2>Продолжить просмотр</h2><span>История появится после первого просмотра</span></div><div class="empty__state">Здесь будут ваши фильмы и сериалы</div></div><div class="section empty"><div class="section__head"><h2>Подборки LUNO</h2><span>Реальные данные подключим следующим этапом</span></div><div class="empty__state">Подборки появятся после подключения источника контента</div></div></section><nav class="mobile-nav"><button class="active">⌂<br>Главная</button><button>◌<br>Фильмы</button><button>◯<br>Сериалы</button><button>⌕<br>Поиск</button></nav></main>';return el};
const splash=document.createElement('main');splash.className='splash';splash.innerHTML='<div class="splash__veil" aria-hidden="true"></div><section class="content" aria-label="LUNO"><div class="brand"><div class="logo">LUNO</div><p class="tagline">ТВОЙ МИР. ТВОЙ ЭКРАН.</p></div><div class="loader" aria-label="Запуск LUNO"><div class="loader__track"><div class="loader__bar"></div></div><div class="loader__meta"><span class="loader__status">Загрузка приложения…</span><span>100%</span></div></div></section></main>';
app.replaceChildren(splash);
setTimeout(()=>{const next=home();next.style.opacity='0';app.replaceChildren(next);requestAnimationFrame(()=>{next.style.transition='opacity .7s ease';next.style.opacity='1'})},5600);

(function(){
  const updateTvScale=()=>{
    const w=window.innerWidth||document.documentElement.clientWidth;
    const h=window.innerHeight||document.documentElement.clientHeight;
    const ua=navigator.userAgent||'';
    const tvUA=/(smart-tv|smarttv|hbbtv|web0s|webos|tizen|netcast|viera|bravia|googletv|aftb|aftm|android tv|androidtv|tv;)/i.test(ua);
    const tvViewport=w>=800&&h>=450&&w/h>=1.45;
    const isTv=tvUA||tvViewport;
    const physicalW=Math.max(w,screen.width||w)*(window.devicePixelRatio||1);
    const physicalH=Math.max(h,screen.height||h)*(window.devicePixelRatio||1);
    const scale=isTv?Math.min(1920/Math.max(w,1),1080/Math.max(h,1)):1;
    const safe=Math.max(1,Math.min(2.5,scale));
    document.documentElement.style.setProperty('--tv-scale',safe.toFixed(3));
    document.documentElement.dataset.device=isTv?'tv':'other';
  };
  updateTvScale();
  window.addEventListener('resize',updateTvScale,{passive:true});
  window.addEventListener('orientationchange',updateTvScale,{passive:true});
})();
