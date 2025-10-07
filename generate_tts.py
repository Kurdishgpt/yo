#!/usr/bin/env python3
import sys
import json
import os
import requests
from pydub import AudioSegment

def generate_kurdish_tts(text, speaker_key, output_audio_path):
    try:
        # Get Kurdish TTS API key
        api_key = os.environ.get("KURDISH_TTS_API_KEY")
        url = "https://www.kurdishtts.com/api/tts-proxy"
        
        tts_data = {
            "text": text,
            "language": "sorani",
            "speaker_key": speaker_key
        }
        
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        print(f"Generating Kurdish TTS with speaker: {speaker_key}", file=sys.stderr)
        print(f"Text length: {len(text)} characters", file=sys.stderr)
        
        r = requests.post(url, headers=headers, data=json.dumps(tts_data))
        
        print(f"Kurdish TTS API response: {r.status_code}", file=sys.stderr)
        
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
            
            print(f"✅ Kurdish TTS audio generated successfully with {speaker_key}", file=sys.stderr)
            print(json.dumps({"success": True, "audio_path": output_audio_path}))
        else:
            print(f"⚠️ TTS API error: {r.status_code}", file=sys.stderr)
            print(f"Response: {r.text[:500]}", file=sys.stderr)
            print(json.dumps({"error": f"TTS API returned status {r.status_code}"}), file=sys.stderr)
            sys.exit(1)
        
    except Exception as e:
        print(f"Error generating TTS: {str(e)}", file=sys.stderr)
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(json.dumps({"error": "Usage: python generate_tts.py <text> <speaker_key> <output_audio_file>"}), file=sys.stderr)
        sys.exit(1)
    
    text = sys.argv[1]
    speaker_key = sys.argv[2]
    output_audio_path = sys.argv[3]
    
    generate_kurdish_tts(text, speaker_key, output_audio_path)
