<script>
    import { onMount } from 'svelte';
    import { getVersionNumber, setVersionNumber, VERSIONS } from '../../utils/gameState.js';

    export let shouldUpdate = false;

    let currentVersionNumber;

    onMount(() => {
        currentVersionNumber = getVersionNumber() || VERSIONS.V1;

        if (shouldUpdate && currentVersionNumber !== VERSIONS.V1) {
            setVersionNumber(VERSIONS.V2);
        }
    });
</script>