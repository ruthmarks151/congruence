import { Effect, Either, Exit } from 'effect';
import * as R from 'ramda';
import { ensureAllSheetsExist, spreadsheetIdKey } from './sheetLogic.svelte';
import { appendRow, type GoogleSheetId } from './googleSheetsWrapper';
import { pickSpreadsheet } from './googleAuth.svelte';
import { error } from '@sveltejs/kit';

export interface StatementSet {
	statementSet: string;
	updatedAt: Date;
	description: string;
	note: string;
	statements: string[];
}

export interface Sort {
	statementSet: string;
	subject: string;
	sortedOn: string;
	note: string;
	statementPositions: number[];
}

type AppState =
	| { state: 'preauth' }
	| { state: 'unauthed' }
	| { state: 'authed'; spreadsheetId: null; sortData: null }
	| { state: 'authed'; spreadsheetId: string; sortData: { state: 'error'; error: unknown } }
	| { state: 'authed'; spreadsheetId: string; sortData: { state: 'loading' } }
	| { state: 'authed'; spreadsheetId: string; sortData: { state: 'loaded'; data: SortData } };

interface SortData {
	sorts: Sort[];
	statementSets: StatementSet[];
	appendStatementSet: (
		set: Partial<StatementSet> & Pick<StatementSet, 'statementSet'>
	) => Promise<void>;
	appendSort: (
		sort: Partial<Sort> & Pick<Sort, 'statementPositions' | 'subject' | 'statementSet'>
	) => Promise<void>;
	currentStatementSetName: string;
}
class SortStore {
	appState: AppState = $state({ state: 'preauth' });

	handleAuthed() {
		this.appState = { state: 'authed', spreadsheetId: null, sortData: null };
	}

	requireAuth() {
		this.appState = { state: 'unauthed' };
	}

	authed: Either.Either<
		AppState & { state: 'authed' },
		readonly ['unauthed'] | readonly ['preauth']
	> = $derived.by(() => {
		if (this.appState.state == 'preauth') return Either.left(['preauth']);
		if (this.appState.state == 'unauthed') return Either.left(['unauthed']);

		return Either.right(this.appState);
	});

	picked = $derived(
		this.authed.pipe(
			Either.flatMap((state) => {
				if (state.spreadsheetId == null) return Either.left(['unpicked'] as const);

				return Either.right(state);
			})
		)
	);

	loadedData = $derived(
		this.picked.pipe(
			Either.flatMap(
				(
					state
				): Either.Either<
					SortData,
					| readonly ['unauthed']
					| readonly ['unpicked']
					| readonly ['loading']
					| readonly ['error', unknown]
				> => {
					if (state.sortData.state == 'error')
						return Either.left(['error', state.sortData.error] as const);

					if (state.sortData.state == 'loading') return Either.left(['loading'] as const);

					return Either.right(state.sortData.data);
				}
			)
		)
	);

	current = $derived.by(
		(): Either.Either<
			{ statementSet: StatementSet; sorts: Sort[]; subjects: string[] },
			| readonly ['preauth']
			| readonly ['unauthed']
			| readonly ['loading']
			| readonly ['unpicked']
			| readonly ['error', unknown]
		> =>
			this.loadedData.pipe(
				Either.map(({ currentStatementSetName, sorts, statementSets }) => ({
					statementSet: statementSets.find(
						({ statementSet }) => statementSet == currentStatementSetName
					)!,
					sorts: R.sortBy(({ sortedOn }: Sort) => sortedOn)(
						sorts.filter(({ statementSet }) => statementSet == currentStatementSetName)
					),
					subjects: R.sortBy(R.identity)([
						...new Set([
							...sorts
								.filter(({ statementSet }) => statementSet == currentStatementSetName)
								.map(({ subject }) => subject),
							'Myself',
							'My Ideal Self'
						])
					])
				}))
			)
	);

	public get spreadsheetId(): Either.Either<
		string,
		readonly ['unauthed'] | readonly ['unpicked'] | readonly ['error', unknown]
	> {
		return this.picked.pipe(Either.map(R.prop('spreadsheetId')));
	}

	public get currentStatementSetName(): string {
		return (
			this.loadedData.pipe(Either.map(R.prop('currentStatementSetName')), Either.getOrUndefined) ??
			''
		);
	}

