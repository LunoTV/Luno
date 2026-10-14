import Api from '../core/api/api'
import Main from '../interaction/items/main'
import Background from '../interaction/background'
import Utils from '../utils/utils'
import Router from '../core/router'

/**
 * LUNO home shell: a cinematic rotating hero followed by the existing live catalogue rows.
 * Catalogue data and playback/navigation remain provided by the existing runtime.
 */
function component(object){
    let comp = Utils.createInstance(Main, object)
    let next = null
    let featured = null
    let heroTimer = null

    function addFeatured(rows, instance){
        if(!Array.isArray(rows) || !rows.length || !instance.html) return

        if(window.matchMedia && window.matchMedia('(max-width: 900px)').matches){
            let header = document.querySelector('.head')
            if(header) header.remove()
        }

        let picks = []
        rows.forEach(row => {
            if(!row || !Array.isArray(row.results)) return
            row.results.forEach(item => {
                if(item && (item.backdrop_path || item.poster_path || item.poster || item.img) && !picks.some(p => String(p.id || p.title || p.name) === String(item.id || item.title || item.name))){
                    picks.push(item)
                }
            })
        })
        picks = picks.slice(0, 9)
        if(!picks.length || instance.html.querySelector('.luno-hero')) return

        featured = document.createElement('section')
        featured.className = 'luno-hero'
        featured.setAttribute('aria-label', 'Премьеры LUNO')

        featured.innerHTML = '<div class="luno-hero__content">' +
            '<div class="luno-hero__eyebrow">ВЫБОР LUNO</div>' +
            '<h1 class="luno-hero__title"></h1>' +
            '<div class="luno-hero__meta"></div>' +
            '<p class="luno-hero__description"></p>' +
            '<div class="luno-hero__actions"><button class="luno-hero__watch" type="button"><span aria-hidden="true">▶</span> Смотреть</button><button class="luno-hero__details" type="button" aria-label="Подробнее">＋</button></div>' +
            '<div class="luno-hero__pagination" aria-label="Слайды"></div>' +
            '</div>'

        let titleNode = featured.querySelector('.luno-hero__title')
        let metaNode = featured.querySelector('.luno-hero__meta')
        let descriptionNode = featured.querySelector('.luno-hero__description')
        let watchButton = featured.querySelector('.luno-hero__watch')
        let detailsButton = featured.querySelector('.luno-hero__details')
        let pagination = featured.querySelector('.luno-hero__pagination')
        let currentIndex = 0

        picks.forEach((item, index)=>{
            let dot = document.createElement('span')
            dot.className = 'luno-hero__indicator'
            dot.setAttribute('aria-hidden', 'true')
            pagination.appendChild(dot)
        })

        function show(index){
            currentIndex = (index + picks.length) % picks.length
            let card = picks[currentIndex]
            let image = card.backdrop_path ? Api.img(card.backdrop_path, 'w1280') : Utils.cardImgBackground(card)
            featured.style.backgroundImage = image
                ? 'linear-gradient(0deg, #0c0c0f 0%, rgba(12,12,15,.38) 58%, rgba(12,12,15,.06) 100%), url("' + image + '")'
                : 'linear-gradient(135deg, #24242b, #0c0c0f)'

            titleNode.textContent = card.title || card.name || card.original_title || card.original_name || 'Премьера'
            let year = (card.release_date || card.first_air_date || '').slice(0,4)
            let rating = card.vote_average ? Number(card.vote_average).toFixed(1) : ''
            metaNode.textContent = [year, rating ? '★ ' + rating : '', card.name || card.original_name ? 'Сериал' : 'Фильм'].filter(Boolean).join('  •  ')
            descriptionNode.textContent = card.overview || ''
            pagination.querySelectorAll('.luno-hero__indicator').forEach((dot, i)=>{
                dot.classList.toggle('active', i === currentIndex)
            })
        }

        function openCurrent(){
            Router.call('full', picks[currentIndex])
        }
        watchButton.addEventListener('click', openCurrent)
        detailsButton.addEventListener('click', openCurrent)
        featured.addEventListener('click', (event)=>{
            if(!event.target.closest('button')) openCurrent()
        })

        // Place the hero inside the actual vertical scroll body, before all catalogue rows.
        let scroll = instance.scroll && instance.scroll.render ? instance.scroll.render(true) : null
        let scrollBody = scroll && scroll.querySelector ? (scroll.querySelector('.scroll__body') || scroll.querySelector('.scroll__content') || scroll) : null
        if(scrollBody) scrollBody.insertBefore(featured, scrollBody.firstChild)
        else instance.html.insertBefore(featured, instance.html.firstChild)

        show(0)
        if(picks.length > 1){
            heroTimer = window.setInterval(()=>show(currentIndex + 1), 8000)
        }
    }

    comp.use({
        onCreate: function(){
            let nextCall = Api.main(object, (data)=>{
                addFeatured(data, this)
                this.build(data)
            }, this.empty.bind(this))

            if(typeof nextCall == 'function') next = nextCall
        },
        onNext: function(resolve, reject){
            if(next) next(resolve.bind(this), reject.bind(this))
            else reject.call(this)
        },
        onInstance: function(item, data){
            item.use({
                onMore: Router.call.bind(Router, 'category_full', data),
                onInstance: function(card, data){
                    card.use({
                        onEnter: Router.call.bind(Router, 'full', data),
                        onFocus: function(){
                            Background.change(Utils.cardImgBackground(data))
                        }
                    })
                }
            })
        },
        onDestroy: function(){
            if(heroTimer){
                window.clearInterval(heroTimer)
                heroTimer = null
            }
            if(featured && featured.parentNode) featured.parentNode.removeChild(featured)
            featured = null
        }
    })

    return comp
}

export default component
