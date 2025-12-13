import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import { parse } from 'svelte/compiler';

const __dirname = dirname(fileURLToPath(import.meta.url));

function hasTypeAttribute(node: any): boolean {
  return Array.isArray(node.attributes)
    ? node.attributes.some((attr: any) => attr.type === 'Attribute' && attr.name === 'type')
    : false;
}

function getLineNumber(source: string, index: number | null | undefined): number {
  if (typeof index !== 'number' || index < 0) {
    return -1;
  }
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source[i] === '\n') {
      line += 1;
    }
  }
  return line;
}

function collectButtonsWithoutType(filePath: string): Array<{ file: string; line: number }> {
  const source = readFileSync(filePath, 'utf8');
  const ast = parse(source);
  const missing: Array<{ file: string; line: number }> = [];

  function visit(node: any): void {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.type === 'Element' && node.name === 'button' && !hasTypeAttribute(node)) {
      missing.push({
        file: filePath,
        line: getLineNumber(source, node.start),
      });
    }

    for (const key of Object.keys(node)) {
      const value = (node as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === 'object') {
        visit(value);
      }
    }
  }

  visit(ast.html);
  return missing;
}

describe('svelte accessibility checks', () => {
  it('requires every <button> to declare an explicit type', () => {
    const svelteFiles = globSync('frontend/src/**/*.svelte', {
      ignore: ['**/__tests__/**', '**/node_modules/**'],
    });

    const violations = svelteFiles.flatMap((file) => collectButtonsWithoutType(file));

    const formattedViolations = violations.map((entry) =>
      `${relative(join(__dirname, '..'), entry.file)}:${entry.line}`
    );

    expect(
      formattedViolations,
      'Buttons should specify an explicit type attribute for accessibility and predictable keyboard behaviour.'
    ).toEqual([]);
  });
});
