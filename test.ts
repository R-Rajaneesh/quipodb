import DB from "./index";
const db = new DB();
db.createCollection("test");
db.createData("test", "a", 1);
console.log(db.getData("test", "a"));
db.createData("test", "b", "123");
db.save();
db.createData("test", "3123", 3124123);
db.save();
db.deleteData("test", "3123");
setTimeout(() => {
  db.save();
}, 2000);
