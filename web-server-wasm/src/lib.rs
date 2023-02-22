use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use axum::{response::{Html}, routing::get, Router, Error, http};
use axum::body::{Body, Bytes};
use axum::body::HttpBody;
use http::{Request};
use std::str;
use text_placeholder::Template;
use tower_service::Service;


#[wasm_bindgen]
pub async fn make_request(uri: String) -> String {

    let mut found = 0;
    let routes = vec![
            "/".to_string(),
            "/earth".to_string(),
            "/mars".to_string(),
            "/assets/index.js".to_string(),
            "/assets/index.css".to_string()
        ];
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
        .route("/", get(index))
        .route("/earth", get(earth))
        .route("/assets/index.js", get(app_js))
        .route("/assets/index.css", get(app_css))
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


fn build_html(map: HashMap<&str, &str>) -> Html<String> {
    let files:Vec<&str> = include_str!("../files.txt").lines().collect();
    let mut h = HashMap::new();
    for i in 0..files.len() {
        let file:&str = files[i];
        if file.ends_with("css") {
            h.insert("CSS_FILE", file);
        } else if file.ends_with("ico") {
            h.insert("ICON_FILE", file);
        }
    }
    let template = Template::new_with_placeholder(include_str!("../templates/base.html"), "[[", "]]");
    let base_tpl = template.fill_with_hashmap(&h);
    let template = Template::new(&base_tpl);
    Html(template.fill_with_hashmap(&map))
}

async fn earth() -> Html<String> {
    let mut h = HashMap::new();
    let body = include_str!("../templates/earth.html");
    h.insert("body", body);
    build_html(h)
}

async fn mars() -> Html<String> {
    let mut h = HashMap::new();
    let body = include_str!("../templates/mars.html");
    h.insert("body", body);
    build_html(h)
}

async fn index() -> Html<String> {
    let mut h = HashMap::new();
    let body = include_str!("../templates/index.html");
    h.insert("body", body);
    build_html(h)
}

async fn app_js() -> String {
    let body = include_str!("../index.js");
    body.to_string()
}

async fn app_css() -> String {
    let body = include_str!("../index.css");
    body.to_string()
}
