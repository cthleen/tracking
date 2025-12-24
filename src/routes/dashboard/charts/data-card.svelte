<script lang="ts">
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import * as Card from "$lib/components/ui/card/index.js";

  export let title: string = "Recent Activity";
  export let processedData: { date: string; male: number; female: number }[] = [];

  const sortedData = processedData
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const last7Days = sortedData.slice(-7);

  const totalVisitors = last7Days.reduce(
    (sum, item) => sum + item.male + item.female,
    0
  );

  const hasAnyActivity = last7Days.some(
    item => item.male > 0 || item.female > 0
  );

  const isLoading = processedData.length === 0;
</script>

<Card.Root>
  <Card.Header class="flex items-center gap-2 border-b">
    <div class="flex-1">
      <Card.Title class="text-xl font-bold">
        {title}
      </Card.Title>
      {#if hasAnyActivity}
        <p class="text-sm text-muted-foreground mt-1">
          Total visitors (last 7 days): 
          <span class="font-semibold text-foreground">{totalVisitors}</span>
        </p>
      {/if}
    </div>
  </Card.Header>

  <Card.Content class="max-h-[260px] overflow-y-auto">
    {#if isLoading}
      <!-- Loading -->
      <div class="flex items-center justify-center h-[250px] text-muted-foreground">
        <div class="flex flex-col items-center gap-2">
          <RefreshCw class="animate-spin w-6 h-6" />
          <p class="text-sm font-medium">Loading activity</p>
        </div>
      </div>

    {:else if !hasAnyActivity}
      <!-- No activity -->
      <div class="flex items-center justify-center h-[250px] text-muted-foreground">
        <div class="text-center space-y-1">
          <p class="text-base font-medium text-foreground">
            No recent activity
          </p>
          <p class="text-sm">
            There were no visitors in the last 7 days.
          </p>
        </div>
      </div>

    {:else}
      <!-- Activity list -->
      <div class="space-y-2">
        {#each last7Days as item}
          <div class="flex items-center justify-between py-2 border-b last:border-b-0">
            <span class="text-sm font-medium text-muted-foreground">
              {new Date(item.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric"
              })}
            </span>

            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                <span class="text-sm font-medium">{item.male}</span>
              </div>

              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-pink-500"></span>
                <span class="text-sm font-medium">{item.female}</span>
              </div>

              <span class="text-sm font-bold ml-2">
                {item.male + item.female}
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
