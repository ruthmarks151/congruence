import { Effect, pipe } from 'effect';
import {
	fetchDocument,
	createSheets,
	type GoogleSheetId,
	createNewSheet
} from './googleSheetsWrapper';
import { type Sort, type StatementSet } from './sortStore.svelte';
import starterSheets from './starterSheets';

export const spreadsheetIdKey = 'spreadsheetId';

const allSheetKeys = ['statementSets', 'sorts'] as const;
type SheetId = (typeof allSheetKeys)[number];

const sheetParams = {
	statementSets: {
		title: 'Statement Sets',
		headers: [
			'Statement Set',
			'Updated at',
			'Description',
			'Note',
			'Statements Begin Here'
		] as const
	},
	sorts: {
		title: 'Sorts',
		headers: ['Statement Set', 'Subject', 'Sorted At', 'Note', 'Statement Bins Begin Here'] as const
	}
} as const;

const nonExistentSheets = (sheets: gapi.client.sheets.Sheet[]) =>
	allSheetKeys.filter(
		(sheetId) => !sheets.some(({ properties }) => properties?.title == sheetParams[sheetId].title)
	);

const extractGrid = (
	sheet: gapi.client.sheets.Sheet
): Effect.Effect<
	(string | number | undefined)[][],
	{ reason: string; sheet: gapi.client.sheets.Sheet }
> => {
	if (!sheet.data)
		return Effect.fail({ reason: 'Unparseable Sheet response, no Data array', sheet });
	if (!sheet.data.length)
		return Effect.fail({ reason: 'Unparseable Sheet response, no Data in data array', sheet });
	if (!sheet.data[0].rowData)
		return Effect.fail({
			reason: 'Unparseable Sheet response, no rowData in first element of data array',
			sheet
		});

	return Effect.succeed(
		sheet.data[0].rowData
			.filter(
				(row): row is gapi.client.sheets.RowData & { values: gapi.client.sheets.CellData[] } =>
					!!row.values
			)
			.map((row) =>
				row.values.map(
					(cell) => cell.userEnteredValue?.numberValue ?? cell.userEnteredValue?.stringValue
				)
			)
	);
};

const headerLocationVector = (sheet: gapi.client.sheets.Sheet, sheetId: SheetId) =>
	pipe(
		extractGrid(sheet),
		Effect.map((grid) =>
			sheetParams[sheetId].headers.map((headerText) => grid[0].findIndex((c) => headerText == c))
		),
		Effect.flatMap((rawVec) => {
			const unMapped = sheetParams[sheetId].headers.filter((_label, index) => rawVec[index] < 0);
			if (unMapped.length)
				return Effect.fail(`${sheetParams[sheetId].title} ${unMapped.join(', ')} are missing`);
			return Effect.succeed(rawVec);
		})
	);

const extractSheet = (sheetId: SheetId, doc: gapi.client.sheets.Sheet[]) => {
	const maybeSheet = doc.find((sheet) => sheet.properties?.title == sheetParams[sheetId].title);
	if (maybeSheet == undefined)
		return Effect.fail(`No sheet with title ${sheetParams[sheetId].title}`);
	return Effect.succeed(maybeSheet);
};

export const ensureAllSheetsExist = (id: GoogleSheetId) =>
	pipe(
		Effect.Do,
		Effect.bind('doc', () => fetchDocument(id)),
		Effect.bind('sheets', ({ doc }) =>
			Effect.all({
				sorts: extractSheet('sorts', doc),
				statementSets: extractSheet('statementSets', doc)
			})
		),
		Effect.bind('headerLocationVectors', ({ sheets }) =>
			Effect.all(
				allSheetKeys.map((sheetId) => {
					return headerLocationVector(sheets[sheetId], sheetId).pipe(
						Effect.map((vec) => [sheetId, vec] as const)
					);
				})
			).pipe(Effect.map((pairs) => Object.fromEntries(pairs) as Record<SheetId, number[]>))
		),
		Effect.bind(
			'sorts',
			({ headerLocationVectors: { sorts: sortHeaderVec }, sheets: { sorts: sortSheet } }) =>
				extractGrid(sortSheet).pipe(
					Effect.map(([_header, ...rows]) =>
						rows.map(
							(row): Sort => ({
								statementSet: String(row[sortHeaderVec[0]]),
								subject: String(row[sortHeaderVec[1]]),
								sortedOn: String(row[sortHeaderVec[2]]),
								note: String(row[sortHeaderVec[3]]),
								statementPositions:
									row?.slice(sortHeaderVec[4]).map((n) => parseInt(String(n), 10)) ?? []
							})
						)
					)
				)
		),
		Effect.bind(
			'statementSets',
			({
				headerLocationVectors: { statementSets: statementSetHeaderVec },
				sheets: { statementSets: statementSetSheet }
			}) =>
				extractGrid(statementSetSheet).pipe(
					Effect.map(([_header, ...rows]): StatementSet[] =>
						rows.map((row) => ({
							statementSet: String(row[statementSetHeaderVec[0]]),
							updatedAt: new Date(String(row[statementSetHeaderVec[1]])),
							description: String(row[statementSetHeaderVec[2]]),
							note: String(row[statementSetHeaderVec[3]]),
							statements:
								row
									.slice(statementSetHeaderVec[4])
									.filter((s) => s != null && s != '' && s != undefined)
									.map((s) => String(s)) ?? []
						}))
					)
				)
		)
	);

export const handleCreateStarterSheet = () =>
	createNewSheet('Congruence Data').pipe(
		Effect.andThen((id) => createSheets(id, starterSheets())),
		Effect.flatMap(({ spreadsheetId }) =>
			Effect.fromNullable((spreadsheetId ?? null) as GoogleSheetId | null)
		)
	);
