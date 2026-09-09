// Copies the built static bundle (app/dist) up to the Pinokio project root,
// so the project can run as a "serverless web app" (index.html + assets only,
// no launcher scripts / server needed).
import { cp, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");
const projectRoot = path.resolve(__dirname, "..", "..");

async function main() {
  if (!existsSync(distDir)) {
    throw new Error(`dist folder not found at ${distDir}. Run "vite build" first.`);
  }

  const targetAssets = path.join(projectRoot, "assets");
  if (existsSync(targetAssets)) {
    await rm(targetAssets, { recursive: true, force: true });
  }
  await mkdir(targetAssets, { recursive: true });
  await cp(path.join(distDir, "assets"), targetAssets, { recursive: true });
  await cp(path.join(distDir, "index.html"), path.join(projectRoot, "index.html"));

  console.log(`Copied build output to ${projectRoot}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
