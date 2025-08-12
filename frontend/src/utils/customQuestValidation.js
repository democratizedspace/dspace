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
    if (valid) {
        return { valid: true, errors: {} };
    }

    const errors = {};

    for (const err of validate.errors || []) {
        const field =
            err.instancePath.replace(/^\//, '') ||
            (err.params && err.params.missingProperty) ||
            'schema';

        switch (field) {
            case 'title':
            case 'description':
                if (err.keyword === 'pattern') {
                    errors[field] = 'HTML tags are not allowed';
                } else if (!errors[field]) {
                    errors[field] = err.message;
                }
                break;
            case 'image':
                if (err.keyword === 'pattern') {
                    errors.image = 'Image must be a valid data or http(s) URL';
                } else if (!errors.image) {
                    errors.image = err.message;
                }
                break;
            case 'requiresQuests':
                if (err.keyword === 'uniqueItems') {
                    errors.requiresQuests = 'Quest requirements must be unique';
                } else {
                    errors.requiresQuests = 'Quest requirements must be an array of strings';
                }
                break;
            default:
                if (!errors[field]) {
                    errors[field] = err.message || 'Invalid quest data';
                }
        }
    }

    return { valid: false, errors };
}

export function validateQuestDependencies(depIds = [], existingQuestIds = []) {
    const set = new Set(existingQuestIds);
    return depIds.every((id) => set.has(id));
}
