import { afterEach, vi } from "vitest";

// The house setup file of @handijitcom/config already restores real timers after each test.
afterEach(() => {
  // Several suites swap a module with vi.doMock and import its dependant afterwards; a cached
  // dependant would keep the previous test's mock.
  vi.resetModules();
});
