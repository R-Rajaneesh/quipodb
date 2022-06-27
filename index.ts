import fs from "fs-extra";
import _ from "lodash";
type Options = {
  path?: string;
};
class DB extends Map {
  options: Options;
  tmp: any;
  save: () => void;
  constructor(options: Options = {}) {
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
  }
  createCollection(name: string | number) {
    this.tmp[name] = {};
    this.save();
  }
  createData(collectionName: string | number, key: any, value: any) {
    this.tmp[collectionName][key] = value;
    this.save();
  }
  getData(collectionName: string | number, key: any) {
    return this.tmp[collectionName][key];
  }
  deleteData(collectionName: string | number, key: any) {
    delete this.tmp[collectionName][key];
    this.save();
  }
}
export default DB;
