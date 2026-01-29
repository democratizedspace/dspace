/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor, act } from '@testing-library/svelte';
import QuestForm from '../svelte/QuestForm.svelte';
import { downsampleAndCompressToJpeg } from '../../utils/imageDownsample.js';

const { questsAddMock, questsUpdateMock, questsGetMock, listMock } = vi.hoisted(() => ({
    questsAddMock: vi.fn(),
    questsUpdateMock: vi.fn(),
    questsGetMock: vi.fn(),
    listMock: vi.fn(),
}));

vi.mock('../../utils/customcontent.js', () => ({
    db: {
        quests: {
            add: questsAddMock,
            update: questsUpdateMock,
            get: questsGetMock,
            delete: vi.fn(),
        },
        list: listMock,
    },
    ENTITY_TYPES: { QUEST: 'quest' },
}));

vi.mock('../../utils/customQuestValidation.js', () => ({
    validateQuestData: () => ({ valid: true, errors: [] }),
    validateQuestDependencies: () => true,
}));

vi.mock('../../utils/questHelpers.js', () => ({
    isQuestTitleUnique: () => true,
}));

vi.mock('../../utils/imageDownsample.js', () => ({
    downsampleAndCompressToJpeg: vi.fn().mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,COMPRESSED',
        bytes: 12345,
        width: 512,
        height: 512,
        qualityUsed: 0.8,
    }),
}));

function setupDom(): HTMLElement {
    document.body.innerHTML = `
        <div id="app">
            <div id="quest-form-container"></div>
        </div>
    `;
    const questContainer = document.getElementById('quest-form-container');
    if (!questContainer) {
        throw new Error('Quest form container not found.');
    }
    return questContainer;
}

