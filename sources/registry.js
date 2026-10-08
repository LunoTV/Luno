export function createSourceRegistry(){
  const providers=new Map();

  function register(provider){
    if(!provider?.id||typeof provider.resolve!=="function")return false;
    providers.set(String(provider.id),provider);
    return true;
  }

  function unregister(id){
    return providers.delete(String(id));
  }

  function get(id){return providers.get(String(id))||null}
  function list(){
    return [...providers.values()].map(provider=>({
      id:provider.id,
      name:provider.name||provider.id,
      description:provider.description||"",
      enabled:provider.enabled!==false,
      type:provider.type||"runtime"
    }));
  }
  function values(){return [...providers.values()]}
  function setEnabled(id,enabled){
    const provider=get(id);
    if(!provider)return false;
    provider.enabled=enabled!==false;
    return true;
  }

  return {register,unregister,get,list,values,setEnabled};
}
