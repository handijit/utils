import { beforeEach, describe, expect, test, vi } from "vitest";

const IPHONE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/537.36";
const ANDROID_USER_AGENT =
  "Mozilla/5.0 (Linux; Android <version>; <device_model> Build/<build_version>) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/<chrome_version> Mobile Safari/537.36";

const mockIsClient = (isClient: boolean): void => {
  vi.doMock("../lib/modules/is-client", () => ({ default: () => isClient }));
};

// Imported after the mock is registered so is-ios picks the mocked is-client up.
const loadIsIos = async (): Promise<(userAgent?: string) => boolean> =>
  (await import("../lib/modules/is-ios")).default;

describe("isIos tests", () => {
  beforeEach(() => {
    mockIsClient(true);
  });

  test("it should return true when user agent contains ios", async () => {
    vi.stubGlobal("navigator", { userAgent: IPHONE_USER_AGENT });
    const isIos = await loadIsIos();
    expect(isIos()).toBe(true);
  });

  test("it should return false when don't contains ios", async () => {
    vi.stubGlobal("navigator", { userAgent: ANDROID_USER_AGENT });
    const isIos = await loadIsIos();
    expect(isIos()).toBe(false);
  });

  test("it should throw error when use it on server", async () => {
    mockIsClient(false);
    const isIos = await loadIsIos();
    expect(() => isIos()).toThrow(
      "OS detection needs a user agent: pass one, or call this on the client."
    );
  });

  test("it should return true when got userAgent param", async () => {
    const isIos = await loadIsIos();
    expect(isIos(IPHONE_USER_AGENT)).toBe(true);
  });
});

describe("isIos explicit user agent", () => {
  test("should treat an empty user agent as a supplied value, not as absent", async () => {
    mockIsClient(false);
    const isIos = await loadIsIos();

    expect(isIos("")).toBe(false);
  });

  test("should work on the server whenever a user agent is given", async () => {
    mockIsClient(false);
    const isIos = await loadIsIos();

    expect(isIos("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe(true);
    expect(isIos("Mozilla/5.0 (Linux; Android 14)")).toBe(false);
  });
});
