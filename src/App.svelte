<!-- App.svelte -->
<script lang="ts">

  import { writable, derived, get } from 'svelte/store';
  import {
    SvelteFlow,
    useSvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
    MarkerType,
    type Node,
    type NodeTypes,
    type Edge,
    type EdgeTypes,
    SvelteFlowProvider,
    type OnConnectEnd,
    type OnConnectStart
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { getLLMResponse } from './api';
  import TextNode from './TextNode.svelte';
  import ResultNode from './ResultNode.svelte';
  import CustomEdge from './CustomEdge.svelte';
  import LocalCanvasPanel from './LocalCanvasPanel.svelte';
  import { loadTemplate } from './templateUtils';
  import ModelSelector from './ModelSelector.svelte';
  import { selectedModel, isNodeResizing, secondaryModels, isProcessing, shouldStop, startProcessing, stopProcessing, resetProcessing, activeProcesses } from './stores';
  import { Zap, Square, Info } from 'lucide-svelte';
  
  import { onMount } from 'svelte';

  function saveStateToLocalStorage() {
    const state = {
      nodes: get(nodes),
      edges: get(edges)
    };
    localStorage.setItem('canvasState', JSON.stringify(state));
  }

  function loadStateFromLocalStorage() {
    const savedState = localStorage.getItem('canvasState');
    if (savedState) {
      const state = JSON.parse(savedState);
      nodes.set(state.nodes);

      const loadedEdges = state.edges.map(edge => createEdge({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated,
        style: edge.style,
        data: {
          ...edge.data,
          onPlay: () => runConnectedNodes(edge.id),
          onDelete: (id: string) => deleteEdge(id),
          updateEdgeData: (id: string, newData: any) => updateEdgeData(id, newData),
        }
      }));

      edges.set(loadedEdges);
      updateCyclicEdges();

      // Force a re-render of the SvelteFlow component
      nodes.update(n => [...n]);
      edges.update(e => [...e]);
    }
  }

  let lastResizeEndTime = 0;

// Add this in your onMount:
onMount(() => {
    window.addEventListener('nodeResizeEnd', (event: CustomEvent) => {
        lastResizeEndTime = event.detail.timestamp;
    });
      window.addEventListener('edgeAdded', (event) => {
    });
    loadStateFromLocalStorage();

    // Set up an interval to save the state every 5 seconds
    const saveInterval = setInterval(saveStateToLocalStorage, 5000);

    return () => {
      clearInterval(saveInterval);
      saveStateToLocalStorage(); // Save one last time when unmounting
    };
  });


  
  const defaultEdgeOptions = {
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#000000'
    },
    style: 'stroke-width: 2px; stroke: #000000; fill: none;', 
    type: 'custom',
  };

  const nodeTypes: NodeTypes = {
    text: TextNode,
    result: ResultNode
  };

  // Function to get node data including all nodes
  function getNodeData(node) {
  
  const allNodesData = $nodes.map(n => {
    const nodeData = {
      id: n.id,
      label: n.data.label,
      text: n.data.text,  
      type: n.type,
      results: n.data.results || []
    };
    return nodeData;
  });

  const returnData = {
    label: node.data.label,
    text: node.data.text,
    results: node.data.results || [],
    allNodes: allNodesData
  };
  
  return returnData;
}



  
  const edgeTypes: EdgeTypes = {
    custom: CustomEdge as any 
  };




  function createEdge(params: any): Edge {
    const edgeId = params.id || `e${params.source}-${params.target}`;
    const newEdge: Edge = {
      ...params,
      id: edgeId,
      type: 'custom',
      markerEnd: defaultEdgeOptions.markerEnd,
      style: defaultEdgeOptions.style,
      animated: params.animated || false,
      selected: params.selected || false,
      data: { 
        ...params.data,
        onPlay: params.data?.onPlay || (() => runConnectedNodes(edgeId)),
        onDelete: params.data?.onDelete || ((id: string) => deleteEdge(id)),
        updateEdgeData: params.data?.updateEdgeData || ((id: string, newData: any) => updateEdgeData(id, newData)),
        showLoopCount: params.data?.showLoopCount || false,
        loopCount: params.data?.loopCount || 2
      }
    };
    return newEdge;
  }





  function deleteEdge(id: string) {
    edges.update(e => e.filter(edge => edge.id !== id));
    updateCyclicEdges();
  }

  function updateEdgeData(id: string, newData: any) {
    edges.update(eds => 
      eds.map(edge => 
        edge.id === id 
          ? { ...edge, data: { ...edge.data, ...newData } }
          : edge
      )
    );
  }




