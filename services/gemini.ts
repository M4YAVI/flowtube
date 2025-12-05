import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AiProvider } from "../types";

// Common System Instruction for both providers
const SYSTEM_INSTRUCTION = `
You are an expert systems analyst and Mermaid.js specialist.
Your task is to convert the provided YouTube video transcript into a 100% accurate, syntactically correct Mermaid.js flowchart.

Rules:
1. Analyze the transcript to identify key processes, decisions, start points, and end points.
2. Create a 'graph TD' (Top-Down) flowchart.
3. Use concise node labels (max 5-7 words).
4. Use decision shapes (diamond) for questions/branches (e.g., {Decision?}).
5. Use standard rectangles for process steps (e.g., [Step Name]).
6. Ensure the syntax is 100% valid Mermaid code.
7. Wrap the output in a markdown code block tagged with 'mermaid'.
8. **CRITICAL**: Start the mermaid code block with the following init directive to ensure it looks cool on a dark background:
   %%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#312e81', 'primaryTextColor': '#e0e7ff', 'primaryBorderColor': '#6366f1', 'lineColor': '#818cf8', 'secondaryColor': '#1e1b4b', 'tertiaryColor': '#1e1b4b', 'fontFamily': 'Inter', 'fontSize': '16px'}}}%%
9. Do not add conversational filler. Output ONLY the markdown.
10. Ensure all node IDs are unique and alphanumeric.
11. Connect all nodes logically. Avoid orphan nodes.

Example Output format:
\`\`\`mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#312e81', 'primaryTextColor': '#e0e7ff', 'primaryBorderColor': '#6366f1', 'lineColor': '#818cf8', 'secondaryColor': '#1e1b4b', 'tertiaryColor': '#1e1b4b', 'fontFamily': 'Inter', 'fontSize': '16px'}}}%%
graph TD
  A[Start] --> B[Process Step]
  B --> C{Decision?}
  C -- Yes --> D[Result 1]
  C -- No --> E[Result 2]
\`\`\`
`;

const getGeminiClient = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("Missing Gemini API Key");
  return new GoogleGenAI({ apiKey: key });
};

export const generateFlowchartStream = async (
  transcript: string,
  onChunk: (text: string) => void,
  options: { provider: AiProvider; apiKey?: string }
): Promise<void> => {

  if (options.provider === 'OPENROUTER') {
    if (!options.apiKey) throw new Error("OpenRouter API Key is required");
    await streamOpenRouter(transcript, options.apiKey, onChunk);
  } else {
    // Default to Gemini
    await streamGemini(transcript, options.apiKey, onChunk);
  }
};

const streamGemini = async (transcript: string, apiKey: string | undefined, onChunk: (text: string) => void) => {
  const ai = getGeminiClient(apiKey);
  const model = "gemini-2.5-flash";

  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1,
    },
  });

  const resultStream = await chat.sendMessageStream({
    message: `TRANSCRIPT TO CONVERT:\n\n${transcript}`,
  });

  for await (const chunk of resultStream) {
    const responseChunk = chunk as GenerateContentResponse;
    if (responseChunk.text) {
      onChunk(responseChunk.text);
    }
  }
};

const streamOpenRouter = async (transcript: string, apiKey: string, onChunk: (text: string) => void) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "FlowTube",
    },
    body: JSON.stringify({
      "model": "amazon/nova-2-lite-v1",
      "messages": [
        { "role": "system", "content": SYSTEM_INSTRUCTION },
        { "role": "user", "content": `TRANSCRIPT TO CONVERT:\n\n${transcript}` }
      ],
      "stream": true
    })
  });

  if (!response.body) throw new Error("No response body from OpenRouter");

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const dataStr = trimmed.slice(6);
        if (dataStr === "[DONE]") return;
        try {
          const json = JSON.parse(dataStr);
          const content = json.choices[0]?.delta?.content || "";
          if (content) onChunk(content);
        } catch (e) {
          console.error("Error parsing OpenRouter stream:", e);
        }
      }
    }
  }
};
