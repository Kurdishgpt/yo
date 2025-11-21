#!/usr/bin/env python3
import sys
import json
import os
from deep_translator import GoogleTranslator
import requests
from pydub import AudioSegment

def translate_and_generate_tts(text, output_audio_path, speaker_key="1_speaker"):
    try:
        # Translate to Kurdish Central (Sorani) using deep-translator
        print(f"Translating text to Kurdish...", file=sys.stderr)
        translator = GoogleTranslator(source='auto', target='ckb')
        kurdish_text = translator.translate(text)
        
        print(f"Original text: {text[:100]}...", file=sys.stderr)
        print(f"Kurdish translation: {kurdish_text[:100]}...", file=sys.stderr)
        
        # Generate Kurdish TTS audio using the Kurdish TTS API
        kurdish_tts_api_key = os.environ.get("KURDISH_TTS_API_KEY")
        url = "https://www.kurdishtts.com/api/tts-proxy"
        
        tts_data = {
            "text": kurdish_text,
            "language": "sorani",
            "speaker_key": speaker_key
        }
        
        headers = {
            "x-api-key": kurdish_tts_api_key,
            "Content-Type": "application/json"
        }
        
        print(f"Calling Kurdish TTS API with speaker: {speaker_key}", file=sys.stderr)
        print(f"Text length: {len(kurdish_text)} characters", file=sys.stderr)
        r = requests.post(url, headers=headers, data=json.dumps(tts_data))
        
        print(f"Kurdish TTS API response: {r.status_code}", file=sys.stderr)
        if r.status_code != 200:
            print(f"TTS API error response: {r.text[:500]}", file=sys.stderr)
        
        if r.status_code == 200:
            # Save as temporary WAV file
            temp_wav_path = output_audio_path.replace('.mp3', '.wav')
            with open(temp_wav_path, "wb") as f:
                f.write(r.content)
            
            # Convert to MP3
            kurdish_audio = AudioSegment.from_wav(temp_wav_path)
            kurdish_audio.export(output_audio_path, format="mp3")
            print(f"✅ Kurdish audio generated successfully", file=sys.stderr)
            
            # Clean up temporary WAV file
            if os.path.exists(temp_wav_path):
                os.remove(temp_wav_path)
        else:
            print(f"⚠️ TTS API error: {r.status_code} - Using placeholder", file=sys.stderr)
            # Create a simple placeholder audio file
            silence = AudioSegment.silent(duration=1000)
            silence.export(output_audio_path, format="mp3")
        
        # Return the result as JSON
        output = {
            "text": text,
            "translated": kurdish_text,
            "audio_path": output_audio_path
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python kurdish_translate.py <text> <output_audio_file> [speaker_key]"}), file=sys.stderr)
        sys.exit(1)
    
    text = sys.argv[1]
    output_audio_path = sys.argv[2]
    speaker_key = sys.argv[3] if len(sys.argv) > 3 else "1_speaker"
    
    translate_and_generate_tts(text, output_audio_path, speaker_key)
