# @handijit/utils

<p align="center">
  <a href="https://www.npmjs.com/package/@handijit/utils"><img alt="npm version" src="https://img.shields.io/npm/v/@handijit/utils.svg" /></a>
  <a href="https://www.npmjs.com/package/@handijit/utils"><img alt="npm downloads" src="https://img.shields.io/npm/dy/@handijit/utils" /></a>
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue" /></a>
</p>

> Formerly published as `@ahmetilhn/handy-utils`. `@handijit/utils` 1.0.0 is the
> same code as `@ahmetilhn/handy-utils` 4.2.0.

A small, dependency-free toolkit of the checks and helpers most projects end up
rewriting: type guards that actually narrow, a structural equality function that
does not lie about `Map`s and `URL`s, a clone that survives circular references,
and a handful of everyday utilities.

- **22 functions, 0 runtime dependencies.**
- **2.84 kB gzip** for the whole minified browser bundle; tree-shakeable
  (`"sideEffects": false`), so a bundler ships only the functions you import.
- **ESM, CommonJS and a `<script>` build**, each with its own type declarations.
- **Written in TypeScript.** Every guard is a real type predicate.
- **Correct on hard inputs.** Circular references, `NaN`, `-0`, `Map`, `Set`,
  `Date`, `RegExp`, typed arrays and class instances are all handled.
- **Isomorphic.** Runs on Node.js 24+ and in ES2022 browsers; nothing touches
  `window` unless you call a browser helper.
