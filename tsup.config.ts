import { defineConfig } from 'tsup';
import { parsePresetOptions, generateTsupOptions } from 'tsup-preset-solid';

const parsedOptions = parsePresetOptions({
  entries: [
    {
      entry: 'src/index.ts',
    },
  ],
});

export default defineConfig(generateTsupOptions(parsedOptions));
