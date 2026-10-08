const continueCards=document.querySelector("#continueCards");
const popularCards=document.querySelector("#popularCards");
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
let currentItem=null;
let catalogItems=[];
let movieVisible=18;
let seriesVisible=18;
let catalogLoading=false;
let resumeItems=[];

const CINEMETA_BASES=["https://v3-cinemeta.strem.io","https://cinemeta-catalogs.strem.io/top"];
const TMDB_BASE="https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE="https://image.tmdb.org/t/p";
const TMDB_API_TOKEN=window.__LUNO_TMDB_API_TOKEN__ || "";
const tmdbCache=new Map();
function tmdbHeaders(){ return TMDB_API_TOKEN ? {accept:"application/json",authorization:"Bearer "+TMDB_API_TOKEN} : {accept:"application/json"}; }
function tmdbImage(path,size="w500"){ return path ? TMDB_IMAGE_BASE+"/"+size+path : ""; }
async function tmdbFind(imdbId){
  if(!TMDB_API_TOKEN || !imdbId) return null;
  if(tmdbCache.has(imdbId)) return tmdbCache.get(imdbId);
  const key="luno-tmdb-"+imdbId;
  try{ const saved=localStorage.getItem(key); if(saved){ const value=JSON.parse(saved); tmdbCache.set(imdbId,value); return value; } }catch{}
  const response=await fetch(TMDB_BASE+"/find/"+encodeURIComponent(imdbId)+"?external_source=imdb_id&language=ru-RU",{headers:tmdbHeaders(),cache:"no-store"});
  if(!response.ok) throw new Error("TMDB HTTP "+response.status);
  const data=await response.json();
  const value=data.movie_results?.[0] || data.tv_results?.[0] || null;
  if(value){ try{localStorage.setItem(key,JSON.stringify(value));}catch{} }
  tmdbCache.set(imdbId,value);
  return value;
}
function applyTmdb(item,t){
  if(!t) return item;
  const movie=item.type==="movie";
  return {...item,name:(movie?t.title:t.name)||item.name,poster:tmdbImage(t.poster_path)||item.poster,background:tmdbImage(t.backdrop_path,"w1280")||item.background,description:t.overview||item.description||"",releaseInfo:(movie?t.release_date:t.first_air_date)||item.releaseInfo,rating:Number(t.vote_average)||item.rating,tmdbId:t.id||item.tmdbId};
}
async function hydrateWithTmdb(items){
  if(!TMDB_API_TOKEN) return items;
  const targets=items.filter(x=>x?.id?.startsWith("tt")).slice(0,24), enriched=[];
  for(let i=0;i<targets.length;i+=6){
    const batch=targets.slice(i,i+6);
    enriched.push(...await Promise.all(batch.map(async item=>{try{return applyTmdb(item,await tmdbFind(item.id));}catch(e){console.warn("LUNO TMDB item failed",item.id,e);return item;}})));
  }
  const map=new Map(enriched.map(x=>[x.id,x]));
  return items.map(x=>map.get(x.id)||x);
}
async function hydrateRenderedCards(items){
  if(!TMDB_API_TOKEN) return;
  const enriched=await hydrateWithTmdb(items);
  if(enriched.some((x,i)=>x.poster!==items[i]?.poster||x.name!==items[i]?.name)){ renderItems(enriched); prefetchPosters(enriched); }
}

function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g,(char)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function metaLine(item){
  const year=String(item?.releaseInfo || item?.released || "").match(/\d{4}/)?.[0] || "";
  const type=item?.type==="series" ? "Сериал" : item?.type==="movie" ? "Фильм" : item?.type || "";
  return [year,type].filter(Boolean).join(" • ");
}

function normalizeItem(item,type){
  return {
    ...item,
    id:item?.id || item?.imdb_id || item?.imdbId || "",
    type:item?.type || type,
    name:item?.name || "Без названия",
    poster:item?.poster || "",
    background:item?.background || "",
    releaseInfo:item?.releaseInfo || item?.released || ""
  };
}

function saveCatalogCache(items){
  try{ localStorage.setItem("luno-catalog-cache",JSON.stringify(items.slice(0,48))); }catch{}
}

function loadCatalogCache(){
  try{
    const saved=localStorage.getItem("luno-catalog-cache");
    const items=JSON.parse(saved||"[]");
    return Array.isArray(items) ? items : [];
  }catch{
    return [];
  }
}

