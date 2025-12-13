<script>
    import { onMount } from 'svelte';
    import { isBrowser } from '../../utils/ssr.js';

    const DEFAULT_AVATAR = '/assets/pfp/7ecc9e2a-dd79-4bf8-87b5-57f090dd8c14.jpg';

    let avatarUrl = DEFAULT_AVATAR;
    let hydrated = false;

    const resolveAvatar = () => {
        if (!isBrowser) {
            return DEFAULT_AVATAR;
        }

        const stored = localStorage.getItem('avatarUrl');
        return stored || DEFAULT_AVATAR;
    };

    const updateAvatar = () => {
        avatarUrl = resolveAvatar();
    };

    onMount(() => {
        updateAvatar();
        hydrated = true;

        const handleStorage = (event) => {
            if (event.key === 'avatarUrl') {
                updateAvatar();
            }
        };

        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('storage', handleStorage);
        };
    });
</script>

<a
    class="header-avatar"
    href="/profile"
    aria-label="Profile"
    data-testid="header-avatar"
    data-hydrated={hydrated ? 'true' : 'false'}
>
    <img src={avatarUrl} alt="Profile avatar" />
</a>

<style>
    .header-avatar {
        align-items: center;
        background: rgba(0, 0, 0, 0.32);
        border: 2px solid rgb(67, 255, 76);
        border-radius: 50%;
        display: inline-flex;
        height: 48px;
        justify-content: center;
        opacity: 0.9;
        overflow: hidden;
        transition:
            opacity 160ms ease-in-out,
            transform 160ms ease-in-out;
        width: 48px;
    }

    .header-avatar:hover,
    .header-avatar:focus-visible {
        opacity: 1;
        transform: translateY(-1px);
    }

    .header-avatar:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
    }

    img {
        height: 100%;
        object-fit: cover;
        width: 100%;
    }
</style>
