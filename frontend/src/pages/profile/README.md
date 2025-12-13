# Profile Page

The profile page allows users to customize their public-facing identity in DSPACE through avatar selection and title display.

## Features

### Avatar Selection

Users can choose from a set of predefined avatars that appear across:

- Quest interactions
- Leaderboard entries
- Profile page display

The selected avatar is stored in `localStorage` under the key `avatarUrl`.

### Title Selection (New Feature)

Players can earn and select achievement-based titles to display on their profile.

#### How Titles Work

1. **Earning Titles**: Titles are unlocked by completing specific achievements
    - Quest completion milestones
    - Resource management achievements
    - Equipment installation milestones

2. **Selecting Titles**: Players can select any unlocked title to display
    - Click on an unlocked title to select it
    - Use keyboard navigation (Tab + Enter/Space) for accessibility
    - Selected title is highlighted with a green glow effect

3. **Title States**:
    - **Locked**: Gray, non-interactive - shown with lock icon
    - **Unlocked**: Green, interactive - can be clicked/selected
    - **Selected**: Bright green with glow - currently active title

#### Technical Implementation

**Storage**: The selected title ID is persisted in `localStorage` under the key `selectedTitle` (e.g., `"titles:rookie-explorer"`).

**Components**:

- `ProfileTitles.svelte` - Main component displaying the title list
- `evaluateTitles()` in `utils/titles.js` - Evaluates which titles are unlocked based on game state

**Accessibility**:

- Unlocked titles have `role="button"` and `tabindex="0"`
- Keyboard support for Enter and Space keys
- Focus indicators for keyboard navigation
- Screen reader support with ARIA attributes

**Styling**:

- All colors use CSS variables with `color-mix()` for theme consistency
- Hover states indicate interactivity
- Visual feedback for selection state

#### Usage Example

```javascript
// Retrieve the selected title
const selectedTitleId = localStorage.getItem('selectedTitle');
// e.g., "titles:rookie-explorer"

// Use in other components (leaderboard, profile display, etc.)
if (selectedTitleId) {
    const titleInfo = getTitleById(selectedTitleId);
    displayTitle(titleInfo.name); // "Rookie Explorer"
}
```

#### Testing

E2E tests for title selection are located in `frontend/e2e/profile-title-selection.spec.ts` and verify:

- Click selection and localStorage persistence
- Keyboard navigation (Enter/Space keys)
- Cross-page navigation persistence
- Locked titles remain non-interactive

## File Structure

```
profile/
├── README.md                  # This file
├── index.astro               # Main profile page layout
├── ProfileTitles.svelte      # Title selection component
└── avatar/                   # Avatar selection components
    └── ...
```

## Future Enhancements

The title system is designed to be extensible for future features:

- Displaying selected titles on leaderboards
- Showing titles in quest chat interactions
- Title rarity tiers and special effects
- Custom title creation for special achievements
