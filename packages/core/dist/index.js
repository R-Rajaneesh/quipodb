import _ from "lodash";
import { mergeAndConcat } from "merge-anything";
export class QuipoDB {
    options;
    storage;
    cache;
    collectionName;
    Docs;
    providers;
    constructor(options) {
        this.options = options;
        this.providers = options.providers;
        this.storage = {};
        this.Docs = Docs;
    }
    /**
     * Create a new collection
     * @param {String} collectionName Provide a name to create a collection
     * @param {Function} [cb] Callback with the docs
     * @returns {Docs} The collection to interact with
     */
    createCollection(collectionName, cb = () => { }) {
        this.collectionName = collectionName;
        try {
            this.providers.forEach(async (provider) => {
                await provider.createCollectionProvider(collectionName);
            });
            if (this.options.cache)
                this.storage[`${collectionName}`] = [];
        }
        catch (error) {
            error;
        }
        const docs = new this.Docs({ providers: this.providers, collectionName: this.collectionName, storage: this.storage, cache: this.options.cache });
        cb(docs);
        return docs;
    }
    /**
     * Delete a collection
     * @param {String} collectionName Provide the name of collection to be deleted
     * @param {Function} [cb] None
     */
    deleteCollection(collectionName, cb = () => { }) {
        try {
            this.providers.forEach(async (provider) => {
                await provider.deleteCollectionProvider(collectionName);
            });
            if (this.options.cache)
                delete this.storage[`${collectionName}`];
        }
        catch (error) {
            error;
        }
        cb();
        return;
    }
}
class Docs {
    options;
    providers;
    collectionName;
    storage;
    constructor(options) {
        this.options = options;
        this.providers = options.providers;
        this.collectionName = options.collectionName;
        this.storage = options.storage;
    }
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
    async createDoc(data, cb = () => { }) {
        try {
            if (Array.isArray(data)) {
                data.forEach((doc) => {
                    this.providers.forEach(async (provider) => {
                        await provider.createDocProvider(doc);
                    });
                    if (this.options.cache)
                        this.storage[`${this.collectionName}`].push(doc);
                });
            }
            this.providers.forEach(async (provider) => {
                await provider.createDocProvider(data);
            });
            if (this.options.cache)
                this.storage[`${this.collectionName}`].push(data);
        }
        catch (error) {
            console.log(error);
        }
        cb(data);
        return data;
    }
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
    async deleteDoc(data, cb = () => { }) {
        try {
            if (typeof data === "function")
                data = data(await this.providers[0].getCollectionProvider(this.collectionName));
            this.providers.forEach(async (provider) => {
                await provider.deleteDocProvider(data);
            });
            if (this.options.cache) {
                this.storage[`${this.collectionName}`].splice(_.findIndex(this.storage[`${this.collectionName}`], data), 1);
            }
        }
        catch (error) {
            error;
        }
        cb();
        return;
    }
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
    async findDoc(data, cb = () => { }) {
        let result = undefined;
        if (typeof data === "function")
            data = data(await this.providers[0].getCollectionProvider(this.collectionName)) ?? {};
        try {
            const Data = await this.providers[0].getDocProvider(data);
            result = this.options.cache ? _.find(this.storage[`${this.collectionName}`], data) ?? Data : Data;
        }
        catch (error) {
            error;
        }
        cb(result);
        return result;
    }
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
    async getRaw(cb = () => { }) {
        const data = await this.providers[0].getCollectionProvider(`${this.collectionName}`);
        cb(data);
        return data;
    }
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
    async queryCollection(cb = () => { }) {
        const query = new Query(await this.getRaw());
        cb(query);
        return query;
    }
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
    async saveQuery(queryJSON) {
        if (this.options.cache)
            this.storage[`${this.collectionName}`] = queryJSON;
        queryJSON.forEach((data) => {
            const old = data._$old;
            delete data._$old;
            if (old !== data)
                this.updateDoc(old, data);
        });
        return;
    }
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
    async updateDoc(refData, data, cb = () => { }) {
        const oldDoc = refData;
        if (!oldDoc) {
            cb();
            return;
        }
        const storage = await this.providers[0].getCollectionProvider(this.collectionName);
        const index = storage.findIndex((doc) => doc === oldDoc);
        if (typeof data === "function")
            data = data(storage[index]);
        Object.keys(data)
            .filter((v) => v.startsWith("$"))
            .forEach((atomic, i) => {
            data = _.defaultsDeep(this[`_${atomic}`](oldDoc, data[atomic]), oldDoc);
        });
        try {
            this.providers.forEach(async (provider) => {
                await provider.updateDocProvider(oldDoc, data);
            });
            if (this.options.cache)
                this.storage[`${this.collectionName}`][_.findIndex(this.storage[`${this.collectionName}`], oldDoc)] = data;
        }
        catch (error) {
            error;
        }
        cb(storage[index]);
        return storage[index];
    }
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
    async updateRaw(refData, cb = () => { }) {
        let data = this.findDoc(refData);
        if (!data) {
            cb();
            return;
        }
        const self = this;
        const func = {
            ...data,
            save: async function () {
                try {
                    delete this.save;
                    await self.updateDoc(refData, this);
                    if (this.options.cache)
                        this.storage[`${this.collectionName}`][_.findIndex(this.storage[`${this.collectionName}`], refData)] = this;
                }
                catch (error) {
                    error;
                }
            },
        };
        cb(func);
        return func;
    }
    _$add(...data) {
        const deepMerge = (oldData, newData) => {
            return Object.keys(oldData).reduce((acc, key) => {
                if (typeof newData[key] === "object") {
                    acc[key] = deepMerge(oldData[key], newData[key]);
                }
                else if (newData.hasOwnProperty(key) && !isNaN(parseFloat(newData[key]))) {
                    if (!acc[key])
                        acc[key] = oldData[key] + newData[key];
                    acc[key] = oldData[key] + newData[key];
                }
                return acc;
            }, {});
        };
        const result = data.reduce((acc, obj) => (acc = deepMerge(acc, obj)));
        return result;
    }
    _$subtract(...data) {
        const deepMerge = (oldData, newData) => {
            return Object.keys(oldData).reduce((acc, key) => {
                if (typeof newData[key] === "object") {
                    acc[key] = deepMerge(oldData[key], newData[key]);
                }
                else if (newData.hasOwnProperty(key) && !isNaN(parseFloat(newData[key]))) {
                    if (!acc[key])
                        acc[key] = oldData[key] - newData[key];
                    acc[key] = oldData[key] - newData[key];
                }
                return acc;
            }, {});
        };
        const result = data.reduce((acc, obj) => (acc = deepMerge(acc, obj)));
        return result;
    }
    _$multiply(...data) {
        const deepMerge = (oldData, newData) => {
            return Object.keys(oldData).reduce((acc, key) => {
                if (typeof newData[key] === "object") {
                    acc[key] = deepMerge(oldData[key], newData[key]);
                }
                else if (newData.hasOwnProperty(key) && !isNaN(parseFloat(newData[key]))) {
                    if (!acc[key])
                        acc[key] = oldData[key] * newData[key];
                    acc[key] = oldData[key] * newData[key];
                }
                return acc;
            }, {});
        };
        const result = data.reduce((acc, obj) => (acc = deepMerge(acc, obj)));
        return result;
    }
    _$divide(...data) {
        const deepMerge = (oldData, newData) => {
            return Object.keys(oldData).reduce((acc, key) => {
                if (typeof newData[key] === "object") {
                    acc[key] = deepMerge(oldData[key], newData[key]);
                }
                else if (newData.hasOwnProperty(key) && !isNaN(parseFloat(newData[key]))) {
                    if (!acc[key])
                        acc[key] = oldData[key] / newData[key];
                    acc[key] = oldData[key] / newData[key];
                }
                return acc;
            }, {});
        };
        const result = data.reduce((acc, obj) => (acc = deepMerge(acc, obj)));
        return result;
    }
    _$push(oldval, newVal) {
        return mergeAndConcat(oldval, newVal);
    }
}
export class Query {
    data;
    key;
    current;
    _limit;
    old;
    constructor(data) {
        this.old = JSON.parse(JSON.stringify(data));
        this.data = data.map((v, i) => ({ ...v, _$current: v, _$old: this.old[i] }));
        this.key = "";
        this.current = this.data.map((v, i) => ({ ...v, _$current: v, _$old: this.old[i] }));
    }
    add(val) {
        this.current.forEach((d) => {
            d._$current[this.key] += val;
        });
        return this;
    }
    /**
     * Gets back to the top level on the data
     */
    clearQuery() {
        this.current = this.data.map((v, i) => ({ ...v, _$current: v, _$old: this.old[i] }));
        return this;
    }
    delete(key) {
        this.current = this.current.map((v, i) => {
            delete v._$current[key];
            v._$old = v;
            return (v = v);
        });
        return this;
    }
    divide(val) {
        this.current.forEach((d) => {
            d._$current[this.key] /= val;
        });
        return this;
    }
    equals(val) {
        this.current = this.current.filter((v, i) => v._$current[this.key] === val);
        return this;
    }
    /**
     * Check if the data exists on every object
     */
    exists(key) {
        return this.current.every((v) => v[key]);
    }
    find(key, val) {
        const res = [];
        return this.current.forEach((v) => {
            if (v._$current[key] === val)
                res.push(v);
        });
    }
    gt(val) {
        this.current = this.current.filter((v, i) => v._$current[this.key] > val);
        return this;
    }
    gte(val) {
        this.current = this.current.filter((v, i) => v._$current[this.key] >= val);
        return this;
    }
    limit(val) {
        this._limit = val;
        return this;
    }
    lt(val) {
        this.current = this.current.filter((v, i) => v._$current[this.key] < val);
        return this;
    }
    lte(val) {
        this.current = this.current.filter((v, i) => v._$current[this.key] <= val);
        return this;
    }
    multiply(val) {
        this.current.forEach((d) => {
            d._$current[this.key] *= val;
        });
        return this;
    }
    push(val) {
        this.current.forEach((d) => {
            if (Array.isArray(d._$current[this.key]))
                d._$current[this.key].push(val);
        });
        return this;
    }
    splice(start, deleteCount, items) {
        this.current.forEach((d) => {
            if (Array.isArray(d._$current[this.key]))
                d._$current[this.key].splice(start, deleteCount, items);
        });
        return this;
    }
    /**
     * Get the raw data
     */
    raw() {
        const data = this.current.map((v) => (v = v._$current));
        return data;
    }
    update(val) {
        this.current.forEach((d) => {
            d._$current[this.key] = val;
        });
        return this;
    }
    /**
     * Get into a deeper object
     * @param {String} key
     */
    select(key) {
        this.current.map((v, i) => {
            this.current[i]._$current = v[key];
        });
        return this;
    }
    subtract(val) {
        this.current.forEach((d) => {
            d._$current[this.key] -= val;
        });
        return this;
    }
    /**
     * Saves the queries on the data
     */
    save() {
        this.current = this.current.map((v, i) => (v = { ...v._$current }));
        this.data = this.current;
        const res = this.data.map((v, i) => {
            delete v["_$old"]["_$current"];
            delete v["_$current"];
            return (v = { ...v });
        });
        return res;
    }
    /**
     * Get the Latest data
     */
    toJSON() {
        return this.data.map((v, i) => ({ ...v }));
    }
    /**
     * Get the last selected query
     */
    toValue() {
        return this.current
            .map((v, i) => {
            if (i + 1 > this._limit) {
                if (v._$current) {
                    v = { ...v._$current, _$old: v._$old };
                    delete v._$current;
                }
                v._$old = v._$old;
                return (v = v);
            }
        })
            .filter((v) => v !== undefined || null);
    }
    /**
     * Select a object to query next
     * @param {string} key
     */
    where(key) {
        this.key = `${key}`;
        return this;
    }
}
