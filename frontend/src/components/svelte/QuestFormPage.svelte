<script>
    import QuestForm from './QuestForm.svelte';
    export let existingQuests = [];
    let successData = null;
    function handleSuccess(event) {
        successData = event.detail;
    }
</script>

{#if successData}
    <div class="success-message">
        {successData.message}
        <a class="view-link" href={`/quests/${successData.id}`}>View quest</a>
    </div>
{:else}
    <QuestForm {existingQuests} on:success={handleSuccess} />
{/if}

<style>
    .success-message {
        text-align: center;
        padding: 20px;
        background: #2c5837;
        border-radius: 12px;
        border: 2px solid #007006;
        color: white;
    }
    .view-link {
        margin-left: 8px;
        color: #68d46d;
    }
</style>
