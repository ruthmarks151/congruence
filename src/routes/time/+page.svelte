<script lang="ts">
	import { descriptivenessQuotient } from '$lib/sort_utils';
	import { correl, loadSave, type Sort } from '$lib/saves.svelte';
	import * as R from 'ramda';
	import TokenDescription from '$lib/components/token_description.svelte';
	import * as d3 from 'd3';
	import sortStore from '$lib/sortStore.svelte';
	import { Either } from 'effect';
	import { linearRegression, correlationExplainerString } from '$lib/statistics';
	import { round } from 'effect/Number';
	import StatementTimePlot from './StatementTimePlot.svelte';

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

	const statementRegressions = $derived.by(() => {
		if (!sorts.length) return [];

		return sorts[0].statementPositions.map((_, i) =>
			subjects.reduce(
				(res, subject) => {
					const subjectSorts = sorts.filter(({ subject: s }) => subject == s);
					const linreg: ReturnType<typeof linearRegression> = linearRegression(
						subjectSorts.map(
							({ sortedOn }) =>
								(new Date(sortedOn).getTime() - new Date(subjectSorts[0].sortedOn).getTime()) /
								(1000.0 * 60 * 60 * 24)
						),
						subjectSorts.map(({ descriptivenessQuotient }) => 1.0 * descriptivenessQuotient[i])
					);
					const o = {
						...res,
						[subject]: linreg
					};
					return o;
				},
				{} as Record<string, ReturnType<typeof linearRegression>>
			)
		);
	});

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

	let sortBy: {
		key: 'statementIndex' | 'idealSlope' | 'idealR2' | 'selfSlope' | 'selfR2';
		reverse: boolean;
	} = $state({ key: 'statementIndex', reverse: false });

	const handleSortByClick = $derived((k: (typeof sortBy)['key']) => {
		if (sortBy.key == k) sortBy = { key: sortBy.key, reverse: !sortBy.reverse };
		else sortBy = { key: k, reverse: false };
	});

	const statementTable = $derived.by(() => {
		return R.sortBy(
			R.compose((v: number) => (sortBy.reverse ? -v : v), R.prop(sortBy.key)),
			statements.map((statement, i) => {
				return {
					statement,
					statementIndex: i,
					idealSlope: round(statementRegressions[i]['My Ideal Self'].slope * 365.25, 2),
					idealR2: round(statementRegressions[i]['My Ideal Self'].r2, 2),
					selfSlope: round(statementRegressions[i]['Myself'].slope * 365.25, 2),
					selfR2: round(statementRegressions[i]['Myself'].r2, 2)
				};
			})
		);
	});

	let linesToPlot = $derived(
		includedLines.map(([subject, statementIndex]) =>
			sorts
				.filter((s) => s.subject == subject)
				.map((s) => ({
					label: `${subject} ${statementIndex < statements.length ? statements[statementIndex] : String(statementIndex)}`,
					date: new Date(s.sortedOn),
					descriptiveness: s.descriptivenessQuotient[statementIndex]
				}))
		)
	);

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

	function onMousemove(event: MouseEvent) {
		const [x, y] = d3.pointer(event);
	}
</script>

<main>
	<TokenDescription title="Statements Over Time">
		<p class="body-4 desc">
			Things can be learned from how statements move over time for a given sorting subject
		</p>
	</TokenDescription>

	<StatementTimePlot
		lines={linesToPlot}
		style="width: 100%; max-width: 800px; padding: var(--space-2); margin: auto;"
	/>

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
						{correlationExplainerString(r)}
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
						{correlationExplainerString(r)}
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
				<td onclick={() => handleSortByClick('statementIndex')}>Statement</td>
				<td onclick={() => handleSortByClick('idealSlope')}>Ideal Slope</td>
				<td onclick={() => handleSortByClick('idealR2')}>Ideal R^2</td>
				<td onclick={() => handleSortByClick('selfSlope')}>Myself Slope</td>
				<td onclick={() => handleSortByClick('selfR2')}>Myself R^2</td>
				{#each subjects as subject}
					<td>{subject}</td>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each statementTable as row}
				<tr>
					<td>{row.statement}</td>
					<td>{row.idealSlope}</td>
					<td>{row.idealR2}</td>
					<td>{row.selfSlope}</td>
					<td>{row.selfR2}</td>
					{#each subjects as subject}
						<td>
							<input
								type="checkbox"
								bind:checked={
									() =>
										includedLines.findIndex(
											([sub, si]) => sub == subject && si == row.statementIndex
										) >= 0,
									(val) => {
										if (val) includedLines = [...includedLines, [subject, row.statementIndex]];
										else
											includedLines = includedLines.filter(
												([s, si]) => s != subject || si != row.statementIndex
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
