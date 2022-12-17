import _ from "lodash";
import fs from "fs-extra";
export class JsonStore {
    collectionName;
    storage;
    constructor(options) {
        if (!fs.existsSync(options.path)) {
            if (options.path.replace(/.+(\.).+$/g, ""))
                fs.ensureDirSync(options.path.replace(/.+(\.).+$/g, ""));
            fs.ensureFileSync(options.path);
            fs.writeJSONSync(options.path, {});
        }
        try {
            this.storage = fs.readJSONSync(options.path) ?? {};
        }
        catch {
            fs.writeJSONSync(options.path, {});
            this.storage = fs.readJSONSync(options.path) ?? {};
        }
        process
            .prependListener("exit", (code) => {
            fs.writeJSONSync(options.path, this.storage);
            process.exit(1);
        })
            .prependListener("beforeExit", (code) => {
            fs.writeJSONSync(options.path, this.storage);
            process.exit(1);
        });
    }
    async createCollectionProvider(collectionName, cb = () => { }) {
        this.collectionName = collectionName;
        this.storage[collectionName] = [];
        cb(this.storage[collectionName]);
        return this.storage[collectionName];
    }
    async createDocProvider(data, cb = () => { }) {
        this.storage[this.collectionName].push(data);
        cb(data);
        return data;
    }
    async deleteCollectionProvider(collectionName, cb = () => { }) {
        delete this.storage[collectionName];
        cb();
        return;
    }
    async deleteDocProvider(data, cb = () => { }) {
        this.storage[this.collectionName].splice(_.findIndex(this.storage[this.collectionName], data), 1);
        cb();
        return;
    }
    async getCollectionProvider(collectionName, cb = () => { }) {
        const data = this.storage[collectionName];
        cb(data);
        return data;
    }
    async getCollectionsProvider(cb = () => { }) {
        const data = this.storage;
        cb(data);
        return data;
    }
    async getDocProvider(data, cb = () => { }) {
        const Data = _.find(this.storage[this.collectionName], data);
        cb(Data);
        return Data;
    }
    async updateDocProvider(refData, data, cb = () => { }) {
        const docIndex = _.findIndex(this.storage[this.collectionName], refData);
        const Data = _.defaultsDeep(this.storage[this.collectionName][docIndex], data);
        this.storage[this.collectionName][docIndex] = Data;
        cb(Data);
        return Data;
    }
}
