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

async function transcribeWithWhisper(audioPath: string): Promise<{ text: string; segments: any[] }> {
  try {
    const { stdout } = await execPromise(`python whisper_transcribe.py "${audioPath}"`);
    return JSON.parse(stdout);
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

      const isVideo = req.file.mimetype.startsWith("video/");
      if (isVideo) {
        await extractAudio(uploadedFilePath, audioPath);
      } else {
        fs.copyFileSync(uploadedFilePath, audioPath);
      }

      const transcription = await transcribeWithWhisper(audioPath);

      const srtContent = generateSRT(
        transcription.segments.map((seg: any) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        }))
      );

      fs.unlinkSync(uploadedFilePath);
      if (isVideo || uploadedFilePath !== audioPath) {
        fs.unlinkSync(audioPath);
      }

      res.json({
        transcription: transcription.text,
        srt: srtContent,
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
