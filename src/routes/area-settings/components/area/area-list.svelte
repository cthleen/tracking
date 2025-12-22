<script>
	import { invalidateAll } from '$app/navigation';
	import { enhance, applyAction } from '$app/forms';
	import FilePenLine from "@lucide/svelte/icons/file-pen-line";
	import Trash2 from "@lucide/svelte/icons/trash-2";
	import EditAreaModal from "./edit-area-modal.svelte";

	export let locations = [];

	let editingLocation = null;
	let showModal = false;

	function startEditing(loc) {
		editingLocation = { ...loc };
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingLocation = null;
	}
</script>

<div class="bg-muted/50 rounded-xl p-6">
	<h2 class="text-xl font-bold mb-6">Saved Areas</h2>

	{#if locations.length === 0}
		<p class="text-gray-500">No locations yet.</p>
	{:else}
		<div class="space-y-3">
			{#each locations as loc (loc.id)}
				<div class="p-4 border rounded-xl bg-muted flex justify-between items-center">
					<div>
						<p class="font-medium">{loc.name}</p>
						<p class="text-xs text-muted-foreground">
							Camera {loc.camera_id}, 
							x1: {loc.x1}, 
							y1: {loc.y1}, 
							x2: {loc.x2}, 
							y2: {loc.y2}
						</p>
					</div>
					<div class="flex gap-2 items-center">
						<button
							type="button"
							class="inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
							on:click={() => startEditing(loc)}
						>
							<FilePenLine class="h-4 w-4" />
						</button>
						
						<form 
							method="POST" 
							action="?/deleteLocation"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										await invalidateAll();
									}
									await applyAction(result);
								};
							}}
						>
							<input type="hidden" name="locationId" value={loc.id} />
							<button
								type="submit"
								class="inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3"
								on:click={(e) => {
									if (!confirm("Are you sure you want to delete this location?")) {
										e.preventDefault();
									}
								}}
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<EditAreaModal 
	location={editingLocation}
	bind:open={showModal}
	on:close={closeModal}
/>