	public set currentStatementSetName(val: string) {
		if (this.appState.state == 'authed' && this.appState.sortData?.state == 'loaded')
			this.appState.sortData.data.currentStatementSetName = val;
	}

	public loadNewSpreadsheet = async (spreadsheetId: GoogleSheetId): Promise<boolean> => {
		if (this.appState.state == 'authed') {
			this.appState = { state: 'authed', spreadsheetId, sortData: { state: 'loading' } };
		}

		const sheetsExit = await Effect.runPromiseExit(ensureAllSheetsExist(spreadsheetId));

		return sheetsExit.pipe(
			Exit.match({
				onSuccess: async ({ sorts, statementSets, sheets, headerLocationVectors }) => {
					this.appState = {
						state: 'authed',
						spreadsheetId,
						sortData: {
							state: 'loaded',
							data: {
								sorts,
								statementSets,
								currentStatementSetName: statementSets[0].statementSet,
								appendSort: async (sort) => {
									const data = new Array(
										headerLocationVectors.statementSets[3 /* Statements Begin Here */]
									).map(() => '');

									data[headerLocationVectors.statementSets[0]] = sort.statementSet;
									data[headerLocationVectors.statementSets[1]] = sort.subject;

									data[headerLocationVectors.statementSets[2]] = sort.sortedOn
										? String(sort.sortedOn)
										: String(new Date());
									data[headerLocationVectors.statementSets[3]] = sort.note ?? '';

									await appendRow(spreadsheetId, sheets.sorts.properties!.sheetId!, [
										...data,
										...sort.statementPositions.map((n) => String(n))
									]);
									return;
								},
								appendStatementSet: async (set) => {
									const data = new Array(
										headerLocationVectors.statementSets[3 /* Statements Begin Here */]
									).map(() => '');

									data[headerLocationVectors.statementSets[0]] = set.statementSet;
									data[headerLocationVectors.statementSets[1]] = set.updatedAt
										? String(set.updatedAt)
										: String(new Date());
									data[headerLocationVectors.statementSets[2]] = set.description ?? ' ';
									data[headerLocationVectors.statementSets[3]] = set.note ?? '';

									await appendRow(spreadsheetId, sheets.statementSets.properties!.sheetId!, [
										...data,
										...(set.statements ?? [])
									]);
									return;
								}
							}
						}
					};
					const sortData = this.appState.sortData.data;
					if (sortData.statementSets) {
						if (
							!sortData.statementSets.some(
								({ statementSet }) => statementSet == sortData.currentStatementSetName
							)
						) {
							sortData.currentStatementSetName =
								sortData.sorts[sortData.sorts.length - 1]?.statementSet ??
								sortData.statementSets[0].statementSet;
						}
					}
					return true;
				},
				onFailure: (cause: unknown) => {
					this.appState = {
						state: 'authed',
						spreadsheetId,
						sortData: { state: 'error', error: String(cause) }
					};
					console.error(`Error importing sheet ${spreadsheetId} ${cause}`);
					throw cause;
				}
			})
		);
	};

	constructor() {}
}

const sortStore: SortStore = new SortStore();

export default sortStore;
export const loadSheet = async (id: GoogleSheetId | null = null) => {
	let savedSpreadsheetId: GoogleSheetId;
	try {
		savedSpreadsheetId = JSON.parse(
			localStorage.getItem(spreadsheetIdKey) ?? '""'
		) as GoogleSheetId;
	} catch (_err: unknown) {
		savedSpreadsheetId = '' as GoogleSheetId;
	}
	if (id != null) {
		localStorage.setItem(spreadsheetIdKey, JSON.stringify(id));
	} else if (savedSpreadsheetId != '') {
		id = savedSpreadsheetId;
	} else {
		console.error('Error loading sheet no key exists');
		return false;
	}

	return await sortStore.loadNewSpreadsheet(id);
};

export const loadSpreadsheetElsePick = async () => {
	let success = false;
	try {
		success = await loadSheet();
	} catch (_e: unknown) {
		success = false;
	}
	if (!success) {
		await pickSpreadsheet(loadSheet);
	}
};

export const pickNewSpreadsheet = async () => {
	await pickSpreadsheet(loadSheet);
};
