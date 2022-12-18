import _ from "lodash";
import fs from "fs-extra";
type fn = (data: Object[] | Object) => void;
interface document {
  [key: string]: string | number | Object | Array<any> | any;
}
interface storage {
  [collectioName: string]: document[];
}
interface JsonStoreOptions {
  path: string;
}
export class JsonStore {
  private storage: storage;
  constructor(options: JsonStoreOptions) {
    if (!fs.existsSync(options.path)) {
      if (options.path.replace(/.+(\.).+$/g, "")) fs.ensureDirSync(options.path.replace(/.+(\.).+$/g, ""));
      fs.ensureFileSync(options.path);
      fs.writeJSONSync(options.path, {});
    }
    try {
      this.storage = fs.readJSONSync(options.path) ?? {};
    } catch {
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
  public async createCollectionProvider(collectionName: string, cb: Function = () => {}) {
    this.storage[collectionName] = [];
    cb(this.storage[collectionName]);
    return this.storage[collectionName];
  }
  public async createDocProvider(collectionName: string, data: document, cb: Function = () => {}) {
    this.storage[collectionName].push(data);
    cb(data);
    return data;
  }
  public async deleteCollectionProvider(collectionName: string, cb: Function = () => {}) {
    delete this.storage[collectionName];
    cb();
    return;
  }
  public async deleteDocProvider(collectionName: string, data: document, cb: Function = () => {}) {
    this.storage[collectionName].splice(_.findIndex(this.storage[collectionName], data), 1);
    cb();
    return;
  }
  public async getCollectionProvider(collectionName: string, cb: Function = () => {}) {
    const data = this.storage[collectionName];
    cb(data);
    return data;
  }
  public async getCollectionsProvider(cb: Function = () => {}) {
    const data = this.storage;
    cb(data);
    return data;
  }
  public async getDocProvider(collectionName: string, data: document, cb: Function = () => {}) {
    const Data = _.find(this.storage[collectionName], data);
    cb(Data);
    return Data;
  }
  public async updateDocProvider(collectionName: string, refData: document, data: document, cb: Function = () => {}) {
    const docIndex = _.findIndex(this.storage[collectionName], refData);
    const Data = _.defaultsDeep(this.storage[collectionName][docIndex], data);
    this.storage[collectionName][docIndex] = Data;
    cb(Data);
    return Data;
  }
}
