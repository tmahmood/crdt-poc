import sqliteWasm, {DB} from "@vlcn.io/wa-crsqlite";
import {stringify as uuidStringify} from "uuid";
// @ts-ignore
import wasmUrl from "@vlcn.io/wa-crsqlite/wa-sqlite-async.wasm?url";
import tblrx from "@vlcn.io/rx-tbl";


type ColumnTypes = "text" | "number" | "boolean";


export interface MsgData {
    command: "send_all" | "send" | "apply",
    version?: string,
    message?: string,
    client?: number,
}

export interface SendData {
    kind: "Version" | "ChangeSet" | "ACK",
    message?: string,
    client?: number,
}

export interface ColumnDsl {
    name: string
    columnType: ColumnTypes
    defs?: string
}

const createColumn = (column: ColumnDsl) => {
    return `${column.name} ${column.columnType} ${column.defs || ''}`.trim();
}

export interface TableDsl {
    name: string
    columns: Array<ColumnDsl>

}

const createTable = (table: TableDsl) => {
    let q: Array<string> = [];
    q.push();
    for (const column of table.columns) {
        q.push(createColumn(column));
    }
    return `create table if not exists ${table.name}
            (
                id
                primary
                key,
                ${q.join(', ')}
            )`
}

export interface DbDsl {
    db: string
    tables: Array<TableDsl>
}


export class DbHelper  {

    static dslToSql = async (dbDsl: DbDsl) => {
        const sqlite = await sqliteWasm(() => wasmUrl);
        const db = await sqlite.open(dbDsl.db);
        for (const table of dbDsl.tables) {
            let sql = createTable(table);
            console.log(sql);
            await db.exec(sql);
            await db.exec(`SELECT crsql_as_crr('${table.name}')`);
        }
        return db;
    }

    static select = async (ctx: Ctx, table: string) => {
        const SELECT_QUERY: string = `select *
                                      from ${table}`;
        return await ctx.db.execA(SELECT_QUERY);
    }
    static insert = async (ctx: Ctx, table: string, bind: Array<any>) => {
        let bindings: Array<string> = [];
        for (let i = 0; i < bind.length; i++) {
            bindings.push("?")
        }
        const QUERY: string = `insert into ${table}
                               values (${bindings.join(',')})`;
        await ctx.db.exec(QUERY, bind);
        await DbHelper.onmessage(ctx, JSON.stringify({command: "send", version: ctx.currentVersion} as MsgData));
    }
    static deleteRow = async (ctx: Ctx, table: string, id: string) => {
        await ctx.db.exec(`DELETE
                           FROM ${table}
                           WHERE id = ?`, [id]);
        await DbHelper.onmessage(ctx, JSON.stringify({command: "send", version: ctx.currentVersion} as MsgData));
    };

    static updateRow = async (ctx: Ctx, table: string, id: string, bindDict: { [name: string]: any }) => {
        let bindings: Array<string> = [];
        let bind: Array<any> = [];
        for (const bindingsKey in bindDict) {
            bindings.push(`${bindingsKey} = ?`)
            bind.push(bindDict[bindingsKey])
        }
        bind.push(id);
        let query = `UPDATE ${table}
                     SET ${bindings.join(', ')}
                     WHERE id = ?`;
        await ctx.db.exec(query, bind);
        await DbHelper.onmessage(ctx, JSON.stringify({command: "send", version: ctx.currentVersion} as MsgData));
    };

    static dbChangeSets = async (ctx: Ctx, currentVersion: number) => {
        return await ctx.db.execA("SELECT * FROM crsql_changes where db_version > ?", [currentVersion]);
    }

    static dbMergeChanges = async (ctx: Ctx, changes: Array<Array<any>>) => {
        if (changes.length == 0) {
            return;
        }
        let bindings: Array<string> = [];
        for (let i = 0; i < changes[0].length; i++) {
            bindings.push("?")
        }
        await ctx.db.transaction(async () => {
            let q = `INSERT INTO crsql_changes
                     VALUES (${bindings.join(',')})`;
            for (const cs of changes) {
                let nu: Uint8Array = new Uint8Array(16);
                let last: { [index: number]: number } = cs.pop();
                for (const lastKey in last) {
                    nu[lastKey] = last[lastKey];
                }
                cs.push(nu);
                ctx.db.exec(q, cs).catch(() => {
                    console.log("Failed to save: ", cs)
                });
            }
        });
    }

    static dbCurrentVersion = async (db: DB) => {
        return (await db.execA(`SELECT crsql_dbversion()`))[0][0];
    }

