import _ from "lodash";
import { mergeAndConcat } from "merge-anything";

interface constructorOptions {
  providers: providers[];
  cache: Boolean;
}
interface providers {
  createCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
  createDocProvider(data: document, cb?: Function): Promise<any> | any;
  deleteCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
  deleteDocProvider(data: document | fn, cb?: Function): Promise<any> | any;
  getCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
  getCollectionsProvider(cb?: Function): Promise<any> | any[];
  getDocProvider(data: document | fn, cb?: Function): Promise<any> | any;
  updateDocProvider(refData: document | fn, data: document, cb?: Function): Promise<any> | any;
}
interface updateRawCB {
  save: Function;
}
interface Collection {
  createDoc(data: document | document[], cb?: Function): Promise<any> | any;
  deleteDoc(data: document | fn, cb?: Function): Promise<any> | any;
  findDoc(data: document | fn, cb?: Function): document;
  hasDoc(data: document | fn, cb?: Function): boolean;
  getRaw(): any;
  updateDoc(refData: document, data: document | fn, cb?: Function): Promise<any> | any;
  updateRaw(refData: document | fn, cb?: Function): updateRawCB;
}
type fn = (data: Object[] | Object) => any;
interface storage {
  [collection: string]: document[];
}
interface document {
  [key: string]: string | number | Object | Array<any> | any;
}
export class QuipoDB {
  public options: constructorOptions;
  public storage: storage;
  public cache: Boolean;
  public collectionName: String;
  public Docs: typeof Docs;
  public providers: providers[];
  constructor(options: constructorOptions) {
    this.options = options;
    this.providers = options.providers;
    this.storage = {};
    this.Docs = Docs;
  }
  createCollection(collectionName: String, cb: Function = () => {}) {
    this.collectionName = collectionName;
    try {
      this.providers.forEach(async (provider) => {
        await provider.createCollectionProvider(collectionName, cb);
      });
      if (this.options.cache) this.storage[`${collectionName}`] = [];
    } catch (error) {
      error;
    }
    const docs = new this.Docs({ providers: this.providers, collectionName: this.collectionName, storage: this.storage, cache: this.options.cache });

    cb(docs);
    return docs;
  }
  deleteCollection(collectionName: String, cb: Function = () => {}) {
    try {
      this.providers.forEach(async (provider) => {
        await provider.deleteCollectionProvider(collectionName);
      });
      if (this.options.cache) delete this.storage[`${collectionName}`];
    } catch (error) {
      error;
    }
    cb();
    return;
  }
}
interface DocsOptions {
  providers: providers[];
  collectionName: String;
  storage: storage;
  cache: Boolean;
}
class Docs {
  private options: any;
  private providers: providers[];
  private collectionName: String;
  private storage: storage;
  constructor(options: DocsOptions) {
    this.options = options;
    this.providers = options.providers;
    this.collectionName = options.collectionName;
    this.storage = options.storage;
  }
  public async createDoc(data: document | document[], cb: Function = () => {}) {
    if (Array.isArray(data)) {
      data.forEach((doc) => {
        this.providers.forEach(async (provider) => {
          await provider.createDocProvider(doc);
        });
        if (this.options.cache) this.storage[`${this.collectionName}`].push(doc);
      });
    }
    try {
      this.providers.forEach(async (provider) => {
        await provider.createDocProvider(data);
      });
      if (this.options.cache) this.storage[`${this.collectionName}`].push(data);
    } catch (error) {
      error;
    }
    cb(data);
    return data;
  }
  public async deleteDoc(data: document | fn, cb: Function = () => {}) {
    if (typeof data === "function") data = data(await this.providers[0].getCollectionProvider(this.collectionName));

    try {
      this.providers.forEach(async (provider) => {
        await provider.deleteDocProvider(data);
      });

      if (this.options.cache) {
        this.storage[`${this.collectionName}`].splice(_.findIndex(this.storage[`${this.collectionName}`], data), 1);
      }
    } catch (error) {
      error;
    }
    cb();
    return;
  }
  public async findDoc(data: document | fn, cb: Function = () => {}) {
    let result: object = {};
    if (typeof data === "function") data = data(await this.providers[0].getCollectionProvider(this.collectionName)) ?? {};
    try {
      const Data = await this.providers[0].getDocProvider(data);
      result = this.options.cache ? _.find(this.storage[`${this.collectionName}`], data) ?? Data : Data;
    } catch (error) {
      error;
    }
    cb(result);
    return result;
  }

