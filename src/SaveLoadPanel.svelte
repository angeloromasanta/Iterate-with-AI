<!-- SaveLoadPanel.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Node, Edge } from '@xyflow/svelte';
  import TemplateDropdown from './TemplateDropdown.svelte';

  export let nodes: Node[];
  export let edges: Edge[];

  let textareaContent = '';
  let panelHeight = 150; // Default height in pixels
  let isDragging = false;
  let startY: number;
  let startHeight: number;

  const dispatch = createEventDispatcher();

  function simplifyNode(node) {
  const { id, type, data, position, measured, selected, class: nodeClass } = node;
  const roundedPosition = {
    x: Math.round(position.x / 10) * 10,
    y: Math.round(position.y / 10) * 10
  };
  return {
    id,
    type,
    data: { 
      label: data.label,
      text: data.text,
      results: type === 'result' ? data.results : undefined
    },
    position: roundedPosition,
    measured,
    selected,
    class: nodeClass
  };
}

  function simplifyEdge(edge) {
    const { id, source, target, data } = edge;
    return { id, source, target, data: { loopCount: data.loopCount } };
  }

  function exportFlow() {
    const simplifiedNodes = nodes.map(simplifyNode);
    const simplifiedEdges = edges.map(simplifyEdge);
    const flowData = JSON.stringify({ nodes: simplifiedNodes, edges: simplifiedEdges }, null, 2);
    textareaContent = flowData;
  }

  function importFlow() {
    try {
      const parsedData = JSON.parse(textareaContent);
      if (parsedData.nodes && parsedData.edges) {
        dispatch('import', parsedData);
      } else {
        alert('Invalid flow data format');
      }
    } catch (error) {
      alert('Error parsing flow data');
    }
  }

  function clearFlow() {
    if (confirm('Are you sure you want to clear the entire flow? This action cannot be undone.')) {
      dispatch('clear');
    }
  }

  function startResize(event: MouseEvent) {
    isDragging = true;
    startY = event.clientY;
    startHeight = panelHeight;
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
  }

  function resize(event: MouseEvent) {
    if (isDragging) {
      const diff = startY - event.clientY;
      panelHeight = Math.max(50, Math.min(startHeight + diff, window.innerHeight - 100));
      dispatch('resize', { height: panelHeight });
    }
  }

  function stopResize() {
    isDragging = false;
    window.removeEventListener('mousemove', resize);
    window.removeEventListener('mouseup', stopResize);
  }

  function handleLoadTemplate(event) {
    dispatch('loadTemplate', event.detail);
  }
</script>

<div class="save-load-panel" style="height: {panelHeight}px;">
  <div class="resize-handle" on:mousedown={startResize}></div>
  <div class="panel-content">
    <textarea bind:value={textareaContent} placeholder="Paste flow data here to import"></textarea>
    <div class="button-container">
      <TemplateDropdown on:loadTemplate={handleLoadTemplate} />
      <button on:click={exportFlow}>Export</button>
      <button on:click={importFlow}>Import</button>
      <button on:click={clearFlow} class="clear-button">Clear</button>
    </div>
  </div>
</div>

<style>
  .save-load-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: white;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 1000;
  }

  .resize-handle {
    width: 100%;
    height: 5px;
    background-color: #ddd;
    cursor: ns-resize;
  }

  .panel-content {
    display: flex;
    height: calc(100% - 5px);
    padding: 10px;
  }

  textarea {
    flex-grow: 1;
    resize: none;
    margin-right: 10px;
    font-family: monospace;
    font-size: 12px;
  }

  .button-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  button {
    padding: 5px 10px;
    margin-bottom: 10px;
    white-space: nowrap;
  }

  button:last-child {
    margin-bottom: 0;
  }

  .clear-button {
    background-color: #ff4136;
    color: white;
    border: none;
    cursor: pointer;
  }

  .clear-button:hover {
    background-color: #ff7066;
  }
</style>