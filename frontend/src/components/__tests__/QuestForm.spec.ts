import { render, fireEvent, waitFor } from '@testing-library/svelte';
import QuestForm from '../svelte/QuestForm.svelte';

test('submits text then clears field', async () => {
    const { getByRole } = render(QuestForm);
    const input = getByRole('textbox');
    await fireEvent.input(input, { target: { value: 'Save the world' } });
    await fireEvent.submit(getByRole('form'));
    expect(input).toHaveValue('');
});

test('shows image preview after upload', async () => {
    const original = globalThis.FileReader;
    class MockFileReader {
        result: string | ArrayBuffer | null = null;
        onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
        readAsDataURL() {
            this.result = 'data:image/png;base64,TEST';
            this.onload?.({
                target: { result: this.result },
            } as unknown as ProgressEvent<FileReader>);
        }
    }
    const g = globalThis as unknown as { FileReader: typeof FileReader };
    g.FileReader = MockFileReader as unknown as typeof FileReader;

    const { getByLabelText, getByAltText } = render(QuestForm);
    const fileInput = getByLabelText(/Upload an Image/i);
    const file = new File(['d'], 'test.png', { type: 'image/png' });

    await fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
        expect(getByAltText('Quest preview')).toBeInTheDocument();
    });

    g.FileReader = original;
});
