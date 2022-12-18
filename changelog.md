## 1.0.0

- First release of @quipodb/core, @quipodb/sqlite, @quipodb/firestore, @quipodb/json

## 1.0.1

- Fixed bug in @quipodb/json that will not update the data

## 1.0.2

- Fixed bug in @quipodb/sqlite where `updateDoc` command does not update the data

## 1.0.3

- Fixed a bug where the providers take the last `createCollection` function's collectionName, causing data to be stored in the wrong collection
