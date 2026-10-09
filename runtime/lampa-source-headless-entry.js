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

const noopNode={
  on(){return this},off(){return this},unbind(){return this},append(){return this},
  addClass(){return this},removeClass(){return this},find(){return this},text(){return this},
  remove(){return this},after(){return this},parent(){return this},eq(){return this},
  last(){return this},first(){return this},attr(){return ''},hasClass(){return false},
  toggleClass(){return this},css(){return this},html(){return this},val(){return this},
  length:0
}
function fakeItem(){const handlers={};return Object.assign({},noopNode,{
  on(name,fn){if(fn)handlers[name]=fn;return this},
  trigger(name){if(handlers[name])handlers[name]({target:this});return this}
})}
function jqueryLike(selector,context){
  if(typeof selector==='string'){
    const scope=context?.querySelectorAll?context:document
    if(selector.trim().startsWith('<')){
      const parsed=new DOMParser().parseFromString(selector,'text/html')
      const nodes=[...parsed.body.children]
      return wrapNodes(nodes)
    }
    try{return wrapNodes([...scope.querySelectorAll(selector)])}catch{return wrapNodes([])}
  }
  if(selector?.nodeType)return wrapNodes([selector])
  if(selector?.nodes)return selector
  return wrapNodes([])
}
function wrapNodes(nodes){
  const list={
    nodes,
    length:nodes.length,
    each(fn){nodes.forEach((node,i)=>fn.call(node,i,node));return this},
    attr(name,value){if(value!==undefined){nodes.forEach(n=>n.setAttribute?.(name,value));return this}return nodes[0]?.getAttribute?.(name)||''},
    text(value){if(value!==undefined){nodes.forEach(n=>{n.textContent=value});return this}return nodes[0]?.textContent||''},
    val(value){if(value!==undefined){nodes.forEach(n=>{n.value=value});return this}return nodes[0]?.value||''},
    find(selector){return wrapNodes(nodes.flatMap(n=>{try{return [...n.querySelectorAll(selector)]}catch{return []}}))},
    on(){return this},off(){return this},append(){return this},remove(){return this},
    addClass(){return this},removeClass(){return this},toggleClass(){return this},css(){return this},
    html(value){if(value!==undefined){nodes.forEach(n=>n.innerHTML=value);return this}return nodes[0]?.innerHTML||''}
  }
  return list
}
if(typeof window.$==='undefined')window.$=jqueryLike
if(!window.Lampa)window.Lampa={}
Object.assign(window.Lampa,{Reguest,Utils,Arrays,Lang})
if(!window.Lampa.Listener)window.Lampa.Listener=Subscribe()
if(!window.Lampa.Template)window.Lampa.Template={}
if(!window.Lampa.Template.get)window.Lampa.Template.get=()=>fakeItem()
if(!window.Lampa.Timeline)window.Lampa.Timeline={view:()=>({percent:0,time:0,duration:0}),render:()=>noopNode,details:()=>noopNode,update:()=>{}}
if(!window.Lampa.Noty)window.Lampa.Noty={show:()=>{}}
if(!window.Lampa.Favorite)window.Lampa.Favorite={add:()=>{}}
if(!window.Lampa.Storage){
  const storage=window.LunoLampaRuntime?.storage
  window.Lampa.Storage=storage||{get:(key,fallback)=>fallback,set:()=>{},cache:(key)=>({})}
}
if(!window.Lampa.Platform)window.Lampa.Platform={is:()=>false,version:false}
if(!window.Lampa.Player)window.Lampa.Player={}
window.Lampa.Player.play=()=>{}
window.Lampa.Player.playlist=()=>{}

