<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { selectedModel } from './stores';

  const dispatch = createEventDispatcher();

  const models = [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'openai/chatgpt-4o-latest', label: 'GPT-4 Turbo' },
    { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
    { value: 'openai/o1-preview', label: 'OpenAI O1 Preview' }
  ];

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedModel.set(target.value);
    dispatch('modelChange', target.value);
  }
</script>

<select on:change={handleChange}>
  {#each models as model}
    <option value={model.value}>{model.label}</option>
  {/each}
</select>

<style>
  select {
    padding: 5px 10px;
    font-size: 14px;
    border-radius: 4px;
    border: 1px solid #ccc;
    background-color: white;
  }
</style>