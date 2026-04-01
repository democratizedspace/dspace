#!/usr/bin/env node
/* istanbul ignore file */
import 'fake-indexeddb/auto';
import { runDbBenchmark } from '../src/utils/dbBenchmark.js';

async function main() {
    if (!global.window) {
        global.window = {};
    }
    global.window.indexedDB = indexedDB;

    const args = process.argv.slice(2);
    let count;
    const countIndex = args.findIndex((a) => a === '--count' || a === '-c');
    if (countIndex !== -1) {
        const value = Number.parseInt(args[countIndex + 1], 10);
        if (!Number.isNaN(value)) {
            count = value;
        }
    }

    const result = await runDbBenchmark(count ? { count } : undefined);
    console.log(JSON.stringify(result, null, 2));
}

if (
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith('db-benchmark.js')
) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

export { main };
