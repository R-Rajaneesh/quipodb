interface constructorOptions {
    providers: providers[];
    cache: Boolean;
}
interface providers {
    createCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
    createDocProvider(collectionName: String, data: document, cb?: Function): Promise<any> | any;
    deleteCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
    deleteDocProvider(collectionName: String, data: document | fn, cb?: Function): Promise<any> | any;
    getCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
    getCollectionsProvider(cb?: Function): Promise<any> | any[];
    getDocProvider(collectionName: String, data: document | fn, cb?: Function): Promise<any> | any;
    updateDocProvider(collectionName: String, refData: document | fn, data: document, cb?: Function): Promise<any> | any;
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
    collectionName: string;
    storage: storage;
    cache: Boolean;
}
export declare class Docs {
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
    data: any[];
    key: string;
    _limit: number;
    constructor(data: any[]);
    /**
     * Add a number to the selected key
     * @param {number} value
     */
    add(value: number): this;
    /**
     * Clear the querying data and fallback to the top-level of the object
     */
    clearQuery(): this;
    /**
     * Divide a number to the selected key
     * @param {number} value
     */
    divide(value: number): this;
    /**
     * Check if the value matches
     * @param  {any} value
     */
    equals(value: any): this;
    /**
     * Get the data from the key and value
     * @param  {string} key
     * @param  {any} value
     */
    find(key: string, value: any): void;
    /**
     * Check if greater
     * @param  {number} val
     */
    gt(val: number): this;
    /**
     * Check if greater or equal
     * @param  {number} val
     */
    gte(val: number): this;
    /**
     * Limit the number of outputs
     * @param  {number} val
     */
    limit(val: number): this;
    /**
     * Check if lesser
     * @param  {number} val
     */
    lt(val: number): this;
    /**
     * Check if lesser or equal
     * @param  {number} val
     */
    lte(val: number): this;
    /**
     * Multiply a number to the selected key
     * @param {number} value
     */
    multiply(value: number): this;
    /**
     * Push elements into potentially possible arrays
     * @param  {any[]} ...value
     */
    push(...value: any[]): this;
    /**
     * Get the raw data
     */
    raw(): any[];
    /**
     * Save the data to save to the database
     */
    save(): any[];
    /**
     * Get deeper into the object
     * @param  {string} key
     */
    select(key: string): this;
    /**
     * Remove (or replace) items from an array
     * @param  {number} start
     * @param  {number} [deleteCount]
     * @param  {any[]} [items]
     */
    splice(start: number, deleteCount?: number, items?: any[]): this;
    /**
     * Subtract a number to the selected key
     * @param {number} value
     */
    subtract(value: number): this;
    /**
     * Get the entire data from the top-level
     */
    toJSON(): any[];
    /**
     * Get the last selected data
     */
    toValue(): any[];
    /**
     * Update the entire value with a new one
     * @param  {any} value
     */
    update(value: any): this;
    /**
     * Select data to query on next
     * @param  {string} key
     * @param  {any} [value]
     */
    where(key: string, value?: any): this;
}
export {};
