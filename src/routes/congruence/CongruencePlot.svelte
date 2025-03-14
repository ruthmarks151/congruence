<script lang="ts">
	import { Either } from 'effect';
	import * as Plot from '@observablehq/plot';
	import * as d3 from 'd3';
	import { start } from 'effect/ScheduleIntervals';
	import { withConsoleError } from 'effect/Logger';

	interface Props {
		points: { x: Date; y: number }[];
		therapyRanges: [Date, Date][];
		style?: string;
	}

	let { points, therapyRanges, style = '' }: Props = $props();
	let div: HTMLElement | undefined;

	const startDate =
		therapyRanges[0] && therapyRanges[0][0].getTime() < points[0].x.getTime()
			? therapyRanges[0][0]
			: points[0].x;

	$effect(() => {
		div?.firstChild?.remove(); // remove old chart, if any
		div?.append(
			Plot.plot({
				style: {
					width: '100%'
				},

				color: {
					legend: true,
					domain: ['Time In Therapy', 'Congruence Coefficient'],
					range: ['rgb(130,195,177)', 'rgb(76,104,201)']
				},
				marks: [
					Plot.areaY(
						therapyRanges.flatMap(([start, end]) => [
							{ x: start, y: 0, type: 'Time In Therapy' },
							{ x: start, y: 1, type: 'Time In Therapy' },
							{ x: end, y: 1, type: 'Time In Therapy' },
							{ x: end, y: 0, type: 'Time In Therapy' }
						]),
						{
							x: 'x',
							y: 'y',
							fill: 'type',
							// fill: 'rgb(130,195,177)',
							fillOpacity: 1
						}
					),
					Plot.ruleY([0]),
					Plot.ruleX([startDate]),
					Plot.lineY(
						points.map((p) => ({ ...p, type: 'Congruence Coefficient' })),
						{
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
							marker: 'dot',
							stroke: 'type',
							// stroke: 'rgb(76,104,201)',
							channels: { label: 'label' },
							tip: true
						}
					)
				]
			})
		);
	});
</script>

<div bind:this={div} role="img" {style}></div>
