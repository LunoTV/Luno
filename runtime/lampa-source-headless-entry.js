import Subscribe from './src/utils/subscribe'
import Utils from './src/utils/utils'
import Arrays from './src/utils/arrays'
import Reguest from './src/utils/reguest'
import Lang from './src/core/lang'
import videocdn from './plugins/online/videocdn'
import rezka from './plugins/online/rezka'
import kinobase from './plugins/online/kinobase'
import collaps from './plugins/online/collaps'
import cdnmovies from './plugins/online/cdnmovies'
import filmix from './plugins/online/filmix'

if(!window.Lampa) window.Lampa={}
window.Lampa.Reguest=Reguest
window.Lampa.Utils=Utils
window.Lampa.Arrays=Arrays
window.Lampa.Lang=Lang
if(!window.Lampa.Listener) window.Lampa.Listener=Subscribe()

const noopNode={
  on(){return this},off(){return this},unbind(){return this},append(){return this},
  addClass(){return this},removeClass(){return this},find(){return this},text(){return this},
  remove(){return this},after(){return this},parent(){return this},eq(){return this},
  last(){return this},first(){return this},length:0
}
const fakeItem=()=>{const handlers={};return Object.assign({},noopNode,{
  on(name,fn){if(fn)handlers[name]=fn;return this},
  trigger(name){if(handlers[name])handlers[name]();return this}
})}
if(!window.Lampa.Template) window.Lampa.Template={}
if(!window.Lampa.Template.get) window.Lampa.Template.get=()=>fakeItem()
if(!window.Lampa.Timeline) window.Lampa.Timeline={view:()=>({percent:0,time:0,duration:0}),render:()=>noopNode,details:()=>noopNode,update:()=>{}}
if(!window.Lampa.Noty) window.Lampa.Noty={show:()=>{}}
if(!window.Lampa.Favorite) window.Lampa.Favorite={add:()=>{}}
if(!window.Lampa.Storage) window.Lampa.Storage={get:(key,fallback)=>fallback,set:()=>{},cache:(key)=>({})}
if(!window.Lampa.Player) window.Lampa.Player={}
let capturedPlayer=null
window.Lampa.Player.play=(item)=>{capturedPlayer=item}
window.Lampa.Player.playlist=()=>{}

const adapters={videocdn,rezka,kinobase,collaps,cdnmovies,filmix}
const bridgeComponent={
  proxy(){return ''},loading(){},reset(){},saveChoice(){},filter(){},start(){},
  contextmenu(){},empty(){},emptyForQuery(){},render(){return noopNode},
  getLastEpisode(){return 0},append(item){if(item&&typeof item.trigger==='function')item.trigger('hover:enter')}
}

const resolveSource=(name,movie,searchData=[],options={})=>new Promise((resolve,reject)=>{
  const Source=adapters[name]
  if(!Source)return reject(new Error('Lampa source unavailable: '+name))
  if(!Array.isArray(searchData)||!searchData.length)return reject(new Error('Lampa source requires matching search results: '+name))
  capturedPlayer=null
  let settled=false
  const timeoutMs=Math.min(Math.max(Number(options.timeout)||15000,1000),30000)
  const finish=(error)=>{
    if(settled)return
    settled=true
    clearTimeout(timeout)
    window.Lampa.Player.play=originalPlay
    if(error)return reject(error)
    if(capturedPlayer)resolve(capturedPlayer)
    else reject(new Error('Lampa source returned no stream: '+name))
  }
  const originalPlay=window.Lampa.Player.play
  const timeout=setTimeout(()=>finish(new Error('Lampa source timeout: '+name)),timeoutMs)
  try{
    window.Lampa.Player.play=item=>{capturedPlayer=item;finish()}
    const instance=new Source(bridgeComponent,{movie})
    instance.search({movie},searchData)
  }catch(error){finish(error)}
})

window.LunoLampaSourceRuntime={
  adapters:Object.keys(adapters),
  source:resolveSource
}
window.LunoLampaSourcesReady=true
