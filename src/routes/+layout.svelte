<script lang="ts">
	import '@picocss/pico/css/pico.min.css';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Icon paths: 24×24, stroked.
	const links = [
		{ href: '/', label: 'Home', icon: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
		{ href: '/quizzes', label: 'Catalogue', icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5' },
		{ href: '/new', label: 'Create', icon: 'M12 5v14M5 12h14' },
		{ href: '/my', label: 'My quizzes', icon: 'M4 6h16M4 12h16M4 18h10' }
	];

	const isCurrent = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);

	const year = new Date().getFullYear();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
	<nav class="container" aria-label="Main">
		<ul>
			<li>
				<a href="/" class="brand"><span class="logo-mark" aria-hidden="true">Q</span> QuizLab</a>
			</li>
		</ul>
		<ul class="top-links">
			{#each links as link (link.href)}
				<li>
					<a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a>
				</li>
			{/each}
		</ul>
	</nav>
</header>

<main id="main" class="container">
	{@render children()}
</main>

<footer class="site-footer">
	<div class="container">
		<p>
			© {year} QuizLab ·
			<a href="/about#licence">Licence</a> ·
			<a href="/about#contact">Contact</a> ·
			<a href="/about#privacy">Privacy</a>
		</p>
	</div>
</footer>

<nav class="bottom-nav" aria-label="Main (mobile)">
	<ul>
		{#each links as link (link.href)}
			<li>
				<a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={link.icon} /></svg>
					<span>{link.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.site-header {
		background: var(--ql-header-bg);
		color: var(--ql-header-text);
		margin-bottom: 1rem;
	}

	.site-header nav {
		padding-block: 0.25rem;
	}

	.site-header a {
		color: var(--ql-header-text);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		font-size: 1.2rem;
		text-decoration: none;
	}

	.top-links a[aria-current='page'] {
		text-decoration: underline;
		text-decoration-color: var(--ql-gold);
		text-decoration-thickness: 3px;
		text-underline-offset: 6px;
	}

	.site-header :global(:focus-visible) {
		outline-color: var(--ql-gold);
	}

	.site-footer {
		border-top: 1px solid var(--pico-muted-border-color);
		margin-top: 2rem;
		padding-block: 1rem;
		font-size: 0.875rem;
		color: var(--pico-muted-color);
	}

	.site-footer p {
		margin: 0;
	}

	.bottom-nav {
		display: none;
	}

	/* Mobile: links move from the header to a bottom bar. */
	@media (max-width: 767.98px) {
		.top-links {
			display: none;
		}

		.site-footer {
			padding-bottom: calc(var(--ql-nav-height) + 1rem);
		}

		.bottom-nav {
			display: block;
			position: fixed;
			inset: auto 0 0 0;
			z-index: 10;
			height: var(--ql-nav-height);
			background: var(--pico-background-color);
			border-top: 1px solid var(--pico-muted-border-color);
		}

		.bottom-nav ul {
			display: flex;
			height: 100%;
			margin: 0;
			padding: 0;
		}

		.bottom-nav li {
			flex: 1;
			list-style: none;
			margin: 0;
			padding: 0;
		}

		.bottom-nav a {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 0.15rem;
			height: 100%;
			font-size: 0.75rem;
			text-decoration: none;
			color: var(--pico-color);
			border-top: 3px solid transparent;
		}

		.bottom-nav a[aria-current='page'] {
			color: var(--pico-primary);
			border-top-color: var(--ql-gold);
			font-weight: 600;
		}

		.bottom-nav svg {
			width: 1.5rem;
			height: 1.5rem;
			fill: none;
			stroke: currentColor;
			stroke-width: 2;
			stroke-linecap: round;
			stroke-linejoin: round;
		}
	}
</style>
