import _ from "lodash";
import { mergeAndConcat } from "merge-anything";

interface constructorOptions {
  providers: providers[];
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
export default class QuipoDB {
  public options: constructorOptions;
  public storage: storage;
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
    } catch (error) {
      error;
    }
    const docs = new this.Docs({ providers: this.providers, collectionName: this.collectionName });

    cb(docs);
    return docs;
  }
  deleteCollection(collectionName: String, cb: Function = () => {}) {
    try {
      this.providers.forEach(async (provider) => {
        await provider.deleteCollectionProvider(collectionName);
      });
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
}
class Docs {
  private options: any;
  private providers: providers[];
  private collectionName: String;
  constructor(options: DocsOptions) {
    this.options = options;
    this.providers = options.providers;
    this.collectionName = options.collectionName;
  }
  public async createDoc(data: document | document[], cb: Function = () => {}) {
    if (Array.isArray(data)) {
      data.forEach((doc) => {
        this.providers.forEach(async (provider) => {
          await provider.createDocProvider(doc);
        });
      });
    }
    try {
      this.providers.forEach(async (provider) => {
        await provider.createDocProvider(data);
      });
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
      result = await this.providers[0].getDocProvider(data);
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
        data = _.defaultsDeep(this[atomic](oldDoc, data[atomic]), oldDoc);
      });
    try {
      this.providers.forEach(async (provider) => {
        await provider.updateDocProvider(refData, data);
      });
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
        } catch (error) {
          error;
        }
      },
    };
    cb(func);
    return func;
  }

  private $add(...data: Object[]) {
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
  private $subtract(...data: Object[]) {
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
  private $multiply(...data: Object[]) {
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
  private $divide(...data: Object[]) {
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
  private $push(oldval: any, newVal: any) {
    return mergeAndConcat(oldval, newVal);
  }
}
