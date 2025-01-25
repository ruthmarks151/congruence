<script lang="ts">
	import { draggable } from '$lib/dnd';
	import * as R from 'ramda';
	export let statements: string[];
	export let maxBin: number;
	export let onMoveRequested: (statement: string, binId: number | undefined) => void;
	$: binIds = R.range(0, maxBin + 1);
</script>

<div>
	{#each statements as statement}
		<p style="width: max-content; max-width: 100%;" use:draggable={statement} unselectable>
			{statement}
		</p>
	{/each}
</div>

<style lang="scss">
	div {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		width: 100%;
		p {
			border: 1px solid black;
			line-height: 1;
			font-size: 0.8em;
			margin: 0;
			min-height: 60px;
			-webkit-user-select: none; /* Safari */
			-moz-user-select: none; /* Firefox */
			-ms-user-select: none; /* IE10+/Edge */
			user-select: none; /* Standard */
		}
	}
</style>
