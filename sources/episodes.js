function text(v){return v==null?"":String(v).trim()}

export function episodeNumber(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>0?Math.floor(n):0;
}

export function seasonNumber(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>0?Math.floor(n):0;
}

export function normalizeEpisode(value={}){
  return{
    season:seasonNumber(value.season??value.s),
    episode:episodeNumber(value.episode??value.e),
    title:text(value.title||value.name||value.text),
    id:text(value.id||value.videoId)
  };
}

export function groupEpisodes(items=[]){
  const groups=new Map();
  for(const item of items){
    const ep=normalizeEpisode(item);
    const key=ep.season||0;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push({...item,...ep});
  }
  return [...groups.entries()]
    .sort((a,b)=>a[0]-b[0])
    .map(([season,episodes])=>({season,episodes}));
}
