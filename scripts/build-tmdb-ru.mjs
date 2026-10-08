import { mkdir, writeFile } from "node:fs/promises";

const token = process.env.TMDB_API_TOKEN || "";
const bases = ["https://v3-cinemeta.strem.io","https://cinemeta-catalogs.strem.io/top"];
const out = {};

async function cinemeta(type){
  for (const base of bases){
    try{
      const r=await fetch(`${base}/catalog/${type}/top.json`,{headers:{accept:"application/json"}});
      if(!r.ok) continue;
      const j=await r.json();
      const items=Array.isArray(j?.metas)?j.metas:[];
      if(items.length) return items.filter(x=>String(x?.id||"").startsWith("tt")).slice(0,45);
    }catch{}
  }
  return [];
}

async function tmdb(imdbId){
  const r=await fetch("https://api.themoviedb.org/3/find/"+encodeURIComponent(imdbId)+"?external_source=imdb_id&language=ru-RU",{
    headers:{accept:"application/json",authorization:"Bearer "+token}
  });
  if(!r.ok) return null;
  const j=await r.json();
  return j.movie_results?.[0] || j.tv_results?.[0] || null;
}

if(token){
  for(const type of ["movie","series"]){
    const items=await cinemeta(type);
    for(let i=0;i<items.length;i+=8){
      const batch=items.slice(i,i+8);
      const values=await Promise.all(batch.map(async item=>{
        try{
          const t=await tmdb(item.id);
          if(!t) return null;
          return [item.id,{
            name:(type==="movie"?t.title:t.name)||item.name,
            description:t.overview||"",
            poster:t.poster_path?"https://image.tmdb.org/t/p/w500"+t.poster_path:(item.poster||""),
            background:t.backdrop_path?"https://image.tmdb.org/t/p/w1280"+t.backdrop_path:(item.background||""),
            releaseInfo:(type==="movie"?t.release_date:t.first_air_date)||item.releaseInfo||"",
            rating:Number(t.vote_average)||Number(item.imdbRating)||0
          }];
        }catch{return null}
      }));
      for(const pair of values.filter(Boolean)) out[pair[0]]=pair[1];
    }
  }
}

await mkdir("public", {recursive:true});
await writeFile("public/tmdb-ru.json",JSON.stringify({generatedAt:new Date().toISOString(),items:out},null,2));
console.log("LUNO Russian metadata:",Object.keys(out).length);
