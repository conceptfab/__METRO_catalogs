import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { colorTokens } from './design-tokens';

const globalsCss = readFileSync(
  resolve(__dirname, '../app/globals.css'),
  'utf8',
);

describe('design-tokens.ts registry', () => {
  it('every cssVar in colorTokens is declared in globals.css :root', () => {
    const rootBlock =
      globalsCss.match(/:root\s*{([\s\S]*?)}/)?.[1] ?? '';
    for (const token of colorTokens) {
      expect(
        rootBlock.includes(`${token.cssVar}:`),
        `Missing ${token.cssVar} in :root block`,
      ).toBe(true);
    }
  });

  it('every cssVar with a `dark` value is declared in globals.css .dark', () => {
    const darkBlock = globalsCss.match(/\.dark\s*{([\s\S]*?)}/)?.[1] ?? '';
    for (const token of colorTokens) {
      if (!token.dark) continue;
      expect(
        darkBlock.includes(`${token.cssVar}:`),
        `Missing ${token.cssVar} in .dark block`,
      ).toBe(true);
    }
  });

  it('light hex value matches globals.css declaration', () => {
    const rootBlock = globalsCss.match(/:root\s*{([\s\S]*?)}/)?.[1] ?? '';
    for (const token of colorTokens) {
      const re = new RegExp(`${token.cssVar}:\\s*(#[0-9a-f]{3,8})`, 'i');
      const match = rootBlock.match(re);
      if (!match) continue;
      expect(match[1].toLowerCase()).toBe(token.light.toLowerCase());
    }
  });
});
