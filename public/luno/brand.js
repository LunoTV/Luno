(function(){
const moon='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8b6cff"/><stop offset="1" stop-color="#32c7ff"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#g)"/><path d="M40 12c-10 2-17 11-17 21 0 11 8 19 19 19 4 0 8-1 11-3-4 8-12 13-22 13C17 62 6 51 6 37 6 23 17 12 31 12c3 0 6 0 9 0 3 0 6 0 9 0z" fill="#fff"/></svg>');
function walk(root){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const a=[];
  while(w.nextNode())a.push(w.currentNode);
  for(const n of a){
    if(!n.nodeValue)continue;
    const v=n.nodeValue.replace(/Prisma/g,'LUNO');
    if(v!==n.nodeValue)n.nodeValue=v;
  }
}
function icons(){
  document.querySelectorAll('img').forEach(i=>{
    if(/prisma/i.test(i.src)||/prisma/i.test(i.alt||'')){
      if(i.src!==moon)i.src=moon;
      i.removeAttribute('srcset');
      if(i.alt!=='LUNO')i.alt='LUNO';
    }
  });
  document.querySelectorAll('[style*="prisma"],[class*="prisma"]').forEach(e=>{
    if(e.tagName==='IMG'&&e.src!==moon)e.src=moon;
  });
  document.querySelectorAll('*').forEach(e=>{
    try{
      const bg=getComputedStyle(e).backgroundImage;
      if(/prisma/i.test(bg)&&e.style.backgroundImage.indexOf(moon)===-1)e.style.backgroundImage='url("'+moon+'")';
    }catch(_){}
  });
}
function apply(){
  if(!document.body)return;
  walk(document.body);
  const title=document.title.replace(/Prisma/g,'LUNO');
  if(title!==document.title)document.title=title;
  document.querySelectorAll('[title],[aria-label],[alt]').forEach(e=>{
    ['title','aria-label','alt'].forEach(a=>{
      const v=e.getAttribute(a);
      if(v){
        const nv=v.replace(/Prisma/g,'LUNO');
        if(nv!==v)e.setAttribute(a,nv);
      }
    });
  });
  icons();
}
let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  setTimeout(()=>{queued=false;apply()},50);
}
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['src','srcset','style','title','aria-label','alt']});
apply();
})();