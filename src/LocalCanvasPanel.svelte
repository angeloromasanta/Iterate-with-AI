<!-- LocalCanvasPanel.svelte -->
<script lang="ts">
import { ChevronLeft, ChevronRight, Info, Plus, Edit2, Copy, Trash2, Upload, Download, Save } from 'lucide-svelte';
import { createEventDispatcher, onMount } from 'svelte';
import { defaultCanvases } from './defaultCanvases';
const dispatch = createEventDispatcher();

export let nodes;
export let edges;

let isPaneVisible = true;
let showToggle = false;
let showInfoModal = false;
let lastSavedTime = null;
let currentCanvasName = 'Untitled Canvas';
let savedCanvases = [];
let isLoading = false; // Add loading state to prevent race conditions

// Load saved canvases from localStorage on component mount
onMount(() => {
  const saved = localStorage.getItem('savedCanvases');
  const isFirstVisit = !saved;

  if (isFirstVisit) {
    // Load default canvases for first-time visitors
    Object.entries(defaultCanvases).forEach(([name, canvas]) => {
      localStorage.setItem(`canvas_${name}`, JSON.stringify({
        ...canvas,
        lastModified: new Date().toISOString()
      }));
    });
    savedCanvases = Object.keys(defaultCanvases);
    localStorage.setItem('savedCanvases', JSON.stringify(savedCanvases));
    
    // Set and load the Tutorial Canvas as default
    currentCanvasName = 'Tutorial Canvas';
    localStorage.setItem('lastActiveCanvas', currentCanvasName);
    loadCanvas(currentCanvasName);
  } else {
    // Load existing canvases for returning visitors
    savedCanvases = JSON.parse(saved);
    const lastActive = localStorage.getItem('lastActiveCanvas');
    if (lastActive) {
      currentCanvasName = lastActive;
      loadCanvas(lastActive);
    } else {
      // If no last active canvas, load Tutorial Canvas
      currentCanvasName = 'Tutorial Canvas';
      loadCanvas(currentCanvasName);
    }
  }
});

function togglePane() {
  isPaneVisible = !isPaneVisible;
}

function saveCurrentCanvas() {
  if (!currentCanvasName || isLoading) return;
  
  // Clean and prepare the canvas data similar to export
  const canvasData = {
    nodes: $nodes.map(node => {
      const cleanNode = { ...node };
      if (cleanNode.data && cleanNode.data.allNodes) {
        const { allNodes, ...rest } = cleanNode.data;
        cleanNode.data = rest;
      }
      return cleanNode;
    }),
    edges: $edges,
    lastModified: new Date().toISOString()
  };
  
  // Save to localStorage
  localStorage.setItem(`canvas_${currentCanvasName}`, JSON.stringify(canvasData));
  localStorage.setItem('lastActiveCanvas', currentCanvasName);
  
  // Update last saved time
  lastSavedTime = new Date().toLocaleTimeString();
}