let nodes = writable<Node[]>([
  {
    "id": "1",
    "type": "text",
    "data": {
      "label": "Text Node 1",
      "text": "Name the capital of Spain"
    },
    "position": {
      "x": -140,
      "y": -10
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": false,
    "class": ""
  },
  {
    "id": "2",
    "type": "result",
    "data": {
      "label": "Result Node 1",
      "text": "Madrid"
    },
    "position": {
      "x": 120,
      "y": -10
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": false,
    "class": ""
  },
  {
    "id": "3",
    "type": "text",
    "data": {
      "label": "Text Node 2",
      "text": "Paris"
    },
    "position": {
      "x": -140,
      "y": 160
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": false,
    "class": ""
  },
  {
    "id": "4",
    "type": "text",
    "data": {
      "label": "Text Node 3",
      "text": "Write a poem about {Result Node 1} and {Text Node 2}"
    },
    "position": {
      "x": 350,
      "y": 80
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": false,
    "class": ""
  },
  {
    "id": "5",
    "type": "result",
    "data": {
      "label": "Result Node 2",
      "text": "Poem about Paris and Madrid"
    },
    "position": {
      "x": 660,
      "y": 70
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": false,
    "class": ""
  },
  {
    "id": "6",
    "type": "text",
    "data": {
      "label": "Text Node 4",
      "text": "Suggest ways to improve {Result Node 2}"
    },
    "position": {
      "x": 920,
      "y": 60
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": false,
    "class": ""
  },
  {
    "id": "7",
    "type": "result",
    "data": {
      "label": "Result Node 3",
      "text": "Suggestions"
    },
    "position": {
      "x": 1170,
      "y": 60
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": false,
    "class": ""
  },
  {
    "id": "8",
    "type": "text",
    "data": {
      "label": "Text Node 5",
      "text": "Improve {Result Node 2} based on these suggestions {Result Node 3}"
    },
    "position": {
      "x": 1430,
      "y": 30
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": true,
    "class": ""
  },
  {
    "id": "9",
    "type": "text",
    "data": {
      "label": "Text Node 6",
      "text": "Format the poem in {Result Node 2}"
    },
    "position": {
      "x": 940,
      "y": 260
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": false,
    "class": ""
  },
  {
    "id": "10",
    "type": "result",
    "data": {
      "label": "Result Node 4",
      "text": "Final Poem"
    },
    "position": {
      "x": 1200,
      "y": 260
    },
    "measured": {
      "width": 200,
      "height": 130
    },
    "selected": false,
    "class": ""
  }
]);

let edges = writable<Edge[]>([
  createEdge({ id: 'e1-2', source: '1', target: '2' }),
  createEdge({ id: 'e2-4', source: '2', target: '4' }),
  createEdge({ id: 'e3-4', source: '3', target: '4' }),
  createEdge({ id: 'e4-5', source: '4', target: '5' }),
  createEdge({ id: 'e5-6', source: '5', target: '6' }),
  createEdge({ id: 'e6-7', source: '6', target: '7' }),
  createEdge({ id: 'e7-8', source: '7', target: '8' }),
  createEdge({ id: 'e8-5', source: '8', target: '5', type: 'iteration' }),
  createEdge({ id: 'e5-9', source: '5', target: '9' }),
  createEdge({ id: 'e9-10', source: '9', target: '10' }),
]);

  $: {
    if ($edges) {
      updateCyclicEdges();
    }
  }

  const nodesWithAllNodesData = derived(nodes, $nodes => {
    const allNodesData = $nodes.map(node => ({ id: node.id, label: node.data.label, text: node.data.text  }));
    return $nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        allNodes: allNodesData
      }
    }));
  });

  // Use this reactive statement to update the nodes store
  $: {
    const updatedNodes = $nodesWithAllNodesData;
    nodes.set(updatedNodes);
  }
  
  async function runConnectedNodes(edgeId) {
    const edge = $edges.find(e => e.id === edgeId);
    if (!edge) return;

    const sourceNode = $nodes.find(n => n.id === edge.source);
    const targetNode = $nodes.find(n => n.id === edge.target);

    if (sourceNode && targetNode && sourceNode.type === 'text' && targetNode.type === 'result') {
        startProcessing();
        activeProcesses.update(n => n + 1);

        // Process the source node
        let processedText = sourceNode.data.text;
        const referencedNodes = [];

        // Replace references with actual values and collect referenced nodes
        const regex = /{([^}]+)}/g;
        processedText = processedText.replace(regex, (match, label) => {
            const referencedNode = $nodes.find(n => n.data.label === label);
            if (referencedNode) {
                referencedNodes.push(referencedNode);
                if (referencedNode.type === 'result' && referencedNode.data.results) {
                    const content = Array.isArray(referencedNode.data.results) && referencedNode.data.results.length > 0
                        ? referencedNode.data.results[referencedNode.data.results.length - 1]
                        : match;
                    return `<${label}>${content}</${label}>`;
                } else if (referencedNode.type === 'text') {
                    const content = referencedNode.data.text || match;
                    return `<${label}>${content}</${label}>`;
                }
            }
            return match;
        });

        // Update node classes
        nodes.update(n => n.map(node => ({
            ...node,
            class: node.id === sourceNode.id || node.id === targetNode.id || referencedNodes.some(rn => rn.id === node.id)
                ? `${node.class || ''} processing`.trim()
                : node.class
        })));

        // Animate the edge
        edges.update(e => e.map(edge => ({
            ...edge,
            animated: edge.id === edgeId,
            class: edge.id === edgeId ? 'processing-edge' : edge.class
        })));

        // Delay to allow for visual update
        await new Promise(resolve => setTimeout(resolve, 100));

        let fullResponse = '';
        try {
            const response = await getLLMResponse(
                processedText,
                (chunk) => {
                    // Check stop condition before processing each chunk
                    if (get(shouldStop)) {
                        throw new Error('Processing stopped by user');
                    }
                    
                    fullResponse += chunk;
                    nodes.update(n => n.map(node => {
                        if (node.id === targetNode.id) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    streamingResult: fullResponse,
                                    results: [...(node.data.results || [])]
                                }
                            };
                        }
                        return node;
                    }));
                },
                () => get(shouldStop)
            );

            // Only update with final result if we haven't stopped
            if (!get(shouldStop)) {
                nodes.update(n => n.map(node => {
                    if (node.id === targetNode.id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                streamingResult: null,
                                results: [...(node.data.results || []), response]
                            }
                        };
                    }
                    return node;
                }));
            }
        } catch (error) {
            if (error.message === 'Processing stopped by user') {
                // If stopped by user, keep the partial result
                nodes.update(n => n.map(node => {
                    if (node.id === targetNode.id) {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                streamingResult: null,
                                results: [...(node.data.results || []), fullResponse]
                            }
                        };
                    }
                    return node;
                }));
            } else {
                throw error; // Re-throw if it's not our stop error
            }
        } finally {
            // Reset processing classes and animations
            nodes.update(n => n.map(node => ({
                ...node,
                class: (node.class || '').replace('processing', '').trim()
            })));

            edges.update(e => e.map(edge => ({
                ...edge,
                animated: false,
                class: (edge.class || '').replace('processing-edge', '').trim()
            })));

            // Decrement active processes and only reset if we're the last one
            activeProcesses.update(n => {
                const newCount = Math.max(0, n - 1);
                if (newCount === 0) {
                    resetProcessing();
                }
                return newCount;
            });
        }
    }
}





