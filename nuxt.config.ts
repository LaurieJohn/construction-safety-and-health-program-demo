// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2026-09-13',

    // The demo carries no server, no database and no API: every page is
    // rendered in the browser from the static data under data/. Rendering
    // client-side keeps `nuxt generate` a plain static bundle that Vercel can
    // serve without a Node function.
    ssr: false,

    devtools: { enabled: false },

    // Nuxt otherwise binds 'localhost', which on Windows resolves to the IPv6
    // loopback alone. A browser that reaches for 127.0.0.1 first then finds
    // nothing listening and hangs, so the dev server binds every IPv4 address.
    //
    // 3002 rather than Nuxt's 3000: the other demos on this machine hold 3000
    // and 3001, and a dev server that shifts to whatever is free leaves you
    // guessing which port it landed on.
    devServer: { host: '0.0.0.0', port: 3002 },

    modules: ['@pinia/nuxt'],

    css: ['~/assets/css/app.css'],

    app: {
        // A short cross-fade between pages, so a navigation reads as a change of
        // screen rather than a redraw.
        pageTransition: { name: 'page', mode: 'out-in' },

        head: {
            title: 'CSHP — Demo by LaurieJohn',
            // Every tab carries the name of the piece rather than the screen
            // you happen to be on. The pages still set their own titles; this
            // template overrides them, so removing this line hands them back.
            titleTemplate: 'CSHP — Demo by LaurieJohn',
            htmlAttrs: { lang: 'en' },
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1, shrink-to-fit=no' },
                {
                    name: 'description',
                    content:
                        'CSHP — a front-end demo of a Construction Safety and Health Program registration and approval system, built with Nuxt and Vue by LaurieJohn.',
                },
                { name: 'author', content: 'LaurieJohn' },
            ],
            link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
        },
    },
})
