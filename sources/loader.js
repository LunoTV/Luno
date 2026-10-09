function text(v){return v==null?"":String(v).trim()}

function http(v){
  try{
    const u=new URL(text(v));
    return u.protocol==="http:"||u.protocol==="https:";
  }catch{return false}
}

export function readSourceDefinitions(storageKey="luno-source-providers"){
  try{
    const raw=JSON.parse(localStorage.getItem(storageKey)||"[]");
    return Array.isArray(raw)?raw:[];
  }catch{return[]}
}

export function sourceDefinition(def){
  const endpoint=text(def?.endpoint);
  if(!http(endpoint))return null;
  return{
    id:text(def?.id)||"http-"+btoa(endpoint).replace(/[^a-z0-9]/gi,"").slice(0,12),
    name:text(def?.name)||"Browser Source",
    description:text(def?.description)||"LUNO-compatible HTTP source",
    endpoint,
    enabled:def?.enabled!==false,
    type:"http"
  };
}

export function loadSourceDefinitions(registry,definitions=readSourceDefinitions()){
  const loaded=[];
  for(const def of definitions){
    const source=sourceDefinition(def);
    if(!source)continue;
    registry.register({
      ...source,
      async resolve(item,{requestJson,parseSourcePayload,signal,sourceTimeout}={}){
        if(typeof requestJson!=="function")return[];
        const u=new URL(source.endpoint);
        const fields={
          imdb_id:item?.imdbId||item?.imdb_id,
          tmdb_id:item?.tmdbId||item?.tmdb_id,
          kinopoisk_id:item?.kinopoiskId||item?.kinopoisk_id,
          type:item?.type,
          title:item?.title||item?.name
        };
        for(const [key,value] of Object.entries(fields)){
          if(value!=null&&value!=="")u.searchParams.set(key,String(value));
        }
        if(signal?.aborted)return[];
        const data=await requestJson(u.toString(),{
          signal,
          timeout:Number(sourceTimeout)||9000
        });
        return typeof parseSourcePayload==="function"?parseSourcePayload(data):data;
      }
    });
    loaded.push(source.id);
  }
  return loaded;
}
