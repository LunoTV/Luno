import tmdbCatalog from "./tmdb-catalog.generated.js";
import Hls from "hls.js";
import dashjs from "dashjs";
import {
  loadMetaDetails,
  loadLunoPlayer,
  getReadyMetaStreams,
  getPlayerStreamUrl,
  unloadLunoPlayer,
  dispatchLunoPlayerAction,
} from "./source-engine.js";
import {renderSourceManager,bindSourceManager} from "./ui/source-manager.js";
const continueCards=document.querySelector("#continueCards");
const movieCards=document.querySelector("#movieCards");
const openCinemaCards=document.querySelector("#openCinemaCards");
const seriesCards=document.querySelector("#seriesCards");
const searchPanel=document.querySelector("#searchPanel");
const searchInput=document.querySelector("#searchInput");
const searchBox=document.querySelector(".search-box");
const player=document.querySelector("#player");
const lunoVideo=document.querySelector("#lunoVideo");
const playerEmpty=document.querySelector("#playerEmpty");
const playerMessage=document.querySelector("#playerMessage");
const playerBarTitle=document.querySelector("#playerBarTitle");
const playerBarMeta=document.querySelector("#playerBarMeta");
const playerSourceButton=document.querySelector("#playerSourceButton");
const playerQualityButton=document.querySelector("#playerQualityButton");
const playerEpisodeButton=document.querySelector("#playerEpisodeButton");
const playerVoiceButton=document.querySelector("#playerVoiceButton");
const playerSubtitleButton=document.querySelector("#playerSubtitleButton");
const episodeSheet=document.querySelector("#episodeSheet");
const episodeList=document.querySelector("#episodeList");
const closeEpisodeSheet=document.querySelector("#closeEpisodeSheet");
const voiceSheet=document.querySelector("#voiceSheet");
const voiceList=document.querySelector("#voiceList");
const closeVoiceSheet=document.querySelector("#closeVoiceSheet");
const qualitySheet=document.querySelector("#qualitySheet");
const qualityList=document.querySelector("#qualityList");
const closeQualitySheet=document.querySelector("#closeQualitySheet");
const subtitleSheet=document.querySelector("#subtitleSheet");
const subtitleList=document.querySelector("#subtitleList");
const closeSubtitleSheet=document.querySelector("#closeSubtitleSheet");
const sourceSheet=document.querySelector("#sourceSheet");
const sourceList=document.querySelector("#sourceList");
const sourceEmpty=document.querySelector("#sourceEmpty");
const closeSourceSheet=document.querySelector("#closeSourceSheet");
const detail=document.querySelector("#detail");
const detailPoster=document.querySelector("#detailPoster");
const detailTitle=document.querySelector("#detailTitle");
const detailMeta=document.querySelector("#detailMeta");
const detailDescription=document.querySelector("#detailDescription");
const detailBadges=document.querySelector("#detailBadges");
const detailRatings=document.querySelector("#detailRatings");
const detailPlay=document.querySelector("#detailPlay");
const detailEpisodes=document.querySelector("#detailEpisodes");
const continueSection=document.querySelector("#continueSection");
const moviesSection=document.querySelector("#moviesSection");
const seriesSection=document.querySelector("#seriesSection");
const trendingCards=document.querySelector("#trendingCards");
const newCards=document.querySelector("#newCards");
const topCards=document.querySelector("#topCards");
const genreGrid=document.querySelector("#genreGrid");
const favoritesSection=document.querySelector("#favoritesSection");
const favoriteCards=document.querySelector("#favoriteCards");
const favoritesEmpty=document.querySelector("#favoritesEmpty");
const detailBackdrop=document.querySelector("#detailBackdrop");
const detailFavorite=document.querySelector("#detailFavorite");
const heroBackdrop=document.querySelector("#heroBackdrop");
const heroPoster=document.querySelector("#heroPoster");
const heroTitle=document.querySelector("#heroTitle");
const heroDescription=document.querySelector("#heroDescription");
const heroMeta=document.querySelector("#heroMeta");
const heroDots=document.querySelector("#heroDots");
const closeSearch=document.querySelector("#closeSearch");
const libraryView=document.querySelector("#libraryView");
const libraryContent=document.querySelector("#libraryContent");
const libraryTitle=document.querySelector("#libraryTitle");
const libraryKicker=document.querySelector("#libraryKicker");
const libraryBack=document.querySelector("#libraryBack");
const librarySearch=document.querySelector("#librarySearch");
const splash=document.querySelector("#splash");
const splashStatus=document.querySelector("#splashStatus");
const splashProgress=document.querySelector("#splashProgress");
const confirmDialog=document.querySelector("#confirmDialog");
const dialogTitle=document.querySelector("#dialogTitle");
const dialogMessage=document.querySelector("#dialogMessage");
const dialogCancel=document.querySelector("#dialogCancel");
const dialogConfirm=document.querySelector("#dialogConfirm");
const addonManager=document.querySelector("#addonManager");
const addonUrlInput=document.querySelector("#addonUrlInput");
const installAddonButton=document.querySelector("#installAddonButton");
const addonManagerStatus=document.querySelector("#addonManagerStatus");
const addonList=document.querySelector("#addonList");
const openAddonManager=document.querySelector("#openAddonManager");
const openAddonManagerTop=document.querySelector("#openAddonManagerTop");
const openAddonManagerFromPlayer=document.querySelector("#openAddonManagerFromPlayer");
const openCinemaSources=document.querySelector("#openCinemaSources");
const closeAddonManager=document.querySelector("#closeAddonManager");

let currentItem=null;
let catalogItems=[];
let movieItems=[];
let openCinemaItems=[];
let seriesItems=[];
let animationItems=[];
let cartoonItems=[];
let animeItems=[];
let showItems=[];
let detailReturnLibrary="";
let movieVisible=18;
let seriesVisible=18;
let catalogLoading=false;
let resumeItems=[];
let favoriteItems=[];
let heroItem=null;
let splashDone=false;
let dialogAction=null;
let playerStreams=[];
let playerStreamState=null;
let playerResolving=false;
let lastCoreTime=-1;

function setSplashProgress(value,status){
  if(splashProgress) splashProgress.style.width=Math.max(0,Math.min(100,value))+"%";
  if(splashStatus && status) splashStatus.textContent=status;
}
function finishSplash(){
  if(splashDone) return;
  splashDone=true;
  setSplashProgress(100,"Готово");
  window.setTimeout(()=>splash?.classList.add("is-hidden"),260);
}

// Never leave the UI permanently behind the splash screen if a source request hangs.
// The application remains usable and playback can initialize when the source engine is ready.
const splashSafetyTimer=window.setTimeout(()=>{
  if(!splashDone){
    console.warn("LUNO splash safety timeout");
    setSplashProgress(100,"LUNO готов");
    finishSplash();
  }
},8000);
function showDialog(title,message,confirmText="Выйти",action=null){
  if(!confirmDialog) return;
  dialogAction=action;
  dialogTitle.textContent=title;
  dialogMessage.textContent=message;
  dialogConfirm.textContent=confirmText;
  confirmDialog.classList.remove("hidden");
  dialogCancel.focus();
}
function closeDialog(){
  confirmDialog?.classList.add("hidden");
  dialogAction=null;
}
dialogCancel?.addEventListener("click",closeDialog);
dialogConfirm?.addEventListener("click",()=>{
  const action=dialogAction;
  closeDialog();
  if(action) action();
});
confirmDialog?.addEventListener("click",(event)=>{
  if(event.target===confirmDialog) closeDialog();
});

function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g,(char)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function mediaCategory(item){
  const ids=new Set((item?.genreIds||[]).map(Number));
  const genres=(item?.genres||[]).map(x=>String(x).toLocaleLowerCase("ru-RU"));
  const animated=ids.has(16) || genres.includes("анимация");
  const japanese=item?.originalLanguage==="ja" || (item?.originCountry||[]).includes("JP");
  const show=ids.has(10764)||ids.has(10767)||ids.has(10763)||ids.has(10766) ||
    genres.some(x=>["реалити-шоу","ток-шоу","новости","мыльная опера"].includes(x));
  if(animated && japanese) return "anime";
  if(animated) return "cartoons";
  if(item?.type==="series" && show) return "shows";
  if(item?.type==="series") return "series";
  return "movies";
}
function categoryLabel(item){
  return ({movies:"Фильм",series:"Сериал",cartoons:"Мультфильм",anime:"Аниме",shows:"Шоу"})[mediaCategory(item)] || "Контент";
}
function metaLine(item){
  const year=String(item?.releaseInfo || "").match(/\d{4}/)?.[0] || "";
  return [year,categoryLabel(item)].filter(Boolean).join(" • ");
}

