import fs from "fs-extra";
import _ from "lodash";
import zlib from "zlib";
class QuipoDB {
  constructor(options = { path: "./databases/index.db", unique: true, overwrite: false }) {
    options = _.defaultsDeep(options, {
      path: "./databases/index.db",
      unique: true,
      overwrite: false,
    });
    this.options = options;
    this.collectionName = "index";
    this.tmp = {};
    this.unique = options.unique;

    fs.ensureFileSync(`${this.options.path}`);
    try {
      this.tmp = JSON.parse(zlib.inflateRawSync(fs.readFileSync(`${this.options.path}`))) ?? {};
    } catch {
      fs.writeFileSync(`${this.options.path}`, zlib.deflateRawSync(Buffer.from(JSON.stringify({}))));
      this.tmp = JSON.parse(zlib.inflateRawSync(fs.readFileSync(`${this.options.path}`))) ?? {};
    }
    [
      "beforeExit",
      "rejectionHandled",
      "uncaughtException",
      "unhandledRejection",
      "uncaughtExceptionMonitor",
      "exit",
      "beforeExit",
      "SIGHUP",
      "SIGTERM",
      "SIGINT",
      "SIGBREAK",
      "SIGKILL",
      "SIGUSR1",
      "SIGPIPE",
      "SIGWINCH",
    ].forEach((eventName) => {
      process.on(eventName, (...args) => {
        Promise.resolve(this.#save());
        process.exit(0);
      });
    });
    setInterval(() => {
      this.#save();
    }, 5000);
    setInterval(() => {
      Object.keys(this.tmp).forEach((key, index) => {
        Object.values(this.tmp)[index].forEach((doc) => {
          if (!doc.ttl) return;
          if (doc.ttl <= moment().unix()) obj[key].splice(index, 1);
        });
      });
    }, 5000);
  }
  #save() {
    if (!this.server) fs.writeFileSync(`${this.options.path}`, zlib.deflateRawSync(Buffer.from(JSON.stringify(this.tmp))));
  }
  /**
   * @param  {String} collectionName Collection name to be created
   * @param {String} primaryKey A key to identify unique data values
   * @param  {Function} cb The callback function to get the output
   * @returns {this} returns the remaining functions to save data
   */

  createCollection(collectionName = "index", primaryKey = undefined, cb) {
    this.collectionName = collectionName;
    this.primaryKey = primaryKey;
    if (this.tmp[collectionName]) return this;
    this.tmp[collectionName] = [];
    if (cb) cb(this);
    return this;
  }
  /**
   * @param  {String} collectionName Collection name to be deleted
   * @param  {Function} cb The callback function to get the output
   */
  deleteCollection(collectionName, cb) {
    delete this.tmp[collectionName];
    if (cb) cb();
    return;
  }
  /**
   * @param  {Function} fn The function with a return value to delete a document
   * ```js
   *  deleteDoc((v)=>{
        return v.id === 1
   *  })
   * ````
   * @param  {Function} cb The callback function to get the output
   */
  deleteDoc(fn, cb) {
    this.tmp[this.collectionName].forEach((doc, index) => {
      const vals = Object.values(doc);
      vals.forEach((val) => {
        if (fn(val)) {
          this.tmp[this.collectionName].splice(index, 1);
        }
      });
    });
    if (cb) cb();
    return;
  }
  /**
   * @param  {Function} fn The function with a return value to delete a document
   * ```js
   *  findDoc((v)=>{
        return v.id === 1
   *  })
   * ````
   * @param  {Function} cb The callback function to get the output
   */
  findDoc(fn, cb) {
    let op;
    this.tmp[this.collectionName].forEach((doc, index) => {
      if (fn(doc)) op = doc;
    });
    if (cb) cb(op);
    return op;
  }

  /**
   * @param  {String} collectionName Collection name to get
   * @param  {Function} cb The callback function to get the output
   */
  getCollection(collectionName, cb) {
    if (cb) cb(this.tmp[collectionName]);

    return this.tmp[collectionName];
  }
  /**
   * @param  {Function} fn The function with a return value to delete a document
   * ```js
   *  getDoc((v)=>{
        return v.id === 1
   *  })
   * ````
   * @param  {Function} cb The callback function to get the output
   */
  getDoc(fn, cb) {
    return this.findDoc(fn, cb);
  }
  /**
   * @param  {Function} fn The function with a return value to delete a document
   * ```js
   *  hasDoc((v)=>{
        return v.id === 1
   *  })
   * ````
   * @param  {Function} cb The callback function to get the output
   */
  hasDoc(fn, cb) {
    let op;
    this.tmp[this.collectionName].forEach((doc, index) => {
      if (fn(doc)) op = Boolean(doc);
    });
    if (cb) cb(op);
    return op;
  }

  /**
   * @param  {Object|Array<any>} params The params as a object or as a array with the key-value pair
   * ```js
   *  setDoc({hello:"world"})
   * ```
   * or
   * ```js
   *  setDoc([{hello:"world", bye:"world"}])
   * ```
   * @param  {Function} cb The callback function to get the output
   */
  setDoc(params, cb) {
    if (Array.isArray(params)) {
      params.forEach((param) => {
        if (this.primaryKey && !this.tmp[this.collectionName].filter((v) => v[this.primaryKey] === param[this.primaryKey]) > 0 && this.unique) {
          this.tmp[this.collectionName].push(_.defaultsDeep(param, { id: this.tmp[this.collectionName].length + 1 }));
        } else if (this.options.overwrite && this.unique) {
        }
      });
    } else {
      if (this.primaryKey && !this.tmp[this.collectionName].filter((v) => v[this.primaryKey] === params[this.primaryKey]).length > 0 && this.unique)
        this.tmp[this.collectionName].push(_.defaultsDeep(params, { id: this.tmp[this.collectionName].length + 1 }));
    }
    if (cb) cb(this.tmp[this.collectionName]);
    return this.tmp[this.collectionName];
  }
  /**
   * @param  {Object|Array<any>} params The old param values as a object with the key-value pair
   * ```js
   *  setDoc({hello:"world"})
   * ```
   * or
   * ```js
   *  setDoc([{hello:"world", bye:"world"}])
   * ```
   * @param  {Object} updateparams
   * @param  {Function} cb The callback function to get the output
   */
  updateDoc(params, updateparams, cb) {
    try {
      this.tmp[this.collectionName][_.findIndex(this.tmp[this.collectionName], params)] = _.defaultsDeep(
        this.tmp[this.collectionName][_.findIndex(this.tmp[this.collectionName], params)],
        updateparams,
      );
    } catch {}
    cb(this.tmp[this.collectionName][_.findIndex(this.tmp[this.collectionName], params)]);
  }
}
export default QuipoDB;
