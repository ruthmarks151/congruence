<script>
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import LinkCard from '$lib/components/link_card.svelte';

	let saveExists = $derived(!!browser && window.localStorage.getItem('WorkingSave'));
</script>

<div class="grid">
	<header>
		<h1 class="alt-heading-6">Congruence</h1>
		<p class="body-4">
			A tool for psychological assessment and personality discovery based on the work of Carl Rogers
		</p>

		<p class="body-4">
			This technique was used to assess the efficacy of psychotherapy was the Q-Sort. This requires
			the subject to sort self-describing statements (e.g., "I have a great deal of confidence in my
			abilities") into 9 categories according to how well or poorly the statements describe the
			individual. Rogers generally asked clients to complete the QSort twice: Once sorting the
			statements according to how they saw themselves (the self sort), and again according to how
			they would like to be (the ideal sort). Rogers found that the two sorts became more similar as
			therapy progressed, with both changing to resemble the other.
		</p>

		<LinkCard
			href="{base}/print"
			title="Print Cards"
			desc="Select a set of statements and print them"
		/>
	</header>

	<main>
		<h2 class="heading-4">Get Started</h2>
		<p class="body-3">Print the cards to do a sort, or upload a save file</p>
		<nav>
			<menu>
				<li>
					<LinkCard
						href="{base}/saves"
						title="Save/Load"
						desc={saveExists
							? 'Load an existing set of results from a file'
							: "No save is currently loaded, the app won't work right until you upload one, or pick a template"}
						danger={!saveExists}
					/>
				</li>
				<li>
					<LinkCard href="{base}/scan" title="Scan" desc="Scan a sort you've performed" />
				</li>
			</menu>
		</nav>

		<h2 class="heading-4">Analysis</h2>
		<p class="body-3">Examine the sorts you've done through various lenses</p>
		<nav>
			<menu>
				<li>
					<LinkCard
						href="{base}/compare"
						title="Compare Two Sorts"
						desc="Compare two sorts, side by side with congruence computed"
					/>
				</li>
				<li>
					<LinkCard
						href="{base}/time"
						title="Statements Over Time"
						desc="Examine how the relevance of statements changes over time"
					/>
				</li>
				<li>
					<LinkCard
						href="{base}/congruence"
						title="Congruence Over Time"
						desc="Examine how the congruence of two subjects changes over time"
					/>
				</li>
			</menu>
		</nav>
	</main>
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1.5fr 2fr;
		min-height: 100vh;
		min-height: 100lvh;
		gap: var(--space-12);
	}

	header {
		position: sticky;
		top: 0;
		height: fit-content;
		padding-block: var(--space-14);
		padding-inline-start: var(--space-12);
	}

	h1 {
		margin-block-end: var(--space-6);
		color: var(--app-accent);
	}

	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-block-start: var(--space-14);
		max-width: 800px;
		padding-inline-start: 0;
		padding-inline-end: var(--space-12);
	}

	@media screen and (max-width: 700px) {
		header,
		main {
			grid-column: 1 / 3;
			padding-block: 0;
			padding-inline: var(--space-8);
		}

		header {
			position: static;
			padding-block-start: var(--space-12);
		}
	}

	nav,
	h2 {
		width: 100%;
	}

	menu {
		margin-block-end: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		list-style: none;
		padding: 0;
	}

	h2 {
		margin-block-start: var(--space-10);
		margin-block-end: var(--space-2);
	}

	h2:first-of-type {
		margin-block-start: 0;
	}

	.body-3 {
		width: 100%;
		margin-block-end: var(--space-3);
	}

	header p {
		margin-block: var(--space-6);
	}
</style>
