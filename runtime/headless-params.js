const defaults = {
  language: 'ru',
  tmdb_lang: 'ru',
  poster_size: 'w300',
  video_quality_default: '1080',
  source: 'tmdb',
  proxy_tmdb: true,
  proxy_tmdb_auto: true,
  proxy_other: true,
  tmdb_proxy_api: '',
  tmdb_proxy_image: '',
  player: 'inner',
  player_iptv: 'inner',
  player_torrent: 'inner',
  player_hls_method: 'application',
  parse_lang: 'df'
}

function field(name){
  const raw = window.localStorage ? window.localStorage.getItem(name) : null
  if(raw === null) return defaults[name]
  if(raw === 'true') return true
  if(raw === 'false') return false
  return raw
}

export default { field, defaults }
