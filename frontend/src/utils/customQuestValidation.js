import Ajv from 'ajv';

export const customQuestSchema = {
    type: 'object',
    properties: {
        title: { type: 'string', minLength: 3, pattern: '^[^<>]*$' },
        description: { type: 'string', minLength: 10, pattern: '^[^<>]*$' },
        image: {
            type: 'string',
            minLength: 1,
            pattern: '^(data:image/|https?://|/)',
        },
        requiresQuests: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
        },
    },
    required: ['title', 'description', 'image'],
};

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(customQuestSchema);

export function validateQuestData(data) {
    const valid = validate(data);
    return { valid, errors: validate.errors };
}

export function validateQuestDependencies(depIds = [], existingQuestIds = []) {
    const set = new Set(existingQuestIds);
    return depIds.every((id) => set.has(id));
}
