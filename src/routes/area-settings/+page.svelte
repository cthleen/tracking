<script lang="ts">
	import { page as pageStore } from '$app/stores';
	import { derived } from 'svelte/store';

	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb";
	import { Separator } from "$lib/components/ui/separator";
	import { LightSwitch } from "$lib/components/ui/light-switch";

	import Alerts from "./components/alerts.svelte";
	import SavedLocations from "./components/saved-area.svelte";
	import AddLocationForm from "./components/add-area-form.svelte";

	let { data, form } = $props();

	const titles = {
		'/dashboard': 'Dashboard',
		'/store-feeds': 'Store Feeds',
		'/area-settings': 'Area Settings'
	};

	const pageTitle = derived(pageStore, $page =>
		titles[$page.url.pathname] ?? 'Dashboard'
	);
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<header class="flex h-16 items-center gap-2 px-4">
			<div class="flex items-center gap-2">
				<Sidebar.Trigger class="-ml-1" />
				<Separator orientation="vertical" class="mr-2 h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item class="hidden md:block">
							<Breadcrumb.Link class="text-base">
								{$pageTitle}
							</Breadcrumb.Link>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			</div>
			<div class="ml-auto"><LightSwitch /></div>
		</header>

		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
			<Alerts {form} />
			<SavedLocations locations={data.locations} />
			<AddLocationForm />
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>