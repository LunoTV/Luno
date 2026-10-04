(function(){
'use strict';
const KEY='luno_core_state_v1';
const state=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}};
const save=p=>{try{localStorage.setItem(KEY,JSON.stringify({...state(),...p}))}catch{}};
const tv=()=>document.documentElement.dataset.device==='tv';
const visible=e=>!!e&&e.offsetParent!==null;
const focus=e=>{if(!e)return;e.focus({preventScroll:true});e.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});save({focusSelector:e.dataset.nav?'[data-nav="'+e.dataset.nav+'"]':e.classList.contains('media-card')?'.media-card[data-id="'+CSS.escape(e.dataset.id||'')+'"]':''})};
const cards=r=>[...r.querySelectorAll('.media-card')].filter(visible);
const rows=()=>[...document.querySelectorAll('.content-section .media-row')].filter(r=>cards(r).length&&visible(r));
const close=()=>{const o=document.querySelector('.details-modal,.search-modal,.settings-modal');if(!o)return false;o.remove();focus(document.querySelector('.topbar .brand')||document.querySelector('.topbar button'));return true};
function handle(e){
 if(!tv())return;
 const k=e.key;
 if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter','Escape','Backspace'].includes(k))return;
 if((k==='Escape'||k==='Backspace')&&close()){e.preventDefault();e.stopImmediatePropagation();return}
 const a=document.activeElement;if(!a)return;
 if(k==='Enter'&&a.matches('button')){e.preventDefault();e.stopImmediatePropagation();a.click();return}
 let done=false;
 if(a.closest('.topbar')&&(k==='ArrowLeft'||k==='ArrowRight')){
   const b=[...document.querySelectorAll('.topbar button')].filter(visible),i=b.indexOf(a),n=b[i+(k==='ArrowRight'?1:-1)];if(n){focus(n);done=true}
 }else if(a.closest('.media-row')&&(k==='ArrowLeft'||k==='ArrowRight')){
   const c=cards(a.closest('.media-row')),i=c.indexOf(a),n=c[i+(k==='ArrowRight'?1:-1)];if(n){focus(n);done=true}
 }else if(a.closest('.media-row')&&(k==='ArrowUp'||k==='ArrowDown')){
   const r=a.closest('.media-row'),rs=rows(),ri=rs.indexOf(r),tr=rs[ri+(k==='ArrowDown'?1:-1)];
   if(tr){const c=cards(tr),x=a.getBoundingClientRect(),cx=x.left+x.width/2,n=c.reduce((best,z)=>{if(!best)return z;const br=best.getBoundingClientRect(),zr=z.getBoundingClientRect();return Math.abs(zr.left+zr.width/2-cx)<Math.abs(br.left+br.width/2-cx)?z:best},null);tr.closest('.content-section')?.scrollIntoView({behavior:'auto',block:'start'});focus(n);done=true}
 }else if(k==='ArrowDown'&&(a.closest('.topbar')||a.closest('.hero'))){
   const n=a.closest('.topbar')?document.querySelector('.hero .primary,.hero .secondary'):document.querySelector('.content-section .media-card');if(n){focus(n);done=true}
 }else if(k==='ArrowUp'&&a.closest('.hero')){
   focus(document.querySelector('.topbar .brand')||document.querySelector('.topbar button'));done=true
 }
 if(!done){
   const b=[...document.querySelectorAll('.topbar button,.hero button,.content-section .media-card,.section-link,.row-control,.search,.settings-tile')].filter(visible),i=b.indexOf(a);
   const step=k==='ArrowDown'||k==='ArrowRight'?1:k==='ArrowUp'||k==='ArrowLeft'?-1:0,n=b[i+step];if(n){focus(n);done=true}
 }
 if(done){e.preventDefault();e.stopImmediatePropagation();save({screen:document.querySelector('.home')?'home':'overlay'})}
}
window.LunoCore={state,focus,controller:{handle},router:{go(id){document.querySelector('#'+id)?.scrollIntoView({behavior:'auto',block:'start'});save({screen:id})},back:close}};
window.addEventListener('keydown',handle,true);
const nativeSetTimeout=window.setTimeout.bind(window);
window.setTimeout=function(fn,delay,...args){return nativeSetTimeout(fn,delay===5600?700:delay,...args)};
function boot(){const home=document.querySelector('#app .home');if(!home){nativeSetTimeout(boot,100);return}const s=state();let t=s.focusSelector?document.querySelector(s.focusSelector):null;if(!visible(t))t=document.querySelector('.topbar .brand')||document.querySelector('.topbar button');requestAnimationFrame(()=>focus(t))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();