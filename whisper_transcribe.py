#!/usr/bin/env python3
import sys
import json
import os
import whisper
from googletrans import Translator
from gtts import gTTS

def transcribe_and_translate(audio_path, output_audio_path):
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
        
        original_text = result["text"]
        
        # Translate to Kurdish
        translator = Translator()
        translated = translator.translate(original_text, src='en', dest='ku')
        kurdish_text = translated.text
        
        # Generate Kurdish audio using gTTS
        tts = gTTS(text=kurdish_text, lang='ku', slow=False)
        tts.save(output_audio_path)
        
        # Return the result as JSON
        output = {
            "text": original_text,
            "segments": segments,
            "translated": kurdish_text,
            "audio_path": output_audio_path
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python whisper_transcribe.py <audio_file> <output_audio_file>"}), file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    output_audio_path = sys.argv[2]
    transcribe_and_translate(audio_path, output_audio_path)
