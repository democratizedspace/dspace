<script>
    import { onMount } from 'svelte';
    import ThemeToggle from './ThemeToggle.svelte';
    import { isBrowser } from '../../utils/ssr.js';

    const DEFAULT_AVATAR = '/assets/pfp/7ecc9e2a-dd79-4bf8-87b5-57f090dd8c14.jpg';

    let avatarUrl = DEFAULT_AVATAR;

    onMount(() => {
        if (!isBrowser) {
            return;
        }

        const storedAvatar = localStorage.getItem('avatarUrl');
        avatarUrl = storedAvatar && storedAvatar.trim() ? storedAvatar : DEFAULT_AVATAR;
    });
</script>

<div class="header-actions" data-testid="header-actions">
    <ThemeToggle />
    <a class="avatar-link" href="/profile" aria-label="Profile">
        <img class="pfp" src={avatarUrl} alt="Profile avatar" />
    </a>
</div>

<style>
    .header-actions {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.35rem;
    }

    .avatar-link {
        display: inline-flex;
        padding: 0.125rem;
        border-radius: 999px;
        border: 2px solid var(--color-pill-active, #68d46d);
        background-color: rgba(255, 255, 255, 0.08);
    }

    .avatar-link:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
    }

    .pfp {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: block;
    }
</style>
