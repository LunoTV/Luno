export function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g,(char)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

export function mediaCategory(item){
  const ids=new Set((item?.genreIds||[]).map(Number));
  const genres=(item?.genres||[]).map(x=>String(x).toLocaleLowerCase("ru-RU"));
  const animated=ids.has(16) || genres.includes("анимация");
  const japanese=item?.originalLanguage==="ja" || (item?.originCountry||[]).includes("JP");
  const show=ids.has(10764)||ids.has(10767)||ids.has(10763)||ids.has(10766) ||
    genres.some(x=>["реалити-шоу","ток-шоу","новости","мыльная опера"].includes(x));
  if(animated && japanese) return "anime";
  if(animated) return "cartoons";
  if(item?.type==="series" && show) return "shows";
  if(item?.type==="series") return "series";
  return "movies";
}
export function categoryLabel(item){
  return ({movies:"Фильм",series:"Сериал",cartoons:"Мультфильм",anime:"Аниме",shows:"Шоу"})[mediaCategory(item)] || "Контент";
}

export function normalizeImageValue(value,size){
  const raw=String(value||"").trim();
  if(!raw) return "";
  if(/^https?:\/\//i.test(raw)) return raw;
  if(raw.startsWith("./") || raw.startsWith("../")) return raw;
  if(raw.startsWith("data:")) return raw;
  if(raw.startsWith("/")) return "https://image.tmdb.org/t/p/"+size+raw;
  return raw;
}

export function normalizeItem(item){
  // Use TMDB artwork only. Ignore LUNO's cached/custom poster fields.
  const posterValue=String(item?.poster||"").trim();
  const posterPath=item?.poster_path || item?.posterPath || "";
  const tmdbPoster=posterPath
    ? "https://image.tmdb.org/t/p/w500/"+String(posterPath).replace(/^\//,"")
    : (isDirectTmdbImage(posterValue) ? posterValue : "");
  const backgroundValue=String(item?.background||"");
  const background=normalizeImageValue(backgroundValue,"w1280") ||
    (item?.backdrop_path ? "https://image.tmdb.org/t/p/w1280/"+String(item.backdrop_path).replace(/^\//,"") : "");
  const type=item?.type==="tv" ? "series" : (item?.type || "movie");
  const idText=String(item?.id||"");
  const parsedId=idText.match(/^tmdb:(?:(?:movie|tv|series):)?(\d+)$/)?.[1] || (/^\d+$/.test(idText)?idText:"");
  const tmdbId=Number(item?.tmdbId)||Number(parsedId)||0;
  const id=tmdbId ? "tmdb:"+(type==="series"?"tv":"movie")+":"+tmdbId : (item?.id||"");
  return {
    ...item,
    id,
    tmdbId,
    type,
    name:item?.name || item?.title || item?.originalName || item?.original_name || item?.original_title || "Без названия",
    originalName:item?.originalName || item?.original_name || item?.original_title || item?.originalName || "",
    poster:tmdbPoster,
    background,
    releaseInfo:item?.releaseInfo || "",
    description:item?.description || "",
    rating:Number(item?.rating)||0,
    genreIds:Array.isArray(item?.genreIds) ? item.genreIds.map(Number).filter(Boolean) : [],
    genres:Array.isArray(item?.genres)?item.genres:[],
    originalLanguage:item?.originalLanguage || "",
    originCountry:Array.isArray(item?.originCountry)?item.originCountry:[],
    openCinema:Boolean(item?.openCinema),
    imdbId:item?.imdbId || (Number(item?.tmdbId)===10378 ? "tt1254207" : "")
  };
}

const LUNO_TMDB_IMAGE_MIRRORS=[
  "https://imagetmdb.com/",
  "https://nl.imagetmdb.com/",
  "https://de.imagetmdb.com/",
  "https://pl.imagetmdb.com/",
  "https://lampa.byskaz.ru/tmdb/img/"
];

// Browser-side equivalent of Lampa's TMDB Proxy.
// Try the public TMDB-compatible gateways directly first so the app does not
// depend on the LUNO Worker hostname being reachable from the user's network.
const LUNO_TMDB_API_MIRRORS=[
  "https://apitmdb.cub.red/3/",
  "https://apitmdb.cub.best/3/",
  "https://apitmdb.cub.black/3/",
  "https://apitmdb.durex.monster/3/",
  "https://apitmdb.cubnotrip.top/3/",
  "https://lampa.byskaz.ru/tmdb/api/3/"
];
export async function fetchTmdbApi(endpoint,params={}){
  const cleanEndpoint=String(endpoint||"").replace(/^\/+/, "");
  const query=new URLSearchParams();
  Object.entries(params||{}).forEach(([key,value])=>{
    if(value!==undefined&&value!==null&&String(value)!=="") query.set(key,String(value));
  });
  if(!query.has("language")) query.set("language","ru-RU");
  if(!query.has("include_adult")) query.set("include_adult","false");
  // Lampa's TMDB gateway accepts an email query parameter; an empty value is
  // valid when LUNO has no Lampa account configured.
  if(!query.has("email")) query.set("email","");
  const mirrorErrors=[];
  const directAttempts=LUNO_TMDB_API_MIRRORS.map(async(base)=>{
    const controller=new AbortController();
    const timer=window.setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(base+cleanEndpoint+"?"+query.toString(),{
        cache:"no-store",
        headers:{accept:"application/json"},
        signal:controller.signal
      });
      if(!response.ok) throw new Error(base+" HTTP "+response.status);
      const data=await response.json();
      if(!data||!Array.isArray(data.results)) throw new Error("TMDB mirror returned invalid data");
      // A gateway that returns an empty search response must not win Promise.any
      // while another mirror may have the actual TMDB results.
      if(cleanEndpoint==="search/multi" && String(params.query||"").trim() && data.results.length===0){
        throw new Error("TMDB mirror returned an empty search result");
      }
      return data;
    }catch(error){
      mirrorErrors.push(base+": "+String(error?.message||error));
      throw error;
    }finally{
      window.clearTimeout(timer);
    }
  });
  try{
    return await Promise.any(directAttempts);
  }catch(mirrorError){
    // Last resort only: retain the existing Worker path, but do not make it
    // the primary route on networks where workers.dev is unavailable.
    const workerBase=String(window.__LUNO_API_BASE__||"https://luno-api.bqrt30.workers.dev").replace(/\/$/,"");
    const workerPath=cleanEndpoint==="search/multi" ? "/api/tmdb/search" :
      (cleanEndpoint==="trending/all/week" ? "/api/tmdb/discover" : "");
    if(!workerPath) throw mirrorError;
    const workerQuery=new URLSearchParams(query);
    if(cleanEndpoint==="search/multi"&&!workerQuery.has("query")) throw mirrorError;
    let response;
    try{
      response=await fetch(workerBase+workerPath+"?"+workerQuery.toString(),{
        cache:"no-store",headers:{accept:"application/json"},signal:AbortSignal.timeout(10000)
      });
    }catch(workerError){
      const details=mirrorErrors.slice(0,4).join(" | ");
      throw new Error("Зеркала TMDB недоступны: "+(details||"тайм-аут")+"; LUNO API: "+String(workerError?.message||workerError));
    }
    if(!response.ok) throw new Error("TMDB gateways and LUNO API unavailable (HTTP "+response.status+")");
    const data=await response.json();
    if(!data||!Array.isArray(data.results)) throw new Error("LUNO API returned invalid data");
    return data;
  }
}
export function tmdbImageMirrorCandidates(path){
  let clean=String(path||"").trim();
  if(clean.startsWith("/")) clean=clean.slice(1);
  if(!clean) return [];
  return LUNO_TMDB_IMAGE_MIRRORS.map(base=>base+clean);
}
export function preferredTmdbImage(value){
  const path=tmdbImagePath(value);
  return path ? (tmdbImageMirrorCandidates("t/p/"+path)[0]||value) : value;
}
export function tmdbImagePath(value){
  const raw=String(value||"").trim();
  const marker="/t/p/";
  const index=raw.toLowerCase().indexOf(marker);
  return index<0 ? "" : raw.slice(index+marker.length);
}
export function isDirectTmdbImage(value){
  const raw=String(value||"").trim().toLowerCase();
  return raw.startsWith("https://image.tmdb.org/t/p/") || raw.startsWith("http://image.tmdb.org/t/p/");
}
export function posterCandidates(item){
  const values=[];
  const rawPoster=String(
    item?.poster || item?.posterUrl || item?.poster_url ||
    item?.image || item?.imageUrl || item?.image_url ||
    item?.cover || item?.coverUrl || item?.cover_url ||
    item?.background || item?.backdrop || item?.backdropUrl || item?.backdrop_url || ""
  ).trim();
  let path=String(item?.poster_path||item?.posterPath||item?.backdrop_path||item?.backdropPath||"").trim();
  if(path.startsWith("/")) path=path.slice(1);
  // LUNO's own cached/custom poster fields are deliberately ignored. Only
  // TMDB poster paths or explicit TMDB image URLs may be used, including in search.
  const remotePath=path || tmdbImagePath(rawPoster);
  if(remotePath){
    const parts=remotePath.split("/");
    const first=parts[0]||"";
    const size=(first==="original" || first.startsWith("w")) ? first : "w500";
    const file=(first==="original" || first.startsWith("w")) ? parts.slice(1).join("/") : remotePath;
    const imagePath="t/p/"+size+"/"+file;
    const imageProxyBase=String(window.__LUNO_API_BASE__||"https://luno-api.bqrt30.workers.dev").replace(/\/$/,"");
    // Prefer the previously working public image mirrors, then Worker fallback,
    // and try the canonical TMDB host last for Safari/network compatibility.
    values.push(...tmdbImageMirrorCandidates(imagePath));
    values.push(imageProxyBase+"/api/tmdb/image?path="+encodeURIComponent("/"+imagePath.slice("t/p/".length)));
    values.push("https://image.tmdb.org/t/p/"+size+"/"+file);
  }
  if(rawPoster && isDirectTmdbImage(rawPoster)) values.push(rawPoster);
  // Some catalogue/source adapters provide artwork URLs from public image mirrors
  // instead of a TMDB poster_path. Keep that usable as a final fallback.
  if(rawPoster && /^https?:\/\//i.test(rawPoster) && !values.includes(rawPoster)) values.push(rawPoster);
  return [...new Set(values.map(value=>String(value||"").trim()).filter(Boolean))];
}
// Shared device capability check used by poster loading and prefetching.
export function detailPosterCandidates(item){
  const posterPath=String(item?.poster_path||item?.posterPath||"").trim();
  const backdropPath=String(item?.backdrop_path||item?.backdropPath||"").trim();
  const rawPoster=String(
    item?.poster||item?.posterUrl||item?.poster_url||
    item?.image||item?.imageUrl||item?.image_url||
    item?.cover||item?.coverUrl||item?.cover_url||""
  ).trim();
  const rawBackdrop=String(
    item?.background||item?.backdrop||item?.backdropUrl||
    item?.backdrop_url||item?.backdropImage||item?.backdrop_image||""
  ).trim();
  // Prefer portrait poster metadata and explicit poster URLs. A backdrop is
  // only a last resort; never overwrite a real poster path with backdrop_path.
  const posterItem={
    ...item,
    poster_path:posterPath,
    posterPath,
    backdrop_path:"",
    backdropPath:"",
    backdrop:"",
    backdropUrl:"",
    backdrop_url:"",
    background:""
  };
  const posters=posterCandidates(posterItem);
  const explicitPoster=rawPoster&&(rawPoster.startsWith("http://")||rawPoster.startsWith("https://"))?[rawPoster]:[];
  const backdrops=backdropPath?posterCandidates({
    ...item,
    poster:"",
    posterUrl:"",
    poster_url:"",
    image:"",
    imageUrl:"",
    image_url:"",
    cover:"",
    coverUrl:"",
    cover_url:"",
    poster_path:backdropPath,
    posterPath:backdropPath,
    backdrop_path:"",
    backdropPath:"",
    backdrop:"",
    backdropUrl:"",
    backdrop_url:"",
    background:""
  }):[];
  // Catalog entries do not always carry poster_path: some adapters expose
  // artwork only as background/backdrop URLs. Keep portrait posters first,
  // then try every known direct artwork URL and finally TMDB backdrop paths.
  const explicitBackdrop=rawBackdrop&&/^https?:\/\//i.test(rawBackdrop)?[rawBackdrop]:[];
  const fallbackArtwork=posterCandidates({
    ...item,
    poster_path:"",
    posterPath:"",
    poster:"",
    posterUrl:"",
    poster_url:"",
    image:"",
    imageUrl:"",
    image_url:"",
    cover:"",
    coverUrl:"",
    cover_url:""
  });
  return [...new Set([...posters,...explicitPoster,...backdrops,...explicitBackdrop,...fallbackArtwork].filter(Boolean))];
}
