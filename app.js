const continueCards=document.querySelector("#continueCards");
const popularCards=document.querySelector("#popularCards");
const searchPanel=document.querySelector("#searchPanel");
const searchInput=document.querySelector("#searchInput");
const searchBox=document.querySelector(".search-box");
const player=document.querySelector("#player");

function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g,(char)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function metaLine(item){
  const year=item?.releaseInfo?.match?.(/\d{4}/)?.[0] || item?.released?.slice?.(0,4) || "";
  const type=item?.type==="series" ? "Сериал" : item?.type==="movie" ? "Фильм" : item?.type || "";
  return [year,type].filter(Boolean).join(" • ");
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

function setCardsLoading(){
  const skeleton=Array.from({length:6},()=>'<div class="card card-loading"><div class="card-art"></div><div class="card-title">Загрузка…</div><div class="card-meta">LUNO Core</div></div>').join("");
  continueCards.innerHTML=skeleton;
  popularCards.innerHTML=skeleton;
}

function extractItems(state){
  const catalogs=Array.isArray(state?.catalogs) ? state.catalogs : [];
  return catalogs.flatMap((catalog)=>{
    const content=catalog?.content;
    if(!content || content.type!=="Ready") return [];
    return Array.isArray(content.value) ? content.value : [];
  });
}

function renderRealCatalog(state){
  const items=extractItems(state);
  if(!items.length) return false;

  const unique=[...new Map(items.map((item)=>[item.id,item])).values()];
  const movies=unique.filter((item)=>item.type==="movie");
  const series=unique.filter((item)=>item.type==="series");

  continueCards.innerHTML=(movies.length ? movies : unique).slice(0,6).map(card).join("");
  popularCards.innerHTML=(series.length ? series : unique).slice(0,6).map(card).join("");
  bindCards();

  document.querySelector(".hero .eyebrow").textContent="LUNO • CORE ONLINE";
  return true;
}

function showCoreStatus(message){
  const eyebrow=document.querySelector(".hero .eyebrow");
  if(eyebrow) eyebrow.textContent=message;
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

function showSearchResults(state,query){
  const items=extractItems(state);
  const results=items.slice(0,24);
  let resultBox=document.querySelector("#searchResults");

  if(!resultBox){
    resultBox=document.createElement("div");
    resultBox.id="searchResults";
    resultBox.className="search-results";
    searchBox.appendChild(resultBox);
  }

  resultBox.innerHTML=results.length
    ? `<div class="search-results-title">Результаты для «${escapeHtml(query)}»</div><div class="search-results-grid">${results.map(card).join("")}</div>`
    : `<div class="search-empty">Ничего не найдено</div>`;

  bindCards();
}

document.querySelector("#openDemo").onclick=()=>openPlayer("","movie","LUNO");
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
      const { searchLuno }=await import("./core.js");
      const state=await searchLuno(query);
      showSearchResults(state,query);
    }catch(error){
      console.error("LUNO search failed",error);
      showCoreStatus("LUNO • ПОИСК НЕДОСТУПЕН");
    }
  },350);
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

setCardsLoading();

(async()=>{
  try{
    const { initLunoCore, loadBoard, onLunoState, getLunoModel }=await import("./core.js");

    await initLunoCore();

    // Subscribe before loading so asynchronous Core state changes cannot be missed.
    onLunoState(async(models)=>{
      try{
        if(models.includes("board")){
          const board=await getLunoModel("board");
          if(renderRealCatalog(board)) return;
        }
        if(models.includes("search") && searchInput.value.trim()){
          showSearchResults(await getLunoModel("search"),searchInput.value.trim());
        }
      }catch(error){
        console.error("LUNO state render failed",error);
      }
    });

    const state=await loadBoard();

    if(!renderRealCatalog(state)){
      showCoreStatus("LUNO • ЗАГРУЗКА КАТАЛОГА");
      // One more read after the addon/catalog requests have had time to finish.
      setTimeout(async()=>{
        try{
          const latest=await getLunoModel("board");
          if(!renderRealCatalog(latest)) showCoreStatus("LUNO • КАТАЛОГ НЕ ЗАГРУЖЕН");
        }catch(error){
          console.error("LUNO board refresh failed",error);
        }
      },1200);
    }

    console.info("LUNO Core connected");
  }catch(error){
    console.error("LUNO Core/catalog initialization failed",error);
    showCoreStatus("LUNO • CORE ERROR");
  }
})();
