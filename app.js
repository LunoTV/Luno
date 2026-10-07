import { initLunoCore } from "./core.js";

const titles=["Интерстеллар","Дюна","Оппенгеймер","Начало","Марсианин","Гран Туризмо"];
const metas=["2014 • Фантастика","2021 • Фантастика","2023 • Драма","2010 • Триллер","2015 • Фантастика","2023 • Спорт"];
const card=(i)=>`<button class="card" data-title="${titles[i]}" aria-label="${titles[i]}"><div class="card-art">🌑</div><div class="card-title">${titles[i]}</div><div class="card-meta">${metas[i]}</div></button>`;

document.querySelector("#continueCards").innerHTML=[0,1,2,3,4,5].map(card).join("");
document.querySelector("#popularCards").innerHTML=[3,4,1,5,0,2].map(card).join("");

const player=document.querySelector("#player");
function openPlayer(){player.classList.remove("hidden");document.querySelector("#closePlayer").focus()}
function closePlayer(){player.classList.add("hidden")}
document.querySelector("#openDemo").onclick=openPlayer;
document.querySelector("#continueBtn").onclick=openPlayer;
document.querySelector("#closePlayer").onclick=closePlayer;
document.querySelectorAll(".card").forEach(c=>c.onclick=openPlayer);

const searchPanel=document.querySelector("#searchPanel"), searchInput=document.querySelector("#searchInput");
document.querySelector("#searchBtn").onclick=()=>{searchPanel.classList.remove("hidden");searchInput.focus()};
searchInput.addEventListener("keydown",e=>{
  if(e.key==="Escape"){searchPanel.classList.add("hidden")}
  if(e.key==="Enter"){searchPanel.classList.add("hidden")}
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closePlayer();searchPanel.classList.add("hidden")}
});

document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
}));

try {
  const core = initLunoCore();
  console.info("LUNO Core Web ready", core);
} catch (error) {
  console.error("LUNO Core Web failed to initialize", error);
}
