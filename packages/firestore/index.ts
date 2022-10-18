import firebaseAdmin from "firebase-admin";
import type adminFirebase from "firebase-admin";
type fn = (data: Object[] | Object) => void;
interface document {
  [key: string]: string | number | Object | Array<any> | any;
}
interface storage {
  [collectioName: string]: document[];
}
interface FirestoreOptions extends adminFirebase.AppOptions {
  primaryKey: String;
}
export class FireStore {
  app: firebaseAdmin.app.App;
  firestore: firebaseAdmin.firestore.Firestore;
  collection: firebaseAdmin.firestore.CollectionReference<firebaseAdmin.firestore.DocumentData>;
  collectionName: String;
  primaryKey: String;
  constructor(options: FirestoreOptions) {
    if (!options.primaryKey) throw new Error("Primary key must be defined, recieved undefined");
    if (!firebaseAdmin.apps.length) this.app = firebaseAdmin.initializeApp(options);
    this.firestore = firebaseAdmin.firestore(this.app);
  }
  public createCollectionProvider(collectionName: String, cb: Function = () => {}) {
    this.collectionName = collectionName;
    this.collection = this.firestore.collection(`${collectionName}`);
    cb(this.collection);
    return this.collection;
  }
  public createDocProvider(data: document, cb: Function = () => {}) {
    if (!this.getDocProvider(data)) this.collection.doc(`${data[`${this.primaryKey}`]}`).set(data);
    cb();
    return;
  }
  public deleteCollectionProvider(collectionName: String, cb: Function = () => {}) {
    this.firestore.recursiveDelete(this.firestore.collection(`${collectionName}`));
    cb();
    return;
  }
  public deleteDocProvider(data: document, cb: Function = () => {}) {
    this.collection.doc(`${data[`${this.primaryKey}`]}`).delete();
    cb();
    return;
  }
  public getCollectionProvider(collectionName: String, cb: Function = () => {}) {
    const collection = this.firestore.collection(`${collectionName}`);
    const data: any[] = [];
    (async () => {
      await collection.get().then((value) => value.docs.forEach((doc) => data.push(doc.data())));
    })();
    cb(data);
    return data;
  }
  public getDocProvider(data: document, cb: Function = () => {}) {
    const result = this.collection.doc(`${data[`${this.primaryKey}`]}`).get();
    cb(result);
    return result;
  }
  public getCollectionsProvider(cb: Function = () => {}) {
    const AllData: any = [];
    this.firestore.listCollections().then((collections) => {
      collections.forEach((collection) => {
        AllData[`${collection.id}`] = [];
        this.firestore
          .collection(collection.id)
          .get()
          .then((value) =>
            value.docs.forEach((doc) => {
              AllData.push(collection.id);
            }),
          );
      });
    });
    cb(AllData);
    return AllData;
  }
  public updateDocProvider(refData: document, data: document, cb: Function = () => {}) {
    const result = this.collection.doc(`${refData[`${this.primaryKey}`]}`).update(data);
    cb(result);
    return result;
  }
}
export const certificate = firebaseAdmin.credential.cert;
