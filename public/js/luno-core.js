(function(){
'use strict';
const KEY='luno_core_state_v2',read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}},save=p=>{try{localStorage.setItem(KEY,JSON.stringify({...read(),...p}))}catch{}};
let current=read().route||'home',stack=Array.isArray(read().stack)?read().stack:[];
const visible=e=>!!e&&e.offsetParent!==null;
const focus=e=>{if(!e)return;e.focus({preventScroll:true});e.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});save({focus:e.dataset.id||e.dataset.nav||e.className})};
function go(route,replace=false){if(route===current&&!replace)return;if(!replace)stack=[...stack.filter(x=>x!==route),current].filter(Boolean).slice(-20);current=route;save({route,stack});window.dispatchEvent(new CustomEvent('luno:navigate',{detail:{route,stack:[...stack]}}))}
function back(){if(!stack.length)return false;current=stack.pop()||'home';save({route:current,stack});window.dispatchEvent(new CustomEvent('luno:navigate',{detail:{route:current,stack:[...stack]}}));return true}
function closeOverlay(){const o=document.querySelector('.details-modal,.search-modal,.settings-modal');if(!o)return false;o.remove();return true}
function keydown(e){if(document.documentElement.dataset.device!=='tv')return;const k=e.key;if(k==='Escape'||k==='Backspace'){if(closeOverlay()||back()){e.preventDefault();return}}if(k==='Enter'&&document.activeElement?.matches('button')){e.preventDefault();document.activeElement.click();return}const a=document.activeElement;if(!a)return;let target=null;
if(a.closest('.media-row')&&(k==='ArrowLeft'||k==='ArrowRight')){const c=[...a.closest('.media-row').querySelectorAll('.media-card')].filter(visible),i=c.indexOf(a);target=c[i+(k==='ArrowRight'?1:-1)]}
if(a.closest('.screen-grid')&&(k==='ArrowLeft'||k==='ArrowRight')){const c=[...a.closest('.screen-grid').querySelectorAll('.media-card')].filter(visible),i=c.indexOf(a);target=c[i+(k==='ArrowRight'?1:-1)]}
if(target){focus(target);e.preventDefault();return}
if(a.closest('.media-row')&&(k==='ArrowUp'||k==='ArrowDown')){const rs=[...document.querySelectorAll('.content-section .media-row')].filter(r=>r.querySelector('.media-card')&&visible(r)),r=a.closest('.media-row'),i=rs.indexOf(r),tr=rs[i+(k==='ArrowDown'?1:-1)];if(tr){const c=[...tr.querySelectorAll('.media-card')].filter(visible),x=a.getBoundingClientRect(),cx=x.left+x.width/2;target=c.reduce((b,z)=>!b?z:Math.abs(z.getBoundingClientRect().left+z.offsetWidth/2-cx)<Math.abs(b.getBoundingClientRect().left+b.offsetWidth/2-cx)?z:b,null);if(target){focus(target);e.preventDefault();return}}}
if(k==='ArrowDown'&&a.closest('.topbar')){target=document.querySelector('.hero .primary,.hero .secondary,.content-section .media-card');if(target){focus(target);e.preventDefault();return}}
if(k==='ArrowUp'&&a.closest('.hero')){target=document.querySelector('.topbar .brand');if(target){focus(target);e.preventDefault();return}}
}
window.LunoCore={state:read,focus,router:{go,back,current:()=>current},controller:{keydown}};window.addEventListener('keydown',keydown,true);
})();