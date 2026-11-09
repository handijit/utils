import { existsSync } from "node:fs";
import { cpus } from "node:os";
import { performance } from "node:perf_hooks";

// The published artefact is what consumers run, so that is what gets measured, not the source.
const BUILD_URL = new URL("../build/index.mjs", import.meta.url);
if (!existsSync(BUILD_URL)) {
  console.error('bench: build/index.mjs is missing; run "npm run build" first');
  process.exit(1);
}

const { debounce, deepClone, isDeepEqual, isDefined, isPlainObject, watcher } =
  await import(BUILD_URL.href);

const WARMUP_ROUNDS = 3;

const makeRecords = (count) =>
  Array.from({ length: count }, (_, id) => ({
    id,
    name: `item-${id}`,
    tags: ["a", "b", "c"],
    meta: { createdAt: new Date(id), ratio: id / 7 },
  }));

const makeMap = (count) =>
  new Map(Array.from({ length: count }, (_, id) => [`key-${id}`, { id }]));

const makeCycle = () => {
  const node = { name: "root", children: makeRecords(100) };
  node.self = node;
  return node;
};

const records100 = makeRecords(100);
const records10k = makeRecords(10_000);
const records100Twin = makeRecords(100);
const records10kTwin = makeRecords(10_000);
const map1k = makeMap(1_000);
const map1kTwin = makeMap(1_000);
const cycle = makeCycle();
const cycleTwin = makeCycle();
const mixedValues = [0, "", null, undefined, {}, [], new Date(0), new Map()];
const debounced = debounce(() => {}, 1_000);
const watched = watcher({ count: 0 }, () => {});

const scenarios = [
  ["isDefined: 8 mixed values", 1_000_000, () => mixedValues.map(isDefined)],
  [
    "isPlainObject: 8 mixed values",
    1_000_000,
    () => mixedValues.map(isPlainObject),
  ],
  [
    "isDeepEqual: 100 records",
    2_000,
    () => isDeepEqual(records100, records100Twin),
  ],
  [
    "isDeepEqual: 10 000 records",
    20,
    () => isDeepEqual(records10k, records10kTwin),
  ],
  ["isDeepEqual: Map of 1 000", 2_000, () => isDeepEqual(map1k, map1kTwin)],
  ["isDeepEqual: circular graph", 2_000, () => isDeepEqual(cycle, cycleTwin)],
  ["deepClone: 100 records", 2_000, () => deepClone(records100)],
  ["deepClone: 10 000 records", 20, () => deepClone(records10k)],
  ["deepClone: Map of 1 000", 2_000, () => deepClone(map1k)],
  ["deepClone: circular graph", 2_000, () => deepClone(cycle)],
  ["debounce: call inside an open window", 1_000_000, () => debounced()],
  [
    "watcher: assignment that changes the value",
    1_000_000,
    () => {
      watched.count += 1;
    },
  ],
];

const measure = (run, iterations) => {
  // Warm-up rounds let the JIT tier the function up before anything is timed.
  for (let round = 0; round < WARMUP_ROUNDS; round++) {
    for (let i = 0; i < iterations; i++) run();
  }
  const startedAt = performance.now();
  for (let i = 0; i < iterations; i++) run();
  return performance.now() - startedAt;
};

console.log(
  `Node ${process.version} · ${cpus()[0]?.model ?? "unknown CPU"} · ${process.platform}/${process.arch}\n`
);
console.log("| Scenario | Iterations | Total (ms) | µs/op |");
console.log("| --- | ---: | ---: | ---: |");
for (const [name, iterations, run] of scenarios) {
  const totalMs = measure(run, iterations);
  const microsPerOp = (totalMs * 1_000) / iterations;
  console.log(
    `| ${name} | ${iterations.toLocaleString("en-US")} | ${totalMs.toFixed(1)} | ${microsPerOp.toFixed(3)} |`
  );
}

// The open debounce window holds a live timer; without this the process would idle for a second.
debounced.cancel();