function normalizeItem(item){
  return {
    ...item,
    id:item?.id || (item?.tmdbId ? "tmdb:"+item.tmdbId : ""),
    tmdbId:Number(item?.tmdbId)||0,
    type:item?.type==="tv" ? "series" : (item?.type || "movie"),
    name:item?.name || item?.originalName || "Без названия",
    poster:item?.poster || "",
    background:item?.background || "",
    releaseInfo:item?.releaseInfo || "",
    description:item?.description || "",
    rating:Number(item?.rating)||0,
    genreIds:Array.isArray(item?.genreIds) ? item.genreIds.map(Number).filter(Boolean) : [],
    genres:Array.isArray(item?.genres)?item.genres:[],
    originalLanguage:item?.originalLanguage || "",
    originCountry:Array.isArray(item?.originCountry)?item.originCountry:[],
    openCinema:Boolean(item?.openCinema),
    imdbId:item?.imdbId || (Number(item?.tmdbId)===10378 ? "tt1254207" : "")
  };
}

function card(item){
  const title=item?.name || "Без названия";
  const image=item?.poster || item?.background || "";
  const fallbackImage=item?.posterSource || item?.background || "";
  const rating=Number(item?.rating)>0 ? "★ "+Number(item.rating).toFixed(1) : "";
  const meta=[metaLine(item),rating].filter(Boolean).join(" • ");
  const imageHtml=image
    ? '<img src="'+escapeHtml(image)+'" data-fallback="'+escapeHtml(fallbackImage)+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">'
    : '<span class="poster-fallback">◐</span>';
  return '<button class="card" data-id="'+escapeHtml(item?.id||"")+'" data-type="'+escapeHtml(item?.type||"movie")+'" data-title="'+escapeHtml(title)+'" aria-label="'+escapeHtml(title)+'">'+
    '<div class="card-art">'+imageHtml+'</div>'+
    '<div class="card-title">'+escapeHtml(title)+'</div>'+
    '<div class="card-meta">'+escapeHtml(meta)+'</div>'+
  '</button>';
}

function bindCards(){
  document.querySelectorAll(".card").forEach((c)=>{
    const image=c.querySelector(".card-art img");
    if(image && !image.dataset.fallbackBound){
      image.dataset.fallbackBound="1";
      image.addEventListener("error",()=>{
        const fallback=image.dataset.fallback || "";
        if(fallback && image.src!==fallback){
          image.src=fallback;
        }else{
          image.remove();
          c.querySelector(".card-art")?.insertAdjacentHTML("afterbegin",'<span class="poster-fallback">◐</span>');
        }
      },{once:false});
    }
    c.onclick=()=>{
      const item=window.__LUNO_ITEMS__?.get(c.dataset.id);
      if(item) openDetail(item);
    };
  });
}

function paintDetail(value){
  const title=value?.name || "Без названия";
  const image=value?.poster || value?.background || "";
  const year=String(value?.releaseInfo || "").match(/\d{4}/)?.[0] || "";
  const score=Number(value?.rating)||0;
  const type=categoryLabel(value);
  const genres=Array.isArray(value?.genres) ? value.genres : [];
  const genreMap={
    28:"Боевик",12:"Приключения",16:"Мультфильм",35:"Комедия",80:"Криминал",
    99:"Документальный",18:"Драма",10751:"Семейный",14:"Фэнтези",36:"История",
    27:"Ужасы",10402:"Музыка",9648:"Детектив",10749:"Мелодрама",878:"Фантастика",
    10770:"ТВ",53:"Триллер",10752:"Военный",37:"Вестерн",10759:"Боевик",10762:"Детский",
    10763:"Новости",10764:"Реалити",10765:"Фантастика",10766:"Мыльная опера",
    10767:"Ток-шоу",10768:"Война"
  };
  const genreNames=genres.map(g=>genreMap[g]||g).filter(Boolean).slice(0,4);

  if(detailPoster){
    const detailImage=value?.background || value?.poster || "";
    detailPoster.style.backgroundImage=detailImage ? 'url("'+String(detailImage).replace(/"/g,"&quot;")+'")' : "";
    detailPoster.classList.toggle("has-image",!!detailImage);
  }
  if(detailTitle) detailTitle.textContent=title;
  detailEpisodes?.classList.toggle("hidden", value?.type!=="series");
  if(detailMeta) detailMeta.textContent=[
    year,
    type,
    value?.runtime ? value.runtime+" мин" : ""
  ].filter(Boolean).join(" • ");

  if(detailBadges){
    detailBadges.innerHTML=[
      year ? '<span class="detail-badge">'+escapeHtml(year)+'</span>' : "",
      '<span class="detail-badge">'+escapeHtml(type)+'</span>',
      score>0 ? '<span class="detail-badge detail-badge-score">★ '+score.toFixed(1)+'</span>' : "",
      ...genreNames.slice(0,2).map(g=>'<span class="detail-badge detail-badge-muted">'+escapeHtml(g)+'</span>')
    ].filter(Boolean).join("");
  }

  if(detailDescription) detailDescription.textContent=value?.description || "Описание пока недоступно.";

  if(detailRatings){
    detailRatings.innerHTML=score>0
      ? '<div class="detail-rating-main"><strong>★ '+score.toFixed(1)+'</strong><span>Рейтинг</span></div>'+
        '<div class="detail-rating"><strong>'+escapeHtml(year||"—")+'</strong><span>год</span></div>'+
        '<div class="detail-rating"><strong>'+escapeHtml(type)+'</strong><span>формат</span></div>'+
        '<div class="detail-rating"><strong>'+escapeHtml(String(genreNames[0]||"—"))+'</strong><span>жанр</span></div>'
      : '<div class="detail-rating-main"><strong>—</strong><span>Рейтинг</span></div>'+
        '<div class="detail-rating"><strong>'+escapeHtml(year||"—")+'</strong><span>год</span></div>'+
        '<div class="detail-rating"><strong>'+escapeHtml(type)+'</strong><span>формат</span></div>';
  }
}
function isFavorite(id){
  return loadFavorites().some(item=>item.id===id);
}

function loadHistory(){
  try{
    const value=JSON.parse(localStorage.getItem("luno-history")||"[]");
    return Array.isArray(value) ? value.filter(x=>x?.id) : [];
  }catch{return []}
}
function saveHistoryItem(item){
  if(!item?.id) return;
  const list=loadHistory().filter(x=>x.id!==item.id);
  list.unshift({...item,updatedAt:Date.now()});
  try{localStorage.setItem("luno-history",JSON.stringify(list.slice(0,50)));}catch{}
}

function loadFavorites(){
  try{
    const value=JSON.parse(localStorage.getItem("luno-favorites")||"[]");
    return Array.isArray(value) ? value.filter(x=>x?.id) : [];
  }catch{return []}
}

function saveFavorites(items){
  try{localStorage.setItem("luno-favorites",JSON.stringify(items.slice(0,100)));}catch{}
}

function toggleFavorite(item){
  if(!item?.id) return;
  const list=loadFavorites();
  const exists=list.some(x=>x.id===item.id);
  const next=exists ? list.filter(x=>x.id!==item.id) : [{...item,updatedAt:Date.now()},...list];
  saveFavorites(next);
  renderFavorites();
  paintFavoriteButton(item);
}

function paintFavoriteButton(item){
  if(!detailFavorite) return;
  const active=isFavorite(item?.id);
  detailFavorite.textContent=active ? "♥ В избранном" : "♡ В избранное";
  detailFavorite.classList.toggle("is-favorite",active);
}

