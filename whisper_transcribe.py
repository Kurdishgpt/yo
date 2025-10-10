#!/usr/bin/env python3
import sys
import json
import os
from openai import OpenAI
from deep_translator import GoogleTranslator
import requests
from pydub import AudioSegment
import tempfile

def transcribe_and_translate(audio_path, output_audio_path, speaker_key="1_speaker"):
    try:
        # Initialize OpenAI client
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise Exception("OPENAI_API_KEY environment variable not set")
        
        client = OpenAI(api_key=api_key)
        
        # Transcribe the audio using OpenAI Whisper API
        print(f"Transcribing audio with OpenAI Whisper API...", file=sys.stderr)
        with open(audio_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["segment"]
            )
        
        # Get the detected language
        detected_language = transcript.language if hasattr(transcript, 'language') else "en"
        print(f"Detected language: {detected_language.title()}", file=sys.stderr)
        
        # Format the segments for SRT generation
        segments = []
        if hasattr(transcript, 'segments') and transcript.segments:
            for seg in transcript.segments:
                segments.append({
                    "start": seg.get("start", 0) if isinstance(seg, dict) else getattr(seg, "start", 0),
                    "end": seg.get("end", 0) if isinstance(seg, dict) else getattr(seg, "end", 0),
                    "text": (seg.get("text", "") if isinstance(seg, dict) else getattr(seg, "text", "")).strip()
                })
        
        original_text = transcript.text if hasattr(transcript, 'text') else str(transcript)
        
        # Translate to Kurdish Central (Sorani) using deep-translator
        translator = GoogleTranslator(source='auto', target='ckb')
        kurdish_text = translator.translate(original_text)
        
        print(f"Original text: {original_text[:100]}...", file=sys.stderr)
        print(f"Kurdish translation: {kurdish_text[:100]}...", file=sys.stderr)
        
        # Translate segments to Kurdish Central for subtitles
        translated_segments = []
        for seg in segments:
            if seg.get("text"):
                translated_seg_text = translator.translate(seg["text"])
                translated_segments.append({
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": translated_seg_text
                })
        
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
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python whisper_transcribe.py <audio_file> <output_audio_file> [speaker_key]"}), file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    output_audio_path = sys.argv[2]
    speaker_key = sys.argv[3] if len(sys.argv) > 3 else "1_speaker"
    
    transcribe_and_translate(audio_path, output_audio_path, speaker_key)
