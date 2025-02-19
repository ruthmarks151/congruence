<script lang="ts">
	import { asTaggedUnion } from '$lib/effect_utils';
	import sortState from '$lib/sortStore.svelte';

	const data = asTaggedUnion(sortState.loadedData);
</script>

{#if data[0] == 'Right'}
	<select bind:value={data[1].currentStatementSetName}>
		{#each data[1].statementSets as statementSet}
			<option value={statementSet.statementSet}>{statementSet.statementSet}</option>
		{/each}
	</select>
{:else if data[1].state == 'loading'}
	<select value="Loading..." disabled> </select>
{:else if data[1].state == 'unauthed'}
	<select value="Please log in" disabled> </select>
{:else if data[1].state == 'unpicked'}
	<select value="Please select a login" disabled> </select>
{:else if data[1].state == 'error'}
	<select value="Error" disabled> </select>
	{data[1].error}
{/if}
