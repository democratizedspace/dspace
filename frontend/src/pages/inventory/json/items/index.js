// Import JSON files with import assertions
import aquarium from './aquarium.json' assert { type: 'json' };
import awards from './awards.json' assert { type: 'json' };
import hydroponics from './hydroponics.json' assert { type: 'json' };
import tools from './tools.json' assert { type: 'json' };
import misc from './misc.json' assert { type: 'json' };
import { miscCategoryMap } from './miscCategoryOverrides.js';

const withCategory = (items, category) =>
    items.map((item) => ({ ...item, category: item.category ?? category }));

const withCategoryOverrides = (items, categoryMap, fallbackCategory) =>
    items.map((item) => ({
        ...item,
        category: categoryMap.get(item.id) ?? item.category ?? fallbackCategory,
    }));

const miscItems = withCategoryOverrides(misc, miscCategoryMap, 'Misc');

export default [
    ...withCategory(aquarium, 'Aquarium'),
    ...withCategory(awards, 'Awards'),
    ...withCategory(hydroponics, 'Hydroponics'),
    ...withCategory(tools, 'Tools'),
    ...miscItems,
];