describe('QuestForm image uploads', () => {
    let container: HTMLElement;
    const sampleDataUrl = 'data:image/png;base64,FALLBACKDATA';

    beforeEach(() => {
        container = setupDom();
        questsAddMock.mockReset();
        questsUpdateMock.mockReset();
        questsGetMock.mockReset();
        questsAddMock.mockResolvedValue('quest-123');
        questsUpdateMock.mockResolvedValue(undefined);
        listMock.mockReset();
        listMock.mockResolvedValue([]);
        const globalWithMocks = globalThis as typeof globalThis & {
            fetch?: typeof fetch;
            File?: typeof File;
            FileReader?: typeof FileReader;
            __SSR__?: boolean;
            __BROWSER__?: boolean;
        };

        globalWithMocks.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ url: 'https://example.com/uploaded.png' }),
            })
        ) as typeof fetch;
        globalWithMocks.File = class MockFile {
            name: string;
            size: number;
            type: string;

            constructor(bits, name, options = {}) {
                this.name = name;
                this.size = bits.length as number;
                this.type = (options as { type?: string }).type || '';
            }
        } as typeof File;
        globalWithMocks.FileReader = class MockFileReader {
            result: string | ArrayBuffer | null;
            onload: null | (() => void);
            onerror: null | ((error: Error) => void);

            constructor() {
                this.result = null;
                this.onload = null;
                this.onerror = null;
            }
            readAsDataURL() {
                this.result = sampleDataUrl;
                if (this.onload) {
                    this.onload();
                }
            }
        } as typeof FileReader;
        globalWithMocks.__SSR__ = false;
        globalWithMocks.__BROWSER__ = true;
    });

    afterEach(() => {
        container.innerHTML = '';
        const globalWithMocks = globalThis as typeof globalThis & {
            fetch?: typeof fetch;
            File?: typeof File;
            FileReader?: typeof FileReader;
        };
        delete globalWithMocks.fetch;
        delete globalWithMocks.File;
        delete globalWithMocks.FileReader;
    });

    it('stores quest images locally without calling a remote upload endpoint', async () => {
        const { getByLabelText, getByRole, getByText } = render(QuestForm, {
            target: container,
            props: { existingQuests: [] },
        });

        await waitFor(() => expect(listMock).toHaveBeenCalled());

        await act(async () => {
            fireEvent.input(getByLabelText(/title\*/i), {
                target: { value: 'Test Quest' },
            });
            fireEvent.input(getByLabelText(/description\*/i), {
                target: { value: 'This quest proves uploads are local.' },
            });
            fireEvent.input(getByLabelText(/npc identifier\*/i), {
                target: { value: '/assets/npc/dChat.jpg' },
            });
        });

        await act(async () => {
            fireEvent.input(getByLabelText(/new node id/i), {
                target: { value: 'start' },
            });
            fireEvent.input(getByLabelText(/node text/i), {
                target: { value: 'Ready to finish?' },
            });
            fireEvent.click(getByText(/add dialogue node/i));
        });

        await act(async () => {
            fireEvent.input(getByLabelText(/new option text/i), {
                target: { value: 'Finish quest' },
            });
            fireEvent.change(getByLabelText(/^type$/i, { selector: '#option-type-start' }), {
                target: { value: 'finish' },
            });
            fireEvent.click(getByText(/add option/i));
            fireEvent.change(getByLabelText(/start node/i), {
                target: { value: 'start' },
            });
        });

        const fileInput = getByLabelText(/upload an image\*/i);
        await act(async () => {
            const file = new File(['content'], 'quest.png', { type: 'image/png' });
            fireEvent.change(fileInput, {
                target: { files: [file] },
            });
        });

        await waitFor(() => {
            const preview = container.querySelector('.image-preview');
            expect(preview).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(getByRole('button', { name: /create quest/i }));
        });

        await waitFor(() => expect(questsAddMock).toHaveBeenCalledTimes(1));

        const savedQuest = questsAddMock.mock.calls[0][0];
        expect(savedQuest.image).toBe('data:image/jpeg;base64,COMPRESSED');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('falls back to a FileReader preview when JPEG downsampling fails', async () => {
        downsampleAndCompressToJpeg.mockRejectedValueOnce(new Error('Downsample failed'));

        const { getByLabelText } = render(QuestForm, {
            target: container,
            props: { existingQuests: [] },
        });

        await waitFor(() => expect(listMock).toHaveBeenCalled());

        const fileInput = getByLabelText(/upload an image\*/i);
        await act(async () => {
            const file = new File(['content'], 'quest.png', { type: 'image/png' });
            fireEvent.change(fileInput, {
                target: { files: [file] },
            });
        });

        await waitFor(() => {
            const preview = container.querySelector('.image-preview');
            expect(preview).toBeInTheDocument();
            expect(preview).toHaveAttribute('src', sampleDataUrl);
        });
    });

    it('shows an error if FileReader fails while creating a preview', async () => {
        downsampleAndCompressToJpeg.mockRejectedValueOnce(new Error('Downsample failed'));

        const globalWithMocks = globalThis as typeof globalThis & {
            FileReader?: typeof FileReader;
        };
        globalWithMocks.FileReader = class MockFileReader {
            result: string | ArrayBuffer | null;
            onload: null | (() => void);
            onerror: null | ((error: Error) => void);

            constructor() {
                this.result = null;
                this.onload = null;
                this.onerror = null;
            }
            readAsDataURL() {
                if (this.onerror) {
                    this.onerror(new Error('FileReader failed'));
                }
            }
        } as typeof FileReader;

        const { getByLabelText, findByText } = render(QuestForm, {
            target: container,
            props: { existingQuests: [] },
        });

        await waitFor(() => expect(listMock).toHaveBeenCalled());

        const fileInput = getByLabelText(/upload an image\*/i);
        await act(async () => {
            const file = new File(['content'], 'quest.png', { type: 'image/png' });
            fireEvent.change(fileInput, {
                target: { files: [file] },
            });
        });

        const errorMessage = await findByText(/image processing failed/i);
        expect(errorMessage).toBeInTheDocument();
        expect(container.querySelector('.image-preview')).not.toBeInTheDocument();
    });

    it('shows an error if FileReader returns a non-string result', async () => {
        downsampleAndCompressToJpeg.mockRejectedValueOnce(new Error('Downsample failed'));

        const globalWithMocks = globalThis as typeof globalThis & {
            FileReader?: typeof FileReader;
        };
        globalWithMocks.FileReader = class MockFileReader {
            result: string | ArrayBuffer | null;
            onload: null | (() => void);
            onerror: null | ((error: Error) => void);

            constructor() {
                this.result = null;
                this.onload = null;
                this.onerror = null;
            }
            readAsDataURL() {
                this.result = new ArrayBuffer(8);
                if (this.onload) {
                    this.onload();
                }
            }
        } as typeof FileReader;

        const { getByLabelText, findByText } = render(QuestForm, {
            target: container,
            props: { existingQuests: [] },
        });

        await waitFor(() => expect(listMock).toHaveBeenCalled());

        const fileInput = getByLabelText(/upload an image\*/i);
        await act(async () => {
            const file = new File(['content'], 'quest.png', { type: 'image/png' });
            fireEvent.change(fileInput, {
                target: { files: [file] },
            });
        });

        const errorMessage = await findByText(/image processing failed/i);
        expect(errorMessage).toBeInTheDocument();
        expect(container.querySelector('.image-preview')).not.toBeInTheDocument();
    });

    it('uses the existing preview URL when editing without a new file', async () => {
        const existingQuest = {
            id: 'quest-123',
            title: 'Existing Quest',
            description: 'A fully valid quest description.',
            npc: '/assets/npc/dChat.jpg',
            image: 'https://example.com/quest.png',
            start: 'start',
            dialogue: [
                {
                    id: 'start',
                    text: 'Ready to go?',
                    options: [{ text: 'Finish', type: 'finish' }],
                },
            ],
        };

        questsGetMock.mockResolvedValue(existingQuest);

        const { getByRole } = render(QuestForm, {
            target: container,
            props: { isEdit: true, questId: 'quest-123', existingQuests: [] },
        });

        await waitFor(() => expect(listMock).toHaveBeenCalled());
        await waitFor(() => expect(questsGetMock).toHaveBeenCalledWith('quest-123'));

        await act(async () => {
            fireEvent.click(getByRole('button', { name: /update quest/i }));
        });

        await waitFor(() => expect(questsUpdateMock).toHaveBeenCalledTimes(1));

        const savedQuest = questsUpdateMock.mock.calls[0][1];
        expect(savedQuest.image).toBe(existingQuest.image);
    });

    it('keeps the preview URL when upload compression fails on submit', async () => {
        downsampleAndCompressToJpeg.mockResolvedValueOnce({
            dataUrl: 'https://example.com/preview.jpg',
            bytes: 12345,
            width: 512,
            height: 512,
            qualityUsed: 0.8,
        });
        downsampleAndCompressToJpeg.mockRejectedValueOnce(new Error('Upload failed'));

        const { getByLabelText, getByRole, getByText } = render(QuestForm, {
            target: container,
            props: { existingQuests: [] },
        });

        await waitFor(() => expect(listMock).toHaveBeenCalled());

        await act(async () => {
            fireEvent.input(getByLabelText(/title\*/i), {
                target: { value: 'Quest With Remote Preview' },
            });
            fireEvent.input(getByLabelText(/description\*/i), {
                target: { value: 'This quest confirms preview fallback on submit.' },
            });
            fireEvent.input(getByLabelText(/npc identifier\*/i), {
                target: { value: '/assets/npc/dChat.jpg' },
            });
        });

        await act(async () => {
            fireEvent.input(getByLabelText(/new node id/i), {
                target: { value: 'start' },
            });
            fireEvent.input(getByLabelText(/node text/i), {
                target: { value: 'Ready to finish?' },
            });
            fireEvent.click(getByText(/add dialogue node/i));
        });

        await act(async () => {
            fireEvent.input(getByLabelText(/new option text/i), {
                target: { value: 'Finish quest' },
            });
            fireEvent.change(getByLabelText(/^type$/i, { selector: '#option-type-start' }), {
                target: { value: 'finish' },
            });
            fireEvent.click(getByText(/add option/i));
            fireEvent.change(getByLabelText(/start node/i), {
                target: { value: 'start' },
            });
        });

        const fileInput = getByLabelText(/upload an image\*/i);
        await act(async () => {
            const file = new File(['content'], 'quest.png', { type: 'image/png' });
            fireEvent.change(fileInput, {
                target: { files: [file] },
            });
        });

        await waitFor(() => {
            const preview = container.querySelector('.image-preview');
            expect(preview).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(getByRole('button', { name: /create quest/i }));
        });

        await waitFor(() => expect(questsAddMock).toHaveBeenCalledTimes(1));

        const savedQuest = questsAddMock.mock.calls[0][0];
        expect(savedQuest.image).toBe('https://example.com/preview.jpg');
        expect(downsampleAndCompressToJpeg.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
});
