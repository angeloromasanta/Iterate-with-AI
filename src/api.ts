// api.ts
import { get } from "svelte/store";
import { selectedModel, userApiKey, latestCost, cumulativeCost, generationId } from "./stores";

const OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Keep track of pending cost fetches to avoid overlapping requests
const pendingCostFetches = new Map<string, Promise<number>>();

// Fetch cost without blocking and with deduplication
async function fetchGenerationCost(genId: string, apiKey: string): Promise<number> {
  // Return existing promise if we're already fetching this generation's cost
  if (pendingCostFetches.has(genId)) {
    return pendingCostFetches.get(genId)!;
  }

  const costPromise = fetch(`https://openrouter.ai/api/v1/generation?id=${genId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch generation cost');
      }
      return response.json();
    })
    .then(data => data.data.total_cost)
    .finally(() => {
      // Clean up the pending fetch
      pendingCostFetches.delete(genId);
    });

  pendingCostFetches.set(genId, costPromise);
  return costPromise;
}

// Separate function to handle cost updates without blocking
async function updateCosts(genId: string, apiKey: string) {
  try {
    const cost = await fetchGenerationCost(genId, apiKey);
    latestCost.set(cost);
    cumulativeCost.update(total => total + cost);

    // Reset latest cost after 3 seconds (for flash effect)
    setTimeout(() => {
      latestCost.set(null);
    }, 3000);
  } catch (error) {
    console.error('Failed to fetch generation cost:', error);
  }
}

export async function getLLMResponse(
  input: string,
  onChunk: (chunk: string) => void,
  shouldStop: () => boolean,
  modelOverride?: string
): Promise<string> {
  const model = modelOverride || get(selectedModel);
  const apiKey = get(userApiKey);

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
    let debugFullResponse = "";

    // Variable to store the generation ID
    let generationIdValue: string | null = null;

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
              const parsed = JSON.parse(data);

              // Store generation ID when received
              if (parsed.id && !generationIdValue) {
                generationIdValue = parsed.id;
                generationId.set(parsed.id);
              }

              if (parsed.choices?.[0]?.delta?.content !== undefined) {
                const content = parsed.choices[0].delta.content;
                debugFullResponse += content;
                onChunk(content);
                fullResponse += content;
              }
            } catch (error) {
              console.warn(`[${startTime}] Error parsing chunk:`, error, "Raw chunk:", data);
              continue;
            }
          }
        }
      } else {
        debugFullResponse += chunk;
        onChunk(chunk);
        fullResponse += chunk;
      }
    }

    // After streaming is complete, initiate cost fetching
    if (apiKey && generationIdValue) {
      // Fire and forget - don't await
      updateCosts(generationIdValue, apiKey);
    }

    return fullResponse;
  } catch (error) {
    console.error(`[${startTime}] Error calling LLM API:`, error);
    throw new Error("Unable to get response from LLM.");
  }
}
