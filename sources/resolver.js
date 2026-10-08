import {selectBestUrl} from "./quality.js";
import {normalizeStream} from "./normalizer.js";

export function createSourceResolver({registry,cache=new Map(),cacheTtl=15000}){
  async function resolveProvider(provider,item,context={}){
    const key=provider.id+"|"+(context.videoId||item?.imdbId||item?.tmdbId||item?.id||item?.name||"");
    const cached=cache.get(key);
    if(cached&&cached.expires>Date.now())return cached.value;
    const values=await provider.resolve(item,context);
    const out=(Array.isArray(values)?values:[])
      .map(value=>value?.stream?{
        ...value,
        stream:{
          ...value.stream,
          url:selectBestUrl(value.stream)
        }
      }:normalizeStream(value,provider))
      .filter(value=>value?.stream?.url);
    cache.set(key,{expires:Date.now()+cacheTtl,value:out});
    return out;
  }

  async function resolve(item,context={}){
    const output=[];
    for(const provider of registry.values()){
      if(provider.enabled===false||context.signal?.aborted)continue;
      try{output.push(...await resolveProvider(provider,item,context))}
      catch(error){console.warn("[LUNO resolver]",provider.id,error)}
    }
    const seen=new Set();
    return output.filter(entry=>{
      const key=entry.stream.url+"|"+entry.stream.name;
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  }

  return {resolve,resolveProvider};
}
