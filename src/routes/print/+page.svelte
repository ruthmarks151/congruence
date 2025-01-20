<script lang="ts">
	import { loadSave } from '$lib/saves';
	const currentSave = loadSave();
	let statements_with_index = currentSave.statements.map((statement, index): [string, number] => [
		statement,
		index
	]);
	statements_with_index.sort((a, b) => b[0].length - a[0].length);
</script>

<h2>Printable Cards</h2>

<div class={statements_with_index.length == 100 ? 'container california' : 'container iasr'}>
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
