<script>
    import Process from '../../../components/svelte/Process.svelte';

    export let slug;
</script>

<div class="process-view">
    <Process inverted={true} processId={slug} />
</div>

<style>
    .process-view {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>
