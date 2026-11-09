/**
 * `typeof` is the only reliable function test: it covers arrow, async, generator and
 * async-generator functions as well as class constructors, all of…
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- published predicate type; the guard accepts any callable
const isFunction = (val: unknown): val is Function => {
  return typeof val === "function";
};

export default isFunction;
