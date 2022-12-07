import fs from "fs-extra";
import { exec } from "child_process";
fs.readdirSync("packages").forEach((dir) => {
  const packageJSON = fs.readJsonSync(`packages/${dir}/package.json`);
  packageJSON.version = `1.0.${parseInt(packageJSON.version.slice(-1)) + 1}`;
  fs.writeJsonSync(`packages/${dir}/package.json`, packageJSON);
  exec(`cd packages/${dir} && npm run build && npm run publish-private`, (error, stdout, stderr) => {
    console.log(stdout);
  });
});
