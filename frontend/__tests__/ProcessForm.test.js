import ProcessForm from '../src/components/svelte/ProcessForm.svelte';

const mockedItems = [
    { id: 'item-1', name: 'Test Item 1', description: 'Description 1' },
    { id: 'item-2', name: 'Test Item 2', description: 'Description 2' },
    { id: 'item-3', name: 'Test Item 3', description: 'Description 3' },
];

// Mock the item registry import
jest.mock('../src/pages/inventory/json/items', () => mockedItems);

jest.mock('../src/utils/itemCatalog.js', () => ({
    getMergedItemCatalog: jest.fn().mockResolvedValue(mockedItems),
}));

const mockDb = {
    processes: {
        add: jest.fn().mockResolvedValue('process-123'),
        update: jest.fn().mockResolvedValue('process-123'),
    },
};

const createProcessMock = jest.fn((...args) => mockDb.processes.add(...args));
const updateProcessMock = jest.fn((...args) => mockDb.processes.update(...args));

jest.mock('../src/utils/customcontent.js', () => ({
    db: mockDb,
    createProcess: (...args) => createProcessMock(...args),
    updateProcess: (...args) => updateProcessMock(...args),
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('ProcessForm Component', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        mockDb.processes.add.mockClear();
        mockDb.processes.update.mockClear();
        createProcessMock.mockClear();
        updateProcessMock.mockClear();
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

    test('should handle form submission with all fields', async () => {
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
        component.$set({
            requireItems: [{ id: 'item-1', count: 2 }],
            consumeItems: [{ id: 'item-2', count: 1 }],
            createItems: [{ id: 'item-3', count: 3 }],
        });

        // Submit form
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await flushPromises();

        // Verify submission
        expect(submittedData).toBeTruthy();
        const formData = submittedData;
        expect(formData.get('title')).toBe('Test Process');
        expect(formData.get('duration')).toBe('1h 30m');
        expect(JSON.parse(formData.get('requireItems'))).toEqual([{ id: 'item-1', count: 2 }]);
        expect(JSON.parse(formData.get('consumeItems'))).toEqual([{ id: 'item-2', count: 1 }]);
        expect(JSON.parse(formData.get('createItems'))).toEqual([{ id: 'item-3', count: 3 }]);
        expect(createProcessMock).toHaveBeenCalledWith(
            'Test Process',
            '1h 30m',
            [{ id: 'item-1', count: 2 }],
            [{ id: 'item-2', count: 1 }],
            [{ id: 'item-3', count: 3 }]
        );
    });

    test('should handle form submission with minimal fields', async () => {
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
        component.$set({ requireItems: [{ id: 'item-1', count: 1 }] });

        // Submit form
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await flushPromises();

        // Verify submission
        expect(submittedData).toBeTruthy();
        const formData = submittedData;
        expect(formData.get('title')).toBe('Test Process');
        expect(formData.get('duration')).toBe('1h');
        expect(JSON.parse(formData.get('requireItems'))).toEqual([{ id: 'item-1', count: 1 }]);
        expect(JSON.parse(formData.get('consumeItems'))).toEqual([]);
        expect(JSON.parse(formData.get('createItems'))).toEqual([]);
        expect(createProcessMock).toHaveBeenCalledWith(
            'Test Process',
            '1h',
            [{ id: 'item-1', count: 1 }],
            [],
            []
        );
    });

    test('should reject submission without item relationships', async () => {
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

        await flushPromises();

        expect(submittedData).toBeFalsy();
        expect(createProcessMock).not.toHaveBeenCalled();
    });

    test('remove buttons have descriptive aria labels', () => {
        const component = new ProcessForm({
            target: container,
        });

        component.$set({
            requireItems: [{ id: '', count: 1 }],
            consumeItems: [{ id: '', count: 1 }],
            createItems: [{ id: '', count: 1 }],
        });

        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const buttons = container.querySelectorAll('.remove-button');
                expect(buttons[0].getAttribute('aria-label')).toBe('Remove required item');
                expect(buttons[1].getAttribute('aria-label')).toBe('Remove consumed item');
                expect(buttons[2].getAttribute('aria-label')).toBe('Remove created item');
                resolve();
            });
        });
    });

    /*
     * NOTE: The next three tests are referenced by line number in docs/qa/v3.md.
     * Keep this spacer block aligned with those line ranges.
     * Line spacer 01
     * Line spacer 02
     * Line spacer 03
     * Line spacer 04
     * Line spacer 05
     * Line spacer 06
     * Line spacer 07
     * Line spacer 08
     * Line spacer 09
     * Line spacer 10
     * Line spacer 11
     * Line spacer 12
     * Line spacer 13
     * Line spacer 14
     * Line spacer 15
     * Line spacer 16
     * Line spacer 17
     */

    test('should validate duration format including seconds and decimals', async () => {
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
        await flushPromises();
        expect(submittedData).toBeFalsy();
        expect(createProcessMock).not.toHaveBeenCalled();

        // Test valid duration formats
        const validDurations = ['1h 30m 10s', '0.5h'];
        for (const val of validDurations) {
            durationInput.value = val;
            durationInput.dispatchEvent(new Event('input'));
            form.dispatchEvent(new Event('submit', { cancelable: true }));
            await flushPromises();
            expect(submittedData).toBeTruthy();
            submittedData = null;
        }
    });

    test('normalizes duration before submission', async () => {
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

        await flushPromises();

        expect(submittedData).toBeTruthy();
        expect(submittedData.get('duration')).toBe('30m 30s');
    });

    test('should validate item counts', async () => {
        const component = new ProcessForm({
            target: container,
        });

        // Try to set negative count
        component.$set({
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
        await flushPromises();
        expect(submittedData).toBeFalsy();
        expect(createProcessMock).not.toHaveBeenCalled();

        // Set valid count
        component.$set({
            requireItems: [{ id: 'item-1', count: 1 }],
        });

        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await flushPromises();
        expect(submittedData).toBeTruthy();
    });

    test('should handle empty required fields', async () => {
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
        await flushPromises();
        expect(submittedData).toBeFalsy();
        expect(createProcessMock).not.toHaveBeenCalled();
    });

    test('shows preview when preview button clicked with valid data', () => {
        new ProcessForm({
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

    test('renders success message after saving process', async () => {
        const component = new ProcessForm({
            target: container,
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        component.$set({ requireItems: [{ id: 'item-1', count: 2 }] });

        titleInput.value = 'Saved Process';
        titleInput.dispatchEvent(new Event('input'));
        durationInput.value = '1h';
        durationInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await flushPromises();

        const message = container.querySelector('.success-message');
        expect(message).toBeTruthy();
        expect(message.textContent).toContain('Process created successfully');
        expect(createProcessMock).toHaveBeenCalledTimes(1);
    });

    test('does not show a success link when createProcess returns null', async () => {
        createProcessMock.mockResolvedValueOnce(null);

        new ProcessForm({
            target: container,
            props: { requireItems: [{ id: 'item-1', count: 1 }] },
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        titleInput.value = 'No ID Process';
        titleInput.dispatchEvent(new Event('input'));
        durationInput.value = '15m';
        durationInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await flushPromises();

        expect(container.querySelector('.success-message').textContent).toContain(
            'Process created successfully'
        );
        expect(container.querySelector('.success-link')).toBeFalsy();
    });

    test('clears the form and hides preview after successful submission', async () => {
        const component = new ProcessForm({
            target: container,
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        component.$set({ requireItems: [{ id: 'item-1', count: 2 }] });

        titleInput.value = 'Clearing Process';
        titleInput.dispatchEvent(new Event('input'));
        durationInput.value = '1h';
        durationInput.dispatchEvent(new Event('input'));

        const previewButton = container.querySelector('button.preview-button');
        previewButton.dispatchEvent(new Event('click'));
        expect(container.querySelector('.process-preview')).toBeTruthy();

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await flushPromises();

        expect(titleInput.value).toBe('');
        expect(durationInput.value).toBe('');
        expect(container.querySelectorAll('.item-row')).toHaveLength(0);
        expect(container.querySelector('.process-preview')).toBeFalsy();
    });

    test('item count inputs enforce minimum of 1', () => {
        new ProcessForm({
            target: container,
        });

        const addRequired = Array.from(container.querySelectorAll('button')).find((btn) =>
            btn.textContent.includes('Add Required Item')
        );
        addRequired.click();

        const countInput = container.querySelector('#required-items-section input[type="number"]');
        expect(countInput.getAttribute('min')).toBe('1');
    });

    test('initializes form fields when editing a process', () => {
        new ProcessForm({
            target: container,
            props: {
                isEdit: true,
                processData: {
                    id: 'process-777',
                    title: 'Existing Process',
                    duration: '45m',
                    requireItems: [{ id: 'item-1', count: 2 }],
                    consumeItems: [],
                    createItems: [],
                },
            },
        });

        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                const titleInput = container.querySelector('#title');
                const durationInput = container.querySelector('#duration');
                const countInput = container.querySelector(
                    '#required-items-section input[type="number"]'
                );

                expect(titleInput.value).toBe('Existing Process');
                expect(durationInput.value).toBe('45m');
                expect(countInput.value).toBe('2');
                resolve();
            });
        });
    });

    test('reinitializes fields when edit process data changes', async () => {
        const component = new ProcessForm({
            target: container,
            props: {
                isEdit: true,
                processData: {
                    id: 'process-111',
                    title: 'Original',
                    duration: '10m',
                    requireItems: [{ id: 'item-1', count: 1 }],
                    consumeItems: [],
                    createItems: [],
                },
            },
        });

        await new Promise((resolve) => requestAnimationFrame(resolve));

        component.$set({
            processData: {
                id: 'process-222',
                title: 'Updated',
                duration: '20m',
                requireItems: [],
                consumeItems: [],
                createItems: [{ id: 'item-2', count: 3 }],
            },
        });

        await new Promise((resolve) => requestAnimationFrame(resolve));

        const titleInput = container.querySelector('#title');
        const durationInput = container.querySelector('#duration');
        const createCountInput = container.querySelector(
            '#created-items-section input[type="number"]'
        );

        expect(titleInput.value).toBe('Updated');
        expect(durationInput.value).toBe('20m');
        expect(createCountInput.value).toBe('3');
    });

    test('submits updates when editing a process', async () => {
        const component = new ProcessForm({
            target: container,
            props: {
                isEdit: true,
                processData: {
                    id: 'process-888',
                    title: 'Original Process',
                    duration: '1h',
                    requireItems: [{ id: 'item-1', count: 1 }],
                    consumeItems: [],
                    createItems: [],
                },
            },
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        titleInput.value = 'Updated Process';
        titleInput.dispatchEvent(new Event('input'));
        durationInput.value = '1h';
        durationInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await flushPromises();

        expect(submittedData).toBeTruthy();
        expect(updateProcessMock).toHaveBeenCalledWith(
            'process-888',
            expect.objectContaining({
                title: 'Updated Process',
                duration: '1h',
            })
        );
        expect(createProcessMock).not.toHaveBeenCalled();
    });

    test('uses processId prop when editing without processData id', async () => {
        const component = new ProcessForm({
            target: container,
            props: {
                isEdit: true,
                processId: 'process-999',
                processData: {
                    title: 'Prop ID Process',
                    duration: '30m',
                    requireItems: [{ id: 'item-1', count: 1 }],
                    consumeItems: [],
                    createItems: [],
                },
            },
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        titleInput.value = 'Prop ID Process Updated';
        titleInput.dispatchEvent(new Event('input'));
        durationInput.value = '30m';
        durationInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await flushPromises();

        expect(submittedData).toBeTruthy();
        expect(updateProcessMock).toHaveBeenCalledWith(
            'process-999',
            expect.objectContaining({
                title: 'Prop ID Process Updated',
                duration: '30m',
            })
        );
        expect(container.querySelector('.success-message').textContent).toContain(
            'Process updated successfully'
        );
        expect(container.querySelector('.success-link').getAttribute('href')).toBe(
            '/processes/process-999'
        );
        expect(createProcessMock).not.toHaveBeenCalled();
    });

    test('shows an error when editing without a process id', async () => {
        new ProcessForm({
            target: container,
            props: {
                isEdit: true,
                requireItems: [{ id: 'item-1', count: 1 }],
            },
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        titleInput.value = 'Missing ID Process';
        titleInput.dispatchEvent(new Event('input'));
        durationInput.value = '15m';
        durationInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await flushPromises();

        expect(updateProcessMock).not.toHaveBeenCalled();
        expect(container.querySelector('.form-error').textContent).toBe(
            'Failed to save process. Please try again.'
        );
    });

    test('shows an error when update fails', async () => {
        updateProcessMock.mockRejectedValueOnce(new Error('Update failed'));

        new ProcessForm({
            target: container,
            props: {
                isEdit: true,
                processId: 'process-500',
                processData: {
                    id: 'process-500',
                    title: 'Failing Update',
                    duration: '10m',
                    requireItems: [{ id: 'item-1', count: 1 }],
                    consumeItems: [],
                    createItems: [],
                },
            },
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const durationInput = container.querySelector('input[placeholder="e.g. 1h 30m"]');

        titleInput.value = 'Failing Update';
        titleInput.dispatchEvent(new Event('input'));
        durationInput.value = '10m';
        durationInput.dispatchEvent(new Event('input'));

        form.dispatchEvent(new Event('submit', { cancelable: true }));

        await flushPromises();

        expect(updateProcessMock).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.form-error').textContent).toBe(
            'Failed to save process. Please try again.'
        );
    });
});
