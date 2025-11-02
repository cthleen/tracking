<script lang="ts">
  import { page as pageStore } from '$app/stores';
  import { derived } from 'svelte/store';
  import { enhance } from '$app/forms';

  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import CameraLocationSelector from "$lib/components/camera-location-selector.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { LightSwitch } from "$lib/components/ui/light-switch";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import FilePenLine from "@lucide/svelte/icons/file-pen-line";
  import Trash2 from "@lucide/svelte/icons/trash-2";

  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/store-feeds': 'Store Feeds',
    '/settings': 'Settings'
  };

  const pageTitle = derived(pageStore, $page => {
    const path = $page.url.pathname;
    return titles[path] ?? 'Dashboard';
  });

  let { data, form }: { data: any; form: any } = $props();

  let locationName = $state(form?.values?.locationName || '');
  let cameraId = $state(1); // hardcoded value for camera ID
  let x1 = $state(form?.values?.x1 || '');
  let x2 = $state(form?.values?.x2 || '');
  let y1 = $state(form?.values?.y1 || '');
  let y2 = $state(form?.values?.y2 || '');
  let isSubmitting = $state(false);

  let locations = $state(form?.locations || data?.locations || []);
  
  let editingId = $state<string | null>(null);
  let editForm = $state({
    name: '',
    x1: '',
    x2: '',
    y1: '',
    y2: ''
  });

  $effect(() => {
    if (form?.success) {
      locationName = '';
      cameraId = 1;
      x1 = '';
      x2 = '';
      y1 = '';
      y2 = '';
      if (form.locations) {
        locations = form.locations;
      }
      editingId = null;
    }
  });

  function handleLocationSelected(event: CustomEvent) {
    console.log('Location selected event:', event.detail);
    
    const { x1: newX1, y1: newY1, x2: newX2, y2: newY2 } = event.detail;
    
    x1 = String(newX1);
    y1 = String(newY1);
    x2 = String(newX2);
    y2 = String(newY2);
    
    console.log('Coordinates updated:', { x1, y1, x2, y2 });
  }

  function handleLocationLoaded(event: CustomEvent) {
    console.log('Location loaded event:', event.detail);
    
    const { x1: newX1, y1: newY1, x2: newX2, y2: newY2 } = event.detail;
    
    x1 = String(newX1);
    y1 = String(newY1);
    x2 = String(newX2);
    y2 = String(newY2);
    
    console.log('Coordinates loaded:', { x1, y1, x2, y2 });
  }

  function handleLocationCleared() {
    console.log('Location cleared');
    x1 = '';
    y1 = '';
    x2 = '';
    y2 = '';
  }

  function startEditing(location: any) {
    editingId = location.id;
    editForm = {
      name: location.name,
      x1: location.x1.toString(),
      x2: location.x2.toString(),
      y1: location.y1.toString(),
      y2: location.y2.toString()
    };
  }

  function cancelEditing() {
    editingId = null;
    editForm = { name: '', x1: '', x2: '', y1: '', y2: '' };
  }

  function confirmDelete() {
    return confirm('Are you sure you want to delete this location?');
  }

  async function handleDelete(locationId: string) {
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      console.log('Attempting to delete location with ID:', locationId);
      const response = await fetch(`http://localhost:8000/api/location/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (response.ok) {
        console.log('Delete successful, updating UI');

        locations = locations.filter(loc => loc.id !== locationId);

        form = { ...form, success: 'Location deleted successfully!' };
      } else {
        console.error('Delete failed with status:', response.status, 'body:', responseText);

        form = { ...form, error: `Failed to delete location: ${responseText}` };
      }
    } catch (error) {
      console.error('Network error deleting location:', error);
      form = { ...form, error: `Network error: ${(error as Error).message}` };
    }
  }

  $effect(() => {
    const hasCoordinates = x1 && y1 && x2 && y2;
    console.log('Has all coordinates:', hasCoordinates, { x1, y1, x2, y2 });
  });
</script>

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 px-4">
      <div class="flex items-center gap-2">
        <Sidebar.Trigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item class="hidden md:block">
              <Breadcrumb.Link href="#" class="text-base">
                {$pageTitle}
              </Breadcrumb.Link>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>

      <div class="ml-auto">
        <LightSwitch />
      </div>      
    </header>

    <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
      <!-- Notification Area -->
      {#if form?.success}
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span class="font-medium">{form.success}</span>
          <button
            type="button"
            class="text-green-700 hover:text-green-900 font-bold text-xl leading-none"
            onclick={() => form.success = null}
          >
            ×
          </button>
        </div>
      {/if}

      {#if form?.error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span class="font-medium">{form.error}</span>
          <button
            type="button"
            class="text-red-700 hover:text-red-900 font-bold text-xl leading-none"
            onclick={() => form.error = null}
          >
            ×
          </button>
        </div>
      {/if}

      <!-- List of Locations -->
      <div class="bg-muted/50 rounded-xl p-6">
        <h2 class="text-xl font-bold mb-6">Saved Locations</h2>
  
        {#if locations.length === 0}
          <p class="text-gray-500">No locations yet.</p>
        {:else}
          <div class="space-y-2">
            {#each locations as loc}
              {#if editingId === loc.id}
                <!-- Edit Form -->
                <div class="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <h3 class="font-semibold mb-3 text-blue-800">Edit Location</h3>
                  <form method="POST" action="?/updateLocation" use:enhance class="space-y-3">
                    <input type="hidden" name="locationId" value={loc.id} />

                    <div>
                      <label for="edit-locationName-{loc.id}" class="block text-sm font-medium mb-1">
                        Location Name
                      </label>
                      <Input
                        id="edit-locationName-{loc.id}"
                        name="name"
                        type="text"
                        bind:value={editForm.name}
                        required
                      />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label for="edit-x1-{loc.id}" class="block text-sm font-medium mb-1">X1</label>
                        <Input
                          id="edit-x1-{loc.id}"
                          name="x1"
                          type="number"
                          step="any"
                          bind:value={editForm.x1}
                          required
                        />
                      </div>
                      <div>
                        <label for="edit-y1-{loc.id}" class="block text-sm font-medium mb-1">Y1</label>
                        <Input
                          id="edit-y1-{loc.id}"
                          name="y1"
                          type="number"
                          step="any"
                          bind:value={editForm.y1}
                          required
                        />
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label for="edit-x2-{loc.id}" class="block text-sm font-medium mb-1">X2</label>
                        <Input
                          id="edit-x2-{loc.id}"
                          name="x2"
                          type="number"
                          step="any"
                          bind:value={editForm.x2}
                          required
                        />
                      </div>
                      <div>
                        <label for="edit-y2-{loc.id}" class="block text-sm font-medium mb-1">Y2</label>
                        <Input
                          id="edit-y2-{loc.id}"
                          name="y2"
                          type="number"
                          step="any"
                          bind:value={editForm.y2}
                          required
                        />
                      </div>
                    </div>

                    <div class="flex gap-2">
                      <Button type="submit" size="sm" class="bg-blue-600 hover:bg-blue-700">
                        Save Changes
                      </Button>
                      <Button type="button" variant="outline" size="sm" onclick={cancelEditing}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              {:else}
                <div class="p-3 border rounded-lg bg-muted shadow-sm flex justify-between items-start">
                  <div>
                    <p class="font-semibold">{loc.name}</p>
                    <p class="text-sm text-muted-foreground">
                      x1: {loc.x1}, y1: {loc.y1}, x2: {loc.x2}, y2: {loc.y2}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onclick={() => startEditing(loc)}
                      class="text-blue-600 hover:text-blue-800 p-2"
                      title="Edit location"
                    >
                      <FilePenLine size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onclick={() => handleDelete(loc.id)}
                      class="text-red-600 hover:text-red-800 p-2"
                      title="Delete location"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>

      <!-- Add Location Form -->
      <div class="bg-muted/50 rounded-xl p-6">
        <h2 class="text-xl font-bold mb-6">Add New Location</h2>
  
        <form method="POST" action="?/addLocation" use:enhance class="space-y-4 w-full">
  
          <div>
            <label for="locationName" class="block text-sm font-medium mb-2">Location Name</label>
            <Input
              id="locationName"
              name="name"
              type="text"
              placeholder="Enter location name"
              bind:value={locationName}
              required
            />
          </div>
  
          <CameraLocationSelector
            on:location-selected={handleLocationSelected}
            on:location-loaded={handleLocationLoaded}
            on:location-cleared={handleLocationCleared}
          />

          <input type="hidden" name="camera_id" value={cameraId} />

          <input type="hidden" name="x1" value={x1} />
          <input type="hidden" name="y1" value={y1} />
          <input type="hidden" name="x2" value={x2} />
          <input type="hidden" name="y2" value={y2} />

          {#if x1 && y1 && x2 && y2}
            <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-sm text-green-700 font-semibold mb-1">
                ✓ Coordinates selected successfully
              </p>
              <p class="text-xs text-green-600 font-mono">
                Camera ID: {cameraId} | x1: {x1}, y1: {y1}, x2: {x2}, y2: {y2}
              </p>
            </div>
          {:else}
            <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p class="text-sm text-yellow-700">
                Please select an area on the camera feed above
              </p>
            </div>
          {/if}

          <!-- debug -->
          <!-- {#if import.meta.env.DEV}
            <div class="p-2 bg-gray-100 rounded text-xs font-mono">
              <p class="font-bold mb-1">Debug Info:</p>
              <p>locationName: "{locationName || 'empty'}"</p>
              <p>cameraId: "{cameraId}"</p>
              <p>x1: "{x1 || 'empty'}"</p>
              <p>y1: "{y1 || 'empty'}"</p>
              <p>x2: "{x2 || 'empty'}"</p>
              <p>y2: "{y2 || 'empty'}"</p>
              <p>canSubmit: {!!(locationName && cameraId && x1 && y1 && x2 && y2)}</p>
            </div>
          {/if} -->

          <Button 
            type="submit" 
            disabled={!locationName || !x1 || !y1 || !x2 || !y2 || isSubmitting} 
            class="w-full"
          >
            {isSubmitting ? 'Adding Location...' : 'Add Location'}
          </Button>
        </form>
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
