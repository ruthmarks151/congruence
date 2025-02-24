<script lang="ts">
	import { getSorts, setSorts } from '$lib/saves.svelte';
	import { loadSheet } from '$lib/sortStore.svelte';
	import { Effect, pipe } from 'effect';
	import {
		handleAuth,
		handleSignout,
		pickSpreadsheet,
		tryNormalLogin
	} from '$lib/googleAuth.svelte';
	import type { GoogleSheetId } from '$lib/googleSheetsWrapper';

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
</script>

<main>
	<p>Sheets API Quickstart</p>

	<!--Add buttons to initiate auth sequence and sign out-->

	{#if signoutLabel != null}
		<button id="signout_button" onclick={handleSignout}>{signoutLabel}</button>
	{/if}

	<button>Open Picker</button>

	<pre id="content" style="white-space: pre-wrap;">{content}</pre>
</main>
