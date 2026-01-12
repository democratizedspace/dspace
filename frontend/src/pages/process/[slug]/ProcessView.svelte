<script>
    import Process from '../../../components/svelte/Process.svelte';
    import processes from '../../../generated/processes.json';
    import items from '../../inventory/json/items';
    import { buyItems, getItemCount } from '../../../utils/gameState/inventory.js';
    import { getPriceStringComponents } from '../../../utils.js';
    import { getProcess } from '../../../utils/customcontent.js';
    import { onMount } from 'svelte';

    export let slug;

    let processData = null;
    let process = null;
    let disableBuy = true;
    let toastVisible = false;
    let toastMessage = '';

    const loadCustomProcess = async () => {
        const builtInProcess = processes.find((p) => p.id === slug);
        if (builtInProcess) {
            processData = null;
            process = builtInProcess;
            return;
        }

        try {
            processData = await getProcess(slug);
            process = processData;
        } catch (error) {
            console.warn('Unable to load custom process details:', error);
            processData = null;
            process = null;
        }
    };

    const updateDisabled = () => {
        if (!process || !process.requireItems) {
            disableBuy = true;
            return;
        }
        disableBuy = process.requireItems.every((item) => getItemCount(item.id) >= item.count);
    };

    const buyItem = (id, qty) => {
        const item = items.find((i) => i.id === id);
        if (!item) return;
        const { price } = getPriceStringComponents(item.price);
        buyItems([{ id, quantity: qty, price }]);
    };

    const buyRequired = () => {
        if (!process) return;
        let added = 0;
        process.requireItems.forEach((req) => {
            const have = getItemCount(req.id);
            const need = req.count - have;
            if (need > 0) {
                buyItem(req.id, need);
                added += need;
            }
        });
        if (added > 0) {
            toastMessage = `\u2713 Added ${added} items to inventory`;
            toastVisible = true;
            setTimeout(() => (toastVisible = false), 3000);
        }
        updateDisabled();
    };

    onMount(async () => {
        await loadCustomProcess();
        updateDisabled();
    });
</script>

<div class="process-view">
    <Process processId={slug} processData={processData} />
    {#if process && process.requireItems && process.requireItems.length > 0}
        <button
            class="primary"
            type="button"
            on:click={buyRequired}
            aria-disabled={disableBuy}
            disabled={disableBuy}
        >
            Buy required items
        </button>
    {/if}
    {#if toastVisible}
        <div class="toast" role="status" aria-live="polite">{toastMessage}</div>
    {/if}
</div>

<style>
    .primary {
        background-color: #2f5b2f;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        margin-top: 10px;
        cursor: pointer;
    }
    .primary:focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
    }
    .primary[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .process-view {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #cacaca;
        color: #fff;
        padding: 10px 20px;
        border-radius: 5px;
        text-align: center;
    }
</style>
