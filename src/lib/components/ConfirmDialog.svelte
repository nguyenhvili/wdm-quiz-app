<script lang="ts">
	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel,
		onconfirm
	}: {
		open?: boolean;
		title: string;
		message: string;
		confirmLabel: string;
		onconfirm: () => void;
	} = $props();

	let dialog: HTMLDialogElement;
	const id = $props.id();

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} aria-labelledby="{id}-title">
	<article>
		<h2 id="{id}-title">{title}</h2>
		<p>{message}</p>
		<footer>
			<button type="button" class="secondary" onclick={() => (open = false)}>Cancel</button>
			<button
				type="button"
				class="danger"
				onclick={() => {
					open = false;
					onconfirm();
				}}>{confirmLabel}</button
			>
		</footer>
	</article>
</dialog>

<style>
	h2 {
		font-size: 1.25rem;
	}

	.danger {
		background: var(--ql-danger);
		border-color: var(--ql-danger);
		color: var(--ql-on-danger);
	}
</style>