let isCreatingNodeViaDrag = false;
let lastClickTime = 0;
const clickThreshold = 200;

 // Create a derived store for the highest node ID
const highestNodeId = derived(nodes, $nodes => {
  return $nodes.reduce((max, node) => {
    const nodeId = parseInt(node.id);
    return isNaN(nodeId) ? max : Math.max(max, nodeId);
  }, 0);
});

// Create a writable store for the next available ID
const nextId = writable(1);

// Subscribe to changes in highestNodeId and update nextId accordingly
highestNodeId.subscribe(value => {
  nextId.set(value + 1);
});

// Function to get the next ID
const getId = () => {
  let id;
  nextId.update(n => {
    id = n;
    return n + 1;
  });
  return `${id}`;
};

// Function to get the next new node label
const getNewNodeLabel = () => {
  // Find all existing "New Node X" labels and get their numbers
  const existingNumbers = $nodes
    .map(node => {
      // Updated regex to match labels with model names in parentheses
      const match = node.data.label.match(/^New Node (\d+)(?:\s*\([^)]+\))?$/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(num => !isNaN(num));

  // Get the highest number used
  const highestNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;

  // Return the next number in sequence
  return `New Node ${highestNumber + 1}`;
};

  const { screenToFlowPosition, fitView  } = useSvelteFlow();

  const handleConnectStart: OnConnectStart = (event) => {
    isCreatingNodeViaDrag = true;
  };

  let lastConnectEndTime = 0;
const connectEndThreshold = 300; 

const handleConnectEnd: OnConnectEnd = async (event, connectionState) => {
    // Get the current resize state
    const currentIsResizing = get(isNodeResizing);
    
    // If we're currently resizing, don't create a new node
    if (currentIsResizing) {
        isCreatingNodeViaDrag = false;
        return;
    }

    if (connectionState.isValid) {
        isCreatingNodeViaDrag = false;
        return;
    }

    const sourceNodeId = connectionState.fromNode?.id ?? '1';
    const sourceNode = $nodes.find(node => node.id === sourceNodeId);
    const id = getId();
    const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
  
    // Function to recursively get all ancestor nodes
    const getAncestorNodes = (nodeId: string, visited = new Set<string>()): Node[] => {
        if (visited.has(nodeId)) return [];
        visited.add(nodeId);
        
        const incomingEdges = $edges.filter(edge => edge.target === nodeId);
        const ancestors = incomingEdges.flatMap(edge => {
            const sourceNode = $nodes.find(n => n.id === edge.source);
            if (!sourceNode) return [];
            return [sourceNode, ...getAncestorNodes(sourceNode.id, visited)];
        });
        
        return ancestors;
    };

    if (sourceNode?.type === 'result') {
        // Get all ancestor nodes including immediate parents
        const ancestors = getAncestorNodes(sourceNode.id);
        
        // Create references in order of appearance in the flow
        const referenceText = [
            ...ancestors.map(node => `{${node.data.label}}`),
            `{${sourceNode.data.label}}`
        ].join(' ');

        const newNode = {
            id,
            type: 'text',
            data: { 
                label: getNewNodeLabel(), 
                text: referenceText 
            },
            position: screenToFlowPosition({
                x: clientX,
                y: clientY
            }),
            origin: [0.5, 0.0]
        };

        // Create the edge first
        const newEdge = createEdge({
            id: `e${sourceNodeId}-${id}`,
            source: sourceNodeId,
            target: id
        });

        // Update both nodes and edges
        nodes.update(n => [...n, newNode]);
        edges.update(e => [...e, newEdge]);
    } else {
        const originalModel = get(selectedModel);  // Store original model
        const modelsToProcess = [$selectedModel, ...$secondaryModels];
        const basePosition = screenToFlowPosition({
            x: clientX,
            y: clientY
        });
        
        const promises = [];  // Collect all promises

        for (let i = 0; i < modelsToProcess.length; i++) {
            const model = modelsToProcess[i];
            const id = getId();
            
            const newNode = {
                id,
                type: 'result',
                data: { 
                    label: `${getNewNodeLabel()} (${model.split('/').pop()})`,
                    text: ''
                },
                position: {
                    x: basePosition.x + (i * 250),
                    y: basePosition.y
                },
                origin: [0.5, 0.0]
            };

            const newEdge = createEdge({
                id: `e${sourceNodeId}-${id}`,
                source: sourceNodeId,
                target: id
            });

            await new Promise(resolve => setTimeout(resolve, 50));
            nodes.update(n => [...n, newNode]);
            edges.update(e => [...e, newEdge]);

            if (sourceNode && sourceNode.type === 'text' && sourceNode.data.text && sourceNode.data.text !== '') {
                const currentModel = get(selectedModel);
                selectedModel.set(model);
                promises.push(
                    runConnectedNodes(newEdge.id).finally(() => {
                        if (i === modelsToProcess.length - 1) {
                            selectedModel.set(originalModel);  // Restore original model after all complete
                        }
                    })
                );
            }
        }

        // If no promises were created, restore model immediately
        if (promises.length === 0) {
            selectedModel.set(originalModel);
        }
    }

    isCreatingNodeViaDrag = false;
    lastClickTime = Date.now();
    lastConnectEndTime = Date.now();
};


function onPaneClick(event) {
    const currentIsResizing = get(isNodeResizing);
    const currentTime = Date.now();
    const timeSinceResize = currentTime - lastResizeEndTime;
    const timeSinceConnectEnd = currentTime - lastConnectEndTime;
    
    console.log('Pane Click Debug:', {
        isResizing: currentIsResizing,
        isCreatingNodeViaDrag,
        timeSinceLastClick: currentTime - lastClickTime,
        timeSinceResize,
        timeSinceConnectEnd,
        event: event.detail
    });

    // Block node creation if:
    // 1. Too soon after resize
    // 2. Too soon after connect end
    // 3. Currently resizing
    // 4. Creating node via drag
    // 5. Click too soon after last click
    if (
        timeSinceResize < 300 ||
        timeSinceConnectEnd < connectEndThreshold ||
        currentIsResizing ||
        isCreatingNodeViaDrag ||
        (currentTime - lastClickTime < clickThreshold)
    ) {
        console.log('Prevented node creation:', {
            reason: timeSinceResize < 300 ? 'Too soon after resize' :
                   timeSinceConnectEnd < connectEndThreshold ? 'Too soon after connect end' :
                   currentIsResizing ? 'Currently resizing' : 
                   isCreatingNodeViaDrag ? 'Drag in progress' : 
                   'Click too soon'
        });
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    const { clientX, clientY } = event.detail.event;
    const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
    const newNode = {
        id: getId(),
        type: 'text',
        position: flowPosition,
        data: { label: getNewNodeLabel(), text: '' }
    };

    console.log('Creating new node:', newNode);
    nodes.update(n => [...n, newNode]);
    lastClickTime = currentTime;
}


  function deleteNode(id: string) {
    nodes.update(n => n.filter(node => node.id !== id));
    edges.update(e => e.filter(edge => edge.source !== id && edge.target !== id));
  }

  
  

  function findAllCycleNodes(graph) {
    const visited = new Set();
    const cycles = new Set();

    function dfs(node, path = []) {
      if (path.includes(node)) {
        const cycle = new Set(path.slice(path.indexOf(node)));
        cycles.add(cycle);
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      path.push(node);

      for (const neighbor of graph.get(node) || []) {
        dfs(neighbor, [...path]);
      }

      path.pop();
    }

    for (const startNode of graph.keys()) {
      if (!visited.has(startNode)) {
        dfs(startNode);
      }
    }

    return cycles;
  }

  function buildGraph(nodes, edges) {
    const graph = new Map();
    nodes.forEach(node => graph.set(node.id, []));
    edges.forEach(edge => {
      if (graph.has(edge.source)) {
        graph.get(edge.source).push(edge.target);
      }
    });
    return graph;
  }

  function findDependencies(graph, cycles) {
    const dependencies = {};
    for (const [node, neighbors] of graph.entries()) {
      for (const neighbor of neighbors) {
        if (!dependencies[neighbor]) {
          dependencies[neighbor] = new Set();
        }
        if (!Array.from(cycles).some(cycle => cycle.has(node) && cycle.has(neighbor))) {//Property 'has' does not exist on type 'unknown'.
          dependencies[neighbor].add(node);
        }
      }
    }
    return dependencies;
  }

  function getLoopCounts(edges, cycles) {
    const loopCounts = new Map();
    for (const cycle of cycles) {
      const cycleArray = Array.from(cycle);
      const lastNode = cycleArray[cycleArray.length - 1];
      const firstNode = cycleArray[0];
      const loopEdge = edges.find(e => e.source === lastNode && e.target === firstNode);
      if (loopEdge && loopEdge.data && typeof loopEdge.data.loopCount === 'number') {
        loopCounts.set(firstNode, loopEdge.data.loopCount);
      } else {
        loopCounts.set(firstNode, 2); // Default to 2 if not specified
      }
    }
    return loopCounts;
  }


  async function onBigButtonClick() {
    // If we're already processing, stop everything
    if (get(isProcessing)) {
        stopProcessing();
        return;
    }

    // Start fresh processing cycle
    startProcessing();
    activeProcesses.set(0); // Reset counter before starting

    try {
        const allNodes = $nodes;
        const allEdges = $edges;

        const graph = buildGraph(allNodes, allEdges);
        const cycles = findAllCycleNodes(graph);
        const dependencies = findDependencies(graph, cycles);
        const loopCounts = getLoopCounts(allEdges, cycles);

        const executionOrder = calculateExecutionOrder(allNodes, graph, dependencies, cycles, loopCounts);

        // Process nodes sequentially
        for (const nodeId of executionOrder) {
            // Check if stop was requested
            if (get(shouldStop)) {
                console.log('Stop requested, breaking execution');
                break;
            }

            const node = $nodes.find(n => n.id === nodeId);
            if (node?.type === 'text') {
                const connectedResultNodes = $edges
                    .filter(edge => edge.source === node.id)
                    .map(edge => $nodes.find(n => n.id === edge.target))
                    .filter(n => n && n.type === 'result');

                // Process result nodes sequentially
                for (const resultNode of connectedResultNodes) {
                    if (get(shouldStop)) {
                        console.log('Stop requested during result node processing');
                        break;
                    }

                    const edgeId = $edges.find(e => e.source === node.id && e.target === resultNode.id)?.id;
                    if (edgeId) {
                        activeProcesses.update(n => n + 1);
                        await runConnectedNodes(edgeId);
                    }
                }
            }

            // Check again after processing each node
            if (get(shouldStop)) {
                break;
            }
        }
    } finally {
        // Reset everything when done or stopped
        activeProcesses.set(0);
        resetProcessing();
    }
}

  function calculateExecutionOrder(nodes, graph, dependencies, cycles, loopCounts) {
    const executionOrder = [];
    const visited = new Map(nodes.map(node => [node.id, 0]));

    function canExecute(nodeId) {
      return Array.from(dependencies[nodeId] || []).every(depId => visited.get(depId) > 0);//Operator '>' cannot be applied to types 'unknown' and 'number'.
    }

    function isInCycle(nodeId) {
      return Array.from(cycles).some(cycle => cycle.has(nodeId));//Property 'has' does not exist on type 'unknown'.
    }

    function dfs(nodeId, depth = 0, loopEnd = null) {
      const indent = "  ".repeat(depth);

      let maxVisits;
      if (loopCounts.has(nodeId)) {
        maxVisits = loopCounts.get(nodeId);
        loopEnd = nodeId;
      } else if (isInCycle(nodeId)) {
        maxVisits = loopCounts.get(loopEnd) || 2;
      } else {
        maxVisits = 1;
      }


      if (visited.get(nodeId) >= maxVisits) {
        return;
      }

      if (!canExecute(nodeId)) {
        return;
      }

      visited.set(nodeId, visited.get(nodeId) + 1);//Operator '+' cannot be applied to types 'unknown' and '1'.
      executionOrder.push(nodeId);

      for (const neighbor of graph.get(nodeId) || []) {
        dfs(neighbor, depth + 1, loopEnd);
      }

      if (nodeId === loopEnd && visited.get(nodeId) < maxVisits) {
          const cycle = Array.from(cycles).find(c => c.has(nodeId)); //Property 'has' does not exist on type 'unknown'.
          for (const cycleNode of cycle) { //Type 'unknown' must have a '[Symbol.iterator]()' method that returns an iterator.
              visited.set(cycleNode, 0);  
          }
          dfs(cycle[0], depth, loopEnd);  
      }
      }

    // Start with nodes that have no dependencies
    const startNodes = nodes.filter(node => !(dependencies[node.id] && dependencies[node.id].size));
    for (const node of startNodes) {
      dfs(node.id);
    }

    // Check if there are any unvisited nodes and try to visit them
    let unvisited = Array.from(visited).filter(([_, count]) => count === 0).map(([nodeId]) => nodeId);
    while (unvisited.length > 0) {
      for (const nodeId of unvisited) {
        if (canExecute(nodeId)) {
          dfs(nodeId);
        }
      }
      unvisited = Array.from(visited).filter(([_, count]) => count === 0).map(([nodeId]) => nodeId);
    }

    return executionOrder;
  }


  async function processNode(nodeId) {
    const node = $nodes.find(n => n.id === nodeId);

    if (node.type === 'text') {
      const connectedResultNodes = $edges
        .filter(edge => edge.source === node.id)
        .map(edge => $nodes.find(n => n.id === edge.target))
        .filter(n => n && n.type === 'result');

      for (const resultNode of connectedResultNodes) {
        // Update node classes to show processing
        nodes.update(n => n.map(n => ({
          ...n,
          class: n.id === node.id || n.id === resultNode.id
            ? `${n.class || ''} processing`.trim()
            : n.class
        })));

        let processedText = node.data.text;
        const referencedNodes = [];

        // Replace references with actual values and collect referenced nodes
        const regex = /{([^}]+)}/g;
        processedText = processedText.replace(regex, (match, label) => { //Property 'replace' does not exist on type 'unknown'.
          const referencedNode = $nodes.find(n => n.data.label === label);
          if (referencedNode) {
            referencedNodes.push(referencedNode);
            if (referencedNode.type === 'result' && referencedNode.data.results) {
              return Array.isArray(referencedNode.data.results) && referencedNode.data.results.length > 0
                ? referencedNode.data.results[referencedNode.data.results.length - 1]
                : match;
            } else if (referencedNode.type === 'text') {
              return referencedNode.data.text || match;
            }
          }
          return match;
        });

        // Update referenced nodes to show processing
        nodes.update(n => n.map(n => ({
          ...n,
          class: referencedNodes.some(rn => rn.id === n.id)
            ? `${n.class || ''} processing referenced`.trim()
            : n.class
        })));

        // Animate the connected edge
        edges.update(e => e.map(edge => ({
          ...edge,
          animated: edge.source === node.id && edge.target === resultNode.id,
          class: edge.source === node.id && edge.target === resultNode.id
            ? 'processing-edge'
            : edge.class
        })));

        // Delay to allow for visual update
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get response from LLM
        const response = await getLLMResponse(processedText); //Expected 2 arguments, but got 1.

        // Update the result node with the response
        nodes.update(n => n.map(n => {
          if (n.id === resultNode.id) {
            return {
              ...n,
              data: {
                ...n.data,
                results: [...(n.data.results || []), response] //Type 'unknown' must have a '[Symbol.iterator]()' method that returns an iterator.
              }
            };
          }
          return n;
        }));

        // Reset processing classes and animations
        nodes.update(n => n.map(n => ({
          ...n,
          class: (n.class || '').replace('processing', '').replace('referenced', '').trim()
        })));

        edges.update(e => e.map(edge => ({
          ...edge,
          animated: false,
          class: (edge.class || '').replace('processing-edge', '').trim()
        })));

        // Delay to allow for visual update
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else if (node.type === 'result') {
      // If it's a result node, we don't need to process it,
      // but we might want to update its visual state
      nodes.update(n => n.map(n => ({
        ...n,
        class: n.id === node.id
          ? `${n.class || ''} visited`.trim()
          : n.class
      })));

      // Delay to allow for visual update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  }



  
  function detectCycleEndEdges(nodes, edges) {
  const graph = new Map();
  nodes.forEach(node => graph.set(node.id, []));
  edges.forEach(edge => {
    if (graph.has(edge.source)) {
      graph.get(edge.source).push({ target: edge.target, id: edge.id });
    }
  });

  const visited = new Set();
  const recursionStack = new Set();
  const cycleEdges = new Set();

  function dfs(nodeId, path = []) {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.findIndex(node => node.id === nodeId);
      if (cycleStart !== -1) {
        const cycle = path.slice(cycleStart);
        const lastEdge = cycle[cycle.length - 1].edgeId;
        if (lastEdge) cycleEdges.add(lastEdge);
      }
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const { target, id } of neighbors) {
      dfs(target, [...path, { id: nodeId, edgeId: id }]);
    }

    recursionStack.delete(nodeId);
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return cycleEdges;
}



  function updateCyclicEdges() {

    const cycleEdges = detectCycleEndEdges($nodes, $edges);

    edges.update(eds => {
      const updatedEdges = eds.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          showLoopCount: cycleEdges.has(edge.id),
          loopCount: cycleEdges.has(edge.id) ? (edge.data?.loopCount || 2) : undefined
        }
      }));
      return updatedEdges;
    });
  }


  
  function handleConnect(event) {
    const params = event.detail;
    const newEdge = createEdge({
      id: `e${params.source}-${params.target}`,
      source: params.source,
      target: params.target
    });
    edges.update(eds => [...eds, newEdge]);
  }

  function handleEdgeCreate(connection: Connection): Edge { //Cannot find name 'Connection'.
    const newEdge = createEdge({
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target
    });
    edges.update(eds => [...eds, newEdge]);
    return newEdge;
  }

  function handleImport(event) {
  console.log('Handling import with data:', event.detail);
  const importedData = event.detail;
  
  if (!importedData || !Array.isArray(importedData.nodes) || !Array.isArray(importedData.edges)) {
    console.error('Invalid import data structure:', importedData);
    return;
  }

  try {
    const allNodesData = importedData.nodes.map(n => ({ 
      id: n.id, 
      label: n.data.label, 
      text: n.data.text 
    }));

    const nodesWithAllNodes = importedData.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        allNodes: allNodesData
      }
    }));

    nodes.set(nodesWithAllNodes);

    // Recreate edges with proper callback functions
    const importedEdges = importedData.edges.map(edge => createEdge({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      animated: edge.animated,
      style: edge.style,
      data: {
        ...edge.data,
        onPlay: () => runConnectedNodes(edge.id),
        onDelete: (id: string) => deleteEdge(id),
        updateEdgeData: (id: string, newData: any) => updateEdgeData(id, newData),
      }
    }));

    edges.set(importedEdges);
    updateCyclicEdges();
  } catch (error) {
    console.error('Error processing import data:', error);
    alert('Error importing canvas data');
  }
}
  
  // Function to clear the graph
  function handleClear() {
    nodes.set([]);
    edges.set([]);
    updateCyclicEdges();
    saveStateToLocalStorage();

    // Reset the new node counter when clearing the graph
    nextNewNodeNumber.set(1);
  }
  

  async function handleLoadTemplate(event) {
    const templateFile = event.detail;
    try {
      const templateData = await loadTemplate(templateFile);
      nodes.set(templateData.nodes);

      // Recreate edges with proper callback functions
      const loadedEdges = templateData.edges.map(edge => createEdge({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: edge.animated,
        style: edge.style,
        data: {
          ...edge.data,
          onPlay: () => runConnectedNodes(edge.id),
          onDelete: (id: string) => deleteEdge(id),
          updateEdgeData: (id: string, newData: any) => updateEdgeData(id, newData),
        }
      }));

      edges.set(loadedEdges);
      updateCyclicEdges();

      // Reset the new node counter after loading a template
      nextNewNodeNumber.set(1);

      // Force a re-render of the SvelteFlow component
      nodes.update(n => [...n]);
      edges.update(e => [...e]);

      // Fit view after loading template
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 0);

    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template');
    }
  }

  function handleModelChange(event: CustomEvent<string>) {
    selectedModel.set(event.detail);
  }
  
