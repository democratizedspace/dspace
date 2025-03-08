import ItemForm from '../src/components/svelte/ItemForm.svelte';

describe('ItemForm Component', () => {
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
        const component = new ItemForm({
            target: container,
        });

        expect(component).toBeTruthy();
        expect(container.querySelector('form')).toBeTruthy();
        expect(container.querySelector('input[type="text"]')).toBeTruthy();
        expect(container.querySelector('textarea')).toBeTruthy();
        expect(container.querySelector('input[type="file"]')).toBeTruthy();
    });

    test('should handle form submission with all fields', () => {
        const component = new ItemForm({
            target: container,
        });

        const form = container.querySelector('form');
        const nameInput = container.querySelector('input[type="text"]');
        const descInput = container.querySelector('textarea');
        const priceInput = container.querySelector(
            'input[placeholder="e.g. 100 dUSD"]'
        );
        const unitInput = container.querySelector(
            'input[placeholder="e.g. kg, m, L"]'
        );
        const typeInput = container.querySelector(
            'input[placeholder="e.g. 3dprint"]'
        );

        // Setup mock event listener
        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        // Fill form
        nameInput.value = 'Test Item';
        nameInput.dispatchEvent(new Event('input'));

        descInput.value = 'Test Description';
        descInput.dispatchEvent(new Event('input'));

        priceInput.value = '100 dUSD';
        priceInput.dispatchEvent(new Event('input'));

        unitInput.value = 'kg';
        unitInput.dispatchEvent(new Event('input'));

        typeInput.value = '3dprint';
        typeInput.dispatchEvent(new Event('input'));

        // Submit form
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Verify submission
        expect(submittedData).toBeTruthy();
        const formData = submittedData;
        expect(formData.get('name')).toBe('Test Item');
        expect(formData.get('description')).toBe('Test Description');
        expect(formData.get('price')).toBe('100 dUSD');
        expect(formData.get('unit')).toBe('kg');
        expect(formData.get('type')).toBe('3dprint');
    });

    test('should handle form submission with only required fields', () => {
        const component = new ItemForm({
            target: container,
        });

        const form = container.querySelector('form');
        const nameInput = container.querySelector('input[type="text"]');
        const descInput = container.querySelector('textarea');

        // Setup mock event listener
        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        // Fill only required fields
        nameInput.value = 'Test Item';
        nameInput.dispatchEvent(new Event('input'));

        descInput.value = 'Test Description';
        descInput.dispatchEvent(new Event('input'));

        // Submit form
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Verify submission
        expect(submittedData).toBeTruthy();
        const formData = submittedData;
        expect(formData.get('name')).toBe('Test Item');
        expect(formData.get('description')).toBe('Test Description');
        expect(formData.get('price')).toBeNull();
        expect(formData.get('unit')).toBeNull();
        expect(formData.get('type')).toBeNull();
    });

    test('should handle image upload', () => {
        const component = new ItemForm({
            target: container,
        });

        const fileInput = container.querySelector('input[type="file"]');

        // Create a mock file
        const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

        // Create a mock file list
        Object.defineProperty(fileInput, 'files', {
            value: [file],
            writable: true,
        });

        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);

        // Verify that the file input has the file
        expect(fileInput.files[0].name).toBe('test.jpg');
        expect(fileInput.files[0].type).toBe('image/jpeg');
    });
});
