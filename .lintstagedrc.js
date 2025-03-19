module.exports = {
  // Run lint and format checks on JavaScript, TypeScript, and Svelte files
  "frontend/**/*.{js,ts,svelte}": [
    "npm run lint:fix -- --quiet", 
    "npm run lint -- --quiet",
    "npm run format -- --quiet",
  ],
  
  // TypeScript type checking for TS files
  "frontend/**/*.ts": [
    () => "npm run check"
  ],
  
  // Tests are run in pre-push hook instead of pre-commit to avoid Windows path issues
  // and to make commits faster
  
  // Format JSON, markdown, and CSS files
  "frontend/**/*.{json,md,css,scss}": [
    "npm run format -- --quiet"
  ]
} 