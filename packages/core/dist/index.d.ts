interface constructorOptions {
    providers: providers[];
}
interface providers {
    createCollectionProvider(collectionName: String, cb?: Function): void;
    createDocProvider(data: document, cb?: Function): void;
    deleteCollectionProvider(collectionName: String, cb?: Function): void;
    deleteDocProvider(data: document | fn, cb?: Function): void;
    getCollectionProvider(collectionName: String, cb?: Function): any[];
    getDocProvider(data: document | fn, cb?: Function): any;
    getCollectionsProvider(cb?: Function): Collection[];
    updateDocProvider(refData: document | fn, data: document, cb?: Function): void;
}
interface Collection {
    createDoc(data: document | fn, cb?: Function): any;
    deleteDoc(data: document | fn, cb?: Function): any;
    getDoc(data: document | fn, cb?: Function): any;
    hasDoc(data: document | fn, cb?: Function): any;
    getRaw(): any;
}
declare type fn = (data: Object[] | Object) => void;
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
    createDoc(data: document | document[], cb?: Function): document;
    deleteDoc(data: document | fn, cb?: Function): void;
    findDoc(data: document | fn, cb?: Function): object;
    findOrcreateDoc(data: document, cb?: Function): document;
    getOrcreateDoc(data: document, cb?: Function): document;
    getRaw(cb?: Function): any[];
    getDoc(data: document | fn | String, cb?: Function): object;
    updateDoc(refData: document, data: document | fn, cb?: Function): any;
    private $add;
    private $subtract;
    private $multiply;
    private $divide;
    private $push;
}
export {};
