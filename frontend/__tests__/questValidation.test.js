const fs = require("fs");
const path = require("path");
const Ajv = require("ajv");
const schema = require("../src/pages/quests/jsonSchemas/quest.json");
const questDirectoryRelativePath = "../src/pages/quests/json/";
const ajv = new Ajv();
const validate = ajv.compile(schema);

describe("quest validation", () => {
  test("All files in quests/json/ directory conform to schema", () => {
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
          const data = JSON.parse(fs.readFileSync(filepath));
          valid = validate(data) && valid;
          if (!valid) {
            console.error(`Invalid quest file found: ${filepath}`);
          }
        }
      }
      return valid;
    }

    const directoryPath = path.join(__dirname, questDirectoryRelativePath);
    expect(validateDirectory(directoryPath)).toBe(true, "Some quest files are invalid");
  });
});
