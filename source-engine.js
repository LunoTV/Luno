import {createSourceRegistry} from "./sources/registry.js";
import {loadSourceDefinitions,sourceDefinition} from "./sources/loader.js";
import {normalizeSubtitles as normalizeSubtitle,normalizeStream,streamKind,normalizeVoice,normalizeEpisodeInfo} from "./sources/normalizer.js";
import {selectBestUrl as selectBestQualityUrl,qualityNumber} from "./sources/quality.js";

const PROVIDERS_KEY="luno-source-providers";
const SOURCE_PREFS_KEY="luno-source-prefs";
const DEFAULT_TIMEOUT=15000;
const SOURCE_TIMEOUT=9000;
const CACHE_TTL=15000;
const registry=createSourceRegistry();
const cache=new Map();
let initialized=false;
let playerState=null;

const API_MIRRORS=["api.manhan.one","cdn.zlo.one","georu.manhan.one"];
const SOURCE_CATALOG=[
  "filmix","filmixtv","fxapi","rezka","rhsprem","veoveo","lumex","videodb",
  "collaps","collaps-dash","hdvb","zetflix","kodik","ashdi","kinoukr",
  "kinotochka","megatv","cdnmovies","anilibria","animedia","animego",
  "animevost","animebesst","alloha","animelib","moonanime","kinopub",
  "kinobro","vibix","vdbmovies","fancdn","cdnvideohub","vokino","carnage",
  "flixcdn","seasonvar","hydraflix","videasy","vidsrc","movpi","vidlink",
  "twoembed","autoembed","smashystream","rgshows","pma","videoseed",
  "kinorkn","leproduction","reality"
];

function text(v){return v==null?"":String(v).trim()}
function http(v){try{const u=new URL(text(v));return u.protocol==="http:"||u.protocol==="https:"}catch{return false}}
function unique(list){return [...new Set(list.filter(Boolean))]}
function sourcePreferences(){try{return JSON.parse(localStorage.getItem(SOURCE_PREFS_KEY)||"{}")||{}}catch{return{}}}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}



function sourceName(value){
  return text(value?.balanser||(value?.name||"").split(" ")[0]).toLowerCase();
}

function sourceUrlCandidates(source){
  const urls=[];
  if(http(source?.url))urls.push(source.url);
  if(http(source?.endpoint))urls.push(source.endpoint);
  return unique(urls);
}

async function requestJson(url,options={}){
  const controller=new AbortController();
  const timeout=options.timeout||DEFAULT_TIMEOUT;
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const headers={
      accept:"application/json,text/plain,*/*",
      "X-Kit-AesGcm":localStorage.getItem("aesgcmkey")||"",
      ...(options.headers||{})
    };
    const response=await fetch(addRuntimeParams(url),{...options,headers,signal:controller.signal,cache:"no-store"});
    if(!response.ok)throw new Error("HTTP "+response.status);
    const type=(response.headers.get("content-type")||"").toLowerCase();
    if(type.includes("json"))return await response.json();
    const body=await response.text();
    try{return JSON.parse(body)}catch{return body}
  }finally{clearTimeout(timer)}
}

async function requestText(url,options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),options.timeout||SOURCE_TIMEOUT);
  try{
    const response=await fetch(addRuntimeParams(url),{
      ...options,
      headers:{
        accept:"text/html,application/json,text/plain,*/*",
        "X-Kit-AesGcm":localStorage.getItem("aesgcmkey")||"",
        ...(options.headers||{})
      },
      signal:controller.signal,
      cache:"no-store"
    });
    if(!response.ok)throw new Error("HTTP "+response.status);
    return await response.text();
  }finally{clearTimeout(timer)}
}

function apiBaseCandidates(){
  const configured=text(window.__LUNO_SOURCE_API_BASE__);
  const stored=text(localStorage.getItem("luno_source_api"));
  return unique([
    configured&&configured.replace(/\/$/,""),
    stored&&stored.replace(/\/$/,""),
    ...API_MIRRORS.map(x=>"https://"+x)
  ]);
}

