const { geminiApiKey, geminiModel, geminiApiBaseUrl } = require("../config/env");
const { sanitizeText } = require("./sanitize");

function extractText(data) {
  const candidates = data && Array.isArray(data.candidates) ? data.candidates : [];
  const first = candidates[0] || {};
  const content = first.content || {};
  const parts = Array.isArray(content.parts) ? content.parts : [];
  return parts
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function generateWithGemini({ prompt }) {
  if (!geminiApiKey) {
    return {
      text: "",
      source: "fallback",
      modelUsed: null,
      error: "GEMINI_API_KEY is not configured"
    };
  }

  const url = `${geminiApiBaseUrl}/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: sanitizeText(prompt, 1800) }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 220
    }
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await response.json();
    if (!response.ok) {
      const apiError = data && data.error && data.error.message ? data.error.message : "Gemini API request failed";
      throw new Error(apiError);
    }

    const text = extractText(data);
    return {
      text,
      source: text ? "gemini" : "fallback",
      modelUsed: geminiModel,
      error: text ? null : "Empty Gemini response"
    };
  } catch (error) {
    return {
      text: "",
      source: "fallback",
      modelUsed: geminiModel,
      error: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateWithGemini
};
