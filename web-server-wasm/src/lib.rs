mod utils;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn to_sql(js_value: JsValue) -> Result<JsValue, JsValue> {
    let db: JsonToSql = serde_wasm_bindgen::from_value(js_value)?;
    let mut v = vec![];
    for table in db.tables {
        v.push(table.to_sql());
    }
    Ok(serde_wasm_bindgen::to_value(&v)?)
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct JsonToSql {
    db: String,
    tables: Vec<TableDsl>
}

#[wasm_bindgen]
impl JsonToSql {
    pub fn db(&self) -> String {
        self.db.clone()
    }

    pub fn tables(&self) -> *const TableDsl {
        self.tables.as_ptr()
    }
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct TableDsl {
    name: String,
    columns: Vec<ColumnDef>,
}

#[wasm_bindgen]
impl TableDsl {
    pub fn name(&self) -> String {
        self.name.clone()
    }
    pub fn columns(&self) -> *const ColumnDef {
        self.columns.as_ptr()
    }
}

impl TableDsl {
    pub fn to_sql(&self) -> (String, String) {
        let mut q = vec![];
        for column in self.columns.iter() {
            let sql = column.to_sql();
            q.push(sql);
        }
        (self.name.clone(), format!("CREATE TABLE IF NOT EXISTS {} (id primary key, {})", self.name, q.join(", ")))
    }
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnDef {
    name: String,
    column_type: String,
    defs: Option<String>,
}

#[wasm_bindgen]
impl ColumnDef {
    pub fn name(&self) -> String {
        self.name.clone()
    }
    pub fn column_type(&self) -> String {
        self.column_type.clone()
    }
    pub fn defs(&self) -> Option<String> {
        self.defs.clone()
    }
}

impl ColumnDef {
    pub fn to_sql(&self) -> String {
        format!("{} {} {}", self.name, self.column_type, self.defs.clone().unwrap_or("".to_string()))
    }
}

