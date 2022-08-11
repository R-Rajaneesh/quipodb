import axios from "axios";
import fs from "fs-extra";
import _ from "lodash";
import zlib from "zlib";
class DB {
  constructor(options = { path: "./databases/index.dx", uniqueKey: true }) {
    options = _.defaultsDeep(options, {
      path: "./databases/index.dx",
      uniqueKey: true,
      serverPath: "",
    });
    this.server = options.serverPath !== "" ? true : false;
    this.options = options;
    this.collectionName = "index";
    this.tmp = {};

    fs.ensureFileSync(`${this.options.path}`);
    try {
      this.tmp = JSON.parse(zlib.inflateRawSync(fs.readFileSync(`${this.options.path}`))) ?? {};
    } catch {
      fs.writeFileSync(`${this.options.path}`, zlib.deflateRawSync(Buffer.from(JSON.stringify({}))));
      this.tmp = JSON.parse(zlib.inflateRawSync(fs.readFileSync(`${this.options.path}`))) ?? {};
    }
    const events = [
      "beforeExit",
      "rejectionHandled",
      "uncaughtException",
      "unhandledRejection",
      "exit",
      "beforeExit",
      "SIGHUP",
      "SIGTERM",
      "SIGINT",
      "SIGBREAK",
      "SIGKILL",
    ];

    events.forEach((eventName) => {
      process.on(eventName, (...args) => {
        Promise.resolve(this.#save());
        process.exit(0);
      });
    });
    setInterval(() => {
      this.#save();
    }, 5000);
  }
  #save() {
    if (!this.server) fs.writeFileSync(`${this.options.path}`, zlib.deflateRawSync(Buffer.from(JSON.stringify(this.tmp))));

    this.#sendRequest();
  }
  async #sendRequest() {
    if (!this.server) return;
    await axios.post(`${this.options.serverPath}`, { data: JSON.stringify(this.tmp) }, { method: "POST" }).catch((error) => {
      console.log(`E: ${error}`);
    });
  }
  createCollection(collectionName, cb) {
    if (this.tmp[collectionName]) return;
    this.tmp[collectionName] = [];
    if (cb) cb(collectionName, this.tmp[collectionName]);
    return this.tmp[collectionName];
  }
  deleteCollection(collectionName, cb) {
    delete this.tmp[collectionName];
    if (cb) cb();
    return;
  }
  deleteDoc(fn, cb) {
    this.tmp[this.collectionName].forEach((doc, index) => {
      const vals = Object.values(doc);
      vals.forEach((val) => {
        if (fn(val)) {
          this.tmp[this.collectionName].splice(index, 1);
        }
      });
    });
    if (cb) cb(true);
  }
  findDoc(fn, cb) {
    let op;
    this.tmp[this.collectionName].forEach((doc, index) => {
      const vals = Object.values(doc);
      vals.forEach((val) => {
        if (fn(val)) op = doc;
      });
    });
    if (cb) cb(op);
    return op;
  }
  getCollection(collectionName, cb) {
    this.collectionName = collectionName;
    if (cb) cb(this.tmp[collectionName]);

    return this.tmp[collectionName];
  }
  hasDoc(fn, cb) {
    this.tmp[this.collectionName].forEach((doc, index) => {
      const vals = Object.values(doc);
      vals.forEach((val) => {
        if (fn(val)) {
          op = doc;
          has = true;
        }
      });
    });
    if (cb) cb(has);
    return has;
  }
  setDoc(params, cb) {
    if (!Array.isArray(params)) this.tmp[this.collectionName].push(params);
    else
      params.forEach((param) => {
        this.tmp[this.collectionName].push(param);
      });
    if (cb) cb(this.tmp[this.collectionName]);
    return this.tmp[this.collectionName];
  }
}
export default DB;
