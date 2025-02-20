<script lang="ts">
	import * as R from 'ramda';
	import TokenDescription from '$lib/components/token_description.svelte';
	import { dropzone, draggable } from '$lib/dnd';

	import StatementBucket from './StatementBucket.svelte';
	import { loadSave, doSave, statementSets } from '$lib/saves.svelte';
	import sortStore from '$lib/sortStore.svelte';
	import { Either, Option } from 'effect';
	import { isRight } from 'effect/StreamHaltStrategy';

	// const currentSort = loadSave();

	let imgSrc = $state('');
	let subject = $state('');
	let loading = $state(false);
	let canvasElement: null | HTMLCanvasElement = $state(null);
	let binVector: null | (number | undefined)[] = $state([]);

	const maxBin = $derived(
		R.reduce(
			R.max<number>,
			0,
			(binVector ?? []).filter((x): x is number => typeof x == 'number')
		)
	);
	const addBinAt = (i: number) => {
		binVector = binVector?.map((b) => (b == undefined || b < i ? b : b + 1)) ?? null;
	};
	const isComplete = (bins: (number | undefined)[]): bins is number[] => !bins.includes(undefined);
	const statements = $derived(
		sortStore.current.pipe(
			Either.map(({ statementSet }) => statementSet.statements),
			Either.getOrUndefined
		) ?? []
	);

	const unsorted = $derived(
		sortStore.current.pipe(
			Either.map(({ statementSet }) =>
				statementSet.statements.filter((_, i) => !binVector || binVector[i] == undefined)
			),
			Either.getOrUndefined
		) ?? []
	);
	const binnedStatements = $derived(
		sortStore.current.pipe(
			Either.map(({ statementSet }) =>
				statementSet.statements.reduce(
					(bins: number[][], s, i) => {
						if (!binVector) {
							return bins;
						}
						let binIndex = binVector[i];
						if (binIndex == undefined) {
							return bins;
						}
						bins[binIndex] = [...(bins[binIndex] ?? []), i];
						return bins;
					},
					[[], [], [], [], [], [], []] // 7 by default to match the likert
				)
			),
			Either.getOrUndefined
		) ?? []
	);

	const onImgLoad = async (e: Event & { currentTarget: EventTarget & Element }) => {
		loading = true;
		const imgViewer = e.currentTarget as unknown as HTMLImageElement;
		const ctx = canvasElement?.getContext('2d');
		let mat = cv.imread(imgViewer);

		if (ctx && canvasElement) {
			ctx.drawImage(imgViewer, 0, 0, canvasElement.width, canvasElement.height);
		}
		detect(
			mat,
			(
				detections: {
					id: number;
					hammingDistance: number;
					points: { data32S: [number, number, number, number, number, number, number, number] };
				}[]
			) => {
				let ids = '';

				const center = (detection: (typeof detections)[0]) => {
					let [x0, y0, x1, y1, x2, y2, x3, y3] = detection.points.data32S;
					return [(x0 + x1 + x2 + x3) / 4, (y0 + y1 + y2 + y3) / 4];
				};
				let deduped_detections = Object.values(
					detections.reduce((byId: Record<number, (typeof detections)[0]>, d) => {
						const candidate = byId[d.id];
						if (!candidate || candidate.hammingDistance > d.hammingDistance) {
							byId[d.id] = d;
						}
						return byId;
					}, {})
				);
				deduped_detections.sort((a, b) => center(a)[0] - center(b)[0]);

				const meanWidth =
					deduped_detections.reduce((sum, detection) => {
						let [x0, _y0, x1, _y1, x2, _y2, x3, _y3] = detection.points.data32S;
						return sum + Math.max(x0, x1, x2, x3) - Math.min(x0, x1, x2, x3);
					}, 0) / deduped_detections.length;

				let binnedCenters: number[];
				let binId = -1;
				let statementLocations: number[] = [];
				let errorCountVector = [];
				let binned_detections = deduped_detections.map((detection) => {
					let [xCenter, yCenter] = center(detection);
					if (
						!binnedCenters ||
						xCenter >
							4 * meanWidth + binnedCenters.reduce((a, b) => a + b, 0) / binnedCenters.length
					) {
						binId++;
						binnedCenters = [];
					}
					binnedCenters = [...binnedCenters, xCenter];
					statementLocations[detection.id] = binId;
					errorCountVector[detection.id] = detection.hammingDistance;
					return { ...detection, binId, xCenter, yCenter };
				});

				binned_detections.sort(
					(a, b) => a.binId * 100000 - a.yCenter - (b.binId * 100000 - b.yCenter)
				);
				binned_detections.forEach((detection, index) => {
					if (ctx && canvasElement) {
						let [x0, y0, x1, y1, x2, y2, x3, y3] = detection.points.data32S;

						// Start a new Path
						ctx.font = `${meanWidth / 6}px Arial`;
						ctx.fillStyle = 'red';
						ctx.fillText(String(detection.id), x0, y0);
						ctx.strokeStyle = `hsl(${45 * detection.binId} 100% 50%)`;
						ctx.lineWidth = 3;
						ctx.beginPath();
						const xScale = canvasElement.width / imgViewer.clientWidth;
						const yScale = canvasElement.height / imgViewer.clientHeight;
						ctx.moveTo(x0 * xScale, y0 * yScale);
						ctx.lineTo(x1 * xScale, y1 * yScale);
						ctx.lineTo(x2 * xScale, y2 * yScale);
						ctx.lineTo(x3 * xScale, y3 * yScale);
						ctx.lineTo(x0 * xScale, y0 * yScale);

						// Draw the Path
						ctx.stroke();
					}
				});
				console.log('statementLocations', statementLocations);
				binVector = statementLocations;
				loading = false;
			}
		);
	};
