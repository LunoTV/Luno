(() => {
  "use strict";
  const API="https://api.themoviedb.org/3";
  const IMG="https://image.tmdb.org/t/p/w500";
  const KEY="4ef0d7355d9ffb5151e987764708ce96";
  const app=document.getElementById("app");

  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const title=x=>x.title||x.name||"Без названия";
  const year=x=>(x.release_date||x.first_air_date||"").slice(0,4);
  const poster=x=>x.poster_path?IMG+x.poster_path:"";

  function card(x){
    const p=poster(x);
    return '<button class="card" data-id="'+esc(x.id)+'" data-type="'+esc(x.media_type||"movie")+'">'+
      '<div class="poster">'+(p?'<img loading="lazy" src="'+esc(p)+'" alt="">':'<span class="placeholder">'+esc(title(x).slice(0,1))+'</span>')+'</div>'+
      '<div class="meta"><div class="title">'+esc(title(x))+'</div><div class="sub">'+esc(year(x))+(x.vote_average?' · ★ '+Number(x.vote_average).toFixed(1):"")+'</div></div></button>';
  }

  async function tmdb(path){
    const url=new URL(API+path);
    url.searchParams.set("api_key",KEY);
    url.searchParams.set("language","ru-RU");
    const r=await fetch(url,{headers:{accept:"application/json"}});
    if(!r.ok)throw new Error("TMDB "+r.status);
    return r.json();
  }

  async function load(){
    app.innerHTML='<div class="shell"><header class="top"><div class="logo">LUNO</div><button aria-label="Поиск">⌕</button></header><main><section class="section"><div class="state">Загружаем каталог…</div></section></main></div>';
    const sections=[
      ["В тренде","Популярное прямо сейчас","/trending/all/week"],
      ["Новинки","Свежие релизы","/movie/now_playing"],
      ["Лучшие фильмы","Высокие оценки","/movie/top_rated"]
    ];
    try{
      const data=await Promise.all(sections.map(s=>tmdb(s[2])));
      app.querySelector("main").innerHTML=data.map((d,i)=>{
        const items=(d.results||[]).filter(x=>x.poster_path||title(x)).slice(0,20);
        return '<section class="section"><div class="section-head"><span class="eyebrow">LUNO</span><h2>'+sections[i][0]+'</h2><p>'+sections[i][1]+'</p></div><div class="row">'+items.map(card).join("")+'</div></section>';
      }).join("");
      app.querySelectorAll(".card").forEach(b=>b.addEventListener("click",()=>console.log("LUNO card",b.dataset.id,b.dataset.type)));
    }catch(e){
      console.error(e);
      app.querySelector("main").innerHTML='<div class="state">Каталог временно недоступен.</div>';
    }
  }

  load();
})();
