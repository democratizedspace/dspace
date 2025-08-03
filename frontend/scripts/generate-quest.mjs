#!/usr/bin/env node
import { writeFileSync, mkdirSync, readdirSync, readFileSync, statSync } from 'fs';
import glob from 'glob';
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
    const questRoot = path.join('frontend', 'src', 'pages', 'quests', 'json');
    const existing = glob
        .sync(path.join(questRoot, '**/*.json'))
        .map((f) => path.relative(questRoot, f).replace(/\.json$/, ''));

    const args = process.argv.slice(2);
    let questId = null;
    let noLlm = false;
    let templateName = null;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--no-llm') {
            noLlm = true;
        } else if (arg === '--template' && i + 1 < args.length) {
            templateName = args[i + 1];
            i++;
        } else if (!questId && !arg.startsWith('--')) {
            questId = arg;
        }
    }
    if (!questId) {
        console.log('Available categories:', categories.join(', '));
        const category = (await ask('Choose a category or type a new one: ', rl)).trim();
        const slug = (await ask('Quest id (slug-with-dashes): ', rl)).trim();
        questId = `${category}/${slug}`;
    }

    if (existing.includes(`${questId}`)) {
        console.error(`Quest ${questId} already exists.`);
        process.exit(1);
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

    let quest;
    if (templateName) {
        const templatePath = path.join(
            'frontend',
            'src',
            'pages',
            'quests',
            'templates',
            `${templateName}.json`
        );
        try {
            quest = JSON.parse(readFileSync(templatePath, 'utf8'));
        } catch (e) {
            console.error(`Template ${templateName} not found.`);
            process.exit(1);
        }
        quest.id = questId;
        quest.title = title;
        quest.description = 'Describe the quest objectives here.';
        quest.npc = `/assets/npc/${npcName}.jpg`;
        quest.rewards = [];
        quest.requiresQuests = [];
        if (quest.dialogue && quest.dialogue.length) {
            quest.dialogue[0].text = 'Generating...';
        } else {
            quest.start = 'start';
            quest.dialogue = [
                {
                    id: 'start',
                    text: 'Generating...',
                    options: [{ type: 'finish', text: 'Finish' }],
                },
            ];
        }
    } else {
        quest = {
            id: questId,
            title,
            description: 'Describe the quest objectives here.',
            image: '/assets/quests/howtodoquests.jpg',
            npc: `/assets/npc/${npcName}.jpg`,
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Generating...',
                    options: [{ type: 'finish', text: 'Finish' }],
                },
            ],
            rewards: [],
            requiresQuests: [],
        };
    }

    if (!noLlm) {
        const { scoreQuest } = await import('../../scripts/utils/llm.js');
        try {
            const text = await scoreQuest(`Write a short greeting from ${npcName} for the quest ${title}.`);
            quest.dialogue[0].text = text;
        } catch (e) {
            console.warn('LLM generation failed:', e.message);
        }
    } else {
        quest.dialogue[0].text = 'Replace this text with your opening dialogue.';
    }

    const outputPath = path.join('frontend', 'src', 'pages', 'quests', 'json', `${questId}.json`);
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(quest, null, 4));
    console.log(`Created quest at ${outputPath}`);
}

main();
