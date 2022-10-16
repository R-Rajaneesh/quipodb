import _ from "lodash";
import { mergeAndConcat } from "merge-anything";

interface constructorOptions {
  providers: providers[];
}
interface providers {
  createCollectionProvider(collectionName: String, cb?: Function): void;
  createDocProvider(data: document, cb?: Function): void;
  deleteCollectionProvider(collectionName: String, cb?: Function): void;
  deleteDocProvider(data: document | fn, cb?: Function): void;
  getCollectionProvider(collectionName: String, cb?: Function): any[];
  getDocProvider(data: document | fn, cb?: Function): any;
  getCollectionsProvider(cb?: Function): Collection[];
  updateDocProvider(refData: document | fn, data: document, cb?: Function): void;
}
interface Collection {
  createDoc(data: document | fn, cb?: Function): any;
  deleteDoc(data: document | fn, cb?: Function): any;
  getDoc(data: document | fn, cb?: Function): any;
  hasDoc(data: document | fn, cb?: Function): any;
  getRaw(): any;
}
type fn = (data: Object[] | Object) => void;
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

    // Time-To-Live
    setInterval(() => {
      this.providers.forEach(async (provider) => {
        await provider.getCollectionsProvider().forEach(async (collectionName: any) => {
          await provider.getCollectionProvider(collectionName).forEach(async (doc: document) => {
            if (doc.ttl <= Date.now()) {
              await provider.deleteDocProvider(doc);
            }
          });
        });
      });
    }, 5000);
  }
  createCollection(collectionName: String, cb: Function = () => {}) {
    this.collectionName = collectionName;
    this.providers.forEach(async (provider) => {
      await provider.createCollectionProvider(collectionName, cb);
    });
    const docs = new this.Docs({ providers: this.providers, collectionName: this.collectionName });
    cb(docs);
    return docs;
  }
  deleteCollection(collectionName: String, cb: Function = () => {}) {
    this.providers.forEach(async (provider) => {
      await provider.deleteCollectionProvider(collectionName);
    });
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
  public createDoc(data: document | document[], cb: Function = () => {}) {
    if (Array.isArray(data)) {
      data.forEach((doc) => {
        this.providers.forEach(async (provider) => {
          await provider.createDocProvider(doc);
        });
      });
    }
    this.providers.forEach(async (provider) => {
      await provider.createDocProvider(data);
    });
    cb(data);
    return data;
  }
  public deleteDoc(data: document | fn, cb: Function = () => {}) {
    if (typeof data === "function") data = data(this.providers[0].getCollectionProvider(this.collectionName));

    this.providers.forEach(async (provider) => {
      await provider.deleteDocProvider(data);
    });
  }
  public findDoc(data: document | fn, cb: Function = () => {}) {
    let result: object = {};
    if (typeof data === "function") data = data(this.providers[0].getCollectionProvider(this.collectionName)) ?? {};
    result = this.providers[0].getDocProvider(data);
    cb(result);
    return result;
  }

  public findOrcreateDoc(data: document, cb: Function = () => {}) {
    let result: document = {};
    const Data = this.findDoc(data);
    if (Data) result = Data;
    else {
      result = this.createDoc(data);
    }
    cb(result);
    return result;
  }
  public getOrcreateDoc(data: document, cb: Function = () => {}) {
    return this.findOrcreateDoc(data, cb);
  }
  public getRaw(cb: Function = () => {}) {
    const data = this.providers[0].getCollectionProvider(this.collectionName);

    cb(data);
    return data;
  }
  public getDoc(data: document | fn | String, cb: Function = () => {}) {
    return this.findDoc(data, cb);
  }
  public updateDoc(refData: document, data: document | fn, cb: Function = () => {}) {
    const oldDoc = this.findDoc(refData);
    const storage = this.providers[0].getCollectionProvider(this.collectionName);
    const index = storage.findIndex((doc) => doc === oldDoc);
    if (typeof data === "function") data = data(storage[index]);

    Object.keys(data)
      .filter((v) => v.startsWith("$"))
      .forEach((atomic, i) => {
        data = _.defaultsDeep(this[atomic](oldDoc, data[atomic]), oldDoc);
      });
    this.providers.forEach(async (provider) => {
      await provider.updateDocProvider(refData, data);
    });
    cb(storage[index]);
    return storage[index];
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
