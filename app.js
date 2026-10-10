import bundledTmdbCatalog from "./tmdb-catalog.generated.js";
import Hls from "hls.js";
import dashjs from "dashjs";
import {
  loadMetaDetails,
  loadLunoPlayer,
  getReadyMetaStreams,
  getPlayerStreamUrl,
  unloadLunoPlayer,
  dispatchLunoPlayerAction,
} from "./source-engine.js?v=source31";
import {renderSourceManager,bindSourceManager} from "./ui/source-manager.js";
import {qualityNumber} from "./sources/quality.js";
import {installRemoteNavigation} from "./ui/remote-navigation.js?v=remote32";
const continueCards=document.querySelector("#continueCards");
const movieCards=document.querySelector("#movieCards");
const openCinemaCards=document.querySelector("#openCinemaCards");
const seriesCards=document.querySelector("#seriesCards");
const lunoPicksCards=document.querySelector("#lunoPicksCards");
const eveningCards=document.querySelector("#eveningCards");
const classicsCards=document.querySelector("#classicsCards");
const searchPanel=document.querySelector("#searchPanel");
const searchInput=document.querySelector("#searchInput");
const searchBox=document.querySelector(".search-box");
const player=document.querySelector("#player");
const playerBrowse=document.querySelector("#playerBrowse");
const playerBrowseToggle=document.querySelector("#playerBrowseToggle");
const playerBrowseBackdrop=document.querySelector("#playerBrowseBackdrop");
const playerBrowseTitle=document.querySelector("#playerBrowseTitle");
const playerBrowseMeta=document.querySelector("#playerBrowseMeta");
const playerBrowseDescription=document.querySelector("#playerBrowseDescription");
const playerBrowseSource=document.querySelector("#playerBrowseSource");
const playerBrowseFilter=document.querySelector("#playerBrowseFilter");
const playerBrowseFilterMenu=document.querySelector("#playerBrowseFilterMenu");
const playerBrowseEpisodeNumbers=document.querySelector("#playerBrowseEpisodeNumbers");
const playerBrowseCurrentEpisode=document.querySelector("#playerBrowseCurrentEpisode");
const playerBrowseEpisodes=document.querySelector("#playerBrowseEpisodes");
const playerBrowseQuality=document.querySelector("#playerBrowseQuality");
const playerBrowseVoice=document.querySelector("#playerBrowseVoice");
const playerBrowseSourceButton=document.querySelector("#playerBrowseSourceButton");
const lunoVideo=document.querySelector("#lunoVideo");
const playerEmpty=document.querySelector("#playerEmpty");
const playerMessage=document.querySelector("#playerMessage");
const playerBarTitle=document.querySelector("#playerBarTitle");
const playerBarMeta=document.querySelector("#playerBarMeta");
const playerSourceButton=document.querySelector("#playerSourceButton");
const playerQualityButton=document.querySelector("#playerQualityButton");
const playerEpisodeButton=document.querySelector("#playerEpisodeButton");
const playerVoiceButton=document.querySelector("#playerVoiceButton");
const playerSubtitleButton=document.querySelector("#playerSubtitleButton");
const episodeSheet=document.querySelector("#episodeSheet");
const episodeList=document.querySelector("#episodeList");
const closeEpisodeSheet=document.querySelector("#closeEpisodeSheet");
const voiceSheet=document.querySelector("#voiceSheet");
const voiceList=document.querySelector("#voiceList");
const closeVoiceSheet=document.querySelector("#closeVoiceSheet");
const qualitySheet=document.querySelector("#qualitySheet");
const qualityList=document.querySelector("#qualityList");
const closeQualitySheet=document.querySelector("#closeQualitySheet");
const subtitleSheet=document.querySelector("#subtitleSheet");
const subtitleList=document.querySelector("#subtitleList");
const closeSubtitleSheet=document.querySelector("#closeSubtitleSheet");
const sourceSheet=document.querySelector("#sourceSheet");
const sourceList=document.querySelector("#sourceList");
const sourceEmpty=document.querySelector("#sourceEmpty");
const closeSourceSheet=document.querySelector("#closeSourceSheet");
const detail=document.querySelector("#detail");
const detailPoster=document.querySelector("#detailPoster");
const detailHeroPoster=document.querySelector("#detailHeroPoster");
const detailReleaseInfo=document.querySelector("#detailReleaseInfo");
const detailTypeInfo=document.querySelector("#detailTypeInfo");
const detailQualityInfo=document.querySelector("#detailQualityInfo");
const detailQualityBar=document.querySelector("#detailQualityBar");
const detailQualityText=document.querySelector("#detailQualityText");
const detailTags=document.querySelector("#detailTags");
const detailFact=document.querySelector("#detailFact");
const detailCredits=document.querySelector("#detailCredits");
const detailSimilar=document.querySelector("#detailSimilar");
const detailSimilarTitle=document.querySelector("#detailSimilarTitle");
const detailRecommendations=document.querySelector("#detailRecommendations");
const detailTitle=document.querySelector("#detailTitle");
const detailMeta=document.querySelector("#detailMeta");
const detailDescription=document.querySelector("#detailDescription");
const detailBadges=document.querySelector("#detailBadges");
const detailRatings=document.querySelector("#detailRatings");
const detailPlay=document.querySelector("#detailPlay");
const detailTrailer=document.querySelector("#detailTrailer");
const detailEpisodes=document.querySelector("#detailEpisodes");
const detailSeasonsSection=document.querySelector("#detailSeasonsSection");
const detailOpenEpisodes=document.querySelector("#detailOpenEpisodes");
const detailSeasonsTitle=document.querySelector("#detailSeasonsTitle");
const continueSection=document.querySelector("#continueSection");
const moviesSection=document.querySelector("#moviesSection");
const seriesSection=document.querySelector("#seriesSection");
const trendingCards=document.querySelector("#trendingCards");
const newCards=document.querySelector("#newCards");
const topCards=document.querySelector("#topCards");
const genreGrid=document.querySelector("#genreGrid");
const favoritesSection=document.querySelector("#favoritesSection");
const favoriteCards=document.querySelector("#favoriteCards");
const favoritesEmpty=document.querySelector("#favoritesEmpty");
const detailBackdrop=document.querySelector("#detailBackdrop");
const detailFavorite=document.querySelector("#detailFavorite");
const closeSearch=document.querySelector("#closeSearch");
const libraryView=document.querySelector("#libraryView");
const libraryContent=document.querySelector("#libraryContent");
const libraryTitle=document.querySelector("#libraryTitle");
const libraryKicker=document.querySelector("#libraryKicker");
const libraryBack=document.querySelector("#libraryBack");
const librarySearch=document.querySelector("#librarySearch");
const splash=document.querySelector("#splash");
const splashStatus=document.querySelector("#splashStatus");
const splashProgress=document.querySelector("#splashProgress");
const confirmDialog=document.querySelector("#confirmDialog");
const dialogTitle=document.querySelector("#dialogTitle");
const dialogMessage=document.querySelector("#dialogMessage");
const dialogCancel=document.querySelector("#dialogCancel");
const dialogConfirm=document.querySelector("#dialogConfirm");
const addonManager=document.querySelector("#addonManager");
const addonUrlInput=document.querySelector("#addonUrlInput");
const addonNameInput=document.querySelector("#addonNameInput");
const sourceInstallForm=document.querySelector("#sourceInstallForm");
const installAddonButton=document.querySelector("#installAddonButton");
const addonManagerStatus=document.querySelector("#addonManagerStatus");
const addonList=document.querySelector("#addonList");
const openAddonManager=document.querySelector("#openAddonManager");
const openAddonManagerTop=document.querySelector("#openAddonManagerTop");
const openAddonManagerFromPlayer=document.querySelector("#openAddonManagerFromPlayer");
const openCinemaSources=document.querySelector("#openCinemaSources");
const closeAddonManager=document.querySelector("#closeAddonManager");

let currentItem=null;
let catalogItems=[];
let movieItems=[];
let openCinemaItems=[];
let seriesItems=[];
let animationItems=[];
let cartoonItems=[];
let animeItems=[];
let showItems=[];
let detailReturnLibrary="";
let movieVisible=18;
let seriesVisible=18;
let catalogLoading=false;
let catalogSections={};
let resumeItems=[];
let favoriteItems=[];
let splashDone=false;
let dialogAction=null;
let playerStreams=[];
let playerStreamState=null;
let playerResolving=false;
let playerResolveController=null;
let playerResolveId=0;
let lastCoreTime=-1;
let playerSeason=0;
let playerQualityFilter="all";

function setSplashProgress(value,status){
  if(splashProgress) splashProgress.style.width=Math.max(0,Math.min(100,value))+"%";
  if(splashStatus && status) splashStatus.textContent=status;
}
function finishSplash(){
  if(splashDone) return;
  splashDone=true;
  setSplashProgress(100,"Готово");
  window.setTimeout(()=>splash?.classList.add("is-hidden"),260);
}

// Never leave the UI permanently behind the splash screen if a source request hangs.
// The application remains usable and playback can initialize when the source engine is ready.
const splashSafetyTimer=window.setTimeout(()=>{
  if(!splashDone){
    console.warn("LUNO splash safety timeout");
    setSplashProgress(100,"LUNO готов");
    finishSplash();
  }
},8000);
function showDialog(title,message,confirmText="Выйти",action=null){
  if(!confirmDialog) return;
  dialogAction=action;
  dialogTitle.textContent=title;
  dialogMessage.textContent=message;
  dialogConfirm.textContent=confirmText;
  confirmDialog.classList.remove("hidden");
  dialogCancel.focus();
}
function closeDialog(){
  confirmDialog?.classList.add("hidden");
  dialogAction=null;
}
dialogCancel?.addEventListener("click",closeDialog);
dialogConfirm?.addEventListener("click",()=>{
  const action=dialogAction;
  closeDialog();
  if(action) action();
});
confirmDialog?.addEventListener("click",(event)=>{
  if(event.target===confirmDialog) closeDialog();
});

