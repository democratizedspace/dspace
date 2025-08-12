import energy from './energy.json' assert { type: 'json' };
import printing from './3dprinting.json' assert { type: 'json' };
import hydroponics from './hydroponics.json' assert { type: 'json' };
import aquaria from './aquaria.json' assert { type: 'json' };
import computing from './computing.json' assert { type: 'json' };
import electronics from './electronics.json' assert { type: 'json' };
import astronomy from './astronomy.json' assert { type: 'json' };
import firstaid from './firstaid.json' assert { type: 'json' };
import compost from './compost.json' assert { type: 'json' };
import woodworking from './woodworking.json' assert { type: 'json' };
import misc from './misc.json' assert { type: 'json' };

export default [
    ...energy,
    ...printing,
    ...hydroponics,
    ...aquaria,
    ...computing,
    ...electronics,
    ...astronomy,
    ...firstaid,
    ...compost,
    ...woodworking,
    ...misc,
];
