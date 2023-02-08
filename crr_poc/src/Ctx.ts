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
    ws!: WSConnection;
    currentVersion?: number;


    constructor(db: DB, siteId: string, rx: Awaited<ReturnType<typeof tblrx>>, currentVersion: number, wsAddress: string) {
        this.pendingMessages = [];
        this.db = db;
        this.siteId = siteId;
        this.rx = rx;
        this.ws = new WSConnection(this, wsAddress);
        this.currentVersion = currentVersion;
    }
}

export const initCtx = async (dsl: DbDsl, wsAddress: string): Promise<Ctx> => {
    let db = await useDbHelper().dslToSql(dsl);
    let rx = tblrx(db);
    let r = await db.execA("SELECT crsql_siteid()");
    let siteId = uuidStringify(r[0][0]);
    let currentVersion = await useDbHelper().dbCurrentVersion(db);
    return new Ctx(db, siteId, rx, currentVersion, wsAddress);
}

class WSConnection {
    wsAddress: string;
    ctx: Ctx;
    ws!: WebSocket;
    status: number;

    constructor(ctx: Ctx, wsAddress: string) {
        console.log("Using WSConnection")
        this.wsAddress = wsAddress
        this.ctx = ctx;
        this.status = 0;
        this.connect();
    }

    connect() {
        let ws = new WebSocket(this.wsAddress);
        let self = this;
        ws.onopen = () => {
            console.log("Registering onopen ...");
            console.log(ws.extensions);
            self.status = 1;
            setInterval(() => {
                if (this.ctx.pendingMessages.length == 0) {
                    return;
                }
                if (this.ws.bufferedAmount === 0) {
                    let msgs = this.ctx.pendingMessages;
                    for (let i = 0; i < msgs.length; i++) {
                        let m = msgs[i];
                        this.ws.send(m.msg);
                        m.after();
                    }
                    this.ctx.pendingMessages = [];
                }
            }, 50);
        }
        ws.onmessage = (c: MessageEvent) => {
            if (self.status == 0) {
                console.log("No connection available, Syncing will resume after reconnection");
            } else {
                useDbHelper().onmessage(this.ctx, c.data).then(() => {});
            }
        }

        ws.onclose = function(e) {
            self.status = 0
            console.log('Socket is closed. Reconnect will be attempted in 2 second.', e.reason);
            setTimeout(function() {
                self.connect();
            }, 2000);
        };
        ws.onerror = function(ev) {
            self.status = 0
            console.error('Socket encountered error: Closing socket');
            ws.close();
        };
        this.ws = ws;
    }


}