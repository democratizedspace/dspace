import { expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import Ajv from 'ajv';
import draft07MetaSchema from 'ajv/dist/refs/json-schema-draft-07.json';

type OutageRecord = {
  id: string;
  date: string;
  component: string;
  rootCause: string;
  resolution: string;
  references: string[];
  longForm?: string;
  dateRanges?: { start: string; end: string }[];
};

const outagesDir = path.resolve('outages');
const schemaPath = path.join(outagesDir, 'schema.json');

const truncateUTCDate = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const resolveCurrentUTCDate = async (): Promise<Date> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
      signal: controller.signal
    });
    if (response.ok) {
      const payload = (await response.json()) as { utc_datetime?: string };
      if (payload.utc_datetime) {
        return truncateUTCDate(new Date(payload.utc_datetime));
      }
    }
  } catch (_) {
    // Fallback to system clock on network or parsing errors.
  } finally {
    clearTimeout(timeoutId);
  }

  return truncateUTCDate(new Date());
};

const loadOutageRecords = (): { file: string; data: OutageRecord }[] =>
  fs
    .readdirSync(outagesDir)
    .filter((file) => file.endsWith('.json') && file !== 'schema.json')
    .map((file) => ({
      file,
      data: JSON.parse(fs.readFileSync(path.join(outagesDir, file), 'utf8')) as OutageRecord
    }));

test('outage dates are not in the future and align with filenames', async () => {
  const today = await resolveCurrentUTCDate();
  const records = loadOutageRecords();

  expect(records.length).toBeGreaterThan(0);

  for (const { file, data } of records) {
    expect(data.date).toBeTruthy();

    const outageDate = truncateUTCDate(new Date(`${data.date}T00:00:00Z`));
    expect(Number.isNaN(outageDate.getTime())).toBe(false);
    expect(outageDate.getTime()).toBeLessThanOrEqual(today.getTime());

    const filenamePrefix = file.split('-').slice(0, 3).join('-');
    expect(filenamePrefix).toBe(data.date);
  }
});

test('markdown outage reports are paired with JSON records', () => {
  const records = loadOutageRecords();
  const jsonByBase = new Map(
    records.map(({ file, data }) => [path.parse(file).name, { file, data }])
  );
  const markdownFiles = fs
    .readdirSync(outagesDir)
    .filter((file) => file.endsWith('.md') && file !== 'README.md');

  expect(markdownFiles.length).toBe(records.length);

  for (const { file, data } of records) {
    const base = path.parse(file).name;
    const markdownName = `${base}.md`;
    const markdownPath = path.join(outagesDir, markdownName);

    expect(fs.existsSync(markdownPath)).toBe(true);

    if (data.longForm) {
      expect(data.longForm).toBe(`outages/${markdownName}`);
    }
  }

  for (const markdownName of markdownFiles) {
    const base = path.parse(markdownName).name;
    expect(jsonByBase.has(base)).toBe(true);
  }
});

test('outage JSON files conform to the declared schema', () => {
  expect(fs.existsSync(schemaPath)).toBe(true);

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true });
  const httpsDraft07 = {
    ...draft07MetaSchema,
    $id: 'https://json-schema.org/draft-07/schema#'
  } as typeof draft07MetaSchema;
  ajv.addMetaSchema(httpsDraft07);
  ajv.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
  const validate = ajv.compile(schema);

  for (const { file, data } of loadOutageRecords()) {
    const valid = validate(data);
    if (!valid) {
      const errors = validate.errors?.map((err) => `${err.instancePath} ${err.message}`).join('; ');
      throw new Error(`${file} failed schema validation: ${errors ?? 'unknown error'}`);
    }
  }
});

test('processes CI long-tail outage is documented', () => {
  const expectedId = 'processes-ci-long-tail';
  const matching = loadOutageRecords().filter(({ data }) => data.id === expectedId);

  expect(matching.length).toBe(1);

  const [record] = matching;
  expect(record.data.references.length).toBeGreaterThan(0);
  expect(record.data.longForm).toBe(`outages/${record.file.replace(/\.json$/, '.md')}`);
});
