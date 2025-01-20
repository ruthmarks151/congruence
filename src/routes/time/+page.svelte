<script lang="ts">
	//import { Line } from 'svelte-chartjs';
	import 'chart.js/auto';
	import 'chartjs-adapter-moment';
	import { descriptivenessQuotient } from '$lib/sort_utils';
	import { correl, loadSave } from '$lib/saves';
	import * as R from 'ramda';
	import TokenDescription from '$lib/components/token_description.svelte';
	const currentSave = loadSave();

	let sorts = [
		...currentSave.sorts.map((s) => ({
			...s,
			descriptivenessQuotient: descriptivenessQuotient(s.statementPositions)
		}))
	];
	sorts.sort(({ sortedOn: a }, { sortedOn: b }) => {
		if (a < b) {
			return -1;
		}
		if (a > b) {
			return 1;
		}
		// names must be equal
		return 0;
	});
	let subjects = [...new Set(sorts.map((s) => s.subject))];
	let covSubject = $state(subjects[0]);
	let covSamples = $derived(
		sorts.filter((s) => s.subject == covSubject).map((s) => s.descriptivenessQuotient)
	);

	let includedLines: [string, number][] = $state([
		['ideal', 0],
		['ideal', 42]
	]);
	subjects.sort();

	let data = $derived({
		labels: sorts.map((s) => s.sortedOn),
		datasets: includedLines.map(([subject, statementIndex]) => ({
			data: sorts
				.filter((s) => s.subject == subject)
				.map((s) => ({
					label: `${subject} ${currentSave.statements[statementIndex]}`,
					x: new Date(s.sortedOn),
					y: s.descriptivenessQuotient[statementIndex]
				}))
		}))
	});

	const stdev = (arr: number[], usePopulation = false) => {
		const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
		return Math.sqrt(
			arr
				.reduce((acc: number[], val) => [...acc, (val - mean) ** 2], [])
				.reduce((acc, val) => acc + val, 0) /
				(arr.length - (usePopulation ? 0 : 1))
		);
	};
	let correls = $derived(
		R.reduce(
			(acc, row_i) => ({
				...acc,
				[row_i]: R.reduce(
					(acc, col_i) => ({
						...acc,
						[col_i]: correl(
							covSamples.map((s) => s[row_i]),
							covSamples.map((s) => s[col_i])
						)
					}),
					{} as Record<number, number>,
					R.range(0, currentSave.statements.length)
				)
			}),
			{} as Record<number, Record<number, number>>,
			R.range(0, currentSave.statements.length)
		)
	);
	let pairs = $derived(
		R.xprod(R.range(0, currentSave.statements.length), R.range(0, currentSave.statements.length))
	);

	let correlRows = $derived(
		R.sortBy(
			(row: [string, string, number]) => -Math.abs(row[2]),
			R.filter(
				(row: [string, string, number]) => Math.abs(row[2]) > 0.5,
				R.map(
					(row: [number, number]): [string, string, number] => [
						currentSave.statements[row[0]],
						currentSave.statements[row[1]],
						correls[row[0]][row[1]]
					],
					R.filter(
						(row: [number, number]) =>
							row[0] < row[1] &&
							stdev(covSamples.map((s) => s[row[0]])) > 0.11 &&
							stdev(covSamples.map((s) => s[row[1]])) > 0.11,
						pairs
					)
				)
			)
		)
	);

	import * as Plot from '@observablehq/plot';
	import * as d3 from 'd3';

	let div: HTMLElement | undefined;

	function onMousemove(event: MouseEvent) {
		const [x, y] = d3.pointer(event);
	}

	$effect(() => {
		div?.firstChild?.remove(); // remove old chart, if any
		div?.append(
			Plot.plot({
				style: {
					width: '100%'
				},
				color: { legend: true },
				marks: [
					Plot.ruleY([0]),
					Plot.ruleX([data?.datasets?.[0]?.data?.[0]?.x ?? 0]),
					...data.datasets.map((ds) =>
						Plot.lineY(ds.data, {
							x: {
								label: 'Date',
								value: 'x',
								transform: (dates: { x: Date }[]) =>
									dates.map((d) => {
										d.x.setUTCHours(0, 0, 0, 0);
										return d.x;
									})
							},
							y: { label: 'Descriptiveness Percentile', value: 'y' },
							stroke: 'label',
							title: 'label',
							marker: true
						})
					)
				]
			})
		); // add the new chart
	});
