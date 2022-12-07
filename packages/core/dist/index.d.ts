interface constructorOptions {
    providers: providers[];
    cache: Boolean;
}
interface providers {
    createCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
    createDocProvider(data: document, cb?: Function): Promise<any> | any;
    deleteCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
    deleteDocProvider(data: document | fn, cb?: Function): Promise<any> | any;
    getCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
    getCollectionsProvider(cb?: Function): Promise<any> | any[];
    getDocProvider(data: document | fn, cb?: Function): Promise<any> | any;
    updateDocProvider(refData: document | fn, data: document, cb?: Function): Promise<any> | any;
}
type fn = (data: Object[] | Object) => any;
interface storage {
    [collection: string]: document[];
}
interface document {
    [key: string]: string | number | Object | Array<any> | any;
}
export declare class QuipoDB {
    options: constructorOptions;
    storage: storage;
    cache: Boolean;
    collectionName: String;
    Docs: typeof Docs;
    providers: providers[];
    constructor(options: constructorOptions);
    createCollection(collectionName: String, cb?: Function): Docs;
    deleteCollection(collectionName: String, cb?: Function): void;
}
interface DocsOptions {
    providers: providers[];
    collectionName: String;
    storage: storage;
    cache: Boolean;
}
declare class Docs {
    private options;
    private providers;
    private collectionName;
    private storage;
    constructor(options: DocsOptions);
    createDoc(data: document | document[], cb?: Function): Promise<document | document[]>;
    deleteDoc(data: document | fn, cb?: Function): Promise<void>;
    findDoc(data: document | fn, cb?: Function): Promise<object>;
    getRaw(cb?: Function): Promise<any>;
    queryCollection(cb?: Function): Promise<Query>;
    saveQuery(queryJSON: document[]): Promise<void>;
    updateDoc(refData: document, data: document | fn, cb?: Function): Promise<any>;
    updateRaw(refData: document, cb?: Function): Promise<{
        [x: string]: any;
        save: Function;
    }>;
    private _$add;
    private _$subtract;
    private _$multiply;
    private _$divide;
    private _$push;
}
export declare class Query {
    private data;
    private key;
    private current;
    private _limit;
    private old;
    constructor(data: any[]);
    add(val: number): this;
    /**
     * Gets back to the top level on the data
     */
    clearQuery(): this;
    delete(key: string): this;
    divide(val: number): this;
    equals(val: any): this;
    /**
     * Check if the data exists on every object
     */
    exists(key: string): boolean;
    find(key: string, val: any): void;
    gt(val: any): this;
    gte(val: any): this;
    limit(val: number): this;
    lt(val: any): this;
    lte(val: any): this;
    multiply(val: number): this;
    push(arr: any[]): this;
    /**
     * Get the raw data
     */
    raw(): any[];
    update(val: any): this;
    /**
     * Get into a deeper object
     * @param {String} key
     */
    select(key: string): this;
    subtract(val: number): this;
    /**
     * Saves the queries on the data
     */
    save(): any[];
    /**
     * Get the Latest data
     */
    toJSON(): any[];
    /**
     * Get the last selected query
     */
    toValue(): any[];
    /**
     * Select a object to query next
     * @param {string} key
     */
    where(key: string): this;
}
export {};
