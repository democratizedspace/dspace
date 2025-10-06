import { render, fireEvent, waitFor } from '@testing-library/svelte';
import QuestForm from '../svelte/QuestForm.svelte';

test('allows adding dialogue nodes and options', async () => {
    const { getByLabelText, getByText, getAllByLabelText, getAllByText } = render(QuestForm);

    await fireEvent.input(getByLabelText(/New node ID/i), { target: { value: 'start' } });
    await fireEvent.input(getByLabelText(/Node text/i), { target: { value: 'Welcome, pilot!' } });
    await fireEvent.click(getByText('Add Dialogue Node'));

    await fireEvent.input(getByLabelText(/New node ID/i), { target: { value: 'end' } });
    await fireEvent.input(getByLabelText(/Node text/i), {
        target: { value: 'Quest complete.' },
    });
    await fireEvent.click(getByText('Add Dialogue Node'));

    const optionDrafts = getAllByLabelText(/New option text/i);
    await fireEvent.input(optionDrafts[0], { target: { value: 'Proceed to end' } });

    const targetInputs = getAllByLabelText(/Target node/i);
    await fireEvent.input(targetInputs[0], { target: { value: 'end' } });

    await fireEvent.click(getAllByText('Add Option')[0]);

    const optionTextInputs = getAllByLabelText(/^Text$/i);
    expect(optionTextInputs[0]).toHaveValue('Proceed to end');
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

test('rejects title with forbidden characters', async () => {
    const { getByLabelText, getByRole, findByText } = render(QuestForm);
    const titleInput = getByLabelText(/Title/i);
    await fireEvent.input(titleInput, { target: { value: '<b>' } });
    await fireEvent.submit(getByRole('form'));
    await findByText('Invalid characters');
});
