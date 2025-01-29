<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import NavHeader from '$lib/components/header/nav_header.svelte';
	import { onGapiScriptLoaded, onGisScriptLoaded, tryFreeLogin } from '$lib/googleAuth.svelte';
	import { onMount } from 'svelte';

	import '../app.css';
	import { pickAndLoadSpreadsheet, sheetState } from '$lib/sheetLogic.svelte';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition) {
			return;
		}

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<title>Congruence</title>

	<script src="https://apis.google.com/js/api.js" onload={onGapiScriptLoaded}></script>
	<script src="https://accounts.google.com/gsi/client" onload={onGisScriptLoaded}></script>
</svelte:head>

{#if !$page.data.hideHeader}
	<NavHeader />
{/if}

{#if sheetState.state == null}
	We need a google sheet to save data in.

	<button class="button-4 filled green" onclick={() => pickAndLoadSpreadsheet()}
		>Login and Pick a Sheet
	</button>
{:else}
	{@render children?.()}
{/if}

<footer>
	<h3>
		<a class="link-4 external" href="#"> q sort </a>
	</h3>
</footer>

<style>
	footer {
		text-align: center;
		padding-block: var(--space-4);
		margin-block-start: auto;
	}

	a {
		display: flex;
		justify-content: center;
	}
</style>
