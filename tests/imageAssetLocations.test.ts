import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Test to ensure image assets are in the correct directories based on entity type.
 * - Quest entities (in frontend/src/pages/quests/) should have images in /assets/quests/
 * - Inventory entities (in frontend/src/pages/inventory/) should have images in /assets/
 */

interface Entity {
    type: 'quest' | 'item';
    path: string;
    id: string;
    name?: string;
    title?: string;
    image: string;
}

function findAllQuestFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findAllQuestFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(fullPath);
        }
    }

    return files;
}

function findAllEntities(): Entity[] {
    const entities: Entity[] = [];
    const repoRoot = join(__dirname, '..');

    // Find all quest JSON files
    const questDir = join(repoRoot, 'frontend/src/pages/quests/json');
    const questFiles = findAllQuestFiles(questDir);

    for (const questFile of questFiles) {
        try {
            const content = readFileSync(questFile, 'utf-8');
            const data = JSON.parse(content);
            if (data && typeof data === 'object' && data.image) {
                entities.push({
                    type: 'quest',
                    path: questFile,
                    id: data.id || 'unknown',
                    title: data.title,
                    image: data.image,
                });
            }
        } catch (err) {
            // Skip files that can't be parsed
        }
    }

    // Find all inventory item JSON files
    const inventoryDir = join(repoRoot, 'frontend/src/pages/inventory/json');
    const inventoryFiles = findAllQuestFiles(inventoryDir);

    for (const inventoryFile of inventoryFiles) {
        try {
            const content = readFileSync(inventoryFile, 'utf-8');
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
                for (const item of data) {
                    if (item && typeof item === 'object' && item.image) {
                        entities.push({
                            type: 'item',
                            path: inventoryFile,
                            id: item.id || 'unknown',
                            name: item.name,
                            image: item.image,
                        });
                    }
                }
            }
        } catch (err) {
            // Skip files that can't be parsed
        }
    }

    return entities;
}

describe('image asset locations', () => {
    const entities = findAllEntities();

    it('quest entities have images in /assets/quests/', () => {
        const questEntities = entities.filter((e) => e.type === 'quest');
        const misplaced = questEntities.filter(
            (entity) => !entity.image.startsWith('/assets/quests/')
        );

        if (misplaced.length > 0) {
            const details = misplaced
                .map(
                    (e) =>
                        `  - ${e.title || e.id}: ${e.image} (should be in /assets/quests/)`
                )
                .join('\n');
            throw new Error(
                `Found ${misplaced.length} quest(s) with images outside /assets/quests/:\n${details}`
            );
        }

        expect(misplaced).toHaveLength(0);
    });

    it('inventory entities have images in /assets/ (not /assets/quests/)', () => {
        const itemEntities = entities.filter((e) => e.type === 'item');
        const misplaced = itemEntities.filter((entity) =>
            entity.image.startsWith('/assets/quests/')
        );

        if (misplaced.length > 0) {
            const details = misplaced
                .map(
                    (e) =>
                        `  - ${e.name || e.id}: ${e.image} (should be in /assets/, not /assets/quests/)`
                )
                .join('\n');
            throw new Error(
                `Found ${misplaced.length} item(s) with images in /assets/quests/:\n${details}`
            );
        }

        expect(misplaced).toHaveLength(0);
    });

    it('all entities have image references', () => {
        expect(entities.length).toBeGreaterThan(0);
        for (const entity of entities) {
            expect(entity.image).toBeDefined();
            expect(entity.image).not.toBe('');
        }
    });
});
