(function(){
  function install(){
    const w=document.querySelector('.welcome');
    if(!w || w.dataset.lunoSplash==='1') return;
    w.dataset.lunoSplash='1';
    const css=document.createElement('style');
    css.textContent='.welcome.luno-splash{background:#061522!important;background-image:none!important;display:flex!important;align-items:center!important;justify-content:center!important}.welcome.luno-splash:before,.welcome.luno-splash:after{display:none!important}.luno-splash__box{width:min(520px,78vw);text-align:center;color:#f5f7fb;font-family:Arial,sans-serif}.luno-splash__moon{width:96px;height:96px;margin:0 auto 24px;border-radius:28px;background:linear-gradient(135deg,#8b6cff,#32c7ff);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 40px rgba(50,199,255,.18)}.luno-splash__moon:before{content:"";width:58px;height:58px;border-radius:50%;background:#fff;transform:translate(6px,-1px);box-shadow:14px -4px 0 0 #061522}.luno-splash__name{font-size:42px;letter-spacing:.28em;margin-left:.28em;font-weight:300}.luno-splash__spinner{width:64px;height:64px;margin:34px auto 22px;border-radius:50%;border:7px solid #173247;border-top-color:#8b6cff;border-right-color:#32c7ff;animation:lunoSpin 1s linear infinite}@keyframes lunoSpin{to{transform:rotate(360deg)}}.luno-splash__text{font-size:20px;color:#c7d0dc}.luno-splash__bar{height:7px;background:#173247;border-radius:8px;margin:26px auto 0;overflow:hidden}.luno-splash__bar:before{content:"";display:block;width:42%;height:100%;background:linear-gradient(90deg,#32c7ff,#f5f7fb);border-radius:8px}';
    document.head.appendChild(css);
    w.classList.add('luno-splash');
    w.innerHTML='<div class="luno-splash__box"><div class="luno-splash__moon"></div><div class="luno-splash__name">LUNO</div><div class="luno-splash__spinner"></div><div class="luno-splash__text">Загружаем LUNO...</div><div class="luno-splash__bar"></div></div>';
  }
  document.addEventListener('DOMContentLoaded',install,{once:true});
  [300,1000].forEach(ms=>setTimeout(install,ms));
})();