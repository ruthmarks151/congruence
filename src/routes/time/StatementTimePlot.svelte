<script lang="ts">
	import * as Plot from '@observablehq/plot';
	import * as R from 'ramda';

	interface Props {
		style: string;
		lines: {
			label: string;
			date: Date;
			descriptiveness: number;
		}[][];
	}
	const { style, lines }: Props = $props();

	let div: HTMLElement | undefined;

	$effect(() => {
		console.log(lines);
		const leftAxis = lines
			.map((l) => (l.length ? l[0].date : new Date()))
			.reduce(R.min<Date>, new Date());

		div?.firstChild?.remove(); // remove old chart, if any
		div?.append(
			Plot.plot({
				style: {
					width: '100%'
				},
				color: { legend: true },
				marks: [
					Plot.ruleY([0]),
					Plot.ruleX([leftAxis]),
					...lines.map((line) =>
						Plot.lineY(line, {
							x: {
								label: 'Date',
								value: 'date',
								transform: (points: { date: Date }[]) =>
									points.map((point) => {
										point.date.setUTCHours(0, 0, 0, 0);
										return point.date;
									})
							},
							y: { label: 'Descriptiveness Percentile', value: 'descriptiveness' },
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

<div bind:this={div} role="img" {style}></div>
