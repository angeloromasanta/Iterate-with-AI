<!-- TemplateDropdown.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  let templates = [];
  let selectedTemplate = '';

  const dispatch = createEventDispatcher();

  export const loadTemplates = async () => {
    // In a real application, this would be an API call to fetch templates
    // For now, we'll simulate it with a timeout
    await new Promise(resolve => setTimeout(resolve, 500));
    templates = [
      { name: 'Paper Writer', file: 'basic-flow.json' },
      { name: 'Reviewer', file: 'complex-flow.json' },
      { name: 'Demo Sample', file: 'demo.json' }
    ];
  };

  onMount(loadTemplates);

  function handleTemplateChange() {
    if (selectedTemplate) {
      dispatch('loadTemplate', selectedTemplate);
      selectedTemplate = ''; // Reset selection after loading
    }
  }
</script>

<div class="template-dropdown">
  <select bind:value={selectedTemplate} on:change={handleTemplateChange}>
    <option value="">Load Template</option>
    {#each templates as template}
      <option value={template.file}>{template.name}</option>
    {/each}
  </select>
</div>

<style>
  .template-dropdown {
    margin-bottom: 10px;
  }

  select {
    width: 100%;
    padding: 5px;
  }
</style>