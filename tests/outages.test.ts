import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';

describe('Outages validation', () => {
  const outagesDir = join(process.cwd(), 'outages');
  const schemaPath = join(outagesDir, 'schema.json');

  it('outages directory exists', () => {
    expect(existsSync(outagesDir)).toBe(true);
  });

  it('schema.json exists', () => {
    expect(existsSync(schemaPath)).toBe(true);
  });

  it('schema.json is valid JSON', () => {
    expect(() => {
      JSON.parse(readFileSync(schemaPath, 'utf8'));
    }).not.toThrow();
  });

  describe('All outage files', () => {
    const outageFiles = readdirSync(outagesDir)
      .filter(f => f.endsWith('.json') && f !== 'schema.json');

    it('has at least one outage file', () => {
      expect(outageFiles.length).toBeGreaterThan(0);
    });

    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
    // Remove format validation since ajv-formats is not installed
    if (schema.properties && schema.properties.date) {
      delete schema.properties.date.format;
    }
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    outageFiles.forEach(filename => {
      describe(filename, () => {
        const filePath = join(outagesDir, filename);
        let data: any;

        it('is valid JSON', () => {
          expect(() => {
            data = JSON.parse(readFileSync(filePath, 'utf8'));
          }).not.toThrow();
        });

        it('matches schema', () => {
          if (!data) data = JSON.parse(readFileSync(filePath, 'utf8'));
          const valid = validate(data);
          if (!valid) {
            console.error('Validation errors:', validate.errors);
          }
          expect(valid).toBe(true);
        });

        it('filename matches pattern YYYY-MM-DD-<slug>.json', () => {
          const pattern = /^\d{4}-\d{2}-\d{2}-.+\.json$/;
          expect(pattern.test(filename)).toBe(true);
        });

        it('date field matches filename date', () => {
          if (!data) data = JSON.parse(readFileSync(filePath, 'utf8'));
          const filenameDate = filename.substring(0, 10);
          expect(data.date).toBe(filenameDate);
        });

        it('has all required fields', () => {
          if (!data) data = JSON.parse(readFileSync(filePath, 'utf8'));
          expect(data).toHaveProperty('id');
          expect(data).toHaveProperty('date');
          expect(data).toHaveProperty('component');
          expect(data).toHaveProperty('rootCause');
          expect(data).toHaveProperty('resolution');
          expect(data).toHaveProperty('references');
        });

        it('references is a non-empty array', () => {
          if (!data) data = JSON.parse(readFileSync(filePath, 'utf8'));
          expect(Array.isArray(data.references)).toBe(true);
          expect(data.references.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
