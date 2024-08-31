<script lang="ts">
  import { writable } from 'svelte/store';
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
    type Node,
    type NodeTypes,
    type Edge
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { getLLMResponse } from './api';
  import TextNode from './TextNode.svelte';
  import ResultNode from './ResultNode.svelte';

  const nodeTypes: NodeTypes = {
    text: TextNode,
    result: ResultNode
  };

  let nodes = writable<Node[]>([
    {
      id: '1',
      type: 'text',
      data: { label: 'Text Node 1', text: 'What is the capital of France?' },
      position: { x: -100, y: -50 }
    },
    {
      id: '2',
      type: 'result',
      data: { label: 'Result Node 1' },
      position: { x: 300, y: -50 }
    },
    {
      id: '3',
      type: 'text',
      data: { label: 'Text Node 2', text: 'Berlin' },
      position: { x: -100, y: 100 }
    },
    {
      id: '4',
      type: 'text',
      data: { label: 'Text Node 3', text: 'Which is bigger {Result Node 1} or {Text Node 2}' },
      position: { x: 300, y: 100 }
    },
    {
      id: '5',
      type: 'result',
      data: { label: 'Result Node 2' },
      position: { x: 700, y: 100 }
    }
  ]);

  let edges = writable<Edge[]>([
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-4', source: '2', target: '4' },
    { id: 'e3-4', source: '3', target: '4' },
    { id: 'e4-5', source: '4', target: '5' },
  ]);

  let id = 6;
  const getId = () => `${id++}`;
  let processing = false;

  function onPaneClick(event) {
    const newNode = {
      id: getId(),
      type: 'text',
      position: { x: 0, y: 0 },
      data: { label: `Text Node ${id}`, text: 'Insert prompt here.' }
    };

    nodes.update(n => [...n, newNode]);
  }

  async function onBigButtonClick() {
  processing = true;
  let allNodes = $nodes;
  let allEdges = $edges;

  const sortedNodes = topologicalSort(allNodes, allEdges);

  for (const node of sortedNodes) {
    if (node.type === 'text') {
      const referencedNodes = [];
      
      // Add processing class to current node
      allNodes = allNodes.map(n => ({
        ...n,
        class: n.id === node.id ? `${n.class || ''} processing`.trim() : n.class
      }));

      const connectedResultNodes = allEdges
        .filter(edge => edge.source === node.id)
        .map(edge => allNodes.find(n => n.id === edge.target))
        .filter(n => n && n.type === 'result');

      // Add processing class to connected result nodes
      allNodes = allNodes.map(n => ({
        ...n,
        class: connectedResultNodes.some(rn => rn.id === n.id) 
          ? `${n.class || ''} processing`.trim() 
          : n.class
      }));

      if (connectedResultNodes.length > 0) {
        let processedText = node.data.text;

        // Replace references with actual values and collect referenced nodes
        const regex = /{([^}]+)}/g;
        processedText = processedText.replace(regex, (match, label) => {
          const referencedNode = allNodes.find(n => n.data.label === label);
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

        // Add processing class to referenced nodes
        allNodes = allNodes.map(n => ({
          ...n,
          class: referencedNodes.some(rn => rn.id === n.id)
            ? `${n.class || ''} processing referenced`.trim()
            : n.class
        }));

        // Animate connected edges
        allEdges = allEdges.map(edge => ({
          ...edge,
          animated: edge.source === node.id,
          class: edge.source === node.id ? 'processing-edge' : edge.class
        }));
        edges.set(allEdges);

        nodes.set(allNodes);

        const response = await getLLMResponse(processedText);

        for (const resultNode of connectedResultNodes as Node[]) {
          allNodes = allNodes.map(n => {
            if (n.id === resultNode.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  results: [...(n.data.results || []), response]
                }
              };
            }
            return n;
          });
        }

        // Update the nodes store with the new allNodes array
        nodes.set(allNodes);
      }

      // Remove processing class from current node, connected result nodes, and referenced nodes
      allNodes = allNodes.map(n => ({
        ...n,
        class: (n.id === node.id || connectedResultNodes.some(rn => rn.id === n.id) || referencedNodes.some(rn => rn.id === n.id))
          ? (n.class || '').replace('processing', '').replace('referenced', '').trim()
          : n.class
      }));
      nodes.set(allNodes);

      // Reset edge animations and remove processing class
      allEdges = allEdges.map(edge => ({
        ...edge,
        animated: false,
        class: (edge.class || '').replace('processing-edge', '').trim()
      }));
      edges.set(allEdges);
    }
  }

  processing = false;
}



  function deleteNode(id: string) {
    nodes.update(n => n.filter(node => node.id !== id));
    edges.update(e => e.filter(edge => edge.source !== id && edge.target !== id));
  }

  function topologicalSort(nodes, edges) {
    const graph = new Map();
    nodes.forEach(node => graph.set(node.id, []));
    edges.forEach(edge => {
      if (graph.has(edge.source)) {
        graph.get(edge.source).push(edge.target);
      }
    });

    const visited = new Set();
    const stack = [];

    function dfs(nodeId) {
      visited.add(nodeId);
      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        }
      }
      stack.push(nodeId);
    }

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    }

    return stack.reverse().map(id => nodes.find(node => node.id === id));
  }
</script>


<main>
  <SvelteFlow
    {nodes}
    {edges}
    {nodeTypes}
    fitView
    on:paneclick={onPaneClick}
  >
    <Controls />
    <Background variant={BackgroundVariant.Dots} />
    
    <div class="custom-controls">
      <button class="custom-button" on:click={onBigButtonClick} class:processing>
        ⚡️
      </button>
    </div>
  </SvelteFlow>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
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
    right: 20px;
    bottom: 20px;
    z-index: 10;
  }

  .custom-button {
    background-color: #f0f0f0;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08);
    font-size: 24px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    cursor: pointer;
    outline: none;
  }

  .custom-button:hover {
    background-color: #e0e0e0;
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

:global(.processing.referenced) {
  border: 2px solid blue !important;
}

:global(.processing-edge) {
  stroke: blue !important;
  stroke-width: 2 !important;
}

:global(.processing-edge path) {
  stroke: blue !important;
}

</style>
