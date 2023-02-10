use wasm_bindgen::prelude::*;
use axum::{response::{Html, Response}, routing::get, Router, Error, http};
use axum::body::{Body, Bytes};
use axum::body::HttpBody;
use http::{Request};
use std::str;
use tower_service::Service;
// use js_sys::{Object, Reflect, WebAssembly};
// use wasm_bindgen_futures::{spawn_local, JsFuture};

// const WA_SQLITE: &[u8] = include_bytes!("../wa-sqlite-async.wasm");
//
//
// pub async fn load_module() -> Object {
//     let a = JsFuture::from(WebAssembly::instantiate_buffer(WA_SQLITE, &Object::new())).await.unwrap();
//     let b: WebAssembly::Instance = Reflect::get(&a, &"instance".into()).unwrap().dyn_into().unwrap();
//     b.exports()
// }


#[wasm_bindgen]
pub async fn make_request(uri: String) -> String {
    let routes = vec![
        "/",
        "/earth",
        "/mars",
    ];
    let mut found = 0;
    for i in 0..routes.len() {
        if uri == routes[i] {
            found = 1;
            break;
        }
    }
    let mut router: Router = Router::new()
        .route("/", get(index))
        .route("/earth", get(earth))
        .route("/mars", get(mars));;
    if found == 0 {
        return "".to_string();
    }

    let request: Request<Body> = Request::builder()
        .uri(uri)
        .body("".into())
        .unwrap();

    let mut response = router.call(request).await.unwrap();
    let data: Option<Result<Bytes, Error>> = HttpBody::data(response.body_mut()).await;
    let result: Bytes = data.unwrap().unwrap();
    str::from_utf8(&*result).unwrap().to_string()

}

async fn index() -> Html<&'static str> {
    Html("<h1>Hello World!!!</h1><br/><a href=\"mars\">Hello Anyplace</a>")
}

async fn earth() -> Html<&'static str> {
    Html("<h1>Hello World from Axum!!!</h1><br/><a href=\"mars\">Hello Mars</a>")
}

async fn mars() -> Html<&'static str> {
    Html("<h1>Hello Mars from Axum!!!</h1></h1><br/><a href=\"/\">Hello Earth</a>")
}


// #[wasm_bindgen(start)]
// pub fn run() {
//     spawn_local(async {
//         load_module().await;
//     });
// }
