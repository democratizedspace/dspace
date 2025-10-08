/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor, act } from '@testing-library/svelte';
import { jest } from 'vitest';
import QuestForm from '../src/components/svelte/QuestForm.svelte';

const questsAddMock = jest.fn();
const listMock = jest.fn();

jest.mock('../src/utils/customcontent.js', () => ({
    db: {
        quests: {
            add: questsAddMock,
            update: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
        },
        list: listMock,
    },
    ENTITY_TYPES: { QUEST: 'quest' },
}));

jest.mock('../src/utils/customQuestValidation.js', () => ({
    validateQuestData: () => ({ valid: true, errors: [] }),
    validateQuestDependencies: () => true,
}));

jest.mock('../src/utils/questHelpers.js', () => ({
    isQuestTitleUnique: () => true,
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

    beforeEach(() => {
        container = setupDom();
        questsAddMock.mockReset();
        questsAddMock.mockResolvedValue('quest-123');
        listMock.mockReset();
        listMock.mockResolvedValue([]);
        global.fetch = jest.fn(() =>
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
                this.onload = null;
                this.onerror = null;
            }

            readAsDataURL() {
                setTimeout(() => {
                    this.result = 'data:image/png;base64,TESTDATA';
                    if (typeof this.onload === 'function') {
                        this.onload({ target: this });
                    }
                }, 0);
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
        expect(savedQuest.image).toBe('data:image/png;base64,TESTDATA');
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
