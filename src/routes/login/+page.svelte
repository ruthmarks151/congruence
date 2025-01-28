<script lang="ts">
	import { getSorts, setSorts } from '$lib/saves.svelte';
	import { ensureAllSheetsExist } from '$lib/sheetLogic';
	import { Effect, pipe } from 'effect';
	import { handleAuth, handleSignout, pickSpreadsheet, tryFreeLogin } from '$lib/googleAuth.svelte';

	/* exported gapiLoaded */
	/* exported gisLoaded */
	/* exported handleAuthClick */
	/* exported handleSignoutClick */

	let content = $state('');
	let authorizeButtonLabel = $state<string | null>(null);
	let signoutLabel = $state<string | null>(null);
	let createLabel = $state<string | null>(null);
	let spreadsheetId = $state<string | null>(null);

	/**
	 *  Sign out the user upon button click.
	 */

	async function listFiles() {
		let response;
		try {
			response = await gapi.client.drive.files.list({
				pageSize: 10,
				fields: 'files(id, name)'
			});
		} catch (err) {
			content = err.message;
			return;
		}
		const files = response.result.files;
		if (!files || files.length == 0) {
			content = 'No files found.';
			return;
		}
		// Flatten to string to display
		const output = files.reduce((str, file) => `${str}${file.name} (${file.id})\n`, 'Files:\n');
		content = output;
	}

	async function pickerCallback(data: any) {
		let url = 'nothing';
		if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
			const doc = data[google.picker.Response.DOCUMENTS][0];
			url = doc[google.picker.Document.URL];
			spreadsheetId = doc[google.picker.Document.ID];
			const sheetsExist = await Effect.runPromiseExit(
				pipe(
					ensureAllSheetsExist(doc[google.picker.Document.ID]),
					Effect.map(({ statementSets: loadedStatementSets, sorts: loadedSorts }) => {
						setSorts(loadedSorts ?? []);
					})
				)
			);

			const stateSorts = getSorts();
			debugger;
		}
	}
</script>

<main>
	<p>Sheets API Quickstart</p>

	<!--Add buttons to initiate auth sequence and sign out-->

	<button
		id="authorize_button"
		onclick={() => handleAuth().then((token) => console.log('handleAuth', token))}>Authorize</button
	>
	<button onclick={() => tryFreeLogin().then((token) => console.log('tryFreeLogin', token))}>
		Free Login</button
	>
	{#if signoutLabel != null}
		<button id="signout_button" onclick={handleSignout}>{signoutLabel}</button>
	{/if}

	<button
		onclick={() => {
			const sheetsExist = Effect.runPromiseExit(
				pipe(
					ensureAllSheetsExist('1c900OM5pC-DFZkgH8FuObMEH9acscM_knGBo6X17rT0'),
					Effect.tap(({ statementSets: loadedStatementSets, sorts: loadedSorts }) => {
						setSorts(loadedSorts ?? []);
					})
				)
			)
				.then((data) => {
					debugger;
				})
				.catch((err) => {
					debugger;
				});

			const stateSorts = getSorts();
		}}>Load</button
	>

	<button onclick={() => pickSpreadsheet(pickerCallback)}>Open Picker</button>

	<pre id="content" style="white-space: pre-wrap;">{content}</pre>
</main>
