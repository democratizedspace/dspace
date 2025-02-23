import { createQuest, getQuest, updateQuest, deleteQuest } from '../src/utils/customcontent.js';

describe('Custom Content Functions', () => {
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
