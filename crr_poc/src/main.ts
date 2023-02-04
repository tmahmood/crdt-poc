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
import {DbDsl, MsgData, useDbHelper} from "./composables/dbHelper";
import {reloadAllTodosList} from "./store";

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
    let {dslToSql, dbCurrentVersion} = useDbHelper();
    let db = await dslToSql(dsl as DbDsl)
    const r = await db.execA("SELECT crsql_siteid()");
    const site_id = uuidStringify(r[0][0]);
    const rx = await tblrx(db);

    window.onbeforeunload = () => {
        db.close();
    };

    let ws = new WebSocket('ws://0.0.0.0:9000/ws');
    let pendingSends: Array<string> = [];
    let ctx: Ctx = {
        db,
        site_id: site_id,
        rx,
        ws,
        pendingSends,
    };
    ctx.currentVersion = await dbCurrentVersion(ctx);

    ctx.ws.onmessage = (c) => {
        let d = c.data;
        useDbHelper().onmessage(ctx, d);
    }
    startApp(ctx);
}

const startApp = (ctx: Ctx) => {
    const app = createApp(App);
    app.provide("ctx", ctx);
    app.mount('#app')
}

await main();