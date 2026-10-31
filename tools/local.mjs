import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import express from "express";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));

const { default: app } = await import("../server/app.mjs");

execSync(
  "npm run build:admin && npm run build:personal && node tools/build-site.mjs",
  { stdio: "inherit" }
);

const local = express();
local.use(express.static("web-dist"));
// Global Passport: student portal and unified login share the admin app.
local.get(["/portal","/portal/","/login","/login/"], (req, res) => res.sendFile(path.resolve("web-dist/admin/index.html")));
// Short business-card links, e.g. http://127.0.0.1:3000/laura (same rule as vercel.json).
local.get(/^\/(?!(?:admin|api|portal|login|book|services|privacy|terms|portfolio|certificates|personal-admin|pipeline-share|assets|fonts|images|img|css|js)(?![a-zA-Z0-9-]))[a-zA-Z0-9][a-zA-Z0-9-]{1,28}[a-zA-Z0-9]\/?$/, (req, res) => {
  res.sendFile(path.resolve("web-dist/book/index.html"));
});
local.use(app);

local.listen(3000, "127.0.0.1", () => {
  console.log("Web completa: http://127.0.0.1:3000");
});
