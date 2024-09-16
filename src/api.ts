// api.ts
import { get } from "svelte/store";
import { selectedModel, userApiKey } from "./stores";

const OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function getLLMResponse(
  input: string,
  onChunk: (chunk: string) => void,
): Promise<string> {
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
          stream: true,
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
          stream: true,
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    while (true) {
      const { done, value } = (await reader?.read()) ?? {
        done: true,
        value: undefined,
      };
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      if (apiKey) {
        // Direct OpenRouter response handling (unchanged)
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content ?? "";
              if (content) {
                onChunk(content);
                fullResponse += content;
              }
            } catch (error) {
              console.error("Error parsing JSON:", error);
            }
          }
        }
      } else {
        // Server-side response handling
        const parts = chunk.split(/(\d+:)|e:|d:/);
        for (const part of parts) {
          if (part && !part.startsWith("{") && !part.match(/^\d+:$/)) {
            onChunk(part);
            fullResponse += part;
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error("Error calling LLM API:", error);
    return "Error: Unable to get response from LLM.";
  }
}
