/**
 * @jest-environment jsdom
 */

import { createQuest, getQuest, ENTITY_TYPES } from '../src/utils/customcontent.js';
import * as indexedDb from '../src/utils/indexeddb.js';

// Mock the indexeddb module
jest.mock('../src/utils/indexeddb.js', () => ({
    getStoreForEntityType: jest.fn((entityType) => {
        switch (entityType) {
        case 'quest': return 'quests';
        case 'item': return 'items';
        case 'process': return 'processes';
        default: throw new Error(`Unknown entity type: ${entityType}`);
        }
    }),
    addEntity: jest.fn((entity) => {
        // Return the input entity's id or generate a new one
        const entityWithDefaults = {
            ...entity,
            id: 'mocked-id',
        };
        return Promise.resolve(entityWithDefaults.id);
    }),
    getEntity: jest.fn(() =>
        Promise.resolve({
            id: 'mocked-id',
            title: 'Mocked Quest',
            description: 'Mocked Description',
            image: '/mocked/image.jpg',
            type: 'quest',
            custom: true,
        })
    ),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn(),
}));

describe('Quest Image Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create and retrieve quest with image data URL', async () => {
        // Setup
        const title = 'Test Quest with Image';
        const description = 'Test quest description';
        const imageData = 'data:image/jpeg;base64,mockImageData123456789';

        // Mock getEntity to return a quest with the image data
        indexedDb.getEntity.mockResolvedValueOnce({
            id: 'mocked-id',
            title,
            description,
            image: imageData,
            type: ENTITY_TYPES.QUEST,
            custom: true,
            createdAt: expect.any(String),
        });

        // Act
        const id = await createQuest(title, description, imageData);
        const quest = await getQuest(id);

        // Assert
        expect(indexedDb.addEntity).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ENTITY_TYPES.QUEST,
                title,
                description,
                image: imageData,
                custom: true,
                createdAt: expect.any(String),
            })
        );

        expect(quest).toEqual({
            id: 'mocked-id',
            title,
            description,
            image: imageData,
            type: ENTITY_TYPES.QUEST,
            custom: true,
            createdAt: expect.any(String),
        });
    });

    test('should use default image when no image is provided', async () => {
        // Setup
        const title = 'Test Quest without Image';
        const description = 'Test quest description';
        const defaultImage = '/assets/quests/howtodoquests.jpg';

        // Mock getEntity to return a quest with the default image
        indexedDb.getEntity.mockResolvedValueOnce({
            id: 'mocked-id',
            title,
            description,
            image: defaultImage,
            type: ENTITY_TYPES.QUEST,
            custom: true,
            createdAt: expect.any(String),
        });

        // Act
        const id = await createQuest(title, description);
        const quest = await getQuest(id);

        // Assert
        expect(indexedDb.addEntity).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ENTITY_TYPES.QUEST,
                title,
                description,
                image: defaultImage,
                custom: true,
                createdAt: expect.any(String),
            })
        );

        expect(quest).toEqual({
            id: 'mocked-id',
            title,
            description,
            image: defaultImage,
            type: ENTITY_TYPES.QUEST,
            custom: true,
            createdAt: expect.any(String),
        });
    });

    test('should handle very large image data URLs', async () => {
        // Setup
        const title = 'Large Image Quest';
        const description = 'Quest with a large image';
        // Create a large base64 image string
        const largeImage = 'data:image/jpeg;base64,' + 'A'.repeat(10000);

        // Mock getEntity to return a quest with the large image
        indexedDb.getEntity.mockResolvedValueOnce({
            id: 'mocked-id',
            title,
            description,
            image: largeImage,
            type: ENTITY_TYPES.QUEST,
            custom: true,
            createdAt: expect.any(String),
        });

        // Act
        const id = await createQuest(title, description, largeImage);
        const quest = await getQuest(id);

        // Assert
        expect(indexedDb.addEntity).toHaveBeenCalledWith(
            expect.objectContaining({
                type: ENTITY_TYPES.QUEST,
                title,
                description,
                image: largeImage,
                custom: true,
                createdAt: expect.any(String),
            })
        );

        expect(quest).toEqual({
            id: 'mocked-id',
            title,
            description,
            image: largeImage,
            type: ENTITY_TYPES.QUEST,
            custom: true,
            createdAt: expect.any(String),
        });
    });
});
