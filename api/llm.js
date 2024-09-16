// File: api/llm.js (or api/llm.ts if using TypeScript)
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { model, input, stream } = req.body;
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Server API key is not configured" });
  }

  if (model !== "meta-llama/llama-3.1-405b-instruct") {
    return res.status(400).json({ error: "Invalid model for this endpoint" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model,
        messages: [{ role: "user", content: input }],
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: 'stream',
      },
    );

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    response.data.on('data', (chunk) => {
      res.write(chunk);
    });

    response.data.on('end', () => {
      res.end();
    });

  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    res.status(500).json({ error: "Unable to get response from LLM." });
  }
}
