import firebaseAdmin from "firebase-admin";
import type adminFirebase from "firebase-admin";
type fn = (data: Object[] | Object) => void;
interface document {
  [key: string]: string | number | Object | Array<any> | any;
}
interface storage {
  [collectioName: string]: document[];
}
export class FireStore {
  app: firebaseAdmin.app.App;
  firestore: firebaseAdmin.firestore.Firestore;
  collection: firebaseAdmin.firestore.CollectionReference<firebaseAdmin.firestore.DocumentData>;
  collectionName: String;
  constructor(options: adminFirebase.AppOptions) {
    this.app = firebaseAdmin.initializeApp(options);

    this.firestore = firebaseAdmin.firestore(this.app);
  }
  public createCollectionProvider(collectionName: String, cb: Function = () => {}) {
    this.collectionName = collectionName;
    this.collection = this.firestore.collection(`${collectionName}`);
    cb(this.collection);
    return this.collection;
  }
  createDocProvider(data: document, cb: Function = () => {}) {
    if (!this.getDocProvider(data)) this.collection.add(data);
    cb();
    return;
  }
  deleteCollectionProvider(collectionName: String, cb: Function = () => {}) {
    this.firestore.recursiveDelete(this.firestore.collection(`${collectionName}`));
    cb();
    return;
  }
  deleteDocProvider(data: document, cb: Function = () => {}) {
    this.collection
      .where(`${Object.keys(data)[0]}`, "==", Object.values(data)[0])
      .get()
      .then((value) => value.docs.forEach(async (doc: any) => await this.collection.doc(doc.id).delete()));
    cb();
    return;
  }
  getCollectionProvider(collectionName: String, cb: Function = () => {}) {
    const collection = this.firestore.collection(`${collectionName}`);
    const data: any[] = [];
    (async () => {
      await collection.get().then((value) => value.docs.forEach((doc) => data.push(doc.data())));
    })();
    cb(data);
    return data;
  }
  getDocProvider(data: document, cb: Function = () => {}) {
    let result: any;
    result = new Promise(async (res, rej) => {
      await this.collection
        .where(`${Object.keys(data)[0]}`, "==", Object.values(data)[0])
        .get()
        .then(async (value) => {
          res(await value?.docs[0]?.data()??{});
        });
      setTimeout(() => {
        rej({});
      }, 2000);
    });
    cb(result);
    return result;
  }
  getCollectionsProvider(cb: Function = () => {}) {
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
  updateDocProvider(refData: document, data: document, cb: Function = () => {}) {
    let result: any;
    this.collection
      .where(`${Object.keys(refData)[0]}`, "==", Object.values(refData)[0])
      .get()
      .then((C) =>
        C.docs.forEach((doc) => {
          this.collection.doc(doc.id).update(data);
          result = this.collection.doc(doc.id).get()??{};
        }),
      );
    cb(result);
    return result;
  }
}
export const certificate = firebaseAdmin.credential.cert;
