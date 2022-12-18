import type adminFirebase from "firebase-admin";
import firebaseAdmin from "firebase-admin";
import _ from "lodash";
type fn = (data: Object[] | Object) => void;
interface document {
  [key: string]: string | number | Object | Array<any> | any;
}
interface storage {
  [collectioName: string]: document[];
}
export class FireStore {
  public app: firebaseAdmin.app.App;
  public firestore: firebaseAdmin.firestore.Firestore;
  public collection: firebaseAdmin.firestore.CollectionReference<firebaseAdmin.firestore.DocumentData>;
  private collectionName: string;
  constructor(options: adminFirebase.AppOptions) {
    if (!firebaseAdmin.apps.length) this.app = firebaseAdmin.initializeApp(options);
    this.firestore = firebaseAdmin.firestore(this.app);
  }
  public async createCollectionProvider(collectionName: string, cb: Function = () => {}) {
    this.collectionName = collectionName;
    this.collection = this.firestore.collection(`${collectionName}`);
    cb(this.collection);
    return this.collection;
  }
  public async createDocProvider(collectionName: String, data: document, cb: Function = () => {}) {
    this.collection.add(data);
    cb();
    return;
  }
  public async deleteCollectionProvider(collectionName: string, cb: Function = () => {}) {
    try {
      this.firestore.recursiveDelete(this.firestore.collection(collectionName));
    } catch (error) {
      error;
    }
    cb();
    return;
  }
  public async deleteDocProvider(collectionName: String, data: document, cb: Function = () => {}) {
    try {
      const snapshot = (await this.collection.get()).docs.map((doc) => ({ ...doc.data(), _id: doc.id }));
      const res = _.find<any>(snapshot, data);
      if (res?._id) this.collection.doc(`/${res?._id}`).delete();
    } catch (error) {
      error;
    }
    cb();
    return;
  }
  public async getCollectionProvider(collectionName: string, cb: Function = () => {}) {
    const data = (await this.firestore.collection(collectionName).get()).docs.map((doc) => ({ ...doc.data(), _id: doc.id }));

    cb(data);
    return data;
  }
  public async getCollectionsProvider(cb: Function = () => {}) {
    const AllData: any = [];
    await this.firestore.listCollections().then((val) => val.forEach((v) => AllData.push(v.id)));
    cb(AllData);
    return AllData;
  }
  public async getDocProvider(collectionName: String, data: document, cb: Function = () => {}) {
    let result: any;
    try {
      const snapshot = (await this.collection.get()).docs.map((doc) => ({ ...doc.data(), _id: doc.id }));
      result = _.find<any>(snapshot, data);
    } catch (e) {
      result = result;
    }
    cb(result);
    return result;
  }
  public async updateDocProvider(collectionName: String, refData: document, data: document, cb: Function = () => {}) {
    if (!(await this.getDocProvider(collectionName, refData))) {
      cb();
      return;
    }
    try {
      const snapshot = (await this.collection.get()).docs.map((doc) => ({ ...doc.data(), _id: doc.id }));
      const res = _.find<any>(snapshot, refData);
      this.collection.doc(`/${res._id}`).update(data);
    } catch (error) {
      error;
    }
    cb();
    return;
  }
}
export const certificate = firebaseAdmin.credential.cert;
