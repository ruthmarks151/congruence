<script lang="ts">
	import { calcCongruence, loadSave } from '$lib/saves';
	import { descriptivenessQuotient } from '$lib/sort_utils';
	import { Scatter } from 'svelte-chartjs';
	import 'chart.js/auto';
	import { tail } from 'ramda';

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
	subjects.sort();
	let leftSubject = subjects[1];
	let rightSubject = subjects[0];

	$: leftDates = sorts.filter(({ subject }) => subject == leftSubject).map((s) => s.sortedOn);
	$: rightDates = sorts.filter(({ subject }) => subject == rightSubject).map((s) => s.sortedOn);
	let leftDate =
		sorts.filter(({ subject }) => subject == leftSubject).splice(-1)[0]?.sortedOn ?? '';
	let rightDate =
		sorts.filter(({ subject }) => subject == rightSubject).splice(-1)[0]?.sortedOn ?? '';

	$: leftSort = sorts.find(
		({ subject, sortedOn }) => subject == leftSubject && sortedOn == leftDate
	);
	$: rightSort = sorts.find(
		({ subject, sortedOn }) => subject == rightSubject && sortedOn == rightDate
	);

	$: zippedRows = currentSave.statements.map((s, i): [string, number, number] => [
		s,
		leftSort?.descriptivenessQuotient?.[i] ?? 0.5,
		rightSort?.descriptivenessQuotient?.[i] ?? 0.5
	]);
	$: zippedRows.sort((a, b) => Math.abs(b[1] - b[2]) - Math.abs(a[1] - a[2]));
	$: congruence = calcCongruence(zippedRows);

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
</script>

<div class="wrapper">
	<div>
		<select
			bind:value={leftSubject}
			on:change={() => {
				leftDate = leftDates[leftDates.length - 1];
			}}
		>
			{#each subjects as subject, i}
				<option value={subject}>
					{subject}
				</option>
			{/each}
		</select>

		<select bind:value={leftDate}>
			{#each leftDates as date}
				<option value={date}>
					{date}
				</option>
			{/each}
		</select>
	</div>
	<div>
		<select
			bind:value={rightSubject}
			on:change={() => {
				rightDate = rightDates[rightDates.length - 1];
			}}
		>
			{#each subjects as subject}
				<option value={subject}>
					{subject}
				</option>
			{/each}
		</select>

		<select bind:value={rightDate}>
			{#each rightDates as date}
				<option value={date}>
					{date}
				</option>
			{/each}
		</select>
	</div>
</div>
<h2>Congruence: {congruence}</h2>

<Scatter
	data={{
		labels: zippedRows.map(([s]) => s),
		datasets: [
			{
				label: 'Statements',
				data: zippedRows.map(([s, x, y]) => ({ x, y }))
			}
		]
	}}
	options={{
		responsive: true,
		plugins: {
			tooltip: {
				callbacks: {
					title: (data) => {
						const leftLabel =
							leftSubject == rightSubject ? new Date(leftDate).toDateString() : leftSubject;
						const rightLabel =
							leftSubject == rightSubject ? new Date(rightDate).toDateString() : rightSubject;

						return `${leftLabel}: ${data[0].parsed.x}\n${rightLabel}: ${data[0].parsed.y}\n${data
							.map((d) => d.label)
							.join('\n')}`;
					}
				}
			}
		}
	}}
/>

<table>
	<tr>
		<td>Statement</td>
		<td />
		<td>Percentile Descriptiveness {leftSubject == rightSubject ? leftDate : leftSubject}</td>
		<td>Percentile Descriptiveness {leftSubject == rightSubject ? rightDate : rightSubject}</td>
	</tr>
	{#each zippedRows as [statement, leftScore, rightScore]}
		<tr>
			<td>{statement}</td>
			<td>{iconFor(leftScore, rightScore)}</td>
			<td>{leftScore}</td>
			<td>{rightScore}</td>
		</tr>
	{/each}
</table>

<style lang="scss">
	div.wrapper {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}
</style>
