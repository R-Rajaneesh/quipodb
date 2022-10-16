import firebaseAdmin from "firebase-admin";
export class FireStore {
    app;
    firestore;
    collection;
    collectionName;
    constructor(options) {
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
            this.collection.add(data);
        cb();
        return;
    }
    deleteCollectionProvider(collectionName, cb = () => { }) {
        this.firestore.recursiveDelete(this.firestore.collection(`${collectionName}`));
        cb();
        return;
    }
    deleteDocProvider(data, cb = () => { }) {
        this.collection
            .where(`${Object.keys(data)[0]}`, "==", Object.values(data)[0])
            .get()
            .then((value) => value.docs.forEach(async (doc) => await this.collection.doc(doc.id).delete()));
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
        let result;
        result = new Promise(async (res, rej) => {
            await this.collection
                .where(`${Object.keys(data)[0]}`, "==", Object.values(data)[0])
                .get()
                .then(async (value) => {
                res(await value?.docs[0]?.data() ?? {});
            });
            setTimeout(() => {
                rej({});
            }, 2000);
        });
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
        let result;
        this.collection
            .where(`${Object.keys(refData)[0]}`, "==", Object.values(refData)[0])
            .get()
            .then((C) => C.docs.forEach((doc) => {
            this.collection.doc(doc.id).update(data);
            result = this.collection.doc(doc.id).get() ?? {};
        }));
        cb(result);
        return result;
    }
}
export const certificate = firebaseAdmin.credential.cert;
