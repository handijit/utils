/** Whether a value is a non-null `typeof "object"` value. */
const isObject = (val: unknown): val is object => {
  return val !== null && typeof val === "object";
};

export default isObject;
