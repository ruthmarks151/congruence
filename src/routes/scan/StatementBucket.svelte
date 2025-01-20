<script lang="ts">
	import * as R from 'ramda';
	export let statements: string[];
	export let maxBin: number;
	export let onMoveRequested: (statement: string, binId: number | undefined) => void;
	$: binIds = R.range(0, maxBin + 1);
</script>

<div>
	{#each statements as statement}
		<div class="StatementBox" style="display: flex; flex-direction: column;">
			<div style="display: flex; flex-direction: row;">
				<span style="body-2"> Move to: </span>
				<select
					class="input-2"
					on:change={(e) => {
						const moveTo = e.currentTarget.value == '' ? NaN : Number(e.currentTarget.value);
						if (!isNaN(moveTo)) {
							onMoveRequested(statement, moveTo);
							e.currentTarget.value = '';
						}
					}}
				>
					<option value={null} />
					{#each binIds as binId}
						<option value={binId}>Bin {binId + 1}</option>
					{/each}
				</select>
				<button
					style="button-2"
					on:click={() => {
						onMoveRequested(statement, undefined);
					}}>X</button
				>
				<br />
			</div>
			<p>
				{statement}
			</p>
		</div>
	{/each}
</div>

<style lang="scss">
	div {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.5em;
		.StatementBox {
			border: 1px solid black;
			line-height: 1;
			font-size: 0.8em;
			margin: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			height: 60px;
		}
	}
</style>
