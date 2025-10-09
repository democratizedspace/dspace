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
        npc: { type: 'string', minLength: 1, pattern: '^[^<>]*$' },
        start: { type: 'string', minLength: 1, pattern: '^[^<>]*$' },
        dialogue: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', minLength: 1, pattern: '^[^<>]*$' },
                    text: { type: 'string', minLength: 1 },
                    options: {
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', minLength: 1 },
                                text: { type: 'string', minLength: 1 },
                                goto: { type: 'string', minLength: 1 },
                                process: { type: 'string', minLength: 1 },
                                requiresItems: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string', minLength: 1 },
                                            count: { type: 'number', minimum: 1 },
                                        },
                                        required: ['id', 'count'],
                                    },
                                },
                                grantsItems: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string', minLength: 1 },
                                            count: { type: 'number', minimum: 1 },
                                        },
                                        required: ['id', 'count'],
                                    },
                                },
                            },
                            required: ['type', 'text'],
                            additionalProperties: true,
                        },
                    },
                },
                required: ['id', 'text', 'options'],
                additionalProperties: true,
            },
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
