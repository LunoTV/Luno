function escapeHtml(value=""){
  return String(value).replace(/[&<>"']/g,char=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

export function renderSourceManager(container,{providers=[],sources=[],status={},preferences={},onToggleSource}={}){
  if(!container)return;
  const providerRows=providers.map(provider=>(
    '<div class="addon-row source-manager-provider">'+
      '<div><strong>'+escapeHtml(provider.name||provider.id)+'</strong>'+
      '<span>'+escapeHtml(provider.description||"LUNO runtime provider")+'</span></div>'+
      '<button class="source-toggle" type="button" data-provider-toggle="'+escapeHtml(provider.id)+'">'+(provider.enabled===false?"Выключен":"Включён")+'</button>'+
    '</div>'
  )).join("");

  const sourceRows=sources.map(source=>(
    '<div class="addon-row source-manager-source">'+
      '<div><strong>'+escapeHtml(source.name||source.id)+'</strong>'+
      '<span>Remote source • headless runtime</span></div>'+
      '<button class="source-toggle" type="button" data-source-toggle="'+escapeHtml(source.id)+'">'+(preferences[source.id]===false?"Выключен":"Включён")+'</button>'+
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


export function bindSourceManager(container,onToggle){
  container?.querySelectorAll("[data-source-toggle],[data-provider-toggle]").forEach(button=>{
    button.addEventListener("click",()=>{
      const provider=button.hasAttribute("data-provider-toggle");
      const id=provider?button.dataset.providerToggle:button.dataset.sourceToggle;
      const enabled=button.textContent.trim()!=="Включён";
      onToggle?.(id,enabled,provider?"provider":"source");
    });
  });
}
