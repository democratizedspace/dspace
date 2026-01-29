/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor, act } from '@testing-library/svelte';
import QuestForm from '../src/components/svelte/QuestForm.svelte';
import { downsampleAndCompressToJpeg } from '../src/utils/imageDownsample.js';

const questsAddMock = vi.fn();
const listMock = vi.fn();

vi.mock('../src/utils/customcontent.js', () => ({
    db: {
        quests: {
            add: questsAddMock,
            update: vi.fn(),
            get: vi.fn(),
            delete: vi.fn(),
        },
        list: listMock,
    },
    ENTITY_TYPES: { QUEST: 'quest' },
}));

vi.mock('../src/utils/customQuestValidation.js', () => ({
    validateQuestData: () => ({ valid: true, errors: [] }),
    validateQuestDependencies: () => true,
}));

vi.mock('../src/utils/questHelpers.js', () => ({
    isQuestTitleUnique: () => true,
}));

vi.mock('../src/utils/imageDownsample.js', () => ({
    downsampleAndCompressToJpeg: vi.fn().mockResolvedValue({
        dataUrl: 'data:image/jpeg;base64,COMPRESSED',
        bytes: 12345,
        width: 512,
        height: 512,
        qualityUsed: 0.8,
    }),
}));

function setupDom() {
    document.body.innerHTML = `
        <div id="app">
            <div id="quest-form-container"></div>
        </div>
    `;
    return document.getElementById('quest-form-container');
}

describe('QuestForm image uploads', () => {
    let container;
    const sampleDataUrl = 'data:image/png;base64,FALLBACKDATA';

    beforeEach(() => {
        container = setupDom();
        questsAddMock.mockReset();
        questsAddMock.mockResolvedValue('quest-123');
        listMock.mockReset();
        listMock.mockResolvedValue([]);
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ url: 'https://example.com/uploaded.png' }),
            })
        );
        global.File = class File {
            constructor(bits, name, options = {}) {
                this.name = name;
                this.size = bits.length;
                this.type = options.type || '';
            }
        };
        global.FileReader = class FileReader {
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
        };
        global.__SSR__ = false;
        global.__BROWSER__ = true;
    });

    afterEach(() => {
        container.innerHTML = '';
        delete global.fetch;
        delete global.File;
        delete global.FileReader;
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
            fireEvent.change(getByLabelText(/^type$/i), {
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
});
