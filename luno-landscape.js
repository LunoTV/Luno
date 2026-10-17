(function () {
    'use strict';

    if (window.luno_landscape_cards_loaded) return;
    window.luno_landscape_cards_loaded = true;
    var started = false;

    function imageUrl(path) {
        if (!path || typeof path !== 'string') return '';
        if (/^https?:\/\//i.test(path)) return path;
        if (path.charAt(0) !== '/') return '';
        return 'https://image.tmdb.org/t/p/w780' + path;
    }

    function enhanceCard(card) {
        if (!card || !card.classList || !card.classList.contains('card')) return;
        if (card.getAttribute('data-luno-landscape-ready') === '1') return;

        var img = card.querySelector('.card__img');
        var data = card.card_data;
        var backdrop = data && imageUrl(data.backdrop_path);

        // Do not force a portrait poster into a landscape frame when no backdrop exists.
        if (!img || !data || !backdrop) return;

        card.setAttribute('data-luno-landscape-ready', '1');
        card.classList.add('luno-landscape-card');

        var title = data.title || data.name || data.original_title || data.original_name || '';
        var view = card.querySelector('.card__view');
        var label = card.querySelector('.luno-card__title');
        if (!label && title && view) {
            label = document.createElement('div');
            label.className = 'luno-card__title';
            label.textContent = title;
            view.appendChild(label);
        }

        // Prefer TMDB's transparent title logo when available; keep the text fallback.
        function setLogo(path) {
            if (!path || !view) return;
            var logo = card.querySelector('.luno-card__logo');
            if (!logo) {
                logo = document.createElement('img');
                logo.className = 'luno-card__logo';
                logo.alt = title;
                logo.loading = 'lazy';
                logo.onerror = function () { logo.remove(); };
                view.appendChild(logo);
            }
            logo.src = 'https://image.tmdb.org/t/p/w500' + path;
            if (label) label.style.display = 'none';
        }

        if (data.logo_path) {
            setLogo(data.logo_path);
        } else {
            var mediaType = data.media_type || (data.name || data.original_name ? 'tv' : 'movie');
            var mediaId = data.id;
            if (mediaId && window.fetch && !card.getAttribute('data-luno-logo-requested')) {
                card.setAttribute('data-luno-logo-requested', '1');
                var apiKey = '4ef0d7355d9ffb5151e987764708ce96';
                var endpoint = 'https://api.themoviedb.org/3/' + mediaType + '/' + encodeURIComponent(mediaId) + '/images?api_key=' + apiKey + '&include_image_language=ru,en,null';
                fetch(endpoint).then(function (response) {
                    if (!response.ok) throw new Error('TMDB logo request failed');
                    return response.json();
                }).then(function (result) {
                    if (!card.isConnected) return;
                    var logos = result && result.logos || [];
                    var preferred = logos.find(function (item) { return item.iso_639_1 === 'ru'; }) ||
                        logos.find(function (item) { return item.iso_639_1 === 'en'; }) ||
                        logos.find(function (item) { return !item.iso_639_1; }) || logos[0];
                    if (preferred && preferred.file_path) setLogo(preferred.file_path);
                }).catch(function () { /* Text title remains as a safe fallback. */ });
            }
        }

        function useBackdrop() {
            var currentBackdrop = imageUrl(data.backdrop_path);
            if (currentBackdrop && img.src !== currentBackdrop) {
                img.src = currentBackdrop;
            }
        }

        // The native "visible" handler may assign the poster after this listener;
        // run after it to restore the matching landscape backdrop.
        card.addEventListener('visible', useBackdrop);
        useBackdrop();
    }

    function scan(node) {
        if (!node || node.nodeType !== 1) return;
        if (node.matches && node.matches('.card')) enhanceCard(node);
        if (node.querySelectorAll) {
            var cards = node.querySelectorAll('.card');
            for (var i = 0; i < cards.length; i++) enhanceCard(cards[i]);
        }
    }

    function start() {
        if (started || !document.body) return;
        started = true;
        scan(document.body);
        if (!window.MutationObserver) return;
        var observer = new MutationObserver(function (changes) {
            changes.forEach(function (change) {
                for (var i = 0; i < change.addedNodes.length; i++) {
                    scan(change.addedNodes[i]);
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (window.appready) start();
    else {
        if (window.Lampa && window.Lampa.Listener && window.Lampa.Listener.follow) {
            window.Lampa.Listener.follow('app', function (event) {
                if (event.type === 'ready') start();
            });
        }

        // Also cover builds where the ready event fired before this file loaded.
        var attempts = 0;
        var wait = function () {
            if (window.appready) start();
            else if (++attempts < 60) window.setTimeout(wait, 500);
        };
        wait();
    }
})();