<script lang="ts">
	import {
		PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
		PUBLIC_GOOGLE_API_KEY,
		PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET,
		PUBLIC_GOOGLE_APP_ID
	} from '$env/static/public';
	import { getSorts, setSorts } from '$lib/saves.svelte';
	import { ensureAllSheetsExist } from '$lib/sheetLogic';
	import { Effect, pipe } from 'effect';

	/* exported gapiLoaded */
	/* exported gisLoaded */
	/* exported handleAuthClick */
	/* exported handleSignoutClick */

	// Discovery doc URL for APIs used by the quickstart
	const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

	// Authorization scopes required by the API; multiple scopes can be
	// included, separated by spaces.
	const SCOPES = 'https://www.googleapis.com/auth/drive.file';

	let content = $state('');
	let authorizeButtonLabel = $state<string | null>(null);
	let signoutLabel = $state<string | null>(null);
	let createLabel = $state<string | null>(null);
	let accessToken = $state<string | null>(null);
	let spreadsheetId = $state<string | null>(null);

	let tokenClient: google.accounts.oauth2.TokenClient | undefined;
	let gapiInited = $state(false);
	let gisInited = $state(false);
	let pickerInited = $state(false);
	/**
	 * Callback after api.js is loaded.
	 */
	const gapiLoaded = () => {
		gapi.load('client', initializeGapiClient);
	};

	/**
	 * Callback after the API client is loaded. Loads the
	 * discovery doc to initialize the API.
	 */
	async function initializeGapiClient() {
		await gapi.client.init({
			apiKey: PUBLIC_GOOGLE_API_KEY,
			discoveryDocs: [DISCOVERY_DOC]
		});
		await gapi.client.load('drive', 'v2', () => (createLabel = 'Create'));

		await gapi.load('picker', onPickerApiLoad);

		function onPickerApiLoad() {
			pickerInited = true;
		}

		gapiInited = true;
		maybeEnableButtons();
	}

	/**
	 * Callback after Google Identity Services are loaded.
	 */
	const gisLoaded = () => {
		tokenClient = google.accounts.oauth2.initTokenClient({
			client_id: PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
			scope: SCOPES,
			callback: '' // defined later
		});
		gisInited = true;
		maybeEnableButtons();
	};

	/**
	 * Enables user interaction after all libraries are loaded.
	 */
	function maybeEnableButtons() {
		if (gapiInited && gisInited) {
			authorizeButtonLabel = 'Authorize';
			handleAuthClick();
		}
	}

	/**
	 *  Sign in the user upon button click.
	 */
	function handleAuthClick() {
		tokenClient.callback = async (resp) => {
			if (resp.error !== undefined) {
				throw resp;
			}
			signoutLabel = 'Sign Out';
			authorizeButtonLabel = 'Refresh';
		};

		if (gapi.client.getToken() === null) {
			// Prompt the user to select a Google Account and ask for consent to share their data
			// when establishing a new session.
			tokenClient.requestAccessToken({ prompt: 'consent' });
		} else {
			// Skip display of account chooser and consent dialog for an existing session.
			tokenClient.requestAccessToken({ prompt: '' });
		}
	}

	/**
	 *  Sign out the user upon button click.
	 */
	function handleSignoutClick() {
		const token = gapi.client.getToken();
		if (token !== null) {
			google.accounts.oauth2.revoke(token.access_token);
			gapi.client.setToken('');
			content = '';
			authorizeButtonLabel = 'Authorize';
			signoutLabel = null;
		}
	}

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

	// Create and render a Google Picker object for selecting from Drive.
	function createPicker() {
		const showPicker = () => {
			// TODO(developer): Replace with your API key
			const picker = new google.picker.PickerBuilder()
				.addView(google.picker.ViewId.SPREADSHEETS)
				.setOAuthToken(accessToken!)
				.setDeveloperKey(PUBLIC_GOOGLE_API_KEY)
				.setSelectableMimeTypes('application/vnd.google-apps.spreadsheet')
				.setCallback(pickerCallback)
				.setAppId(PUBLIC_GOOGLE_APP_ID)
				.build();
			picker.setVisible(true);
		};

		// Request an access token.
		tokenClient.callback = async (response) => {
			if (response.error !== undefined) {
				throw response;
			}
			accessToken = response.access_token;
			showPicker();
		};

		if (accessToken === null) {
			// Prompt the user to select a Google Account and ask for consent to share their data
			// when establishing a new session.
			tokenClient.requestAccessToken({ prompt: 'consent' });
		} else {
			// Skip display of account chooser and consent dialog for an existing session.
			tokenClient.requestAccessToken({ prompt: '' });
		}
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

<svelte:head>
	<script src="https://apis.google.com/js/api.js" onload={gapiLoaded}></script>
	<script src="https://accounts.google.com/gsi/client" onload={gisLoaded}></script>
</svelte:head>

<main>
	<p>Sheets API Quickstart</p>

	<!--Add buttons to initiate auth sequence and sign out-->

	{#if authorizeButtonLabel != null}
		<button id="authorize_button" onclick={handleAuthClick}>{authorizeButtonLabel}</button>
	{/if}
	{#if signoutLabel != null}
		<button id="signout_button" onclick={handleSignoutClick}>{signoutLabel}</button>
	{/if}

	<button
		onclick={() => {
			const sheetsExist = Effect.runPromiseExit(
				pipe(
					ensureAllSheetsExist('1c900OM5pC-DFZkgH8FuObMEH9acscM_knGBo6X17rT0'),
					Effect.map(({ statementSets: loadedStatementSets, sorts: loadedSorts }) => {
						debugger;
						setSorts(loadedSorts ?? []);
					})
				)
			);

			const stateSorts = getSorts();
			debugger;
		}}>Load</button
	>

	<button onclick={createPicker}>Open Picker</button>

	<pre id="content" style="white-space: pre-wrap;">{content}</pre>
</main>
