<script>
    export let href, text, onClick, disabled = false;
</script>

<nav>
	{#if href}
		<a href={href}>{text}</a>
	{:else}
		<button class:disabled={disabled === true} on:click={onClick}>{text}</button>
	{/if}
</nav>

<style>
	nav {
		text-align: center;
		display: inline-flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	nav a, nav button {
		opacity: 0.8;
		background-color: #007006;
		border-radius: 0.4rem;
		color: white;
		text-decoration: none;
		flex-direction: row;
		margin: 1px;
		padding: 5px;
		text-align: center;
        -webkit-transition: 200ms linear;
        transition: 200ms linear;
	}

	nav button {
		border: none;
		padding: 6px 5px;
		font-size: 1em;
	}

	nav a:hover, nav button:hover {
		opacity: 1;
	}

	nav button:hover {
		cursor: pointer;
	}

	.disabled {
		background-color: #004603;
		color: #8a8a8a;
	}
</style>