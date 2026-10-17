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
        if (!img || !data || !backdrop) return;

        card.setAttribute('data-luno-landscape-ready', '1');
        card.classList.add('luno-landscape-card');

        var title = data.title || data.name || data.original_title || data.original_name || '';
        var view = card.querySelector('.card__view');
        var label = card.querySelector('.luno-card__title');
        var overview = data.overview || data.description || '';
        var release = data.release_date || data.first_air_date || '';
        var year = release ? String(release).slice(0, 4) : (data.year || '');
        var rating = data.vote_average || data.rating || '';
        var quality = data.release_quality || data.quality || '';

        if (view && overview && !card.querySelector('.luno-card__overview')) {
            var synopsis = document.createElement('div');
            synopsis.className = 'luno-card__overview';
            synopsis.textContent = overview;
            view.appendChild(synopsis);
        }

        if (view && (year || quality || rating) && !card.querySelector('.luno-card__meta')) {
            var meta = document.createElement('div');
            meta.className = 'luno-card__meta';
            if (quality) {
                var q = document.createElement('span');
                q.className = 'luno-card__quality';
                q.textContent = String(quality).toUpperCase();
                meta.appendChild(q);
            }
            if (rating) {
                var r = document.createElement('span');
                r.textContent = '★ ' + Number(rating).toFixed(1);
                meta.appendChild(r);
            }
            if (year) {
                var y = document.createElement('span');
                y.textContent = year;
                meta.appendChild(y);
            }
            // Keep the metadata outside the image, matching the first screen in the recording.
            card.appendChild(meta);
        }

        if (!label && title && view) {
            label = document.createElement('div');
            label.className = 'luno-card__title';
            label.textContent = title;
            view.appendChild(label);
        }

        // Prefer TMDB's actual Russian wide artwork (often with the title/logo already printed on it).
        // Only use a plain Russian text title if TMDB has no suitable localized backdrop.
        var activeBackdrop = backdrop;
        var mediaType = data.media_type || (data.name || data.original_name ? 'tv' : 'movie');
        var mediaId = data.id;
        if (mediaId && window.fetch && !card.getAttribute('data-luno-images-requested')) {
            card.setAttribute('data-luno-images-requested', '1');
            var apiKey = '4ef0d7355d9ffb5151e987764708ce96';
            var endpoint = 'https://api.themoviedb.org/3/' + mediaType + '/' + encodeURIComponent(mediaId) + '/images?api_key=' + apiKey + '&include_image_language=ru,en,null';
            fetch(endpoint).then(function (response) {
                if (!response.ok) throw new Error('TMDB images request failed');
                return response.json();
            }).then(function (result) {
                if (!card.isConnected) return;
                var backdrops = result && result.backdrops || [];
                var russianBackdrop = backdrops.filter(function (item) {
                    return item.iso_639_1 === 'ru' && item.file_path &&
                        item.width >= item.height * 1.6;
                }).sort(function (a, b) {
                    return (b.vote_average || 0) - (a.vote_average || 0);
                })[0];

                if (russianBackdrop) {
                    activeBackdrop = 'https://image.tmdb.org/t/p/w780' + russianBackdrop.file_path;
                    img.src = activeBackdrop;
                    if (label) label.style.display = 'none';
                } else if (label) {
                    label.style.display = '';
                }
            }).catch(function () {
                if (label) label.style.display = '';
            });
        }

        function useBackdrop() {
            if (activeBackdrop && img.src !== activeBackdrop) img.src = activeBackdrop;
        }

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
                for (var i = 0; i < change.addedNodes.length; i++) scan(change.addedNodes[i]);
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
        var attempts = 0;
        var wait = function () {
            if (window.appready) start();
            else if (++attempts < 60) window.setTimeout(wait, 500);
        };
        wait();
    }
})();