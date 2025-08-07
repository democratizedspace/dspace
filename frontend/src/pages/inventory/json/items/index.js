import aquarium from './aquarium.json' assert { type: 'json' };
import awards from './awards.json' assert { type: 'json' };
import hydroponics from './hydroponics.json' assert { type: 'json' };
import tools from './tools.json' assert { type: 'json' };
import misc from './misc.json' assert { type: 'json' };

export default [...aquarium, ...awards, ...hydroponics, ...tools, ...misc];
