#!/usr/bin/env node
const fs = require('fs');
const { randomUUID } = require('crypto');

function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function processQuest(quest) {
    if (!quest.id) {
        quest.id = randomUUID();
    }
    if (Array.isArray(quest.dialogue)) {
        quest.dialogue.forEach((node) => {
            if (!node.id) {
                node.id = randomUUID();
            }
            if (Array.isArray(node.options)) {
                node.options.forEach((opt) => {
                    if (Array.isArray(opt.requiresItems)) {
                        opt.requiresItems.forEach((item) => {
                            if (!item.id && item.name) {
                                item.id = slugify(item.name);
                            }
                        });
                    }
                    if (Array.isArray(opt.grantsItems)) {
                        opt.grantsItems.forEach((item) => {
                            if (!item.id && item.name) {
                                item.id = slugify(item.name);
                            }
                        });
                    }
                    if (opt.processName && !opt.process) {
                        opt.process = slugify(opt.processName);
                        delete opt.processName;
                    }
                });
            }
        });
    }
    return quest;
}

function main() {
    const files = process.argv.slice(2);
    if (files.length === 0) {
        console.error('Usage: node scripts/inject-ids.cjs <quest.json> [...]');
        process.exit(1);
    }
    files.forEach((file) => {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const updated = processQuest(data);
        fs.writeFileSync(file, JSON.stringify(updated, null, 4));
        console.log(`Updated ${file}`);
    });
}

if (require.main === module) {
    main();
}

module.exports = { processQuest, slugify };
