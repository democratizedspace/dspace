#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function collect(patterns) {
  const files = patterns.flatMap((p) => glob.sync(p));
  return files.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
}

function parseArgs(args) {
  const quests = [];
  const items = [];
  const processes = [];
  let current = quests;
  for (const arg of args) {
    if (arg === '--items') {
      current = items;
    } else if (arg === '--processes') {
      current = processes;
    } else {
      current.push(arg);
    }
  }
  return { quests, items, processes };
}

function main() {
  if (process.argv.length < 4) {
    console.error('Usage: node scripts/create-content-bundle.js <output> <quest-glob...> [--items <item-glob...>] [--processes <process-glob...>]');
    process.exit(1);
  }
  const output = path.resolve(process.argv[2]);
  const { quests, items, processes } = parseArgs(process.argv.slice(3));

  const bundle = {
    quests: collect(quests),
    items: collect(items),
    processes: collect(processes),
  };

  fs.writeFileSync(output, JSON.stringify(bundle, null, 4));
  console.log(`Bundle written to ${output}`);
}

if (require.main === module) {
  main();
}
