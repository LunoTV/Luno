import Api from '../core/api/api'
import Main from '../interaction/items/main'
import Background from '../interaction/background'
import Utils from '../utils/utils'
import Router from '../core/router'

/**
 * LUNO home shell: a custom featured title above the existing live catalogue rows.
 * The rows and playback routes remain provided by the existing runtime.
 */
function component(object){
    let comp = Utils.createInstance(Main, object)
    let next = null
    let featured = null

    function addFeatured(rows, instance){
        if(!Array.isArray(rows) || !rows.length || !instance.html) return

        // Remove the Lampa header node in the LUNO home view; CSS alone was not enough on iOS.
        if(window.matchMedia && window.matchMedia('(max-width: 900px)').matches){
            let header = document.querySelector('.head')
            if(header) header.remove()
        }

        let firstRow = rows.find(row => row && Array.isArray(row.results) && row.results.length)
        let card = firstRow && firstRow.results.find(item => item && (item.backdrop_path || item.poster_path || item.poster || item.img))
        if(!card || instance.html.querySelector('.luno-hero')) return

        if(featured && featured.parentNode) featured.parentNode.removeChild(featured)

        featured = document.createElement('section')
        featured.className = 'luno-hero'
        let image = card.backdrop_path ? Api.img(card.backdrop_path, 'w1280') : Utils.cardImgBackground(card)
        featured.style.backgroundImage = image ? 'linear-gradient(0deg, #0c0c0f 0%, rgba(12,12,15,.35) 65%, rgba(12,12,15,.05) 100%), url("' + image + '")' : 'linear-gradient(135deg, #24242b, #0c0c0f)'

        let title = card.title || card.name || card.original_title || card.original_name || 'Премьера'
        let description = card.overview || ''
        let year = (card.release_date || card.first_air_date || '').slice(0,4)
        let rating = card.vote_average ? Number(card.vote_average).toFixed(1) : ''

        featured.innerHTML = '<div class="luno-hero__content">' +
            '<div class="luno-hero__eyebrow">ВЫБОР LUNO</div>' +
            '<h1 class="luno-hero__title"></h1>' +
            '<div class="luno-hero__meta"></div>' +
            '<p class="luno-hero__description"></p>' +
            '<div class="luno-hero__actions"><button class="luno-hero__watch" type="button"><span aria-hidden="true">▶</span> Смотреть</button><button class="luno-hero__details" type="button" aria-label="Подробнее">＋</button></div>' +
            '</div>'

        featured.querySelector('.luno-hero__title').textContent = title
        featured.querySelector('.luno-hero__meta').textContent = [year, rating ? '★ ' + rating : '', card.name || card.original_name ? 'Сериал' : 'Фильм'].filter(Boolean).join('  •  ')
        featured.querySelector('.luno-hero__description').textContent = description
        let open = ()=>Router.call('full', card)
        featured.querySelector('.luno-hero__watch').addEventListener('click', open)
        featured.querySelector('.luno-hero__details').addEventListener('click', open)
        featured.addEventListener('click', (event)=>{
            if(!event.target.closest('button')) open()
        })

        let scroll = instance.scroll && instance.scroll.render ? instance.scroll.render(true) : null
        if(scroll && scroll.parentNode === instance.html) instance.html.insertBefore(featured, scroll)
        else instance.html.insertBefore(featured, instance.html.firstChild)
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
            if(featured && featured.parentNode) featured.parentNode.removeChild(featured)
            featured = null
        }
    })

    return comp
}

export default component
