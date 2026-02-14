import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type ItemDef = { id: string; name: string };
type ProcessDef = { id: string; createItems?: Array<{ id: string; count: number }> };

const ecLogItemId = 'bc979305-53ef-4be8-9d21-c59e3bfa7f06';

describe('measure-ec-solution process outputs', () => {
    it('creates the hydroponic nutrient solution EC log item', () => {
        const items = JSON.parse(
            readFileSync(
                join(__dirname, '../frontend/src/pages/inventory/json/items/hydroponics.json'),
                'utf8'
            )
        ) as ItemDef[];
        const processes = JSON.parse(
            readFileSync(join(__dirname, '../frontend/src/pages/processes/base.json'), 'utf8')
        ) as ProcessDef[];

        const ecLogItem = items.find((item) => item.id === ecLogItemId);
        expect(ecLogItem?.name).toBe('hydroponic nutrient solution EC log');

        const measureEcProcess = processes.find((process) => process.id === 'measure-ec-solution');
        expect(measureEcProcess?.createItems).toContainEqual({
            id: ecLogItemId,
            count: 1,
        });
    });
});
