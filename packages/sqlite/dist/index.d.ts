import sqlite from "better-sqlite3";
interface sqliteConstructor {
    path: String;
    primaryKey: any;
}
interface document {
    [key: string]: string | number | Object | Array<any> | any;
}
export default class Sqlite {
    sqlite: sqlite.Database;
    private options;
    private collectionName;
    private primaryKey;
    constructor(options: sqliteConstructor);
    createCollectionProvider(collectionName: String, cb?: Function): void;
    private createColumnProvider;
    createDocProvider(data: document, cb?: Function): any;
    deleteCollectionProvider(collectionName: String, cb?: Function): void;
    deleteDocProvider(data: document, cb?: Function): void;
    getCollectionProvider(collectionName: String, cb?: Function): any[];
    getDocProvider(data: document, cb?: Function): any;
    getCollectionsProvider(cb?: Function): any[];
    updateDocProvider(refData: document, data: document, cb?: Function): void;
}
export {};
