#!/usr/bin/env python3
import sys
import json
import os
import whisper
from deep_translator import GoogleTranslator
from gtts import gTTS

def transcribe_and_translate(audio_path, output_audio_path):
    try:
        # Load the Whisper model (base model for faster processing)
        model = whisper.load_model("base")
        
        # Transcribe the audio
        result = model.transcribe(audio_path, verbose=False)
        
        # Detect the source language
        detected_language = result.get("language", "en")
        print(f"Detected language: {detected_language.title()}", file=sys.stderr)
        
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
        
        # Translate to Kurdish using deep-translator
        translator = GoogleTranslator(source='auto', target='ku')
        kurdish_text = translator.translate(original_text)
        
        # Generate Kurdish audio using gTTS with Arabic (ar) as fallback
        # gTTS doesn't support Kurdish directly, so we use Arabic which is widely understood
        try:
            # Try with Arabic first since gTTS has better support for it
            tts = gTTS(text=kurdish_text, lang='ar', slow=False)
            tts.save(output_audio_path)
        except Exception as tts_error:
            print(f"TTS Warning: {str(tts_error)}", file=sys.stderr)
            # If Arabic fails, try with English as ultimate fallback
            tts = gTTS(text=kurdish_text, lang='en', slow=False)
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
