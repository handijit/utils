import { describe, expect, expectTypeOf, test } from "vitest";

import isDefined from "../lib/modules/is-defined";
import isArray from "../lib/modules/is-array";
import isPlainObject from "../lib/modules/is-plain-object";
import isFunction from "../lib/modules/is-function";
import isNumber from "../lib/modules/is-number";
import sleep from "../lib/modules/sleep";
import deepClone from "../lib/modules/deep-clone";
import debounce from "../lib/modules/debounce";
import type { Debounced, DebounceOptions } from "../lib/modules/debounce";
import isBoolean from "../lib/modules/is-boolean";
import isDate from "../lib/modules/is-date";
import isNull from "../lib/modules/is-null";
import isObject from "../lib/modules/is-object";
import isUndefined from "../lib/modules/is-undefined";
import isDeepEqual from "../lib/modules/is-deep-equal";
import hasPlainObjectRecord from "../lib/modules/has-plain-object-record";
import isClient from "../lib/modules/is-client";
import isServer from "../lib/modules/is-server";
import isAndroid from "../lib/modules/is-android";
import isIos from "../lib/modules/is-ios";
import normalize from "../lib/modules/normalize";
import watcher from "../lib/modules/watcher";
import type { WatcherCallback } from "../lib/modules/watcher";
import withRetry from "../lib/modules/with-retry";

