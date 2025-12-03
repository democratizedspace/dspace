/**
 * SSR-safe utilities for browser-only code execution
 *
 * This module provides utilities to conditionally execute browser-specific code
 * only when running on the client side, preventing SSR errors.
 *
 * Usage:
 *   import { isBrowser, onBrowser } from '../utils/ssr.js';
 *
 *   // Check if running in browser before accessing browser APIs
 *   if (isBrowser) {
 *     const value = localStorage.getItem('key');
 *   }
 *
 *   // Execute code only in browser, with fallback for SSR
 *   const value = onBrowser(() => localStorage.getItem('key'), null);
 *
 * For Svelte components, prefer using onMount() for browser-only initialization:
 *   onMount(() => {
 *     // This only runs in the browser
 *     const value = localStorage.getItem('key');
 *   });
 */

/**
 * Check if code is running in a browser environment
 * @type {boolean}
 */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Check if code is running on the server (SSR)
 * @type {boolean}
 */
export const isServer = !isBrowser;

/**
 * Execute a function only in browser environment, returning a fallback value on server
 * @template T
 * @param {() => T} fn - Function to execute (only called in browser)
 * @param {T} fallback - Value to return on server
 * @returns {T}
 *
 * @example
 * // Get localStorage value, defaulting to null on server
 * const theme = onBrowser(() => localStorage.getItem('dspace-theme'), null);
 *
 * @example
 * // Get window dimensions, defaulting to 0 on server
 * const width = onBrowser(() => window.innerWidth, 0);
 */
export function onBrowser(fn, fallback) {
    if (isBrowser) {
        try {
            return fn();
        } catch (err) {
            console.error('Browser-only function failed:', err);
            return fallback;
        }
    }
    return fallback;
}

/**
 * Execute an async function only in browser environment
 * @template T
 * @param {() => Promise<T>} fn - Async function to execute (only called in browser)
 * @param {T} fallback - Value to return on server
 * @returns {Promise<T>}
 *
 * @example
 * const data = await onBrowserAsync(() => fetch('/api/data').then(r => r.json()), []);
 */
export async function onBrowserAsync(fn, fallback) {
    if (isBrowser) {
        try {
            return await fn();
        } catch (err) {
            console.error('Browser-only async function failed:', err);
            return fallback;
        }
    }
    return fallback;
}
