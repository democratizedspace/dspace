export const ITEM_SELECTOR_OPTION_LOCATORS = [
    '.dropdown-menu .item',
    '.item-list .item',
    '.items-list .item',
    '.items-list .item-row',
    '.selector-expanded .item',
    '.selector-expanded .item-row',
    '[role="listbox"] [role="option"]',
] as const;

export type ItemSelectorLocator = (typeof ITEM_SELECTOR_OPTION_LOCATORS)[number];
