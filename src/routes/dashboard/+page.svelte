<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { LightSwitch } from "$lib/components/ui/light-switch";
  import LineChart from "./charts/activity-chart.svelte";
  import PieChart from "./charts/pie-chart.svelte";
  import BarChart from "./charts/bar-chart.svelte";

  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/store-feeds': 'Store Feeds',
    '/settings': 'Settings'
  };

  const pageTitle = derived(page, $page => {
    const path = $page.url.pathname;
    return titles[path] ?? 'Dashboard';
  });

  export let data;
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
            <Breadcrumb.Item class="md:block">
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
      <div class="bg-muted/50 rounded-xl p-4 flex flex-col gap-4">
        <LineChart {data}/>
        <!-- <BarChart data={data.peakHoursData || []} title="Peak Hours Analysis" /> -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PieChart locationData={data.locationData} title="All Popular Spots" />
            <!-- <PieChart locationData={data.locationData?.slice(0, 5)} title="Top 5 Popular Spots" /> -->
        </div>
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
