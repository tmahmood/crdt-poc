import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import {stringify as uuidStringify} from "uuid";

import sqliteWasm from "@vlcn.io/wa-crsqlite";
import tblrx from "@vlcn.io/rx-tbl";
import {wdbRtc} from "@vlcn.io/sync-p2p";
// @ts-ignore
import wasmUrl from "@vlcn.io/wa-crsqlite/wa-sqlite-async.wasm?url";
import {Ctx, initCtx} from "./Ctx";
import {DbDsl, MsgData, useDbHelper} from "./composables/dbHelper";
import {reloadAllTodosList} from "./store";

const main = async () => {
    let dsl: DbDsl = {
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


    let wsAddress = 'ws://0.0.0.0:9000/ws';
    // let wsAddress = new WebSocket('wss://todo-in-browser.godly.dev:9000/ws');
    // console.log(ws);

    let ctx: Ctx = await initCtx(dsl, wsAddress);
    window.onbeforeunload = () => {
        ctx.db.close().then(() => {});
    }

    startApp(ctx);
}

const startApp = (ctx: Ctx) => {
    const app = createApp(App);
    app.provide("ctx", ctx);
    app.mount('#app')
}

await main();