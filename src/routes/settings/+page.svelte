<script lang="ts">
    import { page } from '$app/stores';
    import { derived } from 'svelte/store';
  
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { LightSwitch } from "$lib/components/ui/light-switch";
  
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/store-feeds': 'Store Feeds',
      '/settings': 'Settings'
    };
  
    const pageTitle = derived(page, $page => {
      const path = $page.url.pathname;
      return titles[path] ?? 'Dashboard';
    });
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
        <!-- <div class="grid auto-rows-min gap-4 md:grid-cols-3">
          <div class="bg-muted/50 aspect-video rounded-xl"></div>
          <div class="bg-muted/50 aspect-video rounded-xl"></div>
          <div class="bg-muted/50 aspect-video rounded-xl"></div>
        </div>
        <div class="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min"></div> -->
      </div>
    </Sidebar.Inset>
  </Sidebar.Provider>
  