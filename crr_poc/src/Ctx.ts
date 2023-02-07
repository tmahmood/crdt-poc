import {wdbRtc} from "@vlcn.io/sync-p2p";
import tblrx from "@vlcn.io/rx-tbl";
import {DB} from "@vlcn.io/wa-crsqlite";
import {DbDsl, useDbHelper} from "./composables/dbHelper";
import {stringify as uuidStringify} from "uuid";

export class Ctx {
    pendingMessages: Array<{ msg: string, after: any }>;
    db!: DB;
    siteId!: string;
    rx!: Awaited<ReturnType<typeof tblrx>>;
    ws!: WebSocket;
    currentVersion?: number;


    constructor(db: DB, siteId: string, rx: Awaited<ReturnType<typeof tblrx>>, ws: WebSocket, currentVersion: number) {
        this.pendingMessages = [];
        this.db = db;
        this.siteId = siteId;
        this.rx = rx;
        this.ws = ws;
        this.currentVersion = currentVersion;
    }
}

export const initCtx = async (dsl: DbDsl, wsAddress: string): Promise<Ctx> => {
    let db = await useDbHelper().dslToSql(dsl);
    let rx = tblrx(db);
    let r = await db.execA("SELECT crsql_siteid()");
    let siteId = uuidStringify(r[0][0]);
    let ws = new WebSocket(wsAddress);
    ws.onopen = () => {
        console.log("Registering onopen ...");
        setInterval(() => {
            if (ctx.pendingMessages.length == 0) {
                return;
            }
            if (ctx.ws.bufferedAmount === 0) {
                let msgs = ctx.pendingMessages;
                for (let i = 0; i < msgs.length; i++) {
                    let m = msgs[i];
                    ctx.ws.send(m.msg);
                    m.after();
                }
                ctx.pendingMessages = [];
            }
        }, 50);
    }
    let currentVersion = await useDbHelper().dbCurrentVersion(db);
    let ctx = new Ctx(db, siteId, rx, ws, currentVersion);

    ctx.ws.onmessage = (c: MessageEvent) => {
        useDbHelper().onmessage(ctx, c.data).then(() => {});
    }

    return ctx;

}