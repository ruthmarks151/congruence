import {
	PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
	PUBLIC_GOOGLE_API_KEY,
	PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET,
	PUBLIC_GOOGLE_APP_ID
} from '$env/static/public';
import type { picker } from 'google-one-tap';
// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: google.accounts.oauth2.TokenClient | undefined = $state(undefined);
let accessToken = $state<string | null>(null);
let gapiInited = $state(false);
let gisInited = $state(false);
let pickerInited = $state(false);
let driveInited = $state(false);

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function onGapiClientLoaded() {
	await gapi.client.init({
		apiKey: PUBLIC_GOOGLE_API_KEY,
		discoveryDocs: [DISCOVERY_DOC]
	});
	let credentials = localStorage.getItem('googleCredentials'); // get your credentials from where you saved it
	debugger;
	if (credentials != null) gapi.client.setToken(JSON.parse(credentials)); // parse it if you got it as string

	await gapi.client.load('drive', 'v2', () => {
		driveInited = true;
	});

	await gapi.load('picker', onPickerApiLoad);

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
		if (gapi.client.getToken() === null) {
			res(null);
			return;
		}

		tokenClient.callback = async (resp) => {
			if (resp.error !== undefined) {
				rej(resp.error);
			} else {
				localStorage.setItem('googleCredentials', JSON.stringify(resp.access_token));
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
				localStorage.setItem('googleCredentials', JSON.stringify(resp));
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
export const pickSpreadsheet = async (pickerCallback: (result: picker.ResponseObject) => void) => {
	const accessToken = await handleAuth();
	if (accessToken == null) return;
	// TODO(developer): Replace with your API key
	const picker = new google.picker.PickerBuilder()
		.addView(google.picker.ViewId.SPREADSHEETS)
		.setOAuthToken(accessToken)
		.setDeveloperKey(PUBLIC_GOOGLE_API_KEY)
		.setSelectableMimeTypes('application/vnd.google-apps.spreadsheet')
		.setCallback(pickerCallback)
		.setAppId(PUBLIC_GOOGLE_APP_ID)
		.build();
	picker.setVisible(true);
};