function card(item){
  const title=item?.name || "Без названия";
  const poster=item?.poster || "";
  const background=item?.background || "";
  const image=poster || background;
  const rating=Number(item?.rating)>0 ? "★ "+Number(item.rating).toFixed(1) : "";
  const meta=[metaLine(item),rating].filter(Boolean).join(" • ");
  return '<button class="card" data-id="'+escapeHtml(item?.id || "")+'" data-type="'+escapeHtml(item?.type || "movie")+'" data-title="'+escapeHtml(title)+'" aria-label="'+escapeHtml(title)+'">'+
    '<div class="card-art">'+(image ? '<img src="'+escapeHtml(image)+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : "")+'</div>'+
    '<div class="card-title">'+escapeHtml(title)+'</div>'+
    '<div class="card-meta">'+escapeHtml(meta)+'</div>'+
  '</button>';
}
function bindCards(){
  document.querySelectorAll(".card").forEach((c)=>{
    c.onclick=()=>{
      const item=window.__LUNO_ITEMS__?.get(c.dataset.id);
      if(item) openDetail(item);
      else openPlayer(c.dataset.id,c.dataset.type,c.dataset.title);
    };
  });
}

async function openDetail(item){
  currentItem=item;
  const paint=(value)=>{
    const title=value?.name || "Без названия";
    const image=value?.poster || value?.background || "";
    if(detailPoster){
      detailPoster.style.backgroundImage=image ? `url("${String(image).replace(/"/g,"&quot;")}")` : "";
      detailPoster.classList.toggle("has-image",!!image);
    }
    if(detailTitle) detailTitle.textContent=title;
    if(detailMeta) detailMeta.textContent=[metaLine(value),Number(value?.rating)>0 ? "★ "+Number(value.rating).toFixed(1) : ""].filter(Boolean).join(" • ");
    if(detailDescription) detailDescription.textContent=value?.description || "Описание загружается…";
  };
  paint(item);
  detail?.classList.remove("hidden");
  detailPlay?.focus();

  if(item?.id && item?.type){
    try{
      const response=await fetch(`https://v3-cinemeta.strem.io/meta/${encodeURIComponent(item.type)}/${encodeURIComponent(item.id)}.json`,{cache:"no-store",headers:{accept:"application/json"}});
      if(response.ok){
        const data=await response.json();
        const meta=data?.meta || data;
        if(meta){
          const full=normalizeItem({...item,...meta},item.type);
          currentItem=full;
          paint(full);
        }
      }
    }catch(error){ console.warn("LUNO meta load failed",item.id,error); }
  }

  if(detailDescription && (!currentItem?.description)){
    detailDescription.textContent="Описание пока недоступно.";
  }
}

function closeDetail(){
  detail?.classList.add("hidden");
  currentItem=null;
}

detailPlay?.addEventListener("click",()=>{
  if(currentItem) openPlayer(currentItem.id,currentItem.type,currentItem.name);
});
document.querySelector("#closeDetail")?.addEventListener("click",closeDetail);

function extractItems(state){
  const catalogs=Array.isArray(state?.catalogs) ? state.catalogs : [];
  return catalogs.flatMap((catalog)=>{
    const content=catalog?.content;
    if(!content || content.type!=="Ready") return [];
    return Array.isArray(content.value) ? content.value : [];
  });
}

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
  if(!resumeItems.length){ continueSection.classList.add("resume-empty"); continueCards.innerHTML=""; return; }
  continueSection.classList.remove("resume-empty");
  continueCards.innerHTML=resumeItems.slice(0,12).map(card).join("");
  bindCards();
}
function navigate(section){
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
  document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add("active");
  const target=section==="home" ? document.querySelector(".hero") : section==="movies" ? moviesSection : section==="series" ? seriesSection : continueSection;
  target?.scrollIntoView({behavior:"smooth",block:"start"});
}

function renderCatalogSections(){
  const unique=catalogItems;
  const movies=unique.filter((item)=>item.type==="movie");
  const series=unique.filter((item)=>item.type==="series");
  const movieList=movies.length ? movies : unique;
  const seriesList=series.length ? series : unique;
  if(movieCards) movieCards.innerHTML=movieList.slice(0,movieVisible).map(card).join("");
  if(seriesCards) seriesCards.innerHTML=seriesList.slice(0,seriesVisible).map(card).join("");
  renderResume();
  bindCards();
  document.querySelector(".hero .eyebrow").textContent="LUNO • КАТАЛОГ ONLINE";
}