</script>

<main>
	<TokenDescription title="Do A Sort">
		<p class="body-4 desc">
			Or sort the printed cards, take a picture from above and upload it here
		</p>
	</TokenDescription>
	{#if imgSrc != ''}
		<div style="overflow: hidden; max-width: 1025px; height: 160px;">
			<img src={imgSrc} onload={onImgLoad} onclick={onImgLoad} alt="Your uploaded file" />
		</div>
	{/if}
	<p>
		{loading ? 'Loading...' : 'Select Image :'}

		<label>
			Image File
			<input
				type="file"
				id="fileInput"
				accept="image/png,image/jpg,image/jpeg"
				class="input-1"
				name="file"
				onchange={({ currentTarget }) => {
					if ('files' in currentTarget && currentTarget.files?.length) {
						imgSrc = URL.createObjectURL(currentTarget.files[0]);
					}
				}}
			/>
		</label>

		<label class="label-4">Subject</label>
		{#if Either.isRight(sortStore.current)}
			{@const subjects = Either.getOrThrow(sortStore.current).subjects}
			<select class="input-2" bind:value={subject}>
				{#each subjects as subject, i}
					<option value={subject}>
						{subject}
					</option>
				{/each}
			</select>
		{:else}
			{@const state = Option.getOrThrow(Either.getLeft(sortStore.current))[0]}
			<select class="input-2" bind:value={subject}>
				<option>
					{state}
				</option>
			</select>
		{/if}
	</p>
	{#if imgSrc}
		<h2 class="alt-heading-2">Annotated</h2>
		<canvas style="max-width: 100%;" width="4032" height="3024" bind:this={canvasElement} />
	{/if}
	{#if imgSrc}
		<h3 class="heading-3">Unsorted</h3>
		<StatementBucket statements={unsorted} {maxBin} />
	{:else if unsorted.length > 0}
		<div style="display: flex; flex-direction: column; gap: var(--space-1); margin: 2em 0;">
			<p>
				{1 + statements.length - unsorted.length} / {statements.length}
			</p>
			<p style="min-height: 40px; text-align: center;">{unsorted[0]}</p>
			<div class="ButtonGroup">
				{#each ['Very Much Does Not Describe', 'Does Not Describe', 'Somewhat Does Not Describe', 'Neither Describes nor Does Not Describe', 'Somewhat Describes', 'Describes', 'Very Much Describes'] as label, i}
					<button
						class="outline black button-2"
						onclick={() => {
							if (binVector) binVector[statements.indexOf(unsorted[0])] = i;
							// unsorted = unsorted.slice(1);
						}}
					>
						{label}
					</button>
				{/each}
			</div>
		</div>
	{:else if Either.isRight(sortStore.current)}
		{@const [current, loadedData] = Either.getOrThrow(
			Either.all([sortStore.current, sortStore.loadedData] as const)
		)}
		<button
			class="button-3 green"
			disabled={!binVector ||
				binVector?.length !== current.statementSet.statements.length ||
				!isComplete(binVector)}
			onclick={() => {
				if (binVector && isComplete(binVector))
					loadedData.appendSort({
						statementSet: loadedData.currentStatementSetName!,
						statementPositions: binVector,
						subject
					});
			}}
		>
			Save
		</button>
	{:else}
		<button class="button-3 green" disabled> Save </button>
	{/if}
	<div
		style={`display: grid; grid-template-columns: repeat(${binnedStatements.length},1fr); max-width: 100%; width: 100%; overflow-x: scroll; gap: var(--space-2); margin-top: var(--space-2); padding: var(--space-2);`}
	>
		{#each binnedStatements as binContents, binId}
			<div
				class="column"
				use:dropzone={{
					dragover_class: 'droppable',
					on_dropzone(statement: string) {
						let statememntId = R.indexOf(statement, statements);
						if (statememntId < 0 || !binVector) return;
						binVector[statememntId] = binId;
					}
				}}
			>
				<div style="display: flex; flex-direction: row;">
					<button
						class="button-1 filled green"
						style="padding: none; margin: auto; margin-left: 0;"
						onclick={() => addBinAt(binId - 1)}>＋</button
					>
					<h3 class="heading-3" style="margin: auto;">
						Bin {binId + 1}
					</h3>
					<button
						class="button-1 filled green"
						style="padding: none; margin: auto; margin-right: 0;"
						onclick={() => addBinAt(binId)}>＋</button
					>
				</div>
				<StatementBucket
					statements={(binContents ?? []).map((id) => statements[id] ?? String(id)) ?? []}
					{maxBin}
				/>
			</div>
		{/each}
	</div>
	<button
		class="button-3 green"
		disabled={!binVector || binVector?.length !== statements.length || !isComplete(binVector)}
		onclick={() => {
			sortStore.loadedData.pipe(
				Either.map(({ currentStatementSetName, appendSort }) => {
					if (binVector && isComplete(binVector))
						appendSort({
							statementSet: currentStatementSetName!,
							statementPositions: binVector,
							subject
						});
				})
			);
		}}
	>
		Save
	</button>
</main>

<style lang="scss">
	.column {
		outline: 2px solid var(--neutral-2);
		min-height: 100px;
		flex-grow: 1;
		max-width: max(20%, 15em);
		padding: var(--space-1);
		min-width: 140px;
	}
	.column:global(.droppable) {
		outline: 3px solid var(--orange-5);
		outline-offset: 0.25rem;
	}

	.column:global(.droppable) * {
		pointer-events: none;
	}

	.ButtonGroup {
		display: flex;
		flex-direction: row;
		gap: var(--space-1);
		margin: 2em 0;
		* {
			width: 0;
			flex-grow: 1;
		}
		@media screen and (max-width: 850px) {
			flex-direction: column;
			* {
				width: 100%;
			}
		}
	}
</style>
