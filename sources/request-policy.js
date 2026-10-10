function validHttpUrl(value){
  try{
    const url=new URL(String(value||""));
    return url.protocol==="http:"||url.protocol==="https:";
  }catch{return false}
}

export function isTrustedRuntimeApiUrl(value,apiBases=[]){
  if(!validHttpUrl(value)||!Array.isArray(apiBases))return false;
  try{
    const target=new URL(value);
    return apiBases.some(base=>{
      try{
        const candidate=new URL(String(base||""));
        return (candidate.protocol==="http:"||candidate.protocol==="https:")&&candidate.origin===target.origin;
      }catch{return false}
    });
  }catch{return false}
}

export function appendRuntimeParams(value,params={},apiBases=[]){
  if(!isTrustedRuntimeApiUrl(value,apiBases))return value;
  try{
    const url=new URL(value);
    for(const [key,raw] of Object.entries(params||{})){
      if(raw==null||raw===" "||raw==="")continue;
      if(!url.searchParams.has(key))url.searchParams.set(key,String(raw));
    }
    return url.toString();
  }catch{return value}
}
