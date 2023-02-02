import {Ctx} from "../Ctx";

export const useDbHelper = (ctx: Ctx) => {
    const select = async (table: string) => {
        const SELECT_QUERY: string = `select *
                                      from ${table}`;
        return await ctx.db.execA(SELECT_QUERY);
    }
    const insert = async (table: string, bind: Array<any>) => {
        let bindings: Array<string> = [];
        for (let i = 0; i < bind.length; i++) {
            bindings.push("?")
        }
        const QUERY: string = `insert into ${table}
                               values (${bindings.join(',')})`;
        await ctx.db.exec(QUERY, bind);
    }
    const deleteRow = async (table: string, id: string) => {
        await ctx.db.exec(`DELETE
                           FROM ${table}
                           WHERE id = ?`, [id]);
    };

    const updateRow = async (table: string, id: string, bindDict: { [name: string]: any }) => {
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

    return {select, insert, deleteRow, updateRow};
}