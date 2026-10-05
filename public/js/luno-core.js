(function(){
'use strict';
const KEY='luno_core_state_v3',read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}},save=p=>{try{localStorage.setItem(KEY,JSON.stringify({...read(),...p}))}catch{}};
let state=read(),current=state.route||'home',stack=Array.isArray(state.stack)?state.stack.filter(Boolean).slice(-20):[],focusMap=state.focusMap&&typeof state.focusMap==='object'?state.focusMap:{};
const validRoute=r=>r==='home'||r==='search'||r==='settings'||r==='movie'||r==='series'||r==='anime'||r==='history'||/^details:(movie|series|anime):.+/.test(String(r));
if(!validRoute(current))current='home';
stack=stack.filter(validRoute);
const visible=e=>!!e&&e.offsetParent!==null;
const focus=e=>{if(!e)return;e.focus({preventScroll:true});e.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});const key=e.closest('.luno-screen')?.dataset.route||e.dataset.nav||'home';focusMap[key]=e.dataset.id||e.dataset.nav||e.className;save({focusMap})};
function go(route,replace=false){if(!validRoute(route))route='home';if(route===current&&!replace)return;if(!replace)stack=[...stack.filter(x=>x!==route),current].filter(Boolean).slice(-20);current=route;save({route,stack});window.dispatchEvent(new CustomEvent('luno:navigate',{detail:{route,stack:[...stack]}}))}
function back(){while(stack.length&&!validRoute(stack[stack.length-1]))stack.pop();if(!stack.length){if(current!=='home'){current='home';save({route:'home',stack:[]});window.dispatchEvent(new CustomEvent('luno:navigate',{detail:{route:'home',stack:[]}}));return true}return false;}current=stack.pop()||'home';save({route:current,stack});window.dispatchEvent(new CustomEvent('luno:navigate',{detail:{route:current,stack:[...stack]}}));return true}
function closeOverlay(){const o=document.querySelector('.details-modal,.search-modal,.settings-modal);if(!o)return false;o.remove();return true}
function screenBack(el){if(window.LunoCore?.router?.back?.())return;routeTo('home')}
function detailsScreen(el,type,id){
 const list=catalogStore[type]||[],item=list.find(x=>String(x?.imdb_id||x?.tmdb_id||x?.mal_id||x?.id)===String(id))||historyItems().find(x=>String(x?.__historyId)===String(id));
 const s=document.createElement('main');s.className='luno-screen luno-detail-screen';s.dataset.route='details';
 if(!item){s.innerHTML='<header class="screen-head"><button class="screen-back" data-route-back>‹</button><div><div class="eyebrow">LUNO</div><h1>Карточка недоступна</h1><p>Элемент больше не найден в текущем каталоге.</p></div></header>';el.appendChild(s);s.querySelector('[data-route-back]').focus();return s}
 saveHistory(item,type);const image=poster(item),score=item?.imdbRating||item?.rating||item?.score,title=item.name||item.title||'Без названия';
 s.innerHTML='<header class="screen-head"><button class="screen-back" data-route-back>‹</button><div><div class="eyebrow">LUNO / DETAILS</div><h1>'+esc(title)+'</h1><p>'+esc([yearOf(item)||item.year,score?'★ '+scoreOf(score):'',cardTypeLabel(item,type)].filter(Boolean).join(' · '))+'</p></div></header><section class="detail-layout">'+(image?'<div class="detail-poster"><img src="'+esc(image)+'" alt=""></div>':'')+'<div class="detail-copy"><div class="eyebrow">'+esc(type.toUpperCase())+'</div><h2>'+esc(title)+'</h2><p>'+esc(item.description||item.synopsis||item.overview||'Описание отсутствует в источнике.')+'</p><div class="detail-actions"><button class="primary" disabled>▶ Смотреть</button><button class="secondary" data-route-back>‹ Назад</button></div></div></section>';
 el.appendChild(s);return s;
}
function searchScreen(el){
 const s=document.createElement('main');s.className='luno-screen luno-search-screen';s.dataset.route='search';
 s.innerHTML='<header class="screen-head"><button class="screen-back" data-route-back>‹</button><div><div class="eyebrow">LUNO / SEARCH</div><h1>Поиск</h1><p>Фильмы и сериалы из локального каталога.</p></div></header><div class="screen-searchbar"><input data-screen-search autofocus placeholder="Найти фильм или сериал"><span>⌕</span></div><div class="screen-grid" data-search-grid></div>';
 el.appendChild(s);const input=s.querySelector('[data-screen-search]');
 const run=()=>{const q=input.value.trim().toLowerCase(),items=q.length<2?[]:[...catalogStore.movie.map(x=>({...x,__type:'movie'})),...catalogStore.series.map(x=>({...x,__type:'series'}))].filter(x=>String(x.name||x.title||'').toLowerCase().includes(q)).slice(0,24);s.querySelector('[data-search-grid]').innerHTML=items.length?items.map(x=>cardMarkup(x,x.__type)).join(''):(q.length<2?'':'<div class="row-empty">Ничего не найдено.</div>');};
 input.addEventListener('input',run);return s;
}
function settingsScreen(el){
 const s=document.createElement('main');s.className='luno-screen luno-settings-screen';s.dataset.route='settings';
 s.innerHTML='<header class="screen-head"><button class="screen-back" data-route-back>‹</button><div><div class="eyebrow">LUNO / SETTINGS</div><h1>Настройки</h1><p>Настройте интерфейс LUNO под себя.</p></div></header><div class="settings-grid settings-grid--screen">'+
 '<button class="settings-tile" data-setting="profile"><span>◉</span><strong>Профиль</strong><small>Локальный профиль</small></button><button class="settings-tile" data-setting="interface"><span>◌</span><strong>Интерфейс</strong><small>Анимации и вид</small></button><button class="settings-tile" data-setting="catalog"><span>▤</span><strong>Каталог</strong><small>Фильмы, сериалы, аниме</small></button><button class="settings-tile" data-setting="player"><span>▶</span><strong>Плеер</strong><small>Не изменяем на этом этапе</small></button><button class="settings-tile settings-tile--wide" data-setting="other"><span>◒</span><strong>История и поведение</strong><small>Локальная история просмотров</small></button></div>';
 el.appendChild(s);return s;
}
function focusKey(e){
  if(!e)return '';
  const screen=e.closest('.luno-screen');
  if(screen)return screen.dataset.route||'screen';
  const section=e.closest('.content-section');
  if(section)return 'home:'+section.id;
  if(e.closest('.hero'))return 'home:hero';
  if(e.closest('.topbar'))return 'home:topbar';
  return 'home';
}
const focus=e=>{
  if(!e)return;
  e.focus({preventScroll:true});
  e.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});
  const key=focusKey(e),id=e.dataset.id||e.dataset.nav||e.dataset.setting||e.className;
  focusMap[key]=id;
  save({focusMap});
};
const visible=e=>!!e&&e.offsetParent!==null;
const focusIn=el=>{
  if(!el)return null;
  const key=focusKey(el),id=focusMap[key];
  if(id){
    const exact=el.querySelector('[data-id="'+CSS.escape(id)+'"]')||el.querySelector('[data-nav="'+CSS.escape(id)+'"]')||el.querySelector('[data-setting="'+CSS.escape(id)+'"]');
    if(exact&&visible(exact))return exact;
  }
  return el.querySelector('.media-card')||el.querySelector('button,input,[tabindex="0"]');
};
function spatial(container,active,dir){
  const items=[...container.querySelectorAll('button,input,[tabindex="0"]')].filter(visible);
  const r=active.getBoundingClientRect(),ax=r.left+r.width/2,ay=r.top+r.height/2;
  const candidates=items.filter(x=>x!==active).map(x=>{
    const b=x.getBoundingClientRect(),bx=b.left+b.width/2,by=b.top+b.height/2,dx=bx-ax,dy=by-ay;
    if(dir==='up'&&dy>=-1)return null;if(dir==='down'&&dy<=1)return null;
    if(dir==='left'&&dx>=-1)return null;if(dir==='right'&&dx<=1)return null;
    const primary=(dir==='left'||dir==='right')?Math.abs(dx):Math.abs(dy);
    const secondary=(dir==='left'||dir==='right')?Math.abs(dy):Math.abs(dx);
    return {x,score:primary*10+secondary};
  }).filter(Boolean).sort((a,b)=>a.score-b.score);
  return candidates[0]?.x||null;
}
function homeNavMove(active,k){
  const nav=[...document.querySelectorAll('.home .topbar button')].filter(visible);
  if(!nav.includes(active))return null;
  if(k==='ArrowRight'||k==='ArrowLeft'){
    const i=nav.indexOf(active),n=i+(k==='ArrowRight'?1:-1);
    return nav[n]||active;
  }
  return null;
}
function homeMove(active,k){
  const navTarget=homeNavMove(active,k);
  if(navTarget&&navTarget!==active)return navTarget;

  if(active.closest('.topbar')){
    if(k==='ArrowDown') return document.querySelector('.hero .primary,.hero .secondary,.content-section .media-card');
    return null;
  }
  if(active.closest('.hero')){
    if(k==='ArrowUp')return document.querySelector('.topbar .brand');
    if(k==='ArrowDown'){
      const section=active.closest('.home')?.querySelector('.content-section');
      return section?focusIn(section):null;
    }
    return spatial(active.closest('.hero'),active,k.slice(5).toLowerCase());
  }
  const section=active.closest('.content-section');
  if(section){
    const row=active.closest('.media-row');
    if(row&&(k==='ArrowLeft'||k==='ArrowRight')){
      const cards=[...row.querySelectorAll('.media-card')].filter(visible),i=cards.indexOf(active),n=i+(k==='ArrowRight'?1:-1);
      return cards[n]||null;
    }
    if(k==='ArrowUp'||k==='ArrowDown'){
      const sections=[...document.querySelectorAll('.home .content-section')].filter(s=>s.offsetParent!==null&&s.querySelector('.media-card'));
      const i=sections.indexOf(section),target=sections[i+(k==='ArrowDown'?1:-1)];
      if(target)return focusIn(target);
      if(k==='ArrowUp')return document.querySelector('.hero .primary,.hero .secondary');
    }
  }
  return null;
}
function screenMove(active,k){
  const screen=active.closest('.luno-screen'); if(!screen)return null;
  if(k==='ArrowUp'&&active.matches('input[data-screen-search]'))return screen.querySelector('.screen-back');
  if(k==='ArrowDown'&&active.matches('input[data-screen-search]'))return screen.querySelector('.media-card');
  const grid=active.closest('.screen-grid,.settings-grid');
  if(grid)return spatial(grid,active,k.slice(5).toLowerCase());
  if(k==='ArrowDown'&&active.matches('.screen-back'))return screen.querySelector('.media-card,[data-screen-search],[data-setting]');
  return null;
}
function keydown(e){
  if(document.documentElement.dataset.device!=='tv')return;
  const k=e.key,a=document.activeElement;
  if(k==='Home'){e.preventDefault();const b=document.querySelector('.home .topbar .brand');if(b){focus(b);document.querySelector('.home')?.scrollTo({top:0,behavior:'auto'});}return}
  if(k==='Escape'||k==='Backspace'){
    if(closeOverlay()||back()){e.preventDefault();return}
  }
  if(!a)return;
  if(k==='Enter'&&a.matches('button')){e.preventDefault();a.click();return}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k))return;
  let target=null;
  if(a.closest('.luno-screen'))target=screenMove(a,k);
  else if(a.closest('.home'))target=homeMove(a,k);
  if(target&&visible(target)){focus(target);e.preventDefault();}
}
window.LunoCore={state:read,focus,router:{go,back,current:()=>current,focusFor:route=>focusMap[route]||''},controller:{keydown}};window.addEventListener('keydown',keydown,true);
})();