    static onmessage = async (ctx: Ctx, d: string, calledAfter?: any) => {
        let j: MsgData = JSON.parse(d);
        let toSend = undefined;
        if (j.command === "send_all") {
            let changes = await DbHelper.dbChangeSets(ctx, -1);
            console.log("send_all");
            let snd: SendData = {
                kind: "ChangeSet",
                message: JSON.stringify(changes),
            }
            if (j.client) {
                snd.client = j.client;
            }
            toSend = {
                msg: JSON.stringify(snd), after: () => {
                    console.log("Called after, [send]")
                    calledAfter && calledAfter();
                }
            };
            DbHelper.queueMessage(ctx, toSend)
        } else if (j.command == "send") {
            if (j.version) {
                let version = parseInt(j.version);
                console.log("send", j.version);
                let changes = await DbHelper.dbChangeSets(ctx, version);
                let snd = JSON.stringify({
                    kind: "ChangeSet",
                    message: JSON.stringify(changes),
                } as SendData);
                toSend = {
                    msg: snd, after: () => {
                        console.log("Called after, [send]")
                        calledAfter && calledAfter();
                    }
                };
                DbHelper.queueMessage(ctx, toSend)
            }
        } else if (j.command == "apply") {
            if (j.message) {
                let incoming = JSON.parse(j.message);
                await DbHelper.dbMergeChanges(ctx, incoming);
                console.log("Merged ...")
                let v = await DbHelper.dbCurrentVersion(ctx.db);
                let snd = JSON.stringify({
                    kind: "ACK",
                    message: v.toString()
                } as SendData);
                toSend = {
                    msg: snd,
                    after: () => {
                        console.log("Called after, [apply]")
                        calledAfter && calledAfter();
                    }
                }
                DbHelper.queueMessage(ctx, toSend)
            }
        } else {
            console.log("Unhandled")
        }
    }


    static queueMessage = (ctx: Ctx, msg: { msg: string, after: any }) => {
        ctx.pendingMessages.push(msg);
    }

}


export class Ctx {
    pendingMessages: Array<{ msg: string, after: any }>;
    db!: DB;
    siteId!: string;
    rx!: Awaited<ReturnType<typeof tblrx>>;
    ws!: WSConnection;
    currentVersion?: number;


    constructor(db: DB, siteId: string, rx: Awaited<ReturnType<typeof tblrx>>,
                currentVersion: number, wsAddress: string, onmessageCallback?: any) {
        this.pendingMessages = [];
        this.db = db;
        this.siteId = siteId;
        this.rx = rx;
        this.ws = new WSConnection(this, wsAddress, onmessageCallback);
        this.currentVersion = currentVersion;
    }
}

export const initCtx = async (dsl: DbDsl, wsAddress: string, onmessageCallback?: any): Promise<Ctx> => {
    let db = await DbHelper.dslToSql(dsl);
    let rx = tblrx(db);
    let r = await db.execA("SELECT crsql_siteid()");
    let siteId = uuidStringify(r[0][0]);
    let currentVersion = await DbHelper.dbCurrentVersion(db);
    window.onbeforeunload = () => {
        db.close().then(() => {
        });
    }
    return new Ctx(db, siteId, rx, currentVersion, wsAddress, onmessageCallback);
}

class WSConnection {
    wsAddress: string;
    ctx: Ctx;
    ws!: WebSocket;
    status: number;
    onmessageCallback?: any;

    constructor(ctx: Ctx, wsAddress: string, onmessageCallback?: any) {
        console.log("Using WSConnection")
        this.wsAddress = wsAddress
        this.ctx = ctx;
        this.status = 0;
        this.onmessageCallback = onmessageCallback;
        this.connect();
    }

    connect() {
        let ws = new WebSocket(this.wsAddress);
        let self = this;
        ws.onopen = () => {
            console.log("Registering onopen ...");
            self.status = 1;
            setInterval(() => {
                if (this.ctx.pendingMessages.length == 0) {
                    return;
                }
                console.log("Sending messages ...")
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
                DbHelper.onmessage(this.ctx, c.data).then(() => {
                    this.onmessageCallback(this.ctx, c.data);
                });
            }
        }
        ws.onclose = function (e) {
            self.status = 0
            console.log('Socket is closed. Reconnect will be attempted in 2 second.', e.reason);
            setTimeout(function () {
                self.connect();
            }, 2000);
        };
        ws.onerror = function (ev) {
            self.status = 0
            console.error('Socket encountered error: Closing socket');
            ws.close();
        };
        this.ws = ws;
    }
}
