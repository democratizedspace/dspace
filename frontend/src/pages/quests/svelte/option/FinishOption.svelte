<script>
    import Chip from '../../../../components/svelte/Chip.svelte';
    import CompactItemList from '../../../../components/svelte/CompactItemList.svelte';
    import { finishQuest} from '../../../../utils/gameState.js';

    export let quest, option;

    function onClick() {
        finishQuest(quest.id, quest.rewards || []);
    }
</script>

<Chip text={option.text} onClick={() => onClick()}>
    <div class="vertical">
        Finish this quest and receive the following items:
        <CompactItemList itemList={quest.rewards || []} increase={true} />
    </div>
</Chip>

<style>
    .vertical {
        display: flex;
        flex-direction: column;
    }
</style>