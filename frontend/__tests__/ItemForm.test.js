/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect } from '@jest/globals';
import '@testing-library/jest-dom';
import { render, act, fireEvent, waitFor } from '@testing-library/svelte';
import ItemForm from '../src/components/svelte/ItemForm.svelte';

// Mock items import for dependency selection
jest.mock('../src/pages/inventory/json/items.json', () => [
    { id: '0', name: 'Printer' },
    { id: '1', name: 'Filament' },
]);

// Mock the database operations using Jest instead of Vitest
jest.mock('../src/utils/indexeddb.js', () => ({
    addEntity: jest.fn().mockResolvedValue('mocked-item-id'),
    updateEntity: jest.fn().mockResolvedValue('mocked-item-id'),
}));

import { addEntity, updateEntity } from '../src/utils/indexeddb.js';

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

// Ensure __SSR__ is properly set for client-side hydration
global.__SSR__ = false;
global.__BROWSER__ = true;

// Setup DOM environment mimicking Astro SSR output
function setupDom() {
    document.body.innerHTML = `
    <div id="app">
      <div id="item-form-container"></div>
    </div>
  `;
    return document.getElementById('item-form-container');
}

describe('ItemForm Component', () => {
    let container;

    beforeEach(() => {
        // Setup DOM
        container = setupDom();

        // Reset mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Cleanup
        container.innerHTML = '';
    });

    it('renders form elements correctly', async () => {
        const { getByLabelText, getByText } = render(ItemForm, {
            target: container,
            props: {
                isEdit: false,
            },
        });

        // Verify form fields are present
        await waitFor(() => {
            expect(getByLabelText(/name/i)).toBeInTheDocument();
            expect(getByLabelText(/description/i)).toBeInTheDocument();
            expect(getByLabelText(/upload an image/i)).toBeInTheDocument();
            expect(getByText(/add dependency/i)).toBeInTheDocument();
        });
    });

    it('submits form with all fields filled', async () => {
        const { getByLabelText, getByText } = render(ItemForm, {
            target: container,
            props: {
                isEdit: false,
            },
        });

        // Fill form fields
        await act(async () => {
            fireEvent.input(getByLabelText(/name/i), {
                target: { value: 'Test Item' },
            });

            fireEvent.input(getByLabelText(/description/i), {
                target: { value: 'This is a test item description' },
            });

            // Simulate image upload
            const file = new File(['mock content'], 'test-image.jpg', { type: 'image/jpeg' });
            fireEvent.change(getByLabelText(/upload an image/i), {
                target: { files: [file] },
            });

            fireEvent.click(getByText(/add dependency/i));
            const select = container.querySelector('select');
            fireEvent.change(select, { target: { value: '1' } });
        });

        // Submit the form
        await act(async () => {
            fireEvent.click(getByText(/create item/i));
        });

        // Check if database add was called with correct data
        await waitFor(() => {
            expect(addEntity).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Test Item',
                    description: 'This is a test item description',
                    image: 'mocked-image-url',
                    requires: ['1']
                })
            );
        });
    });

    it('validates required fields', async () => {
        const { getByText } = render(ItemForm, {
            target: container,
            props: {
                isEdit: false,
            },
        });

        // Submit form without filling any fields
        await act(async () => {
            fireEvent.click(getByText(/create item/i));
        });

        // Check if validation messages appear
        await waitFor(() => {
            expect(getByText(/name is required/i)).toBeInTheDocument();
            expect(getByText(/description is required/i)).toBeInTheDocument();
            expect(getByText(/image is required/i)).toBeInTheDocument();
        });

        // Verify the database was not called
        expect(addEntity).not.toHaveBeenCalled();
    });

    it('handles edit mode correctly', async () => {
        // Setup edit mode with existing item data
        const existingItem = {
            id: 'item-123',
            name: 'Existing Item',
            description: 'Existing item description',
            image: 'existing-image-url',
            requires: ['0'],
        };

        // No additional mocking needed - updateEntity is already mocked

        const { getByLabelText, getByText } = render(ItemForm, {
            target: container,
            props: {
                isEdit: true,
                itemData: existingItem,
            },
        });

        // Check if form is pre-filled with existing data
        await waitFor(() => {
            expect(getByLabelText(/name/i).value).toBe(existingItem.name);
            expect(getByLabelText(/description/i).value).toBe(existingItem.description);
        });

        // Submit form without changes
        await act(async () => {
            fireEvent.click(getByText(/update item/i));
        });

        // Verify update was called with correct data
        await waitFor(() => {
            expect(updateEntity).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: existingItem.id,
                    name: existingItem.name,
                    description: existingItem.description,
                    image: existingItem.image,
                    requires: ['0'],
                })
            );
        });
    });
});
