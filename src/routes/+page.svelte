<script lang="ts">
	import { browser } from '$app/environment';
	import { templates, isSave, doSave } from '$lib/saves';
	let tempText = (browser && window.localStorage.getItem('WorkingSave')) || '';
	const parseSave = (text: string): null | Save => {
		let parsedObj;
		try {
			parsedObj = JSON.parse(text);
		} catch (error) {
			return null;
		}
		return isSave(parsedObj) ? parsedObj : null;
	};
	const isValid = (text: string) => {
		return parseSave(text) != null;
	};
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>Q-Sort 2</h1>
	<div class="row" style="justify-content: flex-start">
		<span> Load Template </span>
		{#each Object.entries(templates) as [name, obj]}
			<button
				on:click={() => {
					tempText = JSON.stringify(obj, null, '  ');
				}}
			>
				{name}
			</button>
		{/each}
	</div>
	<textarea bind:value={tempText} class={isValid(tempText) ? 'valid' : 'invalid'} />
	<div class="row" style="justify-content: flex-end">
		<button
			disabled={!isValid(tempText)}
			on:click={() => {
				const maybeSave = parseSave(tempText);
				if (maybeSave) doSave(maybeSave);
			}}
		>
			Set Working Save
		</button>
		<a
			href={'data:text/plain;charset=utf-8,' + encodeURIComponent(tempText)}
			download="Backup.json"
		>
			Download Backup
		</a>
	</div>
</section>

<style lang="scss">
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	textarea {
		width: 100%;
		height: 20em;
		max-width: 1024px;
		margin: 4px 0;
		border: 2px solid;
		&.valid {
			border-color: green;
		}
		&.invalid {
			border-color: red;
		}
	}

	div.row {
		width: 100%;
		display: flex;
		flex-direction: row;
		gap: 4px;
		align-items: center;
	}
</style>
