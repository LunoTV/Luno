(function () {
    'use strict';
    if (window.luno_wide_cards_loaded) return;
    window.luno_wide_cards_loaded = true;

    function enhance(card) {
        if (!card || !card.classList || !card.classList.contains('card')) return;
        if (card.getAttribute('data-luno-wide-ready') === '1') return;
        var data = card.card_data;
        var img = card.querySelector('.card__img');
        if (!data || !img || !data.backdrop_path) return;

        card.setAttribute('data-luno-wide-ready', '1');
        card.classList.add('luno-wide-card');
        var path = data.backdrop_path;
        var url = /^https?:\/\//i.test(path) ? path : 'https://image.tmdb.org/t/p/w780' + (path.charAt(0) === '/' ? path : '/' + path);
        img.src = url;
        card.addEventListener('visible', function () {
            if (img.src !== url) img.src = url;
        });
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