
import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import {stringify as uuidStringify} from "uuid";

import sqliteWasm from "@vlcn.io/wa-crsqlite";
import tblrx from "@vlcn.io/rx-tbl";
import {wdbRtc} from "@vlcn.io/sync-p2p";
// @ts-ignore
import wasmUrl from "@vlcn.io/wa-crsqlite/wa-sqlite-async.wasm?url";
import {Ctx} from "./Ctx";
import {defineConfig} from "vite";
import { JsonToSql } from 'web-server-wasm';
import {DbDsl, useDbHelper} from "./composables/dbHelper";


const main = async () => {
    let dsl = {
        "db": "p2p-wdb-todomvc-9",
        "tables": [
            {
                "name": "todo",
                "columns": [
                    {
                        "name": "text",
                        "columnType": "text",
                    },
                    {
                        "name": "completed",
                        "columnType": "boolean",
                    },
                ]
            },
            {
                "name": "notes",
                "columns": [
                    {
                        "name": "text",
                        "columnType": "text",
                    },
                    {
                        "name": "content",
                        "columnType": "text",
                    },
                ]
            }
        ]
    };
    let {dslToSql} = useDbHelper();
    let db = await dslToSql(dsl as DbDsl)
    const r = await db.execA("SELECT crsql_siteid()");
    const siteid = uuidStringify(r[0][0]);

    const rx = await tblrx(db);
    const rtc = await wdbRtc(
        db,
        window.location.hostname === "localhost"
            ? {
                host: "localhost",
                port: 9000,
                path: "/examples",
            }
            : undefined
    );

    window.onbeforeunload = () => {
        db.close();
    };
    // let rows = await db.execA("select * from crsql_changes();");
    // console.log("Changes: ", rows);
    // rows = await db.execA("SELECT * FROM todo");
    // console.log(rows);
    // rows = await db.execA("SELECT * FROM notes");
    // console.log(rows);
    startApp({
        db,
        siteid: siteid,
        rtc,
        rx,
    });

}

const startApp = (ctx: Ctx) => {
    const app = createApp(App);
    app.provide("ctx", ctx);
    app.mount('#app')
}

main();