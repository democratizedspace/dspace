<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import {
        loadCloudGistId,
        uploadGameStateToGist,
        downloadGameStateFromGist,
        clearCloudGistId,
    } from '../../../utils/cloudSync.js';
    import {
        isValidGitHubToken,
        loadGitHubToken,
        saveGitHubToken,
        clearGitHubToken,
    } from '../../../utils/githubToken.js';

    let token = '';
    let gistId = '';
    let message = '';

    token = loadGitHubToken();
    gistId = loadCloudGistId();

    const saveToken = () => {
        saveGitHubToken(token);
    };

    const clearTokenLocal = () => {
        token = '';
        clearGitHubToken();
    };

    const handleUpload = async () => {
        try {
            if (!isValidGitHubToken(token)) {
                message = 'GitHub token looks invalid';
                return;
            }
            const id = await uploadGameStateToGist(token);
            gistId = id;
            message = 'Upload successful';
        } catch (err) {
            console.error(err);
            message = 'Upload failed';
        }
    };

    const clearGistId = () => {
        gistId = '';
        clearCloudGistId();
    };

    const handleDownload = async () => {
        try {
            if (!gistId) {
                message = 'Gist ID required';
                return;
            }
            await downloadGameStateFromGist(token, gistId);
            message = 'Download successful';
        } catch (err) {
            console.error(err);
            message = 'Download failed';
        }
    };
</script>

<Chip text="">
    <div class="vertical">
        <div class="form-group">
            <label for="token">GitHub Token*</label>
            <div class="token-input">
                <input id="token" type="password" bind:value={token} />
                <button type="button" on:click={saveToken}>Save</button>
                <button type="button" on:click={clearTokenLocal} data-testid="clear-sync-token"
                    >Clear</button
                >
            </div>
        </div>
        <div class="form-group">
            <label for="gist">Gist ID</label>
            <div class="token-input">
                <input id="gist" type="text" bind:value={gistId} />
                <button type="button" on:click={clearGistId} data-testid="clear-gist-id"
                    >Clear</button
                >
            </div>
        </div>
        <div class="buttons">
            <Chip text="Upload" on:click={handleUpload} inverted={true} />
            <Chip text="Download" on:click={handleDownload} inverted={true} />
        </div>
        {#if message}
            <p class="message">{message}</p>
        {/if}
    </div>
</Chip>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        width: 100%;
    }
    .token-input {
        display: flex;
        gap: 10px;
    }
    .form-group label {
        font-weight: bold;
    }
    .buttons {
        display: flex;
        gap: 10px;
    }
    .message {
        color: #90ee90;
    }
    input {
        flex: 1;
        padding: 5px;
        border-radius: 6px;
    }
</style>
