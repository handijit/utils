import isDefined from "./is-defined";

/** Whether a `window` global exists. */
const isClient = (): boolean => {
  return isDefined(globalThis.window);
};

export default isClient;
