import { existsSync, readFileSync } from "node:fs";
import { brotliCompressSync, gzipSync } from "node:zlib";

const OUTPUTS = [
  "build/index.mjs",
  "build/index.cjs",
  "build/index.umd.js",
  "build/index.d.ts",
];

// The minified browser bundle is what a <script> user downloads; the budget guards it.
const BUDGET_FILE = "build/index.umd.js";
const GZIP_BUDGET_BYTES = 3500;

const missing = OUTPUTS.filter((file) => !existsSync(file));
if (missing.length > 0) {
  console.error(
    `report-size: missing ${missing.join(", ")}; run "npm run build" first`
  );
  process.exit(1);
}

const formatBytes = (bytes) => `${(bytes / 1000).toFixed(2)} kB`;

const rows = OUTPUTS.map((file) => {
  const content = readFileSync(file);
  return {
    file,
    raw: content.length,
    gzip: gzipSync(content, { level: 9 }).length,
    brotli: brotliCompressSync(content).length,
  };
});

console.log("| File | Raw | Gzip | Brotli |");
console.log("| --- | --- | --- | --- |");
for (const { file, raw, gzip, brotli } of rows) {
  console.log(
    `| \`${file}\` | ${formatBytes(raw)} | ${formatBytes(gzip)} | ${formatBytes(brotli)} |`
  );
}

const budgeted = rows.find(({ file }) => file === BUDGET_FILE);
const verdict = budgeted.gzip <= GZIP_BUDGET_BYTES ? "within" : "OVER";
console.log(
  `\n${BUDGET_FILE}: ${budgeted.gzip} B gzip, ${verdict} the ${GZIP_BUDGET_BYTES} B budget`
);

if (budgeted.gzip > GZIP_BUDGET_BYTES) process.exit(1);
