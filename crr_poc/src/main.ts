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
import {DbDsl, useDbHelper} from "./composables/dbHelper";

interface MsgData {
    command: string,
    version?: string,
    message?: string,
}

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
    let {dslToSql, dbChangeSets, dbCurrentVersion, dbMergeChanges} = useDbHelper();
    let db = await dslToSql(dsl as DbDsl)
    const r = await db.execA("SELECT crsql_siteid()");
    const site_id = uuidStringify(r[0][0]);

    const rx = await tblrx(db);
    const rtc = await wdbRtc(
        db,
        window.location.hostname === "localhost"
            ? {
                host: "localhost",
                port: 9000,
                path: "/ws",
            }
            : undefined
    );

    window.onbeforeunload = () => {
        db.close();
    };

    let ws = new WebSocket('ws://0.0.0.0:9000/ws');
    let ctx = {
        db,
        site_id: site_id,
        rtc,
        rx,
        ws
    };

    ctx.ws.onmessage = (c) => {
        let d = c.data;
        let j: MsgData = JSON.parse(d);
        if (j.command === "send_all") {
            dbChangeSets(ctx, -1).then(changes => {
                console.log(changes);
                let to_send = JSON.stringify({
                    kind: "ChangeSet",
                    message: JSON.stringify(changes),
                });
                ctx.ws.send(to_send);
            })
        } else if (j.command == "send") {
            if (j.version) {
                let version = parseInt(j.version);
                dbChangeSets(ctx, version).then(changes => {
                    let to_send = JSON.stringify({
                        kind: "ChangeSet",
                        message: JSON.stringify(changes),
                    });
                    ctx.ws.send(to_send);
                })
            }
        } else {
            if (j.message) {
                let incoming = JSON.parse(j.message);
                dbMergeChanges(ctx, incoming).then(() => {
                    ctx.ws.send(JSON.stringify({
                        kind: "Version",
                        message: dbCurrentVersion(ctx)
                    }));
                });
            }
        }
    }

    let currentVersion = await dbCurrentVersion(ctx);
    let to_send = JSON.stringify({
        kind: "Version",
        message: currentVersion.toString(),
    });

    ctx.ws.onopen = (c) => {
        ws.send(to_send);
    };
    startApp(ctx);

}

const startApp = (ctx: Ctx) => {
    const app = createApp(App);
    app.provide("ctx", ctx);
    app.mount('#app')
}

await main();