import { wdbRtc } from "@vlcn.io/sync-p2p";
import tblrx from "@vlcn.io/rx-tbl";
import { DB } from "@vlcn.io/wa-crsqlite";

export type Ctx = {
    db: DB;
    site_id: string;
    rx: Awaited<ReturnType<typeof tblrx>>;
    ws: WebSocket;
    pendingSends: Array<string>
    currentVersion?: number,
};
