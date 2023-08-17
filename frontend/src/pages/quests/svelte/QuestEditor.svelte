<script>
    export let fields = [];

    let steps = [];
    let stepInput = '';

    function addStep() {
        if (stepInput.trim() !== '') {
            steps = [...steps, stepInput];
            stepInput = '';
        }
    }

    function removeStep(index) {
        steps = [...steps.slice(0, index), ...steps.slice(index + 1)];
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter' && stepInput.trim() !== '') {
            addStep();
            event.preventDefault(); // Prevent form submission
        }
    }
</script>

<form class="form-style vertical">
    {#each fields as field (field.name)}
        <div class="field-container">
            <label>{field.label}:</label>
            <div class="input-container">
                {#if field.type === 'text'}
                    <input class="input-style" type="text" bind:value={field.value} />
                {:else if field.type === 'textarea'}
                    <textarea class="input-style" bind:value={field.value}></textarea>
                {:else if field.type === 'steps'}
                    <ul class="vertical steps-list">
                        {#each steps as step, index (index)}
                            <li class="horizontal">
                                <span>{step}</span>
                                <button class="delete-button" on:click={() => removeStep(index)}>Delete</button>
                            </li>
                        {/each}
                    </ul>
                    <div class="horizontal">
                        <input 
                            class="input-style step-input" 
                            type="text" 
                            bind:value={stepInput}
                            on:keydown={handleKeyPress} />
                        <button class="add-button" type="button" on:click={addStep}>Add</button>
                    </div>
                {/if}
            </div>
        </div>
    {/each}
</form>

<style>
    .form-style {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
    }

    .field-container {
        display: grid;
        grid-template-columns: 150px 1fr;
        gap: 20px;
        align-items: start;
        margin-bottom: 20px;
    }

    .input-style, .textarea-style {
        padding: 10px;
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
        transition: border-color 0.3s ease;
    }

    .input-style:focus, .textarea-style:focus {
        border-color: #007BFF;
        outline: none;
    }

    .vertical {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .horizontal {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }

    .steps-list {
        list-style: none;
        padding: 0;
    }

    .delete-button {
        background-color: #f44336;
        color: #fff;
        padding: 5px 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .delete-button:hover {
        background-color: #d32f2f;
    }

    .add-button {
        background-color: #007BFF;
        color: #fff;
        padding: 5px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        margin: 20px;
    }

    .add-button:hover {
        background-color: #0056b3;
    }
</style>
