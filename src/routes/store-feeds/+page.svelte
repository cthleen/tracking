<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';
  import { onMount } from 'svelte';
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { LightSwitch } from "$lib/components/ui/light-switch";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";

  import CameraFeed from './components/camera-feed.svelte'; 
  import StatisticsCard from './components/statistic-card.svelte';

  export let data;

  let maleCount = data.genderData?.male || 0;
  let femaleCount = data.genderData?.female || 0;
  let time = new Date().toLocaleTimeString();

  let videoElementA: HTMLVideoElement;
  let canvasElementA: HTMLCanvasElement;
  let fpsA = 0;
  let fpsB = 0;

  let locations: any[] = [];

  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/store-feeds': 'Store Feeds',
    '/area-settings': 'Area Settings'
  };

  const pageTitle = derived(page, $page => titles[$page.url.pathname] ?? 'Dashboard');

  async function fetchLocations() {
    try {
      const res = await fetch('http://localhost:8000/api/location');
      const result = await res.json();
      if (result.status && result.data) {
        locations = result.data;
      }
    } catch (err) {
      console.error(err);
    }
  }

  onMount(async () => {
    await fetchLocations();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoElementA.srcObject = stream;
    } catch (err) {
      console.error(err);
    }

    const interval = setInterval(() => (time = new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  });

  // onMount(async () => {
  //   const pc = new RTCPeerConnection();
  //   pc.addTransceiver('video', { direction: 'recvonly' });
  //   pc.addTransceiver('audio', { direction: 'recvonly' });

  //   pc.ontrack = (event) => {
  //     videoElement.srcObject = event.streams[0];
  //   }

  //   const offer = await pc.createOffer();
  //   await pc.setLocalDescription(offer);
    
  //   await new Promise<void>((resolve) => {
  //     if (pc.iceGatheringState === "complete") {
  //       resolve();
  //     } else {
  //       const checkState = () => {
  //         if (pc.iceGatheringState === "complete") {
  //           pc.removeEventListener("icegatheringstatechange", checkState);
  //           resolve();
  //         }
  //       }
  //       pc.addEventListener("icegatheringstatechange", checkState);
  //     }
  //   })

  //   const response = await fetch("http://localhost:9876/offer", { // change with WebRTC server
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(pc.localDescription)
  //   })

  //   const answer = await response.json();
  //   await pc.setRemoteDescription(answer);
  // }) 
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
              <Breadcrumb.Link href="#" class="text-base">{$pageTitle}</Breadcrumb.Link>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
      <div class="ml-auto"><LightSwitch /></div>
    </header>

    <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div class="grid grid-cols-3 gap-4">
        <CameraFeed cameraName="Camera A" bind:videoElement={videoElementA} bind:canvasElement={canvasElementA} {fpsA} {time} {locations} />
        <!-- {fpsA} -->
        <StatisticsCard title="Statistics" {fpsA} status="Active" {maleCount} {femaleCount} {locations} />
      </div>

      <div class="grid grid-cols-3 gap-4 mt-6">
        <div class="col-span-2">
          <div class="bg-black rounded-lg aspect-video flex items-center justify-center text-gray-400">
            CCTV B Placeholder
          </div>
        </div>
        <StatisticsCard title="Statistics" fps={fpsB} status="Offline" {maleCount} {femaleCount} {locations} />
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
              
