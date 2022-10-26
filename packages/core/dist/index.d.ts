interface constructorOptions {
    providers: providers[];
}
interface providers {
    createCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
    createDocProvider(data: document, cb?: Function): Promise<any> | any;
    deleteCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
    deleteDocProvider(data: document | fn, cb?: Function): Promise<any> | any;
    getCollectionProvider(collectionName: String, cb?: Function): Promise<any> | any;
    getCollectionsProvider(cb?: Function): Promise<any> | any[];
    getDocProvider(data: document | fn, cb?: Function): Promise<any> | any;
    updateDocProvider(refData: document | fn, data: document, cb?: Function): Promise<any> | any;
}
declare type fn = (data: Object[] | Object) => any;
interface storage {
    [collection: string]: document[];
}
interface document {
    [key: string]: string | number | Object | Array<any> | any;
}
export default class QuipoDB {
    options: constructorOptions;
    storage: storage;
    collectionName: String;
    Docs: typeof Docs;
    providers: providers[];
    constructor(options: constructorOptions);
    createCollection(collectionName: String, cb?: Function): Docs;
    deleteCollection(collectionName: String, cb?: Function): void;
}
interface DocsOptions {
    providers: providers[];
    collectionName: String;
}
declare class Docs {
    private options;
    private providers;
    private collectionName;
    constructor(options: DocsOptions);
    createDoc(data: document | document[], cb?: Function): Promise<document>;
    deleteDoc(data: document | fn, cb?: Function): Promise<void>;
    findDoc(data: document | fn, cb?: Function): Promise<object>;
    getRaw(cb?: Function): Promise<any>;
    updateDoc(refData: document, data: document | fn, cb?: Function): Promise<any>;
    updateRaw(refData: document, cb?: Function): Promise<{
        [x: string]: any;
        save: Function;
    }>;
    private $add;
    private $subtract;
    private $multiply;
    private $divide;
    private $push;
}
export {};
