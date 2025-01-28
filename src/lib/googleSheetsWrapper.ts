import { Effect } from 'effect';

export type GoogleSheetId = string & { readonly __brand: unique symbol };

export const fetchDocument = (id: GoogleSheetId) =>
	Effect.tryPromise({
		try: () => gapi.client.sheets.spreadsheets.get({ spreadsheetId: id, includeGridData: true }),
		catch: (err: unknown) => err
	}).pipe(
		Effect.flatMap(({ status, result }) => {
			if (status != 200) {
				return Effect.fail('Non-200 Response');
			}
			if (result.sheets == undefined) {
				return Effect.fail('undefined sheets in result');
			}

			return Effect.succeed(result.sheets);
		})
	);

export const createSheets = (id: GoogleSheetId, sheets: { title: string }[]) =>
	Effect.tryPromise({
		try: () =>
			gapi.client.sheets.spreadsheets.batchUpdate(
				{ spreadsheetId: id },
				{
					requests: sheets.map(({ title }) => ({
						addSheet: {
							properties: { title }
						}
					}))
				}
			),
		catch: (err: unknown) => err
	}).pipe(
		Effect.flatMap(({ status, result }) => {
			if (!status || status < 200 || status >= 300) {
				return Effect.fail('Non-200 Response');
			}
			return Effect.succeed(result);
		})
	);
