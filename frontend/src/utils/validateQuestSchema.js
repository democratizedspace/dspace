import Ajv from 'ajv';
import schema from '../pages/quests/jsonSchemas/quest.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

export default function validateQuestSchema(quest) {
    const valid = validate(quest);
    return { valid, errors: validate.errors };
}
