# 2025-10-18-quest-form-indexeddb-sync

- **Date:** 2025-10-18
- **Component:** frontend quest builder
- **Root cause:** QuestForm only validated duplicate titles against server-provided data and never persisted built-in quests into IndexedDB. The e2e duplicate-title flow expected an existing record and failed when none was written.
- **Resolution:** Persist quests supplied by the server into the CustomContent IndexedDB store on load so duplicate-title checks compare against real records, and add unit coverage to ensure the sync keeps working.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18612605001/job/53072829421
  - https://github.com/democratizedspace/dspace/actions/runs/18612605001/job/53072829422
