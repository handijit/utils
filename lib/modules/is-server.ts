import isClient from "./is-client";

/** Whether no `window` global exists. */
const isServer = (): boolean => {
  return !isClient();
};

export default isServer;