- **Roughly linear cost.** `isDeepEqual` and `deepClone` take about 0.04 ms for 100
  records and 4 to 5 ms for 10 000 ([Performance](#performance)).
- **287 tests, 100% coverage** of statements, branches, functions and lines,
  enforced in CI.

---

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [When to use it](#when-to-use-it)
- [API reference](#api-reference)
  - [Comparison and cloning](#comparison-and-cloning) — `isDeepEqual`, `deepClone`
  - [Type guards](#type-guards) — `isArray`, `isBoolean`, `isDate`, `isDefined`, `isFunction`, `isNull`, `isNumber`, `isObject`, `isPlainObject`, `isUndefined`, `hasPlainObjectRecord`
  - [Environment](#environment) — `isClient`, `isServer`
  - [Device](#device) — `isAndroid`, `isIos`
  - [Utilities](#utilities) — `debounce`, `normalize`, `sleep`, `watcher`, `withRetry`
- [Guides](#guides)
- [Server-side rendering](#server-side-rendering)
- [Semantics](#semantics)
- [Performance](#performance)
- [Bundle size](#bundle-size)
- [TypeScript](#typescript)
- [FAQ and troubleshooting](#faq-and-troubleshooting)
- [Migrating from 1.x](#migrating-from-1x)
- [Contributing](#contributing)
- [Releasing](#releasing)
- [License](#license)

---

## Requirements

Node.js **24 or newer**. In the browser, any engine supporting ES2022 — every
evergreen release since 2022.

## Installation

```bash
npm install @handijit/utils
```

```bash
yarn add @handijit/utils
```

```bash
pnpm add @handijit/utils
```

## Quick start

Everything is a named export, so bundlers drop what you do not use.

```ts
import { isDeepEqual, deepClone, isDefined, sleep } from "@handijit/utils";

isDeepEqual({ a: [1, 2] }, { a: [1, 2] }); // true
deepClone(new Map([["k", { n: 1 }]])); // a real Map, deeply copied

const values = [1, null, 2];
const defined = values.filter(isDefined); // number[] — narrowed

await sleep(200);
```

CommonJS works the same way:

```js
const { isDeepEqual } = require("@handijit/utils");
```

## When to use it

Use it when you want a handful of well-tested checks and helpers without adding
a dependency tree: comparing or copying application state that contains `Map`s,
`Set`s, dates or cycles, narrowing `unknown` values at a boundary, debouncing an
event handler, retrying a flaky request.

Reach for something else when:

- you need the long tail of collection helpers (`groupBy`, `merge`, `get`,
  `throttle`); this package does not have them;
- you are copying values across a worker or `postMessage` boundary; the
  platform's `structuredClone` is built for that. `deepClone` differs from it by
  keeping prototypes, methods and functions;
- you need reactivity with batching, nested tracking or computed values;
  `watcher` reports top-level assignments on one object and nothing more;
- you need full user-agent parsing; `isAndroid` and `isIos` answer one question
  each.

---

## API reference

### Comparison and cloning

#### `isDeepEqual`

Structural equality with `Object.is` semantics for primitives. Safe against
circular references.

```ts
isDeepEqual(valOne: unknown, valTwo: unknown): boolean
```

| Name     | Type      | Default  | Description       |
| -------- | --------- | -------- | ----------------- |
| `valOne` | `unknown` | required | Left-hand value.  |
| `valTwo` | `unknown` | required | Right-hand value. |

**Returns** `boolean`: `true` when both values have the same structure and content.

```ts
// Primitives use Object.is: NaN matches itself, 0 and -0 stay distinct
isDeepEqual(10, 10); // true
isDeepEqual(NaN, NaN); // true
isDeepEqual(0, -0); // false
isDeepEqual(1, "1"); // false
isDeepEqual(null, undefined); // false

// Objects and arrays compare by content; key order is irrelevant
isDeepEqual({ name: "john" }, { name: "john" }); // true
isDeepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }); // true
isDeepEqual({ a: 1 }, { a: 1, b: 2 }); // false
isDeepEqual([1, [2]], [1, [2]]); // true
isDeepEqual([1, 2], [2, 1]); // false — order matters in arrays

// Built-ins compare by value
isDeepEqual(new Date(5), new Date(5)); // true
isDeepEqual(/foo/g, /foo/i); // false — flags differ
isDeepEqual(new Map([["a", 1]]), new Map([["a", 1]])); // true
isDeepEqual(new Set([1, 2]), new Set([2, 1])); // true — order irrelevant
isDeepEqual(new Error("boom"), new Error("boom")); // true
isDeepEqual(new URL("https://a.com"), new URL("https://b.com")); // false
isDeepEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2])); // true

// Class instances need a matching prototype as well as matching fields
class Point {
  constructor(public x: number) {}
}
isDeepEqual(new Point(1), new Point(1)); // true
isDeepEqual(new Point(1), { x: 1 }); // false

// Functions are equal only by reference
const fn = () => 10;
isDeepEqual(fn, fn); // true
isDeepEqual(
  () => 10,
  () => 10
); // false

// Circular input is handled
const a: any = { name: "a" };
a.self = a;
const b: any = { name: "a" };
b.self = b;
isDeepEqual(a, b); // true
```

**Why functions compare by reference.** Two functions with identical source can
capture different closure state, so they are not interchangeable:

```ts
const make = (k: number) => (x: number) => x + k;
make(1)(0); // 1
make(99)(0); // 99
// Identical source, different behaviour — comparing toString() would call
// these equal. lodash and Node's assert.deepStrictEqual agree: not equal.
```

**Values with no observable structure** — `WeakMap`, `WeakSet`, `Promise`,
generators, DOM nodes — can only be compared by reference. See
[Semantics](#semantics) for the full table.

---

#### `deepClone`

Recursive structural clone that disconnects every data binding. Safe against
circular and shared references, and preserves prototypes.

```ts
deepClone<T>(val: T): T
```

| Name  | Type | Default  | Description                             |
| ----- | ---- | -------- | --------------------------------------- |
| `val` | `T`  | required | The value to copy. It is never mutated. |

**Returns** `T`: a copy that shares no mutable structure with the input, apart
from the values listed under "Shared by reference on purpose" below.

```ts
const original = { name: "test", tags: ["a"] };
const copy = deepClone(original);

copy !== original; // a new reference
copy.tags !== original.tags; // nested values copied too
isDeepEqual(copy, original); // structurally identical

// Built-ins keep their type
deepClone(new Map([["a", 1]])) instanceof Map; // true
deepClone(new Set([1])) instanceof Set; // true
deepClone(/foo/g) instanceof RegExp; // true — source, flags and lastIndex kept
deepClone(new Date()) instanceof Date; // true
deepClone(new Uint8Array([1, 2])) instanceof Uint8Array; // true
deepClone(new Error("boom")) instanceof Error; // true — name, stack, cause kept

// Class instances keep their prototype and therefore their methods
class Person {
  constructor(public name: string) {}
  greet() {
    return `hi ${this.name}`;
  }
}
deepClone(new Person("Ada")).greet(); // "hi Ada"

// Object.create(null) stays prototype-less
Object.getPrototypeOf(deepClone(Object.create(null))); // null

// Sparse arrays keep their length and their holes
deepClone([, 1, , 2]).length; // 4

// Enumerable symbol keys are copied
const id = Symbol("id");
deepClone({ [id]: 1 })[id]; // 1
```

**Circular and shared references:**

```ts
const node: any = { name: "root" };
node.self = node;
const copy = deepClone(node);
copy.self === copy; // true — the cycle is rebuilt, not followed forever

// Sharing is preserved within one clone
const shared = { n: 1 };
const cloned = deepClone({ a: shared, b: shared });
cloned.a === cloned.b; // true
```

**Shared by reference on purpose:** functions, `WeakMap`, `WeakSet` and
`Promise`. Copying them is not meaningful — a cloned function would break
identity comparisons, and a weak collection's contents are not enumerable.

**Not supported:** `URL`, `URLSearchParams` and boxed primitives. See
[Known limitations](#known-limitations).

---

### Type guards

Every guard below is a TypeScript type predicate, so it narrows inside `if`
blocks and works as a `.filter()` argument.

#### `isDefined`

Neither `null` nor `undefined`. Narrows to `NonNullable<T>`.

```ts
isDefined<T>(val: T): val is NonNullable<T>
```

| Name  | Type | Default  | Description        |
| ----- | ---- | -------- | ------------------ |
| `val` | `T`  | required | The value to test. |

**Returns** `val is NonNullable<T>`.

```ts
isDefined("value"); // true
isDefined(0); // true — falsy, but defined
isDefined(""); // true
isDefined(false); // true
isDefined(null); // false
isDefined(undefined); // false

// Narrowing
declare const maybe: string | null | undefined;
if (isDefined(maybe)) {
  maybe.toUpperCase(); // string
}

// As a filter predicate
const values: Array<number | null> = [1, null, 2];
const defined: number[] = values.filter(isDefined); // [1, 2]
```

#### `isNull`

```ts
isNull(val: unknown): val is null
```

| Name  | Type      | Default  | Description        |
| ----- | --------- | -------- | ------------------ |
| `val` | `unknown` | required | The value to test. |

**Returns** `val is null`.

```ts
isNull(null); // true
isNull(undefined); // false
isNull(0); // false
```

#### `isUndefined`

```ts
isUndefined(val: unknown): val is undefined
```

| Name  | Type      | Default  | Description        |
| ----- | --------- | -------- | ------------------ |
| `val` | `unknown` | required | The value to test. |

**Returns** `val is undefined`.

```ts
isUndefined(undefined); // true
isUndefined(null); // false
```

#### `isNumber`

A **finite** number. `NaN` and `Infinity` are numbers by `typeof` but not values
you can compute with, so both are rejected.

```ts
isNumber(val: unknown): val is number
```

| Name  | Type      | Default  | Description        |
| ----- | --------- | -------- | ------------------ |
| `val` | `unknown` | required | The value to test. |

**Returns** `val is number`.

```ts
isNumber(1); // true
isNumber(-5.5); // true
isNumber(0); // true

isNumber(NaN); // false
isNumber(Infinity); // false
isNumber("1"); // false
isNumber(null); // false
isNumber(new Number(1)); // false — boxed, typeof is "object"
```

#### `isBoolean`

```ts
isBoolean(val: unknown): val is boolean
```

| Name  | Type      | Default  | Description        |
| ----- | --------- | -------- | ------------------ |
| `val` | `unknown` | required | The value to test. |

**Returns** `val is boolean`: `true` for the primitives `true` and `false` only.

```ts
isBoolean(true); // true
isBoolean(false); // true
isBoolean(0); // false
isBoolean(new Boolean(true)); // false — boxed, not a primitive
```

#### `isArray`

```ts
isArray(val: unknown): val is Array<any>
```

| Name  | Type      | Default  | Description        |
| ----- | --------- | -------- | ------------------ |
| `val` | `unknown` | required | The value to test. |

**Returns** `val is Array<any>`.

```ts
isArray([]); // true
isArray([1, 2]); // true
isArray("ab"); // false
isArray(new Uint8Array()); // false — a typed array is not an Array
isArray({ length: 0 }); // false
```

#### `isObject`

Any non-null value of `typeof "object"`. Arrays and dates count; functions do
not. For "is this a `{}`-style object", use [`isPlainObject`](#isplainobject).

```ts
isObject(val: unknown): val is object
```

| Name  | Type      | Default  | Description        |
| ----- | --------- | -------- | ------------------ |
| `val` | `unknown` | required | The value to test. |

**Returns** `val is object`.

```ts
isObject({}); // true
isObject([]); // true
isObject(new Date()); // true
isObject(null); // false
isObject(() => {}); // false
```

#### `isPlainObject`

An object created by an object literal, `new Object()` or `Object.create(null)`
— its prototype is `Object.prototype` or `null`. Built-ins and class instances
are objects but not plain: their state lives in internal slots or behind
prototype accessors, not in own enumerable keys.

```ts
isPlainObject(val: unknown): val is Record<string, unknown>
```

| Name  | Type      | Default  | Description        |
| ----- | --------- | -------- | ------------------ |
| `val` | `unknown` | required | The value to test. |

**Returns** `val is Record<string, unknown>`.

```ts
isPlainObject({}); // true
isPlainObject({ name: "john" }); // true
isPlainObject(Object.create(null)); // true

isPlainObject([]); // false
isPlainObject(new Date()); // false
isPlainObject(new Map()); // false
isPlainObject(new URL("https://a.com")); // false
isPlainObject(new (class Point {})()); // false
isPlainObject(null); // false
```

Cross-realm objects (from an iframe or a `vm` context) are recognised too.

#### `isDate`

A `Date` instance. Note this is a type check, not a validity check — an invalid
date is still a `Date`.

```ts
isDate(val: unknown): val is Date
```

| Name  | Type      | Default  | Description        |
| ----- | --------- | -------- | ------------------ |
| `val` | `unknown` | required | The value to test. |

**Returns** `val is Date`.

```ts
isDate(new Date()); // true
isDate(new Date("nope")); // true — still a Date object
isDate(Date.now()); // false — that is a number
isDate("2023-01-01"); // false
```

To also require validity: `isDate(v) && !Number.isNaN(v.getTime())`.

#### `isFunction`

Any callable, including arrow, async, generator and async-generator functions,
and class constructors.

```ts
isFunction(val: unknown): val is Function
```

| Name  | Type      | Default  | Description        |
| ----- | --------- | -------- | ------------------ |
| `val` | `unknown` | required | The value to test. |

**Returns** `val is Function`.

```ts
isFunction(() => {}); // true
isFunction(async () => {}); // true
isFunction(function* () {}); // true
isFunction(class Foo {}); // true
isFunction(Math.max); // true

isFunction({}); // false
isFunction(null); // false
```

#### `hasPlainObjectRecord`

Whether a plain object carries any own enumerable entry. **Throws** for anything
that is not a plain object.

```ts
hasPlainObjectRecord(val: unknown): boolean
```

| Name  | Type      | Default  | Description                                              |
| ----- | --------- | -------- | -------------------------------------------------------- |
| `val` | `unknown` | required | Must be a plain object; anything else throws an `Error`. |

**Returns** `boolean`: `true` when the object has at least one own enumerable
string or symbol key.

```ts
hasPlainObjectRecord({}); // false
hasPlainObjectRecord({ a: 1 }); // true
hasPlainObjectRecord({ [Symbol("id")]: 1 }); // true — symbol keys count

hasPlainObjectRecord(new Map()); // throws Error
hasPlainObjectRecord(null); // throws Error
```

---

### Environment

#### `isClient` / `isServer`

Whether a `window` global exists. Safe to call anywhere — neither touches
`window` unless it is present, so both are SSR-safe.

```ts
isClient(): boolean
isServer(): boolean
```

Neither function takes a parameter.

**Returns** `boolean`.

```ts
// In a browser
isClient(); // true
isServer(); // false

// In Node
isClient(); // false
isServer(); // true
```

```ts
if (isClient()) {
  localStorage.setItem("visited", "1");
}
```

---

### Device

Both detectors accept an optional user agent. Pass one to test a string
directly — useful on the server, where request headers are the only source.
Omit it to read `navigator.userAgent`, which **throws** outside the browser.

#### `isAndroid`

```ts
isAndroid(userAgent?: string): boolean
```

| Name        | Type     | Default               | Description             |
| ----------- | -------- | --------------------- | ----------------------- |
| `userAgent` | `string` | `navigator.userAgent` | The user agent to test. |

**Returns** `boolean`. Throws an `Error` when no user agent is passed and there
is no `window`.

```ts
isAndroid("Mozilla/5.0 (Linux; Android 14; Pixel 8)"); // true
isAndroid("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"); // false
isAndroid(""); // false — an empty string is still a supplied user agent

isAndroid(); // reads navigator; throws on the server
```

#### `isIos`

Also recognises **iPadOS 13 and newer**, which reports itself as "Macintosh" and
is otherwise indistinguishable from a desktop Mac. The tell is touch support, so
this only applies when reading the live navigator; a supplied string is judged
on its own.

```ts
isIos(userAgent?: string): boolean
```

| Name        | Type     | Default               | Description             |
| ----------- | -------- | --------------------- | ----------------------- |
| `userAgent` | `string` | `navigator.userAgent` | The user agent to test. |

**Returns** `boolean`. Throws an `Error` when no user agent is passed and there
is no `window`.

```ts
isIos("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)"); // true
isIos("Mozilla/5.0 (iPad; CPU OS 17_0)"); // true
isIos("Mozilla/5.0 (Linux; Android 14)"); // false
isIos(""); // false

isIos(); // reads navigator, including the iPadOS check
```

Server-side usage from a request header:

```ts
const ua = request.headers["user-agent"] ?? "";
const isMobile = isIos(ua) || isAndroid(ua);
```

---

### Utilities

#### `debounce`

Delay a function until the calls stop coming. Every call inside the window
restarts it, so a burst collapses into a single invocation with the arguments of
the last call. The receiver and the arguments are passed through untouched.

```ts
debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: {
    leading?: boolean;   // invoke on the leading edge — default false
    trailing?: boolean;  // invoke on the trailing edge — default true
    maxWait?: number;    // never defer longer than this
  }
): Debounced<T>;

type Debounced<T> = {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel: () => void;                      // drop the pending call
  flush: () => ReturnType<T> | undefined;  // run the pending call now
  pending: () => boolean;
};
```

| Name               | Type      | Default  | Description                                                           |
| ------------------ | --------- | -------- | --------------------------------------------------------------------- |
| `fn`               | `T`       | required | The function to debounce.                                             |
| `wait`             | `number`  | required | Quiet period in milliseconds. Negative values and `NaN` count as `0`. |
| `options.leading`  | `boolean` | `false`  | Invoke on the leading edge of the window.                             |
| `options.trailing` | `boolean` | `true`   | Invoke on the trailing edge of the window.                            |
| `options.maxWait`  | `number`  | none     | Upper bound in milliseconds on how long a call can be deferred.       |

**Returns** `Debounced<T>`: the wrapper, with `cancel`, `flush` and `pending`.

```ts
const search = debounce((term: string) => fetchResults(term), 300);

search("h");
search("ha");
search("han"); // only this one runs, 300ms after the last keystroke
```

```ts
// Leading edge: react to the first event, ignore the rest of the burst
const onScrollStart = debounce(track, 200, { leading: true, trailing: false });

// maxWait: a stream of events that never pauses still gets served every 500ms
const onResize = debounce(relayout, 100, { maxWait: 500 });

onResize.pending(); // true while a call is waiting
onResize.flush(); // run it now instead of waiting
onResize.cancel(); // or throw it away — e.g. on unmount
```

Notes:

- The return value is the result of the **previous** invocation; a deferred call
  has not produced one yet. For a result you can await, wrap the call in a
  promise yourself.
- `cancel` resets the window completely, so the next call counts as the first.
- `flush` returns the last result untouched when nothing is pending.
- With `leading: true`, a lone call fires once — there is nothing left to
  replay on the trailing edge.
- `maxWait` shorter than `wait` is clamped to `wait`; a non-positive `wait`
  defers to the next timer tick.
- Timing reads `Date.now()`, so a clock jump starts a fresh window instead of
  wedging the timer.

#### `normalize`

Express a value as a percentage of a maximum. Capped at 100 and rounded to two
decimals.

```ts
normalize(value: number, max: number): number
```

| Name    | Type     | Default  | Description                                       |
| ------- | -------- | -------- | ------------------------------------------------- |
| `value` | `number` | required | The amount, `0` or greater.                       |
| `max`   | `number` | required | The amount that counts as 100%, greater than `0`. |

**Returns** `number`: between `0` and `100`, rounded to two decimals.

```ts
normalize(50, 200); // 25
normalize(1, 3); // 33.33
normalize(2, 3); // 66.67
normalize(100, 100); // 100
normalize(150, 100); // 100 — capped
normalize(0, 100); // 0
```

Throws on invalid input:

```ts
normalize(5, 0); // RangeError — max must be greater than 0
normalize(5, -10); // RangeError
normalize(-1, 100); // RangeError — value must be non-negative
normalize(NaN, 100); // Error — Max or value must be number
normalize(null as any, 100); // Error — non-numbers are rejected
```

#### `sleep`

Pause for a number of milliseconds.

```ts
sleep(time: number): Promise<void>
```

| Name   | Type     | Default  | Description                        |
| ------ | -------- | -------- | ---------------------------------- |
| `time` | `number` | required | How long to wait, in milliseconds. |

**Returns** `Promise<void>`: resolves once the time has passed.

```ts
const pollEverySecond = async () => {
  while (running) {
    await check();
    await sleep(1000);
  }
};
```

#### `watcher`

Wrap an object in a proxy that reports every change. Assignments and deletions
both notify; a redundant assignment does not. The proxy writes through, so the
original object stays in sync.

```ts
watcher<T extends object>(target: T, onChange: WatcherCallback<T>): T

type WatcherCallback<T extends object> = (
  key: keyof T,
  value: T[keyof T] | undefined,      // undefined when the key was deleted
  previous: T[keyof T] | undefined
) => void;
```

| Name       | Type                 | Default  | Description                                                |
| ---------- | -------------------- | -------- | ---------------------------------------------------------- |
| `target`   | `T extends object`   | required | The object to observe. Writes go through to it.            |
| `onChange` | `WatcherCallback<T>` | required | Called with the key, the new value and the previous value. |

**Returns** `T`: a proxy over `target`. Only changes made through the proxy are
reported.

```ts
const state = watcher({ count: 0, name: "Ada" }, (key, value, previous) => {
  console.log(`${String(key)}: ${previous} → ${value}`);
});

state.count = 1; // "count: 0 → 1"
state.count = 1; // nothing — the value did not change
state.name = "Grace"; // "name: Ada → Grace"
delete state.count; // "count: 1 → undefined"
```

Notes:

- Equality uses `Object.is`, so assigning `NaN` over `NaN` is not a change.
- Assigning to a key that does not exist yet always reports, even if the value
  is `undefined`.
- Setters on the target still run; the watcher does not bypass them.
- Arrays work. A `push` reports the new index only: the array has already
  updated `length` by the time the engine assigns it, so that assignment is
  redundant.

#### `withRetry`

Run an async function, retrying with exponential backoff while it fails with a
given error type. Returns `null` once the attempts are exhausted. Any other
error class is rethrown immediately, without retrying.

```ts
withRetry<T>(props: {
  fn: () => Promise<T>;
  retries: number;   // total attempts, not extra attempts
  delay: number;     // base delay in ms; waits delay * 2 ** attemptIndex
  exception: new (...args: any[]) => Error;
}): Promise<T | null>
```

| Name        | Type                            | Default  | Description                                                                      |
| ----------- | ------------------------------- | -------- | -------------------------------------------------------------------------------- |
| `fn`        | `() => Promise<T>`              | required | The async operation to attempt.                                                  |
| `retries`   | `number`                        | required | Total number of attempts, not extra attempts.                                    |
| `delay`     | `number`                        | required | Base delay in milliseconds; the wait before attempt `n + 1` is `delay * 2 ** n`. |
| `exception` | `new (...args: any[]) => Error` | required | The error class that triggers a retry.                                           |

**Returns** `Promise<T | null>`: the result of `fn`, or `null` once every attempt
has failed with `exception`.

```ts
class NetworkError extends Error {}

const data = await withRetry({
  fn: () => fetchFromApi(),
  retries: 3,
  delay: 100, // waits 100ms after the first failure, then 200ms
  exception: NetworkError,
});

if (data === null) {
  // all three attempts threw a NetworkError
}
```

```ts
// A different error class is not retried
await withRetry({
  fn: async () => {
    throw new TypeError("bad input");
  },
  retries: 3,
  delay: 100,
  exception: NetworkError,
}); // rejects with the TypeError immediately
```

Pass `exception: Error` to retry every error. Note that `retries: 0` returns
`null` without ever calling `fn`.

---

## Guides

### Skip an update when nothing changed

```ts
import { deepClone, isDeepEqual } from "@handijit/utils";

let saved = deepClone(form);

const onSubmit = async () => {
  if (isDeepEqual(form, saved)) return; // nothing to send
  await save(form);
  saved = deepClone(form); // a snapshot later edits cannot reach
};
```

### Debounce a search box and clean up after it

```ts
import { debounce } from "@handijit/utils";

const search = debounce((term: string) => fetchResults(term), 300, {
  maxWait: 1000, // a user who never stops typing still gets results
});

input.addEventListener("input", () => search(input.value));

// When the view goes away: run the last keystroke, or drop it.
const onLeave = () => search.flush();
const onDestroy = () => search.cancel();
```

`cancel` and `flush` both clear the timer, so nothing keeps running after the
view is gone.

### Retry a flaky request, and only that

```ts
import { withRetry } from "@handijit/utils";

class NetworkError extends Error {}

const load = () =>
  withRetry({
    fn: async () => {
      const response = await fetch("/api/items").catch(() => {
        throw new NetworkError("offline");
      });
      if (response.status >= 500) throw new NetworkError("server error");
      return response.json(); // a 4xx is returned as-is and never retried
    },
    retries: 3,
    delay: 200, // waits 200 ms, then 400 ms
    exception: NetworkError,
  });

const items = await load();
if (items === null) {
  // three attempts, three NetworkErrors
}
```

### Persist an object on every change

```ts
import { debounce, watcher } from "@handijit/utils";

const persist = debounce(
  () => localStorage.setItem("settings", JSON.stringify(settings)),
  250
);

const settings = watcher({ theme: "dark", fontSize: 14 }, persist);

settings.theme = "light"; // schedules one write
settings.fontSize = 16; // same window: still one write
```

---

## Server-side rendering

The package can be imported anywhere: loading it runs no code, sets no timer and
reads no global. Browser globals are only read inside the functions that need
them.

| Function                     | On the server (no `window`)                              |
| ---------------------------- | -------------------------------------------------------- |
| `isClient()` / `isServer()`  | `false` / `true`                                         |
| `isAndroid(ua)`, `isIos(ua)` | Work with the user agent you pass                        |
| `isAndroid()`, `isIos()`     | Throw: no user agent was passed and there is no `window` |
| Everything else              | Identical on the server and in the browser               |

```ts
// Next.js, Nuxt, Remix, Express: judge the request, not the server
const ua = request.headers["user-agent"] ?? "";
const isMobile = isIos(ua) || isAndroid(ua);

// Browser-only work stays behind the check
if (isClient()) {
  window.addEventListener("resize", onResize);
}
```

iPadOS 13 and newer can only be detected in the browser, because the tell is
touch support and not the user agent string.

---

## Semantics

`isDeepEqual` and `deepClone` classify values the same way. Knowing the table
explains both.

| Input                                                  | `isDeepEqual`                          | `deepClone`                                             |
| ------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------- |
| Primitives                                             | `Object.is` — `NaN` matches, `0 ≠ -0`  | Returned as-is                                          |
| Plain objects, arrays                                  | By content, key order irrelevant       | Deep copy, holes preserved                              |
| `Date`                                                 | By timestamp                           | New `Date`                                              |
| `RegExp`                                               | By source and flags                    | New `RegExp`, `lastIndex` kept                          |
| `Map`, `Set`                                           | By content, insertion order irrelevant | New `Map` / `Set`, entries cloned                       |
| `Error`                                                | By name and message                    | Same class, stack and cause kept                        |
| Boxed `Number` / `String` / `Boolean`                  | By primitive value                     | Not supported ([Known limitations](#known-limitations)) |
| `ArrayBuffer`, `DataView`, typed arrays                | Byte by byte                           | New buffer, bytes copied                                |
| `URL`, `URLSearchParams`                               | By string form                         | Not supported ([Known limitations](#known-limitations)) |
| Class instances                                        | Same prototype **and** same fields     | Same prototype, fields copied                           |
| Functions                                              | Reference only                         | Shared by reference                                     |
| `WeakMap`, `WeakSet`, `Promise`, generators, DOM nodes | Reference only                         | Shared by reference                                     |
| Circular references                                    | Handled                                | Handled                                                 |

Only **own enumerable** properties participate, including symbol keys.
Inherited properties are ignored.

---

## Performance

Output of `npm run bench`, which measures the built `build/index.mjs` after
three warm-up rounds. A record is
`{ id, name, tags: [3 strings], meta: { createdAt: Date, ratio } }`.

Node v26.11.0 · Apple M5 · darwin/arm64

| Scenario                                   | Iterations | Total (ms) |    µs/op |
| ------------------------------------------ | ---------: | ---------: | -------: |
| isDefined: 8 mixed values                  |  1,000,000 |       14.8 |    0.015 |
| isPlainObject: 8 mixed values              |  1,000,000 |      128.2 |    0.128 |
| isDeepEqual: 100 records                   |      2,000 |       89.9 |   44.944 |
| isDeepEqual: 10 000 records                |         20 |      102.3 | 5114.925 |
| isDeepEqual: Map of 1 000                  |      2,000 |      287.5 |  143.745 |
| isDeepEqual: circular graph                |      2,000 |       88.5 |   44.227 |
| deepClone: 100 records                     |      2,000 |       72.1 |   36.068 |
| deepClone: 10 000 records                  |         20 |       80.9 | 4043.246 |
| deepClone: Map of 1 000                    |      2,000 |      189.7 |   94.865 |
| deepClone: circular graph                  |      2,000 |       69.8 |   34.893 |
| debounce: call inside an open window       |  1,000,000 |       24.3 |    0.024 |
| watcher: assignment that changes the value |  1,000,000 |       39.6 |    0.040 |

Cost grows roughly linearly with the size of the input: 100 times the records
costs about 110 times the time. A call to a debounced function inside an open window
arms no new timer.

## Bundle size

Output of `npm run size`:

| File                 |      Raw |    Gzip |  Brotli |
| -------------------- | -------: | ------: | ------: |
| `build/index.mjs`    | 23.85 kB | 6.44 kB | 5.53 kB |
| `build/index.cjs`    | 24.29 kB | 6.52 kB | 5.60 kB |
| `build/index.umd.js` |  7.94 kB | 2.84 kB | 2.55 kB |
| `build/index.d.ts`   |  5.06 kB | 1.94 kB | 1.61 kB |

The ESM and CommonJS files are published unminified, with comments and source
maps, because your bundler minifies them. The minified browser bundle is the
number that reaches users when nothing is tree-shaken; CI fails if it grows past
3.5 kB gzip.

Entry points:

| Consumer           | File                                                               | Selected by                                             |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------- |
| ESM `import`       | `build/index.mjs`                                                  | `exports["."].import`, `module`                         |
| CommonJS `require` | `build/index.cjs`                                                  | `exports["."].require`, `main`                          |
| `<script>`         | `build/index.umd.js` (minified, global `handijitUtils`)            | `unpkg`, `jsdelivr`                                     |
| TypeScript         | `build/index.d.mts` for `import`, `build/index.d.ts` for `require` | the `types` condition of each branch, top-level `types` |

```html
<script src="https://unpkg.com/@handijit/utils@2"></script>
<script>
  handijitUtils.isDeepEqual([1, 2], [1, 2]); // true
</script>
```

Only the package root and `@handijit/utils/package.json` can be imported; there
are no deep import paths.

---

## TypeScript

Types ship with the package; nothing extra to install. They resolve under
`moduleResolution` `node10`, `node16`, `nodenext` and `bundler`, from both ESM
and CommonJS files.

```ts
import {
  isDefined,
  watcher,
  type DebounceOptions,
  type Debounced,
  type WatcherCallback,
} from "@handijit/utils";
```

Every `is*` function is a type predicate, so narrowing works in conditionals,
ternaries and `.filter()`:

```ts
declare const input: unknown;

if (isPlainObject(input)) {
  input.anyKey; // Record<string, unknown>
}

const cleaned = ["a", null, "b"].filter(isDefined); // string[]
```

`deepClone` preserves the input type:

```ts
const copy = deepClone({ list: [1, 2], when: new Date() });
// { list: number[]; when: Date }
```

---

## FAQ and troubleshooting

**`SyntaxError: The requested module '@handijit/utils' does not provide an
export named 'default'`**
There is no default export. Use named imports, or `import * as utils from
"@handijit/utils"` when you want everything on one object.

**`ERR_PACKAGE_PATH_NOT_EXPORTED` for `@handijit/utils/build/...`**
Since 2.0.0 the package declares an `exports` map, and only the root is public.
Import from `"@handijit/utils"`.

**Does it work with Jest?**
Yes. Jest resolves the `require` condition and loads `build/index.cjs`, so no
transform or `transformIgnorePatterns` entry is needed.

**An application loads both the ESM and the CommonJS file. Is that a problem?**
No. The package keeps no module-level state, so two copies behave exactly like
one.

**Why does `isNumber(Infinity)` return `false`?**
`isNumber` means "a number you can compute with". Use `typeof v === "number"`
when you want the raw type check.

**Why does `withRetry` return `null` instead of throwing?**
Running out of attempts is reported as `null`, and the last error is not
surfaced. If you need the error, catch it inside `fn` and return it as a value.

### Known limitations

These are current behaviour, not design. Fixing any of them changes an
observable result, which makes it a major release.

- `deepClone` does not support `URL`, `URLSearchParams`, boxed primitives
  (`new Number(1)`) or `SharedArrayBuffer`: the copy has the right prototype but
  none of the internal state, and its methods throw.
- `deepClone` and `isDeepEqual` recurse without a depth limit. A structure
  nested 20 000 levels deep overflows the stack with a `RangeError`.
- `deepClone` assigns an own `"__proto__"` key (as produced by
  `JSON.parse('{"__proto__": {}}')`) instead of defining it, so it becomes the
  prototype of the copy. `Object.prototype` itself is not modified.
- `isDeepEqual` can return `true` for unequal inputs when two objects are first
  tried against each other as `Set` members or `Map` keys, fail to match, and
  are compared again later in the same call.
- The guards read `Object.prototype.toString`, so a custom
  `Symbol.toStringTag` can mislead `isDate` and `isArray`.
- `debounce` and `sleep` pass the delay to `setTimeout` unchecked. Above
  2 147 483 647 ms Node.js falls back to a 1 ms timer: `sleep` resolves after
  1 ms, and `debounce` re-arms a 1 ms timer until the wait has passed.
- `isClient()` is `false` in a Web Worker, where there is no `window`.

---

## Migrating from 1.x

2.0.0 changes how the package is built and resolved. **The behaviour of all 22
functions is unchanged**: the source compiles to byte-identical code under the
1.0.0 build settings, and the 1.0.0 test suite was ported to Vitest without
dropping a test.

| Case                                                             | 1.x                                            | 2.0.0                                                                    |
| ---------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| `require("@handijit/utils")`                                     | `build/index.js`                               | `build/index.cjs`; same exports                                          |
| `import { … } from "@handijit/utils"` in Node.js                 | The CommonJS file, through interop             | `build/index.mjs`, a real ES module                                      |
| `import utils from "@handijit/utils"` (default import)           | Worked in Node.js ESM through CommonJS interop | `SyntaxError`; use named imports or `import * as utils`                  |
| `require("@handijit/utils/build/index.js")` and other deep paths | Resolved                                       | `ERR_PACKAGE_PATH_NOT_EXPORTED`; import from the package root            |
| `require("@handijit/utils/package.json")`                        | Resolved                                       | Still resolved, now through `exports`                                    |
| Published JavaScript                                             | One minified CommonJS file                     | Unminified ESM and CommonJS with source maps, plus a minified UMD bundle |
| Tree-shaking                                                     | Depended on the bundler's CommonJS analysis    | ES module with `"sideEffects": false`                                    |
| Type declarations                                                | `build/index.d.ts`                             | `build/index.d.ts` and an identical `build/index.d.mts`                  |
| `<script>` usage                                                 | Not available                                  | `build/index.umd.js`, global `handijitUtils`                             |
| Node.js floor                                                    | 24                                             | 24                                                                       |

If you only ever wrote `import { … } from "@handijit/utils"` or
`const { … } = require("@handijit/utils")`, there is nothing to change.

### From `@ahmetilhn/handy-utils` 3.x

These changes shipped in `@ahmetilhn/handy-utils` 4.0.0 and are part of every
`@handijit/utils` release. `isDeepEqual`, `deepClone`, `isPlainObject` and
`isFunction` returned wrong answers for several common inputs; fixing them
changed observable behaviour.

| Case                                                           | 3.x                              | 4.0.0                                                       |
| -------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| `isPlainObject(new Map())`, `new URL()`, class instances       | `true`                           | `false` — only literals and `Object.create(null)` are plain |
| `isDeepEqual` on two `Map`/`Set`/`RegExp`/`Error`/`URL` values | `true` regardless of content     | Compared by value                                           |
| `isDeepEqual(NaN, NaN)`                                        | `false`                          | `true`                                                      |
| `isDeepEqual(0, -0)`                                           | `true`                           | `false`                                                     |
| `isDeepEqual` on two functions with equal source               | `true` (compared `toString()`)   | `false` — only the same reference is equal                  |
| `isDeepEqual` on circular input                                | `RangeError`                     | Handled                                                     |
| `deepClone(new Map())`, `RegExp`, class instance               | `{}` — type and prototype lost   | Correct type and prototype                                  |
| `deepClone` on circular input                                  | `RangeError`                     | Handled                                                     |
| `deepClone([, 1, , 2])`                                        | `[1, 2]` — holes compacted       | Length and holes preserved                                  |
| `isFunction(async () => {})`, generators                       | `false`                          | `true`                                                      |
| `watcher`: assigning `undefined` to a new key                  | Key silently never created       | Key created, change reported                                |
| `watcher`: `delete proxy.key`                                  | Deleted without notifying        | Reported as a change with `undefined`                       |
| `isNumber(Infinity)`                                           | `true`, while `NaN` was `false`  | `false` — finite numbers only                               |
| `normalize(null, max)`                                         | `null` coerced to 0 and accepted | Throws, as the message always promised                      |
| `isAndroid("")` / `isIos("")`                                  | Threw "only works on client"     | `false` — an empty UA is still a UA                         |
| `hasPlainObjectRecord({ [Symbol()]: 1 })`                      | `false` — symbols invisible      | `true`                                                      |
| `isDefined` narrowing                                          | Narrowed nothing                 | Narrows to `NonNullable<T>`                                 |
| `sleep(ms)` return type                                        | `Promise<unknown>`               | `Promise<void>`                                             |

`isDeepEqual` and `deepClone` also gained support for typed arrays,
`ArrayBuffer`, `DataView`, boxed primitives and enumerable symbol keys.
`isIos()` gained iPadOS 13+ detection. The minimum Node.js version is now 24.

The function comparison is the change most likely to affect callers: two
functions with identical source can capture different closure state, so they are
not interchangeable. Compare functions by reference, as lodash and Node's
`assert.deepStrictEqual` do.

---

## Contributing

```bash
npm install
npm run verify   # lint, typecheck, test with coverage, build, size budget, package lint
npm run bench    # measure the built output
```

287 tests, enforced at 100% for statements, branches, functions and lines. A
change to a public function comes with its tests, a README update and a
CHANGELOG entry.

## Releasing

Releases are automatic and happen only from CI:

1. Move the entries under `Unreleased` in [CHANGELOG.md](./CHANGELOG.md) to a
   new version heading.
2. Bump the version: `npm version patch` (or `minor` / `major`).
3. Merge to `master`.

The publish workflow then lints, type-checks, tests, builds, checks the size
budget, lints the package (`publint`, `attw`), smoke-tests the packed tarball in
a clean project through both `import` and `require`, publishes to npm with
provenance attached, pushes a `v<version>` tag and creates a GitHub Release from
the CHANGELOG section.

A commit that does not change the version is not an error — the workflow sees
the version already on npm and skips the release.

## License

MIT © [Han Dijit](https://github.com/handijit)
