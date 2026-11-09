/** Whether a value is `undefined`. */
const isUndefined = (val: unknown): val is undefined => {
  return val === undefined;
};

export default isUndefined;