async function loadCanvas(name) {
  if (isLoading) return; // Prevent multiple simultaneous loads
  isLoading = true;
  
  const savedData = localStorage.getItem(`canvas_${name}`);
  if (!savedData) {
    isLoading = false;
    return;
  }
  
  try {
    const canvasData = JSON.parse(savedData);
    
    // Reset the current canvas state
    nodes.set([]);
    edges.set([]);
    
    // Wait for state to clear
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Load nodes with cleaned size data
    const cleanedNodes = canvasData.nodes.map(node => ({
      ...node,
      // Ensure consistent node sizing by removing any stored dimensions
      dimension: undefined,
      computed: undefined,
      style: {
        ...node.style,
        width: undefined,
        height: undefined
      }
    }));
    
    nodes.set(cleanedNodes);
    edges.set(canvasData.edges);
    
    currentCanvasName = name;
    localStorage.setItem('lastActiveCanvas', name);
    lastSavedTime = new Date(canvasData.lastModified).toLocaleTimeString();
    
    // Dispatch event to notify parent components
    dispatch('canvasLoaded', {
      name: name,
      nodeCount: cleanedNodes.length,
      edgeCount: canvasData.edges.length
    });

    // Add delay to ensure nodes are rendered before fitting view
    await new Promise(resolve => setTimeout(resolve, 100));
    dispatch('fitView');
    
  } catch (error) {
    console.error('Error loading canvas:', error);
    alert('Error loading canvas data');
  } finally {
    isLoading = false;
  }
}
function createNewCanvas() {
  if (isLoading) return;
  isLoading = true;
  dispatch('setLoading', { loading: true });
  
  // Generate a unique name for the new canvas
  let name = 'Untitled Canvas';
  let counter = 1;
  while (savedCanvases.includes(name)) {
    name = `Untitled Canvas ${counter}`;
    counter++;
  }
  
  // Create initial nodes matching the structure of working JSON
  const textNode = {
    id: "1",
    type: "text",
    data: {
      label: "Text Node 1",
      text: ""  // Empty text to start
    },
    position: {
      x: 100,
      y: 100
    },
    measured: {
      width: 200,   // Default width
      height: 140   // Default height
    },
    selected: false,
    class: "",
    style: {}
  };
  
  const resultNode = {
    id: "2",
    type: "result",
    data: {
      label: "Result Node 1",
      text: ""  // Empty result to start
    },
    position: {
      x: 350,
      y: 100
    },
    measured: {
      width: 200,   // Default width
      height: 130   // Default height for result nodes
    },
    selected: false,
    class: "",
    style: {}
  };
  
  // Create initial edge
  const edge = {
    id: "e1-2",
    source: "1",
    target: "2",
    data: {
      showLoopCount: false
    },
    selected: false
  };
  
  const canvasData = {
    nodes: [textNode, resultNode],
    edges: [edge],
    lastModified: new Date().toISOString()
  };
  
  // Save the new canvas
  localStorage.setItem(`canvas_${name}`, JSON.stringify(canvasData));
  savedCanvases = [...savedCanvases, name];
  localStorage.setItem('savedCanvases', JSON.stringify(savedCanvases));
  
  // Update current canvas name
  currentCanvasName = name;
  
  // Clear existing state
  nodes.set([]);
  edges.set([]);
  
  // Use Promise chain for proper sequencing
  return new Promise((resolve) => {
    setTimeout(() => {
      // Set new nodes and edges
      nodes.set(canvasData.nodes);
      edges.set(canvasData.edges);
      
      dispatch('resetTimers');
      
      // Wait for nodes to be rendered
      setTimeout(() => {
        dispatch('fitView');
        dispatch('setLoading', { loading: false });
        isLoading = false;
        resolve();
      }, 100);
    }, 50);
  });
}


async function importCanvas() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target.result as string);
        
        // Generate a unique name for the imported canvas
        let name = file.name.replace('.json', '');
        let counter = 1;
        while (savedCanvases.includes(name)) {
          name = `${file.name.replace('.json', '')} (${counter})`;
          counter++;
        }
        
        // Process the imported data
        const canvasData = {
          nodes: content.nodes,
          edges: content.edges,
          lastModified: new Date().toISOString()
        };
        
        // Save the imported canvas
        localStorage.setItem(`canvas_${name}`, JSON.stringify(canvasData));
        savedCanvases = [...savedCanvases, name];
        localStorage.setItem('savedCanvases', JSON.stringify(savedCanvases));
        
        // Load the imported canvas
        currentCanvasName = name;
        loadCanvas(name);
        
      } catch (error) {
        console.error('Error importing canvas:', error);
        alert('Error importing canvas file');
      }
    };
    reader.readAsText(file);
  };
  
  input.click();
}

