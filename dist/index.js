import BSQLite from "better-sqlite3";
import fs from "fs-extra";
import _ from "lodash";
import { mergeAndConcat } from "merge-anything";
class QuipoDB {
    options;
    storage;
    sqlite;
    Doc;
    ready;
    constructor(options = { path: "./databases/index.sqlite", inMemory: true }) {
        options = _.defaultsDeep(options, {
            path: "./databases/index.sqlite",
            inMemory: true,
        });
        this.options = options;
        fs.ensureFileSync(`${this.options.path}`);
        this.storage = {};
        this.sqlite = new SQLite({ fileName: `${this.options.path}` });
        this.ready = false;
        // Set-up
        if (this.options.inMemory) {
            this.sqlite.provider
                .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
                .all()
                .forEach((table) => {
                this.storage[table.name] = [];
                this.sqlite.provider
                    .prepare(`SELECT * FROM ${table.name}`)
                    .all()
                    .forEach((unSerilizedDoc, index) => {
                    let data = unSerilizedDoc;
                    try {
                        Object.values(data).forEach((val, index) => {
                            data[Object.keys(data)[index]] = JSON.parse(val);
                        });
                    }
                    catch { }
                    this.storage[table.name].push(data);
                });
            });
            this.ready = true;
        }
        else {
            this.ready = true;
        }
        // Time-to-Live (ttl)
        setInterval(() => {
            Object.values(this.storage).forEach((collection) => {
                collection.forEach((doc, index) => {
                    if (!doc.ttl)
                        return;
                    if (Date.now() > doc.ttl)
                        delete collection[index];
                });
            });
        }, 5000);
    }
    save() { }
    createCollection(collectionName, primaryKey, cb = () => { }) {
        if (!primaryKey)
            throw new Error("Primary key must be provided");
        if (this.ready && !this.storage[collectionName]) {
            this.storage[collectionName] = [];
        }
        if (this.options.inMemory)
            this.sqlite.createTable(collectionName, primaryKey, "NONE");
        cb(new Doc(this.storage, collectionName, primaryKey, this.options, this.sqlite));
        return new Doc(this.storage, collectionName, primaryKey, this.options, this.sqlite);
    }
    deleteCollection(collectionName, cb = () => { }) {
        delete this.storage[collectionName];
        if (this.options.inMemory)
            this.sqlite.deleteTable(collectionName);
        cb();
        return;
    }
    getCollection(collectionName, cb = () => { }) {
        cb(this.storage[collectionName]);
        return this.storage[collectionName];
    }
}
// Document
class Doc {
    storage;
    collectionName;
    primaryKey;
    options;
    sqlite;
    constructor(storage, collectionName, primaryKey, options, sqlite) {
        this.options = options;
        this.storage = storage;
        this.sqlite = sqlite;
        this.primaryKey = primaryKey;
        this.collectionName = collectionName;
    }
    createDoc(data, cb = () => { }) {
        if (!this.storage[this.collectionName].find((doc) => doc[this.primaryKey] === data[this.primaryKey])) {
            if (Array.isArray(data)) {
                if (!data.every((entry) => entry[this.primaryKey]))
                    throw new Error('"primary key" must be provided in all documents');
                data.map((v) => ({ ...v, _id: 0 }));
                if (this.options.inMemory) {
                    data.forEach((entry) => {
                        this.sqlite.setRow(this.collectionName, _.defaultsDeep({ _id: this.storage[this.collectionName].length + 1 }, entry));
                    });
                }
                data.forEach((entry) => {
                    this.storage[this.collectionName].push(_.defaultsDeep({ _id: this.storage[this.collectionName].length + 1 }, entry));
                });
            }
            else if (typeof data === "object") {
                if (!data[this.primaryKey])
                    throw new Error('"primary key" must be provided in the document');
                data._id = 0;
                if (this.options.inMemory) {
                    this.sqlite.setRow(this.collectionName, _.defaultsDeep({ _id: this.storage[this.collectionName].length + 1 }, data));
                }
                this.storage[this.collectionName].push(_.defaultsDeep({ _id: this.storage[this.collectionName].length + 1 }, data));
            }
        }
        cb(this);
        return this;
    }
    deleteDoc(data, cb = () => { }) {
        if (typeof data === "function") {
            if (this.options.inMemory)
                this.sqlite.deleteRow(this.collectionName, data(this.storage[this.collectionName]));
            _.remove(this.storage[this.collectionName], data(this.storage[this.collectionName]));
        }
        else if (typeof data === "object") {
            if (this.options.inMemory)
                this.sqlite.deleteRow(this.collectionName, data);
            _.remove(this.storage[this.collectionName], data);
        }
        cb();
        return;
    }
    getDoc(data, cb = () => { }) {
        let result;
        if (typeof data === "function") {
            result = _.find(this.storage[this.collectionName], data(this.storage[this.collectionName]));
        }
        else if (typeof data === "object") {
            result = _.find(this.storage[this.collectionName], data);
        }
        cb(result);
        return result;
    }
    getRaw(cb = () => { }) {
        cb(this.storage);
        return this.storage;
    }
    hasDoc(data, cb = () => { }) {
        const has = Boolean(this.getDoc(data, cb));
        cb(has);
        return has;
    }
    updateDoc(data, value, cb = () => { }) {
        const oldVal = this.getDoc(data);
        if (!oldVal) {
            cb(this);
            return this;
        }
        if (typeof value === "function") {
            let newValue = _.defaultsDeep(value(oldVal), oldVal);
            const index = this.storage[this.collectionName].findIndex((doc) => value(doc));
            Object.keys(value(oldVal))
                .filter((v) => v.startsWith("$"))
                .forEach((atomic) => {
                newValue = _.defaultsDeep(new Query()[atomic](oldVal, value(oldVal)[atomic]), oldVal);
            });
            this.storage[this.collectionName][index] = _.defaultsDeep(newValue, oldVal);
            if (this.options.inMemory)
                this.sqlite.updateRow(this.collectionName, this.primaryKey, _.defaultsDeep(newValue, oldVal));
        }
        else if (typeof value === "object") {
            let newValue = _.defaultsDeep(value, oldVal);
            Object.keys(value)
                .filter((v) => v.startsWith("$"))
                .forEach((atomic) => {
                newValue = _.defaultsDeep(new Query()[atomic](oldVal, value[atomic]), oldVal);
            });
            const index = this.storage[this.collectionName].findIndex((doc) => doc[this.primaryKey] === data[this.primaryKey]);
            this.storage[this.collectionName][index] = _.defaultsDeep(newValue, oldVal);
            if (this.options.inMemory)
                this.sqlite.updateRow(this.collectionName, this.primaryKey, _.defaultsDeep(newValue, oldVal));
        }
        cb(this);
        return this;
    }
}
class Query {
    constructor() { }
    where(query) {
        _.get;
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
// SQLite Provider
class SQLite {
    options;
    provider;
    constructor(options = { fileName: "./databases/index.sqlite" }) {
        this.options = options;
        this.provider = new BSQLite(`${options.fileName}`, { fileMustExist: false });
    }
    createTable(tableName, primaryColumn, dataType = "TEXT") {
        try {
            this.provider.prepare(`CREATE TABLE IF NOT EXISTS ${tableName} (${primaryColumn} ${dataType} PRIMARY KEY UNIQUE)`).run();
        }
        catch { }
    }
    createColumn(tableName, columnName, dataType = "NONE") {
        try {
            this.provider.prepare(`ALTER TABLE ${tableName} ADD ${columnName} ${dataType}`).run();
        }
        catch { }
    }
    deleteTable(tableName, cb = () => { }) {
        this.provider.prepare(`DROP TABLE (?)`).run(tableName);
        cb();
        return;
    }
    deleteRow(tableName, data, cb = () => { }) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => JSON.stringify(v));
        const args = KEYS.map((v, i) => (v += ` = (?)`)).join(" OR ");
        try {
            this.provider.prepare(`DELETE FROM ${tableName} WHERE ${args}`).run(...VALUES);
        }
        catch { }
        cb();
        return;
    }
    setRow(tableName, data, cb = () => { }) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => JSON.stringify(v));
        const COLUMNS = this.provider.prepare(`PRAGMA table_info(${tableName})`).all();
        KEYS.forEach(async (key) => {
            if (!COLUMNS.map((v) => v.name).includes(key))
                this.createColumn(tableName, key, "NONE");
        });
        try {
            this.provider.prepare(`INSERT INTO ${tableName} (${KEYS.join(", ")}) VALUES (${VALUES.map((v) => (v = "(?)")).join(",")})`).run(...VALUES);
        }
        catch {
            (async () => {
                this.updateRow(tableName, COLUMNS.filter((v) => v.pk === 1)[0].name, data);
            })();
        }
        let result = {};
        (async () => {
            result = await this.getRow(tableName, data);
        })();
        cb(result);
        return result;
    }
    updateRow(tableName, primaryColumn, data, cb = () => { }) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => JSON.stringify(v));
        const COLUMNS = this.provider.prepare(`PRAGMA table_info(${tableName})`).all();
        KEYS.forEach(async (key) => {
            if (!COLUMNS.map((v) => v.name).includes(key))
                this.createColumn(tableName, key, "NONE");
        });
        if (KEYS.filter((v) => v !== primaryColumn).length === 0) {
            cb({});
            return {};
        }
        this.provider
            .prepare(`UPDATE ${tableName} SET ${KEYS.filter((v) => v !== primaryColumn)
            .map((v) => (v += " = (?)"))
            .join(", ")} WHERE ${primaryColumn}=(?)`)
            .run(...VALUES.filter((v, i) => i !== KEYS.findIndex((v) => v === primaryColumn)), data[primaryColumn]);
        let result = {};
        (async () => {
            result = await this.getRow(tableName, data);
        })();
        cb(result);
        return result;
    }
    getRow(tableName, data, cb = () => { }) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => JSON.stringify(v));
        const args = KEYS.map((v, i) => (v += ` = (?)`)).join(" OR ");
        const result = this.provider.prepare(`SELECT * from ${tableName} WHERE ${args}`).get(...VALUES);
        try {
            Object.values(result).forEach((val, index) => {
                result[Object.keys(result)[index]] = JSON.parse(val);
            });
        }
        catch { }
        cb(result);
        return result;
    }
    hasRow(tableName, data, cb = () => { }) {
        let result = false;
        (async () => {
            result = Boolean(await this.getRow(tableName, data));
        })();
        cb(result);
        return result;
    }
}
export default QuipoDB;