function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g,(char)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function mediaCategory(item){
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
function categoryLabel(item){
  return ({movies:"Фильм",series:"Сериал",cartoons:"Мультфильм",anime:"Аниме",shows:"Шоу"})[mediaCategory(item)] || "Контент";
}
function metaLine(item){
  const year=String(item?.releaseInfo || "").match(/\d{4}/)?.[0] || "";
  return [year,categoryLabel(item)].filter(Boolean).join(" • ");
}

function normalizeImageValue(value,size){
  const raw=String(value||"").trim();
  if(!raw) return "";
  if(/^https?:\/\//i.test(raw)) return raw;
  if(raw.startsWith("./") || raw.startsWith("../")) return raw;
  if(raw.startsWith("data:")) return raw;
  if(raw.startsWith("/")) return "https://image.tmdb.org/t/p/"+size+raw;
  return raw;
}

function normalizeItem(item){
  // Use TMDB artwork only. Ignore LUNO's cached/custom poster fields.
  const posterValue=String(item?.poster||"").trim();
  const tmdbPoster=item?.poster_path
    ? "https://image.tmdb.org/t/p/w500/"+String(item.poster_path).replace(/^\//,"")
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
    name:item?.name || item?.originalName || "Без названия",
    poster,
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
function tmdbImageMirrorCandidates(path){
  let clean=String(path||"").trim();
  if(clean.startsWith("/")) clean=clean.slice(1);
  if(!clean) return [];
  return LUNO_TMDB_IMAGE_MIRRORS.map(base=>base+clean);
}
function tmdbImagePath(value){
  const raw=String(value||"").trim();
  const marker="/t/p/";
  const index=raw.toLowerCase().indexOf(marker);
  return index<0 ? "" : raw.slice(index+marker.length);
}
function isDirectTmdbImage(value){
  const raw=String(value||"").trim().toLowerCase();
  return raw.startsWith("https://image.tmdb.org/t/p/") || raw.startsWith("http://image.tmdb.org/t/p/");
}
function posterCandidates(item){
  const values=[];
  const rawPoster=String(item?.poster||"").trim();
  let path=String(item?.poster_path||item?.posterPath||"").trim();
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
    // Try public image mirrors before the Worker. On mobile networks the
    // Worker image response can remain pending without firing an <img> error.
    values.push(...tmdbImageMirrorCandidates(imagePath));
    values.push("https://image.tmdb.org/t/p/"+size+"/"+file);
    values.push(imageProxyBase+"/api/tmdb/image?path="+encodeURIComponent("/"+imagePath.slice("t/p/".length)));
  }
  if(rawPoster && isDirectTmdbImage(rawPoster)) values.push(rawPoster);
  return [...new Set(values.map(value=>String(value||"").trim()).filter(Boolean))];
}
// Shared device capability check used by poster loading and prefetching.
function isLowPowerTV(){
  const ua=String(navigator.userAgent||"");
  return /web0s|webos|netcast|tizen|smart-tv|smarttv|hbbtv|aftb|android tv|googletv/i.test(ua)
    || (navigator.hardwareConcurrency>0 && navigator.hardwareConcurrency<=4 && matchMedia("(hover: none)").matches);
}
function card(item,eager=false){
  const title=item?.name || "Без названия";
  const candidates=posterCandidates(item);
  const image=candidates[0] || "";
  const fallbacks=candidates.slice(1);
  const rating=Number(item?.rating)>0 ? Number(item.rating).toFixed(1) : "";
  const year=String(item?.releaseInfo||"").match(/\d{4}/)?.[0] || "";
  const rawType=mediaCategory(item);
  const type=({movies:"ФИЛЬМ",series:"СЕРИАЛ",cartoons:"МУЛЬТФИЛЬМ",anime:"АНИМЕ",shows:"ШОУ"})[rawType] || (item?.type==="series" ? "СЕРИАЛ" : "ФИЛЬМ");
  const genres=Array.isArray(item?.genres)?item.genres.map(g=>typeof g==="string"?g:(g?.name||"")).filter(Boolean):[];
  const genreLabel=genres[0]||type;
  const quality=String(item?.quality||item?.videoQuality||item?.resolution||item?.video_quality||"AUTO").toUpperCase();
  const posterPlaceholder='<span class="poster-fallback poster-fallback-title" aria-hidden="true"><span>'+escapeHtml(title)+'</span></span>';
  // Smart-TV browsers often defer lazy images inside horizontal rails indefinitely.
  // Load the first visible posters eagerly on TVs; keep the rest lazy to protect memory.
  const tvPosterPriority=isLowPowerTV() && eager;
  const imageHtml=image
    ? posterPlaceholder+'<img src="'+escapeHtml(image)+'" data-fallbacks="'+escapeHtml(JSON.stringify(fallbacks))+'" alt="'+escapeHtml(title)+'" loading="'+(eager ? "eager" : "lazy")+'" decoding="async" fetchpriority="'+(eager && !isLowPowerTV() ? "high" : "auto")+'" referrerpolicy="no-referrer"'+(tvPosterPriority?' data-tv-poster="priority"':'')+'>'
    : posterPlaceholder;
  const meta=(rating ? '<span class="card-rating">★ '+rating+'</span>' : '')+
    (year ? '<span class="card-year">'+year+'</span>' : '');
  const overlayMeta=(rating ? '<span class="card-hover-rating">★ '+rating+'</span>' : '')+
    (year ? '<span>'+year+'</span>' : '')+
    '<span>'+escapeHtml(genreLabel)+'</span>';
  return '<button class="card" data-id="'+escapeHtml(item?.id||"")+'" data-type="'+escapeHtml(item?.type||"movie")+'" data-title="'+escapeHtml(title)+'" aria-label="Открыть '+escapeHtml(title)+'">'+
    '<span class="card-art">'+imageHtml+
      '<span class="card-gradient"></span>'+
      '<span class="card-type card-corner">'+escapeHtml(type)+'</span>'+
      (rating ? '<span class="poster-quality poster-card-rating">★ '+rating+'</span>' : '')+
      (year ? '<span class="poster-year">'+escapeHtml(year)+'</span>' : '')+
      '<span class="card-info">'+meta+'</span>'+
      '<span class="card-hover-panel"><span class="card-hover-meta">'+overlayMeta+'</span><span class="card-hover-title">'+escapeHtml(title)+'</span><span class="card-hover-cta">Подробнее <span aria-hidden="true">↗</span></span></span>'+
    '</span>'+
    '<span class="card-title">'+escapeHtml(title)+'</span>'+
  '</button>';
}

// Global card interaction — one deterministic path for every device.
function resolveCardItem(card){
  if(!card) return null;
  const id=String(card.dataset.id||"");
  return window.__LUNO_ITEMS__?.get(id)
    || catalogItems.find(x=>String(x?.id)===id)
    || movieItems.find(x=>String(x?.id)===id)
    || seriesItems.find(x=>String(x?.id)===id)
    || cartoonItems.find(x=>String(x?.id)===id)
    || animeItems.find(x=>String(x?.id)===id)
    || showItems.find(x=>String(x?.id)===id)
    || null;
}
window.__LUNO_OPEN_CARD__=(card)=>{
  const item=resolveCardItem(card);
  if(!item) return false;
  try{
    openDetail(item);
    return true;
  }catch(error){
    console.error("[LUNO] card open failed",error);
    return false;
  }
};
document.addEventListener("click",(event)=>{
  const cardEl=event.target?.closest?.(".card");
  if(!cardEl) return;
  if(window.__LUNO_OPEN_CARD__(cardEl)){
    event.preventDefault();
    event.stopPropagation();
  }
},true);

const posterLookupCache=new Map();
async function lookupPosterFromTmdb(item){
  const title=String(item?.name||item?.originalName||item?.title||"").trim();
  if(!title) return "";
  const type=item?.type==="tv"?"series":(item?.type||"movie");
  const year=searchYear(item);
  const queries=[...new Set([title,String(item?.originalName||"").trim()].filter(Boolean))];
  const key=[type,queries.map(normalizeSearchText).join("|"),year||""].join("|");
  if(!posterLookupCache.has(key)){
    const request=(async()=>{
      const base=String(window.__LUNO_API_BASE__||"https://luno-api.bqrt30.workers.dev").replace(/\/$/,"");
      const targets=queries.map(normalizeSearchText).filter(Boolean);
      const tokenSets=targets.map(value=>new Set(value.split(" ").filter(word=>word.length>1)));
      const scoreName=value=>{
        const normalized=normalizeSearchText(value);
        if(!normalized) return 0;
        if(targets.includes(normalized)) return 1000;
        let score=0;
        for(const target of targets){
          if(normalized.startsWith(target)||target.startsWith(normalized)) score=Math.max(score,750);
          const targetWords=new Set(target.split(" ").filter(word=>word.length>1));
          const candidateWords=new Set(normalized.split(" ").filter(word=>word.length>1));
          if(targetWords.size && candidateWords.size){
            const overlap=[...targetWords].filter(word=>candidateWords.has(word)).length;
            const ratio=overlap/Math.max(targetWords.size,candidateWords.size);
            if(ratio>=0.6) score=Math.max(score,Math.round(ratio*600));
          }
        }
        return score;
      };
      for(const query of queries){
        try{
          const response=await fetch(base+"/api/tmdb/search?query="+encodeURIComponent(query),{
            cache:"no-store",headers:{accept:"application/json"}
          });
          if(!response.ok) continue;
          const data=await response.json();
          const matches=(Array.isArray(data?.results)?data.results:[])
            .map(candidate=>{
              if(!candidate?.poster) return null;
              const candidateType=candidate?.type==="tv"?"series":(candidate?.type||"movie");
              if(candidateType!==type) return null;
              const candidateYear=searchYear(candidate);
              if(year && candidateYear && year!==candidateYear) return null;
              const titleScore=Math.max(scoreName(candidate?.name),scoreName(candidate?.originalName));
              if(titleScore<600) return null;
              return {candidate,titleScore};
            })
            .filter(Boolean)
            .sort((a,b)=>b.titleScore-a.titleScore || (Number(b.candidate.rating)||0)-(Number(a.candidate.rating)||0));
          if(matches.length) return matches[0].candidate.poster;
        }catch(error){
          console.warn("[LUNO] TMDB poster lookup failed",query,error);
        }
      }
      return "";
    })();
    posterLookupCache.set(key,request);
  }
  return posterLookupCache.get(key);
}

async function recoverCardPoster(cardElement,image){
  if(image?.dataset.posterLookupAttempted==="1") return false;
  if(image) image.dataset.posterLookupAttempted="1";
  const item=resolveCardItem(cardElement);
  if(!item) return false;
  const poster=await lookupPosterFromTmdb(item);
  if(!poster || !cardElement.isConnected) return false;
  let target=image;
  if(!target){
    const art=cardElement.querySelector(".card-art");
    if(!art) return false;
    target=document.createElement("img");
    target.alt=String(item.name||"");
    target.loading="lazy";
    target.decoding="async";
    target.referrerPolicy="no-referrer";
    const fallback=art.querySelector(".poster-fallback");
    if(fallback) fallback.insertAdjacentElement("afterend",target);
    else art.prepend(target);
    target.addEventListener("load",()=>{
      target.classList.add("is-poster-ready");
      art.querySelector(".poster-fallback")?.remove();
    },{once:true});
    target.addEventListener("error",()=>{
      target.remove();
    },{once:true});
  }else{
    target.dataset.fallbacks="[]";
  }
  target.src=poster;
  return true;
}

function bindCards(){
  document.querySelectorAll(".card-art img").forEach((img)=>{
    // Smart-TV browsers frequently fail to trigger native lazy loading in horizontal rails.
    // Promote already-rendered poster images to eager loading on TVs and force a reload if needed.
    if(isLowPowerTV()){
      // TV engines may not start or reveal images after a late loading-mode change.
      img.loading="eager";
      img.setAttribute("fetchpriority","high");
      img.setAttribute("decoding","sync");
      img.style.setProperty("opacity","1","important");
      if(img.dataset.tvLoadPromoted!=="1"){
        img.dataset.tvLoadPromoted="1";
        const current=img.getAttribute("src");
        if(current && (!img.complete || img.naturalWidth===0)){
          img.removeAttribute("src");
          img.setAttribute("src",current);
        }
      }
    }
    if(img.dataset.posterReadyBound==="1") return;
    img.dataset.posterReadyBound="1";
    const reveal=()=>{
      img.classList.add("is-poster-ready");
      img.closest(".card-art")?.querySelector(".poster-fallback")?.remove();
    };
    if(img.complete && img.naturalWidth>0) reveal();
    else {
      img.addEventListener("load",reveal,{once:true});
      img.addEventListener("error",()=>img.classList.remove("is-poster-ready"),{once:true});
    }
  });
  document.querySelectorAll(".card").forEach((c)=>{
    const image=c.querySelector(".card-art img");
    if(!image){
      recoverCardPoster(c,null);
      return;
    }
    if(image && !image.dataset.fallbackBound){
      image.dataset.fallbackBound="1";
      // Some iOS Safari/network combinations leave blocked image requests
      // pending forever instead of firing error. Force the normal fallback
      // chain after a short deadline so the next mirror can be tried.
      let posterLoadTimer=0;
      const armPosterLoadTimer=()=>{
        window.clearTimeout(posterLoadTimer);
        posterLoadTimer=window.setTimeout(()=>{
          if(image.isConnected && (!image.complete || image.naturalWidth===0)){
            image.dispatchEvent(new Event("error"));
          }
        },4500);
      };
      image.addEventListener("load",()=>window.clearTimeout(posterLoadTimer));
      image.addEventListener("error",()=>{
        window.clearTimeout(posterLoadTimer);
        window.setTimeout(armPosterLoadTimer,0);
      });
      armPosterLoadTimer();
      image.addEventListener("error",()=>{
        let fallbacks=[];
        try{ fallbacks=JSON.parse(image.dataset.fallbacks||"[]"); }catch{}
        const next=fallbacks.shift();
        if(next && image.src!==next){
          image.dataset.fallbacks=JSON.stringify(fallbacks);
          image.src=next;
          return;
        }
        if(image.dataset.posterLookupAttempted!=="1"){
          recoverCardPoster(c,image).then(recovered=>{
            if(recovered) return;
            image.remove();
            const art=c.querySelector(".card-art");
            if(art && !art.querySelector(".poster-fallback")){
              art.insertAdjacentHTML("afterbegin",'<span class="poster-fallback poster-fallback-title"><span>'+escapeHtml(c.dataset.title||"Без названия")+'</span></span>');
            }
          });
          return;
        }
        image.remove();
        const art=c.querySelector(".card-art");
        if(art && !art.querySelector(".poster-fallback")){
          art.insertAdjacentHTML("afterbegin",'<span class="poster-fallback poster-fallback-title"><span>'+escapeHtml(c.dataset.title||"Без названия")+'</span></span>');
        }
      },{once:false});
    }
    c.type="button";
    c.onclick=(event)=>{
      event.preventDefault();
      event.stopPropagation();
      window.__LUNO_OPEN_CARD__?.(c);
    };
  });
}

function paintDetail(value){
  const title=value?.name || "Без названия";
  const image=value?.poster || value?.background || "";
  const year=String(value?.releaseInfo || "").match(/\d{4}/)?.[0] || "—";
  const score=Number(value?.rating)||0;
  const type=categoryLabel(value);
  const genres=Array.isArray(value?.genres) ? value.genres : [];
  const genreMap={
    28:"Боевик",12:"Приключения",16:"Мультфильм",35:"Комедия",80:"Криминал",
    99:"Документальный",18:"Драма",10751:"Семейный",14:"Фэнтези",36:"История",
    27:"Ужасы",10402:"Музыка",9648:"Детектив",10749:"Мелодрама",878:"Фантастика",
    10770:"ТВ",53:"Триллер",10752:"Военный",37:"Вестерн",10759:"Боевик",10762:"Детский",
    10763:"Новости",10764:"Реалити",10765:"Фантастика",10766:"Мыльная опера",
    10767:"Ток-шоу",10768:"Война"
  };
  const genreNames=genres.map(g=>genreMap[g]||g).filter(Boolean).slice(0,5);
  // TMDB ratings describe audience reception, not video resolution.
  // Never claim 4K/Full HD until the selected stream provides that metadata.
  const quality="По источнику";

  if(detailHeroPoster) detailHeroPoster.style.backgroundImage=image ? 'url("'+String(image).replace(/"/g,"&quot;")+'")' : "";
  if(detailPoster) detailPoster.style.backgroundImage=image ? 'url("'+String(image).replace(/"/g,"&quot;")+'")' : "";
  if(detail) detail.style.setProperty("--luno-poster",image ? 'url("'+String(image).replace(/"/g,"&quot;")+'")' : "none");
  if(detailSeasonsSection) detailSeasonsSection.classList.toggle("hidden",value?.type!=="series");
  if(detailSeasonsTitle) detailSeasonsTitle.textContent=title+" — сезоны и серии";
  const detailKicker=document.querySelector(".luno-detail-hero-copy .detail-kicker");
  if(detailKicker) detailKicker.textContent="LUNO  •  "+(value?.type==="series"?"СЕРИАЛ":"ФИЛЬМ");
  if(detailTitle) detailTitle.textContent=title;
  if(detailMeta) detailMeta.innerHTML=[
    score>0 ? '<span class="detail-meta-rating">★ '+score.toFixed(1)+' <small>TMDB</small></span>' : "",
    year!=="—" ? escapeHtml(year) : "",
    value?.runtime ? escapeHtml(value.runtime+" мин") : "",
    escapeHtml(type)
  ].filter(Boolean).join('<span class="detail-meta-separator">•</span>');

  if(detailBadges){
    detailBadges.innerHTML=[
      ...genreNames.slice(0,3).map(g=>'<span class="detail-badge detail-badge-muted">'+escapeHtml(g)+'</span>'),
      '<span class="detail-badge detail-quality">По источнику</span>'
    ].filter(Boolean).join("");
  }

  if(detailDescription) detailDescription.textContent=value?.description || "Описание пока недоступно.";
  if(detailReleaseInfo) detailReleaseInfo.textContent=year;
  if(detailTypeInfo) detailTypeInfo.textContent=type;
  if(detailQualityInfo) detailQualityInfo.textContent=quality;
  if(detailQualityBar) detailQualityBar.style.width="0%";
  if(detailQualityText) detailQualityText.textContent="Качество определяется выбранным потоком";

  if(detailRatings){ detailRatings.innerHTML=""; detailRatings.hidden=true; }

  if(detailTags){
    detailTags.innerHTML=genreNames.map(g=>'<button type="button" data-detail-genre="'+escapeHtml(g)+'"># '+escapeHtml(g)+'</button>').join("") || '<button type="button" data-detail-genre="Кино"># LUNO</button>';
  }

  if(detailCredits){
    const cast=Array.isArray(value?.cast) ? value.cast.slice(0,10) : [];
    detailCredits.innerHTML=cast.length ? cast.map(actor=>{
      const portrait=actor?.profile || "";
      return '<button class="luno-actor-card" type="button">'+
        '<span class="luno-actor-avatar" style="background-image:url(&quot;'+escapeHtml(portrait)+'&quot;)">'+
          (!portrait ? escapeHtml(String(actor?.name||"?").slice(0,1)) : "")+
        '</span>'+
        '<span class="luno-actor-copy"><strong>'+escapeHtml(actor?.name||"Актёр")+'</strong><small>'+escapeHtml(actor?.character||"В ролях")+'</small></span>'+
      '</button>';
    }).join("") : '<div class="luno-actors-empty">Информация об актёрах пока недоступна.</div>';
  }

  if(detailSimilar){
    const pool=(catalogItems||[]).filter(x=>x?.id && x.id!==value?.id);
    const collectionId=Number(value?.collectionId)||0;
    const franchise=collectionId ? pool.filter(x=>Number(x?.collectionId)===collectionId) : [];
    const scored=pool.map(item=>{
      const shared=(item.genreIds||[]).filter(g=>(value.genreIds||[]).includes(g)).length;
      const rating=Number(item.rating)||0;
      return {item,score:shared*20+rating};
    }).sort((a,b)=>b.score-a.score).map(x=>x.item);
    const similar=franchise.length ? franchise : scored;
    if(detailSimilarTitle) detailSimilarTitle.textContent=franchise.length ? "Франшиза" : "Похожие";
    detailSimilar.innerHTML=similar.slice(0,8).map(item=>card(item)).join("");
    bindCards();
  }

  if(detailRecommendations){
    const pool=(catalogItems||[]).filter(x=>x?.id && x.id!==value?.id);
    const currentYear=new Date().getFullYear();
    const getItemYear=item=>Number(String(item?.releaseInfo||"").match(/\d{4}/)?.[0]||0);
    const sharedGenres=(item?.genreIds||[]).filter(g=>(value.genreIds||[]).includes(g)).length;
    const seeded=(item)=>{
      let n=0;
      for(const ch of String(item?.id||"")) n=((n*31)+ch.charCodeAt(0))>>>0;
      return n;
    };
    const ranked=pool.map(item=>{
      const year=getItemYear(item);
      const age=Math.abs((year||currentYear)-currentYear);
      const era=year>=2020 ? "2020s" : year>=2010 ? "2010s" : year>=2000 ? "2000s" : "classic";
      const rating=Number(item?.rating)||0;
      const popularity=Number(item?.popularity)||0;
      return {
        item, year, era,
        score:sharedGenres*34 + Math.min(rating,10)*3 + Math.min(popularity,100)*0.08 + seeded(item)%37
      };
    }).sort((a,b)=>b.score-a.score);

    // Не превращаем рекомендации в ленту новинок: сначала берём разные эпохи,
    // затем добираем лучшие совпадения. Набор слегка меняется при каждом открытии.
    const selected=[];
    const eras=["2020s","2010s","2000s","classic"];
    for(const era of eras){
      const candidates=ranked.filter(x=>x.era===era && !selected.some(y=>y.item.id===x.item.id)).slice(0,6);
      if(candidates.length){
        const pick=candidates[Math.floor(Math.random()*candidates.length)];
        selected.push(pick);
      }
    }
    for(const candidate of ranked){
      if(selected.length>=8) break;
      if(!selected.some(x=>x.item.id===candidate.item.id)) selected.push(candidate);
    }
    const recommendations=selected.slice(0,8).map(x=>x.item);
    detailRecommendations.innerHTML=recommendations.length ? recommendations.map(item=>card(item)).join("") : "";
    bindCards();
  }
}
function isFavorite(id){
  return loadFavorites().some(item=>item.id===id);
}

function loadHistory(){
  try{
    const value=JSON.parse(localStorage.getItem("luno-history")||"[]");
    return Array.isArray(value) ? value.filter(x=>x?.id).map(normalizeItem) : [];
  }catch{return []}
}
function saveHistoryItem(item){
  if(!item?.id) return;
  const list=loadHistory().filter(x=>x.id!==item.id);
  list.unshift({...item,updatedAt:Date.now()});
  try{localStorage.setItem("luno-history",JSON.stringify(list.slice(0,50)));}catch{}
}

function loadFavorites(){
  try{
    const value=JSON.parse(localStorage.getItem("luno-favorites")||"[]");
    return Array.isArray(value) ? value.filter(x=>x?.id).map(normalizeItem) : [];
  }catch{return []}
}

function saveFavorites(items){
  try{localStorage.setItem("luno-favorites",JSON.stringify(items.slice(0,100)));}catch{}
}

function toggleFavorite(item){
  if(!item?.id) return;
  const list=loadFavorites();
  const exists=list.some(x=>x.id===item.id);
  const next=exists ? list.filter(x=>x.id!==item.id) : [{...item,updatedAt:Date.now()},...list];
  saveFavorites(next);
  renderFavorites();
  paintFavoriteButton(item);
}

function paintFavoriteButton(item){
  if(!detailFavorite) return;
  const active=isFavorite(item?.id);
  detailFavorite.textContent=active ? "♥ В избранном" : "♡ В избранное";
  detailFavorite.classList.toggle("is-favorite",active);
  detailFavorite.setAttribute("aria-pressed",String(active));
  detailFavorite.setAttribute("aria-label",active ? "Убрать из избранного" : "Добавить в избранное");
}

function renderFavorites(){
  favoriteItems=loadFavorites();
  if(!favoriteCards || !favoritesEmpty) return;
  favoriteCards.innerHTML=favoriteItems.map(card).join("");
  favoritesEmpty.style.display=favoriteItems.length ? "none" : "flex";
  bindCards();
}

function lunoHistorySnapshot(){
  const active=document.activeElement;
  return {
    ...(history.state||{}),
    scrollY:window.scrollY,
    focusId:active?.id||"",
    focusCardDataId:active?.closest?.(".card")?.dataset?.id||"",
    libraryScrollTop:libraryContent?.scrollTop||0
  };
}
function setLunoHistory(view){
  try{
    const current=history.state?.luno;
    const snapshot=lunoHistorySnapshot();
    if(current) history.replaceState(snapshot,"",location.href);
    const active=document.activeElement;
    const next={luno:view,scrollY:window.scrollY,focusId:active?.id||"",focusCardDataId:active?.closest?.(".card")?.dataset?.id||"",libraryScrollTop:libraryContent?.scrollTop||0};
    const url=location.pathname+location.search; // Keep views in history.state; hash fragments can trigger native page jumps on iOS Safari.
    if(current===view) history.replaceState(next,"",url);
    else history.pushState(next,"",url);
  }catch{}
}
function ensureLunoHistory(){
  try{
    if(!history.state?.luno) history.replaceState({luno:"home",scrollY:window.scrollY,focusId:"",libraryScrollTop:0},"",location.pathname+location.search);
  }catch{}
}
function restoreLunoHistoryPosition(state){
  window.setTimeout(()=>{
    if(Number.isFinite(Number(state?.scrollY))) window.scrollTo({top:Number(state.scrollY),behavior:"auto"});
    if(libraryContent && Number.isFinite(Number(state?.libraryScrollTop))) libraryContent.scrollTop=Number(state.libraryScrollTop);
    let target=state?.focusId ? document.getElementById(state.focusId) : null;
    if(!target && state?.focusCardDataId){
      target=[...document.querySelectorAll(".card")].find(card=>card.dataset.id===state.focusCardDataId)||null;
    }
    if(target && !target.closest(".hidden,[hidden],[aria-hidden=true]")){
      try{target.focus({preventScroll:true});}catch{target.focus();}
      target.classList.add("tv-remote-focus");
    }
  },0);
}
function openDetail(item){
  if(!item) return;
  detailReturnLibrary=libraryView && !libraryView.classList.contains("hidden") ? libraryType : "";
  if(detailReturnLibrary) closeLibrary(true);
  currentItem=item;
  try{
    setLunoHistory("detail");
    paintDetail(item);
  }catch(error){
    console.error("[LUNO] paintDetail failed",error);
  }
  if(detailBackdrop) detailBackdrop.style.backgroundImage=item?.background ? 'url("'+String(item.background).replace(/"/g,"&quot;")+'")' : "";
  const trailerVideo=document.querySelector("#detailTrailerVideo");
  const trailerSound=document.querySelector("#detailTrailerSound");
  const trailerUrl=String(item?.trailerUrl||item?.trailer||"").trim();
  if(trailerVideo){
    trailerVideo.pause();
    trailerVideo.removeAttribute("src");
    trailerVideo.load();
    trailerVideo.classList.remove("is-ready");
    if(trailerUrl && /^(https?:)?\/\//i.test(trailerUrl) && /\.(mp4|webm|m3u8)(\?|$)/i.test(trailerUrl)){
      trailerVideo.src=trailerUrl;
      trailerVideo.muted=true;
      trailerVideo.playsInline=true;
      trailerVideo.load();
      const playTrailer=()=>trailerVideo.play().then(()=>trailerVideo.classList.add("is-ready")).catch(()=>{});
      trailerVideo.oncanplay=playTrailer;
      playTrailer();
    }
  }
  if(trailerSound){
    trailerSound.classList.remove("is-on");
    trailerSound.onclick=()=>{
      if(!trailerVideo || !trailerVideo.src) return;
      trailerVideo.muted=!trailerVideo.muted;
      trailerSound.classList.toggle("is-on",!trailerVideo.muted);
      trailerSound.setAttribute("aria-label",trailerVideo.muted?"Включить звук трейлера":"Выключить звук трейлера");
      if(!trailerVideo.paused) return;
      trailerVideo.play().catch(()=>{});
    };
  }
  paintFavoriteButton(item);
  detail?.classList.remove("hidden");
  document.body.classList.add("detail-open");
  if(detail){
    detail.classList.remove("is-entering");
    requestAnimationFrame(()=>detail.classList.add("is-entering"));
    const finishEntry=()=>detail?.classList.remove("is-entering");
    detail.addEventListener("transitionend",finishEntry,{once:true});
    window.setTimeout(finishEntry,420);
  }
  detailPlay?.focus();
}
function closeDetail(fromHistory=false){
  if(!fromHistory && history.state?.luno==="detail"){
    try{ history.back(); }catch{}
    return;
  }
  detail?.classList.add("hidden");
  document.body.classList.remove("detail-open");
  currentItem=null;
  if(detailReturnLibrary){
    const target=detailReturnLibrary;
    detailReturnLibrary="";
    openLibrary(target,false);
  }
}

document.querySelectorAll(".luno-detail-links [data-section]").forEach((button)=>{
  button.addEventListener("click",()=>{
    const section=button.dataset.section;
    closeDetail(true);
    if(section) setTimeout(()=>document.querySelector('[data-section="'+section+'"]')?.click(),0);
  });
});
detailPlay?.addEventListener("click",()=>{
  if(currentItem) openPlayer(currentItem.id,currentItem.type,currentItem.name);
});
detailTrailer?.addEventListener("click",()=>{
  if(!currentItem) return;
  const title=String(currentItem.name||"").trim();
  if(!title) return;
  window.open("https://www.youtube.com/results?search_query="+encodeURIComponent(title+" трейлер"),"_blank","noopener,noreferrer");
});
detailOpenEpisodes?.addEventListener("click",()=>detailEpisodes?.click());
detailEpisodes?.addEventListener("click",()=>{
  if(!currentItem || currentItem.type!=="series") return;
  openPlayer(currentItem.id,currentItem.type,currentItem.name);
  const started=Date.now();
  const waitForEpisodes=()=>{
    if(!player.classList.contains("hidden") && !playerResolving && playerStreams.length){
      renderEpisodeSheet();
      openEpisodeSheet();
      return;
    }
    if(Date.now()-started<15000) window.setTimeout(waitForEpisodes,250);
  };
  window.setTimeout(waitForEpisodes,250);
});
document.querySelector("#closeDetail")?.addEventListener("click",closeDetail);
document.querySelector("#closeDetailSecondary")?.addEventListener("click",closeDetail);
document.querySelector("#openAddonManagerDetail")?.addEventListener("click",()=>document.querySelector("#openAddonManager")?.click());
document.querySelector(".luno-detail-search")?.addEventListener("click",()=>{ closeDetail(); openSearch(); });
document.querySelector(".luno-detail-brand")?.addEventListener("click",()=>{ closeDetail(); navigate("home"); });
document.querySelectorAll(".luno-detail-links [data-section]").forEach(btn=>btn.addEventListener("click",()=>{ const section=btn.dataset.section; closeDetail(); navigate(section); }));

document.querySelector("#detailTags")?.addEventListener("click",event=>{
  const tag=event.target.closest("[data-detail-genre]");
  if(!tag)return;
  const query=tag.dataset.detailGenre||"";
  closeDetail();
  openSearch();
  if(searchInput){searchInput.value=query;searchInput.dispatchEvent(new Event("input"));}
});
detailFavorite?.addEventListener("click",()=>{ if(currentItem) toggleFavorite(currentItem); });
closeSearch?.addEventListener("click",closeSearchPanel);

function loadResume(){
  try{
    const value=JSON.parse(localStorage.getItem("luno-resume")||"[]");
    return Array.isArray(value) ? value.filter(x=>x?.id).map(normalizeItem) : [];
  }catch{return []}
}

function saveResume(item,position=0,duration=0){
  if(!item?.id) return;
  const list=loadResume().filter(x=>x.id!==item.id);
  list.unshift({...item,position:Number(position)||0,duration:Number(duration)||0,updatedAt:Date.now()});
  try{localStorage.setItem("luno-resume",JSON.stringify(list.slice(0,20)));}catch{}
  renderResume();
}

function renderResume(){
  resumeItems=loadResume();
  if(!continueSection) return;
  if(!resumeItems.length){
    continueSection.classList.add("resume-empty");
    continueCards.innerHTML="";
    return;
  }
  continueSection.classList.remove("resume-empty");
  continueCards.innerHTML=resumeItems.slice(0,12).map(card).join("");
  bindCards();
}

function getLibraryItems(type){
  const source={
    movies:movieItems,
    series:seriesItems,
    cartoons:cartoonItems,
    anime:animeItems,
    shows:showItems
  }[type] || [];
  return source.slice().sort((a,b)=>
    (Number(b.popularity)||0)-(Number(a.popularity)||0)
  );
}

let libraryType="";
let libraryItems=[];
let librarySourceItems=[];
let libraryVisible=0;
let librarySort="popular";
const LIBRARY_BATCH=24;

function sortLibraryItems(items,sort=librarySort){
  const list=items.slice();
  if(sort==="rating") return list.sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0)||(Number(b.popularity)||0)-(Number(a.popularity)||0));
  if(sort==="newest") return list.sort((a,b)=>getYear(b)-getYear(a)||(Number(b.popularity)||0)-(Number(a.popularity)||0));
  return list.sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0));
}

