<!-- TextNode.svelte -->
  <script lang="ts">
    import { Handle, Position, type NodeProps, useSvelteFlow } from '@xyflow/svelte';
    import { Copy, Minimize2, Maximize2, Trash2, Check } from 'lucide-svelte';
    import { onMount } from 'svelte';

    type $$Props = NodeProps;
    export let id: $$Props['id'];
    export let data: $$Props['data'] & { allNodes?: { id: string; label: string }[] };

    const { updateNode, deleteElements } = useSvelteFlow();

    let suggestions: string[] = [];
    let showSuggestions = false;
    let cursorPosition = 0;
    let textarea: HTMLTextAreaElement;

    let isMinimized = false;
    let containerWidth = 200;
    let containerHeight =60;
    let isResizing = false;
    let resizeStartX: number;
    let resizeStartY: number;
    let initialWidth: number;
    let initialHeight: number;
    let copySuccess = false;

    console.log(`TextNode ${id} initialized with data:`, data);
    $: console.log(`TextNode ${id} received data:`, data);
    
    if (!data.label) {
      data.label = 'Node';
    }
    if (!data.text) data.text = 'Insert prompt here.';

    onMount(() => {
      console.log(`TextNode ${id} mounted`);
      textarea.addEventListener('keydown', (e) => {
        if (showSuggestions && e.key === 'ArrowDown') {
          e.preventDefault();
          const suggestionList = document.querySelector('.suggestions');
          if (suggestionList) {
            (suggestionList.firstChild as HTMLElement).focus();
          }
        }
      });
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    });

    function updateLabel(event) {
      const newLabel = event.target.value;
      console.log(`Updating label for node ${id}:`, newLabel);
      updateNode(id, { data: { ...data, label: newLabel } });
    }

    function updateText(event) {
      const newText = event.target.value;
      console.log(`Updating text for node ${id}:`, newText);
      updateNode(id, { data: { ...data, text: newText } });
      checkForAutocomplete(newText);
    }

    function checkForAutocomplete(text: string) {
      console.log(`Checking for autocomplete in node ${id}. allNodes:`, data.allNodes);
      if (!data.allNodes || data.allNodes.length === 0) {
        console.warn(`allNodes data is not available or empty for node ${id}`);
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
        console.log(`Suggestions for node ${id}:`, suggestions);
      } else {
        showSuggestions = false;
      }
    }
    console.log(`TextNode ${id} initialized with data:`, data);
    
    function selectSuggestion(suggestion: string) {
      console.log(`Selecting suggestion for node ${id}:`, suggestion);
      const text = data.text;
      const textBeforeCursor = text.slice(0, cursorPosition);
      const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
      const newText = text.slice(0, lastOpenBrace + 1) + suggestion + '}' + text.slice(cursorPosition);
      updateNode(id, { data: { ...data, text: newText } });
      showSuggestions = false;
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
        await navigator.clipboard.writeText(data.text);
        copySuccess = true;
        setTimeout(() => copySuccess = false, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
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
      containerHeight = Math.max(100, initialHeight + dy);
    }

    function handleMouseUp() {
      isResizing = false;
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
          placeholder="Insert prompt here."
        />
        {#if showSuggestions}
          <div class="suggestions">
            {#each suggestions as suggestion}
              <div
                tabindex="0"
                on:click={() => selectSuggestion(suggestion)}
                on:keydown={(e) => e.key === 'Enter' && selectSuggestion(suggestion)}
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
    .suggestions {
      position: absolute;
      background-color: white;
      border: 1px solid #ccc;
      max-height: 150px;
      overflow-y: auto;
      z-index: 1000;
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