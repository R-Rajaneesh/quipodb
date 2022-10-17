# Full Documentation

## Methods

- [constructor](#constructor)
- [createCollection](#createcollection)
- [deleteColection](#deletecolection)
- [getCollection](#getcollection)

### Default

```js
import QuipoDB from "quipodb";
const db = new QuipoDB(constructor);
```

### Constructor

| Option   | Type    | Default Value              |
| -------- | ------- | -------------------------- |
| path     | String  | `./databases/index.sqlite` |
| inMemory | Boolean | `false`                    |
| provider | Class   | `SQLite`                   |

### createCollection

| Option         | Type     | Default Value      |
| -------------- | -------- | ------------------ |
| collectionName | String   | `index`            |
| primaryKey     | String   | `NULL`            |
| cb             | Function | `(collection)=>{}` |

- [createDoc](#createdoc)
- [deleteDoc](#deletedoc)
- [findDoc](#finddoc)
- [hasDoc](#hasdoc)
- [updateDoc](#updatedoc)

### createDoc

| Option | Type                 | Default Value |
| ------ | -------------------- | ------------- |
| params | document\|document[] | `{}`          |
| cb     | Object[]             | `(doc)=>{}`   |

An key named `ttl (Time-To-Live)` will delete the document when the time is equal or greater than the current time.

### deleteDoc

| Option | Type     | Default Value |
| ------ | -------- | ------------- |
| fn     | Function | `(doc)=>{}`   |
| cb     | Function | `()=>{}`      |

### findDoc

| Option | Type     | Default Value |
| ------ | -------- | ------------- |
| fn     | Function | `(doc)=>{}`   |
| cb     | Function | `()=>{}`      |

### hasDoc

| Option | Type     | Default Value |
| ------ | -------- | ------------- |
| fn     | Function | `(doc)=>{}`   |
| cb     | Function | `()=>{}`      |

### updateDoc

| Option       | Type     | Default Value |
| ------------ | -------- | ------------- |
| params       | document | `{}`          |
| updateparams | document | `{}`          |
| cb           | Object[] | `(this)=>{}`  |

### deleteColection

| Option         | Type     | Default Value |
| -------------- | -------- | ------------- |
| collectionName | String   | `index`       |
| cb             | Function | `()=>{}`      |

### getCollection

| Option | Type     | Default Value      |
| ------ | -------- | ------------------ |
| fn     | Function | `(doc)=>{}`        |
| cb     | Function | `(document[])=>{}` |

# Plugins

This lies on the class `QuipoDB` itself

```js
import QuipoDB from "quipodb";
import yourPlugin from "your-plugin-package"; // Or a class
const db = new QuipoDB();
const plugin = new yourPlugin();
db.registerPlugin(plugin);
```

Your plugin must expose these functions

- [createCollectionProvider](#createcollectionprovider)
- [createColumnProvider](#createcolumnprovider)
- [createDocProvider](#createdocprovider)
- [deleteCollectionProvider](#deletecollectionprovider)
- [deleteDocProvider](#deletedocprovider)
- [updateDocProvider](#updatedocprovider)
- [getDocProvider](#getdocprovider)
- [getAllCollectionsProvider](#getallcollectionsprovider)
- [getAllFromCollectionProvider](#getallfromcollectionprovider)
- [hasDocProvider](#hasdocprovider)

### createCollectionProvider

| Option        | Type   |
| ------------- | ------ |
| tableName     | String |
| primaryColumn | string |
| dataType      | string |

### createColumnProvider

| Option     | Type   |
| ---------- | ------ |
| tableName  | String |
| columnName | string |
| dataType   | string |

### createDocProvider

| Option    | Type     |
| --------- | -------- |
| tableName | String   |
| data      | document |
| cb        | Function |

### deleteCollectionProvider

| Option    | Type     |
| --------- | -------- |
| tableName | String   |
| cb        | Function |

### deleteDocProvider

| Option    | Type     |
| --------- | -------- |
| tableName | String   |
| data      | document |
| cb        | Function |


### getDocProvider

| Option    | Type     |
| --------- | -------- |
| tableName | String   |
| data      | document |
| cb        | Function |

### getAllCollectionsProvider

| Option | Type |
| ------ | ---- |
| NULL   | NULL |

### getAllFromCollectionProvider

| Option    | Type   |
| --------- | ------ |
| tableName | String |

### hasDocProvider

| Option    | Type     |
| --------- | -------- |
| tableName | String   |
| data      | document |
| cb        | Function |

### updateDocProvider

| Option        | Type     |
| ------------- | -------- |
| tableName     | String   |
| primaryColumn | String   |
| data          | document |
| cb            | Function |

!!!primary Note
Try to maintain the structure of the data when storing

```ts
interface document {
  [key: string]: string | number | Object | Array<any> | any;
}
interface storage {
  [collectioName: string]: document[];
}
```

!!!
