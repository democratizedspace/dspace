<script>
    import { createEventDispatcher } from 'svelte';
    export let token = '';
    export let branch = '';
    export let questJson = '';
    const dispatch = createEventDispatcher();

    function b64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!questJson.trim()) {
            dispatch('error', { message: 'Quest JSON is required' });
            return;
        }
        try {
            const branchName = branch || `quest-${Date.now()}`;
            const headers = {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json',
            };
            const content = b64(questJson);
            const filePath = `submissions/quests/${branchName}.json`;
            const res = await fetch(
                `https://api.github.com/repos/democratizedspace/dspace/contents/${filePath}`,
                {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        message: 'Add quest submission',
                        content,
                        branch: branchName,
                    }),
                }
            );
            if (!res.ok) throw new Error(await res.text());
            const prRes = await fetch(
                'https://api.github.com/repos/democratizedspace/dspace/pulls',
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        title: `Quest submission: ${branchName}`,
                        head: branchName,
                        base: 'v3',
                        body: 'Automated quest submission.',
                    }),
                }
            );
            if (!prRes.ok) throw new Error(await prRes.text());
            dispatch('success', { message: 'Pull request created' });
        } catch (err) {
            console.error(err);
            dispatch('error', { message: 'Failed to submit quest' });
        }
    }
</script>

<form on:submit={handleSubmit} class="pr-form">
    <div class="form-group">
        <label for="token">GitHub Token*</label>
        <input id="token" type="password" bind:value={token} required />
    </div>
    <div class="form-group">
        <label for="branch">Branch Name</label>
        <input id="branch" type="text" bind:value={branch} placeholder="quest-my-feature" />
    </div>
    <div class="form-group">
        <label for="quest">Quest JSON*</label>
        <textarea id="quest" bind:value={questJson} rows="10" required />
    </div>
    <div class="form-submit">
        <button type="submit">Create Pull Request</button>
    </div>
</form>

<style>
    .pr-form {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: #fff;
        font-family: Arial, sans-serif;
    }
    .form-group {
        margin-bottom: 15px;
        text-align: left;
    }
    label {
        display: block;
        font-weight: bold;
        margin-bottom: 4px;
        color: white;
    }
    input,
    textarea {
        width: 95%;
        padding: 8px;
        border-radius: 8px;
        background: #68d46d;
        color: black;
        border: 2px solid #007006;
    }
    .form-submit {
        text-align: center;
    }
    button {
        padding: 10px 20px;
        background: #007006;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
    }
</style>
