import NodeEnum from "../enums/node.enum";
import getNode from "../helpers/node.helper";

/** Whether a value is a primitive boolean. */
const isBoolean = (val: unknown): val is boolean => {
  return (val === true || val === false) && getNode(val) === NodeEnum.BOOLEAN;
};

export default isBoolean;
