<script lang="ts">
	import { descriptivenessQuotient } from '$lib/sort_utils';
	import { correl, loadSave, type Sort } from '$lib/saves.svelte';
	import * as R from 'ramda';
	import TokenDescription from '$lib/components/token_description.svelte';
	import * as Plot from '@observablehq/plot';
	import * as d3 from 'd3';
	import sortStore from '$lib/sortStore.svelte';
	import { Either } from 'effect';

	const sorts = $derived(
		sortStore.current.pipe(
			Either.map(({ sorts }) =>
				R.sortBy(({ sortedOn }: Sort) => sortedOn)(sorts).map((s) => ({
					...s,
					descriptivenessQuotient: descriptivenessQuotient(s.statementPositions)
				}))
			),
			Either.getOrUndefined
		) ?? []
	);

	const subjects = $derived([...new Set(sorts.map((s) => s.subject))]);
	let covSubject = $state(subjects[0]);
	let covSamples = $derived(
		sorts.filter((s) => s.subject == covSubject).map((s) => s.descriptivenessQuotient)
	);

	let includedLines: [string, number][] = $state([
		['My Ideal Self', 0],
		['My Ideal Self', 42]
	]);
	subjects.sort();

	const statements = $derived.by(() => {
		const statements =
			sortStore.current.pipe(
				Either.map(({ statementSet }) => statementSet.statements),
				Either.getOrUndefined
			) ?? [];
		return statements;
	});

	let data = $derived({
		labels: sorts.map((s) => s.sortedOn),
		datasets: includedLines.map(([subject, statementIndex]) => ({
			data: sorts
				.filter((s) => s.subject == subject)
				.map((s) => ({
					label: `${subject} ${statementIndex < statements.length ? statements[statementIndex] : String(statementIndex)}`,
					x: new Date(s.sortedOn),
					y: s.descriptivenessQuotient[statementIndex]
				}))
		}))
	});

	const statementCount = $derived(
		sortStore.current.pipe(
			Either.map(({ statementSet }) => statementSet.statements.length),
			Either.getOrUndefined
		) ?? 0
	);

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
					R.range(0, statementCount)
				)
			}),
			{} as Record<number, Record<number, number>>,
			R.range(0, statementCount)
		)
	);
	let pairs = $derived(R.xprod(R.range(0, statementCount), R.range(0, statementCount)));

	let correlRows = $derived.by(() => {
		const rows = R.sortBy(
			(row: [string, string, number]) => -Math.abs(row[2]),
			R.filter(
				(row: [string, string, number]) => Math.abs(row[2]) > 0.5,
				R.map(
					(row: [number, number]): [string, string, number] => [
						row[0] < statements.length ? statements[row[0]] : String(row[0]),
						row[1] < statements.length ? statements[row[1]] : String(row[1]),
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
		return rows;
	});

	const correlationString = (r: number) => {
		const dir = r > 0 ? 'positive' : 'negative';
		if (Math.abs(r) >= 0.9) {
			return `Very strong ${dir} correlation`;
		} else if (Math.abs(r) >= 0.75) {
			return `Strong ${dir} correlation`;
		} else if (Math.abs(r) >= 0.45) {
			return `Moderate ${dir} correlation`;
		} else if (Math.abs(r) >= 0.15) {
			return `Weak ${dir} correlation`;
		} else {
			return `Near zero correlation`;
		}
	};

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
		style="width: 100%; max-width: 800px; padding: var(--space-2); margin: auto;"
	></div>

	<h2 class="heading-4" style="display: inline;">Examine Statement Correlations For &nbsp;</h2>
	<select class="input-1" bind:value={covSubject}>
		{#each subjects as subject}
			<option value={subject}>
				{subject}
			</option>
		{/each}
	</select>

	<div
		style="display: flex; flex-direction: row; flex-wrap: wrap; gap: var(--space-4); grid-auto-flow: column;"
	>
		<div
			style="flex-basis: 0;
    flex-grow: 1;
    min-width: 350px;
    margin: auto;
    margin-top: 0;"
		>
			<h3 class="heading-3">Most Correlated Statements</h3>
			<ul class="body-4">
				{#each correlRows.filter(([, , r]) => r > 0) as [s1, s2, r]}
					<li>
						{correlationString(r)}
						{Math.round(r * 100) / 100}
						<button
							class="button-1 outline blue"
							onclick={() => {
								debugger;
								includedLines = [
									[covSubject, statements.indexOf(s1) ?? 0],
									[covSubject, statements.indexOf(s2) ?? 0]
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
		<div
			style="flex-basis: 0;
    flex-grow: 1;
    min-width: 350px;
    margin: auto;
    margin-top: 0;"
		>
			<h3 class="heading-3">Most Anti-Correlated Statements</h3>
			<ul class="body-4">
				{#each correlRows.filter(([, , r]) => r < 0) as [s1, s2, r]}
					<li>
						{correlationString(r)}
						{Math.round(r * 100) / 100}
						<button
							class="button-1 outline blue"
							onclick={() => {
								includedLines = [
									[covSubject, statements.indexOf(s1) ?? 0],
									[covSubject, statements.indexOf(s2) ?? 0]
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
			{#each statements as statement, statementIndex}
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
					{#each statements as _col_statement, col_i}
						<td>{col_i + 1}</td>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each statements as row_statement, row_i}
					<tr>
						<td>{row_i + 1}</td>
						{#each statements as col_statement, col_i}
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
