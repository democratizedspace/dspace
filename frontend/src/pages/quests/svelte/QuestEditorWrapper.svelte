<script>
    import QuestEditor from './QuestEditor.svelte';
    import { onMount } from 'svelte';

    let title = '';
    let description = '';
    let fields = [];
    let isClientSide = false;

    // Use onMount to ensure this runs only in the browser after hydration
    onMount(() => {
        isClientSide = true;

        // Initialize the fields once mounted to the client
        fields = [
            { name: 'title', type: 'text', label: 'Quest Title', value: title },
            {
                name: 'description',
                type: 'textarea',
                label: 'Quest Description',
                value: description,
            },
            { name: 'steps', type: 'steps', label: 'Quest Steps' },
        ];
    });
</script>

<div data-hydrated={isClientSide ? 'true' : 'false'}>
    {#if isClientSide}
        <QuestEditor {fields} />
    {:else}
        <div class="loading">Loading quest editor...</div>
    {/if}
</div>

<style>
    .loading {
        text-align: center;
        padding: 2rem;
        font-style: italic;
        color: #666;
    }
</style>
