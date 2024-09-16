// File: api/llm.js
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { model, input } = await req.json();
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    return new Response("Server API key is not configured", { status: 500 });
  }

  if (model !== "meta-llama/llama-3.1-405b-instruct") {
    return new Response("Invalid model for this endpoint", { status: 400 });
  }

  try {
    const openrouter = createOpenRouter({
      apiKey: apiKey,
    });

    const result = await streamText({
      model: openrouter(model),
      messages: [{ role: "user", content: input }],
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    return new Response("Unable to get response from LLM.", { status: 500 });
  }
}
