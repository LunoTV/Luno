(function () {
    'use strict';
    if (window.luno_wide_cards_loaded) return;
    window.luno_wide_cards_loaded = true;

    function imageUrl(path) {
        if (!path || typeof path !== 'string') return '';
        return /^https?:\/\//i.test(path) ? path : 'https://image.tmdb.org/t/p/w500' + (path.charAt(0) === '/' ? path : '/' + path);
    }

    function findLogo(data) {
        if (!data) return '';
        if (data.logo_path) return imageUrl(data.logo_path);
        if (data.images && data.images.logos && data.images.logos.length) {
            var logo = data.images.logos[0];
            if (logo && logo.file_path) return imageUrl(logo.file_path);
        }
        if (data.logo && typeof data.logo === 'string') return imageUrl(data.logo);
        return '';
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

        var logoUrl = findLogo(data);
        if (!logoUrl) return;

        var logo = document.createElement('img');
        logo.className = 'luno-wide-logo__image';
        logo.alt = '';
        logo.src = logoUrl;
        logo.onerror = function () {
            overlay.remove();
        };
        overlay.appendChild(logo);
        view.appendChild(overlay);
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