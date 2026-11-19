// Leonida Trophy Guide — entrypoint.
// Copies the static guide (app/) and its screenshots (screenshots/) into the
// grader's output directory and writes the dossier the judge reads.
// Run locally with:  MAKEFUN_OUTPUT_DIR=out node main.ts
// (Node 22, standard library only; the dossier builder lives in vendor/.)

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const entryRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function fail(message) {
  throw new Error(`gta6-trophy-guide: ${message}`);
}

// Keep the output deterministic: the grader runs this program twice and
// expects identical bytes both times, so nothing here depends on the clock
// or on directory listing order beyond the sorted copy above.
const shotDir = join(entryRoot, "screenshots");
const shotNames = existsSync(shotDir)
  ? readdirSync(shotDir).filter((n) => !n.startsWith("."))
  : [];
if (shotNames.length < 3 || shotNames.length > 4) {
  fail(`expected 3 or 4 screenshots, found ${shotNames.length}`);
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(entryRoot, "app"), join(outputDir, "app"), { recursive: true });
mkdirSync(join(outputDir, "screenshots"), { recursive: true });
cpSync(shotDir, join(outputDir, "screenshots"), { recursive: true });

// Caps from the bounty gate: text 160 KiB, at most 4 screenshots of 256 KiB,
// app/ at most 993 entries and 48 MiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, "dossier.json"), dossier);
console.log(`wrote ${join(outputDir, "dossier.json")} (${dossier.length} bytes)`);
