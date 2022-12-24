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
        let docs = new this.Docs({ providers: this.providers, collectionName: `${collectionName}`, storage: this.storage, cache: this.options.cache });
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
export class Docs {
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
                        await provider.createDocProvider(this.collectionName, doc);
                    });
                    if (this.options.cache)
                        this.storage[`${this.collectionName}`].push(doc);
                });
            }
            this.providers.forEach(async (provider) => {
                await provider.createDocProvider(this.collectionName, data);
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
                await provider.deleteDocProvider(this.collectionName, data);
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
            const Data = await this.providers[0].getDocProvider(this.collectionName, data);
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
                await provider.updateDocProvider(this.collectionName, oldDoc, data);
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
    _limit;
    constructor(data) {
        this.data = data.map((value, index, array) => {
            value["_$old"] = JSON.parse(JSON.stringify(value));
            value["_$current"] = value;
            return value;
        });
    }
    /**
     * Add a number to the selected key
     * @param {number} value
     */
    add(value) {
        this.data.forEach((data) => {
            data["_$current"][`${this.key}`] += value;
        });
        return this;
    }
    /**
     * Clear the querying data and fallback to the top-level of the object
     */
    clearQuery() {
        this.data = this.data.map((value, index) => {
            const val = JSON.parse(JSON.stringify(value));
            const old = JSON.parse(JSON.stringify(value["_$old"]));
            delete value["_$old"];
            return { ...val, _$current: value, _$old: old };
        });
        return this;
    }
    /**
     * Divide a number to the selected key
     * @param {number} value
     */
    divide(value) {
        this.data.forEach((data) => {
            data["_$current"][`${this.key}`] /= value;
        });
        return this;
    }
    /**
     * Check if the value matches
     * @param  {any} value
     */
    equals(value) {
        this.data = this.data.filter((val) => val["_$current"][`${this.key}`] === value);
        return this;
    }
    /**
     * Get the data from the key and value
     * @param  {string} key
     * @param  {any} value
     */
    find(key, value) {
        return this.data.forEach((val, index, array) => this.data[index]["_$current"][`${key}`] === value);
    }
    /**
     * Check if greater
     * @param  {number} val
     */
    gt(val) {
        this.data = this.data.filter((value) => value["_$current"][`${this.key}`] > val);
        return this;
    }
    /**
     * Check if greater or equal
     * @param  {number} val
     */
    gte(val) {
        this.data = this.data.filter((value) => value["_$current"][`${this.key}`] >= val);
        return this;
    }
    /**
     * Limit the number of outputs
     * @param  {number} val
     */
    limit(val) {
        this._limit = val;
        return this;
    }
    /**
     * Check if lesser
     * @param  {number} val
     */
    lt(val) {
        this.data = this.data.filter((value) => value["_$current"][`${this.key}`] < val);
        return this;
    }
    /**
     * Check if lesser or equal
     * @param  {number} val
     */
    lte(val) {
        this.data = this.data.filter((value) => value["_$current"][`${this.key}`] <= val);
        return this;
    }
    /**
     * Multiply a number to the selected key
     * @param {number} value
     */
    multiply(value) {
        this.data.forEach((data) => {
            data["_$current"][`${this.key}`] *= value;
        });
        return this;
    }
    /**
     * Push elements into potentially possible arrays
     * @param  {any[]} ...value
     */
    push(...value) {
        this.data.forEach((data) => {
            if (Array.isArray(data["_$current"][`${this.key}`]))
                data["_$current"][`${this.key}`].push(...value);
        });
        return this;
    }
    /**
     * Get the raw data
     */
    raw() {
        return this.data;
    }
    /**
     * Save the data to save to the database
     */
    save() {
        return this.data.map((value, index, array) => {
            delete value["_$old"]?.["_$current"];
            delete value["_$current"];
            return value;
        });
    }
    /**
     * Get deeper into the object
     * @param  {string} key
     */
    select(key) {
        this.data.map((val, index) => {
            val["_$current"] = val?.["_$current"][`${key}`];
        });
        return this;
    }
    /**
     * Remove (or replace) items from an array
     * @param  {number} start
     * @param  {number} [deleteCount]
     * @param  {any[]} [items]
     */
    splice(start, deleteCount, items) {
        this.data.forEach((data) => {
            if (Array.isArray(data["_$current"][`${this.key}`]))
                data["_$current"][`${this.key}`].splice(start, deleteCount, items);
        });
        return this;
    }
    /**
     * Subtract a number to the selected key
     * @param {number} value
     */
    subtract(value) {
        this.data.forEach((data) => {
            data["_$current"][`${this.key}`] -= value;
        });
        return this;
    }
    /**
     * Get the entire data from the top-level
     */
    toJSON() {
        return this.data.map((value, index, array) => {
            delete value["_$old"];
            return value;
        });
    }
    /**
     * Get the last selected data
     */
    toValue() {
        return this.data
            .map((value, index, array) => {
            if (this._limit && index + 1 > this._limit)
                return value["_$current"];
            return value["_$current"];
        })
            .filter((value, index, array) => value !== undefined || null);
    }
    /**
     * Update the entire value with a new one
     * @param  {any} value
     */
    update(value) {
        this.data.forEach((data) => {
            data["_$current"][`${this.key}`] = value;
        });
        return this;
    }
    /**
     * Select data to query on next
     * @param  {string} key
     * @param  {any} [value]
     */
    where(key, value) {
        if (value)
            this.data = this.data.filter((val, i) => val["_$current"][`${key}`] === value);
        else
            this.key = key;
        return this;
    }
}
