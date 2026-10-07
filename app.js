const continueCards=document.querySelector("#continueCards");
const popularCards=document.querySelector("#popularCards");
const searchPanel=document.querySelector("#searchPanel");
const searchInput=document.querySelector("#searchInput");
const searchBox=document.querySelector(".search-box");
const player=document.querySelector("#player");

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
  const poster=item?.poster;
  const rating=Number(item?.rating)>0 ? "★ "+Number(item.rating).toFixed(1) : "";
  const meta=[metaLine(item),rating].filter(Boolean).join(" • ");
  return `<button class="card" data-id="${escapeHtml(item?.id || "")}" data-type="${escapeHtml(item?.type || "movie")}" data-title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
    <div class="card-art"${poster ? ` style="background-image:url('${escapeHtml(poster)}')"` : ""}>${poster ? "" : "🌑"}</div>
    <div class="card-title">${escapeHtml(title)}</div>
    <div class="card-meta">${escapeHtml(meta)}</div>
  </button>`;
}

function bindCards(){
  document.querySelectorAll(".card").forEach((c)=>{
    c.onclick=()=>openPlayer(c.dataset.id,c.dataset.type,c.dataset.title);
  });
}

function extractItems(state){
  const catalogs=Array.isArray(state?.catalogs) ? state.catalogs : [];
  return catalogs.flatMap((catalog)=>{
    const content=catalog?.content;
    if(!content || content.type!=="Ready") return [];
    return Array.isArray(content.value) ? content.value : [];
  });
}

function renderItems(items){
  const unique=[...new Map(items.filter((x)=>x?.id).map((item)=>[item.id,item])).values()];
  if(!unique.length) return false;

  const movies=unique.filter((item)=>item.type==="movie");
  const series=unique.filter((item)=>item.type==="series");

  continueCards.innerHTML=(movies.length ? movies : unique).slice(0,6).map(card).join("");
  popularCards.innerHTML=(series.length ? series : unique).slice(0,6).map(card).join("");
  bindCards();

  document.querySelector(".hero .eyebrow").textContent="LUNO • КАТАЛОГ ONLINE";
  return true;
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
    searchPanel.classList.add("hidden");
  }
});

document.querySelectorAll(".nav-item").forEach((btn)=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item").forEach((x)=>x.classList.remove("active"));
  btn.classList.add("active");
}));

showCatalogMessage("Загружаем каталог LUNO…");

// Start the fast browser catalog immediately; Core can finish in parallel.
const directCatalogPromise=loadDirectCatalog();

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
  // LUNO UI catalog is authoritative from the direct browser catalog.
  // Stremio Core stays initialized as the runtime foundation and must never
  // replace visible cards with an empty/intermediate board state.
  try{
    const items=await directCatalogPromise;
    if(renderItems(items)){
      directShown=true;
      prefetchPosters(items);
      showCoreStatus("LUNO • КАТАЛОГ ONLINE");
      console.info("LUNO direct Cinemeta catalog loaded",items.length);
      return;
    }
  }catch(error){
    console.warn("LUNO live catalog failed",error);
  }

  const cached=loadCatalogCache();
  if(renderItems(cached)){
    directShown=true;
    prefetchPosters(cached);
    showCoreStatus("LUNO • КАТАЛОГ ONLINE");
    console.info("LUNO cached catalog loaded",cached.length);
  }else{
    showCoreStatus("LUNO • КАТАЛОГ ОЖИДАЕТ СЕТЬ");
    showCatalogMessage("Подключаем каталог…");
  }

  // Core is initialized in parallel, but its board state is not allowed
  // to overwrite the LUNO catalog UI.
  try{
    const {initLunoCore}=await import("./core.js");
    await initLunoCore();
    console.info("LUNO Core ready");
  }catch(error){
    console.warn("LUNO Core unavailable",error);
  }
})();
