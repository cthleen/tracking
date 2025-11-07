<script>
	import { invalidateAll } from '$app/navigation';
	import { enhance, applyAction } from '$app/forms';
	import FilePenLine from "@lucide/svelte/icons/file-pen-line";
	import Trash2 from "@lucide/svelte/icons/trash-2";
	import X from "@lucide/svelte/icons/x";
	import CameraLocationSelector from "./camera-area-selector.svelte";

	export let locations = [];

	let editingLocation = null;
	let showModal = false;
	let cameraSelector;
	let isSubmitting = false;

	let editForm = { 
		name: '', 
		x1: '', 
		y1: '', 
		x2: '', 
		y2: '', 
		camera_id: 1 
	};

	function startEditing(loc) {
		editingLocation = { ...loc };
		editForm = {
			name: loc.name,
			x1: loc.x1,
			y1: loc.y1,
			x2: loc.x2,
			y2: loc.y2,
			camera_id: Number(loc.camera_id)
		};
		showModal = true;
	}

	function cancelEditing() {
		showModal = false;
		editingLocation = null;
		editForm = { 
			name: '', 
			x1: '', 
			y1: '', 
			x2: '', 
			y2: '', 
			camera_id: 1 
		};
		if (cameraSelector) {
			cameraSelector.clear();
		}
	}

	function updateEditLocation({ detail }) {
		editForm.x1 = detail.x1;
		editForm.y1 = detail.y1;
		editForm.x2 = detail.x2;
		editForm.y2 = detail.y2;
	}

	function clearEditLocation() {
		editForm.x1 = editForm.y1 = editForm.x2 = editForm.y2 = "";
	}

	function handleCameraChange() {
		clearEditLocation();
		if (cameraSelector) {
			cameraSelector.clear();
		}
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

<!-- Edit Modal -->
{#if showModal} 
	<div 
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
		on:click={cancelEditing}
		on:keydown={(e) => e.key === 'Escape' && cancelEditing()}
		role="dialog"
		aria-modal="true"
	>
		<div 
			class="bg-background rounded-lg border-2 border-border shadow-xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden" 
			on:click|stopPropagation
		>
			<div class="bg-background border-b-2 border-border px-6 py-4 flex justify-between items-center flex-shrink-0">
				<h2 class="text-xl font-bold">Edit Area</h2>
				<button
					type="button"
					class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
					on:click={cancelEditing}
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<div class="p-6 space-y-4 overflow-y-auto flex-1">
				<form 
					method="POST" 
					action="?/updateLocation"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result }) => {
							isSubmitting = false;
							if (result.type === 'success') {
								await invalidateAll();
								cancelEditing();
							}
							await applyAction(result);
						};
					}}
				>
					<input type="hidden" name="locationId" value={editingLocation?.id} />
					<input type="hidden" name="x1" value={editForm.x1} />
					<input type="hidden" name="y1" value={editForm.y1} />
					<input type="hidden" name="x2" value={editForm.x2} />
					<input type="hidden" name="y2" value={editForm.y2} />
					
					<div class="flex gap-3 mb-4">
						<div class="flex-1">
							<label class="text-sm font-medium mb-2 block">Area Name</label>
							<input 
								type="text"
								name="name" 
								placeholder="Area name" 
								bind:value={editForm.name}
								class="w-full rounded-md border-2 border-input bg-background text-foreground px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
								required
							/>
						</div>

						<div class="flex-1">
							<label class="text-sm font-medium mb-2 block">
								Camera Selection
							</label>
							<div class="relative">
								<select
									name="camera_id"
									bind:value={editForm.camera_id}
									on:change={handleCameraChange}
									class="w-full appearance-none rounded-md border-2 border-input bg-background text-foreground px-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
								>
									<option value={1}>Camera 1</option>
									<option value={2}>Camera 2</option>
								</select>
						
								<svg
									class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
						</div>																
					</div>

					<div class="mb-4">
						<label class="text-sm font-medium mb-2 block">Select Area on Camera</label>
						<CameraLocationSelector
							bind:this={cameraSelector}
							cameraId={editForm.camera_id}
							on:locationSelected={updateEditLocation}
							on:locationCleared={clearEditLocation}
						/>
					</div>

					<div class="flex gap-3">
						<button
							type="button"
							class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
							on:click={cancelEditing}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={!editForm.name || !editForm.x1 || !editForm.y1 || !editForm.x2 || !editForm.y2 || isSubmitting}
						>
							{isSubmitting ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}