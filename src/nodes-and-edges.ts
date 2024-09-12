import { writable } from "svelte/store";
import { MarkerType, type Node, type Edge } from "@xyflow/svelte";

export const nodes = writable<Node[]>([
  {
    id: "1",
    type: "text",
    data: { label: "Text Node 1", text: "Name the capital of Spain" },
    position: { x: -140, y: -10 },
  },
  {
    id: "2",
    type: "result",
    data: { label: "Result Node 1", text: "Madrid" },
    position: { x: 120, y: -10 },
  },
  {
    id: "3",
    type: "text",
    data: { label: "Text Node 2", text: "Paris" },
    position: { x: -140, y: 160 },
  },
  {
    id: "4",
    type: "text",
    data: {
      label: "Text Node 3",
      text: "Write a poem about {Result Node 1} and {Text Node 2}",
    },
    position: { x: 350, y: 80 },
  },
  {
    id: "5",
    type: "result",
    data: { label: "Result Node 2", text: "Poem about Paris and Madrid" },
    position: { x: 600, y: 100 },
  },
  {
    id: "6",
    type: "text",
    data: {
      label: "Text Node 4",
      text: "Suggest ways to improve {Result Node 2}",
    },
    position: { x: 900, y: 100 },
  },
  {
    id: "7",
    type: "result",
    data: { label: "Result Node 3", text: "Suggestions" },
    position: { x: 1100, y: 90 },
  },
  {
    id: "8",
    type: "text",
    data: {
      label: "Text Node 5",
      text: "Improve {Result Node 2} based on these suggestions {Result Node 3}",
    },
    position: { x: 1500, y: 150 },
  },
  {
    id: "9",
    type: "text",
    data: { label: "Text Node 6", text: "Format the poem in {Result Node 2}" },
    position: { x: 850, y: 350 },
  },
  {
    id: "10",
    type: "result",
    data: { label: "Result Node 4", text: "Final Poem" },
    position: { x: 1100, y: 350 },
  },
]);

export const edges = writable<Edge[]>([
  {
    id: "e1-2",
    source: "1",
    target: "2",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
  {
    id: "e5-6",
    source: "5",
    target: "6",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
  {
    id: "e6-7",
    source: "6",
    target: "7",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
  {
    id: "e7-8",
    source: "7",
    target: "8",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
  {
    id: "e8-5",
    source: "8",
    target: "5",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
  {
    id: "e5-9",
    source: "5",
    target: "9",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
  {
    id: "e9-10",
    source: "9",
    target: "10",
    type: "custom",
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: "#000000",
    },
    style: "stroke-width: 2px; stroke: #000000; fill: none;",
    data: {
      onPlay: () => {},
      onDelete: () => {},
      updateEdgeData: () => {},
      showLoopCount: true,
      loopCount: 2,
    },
  },
]);

export function createEdge(params: any) {
  const edgeId = params.id || `e${params.source}-${params.target}`;
  return {
    ...params,
    id: edgeId,
    type: "custom",
    animated: false,
    selected: false,
    data: {
      onPlay: () => runConnectedNodes(edgeId),
      onDelete: (id: string) => deleteEdge(id),
      updateEdgeData: (id: string, newData: any) => updateEdgeData(id, newData),
      showLoopCount: true,
      loopCount: 2,
    },
  };
}

export function updateEdgeData(id: string, newData: any) {
  edges.update((eds) => {
    return eds.map((edge) => {
      if (edge.id === id) {
        console.log(`Updating edge ${id} with new data:`, newData);
        const updatedEdge = {
          ...edge,
          data: {
            ...edge.data,
            ...newData,
          },
        };
        console.log(`Updated edge:`, updatedEdge);
        return updatedEdge;
      }
      return edge;
    });
  });
}

export function deleteEdge(id: string) {
  edges.update((e) => e.filter((edge) => edge.id !== id));
}
