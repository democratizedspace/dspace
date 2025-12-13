<script>
    import { onMount } from 'svelte';
    import { DEFAULT_AVATAR_URL, resolveAvatarUrl } from '../../utils/avatar';

    let avatarUrl = DEFAULT_AVATAR_URL;

    onMount(() => {
        avatarUrl = resolveAvatarUrl();
    });
</script>

<a
    class="header-avatar"
    href="/profile"
    aria-label="Profile"
    data-testid="header-avatar-link"
>
    <img
        class="header-avatar__image"
        src={avatarUrl}
        alt="Profile avatar"
        data-testid="header-avatar"
    />
</a>

<style>
    .header-avatar {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 2px solid rgb(67, 255, 76);
        transition: opacity 150ms ease-in-out;
    }

    .header-avatar:hover {
        opacity: 0.92;
    }

    .header-avatar__image {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
    }
</style>
