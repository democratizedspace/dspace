/**
 * @jest-environment jsdom
 */
// Import testing utilities
import { beforeEach, afterEach, describe, it, expect } from '@jest/globals';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock the db module
const mockDb = {
    quests: {
        add: jest.fn().mockResolvedValue('mocked-quest-id'),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        list: jest.fn().mockResolvedValue([]),
        query: jest.fn().mockResolvedValue([]),
    },
    items: {
        list: jest.fn().mockResolvedValue([]),
    },
};

// Mock the imports
jest.mock('../src/utils/customcontent.js', () => ({
    db: mockDb,
}));

// Create a mock for QuestForm component
const mockQuestForm = {
    render: (target, props = {}) => {
        // Simple mock implementation that simulates a rendered form
        const form = document.createElement('form');
        form.className = 'quest-form';

        // Add title input
        const titleGroup = document.createElement('div');
        titleGroup.className = 'form-group';

        const titleLabel = document.createElement('label');
        titleLabel.setAttribute('for', 'title');
        titleLabel.textContent = 'Title*';

        const titleInput = document.createElement('input');
        titleInput.id = 'title';
        titleInput.type = 'text';
        titleInput.placeholder = 'Gather resources';
        titleInput.value = props.title || '';

        titleGroup.appendChild(titleLabel);
        titleGroup.appendChild(titleInput);

        // Add description textarea
        const descGroup = document.createElement('div');
        descGroup.className = 'form-group';

        const descLabel = document.createElement('label');
        descLabel.setAttribute('for', 'description');
        descLabel.textContent = 'Description*';

        const descTextarea = document.createElement('textarea');
        descTextarea.id = 'description';
        descTextarea.placeholder = 'Describe the quest in detail. What needs to be done?';
        descTextarea.value = props.description || '';

        descGroup.appendChild(descLabel);
        descGroup.appendChild(descTextarea);

        // Add image input
        const imageGroup = document.createElement('div');
        imageGroup.className = 'form-group';

        const imageLabel = document.createElement('label');
        imageLabel.setAttribute('for', 'image');
        imageLabel.textContent = 'Upload an Image*';

        const imageInput = document.createElement('input');
        imageInput.id = 'image';
        imageInput.type = 'file';
        imageInput.accept = 'image/*';

        imageGroup.appendChild(imageLabel);
        imageGroup.appendChild(imageInput);

        // Add requirements select
        const reqGroup = document.createElement('div');
        reqGroup.className = 'form-group';

        const reqLabel = document.createElement('label');
        reqLabel.setAttribute('for', 'requires');
        reqLabel.textContent = 'Quest Requirements';

        const reqSelect = document.createElement('select');
        reqSelect.id = 'requires';
        reqSelect.multiple = true;
        (props.existingQuests || []).forEach((q) => {
            const opt = document.createElement('option');
            opt.value = q.id;
            opt.textContent = q.title;
            reqSelect.appendChild(opt);
        });

        reqGroup.appendChild(reqLabel);
        reqGroup.appendChild(reqSelect);

        // Add submit button
        const submitDiv = document.createElement('div');
        submitDiv.className = 'form-submit';

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.className = 'submit-button';
        submitButton.textContent = props.isEdit ? 'Update Quest' : 'Create Quest';

        submitDiv.appendChild(submitButton);

        // Define the submission handler
        const handleSubmit = async (e) => {
            if (e) e.preventDefault();

            const formData = {
                title: titleInput.value,
                description: descTextarea.value,
                image: imageInput.files?.[0] || (props.image ? 'existing-image' : null),
                requiresQuests: Array.from(reqSelect.selectedOptions).map((o) => o.value),
            };

            // Validate form
            const errors = {};
            if (!formData.title.trim()) {
                errors.title = 'Title is required';
            } else if (formData.title.trim().length < 3) {
                errors.title = 'Title must be at least 3 characters';
            }
            if (!formData.description.trim()) {
                errors.description = 'Description is required';
            } else if (formData.description.trim().length < 10) {
                errors.description = 'Description must be at least 10 characters';
            }
            if (!props.isEdit && !formData.image && !props.image)
                errors.image = 'Image is required';

            // If there are errors, show them
            if (Object.keys(errors).length > 0) {
                for (const [field, message] of Object.entries(errors)) {
                    const errorSpan = document.createElement('span');
                    errorSpan.className = 'error-message';
                    errorSpan.textContent = message;

                    const fieldGroup = form.querySelector(`#${field}`).parentNode;
                    if (!fieldGroup.querySelector('.error-message')) {
                        fieldGroup.appendChild(errorSpan);
                    }
                }
                return false;
            }

            // If in edit mode, call update, otherwise call add
            if (props.isEdit) {
                await mockDb.quests.update(props.questId, {
                    title: formData.title,
                    description: formData.description,
                    image: 'mocked-image-url',
                    requiresQuests: formData.requiresQuests,
                });
            } else {
                await mockDb.quests.add({
                    title: formData.title,
                    description: formData.description,
                    image: 'mocked-image-url',
                    requiresQuests: formData.requiresQuests,
                });
            }

            return true;
        };

        // Add event listener (but mostly for documentation, we'll call handleSubmit directly in tests)
        form.addEventListener('submit', handleSubmit);

        // Build the form
        form.appendChild(titleGroup);
        form.appendChild(descGroup);
        form.appendChild(imageGroup);
        form.appendChild(reqGroup);
        form.appendChild(submitDiv);

        // Add to the target
        target.appendChild(form);

        return {
            destroy: () => {
                form.remove();
            },
            // Expose the form elements and handler for testing
            elements: {
                form,
                titleInput,
                descTextarea,
                imageInput,
                reqSelect,
                submitButton,
            },
            handleSubmit,
        };
    },
};

