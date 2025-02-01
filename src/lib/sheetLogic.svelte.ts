import { Effect, Exit, Option, pipe } from 'effect';
import { fetchDocument, createSheets, type GoogleSheetId } from './googleSheetsWrapper';
import { effect } from 'effect/Layer';
import { number } from 'effect/Equivalence';
import { onMount } from 'svelte';
import { handleAuth, pickSpreadsheet } from './googleAuth.svelte';
import * as R from 'ramda';

const spreadsheetIdKey = 'spreadsheetId';

const allSheetKeys = ['statementSets', 'sorts'] as const;
type SheetId = (typeof allSheetKeys)[number];

interface SheetParams {
	title: string;
	headers: string[];
}

interface StatementSet {
	statementSet: string;
	updatedAt: Date;
	description: string;
	note: string;
	statements: string[];
}

interface Sort {
	statementSet: string;
	subject: string;
	sortedOn: string;
	note: string;
	statementPositions: number[];
}

class SortState {
	all: null | { sorts: Sort[]; statementSets: StatementSet[] } = $state(null);
	currentStatementSetName: string | null = $state(null);
	current = $derived({
		statementSet:
			this.all?.statementSets.find(
				({ statementSet }) => statementSet == this.currentStatementSetName
			) ?? null,
		sorts: R.sortBy(({ sortedOn }: Sort) => sortedOn)(
			this.all?.sorts.filter(({ statementSet }) => statementSet == this.currentStatementSetName) ??
				[]
		),
		subjects: [
			...new Set([
				...(this.all?.sorts
					.filter(({ statementSet }) => statementSet == this.currentStatementSetName)
					.map(({ subject }) => subject) ?? []),
				'Myself',
				'My Ideal Self'
			])
		]
	});
}

export const sortState: SortState = new SortState();

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

const ensureAllSheetsExist = (id: GoogleSheetId) =>
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
							statements: row.slice(statementSetHeaderVec[4]).map((s) => String(s)) ?? []
						}))
					)
				)
		)
	);

export const loadSheet = async (id: GoogleSheetId | null = null) => {
	const savedSpreadsheetId = JSON.parse(
		localStorage.getItem(spreadsheetIdKey) ?? '""'
	) as GoogleSheetId;
	if (id != null) {
		localStorage.setItem(spreadsheetIdKey, JSON.stringify(id));
	} else if (savedSpreadsheetId != '') {
		id = savedSpreadsheetId;
	} else {
		console.error('Error loading sheet no key exists');
		return false;
	}

	const sheetsExit = await Effect.runPromiseExit(ensureAllSheetsExist(id));

	return sheetsExit.pipe(
		Exit.match({
			onSuccess({ sorts, statementSets }) {
				sortState.all = { sorts, statementSets };
				if (sortState.all?.statementSets) {
					if (
						!sortState.all.statementSets.some(
							({ statementSet }) => statementSet == sortState.currentStatementSetName
						)
					) {
						sortState.currentStatementSetName =
							sortState.all.sorts[sortState.all.sorts.length - 1]?.statementSet ??
							sortState.all.statementSets[0].statementSet;
					}
				}
				return true;
			},
			onFailure(cause) {
				sortState.all = null;
				console.error(`Error loading sheet ${cause}`);
				return false;
			}
		})
	);
};

export const pickAndLoadSpreadsheet = async () => {
	const _auth = await handleAuth();
	let success = false;
	try {
		success = await loadSheet();
	} catch (e: unknown) {
		success = false;
	}
	if (!success) await pickSpreadsheet(loadSheet);
};
