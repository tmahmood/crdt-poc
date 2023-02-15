declare const self: ServiceWorkerGlobalScope;
export type {};

self.addEventListener("install", function (event) {
    console.log("Installed")
});

self.addEventListener("activate", function (event) {
    console.log("Activated")
});


if ('function' === typeof importScripts) {
    importScripts(
        "web_server_wasm.js",
    );
    // @ts-ignore;
    const {make_request, available_routes} = wasm_bindgen;
    // const onconnect = (event: MessageEvent) => {
    //     const port = event.ports[0];
    //     port.onmessage = (e) => {
    //         make_request(e.data[0].then((r: string)=> {
    //             port.postMessage(r)
    //         }));
    //     }
    //     port.start();
    // }

    self.addEventListener('fetch', (event) => {
        // @ts-ignore
        let promiseChain = wasm_bindgen("/web_server_wasm_bg.wasm").then(() => {
            const request: Request = event.request;
            if (!request.url.startsWith(self.origin)) {
                return fetch(request).then((response) => response);
            } else {
                let u = request.url.split(self.origin).pop() as string;
                if (request.method === 'GET') {
                    try {
                        return make_request(u).then((response: string) => {
                            if (response === '') {
                                if (u === '/' || u === '') {
                                    return new Response("index.html");
                                } else {
                                    return fetch(request);
                                }
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
}
