// api.ts
import { get } from "svelte/store";
import { selectedModel, userApiKey } from "./stores";

const OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function getLLMResponse(input: string): Promise<string> {
  const model = get(selectedModel);
  const apiKey = get(userApiKey);

  try {
    let response;

    if (apiKey) {
      // If user has provided their own API key, make the request directly to OpenRouter
      response = await fetch(OPENROUTER_API_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: input }],
        }),
      });
    } else {
      // If no user API key, use the server endpoint (which uses your API key)
      response = await fetch("/api/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input,
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling LLM API:", error);
    return "Error: Unable to get response from LLM.";
  }
}
