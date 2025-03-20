import { test, expect } from '@playwright/test';
import { clearUserData } from './test-helpers';

test.describe('Page Layout Structure', () => {
  test.beforeEach(async ({ page }) => {
    // Clear user data before each test
    await clearUserData(page);
  });

  test('home page should have correct structure with header, logo and navigation', async ({ page }) => {
    // Go to the home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify logo exists
    const logo = page.locator('img.logo');
    await expect(logo).toBeVisible();
    // Use regex for alt text since it might change
    await expect(logo).toHaveAttribute('alt', /rocket|DSPACE|logo/i);
    await expect(logo).toHaveAttribute('src', /.*logo\.png$/);

    // Verify title
    const title = page.locator('.text-gradient.title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('DSPACE');

    // Verify navigation menu
    const navLinks = page.locator('nav a');
    await expect(navLinks).toHaveCount(3);
    await expect(navLinks.nth(0)).toHaveText('Home');
    await expect(navLinks.nth(1)).toHaveText('Quests');
    await expect(navLinks.nth(2)).toHaveText('Inventory');
    
    // Verify the home link is active
    await expect(navLinks.nth(0)).toHaveClass(/active/);
  });

  test('quests page should have correct structure with action buttons', async ({ page }) => {
    // Go to the quests page
    await page.goto('/quests');
    await page.waitForLoadState('networkidle');

    // Verify navigation is showing Quests as active
    const questsLink = page.locator('nav a').filter({ hasText: 'Quests' });
    await expect(questsLink).toHaveClass(/active/);

    // Verify action buttons are present
    const actionButtons = page.locator('.action-buttons a');
    await expect(actionButtons).toHaveCount(2);
    await expect(actionButtons.nth(0)).toHaveText('Create a new quest');
    await expect(actionButtons.nth(1)).toHaveText('Managed quests');
    
    // Verify quest grid exists
    const questsGrid = page.locator('.quests-grid');
    await expect(questsGrid).toBeVisible();
    
    // Verify at least one quest card exists
    const questCards = page.locator('.quests-grid a');
    await expect(questCards.first()).toBeVisible();
    
    // Verify quest card has an image and text content
    const firstQuestCard = questCards.first();
    await expect(firstQuestCard.locator('img.quest-img')).toBeVisible();
    await expect(firstQuestCard.locator('h3')).toBeVisible();
    await expect(firstQuestCard.locator('p')).toBeVisible();
  });

  test('inventory page should have correct structure with item list', async ({ page }) => {
    // Go to the inventory page
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');

    // Verify navigation is showing Inventory as active
    const inventoryLink = page.locator('nav a').filter({ hasText: 'Inventory' });
    await expect(inventoryLink).toHaveClass(/active/);

    // Verify create item button exists
    const createButton = page.locator('a.inverted').filter({ hasText: 'Create a new item' });
    await expect(createButton).toBeVisible();
    
    // Verify inventory container exists
    const inventoryContainer = page.locator('.inventory-container');
    await expect(inventoryContainer).toBeVisible();
  });

  test('page should be responsive across different screen sizes', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: './test-artifacts/mobile-view.png' });
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: './test-artifacts/tablet-view.png' });
    
    // Test desktop view
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: './test-artifacts/desktop-view.png' });
  });
}); 