interface setDocParams {
  [key]: any;
}
interface construct {
  path: string;
  uniqueKey: boolean;
  serverpath: string;
}
export default class DB {
  constructor(options: construct);
  private #save(): void;
  /**
   * Create a new collection
   */
  public createCollection(collectioName: string, cb: Function): void;
  /**
   * Delete a collection
   */
  public deleteCollection(collectioName: string, cb: Function): void;
  /**
   * Delete a document in a collection
   */
  public deleteDoc(fn: Function, cb: Function): void;
  /**
   * Find a document in a collection
   */
  public findDoc(fn: Function, cb: Function): void;
  /**
   * Get the key-value of a entire collection
   */
  public getCollection(collectioName: string, cb: Function): void;
  /**
   * Check if a collection has a document
   */
  public hasDoc(fn: Function, cb: Function): void;
  /**
   * Set a new document(s)
   */
  public setDoc(params: setDocParams[] | setDocParams, cb: Function): void;
}
