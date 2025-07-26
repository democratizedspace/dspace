#!/usr/bin/env node
import 'fake-indexeddb/auto';
import fs from 'fs';
import path from 'path';
import { createItem, createProcess, createQuest, updateQuest } from '../src/utils/customcontent.js';

export async function seedCustomContent() {
    if (!global.window) {
        global.window = {};
    }
    if (!global.window.indexedDB) {
        global.window.indexedDB = indexedDB;
    }

    const itemId = await createItem('Seeded Item', 'Item added by seed script');
    const processId = await createProcess('Seeded Process', '15m', [{ id: itemId, count: 1 }]);

    const questPath = path.join(process.cwd(), 'test-data', 'simple-quest.json');
    const questTemplate = JSON.parse(fs.readFileSync(questPath, 'utf8'));
    const questId = await createQuest(
        questTemplate.title,
        questTemplate.description,
        questTemplate.image
    );
    questTemplate.id = questId;
    await updateQuest(questId, questTemplate);

    return { itemId, processId, questId };
}

if (process.argv[1] && process.argv[1].endsWith('seed-custom-content.js')) {
    seedCustomContent()
        .then(() => {
            console.log('Sample custom content seeded');
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