function renderItems(items){
  const unique=[...new Map(items.filter((x)=>x?.id).map((item)=>[item.id,item])).values()];
  if(!unique.length) return false;
  catalogItems=unique;
  window.__LUNO_ITEMS__=new Map(unique.map(item=>[item.id,item]));
  renderCatalogSections();
  return true;
}

async function loadCatalogSeed(){
  try{
    const response=await fetch("./catalog-seed.json?v=1",{cache:"no-store"});
    if(!response.ok) return [];
    const data=await response.json();
    return Array.isArray(data?.items) ? data.items.map((item)=>normalizeItem(item,item?.type||"movie")) : [];
  }catch(error){
    console.warn("LUNO local catalog seed unavailable",error);
    return [];
  }
}

async function loadMoreCatalog(){
  if(catalogLoading) return;
  const movies=catalogItems.filter(x=>x.type==="movie");
  const series=catalogItems.filter(x=>x.type==="series");
  const needMovie=movieVisible>=movies.length;
  const needSeries=seriesVisible>=series.length;
  if(needMovie||needSeries){
    catalogLoading=true;
    try{
      const requests=[];
      if(needMovie) requests.push(fetchCinemetaCatalog("movie","skip="+movies.length).catch(()=>[]));
      if(needSeries) requests.push(fetchCinemetaCatalog("series","skip="+series.length).catch(()=>[]));
      const batches=await Promise.all(requests);
      const merged=[...catalogItems,...batches.flat()];
      const unique=[...new Map(merged.filter(x=>x?.id).map(x=>[x.id,x])).values()];
      if(unique.length>catalogItems.length){
        catalogItems=unique;
        window.__LUNO_ITEMS__=new Map(unique.map(item=>[item.id,item]));
      }
    }finally{ catalogLoading=false; }
  }
  movieVisible+=18;
  seriesVisible+=18;
  renderCatalogSections();
}

function renderCoreCatalog(state){
  return renderItems(extractItems(state));
}

async function fetchCinemetaCatalog(type,extra=""){
  const suffix=extra ? `/${extra}` : "";
  let lastError=null;

  for(const base of CINEMETA_BASES){
    try{
      const response=await fetch(`${base}/catalog/${type}/top${suffix}.json`,{
        cache:"no-store",
        headers:{accept:"application/json"}
      });
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      const items=Array.isArray(data?.metas)
        ? data.metas.map((item)=>normalizeItem(item,type))
        : [];
      if(items.length) return items;
      throw new Error("empty catalog");
    }catch(error){
      lastError=error;
      console.warn("LUNO Cinemeta endpoint failed",base,type,error);
    }
  }

  throw new Error(`Cinemeta ${type}: ${lastError?.message || "request failed"}`);
}

async function loadDirectCatalog(){
  const results=await Promise.allSettled([
    fetchCinemetaCatalog("movie"),
    fetchCinemetaCatalog("series")
  ]);

  const movies=results[0].status==="fulfilled" ? results[0].value : [];
  const series=results[1].status==="fulfilled" ? results[1].value : [];

  if(!movies.length && !series.length){
    throw new Error(
      results.map((result)=>result.status==="rejected" ? result.reason?.message || "catalog request failed" : "").filter(Boolean).join("; ")
      || "empty catalog"
    );
  }

  const items=[...movies,...series];
  saveCatalogCache(items);
  return items;
}

async function loadDirectSearch(query){
  const extra=`search=${encodeURIComponent(query)}`;
  const [movies,series]=await Promise.all([
    fetchCinemetaCatalog("movie",extra),
    fetchCinemetaCatalog("series",extra)
  ]);
  return [...movies,...series];
}

async function loadRussianMetadata(items){
  try{
    const response=await fetch("./tmdb-ru.json?v=ru1",{cache:"no-store"});
    if(!response.ok) return items;
    const data=await response.json();
    const map=data?.items||{};
    return items.map(item=>{
      const ru=map[item.id];
      return ru ? {...item,...ru} : item;
    });
  }catch(error){
    console.warn("LUNO Russian metadata unavailable",error);
    return items;
  }
}

function showCoreStatus(message){
  const eyebrow=document.querySelector(".hero .eyebrow");
  if(eyebrow) eyebrow.textContent=message;
}

function showCatalogMessage(message){
  continueCards.innerHTML=`<div class="catalog-message">${escapeHtml(message)}</div>`;
  popularCards.innerHTML="";
}

