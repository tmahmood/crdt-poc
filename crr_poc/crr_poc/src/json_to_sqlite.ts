import wasmUrl from "@vlcn.io/wa-crsqlite/wa-sqlite-async.wasm?url";
import sqliteWasm from "@vlcn.io/wa-crsqlite";
import tblrx from "@vlcn.io/rx-tbl";
import {wdbRtc} from "@vlcn.io/sync-p2p";


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

export const dslToSql = async (dbDsl: DbDsl) => {
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

