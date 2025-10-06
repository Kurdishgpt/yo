#!/usr/bin/env python3
import sys
import json
import whisper

def transcribe_audio(audio_path):
    try:
        # Load the Whisper model (base model for faster processing)
        model = whisper.load_model("base")
        
        # Transcribe the audio
        result = model.transcribe(audio_path, verbose=False)
        
        # Format the segments for SRT generation
        segments = []
        if "segments" in result:
            for seg in result["segments"]:
                segments.append({
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": seg["text"].strip()
                })
        
        # Return the result as JSON
        output = {
            "text": result["text"],
            "segments": segments
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python whisper_transcribe.py <audio_file>"}), file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    transcribe_audio(audio_path)
