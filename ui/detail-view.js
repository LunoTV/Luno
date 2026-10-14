import { escapeHtml, categoryLabel } from "./media-utils.js";

export function createDetailView({getCatalogItems,card,bindCards}={}){
  const detailSeasonsSection=document.querySelector("#detailSeasonsSection");
  const detailSeasonsTitle=document.querySelector("#detailSeasonsTitle");
  const detailTitle=document.querySelector("#detailTitle");
  const detailMeta=document.querySelector("#detailMeta");
  const detailBadges=document.querySelector("#detailBadges");
  const detailDescription=document.querySelector("#detailDescription");
  const detailReleaseInfo=document.querySelector("#detailReleaseInfo");
  const detailTypeInfo=document.querySelector("#detailTypeInfo");
  const detailQualityInfo=document.querySelector("#detailQualityInfo");
  const detailQualityBar=document.querySelector("#detailQualityBar");
  const detailQualityText=document.querySelector("#detailQualityText");
  const detailRatings=document.querySelector("#detailRatings");
  const detailTags=document.querySelector("#detailTags");
  const detailCredits=document.querySelector("#detailCredits");
  const detailSimilar=document.querySelector("#detailSimilar");
  const detailSimilarTitle=document.querySelector("#detailSimilarTitle");
  const detailRecommendations=document.querySelector("#detailRecommendations");

function paintDetail(value){\n  const catalogItems=getCatalogItems?.()||[];
  const title=value?.name || "Без названия";
  const year=String(value?.releaseInfo || "").match(/\d{4}/)?.[0] || "—";
  const score=Number(value?.rating)||0;
  const type=categoryLabel(value);
  const genres=Array.isArray(value?.genres) ? value.genres : [];
  const genreMap={
    28:"Боевик",12:"Приключения",16:"Мультфильм",35:"Комедия",80:"Криминал",
    99:"Документальный",18:"Драма",10751:"Семейный",14:"Фэнтези",36:"История",
    27:"Ужасы",10402:"Музыка",9648:"Детектив",10749:"Мелодрама",878:"Фантастика",
    10770:"ТВ",53:"Триллер",10752:"Военный",37:"Вестерн",10759:"Боевик",10762:"Детский",
    10763:"Новости",10764:"Реалити",10765:"Фантастика",10766:"Мыльная опера",
    10767:"Ток-шоу",10768:"Война"
  };
  const genreNames=genres.map(g=>genreMap[g]||g).filter(Boolean).slice(0,5);
  // TMDB ratings describe audience reception, not video resolution.
  // Never claim 4K/Full HD until the selected stream provides that metadata.
  const quality="По источнику";

  if(detailSeasonsSection) detailSeasonsSection.classList.toggle("hidden",value?.type!=="series");
  if(detailSeasonsTitle) detailSeasonsTitle.textContent=title+" — сезоны и серии";
  const detailKicker=document.querySelector(".luno-card-hero-copy .luno-card-eyebrow");
  if(detailKicker) detailKicker.textContent="LUNO  •  "+(value?.type==="series"?"СЕРИАЛ":"ФИЛЬМ");
  if(detailTitle) detailTitle.textContent=title;
  if(detailMeta) detailMeta.innerHTML=[
    score>0 ? '<span class="detail-meta-rating">★ '+score.toFixed(1)+' <small>TMDB</small></span>' : "",
    year!=="—" ? escapeHtml(year) : "",
    value?.runtime ? escapeHtml(value.runtime+" мин") : "",
    escapeHtml(type)
  ].filter(Boolean).join('<span class="detail-meta-separator">•</span>');

  if(detailBadges){
    detailBadges.innerHTML=[
      ...genreNames.slice(0,3).map(g=>'<span class="detail-badge detail-badge-muted">'+escapeHtml(g)+'</span>'),
      '<span class="detail-badge detail-quality">По источнику</span>'
    ].filter(Boolean).join("");
  }

  if(detailDescription) detailDescription.textContent=value?.description || "Описание пока недоступно.";
  if(detailReleaseInfo) detailReleaseInfo.textContent=year;
  if(detailTypeInfo) detailTypeInfo.textContent=type;
  if(detailQualityInfo) detailQualityInfo.textContent=quality;
  if(detailQualityBar) detailQualityBar.style.width="0%";
  if(detailQualityText) detailQualityText.textContent="Качество определяется выбранным потоком";

  if(detailRatings){ detailRatings.innerHTML=""; detailRatings.hidden=true; }

  if(detailTags){
    detailTags.innerHTML=genreNames.map(g=>'<button type="button" data-detail-genre="'+escapeHtml(g)+'"># '+escapeHtml(g)+'</button>').join("") || '<button type="button" data-detail-genre="Кино"># LUNO</button>';
  }

  if(detailCredits){
    const cast=Array.isArray(value?.cast) ? value.cast.slice(0,10) : [];
    detailCredits.innerHTML=cast.length ? cast.map(actor=>{
      const portrait=actor?.profile || "";
      return '<button class="luno-actor-card" type="button">'+
        '<span class="luno-actor-avatar" style="background-image:url(&quot;'+escapeHtml(portrait)+'&quot;)">'+
          (!portrait ? escapeHtml(String(actor?.name||"?").slice(0,1)) : "")+
        '</span>'+
        '<span class="luno-actor-copy"><strong>'+escapeHtml(actor?.name||"Актёр")+'</strong><small>'+escapeHtml(actor?.character||"В ролях")+'</small></span>'+
      '</button>';
    }).join("") : '<div class="luno-actors-empty">Информация об актёрах пока недоступна.</div>';
  }

  if(detailSimilar){
    const pool=(catalogItems||[]).filter(x=>x?.id && x.id!==value?.id);
    const collectionId=Number(value?.collectionId)||0;
    const franchise=collectionId ? pool.filter(x=>Number(x?.collectionId)===collectionId) : [];
    const scored=pool.map(item=>{
      const shared=(item.genreIds||[]).filter(g=>(value.genreIds||[]).includes(g)).length;
      const rating=Number(item.rating)||0;
      return {item,score:shared*20+rating};
    }).sort((a,b)=>b.score-a.score).map(x=>x.item);
    const similar=franchise.length ? franchise : scored;
    if(detailSimilarTitle) detailSimilarTitle.textContent=franchise.length ? "Франшиза" : "Похожие";
    detailSimilar.innerHTML=similar.slice(0,8).map(item=>card(item)).join("");
    bindCards();
  }

  if(detailRecommendations){
    const pool=(catalogItems||[]).filter(x=>x?.id && x.id!==value?.id);
    const currentYear=new Date().getFullYear();
    const getItemYear=item=>Number(String(item?.releaseInfo||"").match(/\d{4}/)?.[0]||0);
    const sharedGenres=(item?.genreIds||[]).filter(g=>(value.genreIds||[]).includes(g)).length;
    const seeded=(item)=>{
      let n=0;
      for(const ch of String(item?.id||"")) n=((n*31)+ch.charCodeAt(0))>>>0;
      return n;
    };
    const ranked=pool.map(item=>{
      const year=getItemYear(item);
      const age=Math.abs((year||currentYear)-currentYear);
      const era=year>=2020 ? "2020s" : year>=2010 ? "2010s" : year>=2000 ? "2000s" : "classic";
      const rating=Number(item?.rating)||0;
      const popularity=Number(item?.popularity)||0;
      return {
        item, year, era,
        score:sharedGenres*34 + Math.min(rating,10)*3 + Math.min(popularity,100)*0.08 + seeded(item)%37
      };
    }).sort((a,b)=>b.score-a.score);

    // Не превращаем рекомендации в ленту новинок: сначала берём разные эпохи,
    // затем добираем лучшие совпадения. Набор слегка меняется при каждом открытии.
    const selected=[];
    const eras=["2020s","2010s","2000s","classic"];
    for(const era of eras){
      const candidates=ranked.filter(x=>x.era===era && !selected.some(y=>y.item.id===x.item.id)).slice(0,6);
      if(candidates.length){
        const pick=candidates[Math.floor(Math.random()*candidates.length)];
        selected.push(pick);
      }
    }
    for(const candidate of ranked){
      if(selected.length>=8) break;
      if(!selected.some(x=>x.item.id===candidate.item.id)) selected.push(candidate);
    }
    const recommendations=selected.slice(0,8).map(x=>x.item);
    detailRecommendations.innerHTML=recommendations.length ? recommendations.map(item=>card(item)).join("") : "";
    bindCards();
  }
}

  return {paintDetail};
}
