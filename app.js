const continueCards=document.querySelector("#continueCards");
const popularCards=document.querySelector("#popularCards");
const searchPanel=document.querySelector("#searchPanel");
const searchInput=document.querySelector("#searchInput");
const searchBox=document.querySelector(".search-box");
const player=document.querySelector("#player");

const CINEMETA_BASE="https://cinemeta-catalogs.strem.io/top";

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

function card(item){
  const title=item?.name || "Без названия";
  const poster=item?.poster;
  const meta=metaLine(item);
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
  const response=await fetch(`${CINEMETA_BASE}/catalog/${type}/top${suffix}.json`,{
    cache:"no-store",
    headers:{accept:"application/json"}
  });
  if(!response.ok) throw new Error(`Cinemeta ${type}: HTTP ${response.status}`);
  const data=await response.json();
  return Array.isArray(data?.metas)
    ? data.metas.map((item)=>normalizeItem(item,type))
    : [];
}

async function loadDirectCatalog(){
  const [movies,series]=await Promise.all([
    fetchCinemetaCatalog("movie"),
    fetchCinemetaCatalog("series")
  ]);
  return [...movies,...series];
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
  let coreReady=false;
  let directShown=false;

  // Do not make the UI wait for Core. Render the first usable catalog immediately.
  directCatalogPromise.then((items)=>{
    if(!directShown && renderItems(items)){
      directShown=true;
      prefetchPosters(items);
      showCoreStatus("LUNO • КАТАЛОГ ONLINE");
    }
  }).catch((error)=>console.warn("LUNO fast catalog failed",error));

  try{
    const {initLunoCore,loadBoard,onLunoState,getLunoModel}=await import("./core.js");

    await initLunoCore();
    coreReady=true;

    onLunoState(async(models)=>{
      try{
        if(models.includes("board")){
          const board=await getLunoModel("board");
          renderCoreCatalog(board);
        }
      }catch(error){
        console.error("LUNO Core state render failed",error);
      }
    });

    const state=await loadBoard();
    if(renderCoreCatalog(state)){
      console.info("LUNO catalog loaded through Core");
      return;
    }
  }catch(error){
    console.warn("LUNO Core catalog unavailable, using direct catalog fallback",error);
  }

  try{
    const items=await directCatalogPromise;
    if(!directShown && renderItems(items)){
      directShown=true;
      prefetchPosters(items);
      showCoreStatus(coreReady ? "LUNO • КАТАЛОГ ONLINE" : "LUNO • ONLINE");
      console.info("LUNO direct Cinemeta catalog loaded",items.length);
    }else{
      showCoreStatus("LUNO • КАТАЛОГ ПУСТ");
      showCatalogMessage("Каталог пока недоступен.");
    }
  }catch(error){
    console.error("LUNO catalog fallback failed",error);
    showCoreStatus("LUNO • ОШИБКА КАТАЛОГА");
    showCatalogMessage("Не удалось загрузить каталог. Попробуйте обновить страницу.");
  }
})();
