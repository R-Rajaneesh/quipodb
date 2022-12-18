import sqlite from "better-sqlite3";
import fs from "fs-extra";
interface sqliteConstructor {
  primaryKey: string;
  path: String;
  dev?: boolean;
}
type fn = (data: Object[] | Object) => void;
interface document {
  [key: string]: string | number | Object | Array<any> | any;
}
interface storage {
  [collectioName: string]: document[];
}
class Sqlite {
  public sqlite: sqlite.Database;
  private options: sqliteConstructor;
  private collectionName: string;
  public primaryKey: String;
  constructor(options: sqliteConstructor) {
    this.options = options;
    this.options.path ??= "./databases/index.sqlite";
    this.options.dev ??= false;
    this.options.primaryKey ??= "_ID";

    try {
      fs.ensureFileSync(`${this.options.path}`);
    } catch (error) {
      if (this.options.dev) console.log(error);
    }
    this.sqlite = new sqlite(`${this.options.path}`, { fileMustExist: false });
  }
  private mapValues(val: any, index?: number, arr?: any[]) {
    const tv = typeof val;
    if (Array.isArray(val) || tv === "object" || tv === "function" || tv === "symbol" || tv === "undefined" || tv === "string") return JSON.stringify(val);
    return val;
  }
  private typeof(val: any) {
    const tyof = typeof val;
    if (tyof === "bigint") return "INTEGER";
    if (tyof === "number") return "INTEGER";
    if (tyof === "string") return "TEXT";
    if (tyof === "boolean") return "NUMERIC";
    if (tyof === "object") return "BLOB";
    if (tyof === "undefined") return "NULL";
    if (tyof === "function") return "NONE";
    if (tyof === "symbol") return "NONE";
    return "NONE";
  }
  public createCollectionProvider(collectionName: String) {
    collectionName = `${collectionName}`;
    try {
      this.sqlite.prepare(`CREATE TABLE IF NOT EXISTS ${collectionName} (${this.options.primaryKey} NONE NOT NULL PRIMARY KEY)`).run();
    } catch (error) {
      if (this.options.dev) console.log(error);
    }
  }
  private createColumnProvider(
    collectionName: String,
    columnName: string,
    dataType: "TEXT" | "REAL" | "INTEGER" | "BLOB" | "NULL" | "NONE" | "NUMERIC" = "NONE",
  ) {
    try {
      this.sqlite.prepare(`ALTER TABLE ${collectionName} ADD ${columnName} ${dataType}`).run();
    } catch (error) {
      if (this.options.dev) console.log(error);
    }
  }
  public createDocProvider(collectionName: String, data: document) {
    const KEYS = Object.keys(data);
    const VALUES = Object.values(data).map((v) => this.mapValues(v));
    const COLUMNS = this.sqlite.prepare(`PRAGMA table_info(${collectionName})`).all();
    try {
      const docs = this.getDocProvider(collectionName, data);
      if (!docs || docs.length === 0) {
        KEYS.forEach((key, i) => {
          if (!COLUMNS.map((v: any) => v.name).includes(key)) this.createColumnProvider(collectionName, key, this.typeof(VALUES[i]));
        });
        this.sqlite.prepare(`INSERT INTO ${collectionName} (${KEYS.join(", ")}) VALUES (${VALUES.map((v) => (v = "(?)")).join(", ")})`).run(VALUES);
      }
    } catch (error) {
      if (this.options.dev) console.log(error);
    }
  }
  public deleteCollectionProvider(collectionName: String) {
    try {
      this.sqlite.prepare(`DROP TABLE ${collectionName}`);
    } catch (error) {
      if (this.options.dev) console.log(error);
    }
  }
  public deleteDocProvider(collectionName: String, data: document) {
    const KEYS = Object.keys(data);
    const VALUES = Object.values(data).map((v) => this.mapValues(v));
    this.sqlite.prepare(`DELETE FROM ${collectionName} WHERE ${KEYS.map((k, i) => (k += ` = (?)`))}`).run(VALUES);
  }
  public getCollectionProvider(collectionName: String) {
    const result = this.sqlite.prepare(`SELECT * FROM ${collectionName}`).all();
    result.forEach((res: Object, i: number) => {
      Object.values(res).forEach((r: any, ri: number) => {
        try {
          if (typeof r === "string" && r.startsWith("'") && r.endsWith("'"))
            r = r.replace("'", "").split("").reverse().join("").replace("'", "").split("").reverse().join("");
          res[`${Object.keys(res)[ri]}`] = JSON.parse(r);
        } catch {
          res[`${Object.keys(res)[ri]}`] = r;
        }
      });
      result[`${Object.keys(result)[i]}`] = res;
    });
    return result;
  }
  public getCollectionsProvider() {
    const result = this.sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    return result.map((c: any) => c.name);
  }
  public getDocProvider(collectionName: String, data: document) {
    const KEYS = Object.keys(data);
    const VALUES = Object.values(data).map((v) => this.mapValues(v));
    let result: any;
    try {
      result = this.sqlite.prepare(`SELECT * FROM ${collectionName} WHERE ${KEYS.map((k) => (k += `=(?)`)).join(" AND ")}`).get(...VALUES);
    } catch (error) {
      if (this.options.dev) console.log(error);
    }
    if (!result) return undefined;
    Object.values(result).forEach((r: any, ri: number) => {
      try {
        if (typeof r === "string" && r.startsWith("'") && r.endsWith("'"))
          r = r.replace("'", "").split("").reverse().join("").replace("'", "").split("").reverse().join("");
        result[`${Object.keys(result)[ri]}`] = JSON.parse(r);
      } catch {
        result[`${Object.keys(result)[ri]}`] = r;
      }
    });
    return result;
  }
  public updateDocProvider(collectionName: String, refData: document, data: document) {
    const KEYS = Object.keys(data);
    const VALUES = Object.values(data).map((v) => this.mapValues(v));
    const COLUMNS = this.sqlite.prepare(`PRAGMA table_info(${collectionName})`).all();
    KEYS.forEach(async (key, i) => {
      if (!COLUMNS.map((v: any) => v.name).includes(key)) this.createColumnProvider(collectionName, key, this.typeof(VALUES[i]));
    });
    const args = KEYS.map((v, i) => (v += ` = (?)`)).join(", ");
    const Data = refData[`${this.options.primaryKey}`] ? refData : this.getDocProvider(collectionName, refData);
    try {
      this.sqlite.prepare(`UPDATE ${collectionName} SET ${args} WHERE ${this.options.primaryKey} = (?)`).run(VALUES, JSON.stringify(Data[`${this.options.primaryKey}`]));
    } catch (error) {
      if (this.options.dev) console.log(error);
    }
  }
}
export default Sqlite;
