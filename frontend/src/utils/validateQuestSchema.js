import Ajv from 'ajv';
// Using import assertions for JSON imports
import schema from '../pages/quests/jsonSchemas/quest.json' assert { type: 'json' };
import hardeningSchema from '../../../common/hardening.schema.json' assert { type: 'json' };

const ajv = new Ajv({ allErrors: true });
ajv.addSchema(hardeningSchema);
const validate = ajv.compile(schema);

export default function validateQuestSchema(quest) {
    const valid = validate(quest);
    return { valid, errors: validate.errors };
}
