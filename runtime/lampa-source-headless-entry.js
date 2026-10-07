import './lampa-headless-bootstrap'
import Subscribe from './src/utils/subscribe'
import Utils from './src/utils/utils'
import Arrays from './src/utils/arrays'
import Reguest from './src/utils/reguest'
import Lang from './src/core/lang'
import videocdn from './plugins/online/videocdn'

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
if(!window.Lampa.Player) window.Lampa.Player={}
let capturedPlayer=null
window.Lampa.Player.play=(item)=>{capturedPlayer=item}
window.Lampa.Player.playlist=()=>{}

const bridgeComponent={
  proxy(){return ''},loading(){},reset(){},saveChoice(){},filter(){},start(){},
  contextmenu(){},empty(){},emptyForQuery(){},render(){return noopNode},
  getLastEpisode(){return 0},append(item){if(item&&typeof item.trigger==='function')item.trigger('hover:enter')}
}

const resolveSource=(name,movie,searchData)=>new Promise((resolve,reject)=>{
  capturedPlayer=null
  const Source={videocdn}[name]
  if(!Source)return reject(new Error('Lampa source unavailable: '+name))
  try{
    const instance=new Source(bridgeComponent,{movie})
    const timeout=setTimeout(()=>reject(new Error('Lampa source timeout: '+name)),30000)
    const finish=()=>{clearTimeout(timeout);if(capturedPlayer)resolve(capturedPlayer);else reject(new Error('Lampa source returned no stream: '+name))}
    const originalPlay=window.Lampa.Player.play
    window.Lampa.Player.play=item=>{capturedPlayer=item;finish()}
    instance.search({movie},searchData||[])
    setTimeout(()=>{window.Lampa.Player.play=originalPlay},31000)
  }catch(e){reject(e)}
})

window.LunoLampaSourceRuntime={source:resolveSource}
window.LunoLampaSourcesReady=true
