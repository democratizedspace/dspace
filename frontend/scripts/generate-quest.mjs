#!/usr/bin/env node
import { writeFileSync, mkdirSync, readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import readline from 'readline';

async function ask(question, rl) {
    return new Promise((resolve) => rl.question(question, resolve));
}

function gatherStats() {
    const questRoot = path.join('frontend', 'src', 'pages', 'quests', 'json');
    const categories = readdirSync(questRoot).filter((f) =>
        statSync(path.join(questRoot, f)).isDirectory()
    );
    const npcCounts = new Map();
    for (const cat of categories) {
        const files = readdirSync(path.join(questRoot, cat));
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const data = JSON.parse(readFileSync(path.join(questRoot, cat, file), 'utf8'));
            const npc = path.basename(data.npc || '', path.extname(data.npc || ''));
            if (!npc) continue;
            const entry = npcCounts.get(npc) || {};
            entry[cat] = (entry[cat] || 0) + 1;
            npcCounts.set(npc, entry);
        }
    }
    return { categories, npcCounts };
}

async function main() {
    const { categories, npcCounts } = gatherStats();
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    let questId = process.argv[2];
    if (!questId) {
        console.log('Available categories:', categories.join(', '));
        const category = (await ask('Choose a category or type a new one: ', rl)).trim();
        const slug = (await ask('Quest id (slug-with-dashes): ', rl)).trim();
        questId = `${category}/${slug}`;
    }

    const title = questId
        .split('/')
        .pop()
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    console.log('\nNPC usage stats:');
    const npcs = Array.from(npcCounts.keys()).sort();
    npcs.forEach((npc, idx) => {
        const counts = npcCounts.get(npc);
        const summary = Object.entries(counts)
            .map(([c, n]) => `${c}: ${n}`)
            .join(', ');
        console.log(`${idx + 1}) ${npc} (${summary})`);
    });
    const npcChoice = await ask('Select an NPC by number: ', rl);
    const npcName = npcs[parseInt(npcChoice, 10) - 1] || 'vega';
    rl.close();

    const quest = {
        id: questId,
        title,
        description: 'Describe the quest objectives here.',
        image: '/assets/quests/howtodoquests.jpg',
        npc: `/assets/npc/${npcName}.jpg`,
        start: 'start',
        dialogue: [
            {
                id: 'start',
                text: 'Replace this text with your opening dialogue.',
                options: [{ type: 'finish', text: 'Finish' }],
            },
        ],
        rewards: [],
        requiresQuests: [],
    };

    const outputPath = path.join('frontend', 'src', 'pages', 'quests', 'json', `${questId}.json`);
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(quest, null, 4));
    console.log(`Created quest at ${outputPath}`);
}

main();
