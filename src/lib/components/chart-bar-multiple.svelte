<script lang="ts">
  import { scaleBand } from "d3-scale";
  import { BarChart, type ChartContextValue } from "layerchart";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { cubicInOut } from "svelte/easing";

  const chartData = [
    { day: "Monday", male: 186, female: 80 },
    { day: "Tuesday", male: 305, female: 200 },
    { day: "Wednesday", male: 237, female: 120 },
    { day: "Thursday", male: 73, female: 190 },
    { day: "Friday", male: 209, female: 130 },
    { day: "Saturday", male: 214, female: 140 },
    { day: "Sunday", male: 151, female: 201 },
  ];

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

  let context = $state<ChartContextValue>();
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="text-xl md:text-xl font-bold">
      Weekly Activity
    </Card.Title>
    <!-- <Card.Description>January - June 2024</Card.Description> -->
  </Card.Header>
  <Card.Content>
    <Chart.Container config={chartConfig}>
      <BarChart
        bind:context
        data={chartData}
        xScale={scaleBand().padding(0.25)}
        x="day"
        axis="x"
        series={[
          { key: "male", label: "Male", color: chartConfig.male.color },
          { key: "female", label: "Female", color: chartConfig.female.color },
        ]}
        x1Scale={scaleBand().paddingInner(0.2)}
        seriesLayout="group"
        rule={false}
        props={{
          bars: {
            stroke: "none",
            strokeWidth: 0,
            rounded: "all",
            // use the height of the chart to animate the bars
            initialY: context?.height,
            initialHeight: 0,
            motion: {
              y: { type: "tween", duration: 500, easing: cubicInOut },
              height: { type: "tween", duration: 500, easing: cubicInOut },
            },
          },
          highlight: { area: { fill: "none" } },
          xAxis: { format: (d) => d.slice(0, 3) },
        }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip indicator="dashed" />
        {/snippet}
      </BarChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
