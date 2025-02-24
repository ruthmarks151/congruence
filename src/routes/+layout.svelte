<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import NavHeader from '$lib/components/header/nav_header.svelte';
	import {
		inited,
		isLoggedIn,
		onGapiScriptLoaded,
		onGisScriptLoaded,
		tryBackgroundLogin,
		tryConsentLogin,
		tryNormalLogin
	} from '$lib/googleAuth.svelte';

	import '../app.css';
	import sortStore, { loadSheet } from '$lib/sortStore.svelte';
	import { loadSpreadsheetElsePick } from '$lib/sortStore.svelte';
	import { asTaggedUnion } from '$lib/effect_utils';
	import { handleCreateStarterSheet } from '$lib/sheetLogic.svelte';
	import { Effect } from 'effect';
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

	$effect(() => {
		console.log('Trying free', inited.apisLoaded);
		if (inited.apisLoaded)
			tryBackgroundLogin().then(
				() => {
					isLoggedIn()
						.then((loggedin) => {
							if (loggedin) {
								sortStore.handleAuthed();
								return loadSheet();
							}
						})
						.catch((err) => console.warn('Login check failed', err));
				},
				(err) => console.warn('tryBackgroundLogin failed', err)
			);
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
	{@render children?.()}
{:else if data[1][0] == 'loading'}
	Loading...
{:else if data[1][0] == 'unpicked'}
	We need a google sheet to save data in.

	<button class="button-4 filled blue" onclick={() => loadSpreadsheetElsePick()}
		>Pick a Sheet
	</button>
	<button
		class="button-4 filled green"
		onclick={() =>
			Effect.runPromiseExit(
				handleCreateStarterSheet().pipe(Effect.map((sheetId) => loadSheet(sheetId)))
			)}
	>
		New Sheet
	</button>
{:else if data[1][0] == 'unauthed'}
	<button
		class="button-4 filled green"
		onclick={() =>
			tryNormalLogin().then(
				async () => {
					console.log('Authed off tryNormalLogin!');
					sortStore.handleAuthed();
					await loadSheet();
				},
				(err) => {
					console.warn('tryFreeLogin Failed', err);
					tryConsentLogin().then(
						async () => {
							console.log('Authed off tryConsentLogin!');
							sortStore.handleAuthed();
							await loadSheet();
						},
						(err) => console.error('tryConsentLogin Failed', err)
					);
				}
			)}>Login</button
	>
	<button class="button-4 filled blue" onclick={() => console.log('noop')}> noop </button>
{:else if data[1][0] == 'error'}
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
