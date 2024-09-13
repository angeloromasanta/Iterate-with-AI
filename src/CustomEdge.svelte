<!-- CustomEdge.svelte -->
<script lang="ts">
  import { getBezierPath } from '@xyflow/svelte';
  import { onMount } from 'svelte';
  import { Play, Trash2 } from 'lucide-svelte';
  export let id;
  export let sourceX;
  export let sourceY;
  export let targetX;
  export let targetY;
  export let sourcePosition;
  export let targetPosition;
  export let style = '';
  export let markerEnd;
  export let data;

  // Add these new props
  export let source;
  export let target;
  export let animated = false;
  export let selected = false;
  export let label = '';
  export let labelStyle = '';
  export let interactionWidth = 20;
  export let selectable = true;
  export let deletable = true;
  export let type = 'default';
  export let sourceHandleId = null;
  export let targetHandleId = null;
  export let markerStart = null;


  
  $: [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  let isHovered = false;
  let hideTimeout;

  function showButtons() {
    isHovered = true;
    clearTimeout(hideTimeout);
  }

  function hideButtons() {
    hideTimeout = setTimeout(() => {
      isHovered = false;
    }, 1500); // Keep buttons visible for 1.5 seconds after mouse leaves
  }

  let isAnimated = false;

  function onPlay() {
    if (data && typeof data.onPlay === 'function') {
      data.onPlay();
    }
    isAnimated = true;
    setTimeout(() => {
      isAnimated = false;
    }, 2000); // Stop animation after 2 seconds
  }

  function onDelete() {
    if (data && typeof data.onDelete === 'function') {
      data.onDelete(id);
    }
  }

  onMount(() => {
    return () => {
      clearTimeout(hideTimeout);
    };
  });


  let loopCount = data?.loopCount ?? 2;


  function incrementLoopCount() {
    loopCount++;
    console.log(`Incrementing loop count for edge ${id}`, { newLoopCount: loopCount });
    if (data && typeof data.updateEdgeData === 'function') {
      data.updateEdgeData(id, { loopCount });
    }
  }

  function decrementLoopCount() {
    if (loopCount > 0) {
      loopCount--;
      console.log(`Decrementing loop count for edge ${id}`, { newLoopCount: loopCount });
      if (data && typeof data.updateEdgeData === 'function') {
        data.updateEdgeData(id, { loopCount });
      }
    }
  }


  function updateLoopCount() {
    console.log(`Attempting to update loop count for edge ${id}`);
    if (data && typeof data.updateEdgeData === 'function') {
      data.updateEdgeData(id, { loopCount });
    } else {
      console.warn(`Unable to update loop count for edge ${id}. updateEdgeData is not available.`);
    }
  }

  $: loopCountX = targetX - 40; // Move 100 pixels to the left of the target node
  $: loopCountY = targetY - 0; // Move 30 pixels above the target node
  
  let path: string;
  $: {
    if (sourceX > targetX) {
      // If the source is to the right of the target (connecting to left side)
      const dx = Math.abs(sourceX - targetX);
      const dy = Math.abs(sourceY - targetY);

      // Determine if the source is above or below the target
      const isSourceAbove = sourceY < targetY;

      // Calculate control points for a looping curve
      const controlPointOffsetX = dx * 0.3;
      const verticalFactor = 1.3; // Adjust this value to make the loop larger or smaller
      const controlPointOffsetY = Math.max(dy, 150) * verticalFactor * (isSourceAbove ? -1 : 1);

      const sourceControlX = sourceX + controlPointOffsetX;
      const sourceControlY = sourceY + controlPointOffsetY;

      const targetControlX = targetX - controlPointOffsetX;
      const targetControlY = targetY + controlPointOffsetY;

      path = `M ${sourceX} ${sourceY} 
              C ${sourceControlX} ${sourceControlY}, 
                ${targetControlX} ${targetControlY}, 
                ${targetX} ${targetY}`;
    } else {
      // For other cases, use the default bezier path
      [path] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
    }
  }

</script>


<g on:mouseenter={showButtons} on:mouseleave={hideButtons}>
  <path
    {id}
    style={style}
    class="react-flow__edge-path"
    d={path}
    marker-end={markerEnd}
  />

  {#if isHovered}
    <g transform={`translate(${(sourceX + targetX) / 2 - 40}, ${(sourceY + targetY) / 2 - 20})`}>
      <rect x="0" y="0" width="80" height="40" rx="5" ry="5" fill="white" stroke="black" />

      <!-- Play button -->
      <g on:click|stopPropagation={onPlay} style="cursor: pointer;">
        <rect x="5" y="5" width="30" height="30" rx="3" ry="3" fill="#4CAF50" />
        <Play size={20} color="white" x={10} y={10} />
      </g>

      <!-- Delete button -->
      <g on:click|stopPropagation={onDelete} style="cursor: pointer;">
        <rect x="45" y="5" width="30" height="30" rx="3" ry="3" fill="#F44336" />
        <Trash2 size={20} color="white" x={50} y={10} />
      </g>
    </g>
  {/if}

  {#if data && data.showLoopCount}
    <g transform={`translate(${loopCountX}, ${loopCountY})`}>
      <!-- Grey border and white fill -->
      <circle cx="0" cy="0" r="30" fill="white" stroke="#E0E0E0" stroke-width="2"/>

      <!-- "Loops" text on top -->
      <text x="0" y="-20" text-anchor="middle" font-size="12" fill="#666">Loops</text>

      <!-- Minus button -->
      <rect x="-24" y="-10" width="14" height="20" fill="#4CAF50" rx="2" ry="2"/>
      <path d="M-21 0h8" stroke="white" stroke-width="2" />

      <!-- Loop count -->
      <text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="bold">{loopCount}</text>

      <!-- Plus button -->
      <rect x="10" y="-10" width="14" height="20" fill="#4CAF50" rx="2" ry="2"/>
      <path d="M13 0h8M17 -4v8" stroke="white" stroke-width="2" />

      <!-- Clickable areas -->
      <rect x="-24" y="-10" width="14" height="20" fill="transparent" 
            on:click|stopPropagation={decrementLoopCount} style="cursor: pointer;"/>
      <rect x="10" y="-10" width="14" height="20" fill="transparent" 
            on:click|stopPropagation={incrementLoopCount} style="cursor: pointer;"/>
    </g>
  {/if}

</g>

<style>
  g {
    pointer-events: all;
  }
</style>