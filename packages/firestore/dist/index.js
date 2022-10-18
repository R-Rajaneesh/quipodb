import firebaseAdmin from "firebase-admin";
export class FireStore {
    app;
    firestore;
    collection;
    collectionName;
    primaryKey;
    constructor(options) {
        if (!options.primaryKey)
            throw new Error("Primary key must be defined, recieved undefined");
        if (!firebaseAdmin.apps.length)
            this.app = firebaseAdmin.initializeApp(options);
        this.firestore = firebaseAdmin.firestore(this.app);
    }
    createCollectionProvider(collectionName, cb = () => { }) {
        this.collectionName = collectionName;
        this.collection = this.firestore.collection(`${collectionName}`);
        cb(this.collection);
        return this.collection;
    }
    createDocProvider(data, cb = () => { }) {
        if (!this.getDocProvider(data))
            this.collection.doc(`${data[`${this.primaryKey}`]}`).set(data);
        cb();
        return;
    }
    deleteCollectionProvider(collectionName, cb = () => { }) {
        this.firestore.recursiveDelete(this.firestore.collection(`${collectionName}`));
        cb();
        return;
    }
    deleteDocProvider(data, cb = () => { }) {
        this.collection.doc(`${data[`${this.primaryKey}`]}`).delete();
        cb();
        return;
    }
    getCollectionProvider(collectionName, cb = () => { }) {
        const collection = this.firestore.collection(`${collectionName}`);
        const data = [];
        (async () => {
            await collection.get().then((value) => value.docs.forEach((doc) => data.push(doc.data())));
        })();
        cb(data);
        return data;
    }
    getDocProvider(data, cb = () => { }) {
        const result = this.collection.doc(`${data[`${this.primaryKey}`]}`).get();
        cb(result);
        return result;
    }
    getCollectionsProvider(cb = () => { }) {
        const AllData = [];
        this.firestore.listCollections().then((collections) => {
            collections.forEach((collection) => {
                AllData[`${collection.id}`] = [];
                this.firestore
                    .collection(collection.id)
                    .get()
                    .then((value) => value.docs.forEach((doc) => {
                    AllData.push(collection.id);
                }));
            });
        });
        cb(AllData);
        return AllData;
    }
    updateDocProvider(refData, data, cb = () => { }) {
        const result = this.collection.doc(`${refData[`${this.primaryKey}`]}`).update(data);
        cb(result);
        return result;
    }
}
export const certificate = firebaseAdmin.credential.cert;
