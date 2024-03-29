import _ from "lodash";
import { mergeAndConcat } from "merge-anything";

interface constructorOptions {
  providers: providers[];
  cache: Boolean;
}
interface providers {
  createCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
  createDocProvider(collectionName: String, data: document, cb?: Function): Promise<any> | any;
  deleteCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
  deleteDocProvider(collectionName: String, data: document | fn, cb?: Function): Promise<any> | any;
  getCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
  getCollectionsProvider(cb?: Function): Promise<any> | any[];
  getDocProvider(collectionName: String, data: document | fn, cb?: Function): Promise<any> | any;
  updateDocProvider(collectionName: String, refData: document | fn, data: document, cb?: Function): Promise<any> | any;
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
    try {
      this.providers.forEach(async (provider) => {
        await provider.createCollectionProvider(collectionName);
      });
      if (this.options.cache) this.storage[`${collectionName}`] = [];
    } catch (error) {
      error;
    }
    let docs = new this.Docs({ providers: this.providers, collectionName: `${collectionName}`, storage: this.storage, cache: this.options.cache });
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
  collectionName: string;
  storage: storage;
  cache: Boolean;
}
export class Docs {
  private options: any;
  private providers: providers[];
  private collectionName: string;
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
            await provider.createDocProvider(this.collectionName, doc);
          });
          if (this.options.cache) this.storage[`${this.collectionName}`].push(doc);
        });
      }
      this.providers.forEach(async (provider) => {
        await provider.createDocProvider(this.collectionName, data);
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
        await provider.deleteDocProvider(this.collectionName, data);
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
      const Data = await this.providers[0].getDocProvider(this.collectionName, data);
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
        await provider.updateDocProvider(this.collectionName, oldDoc, data);
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
  data: any[];
  key!: string;
  _limit!: number;
  constructor(data: any[]) {
    this.data = data.map((value, index, array) => {
      value["_$old"] = JSON.parse(JSON.stringify(value));
      value["_$current"] = value;
      return value;
    });
  }
  /**
   * Add a number to the selected key
   * @param {number} value
   */
  public add(value: number) {
    this.data.forEach((data) => {
      data["_$current"][`${this.key}`] += value;
    });
    return this;
  }
  /**
   * Clear the querying data and fallback to the top-level of the object
   */
  public clearQuery() {
    this.data = this.data.map((value, index) => {
      const val = JSON.parse(JSON.stringify(value));
      const old = JSON.parse(JSON.stringify(value["_$old"]));
      delete value["_$old"];

      return { ...val, _$current: value, _$old: old };
    });
    return this;
  }
  /**
   * Divide a number to the selected key
   * @param {number} value
   */
  public divide(value: number) {
    this.data.forEach((data) => {
      data["_$current"][`${this.key}`] /= value;
    });
    return this;
  }
  /**
   * Check if the value matches
   * @param  {any} value
   */
  public equals(value: any) {
    this.data = this.data.filter((val) => val["_$current"][`${this.key}`] === value);
    return this;
  }
  /**
   * Get the data from the key and value
   * @param  {string} key
   * @param  {any} value
   */
  public find(key: string, value: any) {
    return this.data.forEach((val, index, array) => this.data[index]["_$current"][`${key}`] === value);
  }
  /**
   * Check if greater
   * @param  {number} val
   */
  public gt(val: number) {
    this.data = this.data.filter((value) => value["_$current"][`${this.key}`] > val);
    return this;
  }
  /**
   * Check if greater or equal
   * @param  {number} val
   */
  public gte(val: number) {
    this.data = this.data.filter((value) => value["_$current"][`${this.key}`] >= val);
    return this;
  }
  /**
   * Limit the number of outputs
   * @param  {number} val
   */
  public limit(val: number) {
    this._limit = val;
    return this;
  }
  /**
   * Check if lesser
   * @param  {number} val
   */
  public lt(val: number) {
    this.data = this.data.filter((value) => value["_$current"][`${this.key}`] < val);
    return this;
  }
  /**
   * Check if lesser or equal
   * @param  {number} val
   */
  public lte(val: number) {
    this.data = this.data.filter((value) => value["_$current"][`${this.key}`] <= val);
    return this;
  }
  /**
   * Multiply a number to the selected key
   * @param {number} value
   */
  public multiply(value: number) {
    this.data.forEach((data) => {
      data["_$current"][`${this.key}`] *= value;
    });
    return this;
  }
  /**
   * Push elements into potentially possible arrays
   * @param  {any[]} ...value
   */
  public push(...value: any[]) {
    this.data.forEach((data) => {
      if (Array.isArray(data["_$current"][`${this.key}`])) data["_$current"][`${this.key}`].push(...value);
    });
    return this;
  }

  /**
   * Get the raw data
   */
  public raw() {
    return this.data;
  }
  /**
   * Save the data to save to the database
   */
  public save() {
    return this.data.map((value, index, array) => {
      delete value["_$old"]?.["_$current"];
      delete value["_$current"];
      return value;
    });
  }
  /**
   * Get deeper into the object
   * @param  {string} key
   */
  public select(key: string) {
    this.data.map((val, index) => {
      val["_$current"] = val?.["_$current"][`${key}`];
    });
    return this;
  }
  /**
   * Remove (or replace) items from an array
   * @param  {number} start
   * @param  {number} [deleteCount]
   * @param  {any[]} [items]
   */
  public splice(start: number, deleteCount?: number, items?: any[]) {
    this.data.forEach((data) => {
      if (Array.isArray(data["_$current"][`${this.key}`])) data["_$current"][`${this.key}`].splice(start, deleteCount, items);
    });

    return this;
  }
  /**
   * Subtract a number to the selected key
   * @param {number} value
   */
  public subtract(value: number) {
    this.data.forEach((data) => {
      data["_$current"][`${this.key}`] -= value;
    });
    return this;
  }
  /**
   * Get the entire data from the top-level
   */
  public toJSON() {
    return this.data.map((value, index, array) => {
      delete value["_$old"];
      return value;
    });
  }
  /**
   * Get the last selected data
   */
  public toValue() {
    return this.data
      .map((value, index, array) => {
        if (this._limit && index + 1 > this._limit) return value["_$current"];
        return value["_$current"];
      })
      .filter((value, index, array) => value !== undefined || null);
  }
  /**
   * Update the entire value with a new one
   * @param  {any} value
   */
  public update(value: any) {
    this.data.forEach((data) => {
      data["_$current"][`${this.key}`] = value;
    });
    return this;
  }
  /**
   * Select data to query on next
   * @param  {string} key
   * @param  {any} [value]
   */
  public where(key: string, value?: any) {
    if (value) this.data = this.data.filter((val, i) => val["_$current"][`${key}`] === value);
    else this.key = key;
    return this;
  }
}
