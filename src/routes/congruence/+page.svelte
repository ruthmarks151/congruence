<script lang="ts">
	import * as R from 'ramda';
	import { Line } from 'svelte-chartjs';
	import 'chart.js/auto';
	import 'chartjs-adapter-moment';
	import { descriptivenessQuotient } from '$lib/sort_utils';
	import { calcCongruence, loadSave } from '$lib/saves';
	import type { Sort } from '$lib/saves';
	const currentSave = loadSave();

	let subjects = [...new Set(currentSave.sorts.map((s) => s.subject))];
	subjects.sort();
	let leftSubject = subjects[1];
	let rightSubject = subjects[0];

	$: points = R.reduce<
		Sort & { descriptivenessQuotient: number[] },
		{
			lastLeft: (Sort & { descriptivenessQuotient: number[] }) | null;
			lastRight: (Sort & { descriptivenessQuotient: number[] }) | null;
			points: { x: string; y: number }[];
		}
	>(
		({ lastLeft, lastRight, points }, el) => {
			if (el.subject == leftSubject) {
				lastLeft = el;
			}
			if (el.subject == rightSubject) {
				lastRight = el;
			}

			let zippedRows: undefined | [string, number, number][];
			if (lastLeft && lastRight) {
				const leftDq = lastLeft.descriptivenessQuotient;
				const rightDq = lastRight.descriptivenessQuotient;
				zippedRows = currentSave.statements.map((s, i): [string, number, number] => [
					s,
					leftDq[i],
					rightDq[i]
				]);
			} else {
				zippedRows = undefined;
			}

			const point = zippedRows
				? {
						x: el.sortedOn,
						y: calcCongruence(zippedRows)
				  }
				: undefined;
			if (!point) {
				return { lastLeft, lastRight, points: points };
			}
			if (!points.length) {
				return { lastLeft, lastRight, points: [point] };
			}
			const beforePoint = points[points.length - 1];
			if (beforePoint.x.split('T')[0] == point.x.split('T')[0]) {
				return { lastLeft, lastRight, points: [...points.slice(0, -1), point] };
			}
			return { lastLeft, lastRight, points: [...points, point] };
		},
		{
			lastLeft: null,
			lastRight: null,
			points: []
		},
		R.sortBy(R.prop('sortedOn'), [
			...currentSave.sorts
				.filter((s) => s.subject == leftSubject || s.subject == rightSubject)
				.map((s) => ({
					...s,
					descriptivenessQuotient: descriptivenessQuotient(s.statementPositions)
				}))
		])
	).points;

	$: data = {
		labels: points.map((s) => s.x),
		datasets: [
			{
				label: `${leftSubject}-${rightSubject} Correlation`,
				fill: false,
				/* eslint-disable-@typescript-eslint/no-explicit-any --
				 * Svelte ChartJS doesn't allow string `x`s which are legitmate for date series
				 **/
				data: points as unknown as { x: any; y: number }[]
			}
		]
	};
	$: console.log(data);
</script>

<Line
	{data}
	width={100}
	height={50}
	options={{
		// maintainAspectRatio: false,
		plugins: {
			title: {
				text: 'Congruence Over Time',
				display: true
			},
			tooltip: {
				mode: 'index'
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

<div class="wrapper">
	<div>
		<select bind:value={leftSubject}>
			{#each subjects as subject}
				<option value={subject}>
					{subject}
				</option>
			{/each}
		</select>
	</div>
	<div>
		<select bind:value={rightSubject}>
			{#each subjects as subject}
				<option value={subject}>
					{subject}
				</option>
			{/each}
		</select>
	</div>
</div>
