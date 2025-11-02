<script lang="ts">
  import { page } from '$app/stores';
  import { derived } from 'svelte/store';

  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
  import { LightSwitch } from "$lib/components/ui/light-switch";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { onMount } from "svelte";

  export let data;

  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/store-feeds': 'Store Feeds',
    '/settings': 'Settings'
  };

  const pageTitle = derived(page, $page => {
    const path = $page.url.pathname;
    return titles[path] ?? 'Dashboard';
  });

  let maleCount = data.genderData?.male || 0;
  let femaleCount = data.genderData?.female || 0;

  let time = new Date().toLocaleTimeString();
  let videoElement: HTMLVideoElement;

  async function fetchLocations() {
    try {
      const response = await fetch('http://localhost:8000/api/location');
      const result = await response.json();
      if (result.status && result.data) {
        locations = result.data;
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  }



  onMount(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      videoElement.srcObject = stream;

      videoElement.addEventListener('loadedmetadata', () => {
        startDrawing();
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
    }

    await fetchLocations();
  })

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

  onMount(() => {
    const interval = setInterval(() => {
      time = new Date().toLocaleTimeString();
    }, 1000);
    return () => clearInterval(interval);
  });

  let fpsA = 0;
  let fpsB = 0; // Camera B is offline, so always 0
  let frameCountA = 0;
  let lastFpsUpdateA = 0;

  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  interface Location {
    id: string;
    name: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  
  let locations: Location[] = [];

  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;

    canvasElement.width = videoElement.videoWidth * ratio;
    canvasElement.height = videoElement.videoHeight * ratio;

    canvasElement.style.width = `${videoElement.videoWidth}px`;
    canvasElement.style.height = `${videoElement.videoHeight}px`;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw(currentTime: number = 0) {
    if (!ctx || !canvasElement || !videoElement) return;

    // Calculate FPS for Camera A
    frameCountA++;
    if (currentTime - lastFpsUpdateA >= 1000) {
      fpsA = Math.round((frameCountA * 1000) / (currentTime - lastFpsUpdateA));
      frameCountA = 0;
      lastFpsUpdateA = currentTime;
    }

    if (
      canvasElement.width !== videoElement.videoWidth * (window.devicePixelRatio || 1) ||
      canvasElement.height !== videoElement.videoHeight * (window.devicePixelRatio || 1)
    ) {
      resizeCanvas();
    }

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    locations.forEach(location => {
      const width = location.x2 - location.x1;
      const height = location.y2 - location.y1;

      if (width > 0 && height > 0) {
        // Draw rectangle border (green like camera location selector)
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 3;
        ctx.strokeRect(location.x1, location.y1, width, height);

        // Semi-transparent fill
        ctx.fillStyle = "rgba(0, 255, 0, 0.15)";
        ctx.fillRect(location.x1, location.y1, width, height);

        // Draw label with same styling as selector
        const label = location.name;
        ctx.font = "bold 14px Arial";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";

        const padding = 4;
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = 16;

        const boxX = location.x1;
        const boxY = location.y1 - textHeight - 4 < 0 ? location.y1 + 2 : location.y1 - textHeight - 4;

        // Background box for text
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(boxX, boxY, textWidth + padding * 2, textHeight + padding);

        // Text
        ctx.fillStyle = "#fff";
        ctx.fillText(label, boxX + padding, boxY + padding / 2);
      }
    });

    requestAnimationFrame(draw);
  }

  function startDrawing() {
    if (canvasElement) {
      ctx = canvasElement.getContext("2d")!;
      requestAnimationFrame(draw);
    }
  }

  onMount(() => {

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
      <!-- Camera A -->
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2 bg-muted/50 rounded-xl p-4 flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <h2 class="font-semibold text-lg">Camera A</h2>
            <span class="text-sm text-gray-500">{time}</span>
          </div>
          <div class="relative w-full">
            <video
              bind:this={videoElement}
              autoplay
              playsinline
              muted
              class="w-full h-auto block"
            >
              <track kind="captions">
            </video>
        
            <canvas
              bind:this={canvasElement}
              class="absolute top-0 left-0 pointer-events-none"
              style="width: {videoElement?.clientWidth || 0}px; height: {videoElement?.clientHeight || 0}px;"
            ></canvas>

            <!-- <video bind:this={videoElement} autoplay playsinline muted>
              <track kind="captions">
            </video> -->
            <!-- <div class="bg-black rounded-lg aspect-video flex items-center justify-center text-gray-400">
              CCTV A Placeholder
            </div> -->
          </div>
        </div>

        <div class="bg-muted/50 rounded-xl p-4 flex flex-col gap-4">
          <h2 class="font-semibold text-lg flex items-center gap-2">
            Statistics
          </h2>

          <!-- Performance Metrics -->
          <div class="space-y-3">
            <div class="bg-background/50 rounded-lg p-3 border">
              <div class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Performance</div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">FPS</span>
                <span class="text-lg font-bold text-green-600">{fpsA}</span>
              </div>
              <div class="flex justify-between items-center mt-1">
                <span class="text-sm font-medium">Status</span>
                <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                  Active
                </span>
              </div>
            </div>

            <!-- Customer Analytics -->
            <div class="bg-background/50 rounded-lg p-3 border">
              <div class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Today's Traffic</div>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm flex items-center gap-2">
                    Male
                  </span>
                  <span class="font-semibold text-blue-600">{maleCount}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm flex items-center gap-2">
                    Female
                  </span>
                  <span class="font-semibold text-pink-600">{femaleCount}</span>
                </div>
                <div class="border-t pt-2 mt-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium">Total</span>
                    <span class="font-bold text-lg">{maleCount + femaleCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Location Tracking -->
            <div class="bg-background/50 rounded-lg p-3 border">
              <div class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Active Zones</div>
              <div class="space-y-1">
                {#each locations as location}
                  <div class="flex justify-between items-center text-sm">
                    <span class="truncate flex-1">{location.name}</span>
                    <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                      Active
                    </span>
                  </div>
                {/each}
                {#if locations.length === 0}
                  <div class="text-xs text-muted-foreground italic">
                    No zones configured
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Camera B -->
      <div class="grid grid-cols-3 gap-4 mt-6">
        <div class="col-span-2 bg-muted/50 rounded-xl p-4 flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <h2 class="font-semibold text-lg">Camera B</h2>
            <span class="text-sm text-gray-500">{time}</span>
          </div>

          <!-- <div class="relative w-full"> -->
            <!-- <video
              bind:this={videoElementB}
              autoplay
              playsinline
              muted
              class="w-full h-auto block"
            >
              <track kind="captions">
            </video>
        
            <canvas
              bind:this={canvasElementB}
              class="absolute top-0 left-0 w-full h-full pointer-events-none"
            ></canvas> -->

            <!-- <video autoplay playsinline muted>
              <track kind="captions">
            </video> -->
            <div class="bg-black rounded-lg aspect-video flex items-center justify-center text-gray-400">
              CCTV B Placeholder
            </div>
          <!-- </div> -->
        </div>

        <div class="bg-muted/50 rounded-xl p-4 flex flex-col gap-4">
          <h2 class="font-semibold text-lg flex items-center gap-2">
            Statistics
          </h2>

          <!-- Performance  -->
          <div class="space-y-3">
            <div class="bg-background/50 rounded-lg p-3 border">
              <div class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Performance</div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">FPS</span>
                <span class="text-lg font-bold text-green-600">{fpsB}</span>
              </div>
              <div class="flex justify-between items-center mt-1">
                <span class="text-sm font-medium">Status</span>
                <span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                  Offline
                </span>
              </div>
            </div>

            <!-- Customer Analytics -->
            <div class="bg-background/50 rounded-lg p-3 border">
              <div class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Today's Traffic</div>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm flex items-center gap-2">
                    Male
                  </span>
                  <span class="font-semibold text-blue-600">{maleCount}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm flex items-center gap-2">
                    Female
                  </span>
                  <span class="font-semibold text-pink-600">{femaleCount}</span>
                </div>
                <div class="border-t pt-2 mt-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm font-medium">Total</span>
                    <span class="font-bold text-lg">{maleCount + femaleCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Location Tracking -->
            <div class="bg-background/50 rounded-lg p-3 border">
              <div class="text-xs text-muted-foreground uppercase tracking-wide mb-2">Active Zones</div>
              <div class="space-y-1">
                {#each locations as location}
                  <div class="flex justify-between items-center text-sm">
                    <span class="truncate flex-1">{location.name}</span>
                    <span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                      Active
                    </span>
                  </div>
                {/each}
                {#if locations.length === 0}
                  <div class="text-xs text-muted-foreground italic">
                    No zones configured
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>    
  </Sidebar.Inset>
</Sidebar.Provider>
