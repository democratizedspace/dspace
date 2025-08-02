import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { listMissingImages } from '../utils/fs-checks';

const questsDir = path.join(__dirname, '../../frontend/src/pages/quests/json');
const itemsFile = path.join(__dirname, '../../frontend/src/pages/inventory/json/items.json');
const npcFile = path.join(__dirname, '../../frontend/src/pages/docs/md/npcs.md');

function collectQuestImages() {
    const files = glob.sync(path.join(questsDir, '**/*.json'));
    const imgs = [];
    files.forEach((file) => {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (data.image) imgs.push(data.image);
        if (data.npc) imgs.push(data.npc);
    });
    return imgs;
}

function collectItemImages() {
    const items = JSON.parse(fs.readFileSync(itemsFile, 'utf8'));
    return items.map((i) => i.image).filter(Boolean);
}

function collectNpcImages() {
    const md = fs.readFileSync(npcFile, 'utf8');
    const regex = /<img src="(.*?)"/g;
    const imgs = [];
    let match;
    while ((match = regex.exec(md))) {
        imgs.push(match[1]);
    }
    return imgs;
}

describe('Image references', () => {
    test('all referenced images exist', () => {
        const images = [
            ...collectQuestImages(),
            ...collectItemImages(),
            ...collectNpcImages(),
        ];
        const missing = listMissingImages(images);
        if (missing.length) {
            console.warn('Missing images:', missing);
        }
        expect(missing.length).toBe(0);
    });
});
