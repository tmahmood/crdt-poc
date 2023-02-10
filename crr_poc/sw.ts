declare const self: ServiceWorkerGlobalScope;
export type {};

self.addEventListener("install", function (event) {
    console.log("Installed")
});

self.addEventListener("activate", function (event) {
    console.log("Activated")
});

import {make_request} from 'web-server-wasm';

self.addEventListener('fetch', async (event) => {
    const request: Request = event.request;
    if (!request.url.startsWith(self.origin)) {
        let r = await fetch(request);
        await event.respondWith(r);
    } else {
        let u = request.url.split(self.origin).pop() as string;
        if (request.method === 'GET') {
            let response = "It might work";
            try {
                let r = await make_request(u);
                response = "It did work!" + r;
            } catch (e) {
                response = "Error occurred";
            }
            event.respondWith(new Response(response));
        }
    }
});

// registering service worker
const registerServiceWorker = () => {
    if (navigator.serviceWorker?.controller) {
        // A ServiceWorker controls the site on load and therefor can handle offline
        // fallbacks.
        debug(navigator.serviceWorker.controller.scriptURL + ' (onload)', 'controller');
        debug('An active service worker controller was found, ' + 'no need to register');
    } else {
        console.log("Registering service worker")
        // Register the ServiceWorker
        navigator.serviceWorker.register('sw.ts')
            .then((reg) => {
                debug(reg.scope, 'register');
                debug('Service worker change, registered the service worker');
                console.log("Registered new service worker")
            }).catch((e) => {
            console.log(e);
        });
    }

    const b: HTMLLinkElement | null = document.querySelector('#refresh');
    if (b) {
        b.setAttribute("search", String(Date.now()));
    }
    function debug(message: string, element?: string, append?: string) {
        const target = document.querySelector('#' + (element || 'log'));
        if (target) {
            target.textContent = message + ((append) ? ('/n' + target.textContent) : '');
        }
    }

    let e = document.getElementById('clearAndReRegister');
    if (e) {
        // Allow for "replaying" this example
        e.addEventListener('click',
            function () {
                navigator.serviceWorker.getRegistration().then(function (registration) {
                    if (registration) {
                        registration.unregister().then(() => {});
                        window.location.reload();
                    }
                });
            }
        );
    }
}

registerServiceWorker();
