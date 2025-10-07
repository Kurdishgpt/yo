#!/usr/bin/env python3
import sys
import json
import os
import whisper
from deep_translator import GoogleTranslator
import requests
from pydub import AudioSegment
import tempfile
import shutil
from pathlib import Path

def separate_audio(audio_path, output_dir):
    """Separate audio into vocals and accompaniment using Demucs"""
    try:
        import subprocess
        import torch
        
        # Determine device (CPU or CUDA)
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        device_msg = 'GPU' if device == 'cuda' else 'CPU (slower)'
        
        print(f"🎵 Separating vocals from background music using {device_msg}...", file=sys.stderr)
        
        # Run Demucs to separate audio
        # -n htdemucs: Use the default Hybrid Transformer Demucs model
        # --two-stems vocals: Only separate vocals and accompaniment (faster)
        # -d cpu/cuda: Specify device
        result = subprocess.run(
            ['python', '-m', 'demucs', '-n', 'htdemucs', '--two-stems=vocals', '-d', device, audio_path, '-o', output_dir],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"⚠️ Demucs separation failed: {result.stderr[:200]}", file=sys.stderr)
            return None, None
        
        # Find the output files
        audio_name = Path(audio_path).stem
        model_output_dir = Path(output_dir) / 'htdemucs' / audio_name
        
        vocals_path = model_output_dir / 'vocals.wav'
        no_vocals_path = model_output_dir / 'no_vocals.wav'
        
        if vocals_path.exists() and no_vocals_path.exists():
            print(f"✅ Audio separated successfully", file=sys.stderr)
            return str(vocals_path), str(no_vocals_path)
        else:
            print(f"⚠️ Separated files not found", file=sys.stderr)
            return None, None
            
    except Exception as e:
        print(f"⚠️ Audio separation error: {str(e)}", file=sys.stderr)
        return None, None

def transcribe_and_translate(audio_path, output_audio_path, speaker_key="1_speaker"):
    temp_dir = None
    try:
        # Create temporary directory for audio separation
        temp_dir = tempfile.mkdtemp()
        vocals_path = None
        background_path = None
        
        # Separate audio into vocals and background music
        vocals_path, background_path = separate_audio(audio_path, temp_dir)
        
        # Use vocals for transcription if separation succeeded, otherwise use original
        transcription_audio = vocals_path if vocals_path else audio_path
        
        # Load the Whisper model (base model for faster processing)
        model = whisper.load_model("base")
        
        # Transcribe the audio with auto-detected language
        result = model.transcribe(transcription_audio, verbose=False)
        
        # Detect the source language
        detected_language = result.get("language", "en")
        if isinstance(detected_language, str):
            print(f"Detected language: {detected_language.title()}", file=sys.stderr)
        else:
            print(f"Detected language: {detected_language}", file=sys.stderr)
        
        # Format the segments for SRT generation
        segments = []
        if "segments" in result and isinstance(result["segments"], list):
            for seg in result["segments"]:
                if isinstance(seg, dict):
                    segments.append({
                        "start": seg.get("start", 0),
                        "end": seg.get("end", 0),
                        "text": seg.get("text", "").strip()
                    })
        
        original_text = result.get("text", "")
        if not isinstance(original_text, str):
            original_text = str(original_text)
        
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
        api_key = os.environ.get("KURDISH_TTS_API_KEY")
        url = "https://www.kurdishtts.com/api/tts-proxy"
        
        tts_data = {
            "text": kurdish_text,
            "language": "sorani",
            "speaker_key": speaker_key
        }
        
        headers = {
            "x-api-key": api_key,
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
            
            # Load Kurdish TTS audio
            kurdish_audio = AudioSegment.from_wav(temp_wav_path)
            
            # Mix with background music if separation succeeded
            if background_path and os.path.exists(background_path):
                print(f"🎶 Mixing Kurdish dubbing with background music...", file=sys.stderr)
                background_audio = AudioSegment.from_wav(background_path)
                
                # Ensure Kurdish audio matches background length
                if len(kurdish_audio) < len(background_audio):
                    # Pad Kurdish audio with silence
                    silence = AudioSegment.silent(duration=len(background_audio) - len(kurdish_audio))
                    kurdish_audio = kurdish_audio + silence
                elif len(kurdish_audio) > len(background_audio):
                    # Trim Kurdish audio
                    kurdish_audio = kurdish_audio[:len(background_audio)]
                
                # Mix: Kurdish vocals + background music
                mixed_audio = kurdish_audio.overlay(background_audio)
                mixed_audio.export(output_audio_path, format="mp3")
                print(f"✅ Kurdish dubbing mixed with background music successfully", file=sys.stderr)
            else:
                # No background separation, just export Kurdish TTS
                kurdish_audio.export(output_audio_path, format="mp3")
                print(f"✅ Kurdish audio generated successfully", file=sys.stderr)
            
            # Clean up temporary WAV file
            if os.path.exists(temp_wav_path):
                os.remove(temp_wav_path)
        else:
            print(f"⚠️ TTS API error: {r.status_code} - Copying original audio instead", file=sys.stderr)
            shutil.copy2(audio_path, output_audio_path)
        
        # Clean up temporary directory
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        
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
        # Clean up temporary directory on error
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
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
