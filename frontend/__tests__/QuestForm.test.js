import QuestForm from '../src/components/svelte/QuestForm.svelte';

describe('QuestForm Component', () => {
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
        const component = new QuestForm({
            target: container
        });
        
        expect(component).toBeTruthy();
        expect(container.querySelector('form')).toBeTruthy();
        expect(container.querySelector('input[type="text"]')).toBeTruthy();
        expect(container.querySelector('textarea')).toBeTruthy();
    });

    test('should handle form submission', () => {
        const component = new QuestForm({
            target: container
        });

        const form = container.querySelector('form');
        const titleInput = container.querySelector('input[type="text"]');
        const descInput = container.querySelector('textarea');

        // Setup mock event listener
        let submittedData = null;
        component.$on('submit', (event) => {
            submittedData = event.detail;
        });

        // Fill form
        titleInput.value = 'Test Quest';
        titleInput.dispatchEvent(new Event('input'));
        
        descInput.value = 'Test Description';
        descInput.dispatchEvent(new Event('input'));

        // Submit form
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Verify submission
        expect(submittedData).toBeTruthy();
        const formData = submittedData;
        expect(formData.get('title')).toBe('Test Quest');
        expect(formData.get('description')).toBe('Test Description');
    });

    test('should handle image upload', () => {
        const component = new QuestForm({
            target: container
        });

        const fileInput = container.querySelector('input[type="file"]');
        
        // Create a mock file
        const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
        
        // Create a mock file list
        Object.defineProperty(fileInput, 'files', {
            value: [file],
            writable: true
        });

        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(changeEvent);

        // Verify that the file input has the file
        expect(fileInput.files[0].name).toBe('test.jpg');
        expect(fileInput.files[0].type).toBe('image/jpeg');
    });
});