function applyLibrarySort(sort){
  if(!["popular","rating","newest"].includes(sort)) return;
  librarySort=sort;
  libraryItems=sortLibraryItems(
    ["popular","continue","openCinema","recommendations","evening","classics","favorites"].includes(libraryType)
      ? librarySourceItems
      : getLibraryItems(libraryType),
    sort
  );
  libraryVisible=0;
  const grid=libraryContent?.querySelector(".library-infinite-grid");
  if(grid) grid.innerHTML="";
  libraryContent?.querySelectorAll("[data-library-sort]").forEach(button=>{
    const active=button.dataset.librarySort===sort;
    button.classList.toggle("active",active);
    button.setAttribute("aria-pressed",String(active));
  });
  const count=libraryContent?.querySelector(".library-toolbar-count");
  if(count) count.textContent=String(libraryItems.length);
  const loader=libraryContent?.querySelector("#libraryLoader");
  if(loader) loader.textContent=libraryItems.length?"Прокрути вниз для продолжения":"В этой категории пока нет фильмов";
  renderLibraryBatch();
}

function renderLibraryBatch(){
  if(!libraryContent) return;
  const next=libraryItems.slice(libraryVisible,libraryVisible+LIBRARY_BATCH);
  const grid=libraryContent.querySelector(".library-infinite-grid");
  if(!grid) return;
  if(!next.length){
    const loader=libraryContent.querySelector("#libraryLoader");
    if(loader) loader.textContent=libraryItems.length?"Вы просмотрели весь каталог":"В этой категории пока нет фильмов";
    return;
  }
  grid.insertAdjacentHTML("beforeend",next.map(card).join(""));
  libraryVisible+=next.length;
  bindCards();
  const loader=libraryContent.querySelector("#libraryLoader");
  if(loader) loader.textContent=libraryVisible>=libraryItems.length?"Вы просмотрели весь каталог":"Прокрути вниз для продолжения";
}

