// File: api/llm.js
import { streamText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  console.log("Handler function called");
  if (req.method !== "POST") {
    console.log("Method not allowed");
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
    console.log("Request body:", body);
  } catch (error) {
    console.error("Error parsing request body:", error);
    return new Response("Invalid JSON in request body", { status: 400 });
  }

  const { model, input } = body;
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;
  console.log("Model:", model);
  console.log("Input:", input);
  console.log("API Key exists:", !!apiKey);

  if (!apiKey) {
    console.error("Server API key is not configured");
    return new Response("Server API key is not configured", { status: 500 });
  }

  if (model !== "deepseek/deepseek-chat-v3-0324:free") {
    console.log("Invalid model requested");
    return new Response("Invalid model for this endpoint", { status: 400 });
  }

  try {
    console.log("Creating OpenRouter instance");
    const openrouter = createOpenRouter({
      apiKey: apiKey,
    });

    console.log("Calling streamText");
    const result = await streamText({
      model: openrouter(model),
      messages: [{ role: "user", content: input }],
    });

    console.log("Stream created, returning response");
    return result.toTextStreamResponse(); // Changed from toDataStreamResponse to toTextStreamResponse
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    return new Response("Unable to get response from LLM: " + error.message, {
      status: 500,
    });
  }
}
