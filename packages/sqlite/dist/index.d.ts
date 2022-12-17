import sqlite from "better-sqlite3";
interface sqliteConstructor {
    primaryKey: string;
    path: String;
    dev: boolean;
}
interface document {
    [key: string]: string | number | Object | Array<any> | any;
}
declare class Sqlite {
    sqlite: sqlite.Database;
    private options;
    private collectionName;
    primaryKey: String;
    constructor(options: sqliteConstructor);
    private mapValues;
    private typeof;
    createCollectionProvider(collectionName: String): void;
    private createColumnProvider;
    createDocProvider(data: document): void;
    deleteCollectionProvider(collectionName: String): void;
    deleteDocProvider(data: document): void;
    getCollectionProvider(collectionName: String): any[];
    getCollectionsProvider(): any[];
    getDocProvider(data: document): any;
    updateDocProvider(refData: document, data: document): void;
}
export default Sqlite;
