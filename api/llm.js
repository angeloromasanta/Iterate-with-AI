// File: api/llm.js (or api/llm.ts if using TypeScript)
// Note: If using Next.js, place this file in pages/api/llm.js instead

import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { model, input } = req.body;
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;

  if (model !== "meta-llama/llama-3.1-405b-instruct") {
    return res.status(400).json({ error: "Invalid model for this endpoint" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: model,
        messages: [{ role: "user", content: input }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    res.status(500).json({ error: "Unable to get response from LLM." });
  }
}
