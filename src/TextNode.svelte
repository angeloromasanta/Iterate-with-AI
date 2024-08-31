<!-- TextNode.svelte -->
<script lang="ts">
  import { Handle, Position, type NodeProps, useSvelteFlow } from '@xyflow/svelte';

  type $$Props = NodeProps;

  export let id: $$Props['id'];
  export let data: $$Props['data'];

  const { updateNode, deleteElements } = useSvelteFlow();

  if (!data.label) {
    data.label = 'Node';
  }

  // Initialize text if it doesn't exist
  if (!data.text) data.text = 'Insert prompt here.';

  function updateLabel(event) {
    updateNode(id, { data: { ...data, label: event.target.value } });
  }

  function updateText(event) {
    updateNode(id, { data: { ...data, text: event.target.value } });
  }

  function changeNodeType(event) {
  updateNode(id, { type: event.target.value });
}

  function onTextareaMouseDown(event: MouseEvent) {
    event.stopPropagation();
  }

  function deleteNode() {
    deleteElements({ nodes: [{ id }] });
  }
</script>

<div class="custom">
  <Handle type="target" position={Position.Left} />
  <div class="type-selector">
    <select on:change={changeNodeType} value={data.nodeType || 'text'}>
      <option value="text">Text</option>
      <option value="result">Result</option>
    </select>
  </div>
  <div class="label-container">
    <input
      class="label-input"
      value={data.label}
      on:input={updateLabel}
      placeholder="Enter label"
    />
  </div>
  {#if data.nodeType !== 'result'}
    <div class="text-container">
      <textarea
        value={data.text}
        on:input={updateText}
        on:mousedown={onTextareaMouseDown}
        placeholder="Insert prompt here."
      />
    </div>
  {:else}
    <div class="results-container">
      {#if !data.results || data.results.length === 0}
        <div>No results yet</div>
      {:else}
        {#each data.results as result}
          <div class="result">{result}</div>
        {/each}
      {/if}
    </div>
  {/if}
  <button class="delete-button" on:click={deleteNode}>Delete</button>
  <Handle type="source" position={Position.Right} />
</div>

<style>
  .custom {
    background-color: #eee;
    padding: 10px;
    border-radius: 10px;
    position: relative;
    width: 200px;
  }

  .label-container {
    margin-bottom: 5px;
  }

  .label-input {
    font-size: 14px;
    font-weight: bold;
    width: 100%;
    border: none;
    background-color: transparent;
    outline: none;
  }

  .text-container {
    margin-top: 5px;
  }

  textarea {
    width: 100%;
    height: 60px;
    resize: vertical;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 5px;
  }

  .type-selector {
    margin-bottom: 5px;
  }

  select {
    width: 100%;
    padding: 5px;
    border-radius: 4px;
  }

  .results-container {
    margin-top: 5px;
  }

  .result {
    margin-bottom: 10px;
    padding: 5px;
    background-color: #fff;
    border-radius: 5px;
  }

  .delete-button {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: #ff4136;
    color: white;
    border: none;
    border-radius: 3px;
    padding: 2px 5px;
    font-size: 12px;
    cursor: pointer;
  }
</style>
