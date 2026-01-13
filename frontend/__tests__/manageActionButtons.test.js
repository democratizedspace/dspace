/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const readPage = (relativePath) =>
    fs.readFileSync(path.join(__dirname, '../src/pages', relativePath), 'utf8');

const expectActionButton = (content, text, href) => {
    expect(content).toContain(text);
    expect(content).toContain(href);
};

describe('management action buttons', () => {
    it('adds create/manage buttons to inventory manage page', () => {
        const content = readPage('inventory/manage.astro');
        expectActionButton(content, 'Create a new item', '/inventory/create');
        expectActionButton(content, 'Manage items', '/inventory/manage');
    });

    it('adds create/manage buttons to quests manage page', () => {
        const content = readPage('quests/manage.astro');
        expectActionButton(content, 'Create a new quest', '/quests/create');
        expectActionButton(content, 'Manage quests', '/quests/manage');
    });

    it('adds create/manage buttons to processes manage page', () => {
        const content = readPage('processes/manage.astro');
        expectActionButton(content, 'Create a new process', '/processes/create');
        expectActionButton(content, 'Manage processes', '/processes/manage');
    });

    it('includes create/manage buttons on processes list page', () => {
        const content = readPage('processes/svelte/Processes.svelte');
        expectActionButton(content, 'Create a new process', '/processes/create');
        expectActionButton(content, 'Manage processes', '/processes/manage');
    });
});
