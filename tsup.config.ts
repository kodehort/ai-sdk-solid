import { defineConfig } from "tsup";
import { generateTsupOptions, parsePresetOptions } from "tsup-preset-solid";

const parsedOptions = parsePresetOptions({
  entries: [
    {
      entry: "src/index.ts",
    },
  ],
});

export default defineConfig(generateTsupOptions(parsedOptions));
