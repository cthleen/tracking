<script lang="ts">
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';

  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { Separator } from '$lib/components/ui/separator';
  import { LightSwitch } from '$lib/components/ui/light-switch';

  import CameraFeed from './components/camera-feed.svelte';
  import StatisticsCard from './components/statistic-card.svelte';

  import { connectToCamera } from './lib/camera';
  import { createClock } from './lib/time';
  import type { Location } from './types';

  export let data;

  let videoElement1: HTMLVideoElement;
  let videoElement2: HTMLVideoElement;
  let canvasElement1: HTMLCanvasElement;
  let canvasElement2: HTMLCanvasElement;

  let camera1Status: 'Active' | 'Offline' = 'Offline';
  let camera2Status: 'Active' | 'Offline' = 'Offline';

  let fps1 = 0;
  let fps2 = 0;

  let locations1: Location[] = data.locations1 ?? [];
  let locations2: Location[] = data.locations2 ?? [];

  let maleCount1 = data.genderData1?.male ?? 0;
  let femaleCount1 = data.genderData1?.female ?? 0;
  let maleCount2 = data.genderData2?.male ?? 0;
  let femaleCount2 = data.genderData2?.female ?? 0;

  const clock = createClock();
  const time = clock.time;

  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/store-feeds': 'Store Feeds',
    '/area-settings': 'Area Settings'
  };

  const pageTitleStore = derived(
    page,
    ($page) => titles[$page.url.pathname] ?? 'Dashboard'
  );

  onMount(async () => {
    await Promise.all([
      connectToCamera(1, videoElement1, (status) => {
        camera1Status = status;
      }),
      connectToCamera(2, videoElement2, (status) => {
        camera2Status = status;
      }),
    ]);

    return () => clock.stop();
  });
</script>

<Sidebar.Provider>
  <AppSidebar />

  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 px-4">
      <div class="flex items-center gap-2">
        <Sidebar.Trigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />

        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item class="hidden md:block">
              <Breadcrumb.Link class="text-base">
                {$pageTitleStore}
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
      <!-- Camera 1 -->
      <div class="grid grid-cols-3 gap-4">
        <CameraFeed
          cameraName="Camera 1" 
          bind:videoElement={videoElement1}
          bind:canvasElement={canvasElement1}
          bind:fps={fps1}
          time={$time}
          locations={locations1}
        />

        <StatisticsCard
          title="Camera 1 Statistics"
          fps={fps1}
          status={camera1Status}
          maleCount={maleCount1}
          femaleCount={femaleCount1}
          locations={locations1}
        />
      </div>

      <!-- Camera 2 -->
      <div class="grid grid-cols-3 gap-4 mt-6">
        <CameraFeed
          cameraName="Camera 2"
          bind:videoElement={videoElement2}
          bind:canvasElement={canvasElement2}
          bind:fps={fps2}
          time={$time}
          locations={locations2}
        />

        <StatisticsCard
          title="Camera 2 Statistics"
          fps={fps2}
          status={camera2Status}
          maleCount={maleCount2}
          femaleCount={femaleCount2}
          locations={locations2}
        />
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
