<script lang="ts">
  export let title: string;
  export let fps: number = 0;
  export let status: "Active" | "Offline" = "Active";
  export let maleCount: number = 0;
  export let femaleCount: number = 0;
  export let locations: { id: string; name: string }[] = [];
</script>

<div class="bg-muted/50 rounded-xl p-4 flex flex-col gap-4">
  <h2 class="font-semibold text-lg flex items-center gap-2">{title}</h2>

  <div class="space-y-3">
    <div class="bg-background/50 rounded-lg p-3 border">
      <div class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Performance</div>
      <!-- <div class="flex justify-between items-center">
        <span class="text-sm font-medium">FPS</span>
        <span class="text-lg font-bold text-green-600">{fps}</span>
      </div> -->
      <div class="flex justify-between items-center mt-1">
        <span class="text-sm font-medium">Status</span>
        <span
          class="text-xs px-2 py-1 rounded-full"
          class:bg-green-100={status === 'Active'}
          class:text-green-800={status === 'Active'}
          class:bg-yellow-100={status === 'Offline'}
          class:text-yellow-800={status === 'Offline'}
        >
          {status}
        </span>
      </div>
    </div>

    <div class="bg-background/50 rounded-lg p-3 border">
      <div class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Today's Traffic</div>
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-sm flex items-center gap-2">Male</span>
          <span class="font-semibold text-blue-600">{maleCount}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm flex items-center gap-2">Female</span>
          <span class="font-semibold text-pink-600">{femaleCount}</span>
        </div>
        <div class="border-t pt-2 mt-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Total</span>
            <span class="font-bold text-lg">{maleCount + femaleCount}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-background/50 rounded-lg p-3 border">
      <div class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Area List</div>
      <div class="space-y-1">
        {#each locations as location}
          <div class="flex justify-between items-center text-sm">
            <span class="truncate flex-1">{location.name}</span>
            <!-- <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
              Active
            </span> -->
          </div>
        {/each}
        {#if locations.length === 0}
          <div class="text-xs text-muted-foreground italic">No area configured</div>
        {/if}
      </div>
    </div>
  </div>
</div>  