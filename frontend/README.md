# DSPACE Frontend

DSPACE is a free and open source web-based space exploration idle game where players can acquire resources, build cool things, and ultimately reach the cosmos. The game combines elements of resource management, exploration, and community interaction in an engaging virtual environment.

## Tech Stack

-   **Framework**: [Astro](https://astro.build/) with [Svelte](https://svelte.dev/) components
-   **Styling**: PostCSS with SCSS
-   **Testing**: Jest with Testing Library
-   **Documentation**: Markdown with Remarkable
-   **API Integration**: OpenAI
-   **Code Quality**: ESLint, Prettier

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable Svelte components
│   ├── layouts/        # Layout templates
│   ├── pages/          # Page components and routes
│   │   ├── docs/       # Game documentation
│   │   ├── inventory/  # Player inventory system
│   │   ├── quests/     # Mission and quest system
│   │   └── shop/       # In-game marketplace
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   └── scripts/        # Build and utility scripts
├── tests/              # Test suites
└── public/             # Static assets
```

## Getting Started

### Prerequisites

-   Node.js 16.x or higher
-   npm 7.x or higher
-   Git

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/democratizedspace/dspace.git
cd dspace/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The site will be available at `http://localhost:3002`

### Available Commands

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start development server at `localhost:3002` |
| `npm run build`    | Build production-ready files                 |
| `npm run preview`  | Preview production build locally             |
| `npm test`         | Run test suite                               |
| `npm run coverage` | Generate test coverage report                |

### Code Quality Tools

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run format:check` | Check code formatting with Prettier |
| `npm run format:fix`   | Fix code formatting issues          |
| `npm run lint:local`   | Run ESLint                          |

## Development Guidelines

### Code Style

We follow strict code quality guidelines:

-   Use TypeScript for type safety
-   Follow the [Svelte best practices](https://svelte.dev/docs#template-syntax-each)
-   Maintain component-based architecture
-   Write tests for new features
-   Document complex logic and components

### Game Systems

The game features several core systems:

-   Virtual inventory management
-   Quest and mission progression
-   Resource production and management
-   Community interaction features
-   Achievement tracking

### Testing

-   Write unit tests for utility functions
-   Create component tests using @testing-library/svelte
-   Maintain good test coverage (aim for >80%)
-   Run tests before submitting PRs

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For more details, see our [Contribution Guide](https://github.com/democratizedspace/dspace/blob/v2.1/CONTRIBUTORS.md).

## Community

-   Join our [Discord](https://discord.gg/A3UAfYvnxM) for discussions
-   Visit [democratized.space](https://democratized.space) to play the game
-   Check out the [documentation](https://democratized.space/docs) for detailed guides

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
