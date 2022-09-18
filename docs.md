# Full Documentation

## Methods

- [constructor](#constructor)
- [createCollection](#createcollection)
- [deleteColection](#deletecolection)
- [deleteDoc](#deletedoc)
- [findDoc](#finddoc)
- [getCollection](#getcollection)
- [hasDoc](#hasdoc)
- [setDoc](#setdoc)
- [updateDoc](#updatedoc)

### Default

```js
import QuipoDB from "quipodb"
const db = new QuipoDB(constructor)
```
### Constructor

|Option|Type|Default Value|
|------|----|--------------|
|path|String|`./databases/index.db`|
|unique|Boolean|`true`|
|overwrite|Boolean|`false`|


### createCollection
|Option|Type|Default Value|
|------|----|--------------|
|collectionName|String|`index`|
|cb|Function|`(collection)=>{}`|

### deleteColection
|Option|Type|Default Value|
|------|----|--------------|
|collectionName|String|`index`|
|cb|Function|`()=>{}`|
### deleteDoc
|Option|Type|Default Value|
|------|----|--------------|
|fn|Function|`(doc)=>{}`|
|cb|Function|`()=>{}`|
### findDoc
|Option|Type|Default Value|
|------|----|--------------|
|fn|Function|`(doc)=>{}`|
|cb|Function|`()=>{}`|
### getCollection
|Option|Type|Default Value|
|------|----|--------------|
|fn|Function|`(doc)=>{}`|
|cb|Function|`()=>{}`|
### hasDoc
|Option|Type|Default Value|
|------|----|--------------|
|fn|Function|`(doc)=>{}`|
|cb|Function|`()=>{}`|
### setDoc
|Option|Type|Default Value|
|------|----|--------------|
|params|Object \| Array<Object>|`{}`|
|cb|Array|`(doc)=>{}`|
### updateDoc
|Option|Type|Default Value|
|------|----|--------------|
|params|Object<Object>|`{}`|
|updateparams|Object<Object>|`{}`|
|cb|Array|`(doc)=>{}`|
