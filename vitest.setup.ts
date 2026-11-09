import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
  // Several suites swap a module with vi.doMock and import its dependant afterwards; a cached
  // dependant would keep the previous test's mock.
  vi.resetModules();
});
