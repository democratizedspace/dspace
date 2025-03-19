module.exports = {
  // Run lint and format checks on JavaScript, TypeScript, and Svelte files
  "frontend/**/*.{js,ts,svelte}": [
    "npm run lint:fix -- --quiet", 
    "npm run format -- --quiet",
  ],
  
  // Only run tests on JavaScript and TypeScript files (not Svelte components)
  "frontend/**/*.{js,ts}": [
    // Run Jest tests related to changed files
    files => {
      const tests = files
        .filter(file => 
          !file.includes('test.js') && 
          !file.includes('test.ts')
        )
        .map(file => `--testPathPattern=${file.replace(/\\/g, '/')}`)
        .join(' ');
      
      if (tests.length) {
        return `cd frontend && npm test -- ${tests}`;
      }
      return 'echo "No tests to run for changed files"';
    }
  ],
  
  // Format JSON, markdown, and CSS files
  "frontend/**/*.{json,md,css,scss}": [
    "npm run format -- --quiet"
  ]
} 