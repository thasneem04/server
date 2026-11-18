import { GoogleGenAI } from "@google/genai";

const MAX_CONTEXT_MESSAGES = 14;
const MAX_MESSAGE_LENGTH = 8000;

const systemInstruction =
  "You are a helpful assistant for a todo app. Help users organize, prioritize, and break tasks into smaller steps. Do not claim to create, edit, or delete todos; users must do that in the app.";

export const chat = async (req, res) => {
  const { messages } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: "A non-empty messages array is required." });
  }

  const context = messages.slice(-MAX_CONTEXT_MESSAGES);
  const isValidContext = context.every(
    (message) =>
      message &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0,
  );

  if (!isValidContext || context.at(-1).role !== "user") {
    return res.status(400).json({ message: "The chat messages are invalid." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ message: "The Gemini API key is not configured on the server." });
  }

  const contents = context.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content.trim().slice(0, MAX_MESSAGE_LENGTH) }],
  }));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents,
      config: { systemInstruction },
    });
    const reply = response.text?.trim();

    if (!reply) {
      console.error("Gemini returned an empty chat response.");
      return res.status(502).json({ message: "Gemini returned an empty response. Please try again." });
    }

    return res.json({ success: true, reply });
  } catch (error) {
    console.error("Gemini chat request failed:", error.message);
    return res.status(502).json({ message: "Gemini could not complete the request. Please try again." });
  }
};
