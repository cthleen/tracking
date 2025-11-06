<script>
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import FilePenLine from "@lucide/svelte/icons/file-pen-line";
	import Trash2 from "@lucide/svelte/icons/trash-2";
	import X from "@lucide/svelte/icons/x";
	import CameraLocationSelector from "./camera-area-selector.svelte";

	export let locations = [];
	export let form;

	let editingLocation = null;
	let showModal = false;
	let headerVisible = true;
	let lastScrollY = 0;
	let showTopForm = true;

	let editForm = { name:'', x1:'', y1:'', x2:'', y2:'', camera_id: 1 };

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
		editForm = { name:'', x1:'', y1:'', x2:'', y2:'', camera_id: 1 };
		showTopForm = true;
	}

	function handleScroll() {
		showTopForm = false;
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

	async function handleUpdate(event) {
		event.preventDefault();
		if (!editingLocation) return;

		const payload = {
			name: editForm.name,
			camera_id: Number(editForm.camera_id),
			x1: Number(editForm.x1),
			y1: Number(editForm.y1),
			x2: Number(editForm.x2),
			y2: Number(editForm.y2)
		};

		try {
			const res = await fetch(`http://localhost:8000/api/location/${editingLocation.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const errorText = await res.text();
				form = { error: `Update failed: ${errorText || res.statusText}` };
				return;
			}

			const updatedLocation = await res.json();

			const idx = locations.findIndex(l => Number(l.id) === Number(editingLocation.id));
			if (idx !== -1) {
			const merged = { ...locations[idx], ...updatedLocation };
			locations = [
				...locations.slice(0, idx),
				merged,
				...locations.slice(idx + 1)
			];
			}

			form = { success: 'Location updated!' };
			cancelEditing();
		} catch (e) {
			form = { error: `Network error: ${e.message}` };
			console.error(e);
		}
	}

	async function handleDelete(id) {
		const ok = confirm("Are you sure you want to delete this location?");
		if (!ok) return;

		try {
			const res = await fetch(`http://localhost:8000/api/location/${id}`, { method: 'DELETE' });
			if (res.ok) {
				locations = locations.filter(l => l.id !== id);
				form = { success: 'Location deleted!' };
			} else {
				form = { error: 'Failed to delete location.' };
			}
		} catch (e) {
			form = { error: 'Network error' };
		}
	}
</script>

<div class="bg-muted/50 rounded-xl p-6">
	<h2 class="text-xl font-bold mb-6">Saved Area</h2>

	{#if locations.length === 0}
		<p class="text-gray-500">No locations yet.</p>
	{:else}
		<div class="space-y-3">
			{#each locations as loc}
				<div class="p-4 border rounded-xl bg-muted flex justify-between items-center">
					<div>
						<p class="font-medium">{loc.name}</p>
						<p class="text-xs text-muted-foreground">
							<!-- Camera: {loc.camera_id ?? "-"},  -->
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
						<button
							type="button"
							class="inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-3"
							on:click={() => handleDelete(loc.id)}
						>
							<Trash2 class="h-4 w-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- edit modal -->
{#if showModal} 
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click={cancelEditing}>
		<div class="bg-background rounded-lg border-2 border-border shadow-xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden" on:click|stopPropagation>
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
				<form on:submit={handleUpdate} class="space-y-4">
					<div class="flex gap-3">
						<div class="flex-1">
							<label class="text-sm font-medium mb-2 block">Area Name</label>
							<Input name="name" placeholder="Area name" bind:value={editForm.name} />
						</div>

						<div class="flex-1">
							<label class="text-sm font-medium mb-2 block">
								Camera Selection
							</label>
							<div class="relative">
								<select
									bind:value={editForm.camera_id}
									on:change={() => {
										editForm.x1 = editForm.y1 = editForm.x2 = editForm.y2 = "";
									}}
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

					<div>
						<label class="text-sm font-medium mb-2 block">Select Area on Camera</label>
						<CameraLocationSelector
							on:location-selected={updateEditLocation}
							on:location-cleared={clearEditLocation}
							initialX1={editForm.x1}
							initialY1={editForm.y1}
							initialX2={editForm.x2}
							initialY2={editForm.y2}
							cameraId={editForm.camera_id}
							on:scroll={handleScroll}
						/>
					</div>

					<button
						type="submit"
						class="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
					>
						Save Changes
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}