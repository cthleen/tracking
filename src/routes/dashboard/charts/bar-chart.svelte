<script lang="ts">
    import { scaleBand } from "d3-scale";
    import { BarChart, type ChartContextValue } from "layerchart";
    import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
    import * as Chart from "$lib/components/ui/chart/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { cubicInOut } from "svelte/easing";

    interface Props {
      data: Array<{ hour: string; customers: number }>;
      title?: string;
      description?: string;
    }

    let { data, title = "Peak Hours Analysis", description = " " }: Props = $props();

    // Transform data to match chart expectations
    let chartData = $derived(data?.map(item => ({
      hour: item.hour,
      desktop: item.customers
    })) || []);

    const chartConfig = {
      desktop: { label: "Customers", color: "#3b82f6" },
    } satisfies Chart.ChartConfig;

    let context = $state<ChartContextValue>();
  </script>
  
  <Card.Root>
    <Card.Header class="flex items-center gap-2 space-y-0 border-b sm:flex-row">
        <div class="grid flex-1 gap-1 text-center sm:text-left">
            <Card.Title class="text-xl md:text-xl font-bold" >
                {title}
            </Card.Title>
            <Card.Description>{description}</Card.Description>
        </div>
    </Card.Header>
    <Card.Content>
      <Chart.Container config={chartConfig}>
        <BarChart
          bind:context
          data={chartData}
          xScale={scaleBand().padding(0.25)}
          x="hour"
          axis="x"
          series={[{ key: "desktop", label: "Customers", color: chartConfig.desktop.color }]}
          props={{
            bars: {
              stroke: "none",
              rounded: "all",
              radius: 8,
              // use the height of the chart to animate the bars
              initialY: context?.height,
              initialHeight: 0,
              motion: {
                x: { type: "tween", duration: 500, easing: cubicInOut },
                width: { type: "tween", duration: 500, easing: cubicInOut },
                height: { type: "tween", duration: 500, easing: cubicInOut },
                y: { type: "tween", duration: 500, easing: cubicInOut },
              },
            },
            highlight: { area: { fill: "none" } },
            xAxis: { format: (d) => `${d}:00` },
          }}
        >
          {#snippet tooltip()}
            <Chart.Tooltip hideLabel />
          {/snippet}
        </BarChart>
      </Chart.Container>
    </Card.Content>
    <!-- <Card.Footer>
      <div class="flex w-full items-start gap-2 text-sm">
        <div class="grid gap-2">
          <div class="flex items-center gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUpIcon class="size-4" />
          </div>
          <div class="text-muted-foreground flex items-center gap-2 leading-none">
            Showing total visitors for the last 6 months
          </div>
        </div>
      </div>
    </Card.Footer> -->
  </Card.Root>
