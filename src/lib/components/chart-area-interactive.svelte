<!-- <script lang="ts">
    import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
    import * as Chart from "$lib/components/ui/chart/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Select from "$lib/components/ui/select/index.js";
    import { scaleUtc } from "d3-scale";
    import { Area, AreaChart, ChartClipPath } from "layerchart";
    import { curveNatural } from "d3-shape";
    import ChartContainer from "$lib/components/ui/chart/chart-container.svelte";
    import { cubicInOut } from "svelte/easing";
  
    const chartData = [
      { date: new Date("2024-04-01"), male: 222, female: 150 },
    ];
  
    let timeRange = $state("90d");
  
    const selectedLabel = $derived.by(() => {
      switch (timeRange) {
        case "90d":
          return "Last 3 months";
        case "30d":
          return "Last 30 days";
        case "7d":
          return "Last 7 days";
        default:
          return "Last 3 months";
      }
    });
  
    const filteredData = $derived(
      chartData.filter((item) => {
        const referenceDate = new Date("2024-06-30");
        let daysToSubtract = 90;
        if (timeRange === "30d") {
          daysToSubtract = 30;
        } else if (timeRange === "7d") {
          daysToSubtract = 7;
        }
  
        referenceDate.setDate(referenceDate.getDate() - daysToSubtract);
        return item.date >= referenceDate;
      })
    );
  
    
  const chartConfig = {
    male: {
      label: "Male",
      color: "#4A3AFF",
    },
    female: {
      label: "Female",
      color: "#E0C6FD",
    },
  } satisfies Chart.ChartConfig;
  </script>
  
  <Card.Root>
    <Card.Header class="flex items-center gap-2 space-y-0 border-b sm:flex-row">
      <div class="grid flex-1 gap-1 text-center sm:text-left">
        <Card.Title class="text-xl md:text-xl font-bold">
            Weekly Activity
        </Card.Title>
      </div>
      <Select.Root type="single" bind:value={timeRange}>
        <Select.Trigger class="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
          {selectedLabel}
        </Select.Trigger>
        <Select.Content class="rounded-xl">
          <Select.Item value="90d" class="rounded-lg">Last 3 months</Select.Item>
          <Select.Item value="30d" class="rounded-lg">Last 30 days</Select.Item>
          <Select.Item value="7d" class="rounded-lg">Last 7 days</Select.Item>
        </Select.Content>
      </Select.Root>
    </Card.Header>
    <Card.Content>
      <ChartContainer config={chartConfig} class="aspect-auto h-[250px] w-full">
        <AreaChart
          data={filteredData}
          x="date"
          xScale={scaleUtc()}
          series={[
            {
              key: "male",
              label: "Male",
              color: chartConfig.male.color,
            },
            {
              key: "female",
              label: "Female",
              color: chartConfig.female.color,
            },
          ]}
          seriesLayout="stack"
          props={{
            area: {
              curve: curveNatural,
              "fill-opacity": 0.4,
              line: { class: "stroke-1" },
              motion: "tween",
            },
            xAxis: {
              ticks: timeRange === "7d" ? 7 : undefined,
              format: (v) => {
                return v.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              },
            },
  
            yAxis: { format: () => "" },
          }}
        >
          {#snippet marks({ series, getAreaProps })}
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stop-color="var(--color-male)"
                  stop-opacity={1.0}
                />
                <stop
                  offset="95%"
                  stop-color="var(--color-male)"
                  stop-opacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stop-color="var(--color-female)" stop-opacity={0.8} />
                <stop
                  offset="95%"
                  stop-color="var(--color-female)"
                  stop-opacity={0.1}
                />
              </linearGradient>
            </defs>
            <ChartClipPath
              initialWidth={0}
              motion={{
                width: { type: "tween", duration: 1000, easing: cubicInOut },
              }}
            >
              {#each series as s, i (s.key)}
                <Area
                  {...getAreaProps(s, i)}
                  fill={s.key === "male"
                    ? "url(#fillDesktop)"
                    : "url(#fillMobile)"}
                />
              {/each}
            </ChartClipPath>
          {/snippet}
          {#snippet tooltip()}
            <Chart.Tooltip
              labelFormatter={(v: Date) => {
                return v.toLocaleDateString("en-US", {
                  month: "long",
                });
              }}
              indicator="line"
            />
          {/snippet}
        </AreaChart>
      </ChartContainer>
    </Card.Content>
  </Card.Root>
   -->

  <script lang="ts">
  import { AreaChart } from "layerchart";
  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
  import { curveNatural } from "d3-shape";
  import { scaleUtc } from "d3-scale";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as Card from "$lib/components/ui/card/index.js";

  const chartData = [
    { date: new Date("2024-01-01"), desktop: 186, mobile: 80 },
    { date: new Date("2024-02-01"), desktop: 305, mobile: 200 },
    { date: new Date("2024-03-01"), desktop: 237, mobile: 120 },
    { date: new Date("2024-04-01"), desktop: 73, mobile: 190 },
    { date: new Date("2024-05-01"), desktop: 209, mobile: 130 },
    { date: new Date("2024-06-01"), desktop: 214, mobile: 140 },
  ];

  const chartConfig = {
    desktop: { label: "Desktop", color: "var(--chart-1)" },
    mobile: { label: "Mobile", color: "var(--chart-2)" },
  } satisfies Chart.ChartConfig;
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Area Chart - Legend</Card.Title>
    <Card.Description>Showing total visitors for the last 6 months</Card.Description>
  </Card.Header>
  <Card.Content>
    <Chart.Container config={chartConfig}>
      <AreaChart
        legend
        data={chartData}
        x="date"
        xScale={scaleUtc()}
        yPadding={[0, 25]}
        series={[
          {
            key: "mobile",
            label: "Mobile",
            color: chartConfig.mobile.color,
          },
          {
            key: "desktop",
            label: "Desktop",
            color: chartConfig.desktop.color,
          },
        ]}
        seriesLayout="stack"
        props={{
          area: {
            curve: curveNatural,
            "fill-opacity": 0.4,
            line: { class: "stroke-1" },
            motion: "tween",
          },
          xAxis: {
            format: (v: Date) => v.toLocaleDateString("en-US", { month: "short" }),
          },
          yAxis: { format: () => "" },
        }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip
            labelFormatter={(v: Date) => {
              return v.toLocaleDateString("en-US", {
                month: "long",
              });
            }}
            indicator="line"
          />
        {/snippet}
      </AreaChart>
    </Chart.Container>
  </Card.Content>
  <Card.Footer>
    <div class="flex w-full items-start gap-2 text-sm">
      <div class="grid gap-2">
        <div class="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUpIcon class="size-4" />
        </div>
        <div class="text-muted-foreground flex items-center gap-2 leading-none">
          January - June 2024
        </div>
      </div>
    </div>
  </Card.Footer>
</Card.Root>