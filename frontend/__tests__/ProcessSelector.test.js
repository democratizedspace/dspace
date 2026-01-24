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
            title: 'Assemble Widget',
            description: 'Put the widget together.',
            duration: '1h',
        },
        {
            id: 'process-2',
            title: 'Refine Widget',
            description: 'Polish the widget.',
            duration: '30m',
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

    test('should display process duration metadata', async () => {
        new ProcessSelector({
            target: container,
            props: {
                processes: mockProcesses,
                selectedProcessId: '',
                label: 'Select Process',
            },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const optionText = container.querySelector('.item-option')?.textContent || '';
        expect(optionText).toContain('Duration: 1h');
    });

    test('should emit select event when process is selected', async () => {
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

        await new Promise((resolve) => setTimeout(resolve, 0));

        const firstItem = container.querySelector('.item-option');
        firstItem.click();

        expect(selectedId).toBe('process-1');
    });
});
