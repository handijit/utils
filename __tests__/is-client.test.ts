import { describe, expect, test, vi } from "vitest";

const mockIsDefined = (isDefined: boolean): void => {
  vi.doMock("../lib/modules/is-defined", () => ({ default: () => isDefined }));
};

// Imported after the mock is registered so is-client picks the mocked is-defined up.
const loadIsClient = async (): Promise<() => boolean> =>
  (await import("../lib/modules/is-client")).default;

describe("isClient tests", () => {
  test("it should return false", async () => {
    mockIsDefined(false);
    const isClient = await loadIsClient();
    expect(isClient()).toBe(false);
  });

  test("it should return true", async () => {
    mockIsDefined(true);
    const isClient = await loadIsClient();
    expect(isClient()).toBe(true);
  });
});
