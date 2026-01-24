import ProcessSelector from '../src/components/svelte/ProcessSelector.svelte';

describe('ProcessSelector Component', () => {
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

    const mockProcesses = [
        {
            id: 'process-1',
            title: 'Test Process One',
            description: 'First process description',
            duration: '1h 30m',
        },
        {
            id: 'process-2',
            title: 'Process Two',
            description: 'Second process description',
            duration: '45m',
        },
    ];

    test('should mount component', () => {
        const component = new ProcessSelector({
            target: container,
            props: {
                processes: mockProcesses,
                selectedProcessId: '',
                label: 'Select Process',
            },
        });

        expect(component).toBeTruthy();
        expect(container.querySelector('.item-selector')).toBeTruthy();
    });

    test('should display duration metadata in options', async () => {
        new ProcessSelector({
            target: container,
            props: {
                processes: mockProcesses,
                selectedProcessId: '',
                label: 'Select Process',
            },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const firstOption = container.querySelector('.item-option');
        expect(firstOption.textContent).toContain('Duration: 1h 30m');
    });

    test('should emit select event when process is selected', () => {
        let selectedId = null;
        const component = new ProcessSelector({
            target: container,
            props: {
                processes: mockProcesses,
                selectedProcessId: '',
                label: 'Select Process',
            },
        });

        component.$on('select', (event) => {
            selectedId = event.detail.processId;
        });

        const firstOption = container.querySelector('.item-option');
        firstOption.click();

        expect(selectedId).toBe('process-1');
    });
});