</script>

<main>
	<TokenDescription title="Statements Over Time">
		<p class="body-4 desc">
			Things can be learned from how statements move over time for a given sorting subject
		</p>
	</TokenDescription>

	<div
		bind:this={div}
		role="img"
		style="width: 100%; max-width: 800px; padding: var(--space-8); margin: auto;"
	></div>

	<h2 class="heading-4" style="display: inline;">Examine Statement Correlations For &nbsp;</h2>
	<select class="input-1" bind:value={covSubject}>
		{#each subjects as subject}
			<option value={subject}>
				{subject}
			</option>
		{/each}
	</select>

	<div style="display: grid; grid-template-columns: 1fr 1fr; column-gap: var(--space-4)">
		<h3 class="heading-3" style="grid-area: 1 / 1 / 1 / 1">Most Correlated Statements</h3>
		<ul class="body-4" style="grid-area: 2 / 1 / 2 / 1">
			{#each correlRows.filter(([, , r]) => r > 0) as [s1, s2, r]}
				<li>
					{r}
					<button
						class="button-1 outline blue"
						onclick={() => {
							includedLines = [
								[covSubject, currentSave.statements.indexOf(s1)],
								[covSubject, currentSave.statements.indexOf(s2)]
							];
						}}>Plot</button
					>
					<ul>
						<li>{s1}</li>
						<li>{s2}</li>
					</ul>
				</li>
			{/each}
		</ul>
		<h3 class="heading-3" style="grid-area: 1 / 2 / 1 / 2">Most Anti-Correlated Statements</h3>
		<ul class="body-4" style="grid-area: 2 / 2 / 2 / 2">
			{#each correlRows.filter(([, , r]) => r < 0) as [s1, s2, r]}
				<li>
					{r}
					<button
						class="button-1 outline blue"
						onclick={() => {
							includedLines = [
								[covSubject, currentSave.statements.indexOf(s1)],
								[covSubject, currentSave.statements.indexOf(s2)]
							];
						}}>Plot</button
					>
					<ul>
						<li>{s1}</li>
						<li>{s2}</li>
					</ul>
				</li>
			{/each}
		</ul>
	</div>

	<table>
		<thead>
			<tr class="heading-3">
				<td>Statement</td>
				{#each subjects as subject}
					<td>{subject}</td>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each currentSave.statements as statement, statementIndex}
				<tr>
					<td>{statement}</td>
					{#each subjects as subject}
						<td>
							<input
								type="checkbox"
								bind:checked={
									() =>
										includedLines.findIndex(
											([sub, si]) => sub == subject && si == statementIndex
										) >= 0,
									(val) => {
										if (val) includedLines = [...includedLines, [subject, statementIndex]];
										else
											includedLines = includedLines.filter(
												([s, si]) => s != subject || si != statementIndex
											);
									}
								}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	<div style="overflow: scroll; max-width: 100%; width: 100%;">
		<table style="font-size: 0.5em;">
			<thead>
				<tr>
					<td></td>
					{#each currentSave.statements as _col_statement, col_i}
						<td>{col_i + 1}</td>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each currentSave.statements as row_statement, row_i}
					<tr>
						<td>{row_i + 1}</td>
						{#each currentSave.statements as col_statement, col_i}
							{@const cov = correls[row_i][col_i]}
							<td>
								<div
									title={`${cov * 100}\n${row_statement}\n${col_statement}`}
									style={`background-color: hsl(${cov > 0 ? 135 : 0} 100% 50% / ${Math.abs(cov * 100)}%)`}
								>
									{Math.round(cov * 100)}%
								</div>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</main>
