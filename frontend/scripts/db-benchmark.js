#!/usr/bin/env node
/* istanbul ignore file */
import 'fake-indexeddb/auto';
import { runDbBenchmark } from '../src/utils/dbBenchmark.js';

async function main() {
    if (!global.window) {
        global.window = {};
    }
    global.window.indexedDB = indexedDB;

    const result = await runDbBenchmark();
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
