(function () {
    'use strict';
    if (window.luno_wide_cards_loaded) return;
    window.luno_wide_cards_loaded = true;

    function imageUrl(path) {
        if (!path || typeof path !== 'string') return '';
        return /^https?:\/\//i.test(path) ? path : 'https://image.tmdb.org/t/p/w500' + (path.charAt(0) === '/' ? path : '/' + path);
    }

    function requestLogo(data, callback) {
        if (!data || !data.id || !window.Lampa || !window.Lampa.Api || !window.Lampa.Api.sources || !window.Lampa.Api.sources.tmdb) {
            callback('');
            return;
        }

        var kind = data.media_type || data.type || (data.name && !data.title ? 'tv' : 'movie');
        if (kind !== 'movie' && kind !== 'tv') kind = 'movie';

        window.Lampa.Api.sources.tmdb.get(kind + '/' + data.id + '/images', {
            include_image_language: 'ru'
        }, function (result) {
            var logos = result && result.logos ? result.logos : [];
            var russianLogo = logos.filter(function (item) {
                return item && item.iso_639_1 === 'ru' && item.file_path;
            })[0];

            callback(russianLogo ? 'https://image.tmdb.org/t/p/original' + russianLogo.file_path : '');
        }, function () {
            callback('');
        }, { life: 60 * 24 * 7 });
    }

    function addMeta(container, value) {
        var item = document.createElement('span');
        item.className = 'luno-wide-meta__item';
        item.textContent = value;
        container.appendChild(item);
    }

    function mediaKindLabel(data) {
        var type = String(data.media_type || data.type || '').toLowerCase();
        var genres = Array.isArray(data.genres) ? data.genres : [];
        var labels = genres.map(function (genre) {
            return String(typeof genre === 'string' ? genre : (genre && genre.name) || '').toLowerCase();
        }).join(' ');
        var title = String(data.title || data.name || '').toLowerCase();

        if (/anime/.test(type) || /anime/.test(labels)) return 'АНИМЕ';
        if (/animation|мульт|cartoon/.test(labels) || data.animation === true) return 'МУЛЬТФИЛЬМ';
        if (/show|reality|talk|variety|tv_show/.test(type)) return 'ШОУ';
        if (type === 'tv' || type === 'series' || type === 'tv_series') return 'СЕРИАЛ';
        if (type === 'movie' || type === 'film') return 'ФИЛЬМ';
        if (/anime/.test(title)) return 'АНИМЕ';
        return '';
    }

    var activeActivity = '';

    function activityName(event) {
        var object = event && event.object;
        return String((object && (object.activity || object.name || object.component)) || (event && (event.activity || event.name)) || '').toLowerCase();
    }

    function isCatalogActivity() {
        var name = activeActivity || '';
        if (/^(main|home|start)$/.test(name)) return false;
        return /categor|catalog|movie|film|serial|series|tv|anime|cartoon|search|person|collection|favorite|bookmarks/.test(name);
    }

    function makePortrait(card, data, img, view) {
        card.classList.remove('luno-wide-card');
        card.classList.add('luno-portrait-card');
        if (data.poster_path) img.src = imageUrl(data.poster_path);
        var logo = view.querySelector('.luno-wide-logo');
        if (logo) logo.remove();
        var description = view.querySelector('.luno-wide-description');
        if (description) description.remove();
        var meta = view.querySelector('.luno-wide-meta');
        if (meta) meta.remove();
        var fallback = view.querySelector('.luno-wide-title-fallback');
        if (fallback) fallback.remove();
    }

    function enhance(card) {
        if (!card || !card.classList || !card.classList.contains('card')) return;
        var data = card.card_data;
        var img = card.querySelector('.card__img');
        if (!data || !img) return;
        if (card.getAttribute('data-luno-wide-ready') === '1') return;
        card.setAttribute('data-luno-wide-ready', '1');

        var view = card.querySelector('.card__view') || card;
        if (isCatalogActivity()) {
            makePortrait(card, data, img, view);
            return;
        }
        var overlay = document.createElement('div');
        overlay.className = 'luno-wide-logo';
        overlay.setAttribute('aria-hidden', 'true');

        requestLogo(data, function (logoUrl) {
            if (!card.isConnected) return;

            if (isCatalogActivity()) {
                makePortrait(card, data, img, view);
                return;
            }

            if (!logoUrl) {
                makePortrait(card, data, img, view);
                return;
            }

            card.classList.add('luno-wide-card');
            card.classList.remove('luno-portrait-card');
            if (data.backdrop_path) {
                var backdropUrl = imageUrl(data.backdrop_path);
                img.src = backdropUrl;
                card.addEventListener('visible', function () {
                    if (img.src !== backdropUrl) img.src = backdropUrl;
                });
            }

            if (logoUrl) {
                var logo = document.createElement('img');
                logo.className = 'luno-wide-logo__image';
                logo.alt = '';
                logo.src = logoUrl;
                logo.onerror = function () { logo.remove(); };
                overlay.appendChild(logo);
                view.appendChild(overlay);
            } else {
                var titleText = data.title || data.name || '';
                if (titleText) {
                    var title = document.createElement('div');
                    title.className = 'luno-wide-title-fallback';
                    title.textContent = titleText;
                    title.setAttribute('aria-hidden', 'true');
                    view.appendChild(title);
                }
            }
        });

        var descriptionText = data.overview || data.description || data.plot || '';
        if (descriptionText && typeof descriptionText === 'string') {
            var description = document.createElement('div');
            description.className = 'luno-wide-description';
            description.textContent = descriptionText;
            description.setAttribute('aria-hidden', 'true');
            view.appendChild(description);
        }

        var meta = document.createElement('div');
        meta.className = 'luno-wide-meta';
        meta.setAttribute('aria-hidden', 'true');

        var quality = data.quality || data.video_quality || data.resolution || '';
        if (quality) addMeta(meta, String(quality).toUpperCase());

        var rating = Number(data.vote_average || data.rating || 0);
        if (rating > 0) addMeta(meta, '★ ' + rating.toFixed(1));

        var date = data.release_date || data.first_air_date || data.last_air_date || '';
        var year = date ? String(date).slice(0, 4) : (data.year ? String(data.year) : '');
        if (year) addMeta(meta, year);

        var kindLabel = mediaKindLabel(data);
        if (kindLabel) addMeta(meta, kindLabel);

        if (meta.children.length) view.appendChild(meta);
    }

    function scan(node) {
        if (!node || node.nodeType !== 1) return;
        if (node.matches && node.matches('.card')) enhance(node);
        if (node.querySelectorAll) {
            var cards = node.querySelectorAll('.card');
            for (var i = 0; i < cards.length; i++) enhance(cards[i]);
        }
    }

    function start() {
        if (!document.body) return;
        if (window.Lampa && window.Lampa.Listener && window.Lampa.Listener.follow) {
            window.Lampa.Listener.follow('activity', function (event) {
                if (event && event.type === 'start') {
                    activeActivity = activityName(event);
                    scan(document.body);
                }
            });
        }
        scan(document.body);
        if (!window.MutationObserver) return;
        var observer = new MutationObserver(function (changes) {
            changes.forEach(function (change) {
                for (var i = 0; i < change.addedNodes.length; i++) scan(change.addedNodes[i]);
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (window.appready) start();
    else if (window.Lampa && window.Lampa.Listener && window.Lampa.Listener.follow) {
        window.Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') start();
        });
        var attempts = 0;
        (function wait() {
            if (window.appready) start();
            else if (++attempts < 60) window.setTimeout(wait, 500);
        })();
    } else {
        var attempts = 0;
        (function wait() {
            if (window.appready) start();
            else if (++attempts < 60) window.setTimeout(wait, 500);
        })();
    }
})();