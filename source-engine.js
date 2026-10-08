const PROVIDERS_KEY="luno-source-providers";
const builtInProviders=[{id:"luno-open-cinema",name:"LUNO Open Cinema",description:"Открытые тестовые HTTP/HLS-потоки для проверки LUNO Player.",enabled:true,async resolve(item){const imdb=String(item?.imdbId||item?.videoId||"");if(imdb!=="tt1254207")return[];return[{stream:{name:"Big Buck Bunny • MP4 720p",url:"https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",behaviorHints:{contentType:"video/mp4"}},request:{path:{resource:"stream",type:"movie",id:imdb,extra:[]}}},{stream:{name:"Big Buck Bunny • MP4 320p",url:"https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4",behaviorHints:{contentType:"video/mp4"}},request:{path:{resource:"stream",type:"movie",id:imdb,extra:[]}}}];}},{id:"luno-hls-lab",name:"LUNO HLS Lab",description:"Открытый HLS-тест для проверки потокового движка.",enabled:true,async resolve(item){if(String(item?.imdbId||"")!=="tt1254207")return[];return[{stream:{name:"HLS Demo",url:"https://test-streams.mux.dev/tos_ismc/main.m3u8",behaviorHints:{contentType:"application/x-mpegURL"}},request:{path:{resource:"stream",type:"movie",id:"tt1254207",extra:[]}}}];}}];
let providers=[];function readCustom(){try{const value=JSON.parse(localStorage.getItem(PROVIDERS_KEY)||"[]");return Array.isArray(value)?value:[];}catch{return[]}}function initSourceEngine(){if(providers.length)return api;providers=[...builtInProviders,...readCustom()].filter(p=>p&&p.enabled!==false);return api;}function listSourceProviders(){if(!providers.length)initSourceEngine();return providers.map(p=>({id:p.id,name:p.name,description:p.description,enabled:p.enabled!==false}));}async function resolveItemStreams(item,{videoId=""}={}){if(!providers.length)initSourceEngine();const result=[];for(const provider of providers){try{const values=await provider.resolve?.(item,{videoId});if(Array.isArray(values))result.push(...values.map(entry=>({...entry,addon:{id:provider.id,name:provider.name,transportUrl:""}}));}catch(error){console.warn("LUNO source provider failed:",provider.id,error);}}return result;}const api={listProviders:listSourceProviders,resolve:resolveItemStreams};export {initSourceEngine,listSourceProviders,resolveItemStreams}; export function getSourceEngine(){ if(!providers.length) initSourceEngine(); return api; }


let lunoInitialized=false;
let lunoTransport=null;
let lunoPlayerState=null;
export async function initLunoCore(){
  if(lunoInitialized) return lunoTransport;
  const engine=initSourceEngine();
  lunoTransport={sourceEngine:engine,getState:name=>name==="player"?lunoPlayerState:null,dispatch:(action)=>dispatchLunoPlayerAction(action?.args?.action||action?.action||action,action?.args?.args||{})};
  lunoInitialized=true;
  window.__LUNO_SOURCE_ENGINE__=engine;
  window.__LUNO_CORE__=lunoTransport;
  window.dispatchEvent(new CustomEvent("luno-core-ready",{detail:{core:lunoTransport,engine}}));
  return lunoTransport;
}
export function getLunoTransport(){return lunoTransport;}
export async function loadMetaDetails(item,videoId=""){if(!lunoInitialized)await initLunoCore();const streams=await resolveItemStreams(item,{videoId});lunoPlayerState={stream:streams.length===1?{type:"Ready",content:streams[0].stream}:null,streams:streams.map(entry=>({content:{type:"Ready",content:[entry.stream]},request:entry.request,addon:entry.addon||null})),metaStreams:streams.map(entry=>({content:{type:"Ready",content:[entry.stream]},request:entry.request,addon:entry.addon||null})),libraryItem:{state:{videoId:videoId||item?.videoId||""}}};return lunoPlayerState;}
export async function loadLunoPlayer(stream){const value=stream?.url||stream?.streamingUrl||stream?.externalUrl||stream?.webosUrl||"";lunoPlayerState={stream:value?{type:"Ready",content:{...stream,url:value}}:{type:"Err",content:{message:"No direct stream"}}};return lunoPlayerState;}
export async function unloadLunoPlayer(){lunoPlayerState=null;}
export function dispatchLunoPlayerAction(action,args={}){if(action==="TimeChanged"&&lunoPlayerState)lunoPlayerState.time=args.time||0;if(action==="Ended"&&lunoPlayerState)lunoPlayerState.ended=true;}
export function getReadyMetaStreams(state){const resources=Array.isArray(state?.streams)&&state.streams.length?state.streams:(Array.isArray(state?.metaStreams)?state.metaStreams:[]);return resources.flatMap(resource=>resource?.content?.type==="Ready"?(Array.isArray(resource.content.content)?resource.content.content:[]).map(stream=>({stream,request:resource.request,addon:resource.addon||null})):[]);}
export function getPlayerStreamUrl(state){if(state?.stream?.type!=="Ready")return "";const stream=state.stream.content||{};return stream.url||stream.streamingUrl||stream.externalUrl||stream.webosUrl||"";}
export async function loadLunoModel(){return null;}
export async function loadBoard(){return null;}
export async function loadBoardRange(){return null;}
export async function searchLuno(){return null;}
export async function getLunoModel(name){return name==="player"?lunoPlayerState:null;}
export function onLunoState(){return()=>{};}
