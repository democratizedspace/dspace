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
            title: 'Process One',
            description: 'First process',
            duration: '1h',
        },
        {
            id: 'process-2',
            title: 'Process Two',
            description: 'Second process',
            duration: '30m',
        },
    ];

    test('renders process options with duration', async () => {
        const component = new ProcessSelector({
            target: container,
            props: {
                processes: mockProcesses,
                selectedProcessId: '',
                label: 'Select process',
            },
        });

        expect(component).toBeTruthy();

        await new Promise((resolve) => setTimeout(resolve, 0));

        const options = container.querySelectorAll('.item-option');
        expect(options.length).toBe(2);
        expect(options[0].textContent).toContain('Process One');
        expect(options[0].textContent).toContain('Duration: 1h');
    });

    test('emits select event when process is chosen', async () => {
        let selectedId = null;
        const component = new ProcessSelector({
            target: container,
            props: {
                processes: mockProcesses,
                selectedProcessId: '',
                label: 'Select process',
            },
        });

        component.$on('select', (event) => {
            selectedId = event.detail.processId;
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const firstOption = container.querySelector('.item-option');
        firstOption.click();

        expect(selectedId).toBe('process-1');
    });
});
