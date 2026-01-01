import solidPlugin from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.ui.test.ts", "src/**/*.ui.test.tsx"],
    deps: {
      optimizer: {
        web: {
          include: ["solid-js"],
        },
      },
    },
  },
  resolve: {
    conditions: ["development", "browser"],
  },
});
