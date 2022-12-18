interface document {
    [key: string]: string | number | Object | Array<any> | any;
}
interface storage {
    [collectioName: string]: document[];
}
interface JsonStoreOptions {
    path: string;
}
export declare class JsonStore {
    private storage;
    constructor(options: JsonStoreOptions);
    createCollectionProvider(collectionName: string, cb?: Function): Promise<document[]>;
    createDocProvider(collectionName: string, data: document, cb?: Function): Promise<document>;
    deleteCollectionProvider(collectionName: string, cb?: Function): Promise<void>;
    deleteDocProvider(collectionName: string, data: document, cb?: Function): Promise<void>;
    getCollectionProvider(collectionName: string, cb?: Function): Promise<document[]>;
    getCollectionsProvider(cb?: Function): Promise<storage>;
    getDocProvider(collectionName: string, data: document, cb?: Function): Promise<document>;
    updateDocProvider(collectionName: string, refData: document, data: document, cb?: Function): Promise<any>;
}
export {};
