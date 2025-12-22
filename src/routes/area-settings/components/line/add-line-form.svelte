<script>
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import CameraLineSelector from "../camera/camera-line-selector.svelte";

	// export let locations;
	// export let form;

	let lineName = "";
	let x1 = "", y1 = "", x2 = "", y2 = "";
	let cameraId = 1;

	const cameras = [
		{ id: 1, name: "Camera 1" },
		{ id: 2, name: "Camera 2" }
	];

	function update({ detail }) {
		x1 = detail.x1;
		y1 = detail.y1;
		x2 = detail.x2;
		y2 = detail.y2;
	}

	function clear() {
		x1 = y1 = x2 = y2 = "";
	}

	function handleCameraChange() {
		clear();
	}
</script>

<div class="bg-muted/50 rounded-xl p-6">
	<h2 class="text-xl font-bold mb-6">Add New Line</h2>

	<form method="POST" action="?/addLine">
		<div class="flex gap-3 mb-4">
			<!-- <div class="flex-1">
				<label class="text-sm font-medium mb-2 block">Line Name</label>
				<Input
					name="name"
					placeholder="Line name"
					bind:value={lineName}
					class="w-full"
				/>
			</div> -->

			<div class="flex-1">
				<p class="text-sm font-medium mb-2 block">Camera Selection</p>
				<div class="relative">
					<select
						name="camera_id"
						bind:value={cameraId}
						on:change={handleCameraChange}
						class="w-full appearance-none rounded-md border-2 border-input bg-background text-foreground px-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
					>
						{#each cameras as cam}
							<option value={cam.id}>{cam.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<p class="text-sm font-medium mb-2 block">Draw Line on Camera</p>
		<div class="mt-4 mb-4">
			<CameraLineSelector
				{cameraId}
				on:locationSelected={update}
				on:locationLoaded={update}
				on:locationCleared={clear}
			/>
		</div>

		<input type="hidden" name="x1" value={x1} />
		<input type="hidden" name="y1" value={y1} />
		<input type="hidden" name="x2" value={x2} />
		<input type="hidden" name="y2" value={y2} />

		<Button type="submit" class="w-full" disabled={!lineName || !x1}>
			Add Line
		</Button>
	</form>
</div>
