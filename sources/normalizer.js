import {normalizeQualityMap,qualityNumber,selectBestUrl} from "./quality.js";
import {normalizeSubtitles} from "./subtitles.js";

function text(v){return v==null?"":String(v).trim()}

function http(v){
  try{
    const u=new URL(text(v));
    return u.protocol==="http:"||u.protocol==="https:";
  }catch{return false}
}

export function streamKind(stream){
  const u=text(stream?.url||stream?.streamingUrl||stream?.externalUrl||stream?.file);
  const h=text(stream?.behaviorHints?.contentType||stream?.contentType||stream?.type).toLowerCase();
  if(!http(u))return"unsupported";
  if(h.includes("mpegurl")||h.includes("hls")||/\.m3u8(?:$|[?#])/i.test(u))return"hls";
  if(h.includes("dash")||h.includes("mpd")||/\.mpd(?:$|[?#])/i.test(u))return"dash";
  return"direct";
}

export function normalizeStream(raw,source,request={}){
  const s=raw?.stream||raw||{};
  const quality=normalizeQualityMap(s.quality||s.qualitys);
  let url=text(s.url||s.streamingUrl||s.externalUrl||s.webosUrl||s.file||"");
  if(!url&&Object.keys(quality).length){
    url=selectBestUrl({quality});
  }
  if(!http(url))return null;
  const subtitles=normalizeSubtitles(s.subtitles);
  const fallback=text(s.url_reserve||s.reserve||"");
  return{
    stream:{
      ...s,
      title:text(s.title||s.name||source?.name),
      name:text(s.name||s.title||source?.name),
      url,
      url_reserve:http(fallback)?fallback:"",
      quality,
      qualitys:quality,
      subtitles,
      segments:s.segments||null,
      behaviorHints:{
        ...(s.behaviorHints||{}),
        contentType:s.behaviorHints?.contentType||s.contentType||(
          /\.m3u8(?:$|[?#])/i.test(url)?"application/x-mpegURL":
          /\.mpd(?:$|[?#])/i.test(url)?"application/dash+xml":"video/mp4"
        )
      }
    },
    request:raw?.request||request,
    addon:{id:source?.id,name:source?.name,transportUrl:source?.url||""},
    resolver:source?.id||"",
    kind:streamKind({url,contentType:s.contentType||s.behaviorHints?.contentType})
  };
}

export {selectBestUrl};

export {normalizeSubtitles};

export function normalizeVoice(value={}){
  if(typeof value==="string") return {id:value,name:value};
  return {
    id:text(value?.id||value?.voice_id||value?.voice||value?.name),
    name:text(value?.name||value?.voice_name||value?.title||value?.label),
    lang:text(value?.lang||value?.language||"")
  };
}

export function normalizeEpisodeInfo(value={}){
  const season=Number(value?.season??value?.s??0)||0;
  const episode=Number(value?.episode??value?.e??0)||0;
  return {
    season:season>0?Math.floor(season):0,
    episode:episode>0?Math.floor(episode):0,
    title:text(value?.episode_title||value?.episodeName||value?.text||value?.title)
  };
}