</script>


<main>

  <div class="model-selector-container" class:hidden={$isProcessing}>
    <ModelSelector on:modelChange={handleModelChange} />
  </div>
  
<LocalCanvasPanel 
  nodes={nodes} 
  edges={edges} 
  on:load={handleImport}
  on:clear={handleClear}
  on:fitview={() => fitView({ padding: 0.2 })}
/>



  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    {edgeTypes}
    {getNodeData}
    {defaultEdgeOptions}
    fitView
    minZoom={0.1}
    on:paneclick={onPaneClick}
    onedgecreate={handleEdgeCreate}
    onconnectend={handleConnectEnd}
  >
    <Controls position="bottom-right" />
    <Background variant={BackgroundVariant.Dots} />

    <div class="custom-controls">
      <button 
        class="custom-button" 
        on:click={onBigButtonClick} 
        class:processing={$isProcessing}
      >
        {#if $isProcessing}
          <Square size={24} />
        {:else}
          <Zap size={24} />
        {/if}
      </button>
    </div>

  </SvelteFlow>
</main>
  



<style>
 :global(body) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
  }

  :global(*) {
    box-sizing: inherit;
  }

  
  main {
    height: 100vh;
    width: 100vw;
    position: relative;
    overflow: hidden; /* Add this line */
  }


  .custom-controls {
    position: absolute;
    right: 70px; /* Moved further right to make space for controls */
    bottom: 20px;
    z-index: 10;
  }
  .custom-button {
    background-color: #4a5568; /* Changed from #ffd500 to match play button */
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08);
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    cursor: pointer;
    outline: none;
    color: white; /* Changed from #333 to white for better contrast */
  }

  .custom-button:hover {
    background-color: #64748b; /* Changed to lighter grey on hover */
    transform: translateY(-2px);
    box-shadow: 0 7px 14px rgba(0,0,0,0.1), 0 3px 6px rgba(0,0,0,0.08);
  }

  .custom-button:active {
    transform: translateY(1px);
    box-shadow: 0 3px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.08);
  }

  .custom-button.processing {
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(0, 123, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
    }
  }
  :global(.processing) {
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5);
}

