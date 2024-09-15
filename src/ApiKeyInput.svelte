<!-- ApiKeyInput.svelte -->
<script lang="ts">
  import { userApiKey } from './stores';

  function handleApiKeyChange(event: Event) {
    const target = event.target as HTMLInputElement;
    userApiKey.set(target.value);
    localStorage.setItem('userApiKey', target.value);
  }
</script>

<div class="api-key-input">
  <input
    type="password"
    placeholder="Enter OpenRouter API Key"
    value={$userApiKey}
    on:input={handleApiKeyChange}
  />
</div>

<style>
  .api-key-input input {
    padding: 5px 10px;
    font-size: 14px;
    border-radius: 4px;
    border: 1px solid #ccc;
    width: 100%;
  }
</style>