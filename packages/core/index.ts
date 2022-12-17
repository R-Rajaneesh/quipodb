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
  /**
   * Create a new collection
   * @param {String} collectionName Provide a name to create a collection
   * @param {Function} [cb] Callback with the docs
   * @returns {Docs} The collection to interact with
   */
  public createCollection(collectionName: String, cb: Function = () => {}): Docs {
    this.collectionName = collectionName;
    try {
      this.providers.forEach(async (provider) => {
        await provider.createCollectionProvider(collectionName);
      });
      if (this.options.cache) this.storage[`${collectionName}`] = [];
    } catch (error) {
      error;
    }
    const docs = new this.Docs({ providers: this.providers, collectionName: this.collectionName, storage: this.storage, cache: this.options.cache });

    cb(docs);
    return docs;
  }
  /**
   * Delete a collection
   * @param {String} collectionName Provide the name of collection to be deleted
   * @param {Function} [cb] None
   */
  public deleteCollection(collectionName: String, cb: Function = () => {}) {
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
  /**
   * @async
   * @method
   * Create a document in the collection
   * ```js
   * const db = new QuipoDB();
   * const collection = db.createCollection("users");
   * const data = {
   *  author: "Rajaneesh R",
   *  email: "rajaneeshr@proton.me"
   * };
   * await collection.createDoc(data);
   * ```
   * @param  {document|document[]} data The document to store as a object
   * @param  {Function} cb
   * @returns the `document`
   */
  public async createDoc(data: document | document[], cb: Function = () => {}): Promise<document | undefined> {
    try {
      if (Array.isArray(data)) {
        data.forEach((doc) => {
          this.providers.forEach(async (provider) => {
            await provider.createDocProvider(doc);
          });
          if (this.options.cache) this.storage[`${this.collectionName}`].push(doc);
        });
      }
      this.providers.forEach(async (provider) => {
        await provider.createDocProvider(data);
      });
      if (this.options.cache) this.storage[`${this.collectionName}`].push(data);
    } catch (error) {
      console.log(error);
    }
    cb(data);
    return data;
  }
  /**
   * @async
   * @method
   * Deletes a document from the collection
   * ```js
   * const db = new QuipoDB();
   * const collection = db.createCollection("users");
   * const data = {
   *  email: "rajaneeshr@proton.me"
   * };
   * await collection.deleteDoc(data);
   * ```
   * @param  {document|fn} data Document to delete
   * @param  {Function} cb
   * @returns `undefined`
   */
  public async deleteDoc(data: document | fn, cb: Function = () => {}): Promise<undefined> {
    try {
      if (typeof data === "function") data = data(await this.providers[0].getCollectionProvider(this.collectionName));

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
  /**
   * @async
   * @method
   * Finds the matching document
   * ```js
   * const db = new QuipoDB();
   * const collection = db.createCollection("users");
   * const data = {
   *  email: "rajaneeshr@proton.me"
   * };
   * await collection.findDoc(data);
   * ```
   * @param  {document|fn} data The document to search for
   * @param  {Function} cb
   * @returns `document` or `undefined`
   */
  public async findDoc(data: document | fn, cb: Function = () => {}): Promise<document | undefined> {
    let result: object | undefined = undefined;
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
  /**
   * @async
   * @method
   * Get the raw collection as json
   * ```js
   * const db = new QuipoDB();
   * const collection = db.createCollection("users");
   * const data = {
   *  author: "Rajaneesh R",
   *  email: "rajaneeshr@proton.me"
   * };
   * const raw = await collection.getRaw();
   * // Use raw documents
   * ```
   * @param  {Function} cb
   * @returns `document[]`
   */
  public async getRaw(cb: Function = () => {}): Promise<document[]> {
    const data = await this.providers[0].getCollectionProvider(`${this.collectionName}`);
    cb(data);
    return data;
  }
  /**
   * @async
   * @method
   * Query collection with chainable functions
   * ```js
   * const db = new QuipoDB();
   * const collection = db.createCollection("users");
   * const query = (await collection.queryCollection()).where("name").equals("Rajaneesh R").update("Rajaneesh.R").save();
   * ```
   * @param  {Function} cb
   * @returns `Query`
   */
  public async queryCollection(cb: Function = () => {}): Promise<Query> {
    const query = new Query(await this.getRaw());
    cb(query);
    return query;
  }
  /**
   * @async
   * @method
   * Saves the query from the `.save()` function from the `Query`
   * ```js
   * const db = new QuipoDB();
   * const collection = db.createCollection("users");
   * const query = (await collection.queryCollection()).where("name").equals("Rajaneesh R").update("Rajaneesh.R").save();
   * collection.saveQuery(query);
   * ```
   * @param  {document[]} queryJSON
   * @returns `undefined`
   */
  public async saveQuery(queryJSON: document[]): Promise<undefined> {
    if (this.options.cache) this.storage[`${this.collectionName}`] = queryJSON;
    queryJSON.forEach((data) => {
      const old = data._$old;
      delete data._$old;
      if (old !== data) this.updateDoc(old, data);
    });
    return;
  }
  /**
   * @async
   * @method
   * Updates the document
   * ```js
   * const db = new QuipoDB();
   * const collection = db.createCollection("users");
   * const data = {
   *  author: "Rajaneesh R"
   * };
   * const newData = {
   *  email: "mail@example.com"
   * }
   * await collection.updateDoc(data, newData);
   * ```
   * @param  {document} refData The document to update
   * @param  {document|fn} data The updated document
   * @param  {Function} cb
   * @returns `document` or `undefined`
   */
  public async updateDoc(refData: document, data: document | fn, cb: Function = () => {}): Promise<document | undefined> {
    const oldDoc = refData;
    if (!oldDoc) {
      cb();
      return;
    }
    const storage = await this.providers[0].getCollectionProvider(this.collectionName);
    const index = storage.findIndex((doc: any) => doc === oldDoc);
    if (typeof data === "function") data = data(storage[index]);

    Object.keys(data)
      .filter((v) => v.startsWith("$"))
      .forEach((atomic, i) => {
        data = _.defaultsDeep(this[`_${atomic}`](oldDoc, data[atomic]), oldDoc);
      });
    try {
      this.providers.forEach(async (provider) => {
        await provider.updateDocProvider(oldDoc, data);
      });
      if (this.options.cache) this.storage[`${this.collectionName}`][_.findIndex(this.storage[`${this.collectionName}`], oldDoc)] = data;
    } catch (error) {
      error;
    }
    cb(storage[index]);
    return storage[index];
  }
  /**
   * @async
   * @method
   * Update document as json and call `.save()` at the end to save it
   * ```js
   * const db = new QuipoDB();
   * const collection = db.createCollection("users");
   * const data = {
   *  author: "Rajaneesh R",
   *  email: "rajaneeshr@proton.me"
   * };
   * const raw = await collection.getRaw();
   * raw.email = "email@example.com";
   * raw.save();
   * ```
   * @param  {document} refData The document to update
   * @param  {Function} cb
   * @returns `document` or `undefined`
   */
  public async updateRaw(refData: document, cb: Function = () => {}): Promise<{ save: Function; [x: string]: any } | undefined> {
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
          if (this.options.cache) this.storage[`${this.collectionName}`][_.findIndex(this.storage[`${this.collectionName}`], refData)] = this;
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
  private old: any[];
  constructor(data: any[]) {
    this.old = JSON.parse(JSON.stringify(data));
    this.data = data.map((v, i) => ({ ...v, _$current: v, _$old: this.old[i] }));
    this.key = "";
    this.current = this.data.map((v, i) => ({ ...v, _$current: v, _$old: this.old[i] }));
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
    this.current = this.data.map((v, i) => ({ ...v, _$current: v, _$old: this.old[i] }));
    return this;
  }
  public delete(key: string) {
    this.current = this.current.map((v, i) => {
      delete v._$current[key];
      v._$old = v;
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
  public gt(val: number) {
    this.current = this.current.filter((v, i) => v._$current[this.key] > val);
    return this;
  }
  public gte(val: number) {
    this.current = this.current.filter((v, i) => v._$current[this.key] >= val);
    return this;
  }
  public limit(val: number) {
    this._limit = val;
    return this;
  }

  public lt(val: number) {
    this.current = this.current.filter((v, i) => v._$current[this.key] < val);
    return this;
  }

  public lte(val: number) {
    this.current = this.current.filter((v, i) => v._$current[this.key] <= val);
    return this;
  }

  public multiply(val: number) {
    this.current.forEach((d) => {
      d._$current[this.key] *= val;
    });
    return this;
  }
  public push(val: any) {
    this.current.forEach((d) => {
      if (Array.isArray(d._$current[this.key])) d._$current[this.key].push(val);
    });
    return this;
  }
  public splice(start: number, deleteCount?: number, items?: any[]) {
    this.current.forEach((d) => {
      if (Array.isArray(d._$current[this.key])) d._$current[this.key].splice(start, deleteCount, items);
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
  public update(val: any) {
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
    this.current = this.current.map((v, i) => (v = { ...v._$current }));
    this.data = this.current;
    const res = this.data.map((v, i) => {
      delete v["_$old"]["_$current"];
      delete v["_$current"];
      return (v = { ...v });
    });
    return res;
  }
  /**
   * Get the Latest data
   */
  public toJSON() {
    return this.data.map((v, i) => ({ ...v }));
  }
  /**
   * Get the last selected query
   */
  public toValue() {
    return this.current
      .map((v, i) => {
        if (i + 1 > this._limit) {
          if (v._$current) {
            v = { ...v._$current, _$old: v._$old };
            delete v._$current;
          }
          v._$old = v._$old;
          return (v = v);
        }
      })
      .filter((v) => v !== undefined || null);
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
