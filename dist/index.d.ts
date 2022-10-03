interface constructorOptions {
    path?: string;
    inMemory?: boolean;
}
declare type fn = (data: Object[] | Object) => void;
interface document {
    [key: string]: string | number | Object | Array<any> | any;
}
interface storage {
    [collectioName: string]: document[];
}
declare class QuipoDB {
    private options;
    storage: storage;
    sqlite: SQLite;
    Doc: Doc;
    ready: boolean;
    constructor(options?: constructorOptions);
    save(): void;
    createCollection(collectionName: string, primaryKey: string, cb?: Function): Doc;
    deleteCollection(collectionName: string, cb?: Function): void;
    getCollection(collectionName: string, cb?: Function): document[];
}
declare class Doc {
    storage: storage;
    private collectionName;
    private primaryKey;
    private options;
    private sqlite;
    constructor(storage: storage, collectionName: string, primaryKey: string, options: constructorOptions, sqlite: SQLite);
    createDoc(data: document[] | document, cb?: Function): this;
    deleteDoc(data: document | fn, cb?: Function): void;
    getDoc(data: document | fn, cb?: Function): object;
    getRaw(cb?: Function): storage;
    hasDoc(data: document | fn, cb?: Function): boolean;
    updateDoc(data: document | fn, value: document | fn, cb?: Function): this;
}
declare class SQLite {
    private options;
    provider: any;
    constructor(options?: {
        fileName: string;
    });
    createTable(tableName: string, primaryColumn: string, dataType?: "TEXT" | "REAL" | "INTEGER" | "BLOB" | "NULL" | "NONE"): void;
    createColumn(tableName: string, columnName: string, dataType?: "TEXT" | "REAL" | "INTEGER" | "BLOB" | "NULL" | "NONE"): void;
    deleteTable(tableName: string, cb?: Function): void;
    deleteRow(tableName: string, data: document, cb?: Function): void;
    setRow(tableName: string, data: document, cb?: Function): {};
    updateRow(tableName: string, primaryColumn: string, data: document, cb?: Function): {};
    getRow(tableName: string, data: document, cb?: Function): any;
    hasRow(tableName: string, data: document, cb?: Function): boolean;
}
export default QuipoDB;
