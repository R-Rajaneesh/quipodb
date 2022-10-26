import _ from "lodash";
import { mergeAndConcat } from "merge-anything";
export default class QuipoDB {
    options;
    storage;
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
        }
        catch (error) {
            error;
        }
        const docs = new this.Docs({ providers: this.providers, collectionName: this.collectionName });
        cb(docs);
        return docs;
    }
    deleteCollection(collectionName, cb = () => { }) {
        try {
            this.providers.forEach(async (provider) => {
                await provider.deleteCollectionProvider(collectionName);
            });
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
    constructor(options) {
        this.options = options;
        this.providers = options.providers;
        this.collectionName = options.collectionName;
    }
    async createDoc(data, cb = () => { }) {
        if (Array.isArray(data)) {
            data.forEach((doc) => {
                this.providers.forEach(async (provider) => {
                    await provider.createDocProvider(doc);
                });
            });
        }
        try {
            this.providers.forEach(async (provider) => {
                await provider.createDocProvider(data);
            });
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
            result = await this.providers[0].getDocProvider(data);
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
            data = _.defaultsDeep(this[atomic](oldDoc, data[atomic]), oldDoc);
        });
        try {
            this.providers.forEach(async (provider) => {
                await provider.updateDocProvider(refData, data);
            });
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
                }
                catch (error) {
                    error;
                }
            },
        };
        cb(func);
        return func;
    }
    $add(...data) {
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
    $subtract(...data) {
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
    $multiply(...data) {
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
    $divide(...data) {
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
    $push(oldval, newVal) {
        return mergeAndConcat(oldval, newVal);
    }
}
