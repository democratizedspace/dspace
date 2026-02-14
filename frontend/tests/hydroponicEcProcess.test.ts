import fs from 'node:fs';
import path from 'node:path';

const processes = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'frontend/src/pages/processes/base.json'), 'utf8')
);

const hydroponicsItems = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'frontend/src/pages/inventory/json/items/hydroponics.json'), 'utf8')
);

describe('measure-ec-solution process outputs', () => {
    test('creates a hydroponic nutrient solution EC log item', () => {
        const process = processes.find((entry: { id: string }) => entry.id === 'measure-ec-solution');
        expect(process).toBeDefined();

        const createdItem = process.createItems.find(
            (entry: { id: string }) => entry.id === 'c95edb7c-df2e-4aa4-889b-f7304b8fac22'
        );
        expect(createdItem).toEqual({ id: 'c95edb7c-df2e-4aa4-889b-f7304b8fac22', count: 1 });

        const item = hydroponicsItems.find(
            (entry: { id: string }) => entry.id === 'c95edb7c-df2e-4aa4-889b-f7304b8fac22'
        );
        expect(item).toMatchObject({
            name: 'hydroponic nutrient solution EC log',
            image: '/assets/compost_temperature_log.jpg',
            priceExemptionReason: 'SOULBOUND',
        });
    });
});
