<!-- App.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import {
    SvelteFlow,
    Controls,
    Background,
    BackgroundVariant,
    MiniMap,
    MarkerType,
    type Node,
    type NodeTypes,
    type Edge,
    type EdgeTypes
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import { getLLMResponse } from './api';
  import TextNode from './TextNode.svelte';
  import ResultNode from './ResultNode.svelte';
  import CustomEdge from './CustomEdge.svelte';



  const defaultEdgeOptions = {
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#000000'
    },
    style: 'stroke-width: 2px; stroke: #000000; fill: none;', // Add 'fill: none;'
    type: 'custom',
  };

  const nodeTypes: NodeTypes = {
    text: TextNode,
    result: ResultNode
  };

  const edgeTypes: EdgeTypes = {
    custom: CustomEdge as any // Use type assertion here
  };




  function createEdge(params: any) {
    const edgeId = params.id || `e${params.source}-${params.target}`;
    return {
      ...params,
      id: edgeId,
      type: 'custom',
      markerEnd: defaultEdgeOptions.markerEnd,
      style: defaultEdgeOptions.style,
      data: { 
        onPlay: () => runConnectedNodes(edgeId),
        onDelete: (id: string) => deleteEdge(id) // Add this line
      }
    };
  }

  // Add this function to delete an edge
  function deleteEdge(id: string) {
    edges.update(e => e.filter(edge => edge.id !== id));
  }


function onConnect(params: any) {
    edges.update(eds => {
      const newEdge = createEdge(params);
      console.log('New edge added:', newEdge);
      return [...eds, newEdge];
    });

    // Force update all edges after a short delay
    setTimeout(forceEdgeUpdate, 100);
  }


$: console.log('Current edges:', $edges);


let nodes = writable<Node[]>([
  {
    id: '1',
    type: 'text',
    data: { 
      label: 'Generate Ideas', 
      text: 'Generate 5 novel and impactful management research ideas. For each idea, provide a brief description, potential research questions, and expected outcomes. Number each idea from 1 to 5.'
    },
    position: { x: 0, y: 0 }
  },
  {
    id: '2',
    type: 'result',
    data: { label: 'Research Ideas', text: 'Generated research ideas will appear here' },
    position: { x: 250, y: 0 }
  },
  {
    id: '3',
    type: 'text',
    data: { 
      label: 'Evaluate Ideas', 
      text: 'Evaluate the 5 research ideas in {Research Ideas}. For each idea, provide a score from 1-10 on novelty, feasibility, and potential impact. Briefly justify each score. Then, recommend the best idea to pursue based on these evaluations.'
    },
    position: { x: 0, y: 150 }
  },
  {
    id: '4',
    type: 'result',
    data: { label: 'Idea Evaluation', text: 'Idea evaluations and recommendation will appear here' },
    position: { x: 250, y: 150 }
  },
  {
    id: '5',
    type: 'text',
    data: { 
      label: 'Literature Review', 
      text: 'Based on the recommended idea in {Idea Evaluation}, conduct a hypothetical literature review. Identify key theories, seminal papers, and recent developments in the field related to the research idea. Summarize the main findings and highlight the research gap your idea addresses.'
    },
    position: { x: 0, y: 300 }
  },
  {
    id: '6',
    type: 'result',
    data: { label: 'Literature Summary', text: 'Literature review summary will appear here' },
    position: { x: 250, y: 300 }
  },
  {
    id: '7',
    type: 'text',
    data: { 
      label: 'Paper Structure', 
      text: 'Create an outline for a management research paper based on the recommended idea from {Idea Evaluation} and the literature review {Literature Summary}. Include standard sections such as Introduction, Literature Review, Methodology, Results, Discussion, and Conclusion. Provide brief descriptions of what each section should contain.'
    },
    position: { x: 0, y: 450 }
  },
  {
    id: '8',
    type: 'result',
    data: { label: 'Paper Outline', text: 'Paper outline will appear here' },
    position: { x: 250, y: 450 }
  },
  {
    id: '9',
    type: 'text',
    data: { 
      label: 'Write Introduction', 
      text: 'Write the Introduction section of the management research paper based on the recommended idea from {Idea Evaluation}, {Literature Summary}, and {Paper Outline}. Use academic language, cite relevant literature, and ensure coherence with the overall paper structure. Focus on introducing the research problem, stating the purpose of the study, and outlining its significance.'
    },
    position: { x: 0, y: 600 }
  },
  {
    id: '10',
    type: 'result',
    data: { label: 'Introduction Draft', text: 'Introduction draft will appear here' },
    position: { x: 250, y: 600 }
  },
  {
    id: '11',
    type: 'text',
    data: { 
      label: 'Refinement', 
      text: 'Review the entire paper draft, including the recommended idea from {Idea Evaluation}, {Literature Summary}, {Paper Outline}, and {Introduction Draft}. Identify areas for improvement in terms of clarity, coherence, and academic rigor. Suggest specific edits or additions to strengthen the paper\'s arguments and contributions to management theory and practice.'
    },
    position: { x: 0, y: 750 }
  },
  {
    id: '12',
    type: 'result',
    data: { label: 'Refined Paper', text: 'Refined paper draft will appear here' },
    position: { x: 250, y: 750 }
  },
  {
    id: '13',
    type: 'text',
    data: { 
      label: 'Final Review', 
      text: 'Conduct a final review of the management paper {Refined Paper}. Evaluate its overall quality, potential impact, and suitability for publication in a management journal. Provide a summary of strengths and areas for future development.'
    },
    position: { x: 0, y: 900 }
  },
  {
    id: '14',
    type: 'result',
    data: { label: 'Final Assessment', text: 'Final paper assessment will appear here' },
    position: { x: 250, y: 900 }
  }
]);

