<script>
  import { exportFlowState, importFlowState } from './flowStateManagement';

  let stateJson = '';
  let message = '';

  function handleExport() {
    stateJson = exportFlowState();
    message = 'Flow state exported. Copy the text above to save it.';
    setTimeout(() => message = '', 3000);
  }

  function handleImport() {
    try {
      importFlowState(stateJson);
      message = 'Flow state imported successfully!';
      setTimeout(() => message = '', 3000);
    } catch (error) {
      message = 'Error importing flow state. Please check the format.';
      console.error('Failed to import flow state:', error);
    }
  }
</script>

<div class="flow-controls">
  <textarea 
    bind:value={stateJson} 
    placeholder="Paste flow state here to import, or export to see the current state"
    rows="4"
  ></textarea>
  <div class="button-group">
    <button on:click={handleExport}>Export Flow</button>
    <button on:click={handleImport}>Import Flow</button>
  </div>
  {#if message}
    <p class="message">{message}</p>
  {/if}
</div>

<style>
  .flow-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    background-color: white;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  textarea {
    width: 300px;
    margin-bottom: 10px;
    padding: 5px;
  }

  .button-group {
    display: flex;
    justify-content: space-between;
  }

  button {
    padding: 5px 10px;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #e0e0e0;
  }

  .message {
    margin-top: 10px;
    font-size: 0.9em;
    color: #333;
  }
</style>