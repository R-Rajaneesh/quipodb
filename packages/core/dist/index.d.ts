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
    /**
     * Create a new collection
     * @param {String} collectionName Provide a name to create a collection
     * @param {Function} [cb] Callback with the docs
     * @returns {Docs} The collection to interact with
     */
    createCollection(collectionName: String, cb?: Function): Docs;
    /**
     * Delete a collection
     * @param {String} collectionName Provide the name of collection to be deleted
     * @param {Function} [cb] None
     */
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
    /**
     * @async
     * @method
     * Create a document in the collection
     * ```js
     * const db = new QuipoDB();
     * const collection = db.createCollection("users");
     * const data = {
     *  author: "Rajaneesh R",
     *  email: "rajaneeshr@proton.me"
     * };
     * await collection.createDoc(data);
     * ```
     * @param  {document|document[]} data The document to store as a object
     * @param  {Function} cb
     * @returns the `document`
     */
    createDoc(data: document | document[], cb?: Function): Promise<document | undefined>;
    /**
     * @async
     * @method
     * Deletes a document from the collection
     * ```js
     * const db = new QuipoDB();
     * const collection = db.createCollection("users");
     * const data = {
     *  email: "rajaneeshr@proton.me"
     * };
     * await collection.deleteDoc(data);
     * ```
     * @param  {document|fn} data Document to delete
     * @param  {Function} cb
     * @returns `undefined`
     */
    deleteDoc(data: document | fn, cb?: Function): Promise<undefined>;
    /**
     * @async
     * @method
     * Finds the matching document
     * ```js
     * const db = new QuipoDB();
     * const collection = db.createCollection("users");
     * const data = {
     *  email: "rajaneeshr@proton.me"
     * };
     * await collection.findDoc(data);
     * ```
     * @param  {document|fn} data The document to search for
     * @param  {Function} cb
     * @returns `document` or `undefined`
     */
    findDoc(data: document | fn, cb?: Function): Promise<document | undefined>;
    /**
     * @async
     * @method
     * Get the raw collection as json
     * ```js
     * const db = new QuipoDB();
     * const collection = db.createCollection("users");
     * const data = {
     *  author: "Rajaneesh R",
     *  email: "rajaneeshr@proton.me"
     * };
     * const raw = await collection.getRaw();
     * // Use raw documents
     * ```
     * @param  {Function} cb
     * @returns `document[]`
     */
    getRaw(cb?: Function): Promise<document[]>;
    /**
     * @async
     * @method
     * Query collection with chainable functions
     * ```js
     * const db = new QuipoDB();
     * const collection = db.createCollection("users");
     * const query = (await collection.queryCollection()).where("name").equals("Rajaneesh R").update("Rajaneesh.R").save();
     * ```
     * @param  {Function} cb
     * @returns `Query`
     */
    queryCollection(cb?: Function): Promise<Query>;
    /**
     * @async
     * @method
     * Saves the query from the `.save()` function from the `Query`
     * ```js
     * const db = new QuipoDB();
     * const collection = db.createCollection("users");
     * const query = (await collection.queryCollection()).where("name").equals("Rajaneesh R").update("Rajaneesh.R").save();
     * collection.saveQuery(query);
     * ```
     * @param  {document[]} queryJSON
     * @returns `undefined`
     */
    saveQuery(queryJSON: document[]): Promise<undefined>;
    /**
     * @async
     * @method
     * Updates the document
     * ```js
     * const db = new QuipoDB();
     * const collection = db.createCollection("users");
     * const data = {
     *  author: "Rajaneesh R"
     * };
     * const newData = {
     *  email: "mail@example.com"
     * }
     * await collection.updateDoc(data, newData);
     * ```
     * @param  {document} refData The document to update
     * @param  {document|fn} data The updated document
     * @param  {Function} cb
     * @returns `document` or `undefined`
     */
    updateDoc(refData: document, data: document | fn, cb?: Function): Promise<document | undefined>;
    /**
     * @async
     * @method
     * Update document as json and call `.save()` at the end to save it
     * ```js
     * const db = new QuipoDB();
     * const collection = db.createCollection("users");
     * const data = {
     *  author: "Rajaneesh R",
     *  email: "rajaneeshr@proton.me"
     * };
     * const raw = await collection.getRaw();
     * raw.email = "email@example.com";
     * raw.save();
     * ```
     * @param  {document} refData The document to update
     * @param  {Function} cb
     * @returns `document` or `undefined`
     */
    updateRaw(refData: document, cb?: Function): Promise<{
        save: Function;
        [x: string]: any;
    } | undefined>;
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
    gt(val: number): this;
    gte(val: number): this;
    limit(val: number): this;
    lt(val: number): this;
    lte(val: number): this;
    multiply(val: number): this;
    push(val: any): this;
    splice(start: number, deleteCount?: number, items?: any[]): this;
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
