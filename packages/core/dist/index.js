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
    createCollection(collectionName, cb = () => { }) {
        this.collectionName = collectionName;
        try {
            this.providers.forEach(async (provider) => {
                await provider.createCollectionProvider(collectionName, cb);
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
    async createDoc(data, cb = () => { }) {
        if (Array.isArray(data)) {
            data.forEach((doc) => {
                this.providers.forEach(async (provider) => {
                    await provider.createDocProvider(doc);
                });
                if (this.options.cache)
                    this.storage[`${this.collectionName}`].push(doc);
            });
        }
        try {
            this.providers.forEach(async (provider) => {
                await provider.createDocProvider(data);
            });
            if (this.options.cache)
                this.storage[`${this.collectionName}`].push(data);
        }
        catch (error) {
            error;
        }
        cb(data);
        return data;
    }
    async deleteDoc(data, cb = () => { }) {
        if (typeof data === "function")
            data = data(await this.providers[0].getCollectionProvider(this.collectionName));
        try {
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
    async findDoc(data, cb = () => { }) {
        let result = {};
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
    async getRaw(cb = () => { }) {
        const data = await this.providers[0].getCollectionProvider(`${this.collectionName}`);
        cb(data);
        return data;
    }
    async updateDoc(refData, data, cb = () => { }) {
        const oldDoc = this.findDoc(refData);
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
                await provider.updateDocProvider(refData, data);
            });
            this.storage[`${this.collectionName}`][_.findIndex(this.storage[`${this.collectionName}`], refData)] = data;
        }
        catch (error) {
            error;
        }
        cb(storage[index]);
        return storage[index];
    }
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
    constructor(Data) {
        this.data = Data;
        this.key = "";
        this.current = this.data.map((v) => ({ ...v, _$current: v }));
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
        this.current = this.data.map((v) => ({ ...v, _$current: v }));
        return this;
    }
    delete(key) {
        this.current = this.current.map((v, i) => {
            delete v._$current[key];
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
        this._limit = val + 1;
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
    push(arr) {
        arr.forEach((val) => {
            this.current.forEach((d) => {
                if (Array.isArray(d._$current[this.key]))
                    d._$current[this.key].push(val);
            });
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
        this.current = this.current.map((v) => (v = v._$current));
        this.data = this.current;
        return this;
    }
    /**
     * Get the Latest data
     */
    toJSON() {
        return this.data;
    }
    /**
     * Get the last selected query
     */
    toValue() {
        return this.current.map((v, i) => {
            if (this._limit < i)
                return;
            if (v._$current)
                delete v._$current;
            return (v = v);
        });
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
