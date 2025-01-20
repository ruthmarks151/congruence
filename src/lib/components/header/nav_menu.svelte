<script lang="ts">
	import { page } from '$app/stores';

	let showMenu = $state(false);

	let navRef: HTMLElement | undefined = $state();

	function handleOutsideClick(event: MouseEvent) {
		if (!showMenu) {
			return;
		}

		if (!navRef?.contains(event.target as Node | null)) {
			hideMenu();
		}
	}

	function hideMenu() {
		showMenu = false;
	}
</script>

<svelte:window onclick={handleOutsideClick} />

<nav bind:this={navRef}>
	<button
		aria-label={showMenu ? 'Show menu' : 'Hide menu'}
		class="button-1 ghost"
		class:show={showMenu}
		onclick={() => (showMenu = !showMenu)}
	>
		<div></div>
	</button>

	{#if showMenu}
		<menu>
			<li aria-current={$page.url.pathname === '/' ? 'page' : undefined}>
				<a onclick={hideMenu} class="link-3" href="/">Home</a>
			</li>
			<li aria-current={$page.url.pathname.startsWith('/saves') ? 'page' : undefined}>
				<a onclick={hideMenu} class="link-3" href="/saves">Save/Load</a>
			</li>
			<li aria-current={$page.url.pathname.startsWith('/print') ? 'page' : undefined}>
				<a onclick={hideMenu} class="link-3" href="/print">Print Cards</a>
			</li>
			<hr />
			<li aria-current={$page.url.pathname.startsWith('/scan') ? 'page' : undefined}>
				<a onclick={hideMenu} class="link-3" href="/scan">Scan a Sort</a>
			</li>
			<hr />
			<li aria-current={$page.url.pathname === '/compare' ? 'page' : undefined}>
				<a onclick={hideMenu} class="link-3" href="/compare">Compare Two Sorts</a>
			</li>
			<li aria-current={$page.url.pathname === '/time' ? 'page' : undefined}>
				<a onclick={hideMenu} class="link-3" href="/time">Statements Over Time</a>
			</li>
			<li aria-current={$page.url.pathname === '/congruence' ? 'page' : undefined}>
				<a onclick={hideMenu} class="link-3" href="/congruence">Congruence Over Time</a>
			</li>
		</menu>
	{/if}
</nav>

<style>
	nav {
		display: flex;
	}

	button {
		position: relative;
		display: flex;
		flex-direction: column;
		align-self: center;
		height: var(--space-11);
		width: var(--space-11);

		&::before,
		&::after {
			content: '';
			transform: rotate(var(--rotate));
			transition: all 300ms ease-in-out;
			position: absolute;
		}

		&::before {
			top: var(--space-2);
		}

		&::after {
			bottom: var(--space-2);
		}

		& div,
		&::before,
		&::after {
			width: var(--space-8);
			height: var(--space-1);
			background: var(--neutral-1);
			border-radius: var(--radius-1);
		}

		&.show div {
			display: none;
		}

		&.show::before,
		&.show::after {
			top: var(--space-5);
			bottom: var(--space-5);
		}

		&.show::before {
			--rotate: 45deg;
		}
		&.show::after {
			--rotate: -45deg;
		}
	}

	hr {
		margin-block: var(--space-3);
	}

	menu {
		width: calc(var(--space-14) * 2);
		list-style: none;
		position: absolute;
		top: calc(var(--space-1) + var(--header-height));
		right: 0;
		background-color: #fff;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-8);
		border-radius: var(--radius-2);
		box-shadow: var(--space-2) var(--space-1) var(--space-3) var(--space-1) rgba(0, 0, 0, 0.1);
	}

	@media print {
		menu {
			display: none;
		}
	}

	a {
		position: relative;
		display: flex;
		justify-content: space-between;
	}

	@media (prefers-reduced-motion) {
		button {
			transition: none;
		}
	}
</style>
