import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.TMDB_API_TOKEN || "";
const bases = ["https://v3-cinemeta.strem.io","https://cinemeta-catalogs.strem.io/top"];
const ru = {};
const seed = new Map();

async function cinemeta(type, skip=0){
  for(const base of bases){
    try{
      const extra=skip>0 ? `/skip=${skip}` : "";
      const r=await fetch(`${base}/catalog/${type}/top${extra}.json`,{headers:{accept:"application/json"}});
      if(!r.ok) continue;
      const j=await r.json();
      const items=Array.isArray(j?.metas)?j.metas:[];
      if(items.length) return items.filter(x=>String(x?.id||"").startsWith("tt"));
    }catch{}
  }
  return [];
}

async function collectCatalog(type){
  const pages=await Promise.all(Array.from({length:10},(_,i)=>cinemeta(type,i*100)));
  const unique=new Map();
  for(const page of pages){
    for(const item of page){
      if(item?.id && !unique.has(item.id)){
        unique.set(item.id,{
          ...item,
          type:item.type||type,
          id:item.id||item.imdb_id||""
        });
      }
    }
  }
  return [...unique.values()];
}

async function tmdb(imdbId){
  const r=await fetch("https://api.themoviedb.org/3/find/"+encodeURIComponent(imdbId)+"?external_source=imdb_id&language=ru-RU",{
    headers:{accept:"application/json",authorization:"Bearer "+token}
  });
  if(!r.ok) return null;
  const j=await r.json();
  return j.movie_results?.[0] || j.tv_results?.[0] || null;
}

const all=[];
for(const type of ["movie","series"]){
  const items=await collectCatalog(type);
  all.push(...items);
  for(const item of items.slice(0,90)){
    if(!token) break;
    try{
      const t=await tmdb(item.id);
      if(!t) continue;
      ru[item.id]={
        name:(type==="movie"?t.title:t.name)||item.name,
        description:t.overview||item.description||"",
        poster:t.poster_path?"https://image.tmdb.org/t/p/w500"+t.poster_path:(item.poster||""),
        background:t.backdrop_path?"https://image.tmdb.org/t/p/w1280"+t.backdrop_path:(item.background||""),
        releaseInfo:(type==="movie"?t.release_date:t.first_air_date)||item.releaseInfo||"",
        rating:Number(t.vote_average)||Number(item.imdbRating)||0
      };
    }catch{}
  }
}

for(const item of all){
  seed.set(item.id,item);
}

await mkdir("public",{recursive:true});
await writeFile("public/catalog-seed.json",JSON.stringify({
  generatedAt:new Date().toISOString(),
  items:[...seed.values()]
},null,2));
await writeFile("public/tmdb-ru.json",JSON.stringify({
  generatedAt:new Date().toISOString(),
  items:ru
},null,2));

console.log("LUNO catalog seed:",seed.size);
console.log("LUNO Russian metadata:",Object.keys(ru).length);
