import Ajv from 'ajv';

export const customProcessSchema = {
    type: 'object',
    properties: {
        title: { type: 'string', minLength: 3 },
        duration: {
            type: 'string',
            minLength: 1,
            pattern: '^(\\d+(?:\\.\\d+)?[dhms]\\s*)+$',
        },
        requireItems: { $ref: '#/definitions/items' },
        consumeItems: { $ref: '#/definitions/items' },
        createItems: { $ref: '#/definitions/items' },
    },
    required: ['title', 'duration'],
    additionalProperties: false,
    definitions: {
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string', minLength: 1 },
                    count: { type: 'number', minimum: 1 },
                },
                required: ['id', 'count'],
                additionalProperties: false,
            },
        },
    },
    anyOf: [
        { required: ['requireItems'], properties: { requireItems: { minItems: 1 } } },
        { required: ['consumeItems'], properties: { consumeItems: { minItems: 1 } } },
        { required: ['createItems'], properties: { createItems: { minItems: 1 } } },
    ],
};

const ajv = new Ajv({ strict: false });
const validate = ajv.compile(customProcessSchema);

export function validateProcessData(data) {
    const valid = validate(data);
    return { valid, errors: validate.errors };
}
