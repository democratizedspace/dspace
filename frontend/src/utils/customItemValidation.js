import Ajv from 'ajv';

export const customItemSchema = {
    type: 'object',
    properties: {
        id: { type: 'string', minLength: 1 },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string', minLength: 1 },
    },
    required: ['id', 'name', 'description'],
    additionalProperties: true,
};

const ajv = new Ajv();
const validate = ajv.compile(customItemSchema);

export function validateItemData(data) {
    const valid = validate(data);
    return { valid, errors: validate.errors };
}