let edges = writable<Edge[]>([
  createEdge({ id: 'e1-2', source: '1', target: '2' }),
  createEdge({ id: 'e2-3', source: '2', target: '3' }),
  createEdge({ id: 'e3-4', source: '3', target: '4' }),
  createEdge({ id: 'e4-5', source: '4', target: '5' }),
  createEdge({ id: 'e5-6', source: '5', target: '6' }),
  createEdge({ id: 'e6-7', source: '6', target: '7' }),
  createEdge({ id: 'e7-8', source: '7', target: '8' }),
  createEdge({ id: 'e8-9', source: '8', target: '9' }),
  createEdge({ id: 'e9-10', source: '9', target: '10' }),
  createEdge({ id: 'e10-11', source: '10', target: '11' }),
  createEdge({ id: 'e11-12', source: '11', target: '12' }),
  createEdge({ id: 'e12-13', source: '12', target: '13' }),
  createEdge({ id: 'e13-14', source: '13', target: '14' })
]);


  async function runConnectedNodes(edgeId) {
    const edge = $edges.find(e => e.id === edgeId);
    if (!edge) return;

    const sourceNode = $nodes.find(n => n.id === edge.source);
    const targetNode = $nodes.find(n => n.id === edge.target);

    if (sourceNode && targetNode && sourceNode.type === 'text' && targetNode.type === 'result') {
      processing = true;

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
            return Array.isArray(referencedNode.data.results) && referencedNode.data.results.length > 0
              ? referencedNode.data.results[referencedNode.data.results.length - 1]
              : match;
          } else if (referencedNode.type === 'text') {
            return referencedNode.data.text || match;
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

      const response = await getLLMResponse(processedText);

      // Update the target node with the response
      nodes.update(n => n.map(node => {
        if (node.id === targetNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              results: [...(node.data.results || []), response]
            }
          };
        }
        return node;
      }));

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

      processing = false;
    }
  }


  let id = 10;
  const getId = () => `${id++}`;
  let processing = false;


  function onPaneClick(event) {
    const newNode = {
      id: getId(),
      type: 'text',
      position: { x: 0, y: 0 },
      data: { label: `Node ${id}`, text: 'Insert prompt here.' }
    };

    nodes.update(n => [...n, newNode]);


  }
  

  function forceEdgeUpdate() {
  edges.update(currentEdges => {
    return currentEdges.map(edge => ({
      ...edge,
      type: 'custom',
      animated: edge.animated || false, // Add this line
      data: {
        ...edge.data,
        onPlay: () => runConnectedNodes(edge.id),
        onDelete: (id: string) => deleteEdge(id)
      }
    }));
  });
}

  // Call forceEdgeUpdate periodically
  setInterval(forceEdgeUpdate, 2000);



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
  animated: edge.source === node.id || connectedResultNodes.some(rn => rn.id === edge.target),
  class: edge.source === node.id || connectedResultNodes.some(rn => rn.id === edge.target) 
    ? 'processing-edge' 
    : edge.class
        }));
        edges.set(allEdges);

        // Update nodes to trigger re-render
        nodes.set(allNodes);

        // Delay to allow for visual update
        await new Promise(resolve => setTimeout(resolve, 100));

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
        class: (n.class || '')
          .replace('processing', '')
          .replace('referenced', '')
          .trim()
      }));
      nodes.set(allNodes);

      // Reset edge animations and remove processing class
      allEdges = allEdges.map(edge => ({
        ...edge,
        animated: false,
        class: (edge.class || '').replace('processing-edge', '').trim()
      }));
      edges.set(allEdges);

      // Delay to allow for visual update
      await new Promise(resolve => setTimeout(resolve, 100));
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
  {edgeTypes}
  {defaultEdgeOptions}
  fitView
  on:paneclick={onPaneClick}
  on:connect={({ detail }) => onConnect(detail)}
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

</style>
