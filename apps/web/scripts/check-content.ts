import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { contentSchemas } from "../lib/content-schemas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, "..", "content");

function collectJsonFiles(dir: string): string[] {
  let entries: import("node:fs").Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(full);
    }
  }
  return files;
}

function gameIdForFile(file: string): string {
  const relative = path.relative(contentDir, file);
  return relative.split(path.sep)[0]!.replace(/\.json$/, "");
}

let errorCount = 0;
const files = collectJsonFiles(contentDir);

for (const file of files) {
  const gameId = gameIdForFile(file);
  const schema = contentSchemas[gameId];
  if (!schema) {
    console.error(`No content schema registered for "${gameId}" (${file})`);
    errorCount += 1;
    continue;
  }
  const raw = JSON.parse(readFileSync(file, "utf-8"));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error(`Content validation failed for ${file}:`);
    console.error(parsed.error.format());
    errorCount += 1;
  } else {
    console.log(`OK  ${path.relative(process.cwd(), file)}`);
  }
}

if (errorCount > 0) {
  console.error(`\ncontent:check failed with ${errorCount} error(s).`);
  process.exit(1);
}

console.log(`\ncontent:check passed (${files.length} file(s) validated).`);
