import { Effect, Option, pipe } from 'effect';
import { fetchDocument, createSheets, type GoogleSheetId } from './googleSheetsWrapper';
import { effect } from 'effect/Layer';
import type { Sort } from './saves.svelte.svelte';

const allSheetKeys = ['statementSets', 'sorts'] as const;
type SheetId = (typeof allSheetKeys)[number];

interface SheetParams {
	title: string;
	headers: string[];
}

const sheetParams: Record<SheetId, SheetParams> = {
	statementSets: {
		title: 'Statement Sets',
		headers: ['Statement Set', 'Updated at', 'Description', 'Note', 'Statements Begin Here']
	},
	sorts: {
		title: 'Sorts',
		headers: ['Statement Set', 'Subject', 'Sorted At', 'Note', 'Statement Bins Begin Here']
	}
} as const;

const nonExistentSheets = (sheets: gapi.client.sheets.Sheet[]) =>
	allSheetKeys.filter(
		(sheetId) => !sheets.some(({ properties }) => properties?.title == sheetParams[sheetId].title)
	);

const extractGrid = (sheet: gapi.client.sheets.Sheet) => {
	if (!sheet.data) return undefined;
	if (!sheet.data.length) return undefined;
	if (!sheet.data[0].rowData) return [];
	if (!sheet.data[0].rowData[0].values) return undefined;

	return sheet.data[0].rowData
		.filter(
			(row): row is gapi.client.sheets.RowData & { values: gapi.client.sheets.CellData[] } =>
				!!row.values
		)
		.map((row) =>
			row.values.map(
				(cell) => cell.userEnteredValue?.numberValue ?? cell.userEnteredValue?.stringValue
			)
		);
};

const headerLocationVector = (sheet: gapi.client.sheets.Sheet, sheetId: SheetId) =>
	pipe(
		Effect.Do,
		Effect.bind('grid', () => {
			const gridVal = extractGrid(sheet);
			if (gridVal == undefined) return Effect.fail('grid could not be extracted');
			return Effect.succeed(gridVal);
		}),
		Effect.let('rawVec', ({ grid }) =>
			sheetParams[sheetId].headers.map((headerText) => grid[0].findIndex((c) => headerText == c))
		),
		Effect.bind('vec', ({ rawVec }) => {
			const unMapped = sheetParams[sheetId].headers.filter((label, index) => rawVec[index] < 0);
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
		Effect.bind('sheetsCreated', ({ doc }) => {
			const sheetsToCreate = nonExistentSheets(doc);
			return sheetsToCreate.length > 0
				? createSheets(
						id,
						sheetsToCreate.map((sheetId) => ({ title: sheetParams[sheetId].title }))
					).pipe(Effect.map((_) => true))
				: Effect.succeed(true);
		}),
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
						Effect.map(({ vec }) => [sheetId, vec] as const)
					);
				})
			).pipe(Effect.map((pairs) => Object.fromEntries(pairs) as Record<SheetId, number[]>))
		),
		Effect.let(
			'sorts',
			({
				headerLocationVectors: { sorts: sortHeaderVec },
				sheets: { sorts: sortSheet }
			}): undefined | Sort[] =>
				extractGrid(sortSheet)
					?.slice(1)
					.map((row) => ({
						statementSet: row[sortHeaderVec[0]],
						subject: String(row[sortHeaderVec[1]]),
						sortedOn: String(row[sortHeaderVec[2]]),
						note: row[sortHeaderVec[3]],
						statementPositions:
							row?.slice(sortHeaderVec[4]).map((n) => parseInt(String(n), 10)) ?? []
					}))
		),
		Effect.let(
			'statementSets',
			({
				headerLocationVectors: { statementSets: statementSetHeaderVec },
				sheets: { statementSets: statementSetSheet }
			}) =>
				extractGrid(statementSetSheet)
					?.slice(1)
					.map((row) => ({
						statementSet: row[statementSetHeaderVec[0]],
						updatedAt: row[statementSetHeaderVec[1]],
						description: row[statementSetHeaderVec[2]],
						note: row[statementSetHeaderVec[3]],
						statements: row.slice(statementSetHeaderVec[4])
					}))
		)
	);
