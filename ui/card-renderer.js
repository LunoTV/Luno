import { escapeHtml, mediaCategory, posterCandidates } from "./media-utils.js";

export function isLowPowerTV(){
  const ua=String(navigator.userAgent||"");
  return /web0s|webos|netcast|tizen|smart-tv|smarttv|hbbtv|aftb|android tv|googletv/i.test(ua)
    || (navigator.hardwareConcurrency>0 && navigator.hardwareConcurrency<=4 && matchMedia("(hover: none)").matches);
}
export function card(item,eager=false){
  const title=item?.name || "Без названия";
  const candidates=posterCandidates(item);
  const image=candidates[0] || "";
  const fallbacks=candidates.slice(1);
  const rating=Number(item?.rating)>0 ? Number(item.rating).toFixed(1) : "";
  const year=String(item?.releaseInfo||"").match(/\d{4}/)?.[0] || "";
  const rawType=mediaCategory(item);
  const type=({movies:"ФИЛЬМ",series:"СЕРИАЛ",cartoons:"МУЛЬТФИЛЬМ",anime:"АНИМЕ",shows:"ШОУ"})[rawType] || (item?.type==="series" ? "СЕРИАЛ" : "ФИЛЬМ");
  const genres=Array.isArray(item?.genres)?item.genres.map(g=>typeof g==="string"?g:(g?.name||"")).filter(Boolean):[];
  const genreLabel=genres[0]||type;
  const quality=String(item?.quality||item?.videoQuality||item?.resolution||item?.video_quality||"AUTO").toUpperCase();
  const posterPlaceholder='<span class="poster-fallback poster-fallback-title" aria-hidden="true"><span>'+escapeHtml(title)+'</span></span>';
  // Smart-TV browsers often defer lazy images inside horizontal rails indefinitely.
  // Load the first visible posters eagerly on TVs; keep the rest lazy to protect memory.
  const tvPosterPriority=isLowPowerTV() && eager;
  const imageHtml=image
    ? posterPlaceholder+'<img src="'+escapeHtml(image)+'" data-fallbacks="'+escapeHtml(JSON.stringify(fallbacks))+'" alt="'+escapeHtml(title)+'" loading="'+(eager ? "eager" : "lazy")+'" decoding="async" fetchpriority="'+(eager && !isLowPowerTV() ? "high" : "auto")+'" referrerpolicy="no-referrer"'+(tvPosterPriority?' data-tv-poster="priority"':'')+'>'
    : posterPlaceholder;
  const meta=(rating ? '<span class="card-rating">★ '+rating+'</span>' : '')+
    (year ? '<span class="card-year">'+year+'</span>' : '');
  const overlayMeta=(rating ? '<span class="card-hover-rating">★ '+rating+'</span>' : '')+
    (year ? '<span>'+year+'</span>' : '')+
    '<span>'+escapeHtml(genreLabel)+'</span>';
  return '<button class="card" data-id="'+escapeHtml(item?.id||"")+'" data-type="'+escapeHtml(item?.type||"movie")+'" data-title="'+escapeHtml(title)+'" aria-label="Открыть '+escapeHtml(title)+'">'+
    '<span class="card-art">'+imageHtml+
      '<span class="card-gradient"></span>'+
      '<span class="card-type card-corner">'+escapeHtml(type)+'</span>'+
      (rating ? '<span class="poster-quality poster-card-rating">★ '+rating+'</span>' : '')+
      (year ? '<span class="poster-year">'+escapeHtml(year)+'</span>' : '')+
      '<span class="card-info">'+meta+'</span>'+
      '<span class="card-hover-panel"><span class="card-hover-meta">'+overlayMeta+'</span><span class="card-hover-title">'+escapeHtml(title)+'</span><span class="card-hover-cta">Подробнее <span aria-hidden="true">↗</span></span></span>'+
    '</span>'+
    '<span class="card-title">'+escapeHtml(title)+'</span>'+
  '</button>';
}

