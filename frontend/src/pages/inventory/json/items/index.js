// Import JSON files directly - Vite handles JSON imports natively without assertions
import aquarium from './aquarium.json';
import awards from './awards.json';
import hydroponics from './hydroponics.json';
import tools from './tools.json';
import misc from './misc.json';

const withCategory = (items, category) => items.map((item) => ({ ...item, category }));

export default [
    ...withCategory(aquarium, 'Aquarium'),
    ...withCategory(awards, 'Awards'),
    ...withCategory(hydroponics, 'Hydroponics'),
    ...withCategory(tools, 'Tools'),
    ...withCategory(misc, 'Misc'),
];
