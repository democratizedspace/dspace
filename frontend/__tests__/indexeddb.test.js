import { addEntity, getEntity, updateEntity, deleteEntity } from '../src/utils/indexeddb.js';

describe('IndexedDB Utility Functions', () => {
  test('should add and retrieve an entity', async () => {
    const entity = { title: 'Test Quest', description: 'A test quest' };
    const id = await addEntity(entity);
    const retrieved = await getEntity(id);
    expect(retrieved).toEqual({ id, ...entity });
  });

  test('should update an existing entity', async () => {
    const entity = { title: 'Initial Title', description: 'Initial description' };
    const id = await addEntity(entity);
    const updates = { id, title: 'Updated Title' };
    await updateEntity(updates);
    const updated = await getEntity(id);
    expect(updated.title).toBe('Updated Title');
    expect(updated.description).toBe('Initial description');
  });

  test('should delete an entity', async () => {
    const entity = { title: 'To Be Deleted', description: 'This will be deleted' };
    const id = await addEntity(entity);
    await deleteEntity(id);
    const deleted = await getEntity(id);
    expect(deleted).toBeUndefined();
  });
});
