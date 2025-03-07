import ProcessForm from '../src/components/svelte/ProcessForm.svelte';

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
            target: container
        });
        
        expect(component).toBeTruthy();
        expect(container.querySelector('form')).toBeTruthy();
        expect(container.querySelector('input[type="text"]')).toBeTruthy();
        expect(container.querySelector('button')).toBeTruthy();
    });

    test('should handle form submission with all fields', () => {
        const component = new ProcessForm({
            target: container
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

        // Add required items
        const addRequiredButton = container.querySelector('button');
        addRequiredButton.click();
        
        // Wait for the next tick to allow Svelte to update the DOM
        setTimeout(() => {
            const requiredItemInputs = container.querySelectorAll('.item-row input');
            requiredItemInputs[0].value = 'item1';
            requiredItemInputs[0].dispatchEvent(new Event('input'));
            requiredItemInputs[1].value = '2';
            requiredItemInputs[1].dispatchEvent(new Event('input'));

            // Add consumed items
            const addConsumedButton = container.querySelectorAll('button')[1];
            addConsumedButton.click();
            
            setTimeout(() => {
                const consumedItemInputs = container.querySelectorAll('.item-row input');
                consumedItemInputs[2].value = 'item2';
                consumedItemInputs[2].dispatchEvent(new Event('input'));
                consumedItemInputs[3].value = '3';
                consumedItemInputs[3].dispatchEvent(new Event('input'));

                // Add created items
                const addCreatedButton = container.querySelectorAll('button')[2];
                addCreatedButton.click();
                
                setTimeout(() => {
                    const createdItemInputs = container.querySelectorAll('.item-row input');
                    createdItemInputs[4].value = 'item3';
                    createdItemInputs[4].dispatchEvent(new Event('input'));
                    createdItemInputs[5].value = '4';
                    createdItemInputs[5].dispatchEvent(new Event('input'));

                    // Submit form
                    form.dispatchEvent(new Event('submit', { cancelable: true }));

                    // Verify submission
                    expect(submittedData).toBeTruthy();
                    const formData = submittedData;
                    expect(formData.get('title')).toBe('Test Process');
                    expect(formData.get('duration')).toBe('1h 30m');
                    
                    const requireItems = JSON.parse(formData.get('requireItems'));
                    expect(requireItems).toHaveLength(1);
                    expect(requireItems[0]).toEqual({ id: 'item1', count: 2 });
                    
                    const consumeItems = JSON.parse(formData.get('consumeItems'));
                    expect(consumeItems).toHaveLength(1);
                    expect(consumeItems[0]).toEqual({ id: 'item2', count: 3 });
                    
                    const createItems = JSON.parse(formData.get('createItems'));
                    expect(createItems).toHaveLength(1);
                    expect(createItems[0]).toEqual({ id: 'item3', count: 4 });
                }, 0);
            }, 0);
        }, 0);
    });

    test('should handle form submission with only required fields', () => {
        const component = new ProcessForm({
            target: container
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
        
        durationInput.value = '1h 30m';
        durationInput.dispatchEvent(new Event('input'));

        // Submit form
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Verify submission
        expect(submittedData).toBeTruthy();
        const formData = submittedData;
        expect(formData.get('title')).toBe('Test Process');
        expect(formData.get('duration')).toBe('1h 30m');
        
        const requireItems = JSON.parse(formData.get('requireItems'));
        expect(requireItems).toHaveLength(0);
        
        const consumeItems = JSON.parse(formData.get('consumeItems'));
        expect(consumeItems).toHaveLength(0);
        
        const createItems = JSON.parse(formData.get('createItems'));
        expect(createItems).toHaveLength(0);
    });

    test('should handle adding and removing items', () => {
        const component = new ProcessForm({
            target: container
        });

        // Add a required item
        const addRequiredButton = container.querySelector('button');
        addRequiredButton.click();
        
        // Wait for the next tick to allow Svelte to update the DOM
        setTimeout(() => {
            expect(container.querySelectorAll('.item-row')).toHaveLength(1);

            // Remove the required item
            const removeButton = container.querySelector('.remove-button');
            removeButton.click();
            
            setTimeout(() => {
                expect(container.querySelectorAll('.item-row')).toHaveLength(0);

                // Add a consumed item
                const addConsumedButton = container.querySelectorAll('button')[1];
                addConsumedButton.click();
                
                setTimeout(() => {
                    expect(container.querySelectorAll('.item-row')).toHaveLength(1);

                    // Add a created item
                    const addCreatedButton = container.querySelectorAll('button')[2];
                    addCreatedButton.click();
                    
                    setTimeout(() => {
                        expect(container.querySelectorAll('.item-row')).toHaveLength(2);
                    }, 0);
                }, 0);
            }, 0);
        }, 0);
    });
}); 