function renderFavorites(){
  favoriteItems=loadFavorites();
  if(!favoriteCards || !favoritesEmpty) return;
  favoriteCards.innerHTML=favoriteItems.map(card).join("");
  favoritesEmpty.style.display=favoriteItems.length ? "none" : "flex";
  bindCards();
}

function setLunoHistory(view){
  try{history.pushState({luno:view},"",view==="home" ? location.pathname+location.search : "#"+view);}catch{}
}
function ensureLunoHistory(){
  try{
    if(!history.state?.luno) history.replaceState({luno:"home"},"",location.pathname+location.search);
  }catch{}
}
function openDetail(item){
  if(!item) return;
  detailReturnLibrary=libraryView && !libraryView.classList.contains("hidden") ? libraryType : "";
  if(detailReturnLibrary) closeLibrary(true);
  setLunoHistory("detail");
  currentItem=item;
  saveHistoryItem(item);
  paintDetail(item);
  if(detailBackdrop) detailBackdrop.style.backgroundImage=item?.background ? 'url("'+String(item.background).replace(/"/g,"&quot;")+'")' : "";
  paintFavoriteButton(item);
  detail?.classList.remove("hidden");
  document.body.classList.add("detail-open");
  detailPlay?.focus();
}

function closeDetail(fromHistory=false){
  if(!fromHistory && history.state?.luno==="detail"){
    try{ history.back(); }catch{}
    return;
  }
  detail?.classList.add("hidden");
  document.body.classList.remove("detail-open");
  currentItem=null;
  if(detailReturnLibrary){
    const target=detailReturnLibrary;
    detailReturnLibrary="";
    openLibrary(target,false);
  }
}

detailPlay?.addEventListener("click",()=>{
  if(currentItem) openPlayer(currentItem.id,currentItem.type,currentItem.name);
});
detailEpisodes?.addEventListener("click",()=>{
  if(!currentItem || currentItem.type!=="series") return;
  openPlayer(currentItem.id,currentItem.type,currentItem.name);
  const started=Date.now();
  const waitForEpisodes=()=>{
    if(!player.classList.contains("hidden") && !playerResolving && playerStreams.length){
      renderEpisodeSheet();
      openEpisodeSheet();
      return;
    }
    if(Date.now()-started<15000) window.setTimeout(waitForEpisodes,250);
  };
  window.setTimeout(waitForEpisodes,250);
});
document.querySelector("#closeDetail")?.addEventListener("click",closeDetail);
document.querySelector("#closeDetailSecondary")?.addEventListener("click",closeDetail);
detailFavorite?.addEventListener("click",()=>{ if(currentItem) toggleFavorite(currentItem); });
closeSearch?.addEventListener("click",()=>searchPanel.classList.add("hidden"));

function loadResume(){
  try{
    const value=JSON.parse(localStorage.getItem("luno-resume")||"[]");
    return Array.isArray(value) ? value.filter(x=>x?.id) : [];
  }catch{return []}
}

function saveResume(item,position=0,duration=0){
  if(!item?.id) return;
  const list=loadResume().filter(x=>x.id!==item.id);
  list.unshift({...item,position:Number(position)||0,duration:Number(duration)||0,updatedAt:Date.now()});
  try{localStorage.setItem("luno-resume",JSON.stringify(list.slice(0,20)));}catch{}
  renderResume();
}

function renderResume(){
  resumeItems=loadResume();
  if(!continueSection) return;
  if(!resumeItems.length){
    continueSection.classList.add("resume-empty");
    continueCards.innerHTML="";
    return;
  }
  continueSection.classList.remove("resume-empty");
  continueCards.innerHTML=resumeItems.slice(0,12).map(card).join("");
  bindCards();
}

function getLibraryItems(type){
  const source={
    movies:movieItems,
    series:seriesItems,
    cartoons:cartoonItems,
    anime:animeItems,
    shows:showItems
  }[type] || [];
  return source.slice().sort((a,b)=>
    (Number(b.popularity)||0)-(Number(a.popularity)||0)
  );
}

let libraryType="";
let libraryItems=[];
let libraryVisible=0;
const LIBRARY_BATCH=24;

function renderLibraryBatch(){
  if(!libraryContent) return;
  const next=libraryItems.slice(libraryVisible,libraryVisible+LIBRARY_BATCH);
  if(!next.length) return;
  const grid=libraryContent.querySelector(".library-infinite-grid");
  if(!grid) return;
  grid.insertAdjacentHTML("beforeend",next.map(card).join(""));
  libraryVisible+=next.length;
  bindCards();
}

function openCategoryHub(){
  setLunoHistory("catalog");
  if(!libraryView || !libraryContent) return;
  libraryType="catalog";
  libraryTitle.textContent="Каталог";
  libraryKicker.textContent="";
  libraryContent.innerHTML=
    '<div class="category-hub">'+
      '<button class="category-hub-card" data-category="movies"><span>🎬</span><strong>Фильмы</strong><small>Полнометражное кино</small></button>'+
      '<button class="category-hub-card" data-category="series"><span>📺</span><strong>Сериалы</strong><small>Сезоны и эпизоды</small></button>'+
      '<button class="category-hub-card" data-category="cartoons"><span>✦</span><strong>Мультфильмы</strong><small>Анимационное кино</small></button>'+
      '<button class="category-hub-card" data-category="anime"><span>◈</span><strong>Аниме</strong><small>Японская анимация</small></button>'+
      '<button class="category-hub-card" data-category="shows"><span>◉</span><strong>Шоу</strong><small>Реалити, ток-шоу и другое</small></button>'+
      '<button class="category-hub-card" data-category="favorites"><span>♡</span><strong>Моё</strong><small>Избранное и продолжение</small></button>'+
    '</div>';
  libraryView.classList.remove("hidden");
  document.body.classList.add("library-open");
  libraryContent.scrollTop=0;
  libraryContent.querySelectorAll("[data-category]").forEach(button=>{
    button.addEventListener("click",()=>{
      const category=button.dataset.category;
      if(category==="favorites"){
        closeLibrary();
        favoritesSection?.scrollIntoView({behavior:"smooth",block:"start"});
      }else{
        openLibrary(category);
      }
    });
  });
}
function openLibrary(type,pushHistory=true){
  const config={
    movies:{title:"Фильмы",kicker:""},
    series:{title:"Сериалы",kicker:""},
    cartoons:{title:"Мультфильмы",kicker:""},
    anime:{title:"Аниме",kicker:""},
    shows:{title:"Шоу",kicker:""}
  }[type];
  if(!config || !libraryView) return;

  if(pushHistory) setLunoHistory(type);
  libraryType=type;
  libraryItems=getLibraryItems(type);
  libraryVisible=0;
  libraryTitle.textContent=config.title;
  libraryKicker.textContent=config.kicker;

  libraryContent.innerHTML=
    '<div class="library-toolbar">'+
      '<span>Все '+escapeHtml(config.title.toLocaleLowerCase("ru-RU"))+'</span>'+
      '<strong>'+libraryItems.length+'</strong>'+
    '</div>'+
    '<div class="library-infinite-grid"></div>'+
    '<div class="library-loader" id="libraryLoader">Загрузка…</div>';

  libraryView.classList.remove("hidden");
  document.body.classList.add("library-open");
  libraryContent.scrollTop=0;
  renderLibraryBatch();

  if(libraryContent._observer) libraryContent._observer.disconnect();
  const loader=document.querySelector("#libraryLoader");
  if(loader){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){
        if(libraryVisible<libraryItems.length){
          renderLibraryBatch();
        }else{
          loader.textContent="Вы просмотрели весь каталог";
        }
      }
    },{root:libraryContent,rootMargin:"900px 0px"});
    observer.observe(loader);
    libraryContent._observer=observer;
  }
}

function closeLibrary(fromHistory=false){
  libraryView?.classList.add("hidden");
  document.body.classList.remove("library-open");
  if(!fromHistory){
    try{
      if(history.state?.luno && history.state.luno!=="home" && history.state.luno!=="detail") history.back();
    }catch{}
  }
}

