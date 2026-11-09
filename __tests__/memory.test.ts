import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import debounce from "../lib/modules/debounce";
import sleep from "../lib/modules/sleep";
import watcher from "../lib/modules/watcher";

const CALLS = 10_000;

describe("memory and timers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test("should not arm a timer when the entry point is imported", async () => {
    await import("../lib/index");

    expect(vi.getTimerCount()).toBe(0);
  });

  test("should not arm a timer when a debounced function is created", () => {
    debounce(() => {}, 100);

    expect(vi.getTimerCount()).toBe(0);
  });

  test("should keep a single timer across 10 000 debounced calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    for (let i = 0; i < CALLS; i++) debounced(i);

    expect(vi.getTimerCount()).toBe(1);
    expect(fn).toHaveBeenCalledTimes(0);
  });

  test("should keep a single timer across 10 000 calls spread over time with maxWait", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100, { maxWait: 250 });

    for (let i = 0; i < CALLS; i++) {
      debounced(i);
      vi.advanceTimersByTime(1);
      expect(vi.getTimerCount()).toBeLessThanOrEqual(1);
    }

    expect(fn.mock.calls.length).toBeGreaterThan(0);
  });

  test("should leave no timer behind once the trailing call has run", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    for (let i = 0; i < CALLS; i++) debounced(i);
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(CALLS - 1);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("should leave no timer behind after cancel", () => {
    const debounced = debounce(() => {}, 100);

    debounced();
    debounced.cancel();

    expect(vi.getTimerCount()).toBe(0);
  });

  test("should leave no timer behind after flush", () => {
    const debounced = debounce(() => {}, 100);

    debounced();
    debounced.flush();

    expect(vi.getTimerCount()).toBe(0);
  });

  test("should hold exactly one timer per pending sleep and none once it resolves", async () => {
    const pending = sleep(50);

    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(50);
    await pending;

    expect(vi.getTimerCount()).toBe(0);
  });

  test("should not grow the watched object across 10 000 assignments to one key", () => {
    const target: { count: number } = { count: 0 };
    const state = watcher(target, () => {});

    for (let i = 1; i <= CALLS; i++) state.count = i;

    expect(Object.keys(target)).toEqual(["count"]);
    expect(target.count).toBe(CALLS);
    expect(vi.getTimerCount()).toBe(0);
  });
});
