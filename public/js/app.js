(() => {
"use strict";
const app=document.getElementById("app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const title=x=>x.title||x.name||"Без названия";
const year=x=>(x.release_date||x.first_air_date||"").slice(0,4);
const img=(x)=>{try{return window.LunoLampaRuntime?.image(x.poster_path,"w500")||""}catch(_){return""}};
const card=x=>'<button class="card" data-id="'+esc(x.id)+'" data-type="'+esc(x.type||x.media_type||"movie")+'"><div class="poster">'+(img(x)?'<img loading="lazy" src="'+esc(img(x))+'" alt="">':'<span class="placeholder">'+esc(title(x).slice(0,1))+'</span>')+'</div><div class="meta"><div class="title">'+esc(title(x))+'</div><div class="sub">'+esc(year(x))+(x.vote_average?' · ★ '+Number(x.vote_average).toFixed(1):"")+'</div></div></button>';
const shell=()=>'<div class="shell"><header class="top"><div class="logo">LUNO</div><button>⌕</button></header><main><section class="section"><div class="state">Lampa Runtime…</div></section></main><nav class="nav"><span class="active"><b>⌂</b>Главная</span><span><b>▦</b>Каталог</span><span><b>□</b>Фильмы</span><span><b>≋</b>Сериалы</span><span><b>◷</b>История</span></nav></div>';
function groupsFromMain(data){
  const out=[];
  if(Array.isArray(data)) data.forEach((g,i)=>{const items=g?.results||g?.items||g?.collection||g; if(Array.isArray(items)&&items.length)out.push({name:g?.title||g?.name||["В тренде","Новинки","Популярное","Лучшее"][i]||"LUNO",items});});
  else if(data&&typeof data==="object"){
    Object.entries(data).forEach(([k,v])=>{const items=v?.results||v?.items||v; if(Array.isArray(items)&&items.length)out.push({name:k,items});});
  }
  return out;
}
async function load(){
 app.innerHTML=shell();
 const runtime=window.LunoLampaRuntime;
 if(!runtime)throw new Error("Lampa runtime not ready");
 const data=await runtime.main({});
 let groups=groupsFromMain(data);
 if(!groups.length){
   const methods=["trending/movie/week","movie/now_playing","movie/popular","movie/top_rated"];
   const names=["В тренде","Новинки","Популярное","Лучшие фильмы"];
   groups=[];
   for(let i=0;i<methods.length;i++){try{const d=await runtime.get(methods[i]);if(d?.results?.length)groups.push({name:names[i],items:d.results})}catch(e){console.warn(e)}}
 }
 if(!groups.length)throw new Error("Lampa catalog empty");
 app.querySelector("main").innerHTML=groups.slice(0,6).map(g=>'<section class="section"><div class="section-head"><span class="eyebrow">LUNO / LAMPA</span><h2>'+esc(g.name)+'</h2><p>Каталог через Lampa Runtime</p></div><div class="row">'+g.items.slice(0,20).map(card).join("")+'</div></section>').join("");
}
load().catch(e=>{console.error("[LUNO]",e);app.innerHTML=shell();app.querySelector("main").innerHTML='<div class="state">Lampa Runtime не вернул каталог.</div>'});
})();