<!-- App.svelte -->
<script lang="ts">

  import { writable, derived, get } from 'svelte/store';
  import {
    SvelteFlow,
    useSvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    MarkerType,
    type Node,
    type NodeTypes,
    type Edge,
    type EdgeTypes,
    type OnConnectEnd,
    type OnConnectStart
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { getLLMResponse } from './api';
  import TextNode from './TextNode.svelte';
  import ResultNode from './ResultNode.svelte';
  import CustomEdge from './CustomEdge.svelte';
  import LocalCanvasPanel from './LocalCanvasPanel.svelte';
  import ModelSelector from './ModelSelector.svelte';
  import { selectedModel, isNodeResizing, secondaryModels, isProcessing, shouldStop, startProcessing, stopProcessing, resetProcessing, activeProcesses } from './stores';
  import { Zap, Square } from 'lucide-svelte';
  
  import { onMount } from 'svelte';


  
let lastClickTime = Date.now();
let lastConnectEndTime = Date.now();
let lastResizeEndTime = Date.now();
let isCreatingNodeViaDrag = false;
let isNewCanvasLoading = false;
const newCanvasLoadingDelay = 2000; // 2 second delay
const clickThreshold = 1000; // Increase from 200 to 1000ms
const connectEndThreshold = 1000; // Increase from 300 to 1000ms
const resizeThreshold = 1000; // Increase from 300 to 1000ms

// Add a new canvas creation cooldown
let canvasCreationTime = Date.now();
const canvasCreationThreshold = 2000; // 2 seconds cooldown after canvas creation

// Add state initialization to onMount
onMount(() => {
    // Reset all timing variables on mount
    lastClickTime = Date.now();
    lastConnectEndTime = Date.now();
    lastResizeEndTime = Date.now();
    isCreatingNodeViaDrag = false;

    // Add event listeners
    window.addEventListener('nodeResizeEnd', (event: CustomEvent) => {
        lastResizeEndTime = Date.now();
        console.log('Resize end time updated:', lastResizeEndTime);
    });
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


// Add a loading state
let isCanvasLoading = writable(false);

function onPaneClick(event) {
    const currentIsResizing = get(isNodeResizing);
    const currentTime = Date.now();
    const timeSinceResize = currentTime - lastResizeEndTime;
    const timeSinceConnectEnd = currentTime - lastConnectEndTime;
    const timeSinceLastClick = currentTime - lastClickTime;
    const timeSinceCanvasCreation = currentTime - canvasCreationTime;
    
    console.log('Pane Click Debug:', {
        currentTime,
        isResizing: currentIsResizing,
        isCreatingNodeViaDrag,
        timeSinceLastClick,
        timeSinceResize,
        timeSinceConnectEnd,
        timeSinceCanvasCreation,
        isNewCanvasLoading,
        event: event.detail
    });

    // Enhanced prevention conditions
    const shouldPreventCreation = 
        isNewCanvasLoading || // New condition
        timeSinceCanvasCreation < canvasCreationThreshold ||
        timeSinceResize < resizeThreshold ||
        timeSinceConnectEnd < connectEndThreshold ||
        currentIsResizing ||
        isCreatingNodeViaDrag ||
        timeSinceLastClick < clickThreshold;

    if (shouldPreventCreation) {
        console.log('Prevented node creation:', {
            reason: isNewCanvasLoading ? 'Canvas is still loading' :
                   timeSinceCanvasCreation < canvasCreationThreshold ? 'Too soon after canvas creation' :
                   timeSinceResize < resizeThreshold ? 'Too soon after resize' :
                   timeSinceConnectEnd < connectEndThreshold ? 'Too soon after connect end' :
                   currentIsResizing ? 'Currently resizing' : 
                   isCreatingNodeViaDrag ? 'Drag in progress' : 
                   'Click too soon',
            timings: {
                sinceCanvasCreation: timeSinceCanvasCreation,
                sinceLast: timeSinceLastClick,
                sinceResize: timeSinceResize,
                sinceConnect: timeSinceConnectEnd
            }
        });
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    // Create new node if checks pass
    const { clientX, clientY } = event.detail.event;
    const flowPosition = screenToFlowPosition({ x: clientX, y: clientY });
    const newNode = {
        id: getId(),
        type: 'text',
        position: flowPosition,
        data: { label: getNewNodeLabel('text'), text: '' }
    };

    console.log('Creating new node:', newNode);
    nodes.update(n => [...n, newNode]);
    lastClickTime = currentTime;
}


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




let nodes = writable<Node[]>([]);
let edges = writable<Edge[]>([]);


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
  
  async function runConnectedNodes(edgeId: string, modelOverride?: string) {
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
                () => get(shouldStop),
                modelOverride  // Pass the modelOverride parameter here
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
// Track separate counters for each node type
let promptCounter = writable(1);
let resultCounter = writable(1);

// Function to get the next new node label based on node type
const getNewNodeLabel = (nodeType: 'text' | 'result') => {
  // Find all existing labels for the specific node type
  const existingNumbers = $nodes
    .filter(node => node.type === nodeType)
    .map(node => {
      const prefix = nodeType === 'text' ? 'Prompt ' : 'Result ';
      const match = node.data.label.match(new RegExp(`^${prefix}(\\d+)(?:\\s*\\([^)]+\\))?$`));
      return match ? parseInt(match[1]) : 0;
    })
    .filter(num => !isNaN(num));

  // Get the highest number used for this type
  const highestNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;

  // Update the appropriate counter
  if (nodeType === 'text') {
    promptCounter.set(highestNumber + 1);
    return `Prompt ${get(promptCounter)}`;
  } else {
    resultCounter.set(highestNumber + 1);
    return `Result ${get(resultCounter)}`;
  }
};


  const { screenToFlowPosition, fitView  } = useSvelteFlow();

  const handleConnectStart: OnConnectStart = (event) => {
    isCreatingNodeViaDrag = true;
  };



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
                label: getNewNodeLabel('text'), 
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
      // Create a Set to eliminate duplicate models
    const uniqueModels = new Set([get(selectedModel), ...get(secondaryModels)]);
    const modelsToProcess = Array.from(uniqueModels);
    
    const basePosition = screenToFlowPosition({
        x: clientX,
        y: clientY
    });

    for (let i = 0; i < modelsToProcess.length; i++) {
        const model = modelsToProcess[i];
        const id = getId();

        const newNode = {
            id,
            type: 'result',
            data: { 
                label: `${getNewNodeLabel('result')} (${model.split('/').pop()})`,
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

        nodes.update(n => [...n, newNode]);
        edges.update(e => [...e, newEdge]);

        if (sourceNode && sourceNode.type === 'text' && sourceNode.data.text && sourceNode.data.text !== '') {
            // Run each model independently without waiting
            runConnectedNodes(newEdge.id, model);
        }
    }
    }

    isCreatingNodeViaDrag = false;
    lastClickTime = Date.now();
    lastConnectEndTime = Date.now();
};



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


  function handleEdgeCreate(connection: Connection): Edge { //Cannot find name 'Connection'.
    const newEdge = createEdge({
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target
    });
    edges.update(eds => [...eds, newEdge]);
    return newEdge;
  }

 
  

  function handleModelChange(event: CustomEvent<string>) {
    selectedModel.set(event.detail);
  }

  

  function resetTimers() {
    const currentTime = Date.now();
    lastClickTime = currentTime;
    lastConnectEndTime = currentTime;
    lastResizeEndTime = currentTime;
    canvasCreationTime = currentTime;
    isCreatingNodeViaDrag = false;
    
    // Set loading flag and clear it after delay
    isNewCanvasLoading = true;
    setTimeout(() => {
        isNewCanvasLoading = false;
    }, newCanvasLoadingDelay);
    
    console.log('Timers reset:', { 
        lastClickTime, 
        lastConnectEndTime, 
        lastResizeEndTime, 
        canvasCreationTime,
        isNewCanvasLoading 
    });
}
</script>


<main>
  <div class="model-selector-container">
    <ModelSelector on:modelChange={handleModelChange} />
  </div>
  <LocalCanvasPanel 
    {nodes}
    {edges}
    on:clearCanvas={() => {
        nodes.set([]);
        edges.set([]);
        updateCyclicEdges();
        resetTimers();
    }}
    on:resetTimers={resetTimers}
    on:setLoading={({ detail }) => {
        isCanvasLoading.set(detail.loading);
        if (detail.loading) {
            isNewCanvasLoading = true;
            setTimeout(() => {
                isNewCanvasLoading = false;
            }, newCanvasLoadingDelay);
        }
    }}
    on:updateCanvas={({ detail }) => {
        nodes.set(detail.nodes);
        edges.set(detail.edges);
        updateCyclicEdges();
    }}
    on:fitView={() => {
        fitView({ duration: 200 });
    }}
    on:canvasCreated={() => {
        resetTimers();
    }}
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
  /* Remove fixed positioning that can cause issues */
  height: 100%;
  width: 100%;
  overflow: hidden;
}

main {
  /* Use fallback for browsers that don't support dvh */
  height: 100vh;
  height: 100dvh; /* dynamic viewport height */
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Ensure SvelteFlow container fills available space */
:global(.svelte-flow) {
  flex: 1;
  touch-action: none;
  height: 100%; /* Ensure it fills the flex container */
}

.custom-controls {
  /* Use bottom padding to account for mobile browser bars */
  position: fixed;
  right: 70px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  z-index: 10;
}
  :global(*) {
    box-sizing: inherit;
  }

  .model-selector-container {
    position: fixed; /* Changed from absolute to fixed */
    top: 10px;
    right: 10px;
    z-index: 1;
  }

   .custom-button {
    background-color: #4a5568;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    width: 50px; /* Slightly smaller for mobile */
    height: 50px; /* Slightly smaller for mobile */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    cursor: pointer;
    outline: none;
    color: white;
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


  .hidden {
  display: none;
}
.save-load-controls {
    position: fixed;
    bottom: calc(20px + env(safe-area-inset-bottom));
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 10;
  }

  .save-load-button {
    background-color: #4a5568;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .save-load-button:hover {
    background-color: #64748b;
    transform: translateY(-2px);
    box-shadow: 0 7px 14px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08);
  }

  .save-load-button:active {
    transform: translateY(1px);
    box-shadow: 0 3px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.08);
  }


 @media screen and (max-width: 768px) {
  /* Keep custom-controls (zap button) as is */
  .custom-controls {
    right: 10px;
    bottom: 15px; /* Adjust if needed */
  }

  /* Hide the SvelteFlow controls but keep custom-controls visible */
  :global(.svelte-flow__controls) {
    display: none !important;
  }
}


</style>