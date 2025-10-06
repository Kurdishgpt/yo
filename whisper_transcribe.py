#!/usr/bin/env python3
import sys
import json
import os
import whisper
from openai import OpenAI
from pathlib import Path

def transcribe_and_translate(audio_path, output_audio_path):
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
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
        
        # Translate to Kurdish using OpenAI
        # the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        translation_response = client.chat.completions.create(
            model="gpt-5",
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional translator. Translate the given text to Kurdish (Sorani/Central Kurdish). Only provide the translated text, nothing else."
                },
                {
                    "role": "user",
                    "content": original_text
                }
            ]
        )
        
        kurdish_text = translation_response.choices[0].message.content.strip()
        
        # Generate Kurdish audio using OpenAI TTS
        speech_response = client.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=kurdish_text
        )
        
        # Save the audio file
        speech_response.stream_to_file(output_audio_path)
        
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
