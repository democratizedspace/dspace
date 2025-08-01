import { vi } from 'vitest';
import './frontend/jest.setup.js';

// Alias the Vitest global as "jest" for legacy tests
globalThis.jest = vi;
