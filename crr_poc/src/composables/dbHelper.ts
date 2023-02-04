import {Ctx} from "../Ctx";
import sqliteWasm from "@vlcn.io/wa-crsqlite";
import wasmUrl from "@vlcn.io/wa-crsqlite/wa-sqlite-async.wasm?url";
import {reloadAllTodosList} from "../store";


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


export const useDbHelper = () => {

    const dslToSql = async (dbDsl: DbDsl) => {
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

    const select = async (ctx: Ctx, table: string) => {
        const SELECT_QUERY: string = `select *
                                      from ${table}`;
        return await ctx.db.execA(SELECT_QUERY);
    }
    const insert = async (ctx: Ctx, table: string, bind: Array<any>) => {
        let bindings: Array<string> = [];
        for (let i = 0; i < bind.length; i++) {
            bindings.push("?")
        }
        const QUERY: string = `insert into ${table}
                               values (${bindings.join(',')})`;
        await ctx.db.exec(QUERY, bind);
        await onmessage(ctx, JSON.stringify({command: "send", version: ctx.currentVersion} as MsgData));
    }
    const deleteRow = async (ctx: Ctx, table: string, id: string) => {
        await ctx.db.exec(`DELETE
                           FROM ${table}
                           WHERE id = ?`, [id]);
        await onmessage(ctx, JSON.stringify({command: "send", version: ctx.currentVersion} as MsgData));
    };

    const updateRow = async (ctx: Ctx, table: string, id: string, bindDict: { [name: string]: any }) => {
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
        await onmessage(ctx, JSON.stringify({command: "send", version: ctx.currentVersion} as MsgData));
    };

    const dbChangeSets = async (ctx: Ctx, currentVersion: number) => {
        return await ctx.db.execA("SELECT * FROM crsql_changes where db_version > ?", [currentVersion]);
    }

    const dbMergeChanges = async (ctx: Ctx, changes: Array<Array<any>>) => {
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
                let last: Array<any> = cs.pop();
                let nu: Uint8Array = Uint8Array.from(last);
                cs.push(nu);
                await ctx.db.exec(q, cs);
            }
        });
    }

    const dbCurrentVersion = async (ctx: Ctx) => {
        return (await ctx.db.execA(`SELECT crsql_dbversion()`))[0][0];
    }

    const onmessage = async (ctx: Ctx, d: string) => {
        let j: MsgData = JSON.parse(d);
        console.log(d);
        if (j.command === "send_all") {
            let changes = await dbChangeSets(ctx, -1);
            console.log("send_all:", changes);
            let snd: SendData = {
                kind: "ChangeSet",
                message: JSON.stringify(changes),
            }
            if(j.client) {
                snd.client = j.client;
            }
            let to_send = JSON.stringify(snd);
            ctx.ws.send(to_send);
        } else if (j.command == "send") {
            if (j.version) {
                let version = parseInt(j.version);
                console.log("version: ", version);
                let changes = await dbChangeSets(ctx, version);
                console.log("send:", changes);
                let to_send = JSON.stringify({
                    kind: "ChangeSet",
                    message: JSON.stringify(changes),
                } as SendData);
                ctx.ws.send(to_send);
                ctx.currentVersion = version;
            }
        } else if (j.command == "apply") {
            if (j.message) {
                let incoming = JSON.parse(j.message);
                console.log(incoming);
                await dbMergeChanges(ctx, incoming);
                console.log("Merged ...")
                let v = await dbCurrentVersion(ctx);
                ctx.ws.send(JSON.stringify({
                    kind: "ACK",
                    message: v.toString()
                } as SendData));
                await reloadAllTodosList(ctx)
            }
        } else {
            console.log("Unhandled")
        }
        reloadAllTodosList(ctx).then(() => {
            console.log("Reloaded")
        });
    }


    return {
        dslToSql, select, insert, deleteRow, updateRow, dbChangeSets, dbMergeChanges, dbCurrentVersion,
        onmessage

    };
}