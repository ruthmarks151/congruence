import { Effect } from 'effect';

export type GoogleSheetId = string & { readonly __brand: unique symbol };

export const fetchDocument = (id: GoogleSheetId) =>
	Effect.tryPromise({
		try: () => gapi.client.sheets.spreadsheets.get({ spreadsheetId: id, includeGridData: true }),
		catch: (err: unknown) => ({ id, err })
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

const hashCode = (str: string) => {
	let hash = 0,
		i,
		chr;
	if (str.length === 0) return hash;
	for (i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return Math.abs(hash);
};

export const createSheets = (
	id: GoogleSheetId,
	sheets: { title: string; defaultRows: string[][] }[]
) =>
	Effect.tryPromise({
		try: () =>
			gapi.client.sheets.spreadsheets.batchUpdate(
				{ spreadsheetId: id },
				{
					requests: sheets.flatMap(({ title, defaultRows }) => [
						{
							addSheet: {
								properties: {
									title,
									sheetId: hashCode(title),
									gridProperties: { columnCount: 150 }
								}
							}
						},
						{
							updateCells: {
								fields: 'userEnteredValue',
								start: { sheetId: hashCode(title), columnIndex: 0, rowIndex: 0 },
								rows: defaultRows.map((row) => ({
									values: row.map((stringValue) => ({ userEnteredValue: { stringValue } }))
								}))
							}
						}
					])
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

export const appendRow = (id: GoogleSheetId, sheetId: number, row: string[]) =>
	gapi.client.sheets.spreadsheets.batchUpdate(
		{ spreadsheetId: id },
		{
			requests: [
				{
					appendCells: {
						sheetId,
						fields: 'userEnteredValue',
						rows: [
							{
								values: row.map((stringValue) => ({
									userEnteredValue: {
										stringValue
									}
								}))
							}
						]
					}
				}
			]
		}
	);

export const createNewSheet = (title: string): Effect.Effect<GoogleSheetId, string> =>
	Effect.promise(() =>
		gapi.client.sheets.spreadsheets.create({ resource: { properties: { title } } })
	).pipe(
		Effect.flatMap(({ status, result: { spreadsheetId } }) => {
			if (!status || status < 200 || status >= 300) {
				return Effect.fail('Non-200 Response');
			}
			if (!spreadsheetId) {
				return Effect.fail('spreadsheetId Response is empty');
			}

			return Effect.succeed(spreadsheetId as GoogleSheetId);
		})
	);
