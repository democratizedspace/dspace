<script>
    import { onMount } from 'svelte';
    import { DEFAULT_AVATAR_URL, resolveAvatarUrl } from '../../utils/avatar';

    let avatarUrl = DEFAULT_AVATAR_URL;

    onMount(() => {
        avatarUrl = resolveAvatarUrl();
    });
</script>

<div>
    <a class="avatar" href="/profile/avatar">
        <img src={avatarUrl} alt="your currently selected avatar" />
    </a>

    <p>click to change</p>
</div>

<style>
    .avatar {
        width: 100px;
        height: 100px;
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
    }

    .avatar:hover {
        cursor: pointer;
        opacity: 1;
    }

    img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
    }

    p {
        margin-top: -10px;
        margin-left: 20px;
        font-size: 12px;
    }
</style>
