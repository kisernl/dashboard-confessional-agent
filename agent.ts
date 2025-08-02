import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { e2b } from '@computesdk/e2b';

// Get the current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runAgent(userInput: string) {
  const provider = e2b();

  // 1. Read your dc_dataset.py from your project folder
  const datasetPath = path.resolve(__dirname, 'dc_dataset.py');
  const datasetContent = fs.readFileSync(datasetPath, 'utf8');

  // Escape triple-quotes and backslashes for safe Python string literal
  const safeDatasetContent = datasetContent
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '\\"\\"\\"');

  // Escape user input for safe Python multiline string literal
  const safeUserInput = userInput.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');

  try {
    // 2. Upload dc_dataset.py to sandbox /tmp directory
    await provider.doExecute(`
with open("/tmp/dc_dataset.py", "w", encoding="utf-8") as f:
    f.write("""${safeDatasetContent}""")
`);

    // 3. Run Python code that imports dc_dataset and runs matching
    const matchCode = `
import sys
sys.path.append("/tmp")

from dc_dataset import songs

user_input = """${safeUserInput}""".lower().split()

matches = []
for song, keywords in songs.items():
    score = sum(word in keywords for word in user_input)
    matches.append((score, song, keywords))
matches.sort(reverse=True)
best_score, best_song, best_keywords = matches[0]

if best_score == 0:
    print("No good match found.")
else:
    print(f"Best Match: {best_song} ({best_score} keyword matches)")
    print("Key themes:", ", ".join(best_keywords))
`;

    // 4. Execute the matching code inside sandbox
    const result = await provider.doExecute(matchCode);

    console.log('=== Agent Result ===');
    console.log(result.stdout.trim());

  } catch (error: any) {
    console.error('Error:', error.message || error);
  } finally {
    // 5. Cleanup sandbox
    await provider.doKill();
  }
}

// Example usage
(async () => {
  const userInput = "I feel nostalgic and want something about youth and longing";
  console.log(`User Input: "${userInput}"\n`);

  await runAgent(userInput);
})();