describe("type surface", () => {
  test("isDefined should narrow away null and undefined", () => {
    const maybe = "value" as string | null | undefined;

    if (isDefined(maybe)) {
      const narrowed: string = maybe;
      expect(narrowed).toBe("value");
    } else {
      throw new Error("expected the value to be defined");
    }
  });

  test("isDefined should narrow inside a filter", () => {
    const values: Array<number | null> = [1, null, 2];
    const defined: number[] = values.filter(isDefined);

    expect(defined).toEqual([1, 2]);
  });

  test("sleep should resolve to void", async () => {
    const pending: Promise<void> = sleep(1);
    const resolved: void = await pending;

    expect(resolved).toBeUndefined();
  });

  test("guards should narrow unknown values", () => {
    const unknownValue: unknown = [1, 2, 3];

    if (isArray(unknownValue)) {
      const length: number = unknownValue.length;
      expect(length).toBe(3);
    }

    const record: unknown = { a: 1 };
    if (isPlainObject(record)) {
      const value: unknown = record.a;
      expect(value).toBe(1);
    }

    const callable: unknown = () => 7;
    if (isFunction(callable)) {
      expect(callable()).toBe(7);
    }

    const numeric: unknown = 5;
    if (isNumber(numeric)) {
      const doubled: number = numeric * 2;
      expect(doubled).toBe(10);
    }
  });

  test("deepClone should preserve the input type", () => {
    const source = { list: [1, 2], when: new Date(0) };
    const copy: { list: number[]; when: Date } = deepClone(source);

    expect(copy.list).toEqual([1, 2]);
    expect(copy.when).toBeInstanceOf(Date);
  });

  test("debounce should keep the wrapped signature", () => {
    const debounced = debounce((label: string, count: number) => {
      return `${label}:${count}`;
    }, 0);

    const result: string | undefined = debounced("a", 1);
    const waiting: boolean = debounced.pending();
    const flushed: string | undefined = debounced.flush();

    expect(result).toBeUndefined();
    expect(waiting).toBe(true);
    expect(flushed).toBe("a:1");
  });

  test("should narrow each guard to its documented type", () => {
    const value = undefined as unknown;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- isArray is published as `val is Array<any>`
    if (isArray(value)) expectTypeOf(value).toEqualTypeOf<any[]>();
    if (isBoolean(value)) expectTypeOf(value).toEqualTypeOf<boolean>();
    if (isDate(value)) expectTypeOf(value).toEqualTypeOf<Date>();
    if (isNull(value)) expectTypeOf(value).toEqualTypeOf<null>();
    if (isNumber(value)) expectTypeOf(value).toEqualTypeOf<number>();
    if (isObject(value)) expectTypeOf(value).toEqualTypeOf<object>();
    if (isUndefined(value)) expectTypeOf(value).toEqualTypeOf<undefined>();
    if (isPlainObject(value)) {
      expectTypeOf(value).toEqualTypeOf<Record<string, unknown>>();
    }

    expect(isDefined(value)).toBe(false);
  });

  test("should narrow isDefined to the non-nullable part of a union", () => {
    const maybe = 1 as number | string | null | undefined;

    if (isDefined(maybe)) expectTypeOf(maybe).toEqualTypeOf<number | string>();

    expect(isDefined(maybe)).toBe(true);
  });

  test("should return plain booleans from the non-narrowing checks", () => {
    expectTypeOf(isDeepEqual).toEqualTypeOf<
      (valOne: unknown, valTwo: unknown) => boolean
    >();
    expectTypeOf(hasPlainObjectRecord).toEqualTypeOf<
      (val: unknown) => boolean
    >();
    expectTypeOf(isClient).toEqualTypeOf<() => boolean>();
    expectTypeOf(isServer).toEqualTypeOf<() => boolean>();
    expectTypeOf(isAndroid).toEqualTypeOf<(userAgent?: string) => boolean>();
    expectTypeOf(isIos).toEqualTypeOf<(userAgent?: string) => boolean>();
    expectTypeOf(normalize).toEqualTypeOf<
      (value: number, max: number) => number
    >();
    expectTypeOf(sleep).toEqualTypeOf<(time: number) => Promise<void>>();

    expect(isDeepEqual(1, 1)).toBe(true);
  });

  test("should return the input type from deepClone", () => {
    const source = { list: [1, 2], tags: new Set(["a"]) };

    expectTypeOf(deepClone(source)).toEqualTypeOf<{
      list: number[];
      tags: Set<string>;
    }>();
    expectTypeOf(deepClone("text" as const)).toEqualTypeOf<"text">();

    expect(deepClone(source)).toEqual(source);
  });

  test("should describe the debounced wrapper", () => {
    const debounced = debounce((label: string) => label.length, 0);

    expectTypeOf(debounced).toEqualTypeOf<
      Debounced<(label: string) => number>
    >();
    expectTypeOf(debounced).parameters.toEqualTypeOf<[label: string]>();
    expectTypeOf(debounced).returns.toEqualTypeOf<number | undefined>();
    expectTypeOf(debounced.flush).returns.toEqualTypeOf<number | undefined>();
    expectTypeOf(debounced.pending).returns.toEqualTypeOf<boolean>();
    expectTypeOf(debounced.cancel).returns.toEqualTypeOf<void>();
    expectTypeOf<DebounceOptions>().toEqualTypeOf<{
      leading?: boolean;
      trailing?: boolean;
      maxWait?: number;
    }>();

    expect(debounced.pending()).toBe(false);
  });

  test("should reject arguments that do not match the debounced function", () => {
    const debounced = debounce((label: string) => label, 0);

    // @ts-expect-error the wrapped function takes a string
    expect(debounced(1)).toBeUndefined();
    expect(debounced.flush()).toBe(1);
  });

  test("should reject a debounce target that is not a function", () => {
    // @ts-expect-error fn must be a function
    const debounced = debounce("not a function", 0, { leading: true });

    // Nothing validates `fn` at runtime: the first invocation is what fails.
    expect(() => debounced()).toThrow(TypeError);
    debounced.cancel();
  });

  test("should keep the target type through watcher", () => {
    const calls: Array<[string, number | string | undefined]> = [];
    const onChange: WatcherCallback<{ count: number; label: string }> = (
      key,
      value
    ) => {
      expectTypeOf(key).toEqualTypeOf<"count" | "label">();
      expectTypeOf(value).toEqualTypeOf<number | string | undefined>();
      calls.push([key, value]);
    };
    const state = watcher({ count: 0, label: "a" }, onChange);

    expectTypeOf(state).toEqualTypeOf<{ count: number; label: string }>();

    state.count = 1;
    expect(calls).toEqual([["count", 1]]);
  });

  test("should reject a watcher target that is not an object", () => {
    // @ts-expect-error the target must be an object
    expect(() => watcher(1, () => {})).toThrow(TypeError);
  });

  test("should resolve withRetry to the result or null", async () => {
    const pending = withRetry({
      fn: async () => 7,
      retries: 1,
      delay: 0,
      exception: Error,
    });

    expectTypeOf(pending).toEqualTypeOf<Promise<number | null>>();

    expect(await pending).toBe(7);
  });

  test("should require a numeric value for normalize", () => {
    // @ts-expect-error value must be a number
    expect(() => normalize("5", 10)).toThrow(Error);
  });
});
