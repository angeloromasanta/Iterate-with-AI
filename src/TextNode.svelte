<!-- TextNode.svelte -->
<script lang="ts">
  import { Handle, Position, type NodeProps, useSvelteFlow } from '@xyflow/svelte';
  import { Copy, Minimize2, Maximize2, Trash2, Check } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { isNodeResizing } from './stores';

  type $$Props = NodeProps;
  export let id: $$Props['id'];
  export let data: $$Props['data'] & { allNodes?: { id: string; label: string }[] };

  const { updateNode, deleteElements } = useSvelteFlow();

  let suggestions: string[] = [];
  let showSuggestions = false;
  let cursorPosition = 0;
  let textarea: HTMLTextAreaElement;
  let selectedSuggestionIndex = -1;

  let isMinimized = false;
  let containerWidth = 200;
  let containerHeight = 60;
  let isResizing = false;
  let resizeStartX: number;
  let resizeStartY: number;
  let initialWidth: number;
  let initialHeight: number;
  let copySuccess = false;
export let width = 200;
export let height = 60;
let manualResize = false;

$: {
  if (width && !isResizing && !manualResize) {
    containerWidth = width;
  }
  if (height && !isResizing && !manualResize) {
    containerHeight = Math.max(60, height - 60);
  }
}

$: if (!isResizing && manualResize) {
  updateNode(id, {
    width: containerWidth,
    height: Math.max(160, containerHeight + 60)
  });
}


  if (!data.label) {
    data.label = 'Node';
  }
  if (!data.text) data.text = 'Insert prompt here.';

  onMount(() => {
    console.log(`TextNode ${id} mounted`);
    textarea.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      $isNodeResizing = false;
    };
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
        highlightSuggestion(selectedSuggestionIndex);
        break;

      case 'ArrowUp':
        e.preventDefault();
        selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
        highlightSuggestion(selectedSuggestionIndex);
        break;

      case 'Tab':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else if (suggestions.length > 0) {
          selectSuggestion(suggestions[0]);
        }
        break;

      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        break;

      case 'Escape':
        showSuggestions = false;
        selectedSuggestionIndex = -1;
        break;
    }
  }

  function highlightSuggestion(index: number) {
    const suggestionElements = document.querySelectorAll('.suggestion-item');
    suggestionElements.forEach((el, i) => {
      if (i === index) {
        (el as HTMLElement).classList.add('selected');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        (el as HTMLElement).classList.remove('selected');
      }
    });
  }

  function updateLabel(event) {
    const newLabel = event.target.value;
    updateNode(id, { data: { ...data, label: newLabel } });
  }

  function updateText(event) {
    const newText = event.target.value;
    updateNode(id, { data: { ...data, text: newText } });
    checkForAutocomplete(newText);
  }

  function checkForAutocomplete(text: string) {
    if (!data.allNodes || data.allNodes.length === 0) {
      return;
    }

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');

    if (lastOpenBrace !== -1 && textBeforeCursor.indexOf('}', lastOpenBrace) === -1) {
      const searchTerm = textBeforeCursor.slice(lastOpenBrace + 1).toLowerCase();
      suggestions = data.allNodes
        .map(node => node.label)
        .filter(label => label.toLowerCase().includes(searchTerm));
      showSuggestions = suggestions.length > 0;
      cursorPosition = cursorPos;
      selectedSuggestionIndex = -1;
    } else {
      showSuggestions = false;
      selectedSuggestionIndex = -1;
    }
  }

  function selectSuggestion(suggestion: string) {
    const text = data.text;
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
    const newText = text.slice(0, lastOpenBrace + 1) + suggestion + '}' + text.slice(cursorPosition);
    updateNode(id, { data: { ...data, text: newText } });
    showSuggestions = false;
    selectedSuggestionIndex = -1;
    textarea.focus();
  }

  function changeNodeType(event) {
    const newType = event.target.value;
    console.log(`Changing node ${id} type to:`, newType);
    updateNode(id, { type: newType });
  }

  function onTextareaMouseDown(event: MouseEvent) {
    event.stopPropagation();
  }

  function deleteNode() {
    console.log(`Deleting node ${id}`);
    deleteElements({ nodes: [{ id }] });
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
  }

  async function copyText() {
  try {
    let textToCopy = data.text;
    console.log('Initial text to copy:', textToCopy);
    console.log('All available nodes:', data.allNodes);
    
    // Replace references with actual content wrapped in tags
    const regex = /{([^}]+)}/g;
    textToCopy = textToCopy.replace(regex, (match, label) => {
      const referencedNode = data.allNodes?.find(n => n.label === label);
      console.log(`Looking for node with label "${label}"`, referencedNode);
      console.log(`Node type:`, referencedNode?.type);
      console.log(`Node results:`, referencedNode?.results);
      
      if (referencedNode) {
        if (referencedNode.type === 'result') {
          if (referencedNode.results && referencedNode.results.length > 0) {
            const latestResult = referencedNode.results[referencedNode.results.length - 1];
            console.log(`Found result content for "${label}":`, latestResult);
            return `<${label}>${latestResult}</${label}>`;
          } else {
            console.log(`Result node found but no results available for "${label}"`);
          }
        } else if (referencedNode.type === 'text') {
          const nodeContent = referencedNode.text;
          console.log(`Found text content for "${label}":`, nodeContent);
          return `<${label}>${nodeContent}</${label}>`;
        } else {
          console.log(`Unknown node type for "${label}":`, referencedNode.type);
        }
      }
      
      console.log(`No content found for "${label}", keeping original reference`);
      return match;
    });

    console.log('Final text to copy:', textToCopy);
    await navigator.clipboard.writeText(textToCopy);
    copySuccess = true;
    setTimeout(() => copySuccess = false, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}


function handleResizeStart(event: MouseEvent) {
  isResizing = true;
  manualResize = true;  // Add this line
  $isNodeResizing = true;
  resizeStartX = event.clientX;
  resizeStartY = event.clientY;
  initialWidth = containerWidth;
  initialHeight = containerHeight;
  event.stopPropagation();
  event.preventDefault();
}


function handleMouseMove(event: MouseEvent) {
  if (!isResizing || !manualResize) return;  // Add !manualResize check
  const dx = event.clientX - resizeStartX;
  const dy = event.clientY - resizeStartY;
  containerWidth = Math.max(200, initialWidth + dx);
  containerHeight = Math.max(60, initialHeight + dy);
}

  function handleMouseUp() {
    isResizing = false;
    $isNodeResizing = false;  // Reset global resize state
  }

  function handleWheel(event: WheelEvent) {
    event.stopPropagation();
  }

  
</script>

<div class="custom" style="width: {containerWidth}px;">
  <Handle type="target" position={Position.Left} class="big-handle" />
  <div class="header">
    <div class="type-selector">
      <select on:change={changeNodeType} value={data.nodeType || 'text'}>
        <option value="text">Text</option>
        <option value="result">Result</option>
      </select>
    </div>
    <div class="buttons">
      <button class="icon-button" on:click={copyText} title="Copy text">
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
  <div class="text-container" style="height: {containerHeight}px;">
    <textarea
      bind:this={textarea}
      value={data.text}
      on:input={updateText}
      on:mousedown={onTextareaMouseDown}
      on:wheel={handleWheel}
      placeholder="Insert prompt here."
    />
    {#if showSuggestions}
      <div class="suggestions">
        {#each suggestions as suggestion, index}
          <div
            class="suggestion-item"
            class:selected={index === selectedSuggestionIndex}
            on:click={() => selectSuggestion(suggestion)}
            on:mouseenter={() => selectedSuggestionIndex = index}
          >
            {suggestion}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
<div class="resize-handle" on:mousedown={handleResizeStart}></div>
<Handle type="source" position={Position.Right} class="big-handle"/>
</div>

<style>
  .custom {
    background-color: #eee;
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
  .text-container {
    margin-top: 5px;
    overflow: hidden;
  }
  textarea {
    width: 100%;
    height: 100%;
    resize: none;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 5px;
    font-size: 14px;
    font-family: inherit;
  }
  select {
    width: 100%;
    padding: 2px 5px;
    border-radius: 4px;
    font-size: 12px;
  }
  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    margin-left: 5px;
  }
  .suggestion-item {
    padding: 5px;
    cursor: pointer;
  }

  .suggestion-item:hover,
  .suggestion-item.selected {
    background-color: #f0f0f0;
  }

  .suggestions {
    position: absolute;
    background-color: white;
    border: 1px solid #ccc;
    max-height: 150px;
    overflow-y: auto;
    z-index: 1000;
    width: calc(100% - 20px);  /* Account for padding */
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .suggestions div {
    padding: 5px;
    cursor: pointer;
  }
  .suggestions div:hover, .suggestions div:focus {
    background-color: #f0f0f0;
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
</style>