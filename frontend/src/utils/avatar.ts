import { isBrowser } from './ssr.js';

export const DEFAULT_AVATAR_URL = '/assets/pfp/7ecc9e2a-dd79-4bf8-87b5-57f090dd8c14.jpg';

export function resolveAvatarUrl(): string {
    if (!isBrowser) {
        return DEFAULT_AVATAR_URL;
    }

    const storedAvatar = localStorage.getItem('avatarUrl');
    return storedAvatar || DEFAULT_AVATAR_URL;
}
