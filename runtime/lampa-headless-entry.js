import Api from './src/core/api/api'
import TMDB from './src/core/tmdb/tmdb'
import Storage from './src/core/storage/storage'
import Params from './src/interaction/settings/params'
import Subscribe from './src/utils/subscribe'
import Utils from './src/utils/utils'
import Arrays from './src/utils/arrays'
import Manifest from './src/core/manifest'
import Account from './src/core/account/account'
import Settings from './src/interaction/settings/settings'
import videocdn from './plugins/online/videocdn'

if (typeof window.lampa_settings === 'undefined') window.lampa_settings = {}
Object.assign(window.lampa_settings, {
  account_use:false, account_sync:false, plugins_use:false, plugins_store:false,
  torrents_use:false, socket_use:false, services:false, mirrors:false, geo:false,
  push_state:false,
  disable_features:{ai:true,ads:true,trailers:true,install_proxy:true,remote_configuration:true}
})

if (!window.Lampa) window.Lampa = {}
if (!window.Lampa.Listener) window.Lampa.Listener = Subscribe()
Object.assign(window.Lampa,{TMDB,Storage,Utils,Arrays,Manifest,Account,Settings})
Params.init()

const promise = invoke => new Promise((resolve,reject)=>{
  let done=false
  const ok=x=>{if(done)return;done=true;resolve(x)}
  const fail=e=>{if(done)return;done=true;reject(e||new Error('Lampa request failed'))}
  try{invoke(ok,fail)}catch(e){fail(e)}
})

const source = Api.sources.tmdb
if (!source) throw new Error('Lampa TMDB source is unavailable')

const noopNode = {
  on(){return this}, off(){return this}, unbind(){return this}, append(){return this},
  addClass(){return this}, removeClass(){return this}, find(){return this},
  text(){return this}, remove(){return this}, after(){return this},
  parent(){return this}, eq(){return this}, last(){return this}, first(){return this},
  length:0
}
const fakeItem = () => {
  const handlers={}
  return Object.assign({},noopNode,{
    on(name,fn){if(fn)handlers[name]=fn;return this},
    trigger(name){if(handlers[name])handlers[name]();return this}
  })
}

if(!window.Lampa.Template) window.Lampa.Template={}
if(!window.Lampa.Template.get) window.Lampa.Template.get=()=>fakeItem()
if(!window.Lampa.Timeline) window.Lampa.Timeline={
  view:()=>({percent:0,time:0,duration:0}),
  render:()=>noopNode,
  details:()=>noopNode,
  update:()=>{}
}
if(!window.Lampa.Noty) window.Lampa.Noty={show:()=>{}}
if(!window.Lampa.Lang) window.Lampa.Lang={translate:k=>k}
if(!window.Lampa.Favorite) window.Lampa.Favorite={add:()=>{}}
if(!window.Lampa.Player) window.Lampa.Player={}
let capturedPlayer=null
window.Lampa.Player.play=(item)=>{capturedPlayer=item}
window.Lampa.Player.playlist=()=>{}

const bridgeComponent = {
  proxy(){return ''},
  loading(){}, reset(){}, saveChoice(){},
  filter(){}, start(){}, contextmenu(){}, empty(){},
  emptyForQuery(){}, render(){return noopNode},
  append(item){ if(item && typeof item.trigger==='function') item.trigger('hover:enter') }
}

const sourceClasses = { videocdn }

const resolveSource = (name, movie, searchData) => new Promise((resolve,reject)=>{
  capturedPlayer=null
  const Source=sourceClasses[name]
  if(!Source) return reject(new Error('Lampa source unavailable: '+name))
  let instance
  try{
    instance=new Source(bridgeComponent,{movie})
    const timeout=setTimeout(()=>reject(new Error('Lampa source timeout: '+name)),30000)
    const finish=()=>{clearTimeout(timeout);if(capturedPlayer)resolve(capturedPlayer);else reject(new Error('Lampa source returned no stream: '+name))}
    const originalPlay=window.Lampa.Player.play
    window.Lampa.Player.play=(item)=>{capturedPlayer=item;finish()}
    instance.search({movie},searchData||[])
    setTimeout(()=>{window.Lampa.Player.play=originalPlay},31000)
  }catch(e){reject(e)}
})

const runtime = {
  version:'lampa-headless-b4a13b6af7fe2f3bbbcb91f4eb434ab3378f8d5d',
  storage:Storage, params:Params, tmdb:TMDB, tmdbSource:source, api:Api,
  main(p={}){return promise((ok,fail)=>Api.main(p,ok,fail))},
  category(p={}){return promise((ok,fail)=>Api.category(p,ok,fail))},
  search(q,p={}){return promise((ok,fail)=>Api.search(Object.assign({},p,{query:q}),ok,fail))},
  full(p={}){return promise((ok,fail)=>Api.full(p,ok,fail))},
  genres(p={}){return promise((ok,fail)=>Api.genres(p,ok,fail))},
  person(p={}){return promise((ok,fail)=>Api.person(p,ok,fail))},
  seasons(tv,from){return promise(ok=>Api.seasons(tv,from,ok))},
  collections(p={}){return promise((ok,fail)=>Api.collections(p,ok,fail))},
  image(path,size='w500'){return source.img(path,size)},
  get(method,p={}){return promise((ok,fail)=>source.get(method,p,ok,fail,{life:0}))},
  source(name,movie,searchData){return resolveSource(name,movie,searchData)},
  clear(){return Api.clear()}
}
window.LunoLampaRuntime=runtime
window.LunoRuntime=runtime
window.LunoRuntimeReady=true