function addRuntimeParams(url){
  try{
    const u=new URL(url);
    const email=text(localStorage.getItem("account_email"));
    const uid=text(localStorage.getItem("online_unic_id"));
    const token=text(localStorage.getItem("luno_token"));
    const lang=text(localStorage.getItem("language"))||"ru";
    const site=text(localStorage.getItem("luno_domain"))||"luno.rip";
    if(email&&!u.searchParams.has("account_email"))u.searchParams.set("account_email",email);
    if(uid&&!u.searchParams.has("uid"))u.searchParams.set("uid",uid);
    if(token&&!u.searchParams.has("luno_token"))u.searchParams.set("luno_token",token);
    if(lang&&!u.searchParams.has("lang"))u.searchParams.set("lang",lang);
    if(site&&!u.searchParams.has("luno_site"))u.searchParams.set("luno_site",site);
    return u.toString();
  }catch{return url}
}

function buildMovie(item){
  const tmdbId=Number(item?.tmdbId||String(item?.id||"").replace(/^tmdb:/,""))||0;
  return {
    id:tmdbId||text(item?.id),
    tmdb_id:tmdbId||undefined,
    imdb_id:text(item?.imdbId||item?.imdb_id),
    kinopoisk_id:text(item?.kinopoiskId||item?.kinopoisk_id),
    title:text(item?.title||item?.name||item?.originalTitle||item?.originalName),
    name:text(item?.name||item?.title||item?.originalName||item?.originalTitle),
    original_title:text(item?.originalTitle||item?.originalName),
    original_name:text(item?.originalName||item?.originalTitle),
    release_date:text(item?.releaseDate),
    first_air_date:text(item?.firstAirDate),
    original_language:text(item?.originalLanguage),
    source:"tmdb",
    type:item?.type==="series"?"series":"movie"
  };
}

function requestParams(item){
  const movie=buildMovie(item);
  const params=new URLSearchParams();
  if(movie.id!=null)params.set("id",movie.id);
  if(movie.imdb_id)params.set("imdb_id",movie.imdb_id);
  if(movie.kinopoisk_id)params.set("kinopoisk_id",movie.kinopoisk_id);
  if(movie.tmdb_id)params.set("tmdb_id",movie.tmdb_id);
  params.set("title",movie.title);
  params.set("original_title",movie.original_title);
  params.set("serial",movie.type==="series"?"1":"0");
  params.set("original_language",movie.original_language);
  params.set("year",(movie.release_date||movie.first_air_date||"0000").slice(0,4));
  params.set("source","tmdb");
  params.set("clarification","0");
  params.set("similar","false");
  return params;
}

async function enrichExternalIds(item){
  if(item?.imdbId||item?.imdb_id||item?.kinopoiskId||item?.kinopoisk_id)return item;
  const params=new URLSearchParams();
  const movie=buildMovie(item);
  if(movie.id)params.set("id",movie.id);
  if(movie.tmdb_id)params.set("tmdb_id",movie.tmdb_id);
  params.set("serial",movie.type==="series"?"1":"0");
  for(const base of apiBaseCandidates()){
    try{
      const data=await requestJson(base+"/externalids?"+params.toString(),{timeout:6000});
      if(data&&typeof data==="object")return {...item,
        imdbId:item.imdbId||data.imdb_id||data.imdbId||"",
        kinopoiskId:item.kinopoiskId||data.kinopoisk_id||data.kinopoiskId||""
      };
    }catch{}
  }
  return item;
}

async function discoverSources(item){
  const movie=buildMovie(item);
  const params=requestParams(movie);
  const cacheKey="sources|"+params.toString();
  const cached=cache.get(cacheKey);
  if(cached&&cached.expires>Date.now())return cached.value;

  for(const base of apiBaseCandidates()){
    try{
      const data=await requestJson(base+"/lite/events?"+params.toString(),{timeout:SOURCE_TIMEOUT});
      const online=Array.isArray(data)?data:(Array.isArray(data?.online)?data.online:[]);
      const mapped=online.map((entry)=>({
        id:sourceName(entry),
        name:text(entry.name||entry.balanser||sourceName(entry)),
        url:text(entry.url),
        icon:text(entry.icon),
        auth:entry.auth||null,
        show:entry.show!==false
      })).filter(x=>x.id&&http(x.url));

      const prefs=sourcePreferences();
      const allowed=mapped.filter(x=>prefs[x.id]!==false);
      if(allowed.length){
        cache.set(cacheKey,{expires:Date.now()+CACHE_TTL,value:allowed});
        return allowed;
      }
    }catch(error){console.debug("[LUNO sources] mirror failed",base,error)}
  }
  return [];
}

