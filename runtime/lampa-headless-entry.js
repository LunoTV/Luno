import Api from './src/core/api/api'
import TMDB from './src/core/tmdb/tmdb'
import Storage from './src/core/storage/storage'
import Params from './src/interaction/settings/params'
import Subscribe from './src/utils/subscribe'
import Utils from './src/utils/utils'
import Arrays from './src/utils/arrays'
import Manifest from './src/core/manifest'
import Account from './src/core/account/account'
import Settings from './src/interaction/settings/settings'

/* LUNO uses Lampa only as a headless runtime. No Lampa UI, renderer or player is mounted. */
if (typeof window.lampa_settings === 'undefined') window.lampa_settings = {}
Object.assign(window.lampa_settings, {
    account_use:false, account_sync:false, plugins_use:false, plugins_store:false,
    torrents_use:false, socket_use:false, services:false, mirrors:false, geo:false,
    push_state:false,
    disable_features:{ai:true,ads:true,trailers:true,install_proxy:true,remote_configuration:true}
})
if (!window.Lampa) window.Lampa = {}
if (!window.Lampa.Listener) window.Lampa.Listener = Subscribe()
// Expose the real Lampa modules required by official plugins.
// No TMDB URL rewriting is implemented here: the CUB TMDB Proxy plugin
// patches the real Lampa.TMDB object itself.
Object.assign(window.Lampa, {
    TMDB,
    Storage,
    Utils,
    Arrays,
    Manifest,
    Account,
    Settings
})

window.vpn_region = window.vpn_region || 'ru'

/* Compatibility boundary for Lampa's Request abstraction: direct browser fetch, never a proxy. */
if (!window.$ || typeof window.$.ajax !== 'function') {
    const ajax = (options = {}) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), Number(options.timeout || 30000))
        const headers = new Headers(options.headers || {})
        const xhr = { setRequestHeader(name, value){ headers.set(name, value) } }

        try {
            if (typeof options.beforeSend === 'function') options.beforeSend(xhr)
        } catch (error) {
            clearTimeout(timer)
            if (options.error) options.error({status:0,message:error.message},'custom')
            return
        }

        fetch(options.url, {
            method:options.type || 'GET',
            headers,
            body:options.data && typeof options.data === 'object' ? new URLSearchParams(options.data) : options.data,
            credentials:options.xhrFields && options.xhrFields.withCredentials ? 'include' : 'same-origin',
            signal:controller.signal
        }).then(async response => {
            const text = await response.text()
            let data = text

            if ((options.dataType || 'json') === 'json') {
                try { data = text ? JSON.parse(text) : null }
                catch (error) {
                    if (options.error) options.error({status:response.status,responseText:text,responseJSON:null},'parsererror')
                    return
                }
            }

            if (!response.ok) {
                if (options.error) options.error({status:response.status,responseText:text,responseJSON:data},response.status === 408 ? 'timeout' : 'error')
                return
            }

            if (options.success) options.success(data)
        }).catch(error => {
            if (options.error) options.error({status:0,message:error && error.message ? error.message : String(error)},error && error.name === 'AbortError' ? 'timeout' : 'error')
        }).finally(() => clearTimeout(timer))
    }

    window.$ = window.$ || {}
    window.$.ajax = ajax
}

try {
    if (!window.localStorage.getItem('tmdb_lang')) window.localStorage.setItem('tmdb_lang','ru')
    if (!window.localStorage.getItem('poster_size')) window.localStorage.setItem('poster_size','w500')
} catch (error) {}

const callbackPromise = (invoke) => new Promise((resolve,reject) => {
    let settled = false
    const ok = data => { if(settled)return; settled=true; resolve(data) }
    const fail = error => { if(settled)return; settled=true; reject(error||new Error('Lampa runtime request failed')) }
    try { invoke(ok,fail) } catch(error) { fail(error) }
})

const runtime = {
    version: 'lampa-headless-b4a13b6af7fe2f3bbbcb91f4eb434ab3378f8d5d',
    storage: Storage,
    params: Params,
    tmdb: TMDB,
    api: Api,
    main(params={}) { return callbackPromise((ok,fail)=>Api.main(params,ok,fail)) },
    category(params={}) { return callbackPromise((ok,fail)=>Api.category(params,ok,fail)) },
    search(query,params={}) { return callbackPromise(ok=>Api.search(Object.assign({},params,{query}),ok)) },
    full(params={}) { return callbackPromise((ok,fail)=>Api.full(params,ok,fail)) },
    genres(params={}) { return callbackPromise((ok,fail)=>Api.genres(params,ok,fail)) },
    person(params={}) { return callbackPromise((ok,fail)=>Api.person(params,ok,fail)) },
    seasons(tv,from) { return callbackPromise(ok=>Api.seasons(tv,from,ok)) },
    collections(params={}) { return callbackPromise((ok,fail)=>Api.collections(params,ok,fail)) },
    image(path,size='w500') { return TMDB.img(path,size) },
    clear() { return Api.clear() }
}

window.LunoLampaRuntime = runtime
window.LunoRuntime = runtime
window.LunoRuntimeReady = true
