<!-- ResultNode.svelte -->
<script lang="ts">
  import { Handle, Position, type NodeProps, useSvelteFlow } from '@xyflow/svelte';
  import { Copy, Minimize2, Maximize2, Check, Trash2 } from 'lucide-svelte';
  import { onMount } from 'svelte';

  type $$Props = NodeProps;
  export let id: $$Props['id'];
  export let data: $$Props['data'];

  const { updateNode, deleteElements } = useSvelteFlow();

  if (!data.label) {
    data.label = 'Result Node';
  }

  let isMinimized = false;
  let containerWidth = 200;
  let containerHeight = 60;
  let isResizing = false;
  let resizeStartX: number;
  let resizeStartY: number;
  let initialWidth: number;
  let initialHeight: number;
  let copySuccess = false;

  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  function updateLabel(event) {
    updateNode(id, { data: { ...data, label: event.target.value } });
  }

  function changeNodeType(event) {
    updateNode(id, { type: event.target.value });
  }

  function deleteNode() {
    deleteElements({ nodes: [{ id }] });
  }

  async function copyResults() {
    const resultText = data.results ? data.results.join('\n\n') : '';
    try {
      await navigator.clipboard.writeText(resultText);
      copySuccess = true;
      setTimeout(() => copySuccess = false, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
  }

  $: streamingResult = data.streamingResult || '';
  $: completedResults = data.results || [];

  function formatText(text) {
    return text
      .replace(/\n\n/g, '<br><br>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^(\d+\. .*$)/gim, '<ol><li>$1</li></ol>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  function handleResizeStart(event: MouseEvent) {
    isResizing = true;
    resizeStartX = event.clientX;
    resizeStartY = event.clientY;
    initialWidth = containerWidth;
    initialHeight = containerHeight;
    event.stopPropagation();
  }

  function handleMouseMove(event: MouseEvent) {
    if (!isResizing) return;
    const dx = event.clientX - resizeStartX;
    const dy = event.clientY - resizeStartY;
    containerWidth = Math.max(200, initialWidth + dx);
    containerHeight = Math.max(60, initialHeight + dy);
  }

  function handleMouseUp() {
    isResizing = false;
  }

  function preventNodeDrag(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

<div class="custom" style="width: {containerWidth}px;">
  <Handle type="target" position={Position.Left} class="big-handle"/>
  <div class="header">
    <div class="type-selector">
      <select on:change={changeNodeType} value="result">
        <option value="text">Text</option>
        <option value="result">Result</option>
      </select>
    </div>
    <div class="buttons">
      <button class="icon-button" on:click={copyResults} title="Copy results">
        {#if copySuccess}
          <Check size={14} color="#4CAF50" />
        {:else}
          <Copy size={14} />
        {/if}
      </button>
      <button class="icon-button" on:click={toggleMinimize} title="Toggle minimize">
        {#if isMinimized}
          <Maximize2 size={14} />
        {:else}
          <Minimize2 size={14} />
        {/if}
      </button>
      <button class="icon-button" on:click={deleteNode} title="Delete node">
        <Trash2 size={14} />
      </button>
    </div>
  </div>
  <div class="label-container">
    <input
      class="label-input"
      value={data.label}
      on:input={updateLabel}
      placeholder="Enter label"
    />
  </div>
  {#if !isMinimized}
    <div class="results-container" 
         style="height: {containerHeight}px;"
         on:mousedown={preventNodeDrag}
         on:touchstart={preventNodeDrag}>
      {#if !completedResults.length && !streamingResult}
        <div>No results yet</div>
      {:else}
        {#each completedResults as result}
          <div class="result selectable">
            {@html formatText(result)}
          </div>
        {/each}
        {#if streamingResult}
          <div class="result streaming selectable">
            {@html formatText(streamingResult)}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
  <div class="resize-handle" on:mousedown={handleResizeStart}></div>
  <Handle type="source" position={Position.Right} class="big-handle"/>
</div>

<style>
  .custom {
    background-color: #dde8ed;
    padding: 10px;
    border-radius: 10px;
    position: relative;
    min-width: 200px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }
  .type-selector {
    flex: 1;
    margin-right: 10px;
  }
  .buttons {
    display: flex;
    align-items: center;
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
  select {
    width: 100%;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 12px;
  }
  .results-container {
    margin-top: 5px;
    overflow: auto;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 5px;
    box-sizing: border-box;
    font-size: 14px;
    font-family: inherit;
  }
  .result {
    margin-bottom: 10px;
    padding: 5px;
    background-color: #fff;
    border-radius: 5px;
  }
  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    margin-left: 5px;
  }
  .resize-handle {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 10px;
    height: 10px;
    background-color: #888;
    cursor: nwse-resize;
  }
  .streaming {
    border-left: 3px solid #4CAF50;
    padding-left: 5px;
  }
  .selectable {
    user-select: text;
    cursor: text;
  }
  :global(.selectable h1, .selectable h2, .selectable h3) {
    margin: 0.5em 0;
  }
  :global(.selectable ul, .selectable ol) {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  :global(.selectable code) {
    background-color: #f0f0f0;
    padding: 2px 4px;
    border-radius: 3px;
  }
</style>