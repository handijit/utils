import { library } from "@handijitcom/config/vitest";

// Server paths run in node, browser paths (`*.dom.test.ts`) in jsdom; 100 % coverage.
export default library({ setupFiles: ["./vitest.setup.ts"] });
