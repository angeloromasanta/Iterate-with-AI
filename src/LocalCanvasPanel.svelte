<!-- LocalCanvasPanel.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { defaultCanvases} from './defaultCanvases';
  import type { Node, Edge } from '@xyflow/svelte';
  import { Plus, Save, Trash2, ChevronLeft, ChevronRight, Edit2 } from 'lucide-svelte';

  export let nodes;
  export let edges;

  const dispatch = createEventDispatcher();
  
  let savedCanvases = [];
  let isPaneVisible = true;
  
  function initializeDefaultCanvases() {
    const hasInitialized = localStorage.getItem('hasInitializedDefaults');
    
    if (!hasInitialized) {
      // Save each default canvas
      Object.entries(defaultCanvases).forEach(([name, canvas]) => {
        localStorage.setItem(`canvas_${name}`, JSON.stringify(canvas));
      });

      // Save the canvas list
      const defaultCanvasNames = Object.keys(defaultCanvases);
      localStorage.setItem('canvasList', JSON.stringify(defaultCanvasNames));
      
      // Mark as initialized
      localStorage.setItem('hasInitializedDefaults', 'true');
      
      // Load the first canvas immediately
      loadCanvas('Tutorial Canvas');
      
      // Update the saved canvases list
      savedCanvases = defaultCanvasNames;
    }
  }

  // Modify the loadSavedCanvasList function
  function loadSavedCanvasList() {
    const canvasList = localStorage.getItem('canvasList');
    if (!canvasList) {
      initializeDefaultCanvases();
    } else {
      savedCanvases = JSON.parse(canvasList);
    }
  }

  // Call this when the component mounts
  onMount(() => {
    loadSavedCanvasList();
  });

  loadSavedCanvasList();

  function togglePane() {
    isPaneVisible = !isPaneVisible;
  }

  function validateNodeStructure(node) {
    console.log('Validating node:', node);
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
    console.log('Validating edge:', edge);
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

  function saveCurrentCanvas() {
    // Try to find a text node with content
    const firstTextNode = $nodes.find(node => 
      node.type === 'text' && 
      node.data?.text?.trim()
    );
    
    // Create a default name using the text or a timestamp
    const defaultName = firstTextNode 
      ? firstTextNode.data.text.slice(0, 30) + (firstTextNode.data.text.length > 30 ? '...' : '')
      : `Canvas ${new Date().toLocaleString()}`;

    // Save with the generated name
    const canvasData = {
      nodes: $nodes.filter(validateNodeStructure),
      edges: $edges.filter(validateEdgeStructure)
    };

    try {
      localStorage.setItem(`canvas_${defaultName}`, JSON.stringify(canvasData));
      savedCanvases = [...savedCanvases, defaultName];
      localStorage.setItem('canvasList', JSON.stringify(savedCanvases));
    } catch (error) {
      console.error('Error saving canvas:', error);
      alert('Error saving canvas');
    }
  }

  function loadCanvas(name: string) {
    console.log('Loading canvas:', name);
    const canvasData = localStorage.getItem(`canvas_${name}`);
    console.log('Raw canvas data:', canvasData);

    if (!canvasData) {
      console.error('No canvas data found for name:', name);
      return;
    }

    try {
      const parsedData = JSON.parse(canvasData);
      console.log('Parsed canvas data:', parsedData);

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

      console.log('Valid nodes:', validNodes);
      console.log('Valid edges:', validEdges);

      if (validNodes.length === 0) {
        console.error('No valid nodes found in canvas data');
        alert('Error: No valid nodes found in canvas data');
        return;
      }

      dispatch('load', {
        nodes: validNodes,
        edges: validEdges
      });
    } catch (error) {
      console.error('Error parsing canvas data:', error);
      console.error('Canvas data that caused error:', canvasData);
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
    }
  }

  function deleteCanvas(name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    console.log('Deleting canvas:', name);
    localStorage.removeItem(`canvas_${name}`);
    savedCanvases = savedCanvases.filter(n => n !== name);
    localStorage.setItem('canvasList', JSON.stringify(savedCanvases));
  }

  function createNewCanvas() {
    dispatch('clear');
  }
</script>

<div class="panel" class:collapsed={!isPaneVisible}>
  <button class="toggle-button" on:click={togglePane}>
    {#if isPaneVisible}
      <ChevronLeft size={20} />
    {:else}
      <ChevronRight size={20} />
    {/if}
  </button>
  
  {#if isPaneVisible}
  <div class="main-title">Iterate with AI</div>
  
  <button class="save-button" on:click={saveCurrentCanvas}>
    <Save size={18} />
    Save current canvas
  </button>

  <div class="canvas-list">
    {#if savedCanvases.length === 0}
      <div class="empty-state">No saved canvases</div>
    {:else}
      {#each savedCanvases as name}
        <div class="canvas-item">
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

.toggle-button {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  border: 1px solid #ccc;
  border-radius: 0 4px 4px 0;
  padding: 6px;
  cursor: pointer;
  z-index: 4;
}

.main-title {
  padding: 15px;
  font-size: 24px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
}

.save-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 8px;
  padding: 8px;
  background: #e6f3ff;
  border: 1px solid #add6ff;
  border-radius: 4px;
  color: #0066cc;
  cursor: pointer;
  font-size: 12px;
  width: calc(100% - 16px);
  transition: background-color 0.2s;
}

.save-button:hover {
  background: #d1e8ff;
}

.add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 8px;
  padding: 8px;
  background: #e6ffe6;
  border: 1px solid #b3ffb3;
  border-radius: 4px;
  color: #008000;
  cursor: pointer;
  font-size: 12px;
  width: calc(100% - 16px);
  transition: background-color 0.2s;
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


</style>
