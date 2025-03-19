module.exports = {
  // Run lint and format checks on JavaScript, TypeScript, and Svelte files
  "frontend/**/*.{js,ts,svelte}": [
    "npm run lint:fix -- --quiet", 
    "npm run lint -- --quiet",
    "npm run format -- --quiet",
    // Run test for changed source files
    () => `cd frontend && npx jest --passWithNoTests`
  ],
  
  // Run tests for changed test files
  "frontend/**/__tests__/**/*.{js,ts}": [
    () => `cd frontend && npx jest --passWithNoTests`
  ],
  
  // TypeScript type checking for TS files
  "frontend/**/*.ts": [
    () => "npm run check"
  ],
  
  // Format JSON, markdown, and CSS files
  "frontend/**/*.{json,md,css,scss}": [
    "npm run format -- --quiet"
  ]
} 