function openPlayer(id,type,title){
  player.classList.remove("hidden");
  const heading=player.querySelector(".player-placeholder h2");
  const text=player.querySelector(".player-placeholder p");
  if(heading) heading.textContent=title || "LUNO Player";
  if(text) text.textContent=id
    ? "Метаданные подключены. Следующий слой — получение stream и запуск видео."
    : "Выберите фильм или сериал.";

  document.querySelector("#closePlayer").focus();
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
    ? `<div class="search-results-title">Результаты для «${escapeHtml(query)}»</div><div class="search-results-grid">${items.slice(0,24).map(card).join("")}</div>`
    : `<div class="search-empty">Ничего не найдено</div>`;

  bindCards();
}

document.querySelector("#openDemo").onclick=()=>document.querySelector("#continueCards")?.scrollIntoView({behavior:"smooth",block:"start"});
document.querySelector("#continueBtn").onclick=()=>document.querySelector("#continueCards")?.scrollIntoView({behavior:"smooth",block:"start"});
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
      const items=await loadDirectSearch(query);
      showSearchResults(items,query);
    }catch(error){
      console.error("LUNO search failed",error);
      showCoreStatus("LUNO • ПОИСК НЕДОСТУПЕН");
    }
  },300);
});

searchInput.addEventListener("keydown",(e)=>{
  if(e.key==="Escape") searchPanel.classList.add("hidden");
});

document.addEventListener("keydown",(e)=>{
  if(e.key==="Escape"){
    closePlayer();
    closeDetail();
    searchPanel.classList.add("hidden");
  }
});

document.querySelectorAll(".nav-item").forEach((btn)=>btn.addEventListener("click",()=>navigate(btn.dataset.section)));
document.querySelectorAll(".nav-item").forEach((btn,index,buttons)=>btn.addEventListener("keydown",(e)=>{
  if(e.key!=="ArrowRight" && e.key!=="ArrowLeft") return;
  e.preventDefault();
  const next=e.key==="ArrowRight" ? (index+1)%buttons.length : (index-1+buttons.length)%buttons.length;
  buttons[next].focus();
  navigate(buttons[next].dataset.section);
}));

window.LUNOPlayback={
  start(item){ if(item?.id) saveResume(item,0,0); },
  progress(item,position,duration){ if(item?.id && Number(duration)>0 && Number(position)>5) saveResume(item,position,duration); },
  finish(item){ if(!item?.id) return; const list=loadResume().filter(x=>x.id!==item.id); try{localStorage.setItem("luno-resume",JSON.stringify(list));}catch{} renderResume(); }
};

renderResume();
showCatalogMessage("Загружаем каталог LUNO…");

const catalogSentinel=document.querySelector("#catalogSentinel");
if(catalogSentinel && "IntersectionObserver" in window){
  const observer=new IntersectionObserver((entries)=>{
    if(entries.some(entry=>entry.isIntersecting)) loadMoreCatalog();
  },{rootMargin:"900px 0px"});
  observer.observe(catalogSentinel);
}

// Start the live catalog in the background. The local build seed is the TV-safe first paint.
const directCatalogPromise=loadDirectCatalog().catch(()=>[]);

function prefetchPosters(items){
  items.slice(0,24).forEach((item)=>{
    if(item?.poster){
      const image=new Image();
      image.decoding="async";
      image.src=item.poster;
    }
  });
}

(async()=>{
  // TV-safe: paint the bundled seed first, then replace it with the live catalog if available.
  try{
    let seed=loadCatalogCache();
    if(!seed.length) seed=await loadCatalogSeed();
    seed=await loadRussianMetadata(seed);
    if(renderItems(seed)){
      prefetchPosters(seed);
      showCoreStatus("LUNO • КАТАЛОГ ONLINE");
      console.info("LUNO TV-safe seed loaded",seed.length);
    }
  }catch(error){ console.warn("LUNO seed load failed",error); }

  try{
    const live=await Promise.race([
      directCatalogPromise,
      new Promise(resolve=>setTimeout(()=>resolve([]),7000))
    ]);
    if(live?.length){
      const items=await loadRussianMetadata(live);
      renderItems(items);
      prefetchPosters(items);
      showCoreStatus("LUNO • КАТАЛОГ ONLINE");
      console.info("LUNO live catalog loaded",items.length);
    }
  }catch(error){ console.warn("LUNO live catalog failed",error); }

  try{
    const {initLunoCore}=await import("./core.js");
    await initLunoCore();
    console.info("LUNO Core ready");
  }catch(error){ console.warn("LUNO Core unavailable",error); }
})();
