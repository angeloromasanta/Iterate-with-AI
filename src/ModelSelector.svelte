<!-- ModelSelector.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { selectedModel, secondaryModels, userApiKey, latestCost, cumulativeCost } from './stores';
  import ApiKeyInput from './ApiKeyInput.svelte';
  import { ChevronUp, ChevronDown } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  const models = [
    { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
    { value: 'anthropic/claude-3.7-sonnet', label: 'Claude Sonnet' },
    { value: 'openai/chatgpt-4o-latest', label: 'Chat GPT-4o' },
    { value: 'google/gemini-2.0-flash-001', label: 'Google Gemini' }
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
      secondaryModels.set([]);
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

  // Format costs with 5 decimal places
  $: formattedLatestCost = $latestCost?.toFixed(5) ?? '';
  $: formattedCumulativeCost = $cumulativeCost.toFixed(5);
</script>

<div class="model-selector">
  <div class="container">
    {#if isExpanded}
      <div class="header">
        {#if $selectedModel}
          <div class="primary-card" on:click|stopPropagation={() => secondaryModels.set([])}>
            <span class="model-label">
              {models.find(m => m.value === $selectedModel)?.label}
            </span>
            <button class="toggle-btn" on:click|stopPropagation={toggleExpand}>
              <ChevronUp size={16} />
            </button>
          </div>
        {/if}
      </div>
      <div class="models-list">
        {#each models as model}
          {#if model.value !== $selectedModel}
            <div class="model-card">
              <input
                type="checkbox"
                checked={$secondaryModels.includes(model.value)}
                on:click|stopPropagation={() => handleSecondaryToggle(model.value)}
              />
              <div on:click={() => {
                selectedModel.set(model.value);
                secondaryModels.set([]);
              }}>
                <span class="model-label">{model.label}</span>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div class="primary-card" on:click|stopPropagation={() => secondaryModels.set([])}>
        <span class="model-label">
          {models.find(m => m.value === $selectedModel)?.label}
        </span>
        <button class="toggle-btn" on:click|stopPropagation={toggleExpand}>
          <ChevronDown size={16} />
        </button>
      </div>
    {/if}

    {#if showKeyMessage}
      <p class="key-message">You need an API key to use this model.</p>
    {/if}
    {#if isExpanded}
      <ApiKeyInput />
      {#if $userApiKey}
        <div class="costs-container">
          {#if $latestCost !== null}
            <div class="cost-item latest-cost flash">
              Latest: ${formattedLatestCost}
            </div>
          {/if}
          <div class="cost-item">
            Total: ${formattedCumulativeCost}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .container {
    background: white;
    padding: 0.75rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .header {
    margin-bottom: 0.5rem;
  }

  .models-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
    margin-bottom: 1rem;
  }

  .primary-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    background-color: #dde8ed;
  }

  .model-card {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    width: 100%;
  }

  .model-card input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .model-card > div {
    flex-grow: 1;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    display: flex;
    justify-content: space-between;
  }
  
  .toggle-btn {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .key-message {
    color: red;
    font-size: 0.875rem;
    margin: 0.5rem 0 0 0;
  }

  .costs-container {
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #eee;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .cost-item {
    padding: 0.25rem 0;
    color: #666;
  }

  .latest-cost {
    color: #2f855a;
  }

  .flash {
    animation: flashAnimation 3s ease-out;
  }

  @keyframes flashAnimation {
    0% {
      background-color: rgba(47, 133, 90, 0.2);
    }
    100% {
      background-color: transparent;
    }
  }
</style>