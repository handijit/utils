import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import sleep from "../lib/modules/sleep";

/**
 * These two tests used to time a real `setTimeout` with `performance.now()`
 * and expect the difference to exceed the delay. Node.js arms timers on the
 * event loop's millisecond clock, so a timer can fire up to about 1 ms before
 * `performance.now()` has advanced by the full delay, and the assertions failed
 * on the CI runners. Fake timers check the same promise exactly: not resolved
 * one millisecond early, resolved at the delay.
 */
async function isSettled(pending: Promise<void>): Promise<boolean> {
  const marker = Symbol("pending");
  const winner = await Promise.race([pending, Promise.resolve(marker)]);

  return winner !== marker;
}

describe("sleep tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("it should sleep for 1 second", async () => {
    const pending = sleep(1000);

    await vi.advanceTimersByTimeAsync(999);
    expect(await isSettled(pending)).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(await isSettled(pending)).toBe(true);
    expect(await pending).toBeUndefined();
  });

  test("it should sleep for 0.1 second", async () => {
    const pending = sleep(100);

    await vi.advanceTimersByTimeAsync(99);
    expect(await isSettled(pending)).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(await isSettled(pending)).toBe(true);
    expect(await pending).toBeUndefined();
  });
});
