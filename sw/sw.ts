declare let self: ServiceWorkerGlobalScope;
export {}

importScripts("/assets/web_server_wasm.js");

self.addEventListener("install", (event) => {
    console.log("Installed")
});

self.addEventListener("activate", function (event) {
    console.log("Activated")
});

// @ts-ignore;
const {make_request, available_routes} = wasm_bindgen;

const initWasm = async () => {
    // @ts-ignore
    await wasm_bindgen("/assets/web_server_wasm_bg.wasm");
    self.addEventListener('fetch', async (event) => {
        console.log("Should work ...")
        const request: Request = event.request;
        let promiseChain = fetch(request);
        if (!request.url.startsWith(self.origin)) {
            promiseChain = fetch(request).then((response) => response);
        } else {
            let u = request.url.split(self.origin).pop() as string;
            if (u.startsWith('/assets')) {
                promiseChain = fetch(request);
            } else {
                if (request.method === 'GET') {
                    try {
                        promiseChain = make_request(u).then((response: string) => {
                            if (response === '') {
                                return fetch(request);
                            } else {
                                return new Response(response, {
                                    headers: {
                                        "Content-Type": "text/html"
                                    }
                                });
                            }
                        })
                    } catch (e) {
                    }
                }
            }
        }
        // @ts-ignore
        event.respondWith(promiseChain);
    });
}

initWasm();
