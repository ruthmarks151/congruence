<script lang="ts">
	import TokenDescription from '$lib/components/token_description.svelte';
	import { asTaggedUnion } from '$lib/effect_utils';
	import { calcCongruence } from '$lib/saves.svelte';
	import { descriptivenessQuotient } from '$lib/sort_utils';
	import sortStore from '$lib/sortStore.svelte';

	let leftSubject = $state(
		sortStore.current.pipe(
			Either.map((data) => data.subjects[1]),
			Either.getOrUndefined
		) ?? ''
	);
	let rightSubject = $state(
		sortStore.current.pipe(
			Either.map((data) => data.subjects[0]),
			Either.getOrUndefined
		) ?? ''
	);

	let leftDate = $state(
		sortStore.current.pipe(
			Either.map(
				(data) => data.sorts.filter(({ subject }) => subject == leftSubject).splice(-1)[0]?.sortedOn
			),
			Either.getOrUndefined
		) ?? ''
	);
	let rightDate = $state(
		sortStore.current.pipe(
			Either.map(
				(data) =>
					data.sorts.filter(({ subject }) => subject == rightSubject).splice(-1)[0]?.sortedOn
			),
			Either.getOrUndefined
		) ?? ''
	);

	const current = $derived(
		sortStore.current.pipe(
			Either.map(({ sorts, subjects }) => ({
				leftDates: sorts.filter(({ subject }) => subject == leftSubject).map((s) => s.sortedOn),
				rightDates: sorts.filter(({ subject }) => subject == rightSubject).map((s) => s.sortedOn),
				subjects
			})),
			Either.merge
		)
	);

	let zippedRows = $derived(
		sortStore.current.pipe(
			Either.map((current) => {
				const augmentedSorts = current.sorts.map((s) => ({
					...s,
					descriptivenessQuotient: descriptivenessQuotient(s.statementPositions)
				}));

				const leftSort = augmentedSorts.find(
					({ subject, sortedOn }) => subject == leftSubject && sortedOn == leftDate
				);
				const rightSort = augmentedSorts.find(
					({ subject, sortedOn }) => subject == rightSubject && sortedOn == rightDate
				);

				let zippedRows = (current.statementSet.statements ?? []).map(
					(s, i): [string, number, number] => [
						s,
						leftSort ? leftSort.descriptivenessQuotient[i] : 0.5,
						rightSort ? rightSort.descriptivenessQuotient[i] : 0.5
					]
				);
				zippedRows.sort((a, b) => Math.abs(b[1] - b[2]) - Math.abs(a[1] - a[2]));
				return zippedRows;
			})
		)
	);

	let congruence = $derived(zippedRows.pipe(Either.map(calcCongruence)));

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

	const wordFor = (percentile: number) => {
		const descriptiveness = [
			'Extremely Does Not Describe',
			'Very Much Does Not Describe',
			'Does Not Describe',
			'Somewhat Does Not Describe',
			'Slightly Does Not Describe',
			'Neither Describes nor Does Not Describe',
			'Slightly Describes',
			'Somewhat Describes',
			'Describes',
			'Very Much Describes',
			'Extremely Describes'
		];
		return descriptiveness.find((_, i) => (i + 1) / descriptiveness.length > percentile);
	};

	import * as Plot from '@observablehq/plot';
	import { Either } from 'effect';

	let div: HTMLElement | undefined;

	$effect(() => {
		Either.all([zippedRows]).pipe(
			Either.match({
				onLeft(left) {
					div?.firstChild?.remove(); // remove old chart, if any
					div?.append(`${left}`);
				},
				onRight([zippedRows]) {
					const shouldLabelWithDates = leftSubject == rightSubject;
					const leftLabel = shouldLabelWithDates ? new Date(leftDate).toDateString() : leftSubject;
					const rightLabel = shouldLabelWithDates
						? new Date(rightDate).toDateString()
						: rightSubject;

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
															`${wordFor(data[0].x)} ${leftLabel}\n${wordFor(data[0].y)} ${rightLabel}\n\n` +
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
				}
			})
		);
	});
</script>

<main>
	<TokenDescription title="Compare Sorts">
		<p class="body-4 desc">
			Compare the results of two sorts. Assess congruence, and see the most/least congruent items.
		</p>

		<div class="wrapper">
			<div>
				{#if !Array.isArray(current)}
					<label class="label-4">"Left" sort</label><br />
					<select
						class="input-2"
						bind:value={leftSubject}
						onchange={() => {
							leftDate = current.leftDates[current.leftDates.length - 1];
						}}
					>
						{#each current.subjects as subject, i}
							<option value={subject}>
								{subject}
							</option>
						{/each}
					</select>

					<select bind:value={leftDate} class="input-2">
						{#each current.leftDates as date}
							<option value={date}>
								{date}
							</option>
						{/each}
					</select>
				{/if}
			</div>

			<div>
				{#if !Array.isArray(current)}
					<label class="label-4">"Right" sort</label><br />
					<select
						class="input-2"
						bind:value={rightSubject}
						onchange={() => {
							rightDate = current.rightDates[current.rightDates.length - 1];
						}}
					>
						{#each current.subjects as subject}
							<option value={subject}>
								{subject}
							</option>
						{/each}
					</select>

					<select class="input-2" bind:value={rightDate}>
						{#each current.rightDates as date}
							<option value={date}>
								{date}
							</option>
						{/each}
					</select>
				{/if}
			</div>
		</div>
	</TokenDescription>
	<h2 class="heading-2">Congruence: {congruence.pipe(Either.getOrUndefined)}</h2>

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
			{#if Either.isRight(zippedRows)}
				{#each Either.getOrThrow(zippedRows) as [statement, leftScore, rightScore]}
					<tr>
						<td>{statement}</td>
						<td title={String(leftScore)}>{wordFor(leftScore)}</td>
						<td style="text-align: center; padding: 0 var(--space-2)"
							>{iconFor(leftScore, rightScore)}</td
						>
						<td title={String(rightScore)}>{wordFor(rightScore)}</td>
					</tr>
				{/each}
			{:else}
				<tr>
					<td colspan="4">{Either.getLeft(zippedRows)}</td>
				</tr>
			{/if}
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
