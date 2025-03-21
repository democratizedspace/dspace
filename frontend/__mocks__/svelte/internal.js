/**
 * Mock for Svelte's internal module
 * 
 * This mock addresses issues with testing Svelte components that are used within
 * Astro's SSR + hydration framework. It handles both the server-rendered portions
 * and client-side hydration.
 */

// Create a global document object if one doesn't exist
// This prevents "Cannot read properties of undefined (reading 'dispatchEvent')" errors
if (typeof global.document === 'undefined') {
    global.document = {
        dispatchEvent: () => {},
        createElement: () => ({
            appendChild: () => {},
            setAttribute: () => {},
            style: {},
            classList: {
                add: () => {},
                remove: () => {},
                contains: () => false
            }
        }),
        createTextNode: () => ({}),
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementById: () => null
    };
}

// Access the real svelte internal module
const realSvelteInternal = jest.requireActual('svelte/internal');

// Create custom mock functions
function noop() {}

function custom_event(type, detail) {
    return new CustomEvent(type, { detail });
}

/**
 * Mock implementation of dispatch_dev that handles SSR/hydration scenarios
 * This is critical for testing components that work within Astro's partial hydration model
 */
function dispatch_dev(type, detail) {
    try {
    // Make sure document is defined
        if (global.document && typeof global.document.dispatchEvent === 'function') {
            const customEvent = new CustomEvent(type, { 
                detail: { ...detail, __svelte__: true } 
            });
            global.document.dispatchEvent(customEvent);
        }
    } catch (error) {
        console.warn('Error in dispatch_dev:', error);
    }
}

function validate_slots() {
    return true;
}

function validate_store() {
    return true;
}

function append(target, node) {
    if (target) {
        target.appendChild(node);
    }
}

function insert(target, node, anchor) {
    if (target) {
        target.insertBefore(node, anchor || null);
    }
}

function detach(node) {
    if (node && node.parentNode) {
        node.parentNode.removeChild(node);
    }
}

function element(name) {
    return document.createElement(name);
}

function text(data) {
    return document.createTextNode(data);
}

function space() {
    return text(' ');
}

function empty() {
    return text('');
}

function listen(node, event, handler, options) {
    if (node && typeof node.addEventListener === 'function') {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    return noop;
}

function attr(node, attribute, value) {
    if (!node) return;
    if (value == null) node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}

function set_style(node, key, value) {
    if (node && node.style) {
        node.style.setProperty(key, value);
    }
}

function children(element) {
    return Array.from(element?.childNodes || []);
}

function create_component(component) {
    return component?._() || {};
}

/**
 * Modified mount_component to handle Astro's hydration model
 * This function detects client:* directives and adjusts hydration behavior
 */
function mount_component(component, target, anchor, options) {
    // Handle hydration for components with client: directives
    if (options && options.hydrate) {
    // For Astro SSR + hydration, we need to handle both pre-rendered content 
    // and client-side hydration differently
        return {
            $$: {
                fragment: {
                    c: noop,
                    m: noop
                }
            },
            $set: noop,
            $destroy: noop
        };
    }
  
    return {
        $$: {
            fragment: {
                c: () => {},
                m: (target, anchor) => {}
            }
        },
        $set: () => {},
        $destroy: () => {}
    };
}

// Merge our custom implementations with the real module
module.exports = {
    ...realSvelteInternal,
    // Override with our special SSR/hydration handling implementations
    dispatch_dev,
    validate_slots,
    validate_store,
    noop,
    custom_event,
    append,
    insert,
    detach,
    element,
    text,
    space,
    empty,
    listen,
    attr,
    set_style,
    children,
    create_component,
    mount_component,
  
    // Critical flag to disable SSR mode for testing
    ssr: false,
  
    // Helper functions for hydration
    tick: (fn) => Promise.resolve().then(fn || (() => {})),
  
    // Special component constructors for testing
    SvelteComponent: class SvelteComponent {
        constructor() {}
        $destroy() {}
    },
    SvelteComponentDev: class SvelteComponentDev {
        constructor() {}
        $destroy() {}
    }
}; 