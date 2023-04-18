<script>
    import Chip from '../../../components/svelte/Chip.svelte';
    import GotoOption from './option/GotoOption.svelte';
    import GrantItemsOption from './option/GrantItemsOption.svelte';
    import ProcessOption from './option/ProcessOption.svelte';
    import FinishOption from './option/FinishOption.svelte';

    export let quest, option, questId, stepId, optionIndex;
</script>

<div>
    {#if option.type === 'goto'}
        <GotoOption {option} {questId} />
    {:else if option.type === 'grantsItems'}
        <GrantItemsOption {option} {questId} {stepId} {optionIndex} />
    {:else if option.type === 'process'}
        <ProcessOption {option} />
    {:else if option.type === 'finish'}
        <FinishOption {quest} {option} />
    {:else}
        <Chip text={JSON.stringify(option)} />
    {/if}
</div>