function parseDataJsonMarkup(markup){
  if(typeof markup!=="string")return[];
  try{
    const parsed=JSON.parse(markup);
    if(parsed&&typeof parsed==="object")return parseSourcePayload(parsed);
  }catch{}
  if(typeof DOMParser==="undefined")return[];
  const doc=new DOMParser().parseFromString(markup,"text/html");
  return [...doc.querySelectorAll(".videos__item,.videos__button")].map(node=>{
    try{
      const raw=node.getAttribute("data-json");
      if(!raw)return null;
      const item=JSON.parse(raw);
      const season=node.getAttribute("s"),episode=node.getAttribute("e"),label=text(node.textContent);
      if(season)item.season=Number(season);
      if(episode)item.episode=Number(episode);
      if(label)item.text=label;
      if(node.classList.contains("active"))item.active=true;
      return item;
    }catch{return null}
  }).filter(Boolean);
}
function parseSourcePayload(payload){
  if(typeof payload==="string"){
    try{
      const parsed=JSON.parse(payload);
      if(parsed!==payload)return parseSourcePayload(parsed);
    }catch{}
    return parseDataJsonMarkup(payload);
  }
  if(payload&&typeof payload==="object"){
    if(payload.rch)return[];
    const arrays=[
      payload.streams,payload.results,payload.data,payload.items,
      payload.online,payload.files,payload.playlist
    ];
    for(const arr of arrays)if(Array.isArray(arr))return arr;
    if(payload.url||payload.stream||payload.file)return[payload];
  }
  return[];
}

async function resolveFile(raw){
  if(!raw)return null;
  if(raw.method==="play"&&http(raw.url||raw.stream))return raw;
  const url=text(raw.url||raw.stream);
  if(!http(url))return null;
  if(raw.method==="link"&&raw.similar)return null;
  try{
    const data=await requestJson(url,{timeout:SOURCE_TIMEOUT});
    const parsed=parseSourcePayload(data);
    if(parsed.length)return parsed[0];
    if(data&&typeof data==="object"&&(data.url||data.stream||data.file))return data;
    return null;
  }catch{
    try{
      const textData=await requestText(url,{timeout:SOURCE_TIMEOUT});
      const parsed=parseSourcePayload(textData);
      return parsed[0]||null;
    }catch{return null}
  }
}

async function resolveSource(source,item){
  const movie=buildMovie(item);
  const params=requestParams({...item,...movie});
  const candidates=sourceUrlCandidates(source);
  for(const endpoint of candidates){
    try{
      const separator=endpoint.includes("?")?"&":"?";
      const payload=await requestText(endpoint+separator+params.toString(),{timeout:SOURCE_TIMEOUT});
      const entries=parseSourcePayload(payload);
      const playable=[];
      for(const entry of entries){
        if(entry?.method==="play"||entry?.method==="call"||entry?.url||entry?.stream||entry?.file){
          const resolved=entry?.method==="play"?entry:await resolveFile(entry);
          const chosen=resolved||entry;
          const url=selectBestQualityUrl(chosen);
          if(http(url))playable.push({...chosen,url});
          else if(entry?.method==="call"&&http(entry.stream))playable.push({...entry,url:entry.stream});
        }
      }
      if(playable.length)return playable;
    }catch(error){console.debug("[LUNO source]",source.id,error)}
  }
  return[];
}

function normalizeResolved(raw,source,item){
  const stream=normalizeStream(raw,source,{path:{resource:"stream",type:item?.type==="series"?"series":"movie",id:item?.id||item?.tmdbId||item?.imdbId||""}});
  if(!stream)return null;
  const voice=normalizeVoice(raw?.voice||raw?.voice_name||raw?.translation||raw?.dubbing||raw?.author);
  const episode=normalizeEpisodeInfo(raw);
  stream.stream={
    ...stream.stream,
    voice:voice.name||voice.id?voice:null,
    voice_name:voice.name||voice.id||"",
    season:episode.season,
    episode:episode.episode,
    episode_title:episode.title
  };
  return stream;
}

