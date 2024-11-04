<!-- ModelSelector.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { selectedModel, secondaryModels, userApiKey } from './stores';
  import ApiKeyInput from './ApiKeyInput.svelte';
  import { ChevronUp, ChevronDown } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  const models = [
    { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'openai/chatgpt-4o-latest', label: 'Chat GPT-4o' },
    { value: 'openai/o1-preview', label: 'OpenAI O1 Preview' },
    { value: 'google/gemini-pro-1.5', label: 'Google Gemini' }
  ];

  let showKeyMessage = false;
  let isExpanded = true;

  function handlePrimaryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (!$userApiKey && target.value !== models[0].value) {
      showKeyMessage = true;
      selectedModel.set(models[0].value);
    } else {
      showKeyMessage = false;
      selectedModel.set(target.value);
      secondaryModels.update(models => models.filter(m => m !== target.value));
      dispatch('modelChange', target.value);
    }
  }

  function handleSecondaryToggle(modelValue: string) {
    if (modelValue === $selectedModel) return;
    secondaryModels.update(models => {
      if (models.includes(modelValue)) {
        return models.filter(m => m !== modelValue);
      } else {
        return [...models, modelValue];
      }
    });
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
  }
</script>

<div class="model-selector">
  <div class="header">
    <select 
      on:change={handlePrimaryChange} 
      value={$selectedModel}
      class="primary-select"
    >
      {#each models as model}
        <option value={model.value}>{model.label}</option>
      {/each}
    </select>
    <button class="toggle-btn" on:click={toggleExpand}>
      {#if isExpanded}
        <ChevronUp size={16} />
      {:else}
        <ChevronDown size={16} />
      {/if}
    </button>
  </div>

  {#if isExpanded}
    <div class="secondary-models">
      {#each models as model}
        {#if model.value !== $selectedModel}
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={$secondaryModels.includes(model.value)}
              on:change={() => handleSecondaryToggle(model.value)}
            />
            <span class="model-label">{model.label}</span>
          </label>
        {/if}
      {/each}
    </div>

    {#if showKeyMessage}
      <p class="key-message">You need an API key to use this model.</p>
    {/if}
    <ApiKeyInput />
  {/if}
</div>

<style>
  .model-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: white;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
    min-width: 200px;
    z-index: 100;
  }

  .header {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .primary-select {
    flex: 1;
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .toggle-btn {
    padding: 4px;
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-btn:hover {
    background: #f0f0f0;
    border-radius: 4px;
  }

  .secondary-models {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 4px;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    cursor: pointer;
  }

  .model-label {
    font-size: 12px;
    color: #333;
  }

  input[type="checkbox"] {
    margin: 0;
    width: 12px;
    height: 12px;
  }

  .key-message {
    color: #ff6b6b;
    font-size: 12px;
    margin: 4px 0;
  }
</style>