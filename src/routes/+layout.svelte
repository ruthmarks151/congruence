<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import NavHeader from '$lib/components/header/nav_header.svelte';
	import {
		inited,
		onGapiScriptLoaded,
		onGisScriptLoaded,
		tryActiveLogin,
		tryFreeLogin
	} from '$lib/googleAuth.svelte';
	import { onMount } from 'svelte';

	import '../app.css';
	import sortStore from '$lib/sortStore.svelte';
	import { loadSpreadsheetElsePick } from '$lib/sortStore.svelte';
	import { asTaggedUnion } from '$lib/effect_utils';
	import { JsonNumber } from 'effect/Schema';
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

	const data = $derived(asTaggedUnion(sortStore.loadedData));
	$effect(() => {
		console.log('data', data);
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

{#if data[0] == 'Right'}
	Data!
	{@render children?.()}
{:else if data[1][0] == 'loading'}
	Loading
{:else if data[1][0] == 'unpicked'}
	We need a google sheet to save data in.

	<button class="button-4 filled green" onclick={() => loadSpreadsheetElsePick()}
		>Login and Pick a Sheet
	</button>
{:else if data[1][0] == 'unauthed'}
	<button onclick={() => tryActiveLogin().then(() => sortStore.handleAuthed())}>Login</button>
{:else if data[1][0] == 'error'}
	{(() => {
		debugger;
	})()}
	Error! {data[1][1]}
{:else}
	{JSON.stringify(data)}
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
