from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging
import sys

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

class AnalysisRequest(BaseModel):
    message: str
    themes: list[str]

# Load songs dataset
try:
    import sys
    from pathlib import Path
    # Add the project root to the Python path
    project_root = str(Path(__file__).parent.parent)
    if project_root not in sys.path:
        sys.path.append(project_root)
    
    from dc_dataset import songs  # This will import your songs dictionary
    logger.info("Successfully loaded songs dataset")
    logger.info(f"Number of songs loaded: {len(songs)}")
    logger.info(f"Sample song: {next(iter(songs.items()))}")
    
except ImportError as e:
    logger.error(f"Failed to load songs dataset: {e}")
    # Fallback to a minimal dataset if the import fails
    songs = {
        "Vindicated": ["regret", "redemption", "love", "mistakes"],
        "Screaming Infidelities": ["heartbreak", "betrayal", "anger", "moving on"],
    }

@app.post("/analyze")
async def analyze_song(request: AnalysisRequest):
    try:
        logger.info(f"Received analysis request for message: {request.message[:100]}...")
        logger.info(f"Themes to match: {request.themes}")
        
        best_match = {"score": 0, "song": "", "themes": []}
        
        # Convert themes to lowercase for case-insensitive matching
        request_themes_lower = [t.lower() for t in request.themes]
        
        for song, song_themes in songs.items():
            # Convert song themes to lowercase for comparison
            song_themes_lower = [t.lower() for t in song_themes]
            
            # Calculate score based on theme matches
            matching_themes = [t for t in request_themes_lower if t in song_themes_lower]
            score = len(matching_themes)
            
            if score > best_match["score"]:
                # Get the original case of the matching themes
                theme_indices = [i for i, t in enumerate(song_themes_lower) if t in matching_themes]
                original_themes = [song_themes[i] for i in theme_indices]
                
                best_match = {
                    "score": score,
                    "song": song,
                    "themes": original_themes
                }
        
        logger.info(f"Best match found: {best_match['song']} (score: {best_match['score']})")
        return best_match
        
    except Exception as e:
        logger.error(f"Error in analyze_song: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Python API server...")
    uvicorn.run(
        "analyze:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
