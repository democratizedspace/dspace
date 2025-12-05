// Import JSON files with import attributes (modern syntax)
import aquarium from './aquarium.json' with { type: 'json' };
import awards from './awards.json' with { type: 'json' };
import hydroponics from './hydroponics.json' with { type: 'json' };
import tools from './tools.json' with { type: 'json' };
import misc from './misc.json' with { type: 'json' };

const withCategory = (items, category) => items.map((item) => ({ ...item, category }));

export default [
    ...withCategory(aquarium, 'Aquarium'),
    ...withCategory(awards, 'Awards'),
    ...withCategory(hydroponics, 'Hydroponics'),
    ...withCategory(tools, 'Tools'),
    ...withCategory(misc, 'Misc'),
];
