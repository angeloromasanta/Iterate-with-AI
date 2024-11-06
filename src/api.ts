// api.ts
import { get } from "svelte/store";
import { selectedModel, userApiKey } from "./stores";

const OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function getLLMResponse(
  input: string,
  onChunk: (chunk: string) => void,
  shouldStop: () => boolean
): Promise<string> {
  const model = get(selectedModel);
  const apiKey = get(userApiKey);
  
  // Add timestamp for log correlation
  const startTime = new Date().toISOString();
  console.log(`[${startTime}] Starting LLM request for input:`, input);

  try {
    let response;
    if (apiKey) {
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
    let debugFullResponse = ""; // Separate variable for logging all chunks

    while (true) {
      if (shouldStop()) {
        console.log(`[${startTime}] Request stopped by user. Accumulated response:`, debugFullResponse);
        reader?.cancel();
        return fullResponse;
      }

      const { done, value } = (await reader?.read()) ?? {
        done: true,
        value: undefined,
      };
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      if (apiKey) {
        // Handle direct OpenRouter streaming response
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");
        for (const line of lines) {
          if (shouldStop()) {
            console.log(`[${startTime}] Request stopped by user during line processing. Accumulated response:`, debugFullResponse);
            return fullResponse;
          }
          
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              console.log(`[${startTime}] Received [DONE] signal`);
              continue;
            }
            
            try {
              // Log raw data for debugging
              console.log(`[${startTime}] Raw chunk data:`, data);
              
              const parsed = JSON.parse(data);
              // Log the full parsed structure
              console.log(`[${startTime}] Parsed chunk:`, JSON.stringify(parsed, null, 2));

              if (parsed.choices?.[0]?.delta?.content !== undefined) {
                const content = parsed.choices[0].delta.content;
                debugFullResponse += content; // Add to debug log
                console.log(`[${startTime}] Processing content chunk:`, content);
                onChunk(content);
                fullResponse += content;
              } else if (parsed.choices?.[0]?.delta) {
                // Log other types of delta messages
                console.log(`[${startTime}] Non-content delta received:`, parsed.choices[0].delta);
              }
            } catch (error) {
              console.warn(`[${startTime}] Error parsing chunk:`, error, "Raw chunk:", data);
              continue;
            }
          }
        }
      } else {
        // Server-side response handling
        console.log(`[${startTime}] Server-side chunk received:`, chunk);
        debugFullResponse += chunk; // Add to debug log
        onChunk(chunk);
        fullResponse += chunk;
      }
    }

    // Log final complete response
    console.log(`[${startTime}] Complete response logged:`, {
      input,
      response: debugFullResponse,
      model,
      timestamp: new Date().toISOString()
    });

    return fullResponse;
  } catch (error) {
    console.error(`[${startTime}] Error calling LLM API:`, error);
    console.log(`[${startTime}] Final accumulated response before error:`, debugFullResponse);
    throw new Error("Unable to get response from LLM.");
  }
}