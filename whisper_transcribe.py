#!/usr/bin/env python3
import sys
import json
import os
from openai import OpenAI
from deep_translator import GoogleTranslator

def transcribe_and_translate(audio_path, output_audio_path):
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # Transcribe the audio using OpenAI's Whisper API
        with open(audio_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json"
            )
        
        # Detect the source language
        detected_language = transcript.language if hasattr(transcript, 'language') else "en"
        print(f"Detected language: {detected_language.title()}", file=sys.stderr)
        
        # Format the segments for SRT generation
        segments = []
        if hasattr(transcript, 'segments') and transcript.segments:
            for seg in transcript.segments:
                segments.append({
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text.strip()
                })
        
        original_text = transcript.text
        
        # Translate to Kurdish Central (Sorani) using deep-translator
        translator = GoogleTranslator(source='auto', target='ckb')
        kurdish_text = translator.translate(original_text)
        
        # Translate segments to Kurdish Central for subtitles
        translated_segments = []
        for seg in segments:
            translated_seg_text = translator.translate(seg["text"])
            translated_segments.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": translated_seg_text
            })
        
        # Keep the original audio - no TTS generation
        # Just copy the original audio to the output path
        import shutil
        shutil.copy2(audio_path, output_audio_path)
        
        # Return the result as JSON
        output = {
            "text": original_text,
            "segments": segments,
            "translated": kurdish_text,
            "translated_segments": translated_segments,
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
