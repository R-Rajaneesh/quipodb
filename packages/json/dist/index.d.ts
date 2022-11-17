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
    private collectionName;
    private storage;
    constructor(options: JsonStoreOptions);
    createCollectionProvider(collectionName: string, cb?: Function): Promise<document[]>;
    createDocProvider(data: document, cb?: Function): Promise<document>;
    deleteCollectionProvider(collectionName: string, cb?: Function): Promise<void>;
    deleteDocProvider(data: document, cb?: Function): Promise<void>;
    getCollectionProvider(collectionName: string, cb?: Function): Promise<document[]>;
    getCollectionsProvider(cb?: Function): Promise<storage>;
    getDocProvider(data: document, cb?: Function): Promise<document>;
    updateDocProvider(refData: document, data: document, cb?: Function): Promise<any>;
}
export {};
