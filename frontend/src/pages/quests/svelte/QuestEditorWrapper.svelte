<script>
    import QuestEditor from './QuestEditor.svelte';

    let title = '';
    let description = '';

    const fields = [
        { name: 'title', type: 'text', label: 'Quest Title', value: title },
        { name: 'description', type: 'textarea', label: 'Quest Description', value: description },
        { name: 'steps', type: 'steps', label: 'Quest Steps' }
    ];
</script>

<QuestEditor {fields} />
