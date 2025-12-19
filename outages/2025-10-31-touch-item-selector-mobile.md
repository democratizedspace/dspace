# 2025-10-31-touch-item-selector-mobile

- **Date:** 2025-10-31
- **Component:** frontend:item-selector
- **Root cause:** The touch item selector E2E test tapped the first button inside the selector, which corresponds to the first option when the list auto-expands. That tap immediately selected the item and collapsed the listbox, so the subsequent visibility assertion failed and the listbox appeared to be missing.
- **Resolution:** Make the touch selector test explicitly open the dropdown before asserting and interacting with options, and add expansion state metadata to the ItemSelector component so it advertises its state for automation and assistive technology.
- **References:**
  - https://github.com/democratizedspace/dspace/actions/runs/18642736123/job/53144470360
