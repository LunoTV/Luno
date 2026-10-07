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
  clear(){return Api.clear()}
}

window.LunoLampaRuntime=runtime
window.LunoRuntime=runtime
window.LunoRuntimeReady=true
