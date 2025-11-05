<script lang="ts">
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import * as Card from "$lib/components/ui/card/index.js";

  export let title: string = "Daily Activity";
  export let processedData: { date: string; male: number; female: number }[] = [];

  const sortedData = processedData
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const last7Days = sortedData.slice(-7);

  const totalVisitors = last7Days.reduce((sum, item) => sum + (item.male + item.female), 0);
</script>

<Card.Root>
  <Card.Header class="flex items-center gap-2 space-y-0 border-b sm:flex-row">
    <div class="grid flex-1 gap-1 text-center sm:text-left">
        <Card.Title class="text-xl md:text-xl font-bold" >
            {title}
        </Card.Title>
    </div>
  </Card.Header>

  <Card.Content class="overflow-y-auto max-h-[260px]">
    {#if last7Days.length > 0}
      <div class="space-y-2">
        {#each last7Days as item}
          <div class="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
            <span class="text-sm font-medium text-muted-foreground">
              {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <span class="text-sm font-medium">{item.male}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-pink-500"></div>
                <span class="text-sm font-medium">{item.female}</span>
              </div>
              <span class="text-sm font-bold text-foreground ml-2">
                {item.male + item.female}
              </span>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="flex items-center justify-center h-[200px] text-muted-foreground">
        <div class="text-center flex flex-col items-center gap-2">
          <RefreshCw class="animate-spin w-6 h-6" />
          <div>
            <p class="text-sm font-medium">Loading Data</p>
          </div>
        </div>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
