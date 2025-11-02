<script lang="ts">
  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { scaleUtc } from "d3-scale";
  import { Area, AreaChart, ChartClipPath } from "layerchart";
  import { curveNatural } from "d3-shape";
  import { timeDay, timeMonday } from "d3-time";
  import ChartContainer from "$lib/components/ui/chart/chart-container.svelte";
  import { cubicInOut } from "svelte/easing";
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  interface Props {
    data: {
      processedData: Array<{ date: string; male: number; female: number }>;
      range: "daily" | "weekly" | "monthly";
    };
  }

  let { data }: Props = $props();

  let timeRange = $state(data.range);

  const selectedLabel = $derived.by(() => {
    switch (timeRange) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
      default: return "Today";
    }
  });

  const chartTitle = $derived.by(() => {
    switch (timeRange) {
      case "daily": return "Daily Activity";
      case "weekly": return "Weekly Activity";
      case "monthly": return "Monthly Activity";
      default: return "Activity";
    }
  });

  const chartData = $derived(
    data.processedData.map(item => ({
      date: new Date(item.date),
      male: item.male,
      female: item.female
    }))
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

  const handleRangeChange = (newRange: string) => {
    timeRange = newRange as "daily" | "weekly" | "monthly";
    const url = new URL($page.url);
    url.searchParams.set('range', newRange);
    goto(url.toString(), { replaceState: false, invalidateAll: true });
  };

  const getXAxisFormat = (range: string) => {
    return (v: Date) => {
      if (range === "daily") {
        return v.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
      } else if (range === "weekly") {
        return v.toLocaleDateString("en-US", { weekday: "short" });
      } else {
        return v.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short" // "1 Oct", "4 Oct"
        });
      }
    };
  };

  const getTooltipFormatter = (range: string) => {
    return (v: Date) => {
      if (range === "daily") {
        return v.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } else if (range === "weekly") {
        return v.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric"
        });
      } else {
        return v.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric"
        });
      }
    };
  };

  const getDailyTickValues = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    // For daily view: show every 2 hours (data is already grouped by 2-hour intervals)
    // Show all data points since they represent 2-hour intervals
    return data.map(d => d.date);
  };

  const getWeeklyTickValues = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    // For weekly view: show all 7 days (Mon-Sun)
    // Use actual data points to ensure proper alignment
    return data.map(d => d.date);
  };

  const getMonthlyTickValues = (data: any[]) => {
    if (!data || data.length === 0) return [];

    const start = timeDay.floor(data[0].date);
    const end = data[data.length - 1].date;
    const ticks: Date[] = [];

    let current = start;
    while (current <= end) {
      ticks.push(new Date(current));
      current = timeDay.offset(current, 3); // step every 3 days
    }

    return ticks;
  };

  const getTickValues = (range: string, data: any[]) => {
    switch (range) {
      case "daily": return getDailyTickValues(data);
      case "weekly": return getWeeklyTickValues(data);
      case "monthly": return getMonthlyTickValues(data);
      default: return [];
    }
  };

  const tickValues = $derived(getTickValues(timeRange, chartData));

  const formatYAxisValue = (value: number): string => {
    if (value === 0) return "0";
    if (value < 1000) return value.toString();
    if (value < 1000000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
    return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  };
</script>

<Card.Root>
  <Card.Header class="flex items-center gap-2 space-y-0 border-b sm:flex-row">
    <div class="grid flex-1 gap-1 text-center sm:text-left">
      <Card.Title class="text-xl md:text-xl font-bold">
        {chartTitle}
      </Card.Title>
    </div>
    <Select.Root 
      type="single" 
      value={timeRange}
      onValueChange={handleRangeChange}
    >
      <Select.Trigger class="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a time range">
        {selectedLabel}
      </Select.Trigger>
      <Select.Content class="rounded-xl">
        <Select.Item value="daily" class="rounded-lg">Today</Select.Item>
        <Select.Item value="weekly" class="rounded-lg">This Week</Select.Item>
        <Select.Item value="monthly" class="rounded-lg">This Month</Select.Item>
      </Select.Content>
    </Select.Root>
  </Card.Header>

  <Card.Content>
    {#if data.processedData.length > 0}
    <div class="relative">
      <!-- Add left padding for y-axis space -->
      <div class="pl-6"> <!-- Reduced left padding for y-axis labels -->
        <ChartContainer config={chartConfig} class="aspect-auto h-[300px] w-full">
          <AreaChart
            data={chartData}
            x="date"
            xScale={scaleUtc()}
            series={[
              { key: "male", label: "Male", color: chartConfig.male.color },
              { key: "female", label: "Female", color: chartConfig.female.color },
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
                ticks: tickValues,
                grid: false,
                tickSpacing: 12,
                format: getXAxisFormat(timeRange),
              },
              yAxis: {
                grid: true,
                tickSpacing: timeRange === "daily" ? 50 : 40, // Smaller spacing for weekly/monthly to get 6 ticks
              },
            }}
      >
        {#snippet marks({ series, getAreaProps })}
          <defs>
            <linearGradient id="fillMale" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stop-color="var(--color-male)" stop-opacity={1.0} />
              <stop offset="95%" stop-color="var(--color-male)" stop-opacity={0.1} />
            </linearGradient>
            <linearGradient id="fillFemale" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stop-color="var(--color-female)" stop-opacity={0.8} />
              <stop offset="95%" stop-color="var(--color-female)" stop-opacity={0.1} />
            </linearGradient>
          </defs>
          <ChartClipPath
            initialWidth={0}
            motion={{ width: { type: "tween", duration: 1000, easing: cubicInOut } }}
          >
            {#each series as s, i (s.key)}
              <Area
                {...getAreaProps(s, i)}
                fill={s.key === "male" ? "url(#fillMale)" : "url(#fillFemale)"}
              />
            {/each}
          </ChartClipPath>
        {/snippet}
        {#snippet tooltip()}
          <Chart.Tooltip
            labelFormatter={getTooltipFormatter(timeRange)}
            indicator="line"
          />
        {/snippet}
      </AreaChart>
        </ChartContainer>
      </div>
    </div>
    {:else}
      <div class="flex items-center justify-center h-[300px] text-muted-foreground">
        <div class="text-center flex flex-col items-center gap-2">
          <RefreshCw class="animate-spin w-8 h-8" />
          <div>
            <p class="text-lg font-medium">Loading Data</p>
            <!-- <p class="text-sm">Daily activity data will appear here</p> -->
          </div>
        </div>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
