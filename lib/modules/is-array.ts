import NodeEnum from "../enums/node.enum";
import getNode from "../helpers/node.helper";

/** Whether a value is an `Array`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- published predicate type; narrowing it to unknown[] would break callers
const isArray = (val: unknown): val is Array<any> => {
  return Array.isArray(val) && getNode(val) === NodeEnum.ARRAY;
};

export default isArray;
