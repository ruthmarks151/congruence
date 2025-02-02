<script lang="ts">
	import * as R from 'ramda';

	import { descriptivenessQuotient } from '$lib/sort_utils';
	import { calcCongruence, type Sort } from '$lib/saves.svelte';

	let leftSubject = $state(sortState.current.subjects[1]);
	let rightSubject = $state(sortState.current.subjects[0]);

	let points = $derived(
		R.reduce<
			Sort & { descriptivenessQuotient: number[] },
			{
				lastLeft: (Sort & { descriptivenessQuotient: number[] }) | null;
				lastRight: (Sort & { descriptivenessQuotient: number[] }) | null;
				points: { x: Date; y: number }[];
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
					zippedRows = (sortState.current.statementSet?.statements ?? []).map(
						(s, i): [string, number, number] => [s, leftDq[i], rightDq[i]]
					);
				} else {
					zippedRows = undefined;
				}

				const point = zippedRows
					? {
							x: new Date(el.sortedOn),
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
				if (beforePoint.x.toDateString() == point.x.toDateString()) {
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
				...sortState.current.sorts
					.filter((s) => s.subject == leftSubject || s.subject == rightSubject)
					.map((s) => ({
						...s,
						descriptivenessQuotient: descriptivenessQuotient(s.statementPositions)
					}))
			])
		).points
	);

	import * as Plot from '@observablehq/plot';
	import * as d3 from 'd3';
	import TokenDescription from '$lib/components/token_description.svelte';
	import { sortState } from '$lib/sheetLogic.svelte';

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
				marks: [
					Plot.ruleY([0]),
					Plot.ruleX([points[0].x]),
					Plot.lineY(points, {
						x: {
							label: 'Date',
							value: 'x',
							transform: (dates: { x: Date }[]) =>
								dates.map((d) => {
									d.x.setUTCHours(0, 0, 0, 0);
									return d.x;
								})
						},
						y: { label: 'Congruence Coefficient', value: 'y' },
						marker: true,
						stroke: 'var(--blue-5)',
						channels: { label: 'label' },
						tip: true
					})
				]
			})
		); // add the new chart
	});
</script>

<main>
	<TokenDescription title="Congruence Plot">
		<p class="body-4 desc">
			Compare the congruence of two sorting subjects (like the self and ideal) over time
		</p>

		<div style="display: grid; grid-template-columns: 1fr 1fr; column-gap: var(--space-1);">
			<div>
				<select class="input-2" bind:value={leftSubject}>
					{#each sortState.current.subjects as subject}
						<option value={subject}>
							{subject}
						</option>
					{/each}
				</select>
			</div>
			<div>
				<select class="input-2" bind:value={rightSubject}>
					{#each sortState.current.subjects as subject}
						<option value={subject}>
							{subject}
						</option>
					{/each}
				</select>
			</div>
		</div>
	</TokenDescription>

	<div
		bind:this={div}
		role="img"
		style="width: 100%; max-width: 1024px; padding: var(--space-2);"
	></div>
</main>
