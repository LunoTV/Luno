import Platform from '../core/platform'
import Template from '../interaction/template'
import Activity from './activity/activity'
import Lang from '../core/lang'
import Storage from '../core/storage/storage'
import Controller from '../core/controller'
import Menu from './menu/menu'

function init(){
    if(!Platform.screen('mobile')) return

    let bar = Template.get('navigation_bar',{})

    function openMenuAction(action){
        Menu.toggle()
        setTimeout(()=>{
            let target = $('.menu__list .selector[data-action="' + action + '"]').first()
            if(target.length) target.trigger('hover:enter')
        }, 80)
    }

    bar.find('.navigation-bar__item').on('click',function(){
        let action = $(this).data('action')

        bar.find('.navigation-bar__item').removeClass('active')
        $(this).addClass('active')

        if(action == 'main'){
            Activity.push({
                url: '',
                title: Lang.translate('title_main') + ' - ' + Storage.field('source').toUpperCase(),
                component: 'main',
                source: Storage.field('source')
            })
        }
        else if(action == 'catalog') openMenuAction('catalog')
        else if(action == 'search') Lampa.Search.open()
        else if(action == 'favorite') openMenuAction('favorite')
        else if(action == 'profile') Controller.toggle('settings')
    })

    $('body').append(bar)
}

export default { init }
