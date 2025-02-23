/**
 * @jest-environment jsdom
 */
const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const schema = require("../src/pages/quests/jsonSchemas/quest.json");
const questDirectoryRelativePath = "../src/pages/quests/json/";
const ajv = new Ajv();
const validate = ajv.compile(schema);

function validateFile(filepath) {
  const data = JSON.parse(fs.readFileSync(filepath));
  if (!validate(data)) {
    console.error(`\x1b[31m${filepath} - failed\x1b[0m`); // Red text
    console.error("Errors:");
    console.error(validate.errors);
    return false;
  } else {
    console.log(`\x1b[32m${filepath} - passed\x1b[0m`); // Green text
    return true;
  }
}

function validateDirectory(dir) {
  const files = fs.readdirSync(dir);
  let valid = true;
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      // Recurse into subdirectories
      valid = validateDirectory(filepath) && valid;
    } else if (path.extname(filepath) === ".json") {
      // Validate JSON files
      valid = validateFile(filepath) && valid;
    }
  }
  return valid;
}

describe("quest validation", () => {
  // Store original document state
  let originalDocument;

  beforeAll(() => {
    originalDocument = global.document;
    // Ensure we have a document
    if (!global.document) {
      global.document = new JSDOM('<!doctype html><html><body></body></html>').window.document;
    }
  });

  afterAll(() => {
    // Restore original document state
    global.document = originalDocument;
  });

  test("All files in quests/json/ directory conform to schema", async () => {
    const directoryPath = path.join(__dirname, questDirectoryRelativePath);
    
    // Wrap the validation in a promise to catch any async errors
    await new Promise((resolve, reject) => {
      try {
        const result = validateDirectory(directoryPath);
        expect(result).toBe(true, "Some quest files are invalid");
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
});