const adapters={videocdn,rezka,kinobase,collaps,cdnmovies,filmix}
const bridgeComponent={
  proxy(){return ''},loading(){},reset(){},saveChoice(){},filter(){},start(){},
  contextmenu(){},empty(){},emptyForQuery(){},render(){return noopNode},
  getLastEpisode(){return 0},append(item){if(item&&typeof item.trigger==='function')item.trigger('hover:enter')}
}
const request=(url,options={})=>new Promise((resolve,reject)=>{
  const net=new Reguest()
  const timeout=setTimeout(()=>{try{net.clear()}catch{};reject(new Error('Lampa request timeout'))},Number(options.timeout)||15000)
  net.native(url,data=>{clearTimeout(timeout);resolve(data)},(a,b)=>{clearTimeout(timeout);reject(new Error(net.errorDecode(a,b)||'Lampa request failed'))},false,{headers:options.headers||{},dataType:options.dataType})
})
const addParam=(url,key,value)=>Utils.addUrlComponent(url,key+'='+encodeURIComponent(value))
const searchVideoCDN=async movie=>{
  const base='https://cdn.svetacdn.in/api/short?api_token=3i40G5TSECmLF77oAqnEgbx61ZWaOYaE'
  const candidates=[]
  if(movie?.imdb_id||movie?.imdbId)candidates.push(addParam(base,'imdb_id',movie.imdb_id||movie.imdbId))
  candidates.push(addParam(base,'title',movie?.title||movie?.name||''))
  for(const url of candidates){
    try{
      const json=await request(url)
      if(Array.isArray(json?.data)&&json.data.length)return json.data.filter(x=>x?.iframe_src)
    }catch(error){console.debug('[LUNO Lampa search]',error)}
  }
  return []
}
const searchKinopoisk=async movie=>{
  const kp=movie?.kinopoisk_id||movie?.kinopoiskId||movie?.kp_id
  if(kp)return [{kp_id:kp,filmId:kp,title:movie.title||movie.name}]
  const query=movie?.title||movie?.name||''
  if(!query)return []
  try{
    const json=await request('https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword='+encodeURIComponent(query),{headers:{'X-API-KEY':'2d55adfd-019d-4567-bbf7-67d503f61b5a'}})
    return (json?.films||json?.data||[]).map(x=>({...x,kp_id:x.filmId||x.film_id||x.kinopoisk_id||x.id,title:x.nameRu||x.nameEn||x.title||query})).filter(x=>x.kp_id)
  }catch(error){console.debug('[LUNO Lampa KP search]',error);return []}
}
const resolveSource=async(name,movie,searchData,options={})=>{
  const Source=adapters[name]
  if(!Source)throw new Error('Lampa source unavailable: '+name)
  let data=Array.isArray(searchData)?searchData:[]
  if(['videocdn','cdnmovies','filmix'].includes(name)&&!data.length)data=await searchVideoCDN(movie)
  if(['rezka','kinobase','collaps'].includes(name)&&!data.length)data=await searchKinopoisk(movie)
  if(!data.length)throw new Error('No matching catalog entry for Lampa source: '+name)
  return await new Promise((resolve,reject)=>{
    let capturedPlayer=null,settled=false
    const originalPlay=window.Lampa.Player.play
    const timeoutMs=Math.min(Math.max(Number(options.timeout)||20000,1000),30000)
    const finish=error=>{
      if(settled)return
      settled=true
      clearTimeout(timeout)
      window.Lampa.Player.play=originalPlay
      if(error)return reject(error)
      if(capturedPlayer)resolve(capturedPlayer)
      else reject(new Error('Lampa source returned no stream: '+name))
    }
    const timeout=setTimeout(()=>finish(new Error('Lampa source timeout: '+name)),timeoutMs)
    try{
      window.Lampa.Player.play=item=>{capturedPlayer=item;finish()}
      const instance=new Source(bridgeComponent,{movie})
      if(['videocdn','cdnmovies','filmix'].includes(name))instance.search({movie},data)
      else{
        const candidate=data.find(x=>x.kp_id||x.filmId||x.film_id)||data[0]
        instance.search({movie},candidate.kp_id||candidate.filmId||candidate.film_id||candidate.id,data)
      }
    }catch(error){finish(error)}
  })
}
window.LunoLampaSourceRuntime={adapters:Object.keys(adapters),source:resolveSource}
window.LunoLampaSourcesReady=true