function openCategoryHub(){
  setLunoHistory("catalog");
  if(!libraryView || !libraryContent) return;
  libraryType="catalog";
  libraryTitle.textContent="Каталог";
  libraryKicker.textContent="";
  libraryContent.innerHTML=
    '<div class="luno-catalog-intro">'+
      '<span class="luno-catalog-eyebrow"><i></i> ТВОЯ ВСЕЛЕННАЯ КИНО</span>'+
      '<h2>Что будем <em>смотреть?</em></h2>'+
      '<p>Большие истории начинаются с одного выбора.</p>'+
    '</div>'+
    '<div class="category-hub luno-category-hub">'+
      '<button class="category-hub-card luno-category-film" data-category="movies"><span class="luno-category-icon">▰</span><small class="luno-category-overline">БОЛЬШОЙ ЭКРАН</small><strong>Фильмы</strong><small class="luno-category-desc">Истории на один вечер</small><b class="luno-category-arrow">↗</b></button>'+
      '<button class="category-hub-card luno-category-series" data-category="series"><span class="luno-category-icon">▤</span><small class="luno-category-overline">СЛЕДУЮЩАЯ СЕРИЯ</small><strong>Сериалы</strong><small class="luno-category-desc">Истории, в которые погружаешься</small><b class="luno-category-arrow">↗</b></button>'+
      '<button class="category-hub-card luno-category-cartoons" data-category="cartoons"><span class="luno-category-icon">✦</span><small class="luno-category-overline">ДЛЯ ВСЕХ ВОЗРАСТОВ</small><strong>Мультфильмы</strong><small class="luno-category-desc">Яркие миры и герои</small><b class="luno-category-arrow">↗</b></button>'+
      '<button class="category-hub-card luno-category-anime" data-category="anime"><span class="luno-category-icon">◇</span><small class="luno-category-overline">МИР АНИМАЦИИ</small><strong>Аниме</strong><small class="luno-category-desc">Эмоции без границ</small><b class="luno-category-arrow">↗</b></button>'+
      '<button class="category-hub-card luno-category-shows" data-category="shows"><span class="luno-category-icon">◉</span><small class="luno-category-overline">В ПРЯМОМ ЭФИРЕ</small><strong>Шоу</strong><small class="luno-category-desc">Развлечения и открытия</small><b class="luno-category-arrow">↗</b></button>'+
      '<button class="category-hub-card luno-category-favorites" data-category="favorites"><span class="luno-category-icon">♡</span><small class="luno-category-overline">ТВОЯ КОЛЛЕКЦИЯ</small><strong>Моё кино</strong><small class="luno-category-desc">Избранное и продолжение</small><b class="luno-category-arrow">↗</b></button>'+
    '</div>'+
    '<div class="luno-catalog-foot"><span class="luno-catalog-foot-orbit">◐</span><span><strong>Твой вечер. Твой выбор.</strong><small>Открывай новое в LUNO</small></span></div>';
  libraryView.classList.remove("hidden");
  document.body.classList.add("library-open");
  libraryContent.scrollTop=0;
  libraryContent.querySelectorAll("[data-category]").forEach(button=>{
    button.addEventListener("click",()=>{
      const category=button.dataset.category;
      if(category==="favorites"){
        closeLibrary();
        favoritesSection?.scrollIntoView({behavior:"smooth",block:"start"});
      }else{
        openLibrary(category);
      }
    });
  });
}
function openLibrary(type,pushHistory=true){
  const config={
    movies:{title:"Фильмы",kicker:""},
    series:{title:"Сериалы",kicker:""},
    cartoons:{title:"Мультфильмы",kicker:""},
    anime:{title:"Аниме",kicker:""},
    shows:{title:"Шоу",kicker:""},
    history:{title:"История просмотра",kicker:"ТВОИ ПРОСМОТРЫ"},
    popular:{title:"Популярное",kicker:"СЕЙЧАС СМОТРЯТ"},
    continue:{title:"Продолжить просмотр",kicker:"ВОЗВРАЩАЙСЯ"},
    openCinema:{title:"Open Cinema",kicker:"ОТКРЫТОЕ КИНО"},
    recommendations:{title:"Рекомендуем тебе",kicker:"ВЫБОР LUNO"},
    evening:{title:"Что посмотреть сегодня",kicker:"НА ВЕЧЕР"},
    classics:{title:"Культовое кино",kicker:"ПРОВЕРЕНО ВРЕМЕНЕМ"},
    favorites:{title:"Избранное",kicker:"ТВОЯ КОЛЛЕКЦИЯ"}
  }[type];
  if(!config || !libraryView) return;

  document.body.classList.add("show-global-back");
  if(pushHistory) setLunoHistory(type);
  if(["popular","continue","openCinema","recommendations","evening","classics","favorites"].includes(type)){
    const all=[...new Map(catalogItems.filter(item=>item?.id).map(item=>[item.id,item])).values()];
    const stableKey=item=>{const value=String(item.id||item.name||item.title||"");let hash=2166136261;for(const ch of value){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;};
    const popular=all.slice().sort((x,y)=>(Number(y.popularity)||0)-(Number(x.popularity)||0));
    const topIds=new Set(popular.slice(0,6).map(item=>item.id));
    const recommendations=all.filter(item=>!topIds.has(item.id)).sort((x,y)=>stableKey(x)-stableKey(y));
    const genres=item=>Array.isArray(item.genres)?item.genres.map(x=>String(x).toLowerCase()):[];
    const evening=all.filter(item=>genres(item).some(g=>/комеди|роман|приключ|семейн|фэнтези|мелодрам/.test(g))).sort((x,y)=>stableKey(x)-stableKey(y));
    const classics=all.filter(item=>getYear(item)>0&&getYear(item)<=2010).sort((x,y)=>stableKey(x)-stableKey(y));
    const source={popular,continue:loadResume(),openCinema:openCinemaItems,recommendations,evening,classics,favorites:loadFavorites()}[type]||[];
    libraryType=type;librarySourceItems=source.slice();libraryItems=librarySourceItems.slice();librarySort="popular";
    if(type!=="continue"&&type!=="favorites")libraryItems=sortLibraryItems(libraryItems,"popular");
    libraryVisible=0;libraryTitle.textContent=config.title;libraryKicker.textContent=config.kicker;
    libraryContent.innerHTML='<div class="library-toolbar"><span>Все подборки · '+escapeHtml(config.title.toLocaleLowerCase("ru-RU"))+'</span><strong class="library-toolbar-count">'+libraryItems.length+'</strong></div><div class="library-sort" role="group" aria-label="Сортировка подборки"><button type="button" class="active" data-library-sort="popular" aria-pressed="true">Популярное</button><button type="button" data-library-sort="rating" aria-pressed="false">По рейтингу</button><button type="button" data-library-sort="newest" aria-pressed="false">Новинки</button></div><div class="library-infinite-grid"></div><div class="library-loader" id="libraryLoader">Загрузка…</div>';
    libraryView.classList.remove("hidden");document.body.classList.add("library-open");libraryContent.scrollTop=0;
    libraryContent.querySelectorAll("[data-library-sort]").forEach(button=>button.addEventListener("click",()=>applyLibrarySort(button.dataset.librarySort)));
    renderLibraryBatch();if(libraryContent._observer)libraryContent._observer.disconnect();
    const loader=document.querySelector("#libraryLoader");
    if(loader){const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){if(libraryVisible<libraryItems.length)renderLibraryBatch();else loader.textContent="Вы просмотрели всю подборку";}},{root:libraryContent,rootMargin:"900px 0px"});observer.observe(loader);libraryContent._observer=observer;}
    return;
  }
  if(type==="history"){
    libraryType="history";
    libraryItems=loadHistory().sort((a,b)=>(Number(b.updatedAt)||0)-(Number(a.updatedAt)||0));
    libraryVisible=libraryItems.length;
    libraryTitle.textContent=config.title;
    libraryKicker.textContent=config.kicker;
    libraryContent.innerHTML=
      '<div class="library-toolbar"><span>Видео, которые ты начал смотреть</span>'+
      '<strong class="library-toolbar-count">'+libraryItems.length+'</strong></div>'+
      (libraryItems.length
        ? '<div class="library-infinite-grid history-watch-grid">'+libraryItems.map(card).join("")+'</div>'
        : '<div class="history-empty"><span class="history-empty-icon">◷</span><h3>Здесь появится история просмотров</h3><p>Начни смотреть фильм или сериал — он автоматически сохранится здесь.</p><button type="button" class="history-empty-action" data-section="home">Выбрать фильм</button></div>');
    libraryView.classList.remove("hidden");
    document.body.classList.add("library-open");
    libraryContent.scrollTop=0;
    bindCards();
    libraryContent.querySelector('[data-section="home"]')?.addEventListener("click",()=>{closeLibrary();navigate("home");});
    return;
  }
  libraryType=type;
  librarySort="popular";
  libraryItems=sortLibraryItems(getLibraryItems(type),"popular");
  libraryVisible=0;
  libraryTitle.textContent=config.title;
  libraryKicker.textContent=config.kicker;

  libraryContent.innerHTML=
    '<div class="library-toolbar">'+
      '<span>Все '+escapeHtml(config.title.toLocaleLowerCase("ru-RU"))+'</span>'+
      '<strong class="library-toolbar-count">'+libraryItems.length+'</strong>'+
    '</div>'+
    '<div class="library-sort" role="group" aria-label="Сортировка каталога">'+
      '<button type="button" class="active" data-library-sort="popular" aria-pressed="true">Популярное</button>'+
      '<button type="button" data-library-sort="rating" aria-pressed="false">По рейтингу</button>'+
      '<button type="button" data-library-sort="newest" aria-pressed="false">Новинки</button>'+
    '</div>'+
    '<div class="library-infinite-grid"></div>'+
    '<div class="library-loader" id="libraryLoader">Загрузка…</div>';

  libraryView.classList.remove("hidden");
  document.body.classList.add("library-open");
  libraryContent.scrollTop=0;
  libraryContent.querySelectorAll("[data-library-sort]").forEach(button=>{
    button.addEventListener("click",()=>applyLibrarySort(button.dataset.librarySort));
  });
  renderLibraryBatch();

  if(libraryContent._observer) libraryContent._observer.disconnect();
  const loader=document.querySelector("#libraryLoader");
  if(loader){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){
        if(libraryVisible<libraryItems.length){
          renderLibraryBatch();
        }else{
          loader.textContent="Вы просмотрели весь каталог";
        }
      }
    },{root:libraryContent,rootMargin:"900px 0px"});
    observer.observe(loader);
    libraryContent._observer=observer;
  }
}

function closeLibrary(fromHistory=false){
  libraryView?.classList.add("hidden");
  document.body.classList.remove("library-open");
  if(!fromHistory){
    try{
      if(history.state?.luno && history.state.luno!=="home" && history.state.luno!=="detail") history.back();
    }catch{}
  }
}

document.querySelectorAll("[data-home-collection]").forEach(button=>button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();const collection=button.dataset.homeCollection;if(collection)openLibrary(collection);}));

function navigate(section){
  document.body.classList.toggle("home-mode",section==="home");
  document.body.classList.toggle("show-global-back",section!=="home");
  document.querySelectorAll(".nav-item,.mobile-tab").forEach(x=>{
    x.classList.remove("active");
    x.removeAttribute("aria-current");
  });
  document.querySelectorAll('.nav-item[data-section="'+section+'"],.mobile-tab[data-section="'+section+'"]').forEach(x=>{
    x.classList.add("active");
    x.setAttribute("aria-current","page");
  });
  if(["movies","series","cartoons","anime","shows"].includes(section)){
    openLibrary(section);
    return;
  }
  if(section==="catalog"){
    openCategoryHub();
    return;
  }
  if(section==="history"){
    closeLibrary();
    openLibrary("history");
    return;
  }
  if(section==="settings"){
    closeLibrary();
    document.querySelector("#settingsBtn")?.click();
    return;
  }
  if(section==="search"){
    closeLibrary();
    openSearch();
    return;
  }
  closeLibrary();
  window.scrollTo({top:0,behavior:"smooth"});
}

function getYear(item){
  return Number(String(item?.releaseInfo||"").match(/\d{4}/)?.[0]||0);
}

function setHTMLIfChanged(node,html){
  if(node && node.innerHTML!==html) node.innerHTML=html;
}
function renderDiscovery(){
  const all=catalogItems.slice();
  const trending=all.slice().sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0)).slice(0,18);
  const fresh=all.filter(item=>getYear(item)>=new Date().getFullYear()-1)
    .sort((a,b)=>getYear(b)-getYear(a) || (Number(b.popularity)||0)-(Number(a.popularity)||0))
    .slice(0,18);
  const top=all.filter(item=>(Number(item.rating)||0)>0)
    .sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0) || (Number(b.popularity)||0)-(Number(a.popularity)||0))
    .slice(0,18);

  if(trendingCards) setHTMLIfChanged(trendingCards,trending.map(card).join(""));
  if(newCards) setHTMLIfChanged(newCards,fresh.map(card).join(""));
  if(topCards) setHTMLIfChanged(topCards,top.map(card).join(""));

  const genres=[
    ["Боевики","⚡"],["Комедии","☻"],["Драмы","◒"],["Фантастика","✦"],
    ["Триллеры","◉"],["Ужасы","☾"],["Приключения","◆"],["Семейные","◇"]
  ];
  if(genreGrid){
    genreGrid.innerHTML=genres.map(([name,icon])=>
      '<button class="genre-tile" data-genre="'+escapeHtml(name)+'"><span>'+icon+'</span><strong>'+escapeHtml(name)+'</strong><small>Смотреть подборку</small></button>'
    ).join("");
    genreGrid.querySelectorAll(".genre-tile").forEach(btn=>{
      btn.addEventListener("click",()=>{
        searchPanel?.classList.remove("hidden");
        if(searchInput){searchInput.value=btn.dataset.genre; searchInput.dispatchEvent(new Event("input"));}
      });
    });
  }
  bindCards();
}

function renderHomeHero(item){
  const hero=document.querySelector("#homeHero");
  if(!hero||!item)return;
  const title=String(item.name||item.title||"Открой новое кино");
  const background=String(item.background||item.backdrop||item.poster||"");
  const poster=String(item.poster||background);
  const year=getYear(item);
  const rating=Number(item.rating)||0;
  const type=mediaCategory(item)==="series"?"Сериал":"Фильм";
  const description=String(item.description||item.overview||"").trim();
  const backdrop=hero.querySelector(".home-hero-backdrop");
  if(backdrop)backdrop.style.backgroundImage=background ? "url(" + JSON.stringify(background.replace(/"/g, "%22")) + ")" : "none";
  const art=hero.querySelector(".home-hero-poster");
  if(art){art.src=poster;art.alt=title;art.hidden=!poster;}
  const heading=hero.querySelector(".home-hero-title");if(heading)heading.textContent=title;
  const meta=hero.querySelector(".home-hero-meta");if(meta)meta.textContent=[type,year||"",rating?"TMDB ★ "+rating.toFixed(1):""].filter(Boolean).join("  ·  ");
  const summary=hero.querySelector(".home-hero-description");if(summary)summary.textContent=description||"Выбери фильм и погрузись в историю. Открой карточку, чтобы посмотреть доступные источники.";
  hero.dataset.itemId=String(item.id||"");
  hero.classList.add("is-ready");
}

function renderCatalogSections(){
  const heroPick=catalogItems.slice().sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0))[0];
  renderHomeHero(heroPick);
  // Discovery is an enhancement, not a dependency for the primary poster rails.
  // A malformed discovery field must never prevent the home rows from rendering.
  try{
    renderDiscovery();
  }catch(error){
    console.error("[LUNO] Discovery rows failed; continuing with primary catalog rows",error);
    const fallback=catalogItems.slice().sort((a,b)=>(Number(b.popularity)||0)-(Number(a.popularity)||0)).slice(0,18);
    const html=fallback.map((item,index)=>card(item,index<6)).join("");
    [trendingCards,newCards,topCards].forEach(node=>{if(node && !node.children.length)node.innerHTML=html;});
  }
  if(movieCards) setHTMLIfChanged(movieCards,movieItems.slice(0,movieVisible).map((item,index)=>card(item,index<6)).join(""));
  if(openCinemaCards) setHTMLIfChanged(openCinemaCards,openCinemaItems.map((item,index)=>card(item,index<6)).join(""));
  if(seriesCards) setHTMLIfChanged(seriesCards,seriesItems.slice(0,seriesVisible).map((item,index)=>card(item,index<6)).join(""));
  const all=[...new Map(catalogItems.filter(item=>item?.id).map(item=>[item.id,item])).values()];
  // Keep LUNO recommendations stable while scrolling or re-rendering the catalog.
  // Deterministic ID hash gives a varied order without reshuffling on every render.
  const popularIds=new Set(all.slice().sort((a,b)=>
    (Number(b.popularity)||0)-(Number(a.popularity)||0)
  ).slice(0,6).map(item=>item.id));
  const stablePickKey=item=>{
    const value=String(item.id||item.name||item.title||"");
    let hash=2166136261;
    for(let i=0;i<value.length;i++){
      hash^=value.charCodeAt(i);
      hash=Math.imul(hash,16777619);
    }
    return hash>>>0;
  };
  let pickPool=all.filter(item=>!popularIds.has(item.id))
    .sort((a,b)=>stablePickKey(a)-stablePickKey(b));
  if(pickPool.length<18){
    const used=new Set(pickPool.map(item=>item.id));
    pickPool=pickPool.concat(all.filter(item=>!used.has(item.id))
      .sort((a,b)=>stablePickKey(a)-stablePickKey(b)));
  }
  const picks=pickPool.slice(0,18);
  // Randomize these editorial rails once per page session, while keeping their
  // order stable across scrolls and any subsequent catalog re-render.
  const homeShuffleKey=item=>{
    const value=String(item.id||item.name||item.title||"");
    let hash=2166136261;
    const seed=window.__LUNO_HOME_RANDOM_SEED||(window.__LUNO_HOME_RANDOM_SEED=Math.random().toString(36).slice(2));
    for(const ch of seed+"|"+value){
      hash^=ch.charCodeAt(0);
      hash=Math.imul(hash,16777619);
    }
    return hash>>>0;
  };
  const shuffleHomeRail=items=>items.slice().sort((a,b)=>homeShuffleKey(a)-homeShuffleKey(b));
  // Keep the three editorial rails distinct: no title already shown in LUNO picks
  // or the evening row may reappear in the classic-cinema row.
  const usedHomeIds=new Set(picks.map(item=>item.id));
  const eveningPool=shuffleHomeRail(all.filter(item=>{
    const genres=Array.isArray(item.genres)?item.genres.map(x=>String(x).toLowerCase()):[];
    return !usedHomeIds.has(item.id) &&
      genres.some(g=>/комеди|роман|приключ|семейн|фэнтези|мелодрам/.test(g));
  }));
  const evening=eveningPool.slice(0,18);
  evening.forEach(item=>usedHomeIds.add(item.id));
  const classics=shuffleHomeRail(all.filter(item=>
    !usedHomeIds.has(item.id) && getYear(item)>0 && getYear(item)<=2010
  )).slice(0,18);
  if(lunoPicksCards) setHTMLIfChanged(lunoPicksCards,picks.map((item,index)=>card(item,index<6)).join(""));
  if(eveningCards) setHTMLIfChanged(eveningCards,evening.map((item,index)=>card(item,index<6)).join(""));
  if(classicsCards) setHTMLIfChanged(classicsCards,classics.map((item,index)=>card(item,index<6)).join(""));
  renderResume();
  renderFavorites();
  bindCards();
}

function renderItems(items,sections={}){
  const unique=[...new Map(items.filter(x=>x?.id).map(x=>[x.id,normalizeItem(x)])).values()];
  if(!unique.length) return false;

  const map=new Map(unique.map(item=>[item.id,item]));
  const fromIds=(ids,fallbackType)=>{
    const result=(ids||[]).map(id=>map.get(id)).filter(Boolean);
    if(result.length) return result;
    return unique.filter(item=>item.type===fallbackType);
  };

  catalogItems=unique;
  catalogSections=sections||{};
  const classify=(items,type)=>items.filter(item=>mediaCategory(item)===type);
  movieItems=classify(unique,"movies");
  openCinemaItems=unique.filter(item=>item.openCinema);
  seriesItems=classify(unique,"series");
  cartoonItems=classify(unique,"cartoons");
  animeItems=classify(unique,"anime");
  showItems=classify(unique,"shows");
  animationItems=[...cartoonItems,...animeItems];

  window.__LUNO_ITEMS__=new Map(unique.map(item=>[item.id,item]));
  renderCatalogSections();
  return true;
}

