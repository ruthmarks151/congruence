<script lang="ts">
	import { Line } from 'svelte-chartjs';
	import 'chart.js/auto';
	import 'chartjs-adapter-moment';
	import { descriptivenessQuotient } from '$lib/sort_utils';
	import { correl, loadSave } from '$lib/saves';
	import * as R from 'ramda';
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
	let covSubject = subjects[0];
	$: covSamples = sorts
		.filter((s) => s.subject == covSubject)
		.map((s) => s.descriptivenessQuotient);

	let includedLines: [string, number][] = [];
	subjects.sort();

	$: data = {
		labels: sorts.map((s) => s.sortedOn),
		datasets: includedLines.map(([subject, statementIndex]) => ({
			label: `${subject} ${currentSave.statements[statementIndex]}`,
			fill: false,
			data: sorts
				.filter((s) => s.subject == subject)
				/* eslint-disable-@typescript-eslint/no-explicit-any --
				 * Svelte ChartJS doesn't allow string `x`s which are legitmate for date series
				 **/
				.map((s) => ({ x: s.sortedOn as any, y: s.descriptivenessQuotient[statementIndex] }))
		}))
	};
	$: console.log(data);

	const stdev = (arr: number[], usePopulation = false) => {
		const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
		return Math.sqrt(
			arr
				.reduce((acc: number[], val) => [...acc, (val - mean) ** 2], [])
				.reduce((acc, val) => acc + val, 0) /
				(arr.length - (usePopulation ? 0 : 1))
		);
	};
	$: correls = R.reduce(
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
	);
	$: pairs = R.xprod(
		R.range(0, currentSave.statements.length),
		R.range(0, currentSave.statements.length)
	);
	$: console.log(
		R.map((i) => stdev(covSamples.map((s) => s[i])), R.range(0, currentSave.statements.length))
	);
	$: correlRows = R.sortBy(
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
	);
</script>

<Line
	{data}
	width={100}
	height={50}
	options={{
		// maintainAspectRatio: false,
		plugins: {
			title: {
				text: 'Statement Descriptiveness Over Time',
				display: true
			}
		},
		scales: {
			x: {
				type: 'time',
				time: {
					tooltipFormat: 'YYYY-MM-DD'
				},
				title: {
					display: true,
					text: 'Date'
				}
			},
			y: {
				title: {
					display: true,
					text: 'Descriptiveness Percentile'
				}
			}
		}
	}}
/>

<table>
	<tr>
		<td>Statement</td>
		{#each subjects as subject}
			<td>{subject}</td>
		{/each}
	</tr>
	{#each currentSave.statements as statement, statementIndex}
		<tr>
			<td>{statement}</td>
			{#each subjects as subject}
				<td>
					<input
						type="checkbox"
						on:change={(e) => {
							if (e.currentTarget.checked)
								includedLines = [...includedLines, [subject, statementIndex]];
							else
								includedLines = includedLines.filter(
									([s, si]) => s != subject || si != statementIndex
								);
						}}
					/>
				</td>
			{/each}
		</tr>
	{/each}
</table>

<select bind:value={covSubject}>
	{#each subjects as subject}
		<option value={subject}>
			{subject}
		</option>
	{/each}
</select>

<h2>Most Correlated Statements</h2>
<ul>
	{#each correlRows as [s1, s2, r]}
		<li>
			{r}
			<ul>
				<li>{s1}</li>
				<li>{s2}</li>
			</ul>
		</li>
	{/each}
</ul>
<table style="font-size: 0.5em;">
	<tr>
		<td />
		{#each currentSave.statements as _col_statement, col_i}
			<td>{col_i + 1}</td>
		{/each}
	</tr>
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
</table>
