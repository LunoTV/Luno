(function(){
const moon='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b6cff"/><stop offset="1" stop-color="#32c7ff"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#g)"/><path d="M40 12c-10 2-17 11-17 21 0 11 8 19 19 19 4 0 8-1 11-3-4 8-12 13-22 13C17 62 6 51 6 37 6 23 17 12 31 12c3 0 6 0 9 0z" fill="#fff"/></svg>');
function walk(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const a=[];while(w.nextNode())a.push(w.currentNode);for(const n of a){if(n.nodeValue&&n.nodeValue.trim()==='Prisma')n.nodeValue=n.nodeValue.replace('Prisma','LUNO')}}
function icons(){document.querySelectorAll('img').forEach(i=>{if(/prisma/i.test(i.src)||/prisma/i.test(i.alt||'')){i.src=moon;i.removeAttribute('srcset');i.alt='LUNO'}});document.querySelectorAll('[style*="prisma"],[class*="prisma"]').forEach(e=>{if(e.tagName==='IMG')e.src=moon})}
function apply(){walk(document.body);icons()}
new MutationObserver(apply).observe(document.documentElement,{subtree:true,childList:true,characterData:true});apply();
})();