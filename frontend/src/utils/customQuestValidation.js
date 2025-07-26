import Ajv from 'ajv';

export const customQuestSchema = {
    type: 'object',
    properties: {
        title: { type: 'string', minLength: 3 },
        description: { type: 'string', minLength: 10 },
        image: {
            type: 'string',
            minLength: 1,
            pattern: '^(data:image/|https?://)',
        },
        requiresQuests: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
        },
    },
    required: ['title', 'description', 'image'],
};

const ajv = new Ajv();
const validate = ajv.compile(customQuestSchema);

export function validateQuestData(data) {
    const valid = validate(data);
    return { valid, errors: validate.errors };
}
