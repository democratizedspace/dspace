<script>
    import { isBrowser } from '../../utils/ssr.js';

    const defaultAvatar = '/assets/pfp/7ecc9e2a-dd79-4bf8-87b5-57f090dd8c14.jpg';

    export let size = 100;
    export let showHelperText = true;
    export let testId = 'avatar-image';

    const storedAvatar = isBrowser ? localStorage.getItem('avatarUrl') : null;
    const avatarSrc = storedAvatar || defaultAvatar;
    const hasCustomAvatar = Boolean(storedAvatar);
</script>

<div class="avatar-wrapper" data-variant={showHelperText ? 'default' : 'compact'}>
    <a
        class="avatar"
        href="/profile/avatar"
        aria-label="Change your avatar"
        style={`--avatar-size: ${size}px;`}
    >
        <span class="sr-only">Update avatar</span>
        <img
            src={avatarSrc}
            alt={hasCustomAvatar ? 'your currently selected avatar' : 'default avatar'}
            data-testid={testId}
        />
    </a>

    {#if showHelperText}
        <p aria-live="polite">{hasCustomAvatar ? 'click to change' : 'choose an avatar'}</p>
    {/if}
</div>

<style>
    .avatar-wrapper {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
    }

    .avatar {
        --avatar-size: 100px;
        width: var(--avatar-size);
        height: var(--avatar-size);
        border-radius: 50%;
        background-color: #68d46d;
        color: black;
        margin: 10px;
        border: 3px solid rgb(67, 255, 76);
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0.8;
        text-decoration: none;
        overflow: hidden;
    }

    .avatar:hover {
        cursor: pointer;
        opacity: 1;
    }

    .avatar img {
        width: var(--avatar-size);
        height: var(--avatar-size);
        border-radius: 50%;
        object-fit: cover;
    }

    .avatar-wrapper[data-variant='compact'] .avatar {
        margin: 0;
        border-width: 2px;
    }

    .avatar-wrapper[data-variant='compact'] .avatar img {
        width: calc(var(--avatar-size) - 4px);
        height: calc(var(--avatar-size) - 4px);
    }

    p {
        margin: 0;
        font-size: 12px;
        color: var(--color-heading);
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
</style>
