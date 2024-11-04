<!-- LocalCanvasPanel.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { defaultCanvases} from './defaultCanvases';
  import type { Node, Edge } from '@xyflow/svelte';
  import { Plus, Save, Trash2, ChevronLeft, ChevronRight, Edit2, Download, Upload, Info } from 'lucide-svelte';

  export let nodes;
  export let edges;

  const dispatch = createEventDispatcher();
  
  let savedCanvases = [];
  let isPaneVisible = true;
  let currentCanvasName = '';
  let showToggle = false;
  let showInfoModal = false;
  
  function initializeDefaultCanvases() {
    const hasInitialized = localStorage.getItem('hasInitializedDefaults');
    
    if (!hasInitialized) {
      Object.entries(defaultCanvases).forEach(([name, canvas]) => {
        localStorage.setItem(`canvas_${name}`, JSON.stringify(canvas));
      });

      const defaultCanvasNames = Object.keys(defaultCanvases);
      localStorage.setItem('canvasList', JSON.stringify(defaultCanvasNames));
      localStorage.setItem('hasInitializedDefaults', 'true');
      loadCanvas('Tutorial Canvas');
      savedCanvases = defaultCanvasNames;
    }
  }

  function loadSavedCanvasList() {
    const canvasList = localStorage.getItem('canvasList');
    if (!canvasList) {
      initializeDefaultCanvases();
    } else {
      savedCanvases = JSON.parse(canvasList);
    }
  }

  onMount(() => {
    loadSavedCanvasList();
  });

  loadSavedCanvasList();

  function togglePane() {
    isPaneVisible = !isPaneVisible;
  }

  function validateNodeStructure(node) {
    if (!node || typeof node !== 'object') {
      console.error('Invalid node object:', node);
      return false;
    }
    
    const requiredFields = ['id', 'type', 'data', 'position'];
    for (const field of requiredFields) {
      if (!(field in node)) {
        console.error(`Missing required field '${field}' in node:`, node);
        return false;
      }
    }
    
    return true;
  }

  function validateEdgeStructure(edge) {
    if (!edge || typeof edge !== 'object') {
      console.error('Invalid edge object:', edge);
      return false;
    }
    
    const requiredFields = ['id', 'source', 'target'];
    for (const field of requiredFields) {
      if (!(field in edge)) {
        console.error(`Missing required field '${field}' in edge:`, edge);
        return false;
      }
    }
    
    return true;
  }

  function saveCanvas(name: string) {
    if (!name) return;
    
    const canvasData = {
      nodes: $nodes.filter(validateNodeStructure),
      edges: $edges.filter(validateEdgeStructure)
    };

    try {
      localStorage.setItem(`canvas_${name}`, JSON.stringify(canvasData));
    } catch (error) {
      console.error('Error saving canvas:', error);
      alert('Error saving canvas');
    }
  }

  function saveCurrentCanvas() {
    const firstTextNode = $nodes.find(node => 
      node.type === 'text' && 
      node.data?.text?.trim()
    );
    
    let defaultName = firstTextNode 
      ? firstTextNode.data.text.slice(0, 30) + (firstTextNode.data.text.length > 30 ? '...' : '')
      : `Canvas ${new Date().toLocaleString()}`;

    let uniqueName = defaultName;
    let counter = 1;
    while (savedCanvases.includes(uniqueName)) {
      uniqueName = `${defaultName} (${counter})`;
      counter++;
    }

    const canvasData = {
      nodes: $nodes.filter(validateNodeStructure),
      edges: $edges.filter(validateEdgeStructure)
    };

    try {
      localStorage.setItem(`canvas_${uniqueName}`, JSON.stringify(canvasData));
      savedCanvases = [...savedCanvases, uniqueName];
      localStorage.setItem('canvasList', JSON.stringify(savedCanvases));
      currentCanvasName = uniqueName;
    } catch (error) {
      console.error('Error saving canvas:', error);
      alert('Error saving canvas');
    }
  }

  function loadCanvas(name: string) {
    if (currentCanvasName) {
      saveCanvas(currentCanvasName);
    }

    const canvasData = localStorage.getItem(`canvas_${name}`);

    if (!canvasData) {
      console.error('No canvas data found for name:', name);
      return;
    }

    try {
      const parsedData = JSON.parse(canvasData);

      if (!parsedData || !parsedData.nodes || !parsedData.edges) {
        console.error('Invalid canvas data structure:', parsedData);
        alert('Error: Invalid canvas data structure');
        return;
      }

      const validNodes = Array.isArray(parsedData.nodes) 
        ? parsedData.nodes.filter(validateNodeStructure)
        : Object.values(parsedData.nodes).filter(validateNodeStructure);

      const validEdges = Array.isArray(parsedData.edges)
        ? parsedData.edges.filter(validateEdgeStructure)
        : Object.values(parsedData.edges).filter(validateEdgeStructure);

      if (validNodes.length === 0) {
        console.error('No valid nodes found in canvas data');
        alert('Error: No valid nodes found in canvas data');
        return;
      }

      currentCanvasName = name;
      dispatch('load', {
        nodes: validNodes,
        edges: validEdges
      });
      setTimeout(() => {
        dispatch('fitview');
      }, 50);
    } catch (error) {
      console.error('Error parsing canvas data:', error);
      alert('Error loading canvas');
    }
  }

  function renameCanvas(oldName: string) {
    const newName = prompt('Enter new name:', oldName);
    if (newName && newName !== oldName) {
      const canvasData = localStorage.getItem(`canvas_${oldName}`);
      localStorage.setItem(`canvas_${newName}`, canvasData);
      localStorage.removeItem(`canvas_${oldName}`);
      savedCanvases = savedCanvases.map(n => n === oldName ? newName : n);
      localStorage.setItem('canvasList', JSON.stringify(savedCanvases));
      if (currentCanvasName === oldName) {
        currentCanvasName = newName;
      }
    }
  }

  function deleteCanvas(name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    localStorage.removeItem(`canvas_${name}`);
    savedCanvases = savedCanvases.filter(n => n !== name);
    localStorage.setItem('canvasList', JSON.stringify(savedCanvases));
    if (currentCanvasName === name) {
      currentCanvasName = '';
    }
  }

  function createNewCanvas() {
    if (currentCanvasName) {
      saveCanvas(currentCanvasName);
    }
    currentCanvasName = '';
    // Instead of directly dispatching 'clear', dispatch an event with empty nodes and edges
    dispatch('load', {
      nodes: [],
      edges: []
    });
    // After clearing, fit view to reset the viewport
    setTimeout(() => {
      dispatch('fitview');
    }, 50);
  }
  
  function exportCanvases() {
    const exportData = {
      canvasList: savedCanvases,
      canvases: {}
    };
    
    savedCanvases.forEach(name => {
      const canvasData = localStorage.getItem(`canvas_${name}`);
      if (canvasData) {
        exportData.canvases[name] = JSON.parse(canvasData);
      }
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvases-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importCanvases() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        if (!importData.canvasList || !importData.canvases) {
          throw new Error('Invalid import file format');
        }

        importData.canvasList.forEach(name => {
          const canvasData = importData.canvases[name];
          if (canvasData) {
            localStorage.setItem(`canvas_${name}`, JSON.stringify(canvasData));
          }
        });

        const newCanvasList = [...new Set([...savedCanvases, ...importData.canvasList])];
        savedCanvases = newCanvasList;
        localStorage.setItem('canvasList', JSON.stringify(newCanvasList));

        alert('Canvases imported successfully!');
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing canvases. Please check the file format.');
      }
    };

    input.click();
  }
