import ProcessForm from '../src/components/svelte/ProcessForm.svelte';

// Mock the item registry import
jest.mock('../src/pages/inventory/json/items', () => [
    { id: 'item-1', name: 'Test Item 1', description: 'Description 1' },
    { id: 'item-2', name: 'Test Item 2', description: 'Description 2' },
    { id: 'item-3', name: 'Test Item 3', description: 'Description 3' },
]);

describe('ProcessForm Component', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container) {
            container.remove();
        }
    });

    test('should mount component', () => {
        const component = new ProcessForm({
            target: container,
        });

        expect(component).toBeTruthy();
        expect(container.querySelector('form')).toBeTruthy();
        expect(container.querySelector('input[type="text"]')).toBeTruthy();
    });

    test('should handle form submission with all fields', () => {
        const component = new ProcessForm({
            target: container,
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        // Setup mock event listener
        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        // Fill form
        titleInput.value = 'Test Process';
        titleInput.dispatchEvent(new Event('input'));

        durationInput.value = '1h 30m';
        durationInput.dispatchEvent(new Event('input'));

        // Add items
        component.$$set({
            requireItems: [{ id: 'item-1', count: 2 }],
            consumeItems: [{ id: 'item-2', count: 1 }],
            createItems: [{ id: 'item-3', count: 3 }],
        });

        // Submit form
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Verify submission
        expect(submittedData).toBeTruthy();
        const formData = submittedData;
        expect(formData.get('title')).toBe('Test Process');
        expect(formData.get('duration')).toBe('1h 30m');
        expect(JSON.parse(formData.get('requireItems'))).toEqual([{ id: 'item-1', count: 2 }]);
        expect(JSON.parse(formData.get('consumeItems'))).toEqual([{ id: 'item-2', count: 1 }]);
        expect(JSON.parse(formData.get('createItems'))).toEqual([{ id: 'item-3', count: 3 }]);
    });

    test('should handle form submission with minimal fields', () => {
        const component = new ProcessForm({
            target: container,
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        // Setup mock event listener
        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        // Fill only required fields
        titleInput.value = 'Test Process';
        titleInput.dispatchEvent(new Event('input'));

        durationInput.value = '1h';
        durationInput.dispatchEvent(new Event('input'));

        // Add minimal required item relationship
        component.$$set({ requireItems: [{ id: 'item-1', count: 1 }] });

        // Submit form
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Verify submission
        expect(submittedData).toBeTruthy();
        const formData = submittedData;
        expect(formData.get('title')).toBe('Test Process');
        expect(formData.get('duration')).toBe('1h');
        expect(JSON.parse(formData.get('requireItems'))).toEqual([{ id: 'item-1', count: 1 }]);
        expect(JSON.parse(formData.get('consumeItems'))).toEqual([]);
        expect(JSON.parse(formData.get('createItems'))).toEqual([]);
    });

    test('should reject submission without item relationships', () => {
        const component = new ProcessForm({
            target: container,
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        titleInput.value = 'Test Process';
        titleInput.dispatchEvent(new Event('input'));
        durationInput.value = '1h';
        durationInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        expect(submittedData).toBeFalsy();
    });

    test('should handle adding and removing items', () => {
        const component = new ProcessForm({
            target: container,
        });

        // Add a required item using the component's API
        component.$$set({ requireItems: [{ id: '', count: 1 }] });

        // Wait for next tick to allow Svelte to update the DOM
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                // Verify item was added
                expect(container.querySelectorAll('.item-row')).toHaveLength(1);

                // Remove the item using the component's API
                component.$$set({ requireItems: [] });

                requestAnimationFrame(() => {
                    // Verify item was removed
                    expect(container.querySelectorAll('.item-row')).toHaveLength(0);
                    resolve();
                });
            });
        });
    });

    test('should validate duration format including seconds and decimals', () => {
        const component = new ProcessForm({
            target: container,
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        // Setup mock event listener
        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        // Test invalid duration format
        titleInput.value = 'Test Process';
        titleInput.dispatchEvent(new Event('input'));

        durationInput.value = 'invalid';
        durationInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(submittedData).toBeFalsy();

        // Test valid duration formats
        const validDurations = ['1h 30m 10s', '0.5h'];
        for (const val of validDurations) {
            durationInput.value = val;
            durationInput.dispatchEvent(new Event('input'));
            form.dispatchEvent(new Event('submit', { cancelable: true }));
            expect(submittedData).toBeTruthy();
            submittedData = null;
        }
    });

    test('normalizes duration before submission', () => {
        const component = new ProcessForm({
            target: container,
            props: { requireItems: [{ id: 'item-1', count: 1 }] },
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        titleInput.value = 'Test Process';
        titleInput.dispatchEvent(new Event('input'));

        durationInput.value = '0.5h 30s';
        durationInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        expect(submittedData).toBeTruthy();
        expect(submittedData.get('duration')).toBe('30m 30s');
    });

    test('should validate item counts', () => {
        const component = new ProcessForm({
            target: container,
        });

        // Try to set negative count
        component.$$set({
            requireItems: [{ id: 'item-1', count: -1 }],
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        // Setup form data
        titleInput.value = 'Test Process';
        titleInput.dispatchEvent(new Event('input'));

        durationInput.value = '1h';
        durationInput.dispatchEvent(new Event('input'));

        // Setup mock event listener
        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(submittedData).toBeFalsy();

        // Set valid count
        component.$$set({
            requireItems: [{ id: 'item-1', count: 1 }],
        });

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(submittedData).toBeTruthy();
    });

    test('should handle empty required fields', () => {
        const component = new ProcessForm({
            target: container,
        });

        const form = container.querySelector('form');

        // Setup mock event listener
        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        // Submit with empty fields
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        expect(submittedData).toBeFalsy();
    });

    test('shows preview when preview button clicked with valid data', () => {
        const component = new ProcessForm({
            target: container,
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        // Set valid data
        titleInput.value = 'Preview Process';
        titleInput.dispatchEvent(new Event('input'));
        durationInput.value = '1h';
        durationInput.dispatchEvent(new Event('input'));

        // Click preview button
        const previewButton = container.querySelector('button.preview-button');
        previewButton.dispatchEvent(new Event('click'));

        // Verify preview rendered
        expect(container.querySelector('.process-preview')).toBeTruthy();
    });

    test('item count inputs enforce minimum of 1', () => {
        const component = new ProcessForm({
            target: container,
        });

        const addRequired = Array.from(container.querySelectorAll('button')).find((btn) =>
            btn.textContent.includes('Add Required Item')
        );
        addRequired.click();

        const countInput = container.querySelector('#required-items-section input[type="number"]');
        expect(countInput.getAttribute('min')).toBe('1');
    });
});
