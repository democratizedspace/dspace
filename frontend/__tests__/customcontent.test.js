import {
    createQuest,
    getQuest,
    updateQuest,
    deleteQuest,
    createItem,
    getItem,
    updateItem,
    deleteItem,
    createProcess,
    getProcess,
    updateProcess,
    deleteProcess
} from '../src/utils/customcontent.js';

describe('Custom Content Functions', () => {
    // Quest Tests
    describe('Quest Operations', () => {
        test('should create and retrieve a quest', async () => {
            const title = 'New Quest';
            const description = 'Quest description';
            const id = await createQuest(title, description);
            const quest = await getQuest(id);
            expect(quest).toMatchObject({ id, title, description });
        });

        test('should update a quest', async () => {
            const title = 'Quest to Update';
            const description = 'Initial description';
            const id = await createQuest(title, description);
            const updates = { title: 'Updated Quest Title' };
            await updateQuest(id, updates);
            const updatedQuest = await getQuest(id);
            expect(updatedQuest.title).toBe('Updated Quest Title');
            expect(updatedQuest.description).toBe(description);
        });

        test('should delete a quest', async () => {
            const title = 'Quest to Delete';
            const description = 'This quest will be deleted';
            const id = await createQuest(title, description);
            await deleteQuest(id);
            await expect(getQuest(id)).rejects.toThrow('Quest not found');
        });
    });

    // Item Tests
    describe('Item Operations', () => {
        test('should create and retrieve an item', async () => {
            const name = 'Test Item';
            const description = 'Item description';
            const price = '100 dUSD';
            const unit = 'kg';
            const type = '3dprint';
            const id = await createItem(name, description, null, price, unit, type);
            const item = await getItem(id);
            expect(item).toMatchObject({ 
                id, 
                name, 
                description, 
                price, 
                unit, 
                itemType: type 
            });
        });

        test('should create item with minimal fields', async () => {
            const name = 'Basic Item';
            const description = 'Basic description';
            const id = await createItem(name, description);
            const item = await getItem(id);
            expect(item).toMatchObject({ id, name, description });
            expect(item.price).toBeNull();
            expect(item.unit).toBeNull();
            expect(item.itemType).toBeNull();
        });

        test('should update an item', async () => {
            const name = 'Item to Update';
            const description = 'Initial description';
            const id = await createItem(name, description);
            const updates = { 
                name: 'Updated Item Name',
                price: '200 dUSD'
            };
            await updateItem(id, updates);
            const updatedItem = await getItem(id);
            expect(updatedItem.name).toBe('Updated Item Name');
            expect(updatedItem.price).toBe('200 dUSD');
            expect(updatedItem.description).toBe(description);
        });

        test('should delete an item', async () => {
            const name = 'Item to Delete';
            const description = 'This item will be deleted';
            const id = await createItem(name, description);
            await deleteItem(id);
            await expect(getItem(id)).rejects.toThrow('Item not found');
        });
    });

    // Process Tests
    describe('Process Operations', () => {
        test('should create and retrieve a process', async () => {
            const title = 'Test Process';
            const duration = '1h 30m';
            const requireItems = [{ id: '1', count: 2 }];
            const consumeItems = [{ id: '2', count: 1 }];
            const createItems = [{ id: '3', count: 3 }];
            
            const id = await createProcess(title, duration, requireItems, consumeItems, createItems);
            const process = await getProcess(id);
            
            expect(process).toMatchObject({ 
                id, 
                title, 
                duration,
                requireItems,
                consumeItems,
                createItems
            });
        });

        test('should create process with minimal fields', async () => {
            const title = 'Basic Process';
            const duration = '1h';
            const id = await createProcess(title, duration);
            const process = await getProcess(id);
            expect(process).toMatchObject({ id, title, duration });
            expect(process.requireItems).toEqual([]);
            expect(process.consumeItems).toEqual([]);
            expect(process.createItems).toEqual([]);
        });

        test('should update a process', async () => {
            const title = 'Process to Update';
            const duration = '1h';
            const id = await createProcess(title, duration);
            const updates = { 
                title: 'Updated Process Title',
                duration: '2h',
                requireItems: [{ id: '4', count: 1 }]
            };
            await updateProcess(id, updates);
            const updatedProcess = await getProcess(id);
            expect(updatedProcess.title).toBe('Updated Process Title');
            expect(updatedProcess.duration).toBe('2h');
            expect(updatedProcess.requireItems).toEqual([{ id: '4', count: 1 }]);
        });

        test('should delete a process', async () => {
            const title = 'Process to Delete';
            const duration = '1h';
            const id = await createProcess(title, duration);
            await deleteProcess(id);
            await expect(getProcess(id)).rejects.toThrow('Process not found');
        });
    });
});
