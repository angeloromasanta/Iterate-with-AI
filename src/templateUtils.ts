// src/templateUtils.ts

import type { Node, Edge } from "@xyflow/svelte";

interface TemplateData {
  nodes: Node[];
  edges: Edge[];
}

export async function loadTemplate(
  templateFile: string,
): Promise<TemplateData> {
  // In a real application, this would be an API call to fetch the template data
  // For now, we'll simulate it with a timeout and hardcoded data
  await new Promise((resolve) => setTimeout(resolve, 500));

  let templateData: TemplateData;

  if (templateFile === "basic-flow.json") {
    templateData = {
      nodes: [
        {
          id: "1",
          type: "text",
          position: {
            x: 774.8102564102563,
            y: 375.64029304029305,
          },
          data: {
            label: "New Node 1",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 134,
          },
          selected: false,
        },
        {
          id: "2",
          type: "text",
          position: {
            x: 1047.642490842491,
            y: 448.2967032967033,
          },
          data: {
            label: "New Node 2",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 134,
          },
          selected: false,
        },
        {
          id: "3",
          type: "text",
          position: {
            x: 1356.0615384615385,
            y: 344.5018315018315,
          },
          data: {
            label: "New Node 3",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 134,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "4",
          type: "text",
          position: {
            x: 1731.2058608058608,
            y: 366.7435897435897,
          },
          data: {
            label: "New Node 4",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 134,
          },
          selected: false,
        },
        {
          id: "5",
          type: "text",
          position: {
            x: 2023.3142857142857,
            y: 340.0534798534798,
          },
          data: {
            label: "New Node 5",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 134,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "6",
          type: "text",
          position: {
            x: 1413.89010989011,
            y: 577.2989010989012,
          },
          data: {
            label: "New Node 6",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 134,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "7",
          type: "text",
          position: {
            x: 1703.032967032967,
            y: 583.2300366300367,
          },
          data: {
            label: "New Node 7",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 134,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "8",
          type: "text",
          position: {
            x: 2015.9003663003664,
            y: 583.2300366300366,
          },
          data: {
            label: "New Node 8",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 134,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "9",
          type: "text",
          data: {
            label: "New Node 9",
            text: "Insert prompt here.",
          },
          position: {
            x: 2367.3201465201464,
            y: 541.8974358974359,
          },
          origin: [0.5, 0],
          measured: {
            width: 200,
            height: 134,
          },
        },
      ],
      edges: [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          data: {},
        },
        {
          id: "e2-3",
          source: "2",
          target: "3",
          data: {},
        },
        {
          id: "e3-4",
          source: "3",
          target: "4",
          data: {},
        },
        {
          id: "e4-5",
          source: "4",
          target: "5",
          data: {},
        },
        {
          id: "e5-3",
          source: "5",
          target: "3",
          data: {
            loopCount: 5,
          },
        },
        {
          id: "e2-6",
          source: "2",
          target: "6",
          data: {},
        },
        {
          id: "e6-7",
          source: "6",
          target: "7",
          data: {},
        },
        {
          id: "e7-8",
          source: "7",
          target: "8",
          data: {},
        },
        {
          id: "e8-6",
          source: "8",
          target: "6",
          data: {
            loopCount: 4,
          },
        },
        {
          id: "e4-9",
          source: "4",
          target: "9",
          data: {},
        },
        {
          id: "e6-9",
          source: "6",
          target: "9",
          data: {},
        },
      ],
    };
  } else if (templateFile === "complex-flow.json") {
    templateData = {
      nodes: [
        {
          id: "1",
          type: "text",
          data: { label: "Start", text: "Start here" },
          position: { x: 0, y: 0 },
        },
        {
          id: "2",
          type: "text",
          data: { label: "Process", text: "Do something" },
          position: { x: 200, y: 0 },
        },
        {
          id: "3",
          type: "text",
          data: { label: "Decision", text: "Make a choice" },
          position: { x: 400, y: 0 },
        },
        {
          id: "4",
          type: "text",
          data: { label: "End", text: "End here" },
          position: { x: 600, y: 0 },
        },
      ],
      edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
        { id: "e3-4", source: "3", target: "4" },
      ],
    };
  } else {
    templateData = { nodes: [], edges: [] };
  }

  return templateData;
}
