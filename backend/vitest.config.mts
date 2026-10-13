import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/__tests__/**/*.test.{js,ts,mjs}"],
    exclude: ["**/node_modules/**", "**/dist/**", ".cache/**", "public/**"],
  },
});