  public async getRaw(cb: Function = () => {}) {
    const data = await this.providers[0].getCollectionProvider(`${this.collectionName}`);

    cb(data);
    return data;
  }

  public async updateDoc(refData: document, data: document | fn, cb: Function = () => {}) {
    const oldDoc = this.findDoc(refData);
    if (!oldDoc) {
      cb();
      return;
    }
    const storage = await this.providers[0].getCollectionProvider(this.collectionName);
    const index = storage.findIndex((doc) => doc === oldDoc);
    if (typeof data === "function") data = data(storage[index]);

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
    } catch (error) {
      error;
    }
    cb(storage[index]);
    return storage[index];
  }
  public async updateRaw(refData: document, cb: Function = () => {}) {
    let data = this.findDoc(refData);
    if (!data) {
      cb();
      return;
    }
    const self = this;
    const func: { save: Function; [x: string]: any } = {
      ...data,
      save: async function () {
        try {
          delete this.save;
          await self.updateDoc(refData, this);
          this.storage[`${this.collectionName}`][_.findIndex(this.storage[`${this.collectionName}`], refData)] = this;
        } catch (error) {
          error;
        }
      },
    };
    cb(func);
    return func;
  }

  private _$add(...data: Object[]) {
    const deepMerge = (oldData: any, newData: any) => {
      return Object.keys(oldData).reduce((acc, key) => {
        if (typeof newData[key] === "object") {
          acc[key] = deepMerge(oldData[key], newData[key]);
        } else if (newData.hasOwnProperty(key) && !isNaN(parseFloat(newData[key]))) {
          if (!acc[key]) acc[key] = oldData[key] + newData[key];
          acc[key] = oldData[key] + newData[key];
        }
        return acc;
      }, {});
    };

    const result = data.reduce((acc, obj) => (acc = deepMerge(acc, obj)));

    return result;
  }
  private _$subtract(...data: Object[]) {
    const deepMerge = (oldData: any, newData: any) => {
      return Object.keys(oldData).reduce((acc, key) => {
        if (typeof newData[key] === "object") {
          acc[key] = deepMerge(oldData[key], newData[key]);
        } else if (newData.hasOwnProperty(key) && !isNaN(parseFloat(newData[key]))) {
          if (!acc[key]) acc[key] = oldData[key] - newData[key];
          acc[key] = oldData[key] - newData[key];
        }
        return acc;
      }, {});
    };

    const result = data.reduce((acc, obj) => (acc = deepMerge(acc, obj)));

    return result;
  }
  private _$multiply(...data: Object[]) {
    const deepMerge = (oldData: any, newData: any) => {
      return Object.keys(oldData).reduce((acc, key) => {
        if (typeof newData[key] === "object") {
          acc[key] = deepMerge(oldData[key], newData[key]);
        } else if (newData.hasOwnProperty(key) && !isNaN(parseFloat(newData[key]))) {
          if (!acc[key]) acc[key] = oldData[key] * newData[key];
          acc[key] = oldData[key] * newData[key];
        }
        return acc;
      }, {});
    };

    const result = data.reduce((acc, obj) => (acc = deepMerge(acc, obj)));

    return result;
  }
  private _$divide(...data: Object[]) {
    const deepMerge = (oldData: any, newData: any) => {
      return Object.keys(oldData).reduce((acc, key) => {
        if (typeof newData[key] === "object") {
          acc[key] = deepMerge(oldData[key], newData[key]);
        } else if (newData.hasOwnProperty(key) && !isNaN(parseFloat(newData[key]))) {
          if (!acc[key]) acc[key] = oldData[key] / newData[key];
          acc[key] = oldData[key] / newData[key];
        }
        return acc;
      }, {});
    };

    const result = data.reduce((acc, obj) => (acc = deepMerge(acc, obj)));

    return result;
  }
  private _$push(oldval: any, newVal: any) {
    return mergeAndConcat(oldval, newVal);
  }
}

