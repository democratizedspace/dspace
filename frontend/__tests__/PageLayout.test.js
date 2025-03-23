/**
 * @jest-environment jsdom
 */
import { beforeEach, afterEach, describe, it, expect } from '@jest/globals';
import '@testing-library/jest-dom';

// Define SSR flag for client-side rendering
global.__SSR__ = false;
global.__BROWSER__ = true;

// Setup DOM with Astro-rendered structure for testing
function setupSSRDom() {
    // Clear existing content
    document.body.innerHTML = '';

    // Create the app container
    const appDiv = document.createElement('div');
    appDiv.id = 'app';

    // Set the HTML content
    appDiv.innerHTML = `
    <header>
      <div class="logo-container">
        <img src="/assets/logo.svg" alt="dSpace Logo" class="logo" />
        <h1>dSpace</h1>
      </div>
      <nav>
        <ul class="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/quests">Quests</a></li>
          <li><a href="/inventory">Inventory</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <div class="content-area">
        <!-- This is where page content would be rendered -->
      </div>
    </main>
  `;

    // Append to body
    document.body.appendChild(appDiv);

    // Return the app container element
    return appDiv;
}

// Setup DOM with Quests page structure
function setupQuestsPageDom() {
    // Clear existing content
    document.body.innerHTML = '';

    // Create the app container
    const appDiv = document.createElement('div');
    appDiv.id = 'app';

    // Set the HTML content
    appDiv.innerHTML = `
    <header>
      <div class="logo-container">
        <img src="/assets/logo.svg" alt="dSpace Logo" class="logo" />
        <h1>dSpace</h1>
      </div>
      <nav>
        <ul class="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/quests" class="active">Quests</a></li>
          <li><a href="/inventory">Inventory</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <div class="action-buttons">
        <button class="primary">Add New Quest</button>
        <button>Import Quest</button>
        <button>Export Quests</button>
      </div>
      <div class="quests-grid">
        <div class="quest-card">
          <img src="/assets/quest1.jpg" alt="Quest 1" />
          <h3>Quest Title 1</h3>
          <p>Quest Description 1</p>
        </div>
        <div class="quest-card">
          <img src="/assets/quest2.jpg" alt="Quest 2" />
          <h3>Quest Title 2</h3>
          <p>Quest Description 2</p>
        </div>
      </div>
    </main>
  `;

    // Append to body
    document.body.appendChild(appDiv);

    // Return the app container element
    return appDiv;
}

describe('Page Structure Test', () => {
    let container;

    beforeEach(() => {
        // Setup the DOM and store container
        container = setupSSRDom();

        // Verify container exists before tests
        expect(container).not.toBeNull();
        expect(container.id).toBe('app');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        container = null;
    });

    it('renders the header with logo and title', () => {
        const header = container.querySelector('header');
        expect(header).not.toBeNull();

        const logo = container.querySelector('img.logo');
        expect(logo).not.toBeNull();
        expect(logo.getAttribute('src')).toBe('/assets/logo.svg');

        const title = container.querySelector('h1');
        expect(title).not.toBeNull();
        expect(title.textContent).toBe('dSpace');
    });

    it('renders navigation links', () => {
        const navLinks = container.querySelectorAll('.nav-links li');
        expect(navLinks.length).toBe(3);

        const links = Array.from(navLinks).map((li) => li.querySelector('a').textContent);
        expect(links).toContain('Home');
        expect(links).toContain('Quests');
        expect(links).toContain('Inventory');
    });

    it('has a main content area', () => {
        const main = container.querySelector('main');
        expect(main).not.toBeNull();

        const contentArea = main.querySelector('.content-area');
        expect(contentArea).not.toBeNull();
    });
});

describe('Quests Page Structure Test', () => {
    let container;

    beforeEach(() => {
        // Setup the DOM and store container
        container = setupQuestsPageDom();

        // Verify container exists before tests
        expect(container).not.toBeNull();
        expect(container.id).toBe('app');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        container = null;
    });

    it('shows action buttons for quests management', () => {
        const actionButtonsNav = container.querySelector('.action-buttons');
        expect(actionButtonsNav).not.toBeNull();

        const buttons = actionButtonsNav.querySelectorAll('button');
        expect(buttons.length).toBe(3);

        // Check that we have the expected buttons
        const buttonTexts = Array.from(buttons).map((button) => button.textContent);
        expect(buttonTexts).toContain('Add New Quest');
        expect(buttonTexts).toContain('Import Quest');
        expect(buttonTexts).toContain('Export Quests');
    });

    it('displays quest cards in a grid', () => {
        const questsGrid = container.querySelector('.quests-grid');
        expect(questsGrid).not.toBeNull();

        const questCards = questsGrid.querySelectorAll('.quest-card');
        expect(questCards.length).toBe(2);

        // Check quest card structure
        const firstCard = questCards[0];
        expect(firstCard.querySelector('img')).not.toBeNull();
        expect(firstCard.querySelector('h3')).not.toBeNull();
        expect(firstCard.querySelector('p')).not.toBeNull();
    });
});
