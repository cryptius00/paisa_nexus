import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const HASH_FILE = path.join(ROOT_DIR, "src", "canvas-host", "a2ui", ".bundle.hash");
const OUTPUT_FILE = path.join(ROOT_DIR, "src", "canvas-host", "a2ui", "a2ui.bundle.js");
const A2UI_RENDERER_DIR = path.join(ROOT_DIR, "vendor", "a2ui", "renderers", "lit");
const A2UI_APP_DIR = path.join(ROOT_DIR, "apps", "shared", "OpenClawKit", "Tools", "CanvasA2UI");

async function walk(entryPath, files = []) {
  const st = await fs.stat(entryPath);
  if (st.isDirectory()) {
    const entries = await fs.readdir(entryPath);
    for (const entry of entries) {
      await walk(path.join(entryPath, entry), files);
    }
    return files;
  }
  files.push(entryPath);
  return files;
}

function normalize(p) {
  return p.split(path.sep).join("/");
}

async function computeHash(inputPaths) {
  const files = [];
  for (const input of inputPaths) {
    if (existsSync(input)) {
      await walk(input, files);
    }
  }

  files.sort((a, b) => normalize(a).localeCompare(normalize(b)));

  const hash = createHash("sha256");
  for (const filePath of files) {
    const rel = normalize(path.relative(ROOT_DIR, filePath));
    hash.update(rel);
    hash.update("\0");
    hash.update(await fs.readFile(filePath));
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function run() {
  if (!existsSync(A2UI_RENDERER_DIR) || !existsSync(A2UI_APP_DIR)) {
    if (existsSync(OUTPUT_FILE)) {
      console.log("A2UI sources missing; keeping prebuilt bundle.");
      process.exit(0);
    }
    console.error(`A2UI sources missing and no prebuilt bundle found at: ${OUTPUT_FILE}`);
    process.exit(1);
  }

  const inputPaths = [
    path.join(ROOT_DIR, "package.json"),
    path.join(ROOT_DIR, "pnpm-lock.yaml"),
    A2UI_RENDERER_DIR,
    A2UI_APP_DIR,
  ];

  const currentHash = await computeHash(inputPaths);
  if (existsSync(HASH_FILE)) {
    const previousHash = await fs.readFile(HASH_FILE, "utf8");
    if (previousHash.trim() === currentHash && existsSync(OUTPUT_FILE)) {
      console.log("A2UI bundle up to date; skipping.");
      process.exit(0);
    }
  }

  console.log("Building A2UI bundle...");

  // Run tsc
  const tscResult = spawnSync(
    "pnpm",
    ["-s", "exec", "tsc", "-p", path.join(A2UI_RENDERER_DIR, "tsconfig.json")],
    {
      shell: true,
      stdio: "inherit",
      cwd: ROOT_DIR,
    },
  );

  if (tscResult.status !== 0) {
    console.error("tsc failed during A2UI bundle.");
    process.exit(tscResult.status ?? 1);
  }

  // Run rolldown
  const configPath = path.join(A2UI_APP_DIR, "rolldown.config.mjs");
  const rolldownResult = spawnSync("pnpm", ["-s", "exec", "rolldown", "-c", configPath], {
    shell: true,
    stdio: "inherit",
    cwd: ROOT_DIR,
  });

  if (rolldownResult.status !== 0) {
    console.error("rolldown failed during A2UI bundle.");
    process.exit(rolldownResult.status ?? 1);
  }

  // Ensure directory exists for hash file
  await fs.mkdir(path.dirname(HASH_FILE), { recursive: true });
  await fs.writeFile(HASH_FILE, currentHash);
  console.log("A2UI bundle completed.");
}

run().catch((err) => {
  console.error("A2UI bundling failed:", err);
  process.exit(1);
});
