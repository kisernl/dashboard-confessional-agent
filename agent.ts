// agent.ts

import { e2b } from "@computesdk/e2b";

async function matchSongToLyrics(userInput: string) {
    // Create sandbox with E2B provider
    const sandbox = e2b();

    // Escape user input to safeyly embed in Python code string
    const safeInput = userInput.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/"/g, '\\"');

    // Python code to run inside Sandbox - containes a small dataset and basic substring matching
    const pythonCode = `user_input = """${safeInput}""".lower()
    
    
# Small dataset of Dashboard Confessional songs with lyric snippets
songs = {
    "Vindicated": "hope, dangles on a string like a necklace",
    "Hands Down": "breath in for luck breathe in so deep",
    "Screaming Infidelities": "i'm reading your note over again",
    "Stolen": "i know that you were stolen from somewhere",
    "The Best Deceptions": "i have faith in you",
}

def find_best_match(input_text):
    matches = []
    for song, lyrics in songs.items():
        # Count how many words in the user input appear in the lyrics snippet
        score = sum(word in lyrics for word in input_text.split())
        matches.append((score, song, lyrics))
    # Sort matches descending
    matches.sort(reverse=True)
    best_score, best_song, best_lyrics = matches[0]
    if best_score == 0:
        return ("No good match found.", "")
    return (best_song, best_lyrics)

title, snippet = find_best_match(user_input)
print(f"Best Match: {title}")
if snippet:
    print(f"Lyrics Snippet: {snippet}")
`;

    try {
        console.log("Executing Python code in E2B sandbox...");
        // Execute Python code inside sandbox
        const result = await sandbox.doExecute(pythonCode);

        console.log('Agent result:\n', result.stdout.trim());
    } catch (error) {
        console.error('Error during sandbox execution:', error.message || error);
    } finally {
        // Clean up sandbox
        await sandbox.doKill();
        console.log("Sandbox cleaned up.");
    }
}


// Example interaction: user inputs a lyric fragment
(async () => {
    const userInput = "I have faith in you, but it feels like a necklace on a string";
    console.log(`User Input: "${userInput}"\n`);
  
    await matchSongToLyrics(userInput);
  })();