function navigate(section){
  document.querySelectorAll(".nav-item,.mobile-tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll('.nav-item[data-section="'+section+'"],.mobile-tab[data-section="'+section+'"]').forEach(x=>x.classList.add("active"));
  if(["movies","series","cartoons","anime","shows"].includes(section)){
    openLibrary(section);
    return;
  }
  if(section==="catalog"){
    openCategoryHub();
    return;
  }
  if(section==="favorites"){
    closeLibrary();
    favoritesSection?.scrollIntoView({behavior:"smooth",block:"start"});
    return;
  }
  if(section==="search"){
    closeLibrary();
    searchPanel?.classList.remove("hidden");
    window.setTimeout(()=>searchInput?.focus(),40);
    return;
  }
  closeLibrary();
  const target=document.querySelector(".hero");
  target?.scrollIntoView({behavior:"smooth",block:"start"});
}

function getYear(item){
  return Number(String(item?.releaseInfo||"").match(/\d{4}/)?.[0]||0);
}

function renderDiscovery(){
  const all=catalogItems.slice();
  const trending=all.slice().sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0)).slice(0,18);
  const fresh=all.filter(item=>getYear(item)>=new Date().getFullYear()-1)
    .sort((a,b)=>getYear(b)-getYear(a) || (Number(b.popularity)||0)-(Number(a.popularity)||0))
    .slice(0,18);
  const top=all.filter(item=>(Number(item.rating)||0)>0)
    .sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0) || (Number(b.popularity)||0)-(Number(a.popularity)||0))
    .slice(0,18);

  if(trendingCards) trendingCards.innerHTML=trending.map(card).join("");
  if(newCards) newCards.innerHTML=fresh.map(card).join("");
  if(topCards) topCards.innerHTML=top.map(card).join("");

  const genres=[
    ["Боевики","⚡"],["Комедии","☻"],["Драмы","◒"],["Фантастика","✦"],
    ["Триллеры","◉"],["Ужасы","☾"],["Приключения","◆"],["Семейные","◇"]
  ];
  if(genreGrid){
    genreGrid.innerHTML=genres.map(([name,icon])=>
      '<button class="genre-tile" data-genre="'+escapeHtml(name)+'"><span>'+icon+'</span><strong>'+escapeHtml(name)+'</strong><small>Смотреть подборку</small></button>'
    ).join("");
    genreGrid.querySelectorAll(".genre-tile").forEach(btn=>{
      btn.addEventListener("click",()=>{
        searchPanel?.classList.remove("hidden");
        if(searchInput){searchInput.value=btn.dataset.genre; searchInput.dispatchEvent(new Event("input"));}
      });
    });
  }
  bindCards();
}

function renderCatalogSections(){
  renderDiscovery();
  if(movieCards) movieCards.innerHTML=movieItems.slice(0,movieVisible).map(card).join("");
  if(openCinemaCards) openCinemaCards.innerHTML=openCinemaItems.map(card).join("");
  if(seriesCards) seriesCards.innerHTML=seriesItems.slice(0,seriesVisible).map(card).join("");
  renderResume();
  renderFavorites();
  renderDiscovery();
  bindCards();
  const eyebrow=document.querySelector(".hero .eyebrow");
  if(eyebrow) eyebrow.textContent="";
  updateHero(movieItems[0]);
}

function updateHero(item){
  if(!item) return;
  heroItem=item;
  if(heroBackdrop) heroBackdrop.style.backgroundImage=item.background ? 'url("'+String(item.background).replace(/"/g,"&quot;")+'")' : "";
  if(heroPoster) heroPoster.style.backgroundImage=item.poster ? 'url("'+String(item.poster).replace(/"/g,"&quot;")+'")' : "";
  if(heroTitle) heroTitle.innerHTML=escapeHtml(item.name).replace(/\n/g,"<br>");
  if(heroDescription) heroDescription.textContent=item.description || "Выбери фильм и начни просмотр в LUNO.";
  if(heroMeta) heroMeta.textContent=[metaLine(item),Number(item.rating)>0 ? "★ "+Number(item.rating).toFixed(1) : ""].filter(Boolean).join(" • ");
  if(heroDots) heroDots.innerHTML='<span class="active"></span>';
}

function renderItems(items,sections={}){
  const unique=[...new Map(items.filter(x=>x?.id).map(x=>[x.id,normalizeItem(x)])).values()];
  if(!unique.length) return false;

  const map=new Map(unique.map(item=>[item.id,item]));
  const fromIds=(ids,fallbackType)=>{
    const result=(ids||[]).map(id=>map.get(id)).filter(Boolean);
    if(result.length) return result;
    return unique.filter(item=>item.type===fallbackType);
  };

  catalogItems=unique;
  const classify=(items,type)=>items.filter(item=>mediaCategory(item)===type);
  movieItems=classify(unique,"movies");
  openCinemaItems=unique.filter(item=>item.openCinema);
  seriesItems=classify(unique,"series");
  cartoonItems=classify(unique,"cartoons");
  animeItems=classify(unique,"anime");
  showItems=classify(unique,"shows");
  animationItems=[...cartoonItems,...animeItems];

  window.__LUNO_ITEMS__=new Map(unique.map(item=>[item.id,item]));
  renderCatalogSections();
  return true;
}

async function loadTmdbCatalog(){
  if(tmdbCatalog && Array.isArray(tmdbCatalog.items) && tmdbCatalog.items.length){
    return {items:tmdbCatalog.items,sections:tmdbCatalog.sections||{}};
  }
  const candidates=[
    new URL("./tmdb-catalog.json?v=5",document.baseURI).href,
    new URL("./tmdb-catalog.json?v=6",document.baseURI).href
  ];
  let lastError=null;
  for(const url of [...new Set(candidates)]){
    try{
      const response=await fetch(url,{cache:"no-store"});
      if(!response.ok) throw new Error("HTTP "+response.status);
      const data=await response.json();
      const items=Array.isArray(data?.items) ? data.items : [];
      if(!items.length) throw new Error("empty catalog");
      return {items,sections:data?.sections||{}};
    }catch(error){
      lastError=error;
      console.warn("LUNO catalog attempt failed:",url,error);
    }
  }
  throw new Error("TMDB catalog unavailable: "+(lastError?.message||"unknown error"));
}

async function loadMoreCatalog(){
  if(catalogLoading) return;
  catalogLoading=true;
  try{
    movieVisible+=18;
    seriesVisible+=18;
    renderCatalogSections();
  }finally{
    catalogLoading=false;
  }
}

function providerLabel(provider){ return String(provider?.name||provider?.id||"LUNO Source"); }
function renderAddonManager(){
  if(!addonList) return;
  const engine=window.__LUNO_SOURCE_ENGINE__;
  renderSourceManager(addonList,{
    providers:engine?.listProviders?.()||[],
    sources:engine?.listSources?.()||[],
    status:engine?.getStatus?.()||{},
    preferences:engine?.getSourcePreferences?.()||{}
  });
  bindSourceManager(addonList,(id,enabled)=>{
    engine?.setSourceEnabled?.(id,enabled);
    renderAddonManager();
  });
}
function openAddonManagerPanel(){ closeSourceSheetPanel(); addonManager?.classList.remove("hidden"); renderAddonManager(); }
function closeAddonManagerPanel(){ addonManager?.classList.add("hidden"); }
async function installAddonFromInput(){ if(addonManagerStatus) addonManagerStatus.textContent="Источники LUNO встроены в приложение. Внешние manifest-файлы больше не используются."; }

function showEngineStatus(message){
  const eyebrow=document.querySelector(".hero .eyebrow");
  if(eyebrow) eyebrow.textContent=message;
}

function showCatalogMessage(message){
  if(movieCards) movieCards.innerHTML='<div class="catalog-message">'+escapeHtml(message)+'</div>';
  if(seriesCards) seriesCards.innerHTML="";
}

