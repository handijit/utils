/** Whether a value is `null`. */
const isNull = (val: unknown): val is null => {
  return val === null;
};

export default isNull;
