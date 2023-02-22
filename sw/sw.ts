declare let self: ServiceWorkerGlobalScope;
declare let clients: Clients;
export {}

importScripts("/assets/web_server_wasm.js");

self.addEventListener("install", (event) => {
    console.log("Installed")
});

self.addEventListener("activate", function (event) {
    console.log("Activated")
    event.waitUntil(clients.claim());
});

// @ts-ignore;
const {make_request} = wasm_bindgen;

async function initWasm () {
    // @ts-ignore;
    await wasm_bindgen("/assets/web_server_wasm_bg.wasm");
}

self.addEventListener('fetch', async (event) => {
    const request: Request = event.request;
    let promiseChain = null;
    if (!request.url.startsWith(self.origin)) {
        promiseChain = fetch(request);
    } else {
        let u = request.url.split(self.origin).pop() as string;
        if (request.method === 'GET') {
            try {
                promiseChain = make_request(u).then(async (response: string) => {
                    if (response === '') {
                        return await fetch(request);
                    } else {
                        let headers = {"Content-Type": "text/html"};
                        if (u.endsWith('css')) {
                            headers = {"Content-Type": "text/css"};

                        } else if (u.endsWith('js')) {
                            headers = {"Content-Type": "text/javascript"};
                        }
                        return new Response(response, {headers});
                    }
                });
            } catch (e) {
                promiseChain = fetch(request);
                console.log(e);
            }
        }
    }
    // @ts-ignore
    event.respondWith(promiseChain);
});


initWasm();