</script>

<div class="panel" class:collapsed={!isPaneVisible}>
  <div 
  class="panel-edge"
  on:mouseenter={() => showToggle = true}
  on:mouseleave={() => showToggle = false}
  on:click={togglePane}
>
  {#if showToggle}
    <div class="toggle-indicator">
      {#if isPaneVisible}
        <ChevronLeft size={16} />
      {:else}
        <ChevronRight size={16} />
      {/if}
    </div>
  {/if}
</div>
  
  {#if isPaneVisible}
    <div class="main-title">
      Iterate with AI
      <button class="info-button" on:click={() => showInfoModal = true}>
        <Info size={18} />
      </button>
    </div>
    
    <div class="save-buttons">
      <button class="save-button" on:click={() => saveCanvas(currentCanvasName)} disabled={!currentCanvasName}>
        <Save size={18} />
        Save
      </button>
      <button class="save-as-button" on:click={saveCurrentCanvas}>
        <Save size={18} />
        Save As
      </button>
    </div>

    <div class="canvas-list">
      {#if savedCanvases.length === 0}
        <div class="empty-state">No saved canvases</div>
      {:else}
        {#each savedCanvases as name}
          <div class="canvas-item" class:selected={name === currentCanvasName}>
            <span class="canvas-name" on:click={() => loadCanvas(name)}>
              {name}
            </span>
            <div class="canvas-actions">
              <button class="action-btn" on:click={() => renameCanvas(name)}>
                <Edit2 size={14} />
              </button>
              <button class="delete-btn" on:click={() => deleteCanvas(name)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        {/each}
      {/if}

      <button class="add-button" on:click={createNewCanvas}>
        <Plus size={18} />
        Add new canvas
      </button>
    </div>
    <div class="import-export-buttons">
      <button class="import-button" on:click={importCanvases}>
        <Upload size={18} />
        Import
      </button>
      <button class="export-button" on:click={exportCanvases}>
        <Download size={18} />
        Export
      </button>
    </div>

    {#if showInfoModal}
      <div class="modal-overlay" on:click={() => showInfoModal = false}>
        <div class="modal-content" on:click|stopPropagation>
          <h2>👋 Hello there, fellow prompt engineer!</h2>

          <p>Welcome to <strong>Iterate with AI</strong> - where we've boldly moved beyond linear chat interfaces into the wild world of 2D! Because who said AI conversations had to be as one-dimensional as my programming skills? 😅</p>

          <h3>🤔 What's this all about?</h3>
          <p>Think of this as ChatGPT's cooler cousin who learned to think in graphs instead of straight lines. You can spread your ideas across the canvas.</p>

          <h3>🦙 Models & Privacy</h3>
          <p>Llama is free because, well, it's a bit cheaper! For fancier models, just plug in your OpenRouter API key. Everything stays between you and your device - I couldn't peek at your prompts even if I wanted to.</p>

          <h3>✨ Two Ways to Play</h3>
          <p><strong>The Classic Way:</strong> Click anywhere, type your prompt, drag to connect. But wait, there's more!</p>
          <ul>
            <li>
              <p>🔄 Multi-Model Magic: Run your prompt through different models simultaneously! Compare how GPT-4 and Claude handle the same task, or use Llama for drafts and polish with GPT-4. </p>
            </li>

            <li>
              <p>🎯 Node References: Use {'{Node Name}'} to reference any node's content in your prompts. Perfect for having multiple texts that you want to analyze interchangeably</p>
            </li>
          </ul>


          <p><strong>Fancy templates:</strong> Grab a template, hit the zap button, and watch the magic happen. Use the loop feature to iterate your ideas into perfection (or until you run out of tokens)</p>

          <h3>👨‍💻 Behind the Scenes</h3>
          <p>Created by <a href="https://www.linkedin.com/in/angeloromasanta/"> Angelo</a>, who somehow is convinced that Claude is programming. No prior experience required - just a lot of coffee and questionable life choices! 🎯</p>

          <button class="close-button" on:click={() => showInfoModal = false}>Got it!</button>
        </div>
      </div>
    {/if}


  {/if}
</div>

<style>
   .panel {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 250px;
    background: #f8faff;
    border-right: 1px solid #ccc;
    display: flex;
    flex-direction: column;
    z-index: 5;
    transition: width 0.3s ease;
    font-size: 12px;
  }

  .panel.collapsed {
    width: auto;
  }

  .panel-edge {
    position: absolute;
    right: -6px; /* Made thicker */
    top: 0;
    bottom: 0;
    width: 6px; /* Made thicker */
    cursor: pointer;
    background: transparent;
    transition: all 0.2s ease;
  }

  .panel-edge:hover {
    background: rgba(0, 0, 0, 0.25); /* Darker hover state */
  }

  .toggle-indicator {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  /* Update toggle indicator color on hover */
  .panel-edge:hover .toggle-indicator {
    color: #fff; /* Make the chevron white on hover */
  }


 

  .toggle-button {
    position: absolute;
    right: -18px;
    top: 50%;
    transform: translateY(-50%);
    background: #f8faff;
    border: 1px solid #ccc;
    border-left: none;
    border-radius: 0 2px 2px 0;
    padding: 2px;
    cursor: pointer;
    height: 40px;
    width: 18px;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-button:hover {
    background: #fff;
    color: #333;
  }

  .main-title {
    padding: 15px;
    font-size: 24px;
    font-weight: bold;
    border-bottom: 1px solid #eee;
  }

  .save-buttons {
    display: flex;
    gap: 4px;
    margin: 8px;
  }

  .save-button, .save-as-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px;
    background: #dde8ed;
    border: 1px solid #ccc;
    border-radius: 4px;
    color: #333;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s;
  }

  .add-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 8px;
    padding: 8px;
    background: #dde8ed;
    border: 1px solid #ccc;
    border-radius: 4px;
    color: #333;
    cursor: pointer;
    font-size: 12px;
    width: calc(100% - 16px);
    transition: background-color 0.2s;
  }

 

  
  .save-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .save-button:hover:not(:disabled), .save-as-button:hover, .add-button:hover {
    background: #c8d8e0;
  }



  .add-button:hover {
    background: #d1ffd1;
  }

  .canvas-list {
    flex-grow: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
  }

  .canvas-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    border: 1px solid #eee;
    margin-bottom: 4px;
    border-radius: 4px;
    font-size: 12px;
    background: white;
  }

  .canvas-item.selected {
    background: #e6f3ff;
    border: 1px solid #add6ff;
  }

  .canvas-item:hover {
    background: #f5f5f5;
  }

  .canvas-name {
    cursor: pointer;
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #333;
  }

  .canvas-name:hover {
    text-decoration: underline;
  }

  .canvas-actions {
    display: flex;
    gap: 4px;
    opacity: 0.6;
  }

  .canvas-item:hover .canvas-actions {
    opacity: 1;
  }

  .action-btn, .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
  }

  .action-btn:hover {
    color: #4CAF50;
  }

  .delete-btn:hover {
    color: #ff4136;
  }

  .empty-state {
    color: #666;
    text-align: center;
    padding: 16px;
    font-style: italic;
    font-size: 12px;
  }

  .import-export-buttons {
    padding: 8px;
    display: flex;
    gap: 8px;
    border-top: 1px solid #eee;
  }

  .import-button, .export-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s;
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    color: #666;
  }

  .import-button:hover {
    background: #ffe6d1;
  }

  .export-button:hover {
    background: #d1ffe6;
  }
  .info-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: #666;
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  .info-button:hover {
    color: #333;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999; /* Increased z-index to be above all other elements */
  }

  .modal-content {
    background: white;
    padding: 24px;
    border-radius: 8px;
    max-width: 600px;
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000; /* Even higher z-index than the overlay */
  }


  .modal-content h2 {
    margin-top: 0;
    color: #333;
    font-size: 24px;
  }

  .modal-content h3 {
    margin-top: 20px;
    color: #444;
    font-size: 18px;
  }

  .modal-content p {
    color: #666;
    line-height: 1.5;
    margin: 12px 0;
  }

  .close-button {
    display: block;
    margin: 20px auto 0;
    padding: 8px 16px;
    background: #dde8ed;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
  }

  .close-button:hover {
    background: #c8d8e0;
  }

  .main-title {
    padding: 15px;
    font-size: 24px;
    font-weight: bold;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
  }

</style>
