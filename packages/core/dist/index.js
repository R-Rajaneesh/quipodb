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
        // Time-To-Live
        setInterval(() => {
            this.providers.forEach(async (provider) => {
                await provider.getCollectionsProvider().forEach(async (collectionName) => {
                    await provider.getCollectionProvider(collectionName).forEach(async (doc) => {
                        if (doc.ttl <= Date.now()) {
                            await provider.deleteDocProvider(doc);
                        }
                    });
                });
            });
        }, 5000);
    }
    createCollection(collectionName, cb = () => { }) {
        this.collectionName = collectionName;
        this.providers.forEach(async (provider) => {
            await provider.createCollectionProvider(collectionName, cb);
        });
        const docs = new this.Docs({ providers: this.providers, collectionName: this.collectionName });
        cb(docs);
        return docs;
    }
    deleteCollection(collectionName, cb = () => { }) {
        this.providers.forEach(async (provider) => {
            await provider.deleteCollectionProvider(collectionName);
        });
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
    createDoc(data, cb = () => { }) {
        if (Array.isArray(data)) {
            data.forEach((doc) => {
                this.providers.forEach(async (provider) => {
                    await provider.createDocProvider(doc);
                });
            });
        }
        this.providers.forEach(async (provider) => {
            await provider.createDocProvider(data);
        });
        cb(data);
        return data;
    }
    deleteDoc(data, cb = () => { }) {
        if (typeof data === "function")
            data = data(this.providers[0].getCollectionProvider(this.collectionName));
        this.providers.forEach(async (provider) => {
            await provider.deleteDocProvider(data);
        });
    }
    findDoc(data, cb = () => { }) {
        let result = {};
        if (typeof data === "function")
            data = data(this.providers[0].getCollectionProvider(this.collectionName)) ?? {};
        result = this.providers[0].getDocProvider(data);
        cb(result);
        return result;
    }
    findOrcreateDoc(data, cb = () => { }) {
        let result = {};
        const Data = this.findDoc(data);
        if (Data)
            result = Data;
        else {
            result = this.createDoc(data);
        }
        cb(result);
        return result;
    }
    getOrcreateDoc(data, cb = () => { }) {
        return this.findOrcreateDoc(data, cb);
    }
    getRaw(cb = () => { }) {
        const data = this.providers[0].getCollectionProvider(this.collectionName);
        cb(data);
        return data;
    }
    getDoc(data, cb = () => { }) {
        return this.findDoc(data, cb);
    }
    updateDoc(refData, data, cb = () => { }) {
        const oldDoc = this.findDoc(refData);
        const storage = this.providers[0].getCollectionProvider(this.collectionName);
        const index = storage.findIndex((doc) => doc === oldDoc);
        if (typeof data === "function")
            data = data(storage[index]);
        Object.keys(data)
            .filter((v) => v.startsWith("$"))
            .forEach((atomic, i) => {
            data = _.defaultsDeep(this[atomic](oldDoc, data[atomic]), oldDoc);
        });
        this.providers.forEach(async (provider) => {
            await provider.updateDocProvider(refData, data);
        });
        cb(storage[index]);
        return storage[index];
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
