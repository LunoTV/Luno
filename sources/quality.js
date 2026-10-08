function text(v){return v==null?"":String(v).trim()}

export function qualityNumber(v){
  return Number(String(v||"").match(/\d{3,4}/)?.[0]||0);
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
