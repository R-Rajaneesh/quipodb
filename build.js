import fs from "fs-extra";
import { exec } from "child_process";
fs.readdirSync("packages").forEach((dir) => {
  exec(`cd packages/${dir} && npm run build`, (error, stdout, stderr) => {
    console.log(stdout);
  });
});
