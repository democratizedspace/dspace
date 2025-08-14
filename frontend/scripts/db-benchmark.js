#!/usr/bin/env node
/* istanbul ignore file */
import 'fake-indexeddb/auto';
import { runDbBenchmark } from '../src/utils/dbBenchmark.js';

export function parseCountArg(argv) {
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--count' || argv[i] === '-c') {
            return Number.parseInt(argv[i + 1], 10);
        }
        if (argv[i].startsWith('--count=')) {
            return Number.parseInt(argv[i].split('=')[1], 10);
        }
    }
    return undefined;
}

async function main(argv = process.argv.slice(2)) {
    if (!global.window) {
        global.window = {};
    }
    global.window.indexedDB = indexedDB;
    const count = parseCountArg(argv);
    const result = await runDbBenchmark(count ? { count } : undefined);
    console.log(JSON.stringify(result, null, 2));
}

if (
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1]?.endsWith('db-benchmark.js')
) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

export { main };
