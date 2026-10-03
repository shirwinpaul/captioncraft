import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Set by scripts/vitest.mjs when it runs from a temp copy with node_modules linked in.
    preserveSymlinks: process.env.VITEST_LINKED_NODE_MODULES === "1",
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