function getDirectStreamUrl(stream){
  if(!stream || typeof stream!=="object") return "";
  const candidates=[
    stream.url,
    stream.streamingUrl,
    stream.externalUrl,
    stream.webosUrl
  ];
  for(const candidate of candidates){
    const value=String(candidate||"").trim();
    if(!/^https?:\/\//i.test(value)) continue;
    if(/\.(?:torrent)(?:$|[?#])/i.test(value)) continue;
    return value;
  }
  return "";
}

function isBrowserPlayableStream(stream){
  if(!stream || typeof stream!=="object") return false;
  const direct=getDirectStreamUrl(stream);
  if(direct) return true;
  const url=String(stream.url||"").trim();
  if(/^magnet:/i.test(url)) return false;
  if(stream.infoHash || stream.infohash || stream.fileIdx!=null) return false;
  return false;
}

function streamKind(entry){
  const stream=entry?.stream||{};
  if(isBrowserPlayableStream(stream)) return "direct";
  const url=String(stream.url||"").trim();
  if(/^magnet:/i.test(url) || stream.infoHash || stream.infohash || stream.fileIdx!=null){
    return "p2p";
  }
  return "unsupported";
}

function streamLabel(entry,index){
  const stream=entry?.stream||{};
  const name=stream.name || stream.description || "";
  const addon=entry?.addon?.manifest?.name || "";
  const text=[name,addon].filter(Boolean).join(" • ");
  return text || "Источник "+(index+1);
}

function streamQuality(entry){
  const hints=entry?.stream?.behaviorHints||{};
  const text=[entry?.stream?.name,entry?.stream?.description].filter(Boolean).join(" ");
  const match=text.match(/(?:2160|1440|1080|720|576|480|360)p?/i);
  if(match) return match[0].toUpperCase();
  if(hints.videoSize) return Math.round(Number(hints.videoSize)/1024/1024)+" MB";
  return "";
}

function currentStreamEntry(){
  const index=Number(playerStreamState?.selectedIndex);
  return Number.isInteger(index)&&playerStreams[index] ? playerStreams[index] : playerStreams[0]||null;
}
function streamQualities(entry){
  const map=entry?.stream?.quality||entry?.stream?.qualitys||{};
  return Object.entries(map).filter(([,url])=>/^https?:\/\//i.test(String(url||"")))
    .map(([label,url])=>({label,url}))
    .sort((a,b)=>(Number(String(b.label).match(/\d{3,4}/)?.[0]||0)-Number(String(a.label).match(/\d{3,4}/)?.[0]||0)));
}
function streamSubtitles(entry){
  return Array.isArray(entry?.stream?.subtitles)?entry.stream.subtitles.filter(x=>/^https?:\/\//i.test(String(x?.url||""))):[];
}
function streamEpisode(entry){
  const s=entry?.stream||{};
  const season=Number(s.season)||0;
  const episode=Number(s.episode)||0;
  if(!season&&!episode)return "";
  return "S"+String(season).padStart(2,"0")+"E"+String(episode).padStart(2,"0");
}
function renderEpisodeSheet(){
  if(!episodeList)return;
  const items=playerStreams.map((entry,index)=>({entry,index,label:streamEpisode(entry)||("Серия "+(index+1))}))
    .filter(x=>x.label);
  const uniqueItems=[]; const seen=new Set();
  for(const item of items){if(!seen.has(item.label)){seen.add(item.label);uniqueItems.push(item)}}
  episodeList.innerHTML=uniqueItems.length
    ? uniqueItems.map((x,i)=>'<button class="source-option" type="button" data-episode-index="'+i+'"><span><strong>'+escapeHtml(x.label)+'</strong><span>'+escapeHtml(x.entry?.stream?.episode_title||"Источник")+'</span></span></button>').join("")
    : '<div class="source-empty">Источник не передал данные серий.</div>';
  episodeList.querySelectorAll("[data-episode-index]").forEach(btn=>btn.onclick=()=>{
    const item=uniqueItems[Number(btn.dataset.episodeIndex)];
    if(item){selectLunoSource(item.index);episodeSheet?.classList.add("hidden")}
  });
}
function streamVoice(entry){
  const s=entry?.stream||{};
  const value=s.voice||s.voice_name||s.translation||s.dubbing||s.author;
  if(!value)return "";
  if(typeof value==="string")return value.trim();
  return String(value.name||value.title||value.label||value.id||"").trim();
}
function renderVoiceSheet(){
  if(!voiceList)return;
  const groups=new Map();
  for(const entry of playerStreams){
    const voice=streamVoice(entry)||"Оригинал";
    const key=voice.toLowerCase();
    if(!groups.has(key))groups.set(key,{label:voice,entry});
  }
  const list=[...groups.values()];
  voiceList.innerHTML=list.length
    ? list.map((v,i)=>'<button class="source-option" type="button" data-voice-index="'+i+'"><span><strong>'+escapeHtml(v.label)+'</strong><span>Источник с этой озвучкой</span></span></button>').join("")
    : '<div class="source-empty">Источник не передал данные об озвучке.</div>';
  voiceList.querySelectorAll("[data-voice-index]").forEach(btn=>btn.onclick=()=>{
    const item=list[Number(btn.dataset.voiceIndex)];
    if(item?.entry){
      const index=playerStreams.indexOf(item.entry);
      if(index>=0)selectLunoSource(index);
    }
    voiceSheet?.classList.add("hidden");
  });
}
function renderQualitySheet(){
  if(!qualityList)return;
  const entry=currentStreamEntry();
  const list=streamQualities(entry);
  qualityList.innerHTML=(list.length?list:[{label:"Авто",url:entry?.stream?.url||""}]).map((q,i)=>
    '<button class="source-option" type="button" data-quality-index="'+i+'"><span><strong>'+escapeHtml(q.label)+'</strong><span>'+(i===0?"Лучшее доступное":"Поток источника")+'</span></span></button>'
  ).join("");
  qualityList.querySelectorAll("[data-quality-index]").forEach(btn=>btn.onclick=()=>{
    const q=list[Number(btn.dataset.qualityIndex)];
    if(q?.url){
      setLunoStream(q.url,{label:(entry?streamLabel(entry,playerStreams.indexOf(entry)):"LUNO")+" • "+q.label,stream:entry.stream,resume:false});
    }
    qualitySheet?.classList.add("hidden");
  });
}
function renderSubtitleSheet(){
  if(!subtitleList)return;
  const entry=currentStreamEntry();
  const list=streamSubtitles(entry);
  subtitleList.innerHTML='<button class="source-option" type="button" data-subtitle="off"><span><strong>Выключить</strong><span>Без субтитров</span></span></button>'+
    list.map((s,i)=>'<button class="source-option" type="button" data-subtitle-index="'+i+'"><span><strong>'+escapeHtml(s.label||s.lang||("Субтитры "+(i+1)))+'</strong><span>'+escapeHtml(s.lang||"")+'</span></span></button>').join("");
  subtitleList.querySelector('[data-subtitle="off"]')?.addEventListener("click",()=>{clearTextTracks();subtitleSheet?.classList.add("hidden")});
  subtitleList.querySelectorAll("[data-subtitle-index]").forEach(btn=>btn.onclick=()=>{
    const s=list[Number(btn.dataset.subtitleIndex)];
    if(s) applyTextTrack(s);
    subtitleSheet?.classList.add("hidden");
  });
}
function clearTextTracks(){
  if(!lunoVideo)return;
  [...lunoVideo.querySelectorAll("track[data-luno-subtitle]")].forEach(t=>t.remove());
}
function applyTextTrack(subtitle){
  if(!lunoVideo||!subtitle?.url)return;
  clearTextTracks();
  const track=document.createElement("track");
  track.dataset.lunoSubtitle="1";
  track.kind="subtitles";
  track.label=subtitle.label||subtitle.lang||"Subtitles";
  track.srclang=subtitle.lang||"ru";
  track.src=subtitle.url;
  track.default=true;
  lunoVideo.appendChild(track);
  [...lunoVideo.textTracks].forEach(t=>t.mode=t.label===track.label?"showing":"disabled");
}
function renderSourceSheet(){
  if(!sourceList || !sourceEmpty) return;
  sourceList.innerHTML=playerStreams.map((entry,index)=>{
    const label=escapeHtml(streamLabel(entry,index));
    const quality=escapeHtml(streamQuality(entry));
    const kind=streamKind(entry);
    const disabled=kind!=="direct" ? " disabled aria-disabled=\"true\"" : "";
    const suffix=kind==="p2p"
      ? "P2P • браузерный LUNO Player не поддерживает"
      : (kind==="unsupported" ? "Формат не поддерживается" : (entry?.addon?.manifest?.name ? escapeHtml(entry.addon.manifest.name) : "Источник LUNO"));
    return '<button class="source-option" type="button" data-source-index="'+index+'"'+disabled+'>'+
      '<span><strong>'+label+'</strong><span>'+suffix+'</span></span>'+
      (quality ? '<span class="source-quality">'+quality+'</span>' : '')+
    '</button>';
  }).join("");
  sourceEmpty.classList.toggle("hidden",playerStreams.length>0);
  sourceList.querySelectorAll("[data-source-index]:not(:disabled)").forEach(button=>{
    button.addEventListener("click",()=>{
      selectLunoSource(Number(button.dataset.sourceIndex));
    });
  });
}

function openSourceSheet(){
  renderSourceSheet();
  sourceSheet?.classList.remove("hidden");
  sourceList?.querySelector("button")?.focus();
}

function closeSourceSheetPanel(){
  sourceSheet?.classList.add("hidden");
}

function buildMetaRequest(item,entry){
  const base=entry?.addon?.transportUrl || entry?.request?.base;
  if(!base || !item?.id) return null;
  const type=item.type==="series" ? "series" : "movie";
  const id=type==="movie"
    ? String(item.imdbId || item.videoId || item.id)
    : String(item.id);
  return {
    base,
    path:{
      resource:"meta",
      type,
      id,
      extra:[]
    }
  };
}

async function resolveLunoStreams(item){
  if(playerResolving || !item) return;
  playerResolving=true;
  playerStreams=[];
  renderSourceSheet();
  playerEmpty?.classList.remove("hidden");
  if(playerMessage) playerMessage.textContent="Ищем доступные источники…";
  if(playerSourceButton) playerSourceButton.disabled=true;

  try{
    const streamIdentity = item?.type==="movie" ? (item?.imdbId || item?.videoId || "") : (item?.videoId || "");
    let state=await loadMetaDetails(item,streamIdentity);
    let streams=getReadyMetaStreams(state);

    // Для сериала источник сначала получает metadata. Если первый запрос не выбрал
    // видео, выбираем продолжение из Library или первую доступную серию.
    if(!streams.length && item.type==="series"){
      const readyMeta=state?.metaItem?.content?.type==="Ready" ? state.metaItem.content.content : null;
      const videoId=state?.libraryItem?.state?.videoId ||
        readyMeta?.videos?.find(video=>!video.watched)?.id ||
        readyMeta?.videos?.[0]?.id || "";
      if(videoId){
        state=await loadMetaDetails(item,videoId);
        streams=getReadyMetaStreams(state);
      }
    }

    playerStreamState=state;
    playerStreams=streams.filter(entry=>entry?.stream);

    const directStreams=playerStreams.filter(entry=>streamKind(entry)==="direct");
    const unsupportedStreams=playerStreams.filter(entry=>streamKind(entry)!=="direct");

    // Источники LUNO разрешаются встроенным Source Engine.
    renderSourceSheet();

    if(!playerStreams.length){
      if(playerMessage) playerMessage.textContent="Источник для этого контента не найден.";
      openSourceSheet();
      return;
    }

    if(directStreams.length===1){
      const directIndex=playerStreams.indexOf(directStreams[0]);
      await selectLunoSource(directIndex);
    }else if(directStreams.length>1){
      if(playerMessage) playerMessage.textContent="Выберите источник просмотра.";
      openSourceSheet();
    }else{
      const hasP2P=unsupportedStreams.some(entry=>streamKind(entry)==="p2p");
      if(playerMessage) playerMessage.textContent=hasP2P
        ? "Источник найден, но он отдаёт P2P/torrent. LUNO Player в браузере принимает прямые HTTP/HLS/MP4 потоки."
        : "Источник найден, но его формат не поддерживается LUNO Player.";
      openSourceSheet();
    }
  }catch(error){
    console.error("LUNO stream resolution failed",error);
    if(playerMessage) playerMessage.textContent="Не удалось получить источники. Попробуйте ещё раз.";
    openSourceSheet();
  }finally{
    playerResolving=false;
    if(playerSourceButton) playerSourceButton.disabled=false;
  }
}

async function selectLunoSource(index){
  const entry=playerStreams[index];
  if(!entry?.stream) return;
  closeSourceSheetPanel();
  if(playerStreamState) playerStreamState.selectedIndex=index;
  playerEmpty?.classList.remove("hidden");
  if(playerMessage) playerMessage.textContent="Подготавливаем источник…";
  if(playerBarMeta) playerBarMeta.textContent=streamLabel(entry,index);

  try{
    // Source Engine уже вернул конкретный stream. Для прямых URL отдаём
    // поток непосредственно нашему LUNO Player — модель Core Player здесь
    // не должна блокировать воспроизведение.
    const kind=streamKind(entry);
    if(kind!=="direct"){
      playerEmpty?.classList.remove("hidden");
      if(playerMessage) playerMessage.textContent=kind==="p2p"
        ? "Этот источник отдаёт P2P/torrent и не может быть воспроизведён напрямую в браузерном LUNO Player."
        : "Этот источник не отдаёт поддерживаемый прямой поток.";
      openSourceSheet();
      return;
    }

    const directStreamUrl=getDirectStreamUrl(entry.stream);

    if(directStreamUrl){
      setLunoStream(directStreamUrl,{label:streamLabel(entry,index),resume:true,stream:entry.stream});
      return;
    }

    // Для потоков без прямого URL используем внутренний player-resolver.
    const metaRequest=buildMetaRequest(currentItem,entry);
    const playerState=await loadLunoPlayer(entry.stream,entry.request,metaRequest,{
      resource:"subtitles",
      type:currentItem?.type==="series" ? "series" : "movie",
      id:entry.request?.path?.id || currentItem?.id || "",
      extra:[]
    });
    const streamUrl=getPlayerStreamUrl(playerState);

    if(!streamUrl){
      playerEmpty?.classList.remove("hidden");
      if(lunoVideo) lunoVideo.classList.remove("is-ready");
      if(playerMessage) playerMessage.textContent="Этот источник не отдаёт прямой поток для LUNO Player.";
      return;
    }

    setLunoStream(streamUrl,{label:streamLabel(entry,index),resume:true,stream:entry.stream});
  }catch(error){
    console.error("LUNO player load failed",error);
    if(playerMessage) playerMessage.textContent="Источник не удалось запустить.";
    playerEmpty?.classList.remove("hidden");
  }
}

function openPlayer(id,type,title,streamUrl=""){
  player.classList.remove("hidden");
  if(playerBarTitle) playerBarTitle.textContent=title || "LUNO";
  if(playerBarMeta) playerBarMeta.textContent=type==="series" ? "Сериал" : "Фильм";
  if(lunoVideo){
    lunoVideo.pause();
    lunoVideo.removeAttribute("src");
    lunoVideo.load();
    lunoVideo.classList.remove("is-ready");
  }
  sourceSheet?.classList.add("hidden");
  playerStreams=[];
  playerStreamState=null;
  lastCoreTime=-1;
  if(streamUrl){
    setLunoStream(streamUrl);
  }else{
    playerEmpty?.classList.remove("hidden");
    if(playerMessage) playerMessage.textContent="Ищем доступные источники…";
    resolveLunoStreams(currentItem);
  }
  document.querySelector("#closePlayer")?.focus();
}

function closePlayer(){
  if(lunoVideo && currentItem && Number(lunoVideo.duration)>0 && Number(lunoVideo.currentTime)>5){
    window.LUNOPlayback?.progress(currentItem,lunoVideo.currentTime,lunoVideo.duration);
  }
  destroyActivePlayback();
  clearTextTracks();
  lunoVideo?.pause();
  sourceSheet?.classList.add("hidden");
  player.classList.add("hidden");
  unloadLunoPlayer().catch?.(()=>{});
}

let activeHls=null;
let activeDash=null;

function destroyActivePlayback(){
  activeHls?.destroy?.();
  activeHls=null;
  try{ activeDash?.reset?.(); }catch{}
  activeDash=null;
}

function setLunoStream(streamUrl,streamMeta={}){
  if(!lunoVideo || !streamUrl) return false;
  destroyActivePlayback();
  playerEmpty?.classList.add("hidden");
  lunoVideo.classList.add("is-ready");
  lunoVideo.removeAttribute("src");
  lunoVideo.removeAttribute("type");
  lunoVideo.load();

  const rawUrl=String(streamUrl).trim();
  const mediaUrl=rawUrl.split("|")[0];
  const hint=String(
    streamMeta?.stream?.behaviorHints?.contentType ||
    streamMeta?.stream?.contentType ||
    streamMeta?.contentType ||
    ""
  ).toLowerCase();

  const isHls=hint.includes("mpegurl") || hint.includes("hls") || /\.m3u8(?:$|[?#])/i.test(mediaUrl);
  const isDash=hint.includes("dash") || hint.includes("mpd") || /\.mpd(?:$|[?#])/i.test(mediaUrl);

  const showPlaybackError=(message)=>{
    destroyActivePlayback();
    lunoVideo.pause();
    lunoVideo.classList.remove("is-ready");
    playerEmpty?.classList.remove("hidden");
    if(playerMessage) playerMessage.textContent=message;
  };

  lunoVideo.onerror=()=>{
    showPlaybackError("Поток не удалось воспроизвести. Выберите другой источник.");
  };

  if(isDash && dashjs?.MediaPlayer){
    try{
      activeDash=dashjs.MediaPlayer().create();
      activeDash.initialize(lunoVideo,mediaUrl,true);
      activeDash.on(dashjs.MediaPlayer.events.ERROR,(event)=>{
        console.warn("LUNO DASH playback error",event);
      });
    }catch(error){
      console.warn("LUNO DASH init failed",error);
      showPlaybackError("DASH-поток не удалось запустить.");
      return false;
    }
  }else if(isHls && Hls.isSupported()){
    activeHls=new Hls({
      enableWorker:true,
      lowLatencyMode:false,
      backBufferLength:30,
      maxBufferLength:30,
      capLevelToPlayerSize:true
    });

    activeHls.on(Hls.Events.ERROR,(event,data)=>{
      if(!data?.fatal) return;
      console.warn("LUNO HLS playback error",data);
      if(data.type===Hls.ErrorTypes.MEDIA_ERROR){
        try{
          activeHls.recoverMediaError();
          return;
        }catch{}
      }
      showPlaybackError("HLS-поток не удалось запустить.");
    });

    activeHls.loadSource(mediaUrl);
    activeHls.attachMedia(lunoVideo);
  }else if(isHls && lunoVideo.canPlayType("application/vnd.apple.mpegurl")){
    lunoVideo.src=mediaUrl;
  }else{
    lunoVideo.src=mediaUrl;
  }

  if(playerBarMeta) playerBarMeta.textContent=streamMeta.label || playerBarMeta.textContent || "";
  const resume=loadResume().find(item=>item.id===currentItem?.id);
  const startAt=Number(resume?.position)||0;
  const onMetadata=()=>{
    if(startAt>5 && Number(lunoVideo.duration)>startAt+5){
      try{lunoVideo.currentTime=startAt;}catch{}
    }
    lunoVideo.removeEventListener("loadedmetadata",onMetadata);
  };
  lunoVideo.addEventListener("loadedmetadata",onMetadata);
  lunoVideo.play().catch(()=>{});
  window.LUNOPlayback?.start(currentItem);
  return true;
}

window.LUNOPlayer={openStream:setLunoStream};

function showSearchResults(items,query){
  let resultBox=document.querySelector("#searchResults");
  if(!resultBox){
    resultBox=document.createElement("div");
    resultBox.id="searchResults";
    resultBox.className="search-results";
    searchBox.appendChild(resultBox);
  }

  resultBox.innerHTML=items.length
    ? '<div class="search-results-title">Результаты для «'+escapeHtml(query)+'»</div><div class="search-results-grid">'+items.slice(0,36).map(card).join("")+'</div>'
    : '<div class="search-empty">Ничего не найдено</div>';
  bindCards();
}

function searchLocal(query){
  const q=query.trim().toLocaleLowerCase("ru-RU");
  if(!q) return [];
  return catalogItems
    .filter(item=>{
      const hay=[item.name,item.originalName,...(item.genres||[])].join(" ").toLocaleLowerCase("ru-RU");
      return hay.includes(q);
    })
    .sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0));
}

function dynamicSearchUrl(query){
  const base=String(window.__LUNO_API_BASE__||"https://luno-api.bqrt30.workers.dev").replace(/\/$/,"");
  return (base||"")+"/api/tmdb/search?query="+encodeURIComponent(query);
}

function normalizeSearchText(value=""){
  return String(value)
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g,"е")
    .replace(/[^a-zа-я0-9]+/gi," ")
    .replace(/\\s+/g," ")
    .trim();
}

function searchYear(item){
  return String(item?.releaseInfo||"").match(/\d{4}/)?.[0] || "";
}

function dedupeSearchResults(items){
  const seen=new Set();
  const result=[];
  for(const item of items){
    const normalizedName=normalizeSearchText(item?.name||item?.originalName||"");
    const year=searchYear(item);
    const imdb=String(item?.imdbId||"").trim().toLowerCase();
    const key=imdb
      ? "imdb:"+imdb
      : [item?.type||"movie",normalizedName,year].join("|");
    if(!normalizedName || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function rankSearchResults(items,query){
  const q=normalizeSearchText(query);
  const qWords=q.split(" ").filter(Boolean);
  const scored=items.map((item,index)=>{
    const name=normalizeSearchText(item?.name||"");
    const original=normalizeSearchText(item?.originalName||"");
    const year=searchYear(item);
    let score=0;

    if(name===q) score+=1000;
    else if(name.startsWith(q)) score+=650;
    else if(name.includes(q)) score+=450;

    if(original===q) score+=500;
    else if(original.startsWith(q)) score+=300;
    else if(original.includes(q)) score+=180;

    const matchedWords=qWords.filter(word=>name.includes(word)||original.includes(word)).length;
    score+=matchedWords*70;

    // Для названий франшиз сначала показываем полнометражные фильмы,
    // а сериалы оставляем ниже, если пользователь не ищет сериал явно.
    if(item?.type==="movie") score+=160;
    if(item?.type==="series") score-=40;

    const rating=Number(item?.rating)||0;
    const popularity=Number(item?.popularity)||0;
    score+=rating*12;
    score+=Math.min(popularity,100)*0.25;

    // Если год явно указан в запросе — жёстко учитываем его.
    const queryYear=q.match(/\b(19\d{2}|20\d{2})\b/)?.[1];
    if(queryYear) score += year===queryYear ? 900 : -250;

    return {item,score,index};
  });

  return scored
    .sort((a,b)=>b.score-a.score || a.index-b.index)
    .map(entry=>entry.item);
}

async function searchDynamic(query){
  const response=await fetch(dynamicSearchUrl(query),{headers:{accept:"application/json"},cache:"no-store"});
  if(!response.ok) throw new Error("TMDB search HTTP "+response.status);
  const data=await response.json();
  const items=Array.isArray(data?.results)
    ? data.results.map(normalizeItem).filter(x=>x.tmdbId)
    : [];
  const clean=rankSearchResults(dedupeSearchResults(items),query);
  for(const item of clean) window.__LUNO_ITEMS__.set(item.id,item);
  return clean;
}

document.querySelector("#openDemo").onclick=()=>{
  if(heroItem) openDetail(heroItem);
};
document.querySelector("#continueBtn").onclick=()=>{
  if(heroItem) openDetail(heroItem);
  else if(resumeItems[0]) openDetail(resumeItems[0]);
};
document.querySelectorAll(".section-more").forEach(btn=>btn.addEventListener("click",()=>{
  navigate(btn.dataset.section||"home");
}));
lunoVideo?.addEventListener("timeupdate",()=>{
  if(!currentItem) return;
  const duration=Number(lunoVideo.duration)||0;
  const time=Number(lunoVideo.currentTime)||0;
  if(duration>0) window.LUNOPlayback?.progress(currentItem,time,duration);
  if(Math.abs(time-lastCoreTime)>=1){
    lastCoreTime=time;
    dispatchLunoPlayerAction("TimeChanged",{
      time:Math.max(0,Math.round(time*1000)),
      duration:Math.max(0,Math.round(duration*1000)),
      device:"luno"
    });
  }
});
lunoVideo?.addEventListener("play",()=>dispatchLunoPlayerAction("PausedChanged",{paused:false}));
lunoVideo?.addEventListener("pause",()=>dispatchLunoPlayerAction("PausedChanged",{paused:true}));
lunoVideo?.addEventListener("seeked",()=>{
  const duration=Number(lunoVideo.duration)||0;
  if(duration>0){
    dispatchLunoPlayerAction("Seek",{
      time:Math.max(0,Math.round((Number(lunoVideo.currentTime)||0)*1000)),
      duration:Math.max(0,Math.round(duration*1000)),
      device:"luno"
    });
  }
});
lunoVideo?.addEventListener("ended",()=>{
  dispatchLunoPlayerAction("Ended");
  if(currentItem) window.LUNOPlayback?.finish(currentItem);
});
lunoVideo?.addEventListener("error",()=>{
  if(playerMessage) playerMessage.textContent="Не удалось воспроизвести этот источник.";
});

playerEpisodeButton?.addEventListener("click",()=>{renderEpisodeSheet();episodeSheet?.classList.remove("hidden")});
closeEpisodeSheet?.addEventListener("click",()=>episodeSheet?.classList.add("hidden"));
playerVoiceButton?.addEventListener("click",()=>{renderVoiceSheet();voiceSheet?.classList.remove("hidden")});
closeVoiceSheet?.addEventListener("click",()=>voiceSheet?.classList.add("hidden"));
playerQualityButton?.addEventListener("click",()=>{renderQualitySheet();qualitySheet?.classList.remove("hidden")});
playerSubtitleButton?.addEventListener("click",()=>{renderSubtitleSheet();subtitleSheet?.classList.remove("hidden")});
closeQualitySheet?.addEventListener("click",()=>qualitySheet?.classList.add("hidden"));
closeSubtitleSheet?.addEventListener("click",()=>subtitleSheet?.classList.add("hidden"));
document.querySelector("#closePlayer").onclick=()=>{
  showDialog("Выйти из просмотра?","Прогресс просмотра сохранится на этом устройстве.","Выйти",closePlayer);
};
playerSourceButton?.addEventListener("click",()=>{
  if(playerStreams.length) openSourceSheet();
  else if(currentItem) resolveLunoStreams(currentItem);
});
closeSourceSheet?.addEventListener("click",closeSourceSheetPanel);
openAddonManager?.addEventListener("click",openAddonManagerPanel);
openAddonManagerTop?.addEventListener("click",openAddonManagerPanel);
openAddonManagerFromPlayer?.addEventListener("click",openAddonManagerPanel);
openCinemaSources?.addEventListener("click",openAddonManagerPanel);
closeAddonManager?.addEventListener("click",closeAddonManagerPanel);
addonManager?.addEventListener("click",(event)=>{
  if(event.target===addonManager) closeAddonManagerPanel();
});
installAddonButton?.addEventListener("click",installAddonFromInput);
addonUrlInput?.addEventListener("keydown",(event)=>{
  if(event.key==="Enter") installAddonFromInput();
  if(event.key==="Escape") closeAddonManagerPanel();
});
sourceSheet?.addEventListener("click",(event)=>{
  if(event.target===sourceSheet) closeSourceSheetPanel();
});
libraryBack?.addEventListener("click",closeLibrary);
librarySearch?.addEventListener("click",()=>{
  closeLibrary();
  searchPanel.classList.remove("hidden");
  searchInput.focus();
});

document.querySelector("#searchBtn")?.addEventListener("click",()=>{
  searchPanel?.classList.remove("hidden");
  searchInput?.focus();
});

let searchTimer=null;
searchInput.addEventListener("input",()=>{
  clearTimeout(searchTimer);
  const query=searchInput.value.trim();
  if(!query){
    document.querySelector("#searchResults")?.remove();
    return;
  }
  searchTimer=setTimeout(async()=>{
    try{
      const remote=await searchDynamic(query);
      showSearchResults(remote.length ? remote : searchLocal(query),query);
    }catch(error){
      console.warn("LUNO remote search unavailable, using local catalog:",error);
      showSearchResults(searchLocal(query),query);
    }
  },220);
});

searchInput.addEventListener("keydown",async(e)=>{
  if(e.key==="Escape") searchPanel.classList.add("hidden");
  if(e.key==="Enter"){
    const query=searchInput.value.trim();
    let result=searchLocal(query)[0];
    try{
      const remote=await searchDynamic(query);
      result=remote[0]||result;
    }catch{}
    if(result){
      searchPanel.classList.add("hidden");
      openDetail(result);
    }
  }
});

ensureLunoHistory();
window.addEventListener("popstate",()=>{
  if(!detail?.classList.contains("hidden")){
    closeDetail(true);
    return;
  }
  if(!libraryView?.classList.contains("hidden")){
    closeLibrary(true);
    return;
  }
});
document.addEventListener("keydown",(e)=>{
  if(e.key==="Escape"){
    closePlayer();
    closeAddonManagerPanel();
    closeDetail();
    searchPanel.classList.add("hidden");
    closeLibrary();
  }
});

document.querySelectorAll(".nav-item,.mobile-tab").forEach((btn)=>btn.addEventListener("click",()=>navigate(btn.dataset.section)));
document.querySelectorAll(".nav-item").forEach((btn,index,buttons)=>btn.addEventListener("keydown",(e)=>{
  if(e.key!=="ArrowRight" && e.key!=="ArrowLeft") return;
  e.preventDefault();
  const next=e.key==="ArrowRight" ? (index+1)%buttons.length : (index-1+buttons.length)%buttons.length;
  buttons[next].focus();
  navigate(buttons[next].dataset.section);
}));

window.LUNOPlayback={
  start(item){ if(item?.id) saveResume(item,0,0); },
  progress(item,position,duration){
    if(item?.id && Number(duration)>0 && Number(position)>5) saveResume(item,position,duration);
  },
  finish(item){
    if(!item?.id) return;
    const list=loadResume().filter(x=>x.id!==item.id);
    try{localStorage.setItem("luno-resume",JSON.stringify(list));}catch{}
    renderResume();
  }
};

renderResume();
renderFavorites();
showCatalogMessage("Загружаем каталог…");

const catalogSentinel=document.querySelector("#catalogSentinel");
if(catalogSentinel && "IntersectionObserver" in window){
  const observer=new IntersectionObserver((entries)=>{
    if(entries.some(entry=>entry.isIntersecting)) loadMoreCatalog();
  },{rootMargin:"900px 0px"});
  observer.observe(catalogSentinel);
}

function prefetchPosters(items){
  items.slice(0,36).forEach((item)=>{
    if(item?.poster){
      const image=new Image();
      image.decoding="async";
      image.src=item.poster;
    }
  });
}

(async()=>{
  try{
    setSplashProgress(25,"Подключаем каталог…");
    const catalog=await loadTmdbCatalog();
    setSplashProgress(68,"Загружаем фильмы и сериалы…");
    renderItems(catalog.items,catalog.sections);
    prefetchPosters(catalogItems);
    showCoreStatus("Каталог готов");
    setSplashProgress(88,"Почти готово…");
    console.info("LUNO TMDB catalog loaded",catalogItems.length);
  }catch(error){
    console.error("LUNO TMDB catalog failed",error);
    showCatalogMessage("Каталог пока недоступен. Перезапустите приложение позже.");
    showCoreStatus("Каталог офлайн");
  }

  try{
    const {initLunoCore}=await import("./source-engine.js");
    await Promise.race([
      initLunoCore(),
      new Promise((_,reject)=>window.setTimeout(()=>reject(new Error("LUNO Source Engine init timeout")),6500))
    ]);
    console.info("LUNO Source Engine ready");
    setSplashProgress(96,"Запускаем LUNO…");
  }catch(error){
    console.warn("LUNO Source Engine unavailable during startup:",error);
  }
  window.clearTimeout(splashSafetyTimer);
  finishSplash();
})();
