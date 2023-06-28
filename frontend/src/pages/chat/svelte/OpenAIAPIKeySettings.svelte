<script>
  import { onMount } from 'svelte';
  import { writable } from "svelte/store";
  import { loadGameState, saveGameState } from "../../../utils/gameState.js";

  export let apiKey = writable(loadGameState().openAI?.apiKey || "");
  
  const isMounted = writable(false);
  let isEditing = writable(!$apiKey);

  onMount(() => {
      isMounted.set(true);
  });
  
  function saveAPIKey() {
    let gameState = loadGameState();
    gameState.openAI = gameState.openAI || {};
    gameState.openAI.apiKey = $apiKey;
    saveGameState(gameState);
    isEditing.set(false);
  }

  function deleteAPIKey() {
    let gameState = loadGameState();
    gameState.openAI = gameState.openAI || {};
    gameState.openAI.apiKey = "";
    saveGameState(gameState);
    apiKey.set("");
    isEditing.set(true);
  }

  function handleSubmit() {
    saveAPIKey();
    // reload the page
    window.location.reload();
  }

  function editAPIKey() {
    isEditing.set(true);
  }
</script>

{#if $isMounted}
  <div>
    <div class={$isEditing ? 'vertical editing' : 'vertical'}>
        {#if $isEditing}
            <p>Enter your <a href="https://platform.openai.com/account/api-keys">OpenAI API Key</a> to integrate GPT-3.5. Make sure you place <a href="https://platform.openai.com/account/billing/limits">usage limits</a>.  You can monitor your usage <a href="https://platform.openai.com/account/usage">here.</a></p>
            <form on:submit|preventDefault={handleSubmit}>
            <input type="text" bind:value={$apiKey} />
            <div class="horizontal">
                <button type="submit">Submit</button>
                <button class="red" type="button" on:click={() => deleteAPIKey()}>Clear</button>
            </div>
            </form>
        {:else}
            <button type="button" on:click={() => editAPIKey()}>Edit API Key</button>
        {/if}
    </div>

    <p>Currently, the game doesn't know anything about the lore, the items in the game, or your inventory. This will be introduced in a future version, as an opt-in feature.</p>
  </div>
{/if}

<style>
  button {
      width: 100%;
      height: 40px;
      border-radius: 5px;
      margin-top: 10px;
      margin-bottom: 10px;
      background-color: #1f2937;
      color: white;
      border: none;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  button:hover {
      background-color: #374151;
  }
  
  .red {
      background-color: #8a2c2c;
      color: white;
  }
  
  input {
      height: 30px;
      border-radius: 5px;
      padding: 10px;
      font-size: 16px;
      border: none;
      margin-bottom: 10px;
      box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  }

  .editing {
        opacity: 0;
        animation: fadeIn 0.5s forwards;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
</style>