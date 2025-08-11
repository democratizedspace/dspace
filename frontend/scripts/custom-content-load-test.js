#!/usr/bin/env node
/* istanbul ignore file */
import 'fake-indexeddb/auto';
import { runCustomContentLoadTest } from '../src/utils/customContentLoadTest.js';

async function main() {
    if (!global.window) {
        global.window = {};
    }
    global.window.indexedDB = indexedDB;
    const result = await runCustomContentLoadTest();
    console.log(JSON.stringify(result, null, 2));
}

if (
    import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith('custom-content-load-test.js')
) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

export { main };
