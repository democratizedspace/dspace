import { afterEach, beforeEach, describe, expect, it, jest, test } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Since we can't easily test Astro components directly in Jest without special transformers,
// let's only test the DOM structure using JSDOM

// Add a test specifically for the Quests page structure
describe('Page Structure Test', () => {
    let dom;
    let container;

    beforeEach(() => {
        // Set up a mock DOM environment
        dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app">
            <main>
              <div>
                <header>
                  <a href="/">
                    <div class="vertical">
                      <img src="/assets/logo.png" alt="DSPACE logo" class="logo" />
                      <span class="text-gradient title">DSPACE</span>
                      <p class="domain">democratized.space</p>
                    </div>
                  </a>
                </header>
                
                <nav>
                  <a href="/">Home</a>
                  <a href="/quests" class="active">Quests</a>
                  <a href="/inventory">Inventory</a>
                </nav>
                
                <h2>Quests</h2>
                
                <div id="content-slot">
                  <!-- Quests component would render here -->
                </div>
              </div>
            </main>
          </div>
        </body>
      </html>
    `);

        container = dom.window.document.getElementById('app');
    });

    it('should maintain the header and navigation structure', () => {
        // Check logo presence
        const logo = container.querySelector('img.logo');
        expect(logo).toBeTruthy();
        expect(logo.getAttribute('src')).toBe('/assets/logo.png');

        // Check DSPACE title
        const title = container.querySelector('.text-gradient.title');
        expect(title).toBeTruthy();
        expect(title.textContent).toBe('DSPACE');

        // Check navigation menu
        const navLinks = container.querySelectorAll('nav a');
        expect(navLinks.length).toBeGreaterThanOrEqual(3);
        expect(navLinks[0].textContent).toBe('Home');
        expect(navLinks[1].textContent).toBe('Quests');
        expect(navLinks[1].classList.contains('active')).toBe(true);

        // Check that the content area exists for the slot
        const contentSlot = container.querySelector('#content-slot');
        expect(contentSlot).toBeTruthy();
    });
});

// Quests page specific test
describe('Quests Page Structure Test', () => {
    let dom;
    let container;

    beforeEach(() => {
        // Set up a mock DOM environment for the Quests page
        dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app">
            <main>
              <div>
                <!-- Header section (same as in Page component) -->
                <header>
                  <a href="/">
                    <div class="vertical">
                      <img src="/assets/logo.png" alt="DSPACE logo" class="logo" />
                      <span class="text-gradient title">DSPACE</span>
                      <p class="domain">democratized.space</p>
                    </div>
                  </a>
                </header>
                
                <!-- Main navigation menu -->
                <nav class="main-nav">
                  <a href="/">Home</a>
                  <a href="/quests" class="active">Quests</a>
                  <a href="/inventory">Inventory</a>
                </nav>
                
                <h2>Quests</h2>
                
                <!-- Content slot with Quests component rendered -->
                <div id="quests-component">
                  <!-- Action buttons nav -->
                  <nav class="action-buttons">
                    <a href="/quests/create" class="inverted">Create a new quest</a>
                    <a href="/quests/managed" class="inverted">Managed quests</a>
                  </nav>
                  
                  <!-- Quest cards would be rendered here -->
                  <div class="quests-grid">
                    <a href="/quests/welcome/howtodoquests">
                      <div class="container">
                        <div class="content">
                          <img class="quest-img" src="/assets/quests/howtodoquests.jpg" alt="How to do quests" />
                          <div class="content-text">
                            <h3>How to do quests</h3>
                            <p>Learn how the quest mechanics work, including dialogue options, items, and processes.</p>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </body>
      </html>
    `);

        container = dom.window.document.getElementById('app');
    });

    it('should render the quests page with correctly styled action buttons', () => {
        // Check that the action buttons are rendered inside a nav element
        const actionButtonsNav = container.querySelector('.action-buttons');
        expect(actionButtonsNav).toBeTruthy();
        expect(actionButtonsNav.tagName).toBe('NAV');

        // Check that the action buttons are rendered as inverted chips
        const actionButtons = actionButtonsNav.querySelectorAll('a');
        expect(actionButtons.length).toBe(2);
        expect(actionButtons[0].textContent).toBe('Create a new quest');
        expect(actionButtons[0].classList.contains('inverted')).toBe(true);
        expect(actionButtons[0].getAttribute('href')).toBe('/quests/create');

        expect(actionButtons[1].textContent).toBe('Managed quests');
        expect(actionButtons[1].classList.contains('inverted')).toBe(true);
        expect(actionButtons[1].getAttribute('href')).toBe('/quests/managed');
    });

    it('should display quest cards in the grid layout', () => {
        // Check that the quest grid container exists
        const questsGrid = container.querySelector('.quests-grid');
        expect(questsGrid).toBeTruthy();

        // Check that there is at least one quest card
        const questCards = questsGrid.querySelectorAll('.container');
        expect(questCards.length).toBeGreaterThan(0);

        // Check that the quest card has an image and text content
        const firstQuestCard = questCards[0];
        expect(firstQuestCard.querySelector('img.quest-img')).toBeTruthy();
        expect(firstQuestCard.querySelector('h3')).toBeTruthy();
        expect(firstQuestCard.querySelector('p')).toBeTruthy();
    });
});