function exportCanvas() {
  if (!currentCanvasName) return;
  
  // Get the current canvas data
  const canvasData = {
    nodes: $nodes.map(node => {
      const cleanNode = { ...node };
      if (cleanNode.data && cleanNode.data.allNodes) {
        const { allNodes, ...rest } = cleanNode.data;
        cleanNode.data = rest;
      }
      return cleanNode;
    }),
    edges: $edges
  };
  
  // Create the download
  const dataStr = JSON.stringify(canvasData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportElem = document.createElement('a');
  exportElem.setAttribute('href', dataUri);
  exportElem.setAttribute('download', `${currentCanvasName}.json`);
  document.body.appendChild(exportElem);
  exportElem.click();
  document.body.removeChild(exportElem);
}

function renameCanvas(oldName) {
  const newName = prompt('Enter new name:', oldName);
  if (!newName || newName === oldName) return;
  
  // Check if name already exists
  if (savedCanvases.includes(newName)) {
    alert('A canvas with this name already exists');
    return;
  }
  
  // Get the canvas data
  const canvasData = localStorage.getItem(`canvas_${oldName}`);
  if (!canvasData) return;
  
  // Save under new name
  localStorage.setItem(`canvas_${newName}`, canvasData);
  localStorage.removeItem(`canvas_${oldName}`);
  
  // Update saved canvases list
  savedCanvases = savedCanvases.map(name => name === oldName ? newName : name);
  localStorage.setItem('savedCanvases', JSON.stringify(savedCanvases));
  
  // Update current canvas name if this was the active canvas
  if (currentCanvasName === oldName) {
    currentCanvasName = newName;
    localStorage.setItem('lastActiveCanvas', newName);
  }
}

function duplicateCanvas(name) {
  const canvasData = localStorage.getItem(`canvas_${name}`);
  if (!canvasData) return;
  
  // Generate new name
  let newName = `${name} (copy)`;
  let counter = 1;
  while (savedCanvases.includes(newName)) {
    newName = `${name} (copy ${counter})`;
    counter++;
  }
  
  // Save the duplicate
  localStorage.setItem(`canvas_${newName}`, canvasData);
  savedCanvases = [...savedCanvases, newName];
  localStorage.setItem('savedCanvases', JSON.stringify(savedCanvases));
  
  // Load the duplicate
  currentCanvasName = newName;
  loadCanvas(newName);
}

function deleteCanvas(name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
  
  localStorage.removeItem(`canvas_${name}`);
  savedCanvases = savedCanvases.filter(n => n !== name);
  localStorage.setItem('savedCanvases', JSON.stringify(savedCanvases));
  
  // If deleted canvas was current, load a different one or create new
  if (currentCanvasName === name) {
    if (savedCanvases.length > 0) {
      currentCanvasName = savedCanvases[0];
      loadCanvas(savedCanvases[0]);
    } else {
      createNewCanvas();
    }
  }
}

// Auto-save functionality
$: {
  if ($nodes || $edges) {
    saveCurrentCanvas();
  }
}
</script>
<!-- LocalCanvasPanel.svelte -->
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

    <div class="canvas-list">
      <button class="add-button" on:click={createNewCanvas}>
        <Plus size={18} />
        New Canvas
      </button>

      {#if savedCanvases.length === 0}
        <div class="empty-state">No saved canvases</div>
      {:else}
        {#each savedCanvases as name}
          <div class="canvas-item" class:selected={name === currentCanvasName}>
            <span class="canvas-name" on:click={() => loadCanvas(name)}>
              {name}
            </span>
            <div class="canvas-actions">
              <button 
                class="action-btn" 
                title="Edit name"
                on:click={() => renameCanvas(name)}
              >
                <Edit2 size={14} />
              </button>
              <button 
                class="action-btn" 
                title="Duplicate"
                on:click={() => duplicateCanvas(name)}
              >
                <Copy size={14} />
              </button>

              <button 
                class="delete-btn" 
                title="Delete"
                on:click={() => deleteCanvas(name)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
    <div class="save-status">
      <Save size={14} />
      Last saved: {lastSavedTime || 'Never'}
    </div>
    <div class="import-export-buttons">
      <button class="import-button" on:click={importCanvas}>
        <Upload size={18} />
        Import
      </button>
      <button class="export-button" on:click={exportCanvas}>
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
    height: 100dvh;
    max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
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
    right: -6px;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: pointer;
    background: transparent;
    transition: all 0.2s ease;
  }

  .panel-edge:hover {
    background: rgba(0, 0, 0, 0.25);
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

  .panel-edge:hover .toggle-indicator {
    color: #fff;
  }

  .main-title {
    padding: 15px;
    font-size: 24px;
    font-weight: bold;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
  }

  .canvas-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    display: flex;
    flex-direction: column;
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
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

  .add-button:hover {
    background: #c8d8e0;
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
    transition: opacity 0.2s;
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
    border-radius: 3px;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(76, 175, 80, 0.1);
    color: #4CAF50;
  }

  .delete-btn:hover {
    background: rgba(255, 65, 54, 0.1);
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
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
    display: flex;
    gap: 8px;
    border-top: 1px solid #eee;
    background: #f8faff;
    position: sticky;
    bottom: 0;
    z-index: 1;
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
    z-index: 9999;
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
    z-index: 10000;
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
  .save-status {
    text-align: center;
    padding: 6px 8px;
    color: #666;
    font-size: 12px;
    border-top: 1px solid #eee;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
</style>