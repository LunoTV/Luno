import './source-runtime.js';

const STYLE_ID = 'luno-source-bridge-style';
const BUTTON_CLASS = 'luno-source-bridge-button';

function waitForLampa() {
  if (window.Lampa?.Listener && window.Lampa?.Player) return Promise.resolve();
  return new Promise(resolve => setTimeout(() => resolve(waitForLampa()), 250));
}

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .\${BUTTON_CLASS}{display:inline-flex;align-items:center;justify-content:center;min-width:86px;height:42px;margin:4px;padding:0 14px;border:0;border-radius:7px;background:rgba(255,255,255,.12);color:#fff;font-size:14px;font-weight:600;cursor:pointer}
    .luno-source-overlay{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
    .luno-source-panel{width:min(720px,100%);max-height:85vh;overflow:auto;background:#171717;color:#fff;border-radius:14px;padding:20px;box-sizing:border-box}
    .luno-source-title{font-size:20px;font-weight:700;margin-bottom:14px}
    .luno-source-status{opacity:.7;margin:8px 0 14px}
    .luno-source-list{display:grid;gap:8px}
    .luno-source-item{width:100%;padding:12px 14px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:#222;color:#fff;text-align:left;cursor:pointer}
    .luno-source-item small{display:block;opacity:.55;margin-top:4px}
    .luno-source-close{margin-top:14px;padding:10px 14px;border:0;border-radius:8px;background:#333;color:#fff;cursor:pointer}
  `;
  document.head.appendChild(style);
}

function makePlayerElement(item, stream) {
  return {
    title: item.title || item.voice_name || 'LUNO',
    url: stream.url,
    quality: stream.quality || item.quality || {},
    subtitles: stream.subtitles || item.subtitles || null,
    segments: stream.segments || item.segments || null,
    season: item.season,
    episode: item.episode,
    voice_name: item.voice_name,
    thumbnail: item.thumbnail,
    headers: stream.headers || item.headers || null,
    isonline: true
  };
}

function openOverlay(movie) {
  const overlay = document.createElement('div');
  overlay.className = 'luno-source-overlay';
  const panel = document.createElement('div');
  panel.className = 'luno-source-panel';
  const title = document.createElement('div');
  title.className = 'luno-source-title';
  title.textContent = 'LUNO Sources';
  const status = document.createElement('div');
  status.className = 'luno-source-status';
  status.textContent = 'Получаю источники…';
  const list = document.createElement('div');
  list.className = 'luno-source-list';
  const close = document.createElement('button');
  close.className = 'luno-source-close';
  close.textContent = 'Закрыть';
  close.onclick = () => overlay.remove();
  panel.append(title, status, list, close);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  async function renderResult(result) {
    list.replaceChildren();
    const items = result.items || [];
    status.textContent = items.length ? `Найдено: \${items.length}` : 'Источник не вернул вариантов';

    for (const item of items) {
      const button = document.createElement('button');
      button.className = 'luno-source-item';
      button.textContent = item.title || item.voice_name || item.kind || 'Источник';
      const meta = document.createElement('small');
      meta.textContent = item.kind === 'link'
        ? 'Навигация'
        : item.kind === 'call'
          ? 'Resolver'
          : item.quality && Object.keys(item.quality).length
            ? `Качество: \${Object.keys(item.quality).join(', ')}`
            : 'Прямой stream';
      button.appendChild(meta);

      button.onclick = async () => {
        button.disabled = true;
        status.textContent = 'Получаю поток…';
        try {
          if (item.kind === 'link') {
            const next = await window.LUNO.sourceRuntime.navigateItem(item);
            await renderResult(next);
            return;
          }
          const stream = await window.LUNO.sourceRuntime.resolveItem(item);
          if (!stream?.url) throw new Error('Поток не получен');
          const playerItem = makePlayerElement(item, stream);
          overlay.remove();
          window.Lampa.Player.play(playerItem);
          if (window.Lampa.Player.playlist) window.Lampa.Player.playlist([playerItem]);
        } catch (error) {
          status.textContent = error?.message || 'Не удалось получить поток';
          button.disabled = false;
        }
      };
      list.appendChild(button);
    }
  }

  window.LUNO.sourceRuntime.search(movie)
    .then(renderResult)
    .catch(error => { status.textContent = error?.message || 'Ошибка источника'; });
}

function addButton(render, movie) {
  const root = render?.[0];
  if (!root || root.querySelector('[data-luno-source-button]')) return;
  const button = document.createElement('button');
  button.className = BUTTON_CLASS;
  button.dataset.lunoSourceButton = '1';
  button.textContent = 'LUNO';
  button.onclick = () => openOverlay(movie);
  root.appendChild(button);
}

async function install() {
  await waitForLampa();
  installStyle();
  window.Lampa.Listener.follow('full', event => {
    if (event.type !== 'complite' || !event.data?.movie) return;
    try {
      addButton(event.object?.activity?.render?.().find?.('.view--torrent'), event.data.movie);
    } catch (_) {}
  });
  try {
    const active = window.Lampa.Activity.active();
    if (active?.component === 'full' && active?.card) {
      addButton(active.activity.render().find('.view--torrent'), active.card);
    }
  } catch (_) {}
}

install();
