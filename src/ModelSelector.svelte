<!-- ModelSelector.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { selectedModel, userApiKey } from './stores';
  import ApiKeyInput from './ApiKeyInput.svelte';

  const dispatch = createEventDispatcher();

  const models = [
    { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'openai/chatgpt-4o-latest', label: 'Chat GPT-4o' },
    { value: 'openai/o1-preview', label: 'OpenAI O1 Preview' },
    { value: 'google/gemini-pro-1.5', label: 'Google Gemini' }

  ];

  let showKeyMessage = false;

  function handleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (!$userApiKey && target.value !== models[0].value) {
      showKeyMessage = true;
      selectedModel.set(models[0].value);
    } else {
      showKeyMessage = false;
      selectedModel.set(target.value);
      dispatch('modelChange', target.value);
    }
  }

  $: {
    if (!$userApiKey && $selectedModel !== models[0].value) {
      selectedModel.set(models[0].value);
    }
  }
</script>

<div class="model-selector">
  <select on:change={handleChange} value={$selectedModel}>
    {#each models as model}
      <option value={model.value}>{model.label}</option>
    {/each}
  </select>
  {#if showKeyMessage}
    <p class="key-message">You need an API key to use this model. Please enter your key below.</p>
  {/if}
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
  .key-message {
    color: #ff6b6b;
    font-size: 14px;
    margin: 5px 0;
  }
</style>