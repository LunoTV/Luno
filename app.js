import { initLunoCore, loadBoard, searchLuno, onLunoState } from "./core.js";

const demoTitles=["Интерстеллар","Дюна","Оппенгеймер","Начало","Марсианин","Гран Туризмо"];
const demoMetas=["2014 • Фантастика","2021 • Фантастика","2023 • Драма","2010 • Триллер","2015 • Фантастика","2023 • Спорт"];

const continueCards=document.querySelector("#continueCards");
const popularCards=document.querySelector("#popularCards");
const searchPanel=document.querySelector("#searchPanel");
const searchInput=document.querySelector("#searchInput");
const searchBox=document.querySelector(".search-box");

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

function card(item, index=0){
  const title=item?.name || demoTitles[index % demoTitles.length];
  const poster=item?.poster;
  const meta=metaLine(item) || demoMetas[index % demoMetas.length];
  return `<button class="card" data-id="${escapeHtml(item?.id || "")}" data-type="${escapeHtml(item?.type || "movie")}" data-title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
    <div class="card-art"${poster ? ` style="background-image:url("${escapeHtml(poster)}")"` : ""}>${poster ? "" : "🌑"}</div>
    <div class="card-title">${escapeHtml(title)}</div>
    <div class="card-meta">${escapeHtml(meta)}</div>
  </button>`;
}

function renderDemo(){
  continueCards.innerHTML=[0,1,2,3,4,5].map((i)=>card(null,i)).join("");
  popularCards.innerHTML=[3,4,1,5,0,2].map((i)=>card(null,i)).join("");
  bindCards();
}

function extractItems(state){
  const catalogs=Array.isArray(state?.catalogs) ? state.catalogs : [];
  return catalogs.flatMap((catalog)=> {
    const content=catalog?.content;
    if (!content || content.type !== "Ready") return [];
    return Array.isArray(content.value) ? content.value : [];
  });
}

function renderRealCatalog(state){
  const items=extractItems(state);
  if (!items.length) return false;

  const unique=[...new Map(items.map((item)=>[item.id,item])).values()];
  const movies=unique.filter((item)=>item.type==="movie");
  const series=unique.filter((item)=>item.type==="series");
  const first=movies.length ? movies : unique;
  const second=series.length ? series : unique.slice(Math.ceil(unique.length/2));

  continueCards.innerHTML=first.slice(0,6).map(card).join("");
  popularCards.innerHTML=second.slice(0,6).map(card).join("");
  bindCards();
  document.querySelector(".hero .eyebrow").textContent="LUNO • CORE ONLINE";
  return true;
}

function bindCards(){
  document.querySelectorAll(".card").forEach((c)=>{
    c.onclick=()=>openPlayer(c.dataset.id,c.dataset.type,c.dataset.title);
  });
}

const player=document.querySelector("#player");
function openPlayer(id,type,title){
  player.classList.remove("hidden");
  const heading=player.querySelector(".player-placeholder h2");
  const text=player.querySelector(".player-placeholder p");
  if(heading) heading.textContent=title || "LUNO Player";
  if(text) text.textContent=id
    ? "Метаданные подключены. Следующий слой — получение stream и запуск видео."
    : "Демо-режим LUNO.";
  document.querySelector("#closePlayer").focus();
}
function closePlayer(){player.classList.add("hidden")}

document.querySelector("#openDemo").onclick=()=>openPlayer("","movie","Интерстеллар");
document.querySelector("#continueBtn").onclick=()=>openPlayer("","movie","Продолжить просмотр");
document.querySelector("#closePlayer").onclick=closePlayer;

function showSearchResults(state, query){
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

document.querySelector("#searchBtn").onclick=()=>{
  searchPanel.classList.remove("hidden");
  searchInput.focus();
};

let searchTimer=null;
searchInput.addEventListener("input",()=>{
  clearTimeout(searchTimer);
  const query=searchInput.value.trim();
  if(!query) {
    document.querySelector("#searchResults")?.remove();
    return;
  }
  searchTimer=setTimeout(async()=>{
    try{
      const state=await searchLuno(query);
      showSearchResults(state,query);
    }catch(error){
      console.error("LUNO search failed",error);
    }
  },350);
});
searchInput.addEventListener("keydown",(e)=>{
  if(e.key==="Escape") searchPanel.classList.add("hidden");
  if(e.key==="Enter") searchPanel.classList.remove("hidden");
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

renderDemo();

(async()=>{
  try{
    await initLunoCore();
    const state=await loadBoard();
    renderRealCatalog(state);
    onLunoState(async(models)=>{
      if(models.includes("board")){
        const next=await import("./core.js").then((m)=>m.getLunoModel("board"));
        renderRealCatalog(next);
      }
      if(models.includes("search") && searchInput.value.trim()){
        const query=searchInput.value.trim();
        const next=await import("./core.js").then((m)=>m.getLunoModel("search"));
        showSearchResults(next,query);
      }
    });
    console.info("LUNO Core connected • real catalog model loaded");
  }catch(error){
    console.error("LUNO Core/catalog initialization failed",error);
  }
})();
