<script>
    import menu from '../../config/menu.json';
	import { getItemCount } from '../../utils/gameState/inventory.js';
	import { onMount } from 'svelte';

	export let pathname;

	// get avatarUrl from localStorage key of same name
	let avatarUrl = localStorage.getItem('avatarUrl');
	let mounted = false;

	const toggleShowUnpinned = () => {
		showUnpinned = !showUnpinned;

		// edit unpinned-toggle button text
		const button = document.getElementById('unpinned-toggle');
		button.innerText = showUnpinned ? LABEL_FEWER : LABEL_MORE;
	}

	const isActive = (item) => {
		if (item.href === '/') {
			return pathname === '/';
		}

		// TODO: support unpinned menu items
		return pathname.startsWith(item.href);
	}

	const showMenuItem = (currentItem) => {
		if (currentItem && currentItem.hideIfOwned) {
			// for each item in hideIfOwned, check if the player has it
			for (const i of currentItem.hideIfOwned) {
				if (getItemCount(i.id) > 0) {
					return false;
				}
			}
		}
		return true;
	}

	const LABEL_MORE = 'More';
	const LABEL_FEWER = 'Less';

	let showUnpinned = false;
    
	// filter menu to only pinned == true
	const {pinned, unpinned } = menu.reduce((acc, item) => {
		if (item.pinned) {
			acc.pinned.push(item);
		} else {
			acc.unpinned.push(item);
		}
		return acc;
	}, { pinned: [], unpinned: [] });

	const activeUnpinned = unpinned.filter(item => isActive(item));
	if (activeUnpinned.length > 0) {
		const activeItem = activeUnpinned[0];
		unpinned.splice(unpinned.indexOf(activeItem), 1);
		pinned.push(activeItem);
	}

	onMount(() => {
		mounted = true;
	});
</script>

<div>
	{#if avatarUrl}
		<a href="/profile"><img class="pfp" src={avatarUrl} alt="logo" /></a>
	{/if}
	<nav>
		{#each pinned as item}
				{#if isActive(item)}
					<a class="active" href={item.href}>{item.name}</a>
				{:else}
					{#if item.hideIfOwned}
						{#if showMenuItem(item) && mounted}
							<a href={item.href}>{item.name}</a>
						{/if}
					{:else if item.comingSoon === true}
						<a class="disabled" href={item.href}>{item.name}</a>
					{:else}
						<a href={item.href}>{item.name}</a>
					{/if}
				{/if}
		{/each}

		{#if showUnpinned}
			{#each unpinned as item}
				{#if item.hideIfOwned}
					{#if mounted}
						<button class="active" href={""}>{item.name}f</button>
					{/if}
				{:else if item.comingSoon === true}
					<button class="disabled" href={""}>{item.name}</button>
				{:else}
					<a href={item.href}>{item.name}</a>
				{/if}
			{/each}
		{/if}
		
		<button id="unpinned-toggle" on:click={toggleShowUnpinned}>{LABEL_MORE}</button>
	</nav>
</div>

<style>
	nav {
		text-align: center;
		display: inline-flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	nav a {
		opacity: 0.8;
		background-color: #007006;
		border-radius: 0.4rem;
		color: white;
		text-decoration: none;
		flex-direction: row;
		margin: 1px;
		padding: 5px;
		text-align: center;
	}

	nav a:hover {
		opacity: 1;
	}

	nav button {
		background-color: #007006;
		border-radius: 0.4rem;
		color: white;
		text-decoration: none;
		flex-direction: row;
		margin: 1px;
		padding: 5px;
		text-align: center;
		font-size: 0.7rem;
		border: none;
		opacity: 0.8;
		font-family: system-ui,sans-serif;
		/* make the height less */
		height: 1.5rem;
		/* center in nav */
		align-self: center;
	}

	nav button:hover {
		opacity: 1;
		/* change cursor to pointer */
		cursor: pointer;
	}

	.active {
		/* background color slightly lighter than #007006 */
		background-color: #68d46d;
		color: black;
	}

	.disabled {
        background-color: #004603;
        color: rgb(138, 138, 138);
		font-size: 1rem;
		padding-left: 5px;
		padding-right: 5px;
		padding-top: 2px;
		padding-bottom: 10px;
	}

	.disabled:hover {
		/* make the cursor normal */
		cursor: default;
	}

	.pfp {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		position: absolute;
		top: 20px;
		right: 20px;
		opacity: 0.8;
		transition: 1s;
		border: 2px solid rgb(67, 255, 76);
	}

	.pfp:hover {
		opacity: 1;
	}
</style>