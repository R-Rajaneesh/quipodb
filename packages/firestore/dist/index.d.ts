import firebaseAdmin from "firebase-admin";
import type adminFirebase from "firebase-admin";
interface document {
    [key: string]: string | number | Object | Array<any> | any;
}
interface FirestoreOptions extends adminFirebase.AppOptions {
    primaryKey: String;
}
export declare class FireStore {
    app: firebaseAdmin.app.App;
    firestore: firebaseAdmin.firestore.Firestore;
    collection: firebaseAdmin.firestore.CollectionReference<firebaseAdmin.firestore.DocumentData>;
    collectionName: String;
    primaryKey: String;
    constructor(options: FirestoreOptions);
    createCollectionProvider(collectionName: String, cb?: Function): firebaseAdmin.firestore.CollectionReference<firebaseAdmin.firestore.DocumentData>;
    createDocProvider(data: document, cb?: Function): void;
    deleteCollectionProvider(collectionName: String, cb?: Function): void;
    deleteDocProvider(data: document, cb?: Function): void;
    getCollectionProvider(collectionName: String, cb?: Function): any[];
    getDocProvider(data: document, cb?: Function): Promise<firebaseAdmin.firestore.DocumentSnapshot<firebaseAdmin.firestore.DocumentData>>;
    getCollectionsProvider(cb?: Function): any;
    updateDocProvider(refData: document, data: document, cb?: Function): Promise<firebaseAdmin.firestore.WriteResult>;
}
export declare const certificate: typeof import("firebase-admin/app").cert;
export {};
