function text(v){return v==null?"":String(v).trim()}

function http(v){
  try{
    const u=new URL(text(v));
    return u.protocol==="http:"||u.protocol==="https:";
  }catch{return false}
}

export function normalizeSubtitles(value){
  const list=Array.isArray(value)?value:(value?[value]:[]);
  return list.map((item,index)=>{
    if(typeof item==="string")return{label:"Subtitle "+(index+1),url:item};
    return{
      label:text(item?.label||item?.name||item?.lang||"Subtitle "+(index+1)),
      lang:text(item?.lang||item?.language||""),
      url:text(item?.url||item?.src||item?.file)
    };
  }).filter(item=>http(item.url));
}

export function pickSubtitle(subtitles=[],lang=""){
  const list=normalizeSubtitles(subtitles);
  if(!list.length)return null;
  const wanted=text(lang).toLowerCase();
  return list.find(x=>x.lang.toLowerCase()===wanted) ||
    list.find(x=>x.label.toLowerCase().includes(wanted)) ||
    list[0];
}
