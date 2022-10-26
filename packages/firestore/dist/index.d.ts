import type adminFirebase from "firebase-admin";
import firebaseAdmin from "firebase-admin";
interface document {
    [key: string]: string | number | Object | Array<any> | any;
}
export declare class FireStore {
    app: firebaseAdmin.app.App;
    firestore: firebaseAdmin.firestore.Firestore;
    collection: firebaseAdmin.firestore.CollectionReference<firebaseAdmin.firestore.DocumentData>;
    private collectionName;
    constructor(options: adminFirebase.AppOptions);
    createCollectionProvider(collectionName: string, cb?: Function): Promise<adminFirebase.firestore.CollectionReference<adminFirebase.firestore.DocumentData>>;
    createDocProvider(data: document, cb?: Function): Promise<void>;
    deleteCollectionProvider(collectionName: string, cb?: Function): Promise<void>;
    deleteDocProvider(data: document, cb?: Function): Promise<void>;
    getCollectionProvider(collectionName: string, cb?: Function): Promise<{
        _id: string;
    }[]>;
    getCollectionsProvider(cb?: Function): Promise<any>;
    getDocProvider(data: document, cb?: Function): Promise<any>;
    updateDocProvider(refData: document, data: document, cb?: Function): Promise<void>;
}
export declare const certificate: typeof import("firebase-admin/app").cert;
export {};
