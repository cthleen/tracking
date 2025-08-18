<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { LightSwitch } from "$lib/components/ui/light-switch";

  import Camera from "@lucide/svelte/icons/camera";

  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/store-feeds': 'Store Feeds',
    '/settings': 'Settings'
  };

  const pageTitle = derived(page, $page => {
    const path = $page.url.pathname;
    return titles[path] ?? 'Dashboard';
  });

  import { onMount } from "svelte";
  let time = new Date().toLocaleTimeString();

  onMount(() => {
    const interval = setInterval(() => {
      time = new Date().toLocaleTimeString();
    }, 1000);
    return () => clearInterval(interval);
  });

  let fps = 0;
  let maleCount = 0;
  let femaleCount = 0;
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
            <Breadcrumb.Item class="hidden md:block">
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
      <!-- Camera A -->
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2 bg-muted/50 rounded-xl p-4 flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <h2 class="font-semibold text-lg">Camera A</h2>
            <span class="text-sm text-gray-500">{time}</span>
          </div>
          <div class="bg-black rounded-lg aspect-video flex items-center justify-center text-gray-400">
            CCTV A Placeholder
          </div>
        </div>
    
        <div class="bg-muted/50 rounded-xl p-4 flex flex-col gap-4">
          <h2 class="font-semibold text-lg">Info</h2>
          <div class="flex justify-between">
            <span>FPS:</span>
            <span>{fps}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span>Today's Customer Count</span>
            <div class="flex justify-between">
              <span>Male:</span>
              <span>{maleCount}</span>
            </div>
            <div class="flex justify-between">
              <span>Female:</span>
              <span>{femaleCount}</span>
            </div>
          </div>
        </div>
      </div>
    
      <!-- Camera B -->
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2 bg-muted/50 rounded-xl p-4 flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <h2 class="font-semibold text-lg">Camera B</h2>
            <span class="text-sm text-gray-500">{time}</span>
          </div>
          <div class="bg-black rounded-lg aspect-video flex items-center justify-center text-gray-400">
            CCTV B Placeholder
          </div>
        </div>
    
        <div class="bg-muted/50 rounded-xl p-4 flex flex-col gap-4">
          <h2 class="font-semibold text-lg">Info</h2>
          <div class="flex justify-between">
            <span>FPS:</span>
            <span>{fps}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span>Today's Customer Count</span>
            <div class="flex justify-between">
              <span>Male:</span>
              <span>{maleCount}</span>
            </div>
            <div class="flex justify-between">
              <span>Female:</span>
              <span>{femaleCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>    
  </Sidebar.Inset>
</Sidebar.Provider>
