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
            include_image_language: 'ru,en,null'
        }, function (result) {
            var logos = result && result.logos ? result.logos : [];
            if (!logos.length) {
                callback('');
                return;
            }

            logos.sort(function (a, b) {
                function rank(item) {
                    if (item.iso_639_1 === 'ru') return 0;
                    if (item.iso_639_1 === 'en') return 1;
                    if (item.iso_639_1 === null) return 2;
                    return 3;
                }
                return rank(a) - rank(b);
            });

            callback(logos[0] && logos[0].file_path ? 'https://image.tmdb.org/t/p/original' + logos[0].file_path : '');
        }, function () {
            callback('');
        }, { life: 60 * 24 * 7 });
    }

    function enhance(card) {
        if (!card || !card.classList || !card.classList.contains('card')) return;
        var data = card.card_data;
        var img = card.querySelector('.card__img');
        if (!data || !img || !data.backdrop_path) return;

        card.classList.add('luno-wide-card');
        if (card.getAttribute('data-luno-wide-ready') === '1') return;
        card.setAttribute('data-luno-wide-ready', '1');

        var url = imageUrl(data.backdrop_path);
        img.src = url;
        card.addEventListener('visible', function () {
            if (img.src !== url) img.src = url;
        });

        var view = card.querySelector('.card__view') || card;
        var overlay = document.createElement('div');
        overlay.className = 'luno-wide-logo';
        overlay.setAttribute('aria-hidden', 'true');

        requestLogo(data, function (logoUrl) {
            if (!card.isConnected) return;
            if (logoUrl) {
                var logo = document.createElement('img');
                logo.className = 'luno-wide-logo__image';
                logo.alt = '';
                logo.src = logoUrl;
                logo.onerror = function () { logo.remove(); };
                overlay.appendChild(logo);
                view.appendChild(overlay);
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