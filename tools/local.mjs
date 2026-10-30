import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import express from "express";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));

const { default: app } = await import("../server/app.mjs");

execSync(
  "npm run build:admin && npm run build:personal && node tools/build-site.mjs",
  { stdio: "inherit" }
);

const local = express();
local.use(express.static("web-dist"));
local.use(app);

local.listen(3000, "127.0.0.1", () => {
  console.log("Web completa: http://127.0.0.1:3000");
});