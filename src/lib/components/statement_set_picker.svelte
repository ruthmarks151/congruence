<script lang="ts">
	import { asTaggedUnion } from '$lib/effect_utils';
	import sortStore from '$lib/sortStore.svelte';

	const data = asTaggedUnion(sortStore.loadedData);
</script>

{#if data[0] == 'Right'}
	<select bind:value={data[1].currentStatementSetName}>
		{#each data[1].statementSets as statementSet}
			<option value={statementSet.statementSet}>{statementSet.statementSet}</option>
		{/each}
	</select>
{:else if data[1][0] == 'loading'}
	<select value="Loading..." disabled> </select>
{:else if data[1][0] == 'unauthed'}
	<select value="Please log in" disabled> </select>
{:else if data[1][0] == 'unpicked'}
	<select value="Please select a sheet" disabled> </select>
{:else if data[1][0] == 'error'}
	<select value="Error" disabled> </select>
	{data[1][1]}
{/if}
