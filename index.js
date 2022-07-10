import fs from "fs-extra";
import _ from "lodash";
class DB extends Map {
  constructor(options = {}) {
    options = _.defaultsDeep(options, {
      path: "./databases/index.json",
    });
    super();
    this.options = options;
    this.tmp = {};
    fs.ensureFileSync(`${this.options.path}`);
    this.save = () => {
      fs.writeJsonSync(`${this.options.path}`, this.tmp);
    };
    process.on("beforeExit", () => this.save());
  }
  createCollection(name) {
    this.tmp[name] = {};
    this.save();
  }
  createData(collectionName, key, value) {
    this.tmp[collectionName][key] = value;
    this.save();
  }
  getData(collectionName, key) {
    return this.tmp[collectionName][key];
  }
  deleteData(collectionName, key) {
    delete this.tmp[collectionName][key];
    this.save();
  }
  setExpiry(collectionName, key, expiry) {
    this.tmp[collectionName][key][expiry];
    this.save();
  }
}
export default DB;
