# DSPACE Frontend

The frontend for DSPACE, a free and open source web-based space exploration idle game.

## Project Structure

```
frontend/
├── __tests__/           # Jest test files
├── src/
│   ├── components/      # Svelte components
│   │   └── svelte/     # Main Svelte components
│   ├── config/         # Configuration files
│   ├── pages/          # Page components and routes
│   │   ├── chat/       # Chat system
│   │   ├── docs/       # Documentation
│   │   ├── inventory/  # Inventory system
│   │   ├── quests/     # Quest system
│   │   └── shop/       # Shopping system
│   ├── scripts/        # Utility scripts
│   └── utils/          # Utility functions
└── package.json
```

## Development Commands

| Command            | Action                               |
| ------------------ | ------------------------------------ |
| `npm install`      | Install dependencies                 |
| `npm run dev`      | Start dev server at `localhost:3002` |
| `npm run build`    | Build production site                |
| `npm run preview`  | Preview production build             |
| `npm test`         | Run tests                            |
| `npm run coverage` | Run tests with coverage              |

### Code Quality Commands

| Command                | Action                |
| ---------------------- | --------------------- |
| `npm run format:check` | Check code formatting |
| `npm run format:fix`   | Fix code formatting   |
| `npm run lint:local`   | Run ESLint            |

## Code Style

The project uses:

-   Prettier for code formatting
-   ESLint for code quality
-   EditorConfig for editor consistency
-   Jest for testing

Configuration files:

-   `.prettierrc.json` - Prettier configuration
-   `.eslintrc.local.json` - ESLint configuration
-   `.editorconfig.local` - EditorConfig settings

These settings ensure:

-   Consistent line endings (LF)
-   4-space indentation (2 for markdown)
-   Single quotes for strings
-   Semicolons required
-   Trailing commas in objects and arrays
