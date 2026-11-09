import NodeEnum from "../enums/node.enum";
import getNode from "../helpers/node.helper";

/** Whether a value is a `Date` object; validity is not checked. */
const isDate = (val: unknown): val is Date => {
  return typeof val === "object" && getNode(val) === NodeEnum.DATE;
};

export default isDate;
