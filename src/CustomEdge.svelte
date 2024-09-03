<!-- CustomEdge.svelte -->
<script lang="ts">
  import { getBezierPath } from '@xyflow/svelte';
  import { onMount } from 'svelte';

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
</script>


<g on:mouseenter={showButtons} on:mouseleave={hideButtons}>
  <path
    {id}
    style={style}
    class="react-flow__edge-path"
    d={edgePath}
    marker-end={markerEnd}
  />

  {#if isHovered}
    <g transform={`translate(${(sourceX + targetX) / 2 - 40}, ${(sourceY + targetY) / 2 - 20})`}>
      <rect x="0" y="0" width="80" height="40" rx="5" ry="5" fill="white" stroke="black" />
      
      <!-- Play button -->
      <g on:click|stopPropagation={onPlay} style="cursor: pointer;">
        <rect x="5" y="5" width="30" height="30" rx="3" ry="3" fill="#4CAF50" />
        <path d="M15 10l15 10-15 10V10z" fill="white" />
      </g>
      
      <!-- Delete button -->
      <g on:click|stopPropagation={onDelete} style="cursor: pointer;">
        <rect x="45" y="5" width="30" height="30" rx="3" ry="3" fill="#F44336" />
        <path d="M52 13l16 16M68 13l-16 16" stroke="white" stroke-width="2" />
      </g>
    </g>
  {/if}

  {#if data && data.endLabel}
  <g transform={`translate(${targetX}, ${targetY})`}>
    <rect
      x="-50"
      y="-25"
      width="100"
      height="20"
      rx="5"
      ry="5"
      fill="white"
      stroke="black"
    />
    <text
      x="0"
      y="-13"
      text-anchor="middle"
      dominant-baseline="middle"
      font-size="12"
    >
      {data.endLabel}
    </text>
  </g>
{/if}

</g>

<style>
  g {
    pointer-events: all;
  }
</style>
