import base from "./playwright.config";
import { defineConfig } from "@playwright/test";

/** Local visual QA: the same dev server as the e2e suite, screenshots only. */
export default defineConfig({ ...base, testDir: "./e2e-local", timeout: 300_000 });
