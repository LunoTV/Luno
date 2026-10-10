function text(v){return v==null?"":String(v).trim()}

export function qualityNumber(v){
  const label=String(v||"").trim().toLowerCase().replace(/\s+/g," ");
  const k=label.match(/(?:^|\b)(8|4|2)\s*k(?:\b|$)/);
  if(k)return Number(k[1])===8?4320:Number(k[1])===4?2160:1440;
  const explicit=label.match(/(?:^|\D)(4320|2160|1440|1080|720|576|540|480|360)(?:p)?(?:\D|$)/);
  if(explicit)return Number(explicit[1]);
  const hd=label.match(/\b(uhd|ultra\s*hd|full\s*hd|fhd|hd)\b/);
  if(hd){
    if(hd[1]==="uhd"||hd[1]==="ultra hd")return 2160;
    if(hd[1]==="full hd"||hd[1]==="fhd")return 1080;
    return 720;
  }
  return Number(label.match(/\d{3,4}/)?.[0]||0);
}

export function normalizeQualityMap(value){
  if(!value||typeof value!=="object"||Array.isArray(value))return{};
  const out={};
  for(const [key,val] of Object.entries(value)){
    if(typeof val==="string"){
      try{
        const u=new URL(val);
        if(u.protocol==="http:"||u.protocol==="https:")out[key]=val;
      }catch{}
    }
  }
  return out;
}

export function listQualities(stream){
  const map=normalizeQualityMap(stream?.quality||stream?.qualitys);
  return Object.entries(map)
    .map(([label,url])=>({label:String(label),height:qualityNumber(label),url}))
    .sort((a,b)=>b.height-a.height);
}

export function selectBestUrl(stream){
  const qualities=listQualities(stream);
  if(qualities.length)return qualities[0].url;
  return text(stream?.url||stream?.streamingUrl||stream?.externalUrl||stream?.webosUrl||stream?.file);
}
