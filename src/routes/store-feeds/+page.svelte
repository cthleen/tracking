<script lang="ts">
  import { page } from '$app/stores';
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { LightSwitch } from "$lib/components/ui/light-switch";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';

  import CameraFeed from './components/camera-feed.svelte';
  import StatisticsCard from './components/statistic-card.svelte';

  export let data;

  // State untuk Camera 1
  let videoElement1: HTMLVideoElement;
  let canvasElement1: HTMLCanvasElement;
  let fps1 = 0;
  let locations1: any[] = [];

  // State untuk Camera 2
  let videoElement2: HTMLVideoElement;
  let canvasElement2: HTMLCanvasElement;
  let fps2 = 0;
  let locations2: any[] = [];

  let time = new Date().toLocaleTimeString();
  let maleCount1 = 0;
  let femaleCount1 = 0;
  let maleCount2 = 0;
  let femaleCount2 = 0;

  const CAMERA_1_ID = 1;
  const CAMERA_2_ID = 2;

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
        const allLocations = result.data;
        
        locations1 = allLocations.filter((loc: any) => loc.camera_id === CAMERA_1_ID);
        locations2 = allLocations.filter((loc: any) => loc.camera_id === CAMERA_2_ID);
        
        console.log('Camera 1 locations:', locations1.length);
        console.log('Camera 2 locations:', locations2.length);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  }

  async function connectToCamera(cameraId: number, videoElement: HTMLVideoElement) {
    const pc = new RTCPeerConnection();
    pc.addTransceiver('video', { direction: 'recvonly' });

    pc.ontrack = (event) => {
      videoElement.srcObject = event.streams[0];
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const response = await fetch(`http://localhost:9876/offer?camera_id=${cameraId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sdp: pc.localDescription?.sdp,
        type: pc.localDescription?.type,
      }),
    });

    // Receive answer from AI backend
    const answer = await response.json();
    await pc.setRemoteDescription(answer);

    console.log(`Connected to AI camera stream: ${cameraId}`);
  }

  async function initializeCamera1() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      videoElement1.srcObject = stream;
    } catch (err) {
      console.error('Error initializing Camera 1:', err);
    }
  }

  async function initializeCamera2() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      videoElement2.srcObject = stream;
    } catch (err) {
      console.error('Error initializing Camera 2:', err);
    }
  }

  function updateClock() {
    time = new Date().toLocaleTimeString();
  }

  onMount(async () => {
    await fetchLocations();

    await Promise.all([
      connectToCamera(1, videoElement1),
      connectToCamera(2, videoElement2)
      // initializeCamera1(),
      // initializeCamera2()
    ]);

    const clockInterval = setInterval(updateClock, 1000);

    return () => {
      clearInterval(clockInterval);
      
      if (videoElement1?.srcObject) {
        const stream = videoElement1.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoElement2?.srcObject) {
        const stream = videoElement2.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  });

  $: {
    if (data.genderData1) {
      maleCount1 = data.genderData1.male || 0;
      femaleCount1 = data.genderData1.female || 0;
    }
    if (data.genderData2) {
      maleCount2 = data.genderData2.male || 0;
      femaleCount2 = data.genderData2.female || 0;
    }
  }
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
      <!-- Camera 1 Section -->
      <div class="grid grid-cols-3 gap-4">
        <CameraFeed 
          cameraName="Camera 1" 
          bind:videoElement={videoElement1} 
          bind:canvasElement={canvasElement1} 
          bind:fps={fps1}
          {time} 
          locations={locations1}
        />
        
        <StatisticsCard 
          title="Camera 1 Statistics" 
          fps={fps1}
          status="Active" 
          maleCount={maleCount1}
          femaleCount={femaleCount1}
          locations={locations1}
        />
      </div>

      <!-- Camera 2 Section -->
      <div class="grid grid-cols-3 gap-4 mt-6">
        <CameraFeed 
          cameraName="Camera 2" 
          bind:videoElement={videoElement2} 
          bind:canvasElement={canvasElement2} 
          bind:fps={fps2}
          {time} 
          locations={locations2}
        />
        
        <StatisticsCard 
          title="Camera 2 Statistics" 
          fps={fps2}
          status="Offline" 
          maleCount={maleCount2}
          femaleCount={femaleCount2}
          locations={locations2}
        />
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>