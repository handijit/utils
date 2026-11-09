import sleep from "./sleep";

type Props<T> = {
  /** The async operation to attempt. */
  fn: () => Promise<T>;
  /** Total number of attempts, not extra attempts. */
  retries: number;
  /** Base delay in ms; the wait before attempt `n + 1` is `delay * 2 ** n`. */
  delay: number;
  /** The error class that triggers a retry; anything else is rethrown. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- must accept an error class with any constructor signature
  exception: new (...args: any[]) => Error;
};

/** Runs `fn`, retrying with exponential backoff while it fails with `exception`. */
const withRetry = async <T>({
  fn,
  retries,
  delay,
  exception,
}: Props<T>): Promise<T | null> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof exception)) throw err;
      if (i === retries - 1) return null;
      await sleep(delay * 2 ** i);
    }
  }
  return null;
};

export default withRetry;
