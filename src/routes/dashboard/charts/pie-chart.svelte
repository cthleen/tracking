<script lang="ts">
  import { PieChart } from "layerchart";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as Card from "$lib/components/ui/card/index.js";

  interface Props {
    locationData?: Array<{ location: string; visitors: number }>;
    title?: string;
  }

  let { locationData = [], title = "Popular Spot" }: Props = $props();

  const locationColors = [
    "#0D47A1", // dark blue
    "#1976D2", // primary blue
    "#42A5F5", // lighter blue
    "#90CAF9", // soft blue
    "#BBDEFB"  // very light blue
  ];

  const chartData = $derived(
    locationData.map((item, index) => ({
      location: item.location,
      visitors: item.visitors,
      color: locationColors[index % locationColors.length]
    }))
  );

  const chartConfig = {
    visitors: { label: "Visitors", color: "#0D47A1" },
    snacks: { label: "Snacks", color: "#1976D2" },
    beverages: { label: "Beverages", color: "#42A5F5" },
    main: { label: "Main Course", color: "#90CAF9" },
    other: { label: "Other", color: "#BBDEFB" },
  } satisfies Chart.ChartConfig;
</script>

<Card.Root class="flex flex-col">
  <Card.Header class="flex items-center gap-2 space-y-0 border-b sm:flex-row">
    <div class="grid flex-1 gap-1 text-center sm:text-left">
      <Card.Title class="text-xl md:text-xl font-bold">
        {title}
      </Card.Title>
    </div>
  </Card.Header>
  <Card.Content class="flex-1">
    {#if locationData.length > 0}
      <div class="flex flex-col lg:flex-row items-center gap-6">
        <!-- Pie Chart -->
        <Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[250px] flex-1">
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
          {#each chartData as item, index}
            <div class="flex items-center gap-3">
              <div
                class="w-3 h-3 rounded-full flex-shrink-0"
                style="background-color: {item.color}"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{item.location}</div>
                <div class="text-xs text-muted-foreground">{item.visitors} visitors</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="flex items-center justify-center h-[250px] text-muted-foreground">
        <div class="text-center flex flex-col items-center gap-2">
          <RefreshCw class="animate-spin w-8 h-8" />
          <div>
            <p class="text-lg font-medium">Loading Data</p>
            <!-- <p class="text-sm">Popular spots data will appear here</p> -->
          </div>
        </div>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
