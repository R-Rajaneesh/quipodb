import sqlite from "better-sqlite3";
import fs from "fs-extra";
class Sqlite {
    sqlite;
    options;
    collectionName;
    primaryKey;
    constructor(options) {
        this.options = options;
        this.options.path ??= "./databases/index.sqlite";
        this.options.dev ??= false;
        this.options.primaryKey ??= "_ID";
        try {
            fs.ensureFileSync(`${this.options.path}`);
        }
        catch (error) {
            if (this.options.dev)
                console.log(error);
        }
        this.sqlite = new sqlite(`${this.options.path}`, { fileMustExist: false });
    }
    mapValues(val, index, arr) {
        const tv = typeof val;
        if (Array.isArray(val) || tv === "object" || tv === "function" || tv === "symbol" || tv === "undefined" || tv === "string")
            return JSON.stringify(val);
        return val;
    }
    typeof(val) {
        const tyof = typeof val;
        if (tyof === "bigint")
            return "INTEGER";
        if (tyof === "number")
            return "INTEGER";
        if (tyof === "string")
            return "TEXT";
        if (tyof === "boolean")
            return "NUMERIC";
        if (tyof === "object")
            return "BLOB";
        if (tyof === "undefined")
            return "NULL";
        if (tyof === "function")
            return "NONE";
        if (tyof === "symbol")
            return "NONE";
        return "NONE";
    }
    createCollectionProvider(collectionName) {
        this.collectionName = collectionName;
        try {
            this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS ${this.collectionName} (${this.options.primaryKey} NONE NOT NULL PRIMARY KEY)`).run();
        }
        catch (error) {
            if (this.options.dev)
                console.log(error);
        }
    }
    createColumnProvider(columnName, dataType = "NONE") {
        try {
            this.sqlite.prepare(`ALTER TABLE ${this.collectionName} ADD ${columnName} ${dataType}`).run();
        }
        catch (error) {
            if (this.options.dev)
                console.log(error);
        }
    }
    createDocProvider(data) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => this.mapValues(v));
        const COLUMNS = this.sqlite.prepare(`PRAGMA table_info(${this.collectionName})`).all();
        try {
            const docs = this.getDocProvider(data);
            if (!docs || docs.length === 0) {
                KEYS.forEach((key, i) => {
                    if (!COLUMNS.map((v) => v.name).includes(key))
                        this.createColumnProvider(key, this.typeof(VALUES[i]));
                });
                this.sqlite.prepare(`INSERT INTO ${this.collectionName} (${KEYS.join(", ")}) VALUES (${VALUES.map((v) => (v = "(?)")).join(", ")})`).run(VALUES);
            }
        }
        catch (error) {
            if (this.options.dev)
                console.log(error);
        }
    }
    deleteCollectionProvider(collectionName) {
        try {
            this.sqlite.prepare(`DROP TABLE ${collectionName}`);
        }
        catch (error) {
            if (this.options.dev)
                console.log(error);
        }
    }
    deleteDocProvider(data) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => this.mapValues(v));
        this.sqlite.prepare(`DELETE FROM ${this.collectionName} WHERE ${KEYS.map((k, i) => (k += ` = (?)`))}`).run(VALUES);
    }
    getCollectionProvider(collectionName) {
        const result = this.sqlite.prepare(`SELECT * FROM ${collectionName}`).all();
        result.forEach((res, i) => {
            Object.values(res).forEach((r, ri) => {
                try {
                    if (typeof r === "string" && r.startsWith("'") && r.endsWith("'"))
                        r = r.replace("'", "").split("").reverse().join("").replace("'", "").split("").reverse().join("");
                    res[`${Object.keys(res)[ri]}`] = JSON.parse(r);
                }
                catch {
                    res[`${Object.keys(res)[ri]}`] = r;
                }
            });
            result[`${Object.keys(result)[i]}`] = res;
        });
        return result;
    }
    getCollectionsProvider() {
        const result = this.sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
        return result.map((c) => c.name);
    }
    getDocProvider(data) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => this.mapValues(v));
        let result;
        try {
            result = this.sqlite.prepare(`SELECT * FROM ${this.collectionName} WHERE ${KEYS.map((k) => (k += `=(?)`)).join(" AND ")}`).get(...VALUES);
        }
        catch (error) {
            if (this.options.dev)
                console.log(error);
        }
        if (!result)
            return undefined;
        Object.values(result).forEach((r, ri) => {
            try {
                if (typeof r === "string" && r.startsWith("'") && r.endsWith("'"))
                    r = r.replace("'", "").split("").reverse().join("").replace("'", "").split("").reverse().join("");
                result[`${Object.keys(result)[ri]}`] = JSON.parse(r);
            }
            catch {
                result[`${Object.keys(result)[ri]}`] = r;
            }
        });
        return result;
    }
    updateDocProvider(refData, data) {
        const KEYS = Object.keys(data);
        const VALUES = Object.values(data).map((v) => this.mapValues(v));
        const COLUMNS = this.sqlite.prepare(`PRAGMA table_info(${this.collectionName})`).all();
        KEYS.forEach(async (key, i) => {
            if (!COLUMNS.map((v) => v.name).includes(key))
                this.createColumnProvider(key, this.typeof(VALUES[i]));
        });
        const args = KEYS.map((v, i) => (v += ` = (?)`)).join(", ");
        const Data = refData[`${this.options.primaryKey}`] ? refData : this.getDocProvider(refData);
        try {
            this.sqlite.prepare(`UPDATE ${this.collectionName} SET ${args} WHERE ${this.options.primaryKey} = (?)`).run(VALUES, Data[`${this.options.primaryKey}`]);
        }
        catch (error) {
            if (this.options.dev)
                console.log(error);
        }
    }
}
export default Sqlite;
