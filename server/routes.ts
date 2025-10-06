import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";
import ffmpeg from "fluent-ffmpeg";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const execPromise = promisify(exec);

const upload = multer({
  dest: "uploads/",
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

async function transcribeWithWhisper(audioPath: string, outputAudioPath: string): Promise<{ text: string; segments: any[]; translated: string; audio_path: string }> {
  try {
    const { stdout, stderr } = await execPromise(`python whisper_transcribe.py "${audioPath}" "${outputAudioPath}"`);
    
    // Log stderr to see TTS API errors and other diagnostic info
    if (stderr) {
      console.log("Whisper stderr:", stderr);
    }
    
    // The JSON output should be on the last line of stdout
    const lines = stdout.trim().split('\n');
    const jsonLine = lines[lines.length - 1];
    
    return JSON.parse(jsonLine);
  } catch (error: any) {
    console.error("Whisper transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
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
  await mkdir("uploads", { recursive: true });
  await mkdir("outputs", { recursive: true });

  app.use("/outputs", express.static("outputs"));

  app.post("/api/upload", upload.single("media"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadedFilePath = req.file.path;
      const audioPath = path.join("uploads", `audio-${Date.now()}.mp3`);
      const outputAudioPath = path.join("outputs", `kurdish-${Date.now()}.mp3`);
      const timestamp = Date.now();

      const isVideo = req.file.mimetype.startsWith("video/");
      
      // Save the original media to outputs folder for viewing
      let originalMediaPath = uploadedFilePath;
      if (isVideo) {
        const videoOutputPath = path.join("outputs", `original-video-${timestamp}.mp4`);
        fs.copyFileSync(uploadedFilePath, videoOutputPath);
        originalMediaPath = videoOutputPath;
        await extractAudio(uploadedFilePath, audioPath);
      } else {
        const audioOutputPath = path.join("outputs", `original-audio-${timestamp}.mp3`);
        fs.copyFileSync(uploadedFilePath, audioOutputPath);
        originalMediaPath = audioOutputPath;
        fs.copyFileSync(uploadedFilePath, audioPath);
      }

      const result = await transcribeWithWhisper(audioPath, outputAudioPath);

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