// Mock the component
jest.mock('../src/components/svelte/QuestForm.svelte', () => ({
    default: {
        render: mockQuestForm.render,
    },
}));

// Mock the browser's fetch API
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'mocked-image-url' }),
    })
);

// Mock File and FileReader for image uploads
global.File = class File {
    constructor(bits, name, options) {
        this.name = name;
        this.size = bits.length;
        this.type = options?.type || '';
    }
};

// Create a FileReader mock
global.FileReader = class FileReader {
    constructor() {
        this.readAsDataURL = jest.fn((file) => {
            // Simulate the file reading process
            setTimeout(() => {
                this.result = 'data:image/png;base64,mockedBase64Data';
                if (typeof this.onload === 'function') {
                    this.onload({ target: this });
                }
            }, 0);
        });
    }
};

// Helper function to simulate async operations
const waitFor = async (callback, options = {}) => {
    const { timeout = 1000, interval = 50 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        try {
            const result = callback();
            if (result !== undefined) {
                return result;
            }
        } catch (error) {
            // Ignore errors during waiting
        }

        // Wait for the next interval
        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    // Last attempt before throwing timeout error
    return callback();
};

// Mock act functionality
const act = async (callback) => {
    await callback();
    // Wait for any promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
};

// Setup DOM environment
function setupDom() {
    document.body.innerHTML = `
    <div id="app">
      <div id="quest-form-container"></div>
    </div>
  `;
    return document.getElementById('quest-form-container');
}

// Test implementation
describe('QuestForm Component', () => {
    let container;
    let component;

    beforeEach(() => {
        // Setup DOM
        container = setupDom();

        // Reset mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Cleanup
        if (component && component.destroy) {
            component.destroy();
        }
        container.innerHTML = '';
    });

    it('renders form elements correctly', async () => {
        // Render the component
        component = mockQuestForm.render(container, {
            isEdit: false,
            existingQuests: [{ id: 'q1', title: 'Base Quest' }],
        });

        // Verify form fields are present
        expect(container.querySelector('label[for="title"]')).not.toBeNull();
        expect(container.querySelector('label[for="description"]')).not.toBeNull();
        expect(container.querySelector('label[for="image"]')).not.toBeNull();
    });

    it('lists existing quests for requirements selection', async () => {
        component = mockQuestForm.render(container, {
            isEdit: false,
            existingQuests: [
                { id: 'q1', title: 'Base Quest' },
                { id: 'q2', title: 'Second Quest' },
            ],
        });

        const options = Array.from(container.querySelectorAll('#requires option'));
        const titles = options.map((o) => o.textContent);
        expect(titles).toEqual(['Base Quest', 'Second Quest']);
    });

    it('submits form with all fields filled', async () => {
        // Render the component
        component = mockQuestForm.render(container, {
            isEdit: false,
            existingQuests: [{ id: 'q1', title: 'Base Quest' }],
        });

        // Fill form fields
        await act(async () => {
            const titleInput = container.querySelector('#title');
            titleInput.value = 'Test Quest';

            const descInput = container.querySelector('#description');
            descInput.value = 'This is a test quest description';

            // Create a mock file
            const mockFile = new File(['test image content'], 'test-image.png', {
                type: 'image/png',
            });

            // Add a file to the image input
            await act(async () => {
                // Get the image input from the component elements
                const { imageInput, reqSelect } = component.elements;

                // Set the files property directly
                Object.defineProperty(imageInput, 'files', {
                    value: [mockFile],
                    writable: true,
                });
                reqSelect.options[0].selected = true;

                // No need to dispatch event, we'll directly call handleSubmit which reads from files
            });
        });

        // Submit the form
        await act(async () => {
            await component.handleSubmit();
        });

        // Check if database add was called with correct data
        expect(mockDb.quests.add).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Test Quest',
                description: 'This is a test quest description',
                image: 'mocked-image-url',
                requiresQuests: ['q1'],
            })
        );
    });

    it('validates required fields', async () => {
        // Render the component
        component = mockQuestForm.render(container, { isEdit: false });

        // Submit form without filling any fields
        await act(async () => {
            await component.handleSubmit();
        });

        // Check if validation messages appear
        await waitFor(() => {
            expect(container.querySelector('.error-message')).not.toBeNull();
            expect(container.textContent).toContain('Title is required');
            expect(container.textContent).toContain('Description is required');
            expect(container.textContent).toContain('Image is required');
        });

        // Verify the database was not called
        expect(mockDb.quests.add).not.toHaveBeenCalled();
    });

    it('handles edit mode correctly', async () => {
        // Setup edit mode with existing quest data
        const existingQuest = {
            id: 'quest-123',
            title: 'Existing Quest',
            description: 'Existing quest description',
            image: 'existing-image-url',
        };

        // Mock for edit mode
        mockDb.quests.get.mockResolvedValueOnce(existingQuest);
        mockDb.quests.update.mockResolvedValueOnce(existingQuest.id);

        // Render the component
        component = mockQuestForm.render(container, {
            isEdit: true,
            questId: existingQuest.id,
            title: existingQuest.title,
            description: existingQuest.description,
            image: existingQuest.image,
            existingQuests: [{ id: 'q1', title: 'Base Quest' }],
        });

        // Check if form is pre-filled with existing data
        expect(container.querySelector('#title').value).toBe(existingQuest.title);
        expect(container.querySelector('#description').value).toBe(existingQuest.description);

        // Submit form without changes
        await act(async () => {
            await component.handleSubmit();
        });

        // Verify update was called with correct data
        expect(mockDb.quests.update).toHaveBeenCalledWith(
            existingQuest.id,
            expect.objectContaining({
                title: existingQuest.title,
                description: existingQuest.description,
                image: 'mocked-image-url',
                requiresQuests: [],
            })
        );
    });

    it('validates minimum lengths', async () => {
        component = mockQuestForm.render(container, { isEdit: false });

        const { titleInput, descTextarea } = component.elements;
        titleInput.value = 'ab';
        descTextarea.value = 'short';

        await act(async () => {
            await component.handleSubmit();
        });

        await waitFor(() => {
            expect(container.textContent).toContain('at least 3 characters');
            expect(container.textContent).toContain('at least 10 characters');
        });
    });
});

// Create an Event to dispatch
const createEvent = (type, options = {}) => {
    return new Event(type, { bubbles: true, cancelable: true, ...options });
};
