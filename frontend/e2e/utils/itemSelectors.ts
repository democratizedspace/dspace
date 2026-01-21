export const ITEM_SELECTOR_OPTION_LOCATORS = [
    '.dropdown-menu .item',
    '.item-list .item',
    '.items-list .item',
    '.item-row',
    '.items-list .item-option',
    '.selector-expanded .item',
    '.selector-expanded .item-option',
    '[role="listbox"] [role="option"]',
] as const;

export type ItemSelectorLocator = (typeof ITEM_SELECTOR_OPTION_LOCATORS)[number];
