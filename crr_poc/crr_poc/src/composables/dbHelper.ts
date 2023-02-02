import {Ctx} from "../Ctx";
import sqliteWasm from "@vlcn.io/wa-crsqlite";
import wasmUrl from "@vlcn.io/wa-crsqlite/wa-sqlite-async.wasm?url";


type ColumnTypes = "text" | "number" | "boolean";


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
    return `create table if not exists ${table.name} (id primary key, ${q.join(', ')})`
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
    }
    const deleteRow = async (ctx: Ctx, table: string, id: string) => {
        await ctx.db.exec(`DELETE
                           FROM ${table}
                           WHERE id = ?`, [id]);
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
    };

    return {dslToSql, select, insert, deleteRow, updateRow};
}