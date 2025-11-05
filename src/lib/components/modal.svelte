<script>
  export let open = false;
  export let onClose = () => {};
</script>

{#if open}
<div 
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  on:click={onClose}
>
  <div 
    class="bg-background rounded-xl p-4 w-[90%] max-w-xl shadow-xl"
    on:click|stopPropagation
  >
    <slot />
  </div>
</div>
{/if}
