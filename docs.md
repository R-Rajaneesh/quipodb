# Full Documentation

## Methods

- [constructor](#constructor)
- [createCollection](#createcollection)
- [deleteColection](#deletecolection)
- [getCollection](#getcollection)


### Default

```js
import QuipoDB from "quipodb"
const db = new QuipoDB(constructor)
```
### Constructor

|Option|Type|Default Value|
|------|----|--------------|
|path|String|`./databases/index.sqlite`|
|unique|Boolean|`true`|
|overwrite|Boolean|`false`|


### createCollection
|Option|Type|Default Value|
|------|----|--------------|
|collectionName|String|`index`|
|cb|Function|`(collection)=>{}`|

- [createDoc](#createdoc)
- [deleteDoc](#deletedoc)
- [findDoc](#finddoc)
- [hasDoc](#hasdoc)
- [updateDoc](#updatedoc)

### createDoc
|Option|Type|Default Value|
|------|----|--------------|
|params|Object \| Array<Object>|`{}`|
|cb|Object[]|`(doc)=>{}`|
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
### hasDoc
|Option|Type|Default Value|
|------|----|--------------|
|fn|Function|`(doc)=>{}`|
|cb|Function|`()=>{}`|
### updateDoc
|Option|Type|Default Value|
|------|----|--------------|
|params|Object<Object>|`{}`|
|updateparams|Object<Object>|`{}`|
|cb|Object[]|`(this)=>{}`|

### deleteColection
|Option|Type|Default Value|
|------|----|--------------|
|collectionName|String|`index`|
|cb|Function|`()=>{}`|
### getCollection
|Option|Type|Default Value|
|------|----|--------------|
|fn|Function|`(doc)=>{}`|
|cb|Function|`(document[])=>{}`|
