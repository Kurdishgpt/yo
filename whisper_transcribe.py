#!/usr/bin/env python3
import sys
import json
import os
import whisper
from deep_translator import GoogleTranslator
import requests
from pydub import AudioSegment

def transcribe_and_translate(audio_path, output_audio_path):
    try:
        # Load the Whisper model (base model for faster processing)
        model = whisper.load_model("base")
        
        # Transcribe the audio with English language forced for better accuracy
        result = model.transcribe(audio_path, language="en", verbose=False)
        
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
        
        # Generate Kurdish TTS audio using the Kurdish TTS API
        api_key = os.environ.get("KURDISH_TTS_API_KEY")
        url = "https://www.kurdishtts.com/api/tts-proxy"
        
        tts_data = {
            "text": kurdish_text,
            "language": "sorani",
            "speaker_key": "1_speaker"
        }
        
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        r = requests.post(url, headers=headers, data=json.dumps(tts_data))
        
        if r.status_code == 200:
            # Save as temporary WAV file
            temp_wav_path = output_audio_path.replace('.mp3', '.wav')
            with open(temp_wav_path, "wb") as f:
                f.write(r.content)
            
            # Convert WAV to MP3
            sound = AudioSegment.from_wav(temp_wav_path)
            sound.export(output_audio_path, format="mp3")
            
            # Clean up temporary WAV file
            if os.path.exists(temp_wav_path):
                os.remove(temp_wav_path)
            
            print(f"✅ Kurdish audio generated successfully", file=sys.stderr)
        else:
            print(f"⚠️ TTS API error: {r.status_code} - Copying original audio instead", file=sys.stderr)
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
