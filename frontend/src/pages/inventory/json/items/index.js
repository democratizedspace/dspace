import aquarium from './aquarium.json' assert { type: 'json' };
import awards from './awards.json' assert { type: 'json' };
import hydroponics from './hydroponics.json' assert { type: 'json' };
import tools from './tools.json' assert { type: 'json' };
import misc from './misc.json' assert { type: 'json' };

const withCategory = (items, category) => items.map((item) => ({ ...item, category }));

export default [
    ...withCategory(aquarium, 'Aquarium'),
    ...withCategory(awards, 'Awards'),
    ...withCategory(hydroponics, 'Hydroponics'),
    ...withCategory(tools, 'Tools'),
    ...withCategory(misc, 'Misc'),
];
