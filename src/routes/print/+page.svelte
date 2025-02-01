<script lang="ts">
	import TokenDescription from '$lib/components/token_description.svelte';
	import { sortState } from '$lib/sheetLogic.svelte';

	const statementSets = $derived(sortState.all!.statementSets);

	let statements_with_index = $derived(
		(
			sortState.current?.statementSet ?? {
				statements: []
			}
		).statements.map((statement, index): [string, number] => [statement, index])
	);
	$effect(() => {
		statements_with_index.sort((a, b) => b[0].length - a[0].length);
	});
</script>

<main>
	<TokenDescription title="Printable Cards">
		<p class="body-4">
			You'll do sorts with printed out cards on a flat surface, then take a picture to import the
			results
		</p>
		<select bind:value={sortState.currentStatementSetName}>
			{#each statementSets as statementSet}
				<option value={statementSet.statementSet}>{statementSet.statementSet}</option>
			{/each}
		</select>
		<button
			class="button-3 filled blue"
			style="margin-block: var(--space-6); width: 150px;"
			onclick={() => window.print()}
		>
			Print
		</button>
	</TokenDescription>

	<div
		style="margin-top: var(--space-8)"
		class={statements_with_index.length == 100 ? 'container california' : 'container iasr'}
	>
		{#each statements_with_index as [statement, index]}
			{@const [body, notes] = statement.split('(N', 2)}
			<p>
				<img src={`src/lib/tagSVGs/tag36_11_${String(index).padStart(5, '0')}.svg`} />
				{body}
				{#if notes}
					<div>
						(N{notes}
						<br />
					</div>
				{/if}
			</p>
		{/each}
	</div>
</main>

<style lang="scss">
	@media print {
		h2 {
			display: none;
		}
	}

	img {
		image-rendering: pixelated;
	}
	div.container {
		width: 8in;
		border-collapse: collapse;
		display: grid;

		p {
			margin: 0;
			page-break-inside: avoid;
			box-sizing: border-box;
			-moz-box-sizing: border-box;
			-webkit-box-sizing: border-box;
			padding: 0.0625in;
			height: 100%;
			// width: 3.25in;
			border: 1px solid black;
			font-size: 0.8em;
			position: relative;

			div {
				position: absolute;
				padding: 0.0625in;
				bottom: 0;
				font-size: 0.5em;
				font-style: italic;
				text-align: center;
			}
		}
	}
	div.container.iasr {
		grid-template-columns: 2in 2in 2in 2in;
		grid-template-rows: repeat(16, 0.625in);
	}
	div.container.california {
		grid-template-columns: 2in 2in 2in 2in;
		grid-template-rows: repeat(5, 1.75in) repeat(20, 1.16666in);
	}

	img {
		width: 0.5in;
		height: 0.5in;
		float: right;
	}
</style>
