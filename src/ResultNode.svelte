<script lang="ts">
  import { Handle, Position, type NodeProps, useSvelteFlow } from '@xyflow/svelte';
  import { Copy, Minimize2, Maximize2, Check, Trash2, Edit2, X } from 'lucide-svelte';
  import { isNodeResizing } from './stores'
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
  let resultsContainer: HTMLDivElement;
  let editingIndex = -1;
  let editingContent = '';
  let windowHeight: number;
  let manualResize = false;
  export let width = 200;
  export let height = 60;
  
  // Update container dimensions when props change

$: {
  if (width && !isResizing && !manualResize) {
    containerWidth = width;
  }
  if (height && !isResizing && !manualResize) {
    containerHeight = Math.max(60, height - 60); // Ensure minimum content height of 100px
  }
}

// Update node dimensions when manually resizing
$: if (!isResizing && manualResize) {
  updateNode(id, {
    width: containerWidth,
    height: Math.max(160, containerHeight + 60) // Ensure minimum total height of 160px (100px content + 60px header)
  });
}


  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', updateWindowHeight);
    updateWindowHeight();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', updateWindowHeight);
      $isNodeResizing = false;
    };
  });

  function updateWindowHeight() {
    windowHeight = window.innerHeight;
  }

  // Calculate dynamic height when streaming
  $: if (data.streamingResult && !isResizing) {
    const maxHeight = windowHeight * 0.7;
    const contentHeight = resultsContainer?.scrollHeight || 60;
    containerHeight = Math.min(maxHeight, contentHeight);
  }

  // Rest of the functions remain the same
  function updateLabel(event) {
    updateNode(id, { data: { ...data, label: event.target.value } });
  }

  function startEditing(index: number, content: string) {
    editingIndex = index;
    editingContent = content;
  }

  function saveEdit() {
    if (editingIndex === -1) return;
    
    const newResults = [...(data.results || [])];
    newResults[editingIndex] = editingContent;
    
    updateNode(id, {
      data: { ...data, results: newResults }
    });
    
    editingIndex = -1;
    editingContent = '';
  }

  function cancelEdit() {
    editingIndex = -1;
    editingContent = '';
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
  manualResize = true; // Set manual resize flag
  $isNodeResizing = true;
  resizeStartX = event.clientX;
  resizeStartY = event.clientY;
  initialWidth = containerWidth;
  initialHeight = containerHeight;
  event.stopPropagation();
  event.preventDefault();
}


  function handleMouseUp() {
    isResizing = false;
    $isNodeResizing = false;
    const currentTime = Date.now();
    window.dispatchEvent(new CustomEvent('nodeResizeEnd', { 
        detail: { timestamp: currentTime } 
    }));
  }

  function handleMouseMove(event: MouseEvent) {
  if (!isResizing || !manualResize) return;
  const dx = event.clientX - resizeStartX;
  const dy = event.clientY - resizeStartY;
  containerWidth = Math.max(200, initialWidth + dx);
  containerHeight = Math.max(60, initialHeight + dy);
}


  function preventNodeDrag(event: MouseEvent | TouchEvent) {
    event.stopPropagation();
  }

  function handleWheel(event: WheelEvent) {
    event.stopPropagation();
    if (resultsContainer) {
      resultsContainer.scrollTop += event.deltaY;
    }
  }
</script>

<!-- Rest of the template and style remain exactly the same -->
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
         on:touchstart={preventNodeDrag}
         on:wheel={handleWheel}
         bind:this={resultsContainer}>
      {#if !completedResults.length && !streamingResult}
        <div>No results yet</div>
      {:else}
        {#each completedResults as result, index}
          <div class="result selectable">
            {#if editingIndex === index}
    <div class="edit-container">
      <textarea
        class="edit-textarea"
        bind:value={editingContent}
        on:keydown={(e) => {
          if (e.key === 'Enter' && e.ctrlKey) saveEdit();
          if (e.key === 'Escape') cancelEdit();
        }}
      />
      <div class="edit-buttons">
        <button class="edit-action-button" on:click={saveEdit} title="Save">
          <Check size={14} />
        </button>
        <button class="edit-action-button" on:click={cancelEdit} title="Cancel">
          <X size={14} />
        </button>
      </div>
    </div>
  {:else}
    <div class="result-content">
      {@html formatText(result)}
      <button 
        class="edit-icon-button" 
        on:click={() => startEditing(index, result)}
        title="Edit result"
      >
        <Edit2 size={14} />
      </button>
    </div>
  {/if}
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
  <div 
    class="resize-handle" 
    on:mousedown={(e) => {
        handleResizeStart(e);
        e.stopPropagation();
        e.preventDefault();
    }}
    on:click={(e) => {
        e.stopPropagation();
        e.preventDefault();
    }}
    on:mouseup={(e) => {
        e.stopPropagation();
        e.preventDefault();
    }}
></div>
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
    overflow-y: auto;
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
  .edit-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  /* Adding box-sizing and focusing on clear font rendering */
.edit-textarea {
  width: 100%;
  min-height: 100px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;

  /* Ensure the textarea’s padding and borders don’t mess with its size */
  box-sizing: border-box;
  font-family: inherit;
  font-size: inherit;

  /* Prevent anti-aliasing and improve text clarity */
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: auto;

  /* Clear text rendering */
  text-rendering: optimizeLegibility;
}


                  .edit-buttons {
                    display: flex;
                    gap: 4px;
                    justify-content: flex-end;
                    margin-top: 4px;
                  }

                  .edit-icon-button {
                    position: absolute;
                    right: 4px;
                    top: 4px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    color: #666;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s, background-color 0.2s;
                  }


                  .edit-icon-button:hover {
                    background: rgba(0, 0, 0, 0.1);
                  }
  .edit-button {
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
                  .edit-button-container {
                    position: absolute;
                    bottom: 4px;
                    right: 4px;
                    z-index: 1;
                  }
  .edit-button.save {
    background-color: #4CAF50;
    color: white;
  }
  .edit-button.cancel {
    background-color: #f44336;
    color: white;
  }
                  .result-content {
                    position: relative;
                    padding-right: 30px; /* Add padding to prevent text from going under the button */
                    padding-bottom: 24px;
                  }
  .result-content:hover .edit-icon-button {
    opacity: 1;
  }
</style>