import firebaseAdmin from "firebase-admin";
import _ from "lodash";
export class FireStore {
    app;
    firestore;
    collection;
    collectionName;
    constructor(options) {
        if (!firebaseAdmin.apps.length)
            this.app = firebaseAdmin.initializeApp(options);
        this.firestore = firebaseAdmin.firestore(this.app);
    }
    async createCollectionProvider(collectionName, cb = () => { }) {
        this.collectionName = collectionName;
        this.collection = this.firestore.collection(`${collectionName}`);
        cb(this.collection);
        return this.collection;
    }
    async createDocProvider(data, cb = () => { }) {
        this.collection.add(data);
        cb();
        return;
    }
    async deleteCollectionProvider(collectionName, cb = () => { }) {
        try {
            this.firestore.recursiveDelete(this.firestore.collection(collectionName));
        }
        catch (error) {
            error;
        }
        cb();
        return;
    }
    async deleteDocProvider(data, cb = () => { }) {
        try {
            const snapshot = (await this.collection.get()).docs.map((doc) => ({ ...doc.data(), _id: doc.id }));
            const res = _.find(snapshot, data);
            if (res?._id)
                this.collection.doc(`/${res?._id}`).delete();
        }
        catch (error) {
            error;
        }
        cb();
        return;
    }
    async getCollectionProvider(collectionName, cb = () => { }) {
        const data = (await this.firestore.collection(collectionName).get()).docs.map((doc) => ({ ...doc.data(), _id: doc.id }));
        cb(data);
        return data;
    }
    async getCollectionsProvider(cb = () => { }) {
        const AllData = [];
        await this.firestore.listCollections().then((val) => val.forEach((v) => AllData.push(v.id)));
        cb(AllData);
        return AllData;
    }
    async getDocProvider(data, cb = () => { }) {
        let result;
        try {
            const snapshot = (await this.collection.get()).docs.map((doc) => ({ ...doc.data(), _id: doc.id }));
            result = _.find(snapshot, data);
        }
        catch (e) {
            result = result;
        }
        cb(result);
        return result;
    }
    async updateDocProvider(refData, data, cb = () => { }) {
        if (!(await this.getDocProvider(refData))) {
            cb();
            return;
        }
        try {
            const snapshot = (await this.collection.get()).docs.map((doc) => ({ ...doc.data(), _id: doc.id }));
            const res = _.find(snapshot, refData);
            this.collection.doc(`/${res._id}`).update(data);
        }
        catch (error) {
            error;
        }
        cb();
        return;
    }
}
export const certificate = firebaseAdmin.credential.cert;
