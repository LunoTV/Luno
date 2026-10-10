export function filterEnabledSourceIds(ids,preferences={}){
  if(!Array.isArray(ids))return [];
  return ids.filter(id=>preferences[String(id||"").toLowerCase()]!==false);
}
