import tmdbCatalog from "./tmdb-catalog.generated.js";
const continueCards=document.querySelector("#continueCards");
const movieCards=document.querySelector("#movieCards");
const seriesCards=document.querySelector("#seriesCards");
const searchPanel=document.querySelector("#searchPanel");
const searchInput=document.querySelector("#searchInput");
const searchBox=document.querySelector(".search-box");
const player=document.querySelector("#player");
const detail=document.querySelector("#detail");
const detailPoster=document.querySelector("#detailPoster");
const detailTitle=document.querySelector("#detailTitle");
const detailMeta=document.querySelector("#detailMeta");
const detailDescription=document.querySelector("#detailDescription");
const detailPlay=document.querySelector("#detailPlay");
const continueSection=document.querySelector("#continueSection");
const moviesSection=document.querySelector("#moviesSection");
const seriesSection=document.querySelector("#seriesSection");
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

let currentItem=null;
let catalogItems=[];
let movieItems=[];
let seriesItems=[];
let movieVisible=18;
let seriesVisible=18;
let catalogLoading=false;
let resumeItems=[];
let favoriteItems=[];
let heroItem=null;

function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g,(char)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function metaLine(item){
  const year=String(item?.releaseInfo || "").match(/\d{4}/)?.[0] || "";
  const type=item?.type==="series" ? "Сериал" : "Фильм";
  return [year,type].filter(Boolean).join(" • ");
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
    genres:Array.isArray(item?.genres)?item.genres:[],
    imdbId:item?.imdbId || ""
  };
}

function card(item){
  const title=item?.name || "Без названия";
  const image=item?.poster || item?.background || "";
  const rating=Number(item?.rating)>0 ? "★ "+Number(item.rating).toFixed(1) : "";
  const meta=[metaLine(item),rating].filter(Boolean).join(" • ");
  const imageHtml=image
    ? '<img src="'+escapeHtml(image)+'" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer">'
    : '<span class="poster-fallback">◐</span>';
  return '<button class="card" data-id="'+escapeHtml(item?.id||"")+'" data-type="'+escapeHtml(item?.type||"movie")+'" data-title="'+escapeHtml(title)+'" aria-label="'+escapeHtml(title)+'">'+
    '<div class="card-art">'+imageHtml+'</div>'+
    '<div class="card-title">'+escapeHtml(title)+'</div>'+
    '<div class="card-meta">'+escapeHtml(meta)+'</div>'+
  '</button>';
}

function bindCards(){
  document.querySelectorAll(".card").forEach((c)=>{
    c.onclick=()=>{
      const item=window.__LUNO_ITEMS__?.get(c.dataset.id);
      if(item) openDetail(item);
    };
  });
}

function paintDetail(value){
  const title=value?.name || "Без названия";
  const image=value?.poster || value?.background || "";
  if(detailPoster){
    detailPoster.style.backgroundImage=image ? 'url("'+String(image).replace(/"/g,"&quot;")+'")' : "";
    detailPoster.classList.toggle("has-image",!!image);
  }
  if(detailTitle) detailTitle.textContent=title;
  if(detailMeta) detailMeta.textContent=[
    metaLine(value),
    Number(value?.rating)>0 ? "★ "+Number(value.rating).toFixed(1) : "",
    Array.isArray(value?.genres)&&value.genres.length ? value.genres.slice(0,3).join(" • ") : ""
  ].filter(Boolean).join(" • ");
  if(detailDescription) detailDescription.textContent=value?.description || "Описание пока недоступно.";
}

function isFavorite(id){
  return loadFavorites().some(item=>item.id===id);
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

function openDetail(item){
  currentItem=item;
  paintDetail(item);
  if(detailBackdrop) detailBackdrop.style.backgroundImage=item?.background ? 'url("'+String(item.background).replace(/"/g,"&quot;")+'")' : "";
  paintFavoriteButton(item);
  detail?.classList.remove("hidden");
  detailPlay?.focus();
}

function closeDetail(){
  detail?.classList.add("hidden");
  currentItem=null;
}

detailPlay?.addEventListener("click",()=>{
  if(currentItem) openPlayer(currentItem.id,currentItem.type,currentItem.name);
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

function navigate(section){
  document.querySelectorAll(".nav-item,.mobile-tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll('.nav-item[data-section="'+section+'"],.mobile-tab[data-section="'+section+'"]').forEach(x=>x.classList.add("active"));
  const target=section==="home" ? document.querySelector(".hero") : section==="movies" ? moviesSection : section==="series" ? seriesSection : continueSection;
  target?.scrollIntoView({behavior:"smooth",block:"start"});
}

function renderCatalogSections(){
  if(movieCards) movieCards.innerHTML=movieItems.slice(0,movieVisible).map(card).join("");
  if(seriesCards) seriesCards.innerHTML=seriesItems.slice(0,seriesVisible).map(card).join("");
  renderResume();
  renderFavorites();
  bindCards();
  const eyebrow=document.querySelector(".hero .eyebrow");
  if(eyebrow) eyebrow.textContent="LUNO • TMDB • РУССКИЙ КАТАЛОГ";
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
  movieItems=fromIds(sections.popularMovies,"movie");
  seriesItems=fromIds(sections.popularSeries,"series");

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
    new URL("/Luno/tmdb-catalog.json?v=5",window.location.origin).href
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

function showCoreStatus(message){
  const eyebrow=document.querySelector(".hero .eyebrow");
  if(eyebrow) eyebrow.textContent=message;
}

function showCatalogMessage(message){
  if(movieCards) movieCards.innerHTML='<div class="catalog-message">'+escapeHtml(message)+'</div>';
  if(seriesCards) seriesCards.innerHTML="";
}

function openPlayer(id,type,title){
  player.classList.remove("hidden");
  const heading=player.querySelector(".player-placeholder h2");
  const text=player.querySelector(".player-placeholder p");
  if(heading) heading.textContent=title || "LUNO Player";
  if(text) text.textContent=id
    ? "Карточка TMDB готова. Подключение stream через Stremio Core — следующий слой."
    : "Выберите фильм или сериал.";
  document.querySelector("#closePlayer")?.focus();
}

function closePlayer(){
  player.classList.add("hidden");
}

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
  return String(item?.releaseInfo||"").match(/\\d{4}/)?.[0] || "";
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
    const queryYear=q.match(/\\b(19\\d{2}|20\\d{2})\\b/)?.[1];
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
document.querySelector("#closePlayer").onclick=closePlayer;

document.querySelector("#searchBtn").onclick=()=>{
  searchPanel.classList.remove("hidden");
  searchInput.focus();
};

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

document.addEventListener("keydown",(e)=>{
  if(e.key==="Escape"){
    closePlayer();
    closeDetail();
    searchPanel.classList.add("hidden");
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
showCatalogMessage("Загружаем TMDB-каталог…");

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
    const catalog=await loadTmdbCatalog();
    renderItems(catalog.items,catalog.sections);
    prefetchPosters(catalogItems);
    showCoreStatus("LUNO • TMDB • РУССКИЙ КАТАЛОГ");
    console.info("LUNO TMDB catalog loaded",catalogItems.length);
  }catch(error){
    console.error("LUNO TMDB catalog failed",error);
    showCatalogMessage("Каталог TMDB пока недоступен. Перезапустите приложение позже.");
    showCoreStatus("LUNO • КАТАЛОГ OFFLINE");
  }

  try{
    const {initLunoCore}=await import("./core.js");
    await initLunoCore();
    console.info("LUNO Core ready");
  }catch(error){
    console.warn("LUNO Core unavailable",error);
  }
})();
