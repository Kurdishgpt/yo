import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { spawn } from "child_process";
import ffmpeg from "fluent-ffmpeg";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const upload = multer({
  dest: process.env.VERCEL ? "/tmp/uploads" : "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

async function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat("mp3")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

async function transcribeWithWhisper(audioPath: string, outputAudioPath: string, backgroundPath: string, englishVoicePath: string, speaker: string = "1_speaker"): Promise<{ text: string; segments: any[]; translated: string; audio_path: string; background_path?: string; english_voice_path?: string }> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', ['whisper_transcribe.py', audioPath, outputAudioPath, speaker, backgroundPath, englishVoicePath], {
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (stderr) {
        console.log("Whisper stderr:", stderr);
      }

      if (code !== 0) {
        console.error("Whisper transcription error:", stderr);
        reject(new Error("Failed to transcribe audio"));
        return;
      }

      try {
        // The JSON output should be on the last line of stdout
        const lines = stdout.trim().split('\n');
        const jsonLine = lines[lines.length - 1];
        resolve(JSON.parse(jsonLine));
      } catch (error: any) {
        console.error("Failed to parse Whisper output:", error);
        reject(new Error("Failed to parse transcription result"));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error("Failed to start Python process:", error);
      reject(new Error("Failed to start transcription"));
    });
  });
}

function generateSRT(segments: any[]): string {
  let srt = "";
  segments.forEach((segment, index) => {
    const startTime = formatSRTTime(segment.start);
    const endTime = formatSRTTime(segment.end);
    srt += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
  });
  return srt;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const uploadsDir = process.env.VERCEL ? "/tmp/uploads" : "uploads";
  const outputsDir = process.env.VERCEL ? "/tmp/outputs" : "outputs";
  
  await mkdir(uploadsDir, { recursive: true });
  await mkdir(outputsDir, { recursive: true });

  app.use("/outputs", express.static(outputsDir));

  app.post("/api/upload", upload.single("media"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadedFilePath = req.file.path;
      const audioPath = path.join(uploadsDir, `audio-${Date.now()}.mp3`);
      const timestamp = Date.now();
      const speaker = req.body.speaker || "1_speaker";
      
      // Generate paths for 3 separate audio tracks
      const outputAudioPath = path.join(outputsDir, `kurdish-dubbed-${timestamp}.mp3`);
      const backgroundAudioPath = path.join(outputsDir, `background-${timestamp}.mp3`);
      const englishVoiceAudioPath = path.join(outputsDir, `english-voice-${timestamp}.mp3`);

      const isVideo = req.file.mimetype.startsWith("video/");
      
      // Save the original media to outputs folder for viewing
      let originalMediaPath = uploadedFilePath;
      if (isVideo) {
        const videoOutputPath = path.join(outputsDir, `original-video-${timestamp}.mp4`);
        fs.copyFileSync(uploadedFilePath, videoOutputPath);
        originalMediaPath = videoOutputPath;
        await extractAudio(uploadedFilePath, audioPath);
      } else {
        const audioOutputPath = path.join(outputsDir, `original-audio-${timestamp}.mp3`);
        fs.copyFileSync(uploadedFilePath, audioOutputPath);
        originalMediaPath = audioOutputPath;
        fs.copyFileSync(uploadedFilePath, audioPath);
      }

      const result = await transcribeWithWhisper(audioPath, outputAudioPath, backgroundAudioPath, englishVoiceAudioPath, speaker);

      const srtContent = generateSRT(
        result.segments.map((seg: any) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        }))
      );

      // Clean up temporary files
      fs.unlinkSync(uploadedFilePath);
      if (fs.existsSync(audioPath) && audioPath !== originalMediaPath) {
        fs.unlinkSync(audioPath);
      }

      res.json({
        transcription: result.text,
        translated: result.translated,
        srt: srtContent,
        tts: `/${outputAudioPath.replace(/\\/g, "/")}`,
        background: `/${backgroundAudioPath.replace(/\\/g, "/")}`,
        englishVoice: `/${englishVoiceAudioPath.replace(/\\/g, "/")}`,
        originalMedia: `/${originalMediaPath.replace(/\\/g, "/")}`,
        isVideo: isVideo,
      });
    } catch (error: any) {
      console.error("Upload processing error:", error);
      res.status(500).json({
        error: error.message || "Failed to process media file",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