async function loadTmdbCatalog(){
  const candidates=[
    new URL("./tmdb-catalog.json?v=12",document.baseURI).href,
    new URL("./tmdb-catalog.json",document.baseURI).href,
    new URL("/Luno/tmdb-catalog.json?v=12",location.origin).href,
    new URL("/Luno/tmdb-catalog.json",location.origin).href
  ];
  let lastError=null;
  for(const url of [...new Set(candidates)]){
    try{
      const response=await fetch(url,{cache:"no-store",headers:{accept:"application/json"}});
      if(!response.ok) throw new Error("HTTP "+response.status);
      const data=await response.json();
      const items=Array.isArray(data?.items) ? data.items : [];
      if(!items.length) throw new Error("empty catalog");
      return {items,sections:data?.sections||{}};
    }catch(error){
      lastError=error;
      console.warn("LUNO catalog attempt failed:",url,error);
    }
  }
  // Fallback providers: try LUNO's Worker first, then the CUB TMDB proxy.
  // Both return TMDB-shaped results; normalize them into LUNO's own catalog format.
  const base=String(window.__LUNO_API_BASE__||"https://luno-api.bqrt30.workers.dev").replace(/\/$/,"");
  const providers=[
    {name:"LUNO API",url:base+"/api/tmdb/discover?page=1"},
    {name:"CUB TMDB (cub.best)",url:"https://apitmdb.cub.best/3/trending/all/week?language=ru-RU&page=1&include_adult=false"},
    {name:"CUB TMDB (cub.black)",url:"https://apitmdb.cub.black/3/trending/all/week?language=ru-RU&page=1&include_adult=false"},
    {name:"CUB TMDB (durex.monster)",url:"https://apitmdb.durex.monster/3/trending/all/week?language=ru-RU&page=1&include_adult=false"}
  ];
  let fallbackError=null;
  for(const provider of providers){
    try{
      const response=await fetch(provider.url,{cache:"no-store",headers:{accept:"application/json"}});
      if(!response.ok)throw new Error(provider.name+" HTTP "+response.status);
      const data=await response.json();
      const raw=Array.isArray(data?.results)?data.results:[];
      const items=raw.filter(item=>item?.id&&(item?.name||item?.title||item?.original_name||item?.original_title)).map(item=>{
        const isSeries=item?.media_type==="tv"||item?.type==="tv"||item?.type==="series"||(!item?.title&&Boolean(item?.name||item?.first_air_date));
        const posterPath=String(item?.poster_path||item?.posterPath||"").split("/").filter(Boolean).join("/");
        const backdropPath=String(item?.backdrop_path||item?.backdropPath||"").split("/").filter(Boolean).join("/");
        const rawId=String(item?.id||"");
        const parsedId=rawId.match(/^tmdb:(?:(?:movie|tv|series):)?(\d+)$/)?.[1] || (/^\d+$/.test(rawId)?rawId:"");
        const tmdbId=Number(item?.tmdbId)||Number(parsedId)||0;
        return {
          ...item,
          id:tmdbId ? "tmdb:"+(isSeries?"tv":"movie")+":"+tmdbId : rawId,
          tmdbId,
          type:isSeries?"series":"movie",
          name:item?.name||item?.title||item?.original_name||item?.original_title||"Без названия",
          poster:item?.poster||(posterPath?"https://image.tmdb.org/t/p/w500/"+posterPath:""),
          background:item?.background||(backdropPath?"https://image.tmdb.org/t/p/w1280/"+backdropPath:""),
          description:item?.description||item?.overview||"",
          releaseInfo:item?.releaseInfo||item?.release_date||item?.first_air_date||"",
          rating:Number(item?.rating??item?.vote_average)||0,
          popularity:Number(item?.popularity)||0,
          genreIds:Array.isArray(item?.genreIds)?item.genreIds:(Array.isArray(item?.genre_ids)?item.genre_ids:[]),
          genres:Array.isArray(item?.genres)?item.genres:[],
          originalLanguage:item?.originalLanguage||item?.original_language||"",
          originCountry:Array.isArray(item?.originCountry)?item.originCountry:(Array.isArray(item?.origin_country)?item.origin_country:[])
        };
      });
      if(items.length){
        console.warn("LUNO catalog loaded through fallback:",provider.name,items.length);
        return {items,sections:{}};
      }
      throw new Error(provider.name+" returned no results");
    }catch(error){
      fallbackError=error;
      console.warn("LUNO catalog fallback failed:",provider.name,error);
    }
  }

  // The build creates this module from the same verified catalog. It is bundled
  // into app.js so the home screen still has data if Pages JSON fetches fail.
  const bundledItems=Array.isArray(bundledTmdbCatalog?.items)?bundledTmdbCatalog.items:[];
  if(bundledItems.length){
    console.warn("[LUNO] Using bundled TMDB catalog after network fetch failure", {
      count: bundledItems.length,
      fetchError: String(fallbackError?.message||lastError?.message||"unknown error")
    });
    return {items:bundledItems,sections:bundledTmdbCatalog.sections||{}};
  }
  throw new Error("TMDB catalog unavailable: "+(lastError?.message||"unknown error"));
}

async function loadMoreCatalog(){
  if(catalogLoading) return;
  catalogLoading=true;
  try{
    const hasHiddenItems=movieVisible<movieItems.length || seriesVisible<seriesItems.length;
    if(hasHiddenItems){
      movieVisible+=18;
      seriesVisible+=18;
      renderCatalogSections();
      return;
    }
    if(window.__LUNO_TMDB_TOTAL_PAGES__ && (window.__LUNO_TMDB_PAGE__||1)>=window.__LUNO_TMDB_TOTAL_PAGES__) return;
    const nextPage=(window.__LUNO_TMDB_PAGE__||1)+1;
    const base=String(window.__LUNO_API_BASE__||"https://luno-api.bqrt30.workers.dev").replace(/\/$/,"");
    const response=await fetch(base+"/api/tmdb/discover?page="+nextPage,{cache:"no-store",headers:{accept:"application/json"}});
    if(!response.ok) throw new Error("TMDB page HTTP "+response.status);
    const data=await response.json();
    const pageItems=(Array.isArray(data?.results)?data.results:[]).filter(item=>item?.id).map(normalizeItem);
    window.__LUNO_TMDB_PAGE__=Number(data?.page)||nextPage;
    window.__LUNO_TMDB_TOTAL_PAGES__=Math.max(window.__LUNO_TMDB_PAGE__,Number(data?.totalPages)||window.__LUNO_TMDB_PAGE__);
    if(!pageItems.length) return;
    const merged=[...catalogItems,...pageItems];
    const unique=[...new Map(merged.filter(item=>item?.id).map(item=>[item.id,item])).values()];
    movieVisible+=18;
    seriesVisible+=18;
    renderItems(unique,catalogSections);
  }catch(error){
    console.warn("[LUNO] Could not load next TMDB page",error);
    movieVisible=Math.min(movieItems.length,movieVisible+18);
    seriesVisible=Math.min(seriesItems.length,seriesVisible+18);
    renderCatalogSections();
  }finally{
    catalogLoading=false;
  }
}

function providerLabel(provider){ return String(provider?.name||provider?.id||"LUNO Source"); }
function renderAddonManager(){
  if(!addonList) return;
  const engine=window.__LUNO_SOURCE_ENGINE__;
  renderSourceManager(addonList,{
    providers:engine?.listProviders?.()||[],
    sources:engine?.listSources?.()||[],
    status:engine?.getStatus?.()||{},
    preferences:engine?.getSourcePreferences?.()||{}
  });
  bindSourceManager(addonList,(id,enabled,kind)=>{
    if(kind==="provider") engine?.setProviderEnabled?.(id,enabled);
    else engine?.setSourceEnabled?.(id,enabled);
    renderAddonManager();
  });
}
function openAddonManagerPanel(){ closeSourceSheetPanel(); addonManager?.classList.remove("hidden"); renderAddonManager(); }
function closeAddonManagerPanel(){ addonManager?.classList.add("hidden"); }
async function installAddonFromInput(){
  const endpoint=String(addonUrlInput?.value||"").trim();
  const name=String(addonNameInput?.value||"").trim();
  const engine=window.__LUNO_SOURCE_ENGINE__;
  if(!endpoint){
    if(addonManagerStatus) addonManagerStatus.textContent="Введи адрес endpoint источника.";
    addonUrlInput?.focus();
    return;
  }
  if(!engine?.addSourceDefinition){
    if(addonManagerStatus) addonManagerStatus.textContent="Движок источников ещё запускается. Попробуй через несколько секунд.";
    return;
  }
  const result=engine.addSourceDefinition({name,endpoint});
  if(!result?.ok){
    if(addonManagerStatus) addonManagerStatus.textContent=result?.error||"Не удалось добавить источник.";
    return;
  }
  if(addonManagerStatus) addonManagerStatus.textContent="Источник «"+result.source.name+"» добавлен.";
  if(sourceInstallForm) sourceInstallForm.reset();
  renderAddonManager();
}

function showCatalogMessage(message){
  if(movieCards) movieCards.innerHTML='<div class="catalog-message">'+escapeHtml(message)+'</div>';
  if(seriesCards) seriesCards.innerHTML="";
}

