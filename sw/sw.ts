declare let self: ServiceWorkerGlobalScope;
export {}

self.addEventListener("install", function (event) {
    console.log("Installed")
});

self.addEventListener("activate", function (event) {
    console.log("Activated")
});

//___WASM_REPLACEMENT___

// @ts-ignore;
const {make_request, available_routes} = wasm_bindgen;

self.addEventListener('fetch', (event) => {
    // @ts-ignore
    let promiseChain = wasm_bindgen("/assets/web_server_wasm_bg.wasm").then(() => {
        const request: Request = event.request;
        if (!request.url.startsWith(self.origin)) {
            return fetch(request).then((response) => response);
        } else {
            let u = request.url.split(self.origin).pop() as string;
            if (u.startsWith('/assets')) {
                return fetch(request);
            }
            if (request.method === 'GET') {
                try {
                    return make_request(u).then((response: string) => {
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
                    return new Response("error occurred");
                }
            }
        }
    })
    event.respondWith(promiseChain);
});
