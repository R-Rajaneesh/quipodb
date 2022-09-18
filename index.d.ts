interface setDocParams {
  [key]: any;
}
interface construct {
  path: String;
  unique: Boolean;
  overwrite: Boolean;
}
export default class QuipoDB {
  constructor(options: construct);
  private #save(): void;
  /**
   * @param  {String} collectionName Collection name to be created
   * @param {String} primaryKey A key to identify unique data values
   * @param  {Function} cb The callback function to get the output
   * @returns {this} returns the remaining functions to save data
   */
  public createCollection(collectionName: String, cb?: Function): void;
  /**
   * @param  {String} collectionName Collection name to be deleted
   * @param  {Function} cb The callback function to get the output
   */
  public deleteCollection(collectioName: String, cb?: Function): void;
  /**
   * @param  {Function} fn The function with a return value to delete a document
   * ```js
   *  deleteDoc((v)=>{
        return v.id === 1
   *  })
   * ````
   * @param  {Function} cb The callback function to get the output
   */
  public deleteDoc(fn: Function, cb?: Function): void;
  /**
   * @param  {Function} fn The function with a return value to delete a document
   * ```js
   *  findDoc((v)=>{
        return v.id === 1
   *  })
   * ````
   * @param  {Function} cb The callback function to get the output
   */
  public findDoc(fn: Function, cb?: Function): void;
  /**
   * @param  {String} collectionName Collection name to get
   * @param  {Function} cb The callback function to get the output
   */

  public getCollection(collectionName: String, cb?: Function): void;
  /**
   * @param  {Function} fn The function with a return value to delete a document
   * ```js
   *  getDoc((v)=>{
        return v.id === 1
   *  })
   * ````
   * @param  {Function} cb The callback function to get the output
   */
  public getDoc(fn: Function, cb?: Function): void;
  /**
   * @param  {Function} fn The function with a return value to delete a document
   * ```js
   *  hasDoc((v)=>{
        return v.id === 1
   *  })
   * ````
   * @param  {Function} cb The callback function to get the output
   */
  public hasDoc(fn: Function, cb?: Function): void;
  /**
   * @param  {Object|Array<any>} params The params as a object or as a array with the key-value pair
   * ```js
   *  setDoc({hello:"world"})
   * ```
   * or
   * ```js
   *  setDoc([{hello:"world", bye:"world"}])
   * ```
   * @param  {Function} cb The callback function to get the output
   */
  public setDoc(params: setDocParams[] | setDocParams, cb?: Function): void;
  /**
   * @param  {Object|Array<any>} params The old param values as a object with the key-value pair
   * ```js
   *  setDoc({hello:"world"})
   * ```
   * or
   * ```js
   *  setDoc([{hello:"world", bye:"world"}])
   * ```
   * @param  {Object} updateparams
   * @param  {Function} cb The callback function to get the output
   */
  public updateDoc(params: setDocParams, updateparams: setDocParams, cb?: Function): void;
}
