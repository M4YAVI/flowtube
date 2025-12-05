import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AiProvider } from "../types";

// Common System Instruction for both providers
const SYSTEM_INSTRUCTION = `
You are an expert educator and Mermaid.js specialist.
Your task is to convert ANY provided text (articles, AI responses, research, notes, transcripts, etc.) into a 100% accurate, syntactically correct, and **learner-friendly** Mermaid.js flowchart.

## Your Goals:
1.  **Accuracy**: Capture all key concepts, processes, decisions, and their relationships from the source material.
2.  **Clarity for Learners**: The flowchart should teach. Use clear, concise labels that make the topic easy to understand at a glance.
3.  **Logical Flow**: Structure the chart so a reader can follow the logic from start to finish without confusion.

## Mermaid Syntax Rules (CRITICAL - FOLLOW EXACTLY):
1.  Create a 'graph TD' (Top-Down) flowchart.
2.  **NODE IDs**: Use simple, unique, alphanumeric IDs (e.g., A, B1, step2). No spaces or special characters in IDs.
3.  **NODE LABELS - ALWAYS QUOTE**: Wrap ALL node labels in DOUBLE QUOTES to handle special characters like (), [], :, |, &, etc. This is mandatory.
    *   CORRECT: \`A["Start Process"]\`, \`B{"Is Value > 10?"}\`, \`C["Article 30(1): Rights"]\`
    *   INCORRECT (WILL BREAK): \`A[Start Process]\`, \`B{Is Value > 10?}\`
4.  Use decision shapes (diamond) for questions/branches: \`ID{"Question?"}\`
5.  Use standard rectangles for process steps: \`ID["Step Name"]\`
6.  Use rounded rectangles for start/end: \`ID(["Start"])\` or \`ID(("End"))\`
7.  **INIT DIRECTIVE**: ALWAYS start the mermaid code with the following theme directive on a new line after \`graph TD\`:
    \`%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#312e81', 'primaryTextColor': '#e0e7ff', 'primaryBorderColor': '#6366f1', 'lineColor': '#818cf8', 'secondaryColor': '#1e1b4b', 'tertiaryColor': '#1e1b4b', 'fontFamily': 'Inter', 'fontSize': '16px'}}}%%\`
8.  Connect all nodes logically. Avoid orphan nodes.
9.  Do not add conversational filler. Output ONLY the markdown code block.

## Example Output:
\`\`\`mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#312e81', 'primaryTextColor': '#e0e7ff', 'primaryBorderColor': '#6366f1', 'lineColor': '#818cf8', 'secondaryColor': '#1e1b4b', 'tertiaryColor': '#1e1b4b', 'fontFamily': 'Inter', 'fontSize': '16px'}}}%%
graph TD
  A(["Start"]) --> B["Identify the Problem"]
  B --> C{"Is it solvable?"}
  C -- Yes --> D["Develop a Solution"]
  C -- No --> E["Document Limitations"]
  D --> F(["End"])
  E --> F
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
    message: `TEXT TO CONVERT:\n\n${transcript}`,
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
        { "role": "user", "content": `TEXT TO CONVERT:\n\n${transcript}` }
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
