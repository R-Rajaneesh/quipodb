import sqlite from "better-sqlite3";
import fs from "fs-extra";
export default class Sqlite {
    sqlite;
    options;
    collectionName;
    primaryKey;
    constructor(options) {
        this.options = options;
        this.options.path ??= "./databases/index.sqlite";
        this.primaryKey = this.options.primaryKey;
        if (!this.primaryKey)
            throw new QuipodbSqliteError("PRIMARY KEY is expected", "@quipodb/sqlite -> Missing property");
        try {
            fs.ensureFileSync(`${this.options.path}`);
        }
        catch { }
        this.sqlite = new sqlite(`${this.options.path}`, { fileMustExist: false });
    }
    createCollectionProvider(collectionName, cb = () => { }) {
        this.collectionName = collectionName;
        try {
            this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS ${collectionName} (${this.primaryKey} NONE PRIMARY KEY NOT NULL)`).run();
        }
        catch { }
    }
    createColumnProvider(columnName, dataType = "NONE") {
        try {
            this.sqlite.prepare(`ALTER TABLE ${this.collectionName} ADD ${columnName} ${dataType}`).run();
        }
        catch { }
    }
    createDocProvider(data, cb = () => { }) {
        const KEYS = Object.keys(data);
        let result;
        const VALUES = Object.values(data).map((v) => JSON.stringify(v));
        const COLUMNS = this.sqlite.prepare(`PRAGMA table_info(${this.collectionName})`).all();
        KEYS.forEach(async (key) => {
            if (!COLUMNS.map((v) => v.name).includes(key))
                this.createColumnProvider(key, "NONE");
        });
        try {
            if (!this.getDocProvider(data)) {
                this.sqlite.prepare(`INSERT INTO ${this.collectionName} (${KEYS.join(", ")}) VALUES (${VALUES.map((v) => (v = "(?)")).join(",")})`).run(...VALUES);
            }
            else {
                this.updateDocProvider(this.getDocProvider(data), data);
                result = this.getDocProvider(data);
            }
        }
        catch { }
        cb(result);
        return result;
    }
    deleteCollectionProvider(collectionName, cb = () => { }) {
        this.sqlite.prepare(`DROP TABLE ${collectionName}`);
        cb();
        return;
    }
    deleteDocProvider(data, cb = () => { }) {
        this.sqlite.prepare(`DELETE FROM ${this.collectionName} WHERE ${this.primaryKey} = (?)`).run(this.getDocProvider(data)[this.primaryKey]);
        cb();
        return;
    }
    getCollectionProvider(collectionName, cb = () => { }) {
        const data = this.sqlite.prepare(`SELECT * FROM ${collectionName}`).all();
        cb(data);
        return data;
    }
    getDocProvider(data, cb = () => { }) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => JSON.stringify(v));
        const result = this.sqlite.prepare(`SELECT * from ${this.collectionName} WHERE ${KEYS.map((k, i) => (k += ` = (?)`))}`).get(...VALUES);
        try {
            Object.values(result).forEach((val, index) => {
                result[Object.keys(result)[index]] = JSON.parse(val);
            });
        }
        catch (e) {
            console.log(e);
        }
        cb(result);
        return result;
    }
    getCollectionsProvider(cb = () => { }) {
        cb();
        return this.sqlite
            .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
            .all()
            .map((c) => c.name);
    }
    updateDocProvider(refData, data, cb = () => { }) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => JSON.stringify(v));
        const COLUMNS = this.sqlite.prepare(`PRAGMA table_info(${this.collectionName})`).all();
        KEYS.forEach(async (key) => {
            if (!COLUMNS.map((v) => v.name).includes(key))
                this.createColumnProvider(key, "NONE");
        });
        const args = KEYS.map((v, i) => (v += ` = (?)`)).join(", ");
        try {
            this.sqlite.prepare(`UPDATE ${this.collectionName} SET ${args} WHERE ${this.primaryKey} = ${refData[`${this.primaryKey}`]}`).run(...VALUES);
        }
        catch { }
    }
}
class QuipodbSqliteError extends Error {
    constructor(message, name = null) {
        super();
        Error.captureStackTrace(this, this.constructor);
        this.name = name ?? "@quipodb/sqlite";
        this.message = message;
    }
}
