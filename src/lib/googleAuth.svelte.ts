import {
	PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
	PUBLIC_GOOGLE_API_KEY,
	PUBLIC_GOOGLE_APP_ID
} from '$env/static/public';
import type { picker } from 'google-one-tap';
import type { GoogleSheetId } from './googleSheetsWrapper';
import { loadSheet, loadSpreadsheetElsePick } from './sortStore.svelte';
// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const googleCredentialsKey = 'googleCredentials';

let tokenClient: google.accounts.oauth2.TokenClient | undefined = $state(undefined);
let accessToken = $state<string | null>(null);

let gapiInited = $state(false);
let gisInited = $state(false);
let pickerInited = $state(false);
let driveInited = $state(false);

class Inited {
	firstSheet = $state(false);
}

export const inited = new Inited();

const maybeTryLogin = () => {
	if (gisInited && gapiInited && driveInited)
		loadSpreadsheetElsePick().finally(() => {
			inited.firstSheet = true;
		});
};

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function onGapiClientLoaded() {
	await gapi.client.init({
		apiKey: PUBLIC_GOOGLE_API_KEY,
		discoveryDocs: [DISCOVERY_DOC]
	});
	const credentials = localStorage.getItem(googleCredentialsKey) || 'null'; // get your credentials from where you saved it
	if (credentials != null) gapi.client.setToken(JSON.parse(credentials)); // parse it if you got it as string

	gapi.client.load('drive', 'v2', () => {
		driveInited = true;
	});

	gapi.load('picker', onPickerApiLoad);

	function onPickerApiLoad() {
		pickerInited = true;
	}

	gapiInited = true;
}

/**
 * Callback after api.js is loaded.
 */
export const onGapiScriptLoaded = () => {
	gapi.load('client', onGapiClientLoaded);
};

/**
 * Callback after Google Identity Services are loaded.
 */
export const onGisScriptLoaded = () => {
	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
		scope: SCOPES,
		prompt: '',
		callback: '' // defined later
	});
	gisInited = true;
};

export const tryFreeLogin = () =>
	new Promise<string | null>(async (res, rej) => {
		if (!gapiInited) {
			res(null);
			return;
		}
		const token = await gapi.client.getToken();

		if (token != null) {
			res(token.access_token);
			return;
		}

		tokenClient.callback = async (resp) => {
			if (resp.error !== undefined) {
				rej(resp.error);
			} else {
				localStorage.setItem(googleCredentialsKey, JSON.stringify(resp));
				res(resp.access_token as string);
			}
		};
		tokenClient.requestAccessToken({ prompt: '' });
	});

export const tryActiveLogin = () =>
	new Promise<string>(async (res, rej) => {
		tokenClient.callback = async (resp) => {
			if (resp.error !== undefined) {
				rej(resp.error);
			} else {
				localStorage.setItem(googleCredentialsKey, JSON.stringify(resp));
				res(resp.access_token as string);
			}
		};
		tokenClient.requestAccessToken({ prompt: 'consent' });
	});

/**
 *  Sign in the user upon button click.
 */
export const handleAuth = () =>
	new Promise<string | null>(async (res, rej) => {
		const freeLoginToken = await tryFreeLogin();
		if (freeLoginToken != null) res(freeLoginToken);

		res(await tryActiveLogin());
	});

export const handleSignout = () => {
	const token = gapi.client.getToken();
	if (token !== null) {
		google.accounts.oauth2.revoke(token.access_token);
		gapi.client.setToken(null);
	}
};

// Create and render a Google Picker object for selecting from Drive.
export const pickSpreadsheet = async (
	handleSpreadsheetId: (spreadsheetId: GoogleSheetId) => void
) => {
	const accessToken = await handleAuth();
	if (accessToken == null) return;
	// TODO(developer): Replace with your API key
	const picker = new google.picker.PickerBuilder()
		.addView(google.picker.ViewId.SPREADSHEETS)
		.setOAuthToken(accessToken)
		.setDeveloperKey(PUBLIC_GOOGLE_API_KEY)
		.setSelectableMimeTypes('application/vnd.google-apps.spreadsheet')
		.setCallback(async (data: any) => {
			if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
				const doc = data[google.picker.Response.DOCUMENTS][0];
				const spreadsheetId = doc[google.picker.Document.ID] as GoogleSheetId;
				handleSpreadsheetId(spreadsheetId);
			}
		})
		.setAppId(PUBLIC_GOOGLE_APP_ID)
		.build();
	picker.setVisible(true);
};
