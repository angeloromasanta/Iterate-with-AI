const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("dist")); // Serve your built Svelte app

app.post("/api/llm", async (req, res) => {
  const { model, input } = req.body;
  const apiKey = process.env.VITE_OPENROUTER_API_KEY;

  // Only allow requests for the free Llama model
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

    res.json(response.data);
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    res.status(500).json({ error: "Unable to get response from LLM." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
