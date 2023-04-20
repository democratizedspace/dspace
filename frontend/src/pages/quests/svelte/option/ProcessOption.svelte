<script>
    import Chip from '../../../../components/svelte/Chip.svelte';
    import Process from '../../../../components/svelte/Process.svelte';

    export let option;
</script>

<Chip text="">
    <Process inverted={false} processId={option.process} />
</Chip>