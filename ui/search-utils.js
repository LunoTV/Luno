export function normalizeSearchText(value=""){
  return String(value)
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g,"е")
    .replace(/[^a-zа-я0-9]+/gi," ")
    .replace(/\s+/g," ")
    .trim();
}

export function searchYear(item){
  return String(item?.releaseInfo||"").match(/\d{4}/)?.[0] || "";
}

export function dedupeSearchResults(items){
  const seen=new Set();
  const result=[];
  for(const item of items){
    const normalizedName=normalizeSearchText(item?.name||item?.originalName||"");
    const year=searchYear(item);
    const imdb=String(item?.imdbId||"").trim().toLowerCase();
    const key=imdb ? "imdb:"+imdb : [item?.type||"movie",normalizedName,year].join("|");
    if(!normalizedName || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export function rankSearchResults(items,query){
  const q=normalizeSearchText(query);
  const qWords=q.split(" ").filter(Boolean);
  const scored=items.map((item,index)=>{
    const name=normalizeSearchText(item?.name||"");
    const original=normalizeSearchText(item?.originalName||"");
    const year=searchYear(item);
    let score=0;
    if(name===q) score+=1000;
    else if(name.startsWith(q)) score+=650;
    else if(name.includes(q)) score+=450;
    if(original===q) score+=500;
    else if(original.startsWith(q)) score+=300;
    else if(original.includes(q)) score+=180;
    score+=qWords.filter(word=>name.includes(word)||original.includes(word)).length*70;
    if(item?.type==="movie") score+=160;
    if(item?.type==="series") score-=40;
    score+=(Number(item?.rating)||0)*12;
    score+=Math.min(Number(item?.popularity)||0,100)*0.25;
    const queryYear=q.match(/\b(19\d{2}|20\d{2})\b/)?.[1];
    if(queryYear) score+=year===queryYear ? 900 : -250;
    return {item,score,index};
  });
  return scored.sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.item);
}

