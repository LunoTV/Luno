(function () {
    'use strict';

    if (window.luno_landscape_cards_loaded) return;
    window.luno_landscape_cards_loaded = true;

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
        if (!img || !data) return;

        card.setAttribute('data-luno-landscape-ready', '1');
        card.classList.add('luno-landscape-card');

        var title = data.title || data.name || data.original_title || data.original_name || '';
        if (title && !card.querySelector('.luno-card__title')) {
            var label = document.createElement('div');
            label.className = 'luno-card__title';
            label.textContent = title;
            var view = card.querySelector('.card__view');
            if (view) view.appendChild(label);
        }

        function useBackdrop() {
            var backdrop = imageUrl(data.backdrop_path);
            if (backdrop && img.src !== backdrop) {
                img.src = backdrop;
            }
        }

        // The native card's "visible" handler may assign the poster after this
        // listener is registered; run after it to restore the landscape backdrop.
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
        scan(document.body);
        if (!window.MutationObserver || !document.body) return;
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
    else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') start();
        });
    } else {
        var attempts = 0;
        var wait = function () {
            if (window.appready || (window.Lampa && Lampa.Listener)) start();
            else if (++attempts < 30) window.setTimeout(wait, 500);
        };
        wait();
    }
})();