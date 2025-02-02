<script lang="ts">
	import TokenDescription from '$lib/components/token_description.svelte';
	import { calcCongruence } from '$lib/saves.svelte';
	import { descriptivenessQuotient } from '$lib/sort_utils';
	import * as R from 'ramda';
	import { sortState } from '$lib/sheetLogic.svelte';

	let sorts = $derived([
		...sortState.current.sorts.map((s) => ({
			...s,
			descriptivenessQuotient: descriptivenessQuotient(s.statementPositions)
		}))
	]);
	let leftSubject = $state(sortState.current.subjects[0]);
	let rightSubject = $state(sortState.current.subjects[1]);

	let leftDates = $derived(
		sortState.current.sorts.filter(({ subject }) => subject == leftSubject).map((s) => s.sortedOn)
	);
	let rightDates = $derived(
		sortState.current.sorts.filter(({ subject }) => subject == rightSubject).map((s) => s.sortedOn)
	);
	let leftDate = $state(
		sortState.current.sorts.filter(({ subject }) => subject == leftSubject).splice(-1)[0]
			?.sortedOn ?? ''
	);
	let rightDate = $state(
		sortState.current.sorts.filter(({ subject }) => subject == rightSubject).splice(-1)[0]
			?.sortedOn ?? ''
	);

	let leftSort = $derived(
		sorts.find(({ subject, sortedOn }) => subject == leftSubject && sortedOn == leftDate)
	);
	let rightSort = $derived(
		sorts.find(({ subject, sortedOn }) => subject == rightSubject && sortedOn == rightDate)
	);

	let zippedRows = $derived(
		(() => {
			let zippedRows = (sortState.current?.statementSet?.statements ?? []).map(
				(s, i): [string, number, number] => [
					s,
					leftSort?.descriptivenessQuotient?.[i] ?? 0.5,
					rightSort?.descriptivenessQuotient?.[i] ?? 0.5
				]
			);
			zippedRows.sort((a, b) => Math.abs(b[1] - b[2]) - Math.abs(a[1] - a[2]));
			return zippedRows;
		})()
	);
	$effect(() => {});
	let congruence = $derived(calcCongruence(zippedRows));

	const iconFor = (leftScore: number, rightScore: number) => {
		const movement = rightScore - leftScore;
		if (movement > 0.5) {
			return '⇈';
		} else if (movement > 0.25) {
			return '↑';
		} else if (movement > -0.25) {
			return '';
		} else if (movement > -0.5) {
			return '↓';
		} else {
			return '⇊';
		}
	};

	import * as Plot from '@observablehq/plot';
	import * as d3 from 'd3';

	let div: HTMLElement | undefined;

	$effect(() => {
		const leftLabel = leftSubject == rightSubject ? new Date(leftDate).toDateString() : leftSubject;
		const rightLabel =
			leftSubject == rightSubject ? new Date(rightDate).toDateString() : rightSubject;

		div?.firstChild?.remove(); // remove old chart, if any
		div?.append(
			Plot.plot({
				style: {
					width: '100%'
				},
				marks: [
					Plot.ruleY([0]),
					Plot.ruleX([0]),
					Plot.line(
						[
							[0, 0],
							[1, 1]
						],
						{ stroke: 'var(--neutral-6)' }
					),
					Plot.dot(
						zippedRows.map(([s, x, y]) => ({ statement: s, x, y })),
						{
							x: {
								label: leftLabel,
								value: 'x'
							},
							y: {
								label: rightLabel,
								value: 'y'
							},
							r: {
								transform: (data: { statement: string; x: number; y: number }[]) => {
									return data.map(
										({ x, y }) => data.filter((d) => d.x == x && d.y == y).length ** 2
									);
									// return `
								}
							},
							stroke: 'var(--blue-5)',
							channels: {
								title: {
									label: 'Statements',
									transform: (data: { statement: string; x: number; y: number }[]) => {
										return data.map(
											({ statement, x, y }) =>
												`${leftLabel}: ${data[0].x} ${rightLabel}: ${data[0].y}\n\n` +
												data
													.filter((d) => d.x == x && d.y == y)
													.map((d) => d.statement)
													.join('\n')
										);
										// return `
									}
								}
							},
							tip: true
						}
					)
				]
			})
		); // add the new chart
	});
</script>

<main>
	<TokenDescription title="Compare Sorts">
		<p class="body-4 desc">
			Compare the results of two sorts. Assess congruence, and see the most/least congruent items.
		</p>

		<div class="wrapper">
			<div>
				<label class="label-4">"Left" sort</label><br />
				<select
					class="input-2"
					bind:value={leftSubject}
					on:change={() => {
						leftDate = leftDates[leftDates.length - 1];
					}}
				>
					{#each sortState.current?.subjects as subject, i}
						<option value={subject}>
							{subject}
						</option>
					{/each}
				</select>

				<select bind:value={leftDate} class="input-2">
					{#each leftDates as date}
						<option value={date}>
							{date}
						</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="label-4">"Right" sort</label><br />
				<select
					class="input-2"
					bind:value={rightSubject}
					on:change={() => {
						rightDate = rightDates[rightDates.length - 1];
					}}
				>
					{#each sortState.current?.subjects as subject}
						<option value={subject}>
							{subject}
						</option>
					{/each}
				</select>

				<select class="input-2" bind:value={rightDate}>
					{#each rightDates as date}
						<option value={date}>
							{date}
						</option>
					{/each}
				</select>
			</div>
		</div>
	</TokenDescription>
	<h2 class="heading-2">Congruence: {congruence}</h2>

	<div
		bind:this={div}
		role="img"
		style="width: 100%; max-width: 1024px; padding: var(--space-8);"
	></div>

	<table class="body-4 greytable">
		<thead>
			<tr class="heading-1">
				<td></td>
				<td colspan="3">Percentile Descriptiveness </td>
			</tr>
			<tr class="heading-2">
				<td>Statement</td>
				<td>{leftSubject == rightSubject ? leftDate : leftSubject}</td>
				<td></td>
				<td>{leftSubject == rightSubject ? rightDate : rightSubject}</td>
			</tr>
		</thead>
		<tbody>
			{#each zippedRows as [statement, leftScore, rightScore]}
				<tr>
					<td>{statement}</td>
					<td>{leftScore}</td>
					<td style="text-align: center; padding: 0 var(--space-2)"
						>{iconFor(leftScore, rightScore)}</td
					>
					<td>{rightScore}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>

<style lang="scss">
	div.wrapper {
		display: grid;
		grid-template-columns: repeat(auto-fill, min(450px, 100%));
		margin-top: var(--space-6);
		margin-bottom: var(--space-6);
		row-gap: var(--space-2);
	}

	.greytable {
		border-collapse: collapse;
		border: none;
		tbody tr {
			border-color: var(--neutral-8);
			border-top: 1px solid;
		}
	}
</style>
