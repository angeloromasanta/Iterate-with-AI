// src/templateUtils.ts

import type { Node, Edge } from '@xyflow/svelte';

interface TemplateData {
  nodes: Node[];
  edges: Edge[];
}

export async function loadTemplate(templateFile: string): Promise<TemplateData> {
  // In a real application, this would be an API call to fetch the template data
  // For now, we'll simulate it with a timeout and hardcoded data
  await new Promise(resolve => setTimeout(resolve, 500));

  let templateData: TemplateData;

  if (templateFile === 'basic-flow.json') {
    templateData = {
      nodes: [
        { id: '1', type: 'text', data: { label: 'Start', text: 'Start here' }, position: { x: 0, y: 0 } },
        { id: '2', type: 'text', data: { label: 'End', text: 'End here' }, position: { x: 200, y: 100 } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' }
      ]
    };
  } else if (templateFile === 'complex-flow.json') {
    templateData = {
      nodes: [
        { id: '1', type: 'text', data: { label: 'Start', text: 'Start here' }, position: { x: 0, y: 0 } },
        { id: '2', type: 'text', data: { label: 'Process', text: 'Do something' }, position: { x: 200, y: 0 } },
        { id: '3', type: 'text', data: { label: 'Decision', text: 'Make a choice' }, position: { x: 400, y: 0 } },
        { id: '4', type: 'text', data: { label: 'End', text: 'End here' }, position: { x: 600, y: 0 } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4' }
      ]
    };
  } else {
    templateData = { nodes: [], edges: [] };
  }

  return templateData;
}