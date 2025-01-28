<script lang="ts">
	import TokenDescription from '$lib/components/token_description.svelte';
	import { browser } from '$app/environment';
	import { templates, isSave, doSave } from '$lib/saves.svelte';
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

<main>
	<TokenDescription title="Save/Load Data">
		<p class="body-4 desc">
			The working dataset is saved in the browser's local storage. Download or replace it here.
		</p>
	</TokenDescription>

	<div class="row body-4" style="justify-content: flex-start">
		<span> Load a pre-filled Template </span>
		{#each Object.entries(templates) as [name, obj]}
			<button
				class="button button-1 outline"
				on:click={() => {
					tempText = JSON.stringify(obj, null, '  ');
				}}
			>
				{name}
			</button>
		{/each}
	</div>
	<textarea bind:value={tempText} class={isValid(tempText) ? 'valid input-3' : 'invalid input-3'}
	></textarea>
	<div class="row" style="justify-content: flex-end">
		<button
			class="button button-4 filled green"
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
			class="button button-4 filled blue"
			style="color: var(--accent-9, var(--neutral-9));"
		>
			Download Backup
		</a>
	</div>
</main>

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
