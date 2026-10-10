export function catalogItemId(type,id){
  const value=Number(id);
  if(!Number.isSafeInteger(value)||value<=0)return "";
  return "tmdb:"+(type==="movie"?"movie":"tv")+":"+value;
}

export function catalogPosterFilename(type,id){
  const value=Number(id);
  if(!Number.isSafeInteger(value)||value<=0)return "";
  return (type==="movie"?"movie":"tv")+"-"+value+".jpg";
}
