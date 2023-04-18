<script>
    import Chip from '../../../../components/svelte/Chip.svelte';
    import Process from '../../../../components/svelte/Process.svelte';

    export let option;
</script>

<Chip inverted={false} text="">
    <Process processId={option.process} />
</Chip>