function getDirectStreamUrl(stream){
  if(!stream || typeof stream!=="object") return "";
  const candidates=[
    stream.url,
    stream.streamingUrl,
    stream.externalUrl,
    stream.webosUrl
  ];
  for(const candidate of candidates){
    const value=String(candidate||"").trim();
    if(!/^https?:\/\//i.test(value)) continue;
    if(/\.(?:torrent)(?:$|[?#])/i.test(value)) continue;
    return value;
  }
  return "";
}

function isBrowserPlayableStream(stream){
  if(!stream || typeof stream!=="object") return false;
  const direct=getDirectStreamUrl(stream);
  if(direct) return true;
  const url=String(stream.url||"").trim();
  if(/^magnet:/i.test(url)) return false;
  if(stream.infoHash || stream.infohash || stream.fileIdx!=null) return false;
  return false;
}

function streamKind(entry){
  const stream=entry?.stream||{};
  if(isBrowserPlayableStream(stream)) return "direct";
  const url=String(stream.url||"").trim();
  if(/^magnet:/i.test(url) || stream.infoHash || stream.infohash || stream.fileIdx!=null){
    return "p2p";
  }
  return "unsupported";
}

function streamLabel(entry,index){
  const stream=entry?.stream||{};
  const name=stream.name || stream.description || "";
  const addon=entry?.addon?.manifest?.name || "";
  const text=[name,addon].filter(Boolean).join(" • ");
  return text || "Источник "+(index+1);
}

function streamQuality(entry){
  const hints=entry?.stream?.behaviorHints||{};
  const text=[entry?.stream?.name,entry?.stream?.description].filter(Boolean).join(" ");
  const match=text.match(/(?:2160|1440|1080|720|576|480|360)p?/i);
  if(match) return match[0].toUpperCase();
  if(hints.videoSize) return Math.round(Number(hints.videoSize)/1024/1024)+" MB";
  return "";
}

function currentStreamEntry(){
  const index=Number(playerStreamState?.selectedIndex);
  return Number.isInteger(index)&&playerStreams[index] ? playerStreams[index] : playerStreams[0]||null;
}
function streamQualities(entry){
  const map=entry?.stream?.quality||entry?.stream?.qualitys||{};
  return Object.entries(map).filter(([,url])=>/^https?:\/\//i.test(String(url||"")))
    .map(([label,url])=>({label,url}))
    .sort((a,b)=>qualityNumber(b.label)-qualityNumber(a.label));
}
function streamSubtitles(entry){
  return Array.isArray(entry?.stream?.subtitles)?entry.stream.subtitles.filter(x=>/^https?:\/\//i.test(String(x?.url||""))):[];
}
function streamEpisode(entry){
  const s=entry?.stream||{};
  const season=Number(s.season)||0;
  const episode=Number(s.episode)||0;
  if(!season&&!episode)return "";
  return "S"+String(season).padStart(2,"0")+"E"+String(episode).padStart(2,"0");
}
function renderEpisodeSheet(){
  if(!episodeList)return;
  const items=playerStreams.map((entry,index)=>({entry,index,label:streamEpisode(entry)||("Серия "+(index+1))}))
    .filter(x=>x.label);
  const uniqueItems=[]; const seen=new Set();
  for(const item of items){if(!seen.has(item.label)){seen.add(item.label);uniqueItems.push(item)}}
  episodeList.innerHTML=uniqueItems.length
    ? uniqueItems.map((x,i)=>'<button class="source-option" type="button" data-episode-index="'+i+'"><span><strong>'+escapeHtml(x.label)+'</strong><span>'+escapeHtml(x.entry?.stream?.episode_title||"Источник")+'</span></span></button>').join("")
    : '<div class="source-empty">Источник не передал данные серий.</div>';
  episodeList.querySelectorAll("[data-episode-index]").forEach(btn=>btn.onclick=()=>{
    const item=uniqueItems[Number(btn.dataset.episodeIndex)];
    if(item){selectLunoSource(item.index);episodeSheet?.classList.add("hidden")}
  });
}
function streamVoice(entry){
  const s=entry?.stream||{};
  const value=s.voice||s.voice_name||s.translation||s.dubbing||s.author;
  if(!value)return "";
  if(typeof value==="string")return value.trim();
  return String(value.name||value.title||value.label||value.id||"").trim();
}
function renderVoiceSheet(){
  if(!voiceList)return;
  const groups=new Map();
  for(const entry of playerStreams){
    const voice=streamVoice(entry)||"Оригинал";
    const key=voice.toLowerCase();
    if(!groups.has(key))groups.set(key,{label:voice,entry});
  }
  const list=[...groups.values()];
  voiceList.innerHTML=list.length
    ? list.map((v,i)=>'<button class="source-option" type="button" data-voice-index="'+i+'"><span><strong>'+escapeHtml(v.label)+'</strong><span>Источник с этой озвучкой</span></span></button>').join("")
    : '<div class="source-empty">Источник не передал данные об озвучке.</div>';
  voiceList.querySelectorAll("[data-voice-index]").forEach(btn=>btn.onclick=()=>{
    const item=list[Number(btn.dataset.voiceIndex)];
    if(item?.entry){
      const index=playerStreams.indexOf(item.entry);
      if(index>=0)selectLunoSource(index);
    }
    voiceSheet?.classList.add("hidden");
  });
}
function renderQualitySheet(){
  if(!qualityList)return;
  const entry=currentStreamEntry();
  const list=streamQualities(entry);
  qualityList.innerHTML=(list.length?list:[{label:"Авто",url:entry?.stream?.url||""}]).map((q,i)=>
    '<button class="source-option" type="button" data-quality-index="'+i+'"><span><strong>'+escapeHtml(q.label)+'</strong><span>'+(i===0?"Лучшее доступное":"Поток источника")+'</span></span></button>'
  ).join("");
  qualityList.querySelectorAll("[data-quality-index]").forEach(btn=>btn.onclick=()=>{
    const q=list[Number(btn.dataset.qualityIndex)];
    if(q?.url){
      setLunoStream(q.url,{label:(entry?streamLabel(entry,playerStreams.indexOf(entry)):"LUNO")+" • "+q.label,stream:entry.stream,resume:false});
    }
    qualitySheet?.classList.add("hidden");
  });
}
function renderSubtitleSheet(){
  if(!subtitleList)return;
  const entry=currentStreamEntry();
  const list=streamSubtitles(entry);
  subtitleList.innerHTML='<button class="source-option" type="button" data-subtitle="off"><span><strong>Выключить</strong><span>Без субтитров</span></span></button>'+
    list.map((s,i)=>'<button class="source-option" type="button" data-subtitle-index="'+i+'"><span><strong>'+escapeHtml(s.label||s.lang||("Субтитры "+(i+1)))+'</strong><span>'+escapeHtml(s.lang||"")+'</span></span></button>').join("");
  subtitleList.querySelector('[data-subtitle="off"]')?.addEventListener("click",()=>{clearTextTracks();subtitleSheet?.classList.add("hidden")});
  subtitleList.querySelectorAll("[data-subtitle-index]").forEach(btn=>btn.onclick=()=>{
    const s=list[Number(btn.dataset.subtitleIndex)];
    if(s) applyTextTrack(s);
    subtitleSheet?.classList.add("hidden");
  });
}
function clearTextTracks(){
  if(!lunoVideo)return;
  [...lunoVideo.querySelectorAll("track[data-luno-subtitle]")].forEach(t=>t.remove());
}
function applyTextTrack(subtitle){
  if(!lunoVideo||!subtitle?.url)return;
  clearTextTracks();
  const track=document.createElement("track");
  track.dataset.lunoSubtitle="1";
  track.kind="subtitles";
  track.label=subtitle.label||subtitle.lang||"Subtitles";
  track.srclang=subtitle.lang||"ru";
  track.src=subtitle.url;
  track.default=true;
  lunoVideo.appendChild(track);
  [...lunoVideo.textTracks].forEach(t=>t.mode=t.label===track.label?"showing":"disabled");
}
function renderSourceSheet(){
  if(!sourceList || !sourceEmpty) return;
  sourceList.innerHTML=playerStreams.map((entry,index)=>{
    const label=escapeHtml(streamLabel(entry,index));
    const quality=escapeHtml(streamQuality(entry));
    const kind=streamKind(entry);
    const disabled=kind!=="direct" ? " disabled aria-disabled=\"true\"" : "";
    const suffix=kind==="p2p"
      ? "P2P • браузерный LUNO Player не поддерживает"
      : (kind==="unsupported" ? "Формат не поддерживается" : (entry?.addon?.manifest?.name ? escapeHtml(entry.addon.manifest.name) : "Источник LUNO"));
    return '<button class="source-option" type="button" data-source-index="'+index+'"'+disabled+'>'+
      '<span><strong>'+label+'</strong><span>'+suffix+'</span></span>'+
      (quality ? '<span class="source-quality">'+quality+'</span>' : '')+
    '</button>';
  }).join("");
  sourceEmpty.classList.toggle("hidden",playerStreams.length>0);
  sourceList.querySelectorAll("[data-source-index]:not(:disabled)").forEach(button=>{
    button.addEventListener("click",()=>{
      selectLunoSource(Number(button.dataset.sourceIndex));
    });
  });
}

function openSourceSheet(){
  renderSourceSheet();
  sourceSheet?.classList.remove("hidden");
  sourceList?.querySelector("button")?.focus();
}

function closeSourceSheetPanel(){
  sourceSheet?.classList.add("hidden");
}

function buildMetaRequest(item,entry){
  const base=entry?.addon?.transportUrl || entry?.request?.base;
  if(!base || !item?.id) return null;
  const type=item.type==="series" ? "series" : "movie";
  const id=type==="movie"
    ? String(item.imdbId || item.videoId || item.id)
    : String(item.id);
  return {
    base,
    path:{
      resource:"meta",
      type,
      id,
      extra:[]
    }
  };
}

async function resolveLunoStreams(item){
  if(!item)return;
  playerResolveController?.abort();
  const controller=new AbortController();
  playerResolveController=controller;
  const requestId=++playerResolveId;
  playerResolving=true;
  playerStreams=[];
  renderSourceSheet();
  playerEmpty?.classList.remove("hidden");
  if(playerMessage) playerMessage.textContent="Ищем доступные источники…";
  if(playerSourceButton) playerSourceButton.disabled=true;

  try{
    const streamIdentity = item?.type==="movie" ? (item?.imdbId || item?.videoId || "") : (item?.videoId || "");
    let state=await loadMetaDetails(item,streamIdentity,{signal:controller.signal});
    if(requestId!==playerResolveId||controller.signal.aborted)return;
    let streams=getReadyMetaStreams(state);

    // Для сериала источник сначала получает metadata. Если первый запрос не выбрал
    // видео, выбираем продолжение из Library или первую доступную серию.
    if(!streams.length && item.type==="series"){
      const readyMeta=state?.metaItem?.content?.type==="Ready" ? state.metaItem.content.content : null;
      const videoId=state?.libraryItem?.state?.videoId ||
        readyMeta?.videos?.find(video=>!video.watched)?.id ||
        readyMeta?.videos?.[0]?.id || "";
      if(videoId){
        state=await loadMetaDetails(item,videoId,{signal:controller.signal});
        if(requestId!==playerResolveId||controller.signal.aborted)return;
        streams=getReadyMetaStreams(state);
      }
    }

    playerStreamState=state;
    playerStreams=streams.filter(entry=>entry?.stream);
    if(item?.type==="series") renderPlayerBrowse();

    const directStreams=playerStreams.filter(entry=>streamKind(entry)==="direct");
    const unsupportedStreams=playerStreams.filter(entry=>streamKind(entry)!=="direct");

    // Источники LUNO разрешаются встроенным Source Engine.
    renderSourceSheet();

    if(!playerStreams.length){
      if(playerMessage) playerMessage.textContent="Источник для этого контента не найден.";
      openSourceSheet();
      return;
    }

    if(directStreams.length===1){
      const directIndex=playerStreams.indexOf(directStreams[0]);
      if(item?.type==="series"){
        renderPlayerBrowse();
        playerEmpty?.classList.add("hidden");
      }else{
        await selectLunoSource(directIndex);
      }
    }else if(directStreams.length>1){
      if(playerMessage) playerMessage.textContent="Выберите источник просмотра.";
      openSourceSheet();
    }else{
      const hasP2P=unsupportedStreams.some(entry=>streamKind(entry)==="p2p");
      if(playerMessage) playerMessage.textContent=hasP2P
        ? "Источник найден, но он отдаёт P2P/torrent. LUNO Player в браузере принимает прямые HTTP/HLS/MP4 потоки."
        : "Источник найден, но его формат не поддерживается LUNO Player.";
      openSourceSheet();
    }
  }catch(error){
    if(requestId!==playerResolveId||controller.signal.aborted)return;
    console.error("LUNO stream resolution failed",error);
    if(playerMessage) playerMessage.textContent="Не удалось получить источники. Попробуйте ещё раз.";
    openSourceSheet();
  }finally{
    if(requestId===playerResolveId){
      playerResolving=false;
      playerResolveController=null;
      if(playerSourceButton) playerSourceButton.disabled=false;
    }
  }
}

async function selectLunoSource(index){
  const entry=playerStreams[index];
  if(!entry?.stream) return;
  closeSourceSheetPanel();
  if(playerStreamState) playerStreamState.selectedIndex=index;
  if(currentItem?.type==="series"){ playerBrowse?.classList.remove("hidden"); renderPlayerBrowse(); } else { playerBrowse?.classList.add("hidden"); }
  playerEmpty?.classList.remove("hidden");
  if(playerMessage) playerMessage.textContent="Подготавливаем источник…";
  if(playerBarMeta) playerBarMeta.textContent=streamLabel(entry,index);

  try{
    // Source Engine уже вернул конкретный stream. Для прямых URL отдаём
    // поток непосредственно нашему LUNO Player — модель Core Player здесь
    // не должна блокировать воспроизведение.
    const kind=streamKind(entry);
    if(kind!=="direct"){
      playerEmpty?.classList.remove("hidden");
      if(playerMessage) playerMessage.textContent=kind==="p2p"
        ? "Этот источник отдаёт P2P/torrent и не может быть воспроизведён напрямую в браузерном LUNO Player."
        : "Этот источник не отдаёт поддерживаемый прямой поток.";
      openSourceSheet();
      return;
    }

    const directStreamUrl=getDirectStreamUrl(entry.stream);

    if(directStreamUrl){
      setLunoStream(directStreamUrl,{label:streamLabel(entry,index),resume:true,stream:entry.stream});
      return;
    }

    // Для потоков без прямого URL используем внутренний player-resolver.
    const metaRequest=buildMetaRequest(currentItem,entry);
    const playerState=await loadLunoPlayer(entry.stream,entry.request,metaRequest,{
      resource:"subtitles",
      type:currentItem?.type==="series" ? "series" : "movie",
      id:entry.request?.path?.id || currentItem?.id || "",
      extra:[]
    });
    const streamUrl=getPlayerStreamUrl(playerState);

    if(!streamUrl){
      playerEmpty?.classList.remove("hidden");
      if(lunoVideo) lunoVideo.classList.remove("is-ready");
      if(playerMessage) playerMessage.textContent="Этот источник не отдаёт прямой поток для LUNO Player.";
      return;
    }

    setLunoStream(streamUrl,{label:streamLabel(entry,index),resume:true,stream:entry.stream});
  }catch(error){
    console.error("LUNO player load failed",error);
    if(playerMessage) playerMessage.textContent="Источник не удалось запустить.";
    playerEmpty?.classList.remove("hidden");
  }
}

function renderPlayerBrowse(){
  if(!playerBrowse || currentItem?.type!=="series") return;
  const item=currentItem;
  const image=item?.background || item?.poster || "";
  const selectedIndex=Number(playerStreamState?.selectedIndex);
  const selectedEntry=Number.isInteger(selectedIndex) ? playerStreams[selectedIndex] : null;

  if(playerBrowseTitle) playerBrowseTitle.textContent=item?.name || "Сериал";
  if(playerBrowseMeta) playerBrowseMeta.textContent=[
    item?.rating ? "★ "+Number(item.rating).toFixed(1) : "",
    String(item?.releaseInfo||"").match(/\d{4}/)?.[0] || "",
    "Сериал"
  ].filter(Boolean).join(" • ");
  if(playerBrowseDescription) playerBrowseDescription.textContent=item?.description || "";

  if(playerBrowseSource){
    const sourceName=selectedEntry
      ? (streamVoice(selectedEntry) || streamLabel(selectedEntry,selectedIndex))
      : (playerStreams[0] ? (streamVoice(playerStreams[0]) || streamLabel(playerStreams[0],0)) : "Поиск источника…");
    const strong=playerBrowseSource.querySelector("strong");
    if(strong) strong.textContent=sourceName;
  }

  const seasonValues=[...new Set(playerStreams.map(entry=>Number(entry?.stream?.season)||0).filter(Boolean))].sort((a,b)=>a-b);
  if(!seasonValues.length) seasonValues.push(1);
  if(!seasonValues.includes(playerSeason)){
    const selectedSeason=Number(selectedEntry?.stream?.season)||0;
    playerSeason=seasonValues.includes(selectedSeason) ? selectedSeason : seasonValues[0];
  }

  const seasonTabs=document.querySelector("#playerBrowseSeasons");
  if(seasonTabs){
    seasonTabs.innerHTML=seasonValues.map(season=>
      '<button type="button" class="'+(season===playerSeason?"active":"")+'" data-season="'+season+'">'+season+'</button>'
    ).join("");
    seasonTabs.querySelectorAll("[data-season]").forEach(button=>{
      button.addEventListener("click",()=>{
        playerSeason=Number(button.dataset.season)||seasonValues[0];
        renderPlayerBrowse();
      });
    });
  }

  const filteredSeason=playerStreams.map((entry,index)=>({entry,index})).filter(({entry})=>{
    const season=Number(entry?.stream?.season)||0;
    return !season || season===playerSeason;
  });

  const qualityMatch=(entry)=>{
    if(playerQualityFilter==="all") return true;
    const q=String(streamQuality(entry)||"").toLowerCase();
    if(playerQualityFilter==="4k") return /2160|4k|uhd/.test(q);
    if(playerQualityFilter==="1080") return /1080|fullhd|fhd/.test(q);
    if(playerQualityFilter==="720") return /720|hd/.test(q);
    return true;
  };
  const filtered=filteredSeason.filter(({entry})=>qualityMatch(entry));

  if(playerBrowseEpisodeCount) playerBrowseEpisodeCount.textContent=filteredSeason.length+" серий";

  if(playerBrowseEpisodeNumbers){
    playerBrowseEpisodeNumbers.innerHTML=filteredSeason.map(({entry,index})=>{
      const ep=Number(entry?.stream?.episode)||0;
      const label=ep ? String(ep).padStart(2,"0") : String(index+1).padStart(2,"0");
      return '<button type="button" class="'+(index===selectedIndex?"active":"")+'" data-episode-number="'+index+'">'+label+'</button>';
    }).join("");
    playerBrowseEpisodeNumbers.querySelectorAll("[data-episode-number]").forEach(button=>{
      button.addEventListener("click",()=>{
        const index=Number(button.dataset.episodeNumber);
        if(Number.isInteger(index)) selectLunoSource(index);
      });
    });
  }

  if(playerBrowseCurrentEpisode){
    const ep=Number(selectedEntry?.stream?.episode)||0;
    playerBrowseCurrentEpisode.textContent=selectedEntry
      ? "Серия "+(ep?String(ep).padStart(2,"0"):"—")+" · "+(selectedEntry.stream?.episode_title || selectedEntry.stream?.title || "выбрана")
      : "Выберите серию";
  }

  if(!playerBrowseEpisodes) return;
  if(!filtered.length){
    playerBrowseEpisodes.innerHTML='<div class="player-browse-loading">Нет серий с выбранным качеством.</div>';
    return;
  }

  playerBrowseEpisodes.innerHTML=filtered.map(({entry,index})=>{
    const s=entry?.stream||{};
    const episode=Number(s.episode)||0;
    const label=episode ? String(episode).padStart(2,"0") : String(index+1).padStart(2,"0");
    const thumb=s.thumbnail || s.poster || s.logo || image || "";
    const title=s.episode_title || s.episodeName || s.title || ("Серия "+label);
    const rating=Number(s.rating ?? s.vote_average ?? item?.rating)||0;
    const duration=Number(s.duration ?? s.runtime ?? 0);
    const date=s.releaseInfo || s.air_date || s.date || "";
    const quality=streamQuality(entry)||"AUTO";
    const progress=Number(s.progress ?? s.position ?? 0);
    const progressDuration=Number(s.progressDuration ?? s.duration ?? 0);
    const percent=progressDuration>0 ? Math.max(0,Math.min(100,(progress/progressDuration)*100)) : 0;
    const active=index===selectedIndex;
    return '<button class="player-episode-card'+(active?" active":"")+'" type="button" data-player-episode="'+index+'">'+
      '<div class="player-episode-thumb" style="background-image:url(&quot;'+escapeHtml(thumb)+'&quot;)">'+
        '<span class="player-episode-num">'+escapeHtml(label)+'</span>'+
        '<span class="player-episode-quality">'+escapeHtml(quality)+'</span>'+
        '<span class="player-episode-duration">'+(duration?escapeHtml(formatDuration(duration)):"")+'</span>'+
        (percent>0?'<span class="player-episode-progress"><i style="width:'+percent.toFixed(1)+'%"></i></span>':"")+
      '</div>'+
      '<div class="player-episode-body"><strong>'+escapeHtml(title)+'</strong><div class="player-episode-meta">'+
        (rating?'<span>★ '+rating.toFixed(1)+'</span>':"")+
        (date?'<span>'+escapeHtml(String(date).match(/\d{4}-?\d{2}-?\d{2}/)?.[0]||String(date))+'</span>':"")+
      '</div></div></button>';
  }).join("");

  playerBrowseEpisodes.querySelectorAll("[data-player-episode]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const index=Number(btn.dataset.playerEpisode);
      if(Number.isInteger(index)) selectLunoSource(index);
    });
  });
}
function formatDuration(value){
  const seconds=Number(value)||0;
  if(seconds<=0)return "";
  const minutes=Math.round(seconds/60);
  if(minutes>=60){
    const h=Math.floor(minutes/60),m=minutes%60;
    return h+"ч"+(m?" "+m+"м":"");
  }
  return minutes+" мин";
}
function openPlayer(id,type,title,streamUrl=""){
  playerResolveId++;
  playerResolveController?.abort();
  playerResolveController=null;
  playerResolving=false;
  if(playerSourceButton) playerSourceButton.disabled=false;
  setLunoHistory("player");
  player.classList.remove("hidden");
  player.classList.remove("is-playing","player-browse-pinned");
  if(playerBrowseToggle){
    playerBrowseToggle.hidden=type!=="series";
    playerBrowseToggle.setAttribute("aria-expanded","false");
    playerBrowseToggle.textContent="☷ Серии";
  }
  if(playerBarTitle) playerBarTitle.textContent=title || "LUNO";
  if(playerBarMeta) playerBarMeta.textContent=type==="series" ? "Сериал" : "Фильм";
  if(lunoVideo){
    lunoVideo.pause();
    lunoVideo.removeAttribute("src");
    lunoVideo.load();
    lunoVideo.classList.remove("is-ready");
  }
  sourceSheet?.classList.add("hidden");
  episodeSheet?.classList.add("hidden");
  voiceSheet?.classList.add("hidden");
  qualitySheet?.classList.add("hidden");
  subtitleSheet?.classList.add("hidden");
  playerStreams=[];
  playerStreamState=null;
  playerSeason=0;
  playerBrowse?.classList.toggle("hidden",type!=="series");
  if(type==="series") renderPlayerBrowse();
  lastCoreTime=-1;
  if(streamUrl){
    playerBrowse?.classList.add("hidden");
    setLunoStream(streamUrl);
  }else{
    if(type==="series"){
      playerEmpty?.classList.add("hidden");
      renderPlayerBrowse();
    }else{
      playerEmpty?.classList.remove("hidden");
    }
    if(playerMessage) playerMessage.textContent="Ищем доступные источники…";
    resolveLunoStreams(currentItem);
  }
  document.querySelector("#closePlayer")?.focus();
}

// Save a title to viewing history only when playback actually starts.
lunoVideo?.addEventListener("playing",()=>{
  if(!currentItem?.id) return;
  saveHistoryItem(currentItem);
  if(libraryType==="history" && libraryView && !libraryView.classList.contains("hidden")){
    const scrollTop=libraryContent?.scrollTop||0;
    openLibrary("history",false);
    if(libraryContent) libraryContent.scrollTop=scrollTop;
  }
});

function closePlayer(fromHistory=false){
  playerResolveId++;
  playerResolveController?.abort();
  playerResolveController=null;
  playerResolving=false;
  if(playerSourceButton) playerSourceButton.disabled=false;
  if(!fromHistory && history.state?.luno==="player"){
    try{history.back();return;}catch{}
  }
  if(lunoVideo && currentItem && Number(lunoVideo.duration)>0 && Number(lunoVideo.currentTime)>5){
    window.LUNOPlayback?.progress(currentItem,lunoVideo.currentTime,lunoVideo.duration);
  }
  destroyActivePlayback();
  clearTextTracks();
  lunoVideo?.pause();
  sourceSheet?.classList.add("hidden");
  player.classList.add("hidden");
  unloadLunoPlayer().catch?.(()=>{});
}

let activeHls=null;
let activeDash=null;

function destroyActivePlayback(){
  activeHls?.destroy?.();
  activeHls=null;
  try{ activeDash?.reset?.(); }catch{}
  activeDash=null;
}

function setLunoStream(streamUrl,streamMeta={}){
  if(!lunoVideo || !streamUrl) return false;
  destroyActivePlayback();
  playerEmpty?.classList.add("hidden");
  lunoVideo.classList.add("is-ready");
  lunoVideo.removeAttribute("src");
  lunoVideo.removeAttribute("type");
  lunoVideo.load();

  const rawUrl=String(streamUrl).trim();
  const mediaUrl=rawUrl.split("|")[0];
  const hint=String(
    streamMeta?.stream?.behaviorHints?.contentType ||
    streamMeta?.stream?.contentType ||
    streamMeta?.contentType ||
    ""
  ).toLowerCase();

  const isHls=hint.includes("mpegurl") || hint.includes("hls") || /\.m3u8(?:$|[?#])/i.test(mediaUrl);
  const isDash=hint.includes("dash") || hint.includes("mpd") || /\.mpd(?:$|[?#])/i.test(mediaUrl);

  const showPlaybackError=(message)=>{
    destroyActivePlayback();
    lunoVideo.pause();
    lunoVideo.classList.remove("is-ready");
    playerEmpty?.classList.remove("hidden");
    if(playerMessage) playerMessage.textContent=message;
  };

  lunoVideo.onerror=()=>{
    showPlaybackError("Поток не удалось воспроизвести. Выберите другой источник.");
  };

  if(isDash && dashjs?.MediaPlayer){
    try{
      activeDash=dashjs.MediaPlayer().create();
      activeDash.initialize(lunoVideo,mediaUrl,true);
      activeDash.on(dashjs.MediaPlayer.events.ERROR,(event)=>{
        console.warn("LUNO DASH playback error",event);
      });
    }catch(error){
      console.warn("LUNO DASH init failed",error);
      showPlaybackError("DASH-поток не удалось запустить.");
      return false;
    }
  }else if(isHls && Hls.isSupported()){
    activeHls=new Hls({
      enableWorker:true,
      lowLatencyMode:false,
      backBufferLength:30,
      maxBufferLength:30,
      capLevelToPlayerSize:true
    });

    activeHls.on(Hls.Events.ERROR,(event,data)=>{
      if(!data?.fatal) return;
      console.warn("LUNO HLS playback error",data);
      if(data.type===Hls.ErrorTypes.MEDIA_ERROR){
        try{
          activeHls.recoverMediaError();
          return;
        }catch{}
      }
      showPlaybackError("HLS-поток не удалось запустить.");
    });

    activeHls.loadSource(mediaUrl);
    activeHls.attachMedia(lunoVideo);
  }else if(isHls && lunoVideo.canPlayType("application/vnd.apple.mpegurl")){
    lunoVideo.src=mediaUrl;
  }else{
    lunoVideo.src=mediaUrl;
  }

  if(playerBarMeta) playerBarMeta.textContent=streamMeta.label || playerBarMeta.textContent || "";
  const resume=loadResume().find(item=>item.id===currentItem?.id);
  const startAt=Number(resume?.position)||0;
  const onMetadata=()=>{
    if(startAt>5 && Number(lunoVideo.duration)>startAt+5){
      try{lunoVideo.currentTime=startAt;}catch{}
    }
    lunoVideo.removeEventListener("loadedmetadata",onMetadata);
  };
  lunoVideo.addEventListener("loadedmetadata",onMetadata);
  lunoVideo.play().catch(()=>{});
  window.LUNOPlayback?.start(currentItem);
  return true;
}

window.LUNOPlayer={openStream:setLunoStream};

let searchSource="tmdb";
let searchResultsState={tmdb:[],luno:[],ai:[]};

function loadSearchHistory(){
  try{
    const value=JSON.parse(localStorage.getItem("luno-search-history")||"[]");
    return Array.isArray(value) ? value.filter(Boolean).slice(0,12) : [];
  }catch{return []}
}
function saveSearchQuery(query){
  const q=String(query||"").trim();
  if(!q) return;
  const list=[q,...loadSearchHistory().filter(x=>normalizeSearchText(x)!==normalizeSearchText(q))].slice(0,12);
  try{localStorage.setItem("luno-search-history",JSON.stringify(list));}catch{}
  renderSearchHistory();
}
function renderSearchHistory(){
  const box=document.querySelector("#searchHistory");
  const block=document.querySelector("#searchHistoryBlock");
  if(!box) return;
  const history=loadSearchHistory();
  box.innerHTML=history.length
    ? history.map(q=>'<button type="button" class="search-history-chip" data-search-history="'+escapeHtml(q)+'"><span class="history-clock">◷</span>'+escapeHtml(q)+'</button>').join("")
    : '<span class="search-history-empty">Начни поиск — последние запросы появятся здесь</span>';
  block?.classList.toggle("is-empty",!history.length);
  box.querySelectorAll("[data-search-history]").forEach(btn=>btn.addEventListener("click",()=>{
    searchInput.value=btn.dataset.searchHistory||"";
    searchInput.dispatchEvent(new Event("input",{bubbles:true}));
    searchInput.focus();
  }));
}

function searchSourceItems(source){
  return dedupeSearchResults(searchResultsState[source]||[]);
}
function renderSearchSections(items,query){
  const resultBox=document.querySelector("#searchResults");
  if(!resultBox) return;
  const movies=items.filter(x=>mediaCategory(x)==="movies");
  const series=items.filter(x=>mediaCategory(x)==="series");
  const cartoons=items.filter(x=>["cartoons","anime"].includes(mediaCategory(x)));
  const shows=items.filter(x=>mediaCategory(x)==="shows");
  const section=(title,list)=>list.length
    ? '<section class="search-result-section"><h3>'+escapeHtml(title)+'<span>'+list.length+'</span></h3><div class="search-results-grid">'+list.slice(0,18).map(card).join("")+'</div></section>'
    : "";
  if(!items.length){
    resultBox.innerHTML=query
      ? '<div class="search-empty search-empty-modern"><strong>Ничего не нашли</strong><span>Попробуй другое название или убери год из запроса.</span></div>'
      : '<div class="search-discover"><strong>Что будем смотреть?</strong><span>Введи название фильма, сериала или франшизы.</span></div>';
    return;
  }
  resultBox.innerHTML=
    '<div class="search-results-heading">Результаты для «'+escapeHtml(query)+'»</div>'+
    section("Фильмы",movies)+section("Сериалы",series)+section("Мультфильмы и аниме",cartoons)+section("Шоу",shows);
  bindCards();
}
function updateSearchSourceUI(){
  document.querySelectorAll(".search-source").forEach(btn=>btn.classList.toggle("active",btn.dataset.searchSource===searchSource));
  const tmdb=document.querySelector("#searchTmdbCount");
  const luno=document.querySelector("#searchLunoCount");
  if(tmdb) tmdb.textContent=String(searchResultsState.tmdb.length||0);
  if(luno) luno.textContent=String(searchResultsState.luno.length||0);
}
function renderActiveSearch(query){
  let items=[];
  if(searchSource==="tmdb") items=searchSourceItems("tmdb");
  else if(searchSource==="luno") items=searchSourceItems("luno");
  else items=rankSearchResults(dedupeSearchResults([...searchResultsState.tmdb,...searchResultsState.luno]),query);
  renderSearchSections(items,query);
  updateSearchSourceUI();
}

function showSearchResults(items,query,source="tmdb"){
  searchResultsState[source]=items||[];
  renderActiveSearch(query);
}

function searchLocal(query){
  const q=query.trim().toLocaleLowerCase("ru-RU");
  if(!q) return [];
  return rankSearchResults(catalogItems
    .filter(item=>{
      const hay=[item.name,item.originalName,...(item.genres||[])].join(" ").toLocaleLowerCase("ru-RU");
      return hay.includes(q);
    }),query);
}

function dynamicSearchUrl(query){
  const base=String(window.__LUNO_API_BASE__||"https://luno-api.bqrt30.workers.dev").replace(/\/$/,"");
  return (base||"")+"/api/tmdb/search?query="+encodeURIComponent(query);
}

function normalizeSearchText(value=""){
  return String(value)
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g,"е")
    .replace(/[^a-zа-я0-9]+/gi," ")
    .replace(/\s+/g," ")
    .trim();
}

function searchYear(item){
  return String(item?.releaseInfo||"").match(/\d{4}/)?.[0] || "";
}

function dedupeSearchResults(items){
  const seen=new Set();
  const result=[];
  for(const item of items){
    const normalizedName=normalizeSearchText(item?.name||item?.originalName||"");
    const year=searchYear(item);
    const imdb=String(item?.imdbId||"").trim().toLowerCase();
    const key=imdb ? "imdb:"+imdb : [item?.type||"movie",normalizedName,year].join("|");
    if(!normalizedName || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function rankSearchResults(items,query){
  const q=normalizeSearchText(query);
  const qWords=q.split(" ").filter(Boolean);
  const scored=items.map((item,index)=>{
    const name=normalizeSearchText(item?.name||"");
    const original=normalizeSearchText(item?.originalName||"");
    const year=searchYear(item);
    let score=0;
    if(name===q) score+=1000;
    else if(name.startsWith(q)) score+=650;
    else if(name.includes(q)) score+=450;
    if(original===q) score+=500;
    else if(original.startsWith(q)) score+=300;
    else if(original.includes(q)) score+=180;
    score+=qWords.filter(word=>name.includes(word)||original.includes(word)).length*70;
    if(item?.type==="movie") score+=160;
    if(item?.type==="series") score-=40;
    score+=(Number(item?.rating)||0)*12;
    score+=Math.min(Number(item?.popularity)||0,100)*0.25;
    const queryYear=q.match(/\b(19\d{2}|20\d{2})\b/)?.[1];
    if(queryYear) score+=year===queryYear ? 900 : -250;
    return {item,score,index};
  });
  return scored.sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.item);
}

async function searchDynamic(query){
  const response=await fetch(dynamicSearchUrl(query),{headers:{accept:"application/json"},cache:"no-store"});
  if(!response.ok) throw new Error("TMDB search HTTP "+response.status);
  const data=await response.json();
  const items=Array.isArray(data?.results) ? data.results
    .map(item=>normalizeItem({
      ...item,
      tmdbId:item?.tmdbId || item?.id,
      type:item?.media_type==="tv" ? "tv" : (item?.media_type==="movie" ? "movie" : item?.type)
    }))
    .filter(x=>x.tmdbId) : [];
  const clean=rankSearchResults(dedupeSearchResults(items),query);
  for(const item of clean) window.__LUNO_ITEMS__.set(item.id,item);
  return clean;
}

function openSearch(){
  if(!searchPanel) return;
  searchPanel.classList.remove("hidden");
  document.body.classList.add("search-open","show-global-back");
  renderSearchHistory();
  updateSearchSourceUI();
  window.setTimeout(()=>searchInput?.focus(),40);
}
function closeSearchPanel(){
  searchPanel?.classList.add("hidden");
  document.body.classList.remove("search-open");
  const libraryIsOpen=!!(libraryView && !libraryView.classList.contains("hidden"));
  document.body.classList.toggle("show-global-back",!document.body.classList.contains("home-mode") || libraryIsOpen);
}
document.querySelector("#searchBack")?.addEventListener("click",closeSearchPanel);
document.querySelector("#searchClear")?.addEventListener("click",()=>{
  searchInput.value="";
  searchResultsState={tmdb:[],luno:[],ai:[]};
  renderSearchHistory();
  renderActiveSearch("");
  searchInput.focus();
});
document.querySelectorAll(".search-source").forEach(btn=>btn.addEventListener("click",()=>{
  searchSource=btn.dataset.searchSource||"tmdb";
  renderActiveSearch(searchInput.value.trim());
}));

renderSearchHistory();

document.querySelector("#openDemo")?.addEventListener("click",()=>{
  const featured=resumeItems[0] || movieItems[0];
  if(featured) openDetail(featured);
});
document.querySelector("#continueBtn")?.addEventListener("click",()=>{
  const featured=resumeItems[0] || movieItems[0];
  if(featured) openDetail(featured);
});
document.querySelectorAll(".section-more").forEach(btn=>btn.addEventListener("click",()=>{
  navigate(btn.dataset.section||"home");
}));
lunoVideo?.addEventListener("timeupdate",()=>{
  if(!currentItem) return;
  const duration=Number(lunoVideo.duration)||0;
  const time=Number(lunoVideo.currentTime)||0;
  if(duration>0) window.LUNOPlayback?.progress(currentItem,time,duration);
  if(Math.abs(time-lastCoreTime)>=1){
    lastCoreTime=time;
    dispatchLunoPlayerAction("TimeChanged",{
      time:Math.max(0,Math.round(time*1000)),
      duration:Math.max(0,Math.round(duration*1000)),
      device:"luno"
    });
  }
});
lunoVideo?.addEventListener("play",()=>{
  player?.classList.add("is-playing");
  dispatchLunoPlayerAction("PausedChanged",{paused:false});
});
lunoVideo?.addEventListener("pause",()=>{
  player?.classList.remove("is-playing");
  dispatchLunoPlayerAction("PausedChanged",{paused:true});
});
playerBrowseToggle?.addEventListener("click",()=>{
  if(!player) return;
  const pinned=!player.classList.contains("player-browse-pinned");
  player.classList.toggle("player-browse-pinned",pinned);
  playerBrowseToggle.setAttribute("aria-expanded",String(pinned));
  playerBrowseToggle.textContent=pinned?"× Скрыть серии":"☷ Серии";
});
lunoVideo?.addEventListener("seeked",()=>{
  const duration=Number(lunoVideo.duration)||0;
  if(duration>0){
    dispatchLunoPlayerAction("Seek",{
      time:Math.max(0,Math.round((Number(lunoVideo.currentTime)||0)*1000)),
      duration:Math.max(0,Math.round(duration*1000)),
      device:"luno"
    });
  }
});
lunoVideo?.addEventListener("ended",()=>{
  dispatchLunoPlayerAction("Ended");
  if(currentItem) window.LUNOPlayback?.finish(currentItem);
});
lunoVideo?.addEventListener("error",()=>{
  if(playerMessage) playerMessage.textContent="Не удалось воспроизвести этот источник.";
});

playerBrowseQuality?.addEventListener("click",()=>{renderQualitySheet();qualitySheet?.classList.remove("hidden")});
playerBrowseVoice?.addEventListener("click",()=>{renderVoiceSheet();voiceSheet?.classList.remove("hidden")});
playerBrowseSourceButton?.addEventListener("click",()=>{if(playerStreams.length) openSourceSheet();});
playerBrowseFilter?.addEventListener("click",()=>playerBrowseFilterMenu?.classList.toggle("hidden"));
playerBrowseFilterMenu?.querySelectorAll("[data-quality-filter]").forEach(button=>button.addEventListener("click",()=>{playerQualityFilter=button.dataset.qualityFilter||"all";playerBrowseFilterMenu.classList.add("hidden");renderPlayerBrowse();}));
playerEpisodeButton?.addEventListener("click",()=>{renderEpisodeSheet();episodeSheet?.classList.remove("hidden")});
closeEpisodeSheet?.addEventListener("click",()=>episodeSheet?.classList.add("hidden"));
playerVoiceButton?.addEventListener("click",()=>{renderVoiceSheet();voiceSheet?.classList.remove("hidden")});
closeVoiceSheet?.addEventListener("click",()=>voiceSheet?.classList.add("hidden"));
playerQualityButton?.addEventListener("click",()=>{renderQualitySheet();qualitySheet?.classList.remove("hidden")});
playerSubtitleButton?.addEventListener("click",()=>{renderSubtitleSheet();subtitleSheet?.classList.remove("hidden")});
closeQualitySheet?.addEventListener("click",()=>qualitySheet?.classList.add("hidden"));
closeSubtitleSheet?.addEventListener("click",()=>subtitleSheet?.classList.add("hidden"));
document.querySelector("#closePlayer").onclick=()=>{
  showDialog("Выйти из просмотра?","Прогресс просмотра сохранится на этом устройстве.","Выйти",closePlayer);
};
playerSourceButton?.addEventListener("click",()=>{
  if(playerStreams.length) openSourceSheet();
  else if(currentItem) resolveLunoStreams(currentItem);
});
closeSourceSheet?.addEventListener("click",closeSourceSheetPanel);
openAddonManager?.addEventListener("click",openAddonManagerPanel);
openAddonManagerTop?.addEventListener("click",openAddonManagerPanel);
openAddonManagerFromPlayer?.addEventListener("click",openAddonManagerPanel);
openCinemaSources?.addEventListener("click",openAddonManagerPanel);
closeAddonManager?.addEventListener("click",closeAddonManagerPanel);
addonManager?.addEventListener("click",(event)=>{
  if(event.target===addonManager) closeAddonManagerPanel();
});
sourceInstallForm?.addEventListener("submit",(event)=>{event.preventDefault();installAddonFromInput();});
installAddonButton?.addEventListener("click",(event)=>{if(sourceInstallForm){event.preventDefault();installAddonFromInput();}});
addonUrlInput?.addEventListener("keydown",(event)=>{
  if(event.key==="Enter") installAddonFromInput();
  if(event.key==="Escape") closeAddonManagerPanel();
});
sourceSheet?.addEventListener("click",(event)=>{
  if(event.target===sourceSheet) closeSourceSheetPanel();
});
libraryBack?.addEventListener("click",closeLibrary);
librarySearch?.addEventListener("click",()=>{
  closeLibrary();
  openSearch();
});

document.querySelector("#searchBtn")?.addEventListener("click",()=>{
  openSearch();
});

document.querySelector("#globalHeaderSearch")?.addEventListener("click",()=>{
  if(!detail?.classList.contains("hidden")) closeDetail();
  openSearch();
});
document.querySelector("#globalHeaderSettings")?.addEventListener("click",()=>navigate("settings"));
document.querySelector("#globalHeaderBack")?.addEventListener("click",()=>{
  if(detail && !detail.classList.contains("hidden")){ closeDetail(); return; }
  if(searchPanel && !searchPanel.classList.contains("hidden")){ closeSearchPanel(); return; }
  if(libraryView && !libraryView.classList.contains("hidden")){
    closeLibrary();
    document.body.classList.toggle("show-global-back",!document.body.classList.contains("home-mode"));
    return;
  }
  navigate("home");
});


let searchTimer=null;
searchInput.addEventListener("input",()=>{
  clearTimeout(searchTimer);
  const query=searchInput.value.trim();
  if(!query){
    searchResultsState={tmdb:[],luno:[],ai:[]};
    renderActiveSearch("");
    return;
  }
  searchTimer=setTimeout(async()=>{
    const local=searchLocal(query);
    searchResultsState.luno=local;
    renderActiveSearch(query);
    try{
      const remote=await searchDynamic(query);
      searchResultsState.tmdb=remote;
      renderActiveSearch(query);
    }catch(error){
      console.warn("LUNO remote search unavailable, using local catalog:",error);
      searchResultsState.tmdb=[];
      renderActiveSearch(query);
    }
  },220);
});

searchInput.addEventListener("keydown",async(e)=>{
  if(e.key==="Escape") closeSearchPanel();
  if(e.key==="Enter"){
    const query=searchInput.value.trim();
    saveSearchQuery(query);
    let result=searchLocal(query)[0];
    try{
      const remote=await searchDynamic(query);
      result=remote[0]||result;
    }catch{}
    if(result){
      searchPanel.classList.add("hidden");
      openDetail(result);
    }
  }
});

ensureLunoHistory();
document.body.classList.add("home-mode");
window.addEventListener("popstate",(event)=>{
  const state=event.state||{};
  if(searchPanel && !searchPanel.classList.contains("hidden")){
    closeSearchPanel();
    restoreLunoHistoryPosition(state);
    return;
  }
  if(!player?.classList.contains("hidden")){
    closePlayer(true);
    restoreLunoHistoryPosition(state);
    return;
  }
  if(!detail?.classList.contains("hidden")){
    closeDetail(true);
    restoreLunoHistoryPosition(state);
    return;
  }
  if(!libraryView?.classList.contains("hidden")){
    closeLibrary(true);
    restoreLunoHistoryPosition(state);
    return;
  }
  restoreLunoHistoryPosition(state);
});
document.addEventListener("keydown",(event)=>{
  const backKeys=["Escape","Backspace","BrowserBack","GoBack"];
  if(backKeys.includes(event.key)||[4,166,461,10009].includes(event.keyCode)){
    // Close only the topmost layer, like Back on a TV remote.
    const layers=[
      [confirmDialog,closeDialog],
      [sourceSheet,closeSourceSheetPanel],
      [subtitleSheet,()=>subtitleSheet?.classList.add("hidden")],
      [qualitySheet,()=>qualitySheet?.classList.add("hidden")],
      [voiceSheet,()=>voiceSheet?.classList.add("hidden")],
      [episodeSheet,()=>episodeSheet?.classList.add("hidden")],
      [addonManager,closeAddonManagerPanel],
      [searchPanel,closeSearchPanel],
      [detail,closeDetail],
      [libraryView,closeLibrary],
      [player,closePlayer]
    ];
    const layer=layers.find(([element])=>element&&!element.classList.contains("hidden"));
    if(layer){
      event.preventDefault();
      layer[1]();
      // The navigation manager restores the exact control that opened this layer.
      return;
    }
  }
  // Some Android TV remotes send DPAD_CENTER as keyCode 23 rather than Enter.
  if((event.key==="Select"||event.keyCode===23)&&!event.repeat){
    const active=document.activeElement;
    if(active?.matches("button:not(:disabled),a[href],[role=button]:not([aria-disabled=true])")){
      event.preventDefault();
      active.click();
    }
  }
});

document.addEventListener("keydown",(event)=>{
  const current=document.activeElement;
  if(!current?.matches(".card")||event.altKey||event.ctrlKey||event.metaKey) return;
  if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key)) return;
  const grid=current.closest(".library-infinite-grid,.cards");
  if(!grid) return;
  const cards=Array.from(grid.querySelectorAll(".card")).filter(card=>!card.disabled);
  const index=cards.indexOf(current);
  if(index<0||!cards.length) return;
  let next=index;
  const rail=getComputedStyle(grid).gridAutoFlow.includes("column") && grid.scrollWidth>grid.clientWidth+8;
  if(rail && (event.key==="ArrowUp"||event.key==="ArrowDown")){
    const sections=Array.from(document.querySelectorAll("main>.section"))
      .filter(section=>!section.hidden && getComputedStyle(section).display!=="none")
      .map(section=>({section,rail:section.querySelector(":scope > .cards")}))
      .filter(entry=>entry.rail && entry.rail.scrollWidth>entry.rail.clientWidth+8);
    const position=sections.findIndex(entry=>entry.rail===grid);
    const direction=event.key==="ArrowUp"?-1:1;
    const adjacent=sections[position+direction];
    if(adjacent){
      const sourceRect=current.getBoundingClientRect();
      const sourceCenter=sourceRect.left+sourceRect.width/2;
      const candidates=Array.from(adjacent.rail.querySelectorAll(".card")).filter(card=>!card.disabled);
      if(candidates.length){
        next=index;
        const target=candidates[Math.min(index,candidates.length-1)];
        const targetRect=target.getBoundingClientRect();
        const targetCenter=targetRect.left+targetRect.width/2;
        let best=target,bestDistance=Math.abs(targetCenter-sourceCenter);
        for(const candidate of candidates){
          const rect=candidate.getBoundingClientRect();
          const distance=Math.abs(rect.left+rect.width/2-sourceCenter);
          if(distance<bestDistance){best=candidate;bestDistance=distance;}
        }
        event.preventDefault();
        best.focus({preventScroll:true});
        best.scrollIntoView({block:"nearest",inline:"nearest",behavior:"smooth"});
        return;
      }
    }
    return;
  }
  if(event.key==="Home") next=0;
  else if(event.key==="End") next=cards.length-1;
  else{
    const columns=rail?1:Math.max(1,Math.round(grid.getBoundingClientRect().width/Math.max(1,cards[0].getBoundingClientRect().width+12)));
    if(event.key==="ArrowLeft") next=Math.max(0,index-1);
    if(event.key==="ArrowRight") next=Math.min(cards.length-1,index+1);
    if(!rail && event.key==="ArrowUp") next=Math.max(0,index-columns);
    if(!rail && event.key==="ArrowDown") next=Math.min(cards.length-1,index+columns);
  }
  if(next!==index){event.preventDefault();cards[next].focus({preventScroll:true});cards[next].scrollIntoView({block:"nearest",inline:"nearest",behavior:"smooth"});}
});

document.querySelectorAll(".nav-item,.mobile-tab").forEach((btn)=>btn.addEventListener("click",()=>navigate(btn.dataset.section)));

function syncLunoActiveNavigation(){
  const detailOpen=!!detail && !detail.classList.contains("hidden");
  const libraryOpen=!!libraryView && !libraryView.classList.contains("hidden");
  const searchOpen=!!searchPanel && !searchPanel.classList.contains("hidden");
  let section="home";
  if(detailOpen) section="home";
  else if(searchOpen) section="search";
  else if(libraryOpen){
    const title=(libraryTitle?.textContent||"").toLowerCase();
    section=title.includes("сериал")?"series":title.includes("фильм")?"movies":title.includes("мульт")?"cartoons":title.includes("аниме")?"anime":title.includes("истори")?"history":"catalog";
  }
  document.body.classList.toggle("home-mode",section==="home");
  document.body.classList.toggle("show-global-back",section!=="home" || detailOpen);
  document.querySelectorAll(".nav-item,.mobile-tab").forEach(btn=>{
    const active=btn.dataset.section===section;
    btn.classList.toggle("active",active);
    if(active) btn.setAttribute("aria-current","page");
    else btn.removeAttribute("aria-current");
  });
}
window.addEventListener("pageshow",syncLunoActiveNavigation);
window.addEventListener("load",syncLunoActiveNavigation);

const lunoMenuTrigger=document.querySelector("#lunoMenuTrigger"),lunoMenuDrawer=document.querySelector("#lunoMenuDrawer"),lunoMenuBackdrop=document.querySelector("#lunoMenuBackdrop");
const closeLunoMenu=()=>{lunoMenuDrawer?.classList.remove("is-open");lunoMenuDrawer?.setAttribute("aria-hidden","true");lunoMenuTrigger?.setAttribute("aria-expanded","false");lunoMenuBackdrop?.setAttribute("hidden","");document.body.classList.remove("luno-menu-open");};
const openLunoMenu=()=>{lunoMenuDrawer?.classList.add("is-open");lunoMenuDrawer?.setAttribute("aria-hidden","false");lunoMenuTrigger?.setAttribute("aria-expanded","true");lunoMenuBackdrop?.removeAttribute("hidden");document.body.classList.add("luno-menu-open");};
lunoMenuTrigger?.addEventListener("click",openLunoMenu);document.querySelector("#lunoMenuClose")?.addEventListener("click",closeLunoMenu);lunoMenuBackdrop?.addEventListener("click",closeLunoMenu);
document.querySelectorAll(".luno-menu-item[data-section]").forEach(btn=>btn.addEventListener("click",()=>{closeLunoMenu();navigate(btn.dataset.section);}));
document.querySelector("#lunoMenuSources")?.addEventListener("click",()=>{closeLunoMenu();(document.querySelector("#openAddonManagerTop")||document.querySelector("#openAddonManager"))?.click();});
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeLunoMenu();});

document.querySelector("#homeHero")?.addEventListener("click",event=>{
  const button=event.target.closest("[data-hero-action]");
  if(!button)return;
  const item=window.__LUNO_ITEMS__?.get(document.querySelector("#homeHero")?.dataset.itemId);
  if(item)openDetail(item);
});

// TV navigation follows the active screen/sheet, with per-screen focus memory.
installRemoteNavigation();

window.LUNOPlayback={
  start(item){ if(item?.id) saveResume(item,0,0); },
  progress(item,position,duration){
    if(item?.id && Number(duration)>0 && Number(position)>5) saveResume(item,position,duration);
  },
  finish(item){
    if(!item?.id) return;
    const list=loadResume().filter(x=>x.id!==item.id);
    try{localStorage.setItem("luno-resume",JSON.stringify(list));}catch{}
    renderResume();
  }
};

renderResume();
renderFavorites();
showCatalogMessage("Загружаем каталог…");

const catalogSentinel=document.querySelector("#catalogSentinel");
if(catalogSentinel && "IntersectionObserver" in window){
  const observer=new IntersectionObserver((entries)=>{
    if(entries.some(entry=>entry.isIntersecting)) loadMoreCatalog();
  },{rootMargin:"900px 0px"});
  observer.observe(catalogSentinel);
}

function prefetchPosters(items){
  // On TV, avoid competing with visible posters for network and image decode time.
  if(isLowPowerTV()) return;
  items.slice(0,8).forEach((item)=>{
    if(item?.poster){
      const image=new Image();
      image.decoding="async";
      image.src=item.poster;
    }
  });
}

(async()=>{
  try{
    setSplashProgress(25,"Подключаем каталог…");
    const catalog=await loadTmdbCatalog();
    setSplashProgress(68,"Загружаем фильмы и сериалы…");
    const rendered=renderItems(catalog.items,catalog.sections);
    if(!rendered || !catalogItems.length){
      console.error("[LUNO] Catalog payload received but no valid items rendered", {
        payloadItems:Array.isArray(catalog.items)?catalog.items.length:0,
        bundledItems:Array.isArray(bundledTmdbCatalog?.items)?bundledTmdbCatalog.items.length:0
      });
      const backup=Array.isArray(bundledTmdbCatalog?.items)?bundledTmdbCatalog.items:[];
      if(backup.length && renderItems(backup,bundledTmdbCatalog.sections||{})){
        console.warn("[LUNO] Recovered home catalog from bundled payload",catalogItems.length);
      }else{
        throw new Error("Catalog payload contained no renderable items");
      }
    }
    prefetchPosters(catalogItems);
    showCoreStatus("Каталог готов");
    setSplashProgress(88,"Почти готово…");
    console.info("LUNO TMDB catalog loaded", {
      total:catalogItems.length,
      movies:movieItems.length,
      series:seriesItems.length,
      trendingCards:trendingCards?.children.length||0,
      picksCards:lunoPicksCards?.children.length||0
    });
  }catch(error){
    console.error("LUNO TMDB catalog failed",error);
    showCatalogMessage("Каталог пока недоступен. Перезапустите приложение позже.");
    showCoreStatus("Каталог офлайн");
  }

  try{
    const {initLunoCore}=await import("./source-engine.js?v=source31");
    await Promise.race([
      initLunoCore(),
      new Promise((_,reject)=>window.setTimeout(()=>reject(new Error("LUNO Source Engine init timeout")),6500))
    ]);
    console.info("LUNO Source Engine ready");
    setSplashProgress(96,"Запускаем LUNO…");
  }catch(error){
    console.warn("LUNO Source Engine unavailable during startup:",error);
  }
  window.clearTimeout(splashSafetyTimer);
  finishSplash();
})();


/* Keep the fixed LUNO tab bar inside Safari's currently visible viewport.
   iOS Safari changes the visual viewport when its bottom toolbar expands/collapses. */
(function(){
  const updateLunoViewportBottom=()=>{
    const vv=window.visualViewport;
    const gap=vv ? Math.max(0,window.innerHeight-(vv.height+vv.offsetTop)) : 0;
    document.documentElement.style.setProperty("--luno-vv-bottom",gap+"px");
  };
  updateLunoViewportBottom();
  window.addEventListener("resize",updateLunoViewportBottom,{passive:true});
  window.addEventListener("orientationchange",updateLunoViewportBottom,{passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener("resize",updateLunoViewportBottom,{passive:true});
    window.visualViewport.addEventListener("scroll",updateLunoViewportBottom,{passive:true});
  }
})();


/* Reveal the LUNO header on upward scroll; hide it on downward scroll to avoid
   the fixed wordmark overlapping the cinematic hero title in compact Safari. */
(function(){
  let lastY=window.scrollY||0;
  let accumulated=0;
  let lastDirection="";
  const threshold=12;
  const onScroll=()=>{
    const y=window.scrollY||0;
    const delta=y-lastY;
    lastY=y;
    if(y<90){
      document.body.classList.remove("luno-scroll-down","luno-scroll-up");
      accumulated=0;lastDirection="";
      return;
    }
    const direction=delta>0?"down":delta<0?"up":"";
    if(!direction)return;
    if(direction!==lastDirection){accumulated=0;lastDirection=direction;}
    accumulated+=Math.abs(delta);
    if(accumulated>=threshold){
      document.body.classList.toggle("luno-scroll-down",direction==="down");
      document.body.classList.toggle("luno-scroll-up",direction==="up");
      accumulated=0;
    }
  };
  window.addEventListener("scroll",onScroll,{passive:true});
})();
