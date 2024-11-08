<!-- LocalCanvasPanel.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { defaultCanvases } from './defaultCanvases';
  import type { Node, Edge } from '@xyflow/svelte';
  import { Plus, Save, Trash2, ChevronLeft, ChevronRight, Edit2, Download, Upload, Info, Copy } from 'lucide-svelte';
  import { selectedModel, isNodeResizing, secondaryModels, isProcessing, shouldStop, startProcessing, stopProcessing, resetProcessing, activeProcesses } from './stores';

  export let nodes;
  export let edges;

  const dispatch = createEventDispatcher();
  let autoSaveTimeout: NodeJS.Timeout;
const canvasState = derived([nodes, edges], ([$nodes, $edges]) => ({ nodes: $nodes, edges: $edges }));

// Subscribe to changes
$: {
    if (currentCanvasName && $canvasState) {
        // Clear any existing timeout
        if (autoSaveTimeout) {
            clearTimeout(autoSaveTimeout);
        }
        
        // Set a new timeout to save after 1 second of no changes
        autoSaveTimeout = setTimeout(() => {
            saveCanvas(currentCanvasName);
        }, 1000);
    }
}



let showSaveIndicator = false;
let saveIndicatorTimeout: NodeJS.Timeout;
let lastSavedTime: string = '';

  let savedCanvases = [];
  let isPaneVisible = true;
  let currentCanvasName = '';
  let showToggle = false;
  let showInfoModal = false;
  let db: IDBDatabase;
  
  const DB_NAME = 'CanvasStorage';
  const DB_VERSION = 1;
  const CANVAS_STORE = 'canvases';
  const METADATA_STORE = 'metadata';

  async function initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CANVAS_STORE)) {
          db.createObjectStore(CANVAS_STORE);
        }
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE);
        }
      };
    });
  }

  onMount(async () => {
    await initDB();
    await loadSavedCanvasList();
    window.addEventListener('beforeunload', handleBeforeUnload);
  });

  onDestroy(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  async function handleBeforeUnload(e: BeforeUnloadEvent) {
    if (currentCanvasName && ($nodes.length > 0 || $edges.length > 0)) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        try {
            await saveCanvas(currentCanvasName);
        } catch (error) {
            console.error('[BeforeUnload] Error saving canvas:', error);
        }
    }
}

  async function initializeDefaultCanvases() {
    try {
      const hasInitialized = await getFromStore(METADATA_STORE, 'hasInitializedDefaults');
      
      if (!hasInitialized) {
        for (const [name, canvas] of Object.entries(defaultCanvases)) {
          await saveToStore(CANVAS_STORE, name, canvas);
        }

        const defaultCanvasNames = Object.keys(defaultCanvases);
        await saveToStore(METADATA_STORE, 'canvasList', defaultCanvasNames);
        await saveToStore(METADATA_STORE, 'hasInitializedDefaults', true);
        
        await loadCanvas('Tutorial Canvas');
        savedCanvases = defaultCanvasNames;
      }
    } catch (error) {
      console.error('Error initializing default canvases:', error);
    }
  }




  async function loadSavedCanvasList() {
    try {
      const canvasList = await getFromStore(METADATA_STORE, 'canvasList');
      if (!canvasList) {
        await initializeDefaultCanvases();
      } else {
        savedCanvases = canvasList;
      }
    } catch (error) {
      console.error('Error loading canvas list:', error);
    }
  }

  
  async function saveToStore(storeName: string, key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function getFromStore(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function deleteFromStore(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

 

type SerializedNode = {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: {
        label: string;
        text?: string;
        width?: number;
        height?: number;
        // Add other data properties as needed
    };
};

function simplifyCanvasData(nodes, edges) {
    const simplifyNode = (node) => ({
        id: node.id,
        type: node.type,
        data: { 
            label: node.data.label,
            text: node.data.text,
            results: node.type === 'result' ? node.data.results : undefined
        },
        position: {
            x: Math.round(node.position.x / 10) * 10,
            y: Math.round(node.position.y / 10) * 10
        }
    });

    const simplifyEdge = (edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: { 
            loopCount: edge.data?.loopCount 
        }
    });

    return {
        nodes: nodes.map(simplifyNode),
        edges: edges.map(simplifyEdge),
        timestamp: Date.now()
    };
}

// Update the saveCanvas function
async function saveCanvas(name: string) {
    if (!name) {
        console.log('[Canvas Save] No canvas name provided');
        return;
    }
    
    try {
        const canvasData = simplifyCanvasData($nodes, $edges);
        await saveToStore(CANVAS_STORE, name, canvasData);
        lastSavedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log('[Canvas Save] Successfully saved canvas:', name);
    } catch (error) {
        console.error('[Canvas Save] Error saving canvas:', error);
    }
}

// Update the loadCanvas function
async function loadCanvas(name: string) {
    console.log('[Canvas Load] Starting load for canvas:', name);
    
    try {
        if (currentCanvasName) {
            await saveCanvas(currentCanvasName);
        }

        const canvasData = await getFromStore(CANVAS_STORE, name);
        if (!canvasData) {
            console.error('[Canvas Load] No canvas data found:', name);
            return;
        }

        // Update timestamp display
        if (canvasData.timestamp) {
            lastSavedTime = new Date(canvasData.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }

        currentCanvasName = name;
        
        // Clean the data before dispatching
        const cleanedData = {
            nodes: canvasData.nodes.map(node => ({
                ...node,
                measured: undefined,
                dragging: false,
                selected: false,
                class: ''
            })),
            edges: canvasData.edges
        };

        dispatch('canvasload', cleanedData);
        console.log('[Canvas Load] Canvas load completed');
    } catch (error) {
        console.error('[Canvas Load] Error loading canvas:', error);
        alert('Error loading canvas');
    }
}




  async function createNewCanvas() {
    try {
        // Save current canvas if exists
        if (currentCanvasName) {
            await saveCanvas(currentCanvasName);
        }
        
        // Generate new unique name
        let counter = 1;
        let newName = `New Canvas ${counter}`;
        while (savedCanvases.includes(newName)) {
            counter++;
            newName = `New Canvas ${counter}`;
        }
        
        // Create empty canvas data
        const canvasData = {
            nodes: [],
            edges: [],
            timestamp: Date.now()
        };
        
        // Update stores
        await saveToStore(CANVAS_STORE, newName, canvasData);
        savedCanvases = [...savedCanvases, newName];
        await saveToStore(METADATA_STORE, 'canvasList', savedCanvases);
        
        // Set current canvas name
        currentCanvasName = newName;
        
        // Clear the canvas completely
        dispatch('clear');
        
        // Force a clean canvas load
        dispatch('canvasload', {
            nodes: [],
            edges: []
        });
        
        // Update last saved time
        lastSavedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
    } catch (error) {
        console.error('Error creating new canvas:', error);
        alert('Error creating new canvas');
    }
}

  async function duplicateCanvas(name: string) {
    try {
      const canvasData = await getFromStore(CANVAS_STORE, name);
      
      let counter = 1;
      let newName = `${name} (Copy)`;
      while (savedCanvases.includes(newName)) {
        counter++;
        newName = `${name} (Copy ${counter})`;
      }
      
      await saveToStore(CANVAS_STORE, newName, {
        ...canvasData,
        timestamp: Date.now()
      });
      
      savedCanvases = [...savedCanvases, newName];
      await saveToStore(METADATA_STORE, 'canvasList', savedCanvases);
      
      await loadCanvas(newName);
    } catch (error) {
      console.error('Error duplicating canvas:', error);
      alert('Error duplicating canvas');
    }
  }

  async function renameCanvas(oldName: string) {
    const newName = prompt('Enter new name:', oldName);
    if (newName && newName !== oldName) {
      try {
        const canvasData = await getFromStore(CANVAS_STORE, oldName);
        await saveToStore(CANVAS_STORE, newName, canvasData);
        await deleteFromStore(CANVAS_STORE, oldName);
        
        savedCanvases = savedCanvases.map(n => n === oldName ? newName : n);
        await saveToStore(METADATA_STORE, 'canvasList', savedCanvases);
        
        if (currentCanvasName === oldName) {
          currentCanvasName = newName;
        }
      } catch (error) {
        console.error('Error renaming canvas:', error);
        alert('Error renaming canvas');
      }
    }
  }

  async function deleteCanvas(name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteFromStore(CANVAS_STORE, name);
      savedCanvases = savedCanvases.filter(n => n !== name);
      await saveToStore(METADATA_STORE, 'canvasList', savedCanvases);
      
      if (currentCanvasName === name) {
        currentCanvasName = '';
        dispatch('load', { nodes: [], edges: [] });
      }
    } catch (error) {
      console.error('Error deleting canvas:', error);
      alert('Error deleting canvas');
    }
  }

  async function exportCanvases() {
    try {
      const exportData = {
        canvasList: savedCanvases,
        canvases: {}
      };
      
      for (const name of savedCanvases) {
        const canvasData = await getFromStore(CANVAS_STORE, name);
        if (canvasData) {
          exportData.canvases[name] = canvasData;
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canvases-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting canvases:', error);
      alert('Error exporting canvases');
    }
  }

  async function importCanvases() {
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

        for (const name of importData.canvasList) {
          const canvasData = importData.canvases[name];
          if (canvasData) {
            await saveToStore(CANVAS_STORE, name, canvasData);
          }
        }

        const newCanvasList = [...new Set([...savedCanvases, ...importData.canvasList])];
        savedCanvases = newCanvasList;
        await saveToStore(METADATA_STORE, 'canvasList', newCanvasList);

        alert('Canvases imported successfully!');
      } catch (error) {
        console.error('Import error:', error);
        alert('Error importing canvases. Please check the file format.');
      }
    };

    input.click();
  }

  function togglePane() {
    isPaneVisible = !isPaneVisible;
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