import { get } from "svelte/store";
import { selectedModel, userApiKey, latestCost, cumulativeCost, generationId } from "./stores";

const OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Keep track of pending cost fetches to avoid overlapping requests
const pendingCostFetches = new Map<string, Promise<number>>();

// Add retry logic and delay for cost fetching
async function fetchGenerationCost(genId: string, apiKey: string, attempt = 1): Promise<number> {
  const MAX_ATTEMPTS = 3;
  const INITIAL_DELAY = 1000; // 1 second
  
  // Return existing promise if we're already fetching this generation's cost
  if (pendingCostFetches.has(genId)) {
    return pendingCostFetches.get(genId)!;
  }

  const costPromise = new Promise<number>(async (resolve, reject) => {
    try {
      // Add delay based on attempt number (exponential backoff)
      const delay = INITIAL_DELAY * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));

      const response = await fetch(`https://openrouter.ai/api/v1/generation?id=${genId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404 && attempt < MAX_ATTEMPTS) {
          // Generation data might not be ready yet, retry
          console.log(`Generation cost fetch attempt ${attempt} failed, retrying...`);
          resolve(await fetchGenerationCost(genId, apiKey, attempt + 1));
          return;
        }
        throw new Error(`Failed to fetch generation cost: ${response.status}`);
      }

      const data = await response.json();
      return resolve(data.data.total_cost);
    } catch (error) {
      if (attempt < MAX_ATTEMPTS) {
        console.log(`Error fetching cost, attempt ${attempt}, retrying...`, error);
        resolve(await fetchGenerationCost(genId, apiKey, attempt + 1));
        return;
      }
      reject(error);
    } finally {
      if (attempt === MAX_ATTEMPTS || attempt === 1) {
        // Only clean up if it's the final attempt or successful first attempt
        pendingCostFetches.delete(genId);
      }
    }
  });

  pendingCostFetches.set(genId, costPromise);
  return costPromise;
}

// Update costs with better error handling
async function updateCosts(genId: string, apiKey: string) {
  try {
    const cost = await fetchGenerationCost(genId, apiKey);
    if (cost !== null && cost !== undefined) {
      latestCost.set(cost);
      cumulativeCost.update(total => total + cost);

      // Reset latest cost after 3 seconds (for flash effect)
      setTimeout(() => {
        latestCost.set(null);
      }, 3000);
    } else {
      console.warn('Received null or undefined cost for generation:', genId);
    }
  } catch (error) {
    console.error('Failed to fetch generation cost after all retries:', error);
    // Optionally set a visual indicator that cost fetching failed
    latestCost.set(null);
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
