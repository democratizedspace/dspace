<script>
    import { writable } from 'svelte/store';
    import OpenAIAPIKeySettings from '../../../components/svelte/OpenAIAPIKeySettings.svelte';

    export let apiKey = writable('');
</script>

<OpenAIAPIKeySettings {apiKey} />
