<script lang="ts">
  import { PieChart } from "layerchart";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as Card from "$lib/components/ui/card/index.js";

  interface Props {
    locationData?: Array<{ location: string; visitors: number }>;
    title?: string;
  }

  let { locationData = [], title = "Popular Area" }: Props = $props();

  const locationColors = [
    "#0D47A1",
    "#1976D2",
    "#42A5F5",
    "#90CAF9",
    "#BBDEFB"
  ];

  const chartData = $derived(
    locationData.map((item, index) => ({
      location: item.location,
      visitors: item.visitors,
      color: locationColors[index % locationColors.length]
    }))
  );

  const hasAnyVisitors = locationData.some(item => item.visitors > 0);
  const isLoading = locationData.length === 0;

  const chartConfig = {
    visitors: { label: "Visitors", color: "#0D47A1" }
  } satisfies Chart.ChartConfig;
</script>

<Card.Root class="flex flex-col">
  <Card.Header class="flex items-center gap-2 border-b">
    <div class="flex-1">
      <Card.Title class="text-xl font-bold">
        {title}
      </Card.Title>
    </div>
  </Card.Header>

  <Card.Content class="flex-1">
    {#if isLoading}
      <!-- Loading -->
      <div class="flex items-center justify-center h-[250px] text-muted-foreground">
        <div class="flex flex-col items-center gap-2">
          <RefreshCw class="animate-spin w-8 h-8" />
          <p class="text-lg font-medium">Loading data</p>
        </div>
      </div>

    {:else if !hasAnyVisitors}
      <!-- Empty state -->
      <div class="flex items-center justify-center h-[250px] text-muted-foreground">
        <div class="text-center space-y-1">
          <p class="text-base font-medium text-foreground">
            No visitor data available
          </p>
          <p class="text-sm">
            There were no recorded visitors for this period.
          </p>
        </div>
      </div>

    {:else}
      <!-- Pie Chart + Legend -->
      <div class="flex flex-col lg:flex-row items-center gap-6">
        <!-- Pie Chart -->
        <Chart.Container
          config={chartConfig}
          class="mx-auto aspect-square max-h-[240px] flex-1"
        >
          <PieChart
            data={chartData}
            key="location"
            value="visitors"
            c={(d) => d.color}
            props={{
              pie: {
                motion: "tween",
              },
            }}
          >
            {#snippet tooltip()}
              <Chart.Tooltip />
            {/snippet}
          </PieChart>
        </Chart.Container>

        <!-- Legend -->
        <div class="flex flex-col gap-2 min-w-[200px]">
          {#each chartData as item}
            <div class="flex items-center gap-3">
              <span
                class="w-3 h-3 rounded-full flex-shrink-0"
                style="background-color: {item.color}"
              ></span>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">
                  {item.location}
                </div>
                <div class="text-xs text-muted-foreground">
                  {item.visitors} visitors
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
