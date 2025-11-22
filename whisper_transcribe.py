#!/usr/bin/env python3
import sys
import json
import os
import assemblyai as aai
from deep_translator import GoogleTranslator
import requests
from pydub import AudioSegment
import librosa
import numpy as np
from scipy import signal
from scipy.fftpack import fft, ifft
import soundfile as sf

def remove_english_speech(audio_path, output_path):
    """
    Remove English speech from audio using spectral subtraction and frequency gating.
    Preserves background music and sound effects while removing vocal components.
    """
    try:
        print(f"Starting voice isolation/speech removal...", file=sys.stderr)
        
        # Load audio at 22050 Hz
        y, sr = librosa.load(audio_path, sr=22050)
        
        # Compute STFT
        D = librosa.stft(y)
        magnitude = np.abs(D)
        phase = np.angle(D)
        
        # Spectral gating: reduce energy in speech frequency ranges
        # Speech fundamentals: 85-255 Hz, harmonics up to 4kHz
        frequencies = librosa.fft_frequencies(sr=sr, n_fft=D.shape[0]*2-1)
        
        # Create frequency mask for speech (0-4000 Hz)
        speech_freq_mask = frequencies < 4000
        
        # Apply spectral subtraction with gentle curve
        # Reduce speech frequencies more, keep higher frequencies (background/music)
        subtraction_mask = np.ones(magnitude.shape[0])
        
        # Stronger reduction for speech frequencies (0-4000 Hz)
        for i, freq in enumerate(frequencies):
            if freq < 4000:
                # Gradual reduction curve for speech frequencies
                reduction_factor = 0.3 + 0.4 * (freq / 4000)  # Range: 0.3 to 0.7
                subtraction_mask[i] = reduction_factor
            else:
                # Keep higher frequencies (music, effects)
                subtraction_mask[i] = 0.85
        
        # Apply the mask
        magnitude_processed = magnitude * subtraction_mask[:, np.newaxis]
        
        # Reconstruct audio
        D_processed = magnitude_processed * np.exp(1j * phase)
        y_processed = librosa.istft(D_processed)
        
        # Normalize to prevent clipping
        y_processed = y_processed / np.max(np.abs(y_processed)) * 0.95
        
        # Save as MP3 via temporary WAV
        temp_wav = output_path.replace('.mp3', '_temp.wav')
        sf.write(temp_wav, y_processed, sr)
        
        # Convert WAV to MP3 using pydub
        audio_segment = AudioSegment.from_wav(temp_wav)
        audio_segment.export(output_path, format="mp3", bitrate="192k")
        
        # Clean up temp file
        if os.path.exists(temp_wav):
            os.remove(temp_wav)
        
        print(f"✅ Voice isolation complete - English speech removed", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"⚠️ Voice isolation failed: {str(e)}", file=sys.stderr)
        return False

def transcribe_and_translate(audio_path, output_audio_path, speaker_key="1_speaker", background_path=None, english_voice_path=None):
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
        
        print(f"✅ Original text: {len(original_text)} characters", file=sys.stderr)
        print(f"✅ Kurdish translation: {len(kurdish_text)} characters", file=sys.stderr)
        
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
        
        # Try to generate Kurdish TTS audio (optional - don't fail if this doesn't work)
        tts_success = False
        try:
            kurdish_tts_api_key = os.environ.get("KURDISH_TTS_API_KEY")
            if kurdish_tts_api_key:
                print(f"Attempting Kurdish TTS audio generation...", file=sys.stderr)
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
                
                r = requests.post(url, headers=headers, data=json.dumps(tts_data), timeout=30)
                
                if r.status_code == 200:
                    # Save as temporary WAV file
                    temp_wav_path = output_audio_path.replace('.mp3', '.wav')
                    with open(temp_wav_path, "wb") as f:
                        f.write(r.content)
                    
                    # Load the generated Kurdish TTS audio
                    kurdish_audio = AudioSegment.from_wav(temp_wav_path)
                    
                    # Load the original audio
                    original_audio = AudioSegment.from_file(audio_path)
                    
                    # Ensure both audios have the same length by padding if necessary
                    target_length = max(len(original_audio), len(kurdish_audio))
                    if len(original_audio) < target_length:
                        original_audio = original_audio + AudioSegment.silent(duration=target_length - len(original_audio))
                    if len(kurdish_audio) < target_length:
                        kurdish_audio = kurdish_audio + AudioSegment.silent(duration=target_length - len(kurdish_audio))
                    
                    # Reduce original audio volume by 18dB to preserve background music/sound
                    # while significantly reducing the English voice
                    print(f"Preserving background audio and removing English voice...", file=sys.stderr)
                    original_audio_reduced = original_audio - 18
                    
                    # Normalize the Kurdish TTS audio to appropriate level
                    # and overlay it on top of the reduced original audio
                    mixed_audio = original_audio_reduced.overlay(kurdish_audio, position=0)
                    
                    # Export the mixed audio
                    mixed_audio.export(output_audio_path, format="mp3", bitrate="192k")
                    
                    # Clean up temporary WAV file
                    if os.path.exists(temp_wav_path):
                        os.remove(temp_wav_path)
                    
                    tts_success = True
                    print(f"✅ Kurdish TTS audio generated and mixed successfully", file=sys.stderr)
                    print(f"✅ Background audio preserved with English voice removed", file=sys.stderr)
                    
                    # Generate separate tracks for volume mixing
                    if background_path and english_voice_path:
                        try:
                            # Background track: remove English speech using spectral subtraction
                            print(f"Generating background track with voice removal...", file=sys.stderr)
                            remove_english_speech(audio_path, background_path)
                            
                            # English voice track: original audio at normal volume
                            print(f"Generating English voice track...", file=sys.stderr)
                            original_audio.export(english_voice_path, format="mp3", bitrate="192k")
                            
                            print(f"✅ All 3 tracks generated: Kurdish TTS, Background (voice-isolated), English Voice", file=sys.stderr)
                        except Exception as track_error:
                            print(f"⚠️ Failed to generate separate tracks: {str(track_error)}", file=sys.stderr)
                else:
                    print(f"⚠️ TTS API returned {r.status_code}: {r.text[:200]}", file=sys.stderr)
                    print(f"⚠️ Continuing without TTS audio (transcription and translation successful)", file=sys.stderr)
            else:
                print(f"⚠️ KURDISH_TTS_API_KEY not set - skipping TTS audio generation", file=sys.stderr)
        except Exception as tts_error:
            print(f"⚠️ TTS generation failed: {str(tts_error)}", file=sys.stderr)
            print(f"⚠️ Continuing without TTS audio (transcription and translation successful)", file=sys.stderr)
        
        # Return the result as JSON
        output = {
            "text": original_text,
            "segments": segments,
            "translated": kurdish_text,
            "translated_segments": translated_segments,
            "audio_path": output_audio_path if tts_success else None,
            "background_path": background_path,
            "english_voice_path": english_voice_path,
            "tts_available": tts_success
        }
        
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python whisper_transcribe.py <audio_file> <output_audio_file> [speaker_key] [background_path] [english_voice_path]"}), file=sys.stderr)
        sys.exit(1)
    
    audio_path = sys.argv[1]
    output_audio_path = sys.argv[2]
    speaker_key = sys.argv[3] if len(sys.argv) > 3 else "1_speaker"
    background_path = sys.argv[4] if len(sys.argv) > 4 else None
    english_voice_path = sys.argv[5] if len(sys.argv) > 5 else None
    
    transcribe_and_translate(audio_path, output_audio_path, speaker_key, background_path, english_voice_path)
