/**
 * @jest-environment node
 */
const fs = require('fs');
const path = require('path');

const readPage = (relativePath) =>
    fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

describe('action buttons on list and manage pages', () => {
    it('includes create item button on inventory manage page', () => {
        const source = readPage('src/pages/inventory/svelte/ManageItems.svelte');
        expect(source).toContain('Create a new item');
        expect(source).toContain('/inventory/create');
    });

    it('includes create quest button on quests manage page', () => {
        const source = readPage('src/pages/quests/svelte/ManageQuests.svelte');
        expect(source).toContain('Create a new quest');
        expect(source).toContain('/quests/create');
    });

    it('includes create quest button on quests list page', () => {
        const source = readPage('src/pages/quests/svelte/Quests.svelte');
        expect(source).toContain('Create a new quest');
        expect(source).toContain('/quests/create');
    });

    it('includes create process buttons on processes pages', () => {
        const listSource = readPage('src/pages/processes/svelte/Processes.svelte');
        const manageSource = readPage('src/pages/processes/svelte/ManageProcesses.svelte');
        expect(listSource).toContain('Create a new process');
        expect(listSource).toContain('/processes/create');
        expect(manageSource).toContain('Create a new process');
        expect(manageSource).toContain('/processes/create');
    });

    it('includes create item button on inventory list page', () => {
        const source = readPage('src/pages/inventory/Inventory.svelte');
        expect(source).toContain('Create a new item');
        expect(source).toContain('/inventory/create');
    });
});
