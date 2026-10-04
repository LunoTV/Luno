(function(){
  var started = false;

  function isWelcomeHidden(){
    var w = document.querySelector('.welcome');
    if(!w) return false;
    var s = getComputedStyle(w);
    return w.classList.contains('hide') || w.classList.contains('hidden') ||
      s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0';
  }

  function removeSplash(){
    var el = document.getElementById('luno-native-splash');
    if(el) el.remove();
    document.documentElement.classList.remove('luno-loading');
    document.body.classList.remove('luno-loading');
  }

  function install(){
    if(started) return;
    started = true;

    var css = document.createElement('style');
    css.id = 'luno-native-splash-css';
    css.textContent =
      'html.luno-loading,body.luno-loading{background:#061522!important;overflow:hidden!important}' +
      '#luno-native-splash{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#061522;color:#f5f7fb;font-family:Arial,sans-serif}' +
      '#luno-native-splash .luno-box{width:min(560px,78vw);text-align:center}' +
      '#luno-native-splash .luno-moon{position:relative;width:112px;height:112px;margin:0 auto 24px;border-radius:50%;background:#fff;box-shadow:0 0 42px rgba(255,255,255,.08)}' +
      '#luno-native-splash .luno-moon:after{content:"";position:absolute;width:112px;height:112px;border-radius:50%;background:#061522;left:30px;top:-12px}' +
      '#luno-native-splash .luno-name{font-size:46px;line-height:1;letter-spacing:.28em;margin-left:.28em;font-weight:300}' +
      '#luno-native-splash .luno-spinner{width:58px;height:58px;margin:38px auto 22px;border-radius:50%;border:6px solid #173247;border-top-color:#32c7ff;border-right-color:#8b6cff;animation:lunoSpin 1s linear infinite}' +
      '#luno-native-splash .luno-text{font-size:20px;color:#c7d0dc}' +
      '#luno-native-splash .luno-bar{height:7px;background:#173247;border-radius:8px;margin:26px auto 0;overflow:hidden}' +
      '#luno-native-splash .luno-bar:before{content:"";display:block;width:42%;height:100%;background:linear-gradient(90deg,#32c7ff,#f5f7fb);border-radius:8px}' +
      '@keyframes lunoSpin{to{transform:rotate(360deg)}}';
    document.head.appendChild(css);

    document.documentElement.classList.add('luno-loading');
    document.body.classList.add('luno-loading');

    var splash = document.createElement('div');
    splash.id = 'luno-native-splash';
    splash.innerHTML =
      '<div class="luno-box">' +
        '<div class="luno-moon"></div>' +
        '<div class="luno-name">LUNO</div>' +
        '<div class="luno-spinner"></div>' +
        '<div class="luno-text">Загружаем LUNO...</div>' +
        '<div class="luno-bar"></div>' +
      '</div>';
    document.body.appendChild(splash);

    var w = document.querySelector('.welcome');
    if(w) w.style.visibility = 'hidden';

    var observer = new MutationObserver(function(){
      if(isWelcomeHidden()){
        observer.disconnect();
        removeSplash();
      }
    });
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style']});

    var checks = 0;
    var poll = setInterval(function(){
      checks++;
      if(isWelcomeHidden()){
        clearInterval(poll);
        observer.disconnect();
        removeSplash();
      } else if(checks >= 60){
        clearInterval(poll);
        observer.disconnect();
        removeSplash();
      }
    },500);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',install,{once:true});
  } else {
    install();
  }
})();