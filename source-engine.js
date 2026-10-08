const PROVIDERS_KEY="luno-source-providers";
const DEFAULT_TIMEOUT=12000;
const providers=new Map();
const cache=new Map();
let initialized=false;
let playerState=null;

function text(v){return v==null?"":String(v).trim()}
function http(v){try{const u=new URL(text(v));return u.protocol==="http:"||u.protocol==="https:"}catch{return false}}
function normalizeSubtitle(v){
  const list=Array.isArray(v)?v:(v?[v]:[]);
  return list.map((x,i)=>typeof x==="string"?{label:"Subtitle "+(i+1),url:x}:{label:text(x?.label||x?.name||x?.lang||"Subtitle "+(i+1)),url:text(x?.url||x?.src)}).filter(x=>http(x.url))
}
function kind(s){
  const u=text(s?.url||s?.streamingUrl||s?.externalUrl||s?.file);
  const h=text(s?.behaviorHints?.contentType||s?.contentType).toLowerCase();
  if(!http(u))return"unsupported";
  if(h.includes("mpegurl")||h.includes("hls")||/\.m3u8(?:$|[?#])/i.test(u))return"hls";
  if(h.includes("dash")||h.includes("mpd")||/\.mpd(?:$|[?#])/i.test(u))return"dash";
  return"direct"
}
function normalize(raw,provider,request={}){
  const s=raw?.stream||raw||{},url=text(s.url||s.streamingUrl||s.externalUrl||s.webosUrl||s.file);
  if(!http(url))return null;
  return {stream:{...s,url,name:text(s.name||s.title||provider.name),behaviorHints:{...(s.behaviorHints||{}),contentType:s.behaviorHints?.contentType||s.contentType||undefined},subtitles:normalizeSubtitle(s.subtitles)},request:raw?.request||request,addon:{id:provider.id,name:provider.name,transportUrl:""},resolver:provider.id,kind:kind(s)}
}
async function json(url,options={}){
  if(!http(url))throw new Error("Invalid source URL");
  const c=new AbortController(),t=setTimeout(()=>c.abort(),options.timeout||DEFAULT_TIMEOUT);
  try{const r=await fetch(url,{...options,signal:c.signal,headers:{accept:"application/json,text/plain,*/*",...(options.headers||{})}});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}finally{clearTimeout(t)}
}
function custom(){
  try{const x=JSON.parse(localStorage.getItem(PROVIDERS_KEY)||"[]");return Array.isArray(x)?x:[]}catch{return[]}
}
function httpProvider(d){
  const endpoint=text(d.endpoint);if(!http(endpoint))return null;
  return {id:text(d.id)||"http-"+btoa(endpoint).replace(/[^a-z0-9]/gi,"").slice(0,12),name:text(d.name)||"LUNO HTTP Source",description:text(d.description)||"LUNO-compatible browser source",enabled:d.enabled!==false,async resolve(item){
    const u=new URL(endpoint);
    if(item?.imdbId)u.searchParams.set("imdb_id",item.imdbId);
    if(item?.tmdbId)u.searchParams.set("tmdb_id",String(item.tmdbId));
    if(item?.type)u.searchParams.set("type",item.type);
    if(item?.name)u.searchParams.set("title",item.name);
    const d=await json(u.toString()),v=Array.isArray(d)?d:(d?.streams||d?.results||d?.data||[]);
    return v;
  }}
}
const tests=[
{id:"luno-open-cinema",name:"LUNO Open Cinema",description:"Открытые HTTP/HLS-тесты для проверки LUNO Player.",enabled:true,async resolve(item){
 if(String(item?.imdbId||"")!=="tt1254207")return[];
 return [
  {stream:{name:"Big Buck Bunny • MP4 720p",url:"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",behaviorHints:{contentType:"video/mp4"}}},
  {stream:{name:"Big Buck Bunny • MP4 320p",url:"https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4",behaviorHints:{contentType:"video/mp4"}}}
 ]
}},
{id:"luno-hls-lab",name:"LUNO HLS Lab",description:"Открытый HLS-тест для проверки потокового движка.",enabled:true,async resolve(item){
 if(String(item?.imdbId||"")!=="tt1254207")return[];
 return [{stream:{name:"HLS Demo",url:"https://test-streams.mux.dev/tos_ismc/main.m3u8",behaviorHints:{contentType:"application/x-mpegURL"}}}]
}}
];
function registerProvider(p){if(!p?.id||typeof p.resolve!=="function")return false;providers.set(p.id,p);return true}
function initSourceEngine(){
 if(initialized)return api;initialized=true;
 tests.forEach(registerProvider);custom().map(httpProvider).filter(Boolean).forEach(registerProvider);
 window.__LUNO_SOURCE_ENGINE__=api;return api
}
function listSourceProviders(){initSourceEngine();return [...providers.values()].map(p=>({id:p.id,name:p.name,description:p.description||"",enabled:p.enabled!==false}))}
async function resolveProvider(p,item,videoId){
 const key=p.id+"|"+(videoId||item?.imdbId||item?.tmdbId||item?.id||item?.name||""),c=cache.get(key);
 if(c&&c.expires>Date.now())return c.value;
 const values=await p.resolve(item,{videoId}),list=Array.isArray(values)?values:[],out=list.map(v=>normalize(v,p,{path:{resource:"stream",type:item?.type==="series"?"series":"movie",id:videoId||item?.imdbId||item?.id||""}})).filter(Boolean);
 cache.set(key,{expires:Date.now()+15000,value:out});return out
}
async function resolveItemStreams(item,{videoId="",signal}={}){
 initSourceEngine();const out=[];
 await Promise.all([...providers.values()].filter(p=>p.enabled!==false).map(async p=>{try{if(signal?.aborted)return;out.push(...await resolveProvider(p,item,videoId))}catch(e){console.warn("[LUNO source]",p.id,e)}}));
 const seen=new Set();
 return out.filter(x=>{const k=x.stream.url+"|"+x.stream.name;if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>Number(String(b.stream.name).match(/(\d{3,4})p/i)?.[1]||0)-Number(String(a.stream.name).match(/(\d{3,4})p/i)?.[1]||0))
}
const api={listProviders:listSourceProviders,resolve:resolveItemStreams,registerProvider};
export {initSourceEngine,listSourceProviders,resolveItemStreams,registerProvider};
export async function initLunoCore(){initSourceEngine();const t={sourceEngine:api,getState:n=>n==="player"?playerState:null,dispatch:a=>dispatchLunoPlayerAction(a?.args?.action||a?.action||a,a?.args?.args||{})};window.__LUNO_CORE__=t;window.dispatchEvent(new CustomEvent("luno-core-ready",{detail:{core:t,engine:api}}));return t}
export function getLunoTransport(){return window.__LUNO_CORE__||null}
export async function loadMetaDetails(item,videoId=""){await initLunoCore();const streams=await resolveItemStreams(item,{videoId});playerState={stream:streams.length===1?{type:"Ready",content:streams[0].stream}:null,streams:streams.map(e=>({content:{type:"Ready",content:[e.stream]},request:e.request,addon:e.addon})),metaStreams:streams.map(e=>({content:{type:"Ready",content:[e.stream]},request:e.request,addon:e.addon})),libraryItem:{state:{videoId:videoId||item?.videoId||item?.imdbId||""}}};return playerState}
export async function loadLunoPlayer(stream){const url=text(stream?.url||stream?.streamingUrl||stream?.externalUrl||stream?.webosUrl);playerState=url?{stream:{type:"Ready",content:{...stream,url}}}:{stream:{type:"Err",content:{message:"No direct HTTP(S) stream"}}};return playerState}
export async function unloadLunoPlayer(){playerState=null}
export function dispatchLunoPlayerAction(action,args={}){if(!playerState)return;if(action==="TimeChanged")playerState.time=Number(args.time)||0;if(action==="Ended")playerState.ended=true;if(action==="PausedChanged")playerState.paused=!!args.paused}
export function getReadyMetaStreams(state){const r=Array.isArray(state?.streams)&&state.streams.length?state.streams:(Array.isArray(state?.metaStreams)?state.metaStreams:[]);return r.flatMap(x=>x?.content?.type==="Ready"?(Array.isArray(x.content.content)?x.content.content:[]).map(stream=>({stream,request:x.request,addon:x.addon||null})):[])}
export function getPlayerStreamUrl(state){if(state?.stream?.type!=="Ready")return"";const s=state.stream.content||{};return text(s.url||s.streamingUrl||s.externalUrl||s.webosUrl)}
export async function loadLunoModel(){return null}
export async function loadBoard(){return null}
export async function loadBoardRange(){return null}
export async function searchLuno(){return null}
export async function getLunoModel(n){return n==="player"?playerState:null}
export function onLunoState(){return()=>{}}
