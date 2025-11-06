<script>
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import CameraLocationSelector from "./camera-area-selector.svelte";

	export let locations;
	export let form;

	let locationName = "";
	let x1 = "", y1 = "", x2 = "", y2 = "";
	let cameraId = 1;

	const cameras = [
		{ id: 1, name: "Camera 1" },
		{ id: 2, name: "Camera 2" }
	];

	function update({ detail }) {
		x1 = detail.x1; y1 = detail.y1; x2 = detail.x2; y2 = detail.y2;
	}
	function clear() { x1 = y1 = x2 = y2 = ""; }
</script>

<div class="bg-muted/50 rounded-xl p-6">
	<h2 class="text-xl font-bold mb-6">Add New Area</h2>

	<form method="POST" action="?/addLocation">
		<div class="flex gap-3 mb-4">
			<div class="flex-1">
				<label class="text-sm font-medium mb-2 block">Area Name</label>
				<Input name="name" placeholder="Area name" bind:value={locationName} class="w-full" />
			</div>

			<div class="flex-1">
				<label class="text-sm font-medium mb-2 block">Camera Selection</label>
				<div class="relative">
					<select
						name="camera_id"
						bind:value={cameraId}
						class="w-full appearance-none rounded-md border border-input bg-background text-foreground px-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
					>
						{#each cameras as cam}
							<option value={cam.id}>{cam.name}</option>
						{/each}
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

		<label class="text-sm font-medium mb-2 block">Select Area on Camera</label>
		<div class="mt-4 mb-4">
			<CameraLocationSelector
				on:location-selected={update}
				on:location-loaded={update}
				on:location-cleared={clear}
			/>
		</div>

		<input type="hidden" name="x1" value={x1}/>
		<input type="hidden" name="y1" value={y1}/>
		<input type="hidden" name="x2" value={x2}/>
		<input type="hidden" name="y2" value={y2}/>

		<Button type="submit" class="w-full" disabled={!locationName || !x1}>
			Add Area
		</Button>
	</form>
</div>