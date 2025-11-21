#!/usr/bin/env python3
import sys
import json
import os
import assemblyai as aai
from deep_translator import GoogleTranslator
import requests
from pydub import AudioSegment

def transcribe_and_translate(audio_path, output_audio_path, speaker_key="1_speaker"):
    try:
        # Initialize AssemblyAI
        api_key = os.environ.get("ASSEMBLYAI_API_KEY")
        if not api_key:
            raise Exception("ASSEMBLYAI_API_KEY environment variable not set")
        
        aai.settings.api_key = api_key
        
        # Transcribe the audio using AssemblyAI
        print(f"Transcribing audio with AssemblyAI...", file=sys.stderr)
        
        # Create transcriber with default config
        transcriber = aai.Transcriber()
        
        # Transcribe the audio file
        transcript = transcriber.transcribe(audio_path)
        
        # Check for errors
        if transcript.status == aai.TranscriptStatus.error:
            raise Exception(f"AssemblyAI transcription error: {transcript.error}")
        
        # Ensure transcription was successful
        if not transcript.text:
            raise Exception("AssemblyAI returned empty transcription")
        
        # Get the detected language
        detected_language = getattr(transcript, 'language_code', 'en')
        print(f"Detected language: {detected_language.upper()}", file=sys.stderr)
        
        # Format the segments for SRT generation
        segments = []
        if hasattr(transcript, 'words') and transcript.words:
            for word_obj in transcript.words:
                word_start = word_obj.start / 1000
                word_end = word_obj.end / 1000
                word_text = word_obj.text
                
                # Group words into segments (roughly 10 words per segment)
                if not segments or len(segments[-1]["text"].split()) >= 10:
                    segments.append({
                        "start": word_start,
                        "end": word_end,
                        "text": word_text
                    })
                else:
                    segments[-1]["end"] = word_end
                    segments[-1]["text"] += " " + word_text
        
        original_text = transcript.text
        
        # Translate to Kurdish Central (Sorani) using deep-translator
        print(f"Translating to Kurdish...", file=sys.stderr)
        translator = GoogleTranslator(source='auto', target='ckb')
        kurdish_text = translator.translate(original_text)
        
        print(f"Original text length: {len(original_text)} characters", file=sys.stderr)
        print(f"Kurdish translation length: {len(kurdish_text)} characters", file=sys.stderr)
        
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
        print(f"Generating Kurdish TTS audio...", file=sys.stderr)
        kurdish_tts_api_key = os.environ.get("KURDISH_TTS_API_KEY")
        if not kurdish_tts_api_key:
            raise Exception("KURDISH_TTS_API_KEY environment variable not set")
        
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
        print(f"Text length for TTS: {len(kurdish_text)} characters", file=sys.stderr)
        
        r = requests.post(url, headers=headers, data=json.dumps(tts_data), timeout=30)
        
        print(f"Kurdish TTS API response: {r.status_code}", file=sys.stderr)
        if r.status_code != 200:
            print(f"TTS API error response: {r.text[:500]}", file=sys.stderr)
            raise Exception(f"TTS API error: {r.status_code} - {r.text[:200]}")
        
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
