#!/usr/bin/env python3
import sys
import json
import os
from assemblyai import AssemblyAI
from deep_translator import GoogleTranslator
import requests
from pydub import AudioSegment
import tempfile

def transcribe_and_translate(audio_path, output_audio_path, speaker_key="1_speaker"):
    try:
        # Initialize AssemblyAI client
        api_key = os.environ.get("ASSEMBLYAI_API_KEY")
        if not api_key:
            raise Exception("ASSEMBLYAI_API_KEY environment variable not set")
        
        client = AssemblyAI(api_key=api_key)
        
        # Transcribe the audio using AssemblyAI
        print(f"Transcribing audio with AssemblyAI...", file=sys.stderr)
        with open(audio_path, "rb") as audio_file:
            transcript = client.transcriber.transcribe(
                audio=audio_file,
                language_detection=True
            )
        
        # Get the detected language
        detected_language = transcript.language_code if hasattr(transcript, 'language_code') else "en"
        print(f"Detected language: {detected_language.upper()}", file=sys.stderr)
        
        # Format the segments for SRT generation
        segments = []
        if hasattr(transcript, 'words') and transcript.words:
            current_segment = {"start": 0, "end": 0, "text": ""}
            for word in transcript.words:
                if current_segment["text"] and len(current_segment["text"].split()) >= 10:  # Group words into segments
                    segments.append(current_segment)
                    current_segment = {"start": word.start / 1000, "end": word.end / 1000, "text": word.text}
                else:
                    if not current_segment["text"]:
                        current_segment["start"] = word.start / 1000
                    current_segment["text"] += " " + word.text if current_segment["text"] else word.text
                    current_segment["end"] = word.end / 1000
            if current_segment["text"]:
                segments.append(current_segment)
        
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
