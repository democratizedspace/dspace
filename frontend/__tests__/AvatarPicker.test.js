/**
 * @jest-environment jsdom
 */
import AvatarPicker from '../src/components/svelte/AvatarPicker.svelte';

describe('AvatarPicker component', () => {
    let container;

    beforeEach(() => {
        localStorage.clear();
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    test('exports a valid Svelte component', () => {
        expect(typeof AvatarPicker).toBe('function');
    });

    test('selecting an avatar updates preview and localStorage', async () => {
        const avatars = ['a.png', 'b.png'];
        const component = new AvatarPicker({
            target: container,
            props: { defaultPFPs: avatars }
        });

        const firstItem = container.querySelector('#img-0');
        expect(firstItem).toBeTruthy();
        firstItem.dispatchEvent(new Event('click'));

        await new Promise((r) => setTimeout(r, 0));

        const preview = container.querySelector('.preview');
        expect(preview).toBeTruthy();
        expect(preview.classList.contains('hidden')).toBe(false);
        expect(preview.src).toContain('a.png');

        const selectButton = container.querySelector('.selectbutton');
        selectButton.click();
        expect(localStorage.getItem('avatarUrl')).toContain('a.png');

        component.$destroy();
    });
});
