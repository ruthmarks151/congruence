<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import NavHeader from '$lib/components/header/nav_header.svelte';
	import {
		inited,
		isLoggedIn,
		onGapiScriptLoaded,
		onGisScriptLoaded,
		tryConsentLogin,
		tryNormalLogin
	} from '$lib/googleAuth.svelte';

	import '../app.css';
	import sortStore, { loadSheet } from '$lib/sortStore.svelte';
	import * as explainerData from './explainer/explainerData';
	import { loadSpreadsheetElsePick } from '$lib/sortStore.svelte';
	import { asTaggedUnion } from '$lib/effect_utils';
	import { handleCreateStarterSheet } from '$lib/sheetLogic.svelte';
	import { Effect } from 'effect';
	import CongruencePlot from './congruence/CongruencePlot.svelte';
	import StatementTimePlot from './time/StatementTimePlot.svelte';
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
		if (inited.apisLoaded)
			isLoggedIn().then((loggedin) => {
				console.log('isLoggedIn resolved', loggedin);

				if (loggedin) {
					sortStore.handleAuthed();
					return loadSheet();
				} else {
					sortStore.requireAuth();
				}
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

{#if data[0] == 'Right'}
	{@render children?.()}
{:else if data[1][0] == 'loading' || data[1][0] == 'preauth'}
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
	<div
		style="display: flex; flex-direction: column; gap: var(--space-10); align-items: center; justify-content: center; margin-top: var(--space-12)"
	>
		<q
			class="alt-heading-6"
			style="color: var(--app-accent); font-family: Ubuntu; margin: var(--space-11)"
			>The curious paradox is that when I accept myself just as I am, then I can change.</q
		>
		<p style="max-width: 600px; font-size: var(--font-size-7); text-align: justify;">
			We can all feel a difference between how we see ourselves and how we think we <i>should</i> be.
			For five years I've been building tools to track and quantifiably analyze this question.
		</p>
		<div style="display: flex; width: 100%; gap: var(--space-5); max-width: 400px;">
			<div style="width: fit-content; flex-grow: 1; flex-basis: 0;"></div>
			<button
				class="button-4 outline blue"
				style="width: fit-content; font-family: Ubuntu;"
				onclick={() => console.log('noop')}>Try it yourself</button
			>

			<button
				class="button-2 ghost blue"
				style="width: fit-content; flex-grow: 1; flex-basis: 0;"
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
					)}>or Login</button
			>
		</div>
		<h2>The Q-Sort</h2>
		<p style="max-width: 600px; font-size: var(--font-size-4); text-align: justify;">
			In 1957 psychologists sought to assess the efficacy of psychotherapy. They asked their subject
			to sort self-describing statements (e.g., "I have a great deal of confidence in my abilities")
			into 9 categories according to how well or poorly the statements describe the individual.
			Subjects would complete this twice: Once sorting the statements according to how they saw
			themselves (the self sort), and again according to how they would like to be (the ideal sort).
			The two sorts became more similar as therapy progressed, with both changing to resemble the
			other.
		</p>
		<h2>I've reproduced those findings with myself</h2>
		<CongruencePlot
			style="width: 100%; max-width: 600px; padding: var(--space-2);"
			points={[
				{
					x: new Date('2019-11-27T00:00:00.000Z'),
					y: 0.5893415106915102
				},
				{
					x: new Date('2019-12-12T00:00:00.000Z'),
					y: 0.7940791605774711
				},
				{
					x: new Date('2019-12-12T00:00:00.000Z'),
					y: 0.7107300310014029
				},
				{
					x: new Date('2019-12-25T00:00:00.000Z'),
					y: 0.7546150506600794
				},
				{
					x: new Date('2020-02-03T00:00:00.000Z'),
					y: 0.733005790596854
				},
				{
					x: new Date('2020-03-02T00:00:00.000Z'),
					y: 0.8215615656012882
				},
				{
					x: new Date('2020-03-12T00:00:00.000Z'),
					y: 0.8088216410563722
				},
				{
					x: new Date('2020-05-21T00:00:00.000Z'),
					y: 0.7648265572547545
				},
				{
					x: new Date('2020-06-23T00:00:00.000Z'),
					y: 0.7709076011520034
				},
				{
					x: new Date('2020-11-24T00:00:00.000Z'),
					y: 0.8834145565943733
				},
				{
					x: new Date('2021-06-03T00:00:00.000Z'),
					y: 0.8509181183923317
				},
				{
					x: new Date('2022-01-03T00:00:00.000Z'),
					y: 0.8224726521178203
				},
				{
					x: new Date('2022-11-28T00:00:00.000Z'),
					y: 0.8085587100482473
				},
				{
					x: new Date('2023-06-16T00:00:00.000Z'),
					y: 0.8133759528831138
				},
				{
					x: new Date('2024-12-15T00:00:00.000Z'),
					y: 0.6934469032230453
				},
				{
					x: new Date('2025-02-19T00:00:00.000Z'),
					y: 0.79808121510814
				}
			]}
			therapyRanges={[
				[new Date('2019-08-23'), new Date('2020-04-12')],
				[new Date('2020-05-29'), new Date('2020-07-09')],
				[new Date('2021-08-05'), new Date('2021-09-20')],
				[new Date('2024-12-11'), new Date('2025-03-31')]
			]}
		></CongruencePlot>
		<h2>My self perception has meaningfully shifted</h2>
		<StatementTimePlot
			style="width: 100%; max-width: 600px; padding: var(--space-2);"
			lines={explainerData.selfLines}
		/>
		<h2>My ideal self has also changed in significant ways</h2>
		<StatementTimePlot
			style="width: 100%; max-width: 600px; padding: var(--space-2);"
			lines={explainerData.idealLines}
		></StatementTimePlot>
	</div>
{:else if data[1][0] == 'error'}
	Error! {data[1][1]}
{:else}
	{JSON.stringify(data)}
{/if}

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
