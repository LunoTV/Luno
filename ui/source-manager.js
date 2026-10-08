function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g,char=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

export function renderSourceManager(container,{providers=[],sources=[],status={}}={}){
  if(!container)return;
  const providerRows=providers.map(provider=>(
    '<div class="addon-row source-manager-provider">'+
      '<div><strong>'+escapeHtml(provider.name||provider.id)+'</strong>'+
      '<span>'+escapeHtml(provider.description||"LUNO runtime provider")+'</span></div>'+
      '<em>'+escapeHtml(provider.enabled===false?"Выключен":"Активен")+'</em>'+
    '</div>'
  )).join("");

  const sourceRows=sources.map(source=>(
    '<div class="addon-row source-manager-source">'+
      '<div><strong>'+escapeHtml(source.name||source.id)+'</strong>'+
      '<span>Remote source • headless runtime</span></div>'+
      '<em>Доступен через runtime</em>'+
    '</div>'
  )).join("");

  container.innerHTML=
    '<div class="source-manager-summary">'+
      '<div><strong>'+Number(sources.length)+'</strong><span>источников в каталоге</span></div>'+
      '<div><strong>'+Number(status.apiMirrors||0)+'</strong><span>API mirrors</span></div>'+
      '<div><strong>'+Number(status.providers||0)+'</strong><span>runtime providers</span></div>'+
    '</div>'+
    '<div class="source-manager-title">Runtime</div>'+
    (providerRows||'<div class="addon-row"><div><strong>Нет runtime providers</strong></div></div>')+
    '<div class="source-manager-title">Каталог источников</div>'+
    (sourceRows||'<div class="addon-row"><div><strong>Каталог пуст</strong></div></div>');
}

export function sourceManagerStatusText(status={}){
  return "LUNO Source Engine • "+Number(status.catalogSources||0)+" источников";
}
