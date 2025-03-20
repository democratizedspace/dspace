import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Svelte Component Hydration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear user data before each test
    await clearUserData(page);
  });

  test('ItemForm component should hydrate and handle form submission', async ({ page }) => {
    // Navigate to the item creation page
    await page.goto('/inventory/create');
    await page.waitForLoadState('networkidle');

    // Verify form is visible and interactive
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Verify form inputs are interactive
    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Test Item');
    await expect(nameInput).toHaveValue('Test Item');
    
    const descriptionInput = page.locator('#description');
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill('This is a test item description');
    await expect(descriptionInput).toHaveValue('This is a test item description');
    
    // Test image upload button exists and is clickable
    const uploadButton = page.locator('button:has-text("Upload Image")');
    await expect(uploadButton).toBeVisible();
    
    // Submit the form
    const submitButton = page.locator('button.submit-button');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Verify form submission was successful
    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Item created successfully!")')).toBeVisible();
  });

  test('QuestForm component should hydrate and handle form submission', async ({ page }) => {
    // Navigate to the quest creation page
    await page.goto('/quests/create');
    await page.waitForLoadState('networkidle');
    
    // Verify form is visible and interactive
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Fill out the basic quest details
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Test Quest');
    
    const descriptionInput = page.locator('textarea[name="description"]');
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill('This is a test quest description');
    
    // Submit the form
    const submitButton = page.locator('input[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Verify form submission was successful
    const successMessage = page.locator('.success-message');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2:has-text("Quest created successfully!")')).toBeVisible();
  });

  test('Chip component should hydrate and be interactive', async ({ page }) => {
    // Navigate to the quests page where chips are used
    await page.goto('/quests');
    await page.waitForLoadState('networkidle');
    
    // Check that the action buttons (which use Chip components) are visible and interactive
    const createQuestButton = page.locator('.action-buttons a').filter({ hasText: 'Create a new quest' });
    await expect(createQuestButton).toBeVisible();
    
    // Hover over the button to verify it's interactive (CSS hover state)
    await createQuestButton.hover();
    
    // Check that the button is clickable
    await createQuestButton.click();
    
    // Verify navigation occurred to the quest creation page
    await expect(page).toHaveURL(/\/quests\/create/);
  });

  test('ProcessForm component should hydrate and handle interactive selectors', async ({ page }) => {
    // Navigate to the process creation page
    await page.goto('/processes/create');
    await page.waitForLoadState('networkidle');
    
    // Verify form is visible
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Fill out basic process details
    const nameInput = page.locator('#name');
    await nameInput.fill('Test Process');
    
    const durationInput = page.locator('#duration');
    await durationInput.fill('1h');
    
    // Check if item selector buttons are visible
    const addRequiredItemButton = page.locator('button:has-text("Add Required Item")');
    await expect(addRequiredItemButton).toBeVisible();
    
    const addConsumedItemButton = page.locator('button:has-text("Add Consumed Item")');
    await expect(addConsumedItemButton).toBeVisible();
    
    const addCreatedItemButton = page.locator('button:has-text("Add Created Item")');
    await expect(addCreatedItemButton).toBeVisible();
    
    // Verify the submit button is visible
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
}); 