async function resolvePrismaSources(item,{videoId="",signal}={}){
  const enriched=await enrichExternalIds(item||{});
  const sources=await discoverSources(enriched);
  if(!sources.length)return[];

  const selected=await Promise.all(sources.filter(s=>s.show!==false).map(async source=>{
    if(signal?.aborted)return[];
    try{
      const rows=await resolveSource(source,enriched);
      return rows.map(row=>normalizeResolved(row,source,enriched)).filter(Boolean);
    }catch(error){
      console.debug("[LUNO resolver]",source.id,error);
      return[];
    }
  }));
  return selected.flat();
}



function registerProvider(provider){
  if(!provider?.id||typeof provider.resolve!=="function")return false;
  registry.register(provider);
  return true;
}

function initSourceEngine(){
  if(initialized)return api;
  initialized=true;
  registerProvider({
    id:"prisma-online",
    name:"Online",
    description:"Headless source runtime",
    enabled:true,
    async resolve(item,ctx){return resolvePrismaSources(item,ctx)}
  });
  let definitions=[];
  try{definitions=JSON.parse(localStorage.getItem(PROVIDERS_KEY)||"[]")}catch{}
  loadSourceDefinitions(registry,definitions);
  window.__LUNO_SOURCE_ENGINE__=api;
  return api;
}

function listSourceProviders(){
  initSourceEngine();
  return registry.list().map(p=>({
    id:p.id,name:p.name,description:p.description||"",enabled:p.enabled!==false
  }));
}

async function resolveProvider(provider,item,videoId,signal){
  const key=provider.id+"|"+(videoId||item?.imdbId||item?.tmdbId||item?.id||item?.name||"");
  const cached=cache.get(key);
  if(cached&&cached.expires>Date.now())return cached.value;
  const values=await provider.resolve(item,{
    videoId,
    signal,
    requestJson,
    parseSourcePayload
  });
  const out=(Array.isArray(values)?values:[]).map(v=>v?.stream?{
    ...v,
    stream:{...v.stream,subtitles:normalizeSubtitle(v.stream.subtitles),url:selectBestQualityUrl(v.stream),voice_name:text(v.stream.voice_name||v.stream.voice?.name||v.stream.translation),season:Number(v.stream.season)||0,episode:Number(v.stream.episode)||0},
    kind:streamKind(v.stream)
  }:normalizeStream(v,provider)).filter(v=>v?.stream&&http(v.stream.url));
  cache.set(key,{expires:Date.now()+CACHE_TTL,value:out});
  return out;
}

async function resolveItemStreams(item,{videoId="",signal}={}){
  initSourceEngine();
  const providers=registry.values().filter(provider=>provider.enabled!==false);
  const results=await Promise.allSettled(providers.map(provider=>{
    if(signal?.aborted)return Promise.resolve([]);
    return resolveProvider(provider,item,videoId,signal);
  }));
  const out=[];
  for(const result of results){
    if(result.status==="fulfilled"&&Array.isArray(result.value))out.push(...result.value);
    else if(result.status==="rejected")console.warn("[LUNO source]",result.reason);
  }
  const seen=new Set();
  return out.filter(x=>{
    const key=x.stream.url+"|"+x.stream.name;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  }).sort((a,b)=>qualityNumber(b.stream.name)-qualityNumber(a.stream.name));
}

function listAvailableSources(){
  return SOURCE_CATALOG.map(id=>({
    id,
    name:id,
    type:"remote",
    enabled:true
  }));
}

function getSourceRuntimeStatus(){
  return {
    initialized,
    apiMirrors:API_MIRRORS.length,
    catalogSources:SOURCE_CATALOG.length,
    providers:registry.list().length,
    cacheEntries:cache.size
  };
}

function setSourceEnabled(id,enabled){
  const key=text(id).toLowerCase();
  if(!key)return false;
  const prefs=sourcePreferences();
  prefs[key]=enabled!==false;
  localStorage.setItem(SOURCE_PREFS_KEY,JSON.stringify(prefs));
  cache.clear();
  window.dispatchEvent(new CustomEvent("luno-source-state",{detail:{id:key,enabled:prefs[key]}}));
  return true;
}

function getSourcePreferences(){
  return sourcePreferences();
}

