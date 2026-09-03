import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

console.log("[build-functions] Compiling Cloudflare Pages Functions...");
try {
  execSync("npx wrangler pages functions build --outdir dist --compatibility-flags nodejs_compat", {
    cwd: rootDir,
    stdio: "inherit",
    env: { ...process.env, CI: "true" },
  });

  const indexJs = path.join(distDir, "index.js");
  const workerJs = path.join(distDir, "_worker.js");

  if (fs.existsSync(indexJs)) {
    fs.renameSync(indexJs, workerJs);
    console.log("[build-functions] Successfully generated dist/_worker.js");
  } else if (fs.existsSync(workerJs)) {
    console.log("[build-functions] dist/_worker.js already exists.");
  } else {
    console.error("[build-functions] Warning: Neither index.js nor _worker.js found in dist/");
  }
} catch (err) {
  console.error("[build-functions] Error building functions:", err);
  process.exit(1);
}
