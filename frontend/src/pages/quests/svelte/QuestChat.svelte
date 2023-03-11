<script>
	import { createEventDispatcher } from 'svelte';
    import { onMount} from 'svelte';
    export let quest;

    export const dispatch = createEventDispatcher();

    function sayHello() {
        dispatch('message', {
            text: 'Hello!'
        });
    }

    onMount(() => {
        sayHello();
    });
</script>

<div>
    <div class="horizontal">
    </div>
</div>

<style>
    img {
        width: 200px;
        height: 200px;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 20px;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
    }
</style>