export class Query {
  private data: any[];
  private key: string;
  private current: any[];
  private _limit: number;
  constructor(Data: any[]) {
    this.data = Data;
    this.key = "";
    this.current = this.data.map((v) => ({ ...v, _$current: v }));
  }
  public add(val: number) {
    this.current.forEach((d) => {
      d._$current[this.key] += val;
    });
    return this;
  }
  /**
   * Gets back to the top level on the data
   */
  public clearQuery() {
    this.current = this.data.map((v) => ({ ...v, _$current: v }));
    return this;
  }
  public delete(key: string) {
    this.current = this.current.map((v, i) => {
      delete v._$current[key];
      return (v = v);
    });
    return this;
  }
  public divide(val: number) {
    this.current.forEach((d) => {
      d._$current[this.key] /= val;
    });
    return this;
  }
  public equals(val: any) {
    this.current = this.current.filter((v, i) => v._$current[this.key] === val);
    return this;
  }
  /**
   * Check if the data exists on every object
   */
  public exists(key: string) {
    return this.current.every((v) => v[key]);
  }
  public find(key: string, val: any) {
      const res: any[] = [];
      return this.current.forEach((v) => {
        if (v._$current[key] === val) res.push(v);
      });

  }
  public gt(val: any) {
    this.current = this.current.filter((v, i) => v._$current[this.key] > val);
    return this;
  }
  public gte(val: any) {
    this.current = this.current.filter((v, i) => v._$current[this.key] >= val);
    return this;
  }
  public limit(val: number) {
    this._limit = val + 1;
    return this;
  }

  public lt(val: any) {
    this.current = this.current.filter((v, i) => v._$current[this.key] < val);
    return this;
  }

  public lte(val: any) {
    this.current = this.current.filter((v, i) => v._$current[this.key] <= val);
    return this;
  }

  public multiply(val: number) {
    this.current.forEach((d) => {
      d._$current[this.key] *= val;
    });
    return this;
  }
  public push(arr: any[]) {
    arr.forEach((val) => {
      this.current.forEach((d) => {
        if (Array.isArray(d._$current[this.key])) d._$current[this.key].push(val);
      });
    });
    return this;
  }
  /**
   * Get the raw data
   */
  public raw() {
    const data = this.current.map((v) => (v = v._$current));
    return data;
  }
  public update(val: number) {
    this.current.forEach((d) => {
      d._$current[this.key] = val;
    });
    return this;
  }
  /**
   * Get into a deeper object
   * @param {String} key
   */
  public select(key: string) {
    this.current.map((v, i) => {
      this.current[i]._$current = v[key];
    });

    return this;
  }
  public subtract(val: number) {
    this.current.forEach((d) => {
      d._$current[this.key] -= val;
    });
    return this;
  }
  /**
   * Saves the queries on the data
   */
  public save() {
    this.current = this.current.map((v) => (v = v._$current));
    this.data = this.current;
    return this;
  }
  /**
   * Get the Latest data
   */
  public toJSON() {
    return this.data;
  }
  /**
   * Get the last selected query
   */
  public toValue() {
    return this.current.map((v, i) => {
      if (this._limit < i) return;
      if (v._$current) delete v._$current;
      return (v = v);
    });
  }
  /**
   * Select a object to query next
   * @param {string} key
   */
  public where(key: string) {
    this.key = `${key}`;
    return this;
  }
}
