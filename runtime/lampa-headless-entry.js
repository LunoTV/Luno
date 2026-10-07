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
import Reguest from './src/utils/reguest'

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
// Expose the real Lampa modules used by the headless runtime.
// TMDB proxy plugins are intentionally not loaded: API and images stay direct.
Object.assign(window.Lampa, {
    TMDB,
    Storage,
    Utils,
    Arrays,
    Manifest,
    Account,
    Settings
})

// Initialize Lampa's parameter registry so official plugins see their real defaults.
Params.init()
// The CUB TMDB plugin is loaded immediately after this runtime and configures Lampa's official TMDB API/image endpoints.
/* Compatibility boundary for Lampa's Request abstraction: use the browser transport required by Lampa's Request layer. */
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

// Lampa keeps HTTP helpers (api/image/key) in core/tmdb/tmdb,
// but catalog requests (get/search/main/category) live in core/api/sources/tmdb.
// Use the real Lampa TMDB source here; calling TMDB.get would be undefined.
const LampaTMDBSource = Api.sources.tmdb
TMDB.request = function(method, params={}) {
    return callbackPromise((ok, fail)=>{
        let settled = false
        const done = data => {
            if (settled) return
            settled = true
            ok(data)
        }
        const failed = error => {
            if (settled) return
            const query = new URLSearchParams()
            query.set('api_key', TMDB.key())
            query.set('language', Storage.field('tmdb_lang') || 'ru')
            Object.keys(params || {}).forEach(key => {
                if (params[key] !== undefined && params[key] !== null && params[key] !== '') query.set(key, params[key])
            })

            // First use Lampa's real source. If its Request/jQuery boundary fails,
            // retry the exact same Lampa TMDB endpoint with browser fetch. This
            // keeps the API/image routing owned by Lampa (including CUB proxy).
            const url = TMDB.api(method + '?' + query.toString())
            fetch(url, {credentials:'omit'})
                .then(async response => {
                    const text = await response.text()
                    if (!response.ok) throw new Error('TMDB HTTP '+response.status)
                    const data = text ? JSON.parse(text) : null
                    if (!data) throw new Error('TMDB empty response')
                    done(data)
                })
                .catch(fetchError => fail(fetchError || error || new Error('Lampa TMDB request failed')))
        }

        try {
            LampaTMDBSource.get(method, params, done, failed, {life:0})
        } catch (error) {
            failed(error)
        }
    })
}

const runtime = {
    version: 'lampa-headless-b4a13b6af7fe2f3bbbcb91f4eb434ab3378f8d5d',
    storage: Storage,
    params: Params,
    tmdb: TMDB,
    tmdbSource: LampaTMDBSource,
    api: Api,
    main(params={}) { return callbackPromise((ok,fail)=>Api.main(params,ok,fail)) },
    category(params={}) { return callbackPromise((ok,fail)=>Api.category(params,ok,fail)) },
    search(query,params={}) { return callbackPromise(ok=>Api.search(Object.assign({},params,{query}),ok)) },
    full(params={}) { return callbackPromise((ok,fail)=>Api.full(params,ok,fail)) },
    genres(params={}) { return callbackPromise((ok,fail)=>Api.genres(params,ok,fail)) },
    person(params={}) { return callbackPromise((ok,fail)=>Api.person(params,ok,fail)) },
    seasons(tv,from) { return callbackPromise(ok=>Api.seasons(tv,from,ok)) },
    collections(params={}) { return callbackPromise((ok,fail)=>Api.collections(params,ok,fail)) },
    // Image formatting belongs to Lampa's TMDB source (the core TMDB module has no img() method).
    image(path,size='w500') { return LampaTMDBSource.img(path,size) },
    get(method,params={}) { return TMDB.request(method,params) },
    clear() { return Api.clear() }
}

window.LunoLampaRuntime = runtime
window.LunoRuntime = runtime
window.LunoRuntimeReady = true
