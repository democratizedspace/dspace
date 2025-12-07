module.exports = {
  // Run lint and format checks on JavaScript, TypeScript, and Svelte files
  "frontend/**/*.{js,ts,svelte}": [
    "npm --prefix frontend run lint:fix -- --quiet",
    "npm --prefix frontend run lint -- --quiet",
    "npm --prefix frontend run format -- --quiet",
    // Run test for changed source files
    () => `npm test`
  ],
  
  // Run tests for changed test files
  "frontend/**/__tests__/**/*.{js,ts}": [
    () => `npm test`
  ],
  
  // TypeScript type checking for TS files
  "frontend/**/*.ts": [
    () => "npm --prefix frontend run check"
  ],

  // Validate quest JSON files
  "frontend/src/pages/quests/json/**/*.json": (files) =>
    files.map((file) => `node scripts/validate-quest.js ${file}`),

  // Validate item JSON files
  "frontend/src/pages/inventory/json/**/*.json": (files) =>
    files.map((file) => `node scripts/validate-item.js ${file}`),

  // Format JSON, markdown, and CSS files
  "frontend/**/*.{json,md,css,scss}": [
    "npm --prefix frontend run format -- --quiet"
  ]
}
