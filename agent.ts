import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { e2b } from "@computesdk/e2b";
import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import { VALID_THEMES } from "./validThemes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function extractThemesFromInput(userInput: string): Promise<string[]> {
  const themesList = VALID_THEMES.map((t) => `- ${t}`).join("\n");

  const systemPrompt = `You are a music agent that matches user requests with song themes.
You must ONLY pick from the following list of valid themes:

${themesList}

Choose the 1 to 5 most relevant themes from that list that match the user's input.
Return a comma-separated list of themes, and nothing else.`;

  const response = await openai.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ],
    temperature: 0.3,
    max_tokens: 100,
  });

  const content = response.choices?.[0]?.message?.content || "";

  return content
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((t) => VALID_THEMES.includes(t));
}

// This function is kept for backward compatibility but is not used in the web app
export async function runAgent(userInput: string) {
  const provider = e2b();

  const datasetPath = path.resolve(__dirname, "dc_dataset.py");
  const datasetContent = fs.readFileSync(datasetPath, "utf8");
  const safeDatasetContent = datasetContent.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"');

  try {
    await provider.doExecute(`
with open("/tmp/dc_dataset.py", "w", encoding="utf-8") as f:
    f.write("""${safeDatasetContent}""")
`);

    console.log("Extracting themes from user input using LLaMA‑3.1...");
    const themes = await extractThemesFromInput(userInput);
    console.log("Extracted themes:", themes);

    const themesPyList = `[${themes.map((k) => `"${k}"`).join(", ")}]`;

    const matchCode = `
import sys
sys.path.append("/tmp")

from dc_dataset import songs

user_themes = ${themesPyList}

matches = []
for song, keywords in songs.items():
    score = sum(theme in keywords for theme in user_themes)
    matches.append((score, song, keywords))
matches.sort(reverse=True)
best_score, best_song, best_keywords = matches[0]

if best_score == 0:
    print("No good match found.")
else:
    print(f"Best Match: {best_song} ({best_score} theme matches)")
    print("Key themes:", ", ".join(best_keywords))
`;

    const result = await provider.doExecute(matchCode);
    console.log("=== Agent Result ===");
    console.log(result.stdout.trim());
  } catch (err: any) {
    console.error("Error:", err.message || err);
  } finally {
    await provider.doKill();
  }
}
