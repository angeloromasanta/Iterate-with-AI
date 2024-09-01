<!-- CustomEdge.svelte -->
<script lang="ts">
    import { getBezierPath } from '@xyflow/svelte';
    import type { EdgeProps } from '@xyflow/svelte';
  
    import { onMount } from 'svelte';

onMount(() => {
  console.log(`Edge ${id} mounted`);
});

$: console.log(`Edge ${id} isHovered: ${isHovered}`);

    type CustomEdgeProps = EdgeProps & {
      data: {
        onPlay: (id: string) => void;
      };
    };
  
    export let id: CustomEdgeProps['id'];
    export let sourceX: CustomEdgeProps['sourceX'];
    export let sourceY: CustomEdgeProps['sourceY'];
    export let targetX: CustomEdgeProps['targetX'];
    export let targetY: CustomEdgeProps['targetY'];
    export let sourcePosition: CustomEdgeProps['sourcePosition'];
    export let targetPosition: CustomEdgeProps['targetPosition'];
    export let style: CustomEdgeProps['style'] = {};
    export let markerEnd: CustomEdgeProps['markerEnd'];
    export let data: CustomEdgeProps['data'];
  
    let isHovered = false;
  
    $: [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  
    
    function onPlayClick(event: MouseEvent) {
    event.stopPropagation();
    console.log('Play clicked for edge:', id, 'Data:', data);
    if (data && typeof data.onPlay === 'function') {
      data.onPlay(id);
    } else {
      console.error(`onPlay function not found for edge ${id}`, data);
    }
  }

  
    function onMouseEnter() {
    console.log(`Edge ${id} mouse enter`);
    isHovered = true;
  }

  function onMouseLeave() {
    console.log(`Edge ${id} mouse leave`);
    isHovered = false;
  }


  
  </script>
  
  <g on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
    <path 
      id={id} 
      style={style} 
      class="react-flow__edge-path" 
      d={edgePath} 
      marker-end={markerEnd}
    />
    {#if isHovered}
      <foreignObject
        width={30}
        height={30}
        x={labelX - 15}
        y={labelY - 15}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <button class="play-button" on:click={onPlayClick}>▶</button>
      </foreignObject>
    {/if}
  </g>
  
  <style>
    .play-button {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #544caf;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
  
    .play-button:hover {
      background-color: #5445a0;
    }
  </style>
  