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
            x: 964.1784473372932,
            y: 391.47921845912936,
          },
          data: {
            label: "Topic",
            text: "Insert topic here.",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
          class: "",
        },
        {
          id: "3",
          type: "text",
          position: {
            x: 1248.1784473372932,
            y: 397.47921845912936,
          },
          data: {
            label: "Outline prompt",
            text: "Write an outline for a paper on {Topic}. Have an introduction, theory, analysis and conclusions.",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
          class: "",
        },
        {
          id: "4",
          type: "result",
          position: {
            x: 1554.1784473372932,
            y: 395.47921845912936,
          },
          data: {
            label: "Outline",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "5",
          type: "text",
          position: {
            x: 1866.1784473372932,
            y: 311.47921845912936,
          },
          data: {
            label: "Part 1",
            text: "Write the introduction based on this outline:\n{Outline}",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "6",
          type: "text",
          position: {
            x: 1864.1784473372932,
            y: 471.47921845912936,
          },
          data: {
            label: "Part 2",
            text: "Write the current theory based on this outline:\n{Outline}",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "7",
          type: "text",
          position: {
            x: 1862.1784473372932,
            y: 631.4792184591294,
          },
          data: {
            label: "Part 3",
            text: "Write the analysis based on this outline:\n{Outline}",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "8",
          type: "text",
          position: {
            x: 1854.1784473372932,
            y: 793.4792184591294,
          },
          data: {
            label: "Part 4",
            text: "Write the conclusions based on this outline:\n{Outline}",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "9",
          type: "result",
          position: {
            x: 2154.178447337293,
            y: 319.47921845912936,
          },
          data: {
            label: "Introduction",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "10",
          type: "result",
          position: {
            x: 2140.178447337293,
            y: 495.47921845912936,
          },
          data: {
            label: "Theory",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: true,
          dragging: false,
        },
        {
          id: "11",
          type: "result",
          position: {
            x: 2128.178447337293,
            y: 645.4792184591294,
          },
          data: {
            label: "Analysis",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "12",
          type: "result",
          position: {
            x: 2126.178447337293,
            y: 795.4792032003403,
          },
          data: {
            label: "Conclusions",
            text: "Insert prompt here.",
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
      ],
      edges: [
        {
          id: "e1-3",
          source: "1",
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
          id: "e4-6",
          source: "4",
          target: "6",
          data: {},
        },
        {
          id: "e4-7",
          source: "4",
          target: "7",
          data: {},
        },
        {
          id: "e4-8",
          source: "4",
          target: "8",
          data: {},
        },
        {
          id: "e5-9",
          source: "5",
          target: "9",
          data: {},
        },
        {
          id: "e6-10",
          source: "6",
          target: "10",
          data: {},
        },
        {
          id: "e7-11",
          source: "7",
          target: "11",
          data: {},
        },
        {
          id: "e8-12",
          source: "8",
          target: "12",
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
          data: {
            label: "Reviewer 1 Comments",
            text: "Provide the full text of Reviewer 1's comments here.",
          },
          position: {
            x: -206.32500000000002,
            y: -72.73750000000001,
          },
          measured: {
            width: 200,
            height: 140,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "2",
          type: "text",
          data: {
            label: "Digest Reviewer 1 Comments",
            text: "Here are the comments from Reviewer 1: \n{Reviewer 1 Comments}. \n\nAnalyze and summarize the key points, criticisms, and suggestions. Identify the main areas of concern and potential improvements. ",
          },
          position: {
            x: 55.34375,
            y: -86.96875000000001,
          },
          measured: {
            width: 234,
            height: 70,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "3",
          type: "result",
          data: {
            label: "Reviewer 1 Digest",
          },
          position: {
            x: 342.3125,
            y: -82.22500000000002,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "4",
          type: "text",
          data: {
            label: "Reviewer 2 Comments",
            text: "Provide the full text of Reviewer 2's comments here.",
          },
          position: {
            x: -200,
            y: 100,
          },
          measured: {
            width: 200,
            height: 140,
          },
          selected: false,
        },
        {
          id: "5",
          type: "text",
          data: {
            label: "Digest Reviewer 2 Comments",
            text: "Here are the comments from Reviewer 2: \n{Reviewer 2 Comments}. \n\nAnalyze and summarize the key points, criticisms, and suggestions. Identify the main areas of concern and potential improvements. ",
          },
          position: {
            x: 52.181250000000006,
            y: 88.93125,
          },
          measured: {
            width: 211,
            height: 70,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "6",
          type: "result",
          data: {
            label: "Reviewer 2 Digest",
          },
          position: {
            x: 342.3125,
            y: 96.83749999999998,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "7",
          type: "text",
          data: {
            label: "Reviewer 3 Comments",
            text: "Provide the full text of Reviewer 3's comments here.",
          },
          position: {
            x: -207.90625,
            y: 256.925,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "8",
          type: "text",
          data: {
            label: "Digest Reviewer 3 Comments",
            text: "Here are the comments from Reviewer 2: \n{Reviewer 2 Comments}. \n\nAnalyze and summarize the key points, criticisms, and suggestions. Identify the main areas of concern and potential improvements. ",
          },
          position: {
            x: 47.4375,
            y: 242.69375,
          },
          measured: {
            width: 205,
            height: 70,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "9",
          type: "result",
          data: {
            label: "Reviewer 3 Digest",
          },
          position: {
            x: 340.73125000000005,
            y: 255.34375,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "10",
          type: "text",
          data: {
            label: "Editor Comments",
            text: "Provide the full text of the Editor's comments here.",
          },
          position: {
            x: -212.64999999999998,
            y: 413.84999999999997,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "11",
          type: "text",
          data: {
            label: "Digest Editor Comments",
            text: "Here are the comments from the editor: \n{Editor Comments}\n\nAnalyze and summarize the key points, criticisms, and suggestions. Identify the main areas of concern and potential improvements. ",
          },
          position: {
            x: 40.455524103921476,
            y: 435.91342676209075,
          },
          measured: {
            width: 217,
            height: 70,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "12",
          type: "result",
          data: {
            label: "Editor Digest",
          },
          position: {
            x: 324.91875000000005,
            y: 457.9271869182587,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "13",
          type: "text",
          data: {
            label: "Generate Revision Plan",
            text: "Here are the following summaries of comments on the paper: \n{Reviewer 1 Digest}\n{Reviewer 2 Digest}\n{Reviewer 3 Digest}\n{Editor Digest}\n\nBased on the summaries, create a comprehensive revision plan. Prioritize changes and improvements, addressing all major concerns and suggestions.",
          },
          position: {
            x: 668.8125,
            y: 87.93593749999997,
          },
          measured: {
            width: 240,
            height: 216,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "14",
          type: "result",
          data: {
            label: "Revision Plan",
          },
          position: {
            x: 954.2,
            y: 82.00625,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "15",
          type: "text",
          data: {
            label: "Initial Draft",
            text: "Provide the full text of the initial draft here.",
          },
          position: {
            x: 646.6750000000001,
            y: 418.59375,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "16",
          type: "text",
          data: {
            label: "Implement Revisions",
            text: "Here is the initial draft of a paper:\n{Initial Draft}\n\nHere is the revision plan:\n{Revision Plan} \n\nApply the changes outlined in the revision plan to the initial draft. Focus on addressing each point systematically, ensuring all major concerns are resolved.",
          },
          position: {
            x: 1218.65,
            y: 193.375,
          },
          measured: {
            width: 239,
            height: 279,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "17",
          type: "result",
          data: {
            label: "Revised Draft",
          },
          position: {
            x: 1513.0625000000002,
            y: 210.76875,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "18",
          type: "text",
          data: {
            label: "Review Revisions",
            text: "Here is the revised draft:\n{Revised Draft} \n\nHere is the revision plan:\n {Revision Plan} \n\nAnalyze to ensure all points from the revision plan have been addressed adequately. Identify any areas that may need further improvement.",
          },
          position: {
            x: 1768.8687500000003,
            y: 66.87499999999997,
          },
          measured: {
            width: 205,
            height: 204,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "19",
          type: "result",
          data: {
            label: "Revision Assessment",
          },
          position: {
            x: 2072.8359375,
            y: 112.73124999999993,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "20",
          type: "text",
          data: {
            label: "Generate Response to Comments",
            text: "Here is the revised draft:\n{Revised Draft} \n\nHere are the revisions suggested:\n{Reviewer 1 Digest}{Reviewer 2 Digest} {Reviewer 3 Digest}\n{Editor Digest}\n\nCreate a detailed response to all comments from reviewers. Explain how each concern was addressed in the revised paper.",
          },
          position: {
            x: 1808.4,
            y: 311.45,
          },
          measured: {
            width: 230,
            height: 284,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "21",
          type: "result",
          data: {
            label: "Response to Comments",
          },
          position: {
            x: 2223.4500000000003,
            y: 357.30625,
          },
          measured: {
            width: 200,
            height: 130,
          },
          selected: false,
          dragging: false,
        },
        {
          id: "103",
          type: "text",
          position: {
            x: 2399.0068946745864,
            y: 57.434217413653926,
          },
          data: {
            label: "Revision recheck",
            text: "Here is the revised draft: \n{Revised Draft} \nImprove this revised draft given this assessment: {Revision Assessment}",
          },
          measured: {
            width: 205,
            height: 170,
          },
          selected: false,
          dragging: false,
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
          id: "e4-5",
          source: "4",
          target: "5",
          data: {},
        },
        {
          id: "e5-6",
          source: "5",
          target: "6",
          data: {},
        },
        {
          id: "e7-8",
          source: "7",
          target: "8",
          data: {},
        },
        {
          id: "e8-9",
          source: "8",
          target: "9",
          data: {},
        },
        {
          id: "e10-11",
          source: "10",
          target: "11",
          data: {},
        },
        {
          id: "e11-12",
          source: "11",
          target: "12",
          data: {},
        },
        {
          id: "e3-13",
          source: "3",
          target: "13",
          data: {},
        },
        {
          id: "e6-13",
          source: "6",
          target: "13",
          data: {},
        },
        {
          id: "e9-13",
          source: "9",
          target: "13",
          data: {},
        },
        {
          id: "e12-13",
          source: "12",
          target: "13",
          data: {},
        },
        {
          id: "e13-14",
          source: "13",
          target: "14",
          data: {},
        },
        {
          id: "e14-16",
          source: "14",
          target: "16",
          data: {},
        },
        {
          id: "e15-16",
          source: "15",
          target: "16",
          data: {},
        },
        {
          id: "e16-17",
          source: "16",
          target: "17",
          data: {},
        },
        {
          id: "e17-18",
          source: "17",
          target: "18",
          data: {},
        },
        {
          id: "e18-19",
          source: "18",
          target: "19",
          data: {},
        },
        {
          id: "e17-20",
          source: "17",
          target: "20",
          data: {},
        },
        {
          id: "e20-21",
          source: "20",
          target: "21",
          data: {},
        },
        {
          id: "e19-103",
          source: "19",
          target: "103",
          data: {},
        },
        {
          id: "e103-17",
          source: "103",
          target: "17",
          data: {
            loopCount: 2,
          },
        },
      ],
    };
  } else {
    templateData = { nodes: [], edges: [] };
  }

  return templateData;
}