function addSourceDefinition(definition={}){
  const source=sourceDefinition(definition);
  if(!source)return {ok:false,error:"Укажи корректный HTTP(S) endpoint."};
  let definitions=[];
  try{definitions=JSON.parse(localStorage.getItem(PROVIDERS_KEY)||"[]")}catch{}
  if(!Array.isArray(definitions))definitions=[];
  if(definitions.some(item=>text(item?.endpoint)===source.endpoint)){
    return {ok:false,error:"Этот адрес уже добавлен."};
  }
  definitions.push({id:source.id,name:source.name,description:source.description,endpoint:source.endpoint,enabled:true});
  try{localStorage.setItem(PROVIDERS_KEY,JSON.stringify(definitions));}
  catch{return {ok:false,error:"Не удалось сохранить источник на этом устройстве."};}
  loadSourceDefinitions(registry,[definitions[definitions.length-1]]);
  cache.clear();
  return {ok:true,source:{id:source.id,name:source.name,endpoint:source.endpoint}};
}

function setSourceProviderEnabled(id,enabled){
  const changed=registry.setEnabled(id,enabled);
  if(changed)window.dispatchEvent(new CustomEvent("luno-source-state",{detail:{id,enabled:enabled!==false}}));
  return changed;
}

const api={listProviders:listSourceProviders,listSources:listAvailableSources,getStatus:getSourceRuntimeStatus,getSourcePreferences,setSourceEnabled,setProviderEnabled:setSourceProviderEnabled,addSourceDefinition,resolve:resolveItemStreams,registerProvider};

export {initSourceEngine,listSourceProviders,listAvailableSources,getSourceRuntimeStatus,getSourcePreferences,setSourceEnabled,setSourceProviderEnabled,addSourceDefinition,resolveItemStreams,registerProvider};

export async function initLunoCore(){
  initSourceEngine();
  const transport={
    sourceEngine:api,
    getState:n=>n==="player"?playerState:null,
    dispatch:a=>dispatchLunoPlayerAction(a?.args?.action||a?.action||a,a?.args?.args||{})
  };
  window.__LUNO_CORE__=transport;
  window.dispatchEvent(new CustomEvent("luno-core-ready",{detail:{core:transport,engine:api}}));
  return transport;
}

export function getLunoTransport(){return window.__LUNO_CORE__||null}

export async function loadMetaDetails(item,videoId=""){
  await initLunoCore();
  const streams=await resolveItemStreams(item,{videoId});
  playerState={
    stream:streams.length===1?{type:"Ready",content:streams[0].stream}:null,
    streams:streams.map(e=>({content:{type:"Ready",content:[e.stream]},request:e.request,addon:e.addon})),
    metaStreams:streams.map(e=>({content:{type:"Ready",content:[e.stream]},request:e.request,addon:e.addon})),
    libraryItem:{state:{videoId:videoId||item?.videoId||item?.imdbId||item?.id||""}}
  };
  return playerState;
}

export async function loadLunoPlayer(stream){
  const candidate=stream?.stream||stream||{};
  const url=selectBestQualityUrl(candidate);
  if(!http(url)){
    playerState={stream:{type:"Err",content:{message:"No direct HTTP(S) stream"}}};
    return playerState;
  }
  playerState={stream:{type:"Ready",content:{...candidate,url}}};
  return playerState;
}

export async function unloadLunoPlayer(){playerState=null}

export function dispatchLunoPlayerAction(action,args={}){
  if(!playerState)return;
  if(action==="TimeChanged")playerState.time=Number(args.time)||0;
  if(action==="Ended")playerState.ended=true;
  if(action==="PausedChanged")playerState.paused=!!args.paused;
  if(action==="Seek")playerState.seek=Number(args.time)||0;
}

export function getReadyMetaStreams(state){
  const r=Array.isArray(state?.streams)&&state.streams.length?state.streams:(Array.isArray(state?.metaStreams)?state.metaStreams:[]);
  return r.flatMap(x=>x?.content?.type==="Ready"
    ?(Array.isArray(x.content.content)?x.content.content:[]).map(stream=>({stream,request:x.request,addon:x.addon||null}))
    :[]);
}

export function getPlayerStreamUrl(state){
  if(state?.stream?.type!=="Ready")return"";
  const s=state.stream.content||{};
  return text(s.url||s.streamingUrl||s.externalUrl||s.webosUrl);
}

export async function loadLunoModel(){return null}
export async function loadBoard(){return null}
export async function loadBoardRange(){return null}
export async function searchLuno(){return null}
export async function getLunoModel(n){return n==="player"?playerState:null}
export function onLunoState(){return()=>{}}
