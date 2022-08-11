import fs from "fs-extra";
import DB from "./index.js";
import zlib from "zlib";
const db = new DB();
// db.createCollection("a");
// db.getCollection("a", (collection) => collection);
// db.setDoc({ hello: { not: "pog" }, world: "pog" });
// db.setDoc({ dasdad: { noteee: "eeee" }, pog: "not pog" });

// db.findDoc((key) => {
//   return `${key}` === `${{ not: "pog" }}`;
// });
// db.deleteCollection("a");
// db.deleteDoc(
//   (val) => {
//     return val === "not pog";
//   },
//   (e) => {},
// );
setInterval(() => {
  db.getCollection("a", (collection) => console.log(collection));
}, 1000);

// zlib.deflate(Buffer.from(JSON.stringify({ hello: "world" })), (err, res) => {
//   if (err) throw new Error(err);
//   fs.writeFileSync("./mygzipfile.txt", res);
// });
// zlib.inflate(fs.readFileSync("./mygzipfile.txt"), (err, res) => {
//   console.log(JSON.parse(res.toString()));
// });
