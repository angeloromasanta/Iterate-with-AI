<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { selectedModel, userApiKey } from './stores';
  import ApiKeyInput from './ApiKeyInput.svelte';

  const dispatch = createEventDispatcher();

  const models = [
    { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'openai/chatgpt-4o-latest', label: 'GPT-4 Turbo' },
    { value: 'openai/o1-preview', label: 'OpenAI O1 Preview' },
  ];

  $: availableModels = $userApiKey ? models : [models[0]];

  $: {
    if (!$userApiKey && !availableModels.some(model => model.value === $selectedModel)) {
      selectedModel.set(models[0].value);
    } else if ($userApiKey && $selectedModel === '') {
      selectedModel.set('anthropic/claude-3.5-sonnet');
    }
  }

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    selectedModel.set(target.value);
    dispatch('modelChange', target.value);
  }
</script>

<div class="model-selector">
  <select on:change={handleChange} value={$selectedModel}>
    {#each availableModels as model}
      <option value={model.value}>{model.label}</option>
    {/each}
  </select>
  <ApiKeyInput />
</div>

<style>
  .model-selector {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  select {
    padding: 5px 10px;
    font-size: 14px;
    border-radius: 4px;
    border: 1px solid #ccc;
    background-color: white;
  }
</style>