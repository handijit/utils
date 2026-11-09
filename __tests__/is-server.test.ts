import { describe, expect, test, vi } from "vitest";

const mockIsClient = (isClient: boolean): void => {
  vi.doMock("../lib/modules/is-client", () => ({ default: () => isClient }));
};

// Imported after the mock is registered so is-server picks the mocked is-client up.
const loadIsServer = async (): Promise<() => boolean> =>
  (await import("../lib/modules/is-server")).default;

describe("isServer tests", () => {
  test("it should return true", async () => {
    mockIsClient(false);
    const isServer = await loadIsServer();
    expect(isServer()).toBe(true);
  });

  test("it should return false", async () => {
    mockIsClient(true);
    const isServer = await loadIsServer();
    expect(isServer()).toBe(false);
  });
});