:global(.processing.referenced) {
  box-shadow: 0 0 0 2px rgba(198, 198, 231, 0.5);
}

:global(.processing-edge) {
  stroke: blue !important;
  stroke-width: 2 !important;
}

:global(.processing-edge path) {
  stroke: blue !important;
}
:global(.big-handle) {
    width: 12px !important;
    height: 12px !important;
    background-color: rgb(0, 0, 0) !important;
    border: 2px solid rgb(255, 255, 255) !important;
  }

  :global(.big-handle:hover) {
    background-color: #5e3bc0 !important;
    box-shadow: 0 0 0 2px #5e3bc0 !important;
  }


  .model-selector-container {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1; /* Lower z-index than the modal */
  }

  .title {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 24px;
    font-weight: bold;
    color: #333;
    z-index: 10;
  }

  .info-icon {
    position: absolute;
    top: 10px;
    left: 180px;
    cursor: pointer;
    z-index: 10;
  }

  .instructions {
    position: absolute;
    top: 50px;
    left: 10px;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 15px;
    max-width: 300px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 20;
  }

  .instructions h3 {
    margin-top: 0;
  }

  .instructions ol {
    padding-left: 20px;
  }

  .instructions p {
    margin-bottom: 0;
    font-style: italic;
  }

  .hidden {
  display: none;
}
</style>