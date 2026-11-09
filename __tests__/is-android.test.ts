import { beforeEach, describe, expect, test, vi } from "vitest";

const IPHONE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/537.36";
const ANDROID_USER_AGENT =
  "Mozilla/5.0 (Linux; Android <version>; <device_model> Build/<build_version>) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/<chrome_version> Mobile Safari/537.36";

const mockIsClient = (isClient: boolean): void => {
  vi.doMock("../lib/modules/is-client", () => ({ default: () => isClient }));
};

// Imported after the mock is registered so is-android picks the mocked is-client up.
const loadIsAndroid = async (): Promise<(userAgent?: string) => boolean> =>
  (await import("../lib/modules/is-android")).default;

describe("isAndroid tests", () => {
  beforeEach(() => {
    mockIsClient(true);
  });

  test("it should return true when user agent is contains android", async () => {
    const isAndroid = await loadIsAndroid();
    vi.stubGlobal("navigator", { userAgent: ANDROID_USER_AGENT });
    expect(isAndroid()).toBe(true);
  });

  test("it should return false when user agent is container ios", async () => {
    const isAndroid = await loadIsAndroid();
    vi.stubGlobal("navigator", { userAgent: IPHONE_USER_AGENT });
    expect(isAndroid()).toBe(false);
  });

  test("it should throw error on use it on server", async () => {
    mockIsClient(false);
    const isAndroid = await loadIsAndroid();

    expect(() => isAndroid()).toThrow(
      "OS detection needs a user agent: pass one, or call this on the client."
    );
  });

  test("it should return true when got userAgent param", async () => {
    const isAndroid = await loadIsAndroid();
    expect(isAndroid(ANDROID_USER_AGENT)).toBe(true);
  });
});

describe("isAndroid explicit user agent", () => {
  test("should treat an empty user agent as a supplied value, not as absent", async () => {
    mockIsClient(false);
    const isAndroid = await loadIsAndroid();

    expect(isAndroid("")).toBe(false);
  });

  test("should work on the server whenever a user agent is given", async () => {
    mockIsClient(false);
    const isAndroid = await loadIsAndroid();

    expect(isAndroid("Mozilla/5.0 (Linux; Android 14)")).toBe(true);
    expect(isAndroid("Mozilla/5.0 (iPhone)")).toBe(false);
  });
});
