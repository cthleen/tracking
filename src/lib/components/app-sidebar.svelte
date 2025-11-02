<script lang="ts" module>
  import Settings2Icon from "@lucide/svelte/icons/settings-2";
  import House from "@lucide/svelte/icons/house";
  import CCTV from "@lucide/svelte/icons/cctv";

  const data = {
    user: {
      name: "daniel",
      email: "daniel@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    projects: [
      {
        name: "Dashboard",
        url: "/dashboard",
        icon: House,
      },
      {
        name: "Store Feeds",
        url: "/store-feeds",
        icon: CCTV,
      },
      {
        name: "Settings",
        url: "/settings",
        icon: Settings2Icon,
      },
    ],
  };
</script>
<script lang="ts">
  import NavProjects from "./nav-projects.svelte";
  import NavUser from "./nav-user.svelte";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import CommandIcon from "@lucide/svelte/icons/command";
  import { settled, type ComponentProps } from "svelte";
    import Layout from "../../routes/+layout.svelte";
  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>
<Sidebar.Root bind:ref variant="inset" {...restProps}>
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg">
          {#snippet child({ props })}
            <a href="##" {...props}>
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <CommandIcon class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate text-lg font-semibold">TSI Store</span>
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>
  <Sidebar.Content>
    <NavProjects projects={data.projects} />
  </Sidebar.Content>
  <Sidebar.Footer>
    <NavUser user={data.user} />
  </Sidebar.Footer>
</Sidebar.Root>