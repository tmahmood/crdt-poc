use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use axum::{response::{Html, Response}, routing::get, Router, Error, http, Json};
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
struct AxumRouter {
    routes: Vec<String>
}

fn routes() -> Vec<String> {
    vec![
        "/".to_string(),
        "/earth".to_string(),
        "/mars".to_string(),
    ]
}

#[wasm_bindgen]
pub async fn available_routes() -> *const String {
    routes().as_ptr()
}

#[wasm_bindgen]
pub async fn make_request(uri: String) -> String {
    let mut found = 0;
    let routes = routes();
    for i in 0..routes.len() {
        if uri == routes[i] {
            found = 1;
            break;
        }
    }
    if found == 0 {
        return "".into();
    }
    let mut router: Router = Router::new()
        .route("/earth", get(earth))
        .route("/mars", get(mars));

    let request: Request<Body> = Request::builder()
        .uri(uri)
        .body("".into())
        .unwrap();

    let mut response = router.call(request).await.unwrap();
    let data: Option<Result<Bytes, Error>> = HttpBody::data(response.body_mut()).await;
    let result: Bytes = data.unwrap().unwrap();
    str::from_utf8(&*result).unwrap().to_string().into()
}


async fn earth() -> Html<&'static str> {
    Html(r#"<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href='src/base.css' rel='stylesheet' type='text/css'>
        <title>Todo</title>
    </head>
    <body>
        <h1>Hello World from Axum!!!</h1><br/><a href="/mars">Hello Mars</a>
    </body>
</html>
    "#)
}

async fn mars() -> Html<&'static str> {
    Html(r#"<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href='src/base.css' rel='stylesheet' type='text/css'>
        <title>Todo</title>
    </head>
    <body>
        <h1>Hello World from Axum!!!</h1><br/><a href="/earth">Hello Earth</a>
    </body>
</html>
    "#)
}


// #[wasm_bindgen(start)]
// pub fn run() {
//     spawn_local(async {
//         load_module().await;
//     });
// }
